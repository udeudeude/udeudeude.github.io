"""Master newly synthesized spoken episodes against the existing show catalog.

The previously used dynamic FFmpeg loudnorm produced whisper-quiet endings on
long recordings. Removing it made later Kokoro-only masters far too quiet as
entire recordings. Use one time-invariant gain and gentle soft limiting of peaks
instead. No release-time compression that reacts to long silence.
"""
from __future__ import annotations
import json
import math
from pathlib import Path

import numpy as np
import soundfile as sf

import audit_audio_levels as qa

ROOT=Path(__file__).resolve().parents[1]
RATE=24000

def catalog_reference_db():
    metadata=json.loads((ROOT/"pilot-manifest.json").read_text(encoding="utf-8"))
    m=metadata["episodes"]["04-wilderness-oracle.mp3"]
    first=float(m["first_boundary_seconds"])
    last=float(m["boundary_times_seconds"][min(8,len(m["boundary_times_seconds"])-1)])
    samples=qa.read_range(ROOT/"audio/04-wilderness-oracle.mp3",first,last-first)
    target=qa.active_voice_db(samples)
    assert math.isfinite(target) and -30<target<-8,target
    return target

def master_spoken_wav(wav:Path, sample_start:float, sample_end:float):
    wav=Path(wav)
    raw,rate=sf.read(wav,dtype="float32",always_2d=False)
    assert rate==RATE and raw.ndim==1
    assert 0<=sample_start<sample_end<=len(raw)/rate
    target=catalog_reference_db()
    a=round(sample_start*RATE)
    b=round(sample_end*RATE)
    before=qa.active_voice_db(raw[a:b])
    assert math.isfinite(before) and abs(target-before)<40,(before,target)
    for _ in range(5):
        now=qa.active_voice_db(raw[a:b])
        gap=target-now
        if abs(gap)<0.8:break
        factor=10**(max(-7,min(31,gap))/20)
        peak=float(np.max(np.abs(raw)))*factor
        if peak<.87:
            raw*=factor
        else:
            raw[:]=.92*np.tanh(raw*factor/.92)
    after=qa.active_voice_db(raw[a:b])
    assert abs(after-target)<2.0,(before,after,target)
    assert np.isfinite(raw).all() and float(np.max(np.abs(raw)))<=.93
    # Keep the same number of samples, and the original mono PCM configuration.
    sf.write(wav,raw,rate,subtype="PCM_16")
    assert sf.info(wav).frames==len(raw)
    print(f"Catalog-level speech master {wav.name}: {before:.2f} -> {after:.2f} dB (reference {target:.2f})",flush=True)
    return {"unmastered_scene_db":before,"reference_scene_db":target,"mastered_scene_db":after}
