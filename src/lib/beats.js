export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'boom-bap', label: 'Boom Bap' },
  { key: 'trap', label: 'Trap' },
  { key: 'chill', label: 'Chill' },
  { key: 'dark', label: 'Dark' },
  { key: 'hype', label: 'Hype' }
]

// Beats saved as "youtube:<id>" have no audio file behind them, so they
// can't be played or recorded over.
export const isPlayableBeat = (beat) =>
  !!beat?.audio_url && !beat.audio_url.startsWith('youtube:')

// Per-beat loudness trim (dB → linear). Evens out quiet and loud beats.
export const beatGain = (beat) => Math.pow(10, (Number(beat?.gain_db) || 0) / 20)

export const formatLength = (ms) => {
  if (!ms) return ''
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Measure an audio file in the browser: length, a loudness trim that puts
// it level with the curated beats, and any dead air at the start.
// (Plain RMS runs about 1 dB under LUFS on beats, hence the -16 target.)
async function measureBeat(file) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  try {
    const buf = await ctx.decodeAudioData(await file.arrayBuffer())
    const chans = []
    for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c))
    const n = buf.length
    const floor = Math.pow(10, -45 / 20)
    let sum = 0
    let first = -1
    for (let i = 0; i < n; i++) {
      let x = 0
      for (let c = 0; c < chans.length; c++) x += chans[c][i]
      x /= chans.length
      sum += x * x
      if (first < 0 && Math.abs(x) > floor) first = i
    }
    const rmsDb = 10 * Math.log10(sum / n + 1e-12)
    const leadMs = first > 0 ? Math.round((first / buf.sampleRate) * 1000) : 0
    return {
      duration_ms: Math.round(buf.duration * 1000),
      gain_db: Math.round(Math.min(Math.max(-16 - rmsDb, -8), 4) * 10) / 10,
      lead_in_ms: leadMs > 30 && leadMs < 10000 ? leadMs : 0
    }
  } finally {
    ctx.close().catch(() => {})
  }
}

export const MAX_BEAT_BYTES = 40 * 1024 * 1024

// Upload a beat file and add it to the shared library, where everyone can
// pick it. Returns { beat } or { error } with a message fit to show.
export async function uploadBeat(supabase, file, title) {
  if (!file) return { error: 'Pick an audio file first' }
  if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name)) {
    return { error: 'That is not an audio file — use MP3, M4A or WAV' }
  }
  if (file.size > MAX_BEAT_BYTES) return { error: 'That file is too big — keep beats under 40 MB' }

  let measured
  try {
    measured = await measureBeat(file)
  } catch (e) {
    return { error: 'Could not read that file — try an MP3 or WAV' }
  }
  if (measured.duration_ms < 20000) return { error: 'That beat is under 20 seconds — too short to rap on' }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return { error: 'Sign in again to add a beat' }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80)
  const path = `beats/${user.id}/${Date.now()}-${safeName}`
  const { error: upErr } = await supabase.storage.from('audio')
    .upload(path, file, { contentType: file.type || 'audio/mpeg' })
  if (upErr) return { error: 'Upload failed — check your connection and try again' }

  const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)
  const row = {
    title: (title || '').trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Untitled beat',
    audio_url: publicUrl,
    uploaded_by: user.id,
    is_curated: false
  }
  let { data: beat, error } = await supabase.from('beats').insert({ ...row, ...measured }).select().single()
  if (error && (error.code === 'PGRST204' || error.code === '42703')) {
    ({ data: beat, error } = await supabase.from('beats').insert(row).select().single())
  }
  if (error || !beat) return { error: 'Could not save the beat — try again' }
  return { beat }
}
