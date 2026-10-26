#!/usr/bin/env python3
"""Experimental English narration with Kokoro's non-English voice embeddings."""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KPipeline

ROOT = Path("voice-lab")
catalog = json.loads((ROOT / "voice-catalog.json").read_text())
voices = [v["id"] for g in catalog["groups"] if g["code"] in "efhijpz" and len(g["code"]) == 1 for v in g["voices"]]
out = ROOT / "english-accents"
out.mkdir(parents=True, exist_ok=True)
text = "The road is long, and fortune seldom walks beside us. Still, you may roll."
pipeline = KPipeline(lang_code="a")
available, failed, records = [], {}, []
with tempfile.TemporaryDirectory() as temp:
    for voice in voices:
        try:
            chunks = [np.asarray(audio, dtype=np.float32) for _, _, audio in pipeline(text, voice=voice)]
            if not chunks:
                raise RuntimeError("No audio returned")
            wav = Path(temp) / (voice + ".wav")
            sf.write(wav, np.concatenate(chunks), 24000)
            mp3 = out / (voice + ".mp3")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                            "-ar", "24000", "-ac", "1", "-b:a", "64k", str(mp3)], check=True)
            available.append(voice)
            records.append({"id": voice, "sha256": hashlib.sha256(mp3.read_bytes()).hexdigest(), "sample": text, "phonemizer": "American English"})
            print("OK", voice, flush=True)
        except Exception as exc:
            failed[voice] = str(exc)
            print("FAILED", voice, exc, flush=True)
(out / "manifest.json").write_text(json.dumps({"schemaVersion": 2, "completed": True,
    "available": available, "failed": failed, "records": records}, indent=2) + "\n")
if not available:
    raise SystemExit("No English-accent auditions could be synthesized")
