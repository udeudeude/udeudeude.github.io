#!/usr/bin/env python3
"""One-time static voice-reference mastering of the three encounter editions.

The original dynamic full-file loudnorm made long dice codas inaudible.
Removing it avoided the coda defect but new Kokoro renderings are too quiet
compared with the previously mastered spoken encounters. Match *active speech*
to the original Wilderness scenes using one static gain + gentle soft limiter,
then re-encode once without timeline-sensitive dynamic loudness processing.
"""
from __future__ import annotations
import json
import math
import re
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np
import audit_audio_levels as meter
import remaster_library as master
import render_pilot_season as pilot

ROOT=pilot.BASE
AUDIO=pilot.AUDIO
RATE=pilot.SAMPLE_RATE
PILOT=ROOT/"pilot-manifest.json"
CREATURE=ROOT/"creatures-manifest.json"
RELICS=ROOT/"relics-manifest.json"
FEED=ROOT/"feed.xml"
REV="20261024d"

def level(x,a,b):
    z=x[max(0,round(a*RATE)):min(len(x),round(b*RATE))]
    db=meter.active_voice_db(z)
    assert math.isfinite(db) and -90<db<5,(a,b,db)
    return db

def adjustment(samples,target,measure_start,measure_end,apply_start=0,apply_end=None):
    if apply_end is None:apply_end=len(samples)
    mask=samples[apply_start:apply_end]
    original=level(samples,measure_start,measure_end)
    assert abs(target-original)<40,(target,original)
    for attempt in range(5):
        current=level(samples,measure_start,measure_end)
        delta=target-current
        if abs(delta)<0.9:break
        factor=10**(max(-7,min(31,delta))/20)
        # Fixed gain with no time-dependent release, then smooth saturation
        # only if amplification could exceed a safe digital peak.
        peak=float(np.max(np.abs(mask)))*factor
        if peak<.87:
            mask*=factor
        else:
            mask[:]=.92*np.tanh(mask*factor/.92)
    return original,level(samples,measure_start,measure_end)

def main():
    p=json.loads(PILOT.read_text(encoding="utf-8"))
    w=p["episodes"]["04-wilderness-oracle.mp3"]
    c=json.loads(CREATURE.read_text(encoding="utf-8"))
    r=json.loads(RELICS.read_text(encoding="utf-8"))
    assert all(x["encounters"]==80 and x["neutral_chimes"]==0 for x in (w,c,r))
    assert w.get("new_chime_free_intro")
    old_counts={x.name:x.stat().st_size for x in AUDIO.glob("*.mp3")}
    assert len(old_counts)==15
    woods=master.decode_mp3(AUDIO/"04-wilderness-oracle.mp3")
    wa=w["first_boundary_seconds"]
    woodlevel=level(woods,wa,w["boundary_times_seconds"][8])
    assert -30<woodlevel<-8,("Original Wilderness narration has unexpected reference loudness",woodlevel)
    print("REFERENCE: Wilderness encounters",woodlevel,"dB",flush=True)

    # Preserve all eighty Wilderness scenes and its original closing coda.
    wbefore,wafter=adjustment(woods,woodlevel,0,wa,0,round(wa*RATE))
    assert abs(wafter-woodlevel)<2.3,("Wilderness intro",wbefore,wafter,woodlevel)
    wd=master.write_mp3(AUDIO/"04-wilderness-oracle.mp3",woods)
    w["total_seconds_approx"]=round(wd,3)
    w["new_intro_voice_reference_db"]=woodlevel
    p["episodes"]["04-wilderness-oracle.mp3"]=w

    episodes=[
        ("14-creatures-behaving-strangely.mp3",c,CREATURE),
        ("15-relics-and-curiosities.mp3",r,RELICS)
    ]
    for filename,meta,path in episodes:
        x=master.decode_mp3(AUDIO/filename)
        a=meta["first_boundary_seconds"]
        b=meta["boundary_times_seconds"][8]
        old,new=adjustment(x,woodlevel,a,b)
        assert abs(new-woodlevel)<2.3,(filename,old,new,woodlevel)
        duration=master.write_mp3(AUDIO/filename,x)
        y=master.decode_mp3(AUDIO/filename)
        # The final encode must preserve comparable active voice level.
        after=level(y,a,b)
        intro=level(y,0,a)
        tail=level(y,meta["last_encounter_slot_end_seconds"],len(y)/RATE)
        assert abs(after-woodlevel)<2.5,(filename,after,woodlevel)
        assert abs(after-intro)<4.5,(filename,"intro",intro,after)
        assert abs(after-tail)<4.5,(filename,"coda",tail,after)
        meta["total_seconds"]=round(duration,3)
        meta["enclosure_bytes"]=(AUDIO/filename).stat().st_size
        meta["reference_level_db"]=woodlevel
        meta["mastered_scene_level_db"]=after
        print(f"LEVEL-MATCHED {filename}: before={old:.1f} after={after:.1f} intro={intro:.1f} coda={tail:.1f} reference={woodlevel:.1f}",flush=True)
        path.write_text(json.dumps(meta,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

    PILOT.write_text(json.dumps(p,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

    tree=ET.parse(FEED)
    ET.register_namespace("itunes","http://www.itunes.com/dtds/podcast-1.0.dtd")
    ET.register_namespace("atom","http://www.w3.org/2005/Atom")
    items=tree.findall("./channel/item")
    assert len(items)==15 and len({i.findtext("guid") for i in items})==15
    names={"04-wilderness-oracle.mp3","14-creatures-behaving-strangely.mp3","15-relics-and-curiosities.mp3"}
    itns="{http://www.itunes.com/dtds/podcast-1.0.dtd}"
    for item in items:
        enc=item.find("enclosure")
        name=enc.get("url").split("/")[-1].split("?")[0]
        if name not in names:continue
        file=AUDIO/name
        enc.set("length",str(file.stat().st_size))
        enc.set("url",pilot.SITE+"audio/"+name+"?revision="+REV)
        record=p["episodes"][name] if name.startswith("04-") else c if name.startswith("14-") else r
        dur=float(record.get("total_seconds",record.get("total_seconds_approx")))
        t=int(dur)
        tag=item.find(itns+"duration")
        assert tag is not None
        tag.text=f"{t//3600:02}:{(t//60)%60:02}:{t%60:02}"
    tree.write(FEED,encoding="utf-8",xml_declaration=True)
    site=ROOT/"index.html"
    text=site.read_text(encoding="utf-8")
    for name in names:
        text=re.sub(re.escape(name)+r"(?:\?revision=[A-Za-z0-9_-]+)?",name+"?revision="+REV,text)
    site.write_text(text,encoding="utf-8")

    assert len(list(AUDIO.glob("*.mp3")))==15
    assert all(AUDIO.joinpath(name).stat().st_size==size for name,size in old_counts.items() if name not in names)
    for item in ET.parse(FEED).findall("./channel/item"):
        enc=item.find("enclosure")
        f=AUDIO/enc.get("url").split("/")[-1].split("?")[0]
        assert f.stat().st_size==int(enc.get("length")),f
    print("SUCCESS: three encounter episodes volume-matched to original Wilderness, all 15 MP3 enclosures valid",flush=True)

if __name__=="__main__":
    main()
