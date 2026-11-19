# Freestyle (Trappin Japan)

Async rap battle app. Pick a beat, record a freestyle, challenge your boys.

## Stack
- React 18 + Vite 5 + React Router 6
- Supabase (auth, storage, Postgres)
- Vercel (hosting)
- PWA (vite-plugin-pwa)
- Web Audio API (effects chain, no external audio libs)

## Architecture
- Voice-only recording: mic → effects chain → MediaRecorder (beat NOT in recording)
- Beat plays via native `<audio>` element (no AudioContext routing)
- Beat mixed on playback via AudioPlayer dual-source (voice + beat synced)
- FX presets: Raw (bypass), Clean (compression+EQ), Studio (full 12-stage chain)
- Beats hosted on Supabase storage (was archive.org, too slow)
- Beat and recorder start in the same tick; device latency is saved per take (`beat_offset_ms`) and AudioPlayer delays the beat by it on playback
- Every round stores its own `beat_id` — responders can keep the beat or pick their own
- One AudioPlayer plays at a time; `stopAllPlayers()` runs before the mic opens

## Goals / Roadmap
- [x] Voice-only recording (no speaker bleed)
- [x] FX presets (Raw / Clean / Studio)
- [x] Take length = beat length (no heat picker; beat plays once and ends the take)
- [x] Headphones / speakers mode
- [x] Group battles (2+ people)
- [x] Tagging targets ("who you dissing")
- [x] Live transcript (Web Speech API)
- [x] Beat search
- [x] Mic pre-warm (instant start)
- [x] Beat volume slider
- [x] Beats on Supabase storage (fast CDN)
- [ ] AI beat generation (Suno API or similar)
- [ ] Recording quality tuning — Denis wants it to "sound decent"
- [ ] Custom domain (trappinjapan.com or similar)
- [ ] User profiles / display names (currently shows user ID prefixes)
- [ ] Voting / reactions on freestyles

## Gotchas
- `createMediaElementSource()` permanently binds audio to AudioContext — never use for elements that outlive the context
- Pre-warm `getUserMedia()` on page mount or first record takes ~10s
- `crossOrigin="anonymous"` on audio elements is only needed for AudioContext routing — remove otherwise
- PWA service worker caches aggressively — users may need hard refresh after deploys
- Stereo widener in Studio FX is a no-op on mono mic (channelCount: 1)

## Key Files
| Function | File |
|----------|------|
| Recording pipeline | src/hooks/useRecorder.jsx |
| Effects DSP (3 presets) | src/hooks/useVoiceEffects.jsx |
| Record page UI | src/pages/Record.jsx |
| Beat browser + search | src/pages/Beats.jsx |
| Audio playback (dual-source) | src/components/AudioPlayer.jsx |
| Beat picker (search + preview) | src/components/BeatPicker.jsx |
| Battle thread | src/pages/BattleThread.jsx |
| Challenge entry (public) | src/pages/Challenge.jsx |
| Auth (Google OAuth) | src/hooks/useAuth.jsx |
| Schema reference | supabase/schema.sql |

## Database
- `beats` — title, audio_url, category, bpm, mood, energy, duration_ms, gain_db (loudness trim), lead_in_ms (skipped dead air)
- `battles` — challenger_id, beat_id, share_code, status, max_participants
- `battle_participants` — battle_id, user_id, role (creator/participant)
- `freestyles` — battle_id, user_id, audio_url, round_number, targets[], beat_id, beat_offset_ms, beat_start_ms, duration_ms
