import { useRef, useCallback } from 'react'

// Pro vocal chain optimized for phone mics + headphones
// gate → HPF → comp → de-ess → warmth → box cut → presence → air → exciter → stereo width → reverb → delay → limiter
export function useVoiceEffects() {
  const ctxRef = useRef(null)

  const createChain = useCallback((audioContext, source) => {
    ctxRef.current = audioContext

    // 1. Noise gate — kill rumble, plosives, handling noise
    const gate = audioContext.createBiquadFilter()
    gate.type = 'highpass'
    gate.frequency.value = 100
    gate.Q.value = 0.7

    // 1b. Sub-bass rumble filter — aggressive roll-off below 60hz
    const subCut = audioContext.createBiquadFilter()
    subCut.type = 'highpass'
    subCut.frequency.value = 60
    subCut.Q.value = 1.2

    // 2. Compressor — broadcast vocal style, tames dynamics hard
    const comp = audioContext.createDynamicsCompressor()
    comp.threshold.value = -26
    comp.knee.value = 6
    comp.ratio.value = 6
    comp.attack.value = 0.003
    comp.release.value = 0.1

    // 2b. Second stage compression — gentle glue, evens out what the first missed
    const comp2 = audioContext.createDynamicsCompressor()
    comp2.threshold.value = -16
    comp2.knee.value = 10
    comp2.ratio.value = 3
    comp2.attack.value = 0.01
    comp2.release.value = 0.15

    // 3. De-esser — tame sibilance (harsh S sounds worse on phone mics)
    const deess = audioContext.createBiquadFilter()
    deess.type = 'peaking'
    deess.frequency.value = 6500
    deess.gain.value = -6
    deess.Q.value = 3

    // 3b. Second de-ess band for phone mic harshness
    const deess2 = audioContext.createBiquadFilter()
    deess2.type = 'peaking'
    deess2.frequency.value = 8500
    deess2.gain.value = -3
    deess2.Q.value = 2

    // 4. Low-mid warmth — adds body that phone mics lack
    const warmth = audioContext.createBiquadFilter()
    warmth.type = 'peaking'
    warmth.frequency.value = 200
    warmth.gain.value = 4
    warmth.Q.value = 0.6

    // 5. Mid cut — reduce boxiness / nasal quality
    const boxCut = audioContext.createBiquadFilter()
    boxCut.type = 'peaking'
    boxCut.frequency.value = 450
    boxCut.gain.value = -3
    boxCut.Q.value = 1.2

    // 6. Presence — vocal clarity, cut through the beat
    const presence = audioContext.createBiquadFilter()
    presence.type = 'peaking'
    presence.frequency.value = 3000
    presence.gain.value = 5
    presence.Q.value = 0.8

    // 7. Air — sparkle on top (subtle, phone mics are already harsh up here)
    const air = audioContext.createBiquadFilter()
    air.type = 'highshelf'
    air.frequency.value = 12000
    air.gain.value = 2

    // 8. Harmonic exciter — analog warmth via soft saturation
    const exciter = audioContext.createWaveShaper()
    const n = 44100
    const curve = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1
      // Gentle tube-style saturation — adds harmonics without obvious distortion
      curve[i] = (Math.tanh(x * 1.8) + Math.tanh(x * 0.5) * 0.3) / 1.3
    }
    exciter.curve = curve
    exciter.oversample = '4x'

    // Exciter parallel blend
    const exciterWet = audioContext.createGain()
    exciterWet.gain.value = 0.25
    const exciterDry = audioContext.createGain()
    exciterDry.gain.value = 0.75
    const exciterMix = audioContext.createGain()

    // 9. Stereo widener — Haas effect for width in headphones
    const splitter = audioContext.createChannelSplitter(2)
    const merger = audioContext.createChannelMerger(2)
    const delayL = audioContext.createDelay()
    delayL.delayTime.value = 0.0
    const delayR = audioContext.createDelay()
    delayR.delayTime.value = 0.0006  // 0.6ms Haas — noticeable width in headphones

    // 10. Plate reverb — lush, smooth tail (much better impulse)
    const convolver = audioContext.createConvolver()
    const reverbTime = 1.4
    const sr = audioContext.sampleRate
    const len = sr * reverbTime
    const impulse = audioContext.createBuffer(2, len, sr)
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        const t = i / sr
        const tNorm = i / len
        // Early reflections — multiple tap delays for density
        let early = 0
        const earlyTaps = [0.008, 0.013, 0.019, 0.024, 0.031, 0.037, 0.044]
        for (const tap of earlyTaps) {
          const tapSample = Math.floor(tap * sr)
          if (i >= tapSample - 20 && i <= tapSample + 20) {
            early += (Math.random() * 2 - 1) * 0.4 * Math.exp(-Math.abs(i - tapSample) / 10)
          }
        }
        // Late diffuse tail — exponential decay with randomized density
        const decay = Math.exp(-t * 3.5) * (1 - tNorm * 0.2)
        const noise = (Math.random() * 2 - 1)
        // Modulate for chorus-like movement (prevents metallic ringing)
        const mod = Math.sin(t * 2.3 * (1 + ch * 0.7)) * 0.08
        d[i] = (early + noise * decay + mod * decay) * 0.7
      }
    }
    convolver.buffer = impulse

    const preDelay = audioContext.createDelay()
    preDelay.delayTime.value = 0.02

    // Reverb HPF — keep reverb out of low end (mud prevention)
    const reverbHpf = audioContext.createBiquadFilter()
    reverbHpf.type = 'highpass'
    reverbHpf.frequency.value = 250

    // Reverb LPF — darken the tail (sounds more natural)
    const reverbLpf = audioContext.createBiquadFilter()
    reverbLpf.type = 'lowpass'
    reverbLpf.frequency.value = 6000

    const dryGain = audioContext.createGain()
    dryGain.gain.value = 0.72
    const wetGain = audioContext.createGain()
    wetGain.gain.value = 0.28

    // 11. Slapback delay — subtle depth and doubles effect
    const slap = audioContext.createDelay()
    slap.delayTime.value = 0.085
    const slapGain = audioContext.createGain()
    slapGain.gain.value = 0.15
    const slapFilter = audioContext.createBiquadFilter()
    slapFilter.type = 'lowpass'
    slapFilter.frequency.value = 3500

    // 11b. Second delay tap — creates a wider stereo field
    const slap2 = audioContext.createDelay()
    slap2.delayTime.value = 0.13
    const slapGain2 = audioContext.createGain()
    slapGain2.gain.value = 0.08
    const slapFilter2 = audioContext.createBiquadFilter()
    slapFilter2.type = 'lowpass'
    slapFilter2.frequency.value = 2500

    // 12. Final limiter — brick wall, prevents all clipping
    const limiter = audioContext.createDynamicsCompressor()
    limiter.threshold.value = -2
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.0003
    limiter.release.value = 0.025

    // Makeup gain — compensate for compression
    const makeup = audioContext.createGain()
    makeup.gain.value = 1.8

    // === Wire it all up ===

    // Main chain: source → sub cut → gate → comp → comp2 → de-ess → de-ess2 → warmth → box cut → presence → air
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

    // Reverb path (with HPF + LPF on the reverb tail)
    merger.connect(preDelay)
    preDelay.connect(reverbHpf)
    reverbHpf.connect(convolver)
    convolver.connect(reverbLpf)
    reverbLpf.connect(wetGain)
    wetGain.connect(makeup)

    // Slapback delay path (two taps for width)
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
  }, [])

  return { createChain }
}
