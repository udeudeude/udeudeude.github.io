#!/usr/bin/env python3
"""Render comparable, genuine Kokoro-82M auditions for every catalogued voice.

This script is an offline build step in GitHub Actions, *not* a user-facing
browser TTS engine. Only final voice MP3s and a verified availability manifest
are committed. No voice identities are simulated by pitch-shifting Lewis.
"""
from __future__ import annotations

import json
import subprocess
import tempfile
import traceback
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KModel, KPipeline

HERE = Path(__file__).resolve().parents[1]
CATALOG = HERE / "voice-catalog.json"
OUT = HERE / "voice-samples"
SAMPLE_RATE = 24000
MIN_DURATION = 2.0
MAX_DURATION = 32.0

def convert(audio: np.ndarray, destination: Path) -> float:
    with tempfile.TemporaryDirectory() as folder:
        wav = Path(folder) / "raw.wav"
        sf.write(wav, audio, SAMPLE_RATE, subtype="PCM_16")
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(wav),
            "-af", "highpass=f=50,loudnorm=I=-17:TP=-1.5:LRA=8",
            "-ac", "1", "-ar", str(SAMPLE_RATE),
            "-c:a", "libmp3lame", "-b:a", "64k",
            str(destination),
        ], check=True)
    result = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(destination)
    ], text=True)
    duration = float(result.strip())
    if not MIN_DURATION < duration < MAX_DURATION or destination.stat().st_size < 8000:
        raise RuntimeError(f"Invalid sample: {destination} {duration:.2f}s")
    return round(duration, 3)

def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    assert sum(len(g["voices"]) for g in catalog["groups"]) == 54

    print("Loading a shared Kokoro model...", flush=True)
    model = KModel()
    result = {
        "schemaVersion": 1,
        "voiceCount": 54,
        "audioFormat": "MP3 mono 24 kHz 64 kb/s",
        "sampleSpeed": 1.0,
        "available": [],
        "failed": {},
    }

    for group in catalog["groups"]:
        language = group["code"]
        print("Language", group["label"], language, flush=True)
        try:
            pipeline = KPipeline(lang_code=language, model=model)
        except Exception as exc:
            print("FAILED pipeline", language, str(exc), flush=True)
            for voice in group["voices"]:
                result["failed"][voice["id"]] = f"Language initialization: {exc}"
            continue

        for voice in group["voices"]:
            vid = voice["id"]
            filename = OUT / f"{vid}.mp3"
            try:
                if filename.exists():
                    filename.unlink()
                chunks = [
                    np.asarray(audio, dtype=np.float32).reshape(-1)
                    for _graphemes, _phonemes, audio in pipeline(
                        group["sample"], voice=vid, speed=1.0
                    )
                ]
                if not chunks:
                    raise RuntimeError("Model returned no audio")
                # Same script within each group, preserving natural Kokoro prosody.
                audio = np.concatenate(chunks)
                if not np.isfinite(audio).all():
                    raise RuntimeError("Nonfinite audio")
                duration = convert(audio, filename)
                result["available"].append(vid)
                print(f"OK {vid} {duration:.2f}s {filename.stat().st_size} bytes", flush=True)
            except Exception as exc:
                filename.unlink(missing_ok=True)
                result["failed"][vid] = str(exc)
                print(f"FAILED {vid}: {exc}", flush=True)
                traceback.print_exc(limit=3)

        # Persist diagnostics even if a later language fails.
        (OUT / "manifest.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    ids = {v["id"] for g in catalog["groups"] for v in g["voices"]}
    assert len(ids) == 54 and len(result["available"]) + len(result["failed"]) == 54
    assert len(result["available"]) >= 20, f"Only {len(result['available'])}/54 voice samples rendered"
    if "bm_lewis" not in result["available"]:
        raise RuntimeError("Reference Lewis sample missing")
    result["completed"] = True
    result["availableCount"] = len(result["available"])
    (OUT / "manifest.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Verified {len(result['available'])}/54 samples. Failed: {list(result['failed'])}", flush=True)

if __name__ == "__main__":
    main()
