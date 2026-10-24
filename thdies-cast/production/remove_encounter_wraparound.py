#!/usr/bin/env python3
"""Remove the spoken wraparound instruction from episodes 14 and 15.

Re-record ONLY the two intros with the approved Brother Rubicon voice and
splice them onto the existing 80-scene recordings. Preserve every encounter,
pacing, ending and the other 13 published episode files. Refresh the podcast
RSS enclosures, artwork-free listening page and time-based manifest boundaries.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

import numpy as np

import render_pilot_season as pilot
import remaster_library as audio
import audit_audio_levels as meters
import final_encounter_mastering as mastering
import render_creatures as creatures
import render_relics as relics

BASE = pilot.BASE
AUDIO = pilot.AUDIO
RATE = pilot.SAMPLE_RATE
FEED = BASE / "feed.xml"
PAGE = BASE / "index.html"
REMOVED = "If you reach the end, return to the first encounter after the introduction."
REVISION = "20261024e"
EPISODES = (
    (14, creatures),
    (15, relics),
)

def speech_level(x: np.ndarray, a: float, b: float) -> float:
    sample = x[round(a * RATE):round(b * RATE)]
    level = meters.active_voice_db(sample)
    assert math.isfinite(level) and -60.0 < level < 0.0, (a, b, level)
    return level

def patch_intro(number, module, kokoro):
    path = module.MP3
    manifest_path = module.MANIFEST
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["episode"] == number
    assert manifest["encounters"] == 80
    assert manifest["neutral_chimes"] == 0
    assert REMOVED in manifest["functional_instructions"], "Already revised; never edit twice"
    assert REMOVED not in module.INSTRUCTION, "Render source must be corrected first"
    assert module.INSTRUCTION.startswith(f"This is {module.TITLE}."), "Episode must introduce its own title"
    assert manifest["intro_observation"] and manifest["signature"] == module.IDENTITY
    assert len(manifest["boundary_times_seconds"]) == 80
    assert len(list(AUDIO.glob("*.mp3"))) == 15
    assert path.exists()

    original = audio.decode_mp3(path)
    before_seconds = len(original) / RATE
    old_start = float(manifest["first_boundary_seconds"])
    last_scene_end = float(manifest["last_encounter_slot_end_seconds"])
    assert 15.0 < old_start < 45.0
    assert last_scene_end < before_seconds
    assert abs(old_start - manifest["boundary_times_seconds"][0]) < 0.004
    target_scene_db = speech_level(original, old_start, manifest["boundary_times_seconds"][8])

    print(f"Re-recording only episode {number}'s opening in the approved voice...", flush=True)
    observation = pilot.synthesize(kokoro, manifest["intro_observation"])
    signature = pilot.synthesize(kokoro, module.IDENTITY)
    directions = pilot.synthesize(kokoro, module.INSTRUCTION)
    new_intro = np.concatenate([
        pilot.blank(0.3),
        observation,
        pilot.blank(module.PAUSE),
        signature,
        pilot.blank(module.PAUSE),
        directions,
        pilot.blank(0.6),
    ]).astype(np.float32)

    # Match the newly synthesized intro to the existing encounters, not to a
    # whole-file average. Fixed gain plus a gentle peak limiter, no adaptive
    # dynamics that could make the end of the recording whisper-quiet.
    new_start = len(new_intro) / RATE
    assert 10.0 < new_start < old_start - 0.3, (
        "A shorter introduction is expected after removing the sentence",
        old_start, new_start,
    )
    old_intro_db, new_intro_db = mastering.adjustment(
        new_intro, target_scene_db, 0.0, new_start
    )
    assert abs(new_intro_db - target_scene_db) < 2.5, (
        number, old_intro_db, new_intro_db, target_scene_db,
    )

    # Keep every original encounter and the original closing coda. Their
    # decoded samples remain untouched until the final MP3 re-encode.
    old_cut = round(old_start * RATE)
    old_scene_probe = original[old_cut + 3 * RATE:old_cut + 11 * RATE].copy()
    revised = np.concatenate([new_intro, original[old_cut:]]).astype(np.float32)
    del original

    duration = audio.write_mp3(path, revised)
    del revised
    encoded = audio.decode_mp3(path)
    decoded_duration = len(encoded) / RATE
    assert abs(decoded_duration - duration) < 0.2
    assert abs((before_seconds - duration) - (old_start - new_start)) < 0.3

    # Numeric fingerprint check: no encounter words, tempo or silence were
    # re-generated. MP3 re-encoding changes samples slightly, but should not
    # materially change any encounter's sound.
    new_cut = round(new_start * RATE)
    new_scene_probe = encoded[new_cut + 3 * RATE:new_cut + 11 * RATE]
    length = min(len(new_scene_probe), len(old_scene_probe))
    correlation = float(np.corrcoef(
        old_scene_probe[:length], new_scene_probe[:length],
    )[0, 1])
    assert correlation > 0.98, (number, correlation)
    after_scene_db = speech_level(
        encoded, new_start, new_start + (
            manifest["boundary_times_seconds"][8] - old_start
        )
    )
    after_intro_db = speech_level(encoded, 0.0, new_start)
    assert abs(after_scene_db - after_intro_db) < 3.5, (
        number, after_scene_db, after_intro_db
    )
    assert abs(after_scene_db - target_scene_db) < 1.2

    offset = new_start - old_start
    manifest["first_boundary_seconds"] = round(new_start, 3)
    manifest["boundary_times_seconds"] = [
        round(t + offset, 3) for t in manifest["boundary_times_seconds"]
    ]
    manifest["last_encounter_slot_end_seconds"] = round(last_scene_end + offset, 3)
    manifest["functional_instructions"] = module.INSTRUCTION
    manifest["total_seconds"] = round(duration, 3)
    manifest["enclosure_bytes"] = path.stat().st_size
    manifest["intro_revision"] = REVISION
    manifest["intro_voice_level_db"] = round(after_intro_db, 2)
    manifest["unchanged_encounter_audio_correlation"] = round(correlation, 5)
    assert abs(manifest["boundary_times_seconds"][0] - new_start) < 0.005
    assert REMOVED not in json.dumps(manifest)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"PASS episode {number}: intro shortened from {old_start:.2f}s to "
        f"{new_start:.2f}s; scene correlation {correlation:.5f}; "
        f"intro/encounter level {after_intro_db:.2f}/{after_scene_db:.2f} dB",
        flush=True,
    )
    return manifest

def update_public(results):
    ET.register_namespace("itunes", "http://www.itunes.com/dtds/podcast-1.0.dtd")
    ET.register_namespace("atom", "http://www.w3.org/2005/Atom")
    tree = ET.parse(FEED)
    channel = tree.find("./channel")
    assert channel is not None
    items = channel.findall("item")
    assert len(items) == 15 and len({i.findtext("guid") for i in items}) == 15
    original_guids = [i.findtext("guid") for i in items]
    itunes_ns = "{http://www.itunes.com/dtds/podcast-1.0.dtd}"
    for number, module in EPISODES:
        entry = next(
            i for i in items if i.findtext("guid") == module.GUID
        )
        enc = entry.find("enclosure")
        assert enc is not None
        name = enc.get("url", "").split("/")[-1].split("?")[0]
        assert name == module.MP3.name
        enc.set("url", pilot.SITE + "audio/" + name + "?revision=" + REVISION)
        enc.set("length", str(module.MP3.stat().st_size))
        duration = entry.find(itunes_ns + "duration")
        assert duration is not None
        duration.text = module.seconds_format(results[number]["total_seconds"])
        assert REMOVED not in (entry.findtext("description") or "")
    tree.write(FEED, encoding="utf-8", xml_declaration=True)

    page = PAGE.read_text(encoding="utf-8")
    for number, module in EPISODES:
        name = module.MP3.name
        page = re.sub(
            re.escape(name) + r"(?:\?revision=[a-zA-Z0-9_-]+)?",
            name + "?revision=" + REVISION,
            page,
        )
        tag = re.compile(
            rf'(<article id="ep{number}">[\s\S]*?Runtime: )\d+:\d\d'
        )
        mins = int(results[number]["total_seconds"] // 60)
        secs = int(results[number]["total_seconds"] % 60)
        page, changed = tag.subn(
            lambda m: f"{m.group(1)}{mins}:{secs:02d}",
            page, count=1,
        )
        assert changed == 1, f"Expected episode {number} runtime card"
    assert REMOVED not in page
    PAGE.write_text(page, encoding="utf-8")

    rerendered = ET.parse(FEED).findall("./channel/item")
    assert len(rerendered) == 15
    assert [i.findtext("guid") for i in rerendered] == original_guids
    for entry in rerendered:
        enclosure = entry.find("enclosure")
        if enclosure is None:
            continue
        name = enclosure.get("url").split("/")[-1].split("?")[0]
        file = AUDIO / name
        assert file.exists()
        assert int(enclosure.get("length")) == file.stat().st_size, name
    print("PASS: original 15 RSS episode identifiers preserved; new intro timings and media links published", flush=True)

def main():
    from kokoro import KPipeline

    # Idempotence guard: prevent accidental repeat re-encoding after a
    # successful release.
    old_guids = ET.parse(FEED).findall("./channel/item")
    assert len(old_guids) == 15
    for n, module in EPISODES:
        meta = json.loads(module.MANIFEST.read_text(encoding="utf-8"))
        assert REMOVED in meta["functional_instructions"], f"Episode {n} already revised"
        assert REMOVED not in module.INSTRUCTION
        assert module.INSTRUCTION.startswith(f"This is {module.TITLE}.")

    voice = KPipeline(lang_code="b")
    results = {}
    for n, module in EPISODES:
        results[n] = patch_intro(n, module, voice)
    update_public(results)
    print("SUCCESS: removed unnecessary sentence from both released audio introductions", flush=True)

if __name__ == "__main__":
    main()
