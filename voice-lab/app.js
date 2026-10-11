/* Lewis Voice Lab - production-only, in-browser voice DSP.
 * Time/pitch/formant DSP is in engine-worker.js. EQ, dynamics, space, and
 * playback are implemented with native Web Audio nodes. No server processing.
 */
'use strict';

const RATE = 24000;
const MAX_UPLOAD_MB = 22;
const SAMPLE_ROOT = 'https://raw.githubusercontent.com/udeudeude/Th-die-s-Cast/';
const SOURCES = {
  'berengar-reference': {
    label: 'Lewis · Brother Berengar passage',
    url: SAMPLE_ROOT + 'lewis-depth-auditions/auditions/lewis-depth/01-natural.mp3',
  },
  'berengar-intro': {
    label: 'Lewis · Brother Berengar audition',
    url: SAMPLE_ROOT + 'brother-name-auditions-02/auditions/brother-names-02/08-berengar.mp3',
  },
  'godric-intro': {
    label: 'Lewis · Brother Godric audition',
    url: SAMPLE_ROOT + 'brother-name-auditions/auditions/brother-names/01-Brother-Godric.mp3',
  },
  'rubicon-intro': {
    label: 'Lewis · Brother Rubicon audition',
    url: SAMPLE_ROOT + 'brother-name-auditions-02/auditions/brother-names-02/01-rubicon.mp3',
  },
};
const DEFAULTS = Object.freeze({
  pitch: 0, formant: 0, speed: 1,
  bass: 0, presence: 0, air: 0, highpass: 70,
  compression: 1, threshold: -22,
  reverb: 0, echo: 0, echoTime: 240, output: 0,
});
const PRESETS = {
  natural: {...DEFAULTS},
  elder: {...DEFAULTS, pitch: -1.5, formant: -1.15, speed: .88, bass: 1.5, presence: -1, compression: 1.8},
  fireside: {...DEFAULTS, pitch: -.75, formant: -.6, speed: .92, bass: 2.5, presence: 1.5, compression: 2.2, threshold: -24, reverb: 9},
  abbey: {...DEFAULTS, pitch: -1, formant: -1.4, speed: .89, bass: 1.5, air: -1, reverb: 35, echo: 6, echoTime: 320},
  oracular: {...DEFAULTS, pitch: -2.25, formant: -.35, speed: .86, presence: 1.7, reverb: 19, echo: 17, echoTime: 410},
};
const VOICE_KEYS = ['pitch','formant','speed'];
const EFFECT_KEYS = Object.keys(DEFAULTS).filter(key => !VOICE_KEYS.includes(key));
const ALL_KEYS = [...VOICE_KEYS,...EFFECT_KEYS];
const $ = id => document.getElementById(id);
const canvas = $('wave');
const ctx2d = canvas.getContext('2d');

let settings = {...DEFAULTS};
let originalDecoded = null;
let originalName = SOURCES['berengar-reference'].label;
let rawPcm = null;
let rawBuffer = null;
let processedBuffer = null;
let audioCtx = null;
let graph = null;
let worker = null;
let workerReady = false;
let taskRunning = false;
let taskQueued = false;
let taskId = 0;
let pendingSignature = "";
let framePending = false;
let isPlaying = false;
let isLooping = true;
let abSide = 'A';
let sourceNode = null;
let startClock = 0;
let pauseAt = 0;
let busyLoading = false;
let clipGeneration = 0;
let pendingError = false;
let loadSerial = 0;
let renderedSignature = '';

