#!/usr/bin/env python3
"""Replace the old Wilderness Oracle opening which mistakenly tells users to wait for a chime.

Operate on the verified 80-scene chime-free existing MP3. Preserve every scene
and closing coda, shift published timeline metadata, and re-encode without
dynamic loudness normalization. Must run after revise-thdies-audio succeeds.
"""
from __future__ import annotations

import json
import math
import re
import subprocess
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np

import render_pilot_season as pilot
import remaster_library as remaster
import audit_audio_levels as levels

ROOT=pilot.BASE
AUDIO=pilot.AUDIO
RATE=pilot.SAMPLE_RATE
MP3=AUDIO/"04-wilderness-oracle.mp3"
MANIFEST=ROOT/"pilot-manifest.json"
FEED=ROOT/"feed.xml"
PAGE=ROOT/"index.html"
REVISION="20261024c"
OPENING="Some paths through a wood have not been walked for centuries. They are seldom overgrown."
SIGNATURE="I am Brother Rubicon. The die's cast."
INSTRUCTION=(
    "This is the Wilderness Oracle. Seek to a random point during the encounters. "
    "If a scene is already in progress, ignore it. "
    "Your encounter is the next complete one you hear from its beginning."
)

def main():
    data=json.loads(MANIFEST.read_text(encoding="utf-8"))
    record=data["episodes"][MP3.name]
    assert record["encounters"]==80 and record["neutral_chimes"]==0
    assert len(record["boundary_times_seconds"])==80
    assert not record.get("new_chime_free_intro")
    previous=remaster.decode_mp3(MP3)
    oldfirst=float(record["first_boundary_seconds"])
    assert oldfirst>10
    from kokoro import KPipeline
    voice=KPipeline(lang_code='b')
    utterances=[
        pilot.synthesize(voice,OPENING),
        pilot.synthesize(voice,SIGNATURE),
        pilot.synthesize(voice,INSTRUCTION)
    ]
    # Level match the new introduction against scene speech. No global dynamics
    # processing; the true game segments and original coda are kept intact.
    reference=levels.active_voice_db(previous[round(oldfirst*RATE):round((oldfirst+70)*RATE)])
    for i,u in enumerate(utterances):
        db=levels.active_voice_db(u)
        difference=max(-4.0,min(5.0,reference-db))
        peak=max(float(np.max(np.abs(u))),1e-5)
        if difference>0:difference=min(difference,20*math.log10(.90/peak))
        utterances[i]=np.asarray(u*10**(difference/20),dtype=np.float32)
    prefix=np.concatenate([
        pilot.blank(.3),utterances[0],pilot.blank(.32),
        utterances[1],pilot.blank(.32),utterances[2],pilot.blank(.65)
    ])
    first=len(prefix)/RATE
    untouched=previous[round(oldfirst*RATE):]
    composite=np.concatenate([prefix,untouched])
    length=remaster.write_mp3(MP3,composite)
    change=first-oldfirst
    record["first_boundary_seconds"]=round(first,3)
    record["boundary_times_seconds"]=[round(t+change,3) for t in record["boundary_times_seconds"]]
    record["last_encounter_ends_seconds"]=round(record["last_encounter_ends_seconds"]+change,3)
    record["total_seconds_approx"]=round(length,3)
    record["new_chime_free_intro"]=True
    record["spoken_intro_text"]=OPENING+" "+SIGNATURE+" "+INSTRUCTION
    MANIFEST.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

    tree=ET.parse(FEED)
    ns="{http://www.itunes.com/dtds/podcast-1.0.dtd}"
    ET.register_namespace("itunes","http://www.itunes.com/dtds/podcast-1.0.dtd")
    ET.register_namespace("atom","http://www.w3.org/2005/Atom")
    items=tree.findall("./channel/item")
    assert len(items) in (14,15)
    found=[i for i in items if i.findtext("guid")=="urn:thdies-cast:pilot:04:v1"]
    assert len(found)==1
    item=found[0]
    enc=item.find("enclosure")
    assert enc is not None
    enc.set("length",str(MP3.stat().st_size))
    enc.set("url",pilot.SITE+"audio/"+MP3.name+"?revision="+REVISION)
    dur=int(length)
    durtag=item.find(ns+"duration")
    assert durtag is not None
    durtag.text=f"{dur//3600:02}:{(dur//60)%60:02}:{dur%60:02}"
    description=item.find("description")
    assert description is not None
    description.text=("Eighty independent wilderness encounters, from quiet peculiarities to "
      "impossible discoveries. Seek to a random point during the encounters. "
      "If one is already underway, listen for the next complete scene.")
    tree.write(FEED,encoding="utf-8",xml_declaration=True)

    # Page links must point to new enclosure revision so caches do not serve
    # the outdated chime-related spoken instructions.
    page=PAGE.read_text(encoding="utf-8")
    page=re.sub(r"04-wilderness-oracle\.mp3(?:\?revision=[\w-]+)?",
                "04-wilderness-oracle.mp3?revision="+REVISION,page)
    PAGE.write_text(page,encoding="utf-8")
    assert len(record["boundary_times_seconds"])==80
    assert MP3.stat().st_size>300000
    assert oldfirst!=first
    assert "chime" not in description.text.lower()
    print(f"WILDERNESS INTRO FIXED: start {oldfirst:.2f} -> {first:.2f}, duration {length:.1f}s",flush=True)

if __name__=="__main__":
    main()
