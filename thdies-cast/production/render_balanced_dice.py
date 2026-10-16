#!/usr/bin/env python3
"""Reproducible five-episode probability-method audition season.

Existing Th'die's Cast episodes 01–05 are retained. These new recordings are
clearly labeled auditions (06–10) and added to the current podcast RSS.
The user has not yet chosen a permanent Brother Rubicon introduction.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
import html
import json
import random
import re
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_pilot_season as pilot

BASE=pilot.BASE
AUDIO=pilot.AUDIO
DIR=BASE/"dice-methods"
SHOW_NOTES=DIR/"show-notes"
SITE=pilot.SITE
RATE=pilot.SAMPLE_RATE
SPOKEN_TITLE=pilot.SPOKEN_TITLE

SPECS=[
    {"n":6,"slug":"d20-shuffled-sets","title":"D20 · Shuffled Sets",
     "slot":5,"seed":20261016,"category":"d20","method":"blocks",
     "intro":"The die's cast. D twenty, shuffled sets. Each group of twenty results contains every face exactly once. Seek into the rolls; use the next complete number.",
     "coda":["Twenty-one.","No. The die has twenty faces. I was wondering whether you were still here."],
     "coda_pause":0.32},
    {"n":7,"slug":"d20-giant-shuffle","title":"D20 · One Giant Shuffle",
     "slot":5,"seed":20261017,"category":"d20","method":"giant",
     "intro":"The die's cast. D twenty, one giant shuffle. Eighteen copies of each face, mixed throughout the recording. Immediate repeats are possible. Take the next complete number.",
     "coda":["If a number has visited twice, there is no cause for alarm.","Perhaps it liked you the first time."],
     "coda_pause":0.36},
    {"n":8,"slug":"d20-pair-balanced","title":"D20 · Every Possible Pair",
     "slot":5,"seed":20261018,"category":"d20","method":"pairs",
     "intro":"The die's cast. D twenty, every possible pair. Each of the four hundred ordered pairs occurs once in this circular sequence. Seek to the next complete number.",
     "coda":["Every possible pair has now met.","Even twenty and twenty. That was a rather brief conversation."],
     "coda_pause":0.4},
    {"n":9,"slug":"2d6-balanced","title":"2D6 · Thirty-Six Possibilities",
     "slot":5,"seed":20261019,"category":"2d6","method":"blocks",
     "intro":"The die's cast. Two six-sided dice. Every ordered pair appears once in each shuffled group of thirty-six. I shall read both dice, then their sum. Take the next complete roll.",
     "coda":["The first die claims it did all the work.","The second die would like that put on the record."],
     "coda_pause":0.42},
    {"n":10,"slug":"d100-balanced","title":"D100 · Three Complete Shuffles",
     "slot":6,"seed":20261020,"category":"d100","method":"blocks",
     "intro":"The die's cast. D one hundred, three complete shuffles. Every number from one through one hundred appears exactly three times. Seek to the next complete result.",
     "coda":["I have numbered the doors from one to a hundred.","The exit, naturally, has no number."],
     "coda_pause":0.38},
]
assert len(SPECS)==5 and len({s['n'] for s in SPECS})==5

COMMON=(
    "HOW TO USE THIS AUDIO DIE\n"
    "Seek somewhere inside the numbered-result portion, not the introductory or closing words. "
    "Ignore a clipped result and use the next result spoken fully, with each result occupying an equal-length time slot. "
    "If playback reaches the coda instead of another complete roll, seek back to the first numbered result. "
    "A fair timeline sample means each time slot has the same chance of being selected; "
    "ordinary finger-driven scrubbing is not guaranteed to produce uniformly random seek times.\n\n"
    "FAIRNESS VERSUS INDEPENDENCE\n"
    "This is a prerecorded deterministic sequence, not a source of fresh live randomness. "
    "Exact balanced frequencies guarantee fair outcomes for a uniformly chosen time slot, "
    "but a continuous run of results need not have the independence of fresh dice throws. "
    "If each playback position is independently sampled uniformly over the result region, "
    "those sampled outcomes are independent despite the fixed recording. "
    "All experiments use fixed, documented pseudorandom seeds and can be reconstructed.\n\n"
    "PRODUCTION\n"
    "Narrated by Brother Rubicon using Kokoro's Lewis voice with the producer-selected Saved 02 "
    "treatment. The spoken introductions are intentionally brief, provisional explanations "
    "of the methods; the permanent character introduction has not been chosen. "
    "A distinct whimsical closing coda follows the last valid roll, without a long silence. "
    "The coda is not an outcome."
)

DETAILS={
  6:(
    "METHOD: EIGHTEEN SHUFFLED SETS\n"
    "The numbers 1–20 are shuffled separately 18 times. Each 20-result block therefore "
    "contains every face once, and each face appears exactly 18 times in the full set of "
    "360 five-second time slots (30:00 of results). For uniformly selected time slots, "
    "each face has exactly 18/360 = 1/20 = 5% probability.\n\n"
    "Sequential caveat: no result repeats inside its 20-result block; only a block boundary "
    "can have adjacent equal faces. This is NOT a succession of independent D20 rolls. "
    "Comparing against the giant shuffle and pair-balanced editions shows what that constraint does."
  ),
  7:(
    "METHOD: ONE GIANT BALANCED SHUFFLE\n"
    "Start with 18 copies of every face 1–20, yielding 360 positions; shuffle the entire "
    "360-entry pool just once. Each face still appears exactly 18 times, and a uniformly chosen "
    "time slot has a 5% chance of producing any given face. Unlike the 20-result blocks, "
    "identical values can occur consecutively anywhere, so it feels more like ordinary rolls.\n\n"
    "Sequential caveat: once outcomes are selected from a finite pool, remaining frequencies "
    "change. Adjacent results are not mathematically independent; pairs are not deliberately "
    "balanced either. Global equality, not local independence, is what is guaranteed."
  ),
  8:(
    "METHOD: ORDER-TWO DE BRUIJN / RANDOMIZED EULERIAN CIRCUIT\n"
    "Construct a circular sequence of 400 results from an Eulerian traversal of a directed "
    "graph with one edge for each ordered pair of D20 faces (20 × 20 = 400). "
    "Every possible ordered consecutive pair, including doubles such as 7→7, appears exactly "
    "once as the sequence wraps from its last result back to its first. Each individual face "
    "therefore occurs exactly 20 times; its probability on a uniformly sampled time slot is "
    "20/400 = 5%. Four hundred slots at five seconds total 33:20 of dice results.\n\n"
    "The pair guarantee is *cyclic*: the final→first pair counts mathematically, but ordinary "
    "file playback passes through the closing coda and introduction instead of jumping directly "
    "from the last number to the first. To inspect that pair, skip the spoken material on repeat. "
    "The construction balances all two-roll patterns, not three-roll patterns, and still isn't "
    "a source of fresh independent randomness."
  ),
  9:(
    "METHOD: TEN SHUFFLES OF ALL THIRTY-SIX ORDERED 2D6 PAIRS\n"
    "Two distinguishable six-sided dice have 6 × 6 = 36 equally likely ordered pairs: "
    "(1,2) and (2,1) are different pairs although they have the same sum. "
    "Shuffle all 36 ordered pairs independently for each of ten blocks. That gives "
    "360 results occupying five seconds apiece, or 30:00 of functional audio. "
    "The narrator says the first die, the second die, and then the sum.\n\n"
    "Each ordered pair appears exactly ten times. The sums 2–12 therefore occur "
    "10, 20, 30, 40, 50, 60, 50, 40, 30, 20, 10 times respectively. "
    "Their probabilities are 1,2,3,4,5,6,5,4,3,2,1 divided by 36. "
    "Seven is six times as likely as two or twelve, as it should be. "
    "Within a 36-pair block, the same ordered pair cannot repeat, but the same sum can. "
    "Consequently, the result sequence is balanced, not sequentially independent."
  ),
  10:(
    "METHOD: THREE SHUFFLED COMPLETE SETS OF ONE HUNDRED\n"
    "Shuffle 1–100 independently three times and concatenate those permutations. "
    "This gives 300 six-second result slots, exactly 30:00 of outcomes. "
    "Every integer 1–100 occurs exactly three times in the full recording, "
    "so a uniformly selected time slot produces any particular value with probability "
    "3/300 = 1/100 = 1%. One hundred is a valid result; zero is not.\n\n"
    "Within each 100-value set no number repeats. A repeated value may occur at "
    "a boundary between sets. That restriction differs from independent live D100 throws, "
    "but unlike the previous 300-independent-draw D100 pilot, this balanced edition "
    "cannot omit any of its 100 faces."
  )
}

def debruijn_pairs(seed:int):
    """Randomized Eulerian circuit on the 20-node complete directed graph."""
    rng=random.Random(seed)
    outgoing={}
    for a in range(1,21):
        edges=list(range(1,21))
        rng.shuffle(edges)
        outgoing[a]=edges
    path=[rng.randint(1,20)]
    circuit=[]
    while path:
        v=path[-1]
        if outgoing[v]:
            path.append(outgoing[v].pop())
        else:
            circuit.append(path.pop())
    circuit.reverse()
    assert len(circuit)==401 and circuit[0]==circuit[-1]
    seq=circuit[:-1]
    ordered=[(seq[i],seq[(i+1)%len(seq)]) for i in range(len(seq))]
    assert len(set(ordered))==400
    assert set(ordered)=={(a,b) for a in range(1,21) for b in range(1,21)}
    assert Counter(seq)==Counter({n:20 for n in range(1,21)})
    return seq

def sequence(spec):
    rng=random.Random(spec["seed"])
    cat=spec["category"]
    if spec["method"]=="pairs":
        values=debruijn_pairs(spec["seed"])
    elif cat=="d20":
        if spec["method"]=="blocks":
            values=[]
            for _ in range(18):
                block=list(range(1,21))
                rng.shuffle(block)
                values.extend(block)
        elif spec["method"]=="giant":
            values=[n for n in range(1,21) for _ in range(18)]
            rng.shuffle(values)
        else:raise ValueError(spec)
    elif cat=="2d6":
        values=[]
        possibilities=[(x,y) for x in range(1,7) for y in range(1,7)]
        for _ in range(10):
            block=list(possibilities)
            rng.shuffle(block)
            values.extend(block)
    elif cat=="d100":
        values=[]
        for _ in range(3):
            block=list(range(1,101))
            rng.shuffle(block)
            values.extend(block)
    else:raise ValueError(cat)
    verify_sequence(spec,values)
    return values

def verify_sequence(spec,values):
    cat=spec["category"]
    if cat=="d20":
        expected=Counter({n:(20 if spec["method"]=="pairs" else 18) for n in range(1,21)})
        assert Counter(values)==expected
        if spec["method"]=="blocks":
            assert len(values)==360
            for i in range(0,360,20):
                assert set(values[i:i+20])==set(range(1,21))
        if spec["method"]=="pairs":
            assert len(values)==400
            pairs={(values[i],values[(i+1)%400]) for i in range(400)}
            assert len(pairs)==400
            assert pairs=={(x,y) for x in range(1,21) for y in range(1,21)}
    elif cat=="2d6":
        assert len(values)==360
        expected=Counter({(a,b):10 for a in range(1,7) for b in range(1,7)})
        assert Counter(values)==expected
        for i in range(0,len(values),36):
            assert set(values[i:i+36])==set(expected)
        counts=Counter(a+b for a,b in values)
        assert [counts[n] for n in range(2,13)]==[10,20,30,40,50,60,50,40,30,20,10]
    else:
        assert cat=="d100"
        assert len(values)==300 and Counter(values)==Counter({n:3 for n in range(1,101)})
        for i in range(0,300,100):
            assert set(values[i:i+100])==set(range(1,101))
    assert len(values)*spec["slot"] in (1800,2000)

def spoken_number(v):
    if v<=20:return pilot.WORDLIST[v].capitalize()+"."
    if v==100:return "One hundred."
    tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
    return (tens[v//10]+(" "+pilot.WORDLIST[v%10] if v%10 else "")).capitalize()+"."

def phrase(spec,v):
    if spec["category"]=="2d6":
        a,b=v
        return f"{pilot.WORDLIST[a].capitalize()}. {pilot.WORDLIST[b].capitalize()}. Total {pilot.WORDLIST[a+b]}."
    return spoken_number(v)

def notes(spec):
    return (
        f"{spec['title']} | Probability methods audition {spec['n'] - 5} of five\n\n"
        + DETAILS[spec["n"]]+"\n\n"+COMMON
    )

def build_one(voice,spec,values,voice_cache):
    number=spec["n"]
    name=f"{number:02d}-{spec['slug']}.mp3"
    intro=pilot.synthesize(voice,spec["intro"])
    coda=[pilot.synthesize(voice,part) for part in spec["coda"]]
    padding=.48
    last_gap=.22
    max_voice=max(len(voice_cache[v])/RATE for v in set(values))
    assert max_voice + padding + last_gap < spec["slot"],f"{name}: voice too long {max_voice}"
    wav=AUDIO/f"{number:02d}-{spec['slug']}.tmp.wav"
    with pilot.sound_file(wav) as target:
        target.write(pilot.blank(.25))
        target.write(intro)
        target.write(pilot.blank(.8))
        results_start=target.frames/RATE
        for i,v in enumerate(values):
            frame=pilot.blank(spec["slot"])
            speech=voice_cache[v]
            first=round(padding*RATE)
            frame[first:first+len(speech)]=speech
            target.write(frame)
            if i and i%100==0:
                print(f"Audio {number}: {i}/{len(values)} slots",flush=True)
        results_end=target.frames/RATE
        # No 5- or 6-second silence before the joke. A tiny natural beat only.
        target.write(pilot.blank(.34))
        coda_start=target.frames/RATE
        target.write(coda[0])
        target.write(pilot.blank(spec["coda_pause"]))
        target.write(coda[1])
        target.write(pilot.blank(.25))
        duration=target.frames/RATE
    final_duration=pilot.emit_mp3(wav,AUDIO/name)
    meta={
        "episode":number,
        "filename":name,
        "title":spec["title"],
        "method":spec["method"],
        "category":spec["category"],
        "seed":spec["seed"],
        "slot_seconds":spec["slot"],
        "outcome_count":len(values),
        "results_start_seconds":round(results_start,3),
        "first_result_audio_start_seconds":round(results_start+padding,3),
        "results_end_seconds":round(results_end,3),
        "results_duration_seconds":len(values)*spec["slot"],
        "first_coda_audio_start_seconds":round(coda_start,3),
        "postroll_pre_coda_pause_seconds":.34,
        "coda_text":spec["coda"],
        "coda_internal_pause_seconds":spec["coda_pause"],
        "total_seconds_approx":round(final_duration,3),
        "intro_text":spec["intro"],
        "intro_is_provisional":True,
        "ordered_outcomes":values,
        "max_voice_seconds":round(max_voice,3),
        "enclosure_bytes":(AUDIO/name).stat().st_size,
        "full_show_notes_path":f"dice-methods/show-notes/{number:02d}-{spec['slug']}.md",
    }
    print(f"Completed {spec['title']}: {final_duration:.2f} sec, {meta['enclosure_bytes']} bytes",flush=True)
    assert coda_start-results_end<.5
    return meta

def append_to_feed(records):
    ns_itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
    ns_atom="http://www.w3.org/2005/Atom"
    ns_content="http://purl.org/rss/1.0/modules/content/"
    ET.register_namespace("itunes",ns_itunes)
    ET.register_namespace("atom",ns_atom)
    ET.register_namespace("content",ns_content)
    source=BASE/"feed.xml"
    root=ET.parse(source).getroot()
    channel=root.find("channel")
    assert channel is not None
    original=list(channel.findall("item"))
    assert len(original)>=5
    for item in original:
        if (item.findtext("guid") or "").startswith("urn:thdies-cast:dice-methods:"):
            channel.remove(item)
    base_items=list(channel.findall("item"))
    assert len(base_items)==5, "Refuse to lose original five episodes"
    desc=channel.find("description")
    if desc is not None:
        desc.text=("Useful audio tools for tabletop games, hosted by Brother Rubicon: "
            "five original pilot episodes plus five probability-method auditions. "
            "Use at the table through any podcast player; no companion app required.")
    def sub(parent,tag,text=None,attrs=None):
        el=ET.SubElement(parent,tag,attrs or {})
        if text is not None:el.text=str(text)
        return el
    for spec in reversed(SPECS):
        filename=f"{spec['n']:02d}-{spec['slug']}.mp3"
        m=records[filename]
        note=notes(spec)
        item=ET.Element("item")
        sub(item,"title",f"Bonus {spec['n']:02d} · {spec['title']} (method audition)")
        sub(item,"description",note)
        sub(item,"link",SITE+"dice-methods/#ep"+str(spec["n"]))
        sub(item,"guid",f"urn:thdies-cast:dice-methods:{spec['n']:02d}:v1",{"isPermaLink":"false"})
        sub(item,"pubDate",format_datetime(datetime(2026,10,16,12,0,tzinfo=timezone.utc)+timedelta(minutes=spec["n"])))
        sub(item,"enclosure",attrs={
            "url":SITE+"audio/"+filename,
            "length":str(m["enclosure_bytes"]),
            "type":"audio/mpeg"})
        sub(item,f"{{{ns_itunes}}}episode",str(spec["n"]))
        sub(item,f"{{{ns_itunes}}}season","1")
        sub(item,f"{{{ns_itunes}}}episodeType","bonus")
        sub(item,f"{{{ns_itunes}}}explicit","false")
        secs=int(m["total_seconds_approx"])
        sub(item,f"{{{ns_itunes}}}duration",f"{secs//3600:02}:{(secs//60)%60:02}:{secs%60:02}")
        rich=(
            "<p>"+html.escape(DETAILS[spec["n"]].replace("\n\n","</p><p>"))+"</p>"
            "<p>"+html.escape(COMMON.replace("\n\n","</p><p>"))+"</p>"
        )
        sub(item,f"{{{ns_content}}}encoded",rich)
        channel.insert(list(channel).index(base_items[0]),item)
    source.write_bytes(ET.tostring(root,encoding="utf-8",xml_declaration=True))
    check=ET.parse(source)
    items=check.findall("./channel/item")
    assert len(items)==10
    assert len({e.findtext("guid") for e in items})==10
    assert [x.findtext("guid") for x in items[5:]]==[x.findtext("guid") for x in base_items]

def landing(records):
    cards=[]
    for spec in SPECS:
        name=f"{spec['n']:02d}-{spec['slug']}.mp3"
        meta=records[name]
        duration=meta["total_seconds_approx"]
        note=html.escape(DETAILS[spec["n"]]).replace("\n\n","</p><p>").replace("\n"," ")
        cards.append(f"""
        <section class="episode" id="ep{spec['n']}">
          <div class="num">BONUS {spec['n']:02d}</div>
          <h2>{html.escape(spec['title'])}</h2>
          <p><strong>{meta['outcome_count']} outcomes</strong> · {meta['results_duration_seconds']//60}m {meta['results_duration_seconds']%60:02d}s of rolls · {duration/60:.1f}m total</p>
          <audio controls preload="none" src="../audio/{name}"></audio>
          <p><a href="../audio/{name}">Open or save MP3</a> · <a href="show-notes/{spec['n']:02d}-{spec['slug']}.md">Detailed show notes</a></p>
          <details><summary>Why this arrangement?</summary><p>{note}</p></details>
        </section>""")
    page="""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Five Dice Methods · Th’die’s Cast</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at 40% -10%,#3a4453,#181d27 65%);color:#f3eee4;font:16px/1.56 system-ui,-apple-system,sans-serif}
main{max-width:750px;margin:auto;padding:28px 16px 75px}
h1{font:normal clamp(2.1rem,8vw,3.8rem) Georgia,serif;line-height:1.1;margin:7px 0 15px}
h2{font:normal 1.7rem Georgia,serif;margin:5px 0}.kicker,.num{color:#e0c897;text-transform:uppercase;letter-spacing:.1em;font-size:.8rem;font-weight:750}
p{color:#c9c9c7}a{color:#e0c897;text-underline-offset:3px}.episode{padding:21px 19px;margin:17px 0;background:#ffffff0b;border:1px solid #ffffff36;border-radius:16px}
audio{display:block;width:100%;height:45px;margin:17px 0 6px}summary{cursor:pointer;color:#e0c897}
details p{font-size:.93rem}footer{margin-top:28px;font-size:.85rem}
</style></head><body><main>
<div class="kicker">Th’die’s Cast · Brother Rubicon · Production auditions</div>
<h1>Five ways of listening to chance</h1>
<p>Three different mathematical recordings for D20, then balanced 2D6 and D100. The exposition is short in the audio; each episode’s RSS show notes give the full mathematical explanation. The endings are unique and begin right after the actual results, with no long silent interlude.</p>
<p><a href="../feed.xml">Subscribe to the existing podcast feed</a> · <a href="../">Original five pilots</a></p>
"""+"".join(cards)+"""
<footer><p>These are method auditions, not final edits of the original episodes. The upcoming Brother Rubicon character-introduction choice is deliberately not committed to these drafts. Uniformly sampled seek times within the roll segment are necessary for exact timeline fairness.</p></footer>
</main><script>document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{if(b!==a)b.pause()})))</script></body></html>"""
    (DIR/"index.html").write_text(page,encoding="utf-8")

def preflight():
    sequences={}
    for spec in SPECS:
        values=sequence(spec)
        sequences[spec["n"]]=values
        print(f"VALIDATED {spec['n']} {spec['title']}: {len(values)} slots, {len(values)*spec['slot']} seconds",flush=True)
    return sequences

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--check-only",action="store_true",help="Verify every numerical construction without audio")
    args=cli.parse_args()
    sequences=preflight()
    if args.check_only:return
    pilot.ffmpeg_exists()
    from kokoro import KPipeline
    AUDIO.mkdir(parents=True,exist_ok=True)
    DIR.mkdir(parents=True,exist_ok=True)
    SHOW_NOTES.mkdir(parents=True,exist_ok=True)
    voice=KPipeline(lang_code='b')
    voices={}
    for cat in ("d20","2d6","d100"):
        spec=next(s for s in SPECS if s["category"]==cat)
        all_values=set(v for s in SPECS if s["category"]==cat for v in sequences[s["n"]])
        cached={}
        print("Synthesizing",cat,len(all_values),"distinct spoken results",flush=True)
        for k,v in enumerate(sorted(all_values),1):
            if k%15==1:print("Phrase",cat,k,"of",len(all_values),flush=True)
            cached[v]=pilot.synthesize(voice,phrase(spec,v))
        voices[cat]=cached
    metadata={}
    for spec in SPECS:
        name=f"{spec['n']:02d}-{spec['slug']}.mp3"
        metadata[name]=build_one(voice,spec,sequences[spec["n"]],voices[spec["category"]])
        (SHOW_NOTES/f"{spec['n']:02d}-{spec['slug']}.md").write_text(
            "# "+spec["title"]+"\n\n"+notes(spec)+"\n",encoding='utf-8')
    obj={
        "series":"Th’die’s Cast",
        "production":"five independent probability-method auditions, 2026-10-16",
        "narrator":"Brother Rubicon",
        "source_voice":"Kokoro bm_lewis",
        "voice_treatment":pilot.SAVED_02,
        "narrator_intro_status":"provisional method-specific intros; user has been offered 10 character-introduction alternatives",
        "episodes":metadata,
        "original_pilot_feed":SITE+"feed.xml",
        "global_note":"Fixed-time slot fairness assumes independent uniformly selected seeking within result segments; scripted playback sequences are not independent draws."
    }
    (DIR/"manifest.json").write_text(json.dumps(obj,indent=2,ensure_ascii=False)+"\n",encoding='utf-8')
    append_to_feed(metadata)
    landing(metadata)
    assert (DIR/"index.html").stat().st_size>1000
    assert len(ET.parse(BASE/"feed.xml").findall("./channel/item"))==10
    print("READY: five balanced method auditions added to existing RSS",flush=True)

if __name__=="__main__":
    main()
