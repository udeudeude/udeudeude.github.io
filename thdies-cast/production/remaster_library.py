#!/usr/bin/env python3
"""Remove Wilderness Oracle's electronic chimes and level-match spoken openings.

The original WAV source for the first pilots is not available, so the Wilderness
recording is reconstructed from its documented MP3 boundaries. All earlier RSS
GUIDs are preserved; originals are checksum-checked by the release workflow.
"""
from __future__ import annotations

from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET

import numpy as np

import render_pilot_season as pilot
import audit_audio_levels as audit

ROOT = pilot.BASE
AUDIO = ROOT/"audio"
RATE = pilot.SAMPLE_RATE
PILOT_MANIFEST = ROOT/"pilot-manifest.json"
BALANCED_MANIFEST = ROOT/"dice-methods/manifest.json"
CREATURE_MANIFEST = ROOT/"creatures-manifest.json"
RSS = ROOT/"feed.xml"
VERSION = "20261024b"

def decode_mp3(path):
    b=subprocess.check_output([
        "ffmpeg","-hide_banner","-loglevel","error","-i",str(path),
        "-ac","1","-ar",str(RATE),"-f","f32le","-"
    ])
    x=np.frombuffer(b,dtype="<f4").copy()
    assert np.isfinite(x).all() and len(x)>RATE*5
    return x

def write_mp3(path, audio):
    temp=AUDIO/(path.stem+".remaster.tmp.wav")
    intermediary=AUDIO/(path.stem+".remaster.tmp.mp3")
    with pilot.sound_file(temp) as output:
        # Avoid large soundfile temporary allocations for 30-minute episodes.
        for a in range(0,len(audio),5*RATE):
            output.write(audio[a:a+5*RATE])
    duration=pilot.emit_mp3(temp,intermediary)
    os.replace(intermediary,path)
    return duration

def last_voice_sample(voice):
    # Detect the end of significant speech energy, not a fixed-length slot.
    frame=round(.06*RATE)
    n=len(voice)//frame
    if n<3:return len(voice)
    m=voice[:n*frame].reshape(n,frame)
    energy=np.sqrt(np.mean(np.square(m.astype(np.float64)),axis=1))
    upper=float(np.percentile(energy,90))
    gate=max(.00045,upper*.06)
    candidates=np.flatnonzero(energy>gate)
    if not len(candidates):return len(voice)
    return min(len(voice),(int(candidates[-1])+1)*frame+round(.38*RATE))

