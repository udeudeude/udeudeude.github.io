#!/usr/bin/env python3
"""Publish the approved Creatures Behaving Strangely audio oracle.

Reuses the original Th'die's Cast Kokoro Lewis synthesis and mastering pipeline.
Eighty independent scenes are separated by short natural pauses without sound cues.
Does not touch earlier MP3s or reveal the ending in public show notes.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from email.utils import format_datetime
import hashlib
import html
import json
import math
import re
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np

import render_pilot_season as pilot

ROOT = pilot.BASE
AUDIO = pilot.AUDIO
RATE = pilot.SAMPLE_RATE
SOURCE = ROOT / "production" / "creatures_behaving_strangely.md"
MP3 = AUDIO / "14-creatures-behaving-strangely.mp3"
MANIFEST = ROOT / "creatures-manifest.json"
NOTES = ROOT / "creatures-behaving-strangely.md"
FEED = ROOT / "feed.xml"
PAGE = ROOT / "index.html"
GUID = "urn:thdies-cast:encounters:14:v1"
TITLE = "Creatures Behaving Strangely"
IDENTITY = "I am Brother Rubicon. The die's cast."
PAUSE = 0.32
INSTRUCTION = (
    "Seek to a random point during the encounters. "
    "Ignore any encounter already in progress. "
    "Your encounter is the next complete scene you hear from its beginning. "
    "If you reach the end, return to the first encounter after the introduction."
)

def manuscript():
    txt = SOURCE.read_text(encoding="utf-8")
    entries = [
        (int(n), title.strip(), " ".join(prose.strip().split()))
        for n, title, prose in re.findall(
            r"(?ms)^### (\d\d) \| ([^\n]+)\n(.*?)(?=^### \d\d \||\Z)", txt
        )
    ]
    assert len(entries) == 80, f"Expected 80 encounters, found {len(entries)}"
    assert [n for n, _, _ in entries] == list(range(1, 81))
    assert len(set(t for _, t, _ in entries)) == 80
    assert all(20 <= len(p.split()) <= 95 for _, _, p in entries)
    assert all("[" not in p and "]" not in p for _, _, p in entries)
    opening = re.search(r"(?m)^\*\*Opening observation:\*\* (.+)$", txt)
    closing = re.search(r"(?m)^\*\*Closing coda \(not an encounter\):\*\* (.+)$", txt)
    assert opening and closing, "Explicit approved opening and ending required"
    assert IDENTITY not in opening.group(1)
    return entries, opening.group(1).strip(), closing.group(1).strip(), hashlib.sha256(txt.encode()).hexdigest()

def seconds_format(seconds):
    t = round(seconds)
    return f"{t//3600:02}:{(t//60)%60:02}:{t%60:02}"

def make_record(voice, entries, opening, closing, source_hash):
    AUDIO.mkdir(parents=True, exist_ok=True)
    pilot.ffmpeg_exists()
    print("Synthesizing episode opening...", flush=True)
    beginning = pilot.synthesize(voice, opening)
    signature = pilot.synthesize(voice, IDENTITY)
    directions = pilot.synthesize(voice, INSTRUCTION)
    scenes = []
    for index, (_, title, prose) in enumerate(entries, 1):
        print(f"Rendering creature encounter {index}/80: {title}", flush=True)
        scenes.append(pilot.synthesize(voice, prose))
    ending = pilot.synthesize(voice, closing)
    # No synthetic boundary sounds. The original 35-second slots were too sparse.
    gap_seconds = 0.85
    longest = max(len(speech) / RATE for speech in scenes)
    wav = AUDIO / "14-creatures-behaving-strangely.tmp.wav"
    times = []
    with pilot.sound_file(wav) as w:
        w.write(pilot.blank(0.3))
        w.write(beginning)
        w.write(pilot.blank(PAUSE))
        w.write(signature)
        w.write(pilot.blank(PAUSE))
        w.write(directions)
        w.write(pilot.blank(0.6))
        start = w.frames / RATE
        for voice_scene in scenes:
            times.append(round(w.frames / RATE, 3))
            w.write(voice_scene)
            w.write(pilot.blank(gap_seconds))
        end = w.frames / RATE
        w.write(pilot.blank(0.5))
        w.write(ending)
        w.write(pilot.blank(0.65))
    duration = pilot.emit_mp3(wav, MP3)
    assert MP3.stat().st_size > 250000
    assert len(times) == 80 and all(b > a for a,b in zip(times, times[1:]))
    return {
        "episode": 14,
        "title": TITLE,
        "file": MP3.name,
        "source": "production/creatures_behaving_strangely.md",
        "source_sha256": source_hash,
        "encounters": len(entries),
        "spoken_titles": False,
        "spoken_numbers": False,
        "neutral_chimes": 0,
        "inter_scene_pause_seconds": gap_seconds,
        "first_boundary_seconds": round(start, 3),
        "boundary_times_seconds": times,
        "last_encounter_slot_end_seconds": round(end, 3),
        "longest_scene_speech_seconds": round(longest, 3),
        "total_seconds": round(duration, 3),
        "enclosure_bytes": MP3.stat().st_size,
        "voice_model": pilot.VOICE,
        "voice_tts_speed": pilot.KOKORO_RATE,
        "voice_treatment": pilot.SAVED_02,
        "signature": IDENTITY,
        "signature_pause_before_seconds": PAUSE,
        "signature_pause_after_seconds": PAUSE,
        "intro_observation": opening,
        "functional_instructions": INSTRUCTION,
        "coda_is_not_an_encounter": True,
        "entry_titles_for_editor_only": [title for _, title, _ in entries],
    }

def show_notes():
    return (
        "Eighty strange encounters with animals, from the merely curious to the "
        "quietly impossible. A wolf delivers firewood. Bees arrange seals inside "
        "a clock. A deer counts travelers at a bridge. What these things mean "
        "belongs to the people who find them.\\n\\n"
        "To use: Seek to a random point during the encounters. If an encounter "
        "is already underway, use the next complete one. Brief pauses separate "
        "the scenes. If the recording ends, return to the beginning of the encounters."
    )

def update_feed(record):
    ns_itunes = "http://www.itunes.com/dtds/podcast-1.0.dtd"
    ET.register_namespace("itunes", ns_itunes)
    ET.register_namespace("atom", "http://www.w3.org/2005/Atom")
    tree = ET.parse(FEED)
    channel = tree.find("./channel")
    assert channel is not None
    for item in list(channel.findall("item")):
        if item.findtext("guid") == GUID:
            channel.remove(item)
    old_items = channel.findall("item")
    assert len(old_items) == 13, f"Preserve 13 existing episodes; found {len(old_items)}"
    original_guids = [item.findtext("guid") for item in old_items]
    assert len(set(original_guids)) == 13
    item = ET.Element("item")
    def put(tag, value, attrib=None):
        return ET.SubElement(item, tag, attrib or {}, ).__setattr__("text", str(value))
    put("title", TITLE)
    put("description", show_notes())
    put("link", pilot.SITE + "#ep14")
    put("guid", GUID, {"isPermaLink": "false"})
    put("pubDate", format_datetime(datetime.now(timezone.utc)))
    ET.SubElement(item, "enclosure", {
        "url": pilot.SITE + "audio/" + MP3.name,
        "length": str(record["enclosure_bytes"]),
        "type": "audio/mpeg",
    })
    put(f"{{{ns_itunes}}}episode", 14)
    put(f"{{{ns_itunes}}}season", 1)
    put(f"{{{ns_itunes}}}episodeType", "full")
    put(f"{{{ns_itunes}}}explicit", "false")
    put(f"{{{ns_itunes}}}duration", seconds_format(record["total_seconds"]))
    # Publish at the top of the feed, newest first, while preserving old IDs.
    channel.insert(list(channel).index(old_items[0]), item)
    desc = channel.find("description")
    assert desc is not None and desc.text
    desc.text = re.sub(r"\bThirteen audio episodes\b", "Fourteen audio episodes", desc.text)
    assert len(channel.findall("item")) == 14
    assert [i.findtext("guid") for i in channel.findall("item")[1:]] == original_guids
    tree.write(FEED, encoding="utf-8", xml_declaration=True)
    assert len(ET.parse(FEED).findall("./channel/item")) == 14

def update_landing(record):
    contents = PAGE.read_text(encoding="utf-8")
    marker = '<article id="ep14">'
    if marker in contents:
        contents = re.sub(r'<article id="ep14">.*?</article>', "", contents, flags=re.S)
    assert "<footer>" in contents
    assert contents.count("<footer>") == 1
    minutes = int(record["total_seconds"] // 60)
    seconds = int(record["total_seconds"] % 60)
    card = (
        '<article id="ep14"><h2>Creatures Behaving Strangely</h2>'
        '<p>Eighty original encounters featuring animals acting in surprising, '
        'sometimes unsettling ways. Seek to a random point, ignore any encounter '
        'already underway, and listen for the next complete encounter.</p>'
        f'<p class="small">Runtime: {minutes}:{seconds:02d} · '
        '<a href="./audio/14-creatures-behaving-strangely.mp3">Direct MP3</a> · '
        '<a href="./creatures-behaving-strangely.md">Show notes</a></p>'
        '<audio controls preload="none" src="./audio/14-creatures-behaving-strangely.mp3"></audio>'
        '</article>'
    )
    contents = contents.replace("<footer>", card + "<footer>")
    contents = contents.replace("THIRTEEN AUDIO EPISODES", "FOURTEEN AUDIO EPISODES")
    contents = contents.replace("Thirteen podcast episodes", "Fourteen podcast episodes")
    contents = contents.replace(
        "Brother Rubicon narrates dice, wilderness encounters and an original countdown.",
        "Brother Rubicon narrates dice, curious creatures, wilderness encounters and an original countdown."
    )
    assert contents.count(marker) == 1
    PAGE.write_text(contents, encoding="utf-8")

def verify_file():
    _, _, _, source_hash = manuscript()
    record = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert record["source_sha256"] == source_hash
    assert record["encounters"] == 80 and record["neutral_chimes"] == 0
    assert not record["spoken_numbers"] and not record["spoken_titles"]
    assert len(record["boundary_times_seconds"]) == 80
    assert record["enclosure_bytes"] == MP3.stat().st_size
    assert MP3.stat().st_size > 250000
    assert record["total_seconds"] > 60
    assert all(b>a for a,b in zip(record["boundary_times_seconds"],record["boundary_times_seconds"][1:]))
    assert record["inter_scene_pause_seconds"] <= 1.0
    tree = ET.parse(FEED)
    items = tree.findall("./channel/item")
    assert len(items) == 14
    assert len(set(i.findtext("guid") for i in items)) == 14
    entry = next(i for i in items if i.findtext("guid") == GUID)
    enc = entry.find("enclosure")
    assert enc is not None
    assert enc.get("url") == pilot.SITE + "audio/" + MP3.name
    assert int(enc.get("length")) == MP3.stat().st_size
    assert entry.findtext(f"{{http://www.itunes.com/dtds/podcast-1.0.dtd}}episode") == "14"
    assert "ep14" in PAGE.read_text()
    assert TITLE in NOTES.read_text()
    print("PASS: 80 chime-free encounters, short pauses, 14 RSS items and enclosure", flush=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-only", action="store_true")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    entries, opening, closing, source_hash = manuscript()
    assert len(IDENTITY.split()) > 3
    assert len(opening.split()) >= 5
    assert closing and closing not in show_notes()
    if args.check_only:
        old = ET.parse(FEED).findall("./channel/item")
        assert len(old) in (13,14)
        print(f"PASS: 80 original encounters, opening, unique ending, {len(old)} RSS items", flush=True)
        return
    if args.verify_only:
        verify_file()
        return
    from kokoro import KPipeline
    voice = KPipeline(lang_code="b")
    record = make_record(voice, entries, opening, closing, source_hash)
    MANIFEST.write_text(json.dumps(record, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    NOTES.write_text("# " + TITLE + "\n\n" + show_notes() + "\n", encoding="utf-8")
    update_feed(record)
    update_landing(record)
    verify_file()

if __name__ == "__main__":
    main()
