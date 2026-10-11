# Lewis Voice Lab

A **producer-only** audio-processing tool for *Th’die’s Cast*. It is **not** a gameplay companion or a condition for listening to the podcast.

Open `https://udeudeude.github.io/voice-lab/` in Safari or another modern browser. No account or server-side audio processing.

## What it does

- Load an existing public Lewis test sample or choose a local audio file (max 22 MB; use short clips on phones).
- Select an 8–30-second excerpt of the input to keep preview generation responsive.
- Move independent **pitch** (semitones), **speaking speed** (time stretch), and **formant envelope** (semitones) controls, then select **Apply voice changes** to render off the main thread.
- Listen to **A / original** and **B / processed**, including looping, seeking and waveform display.
- Adjust **high-pass, bass, vocal presence, air, compression threshold, compression ratio, output volume, room reverb, echo level, and echo delay** while the audio plays.
- Try five editable presets, locally store a custom recipe, copy the settings JSON, or **download a rendered WAV** of the current B path including acoustic effects.
- Optionally add the site to the home screen. The application shell can be cached; existing public sound samples are fetched on demand. Locally uploaded files do not leave the browser.

## Important audio facts

Lewis is the original Kokoro TTS voice `bm_lewis`. The controls process an **existing recording**, so speaking speed is changed with time stretching, not by changing the original TTS script or narration prosody.

Formants are the spectral-envelope peaks caused by resonances of the vocal tract. They are **not** the note/fundamental frequency, and ordinary bass EQ is **not** independent formant shifting. The lab uses a cepstral envelope extraction and frequency-warp stage that moves estimated formants independently of its pitch and time-stretch stages. This is a genuine but **preview-quality** approximation. Strong settings can sound synthetic and may disturb consonants. For final episodes, chosen values should be recreated with high-quality offline mastering (e.g. FFmpeg Rubber Band, if available) and auditioned on the actual podcast output.

Other qualities that cannot be modified faithfully without new TTS synthesis: the original script, lexical stress, expressive delivery, and truly changing/blending Kokoro speaker identities. Those are **not falsely represented as sliders** here. Mixing two prerecorded and imperfectly aligned voices would be a different creative effect, not a genuine speaker embedding blend.

## Code

- `index.html`: mobile-first controls and explanatory content.
- `style.css`: responsive styles.
- `app.js`: playback, Web Audio filters, local source decoding, export, presets.
- `engine-worker.js`: plain-JS FFT, phase-vocoder approximate time stretching, resampling/pitch conversion and cepstral formant shift.
- `sw.js`: optional shell caching, not audio-caching.

No external JS libraries or paid APIs are required at runtime. Sample audio is loaded from the project's own public GitHub files, and the browser's Web Audio API handles listening and WAV export.

## Tests and limitations

Static JS syntax and signal-processing unit tests were run in Node using synthetic waveforms. Tests checked waveform length at independently selected tempos, non-silent results, and stable processing for pitch-only/formant-only/combined settings. **Actual iPhone Safari playback remains to be validated on the device.** Sound quality is exploratory, not yet approved for release. On older phones, large changes or 30-second excerpts may take a few seconds to render.

The browser must support Web Workers and Web Audio/OfflineAudioContext. Recording output is currently **mono, 24 kHz, 16-bit WAV**. Reverb and echo tails are added after the spoken excerpt. Audio is not sent to a server.
