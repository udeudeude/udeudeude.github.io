# Th'die's Cast, five-episode pilot season

This folder contains the reproducible source for five initial podcast episodes.
The raw vocal source is Kokoro `bm_lewis`, narrating as **Brother Rubicon**,
with the user-selected **Saved 02 · Natural pitch, light room** voice recipe.
The exact setting values are preserved in the generated `pilot-manifest.json`.
The separate FFmpeg Rubber Band/EQ processing is an approximation to the
browser's preview DSP and should be judged by listening, not treated as a
bit-identical transfer of the JavaScript sound.

Episode structure (provisional until the producer approves the results):

1. **D20:** 360 faces in eighteen separate shuffled sets of twenty, 5-second
   sample-aligned result slots (not IID; this preserves the earlier D20 pilot).
2. **2D6:** 300 independently sampled pairs of D6s, 6-second slots; both values
   and the sum spoken. Totals therefore have their natural triangle distribution.
3. **D100:** 300 independent, uniformly sampled values 1–100 in 6-second slots.
4. **Wilderness Oracle:** exactly 80 separately written scenes from the original
   manuscript, without spoken numbers or titles. A small cue precedes each.
5. **Ten Minutes to Disaster:** newly synthesized tension score lasting 600
   seconds, with spoken landmarks and a bell beginning at the 600-second mark.

Secret end codas follow the usable material; they are not dice results or timer
cues. Seekers should choose the next complete outcome and restart if the end
of an episode arrives first.

### Hosting, subscriptions and technical constraints

RSS: `https://udeudeude.github.io/thdies-cast/feed.xml`
Audio: `https://udeudeude.github.io/thdies-cast/audio/NN-name.mp3`
Artwork: `cover.png`, 1800 x 1800 pixels, procedurally drawn.
The separate public landing page is a discovery/listening page, not a gameplay
companion app. All five episodes are fully usable through a podcast client.

The RSS intentionally omits a fabricated owner email address. These are
subscribe-by-URL pilot episodes, not a claim of submission to the Apple Podcasts
public catalog. MP3s use 24 kHz mono AAC-free MPEG Layer III at 64 kbps.

Run on a machine with Python 3.11, espeak-ng, FFmpeg with the Rubber Band
filter, and dependencies from `requirements.txt`:

```sh
python thdies-cast/production/render_pilot_season.py
```

The generation source, original prose and musical signals are original to
this project. No external music library or unlicensed historical voice samples
are embedded. The generated MP3s and feed are made public for audition.
