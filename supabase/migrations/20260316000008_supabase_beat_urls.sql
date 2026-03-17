-- Migrate ALL curated beat URLs to Supabase storage
-- Archive.org was too slow (5s+ load, stalls on mobile)
-- Now served from Supabase CDN — instant loading

-- Wipe and re-seed all curated beats with Supabase storage URLs
DELETE FROM freestyles WHERE battle_id IN (
  SELECT b.id FROM battles b JOIN beats bt ON b.beat_id = bt.id WHERE bt.is_curated = true
);
DELETE FROM battles WHERE beat_id IN (SELECT id FROM beats WHERE is_curated = true);
DELETE FROM beats WHERE is_curated = true;


-- BOOM-BAP
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Benjamins Freestyle', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/benjamins-freestyle.mp3', true, 'boom-bap'),
('Da Coming', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-01-da-coming.mp3', true, 'boom-bap'),
('Secret Doctrine', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-02-secret-doctrine.mp3', true, 'boom-bap'),
('Riding With Ancestors', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-03-riding-with-ancestors.mp3', true, 'boom-bap'),
('Da Defanishun', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-04-da-defanishun.mp3', true, 'boom-bap'),
('Black Monk', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-05-black-monk.mp3', true, 'boom-bap'),
('Follow Me', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-06-follow-me.mp3', true, 'boom-bap'),
('Bap Relations', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-07-bap-relations.mp3', true, 'boom-bap'),
('Spinnin', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-08-spinnin.mp3', true, 'boom-bap'),
('Message For The God', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-09-message-for-the-god.mp3', true, 'boom-bap'),
('Wu Tang', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-10-wu-tang.mp3', true, 'boom-bap'),
('Doom', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-11-doom.mp3', true, 'boom-bap'),
('Westside Gunn', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-12-westside-gunn.mp3', true, 'boom-bap'),
('Black Moon', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-13-black-moon.mp3', true, 'boom-bap'),
('Six Feet Deep', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-14-six-feet-deep.mp3', true, 'boom-bap'),
('Brainstorm', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-15-brainstorm.mp3', true, 'boom-bap'),
('Big L', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-16-big-l.mp3', true, 'boom-bap'),
('Lord Finesse', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-17-lord-finesse.mp3', true, 'boom-bap'),
('Hip Hop Fanatic', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-18-hip-hop-fanatic.mp3', true, 'boom-bap'),
('Parabolic Jazz', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-19-parabolic-jazz.mp3', true, 'boom-bap'),
('Hypnotic Boom Bap', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/boom-bap/boom-bap-20-hypnotic-boom-bap.mp3', true, 'boom-bap');

-- TRAP
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Narcotic Nebula', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-01-narcotic-nebula.mp3', true, 'trap'),
('Quadraxis', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-02-quadraxis.mp3', true, 'trap'),
('Whistle Warp', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-03-whistle-warp.mp3', true, 'trap'),
('House Of Horrors', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-04-house-of-horrors.mp3', true, 'trap'),
('High No More', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-05-high-no-more.mp3', true, 'trap'),
('Death Trap', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-06-death-trap.mp3', true, 'trap'),
('Awakening Change', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-07-awakening-change.mp3', true, 'trap'),
('Pharmacy Calls', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-08-pharmacy-calls.mp3', true, 'trap'),
('Take A Number', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-09-take-a-number.mp3', true, 'trap'),
('Wall Of Illusion', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-10-wall-of-illusion.mp3', true, 'trap'),
('Combusto Bowl', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-11-combusto-bowl.mp3', true, 'trap'),
('Dive Into Heart', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-12-dive-into-heart.mp3', true, 'trap'),
('Pikkon Remix', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-13-pikkon-remix.mp3', true, 'trap'),
('Smoke Ascension', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-14-smoke-ascension.mp3', true, 'trap'),
('Omniscience', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-15-omniscience.mp3', true, 'trap'),
('Izm', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-16-izm.mp3', true, 'trap'),
('Spy Hunt', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-17-spy-hunt.mp3', true, 'trap'),
('Mickey', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-18-mickey.mp3', true, 'trap'),
('Broadcast', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trap-19-broadcast.mp3', true, 'trap'),
('Trappin Japan', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/trap/trappin-japan.mp3', true, 'trap');

-- CHILL
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Sidewalk Flower', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-01-sidewalk-flower.mp3', true, 'chill'),
('Introspect', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-02-introspect.mp3', true, 'chill'),
('La Femme Sur La Plage', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-03-la-femme-sur-la-plage.mp3', true, 'chill'),
('Morning Theme', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-04-morning-theme.mp3', true, 'chill'),
('Just Chill', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-05-just-chill.mp3', true, 'chill'),
('Alleyway Jazz', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-06-alleyway-jazz.mp3', true, 'chill'),
('Absence In Velvet', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-07-absence-in-velvet.mp3', true, 'chill'),
('Lush Life', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-08-lush-life.mp3', true, 'chill'),
('Paradise', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-09-paradise.mp3', true, 'chill'),
('Eazy Livin', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-10-eazy-livin.mp3', true, 'chill'),
('Dream On', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-11-dream-on.mp3', true, 'chill'),
('Pacific', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-12-pacific.mp3', true, 'chill'),
('Providence', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-13-providence.mp3', true, 'chill'),
('Eleven11', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-14-eleven11.mp3', true, 'chill'),
('Blik', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-15-blik.mp3', true, 'chill'),
('Chillwings', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-16-chillwings.mp3', true, 'chill'),
('Daydream', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-17-daydream.mp3', true, 'chill'),
('Coffee And Trees', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-18-coffee-and-trees.mp3', true, 'chill'),
('Just Chill 2', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-19-just-chill-2.mp3', true, 'chill'),
('Feather', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/chill/chill-20-feather.mp3', true, 'chill');

-- DARK
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Chaotic Thought', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/chaotic-thought.mp3', true, 'dark'),
('Demonic', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-01-demonic.mp3', true, 'dark'),
('Secrets Of Da Woods', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-02-secrets-of-da-woods.mp3', true, 'dark'),
('4am', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-03-4am.mp3', true, 'dark'),
('Dark Prophecy', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-04-dark-prophecy.mp3', true, 'dark'),
('Mutated Bees', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-05-mutated-bees.mp3', true, 'dark'),
('Strange Things', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-06-strange-things.mp3', true, 'dark'),
('Python', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-07-python.mp3', true, 'dark'),
('World Thats Not Real', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-08-world-thats-not-real.mp3', true, 'dark'),
('Dark Sand', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-09-dark-sand.mp3', true, 'dark'),
('Underworld', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-10-underworld.mp3', true, 'dark'),
('Sewer', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-11-sewer.mp3', true, 'dark'),
('Nightmares', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-12-nightmares.mp3', true, 'dark'),
('Enter The Sekta', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-13-enter-the-sekta.mp3', true, 'dark'),
('Let The Darkness Flow', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-14-let-the-darkness-flow.mp3', true, 'dark'),
('The Sacrifice', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-15-the-sacrifice.mp3', true, 'dark'),
('Mystic Fog', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-16-mystic-fog.mp3', true, 'dark'),
('Sleep Paralysis', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-17-sleep-paralysis.mp3', true, 'dark'),
('Deaths Waiting', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-18-deaths-waiting.mp3', true, 'dark'),
('Dark Masters Lurking', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-19-dark-masters-lurking.mp3', true, 'dark'),
('Wet Coffins', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/dark-20-wet-coffins.mp3', true, 'dark'),
('Into The Fog', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/into-the-fog.mp3', true, 'dark'),
('Iron Fist', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/iron-fist.mp3', true, 'dark'),
('The Jungle', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/dark/the-jungle.mp3', true, 'dark');

-- HYPE
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Cuban Links', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/cuban-links.mp3', true, 'hype'),
('Lets Fight', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-01-lets-fight.mp3', true, 'hype'),
('Temple Of Supremacy', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-02-temple-of-supremacy.mp3', true, 'hype'),
('Worship The Mista', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-03-worship-the-mista.mp3', true, 'hype'),
('Tornado Comin At Cha', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-04-tornado-comin-at-cha.mp3', true, 'hype'),
('Boom Bap Euphoria', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-05-boom-bap-euphoria.mp3', true, 'hype'),
('Tzar And Autocrat', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-06-tzar-and-autocrat.mp3', true, 'hype'),
('Defendin The Crown', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-07-defendin-the-crown.mp3', true, 'hype'),
('Horror And Moral Terror', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-08-horror-and-moral-terror.mp3', true, 'hype'),
('The Last House', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-09-the-last-house.mp3', true, 'hype'),
('Streets Raised Me', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-10-streets-raised-me.mp3', true, 'hype'),
('Black Clouds', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-11-black-clouds.mp3', true, 'hype'),
('Vultures', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-12-vultures.mp3', true, 'hype'),
('Godfather', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-13-godfather.mp3', true, 'hype'),
('Plague', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-14-plague.mp3', true, 'hype'),
('Assassinate', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-15-assassinate.mp3', true, 'hype'),
('Trip Thru Hell', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-16-trip-thru-hell.mp3', true, 'hype'),
('Rusty Beat', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-17-rusty-beat.mp3', true, 'hype'),
('Warhead', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/hype-18-warhead.mp3', true, 'hype'),
('Nightmare', 'https://zxzhwjrrstmmnjrhhewi.supabase.co/storage/v1/object/public/audio/beats/hype/nightmare.mp3', true, 'hype');

-- Backfill any new beats into battle_participants indexes
