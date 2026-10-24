#!/usr/bin/env python3
"""Finish previously rendered 14-episode master from persisted GitHub artifact.

Do NOT re-render any speech or change any dice outcomes. Repair two peaky
codas with bounded soft limiting, then restore publication files & validation.
"""
from __future__ import annotations
import json
import math
import re
import subprocess
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np

import remaster_library as master
import render_creatures as creatures
import render_pilot_season as pilot
from audit_audio_levels import active_voice_db

ROOT=pilot.BASE
AUDIO=pilot.AUDIO
RATE=pilot.SAMPLE_RATE
FEED=ROOT/"feed.xml"
REPORT=ROOT/"production/level-qc-report.json"
DICE=ROOT/"dice-methods/manifest.json"
CR=ROOT/"creatures-manifest.json"
PILOT=ROOT/"pilot-manifest.json"
VERSION="20261024b"

def level(x,a,b):
    seg=x[round(a*RATE):round(b*RATE)]
    return active_voice_db(seg)

def refine(n,name,meta,record):
    path=AUDIO/name
    x=master.decode_mp3(path)
    start=float(meta["results_start_seconds"])
    end=float(meta["results_end_seconds"])
    reference=level(x,start,start+min(35*meta["slot_seconds"],end-start))
    coda=x[round(end*RATE):]
    for attempt in range(5):
        current=active_voice_db(coda)
        difference=reference-current
        if difference<=3.5:
            break
        gain=min(5.5,max(1.2,difference-2.5))
        factor=10**(gain/20)
        coda[:]=0.93*np.tanh(coda*factor/0.93)
        print(f"Fixing episode {n} coda peak structure: pass {attempt+1}, gain {gain:.2f} dB",flush=True)
    assert np.max(np.abs(coda)) < .94
    duration=master.write_mp3(path,x)
    data=master.decode_mp3(path)
    intro=level(data,0,start)
    body=level(data,start,start+min(35*meta["slot_seconds"],end-start))
    ending=level(data,end,len(data)/RATE)
    assert abs(body-intro)<3.0,(n,intro,body)
    assert abs(body-ending)<4.5,(n,ending,body)
    meta["enclosure_bytes"]=path.stat().st_size
    meta["total_seconds_approx"]=round(duration,3)
    record["after"]={"intro_db":intro,"body_db":body,"coda_db":ending}
    record["duration"]=round(duration,3)
    record["postmaster_soft_limiter"]=True
    print(f"EPISODE {n}: intro {intro:.1f}, results {body:.1f}, coda {ending:.1f} dB, gap {body-ending:+.2f}",flush=True)

def rebuild_pages_and_feed():
    # Preserve all existing podcast GUIDs from the completed, validated artifact.
    tree=ET.parse(FEED)
    ET.register_namespace("itunes","http://www.itunes.com/dtds/podcast-1.0.dtd")
    ET.register_namespace("atom","http://www.w3.org/2005/Atom")
    items=tree.findall("./channel/item")
    assert len(items)==14
    assert len({i.findtext("guid") for i in items})==14
    c=json.loads(CR.read_text())
    assert c["encounters"]==80 and c["neutral_chimes"]==0
    w=json.loads(PILOT.read_text())["episodes"]["04-wilderness-oracle.mp3"]
    assert w["encounters"]==80 and w["neutral_chimes"]==0

    for it in items:
        enc=it.find("enclosure")
        if enc is None:continue
        filename=enc.get("url").split("/")[-1].split("?")[0]
        path=AUDIO/filename
        assert path.exists(),filename
        enc.set("length",str(path.stat().st_size))
        if filename=="14-creatures-behaving-strangely.mp3" or filename.startswith(("01-","02-","03-","04-","06-","07-","08-","09-","10-","11-","12-","13-")):
            enc.set("url",pilot.SITE+"audio/"+filename+"?revision="+VERSION)
        if filename=="14-creatures-behaving-strangely.mp3":
            it.find("description").text=creatures.show_notes()
            it.find("{http://www.itunes.com/dtds/podcast-1.0.dtd}duration").text=creatures.seconds_format(c["total_seconds"])
        if filename=="04-wilderness-oracle.mp3":
            it.find("description").text=(
                "Eighty independent wilderness encounters for your tabletop. "
                "Seek to a random point during the scenes. Ignore one already underway, "
                "and use the next complete encounter."
            )
        assert int(enc.get("length"))==path.stat().st_size
    tree.write(FEED,encoding="utf-8",xml_declaration=True)

    # Update the episode's public card from the current 80-scene manifest.
    creatures.update_landing(c)
    (ROOT/"creatures-behaving-strangely.md").write_text(
        "# Creatures Behaving Strangely\n\n"+creatures.show_notes()+"\n",encoding="utf-8"
    )
    # Update all direct audio references so podcast players and browsers won't
    # use stale cached pre-revision material under the same MP3 filename.
    for path in (ROOT/"index.html",ROOT/"dice-methods/index.html"):
        page=path.read_text(encoding="utf-8")
        for filename in sorted(p.name for p in AUDIO.glob("*.mp3")):
            if filename=="05-ten-minutes-to-disaster.mp3":
                continue
            pattern=re.escape(filename)+r"(?:\?revision=[A-Za-z0-9_-]+)?"
            page=re.sub(pattern,filename+"?revision="+VERSION,page)
        page=page.replace("subtle boundary cue","brief natural pause")
        page=page.replace("subtle boundary cues","brief natural pauses")
        page=page.replace("after a soft chime","from its beginning")
        path.write_text(page,encoding="utf-8")
    print("Prepared published landing pages with new audio revision URLs",flush=True)

def main():
    old=[p.name for p in AUDIO.glob("*.mp3")]
    assert len(old)==14,old
    d=json.loads(DICE.read_text())
    report=json.loads(REPORT.read_text())
    for n in (8,12):
        name=next(k for k,v in d["new_episodes"].items() if v["episode"]==n)
        row=next(r for r in report if r["episode"]==n)
        refine(n,name,d["new_episodes"][name],row)
    DICE.write_text(json.dumps(d,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    REPORT.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    rebuild_pages_and_feed()
    items=ET.parse(FEED).findall("./channel/item")
    assert len(items)==14
    for r in report:
        if 6<=r["episode"]<=13:
            assert abs(r["after"]["body_db"]-r["after"]["coda_db"])<4.5,r
    for it in items:
        enc=it.find("enclosure")
        name=enc.get("url").split("/")[-1].split("?")[0]
        assert (AUDIO/name).stat().st_size==int(enc.get("length"))
    print("PASS: complete saved 14-episode sound revision restored without any new speech synthesis",flush=True)

if __name__=="__main__":
    main()
