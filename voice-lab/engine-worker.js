/* Lewis Voice Lab: independent pitch, tempo, and formant audition processor.
 * Plain JavaScript, no remote DSP dependency. Preview-quality phase vocoder,
 * resampler, and cepstral envelope shifter. MIT-style project-specific code.
 */
'use strict';

let master = null;
let sampleRate = 24000;
const TAU = 2 * Math.PI;

function fft(real, imaginary, inverse = false) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let tmp = real[i]; real[i] = real[j]; real[j] = tmp;
      tmp = imaginary[i]; imaginary[i] = imaginary[j]; imaginary[j] = tmp;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 1 : -1) * TAU / len;
    const cr = Math.cos(ang), ci = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0;
      for (let j = 0; j < len / 2; j++) {
        const p = i + j, q = p + len / 2;
        const vr = real[q] * wr - imaginary[q] * wi;
        const vi = real[q] * wi + imaginary[q] * wr;
        real[q] = real[p] - vr;
        imaginary[q] = imaginary[p] - vi;
        real[p] += vr;
        imaginary[p] += vi;
        const nwr = wr * cr - wi * ci;
        wi = wr * ci + wi * cr;
        wr = nwr;
      }
    }
  }
  if (inverse) {
    for (let k = 0; k < n; k++) { real[k] /= n; imaginary[k] /= n; }
  }
}

function windowFn(size) {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) window[i] = Math.sqrt(.5 - .5 * Math.cos(TAU * i / (size - 1)));
  return window;
}

function principal(x) { return x - TAU * Math.round(x / TAU); }

/* Time stretching through STFT phase accumulation, with a fractional synthesis hop.
 * Preserves approximate pitch without changing the duration independently. */
function stretch(input, factor) {
  if (Math.abs(factor - 1) < 0.0005) return input.slice();
  const size = 1024, hopA = 192, hopS = hopA * factor;
  const frameCount = Math.max(1, Math.ceil(input.length / hopA));
  const desiredLength = Math.max(1, Math.round(input.length * factor));
  const length = desiredLength + size * 2;
  const output = new Float32Array(length);
  const weights = new Float32Array(length);
  const window = windowFn(size);
  const re = new Float64Array(size), im = new Float64Array(size);
  const prev = new Float64Array(size / 2 + 1);
  const sumPhases = new Float64Array(size / 2 + 1);
  for (let frame = 0; frame < frameCount; frame++) {
    const posA = frame * hopA;
    const posS = Math.round(frame * hopS);
    re.fill(0); im.fill(0);
    for (let i = 0; i < size; i++) re[i] = (input[posA + i] || 0) * window[i];
    fft(re, im);
    for (let k = 0; k <= size / 2; k++) {
      const mag = Math.hypot(re[k], im[k]);
      const phase = Math.atan2(im[k], re[k]);
      if (frame === 0) sumPhases[k] = phase;
      else {
        const expected = TAU * k * hopA / size;
        const phaseDev = principal(phase - prev[k] - expected);
        sumPhases[k] += (expected + phaseDev) * factor;
      }
      prev[k] = phase;
      re[k] = mag * Math.cos(sumPhases[k]);
      im[k] = mag * Math.sin(sumPhases[k]);
      if (k > 0 && k < size / 2) {
        re[size-k] = re[k]; im[size-k] = -im[k];
      }
    }
    fft(re, im, true);
    for (let i = 0; i < size && posS + i < length; i++) {
      const dst = posS + i, w = window[i];
      output[dst] += re[i] * w;
      weights[dst] += w * w;
    }
  }
  const result = new Float32Array(desiredLength);
  for (let i = 0; i < result.length; i++) result[i] = weights[i] > .035 ? output[i] / weights[i] : 0;
  return result;
}

function resample(input, ratio, outLength) {
  const length = outLength || Math.max(1, Math.round(input.length / ratio));
  if (Math.abs(ratio - 1) < .0005 && length === input.length) return input.slice();
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const index = i * ratio, lower = Math.floor(index), fraction = index - lower;
    const a = input[lower] || 0;
    const b = input[lower + 1] === undefined ? a : input[lower + 1];
    result[i] = a + fraction * (b - a);
  }
  return result;
}

/* Cepstral envelope shifting: explicit spectral-envelope movement, independent of pitch.
 * For each frame estimate smoothed log magnitude from the low-quefrency real
 * cepstrum, then move that envelope relative to the existing harmonic peaks.
 * This is true approximate formant processing, not a low-shelf EQ shortcut.
 */
