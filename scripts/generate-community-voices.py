#!/usr/bin/env python3
"""Generate v1.1 Kokoro English auditions and publish manifest after success."""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KModel, KPipeline

REPO = "hexgrad/Kokoro-82M-v1.1-zh"
VOICES = {"af_maple": "a", "af_sol": "a", "bf_vale": "b"}
TEXT = "The road is long, and fortune seldom walks beside us. Still, you may roll."
OUTPUT = Path("voice-lab/community-v1.1")
OUTPUT.mkdir(parents=True, exist_ok=True)

model = KModel(repo_id=REPO).eval()
pipelines = {code: KPipeline(lang_code=code, repo_id=REPO, model=model) for code in set(VOICES.values())}
records = []
with tempfile.TemporaryDirectory() as temp:
    for voice, code in VOICES.items():
        chunks = [np.asarray(result.audio, dtype=np.float32) for result in pipelines[code](TEXT, voice=voice)]
        if not chunks:
            raise RuntimeError(f"No audio generated for {voice}")
        wav = Path(temp) / (voice + ".wav")
        sf.write(wav, np.concatenate(chunks), 24000)
        mp3 = OUTPUT / (voice + ".mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ar", "24000", "-ac", "1", "-b:a", "64k", str(mp3)], check=True)
        records.append({"id": voice, "file": mp3.name, "sha256": hashlib.sha256(mp3.read_bytes()).hexdigest(), "model": REPO, "sample": TEXT})
        print(f"Generated {mp3}", flush=True)
(OUTPUT / "manifest.json").write_text(json.dumps({"schemaVersion": 2, "completed": True, "available": list(VOICES), "records": records}, indent=2) + "\n")
