// Seed curated freestyle beats from free sources
// Run: node scripts/seed-beats.js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://zxzhwjrrstmmnjrhhewi.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

const curatedBeats = [
  {
    title: 'Boom Bap Classic',
    audio_url: 'https://cdn.pixabay.com/audio/2024/11/26/audio_d60c205e30.mp3',
    is_curated: true
  },
  {
    title: 'Dark Trap Beat',
    audio_url: 'https://cdn.pixabay.com/audio/2024/02/14/audio_8e64e06b13.mp3',
    is_curated: true
  },
  {
    title: 'Lo-Fi Hip Hop',
    audio_url: 'https://cdn.pixabay.com/audio/2024/09/10/audio_6e5926e88a.mp3',
    is_curated: true
  },
  {
    title: 'Hard Freestyle',
    audio_url: 'https://cdn.pixabay.com/audio/2024/04/17/audio_58ab081e0c.mp3',
    is_curated: true
  },
  {
    title: 'Chill Vibes Beat',
    audio_url: 'https://cdn.pixabay.com/audio/2023/10/24/audio_3f4295a27c.mp3',
    is_curated: true
  },
  {
    title: 'Street Cypher',
    audio_url: 'https://cdn.pixabay.com/audio/2024/06/12/audio_0bfc049fa7.mp3',
    is_curated: true
  }
]

async function seed() {
  const { data, error } = await supabase.from('beats').insert(curatedBeats).select()
  if (error) {
    console.error('Error seeding:', error.message)
  } else {
    console.log(`Seeded ${data.length} curated beats`)
  }
}

seed()
