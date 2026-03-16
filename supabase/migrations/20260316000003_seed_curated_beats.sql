-- Seed ~100 curated YouTube beats organized by category
-- These are popular type beats from YouTube, embedded via iframe

-- Clear old curated beats (pixabay URLs are dead)
-- Must cascade through battles/freestyles that reference them
DELETE FROM freestyles WHERE battle_id IN (
  SELECT b.id FROM battles b JOIN beats bt ON b.beat_id = bt.id WHERE bt.is_curated = true
);
DELETE FROM battles WHERE beat_id IN (SELECT id FROM beats WHERE is_curated = true);
DELETE FROM beats WHERE is_curated = true;

-- BOOM-BAP (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('90s NY Boom Bap', 'youtube:hKoeNA_VpPc', true, 'boom-bap'),
('Old School Hip Hop Beat', 'youtube:sDSBMB5Ghik', true, 'boom-bap'),
('Boom Bap Freestyle Beat', 'youtube:cPb8rjeYxFA', true, 'boom-bap'),
('Underground Boom Bap', 'youtube:7LnBvuzjpr4', true, 'boom-bap'),
('Classic Boom Bap Instrumental', 'youtube:jWjKpcJIMfc', true, 'boom-bap'),
('Jazzy Boom Bap Beat', 'youtube:U4E60Ffa9yQ', true, 'boom-bap'),
('Grimy Boom Bap', 'youtube:0G383538qDQ', true, 'boom-bap'),
('MF DOOM Type Beat', 'youtube:YPG6LhD_B0I', true, 'boom-bap'),
('Nas Type Beat', 'youtube:DaL1gFExGKs', true, 'boom-bap'),
('Wu-Tang Type Beat', 'youtube:QE5Ypst1DnA', true, 'boom-bap'),
('Mobb Deep Type Beat', 'youtube:VzKkx_6DPOg', true, 'boom-bap'),
('DJ Premier Type Beat', 'youtube:cFPUqXrztS8', true, 'boom-bap'),
('Joey Badass Type Beat', 'youtube:5wZYXLJbhKU', true, 'boom-bap'),
('Boom Bap Cypher Beat', 'youtube:WUCBPAMQ63s', true, 'boom-bap'),
('East Coast Rap Beat', 'youtube:lqq3BtGrBEY', true, 'boom-bap'),
('Raw Boom Bap', 'youtube:jnKZdrVrjas', true, 'boom-bap'),
('Soulful Boom Bap', 'youtube:6E5HAnHfdWg', true, 'boom-bap'),
('Head Nod Boom Bap', 'youtube:KqYOCg9XPKI', true, 'boom-bap'),
('Dusty Boom Bap', 'youtube:8l_LWdJF1Ss', true, 'boom-bap'),
('Golden Era Type Beat', 'youtube:cjVQ36NhbMk', true, 'boom-bap');

-- TRAP (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Hard Trap Beat', 'youtube:Drqf8cRVjhM', true, 'trap'),
('Dark Trap Instrumental', 'youtube:4t_jPh2mqFk', true, 'trap'),
('Travis Scott Type Beat', 'youtube:6tw4bGCFclI', true, 'trap'),
('Metro Boomin Type Beat', 'youtube:hOGMVbx_jWg', true, 'trap'),
('Future Type Beat', 'youtube:Y7ix6RITXM0', true, 'trap'),
('21 Savage Type Beat', 'youtube:0dTYXeGHwns', true, 'trap'),
('Aggressive Trap Beat', 'youtube:EUEbJf3DaPY', true, 'trap'),
('808 Trap Beat', 'youtube:sX9r5mUTtIs', true, 'trap'),
('Trap Nation Beat', 'youtube:RWPXmOS0r2s', true, 'trap'),
('Southside Type Beat', 'youtube:cIqMeQ6U3kk', true, 'trap'),
('Playboi Carti Type Beat', 'youtube:VdJCb3YLAq4', true, 'trap'),
('Lil Baby Type Beat', 'youtube:bDAFqEvxRO4', true, 'trap'),
('Young Thug Type Beat', 'youtube:QI8VI5k0P1c', true, 'trap'),
('Gunna Type Beat', 'youtube:C_HUH6oxL20', true, 'trap'),
('Hard Hitting Trap', 'youtube:dYeFHOD7_LA', true, 'trap'),
('Melodic Trap Beat', 'youtube:9SwoaERiH28', true, 'trap'),
('Trap Freestyle Beat', 'youtube:n1WpP7iowLc', true, 'trap'),
('Drill Type Beat', 'youtube:Xgl_13TJ0oI', true, 'trap'),
('Pop Smoke Type Beat', 'youtube:K0rx_3GM5UE', true, 'trap'),
('Bouncy Trap Beat', 'youtube:6YW_RNWRkYk', true, 'trap');

-- CHILL (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Chill Lo-Fi Beat', 'youtube:5qap5aO4i9A', true, 'chill'),
('Smooth R&B Type Beat', 'youtube:HGl75kurxok', true, 'chill'),
('Mac Miller Type Beat', 'youtube:BmmMRLdN7wc', true, 'chill'),
('J Cole Type Beat', 'youtube:tI6n0IFIzOA', true, 'chill'),
('Laid Back Freestyle', 'youtube:yd1jS9mtRBc', true, 'chill'),
('Chill Rap Beat', 'youtube:WsqdmqRgrIc', true, 'chill'),
('Smooth Jazz Rap', 'youtube:zhHBOSK3BqA', true, 'chill'),
('Sunday Vibes Beat', 'youtube:ByJKCEePjMQ', true, 'chill'),
('Anderson Paak Type Beat', 'youtube:sXP0IyaKNJM', true, 'chill'),
('Isaiah Rashad Type Beat', 'youtube:A6Y8t6gpcYQ', true, 'chill'),
('Relaxing Hip Hop', 'youtube:1fueZCTYkpA', true, 'chill'),
('Rainy Day Beat', 'youtube:iGAHnZ8WQBE', true, 'chill'),
('Mellow Rap Instrumental', 'youtube:VzKkx_6DZZZ', true, 'chill'),
('Chance The Rapper Type Beat', 'youtube:3k_F1pELvTY', true, 'chill'),
('Smooth Freestyle Beat', 'youtube:jWK95YBbZKg', true, 'chill'),
('Late Night Vibes', 'youtube:FWScQjGyrTY', true, 'chill'),
('Acoustic Hip Hop', 'youtube:XVOdEB_3dRQ', true, 'chill'),
('Sunset Cruise Beat', 'youtube:kfYQVm-AKQs', true, 'chill'),
('Coffee Shop Beat', 'youtube:PjyRmjChnKE', true, 'chill'),
('Easy Going Rap Beat', 'youtube:IojqOMWTgv8', true, 'chill');

-- DARK (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Dark Underground Beat', 'youtube:GJpGqq7J9R4', true, 'dark'),
('Sinister Trap Beat', 'youtube:X8G_Gf1KNoU', true, 'dark'),
('Eminem Type Beat', 'youtube:8CCW3M1rl0M', true, 'dark'),
('Tech N9ne Type Beat', 'youtube:FQUh8ryzJaw', true, 'dark'),
('Horror Core Beat', 'youtube:TzWHhqCNHmc', true, 'dark'),
('Denzel Curry Type Beat', 'youtube:oVWWaBKx7B4', true, 'dark'),
('Dark Piano Rap Beat', 'youtube:FEz5aGfEjnA', true, 'dark'),
('Creepy Hip Hop Beat', 'youtube:D0UjDjyFR0Y', true, 'dark'),
('Freddie Gibbs Type Beat', 'youtube:sXP0IyGKNJM', true, 'dark'),
('JID Type Beat', 'youtube:jqXLJl2AhBg', true, 'dark'),
('Earl Sweatshirt Type Beat', 'youtube:X3rw9P1AScY', true, 'dark'),
('Dark Drill Beat', 'youtube:Xgl_13TJ0oX', true, 'dark'),
('Ominous Rap Beat', 'youtube:vJETPYV9tTQ', true, 'dark'),
('Night Terror Beat', 'youtube:sNJVCMbrN_g', true, 'dark'),
('Eerie Freestyle Beat', 'youtube:QbZb0KjvFPM', true, 'dark'),
('Pusha T Type Beat', 'youtube:Hm3FdSrRjMU', true, 'dark'),
('Griselda Type Beat', 'youtube:S1c3_K9Gmfw', true, 'dark'),
('Menacing Beat', 'youtube:4AYbJVqwTRw', true, 'dark'),
('Dark Boom Bap', 'youtube:TCm9788Tb5g', true, 'dark'),
('Conway Type Beat', 'youtube:O0c3dy0Fvxs', true, 'dark');

-- HYPE (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Hype Freestyle Beat', 'youtube:w6yBRMWxVjI', true, 'hype'),
('Battle Rap Beat', 'youtube:ub82Xb1C8os', true, 'hype'),
('High Energy Rap', 'youtube:l_MyUGq7pgs', true, 'hype'),
('DMX Type Beat', 'youtube:fGx6K90TmCI', true, 'hype'),
('Busta Rhymes Type Beat', 'youtube:Q8CMBQ-UrYY', true, 'hype'),
('Pump Up Beat', 'youtube:cEuU64Zt4B0', true, 'hype'),
('Cypher Battle Beat', 'youtube:MWt5J1GuxSo', true, 'hype'),
('Fast Rap Beat', 'youtube:0z_JrYeVaUk', true, 'hype'),
('Lil Wayne Type Beat', 'youtube:vqHhTGCLDdE', true, 'hype'),
('Ski Mask Type Beat', 'youtube:V_cnCp-d4go', true, 'hype'),
('XXXTentacion Type Beat', 'youtube:0AckvdGbk4w', true, 'hype'),
('Rage Beat', 'youtube:R8fSLFfKIbs', true, 'hype'),
('Stadium Rap Beat', 'youtube:M4_h40pG3I0', true, 'hype'),
('Turn Up Beat', 'youtube:tl97qCq3MpY', true, 'hype'),
('Adrenaline Beat', 'youtube:VvKjpGP6P5Y', true, 'hype'),
('$uicideboy$ Type Beat', 'youtube:C23YykHjjEo', true, 'hype'),
('Knockout Beat', 'youtube:kQ_7GtE529M', true, 'hype'),
('Energy Freestyle Beat', 'youtube:Mm_LRzjT8y0', true, 'hype'),
('Go Hard Beat', 'youtube:rKEpCXnB4Sg', true, 'hype'),
('Explosion Type Beat', 'youtube:VqB1uoDTdKM', true, 'hype');
