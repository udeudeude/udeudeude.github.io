#!/usr/bin/env python3
"""Publish the approved Creatures Behaving Strangely audio oracle.

Reuses the original Th'die's Cast Kokoro Lewis synthesis and mastering pipeline.
Twenty equal-duration scene slots allow fair random seeking across the encounters.
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
    "Your encounter is the next complete scene you hear after the chime. "
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
    assert len(entries) == 20, f"Expected 20 encounters, found {len(entries)}"
    assert [n for n, _, _ in entries] == list(range(1, 21))
    assert len(set(t for _, t, _ in entries)) == 20
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
        print(f"Rendering creature encounter {index}/20: {title}", flush=True)
        scenes.append(pilot.synthesize(voice, prose))
    ending = pilot.synthesize(voice, closing)
    cue = pilot.boundary_chime()
    cue_seconds = len(cue) / RATE
    # Every encounter occupies the same-length time slot, regardless of speech
    # length. This avoids overrepresenting longer stories during random seeking.
    slot_seconds = max(35, math.ceil(max(len(s) / RATE for s in scenes) + cue_seconds + 3.0))
    slot_frames = int(slot_seconds * RATE)
    initial_silence = pilot.blank(0.65)
    cue_frames = len(cue)
    pre_speech_frames = cue_frames + len(initial_silence)
    longest = max(len(s) / RATE for s in scenes)
    assert pre_speech_frames + max(len(s) for s in scenes) + 2 * RATE <= slot_frames
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
            slot = pilot.blank(slot_seconds)
            slot[:cue_frames] = cue
            slot[pre_speech_frames:pre_speech_frames+len(voice_scene)] = voice_scene
            w.write(slot)
        end = w.frames / RATE
        w.write(pilot.blank(0.8))
        w.write(ending)
        w.write(pilot.blank(0.65))
    length = pilot.emit_mp3(wav, MP3)
    assert MP3.stat().st_size > 250000
    assert abs((end - start) - 20 * slot_seconds) < .015
    return {
        "episode": 14,
        "title": TITLE,
        "file": MP3.name,
        "source": "production/creatures_behaving_strangely.md",
        "source_sha256": source_hash,
        "encounters": len(entries),
        "spoken_titles": False,
        "spoken_numbers": False,
        "neutral_chimes": len(entries),
        "fixed_slot_seconds": slot_seconds,
        "first_boundary_seconds": round(start, 3),
        "boundary_times_seconds": times,
        "last_encounter_slot_end_seconds": round(end, 3),
        "longest_scene_speech_seconds": round(longest, 3),
        "total_seconds": round(length, 3),
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
        "Twenty independent encounters involving creatures with curious habits. "
        "Rather than prescribing an enemy, a reward, or a solution, each offers "
        "an observation that the group may choose to investigate.\n\n"
        "HOW TO USE THIS EPISODE\n"
        "Seek to a random point during the encounters. Ignore any scene already "
        "in progress. The next complete encounter begins after a quiet chime. "
        "If you reach the closing remarks, return to the first scene after the introduction.\n\n"
        "There are twenty encounters of equal playback duration, so each is "
        "equally likely if you seek uniformly across the encounter portion. "
        "Hand-operated scrubbing is not guaranteed to be uniform. "
        "Printed titles and numbers are not spoken. "
        "A final closing remark is not an encounter.\n\n"
        "Narrated by Brother Rubicon using Kokoro Lewis with the producer-selected "
        "Saved 02 treatment. Original encounter prose; suitable for many tabletop games."
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
        '<p>Twenty original encounters featuring animals acting in surprising, '
        'sometimes unsettling ways. Seek to a random point, ignore any encounter '
        'already underway, and listen for the next complete encounter after its chime.</p>'
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
    assert record["encounters"] == 20 and record["neutral_chimes"] == 20
    assert not record["spoken_numbers"] and not record["spoken_titles"]
    assert len(record["boundary_times_seconds"]) == 20
    assert record["enclosure_bytes"] == MP3.stat().st_size
    assert MP3.stat().st_size > 250000
    assert record["total_seconds"] > 60
    assert abs(record["boundary_times_seconds"][-1] -
               record["boundary_times_seconds"][0] -
               19 * record["fixed_slot_seconds"]) < 0.02
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
    print("PASS: 20 equal-length encounters, 14 RSS items, verified enclosure and landing page", flush=True)

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
        assert not MP3.exists(), "Episode already exists: do not overwrite published audio"
        print(f"PASS: 20 original encounters, signed-off opening, unique ending, {len(old)} original feed items", flush=True)
        return
    if args.verify_only:
        verify_file()
        return
    assert not MP3.exists(), "Existing audio must never be overwritten"
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