function formatSeconds(t) {
  if (!Number.isFinite(t)) return '0:00';
  const n = Math.max(0,Math.floor(t));
  return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
}
function setStatus(message,kind='') {
  const node=$('loadStatus'); node.textContent=message; node.className='live-status '+kind;
}
function setMessage(message,isError=false) {
  const node=$('renderStatus'); node.textContent=message; node.classList.toggle('error',isError);
}
function updateValue(key) {
  const node=$(key); if(!node) return;
  const box=node.closest('.control'); const out=box?.querySelector('output');
  if(!out) return;
  const value=Number(node.value);
  let content='';
  if(key==='pitch'||key==='formant') content=`${value>0?'+':''}${Number(value.toFixed(2))} st`;
  else if(key==='speed') content=`${value.toFixed(2)}×`;
  else if(key==='highpass') content=`${value} Hz`;
  else if(key==='echoTime') content=`${value} ms`;
  else if(key==='reverb'||key==='echo') content=`${value}%`;
  else if(key==='compression') content=`${value.toFixed(2)}:1`;
  else if(key==='threshold'||key==='output'||key==='bass'||key==='presence'||key==='air') content=`${value>0?'+':''}${value} dB`;
  out.textContent=content;
}
function syncSliders() {
  for(const key of ALL_KEYS){ $(key).value=settings[key]; updateValue(key); }
}
function keepPresetHighlight(id) {
  document.querySelectorAll('[data-preset]').forEach(el=>el.classList.toggle('selected',el.dataset.preset===id));
}
function voiceSignature() {
  return VOICE_KEYS.map(k=>Number(settings[k]).toFixed(3)).join(':')+':'+clipGeneration;
}
function getChosenBuffer() {return (abSide==='A'||!processedBuffer)?rawBuffer:processedBuffer;}
function toAudioBuffer(pcm) {
  if(!pcm)return null;
  const context=audioCtx || new OfflineAudioContext(1,Math.max(1,pcm.length),RATE);
  const b=context.createBuffer(1,Math.max(1,pcm.length),RATE);
  b.getChannelData(0).set(pcm);
  return b;
}
function fromBuffer(buffer) {return buffer ? buffer.getChannelData(0).slice() : null;}

/* Native Web Audio processors remain connected even when silent, making tone
   and room sliders instant, separate from the off-main-thread voice resynthesis. */
