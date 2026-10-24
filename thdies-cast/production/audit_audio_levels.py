#!/usr/bin/env python3
"""Measure spoken introduction/coda levels relative to results, not whole-file peaks.

Uses high-activity 80 ms RMS windows, which exclude intentional silence. Results
are diagnostic; the mastering pipeline uses the same metric before and after.
"""
from __future__ import annotations
import json
import math
from pathlib import Path
import subprocess
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
AUDIO=ROOT/"audio"
RATE=24000
PILOT=json.loads((ROOT/"pilot-manifest.json").read_text())["episodes"]
BALANCED=json.loads((ROOT/"dice-methods/manifest.json").read_text())["new_episodes"]
CREATURE=json.loads((ROOT/"creatures-manifest.json").read_text())

def chunks():
    for n in range(1,15):
        name=next(f for f in sorted(AUDIO.glob(f"{n:02d}-*.mp3")))
        file=name.name
        if n in (1,2,3):
            d=PILOT[file];start=d["intro_seconds"];end=d["last_result_slot_ends_seconds"]
            slot=d["slot_seconds"];body_end=min(end,start+slot*35)
        elif n==4:
            d=PILOT[file];start=d["first_boundary_seconds"];end=d["last_encounter_ends_seconds"]
            body_end=d["boundary_times_seconds"][min(8,len(d["boundary_times_seconds"])-1)]
        elif n==5:
            yield n,name,None,None,None;continue
        elif 6<=n<=13:
            d=BALANCED[file];start=d["results_start_seconds"];end=d["results_end_seconds"]
            body_end=min(end,start+d["slot_seconds"]*35)
        else:
            d=CREATURE;start=d["first_boundary_seconds"];end=d["last_encounter_slot_end_seconds"]
            body_end=d["boundary_times_seconds"][min(8,len(d["boundary_times_seconds"])-1)]
        yield n,name,start,body_end,end

def read_range(path,start,duration):
    cmd=["ffmpeg","-v","error","-ss",str(max(0,start)),"-t",str(max(0.1,duration)),
        "-i",str(path),"-ac","1","-ar",str(RATE),"-f","f32le","-"]
    data=subprocess.check_output(cmd)
    return np.frombuffer(data,dtype="<f4").copy()

def active_voice_db(samples):
    frame=round(.08*RATE)
    n=len(samples)//frame
    if n<4:return float("nan")
    frames=samples[:frame*n].reshape(-1,frame)
    rms=np.sqrt(np.mean(np.square(frames.astype(np.float64)),axis=1))
    upper=float(np.percentile(rms,96))
    gate=max(.0008,upper*.07)
    active=rms[rms>=gate]
    if len(active)<3:return float("nan")
    return round(20*math.log10(max(1e-8,float(np.percentile(active,60)))),2)

def measure():
    report=[]
    for n,path,start,body_end,end in chunks():
        if n==5:
            # A dramatic soundtrack and exact 10:00 signal are not comparable
            # to dry spoken dice results; do not modify timer automatically.
            report.append({"episode":n,"file":path.name,"note":"timed music episode; noncomparable"})
            continue
        intro=active_voice_db(read_range(path,0,start))
        body=active_voice_db(read_range(path,start,body_end-start))
        duration=float(json.loads(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","json",str(path)],text=True))["format"]["duration"])
        coda=active_voice_db(read_range(path,end,duration-end))
        result={"episode":n,"file":path.name,"intro_db":intro,"body_db":body,"coda_db":coda,
                "intro_gap_db":round(body-intro,2),"coda_gap_db":round(body-coda,2),
                "intro_end":round(start,3),"body_end":round(end,3),"duration":round(duration,2)}
        report.append(result)
        print(f"{n:02d} {path.name:38s} BODY {body:6.2f} INTRO {intro:6.2f} (gap {body-intro:+5.2f}) CODA {coda:6.2f} (gap {body-coda:+5.2f})",flush=True)
    return report

if __name__=="__main__":
    print(json.dumps(measure(),indent=2))
