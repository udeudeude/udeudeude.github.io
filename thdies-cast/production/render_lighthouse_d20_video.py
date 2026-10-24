#!/usr/bin/env python3
"""Create one illustrated D20 video-podcast audition, without chapters.

Reimplements the exact LightHouse D20 icosahedron mesh and face-camera
orientation from udeudeude/LightHouse/lib/ui/dice_bubble.dart. It does not
depend on a gameplay webpage, produces an ordinary .mp4, and creates a
separate video-podcast RSS feed rather than replacing audio subscribers' files.
"""
from __future__ import annotations

import argparse
from datetime import datetime,timezone
from email.utils import format_datetime
import json
import math
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image,ImageDraw,ImageFont

sys.path.insert(0,str(Path(__file__).resolve().parent))
import render_pilot_season as pilot

BASE=pilot.BASE
ROOT=BASE/"dice-methods"
FRAMES=ROOT/"light-house-frames"
W,H=800,800
SIDE=2
VIDEO=ROOT/"illustrated-d20-light-house.mp4"
VIDEO_FEED=BASE/"video-feed.xml"
SOURCE_AUDIO=BASE/"audio"/"08-d20-pair-balanced.mp3"
SOURCE_MANIFEST=ROOT/"manifest.json"
SITE=pilot.SITE

