-- Fresh start: wipe all beats, battles, and freestyles, seed exactly 10
-- curated beats across all moods. URLs point to existing Supabase storage
-- uploads (already there, known-good, served from Supabase CDN).

DELETE FROM freestyles;
DELETE FROM battle_participants;
DELETE FROM battles;
DELETE FROM beats;

INSERT INTO beats (title, audio_url, is_curated, category) VALUES
  ('Da Coming',        'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-01-da-coming.mp3',    true, 'boom-bap'),
  ('Six Feet Deep',    'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-14-six-feet-deep.mp3', true, 'boom-bap'),
  ('Trappin Japan',    'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trappin-japan.mp3',                  true, 'trap'),
  ('Narcotic Nebula',  'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-01-narcotic-nebula.mp3',      true, 'trap'),
  ('Just Chill',       'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-05-just-chill.mp3',         true, 'chill'),
  ('Dream On',         'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-11-dream-on.mp3',           true, 'chill'),
  ('4am',              'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-03-4am.mp3',                  true, 'dark'),
  ('Dark Prophecy',    'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-04-dark-prophecy.mp3',        true, 'dark'),
  ('Godfather',        'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-13-godfather.mp3',            true, 'hype'),
  ('Cuban Links',      'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/cuban-links.mp3',                  true, 'hype');
