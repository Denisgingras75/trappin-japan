-- Replace fake YouTube beats with real verified video IDs
DELETE FROM freestyles WHERE battle_id IN (
  SELECT b.id FROM battles b JOIN beats bt ON b.beat_id = bt.id WHERE bt.is_curated = true
);
DELETE FROM battles WHERE beat_id IN (SELECT id FROM beats WHERE is_curated = true);
DELETE FROM beats WHERE is_curated = true;

-- BOOM-BAP (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('THE GOAT — 90s Boom Bap', 'youtube:Z4XMGFtqjRE', true, 'boom-bap'),
('CRACKED — Funky Boom Bap', 'youtube:e530dmdg0Wo', true, 'boom-bap'),
('REAL THING — Dark Underground', 'youtube:DGoITlpvJoM', true, 'boom-bap'),
('HIGH ROLLERS — Funky Boom Bap', 'youtube:MNn2bBcsvk0', true, 'boom-bap'),
('NOT ALONE — 90s Freestyle', 'youtube:vtaOyxIAriI', true, 'boom-bap'),
('Obsession — Chill Jazz Boom Bap', 'youtube:FeYyTSBD7fk', true, 'boom-bap'),
('Unchanged — Joey Bada$$ Type', 'youtube:G40s9L2OlVw', true, 'boom-bap'),
('IT''S ME — Old School Rap', 'youtube:Vc08j3yE5GI', true, 'boom-bap'),
('The Supply — 90s Freestyle', 'youtube:PyV0ZT0StG0', true, 'boom-bap'),
('Street Culture — Freestyle Boom Bap', 'youtube:KkeH4Pph9Zo', true, 'boom-bap'),
('COLD MIND — Freestyle Rap', 'youtube:Zxqby6ofbYc', true, 'boom-bap'),
('IN MY BAG — 90s Boom Bap', 'youtube:qWSh61rYzQM', true, 'boom-bap'),
('HUNT — Benny The Butcher Type', 'youtube:j-cHlODnTMg', true, 'boom-bap'),
('Low Trumpet — MF DOOM Type', 'youtube:AeYbGjQWPCg', true, 'boom-bap'),
('BARS — Old School Rap', 'youtube:YotMIWYr5BY', true, 'boom-bap'),
('Pareidola — Underground Boom Bap', 'youtube:Yw23clI5OCQ', true, 'boom-bap'),
('Odyssey — Hard Boom Bap', 'youtube:B9-fk5Gu8xE', true, 'boom-bap'),
('Desert — MF DOOM Type', 'youtube:2RneTVKUa-A', true, 'boom-bap'),
('Soledad — Boom Bap Hip Hop', 'youtube:dP6s3MCqWs8', true, 'boom-bap'),
('90s Classic Freestyle Mix (1hr)', 'youtube:OTO5C1tx9A0', true, 'boom-bap');

-- TRAP (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('GOIN CRAZY — Trap Freestyle', 'youtube:k2ZVgstgSvs', true, 'trap'),
('ULTIMATE — Hard Trap', 'youtube:yY4M1oZZqr8', true, 'trap'),
('OVERDOSE — Trap Freestyle', 'youtube:nvGr9OQj_io', true, 'trap'),
('ALERT — Future Type', 'youtube:qw4CEFRheIo', true, 'trap'),
('A NEW FLOW — Trap Freestyle', 'youtube:dJX-x0JlMpA', true, 'trap'),
('ASSAULT — Aggressive Trap', 'youtube:r_kCmremflU', true, 'trap'),
('GRIMM — Future x Drake Type', 'youtube:y6Gw-sM-Ifk', true, 'trap'),
('THIS IS HARD — Trap Freestyle', 'youtube:Uq4qLRVBao4', true, 'trap'),
('PLAY LIKE THAT — Free Trap', 'youtube:QXDt_V3Pi5Q', true, 'trap'),
('IMAGINE — Trap Freestyle', 'youtube:T54TlSKl7Sg', true, 'trap'),
('PLEADS — Free Trap', 'youtube:hs18zPIfxAI', true, 'trap'),
('Boys — Fast Trap Freestyle', 'youtube:4E-MepZ-0Ys', true, 'trap'),
('BARS — Future Type', 'youtube:gv9y1HetPZM', true, 'trap'),
('KILLIN ON THIS — Trap Freestyle', 'youtube:Ed59-QIJ8GE', true, 'trap'),
('BLIND — Melodic Trap', 'youtube:pMQQxJKSB-Q', true, 'trap'),
('Real — Hard Dark Trap', 'youtube:17F4y94QMho', true, 'trap'),
('MY FLOW — Free Trap', 'youtube:F5KiZCRCgTI', true, 'trap'),
('HIT EM UP — Dirty Trap', 'youtube:MoDAM9pji0Q', true, 'trap'),
('NO FAKES — Free Trap', 'youtube:CejhkaDeLuE', true, 'trap'),
('TAL — Hard Dark Trap', 'youtube:8LykH6lVVEk', true, 'trap');

-- CHILL (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Obsession — Chill Jazz LoFi', 'youtube:FeYyTSBD7fk', true, 'chill'),
('Lost Dreams — Chill Jazz LoFi', 'youtube:B-8k-qk7LJI', true, 'chill'),
('90s Freestyle LoFi', 'youtube:tEu9kZLGx_E', true, 'chill'),
('Chill LoFi Mix', 'youtube:CLeZyIID9Bo', true, 'chill'),
('Night Drive — LoFi Mix', 'youtube:zW5wpJY1rgQ', true, 'chill'),
('Endless Sunday — Chillhop', 'youtube:D_uLM5i0Z4c', true, 'chill'),
('Chill Freestyle Beats (1hr)', 'youtube:y_Hs1bgkT5Q', true, 'chill'),
('Chill Summer LoFi', 'youtube:kyqpSycLASY', true, 'chill'),
('Rain — LoFi Type', 'youtube:pdYJtRBPlTw', true, 'chill'),
('Wild Roses — LoFi Type', 'youtube:bVuzkVGaN-I', true, 'chill'),
('Refresh — Chill Jazz Boom Bap', 'youtube:vLp4WP_-tfk', true, 'chill'),
('Cuz I Don''t Even Know — LoFi', 'youtube:Il-LKPZ9Who', true, 'chill'),
('Lighter — LoFi Type', 'youtube:QCzRXx1DA_U', true, 'chill'),
('Peace — Chill Storytelling', 'youtube:sBaW1bDwVvU', true, 'chill'),
('Faded — LoFi Type', 'youtube:TOyiixz8HX4', true, 'chill'),
('Memories — Chill Jazz LoFi', 'youtube:SANPkk1vCzw', true, 'chill'),
('Medicate — Chill 90s Freestyle', 'youtube:oP2kSTLmr-8', true, 'chill'),
('Bliss — LoFi Hip Hop', 'youtube:-UfI1X-MSig', true, 'chill'),
('Be Mine Just Mine — LoFi', 'youtube:NzNQR0930V8', true, 'chill'),
('Chill Study Beats — Jazz Hip Hop', 'youtube:gwDoRPcPxtc', true, 'chill');

-- DARK (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('KNOCKOUT — Hard Dark Boom Bap', 'youtube:iLuFmj4ES0Q', true, 'dark'),
('Doom — Dark Underground', 'youtube:HOKzh3iVWig', true, 'dark'),
('ANARCHY — Dark Underground', 'youtube:c9NzMtL9w08', true, 'dark'),
('ON EDGE — Dark Funky Boom Bap', 'youtube:wLJGjewWRbU', true, 'dark'),
('Prestige — Hard Dark Boom Bap', 'youtube:Xt1kh9t7fhs', true, 'dark'),
('AWAKENING — Dark Underground', 'youtube:wO1g2a2yGg4', true, 'dark'),
('OMEN — Underground Hip Hop', 'youtube:q0Mv035Z620', true, 'dark'),
('LORE — Hard Dark Trap', 'youtube:gTqyJfHUEBg', true, 'dark'),
('PSYCHO FLOW — Fast Dark', 'youtube:3hwusuN4V5E', true, 'dark'),
('LAWBREAKER — Dark Underground', 'youtube:i_nFcEDRb7w', true, 'dark'),
('BAD ENERGY — Aggressive Dark', 'youtube:NtIKs3TYBvg', true, 'dark'),
('Impala — Hard Dark Boom Bap', 'youtube:ulNl3zR4_ag', true, 'dark'),
('THEFT — Hard Dark Trap', 'youtube:BmDQhuVLAZw', true, 'dark'),
('ACTIVE — Future Dark Type', 'youtube:oQefWYSS8tw', true, 'dark'),
('ANTHEM — Future Dark Type', 'youtube:zl-xgAqO9pA', true, 'dark'),
('THE REAL MENACE — Hard Boom Bap', 'youtube:YOSmQB0ttJ0', true, 'dark'),
('GRIT & GLORY — Boom Bap', 'youtube:frrHLPXkTSA', true, 'dark'),
('SLASH — Aggressive Gangsta', 'youtube:fb-KKPqBfeM', true, 'dark'),
('BAD GUY — Aggressive Diss', 'youtube:2yWYKL8Zr-s', true, 'dark'),
('Cold — Rap With Hook', 'youtube:p-F2aKKTNps', true, 'dark');

-- HYPE (20 beats)
INSERT INTO beats (title, audio_url, is_curated, category) VALUES
('Barz — Rap Cypher', 'youtube:Nom20TMLtBE', true, 'hype'),
('Battle — 20 Min Freestyle', 'youtube:qxFhnFUwChU', true, 'hype'),
('Cypher — Boom Bap Freestyle', 'youtube:lFwy0-9ryS8', true, 'hype'),
('Trap Beats Mix (1hr)', 'youtube:NEcDXwJWQb4', true, 'hype'),
('10 Min Cypher Beat', 'youtube:vOIxerl5Ipg', true, 'hype'),
('POWERFUL — Free Trap', 'youtube:OVzJA3hHjD0', true, 'hype'),
('Trust — Freestyle Trap', 'youtube:-346ywH-d4k', true, 'hype'),
('GOIN CRAZY — Trap Hype', 'youtube:k2ZVgstgSvs', true, 'hype'),
('ULTIMATE — Hard Type', 'youtube:yY4M1oZZqr8', true, 'hype'),
('OVERDOSE — Hard Trap', 'youtube:nvGr9OQj_io', true, 'hype'),
('ASSAULT — Aggressive Freestyle', 'youtube:r_kCmremflU', true, 'hype'),
('GRIMM — Hard Trap Hype', 'youtube:y6Gw-sM-Ifk', true, 'hype'),
('THIS IS HARD — Hype Trap', 'youtube:Uq4qLRVBao4', true, 'hype'),
('KILLIN ON THIS — Hype Trap', 'youtube:Ed59-QIJ8GE', true, 'hype'),
('HIT EM UP — Dirty Hype', 'youtube:MoDAM9pji0Q', true, 'hype'),
('PSYCHO FLOW — Fast Hype', 'youtube:3hwusuN4V5E', true, 'hype'),
('THE REAL MENACE — Hard Hype', 'youtube:YOSmQB0ttJ0', true, 'hype'),
('SLASH — Aggressive Hype', 'youtube:fb-KKPqBfeM', true, 'hype'),
('BAD GUY — Diss Hype', 'youtube:2yWYKL8Zr-s', true, 'hype'),
('BAD ENERGY — Aggressive Hype', 'youtube:NtIKs3TYBvg', true, 'hype');