# Mesh and face enumeration copied, without reordering, from the owner's
# LightHouse _icosahedronMesh in lib/ui/dice_bubble.dart, lines 1381-1418.
RAW=np.asarray([
    [-1, 1.61803398875, 0],
    [1, 1.61803398875, 0],
    [-1,-1.61803398875, 0],
    [1,-1.61803398875, 0],
    [0,-1, 1.61803398875],
    [0, 1, 1.61803398875],
    [0,-1,-1.61803398875],
    [0, 1,-1.61803398875],
    [1.61803398875,0,-1],
    [1.61803398875,0, 1],
    [-1.61803398875,0,-1],
    [-1.61803398875,0, 1]
],dtype=float)
FACES=[
 [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
 [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
 [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
 [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]
]
VERTICES=RAW / max(np.linalg.norm(v) for v in RAW)

def unit(v):
    n=np.linalg.norm(v)
    return v/n if n>1e-9 else v

def outward_face(i):
    ids=list(FACES[i])
    p=VERTICES[ids]
    normal=unit(np.sum(np.cross(p,np.roll(p,-1,axis=0)),axis=0))
    center=np.mean(p,axis=0)
    if np.dot(normal,center)<0:
        ids=list(reversed(ids))
        p=VERTICES[ids]
        normal=unit(np.sum(np.cross(p,np.roll(p,-1,axis=0)),axis=0))
        center=np.mean(p,axis=0)
    x_axis=unit(p[1]-p[0])
    return ids,normal,x_axis,center

GEOM=[outward_face(i) for i in range(20)]

def rotated(vec,x,y,z):
    """Same X → Y → Z rotation as LightHouse _rotatePolyVector."""
    cx,sx=math.cos(x),math.sin(x)
    cy,sy=math.cos(y),math.sin(y)
    cz,sz=math.cos(z),math.sin(z)
    ax,ay,az=vec
    by=ay*cx-az*sx
    bz=ay*sx+az*cx
    bx=ax*cy+bz*sy
    bz=-ax*sy+bz*cy
    return np.asarray([bx*cz-by*sz,bx*sz+by*cz,bz])

def orientation(face_index):
    _,normal,x_axis,_=GEOM[face_index]
    xr=math.atan2(normal[1],normal[2])
    yr=math.atan2(-normal[0],math.hypot(normal[1],normal[2]))
    aligned=rotated(x_axis,xr,yr,0)
    zr=-math.atan2(aligned[1],aligned[0])
    return xr,yr,zr

def projection(p):
    perspective=4.6/(4.6-p[2])
    return (W/2+p[0]*250*1.60*perspective, 410+p[1]*250*1.60*perspective)

def font(size,bold=False,serif=False):
    names=[]
    if serif:names.append("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf")
    if bold:names.append("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
    names.append("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    for name in names:
        if Path(name).exists():return ImageFont.truetype(name,size)
    return ImageFont.load_default()

def text_fit(draw,value,center,size,maxwidth):
    preferred=int(size)
    while preferred>10:
        f=font(preferred,bold=True)
        bb=draw.textbbox((0,0),value,font=f)
        if bb[2]-bb[0]<=maxwidth:return f
        preferred-=2
    return font(12,bold=True)

def style_base():
    im=Image.new("RGB",(W,H),(21,31,44))
    dr=ImageDraw.Draw(im)
    for i in range(5):
        r=245+32*i
        dr.ellipse((400-r,408-r,400+r,408+r),outline=(58+i*5,65+i*4,72+i*3),width=2)
    dr.rectangle((88,83,712,89),fill=(183,160,107))
    dr.text((400,30),"TH’DIE’S CAST",font=font(45,serif=True),
        fill=(242,229,199),anchor="mt")
    return im

def make_face(number):
    assert 1<=number<=20
    orientation_angles=orientation(number-1)
    rotation=lambda p:rotated(p,*orientation_angles)
    rpoints=[rotation(v) for v in VERTICES]
    points=[projection(v) for v in rpoints]
    output=style_base()
    dr=ImageDraw.Draw(output)
    visible=[]
    for i,face in enumerate(GEOM):
        ids,normal,x_axis,center=face
        n=rotation(normal)
        if n[2]<=0.015:continue
        depth=sum(rpoints[v][2] for v in ids)/len(ids)
        visible.append((depth,i,ids))
    visible.sort()
    for _,i,ids in visible:
        polygon=[points[x] for x in ids]
        dr.polygon(polygon,fill=(238,238,233))
        dr.line(polygon+[polygon[0]],fill=(14,16,19),width=11,joint="curve")
        mid=(sum(p[0] for p in polygon)/len(polygon),
             sum(p[1] for p in polygon)/len(polygon))
        inradius=1e9
        for k in range(len(polygon)):
            a=polygon[k]
            b=polygon[(k+1)%len(polygon)]
            den=math.dist(a,b)
            if den>0:
                cross=abs((a[0]-mid[0])*(b[1]-a[1])-(a[1]-mid[1])*(b[0]-a[0]))
                inradius=min(inradius,cross/den)
        label=str(i+1)
        desired=int(min(150,max(15,inradius*1.32)))
        chosen=text_fit(dr,label,mid,desired,inradius*2*1.16)
        dr.text(mid,label,font=chosen,anchor="mm",fill=(18,19,21))
    dr.text((400,688),f"{number:02d}",font=font(49,bold=True),
        fill=(226,197,141),anchor="mt")
    dr.text((400,756),"LIGHTHOUSE · TWENTY-SIDED DIE",font=font(16),
        fill=(188,187,176),anchor="mt")
    return output

def make_neutral():
    im=style_base()
    dr=ImageDraw.Draw(im)
    dr.text((400,350),"BROTHER RUBICON",font=font(47,serif=True),
        anchor="mm",fill=(235,225,200))
    dr.text((400,440),"Twenty faces, every possible pair",font=font(21),
        anchor="mm",fill=(207,187,142))
    dr.text((400,760),"ILLUSTRATED D20 · NO CHAPTERS",font=font(16),
        anchor="mm",fill=(193,192,178))
    return im

def produce_images():
    FRAMES.mkdir(parents=True,exist_ok=True)
    make_neutral().save(FRAMES/"00-neutral.png",optimize=True)
    for face in range(1,21):
        file=FRAMES/f"{face:02d}.png"
        make_face(face).save(file,optimize=True)
        assert file.stat().st_size>2500
    assert len(list(FRAMES.glob("*.png")))==21
    print("Generated 20 faithfully indexed LightHouse D20 faces plus a neutral introduction",flush=True)

def create_video_sequence(meta):
    values=meta["ordered_outcomes"]
    assert len(values)==400 and set(values)==set(range(1,21))
    intro=float(meta["results_start_seconds"])
    end=float(meta["results_end_seconds"])
    duration=float(meta["total_seconds_approx"])
    assert abs(end-intro-2000)<.0001
    assert duration-end>0
    playlist=ROOT/"_video-frames-concat.txt"
    lines=["ffconcat version 1.0"]
    def append(path,seconds):
        lines.append("file '"+str(path.resolve()).replace("'","'\\''")+"'")
        lines.append(f"duration {seconds:.7f}")
    append(FRAMES/"00-neutral.png",intro)
    for number in values:
        append(FRAMES/f"{number:02d}.png",5)
    append(FRAMES/"00-neutral.png",duration-end)
    lines.append("file '"+str((FRAMES/"00-neutral.png").resolve())+"'")
    playlist.write_text("\n".join(lines)+"\n",encoding="utf-8")
    return playlist

def encode_video(playlist):
    subprocess.run([
        "ffmpeg","-hide_banner","-loglevel","error","-y",
        "-safe","0","-f","concat","-i",str(playlist),
        "-i",str(SOURCE_AUDIO),
        "-map","0:v:0","-map","1:a:0",
        "-c:v","libx264","-preset","veryfast","-tune","stillimage",
        "-crf","27","-pix_fmt","yuv420p","-fps_mode","vfr",
        "-video_track_timescale","24000",
        "-c:a","aac","-b:a","72k",
        "-movflags","+faststart","-shortest",str(VIDEO)
    ],check=True)
    assert VIDEO.exists() and VIDEO.stat().st_size>1_000_000
    details=json.loads(subprocess.check_output([
        "ffprobe","-v","error","-show_entries","format=duration,size",
        "-of","json",str(VIDEO)],text=True))["format"]
    assert 2000<float(details["duration"])<2100,details
    print("Illustrated MP4",details["duration"],"seconds",details["size"],"bytes",flush=True)
    return details

def video_feed(info):
    ns="http://www.itunes.com/dtds/podcast-1.0.dtd"
    atom="http://www.w3.org/2005/Atom"
    ET.register_namespace("itunes",ns)
    ET.register_namespace("atom",atom)
    rss=ET.Element("rss",{"version":"2.0"})
    ch=ET.SubElement(rss,"channel")
    def sub(parent,tag,text=None,attrs=None):
        a=ET.SubElement(parent,tag,attrs or {})
        if text is not None:a.text=str(text)
        return a
    sub(ch,"title","Th’die’s Cast: Illustrated Dice")
    sub(ch,"link",SITE+"dice-methods/")
    sub(ch,"description","A visual companion edition of Brother Rubicon's seek-to-roll dice audio. One changing LightHouse die face per roll, as video frames, with no chapter markers.")
    sub(ch,"language","en-us")
    sub(ch,f"{{{ns}}}author","Th’die’s Cast")
    sub(ch,f"{{{ns}}}explicit","false")
    sub(ch,f"{{{ns}}}category",attrs={"text":"Leisure"})
    sub(ch,f"{{{ns}}}image",attrs={"href":SITE+"cover.png"})
    sub(ch,f"{{{atom}}}link",attrs={"href":SITE+"video-feed.xml","type":"application/rss+xml","rel":"self"})
    item=sub(ch,"item")
    sub(item,"title","Illustrated D20 · Every Possible Pair · LightHouse faces")
    sub(item,"description",(
        "The D20 from LightHouse, adapted into twenty static numbered views. Each "
        "five-second spoken result changes the visible die to the corresponding face. "
        "This is one MP4 video, with no chapter per number. The result sequence is "
        "the same 400-pair-balanced recording as audio episode 08; the mathematical "
        "construction and its limitations are described in that episode's show notes. "
        "This experiment is provided as a separate video RSS feed to preserve the "
        "ordinary audio podcast's small-download format. Apple Podcasts supports "
        "video MP4 RSS episodes, but clients may vary in video playback support."
    ))
    sub(item,"guid","urn:thdies-cast:visual:d20-pairs:lighthouse:1",{"isPermaLink":"false"})
    sub(item,"pubDate",format_datetime(datetime.now(timezone.utc)))
    sub(item,"link",SITE+"dice-methods/")
    sub(item,"enclosure",attrs={
        "url":SITE+"dice-methods/"+VIDEO.name,
        "length":str(int(info["size"])),"type":"video/mp4"})
    sub(item,f"{{{ns}}}episode","1")
    sub(item,f"{{{ns}}}episodeType","bonus")
    sub(item,f"{{{ns}}}explicit","false")
    sub(item,f"{{{ns}}}duration",f"00:33:{int(float(info['duration'])-1980):02d}")
    VIDEO_FEED.write_bytes(ET.tostring(rss,encoding="utf-8",xml_declaration=True))
    assert len(ET.parse(VIDEO_FEED).findall("./channel/item"))==1

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--images-only",action="store_true")
    args=parser.parse_args()
    produce_images()
    if args.images_only:
        print("Image generation self-check passed",flush=True)
        return
    data=json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
    meta=data["new_episodes"]["08-d20-pair-balanced.mp3"]
    assert SOURCE_AUDIO.is_file()
    sequence=create_video_sequence(meta)
    info=encode_video(sequence)
    video_feed(info)
    (ROOT/"illustrated-d20-manifest.json").write_text(json.dumps({
        "source_project":"udeudeude/LightHouse",
        "source_path":"lib/ui/dice_bubble.dart",
        "source_mesh":"_icosahedronMesh",
        "source_orientation":"_polyTargetForFace",
        "face_labels":"face index + 1 exactly as LightHouse",
        "source_audio":"08-d20-pair-balanced.mp3",
        "image_count":21,
        "images_change_at":"each five-second result start",
        "chapter_count":0,
        "video_mp4":VIDEO.name,
        "bytes":int(info["size"]),
        "duration_seconds":float(info["duration"]),
        "video_feed_url":SITE+"video-feed.xml"
    },indent=2)+"\n")
    sequence.unlink()
    print("READY independent illustrated D20 podcast feed",flush=True)

if __name__=="__main__":
    main()
