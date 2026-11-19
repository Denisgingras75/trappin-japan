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
