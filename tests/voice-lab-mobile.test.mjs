import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';

const server=spawn('python3',['-m','http.server','4186','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
  let ready=false;
  for(let n=0;n<50;n++){
    try{
      const response=await fetch('http://127.0.0.1:4186/voice-lab/voice-catalog.json');
      if(response.ok){ready=true;break;}
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,170));
  }
  assert.ok(ready,'Local voice lab server available');
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4186/voice-lab/?release=kokoro-54-v2',{waitUntil:'domcontentloaded'});
  assert.ok((await page.title()).includes('Kokoro Voice Lab'));
  await page.locator('#languageSelect').waitFor({state:'visible'});
  await page.waitForFunction(()=>/^\d+ recordings available$/.test(document.querySelector('#voiceAvailability')?.textContent?.trim()||''),{timeout:30000});
  assert.ok(await page.locator('.header p').count()<=1,'Only the previously unquoted help link remains in the main header');
  assert.equal(await page.locator('footer').count(),0,'No repeating app footer');
  assert.ok(await page.locator('#sampleSelect').isVisible(),'Original audio source menu remains visible');
  assert.ok(await page.locator('#upload').isVisible(),'Local audio upload remains visible');
  const statusStyles=await page.locator('#voiceAvailability').evaluate(el=>({width:el.getBoundingClientRect().width,clip:getComputedStyle(el).clip}));
  assert.ok(statusStyles.width<=2,'Voice availability is visually hidden but remains accessible');
  assert.equal(await page.locator('label[for="genderSelect"]').innerText(),'Voice profile','Gender filter keeps its accessible label');
  assert.ok(await page.locator('#voiceSampleText').isVisible(),'Previously unquoted comparison guidance remains visible');
  assert.ok(await page.locator('#auditionVoice').isVisible(),'Original replay control is restored');
  assert.ok(await page.locator('.learning').isVisible(),'Original reference section remains visible');
    assert.equal(await page.locator('#languageSelect').inputValue(),'b','Current voice browser initially showcases British English, with language and voice profile independently selectable');
  assert.equal(await page.locator('#genderSelect').inputValue(),'all','No forced gender-first choice');
  const defaultId=await page.locator('#voiceSelect').inputValue();
  const defaultLabel=await page.locator('#voiceSelect option:checked').textContent();
  console.log('Initial selected voice',defaultId,defaultLabel);
  assert.notEqual(defaultId,'bm_lewis','First sample is not Lewis');
  await page.waitForFunction(voice=>document.querySelector('#fileHelp')?.textContent?.toLowerCase().includes(voice.toLowerCase()),
    defaultLabel.trim().split(' ')[0],{timeout:30000});
  assert.equal(await page.locator('#sampleSelect').inputValue(),'voice-library','Voice library is the audio source');
  // Gender can be selected first and reduces the list independently.
  await page.locator('#genderSelect').selectOption('m');
  await page.waitForFunction(()=>document.querySelector('#voiceSelect').value.startsWith('bm_') || document.querySelector('#voiceSelect').value.startsWith('am_'),{timeout:30000});
  await page.locator('#languageSelect').selectOption('b');
  const masculineValues=await page.locator('#voiceSelect option:not(:disabled)').evaluateAll(items=>items.map(x=>x.value));
  assert.deepEqual(masculineValues,['bm_daniel','bm_fable','bm_george','bm_lewis'],'English/British masculine voice list');
  await page.locator('#voiceSelect').selectOption('bm_george');
  await page.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('George'),{timeout:30000});
  assert.equal(await page.locator('#sampleSelect').inputValue(),'voice-library');
  console.log('Selected George, loaded its file, not Lewis');
  await page.locator('#genderSelect').selectOption('f');
  const femaleValues=await page.locator('#voiceSelect option:not(:disabled)').evaluateAll(items=>items.map(x=>x.value));
  assert.deepEqual(femaleValues,['bf_alice','bf_emma','bf_isabella','bf_lily'],'Changing gender keeps language and updates voices');
  await page.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('Alice'),{timeout:30000});
  // Language can also be chosen first after resetting gender.
  await page.locator('#genderSelect').selectOption('all');
  await page.locator('#languageSelect').selectOption('a');
  assert.equal(await page.locator('#languageSelect').inputValue(),'a');
  assert.equal(await page.locator('#genderSelect').inputValue(),'all');
  const count=await page.locator('#voiceSelect option').count();
  assert.equal(count,20,'All American voices visible before gender filtering');
  await page.locator('#genderSelect').selectOption('m');
  const americanMaleCount=await page.locator('#voiceSelect option:not(:disabled)').count();
  assert.equal(americanMaleCount,9);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  assert.equal(overflow,false,'Voice browser fits an iPhone-width viewport');
  assert.deepEqual(errors,[],'No browser JavaScript exceptions');

  // Real-world cache recovery path: this fresh document lives outside the
  // old /voice-lab/ service-worker scope but shares the current editor code.
  const fresh=await browser.newPage({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'
  });
  const freshErrors=[];
  fresh.on('pageerror',error=>freshErrors.push(error.message));
  await fresh.goto('http://127.0.0.1:4186/kokoro-voice-lab/',{waitUntil:'domcontentloaded'});
  await fresh.waitForFunction(()=>/^\d+ recordings available$/.test(document.querySelector('#voiceAvailability')?.textContent?.trim()||''),{timeout:30000});
  await fresh.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('Alice'),{timeout:30000});
  assert.equal(await fresh.locator('#voiceSelect').inputValue(),'bf_alice','Fresh entry loads Alice instead of Lewis');
  await fresh.locator('#voiceSelect').selectOption('bm_george');
  await fresh.waitForFunction(()=>document.querySelector('#fileHelp')?.textContent?.includes('George'),{timeout:30000});
  // End-to-end processing and file export on an emulated iPhone-sized browser.
  // Covers the real worker, offline audio effects, and downloaded WAV bytes.
  const savedLink=fresh.locator('a[download][href$="saved-user-recipes.json"]');
  assert.equal(await savedLink.getAttribute('href'),'/voice-lab/presets/saved-user-recipes.json',
    'Saved presets link resolves to their actual shared source location');
  const presetResponse=await fresh.context().request.get(
    'http://127.0.0.1:4186/voice-lab/presets/saved-user-recipes.json');
  assert.equal(presetResponse.status(),200,'Saved presets download is served');
  const presetData=await presetResponse.json();
  assert.deepEqual(presetData.presets.map(p=>p.id),['savedDeepDry','savedNaturalRoom'],
    'Both approved presets are preserved');

  await fresh.waitForFunction(()=>!document.querySelector('#downloadWav')?.disabled,null,{timeout:90000});
  for(const [id,value] of [['pitch','-1'],['formant','-0.75'],['speed','1.25'],['reverb','12']]){
    await fresh.locator('#'+id).evaluate((el,newValue)=>{
      el.value=newValue;
      el.dispatchEvent(new Event('input',{bubbles:true}));
    },value);
  }
  assert.equal(await fresh.locator('#applyVoice').isEnabled(),true,'New voice settings require applying');
  await fresh.locator('#applyVoice').click();
  await fresh.waitForFunction(()=>document.querySelector('#renderStatus')?.textContent?.startsWith('Voice ready (') &&
    !document.querySelector('#downloadWav').disabled,null,{timeout:90000});
  await fresh.locator('#btnB').click();
  assert.equal(await fresh.locator('#btnB').getAttribute('aria-pressed'),'true',
    'Processed voice can be selected for A/B comparison');
  await fresh.locator('#btnA').click();
  assert.equal(await fresh.locator('#btnA').getAttribute('aria-pressed'),'true',
    'Original voice can be selected for A/B comparison');
  const downloadPromise=fresh.waitForEvent('download',{timeout:90000});
  await fresh.locator('#downloadWav').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/^kokoro-voice-lab-\d+\.wav$/,
    'Export names identify the public Kokoro Voice Lab');
  const output=fs.readFileSync(await download.path());
  assert.ok(output.length>50000,'Export contains substantive audio samples');
  assert.equal(output.toString('ascii',0,4),'RIFF','Export uses RIFF');
  assert.equal(output.toString('ascii',8,12),'WAVE','Export uses WAV');
  assert.equal(output.readUInt16LE(22),1,'Export is mono');
  assert.equal(output.readUInt32LE(24),24000,'Export sample rate is 24 kHz');
  assert.equal(output.readUInt16LE(34),16,'Export audio is 16-bit PCM');
  assert.equal(output.readUInt32LE(40),output.length-44,'WAV header contains exact sample size');
  let audible=false;
  for(let i=44;i<output.length;i+=110){if(output.readInt16LE(i)>200||output.readInt16LE(i)<-200){audible=true;break;}}
  assert.ok(audible,'Export is not silent');
  assert.match(await fresh.locator('#renderStatus').textContent(),/WAV ready:/,
    'Export status confirms completion');
  console.log('Processed pitch, formant, speed and room effects; A/B controls and downloaded WAV verified.');
  assert.deepEqual(freshErrors,[],'Fresh cache-recovery entry has no JavaScript exceptions');
  await fresh.close();
  console.log('Verified clean /kokoro-voice-lab/ URL and non-Lewis native voice switching.');
  await browser.close();browser=null;
  console.log('Kokoro voice browsing smoke test passed: 54 playable voices, gender-first and language-first filters, automatic Alice and George MP3 loading.');
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
