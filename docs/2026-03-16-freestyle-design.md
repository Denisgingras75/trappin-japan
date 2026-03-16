# Freestyle — Async Rap Battle App

## Overview
Web app (PWA) for freestyle rap battles. Pick a beat, record your freestyle, challenge friends. Async back-and-forth rounds via shareable links.

## Stack
- React + Vite
- Supabase (auth, storage, database)
- PWA (installable on phone)

## Screens

### 1. Beats
- Browse curated beat library
- Upload your own beats (MP3/WAV, stored in Supabase Storage)
- Play/preview beats inline
- Filter: curated vs. user-uploaded

### 2. Record
- Select a beat (plays during recording)
- Record freestyle via MediaRecorder API
- Preview playback (beat + vocal layered)
- Save or send as challenge

### 3. Battles
- List of active battles (your challenges, challenges to you)
- Battle thread view: round-by-round playback
- "Record Response" button on opponent's turn
- Share via link (generates unique share code)

## Data Model

### beats
- id, title, audio_url, uploaded_by, is_curated, created_at

### battles
- id, challenger_id, opponent_id, beat_id, share_code, status (open/active/complete), created_at

### freestyles
- id, battle_id, user_id, audio_url, round_number, created_at

## Auth
Supabase auth — Google OAuth. Need accounts to track battles and ownership.

## Challenge Flow
1. User picks beat, records freestyle
2. Hits "Challenge a friend" → creates battle + share link
3. Friend opens link → hears challenger's freestyle → records response over same beat
4. Back and forth, no round limit
5. Either player can end the battle

## Out of Scope
- Voting / judging
- Leaderboards
- Comments
- Real-time battles
- Social feed