def rebuild_wilderness():
    info=json.loads(PILOT_MANIFEST.read_text(encoding="utf-8"))
    m=info["episodes"]["04-wilderness-oracle.mp3"]
    points=list(m["boundary_times_seconds"])
    assert len(points)==80 and m["encounters"]==80
    old=decode_mp3(AUDIO/"04-wilderness-oracle.mp3")
    original_duration=len(old)/RATE
    old_end=m["last_encounter_ends_seconds"]
    # Original source: each boundary = a 0.27 s synthesized chime,
    # 0.65 s silence, narration, then variable padding. Remove all 0.92 s.
    prefix=old[:round(points[0]*RATE)]
    parts=[prefix]
    new_points=[]
    cursor=len(prefix)
    for i,a in enumerate(points):
        b=points[i+1] if i+1<len(points) else old_end
        audible_start=round((a+.27+.65)*RATE)
        audible_end=round(b*RATE)
        scene=old[audible_start:audible_end]
        assert len(scene)>RATE*4,(i,len(scene))
        scene=scene[:last_voice_sample(scene)]
        assert len(scene)>RATE*3,(i,len(scene))
        new_points.append(round(cursor/RATE,3))
        parts.append(scene)
        cursor+=len(scene)
        pause=pilot.blank(.85)
        parts.append(pause)
        cursor+=len(pause)
    # The old coda starts after 4.5 s of silence. Retain its opening
    # a little short breath, not the very long gap.
    coda=old[round((old_end+4.1)*RATE):]
    assert len(coda)>RATE*2
    parts.append(coda)
    result=np.concatenate(parts).astype(np.float32)
    assert len(new_points)==80 and np.isfinite(result).all()
    before = (AUDIO/"04-wilderness-oracle.mp3").stat().st_size
    duration=write_mp3(AUDIO/"04-wilderness-oracle.mp3", result)
    m["first_boundary_seconds"]=new_points[0]
    m["boundary_times_seconds"]=new_points
    m["last_encounter_ends_seconds"]=round(cursor/RATE,3)
    m["neutral_chimes"]=0
    m["inter_scene_pause_seconds"]=.85
    m["total_seconds_approx"]=round(duration,3)
    m["prior_chimes_removed"]=80
    m["source_master_duration_seconds"]=round(original_duration,3)
    PILOT_MANIFEST.write_text(json.dumps(info,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"WILDERNESS: removed all 80 synthetic chimes, {original_duration:.1f}s -> {duration:.1f}s; {before} -> {(AUDIO/'04-wilderness-oracle.mp3').stat().st_size} bytes",flush=True)
    return "04-wilderness-oracle.mp3"

def current_times(n,path):
    if n in (1,2,3,4):
        meta=json.loads(PILOT_MANIFEST.read_text())["episodes"][path.name]
        if n==4:
            start=meta["first_boundary_seconds"]
            end=meta["last_encounter_ends_seconds"]
            body_end=meta["boundary_times_seconds"][min(8,len(meta["boundary_times_seconds"])-1)]
        else:
            start=meta["intro_seconds"]
            end=meta["last_result_slot_ends_seconds"]
            body_end=min(end,start+35*meta["slot_seconds"])
    elif n==5:return None
    elif n<=13:
        meta=json.loads(BALANCED_MANIFEST.read_text())["new_episodes"][path.name]
        start=meta["results_start_seconds"]
        end=meta["results_end_seconds"]
        body_end=min(end,start+35*meta["slot_seconds"])
    else:
        meta=json.loads(CREATURE_MANIFEST.read_text())
        start=meta["first_boundary_seconds"]
        end=meta["last_encounter_slot_end_seconds"]
        body_end=meta["boundary_times_seconds"][8]
    return start,body_end,end

def db_region(x,a,b):
    v=x[max(0,round(a*RATE)):min(len(x),round(b*RATE))]
    return audit.active_voice_db(v)

def level_one(n,path):
    times=current_times(n,path)
    if times is None:
        # An ambient countdown and exact 600-second event cannot be compared
        # with dry numbers; preserve it without cutting or moving any samples.
        print("05 timed soundtrack: preserved intact; not eligible for automatic voice/body remaster",flush=True)
        return False,None
    a,body_end,b=times
    x=decode_mp3(path)
    total=len(x)/RATE
    before={
        "intro_db":db_region(x,0,a),
        "body_db":db_region(x,a,body_end),
        "coda_db":db_region(x,b,total)
    }
    reference=before["body_db"]
    assert np.isfinite(reference),("No body level",path)
    gains={}
    changed=False
    for key,lo,hi in (("intro",0,a),("coda",b,total)):
        measured=before[f"{key}_db"]
        if not np.isfinite(measured):
            gains[key]=0.0
            continue
        diff=reference-measured
        if abs(diff)<2.0:
            gains[key]=0.0
            continue
        boost=max(-11.0,min(11.0,diff))
        block=x[round(lo*RATE):round(hi*RATE)]
        maxamp=float(np.max(np.abs(block))) if len(block) else 0.0
        # Keep peaks below -0.7 dBFS without hard clipping.
        if boost>0 and maxamp>0:
            boost=min(boost,20*math.log10(.92/maxamp))
        factor=10**(boost/20)
        block*=factor
        gains[key]=round(boost,2)
        changed=changed or abs(boost)>.5
    if changed:
        duration=write_mp3(path,x)
        del x
        inspect=decode_mp3(path)
        after={
            "intro_db":db_region(inspect,0,a),
            "body_db":db_region(inspect,a,body_end),
            "coda_db":db_region(inspect,b,len(inspect)/RATE)
        }
    else:
        duration=total
        after=before
    report={"episode":n,"filename":path.name,"changed":changed,
            "before":before,"after":after,"gain_db":gains,"duration":round(duration,3)}
    print(f"LEVEL {n:02d}: intro gap {reference-before['intro_db']:+.1f} dB, coda gap {reference-before['coda_db']:+.1f} dB; gains {gains}, after intro gap {after['body_db']-after['intro_db']:+.1f} dB, after coda gap {after['body_db']-after['coda_db']:+.1f} dB",flush=True)
    return changed,report

def update_public(changed,report):
    ET.register_namespace("itunes","http://www.itunes.com/dtd/podcast-1.0.dtd")
    ET.register_namespace("itunes","http://www.itunes.com/dtd/podcast-1.0.dtd")
    ET.register_namespace("atom","http://www.w3.org/2005/Atom")
    tree=ET.parse(RSS)
    items=tree.findall("./channel/item")
    assert len(items)==14
    updated=set(changed)
    for item in items:
        enclosure=item.find("enclosure")
        if enclosure is None:continue
        old_url=enclosure.attrib.get("url","")
        name=old_url.split("/")[-1].split("?")[0]
        if name not in updated:continue
        path=AUDIO/name
        enclosure.attrib["length"]=str(path.stat().st_size)
        enclosure.attrib["url"]=pilot.SITE+"audio/"+name+"?revision="+VERSION
        dur=float(json.loads(subprocess.check_output([
            "ffprobe","-v","error","-show_entries","format=duration",
            "-of","json",str(path)
        ],text=True))["format"]["duration"])
        duration=item.find("{http://www.itunes.com/dtd/podcast-1.0.dtd}duration")
        if duration is not None:
            h=int(dur)//3600
            mm=(int(dur)//60)%60
            ss=int(dur)%60
            duration.text=f"{h:02}:{mm:02}:{ss:02}"
        desc=item.find("description")
        if desc is None:continue
        if name=="04-wilderness-oracle.mp3":
            text=desc.text or ""
            text=text.replace("subtle boundary cue","brief pause").replace("subtle boundary cues","brief pauses")
            text=text.replace("next soft chime","next complete encounter")
            text=text.replace("after that chime","after a brief pause")
            text=text.replace("chime","pause")
            desc.text=text
        if name=="14-creatures-behaving-strangely.mp3":
            text=desc.text or ""
            for banned in ("Hand-operated scrubbing is not guaranteed to be uniform.","A final closing remark is not an encounter.","using Kokoro Lewis with the producer-selected Saved 02 treatment."):
                assert banned not in text
            assert "Eighty" in text
    tree.write(RSS,encoding="utf-8",xml_declaration=True)
    site=ROOT/"index.html"
    page=site.read_text(encoding="utf-8")
    page=page.replace("each with a subtle boundary cue","with short breaks between scenes").replace("each with a subtle boundary cue","with short pauses between them")
    page=page.replace("each with a subtle boundary cue","with short breaks between them")
    page=page.replace("each with a subtle boundary cue","with short pauses")
    page=page.replace("with a subtle boundary cue","with a brief pause")
    page=page.replace("after its chime","after a short pause")
    for name in updated:
        page=page.replace(name+'?revision='+VERSION,name) # idempotence
        page=page.replace(name+'"',name+'?revision='+VERSION+'"')
    site.write_text(page,encoding="utf-8")
    dice=ROOT/"dice-methods/index.html"
    dpage=dice.read_text(encoding="utf-8")
    for name in updated:
        dpage=dpage.replace(name+'?revision='+VERSION,name)
        dpage=dpage.replace(name+'"',name+'?revision='+VERSION+'"')
    dice.write_text(dpage,encoding="utf-8")
    (ROOT/"production/level-qc-report.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    # Keep Creatures' own manifest and notes honest about total runtime.
    creature=json.loads(CREATURE_MANIFEST.read_text(encoding="utf-8"))
    creature["enclosure_bytes"]=(AUDIO/creature["file"]).stat().st_size
    creature["total_seconds"]=next(x["duration"] for x in report if x["episode"]==14)
    CREATURE_MANIFEST.write_text(json.dumps(creature,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    # Metadata checks across all episodes.
    parsed=ET.parse(RSS)
    items=parsed.findall("./channel/item")
    assert len(items)==14
    assert len({i.findtext("guid") for i in items})==14
    for item in items:
        enc=item.find("enclosure")
        if enc is None:continue
        name=enc.get("url").split("/")[-1].split("?")[0]
        assert (AUDIO/name).is_file(),name
        assert (AUDIO/name).stat().st_size==int(enc.get("length")),name
    assert "chime" not in next(i for i in items if i.findtext("guid")=="urn:thdies-cast:encounters:14:v1").findtext("description").lower()
    print("RSS: preserved 14 GUIDs; updated enclosure lengths, durations and URL cache revisions",flush=True)

def main():
    rebuilt=rebuild_wilderness()
    changed={rebuilt}
    report=[]
    for n in range(1,15):
        path=next(AUDIO.glob(f"{n:02d}-*.mp3"))
        modified,record=level_one(n,path)
        changed.add(path.name) if modified else None
        if record:report.append(record)
    # Updated public enclosure details and cache revisions for all changed MP3s.
    update_public(changed,report)
    print("CHANGED MEDIA:",sorted(changed),flush=True)

if __name__=="__main__":
    main()