function formantShift(input, ratio) {
  if (Math.abs(ratio - 1) < .007) return input.slice();
  const size = 2048, hop = 256;
  const output = new Float32Array(input.length + size);
  const weights = new Float32Array(input.length + size);
  const window = windowFn(size);
  const re = new Float64Array(size), im = new Float64Array(size);
  const cepR = new Float64Array(size), cepI = new Float64Array(size);
  const env = new Float64Array(size / 2 + 1);
  const limit = 35; // low-quefrency cepstrum = smooth vocal-tract resonances
  for (let start = 0; start < input.length; start += hop) {
    re.fill(0); im.fill(0);
    for (let j = 0; j < size; j++) re[j] = (input[start + j] || 0) * window[j];
    fft(re, im);
    for (let k = 0; k < size; k++) {
      cepR[k] = Math.log(Math.max(0.00001, Math.hypot(re[k], im[k])));
      cepI[k] = 0;
    }
    fft(cepR, cepI, true);
    for (let k = limit + 1; k < size - limit; k++) { cepR[k] = 0; cepI[k] = 0; }
    // A slight lifter edge taper reduces sharp ripples in envelope estimates.
    for (let k = 0; k <= limit; k++) {
      const taper = k < limit - 5 ? 1 : .5 + .5 * Math.cos(Math.PI * (k - limit + 5) / 5);
      cepR[k] *= taper;
      if (k > 0) cepR[size - k] *= taper;
    }
    fft(cepR, cepI);
    for (let k = 0; k <= size / 2; k++) env[k] = cepR[k];
    for (let k = 0; k <= size / 2; k++) {
      const sourceBin = Math.min(size/2, k / ratio);
      const l = Math.floor(sourceBin), t = sourceBin - l;
      const shifted = env[l] * (1-t) + env[Math.min(size/2,l+1)] * t;
      const factor = Math.exp(Math.max(-1.35, Math.min(1.35, shifted - env[k])));
      re[k] *= factor; im[k] *= factor;
      if (k > 0 && k < size / 2) {
        re[size-k] *= factor; im[size-k] *= factor;
      }
    }
    fft(re, im, true);
    for (let j = 0; j < size; j++) {
      const dst = start + j, w = window[j];
      output[dst] += re[j] * w;
      weights[dst] += w*w;
    }
  }
  const result = new Float32Array(input.length);
  for (let i = 0; i < result.length; i++) result[i] = weights[i] > .035 ? output[i] / weights[i] : 0;
  return result;
}

function process(opts) {
  const pitchSemis = Number(opts.pitch) || 0;
  const formantSemis = Number(opts.formant) || 0;
  const speed = Math.max(.5, Math.min(1.65, Number(opts.speed) || 1));
  const pitchRatio = Math.pow(2, pitchSemis / 12);
  const formantRatio = Math.pow(2, formantSemis / 12);
  if (!master) throw new Error('No voice sample loaded');
  if (Math.abs(pitchRatio-1)<.001 && Math.abs(formantRatio-1)<.001 && Math.abs(speed-1)<.001) return master.slice();
  const factor = pitchRatio / speed;
  let processed = stretch(master, factor);
  processed = resample(processed, pitchRatio, Math.max(1, Math.round(master.length / speed)));
  // Resampling scales the full spectrum: counteract this before applying the
  // user-requested *independent* movement of vocal-tract formants.
  const netFormantRatio = formantRatio / pitchRatio;
  if (Math.abs(netFormantRatio - 1) > .007) processed = formantShift(processed, netFormantRatio);
  // Prevent extreme processing from clipping while preserving gentle changes.
  let peak = 0;
  for (let i = 0; i < processed.length; i++) peak = Math.max(peak, Math.abs(processed[i]));
  if (peak > .94) {
    const scale = .94 / peak;
    for (let i = 0; i < processed.length; i++) processed[i] *= scale;
  }
  return processed;
}

self.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === 'load') {
    master = new Float32Array(msg.samples);
    sampleRate = msg.sampleRate;
    self.postMessage({type:'loaded',length:master.length,sampleRate});
  }
  if (msg.type === 'render') {
    const start = performance.now();
    try {
      const pcm = process(msg.settings);
      self.postMessage({type:'rendered',id:msg.id,buffer:pcm.buffer,
        duration:pcm.length/sampleRate,elapsedMs:Math.round(performance.now()-start)},[pcm.buffer]);
    } catch (e) {self.postMessage({type:'error',id:msg.id,message:String(e.message||e)});}
  }
};
