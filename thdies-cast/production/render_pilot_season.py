#!/usr/bin/env python3
"""Render the first Th'die's Cast pilot season on a GitHub Actions runner.

Five independently downloadable mono MP3 episodes and standards-compliant RSS.
Pilot mechanics and voice mastering are documented in pilot-manifest.json.
No user audio is uploaded, and no copyrighted musical samples are used.

Run from the repository root, after installing requirements and espeak-ng/ffmpeg.
Use --dry-run to build metadata, feed structure and cover without Kokoro.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
import html
import json
import math
from pathlib import Path
import random
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parents[1]
AUDIO = BASE / "audio"
SCRIPT = BASE / "production" / "wilderness_encounters.md"
SITE = "https://udeudeude.github.io/thdies-cast/"
SAMPLE_RATE = 24000
VOICE = "bm_lewis"
KOKORO_RATE = 0.94
EPISODE_COUNT = 5
WORDLIST = [
    'zero','one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen',
    'eighteen','nineteen','twenty'
]
OUTPUTS = [
    ('01-d20.mp3', 'D20', 'Thirty minutes of twenty-sided die results. Seek to a random point and use the next complete number. For this pilot, each set of twenty faces is shuffled before the next set.'),
    ('02-2d6.mp3', '2D6', 'Two independent six-sided dice, followed by their sum. Seek to a random point and use the next complete result. The familiar bell-shaped total distribution emerges naturally.'),
    ('03-d100.mp3', 'D100', 'One uniformly generated number from 1 through 100 at a time. Seek to a random point and take the next complete value. The number 100 is read as one hundred.'),
    ('04-wilderness-oracle.mp3', 'The Wilderness Oracle', 'Eighty original, independent wilderness encounters, each with a subtle boundary cue. Seek and wait for the next complete encounter. Printed numbers and titles are not spoken.'),
    ('05-ten-minutes-to-disaster.mp3', 'Ten Minutes to Disaster', 'An original ten-minute suspense soundtrack and functional countdown. It begins with playback, provides a few time warnings, and ends with a decisive bell at exactly ten minutes.'),
]

# The exact user-approved second Voice Lab preset. The recording is synthesized
# from bm_lewis and rendered with a close offline *approximation* to the app's
# independent -1.25st formant shift and live Web Audio DSP. We DO NOT claim it
# is a sample-perfect match to the JavaScript DSP engine.
SAVED_02 = {
    'pitch':0, 'formant':-1.25, 'speed':1,
    'bass':12, 'presence':-5, 'air':5, 'highpass':30,
    'compression':1, 'threshold':-36,
    'reverb':8, 'echo':4, 'echoTime':80, 'output':0
}
BROTHER = 'Brother Rubicon'
SPOKEN_TITLE = "The die's cast."


def ffmpeg_exists():
    result = subprocess.run(['ffmpeg','-hide_banner','-filters'],capture_output=True,text=True,check=True)
    assert 'rubberband' in result.stdout, 'FFmpeg Rubber Band filter required for independent formant processing'


def render_recipe_filters():
    # Pass 1 shifts pitch and formants together; pass 2 restores original pitch
    # while preserving the shifted formant envelope. Audio durations stay fixed.
    f = 2 ** (SAVED_02['formant'] / 12)
    inv = 1/f
    return ','.join([
        f'rubberband=pitch={f:.8f}:tempo=1:formant=shifted',
        f'rubberband=pitch={inv:.8f}:tempo=1:formant=preserved',
        f'highpass=f={SAVED_02["highpass"]}',
        f'bass=g={SAVED_02["bass"]}:f=180',
        f'equalizer=f=2400:t=q:w=0.82:g={SAVED_02["presence"]}',
        f'treble=g={SAVED_02["air"]}:f=5600',
        # Small, short reflections approximating the user-selected 8% room
        # and 4% 80ms echo. 1:1 compression means no dynamics compressor.
        'aecho=1:0.08:80|110|210|370:0.04|0.035|0.025|0.018',
        'alimiter=limit=0.93',
    ])


def synthesize(kokoro, script_text: str) -> np.ndarray:
    parts=[]
    for _,_,audio in kokoro(script_text,voice=VOICE,speed=KOKORO_RATE):
        if parts:
            parts.append(np.zeros(round(.06*SAMPLE_RATE),dtype=np.float32))
        parts.append(np.asarray(audio,dtype=np.float32).reshape(-1))
    if not parts:
        raise RuntimeError('Kokoro returned no audio for: '+script_text[:100])
    raw=np.concatenate(parts)
    with tempfile.TemporaryDirectory(prefix='rubicon-') as td:
        before=Path(td)/'before.wav'
        after=Path(td)/'after.wav'
        sf.write(before,raw,SAMPLE_RATE,subtype='FLOAT')
        subprocess.run([
            'ffmpeg','-hide_banner','-loglevel','error','-y',
            '-i',str(before),'-af',render_recipe_filters(),
            '-ar',str(SAMPLE_RATE),'-ac','1','-c:a','pcm_f32le',str(after)
        ],check=True)
        out,sr=sf.read(after,dtype='float32')
    assert sr==SAMPLE_RATE and out.size>0, 'Speech transformation failed'
    assert np.all(np.isfinite(out)), 'Nonfinite voice samples'
    # Keep one second of tail so no reflections are truncated in roll slots.
    return np.asarray(out,dtype=np.float32).reshape(-1)


def blank(seconds:float) -> np.ndarray:
    return np.zeros(round(SAMPLE_RATE*seconds),dtype=np.float32)


def sound_file(path:Path):
    return sf.SoundFile(path,mode='w',samplerate=SAMPLE_RATE,channels=1,subtype='PCM_16',format='WAV')


def emit_mp3(wav:Path,mp3:Path):
    mp3.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run([
        'ffmpeg','-hide_banner','-loglevel','error','-y',
        '-i',str(wav),'-af','loudnorm=I=-17:TP=-1.5:LRA=7',
        '-ar',str(SAMPLE_RATE),'-ac','1','-c:a','libmp3lame','-b:a','64k',str(mp3)
    ],check=True)
    wav.unlink()
    assert mp3.stat().st_size > 10000, str(mp3)
    duration = float(json.loads(subprocess.check_output([
        'ffprobe','-v','error','-show_entries','format=duration',
        '-of','json',str(mp3)
    ],text=True))['format']['duration'])
    print('Encoded',mp3.name,f'{duration/60:.2f}min',f'{mp3.stat().st_size/1e6:.1f}MB',flush=True)
    return duration


def short_rolls(kokoro,episode,seed,faces,slot_seconds,rolls,preamble,epilogue):
    rng=random.Random(seed)
    intro=synthesize(kokoro,f'{SPOKEN_TITLE} {BROTHER} speaking. {preamble}')
    seq=[]
    if faces==20:
        # D20 exactly replicates its original 18 shuffled twenty-face blocks.
        for _ in range(18):
            bag=list(range(1,21))
            rng.shuffle(bag)
            while seq and bag==seq[-1]:rng.shuffle(bag)
            seq.append(bag)
        values=[item for block in seq for item in block]
        assert len(values)==360 and all(sorted(b)==list(range(1,21)) for b in seq)
    elif faces=='2D6':
        values=[(rng.randint(1,6),rng.randint(1,6)) for _ in range(rolls)]
    elif faces==100:
        values=[rng.randint(1,100) for _ in range(rolls)]
    else:raise ValueError(faces)
    voice_cache={}
    def phrase(v):
        if faces=='2D6':
            a,b=v
            return f'{WORDLIST[a].capitalize()}. {WORDLIST[b].capitalize()}. Total {WORDLIST[a+b]}.'
        if faces==100:
            if v==100:return 'One hundred.'
            if v<=20:return WORDLIST[v].capitalize()+'.'
            tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
            return (tens[v//10] + (' '+WORDLIST[v%10] if v%10 else '')).capitalize()+'.'
        return WORDLIST[v].capitalize()+'.'
    distinct=set(values)
    for idx,v in enumerate(sorted(distinct)):
        if idx%20==0:print('Rendering',episode,'voice',idx,'of',len(distinct),flush=True)
        voice_cache[v]=synthesize(kokoro,phrase(v))
    lead=.45
    end_pad=.24
    long=max((len(a)/SAMPLE_RATE for a in voice_cache.values()),default=0)
    if long + lead + end_pad > slot_seconds:
        raise RuntimeError(f'{episode}: voice {long:.3f}s exceeds {slot_seconds}s fixed roll slot')
    wav=AUDIO/(episode+'.tmp.wav')
    tail_first,tail_second=epilogue
    with sound_file(wav) as w:
        w.write(blank(.35))
        w.write(intro)
        w.write(blank(1.65))
        start=w.frames/SAMPLE_RATE
        for v in values:
            segment=blank(slot_seconds)
            speech=voice_cache[v]
            at=round(lead*SAMPLE_RATE)
            segment[at:at+len(speech)]=speech
            w.write(segment)
        ending=w.frames/SAMPLE_RATE
        w.write(blank(5.5))
        w.write(synthesize(kokoro,tail_first))
        w.write(blank(2.0))
        w.write(synthesize(kokoro,tail_second))
        w.write(blank(.8))
        total=w.frames/SAMPLE_RATE
    dest=AUDIO/(episode+'.mp3')
    encoded=emit_mp3(wav,dest)
    return {'intro_seconds':round(start,3),'outcome_count':len(values),'slot_seconds':slot_seconds,
        'first_result_seconds':round(start+lead,3),'last_result_slot_ends_seconds':round(ending,3),
        'nonroll_coda':True,'max_spoken_result_seconds':round(long,3),
        'total_seconds_approx':round(encoded,3),'seed':seed,'sampled_outcomes':values,
        'distribution_note': ('18 consecutive reshuffles of 1 through 20; this pilot is NOT IID'
            if faces==20 else 'Each die draw is independent; summed outcomes are not uniform'
            if faces=='2D6' else 'Uniform IID integers 1..100'),
        'epilogue_text':tail_first+' [silence] '+tail_second}


def parse_oracle():
    text=SCRIPT.read_text(encoding='utf-8').replace('\r\n','\n')
    rx=re.compile(r'^###\s*(\d+)\s*\|\s*(.+?)\s*\n(.*?)(?=^###\s*\d+\s*\||\Z)',re.M|re.S)
    entries=[]
    for m in rx.finditer(text):
        prose=' '.join(m.group(3).strip().split())
        entries.append((int(m.group(1)),m.group(2),prose))
    assert len(entries)==80, f'Expected all 80 manuscript entries, found {len(entries)}'
    assert [n for n,_,_ in entries]==list(range(1,81))
    assert all(30<=len(prose.split())<=95 for _,_,prose in entries)
    return entries


def boundary_chime():
    t=np.arange(round(.27*SAMPLE_RATE))/SAMPLE_RATE
    # Very gentle, neutral procedural cue, a double cluster rather than a melody.
    env=np.exp(-14*t)*(1-np.exp(-160*t))
    sig=.075*env*(np.sin(2*np.pi*830*t)+.24*np.sin(2*np.pi*1250*t))
    return sig.astype(np.float32)


def wilderness(kokoro):
    intro=synthesize(kokoro,
        f'{SPOKEN_TITLE} {BROTHER} speaking. This is the Wilderness Oracle. '
        'Seek to a random point, then listen for the next soft chime. '
        'Your encounter is the next complete scene after that chime. '
        'If you reach the end, begin the episode again.')
    scenes=parse_oracle()
    rendered=[]
    for i,title,prose in scenes:
        print('Rendering oracle',i,'of 80',title,flush=True)
        rendered.append(synthesize(kokoro,prose))
    chime=boundary_chime()
    wav=AUDIO/'04-wilderness-oracle.tmp.wav'
    min_slot=23.0
    bounds=[]
    with sound_file(wav) as w:
        w.write(blank(.3));w.write(intro);w.write(blank(1.6))
        first=w.frames/SAMPLE_RATE
        for i,scene in enumerate(rendered):
            pos=w.frames/SAMPLE_RATE
            bounds.append(round(pos,3))
            # Chime and its quiet tail precede a complete, untitled narration.
            w.write(chime);w.write(blank(.65));w.write(scene)
            spoken=len(chime)/SAMPLE_RATE+.65+len(scene)/SAMPLE_RATE
            w.write(blank(max(2.2,min_slot-spoken)))
        end=w.frames/SAMPLE_RATE
        w.write(blank(4.5))
        w.write(synthesize(kokoro,'The map ends here.'))
        w.write(blank(1.7))
        w.write(synthesize(kokoro,'It is wise to leave a little wilderness for tomorrow.'))
        w.write(blank(.8))
    encoded=emit_mp3(wav,AUDIO/'04-wilderness-oracle.mp3')
    return {'encounters':len(scenes),'source':'Exact 80 prose entries in manuscripts/WILDERNESS_ORACLE_80.md',
        'spoken_numbers':False,'spoken_titles':False,'neutral_chimes':80,
        'first_boundary_seconds':round(first,3),'boundary_times_seconds':bounds,
        'last_encounter_ends_seconds':round(end,3),'total_seconds_approx':round(encoded,3)}


def place_audio(block, block_start, sound, at_seconds):
    start=int(round(at_seconds*SAMPLE_RATE))
    end=start+len(sound)
    lo=max(start,block_start)
    hi=min(end,block_start+len(block))
    if hi>lo:
        block[lo-block_start:hi-block_start]+=sound[lo-start:hi-start]


def disaster(kokoro):
    # Ambient score: wholly procedural and copyright-original. 10-minute exact
    # timer starts at first sample; the catastrophe bell begins at sample 600*RATE.
    print('Generating original 10-minute disaster score',flush=True)
    instructions=[
        (0.15,synthesize(kokoro,'Ten minutes until disaster. The clock begins now.')),
        (300.0,synthesize(kokoro,'Five minutes remain.')),
        (540.0,synthesize(kokoro,'One minute remains.')),
        (590.0,synthesize(kokoro,'Ten seconds.')),
    ]
    rng=np.random.default_rng(20261011)
    wav=AUDIO/'05-ten-minutes-to-disaster.tmp.wav'
    with sound_file(wav) as w:
        blocks=600//5
        for chunk in range(blocks):
            start=chunk*5*SAMPLE_RATE
            n=np.arange(5*SAMPLE_RATE,dtype=np.float64)
            t=(start+n)/SAMPLE_RATE
            u=np.maximum(0,np.minimum(1,t/600))
            swell=0.52+1.4*u*u
            lfo=np.sin(2*np.pi*.017*t)
            # Deep, harmonically related and dissonant drones.
            drone=(
                .048*np.sin(2*np.pi*55.0*t+.38*np.sin(2*np.pi*.009*t))+
                .034*np.sin(2*np.pi*82.41*t+.17*np.sin(2*np.pi*.007*t))+
                .028*np.sin(2*np.pi*(92.5+u*1.8)*t)+
                .015*np.sin(2*np.pi*(138.6-u*1.2)*t)
            )*(.5+.5*swell)*(1+.12*lfo)
            # Filtered texture from deterministic seeded pseudo-random noise.
            noise=rng.standard_normal(len(t)).astype(np.float32)
            noise=(noise+np.roll(noise,1)+np.roll(noise,2)+np.roll(noise,3))/4
            wind=(.008+.019*u*u)*noise*(.7+.3*np.sin(2*np.pi*.021*t))
            # Clock accelerates smoothly from ~0.35 to >3 ticks/s.
            phase=.35*t+(3.0*600/5)*np.power(t/600,5)
            envelope=np.exp(-15*np.mod(phase,1.0))
            tick=(.018+.038*u**3)*envelope*np.sin(2*np.pi*(275+u*80)*t)
            # Dissonant rising harmonic, subtle and sparse at first.
            high=(u**4)*.017*np.sin(2*np.pi*233.08*t+.6*np.sin(2*np.pi*.08*t))
            part=np.asarray(drone+wind+tick+high,dtype=np.float32)
            # Narrator at precisely chosen timeline coordinates.
            for sec,voice in instructions:place_audio(part,start,voice,sec)
            # Short tonal landmarks every two minutes, beyond spoken warnings.
            for sec in [120,240,360,480]:
                point=sec*SAMPLE_RATE
                if start<=point<start+len(part):
                    duration=round(.7*SAMPLE_RATE)
                    rel=(point-start)
                    idx=np.arange(min(len(part)-rel,duration))/SAMPLE_RATE
                    part[rel:rel+len(idx)]+=np.asarray(.06*np.exp(-4*idx)*np.sin(2*np.pi*740*idx),dtype=np.float32)
            # No hard clipping of accumulative sound and speech.
            part=np.tanh(part*1.1).astype(np.float32)*.81
            w.write(part)
            if chunk%12==0:print('Soundtrack',chunk*5,'of 600 seconds',flush=True)
        assert w.frames==600*SAMPLE_RATE, 'Timer must contain precisely 600 seconds before cue'
        # Exact end cue, heard starting at the 10:00 mark.
        t=np.arange(round(2.6*SAMPLE_RATE))/SAMPLE_RATE
        bell=np.exp(-1.5*t)*(.30*np.sin(2*np.pi*196*t)+.20*np.sin(2*np.pi*293.66*t)+.18*np.sin(2*np.pi*392*t))
        w.write(np.tanh(bell).astype(np.float32))
        w.write(blank(3.3))
        w.write(synthesize(kokoro,'There. The disaster has arrived.'))
        w.write(blank(1.65))
        w.write(synthesize(kokoro,'If you survived, I recommend not asking for another.'))
        w.write(blank(.8))
    encoded=emit_mp3(wav,AUDIO/'05-ten-minutes-to-disaster.mp3')
    return {'functional_countdown_seconds':600,'end_cue_start_seconds':600.0,
        'spoken_landmark_start_times_seconds':[float(x[0]) for x in instructions],
        'music_source':'Original procedural synthesis, no borrowed recordings',
        'total_seconds_approx':round(encoded,3),'hidden_coda_after_end':True}


def draw_cover():
    path=BASE/'cover.png'
    side=1800
    img=Image.new('RGB',(side,side),'#151f2b')
    d=ImageDraw.Draw(img)
    serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
    sans='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    head=ImageFont.truetype(serif,140)
    huge=ImageFont.truetype(serif,310)
    mid=ImageFont.truetype(serif,57)
    small=ImageFont.truetype(sans,31)
    for i in range(7):
        r=380+i*42
        d.ellipse((900-r,910-r,900+r,910+r),outline=(66+i*4,77+i*4,83+i*2),width=3)
    # A simple abstract twenty-sided die, drawn by code; no external art.
    pts=[(900,435),(1220,610),(1360,910),(1245,1235),(900,1380),(565,1235),(440,915),(575,610)]
    d.polygon(pts,outline='#ccb88c',width=12)
    for a,b in [(0,2),(0,6),(2,4),(4,6),(0,4),(2,6)]:
        d.line((pts[a],pts[b]),fill='#7a866e',width=6)
    d.ellipse((879,888,921,930),fill='#dbbf86')
    d.rectangle((110,98,1690,115),fill='#bda875')
    d.text((900,142),"TH’DIE’S",font=head,anchor='mt',fill='#f0e7d1',stroke_width=1)
    d.text((900,1138),'CAST',font=huge,anchor='mt',fill='#f0e7d1',stroke_width=2)
    d.rectangle((180,1618,1620,1623),fill='#bda875')
    d.text((900,1652),'BROTHER RUBICON · TABLETOP AUDIO TOOLS',font=small,anchor='mt',fill='#d4c29c')
    img.save(path,format='PNG',optimize=True)
    assert path.stat().st_size>5000
    print('Generated podcast cover',path.stat().st_size,'bytes',flush=True)


def make_feed(durations):
    # xml.etree handles all escaping of episode prose, apostrophes and UTF-8.
    ns_itunes='http://www.itunes.com/dtds/podcast-1.0.dtd'
    ns_atom='http://www.w3.org/2005/Atom'
    ET.register_namespace('itunes',ns_itunes)
    ET.register_namespace('atom',ns_atom)
    rss=ET.Element('rss',{'version':'2.0'})
    channel=ET.SubElement(rss,'channel')
    def sub(parent,tag,text=None,attrs=None):
        e=ET.SubElement(parent,tag,attrs or {})
        if text is not None:e.text=str(text)
        return e
    sub(channel,'title','Th’die’s Cast')
    sub(channel,'link',SITE)
    sub(channel,'description','Audio tools for tabletop games, hosted by Brother Rubicon: roll dice, discover wilderness encounters, and time disasters. A five-episode pilot season. No companion app required.')
    sub(channel,'language','en-us')
    sub(channel,'copyright','Original spoken-word scripts and procedurally generated music. © 2026 Th’die’s Cast.')
    sub(channel,'generator','Thdies Cast podcast build 1.0')
    sub(channel,f'{{{ns_itunes}}}author','Th’die’s Cast')
    sub(channel,f'{{{ns_itunes}}}summary','Useful audio tools for tabletop games with Brother Rubicon.')
    sub(channel,f'{{{ns_itunes}}}subtitle','Dice, encounters, and audio clocks for the tabletop')
    sub(channel,f'{{{ns_itunes}}}explicit','false')
    sub(channel,f'{{{ns_itunes}}}type','episodic')
    sub(channel,f'{{{ns_itunes}}}image',attrs={'href':SITE+'cover.png'})
    games=sub(channel,f'{{{ns_itunes}}}category',attrs={'text':'Leisure'})
    sub(games,f'{{{ns_itunes}}}category',attrs={'text':'Games'})
    sub(channel,'image')
    cover=channel.find('image')
    sub(cover,'url',SITE+'cover.png')
    sub(cover,'title','Th’die’s Cast')
    sub(cover,'link',SITE)
    sub(channel,f'{{{ns_atom}}}link',attrs={'href':SITE+'feed.xml','rel':'self','type':'application/rss+xml'})
    # RSS shows the newest entry first, while episode numbers remain fixed.
    # Each unique GUID stays fixed across later metadata corrections.
    now=datetime.now(timezone.utc)
    for idx in reversed(range(5)):
        filename,title,description=OUTPUTS[idx]
        file=AUDIO/filename
        item=sub(channel,'item')
        sub(item,'title',f'{idx+1:02d} · {title}')
        sub(item,'description',description+' These are working pilot releases; details may change with future revisions.')
        sub(item,'link',SITE+'#ep'+str(idx+1))
        sub(item,'guid',f'urn:thdies-cast:pilot:{idx+1:02d}:v1',{'isPermaLink':'false'})
        sub(item,'pubDate',format_datetime(now-timedelta(minutes=(4-idx)*3)))
        sub(item,'enclosure',attrs={'url':SITE+'audio/'+filename,'length':str(file.stat().st_size),'type':'audio/mpeg'})
        sub(item,f'{{{ns_itunes}}}episode',str(idx+1))
        sub(item,f'{{{ns_itunes}}}season','1')
        sub(item,f'{{{ns_itunes}}}episodeType','full')
        sub(item,f'{{{ns_itunes}}}explicit','false')
        n=int(durations[filename]);sub(item,f'{{{ns_itunes}}}duration',f'{n//3600:02}:{(n//60)%60:02}:{n%60:02}')
    text=ET.tostring(rss,encoding='utf-8',xml_declaration=True)
    (BASE/'feed.xml').write_bytes(text)
    check=ET.parse(BASE/'feed.xml').getroot()
    assert len(check.findall('./channel/item'))==5
    print('Generated RSS with five linked audio enclosures',len(text),'bytes',flush=True)


def make_landing(metadata):
    cards=[]
    for i,(filename,title,desc) in enumerate(OUTPUTS,1):
        details=metadata[filename]
        runtime=details['total_seconds_approx']
        mm=int(runtime//60);ss=int(runtime%60)
        cards.append(f'''<article id="ep{i}"><h2><span>{i:02d}</span> {html.escape(title)}</h2><p>{html.escape(desc)}</p><p class="small">Runtime: {mm}:{ss:02d} · <a href="./audio/{filename}">Direct MP3</a></p><audio controls preload="none" src="./audio/{filename}"></audio></article>''')
    page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#151f2b"><link rel="alternate" type="application/rss+xml" href="./feed.xml" title="Th’die’s Cast RSS"><title>Th’die’s Cast · Five pilot episodes</title><style>
:root{{color-scheme:dark}}*{{box-sizing:border-box}}body{{margin:0;background:#151f2b;color:#f0e7d1;font:16px/1.52 system-ui,-apple-system,sans-serif}}main{{max-width:780px;margin:auto;padding:24px 16px 65px}}h1{{font:normal clamp(2.6rem,9vw,5rem)/1.08 Georgia,serif;margin:9px 0 14px}}h2{{font:normal 1.55rem Georgia,serif;margin:0 0 7px}}h2 span{{font:.8rem system-ui,sans-serif;color:#d7bb7a;margin-right:13px}}.subtitle,.small,p{{color:#c7c0b1}}.subtitle{{max-width:55ch}}.mast{{display:flex;gap:20px;align-items:center}}.mast img{{width:140px;border-radius:11px}}article{{background:#253342;border:1px solid #ffffff30;padding:16px;border-radius:14px;margin:14px 0}}article p{{margin:9px 0}}audio{{width:100%}}a{{color:#e9c988;text-underline-offset:3px}}.feed{{padding:13px;border-left:3px solid #d7bb7a;background:#ffffff09;margin:20px 0}}code{{overflow-wrap:anywhere}}footer{{margin-top:35px;font-size:.86rem;color:#c7c0b1}}@media(max-width:500px){{.mast{{align-items:start}}.mast img{{width:96px}}}}
</style></head><body><main><div class="mast"><img src="./cover.png" alt="Th’die’s Cast abstract twenty-sided die cover"><div><small>FIVE PILOT EPISODES</small><h1>Th’die’s Cast</h1></div></div><p class="subtitle">Tabletop tools you can hear. Brother Rubicon narrates dice, wilderness encounters and an original countdown. The show is a podcast, not an app.</p><div class="feed"><strong>Follow in Apple Podcasts</strong><p>In the Podcasts app, open Library → ••• → Follow a Show by URL, and paste the following feed:</p><p><a href="./feed.xml"><code>{SITE}feed.xml</code></a></p><p>Some versions of Podcasts put this action under the Library menu. This is a direct RSS subscription, not an Apple Podcasts directory listing.</p></div>{''.join(cards)}<footer><p>All recordings are working pilots, not locked game rules. Choose the next complete result when seeking. No narration of encounter numbers or titles. Audio is original or generated from the project's own prose.</p><p><a href="https://github.com/udeudeude/Th-die-s-Cast">Podcast project and production notes</a></p></footer></main></body></html>'''
    (BASE/'index.html').write_text(page,encoding='utf-8')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--dry-run',action='store_true')
    args=parser.parse_args()
    AUDIO.mkdir(parents=True,exist_ok=True)
    print('Validating source and dependencies',flush=True)
    scenes=parse_oracle()
    assert len(scenes)==80
    draw_cover()
    if args.dry_run:
        print('Dry run: 80 encounters parsed, cover created; skipping actual audio build',flush=True)
        return
    ffmpeg_exists()
    from kokoro import KPipeline
    voice=KPipeline(lang_code='b')
    manifests={}
    manifests['01-d20.mp3']=short_rolls(voice,'01-d20',20261009,20,5,360,
        'D twenty. Seek to a random point. Ignore any number already in progress. Your roll is the next number heard from its beginning. This pilot reshuffles the twenty faces every twenty rolls.',
        ('Twenty-one.','No. Not really. That would be ridiculous. This is the end of the recording. You should not be here anyway.'))
    manifests['02-2d6.mp3']=short_rolls(voice,'02-2d6',20261011,'2D6',6,300,
        'Two dice, six faces each. Every result names the first die, the second die, and then the sum. Seek to a random point. Ignore an incomplete result, and listen for the next full one. The two dice are independent.',
        ('The dice have finished.','You are welcome to blame them. They are, however, only dice.'))
    manifests['03-d100.mp3']=short_rolls(voice,'03-d100',20261012,100,6,300,
        'D one hundred. Results run from one to one hundred, inclusive. One hundred is a valid roll. Seek to a random point, ignore any clipped number, and listen for the next complete value. Each result is independent.',
        ('That was a hundred faces of possibility.','I hope at least one of them was useful.'))
    manifests['04-wilderness-oracle.mp3']=wilderness(voice)
    manifests['05-ten-minutes-to-disaster.mp3']=disaster(voice)
    assert set(manifests)==set(x[0] for x in OUTPUTS)
    (BASE/'pilot-manifest.json').write_text(json.dumps({
        'series':'Th’die’s Cast',
        'host_character':BROTHER,
        'voice_model':VOICE,
        'voice_tts_speed':KOKORO_RATE,
        'voice_lab_preset':'Saved 02 · Natural pitch, light room',
        'saved_voice_settings':SAVED_02,
        'processing_note':'Offline formant-envelope approximation via opposing Rubber Band pitch passes, plus EQ and subtle reflections; compare against browser preset by ear.',
        'spoken_title':SPOKEN_TITLE,
        'status':'Pilot season, mechanics provisional pending listening feedback',
        'episodes':manifests,
        'rss_url':SITE+'feed.xml'
    },indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    make_feed({name:manifest['total_seconds_approx'] for name,manifest in manifests.items()})
    make_landing(manifests)
    assert (BASE/'feed.xml').stat().st_size>2000
    assert (BASE/'cover.png').stat().st_size>5000
    for name,_,_ in OUTPUTS:assert (AUDIO/name).stat().st_size>100000
    print('All five podcast pilots ready',flush=True)

if __name__=='__main__':main()