function createImpulse(ctx) {
  const len=Math.floor(ctx.sampleRate*1.4);
  const buffer=ctx.createBuffer(1,len,ctx.sampleRate);
  const samples=buffer.getChannelData(0);
  let seed=125813;
  for(let i=0;i<len;i++) {
    seed=(1664525*seed+1013904223)>>>0;
    const white=(seed/4294967296)*2-1;
    const t=i/ctx.sampleRate;
    samples[i]=white*Math.exp(-5.5*t)*(t<.025?0.27:0.17);
  }
  return buffer;
}
function buildGraph(ctx,destination,isOffline=false) {
  const root=ctx.createGain();
  const original=ctx.createGain(); const effected=ctx.createGain();
  const highpass=ctx.createBiquadFilter();highpass.type='highpass';
  const bass=ctx.createBiquadFilter();bass.type='lowshelf';bass.frequency.value=180;
  const presence=ctx.createBiquadFilter();presence.type='peaking';presence.frequency.value=2400;presence.Q.value=.82;
  const air=ctx.createBiquadFilter();air.type='highshelf';air.frequency.value=5600;
  const comp=ctx.createDynamicsCompressor(); comp.knee.value=14;comp.attack.value=.014;comp.release.value=.17;
  const dry=ctx.createGain(), wet=ctx.createGain(), convolver=ctx.createConvolver();
  const delay=ctx.createDelay(.8), echoGain=ctx.createGain(), feedback=ctx.createGain();
  const master=ctx.createGain();
  root.connect(original).connect(master);
  root.connect(effected).connect(highpass).connect(bass).connect(presence).connect(air).connect(comp);
  comp.connect(dry).connect(master);
  convolver.buffer=createImpulse(ctx);
  comp.connect(convolver).connect(wet).connect(master);
  comp.connect(delay).connect(echoGain).connect(master);
  delay.connect(feedback).connect(delay);
  master.connect(destination);
  const nodes={root,original,effected,highpass,bass,presence,air,comp,dry,wet,delay,echoGain,feedback,master};
  updateGraph(nodes,settings,abSide,isOffline);
  return nodes;
}
function updateGraph(nodes,s,side,isOffline=false) {
  if(!nodes)return;
  const t=nodes.master.context?.currentTime||0;
  const smooth=(p,value)=>{if(p.setTargetAtTime&&!isOffline)p.setTargetAtTime(value,t,.016);else p.value=value;};
  smooth(nodes.original.gain,side==='A'?1:0);
  smooth(nodes.effected.gain,side==='B'?1:0);
  smooth(nodes.highpass.frequency,s.highpass);
  smooth(nodes.bass.gain,s.bass);
  smooth(nodes.presence.gain,s.presence);
  smooth(nodes.air.gain,s.air);
  smooth(nodes.comp.threshold,s.threshold);
  smooth(nodes.comp.ratio,s.compression);
  smooth(nodes.dry.gain,1);
  smooth(nodes.wet.gain,s.reverb/100);
  smooth(nodes.echoGain.gain,s.echo/100);
  smooth(nodes.delay.delayTime,s.echoTime/1000);
  smooth(nodes.feedback.gain,s.echo>0?.16:0);
  smooth(nodes.master.gain,Math.pow(10,s.output/20));
}
function ensureAudio() {
  if(audioCtx)return audioCtx;
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(!AudioContextClass)throw new Error('This browser does not support Web Audio. Try Safari or Chrome.');
  audioCtx=new AudioContextClass();
  graph=buildGraph(audioCtx,audioCtx.destination);
  if(rawPcm)rawBuffer=toAudioBuffer(rawPcm);
  return audioCtx;
}
function stopSource() {
  if(!sourceNode)return;
  const old=sourceNode;sourceNode=null;
  try{old.onended=null;old.stop()}catch{}
  try{old.disconnect()}catch{}
}
function currentPosition() {
  if(isPlaying&&audioCtx)return Math.max(0,audioCtx.currentTime-startClock);
  return pauseAt;
}
function currentDuration(){return getChosenBuffer()?.duration||0;}
function syncTransport() {
  const len=currentDuration();
  const absolute=currentPosition();
  const pos=len&&(isLooping&&isPlaying)?absolute%len:Math.min(absolute,len);
  $('seek').value=len?Math.round(1000*pos/len):0;
  $('timeDisplay').textContent=`${formatSeconds(pos)} / ${formatSeconds(len)}`;
  $('playBtn').textContent=isPlaying?'Ⅱ Pause':'▶ Play';
}
function scheduleAnimation() {
  if(framePending)return;
  framePending=true;
  requestAnimationFrame(function animationTick(){
    framePending=false;
    syncTransport();drawWave();
    if(isPlaying)scheduleAnimation();
  });
}
async function playAt(position) {
  if(!rawBuffer)throw new Error('Load an audio sample first.');
  const ctx=ensureAudio();await ctx.resume();
  stopSource();
  const buffer=getChosenBuffer();
  const source=ctx.createBufferSource();source.buffer=buffer;source.loop=isLooping;
  source.connect(graph.root);
  const pos=Math.max(0,Math.min(position,Math.max(0,buffer.duration-.01)));
  pauseAt=pos;startClock=ctx.currentTime-pos;
  source.onended=()=>{
    if(sourceNode!==source)return;
    sourceNode=null;
    if(isLooping)return;
    isPlaying=false;pauseAt=0;syncTransport();drawWave();
  };
  source.start(0,pos);sourceNode=source;
  isPlaying=true;updateGraph(graph,settings,abSide);
  scheduleAnimation();
}
function pause(){ if(!isPlaying)return;pauseAt=currentPosition()%Math.max(.01,currentDuration());stopSource();isPlaying=false;syncTransport();drawWave(); }
async function togglePlay(){try{if(isPlaying)pause();else await playAt(pauseAt);}catch(e){setMessage(e.message,true)}}
async function switchSide(side){
  if(abSide===side)return;
  const prior=currentDuration(),pos=currentPosition();
  const fraction=prior?Math.min(1,pos/prior):0;
  const running=isPlaying;
  if(running)pause();
  abSide=side;
  $('btnA').classList.toggle('active',side==='A');$('btnB').classList.toggle('active',side==='B');
  $('btnA').setAttribute('aria-pressed',String(side==='A'));
  $('btnB').setAttribute('aria-pressed',String(side==='B'));
  if(graph)updateGraph(graph,settings,abSide);
  pauseAt=fraction*currentDuration();syncTransport();drawWave();
  if(running)await playAt(pauseAt);
}

