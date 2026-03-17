-- Replace YouTube beats with direct archive.org audio URLs
-- These are CC-licensed instrumentals from Dusted Wax Kingdom
DELETE FROM freestyles WHERE battle_id IN (
  SELECT b.id FROM battles b JOIN beats bt ON b.beat_id = bt.id WHERE bt.is_curated = true
);
DELETE FROM battles WHERE beat_id IN (SELECT id FROM beats WHERE is_curated = true);
DELETE FROM beats WHERE is_curated = true;

-- BOOM-BAP (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Da Coming', 'https://archive.org/download/DWK120/Mista_93_-_02_-_Da_Coming.mp3', true, 'boom-bap'),
('Secret Doctrine', 'https://archive.org/download/DWK120/Mista_93_-_03_-_Secret_Doctrine.mp3', true, 'boom-bap'),
('Riding With Ancestors', 'https://archive.org/download/DWK120/Mista_93_-_05_-_Riding_With_Ancestors.mp3', true, 'boom-bap'),
('Da Defanishun', 'https://archive.org/download/DWK120/Mista_93_-_08_-_Da_Defanishun.mp3', true, 'boom-bap'),
('Black Monk', 'https://archive.org/download/DWK120/Mista_93_-_11_-_Black_Monk.mp3', true, 'boom-bap'),
('Follow Me', 'https://archive.org/download/DWK110/Pitch_Razahs_-_01_-_Follow_Me.mp3', true, 'boom-bap'),
('Boom-Bap Relations', 'https://archive.org/download/DWK110/Pitch_Razahs_-_02_-_Boom-Bap_Relations.mp3', true, 'boom-bap'),
('Spinnin', 'https://archive.org/download/DWK110/Pitch_Razahs_-_03_-_Spinnin.mp3', true, 'boom-bap'),
('Message For The God', 'https://archive.org/download/DWK110/Pitch_Razahs_-_04_-_Message_For_The_God.mp3', true, 'boom-bap'),
('D.I.T.C.', 'https://archive.org/download/DWK243/Jazz_One_-_02_-_D.I.T.C.mp3', true, 'boom-bap'),
('Barefoot Ballet', 'https://archive.org/download/DWK243/Jazz_One_-_03_-_Barefoot_Ballet.mp3', true, 'boom-bap'),
('Coz All My Vinyl', 'https://archive.org/download/DWK243/Jazz_One_-_07_-_Coz_All_My_Vinyl.mp3', true, 'boom-bap'),
('Winter Nights', 'https://archive.org/download/DWK243/Jazz_One_-_09_-_Winter_Nights.mp3', true, 'boom-bap'),
('Midnight In A Perfect World', 'https://archive.org/download/DWK243/Jazz_One_-_10_-_Midnight_In_A_Perfect_World.mp3', true, 'boom-bap'),
('Art And Jazz', 'https://archive.org/download/DWK243/Jazz_One_-_11_-_Art_And_Jazz.mp3', true, 'boom-bap'),
('The Beat Generation', 'https://archive.org/download/DWK243/Jazz_One_-_12_-_The_Beat_Generation.mp3', true, 'boom-bap'),
('Reminisce', 'https://archive.org/download/DWK243/Jazz_One_-_13_-_Reminisce.mp3', true, 'boom-bap'),
('Dusted Wax', 'https://archive.org/download/DWK243/Jazz_One_-_15_-_Dusted_Wax.mp3', true, 'boom-bap'),
('Parabolic Jazz Production', 'https://archive.org/download/DWK205/Mista_93_-_08_-_Parabolic_Jazz_Production.mp3', true, 'boom-bap'),
('Hypnotic Boom Bap', 'https://archive.org/download/DWK205/Mista_93_-_09_-_Hypnotic_Boom_Bap.mp3', true, 'boom-bap');

-- TRAP (19 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Narcotic Nebula', 'https://archive.org/download/20201208_20201208_2107/Narcotic%20Nebula.mp3', true, 'trap'),
('Quadraxis', 'https://archive.org/download/20201208_20201208_2107/Quadraxis.mp3', true, 'trap'),
('Whistle Warp', 'https://archive.org/download/20201208_20201208_2107/Whistle%20Warp.mp3', true, 'trap'),
('House of Horrors', 'https://archive.org/download/20201208_20201208_2107/House%20of%20Horrors.mp3', true, 'trap'),
('High No More', 'https://archive.org/download/20201208_20201208_2107/High%20No%20More.mp3', true, 'trap'),
('Death Trap', 'https://archive.org/download/20201219_20201219_0725/Death%20Trap.mp3', true, 'trap'),
('Awakening Change', 'https://archive.org/download/20201219_20201219_0725/Awakening%20Change.mp3', true, 'trap'),
('Pharmacy Calls', 'https://archive.org/download/20201219_20201219_0725/Pharmacy%20Calls.mp3', true, 'trap'),
('Take a Number', 'https://archive.org/download/20201219_20201219_0725/Take%20a%20Number.mp3', true, 'trap'),
('Wall of Illusion', 'https://archive.org/download/20201219_20201219_0725/Wall%20of%20Illusion.mp3', true, 'trap'),
('Combusto Bowl', 'https://archive.org/download/20201209_20201209/Combusto%20Bowl.mp3', true, 'trap'),
('Dive into the Heart', 'https://archive.org/download/20201209_20201209/Dive%20into%20the%20Heart.mp3', true, 'trap'),
('Pikkon Remix', 'https://archive.org/download/20201209_20201209/Pikkon%20Remix.mp3', true, 'trap'),
('Smoke Ascension', 'https://archive.org/download/20201209_20201209/Smoke%20Ascenscion.mp3', true, 'trap'),
('Omniscience', 'https://archive.org/download/20201209_20201209/Omniscience.mp3', true, 'trap'),
('Izm', 'https://archive.org/download/DWK240/Vintage_Beats_-_06_-_Izm.mp3', true, 'trap'),
('Spy Hunt', 'https://archive.org/download/DWK240/Vintage_Beats_-_11_-_Spy_Hunt.mp3', true, 'trap'),
('Mickey', 'https://archive.org/download/DWK240/Vintage_Beats_-_16_-_Mickey.mp3', true, 'trap'),
('Broadcast', 'https://archive.org/download/DWK240/Vintage_Beats_-_17_-_Broadcast.mp3', true, 'trap');

-- CHILL (19 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Dark Water Jazz', 'https://archive.org/download/DWK107/Jenova_7_-_01_-_Dark_Water_Jazz.mp3', true, 'chill'),
('Metamorphosis', 'https://archive.org/download/DWK107/Jenova_7_-_03_-_Metamorphosis.mp3', true, 'chill'),
('A Touch Of Evil', 'https://archive.org/download/DWK107/Jenova_7_-_04_-_A_Touch_Of_Evil.mp3', true, 'chill'),
('Life Is Just A Ride', 'https://archive.org/download/DWK107/Jenova_7_-_05_-_Life_Is_Just_A_Ride.mp3', true, 'chill'),
('Just Chill', 'https://archive.org/download/DWK243/Jazz_One_-_04_-_Just_Chill.mp3', true, 'chill'),
('Dusted Wax', 'https://archive.org/download/DWK107/Jenova_7_-_02_-_Dusted_Wax.mp3', true, 'chill'),
('Lush Life', 'https://archive.org/download/DWK155/Poldoore_-_01_-_Lush_Life.mp3', true, 'chill'),
('Paradise', 'https://archive.org/download/DWK155/Poldoore_-_02_-_Paradise.mp3', true, 'chill'),
('Eazy Livin', 'https://archive.org/download/DWK155/Poldoore_-_03_-_Eazy_Livin.mp3', true, 'chill'),
('Dream On', 'https://archive.org/download/DWK155/Poldoore_-_04_-_Dream_On.mp3', true, 'chill'),
('Pacific', 'https://archive.org/download/DWK155/Poldoore_-_06_-_Pacific.mp3', true, 'chill'),
('Providence', 'https://archive.org/download/DWK155/Poldoore_-_07_-_Providence.mp3', true, 'chill'),
('Eleven11', 'https://archive.org/download/DWK163/deeB_-_01_-_Eleven11.mp3', true, 'chill'),
('Blik', 'https://archive.org/download/DWK163/deeB_-_03_-_Blik.mp3', true, 'chill'),
('Chillwings', 'https://archive.org/download/DWK163/deeB_-_05_-_Chillwings.mp3', true, 'chill'),
('Daydream', 'https://archive.org/download/DWK163/deeB_-_07_-_Daydream.mp3', true, 'chill'),
('Coffee and Trees', 'https://archive.org/download/DWK163/deeB_-_10_-_Coffee_and_Trees.mp3', true, 'chill'),
('Feather', 'https://archive.org/download/DWK243/Jazz_One_-_05_-_Feather.mp3', true, 'chill'),
('Inti Illimani', 'https://archive.org/download/DWK243/Jazz_One_-_14_-_Inti_Illimani.mp3', true, 'chill');

-- DARK (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Demonic', 'https://archive.org/download/DWK153/Mista_93_-_02_-_Demonic.mp3', true, 'dark'),
('Secrets Of Da Woods', 'https://archive.org/download/DWK153/Mista_93_-_03_-_Secrets_Of_Da_Woods.mp3', true, 'dark'),
('4 AM', 'https://archive.org/download/DWK153/Mista_93_-_08_-_4_AM.mp3', true, 'dark'),
('Dark Prophecy', 'https://archive.org/download/DWK153/Mista_93_-_10_-_Dark_Prophecy.mp3', true, 'dark'),
('Mutated Bees', 'https://archive.org/download/DWK153/Mista_93_-_11_-_Mutated_Bees.mp3', true, 'dark'),
('Strange Things', 'https://archive.org/download/DWK153/Mista_93_-_17_-_Strange_Things.mp3', true, 'dark'),
('Python', 'https://archive.org/download/DWK162/Tony_Mahoney_-_02_-_Python.mp3', true, 'dark'),
('World Thats Not Real', 'https://archive.org/download/DWK162/Tony_Mahoney_-_03_-_World_Thats_Not_Real.mp3', true, 'dark'),
('Dark Sand', 'https://archive.org/download/DWK162/Tony_Mahoney_-_06_-_Dark_Sand.mp3', true, 'dark'),
('Underworld', 'https://archive.org/download/DWK162/Tony_Mahoney_-_07_-_Underworld.mp3', true, 'dark'),
('Sewer', 'https://archive.org/download/DWK162/Tony_Mahoney_-_09_-_Sewer.mp3', true, 'dark'),
('Nightmares', 'https://archive.org/download/DWK162/Tony_Mahoney_-_11_-_Nightmares.mp3', true, 'dark'),
('Enter The Sekta', 'https://archive.org/download/DWK251/Mista_93_-_01_-_Enter_The_Sekta.mp3', true, 'dark'),
('Let The Darkness Flow', 'https://archive.org/download/DWK251/Mista_93_-_04_-_Let_The_Darkness_Flow.mp3', true, 'dark'),
('The Sacrifice', 'https://archive.org/download/DWK251/Mista_93_-_05_-_The_Sacrifice.mp3', true, 'dark'),
('Mystic Fog', 'https://archive.org/download/DWK251/Mista_93_-_08_-_Mystic_Fog.mp3', true, 'dark'),
('Sleep Paralysis', 'https://archive.org/download/DWK251/Mista_93_-_09_-_Sleep_Paralysis.mp3', true, 'dark'),
('Deaths Waiting', 'https://archive.org/download/DWK120/Mista_93_-_09_-_Deaths_Waiting.mp3', true, 'dark'),
('Dark Masters Lurking', 'https://archive.org/download/DWK120/Mista_93_-_10_-_Dark_Masters_Lurking.mp3', true, 'dark'),
('Wet Coffins', 'https://archive.org/download/DWK120/Mista_93_-_14_-_Wet_Coffins.mp3', true, 'dark');

-- HYPE (18 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Lets Fight', 'https://archive.org/download/DWK223/Mista_93_-_01_-_Lets_Fight.mp3', true, 'hype'),
('Temple Of Supremacy', 'https://archive.org/download/DWK223/Mista_93_-_03_-_Temple_Of_Supremacy.mp3', true, 'hype'),
('Worship The Mista', 'https://archive.org/download/DWK223/Mista_93_-_04_-_Worship_The_Mista.mp3', true, 'hype'),
('Tornado Comin At Cha', 'https://archive.org/download/DWK223/Mista_93_-_07_-_Tornado_Comin_At_Cha.mp3', true, 'hype'),
('Boom Bap Euphoria', 'https://archive.org/download/DWK223/Mista_93_-_08_-_Boom_Bap_Euphoria.mp3', true, 'hype'),
('A Tzar and Autocrat', 'https://archive.org/download/DWK205/Mista_93_-_01_-_A_Tzar_and_Autocrat.mp3', true, 'hype'),
('Defendin The Crown', 'https://archive.org/download/DWK205/Mista_93_-_05_-_Defendin_The_Crown.mp3', true, 'hype'),
('Horror and Moral Terror', 'https://archive.org/download/DWK205/Mista_93_-_15_-_Horror_and_Moral_Terror.mp3', true, 'hype'),
('The Last House', 'https://archive.org/download/DWK089/Tony_Mahoney_-_04_-_The_Last_House.mp3', true, 'hype'),
('Streets Raised Me', 'https://archive.org/download/DWK089/Tony_Mahoney_-_06_-_Streets_Raised_Me.mp3', true, 'hype'),
('Black Clouds', 'https://archive.org/download/DWK089/Tony_Mahoney_-_08_-_Black_Clouds.mp3', true, 'hype'),
('Vultures', 'https://archive.org/download/DWK089/Tony_Mahoney_-_10_-_Vultures.mp3', true, 'hype'),
('Godfather', 'https://archive.org/download/DWK237/Tony_Mahoney_-_10_-_Godfather.mp3', true, 'hype'),
('Plague', 'https://archive.org/download/DWK237/Tony_Mahoney_-_11_-_Plague.mp3', true, 'hype'),
('Assassinate', 'https://archive.org/download/DWK237/Tony_Mahoney_-_16_-_Assassinate.mp3', true, 'hype'),
('Trip Thru Hell', 'https://archive.org/download/DWK237/Tony_Mahoney_-_18_-_Trip_Thru_Hell.mp3', true, 'hype'),
('Rusty Beat', 'https://archive.org/download/DWK027/Strad_-_01_-_Rusty_Beat.mp3', true, 'hype'),
('Warhead', 'https://archive.org/download/DWK027/Strad_-_08_-_Warhead.mp3', true, 'hype');

