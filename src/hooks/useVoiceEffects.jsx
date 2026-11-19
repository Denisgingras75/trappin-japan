import { useCallback } from 'react'

// Pro vocal chain optimized for phone mics + headphones
// Presets: raw (bypass), clean (polish), studio (full production)

// Pre-compute expensive buffers once (these are pure data, no AudioContext needed for the curve)
const WAVESHAPER_SAMPLES = 44100
const _cachedWaveshaperCurve = new Float32Array(WAVESHAPER_SAMPLES)
for (let i = 0; i < WAVESHAPER_SAMPLES; i++) {
  const x = (i * 2) / WAVESHAPER_SAMPLES - 1
  _cachedWaveshaperCurve[i] = (Math.tanh(x * 1.8) + Math.tanh(x * 0.5) * 0.3) / 1.3
}

// Pre-compute impulse response data (raw Float32Arrays — we create the AudioBuffer lazily per context)
const REVERB_TIME = 0.9
const IMPULSE_SR = 48000
const IMPULSE_LEN = Math.floor(IMPULSE_SR * REVERB_TIME)
const _cachedImpulseData = [new Float32Array(IMPULSE_LEN), new Float32Array(IMPULSE_LEN)]
const earlyTaps = [0.008, 0.013, 0.019, 0.024, 0.031, 0.037, 0.044]
for (let ch = 0; ch < 2; ch++) {
  const d = _cachedImpulseData[ch]
  for (let i = 0; i < IMPULSE_LEN; i++) {
    const t = i / IMPULSE_SR
    const tNorm = i / IMPULSE_LEN
    let early = 0
    for (const tap of earlyTaps) {
      const tapSample = Math.floor(tap * IMPULSE_SR)
      if (i >= tapSample - 20 && i <= tapSample + 20) {
        early += (Math.random() * 2 - 1) * 0.4 * Math.exp(-Math.abs(i - tapSample) / 10)
      }
    }
    const decay = Math.exp(-t * 3.5) * (1 - tNorm * 0.2)
    const noise = (Math.random() * 2 - 1)
    const mod = Math.sin(t * 2.3 * (1 + ch * 0.7)) * 0.08
    d[i] = (early + noise * decay + mod * decay) * 0.7
  }
}

function createImpulseBuffer(ctx) {
  const buf = ctx.createBuffer(2, IMPULSE_LEN, IMPULSE_SR)
  for (let ch = 0; ch < 2; ch++) {
    buf.getChannelData(ch).set(_cachedImpulseData[ch])
  }
  return buf
}

function createRawChain(ctx, source) {
  const gain = ctx.createGain()
  gain.gain.value = 1.0
  source.connect(gain)
  return gain
}

// Shared front end for Clean and Studio: rumble filter → one gentle
// compressor → corrective EQ. Returns the last node.
//
// Why so gentle: DynamicsCompressorNode adds its own make-up gain, so the
// old stack (6:1 at -26 dB into 3:1 into a limiter, plus +4 dB of manual
// make-up) lifted everything between words — room noise and the beat
// leaking from the speaker — by well over 20 dB. One moderate stage keeps
// the voice even without dragging the background up with it.
function createVoiceCore(ctx, source) {
  const hpf = ctx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 90
  hpf.Q.value = 0.7

  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.knee.value = 12
  comp.ratio.value = 3
  comp.attack.value = 0.005
  comp.release.value = 0.12

  const boxCut = ctx.createBiquadFilter()
  boxCut.type = 'peaking'
  boxCut.frequency.value = 400
  boxCut.gain.value = -2
  boxCut.Q.value = 1.0

  const presence = ctx.createBiquadFilter()
  presence.type = 'peaking'
  presence.frequency.value = 3500
  presence.gain.value = 3
  presence.Q.value = 0.8

  const deess = ctx.createBiquadFilter()
  deess.type = 'peaking'
  deess.frequency.value = 7000
  deess.gain.value = -3
  deess.Q.value = 2

  const air = ctx.createBiquadFilter()
  air.type = 'highshelf'
  air.frequency.value = 11000
  air.gain.value = 2

  source.connect(hpf)
  hpf.connect(comp)
  comp.connect(boxCut)
  boxCut.connect(presence)
  presence.connect(deess)
  deess.connect(air)
  return air
}