function workerLoad(pcm){
  if(!worker){
    worker=new Worker('./engine-worker.js');
    worker.onmessage=receiveWorker;
    worker.onerror=e=>{setMessage(`Voice DSP worker error: ${e.message}`,true);taskRunning=false;};
  }
  workerReady=false;
  pendingSignature='';
  taskRunning=false;
  taskQueued=false;
  clipGeneration++;
  const transfer = pcm.slice();
  worker.postMessage({type:'load',sampleRate:RATE,samples:transfer.buffer},[transfer.buffer]);
  // Transfer only the worker copy. The player keeps its own source PCM.
}
function requestVoiceRender(){
  if(!rawPcm)return;
  if(!workerReady){taskQueued=true;return;}
  if(taskRunning){taskQueued=true;return;}
  const sig=voiceSignature();
  if(sig===renderedSignature && processedBuffer)return;
  taskRunning=true;taskQueued=false;
  const id=++taskId;
  pendingSignature=sig;
  setMessage('Rendering your pitch, speed and formant settings…');
  $('applyVoice').disabled=true;
  worker.postMessage({type:'render',id,settings:{pitch:settings.pitch,formant:settings.formant,speed:settings.speed}});
}
function receiveWorker(event){
  const message=event.data;
  if(message.type==='loaded'){
    workerReady=true;
    requestVoiceRender();return;
  }
  if(message.type==='error'){
    taskRunning=false;
    setMessage('Voice processing error: '+message.message,true);
    $('applyVoice').disabled=false;
    return;
  }
  if(message.type==='rendered'){
    taskRunning=false;
    if(taskQueued || pendingSignature!==voiceSignature()) {requestVoiceRender();return;}
    try {
      const current=getChosenBuffer()?.duration||1;
      const frac=Math.min(1,currentPosition()/current);
      const wasPlaying=isPlaying;
      if(wasPlaying&&abSide==='B')pause();
      const pcm=new Float32Array(message.buffer);
      if(!pcm.length)throw new Error('No processed audio returned.');
      const copy=toAudioBuffer(pcm);
      processedBuffer=copy;
      renderedSignature=pendingSignature;
      $('downloadWav').disabled=false;
      $('applyVoice').disabled=false;
      setMessage(`Voice ready (${(message.elapsedMs/1000).toFixed(1)} s render). Toggle A/B, or move the live EQ and room sliders.`);
      if(wasPlaying&&abSide==='B'){
        pauseAt=frac*copy.duration;
        playAt(pauseAt).catch(e=>setMessage(e.message,true));
      }else{syncTransport();drawWave();}
    }catch(e){setMessage('Could not play processed audio: '+e.message,true);$('applyVoice').disabled=false;}
  }
}

