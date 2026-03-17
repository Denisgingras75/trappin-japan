import { useCallback } from 'react'

// Pro vocal chain optimized for phone mics + headphones
// Presets: raw (bypass), clean (polish), studio (full production)

function createRawChain(ctx, source) {
  const gain = ctx.createGain()
  gain.gain.value = 1.0
  source.connect(gain)
  return gain
}

function createCleanChain(ctx, source) {
  // HPF → comp → de-ess → warmth → box cut → presence → air → limiter
  // No reverb, delay, exciter, or stereo width

  const subCut = ctx.createBiquadFilter()
  subCut.type = 'highpass'
  subCut.frequency.value = 60
  subCut.Q.value = 1.2

  const gate = ctx.createBiquadFilter()
  gate.type = 'highpass'
  gate.frequency.value = 100
  gate.Q.value = 0.7

  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -26
  comp.knee.value = 6
  comp.ratio.value = 6
  comp.attack.value = 0.003
  comp.release.value = 0.1

  const comp2 = ctx.createDynamicsCompressor()
  comp2.threshold.value = -16
  comp2.knee.value = 10
  comp2.ratio.value = 3
  comp2.attack.value = 0.01
  comp2.release.value = 0.15

  const deess = ctx.createBiquadFilter()
  deess.type = 'peaking'
  deess.frequency.value = 6500
  deess.gain.value = -6
  deess.Q.value = 3

  const deess2 = ctx.createBiquadFilter()
  deess2.type = 'peaking'
  deess2.frequency.value = 8500
  deess2.gain.value = -3
  deess2.Q.value = 2

  const warmth = ctx.createBiquadFilter()
  warmth.type = 'peaking'
  warmth.frequency.value = 200
  warmth.gain.value = 4
  warmth.Q.value = 0.6

  const boxCut = ctx.createBiquadFilter()
  boxCut.type = 'peaking'
  boxCut.frequency.value = 450
  boxCut.gain.value = -3
  boxCut.Q.value = 1.2

  const presence = ctx.createBiquadFilter()
  presence.type = 'peaking'
  presence.frequency.value = 3000
  presence.gain.value = 5
  presence.Q.value = 0.8

  const air = ctx.createBiquadFilter()
  air.type = 'highshelf'
  air.frequency.value = 12000
  air.gain.value = 2

  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -2
  limiter.knee.value = 0
  limiter.ratio.value = 20
  limiter.attack.value = 0.0003
  limiter.release.value = 0.025

  const makeup = ctx.createGain()
  makeup.gain.value = 1.6

  source.connect(subCut)
  subCut.connect(gate)
  gate.connect(comp)
  comp.connect(comp2)
  comp2.connect(deess)
  deess.connect(deess2)
  deess2.connect(warmth)
  warmth.connect(boxCut)
  boxCut.connect(presence)
  presence.connect(air)
  air.connect(makeup)
  makeup.connect(limiter)

  return limiter
}

