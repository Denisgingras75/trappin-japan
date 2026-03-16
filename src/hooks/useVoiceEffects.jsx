import { useRef, useCallback } from 'react'

// Pro vocal chain: gate → comp → de-ess → warmth → presence → air → exciter → stereo width → reverb → delay → limiter
export function useVoiceEffects() {
  const ctxRef = useRef(null)

  const createChain = useCallback((audioContext, source) => {
    ctxRef.current = audioContext

    // 1. Noise gate — kill rumble and room noise
    const gate = audioContext.createBiquadFilter()
    gate.type = 'highpass'
    gate.frequency.value = 90
    gate.Q.value = 0.7

    // 2. Compressor — heavy, radio vocal style
    const comp = audioContext.createDynamicsCompressor()
    comp.threshold.value = -22
    comp.knee.value = 4
    comp.ratio.value = 8
    comp.attack.value = 0.001
    comp.release.value = 0.08

    // 3. De-esser
    const deess = audioContext.createBiquadFilter()
    deess.type = 'peaking'
    deess.frequency.value = 6800
    deess.gain.value = -5
    deess.Q.value = 4

    // 4. Low-mid warmth — body
    const warmth = audioContext.createBiquadFilter()
    warmth.type = 'peaking'
    warmth.frequency.value = 220
    warmth.gain.value = 3
    warmth.Q.value = 0.7

    // 5. Mid cut — reduce boxiness
    const boxCut = audioContext.createBiquadFilter()
    boxCut.type = 'peaking'
    boxCut.frequency.value = 500
    boxCut.gain.value = -2
    boxCut.Q.value = 1.5

    // 6. Presence — cut through the beat
    const presence = audioContext.createBiquadFilter()
    presence.type = 'peaking'
    presence.frequency.value = 3200
    presence.gain.value = 6
    presence.Q.value = 0.9

    // 7. Air — sparkle on top
    const air = audioContext.createBiquadFilter()
    air.type = 'highshelf'
    air.frequency.value = 10000
    air.gain.value = 3.5

    // 8. Harmonic exciter — analog warmth via soft clip
    const exciter = audioContext.createWaveShaper()
    const n = 44100
    const curve = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1
      // Soft saturation — tube-style
      curve[i] = Math.tanh(x * 1.5) * 0.9
    }
    exciter.curve = curve
    exciter.oversample = '4x'

    // Exciter blend (parallel)
    const exciterWet = audioContext.createGain()
    exciterWet.gain.value = 0.2
    const exciterDry = audioContext.createGain()
    exciterDry.gain.value = 0.8
    const exciterMix = audioContext.createGain()

    // 9. Stereo widener — split into L/R with subtle delay offset
    const splitter = audioContext.createChannelSplitter(2)
    const merger = audioContext.createChannelMerger(2)
    const delayL = audioContext.createDelay()
    delayL.delayTime.value = 0.0
    const delayR = audioContext.createDelay()
    delayR.delayTime.value = 0.0004  // 0.4ms Haas effect for width

    // 10. Plate reverb — lush, tight tail
    const convolver = audioContext.createConvolver()
    const reverbTime = 1.0
    const sr = audioContext.sampleRate
    const len = sr * reverbTime
    const impulse = audioContext.createBuffer(2, len, sr)
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch)
      for (let i = 0; i < len; i++) {
        const t = i / len
        // Dense early reflections + smooth exponential decay
        const early = i < sr * 0.04 ? Math.random() * 0.8 : 0
        const tail = (Math.random() * 2 - 1) * Math.exp(-t * 4)
        const diffuse = Math.sin(i * (0.05 + ch * 0.02)) * 0.15
        d[i] = (early + tail + diffuse) * (1 - t * 0.3)
      }
    }
    convolver.buffer = impulse

    const preDelay = audioContext.createDelay()
    preDelay.delayTime.value = 0.025

    // Reverb HPF — keep reverb out of low end
    const reverbHpf = audioContext.createBiquadFilter()
    reverbHpf.type = 'highpass'
    reverbHpf.frequency.value = 300

    const dryGain = audioContext.createGain()
    dryGain.gain.value = 0.75
    const wetGain = audioContext.createGain()
    wetGain.gain.value = 0.25

    // 11. Slapback delay — subtle depth
    const slap = audioContext.createDelay()
    slap.delayTime.value = 0.08
    const slapGain = audioContext.createGain()
    slapGain.gain.value = 0.12
    const slapFilter = audioContext.createBiquadFilter()
    slapFilter.type = 'lowpass'
    slapFilter.frequency.value = 4000

    // 12. Final limiter — brick wall, no clipping
    const limiter = audioContext.createDynamicsCompressor()
    limiter.threshold.value = -1.5
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.0005
    limiter.release.value = 0.03

    // Makeup gain
    const makeup = audioContext.createGain()
    makeup.gain.value = 1.5

    // === Wire it all up ===

    // Main chain: source → gate → comp → de-ess → warmth → box cut → presence → air
    source.connect(gate)
    gate.connect(comp)
    comp.connect(deess)
    deess.connect(warmth)
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
    convolver.connect(wetGain)
    wetGain.connect(makeup)

    // Slapback delay path
    merger.connect(slap)
    slap.connect(slapFilter)
    slapFilter.connect(slapGain)
    slapGain.connect(makeup)

    // Final limiter
    makeup.connect(limiter)

    return limiter
  }, [])

  return { createChain }
}
