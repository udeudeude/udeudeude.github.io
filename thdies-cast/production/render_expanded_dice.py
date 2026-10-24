#!/usr/bin/env python3
"""Eight balanced dice editions: reuse existing Rubicon outcome audio, refresh narration.

Never overwrite the five original MP3s. Their statistically imperfect
prerecorded draws remain in the feed but are clearly described as archival.
New MP3s are independent episodes with distinct introductions and codas.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
import html
import json
import random
import subprocess
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_pilot_season as pilot
import render_balanced_dice as balanced

BASE=pilot.BASE
AUDIO=pilot.AUDIO
RATE=pilot.SAMPLE_RATE
SITE=pilot.SITE
DIRECTORY=BASE/"dice-methods"
NOTES=DIRECTORY/"show-notes"
D4D8D12={
    11:("D4 · Four Paths",4,90,20261023),
    12:("D8 · Eight Paths",8,45,20261024),
    13:("D12 · Twelve Paths",12,30,20261025),
}

# Read a seek instruction as a practical direction, not a slogan.
SEEK_SINGLE=(
    "Seek to a random point during the dice rolls. "
    "Ignore any number already in progress. "
    "Your roll is the next number you hear from its beginning."
)
SEEK_PAIR=(
    "Seek to a random point during the rolls. "
    "If a roll has already begun, disregard it. "
    "Wait for the next roll to begin, then use both dice and their sum."
)
SIGNATURE="I am Brother Rubicon. The die's cast."
SIGNATURE_BEAT=.32

def preference_opening(observation,method):
    return observation+" "+SIGNATURE+" "+method

INTRO={
 6: preference_opening(
    "No one here agrees upon the first rule of the game. They are quite certain of the last.",
    "Twenty faces, eighteen shuffled sets. Each set contains every number once. "+SEEK_SINGLE),
 7: preference_opening(
    "I have been asked whether chance can lie. I have never discovered that it speaks.",
    "Twenty faces, eighteen copies of each, shuffled together as one great set. "+SEEK_SINGLE),
 8: preference_opening(
    "In our oldest register, there is a place left for a name that has not yet been given. Beneath it is a number.",
    "Twenty faces. Every possible consecutive pair appears once in the complete circle. "+SEEK_SINGLE),
 9: preference_opening(
    "Our abbot keeps the keys, and I keep the tally. It is not certain which of us has the heavier duty.",
    "Two six-sided dice. All thirty-six possible pairs appear in each shuffle. I read both dice and their sum. "+SEEK_PAIR),
 10: preference_opening(
    "There is a road through the wood which appears upon no map. Nevertheless, the milestones are carefully numbered.",
    "One hundred possible numbers, shuffled in three complete sets. Every number appears three times. "+SEEK_SINGLE),
 11: preference_opening(
    "At the blackthorn, the road divides. Both ways are marked as the shorter.",
    "Four faces, ninety shuffled sets. "+SEEK_SINGLE),
 12: preference_opening(
    "There are hours appointed for prayer, for labor, and for rest. There is no appointed hour for chance.",
    "Eight faces, forty-five shuffled sets. "+SEEK_SINGLE),
 13: preference_opening(
    "In the oldest days, men cast lots to discover what they could not otherwise know. Some of their questions were better left unanswered.",
    "Twelve faces, thirty shuffled sets. "+SEEK_SINGLE)
}
CODAS={
 6: ["Twenty-one.", "No. The die has twenty faces. The extra number was not in the record yesterday."],
 7: ["The numbers are finished.", "That is not the order in which I left them."],
 8: ["Every possible pair has now met.", "One has asked not to be introduced again."],
 9: ["The first die has gone missing.", "The second insists that there was never another."],
 10:["I have numbered the doors from one to a hundred.", "The exit, naturally, has no number."],
 11:["There were four ways from the crossing.", "The fifth was discovered afterward."],
 12:["The bell has rung eight times.", "It has not yet stopped."],
 13:["I believe that was the last.", "I had been told there would be one more."]
}
PAUSE={n:.36 for n in range(6,14)}

EXTRA_NOTES={
 11:("D4: NINETY COMPLETE SHUFFLES OF FOUR\n"
     "Each of ninety blocks includes 1, 2, 3 and 4 once in randomized order. "
     "There are 360 five-second slots, exactly thirty minutes of results, and each "
     "face occurs ninety times: 90/360 = 25%. Equal slot durations give exact global "
     "outcome balance for uniform time sampling within the results section. "
     "Sequential results are not independent: no face repeats inside a block, "
     "although it can repeat across a block boundary."),
 12:("D8: FORTY-FIVE COMPLETE SHUFFLES OF EIGHT\n"
     "Each block contains every face 1 through 8 exactly once in randomized order. "
     "Forty-five blocks give 360 five-second result slots, thirty minutes total. "
     "Each face occurs exactly 45 times: 45/360 = 12.5%. This enforces outcome "
     "balance rather than independence of adjacent results. Seeking to approximate "
     "positions with a finger may not sample slots uniformly."),
 13:("D12: THIRTY COMPLETE SHUFFLES OF TWELVE\n"
     "Each block contains the faces 1 through 12 exactly once in randomized order. "
     "Thirty blocks yield 360 five-second slots, thirty minutes of results. "
     "Each face appears 30 times, for an ideal probability of 30/360 = 1/12 "
     "(about 8.33%) when choosing a slot uniformly. No result repeats within a "
     "twelve-slot block, unlike independent rolling.")
}

def make_specs():
    specs=[]
    for old in balanced.SPECS:
        s=dict(old)
        s["intro"]=INTRO[s["n"]]
        s["coda"]=CODAS[s["n"]]
        s["coda_pause"]=PAUSE[s["n"]]
        specs.append(s)
    for n,(title,sides,blocks,seed) in D4D8D12.items():
        specs.append({"n":n,"slug":f"d{sides}-balanced","title":title,
           "slot":5,"seed":seed,"category":f"d{sides}","method":"blocks",
           "sides":sides,"blocks":blocks,"intro":INTRO[n],
           "coda":CODAS[n],"coda_pause":PAUSE[n]})
    assert len(specs)==8 and sorted(s["n"] for s in specs)==list(range(6,14))
    return specs

SPECS=make_specs()

def build_sequence(spec):
    if spec["n"]<=10:
        result=balanced.sequence(spec)
    else:
        rnd=random.Random(spec["seed"])
        result=[]
        for _ in range(spec["blocks"]):
            bunch=list(range(1,spec["sides"]+1))
            rnd.shuffle(bunch)
            result.extend(bunch)
        assert len(result)==360
        assert Counter(result)==Counter({face:spec["blocks"] for face in range(1,spec["sides"]+1)})
        for i in range(0,len(result),spec["sides"]):
            assert set(result[i:i+spec["sides"]])==set(range(1,spec["sides"]+1))
    assert len(result)*spec["slot"] in (1800,2000)
    return result

def key(v):
    return tuple(v) if isinstance(v,(tuple,list)) else int(v)

def decoded_mono(mp3):
    cmd=["ffmpeg","-hide_banner","-loglevel","error","-i",str(mp3),
        "-ar",str(RATE),"-ac","1","-f","f32le","-"]
    pcm=subprocess.run(cmd,check=True,stdout=subprocess.PIPE).stdout
    out=np.frombuffer(pcm,dtype="<f4")
    assert out.size>RATE*1800,mp3
    assert np.isfinite(out).all()
    return out

def extract_existing_audio():
    """Read the source recordings once; choose one full slot per spoken result."""
    manifest=json.loads((BASE/"pilot-manifest.json").read_text())
    episodes=manifest["episodes"]
    sources={
        "d20":"01-d20.mp3",
        "2d6":"02-2d6.mp3",
        "d100":"03-d100.mp3"
    }
    caches={}
    for category,file in sources.items():
        print(f"Decoding existing spoken source: {file}",flush=True)
        raw=decoded_mono(AUDIO/file)
        m=episodes[file]
        slot_frames=int(m["slot_seconds"]*RATE)
        start_frame=round(m["intro_seconds"]*RATE)
        cached={}
        for i,v in enumerate(m["sampled_outcomes"]):
            k=key(v)
            if k in cached:continue
            a=start_frame+i*slot_frames
            segment=raw[a:a+slot_frames]
            assert len(segment)==slot_frames,(category,i,len(segment))
            cached[k]=np.array(segment,dtype=np.float32,copy=True)
        if category=="d20":
            assert len(cached)==20
        if category=="2d6":
            assert len(cached)==36, f"Expected all 36 ordered pairs: {len(cached)}"
            # All previously spoken results fit in the first five seconds of their
            # original six-second slot; trimming leaves the trailing second.
            assert m["max_spoken_result_seconds"]+.45<5
            cached={k:v[:5*RATE].copy() for k,v in cached.items()}
        if category=="d100":
            missing=set(range(1,101))-set(cached)
            print("D100 original pilot missing these six face sounds:",sorted(missing),flush=True)
            assert missing=={39,43,46,49,82,85},missing
        caches[category]=cached
        del raw
    return caches

def ensure_missing_100(voice,cache):
    missing=sorted(set(range(1,101))-set(cache))
    for number in missing:
        print("Synthesizing missing old D100 number",number,flush=True)
        sound=pilot.synthesize(voice,balanced.spoken_number(number))
        slot=np.zeros(6*RATE,dtype=np.float32)
        start=round(.45*RATE)
        assert start+len(sound)<len(slot)-RATE//3,(number,len(sound))
        slot[start:start+len(sound)]=sound
        cache[number]=slot
    assert len(cache)==100

def audio_caches(voice):
    cache=extract_existing_audio()
    ensure_missing_100(voice,cache["d100"])
    # Smaller dice reuse the same mastered D20 number samples. No need to
    # ask Kokoro to pronounce 'five' dozens more times.
    for n in (4,8,12):cache[f"d{n}"]=cache["d20"]
    return cache

def description(spec):
    if spec["n"]<=10:
        return balanced.DETAILS[spec["n"]]
    return EXTRA_NOTES[spec["n"]]

def show_notes(spec):
    return (f"{spec['title']} · Balanced dice method, episode {spec['n']}\n\n"
        +description(spec)+"\n\n"+balanced.COMMON+
        "\n\nThis version has its own Brother Rubicon opening observation and a "
        "distinct closing coda; both come from this production edition. The "
        "standard introduction is always: I am Brother Rubicon. The die's cast."
        "\n\nSpecific opening: "+spec["intro"]+
        "\n\nA closing remark follows the last valid result, but is not revealed here.")

def make_audio(voice,spec,values,samples):
    idx=spec["n"]
    filename=f"{idx:02d}-{spec['slug']}.mp3"
    # Preserve the exact spoken sentence as one utterance. A small beat
    # isolates it from both the episode-specific observation and instructions.
    assert spec["intro"].count(" "+SIGNATURE+" ")==1
    observation,instructions=spec["intro"].split(" "+SIGNATURE+" ",1)
    observation_audio=pilot.synthesize(voice,observation.strip())
    signature_audio=pilot.synthesize(voice,SIGNATURE)
    instruction_audio=pilot.synthesize(voice,instructions.strip())
    endings=[pilot.synthesize(voice,part) for part in spec["coda"]]
    wav=AUDIO/f"{idx:02d}-{spec['slug']}.tmp.wav"
    voice_cache=samples[spec["category"]]
    with pilot.sound_file(wav) as file:
        file.write(pilot.blank(.3))
        file.write(observation_audio)
        file.write(pilot.blank(SIGNATURE_BEAT))
        file.write(signature_audio)
        file.write(pilot.blank(SIGNATURE_BEAT))
        file.write(instruction_audio)
        file.write(pilot.blank(.65))
        outcome_start=file.frames/RATE
        for v in values:
            slot=voice_cache[key(v)]
            assert slot.size==RATE*spec["slot"],(idx,v,slot.size)
            file.write(slot)
        outcome_end=file.frames/RATE
        # No added silence between final time slot and the coda.
        coda_first=file.frames/RATE
        file.write(endings[0])
        file.write(pilot.blank(spec["coda_pause"]))
        file.write(endings[1])
        file.write(pilot.blank(.25))
    duration=pilot.emit_mp3(wav,AUDIO/filename)
    assert (AUDIO/filename).stat().st_size>1_000_000
    print("FINISHED",filename,round(duration,1),"seconds",flush=True)
    return {
        "episode":idx,"title":spec["title"],"filename":filename,
        "method":spec["method"],"category":spec["category"],"seed":spec["seed"],
        "outcome_count":len(values),"slot_seconds":spec["slot"],
        "results_start_seconds":round(outcome_start,3),
        "results_end_seconds":round(outcome_end,3),
        "results_duration_seconds":len(values)*spec["slot"],
        "postroll_pre_coda_pause_seconds":round(coda_first-outcome_end,6),
        "coda_text":spec["coda"],"coda_internal_pause_seconds":spec["coda_pause"],
        "spoken_intro_text":spec["intro"],
        "standard_intro":SIGNATURE,
        "signature_pause_before_seconds":SIGNATURE_BEAT,
        "signature_pause_after_seconds":SIGNATURE_BEAT,
        "total_seconds_approx":round(duration,3),
        "enclosure_bytes":(AUDIO/filename).stat().st_size,
        "ordered_outcomes":values,
        "full_show_notes_path":f"dice-methods/show-notes/{idx:02d}-{spec['slug']}.md"
    }

def mark_originals_as_archive(channel):
    """Keep original D20 current; archive only the unbalanced 2D6 and D100.

    Stable GUIDs preserve subscriptions. The episode title stays free of
    sequence numbers; <itunes:episode> carries ordering separately.
    """
    original={x.findtext("guid"):x for x in channel.findall("item")}
    for number in range(1,4):
        item=original[f"urn:thdies-cast:pilot:{number:02d}:v1"]
        title=item.find("title")
        description=item.find("description")
        assert title is not None and description is not None
        existing=description.text or ""
        # Remove any earlier generated archive prefix before updating; the
        # generator is idempotent across repeated publication.
        if existing.startswith("ARCHIVAL METHOD:"):
            existing=existing.split("\n\n",1)[1] if "\n\n" in existing else ""
        if number==1:
            title.text="D20 · Shuffled Sets"
            caveat=(
                "CURRENT BALANCED METHOD: Eighteen shuffled groups of twenty, "
                "with every D20 face appearing equally often. This is a fully "
                "valid seek-to-roll edition; successive rolls inside a group "
                "are not independent, which is explained in the method notes."
            )
            # No ARCHIVAL METHOD label, and no bonus flag.
            episode_type="full"
        elif number==2:
            title.text="2D6 · Archival Independent Draws"
            caveat=(
                "ARCHIVAL METHOD: The two dice were generated fairly and independently, "
                "but this fixed recording's result frequencies differ from the ideal "
                "2D6 distribution; in particular, the second die shows five "
                "75 times in 300 results. For seeking, prefer the balanced 2D6 edition."
            )
            episode_type="bonus"
        else:
            title.text="D100 · Archival Independent Draws"
            caveat=(
                "ARCHIVAL METHOD: Although the original numbers were generated "
                "uniformly, the recorded sequence omits 39, 43, 46, 49, 82 and 85. "
                "For seeking, prefer the balanced complete-shuffle D100 edition."
            )
            episode_type="bonus"
        description.text=caveat+"\n\n"+existing
        item.find("{http://www.itunes.com/dtds/podcast-1.0.dtd}episodeType").text=episode_type

def rss_append(records):
    feed=BASE/"feed.xml"
    ET.register_namespace("itunes","http://www.itunes.com/dtds/podcast-1.0.dtd")
    ET.register_namespace("atom","http://www.w3.org/2005/Atom")
    ET.register_namespace("content","http://purl.org/rss/1.0/modules/content/")
    tree=ET.parse(feed)
    channel=tree.getroot().find("channel")
    assert channel is not None
    for entry in list(channel.findall("item")):
        g=entry.findtext("guid") or ""
        if g.startswith("urn:thdies-cast:balanced:") or g.startswith("urn:thdies-cast:dice-methods:"):
            channel.remove(entry)
    originals=channel.findall("item")
    assert len(originals)==5,f"Expected five original episodes; got {len(originals)}"
    mark_originals_as_archive(channel)
    old_ids=[x.findtext("guid") for x in originals]
    def sub(parent,tag,text=None,attrs=None):
        e=ET.SubElement(parent,tag,attrs or {})
        if text is not None:e.text=str(text)
        return e
    # The series now has multiple audio-only versions of the same die.
    channel.find("description").text=(
        "Useful audio tools for tabletop games with Brother Rubicon. "
        "Thirteen audio episodes: balanced dice editions, encounter oracle, "
        "and a functional countdown. No companion app is required."
    )
    now=datetime.now(timezone.utc)
    for spec in sorted(SPECS,key=lambda s:s["n"],reverse=True):
        m=records[f"{spec['n']:02d}-{spec['slug']}.mp3"]
        item=ET.Element("item")
        sub(item,"title",f"{spec['title']} (balanced edition)")
        sub(item,"description",show_notes(spec))
        sub(item,"link",SITE+"dice-methods/#ep"+str(spec["n"]))
        sub(item,"guid",f"urn:thdies-cast:balanced:{spec['n']:02d}:v1",{"isPermaLink":"false"})
        sub(item,"pubDate",format_datetime(now-timedelta(minutes=13-spec["n"])))
        sub(item,"enclosure",attrs={
            "url":SITE+"audio/"+m["filename"],
            "length":str(m["enclosure_bytes"]),"type":"audio/mpeg"})
        sub(item,"{http://www.itunes.com/dtds/podcast-1.0.dtd}episode",str(spec["n"]))
        sub(item,"{http://www.itunes.com/dtds/podcast-1.0.dtd}season","1")
        sub(item,"{http://www.itunes.com/dtds/podcast-1.0.dtd}episodeType","full")
        sub(item,"{http://www.itunes.com/dtds/podcast-1.0.dtd}explicit","false")
        duration=int(m["total_seconds_approx"])
        sub(item,"{http://www.itunes.com/dtds/podcast-1.0.dtd}duration",
            f"{duration//3600:02}:{(duration//60)%60:02}:{duration%60:02}")
        channel.insert(list(channel).index(originals[0]),item)
    feed.write_bytes(ET.tostring(tree.getroot(),encoding="utf-8",xml_declaration=True))
    final=ET.parse(feed).findall("./channel/item")
    assert len(final)==13
    assert len({x.findtext("guid") for x in final})==13
    assert [x.findtext("guid") for x in final[8:]]==old_ids

def landing_page(records):
    blocks=[]
    for spec in SPECS:
        m=records[f"{spec['n']:02d}-{spec['slug']}.mp3"]
        label=html.escape(spec["title"])
        filename=html.escape(m["filename"])
        full=html.escape(description(spec)).replace("\n\n","</p><p>")
        blocks.append(f"""<article class="ep" id="ep{spec['n']}">
        <div class="n">DICE EDITION</div><h2>{label}</h2>
        <p>{m['outcome_count']} balanced outcomes · {m['results_duration_seconds']//60} minutes of results</p>
        <audio controls preload="none" src="../audio/{filename}"></audio>
        <p><a href="../audio/{filename}">Listen or download</a> · <a href="show-notes/{spec['n']:02d}-{spec['slug']}.md">Full written show notes</a></p>
        <details><summary>How this edition works</summary><p>{full}</p></details>
        </article>""")
    page="""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#18222a">
<title>Dice Editions · Th’die’s Cast</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% -10%,#394557,#151e28 62%);color:#f3ead7;font:16px/1.52 system-ui,-apple-system,sans-serif}
main{max-width:750px;margin:auto;padding:26px 16px 75px}
h1{font:normal clamp(2.25rem,8vw,3.8rem)/1.14 Georgia,serif;margin:9px 0 13px}
h2{font:normal 1.63rem Georgia,serif;margin:8px 0}a,summary{color:#e4c995;text-underline-offset:3px}
p{color:#c5c7ca}.ep{margin:13px 0;background:#ffffff0c;border:1px solid #ffffff36;border-radius:15px;padding:16px 18px}
.n{color:#d9bd8b;font-size:.76rem;font-weight:750;letter-spacing:.13em}audio{display:block;width:100%;height:44px;margin-top:12px}
details p{white-space:pre-wrap;font-size:.9rem}footer{margin-top:20px;color:#bbc1c6}
</style></head><body><main><div class="n">Th’die’s Cast · Brother Rubicon</div>
<h1>Dice, in Many Arrangements</h1>
<p>Eight complete balanced recordings: three D20 experiments, paired 2D6, D100, D4, D8 and D12. Every edition begins with a different observation, followed by <em>“I am Brother Rubicon. The die’s cast.”</em> Each has a distinct final remark, and no roll is a separate chapter.</p>
<p><a href="../feed.xml">Subscribe to the audio podcast feed</a> · <a href="../">Original five episodes</a></p>
"""+''.join(blocks)+"""
<footer><p>The original D20 remains a current balanced edition. Only the original 2D6 and D100 are marked archival. Use the complete functional portion for seeking; hand-operated podcast scrubbers are not guaranteed to sample uniformly.</p></footer>
</main><script>document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{if(b!==a)b.pause()})))</script></body></html>"""
    (DIRECTORY/"index.html").write_text(page,encoding="utf-8")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--check-only",action="store_true")
    args=parser.parse_args()
    sequences={}
    for spec in SPECS:
        seq=build_sequence(spec)
        sequences[spec["n"]]=seq
        assert len(seq)*spec["slot"] in (1800,2000)
        print("CHECK",spec["n"],spec["category"],len(seq),"slots",flush=True)
    if args.check_only:return
    pilot.ffmpeg_exists()
    from kokoro import KPipeline
    voice=KPipeline(lang_code="b")
    caches=audio_caches(voice)
    AUDIO.mkdir(parents=True,exist_ok=True)
    NOTES.mkdir(parents=True,exist_ok=True)
    output={}
    for spec in SPECS:
        seq=sequences[spec["n"]]
        result=make_audio(voice,spec,seq,caches)
        output[result["filename"]]=result
        (NOTES/f"{spec['n']:02d}-{spec['slug']}.md").write_text(
            "# "+spec["title"]+"\n\n"+show_notes(spec)+"\n",encoding="utf-8")
    (DIRECTORY/"manifest.json").write_text(json.dumps({
        "series":"Th’die’s Cast",
        "production_date":"2026-10-23",
        "narrator":"Brother Rubicon",
        "voice_model":"Kokoro bm_lewis",
        "voice_treatment":pilot.SAVED_02,
        "method":"New intros and endings with re-used original Rubicon roll sounds",
        "new_episodes":output,
        "source_pilot_manifest":"../pilot-manifest.json"
    },indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    rss_append(output)
    landing_page(output)
    assert len(ET.parse(BASE/"feed.xml").findall("./channel/item"))==13
    print("READY eight new balanced audio episodes and 13-entry RSS",flush=True)

if __name__=="__main__":
    main()
