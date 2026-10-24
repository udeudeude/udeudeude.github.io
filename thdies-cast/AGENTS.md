# Audio-production instructions: Th’die’s Cast

Audio generation **works through the existing GitHub Actions runners**, not through a ChatGPT local sandbox. If Kokoro, Rubber Band, or voice assets are missing locally, **do not tell the producer you cannot make a podcast episode** until you inspect `.github/workflows/`, `thdies-cast/production`, past workflow runs, and saved artifacts. For full instructions, read [the audio-production runbook](https://github.com/udeudeude/Th-die-s-Cast/blob/main/docs/AUDIO_PRODUCTION_RUNBOOK.md) and `production/README.md`.

Canonical narration: Brother Rubicon with Kokoro `bm_lewis`, approved Saved 02 audio treatment, spoken show title “The die's cast.” Render on Ubuntu Actions, using the established voice files fetched by the runner, and write verifiable MP3, manifest, feed, and website sources.

**No synthetic chimes in creature or wilderness encounters.** The producer rejected them. Both encounter episodes contain 80 scenes with short natural pauses. No unnecessary technical process text in public descriptions; no secret-coda spoilers.

For dice, measure introduction and ending levels *relative to actual spoken results*. Whole-file dynamic `loudnorm` caused dangerously quiet 20–27 dB codas; avoid it. Run `production/audit_audio_levels.py` and `.github/workflows/check-thdies-voice-levels.yml` as release QA. Preserve the 10-minute timer's sample-accurate cue. Do not destroy original episode IDs or rerender finished artifacts after a publishing-only error.