function createStudioChain(ctx, source) {
  // Full chain: gate → HPF → comp → de-ess → warmth → box cut → presence → air
  //   → exciter → stereo width → reverb → delay → limiter

  const subCut = ctx.createBiquadFilter()
  subCut.type = 'highpass'
  subCut.frequency.value = 60
  subCut.Q.value = 1.2

  const gate = ctx.createBiquadFilter()
  gate.type = 'highpass'
  gate.frequency.value = 100
  gate.Q.value = 0.7

  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -26
  comp.knee.value = 6
  comp.ratio.value = 6
  comp.attack.value = 0.003
  comp.release.value = 0.1

  const comp2 = ctx.createDynamicsCompressor()
  comp2.threshold.value = -16
  comp2.knee.value = 10
  comp2.ratio.value = 3
  comp2.attack.value = 0.01
  comp2.release.value = 0.15

  const deess = ctx.createBiquadFilter()
  deess.type = 'peaking'
  deess.frequency.value = 6500
  deess.gain.value = -6
  deess.Q.value = 3

  const deess2 = ctx.createBiquadFilter()
  deess2.type = 'peaking'
  deess2.frequency.value = 8500
  deess2.gain.value = -3
  deess2.Q.value = 2

  const warmth = ctx.createBiquadFilter()
  warmth.type = 'peaking'
  warmth.frequency.value = 200
  warmth.gain.value = 4
  warmth.Q.value = 0.6

  const boxCut = ctx.createBiquadFilter()
  boxCut.type = 'peaking'
  boxCut.frequency.value = 450
  boxCut.gain.value = -3
  boxCut.Q.value = 1.2

  const presence = ctx.createBiquadFilter()
  presence.type = 'peaking'
  presence.frequency.value = 3000
  presence.gain.value = 5
  presence.Q.value = 0.8

  const air = ctx.createBiquadFilter()
  air.type = 'highshelf'
  air.frequency.value = 12000
  air.gain.value = 2

  // Harmonic exciter
  const exciter = ctx.createWaveShaper()
  const n = 44100
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = (Math.tanh(x * 1.8) + Math.tanh(x * 0.5) * 0.3) / 1.3
  }
  exciter.curve = curve
  exciter.oversample = '4x'

  const exciterWet = ctx.createGain()
  exciterWet.gain.value = 0.25
  const exciterDry = ctx.createGain()
  exciterDry.gain.value = 0.75
  const exciterMix = ctx.createGain()

  // Stereo widener (Haas effect)
  const splitter = ctx.createChannelSplitter(2)
  const merger = ctx.createChannelMerger(2)
  const delayL = ctx.createDelay()
  delayL.delayTime.value = 0.0
  const delayR = ctx.createDelay()
  delayR.delayTime.value = 0.0006

  // Plate reverb
  const convolver = ctx.createConvolver()
  const reverbTime = 0.9
  const sr = ctx.sampleRate
  const len = sr * reverbTime
  const impulse = ctx.createBuffer(2, len, sr)
  for (let ch = 0; ch < 2; ch++) {
    const d = impulse.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const t = i / sr
      const tNorm = i / len
      let early = 0
      const earlyTaps = [0.008, 0.013, 0.019, 0.024, 0.031, 0.037, 0.044]
      for (const tap of earlyTaps) {
        const tapSample = Math.floor(tap * sr)
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
  convolver.buffer = impulse

  const preDelay = ctx.createDelay()
  preDelay.delayTime.value = 0.02

  const reverbHpf = ctx.createBiquadFilter()
  reverbHpf.type = 'highpass'
  reverbHpf.frequency.value = 250

  const reverbLpf = ctx.createBiquadFilter()
  reverbLpf.type = 'lowpass'
  reverbLpf.frequency.value = 6000

  const dryGain = ctx.createGain()
  dryGain.gain.value = 0.82
  const wetGain = ctx.createGain()
  wetGain.gain.value = 0.18

  // Slapback delay
  const slap = ctx.createDelay()
  slap.delayTime.value = 0.085
  const slapGain = ctx.createGain()
  slapGain.gain.value = 0.10
  const slapFilter = ctx.createBiquadFilter()
  slapFilter.type = 'lowpass'
  slapFilter.frequency.value = 3500

  const slap2 = ctx.createDelay()
  slap2.delayTime.value = 0.13
  const slapGain2 = ctx.createGain()
  slapGain2.gain.value = 0.05
  const slapFilter2 = ctx.createBiquadFilter()
  slapFilter2.type = 'lowpass'
  slapFilter2.frequency.value = 2500

  // Final limiter
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -2
  limiter.knee.value = 0
  limiter.ratio.value = 20
  limiter.attack.value = 0.0003
  limiter.release.value = 0.025

  const makeup = ctx.createGain()
  makeup.gain.value = 1.8

  // Wire it up
  source.connect(subCut)
  subCut.connect(gate)
  gate.connect(comp)
  comp.connect(comp2)
  comp2.connect(deess)
  deess.connect(deess2)
  deess2.connect(warmth)
  warmth.connect(boxCut)
  boxCut.connect(presence)
  presence.connect(air)

  // Exciter parallel blend
  air.connect(exciter)
  exciter.connect(exciterWet)
  exciterWet.connect(exciterMix)
  air.connect(exciterDry)
  exciterDry.connect(exciterMix)

  // Stereo widener
  exciterMix.connect(splitter)
  splitter.connect(delayL, 0)
  splitter.connect(delayR, 1)
  delayL.connect(merger, 0, 0)
  delayR.connect(merger, 0, 1)

  // Dry path
  merger.connect(dryGain)
  dryGain.connect(makeup)

  // Reverb path
  merger.connect(preDelay)
  preDelay.connect(reverbHpf)
  reverbHpf.connect(convolver)
  convolver.connect(reverbLpf)
  reverbLpf.connect(wetGain)
  wetGain.connect(makeup)

  // Slapback delay
  merger.connect(slap)
  slap.connect(slapFilter)
  slapFilter.connect(slapGain)
  slapGain.connect(makeup)

  merger.connect(slap2)
  slap2.connect(slapFilter2)
  slapFilter2.connect(slapGain2)
  slapGain2.connect(makeup)

  // Final limiter
  makeup.connect(limiter)

  return limiter
}

const PRESETS = { raw: createRawChain, clean: createCleanChain, studio: createStudioChain }

export function useVoiceEffects() {
  const createChain = useCallback((audioContext, source, preset = 'studio') => {
    const builder = PRESETS[preset] || PRESETS.studio
    return builder(audioContext, source)
  }, [])

  return { createChain }
}