async function decodeOriginal(data,name){
  const decoder=new OfflineAudioContext(1,1,RATE);
  const decoded=await decoder.decodeAudioData(data.slice(0));
  if(!Number.isFinite(decoded.duration)||decoded.duration<=0)throw new Error('This file could not be decoded as audio.');
  originalDecoded=decoded;
  originalName=name;
  $('clipStart').max=Math.max(0,Math.floor(decoded.duration-1));
  const currentStart=Number($('clipStart').value)||0;
  if(currentStart>decoded.duration-1)$('clipStart').value=0;
  $('fileHelp').textContent=`${name} · ${formatSeconds(decoded.duration)} total. Each preview uses the excerpt you choose.`;
  await cropAndLoad();
}
async function cropAndLoad(){
  if(!originalDecoded)return;
  const clipStart=Math.max(0,Math.min(Number($('clipStart').value)||0,Math.max(0,originalDecoded.duration-.12)));
  const clipLength=Math.min(Number($('clipLength').value)||12,originalDecoded.duration-clipStart);
  if(clipLength<.2)throw new Error('Choose an excerpt with at least 0.2 seconds of audio.');
  const offline=new OfflineAudioContext(1,Math.max(1,Math.ceil(clipLength*RATE)),RATE);
  const source=offline.createBufferSource();source.buffer=originalDecoded;source.connect(offline.destination);
  source.start(0,clipStart,clipLength);
  const b=await offline.startRendering();
  const pcm=fromBuffer(b);
  const wasPlaying=isPlaying;if(wasPlaying)pause();
  rawPcm=pcm;
  rawBuffer=toAudioBuffer(pcm);processedBuffer=null;renderedSignature='';pauseAt=0;
  $('playBtn').disabled=false;$('restartBtn').disabled=false;$('applyVoice').disabled=true;$('downloadWav').disabled=true;
  workerLoad(pcm);syncTransport();drawWave();setStatus('Sample loaded','good');
}
async function loadSelected(){
  const choice=$('sampleSelect').value;
  if(choice==='upload'){$('upload').click();return;}
  const source=SOURCES[choice];if(!source)return;
  if(busyLoading)return;
  const serial=++loadSerial;
  busyLoading=true;setStatus('Downloading sample…');setMessage('Preparing audio for local editing.');
  try{
    const response=await fetch(source.url,{mode:'cors'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const file=await response.arrayBuffer();
    if(serial!==loadSerial)return;
    setStatus('Decoding sample…');
    await decodeOriginal(file,source.label);
  }catch(e){setStatus('Load error','error');setMessage(`Could not load the built-in sample. You can choose a local audio file instead. ${e.message}`,true);}
  finally{busyLoading=false;}
}
async function loadUploaded(file){
  if(!file)return;
  if(file.size>MAX_UPLOAD_MB*1024*1024){setMessage(`Please choose a short sample under ${MAX_UPLOAD_MB} MB. For long episodes, trim a 10–30 second segment first.`,true);return;}
  busyLoading=true;setStatus('Decoding local file…');
  try{await decodeOriginal(await file.arrayBuffer(),file.name);$('sampleSelect').value='upload';}
  catch(e){setStatus('Load error','error');setMessage('Unable to decode this file: '+e.message,true);}
  finally{busyLoading=false;}
}

/* Local WAV export through OfflineAudioContext to include live tone effects. */
function encodeWav(samples,rate){
  const bytes=44+samples.length*2;
  const array=new ArrayBuffer(bytes),view=new DataView(array);
  const str=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))};
  str(0,'RIFF');view.setUint32(4,bytes-8,true);str(8,'WAVE');
  str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
  view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
  view.setUint16(32,2,true);view.setUint16(34,16,true);
  str(36,'data');view.setUint32(40,samples.length*2,true);
  let peak=0;for(const s of samples)peak=Math.max(peak,Math.abs(s));
  const safety=peak>1?.99/peak:1;
  for(let i=0;i<samples.length;i++){
    const x=Math.max(-1,Math.min(1,samples[i]*safety));
    view.setInt16(44+i*2,Math.round(x<0?x*32768:x*32767),true);
  }
  return new Blob([array],{type:'audio/wav'});
}
async function exportWav(){
  if(!processedBuffer){setMessage('Apply voice changes before exporting.',true);return;}
  const button=$('downloadWav');button.disabled=true;button.textContent='Rendering WAV…';
  setMessage('Exporting current voice, EQ, compression and room settings to a local WAV…');
  try{
    const duration=processedBuffer.duration+Math.max(2.0,settings.echoTime/1000*2);
    const offline=new OfflineAudioContext(1,Math.ceil(duration*RATE),RATE);
    const nodes=buildGraph(offline,offline.destination,true);
    updateGraph(nodes,settings,'B',true);
    const input=offline.createBufferSource();
    input.buffer=processedBuffer;input.connect(nodes.root);input.start(0);
    const result=await offline.startRendering();
    const blob=encodeWav(result.getChannelData(0),RATE);
    const link=document.createElement('a');
    const url=URL.createObjectURL(blob);
    link.href=url;link.download='lewis-voice-lab-'+Date.now()+'.wav';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),45000);
    setMessage(`WAV ready: ${(blob.size/1024/1024).toFixed(2)} MB. On iPhone, save it using the Share menu if needed.`);
  }catch(e){setMessage('WAV export failed: '+e.message,true);}
  finally{button.disabled=false;button.textContent='↓ Download processed WAV';}
}

function drawWave(){
  if(!ctx2d)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const width=Math.max(100,canvas.clientWidth),height=94;
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  }
  ctx2d.setTransform(dpr,0,0,dpr,0,0);ctx2d.clearRect(0,0,width,height);
  ctx2d.fillStyle='#14202b';ctx2d.fillRect(0,0,width,height);
  const buff=getChosenBuffer();
  if(!buff){ctx2d.font='13px system-ui';ctx2d.fillStyle='#7c93a3';ctx2d.fillText('Load a sample to view its waveform',13,height/2);return;}
  const pcm=buff.getChannelData(0);const bins=Math.max(1,Math.floor(width/3));
  const step=Math.max(1,Math.ceil(pcm.length/bins));
  const half=height/2;
  ctx2d.strokeStyle='#d7b77c';ctx2d.lineWidth=2;
  ctx2d.beginPath();
  for(let i=0;i<bins;i++){
    const start=i*step,stop=Math.min(pcm.length,start+step);
    let peak=0;
    for(let j=start;j<stop;j+=Math.max(1,Math.floor(step/15)))peak=Math.max(peak,Math.abs(pcm[j]));
    const x=i*width/bins,y=Math.min(half-3,peak*(half-4)*1.4);
    ctx2d.moveTo(x,half-y);ctx2d.lineTo(x,half+y);
  }
  ctx2d.stroke();
  const duration=buff.duration,progress=duration?(currentPosition()%duration)/duration:0;
  ctx2d.fillStyle='#f4e3b2';ctx2d.fillRect(Math.floor(progress*width)-1,0,2,height);
}

