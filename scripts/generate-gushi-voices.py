#!/usr/bin/env python3
"""Create self-hosted Gushi Labs auditions with Kokoro v1.0."""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
from huggingface_hub import hf_hub_download, list_repo_files
from kokoro import KPipeline

SOURCE = "gushilabs/gushilabs-voices-for-kokoro-v1"
OUT = Path("voice-lab/gushi")
OUT.mkdir(parents=True, exist_ok=True)
TEXT = "The road is long, and fortune seldom walks beside us. Still, you may roll."
files = list_repo_files(SOURCE)
pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
available, failed, records = [], {}, []
for label, token in [("gushi_tony", "tony"), ("gushi_vivien", "vivien")]:
    matches = [name for name in files if name.lower().startswith("voices/") and
               name.lower().endswith(".pt") and token in name.lower()]
    if not matches:
        failed[label] = "No matching .pt voicepack in upstream repository"
        continue
    try:
        pack = hf_hub_download(repo_id=SOURCE, filename=matches[0])
        voice = pipeline.load_voice(pack)
        chunks = [np.asarray(audio, dtype=np.float32) for _, _, audio in pipeline(TEXT, voice=voice)]
        if not chunks:
            raise RuntimeError("No generated audio")
        with tempfile.TemporaryDirectory() as td:
            wav = Path(td) / "sample.wav"
            sf.write(wav, np.concatenate(chunks), 24000)
            mp3 = OUT / (label + ".mp3")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                            "-ac", "1", "-ar", "24000", "-b:a", "64k", str(mp3)], check=True)
        available.append(label)
        records.append({"id": label, "voicepack": matches[0], "source": SOURCE,
                        "sha256": hashlib.sha256(mp3.read_bytes()).hexdigest(), "text": TEXT})
        print("Generated", label, flush=True)
    except Exception as exc:
        failed[label] = str(exc)
        print("FAILED", label, exc, flush=True)
(OUT / "manifest.json").write_text(json.dumps({
    "schemaVersion": 2, "completed": True, "available": available,
    "failed": failed, "records": records}, indent=2) + "\n")
if not available:
    raise SystemExit("No Gushi recordings generated; see failures above")
