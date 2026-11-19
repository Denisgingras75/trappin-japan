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