function bindInputs(){
  syncSliders();
  for(const key of ALL_KEYS){
    $(key).addEventListener('input',()=>{
      settings[key]=Number($(key).value);
      updateValue(key);keepPresetHighlight('');
      if(!VOICE_KEYS.includes(key)&&graph)updateGraph(graph,settings,abSide);
      if(VOICE_KEYS.includes(key)){
        $('applyVoice').disabled=false;
        setMessage('Voice settings changed. Apply to audition pitch, formants and tempo.');
      }
    });
  }
  $('applyVoice').addEventListener('click',requestVoiceRender);
  $('sampleSelect').addEventListener('change',loadSelected);
  $('upload').addEventListener('change',e=>loadUploaded(e.target.files?.[0]));
  $('clipStart').addEventListener('change',()=>cropAndLoad().catch(e=>setMessage(e.message,true)));
  $('clipLength').addEventListener('change',()=>cropAndLoad().catch(e=>setMessage(e.message,true)));
  $('playBtn').addEventListener('click',togglePlay);
  $('restartBtn').addEventListener('click',()=>{
    if(isPlaying){pause();playAt(0).catch(e=>setMessage(e.message,true));}
    else {pauseAt=0;syncTransport();drawWave();}
  });
  $('loopBtn').addEventListener('click',()=>{
    isLooping=!isLooping;
    if(sourceNode)sourceNode.loop=isLooping;
    $('loopBtn').textContent=isLooping?'↻ Loop on':'↻ Loop off';
    $('loopBtn').setAttribute('aria-pressed',String(isLooping));
  });
  $('seek').addEventListener('change',()=>{
    const time=Number($('seek').value)/1000*currentDuration();
    if(isPlaying){pause();playAt(time).catch(e=>setMessage(e.message,true));}
    else{pauseAt=time;syncTransport();drawWave();}
  });
  $('btnA').addEventListener('click',()=>switchSide('A'));
  $('btnB').addEventListener('click',()=>switchSide('B'));
  $('resetVoice').addEventListener('click',()=>{
    for(const key of VOICE_KEYS)settings[key]=DEFAULTS[key];
    syncSliders();keepPresetHighlight('');requestVoiceRender();
  });
  $('resetEffects').addEventListener('click',()=>{
    for(const key of EFFECT_KEYS)settings[key]=DEFAULTS[key];
    syncSliders();if(graph)updateGraph(graph,settings,abSide);keepPresetHighlight('');
  });
  document.querySelectorAll('[data-preset]').forEach(el=>el.addEventListener('click',()=>{
    settings={...PRESETS[el.dataset.preset]};
    syncSliders();keepPresetHighlight(el.dataset.preset);
    if(graph)updateGraph(graph,settings,abSide);
    if(rawPcm)requestVoiceRender();
    else setMessage('Preset ready; load a sample to hear it.');
  }));
  $('downloadWav').addEventListener('click',exportWav);
  $('copyRecipe').addEventListener('click',async()=>{
    const data=JSON.stringify({name:'Lewis Voice Lab',version:1,settings},null,2);
    try{await navigator.clipboard.writeText(data);setMessage('Current recipe copied to clipboard.');}
    catch{setMessage('Clipboard access unavailable here. You can save a preset locally instead.',true);}
  });
  $('saveRecipe').addEventListener('click',()=>{
    try{localStorage.setItem('lewis-voice-lab-custom-v1',JSON.stringify(settings));setMessage('Current recipe saved in this browser.');}
    catch(e){setMessage('Local storage unavailable: '+e.message,true);}
  });
  $('loadRecipe').addEventListener('click',()=>{
    try{
      const raw=localStorage.getItem('lewis-voice-lab-custom-v1');
      if(!raw){setMessage('No custom recipe saved yet.',true);return;}
      const stored=JSON.parse(raw);
      for(const key of ALL_KEYS)if(Number.isFinite(stored[key]))settings[key]=stored[key];
      syncSliders();if(graph)updateGraph(graph,settings,abSide);
      keepPresetHighlight('');requestVoiceRender();setMessage('Saved recipe restored.');
    }catch(e){setMessage('Unable to restore preset: '+e.message,true);}
  });
  window.addEventListener('resize',drawWave);
  document.addEventListener('visibilitychange',()=>{
    // Mobile Safari may suspend audio when the app is backgrounded.
    if(document.hidden&&isPlaying)pause();
  });
}

bindInputs();
setStatus('Loading Lewis…');
loadSelected().then(()=>{if(rawPcm)setMessage('Lewis is ready. Press Play, or select a preset to change his voice.');});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