// Catches stray peaks only; it is not there to add loudness.
function createLimiter(ctx) {
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -3
  limiter.knee.value = 0
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = 0.05
  return limiter
}

function createCleanChain(ctx, source) {
  const core = createVoiceCore(ctx, source)
  const limiter = createLimiter(ctx)
  core.connect(limiter)
  return limiter
}

function createStudioChain(ctx, source) {
  // Clean core → exciter → plate reverb + slapback → limiter
  const air = createVoiceCore(ctx, source)

  // Harmonic exciter (uses pre-computed curve)
  const exciter = ctx.createWaveShaper()
  exciter.curve = _cachedWaveshaperCurve
  exciter.oversample = '4x'

  const exciterWet = ctx.createGain()
  exciterWet.gain.value = 0.25
  const exciterDry = ctx.createGain()
  exciterDry.gain.value = 0.75
  const exciterMix = ctx.createGain()

  // Plate reverb (uses pre-computed impulse data)
  const convolver = ctx.createConvolver()
  convolver.buffer = createImpulseBuffer(ctx)

  const preDelay = ctx.createDelay()
  preDelay.delayTime.value = 0.02

  const reverbHpf = ctx.createBiquadFilter()
  reverbHpf.type = 'highpass'
  reverbHpf.frequency.value = 250

  const reverbLpf = ctx.createBiquadFilter()
  reverbLpf.type = 'lowpass'
  reverbLpf.frequency.value = 6000

  const dryGain = ctx.createGain()
  dryGain.gain.value = 0.92
  const wetGain = ctx.createGain()
  wetGain.gain.value = 0.08

  // Slapback delay
  const slap = ctx.createDelay()
  slap.delayTime.value = 0.085
  const slapGain = ctx.createGain()
  slapGain.gain.value = 0.05
  const slapFilter = ctx.createBiquadFilter()
  slapFilter.type = 'lowpass'
  slapFilter.frequency.value = 3500

  const slap2 = ctx.createDelay()
  slap2.delayTime.value = 0.13
  const slapGain2 = ctx.createGain()
  slapGain2.gain.value = 0.02
  const slapFilter2 = ctx.createBiquadFilter()
  slapFilter2.type = 'lowpass'
  slapFilter2.frequency.value = 2500

  const limiter = createLimiter(ctx)

  const makeup = ctx.createGain()
  // Brings Studio's dry/wet blend back up to Clean's level.
  makeup.gain.value = 1.6

  // Exciter parallel blend
  air.connect(exciter)
  exciter.connect(exciterWet)
  exciterWet.connect(exciterMix)
  air.connect(exciterDry)
  exciterDry.connect(exciterMix)

  // No stereo widener — Haas on a mono mic source routes the signal through
  // a 2-ch splitter that outputs silence on ch1, hard-panning voice to L and
  // creating comb-filter hollowness when summed to mono on phone speakers.

  // Dry path
  exciterMix.connect(dryGain)
  dryGain.connect(makeup)

  // Reverb path
  exciterMix.connect(preDelay)
  preDelay.connect(reverbHpf)
  reverbHpf.connect(convolver)
  convolver.connect(reverbLpf)
  reverbLpf.connect(wetGain)
  wetGain.connect(makeup)

  // Slapback delay
  exciterMix.connect(slap)
  slap.connect(slapFilter)
  slapFilter.connect(slapGain)
  slapGain.connect(makeup)

  exciterMix.connect(slap2)
  slap2.connect(slapFilter2)
  slapFilter2.connect(slapGain2)
  slapGain2.connect(makeup)

  // Final limiter
  makeup.connect(limiter)

  return limiter
}

const PRESETS = { raw: createRawChain, clean: createCleanChain, studio: createStudioChain }

export function buildChain(audioContext, source, preset = 'clean') {
  const builder = PRESETS[preset] || PRESETS.clean
  return builder(audioContext, source)
}

export function useVoiceEffects() {
  const createChain = useCallback(buildChain, [])

  return { createChain }
}
