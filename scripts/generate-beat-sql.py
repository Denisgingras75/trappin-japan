#!/usr/bin/env python3
"""Generate SQL migration to seed beats with archive.org direct URLs"""

import urllib.parse

# Mapping: local filename -> (archive_id, archive_filename, display_title)
BEATS = {
    # === BOOM-BAP ===
    "boom-bap": [
        ("boom-bap-01-da-coming.mp3", "DWK120", "Mista_93_-_02_-_Da_Coming.mp3", "Da Coming"),
        ("boom-bap-02-secret-doctrine.mp3", "DWK120", "Mista_93_-_03_-_Secret_Doctrine.mp3", "Secret Doctrine"),
        ("boom-bap-03-riding-with-ancestors.mp3", "DWK120", "Mista_93_-_05_-_Riding_With_Ancestors.mp3", "Riding With Ancestors"),
        ("boom-bap-04-da-defanishun.mp3", "DWK120", "Mista_93_-_08_-_Da_Defanishun.mp3", "Da Defanishun"),
        ("boom-bap-05-black-monk.mp3", "DWK120", "Mista_93_-_11_-_Black_Monk.mp3", "Black Monk"),
        ("boom-bap-06-follow-me.mp3", "DWK110", "Pitch_Razahs_-_01_-_Follow_Me.mp3", "Follow Me"),
        ("boom-bap-07-bap-relations.mp3", "DWK110", "Pitch_Razahs_-_02_-_Boom-Bap_Relations.mp3", "Boom-Bap Relations"),
        ("boom-bap-08-spinnin.mp3", "DWK110", "Pitch_Razahs_-_03_-_Spinnin.mp3", "Spinnin"),
        ("boom-bap-09-message-for-the-god.mp3", "DWK110", "Pitch_Razahs_-_04_-_Message_For_The_God.mp3", "Message For The God"),
        ("boom-bap-10-wu-tang.mp3", "DWK243", "Jazz_One_-_02_-_D.I.T.C.mp3", "D.I.T.C."),
        ("boom-bap-11-doom.mp3", "DWK243", "Jazz_One_-_03_-_Barefoot_Ballet.mp3", "Barefoot Ballet"),
        ("boom-bap-12-westside-gunn.mp3", "DWK243", "Jazz_One_-_07_-_Coz_All_My_Vinyl.mp3", "Coz All My Vinyl"),
        ("boom-bap-13-black-moon.mp3", "DWK243", "Jazz_One_-_09_-_Winter_Nights.mp3", "Winter Nights"),
        ("boom-bap-14-six-feet-deep.mp3", "DWK243", "Jazz_One_-_10_-_Midnight_In_A_Perfect_World.mp3", "Midnight In A Perfect World"),
        ("boom-bap-15-brainstorm.mp3", "DWK243", "Jazz_One_-_11_-_Art_And_Jazz.mp3", "Art And Jazz"),
        ("boom-bap-16-big-l.mp3", "DWK243", "Jazz_One_-_12_-_The_Beat_Generation.mp3", "The Beat Generation"),
        ("boom-bap-17-lord-finesse.mp3", "DWK243", "Jazz_One_-_13_-_Reminisce.mp3", "Reminisce"),
        ("boom-bap-18-hip-hop-fanatic.mp3", "DWK243", "Jazz_One_-_15_-_Dusted_Wax.mp3", "Dusted Wax"),
        ("boom-bap-19-parabolic-jazz.mp3", "DWK205", "Mista_93_-_08_-_Parabolic_Jazz_Production.mp3", "Parabolic Jazz Production"),
        ("boom-bap-20-hypnotic-boom-bap.mp3", "DWK205", "Mista_93_-_09_-_Hypnotic_Boom_Bap.mp3", "Hypnotic Boom Bap"),
    ],
    # === TRAP ===
    "trap": [
        ("trap-01-narcotic-nebula.mp3", "20201208_20201208_2107", "Narcotic Nebula.mp3", "Narcotic Nebula"),
        ("trap-02-quadraxis.mp3", "20201208_20201208_2107", "Quadraxis.mp3", "Quadraxis"),
        ("trap-03-whistle-warp.mp3", "20201208_20201208_2107", "Whistle Warp.mp3", "Whistle Warp"),
        ("trap-04-house-of-horrors.mp3", "20201208_20201208_2107", "House of Horrors.mp3", "House of Horrors"),
        ("trap-05-high-no-more.mp3", "20201208_20201208_2107", "High No More.mp3", "High No More"),
        ("trap-06-death-trap.mp3", "20201219_20201219_0725", "Death Trap.mp3", "Death Trap"),
        ("trap-07-awakening-change.mp3", "20201219_20201219_0725", "Awakening Change.mp3", "Awakening Change"),
        ("trap-08-pharmacy-calls.mp3", "20201219_20201219_0725", "Pharmacy Calls.mp3", "Pharmacy Calls"),
        ("trap-09-take-a-number.mp3", "20201219_20201219_0725", "Take a Number.mp3", "Take a Number"),
        ("trap-10-wall-of-illusion.mp3", "20201219_20201219_0725", "Wall of Illusion.mp3", "Wall of Illusion"),
        ("trap-11-combusto-bowl.mp3", "20201209_20201209", "Combusto Bowl.mp3", "Combusto Bowl"),
        ("trap-12-dive-into-heart.mp3", "20201209_20201209", "Dive into the Heart.mp3", "Dive into the Heart"),
        ("trap-13-pikkon-remix.mp3", "20201209_20201209", "Pikkon Remix.mp3", "Pikkon Remix"),
        ("trap-14-smoke-ascension.mp3", "20201209_20201209", "Smoke Ascenscion.mp3", "Smoke Ascension"),
        ("trap-15-omniscience.mp3", "20201209_20201209", "Omniscience.mp3", "Omniscience"),
        ("trap-16-izm.mp3", "DWK240", "Vintage_Beats_-_06_-_Izm.mp3", "Izm"),
        ("trap-17-spy-hunt.mp3", "DWK240", "Vintage_Beats_-_11_-_Spy_Hunt.mp3", "Spy Hunt"),
        ("trap-18-mickey.mp3", "DWK240", "Vintage_Beats_-_16_-_Mickey.mp3", "Mickey"),
        ("trap-19-broadcast.mp3", "DWK240", "Vintage_Beats_-_17_-_Broadcast.mp3", "Broadcast"),
    ],
    # === CHILL ===
    "chill": [
        ("chill-01-sidewalk-flower.mp3", "DWK107", "Jenova_7_-_01_-_Dark_Water_Jazz.mp3", "Dark Water Jazz"),
        ("chill-02-introspect.mp3", "DWK107", "Jenova_7_-_03_-_Metamorphosis.mp3", "Metamorphosis"),
        ("chill-03-la-femme-sur-la-plage.mp3", "DWK107", "Jenova_7_-_04_-_A_Touch_Of_Evil.mp3", "A Touch Of Evil"),
        ("chill-04-morning-theme.mp3", "DWK107", "Jenova_7_-_05_-_Life_Is_Just_A_Ride.mp3", "Life Is Just A Ride"),
        ("chill-05-just-chill.mp3", "DWK243", "Jazz_One_-_04_-_Just_Chill.mp3", "Just Chill"),
        ("chill-06-alleyway-jazz.mp3", "DWK107", "Jenova_7_-_02_-_Dusted_Wax.mp3", "Dusted Wax"),
        ("chill-08-lush-life.mp3", "DWK155", "Poldoore_-_01_-_Lush_Life.mp3", "Lush Life"),
        ("chill-09-paradise.mp3", "DWK155", "Poldoore_-_02_-_Paradise.mp3", "Paradise"),
        ("chill-10-eazy-livin.mp3", "DWK155", "Poldoore_-_03_-_Eazy_Livin.mp3", "Eazy Livin"),
        ("chill-11-dream-on.mp3", "DWK155", "Poldoore_-_04_-_Dream_On.mp3", "Dream On"),
        ("chill-12-pacific.mp3", "DWK155", "Poldoore_-_06_-_Pacific.mp3", "Pacific"),
        ("chill-13-providence.mp3", "DWK155", "Poldoore_-_07_-_Providence.mp3", "Providence"),
        ("chill-14-eleven11.mp3", "DWK163", "deeB_-_01_-_Eleven11.mp3", "Eleven11"),
        ("chill-15-blik.mp3", "DWK163", "deeB_-_03_-_Blik.mp3", "Blik"),
        ("chill-16-chillwings.mp3", "DWK163", "deeB_-_05_-_Chillwings.mp3", "Chillwings"),
        ("chill-17-daydream.mp3", "DWK163", "deeB_-_07_-_Daydream.mp3", "Daydream"),
        ("chill-18-coffee-and-trees.mp3", "DWK163", "deeB_-_10_-_Coffee_and_Trees.mp3", "Coffee and Trees"),
        ("chill-19-just-chill-2.mp3", "DWK243", "Jazz_One_-_05_-_Feather.mp3", "Feather"),
        ("chill-20-feather.mp3", "DWK243", "Jazz_One_-_14_-_Inti_Illimani.mp3", "Inti Illimani"),
    ],
    # === DARK ===
    "dark": [
        ("dark-01-demonic.mp3", "DWK153", "Mista_93_-_02_-_Demonic.mp3", "Demonic"),
        ("dark-02-secrets-of-da-woods.mp3", "DWK153", "Mista_93_-_03_-_Secrets_Of_Da_Woods.mp3", "Secrets Of Da Woods"),
        ("dark-03-4am.mp3", "DWK153", "Mista_93_-_08_-_4_AM.mp3", "4 AM"),
        ("dark-04-dark-prophecy.mp3", "DWK153", "Mista_93_-_10_-_Dark_Prophecy.mp3", "Dark Prophecy"),
        ("dark-05-mutated-bees.mp3", "DWK153", "Mista_93_-_11_-_Mutated_Bees.mp3", "Mutated Bees"),
        ("dark-06-strange-things.mp3", "DWK153", "Mista_93_-_17_-_Strange_Things.mp3", "Strange Things"),
        ("dark-07-python.mp3", "DWK162", "Tony_Mahoney_-_02_-_Python.mp3", "Python"),
        ("dark-08-world-thats-not-real.mp3", "DWK162", "Tony_Mahoney_-_03_-_World_Thats_Not_Real.mp3", "World Thats Not Real"),
        ("dark-09-dark-sand.mp3", "DWK162", "Tony_Mahoney_-_06_-_Dark_Sand.mp3", "Dark Sand"),
        ("dark-10-underworld.mp3", "DWK162", "Tony_Mahoney_-_07_-_Underworld.mp3", "Underworld"),
        ("dark-11-sewer.mp3", "DWK162", "Tony_Mahoney_-_09_-_Sewer.mp3", "Sewer"),
        ("dark-12-nightmares.mp3", "DWK162", "Tony_Mahoney_-_11_-_Nightmares.mp3", "Nightmares"),
        ("dark-13-enter-the-sekta.mp3", "DWK251", "Mista_93_-_01_-_Enter_The_Sekta.mp3", "Enter The Sekta"),
        ("dark-14-let-the-darkness-flow.mp3", "DWK251", "Mista_93_-_04_-_Let_The_Darkness_Flow.mp3", "Let The Darkness Flow"),
        ("dark-15-the-sacrifice.mp3", "DWK251", "Mista_93_-_05_-_The_Sacrifice.mp3", "The Sacrifice"),
        ("dark-16-mystic-fog.mp3", "DWK251", "Mista_93_-_08_-_Mystic_Fog.mp3", "Mystic Fog"),
        ("dark-17-sleep-paralysis.mp3", "DWK251", "Mista_93_-_09_-_Sleep_Paralysis.mp3", "Sleep Paralysis"),
        ("dark-18-deaths-waiting.mp3", "DWK120", "Mista_93_-_09_-_Deaths_Waiting.mp3", "Deaths Waiting"),
        ("dark-19-dark-masters-lurking.mp3", "DWK120", "Mista_93_-_10_-_Dark_Masters_Lurking.mp3", "Dark Masters Lurking"),
        ("dark-20-wet-coffins.mp3", "DWK120", "Mista_93_-_14_-_Wet_Coffins.mp3", "Wet Coffins"),
    ],
    # === HYPE ===
    "hype": [
        ("hype-01-lets-fight.mp3", "DWK223", "Mista_93_-_01_-_Lets_Fight.mp3", "Lets Fight"),
        ("hype-02-temple-of-supremacy.mp3", "DWK223", "Mista_93_-_03_-_Temple_Of_Supremacy.mp3", "Temple Of Supremacy"),
        ("hype-03-worship-the-mista.mp3", "DWK223", "Mista_93_-_04_-_Worship_The_Mista.mp3", "Worship The Mista"),
        ("hype-04-tornado-comin-at-cha.mp3", "DWK223", "Mista_93_-_07_-_Tornado_Comin_At_Cha.mp3", "Tornado Comin At Cha"),
        ("hype-05-boom-bap-euphoria.mp3", "DWK223", "Mista_93_-_08_-_Boom_Bap_Euphoria.mp3", "Boom Bap Euphoria"),
        ("hype-06-tzar-and-autocrat.mp3", "DWK205", "Mista_93_-_01_-_A_Tzar_and_Autocrat.mp3", "A Tzar and Autocrat"),
        ("hype-07-defendin-the-crown.mp3", "DWK205", "Mista_93_-_05_-_Defendin_The_Crown.mp3", "Defendin The Crown"),
        ("hype-08-horror-and-moral-terror.mp3", "DWK205", "Mista_93_-_15_-_Horror_and_Moral_Terror.mp3", "Horror and Moral Terror"),
        ("hype-09-the-last-house.mp3", "DWK089", "Tony_Mahoney_-_04_-_The_Last_House.mp3", "The Last House"),
        ("hype-10-streets-raised-me.mp3", "DWK089", "Tony_Mahoney_-_06_-_Streets_Raised_Me.mp3", "Streets Raised Me"),
        ("hype-11-black-clouds.mp3", "DWK089", "Tony_Mahoney_-_08_-_Black_Clouds.mp3", "Black Clouds"),
        ("hype-12-vultures.mp3", "DWK089", "Tony_Mahoney_-_10_-_Vultures.mp3", "Vultures"),
        ("hype-13-godfather.mp3", "DWK237", "Tony_Mahoney_-_10_-_Godfather.mp3", "Godfather"),
        ("hype-14-plague.mp3", "DWK237", "Tony_Mahoney_-_11_-_Plague.mp3", "Plague"),
        ("hype-15-assassinate.mp3", "DWK237", "Tony_Mahoney_-_16_-_Assassinate.mp3", "Assassinate"),
        ("hype-16-trip-thru-hell.mp3", "DWK237", "Tony_Mahoney_-_18_-_Trip_Thru_Hell.mp3", "Trip Thru Hell"),
        ("hype-17-rusty-beat.mp3", "DWK027", "Strad_-_01_-_Rusty_Beat.mp3", "Rusty Beat"),
        ("hype-18-warhead.mp3", "DWK027", "Strad_-_08_-_Warhead.mp3", "Warhead"),
    ],
}

def make_url(archive_id, filename):
    return f"https://archive.org/download/{archive_id}/{urllib.parse.quote(filename)}"

def escape_sql(s):
    return s.replace("'", "''")

lines = []
lines.append("-- Replace YouTube beats with direct archive.org audio URLs")
lines.append("-- These are CC-licensed instrumentals from Dusted Wax Kingdom")
lines.append("DELETE FROM freestyles WHERE battle_id IN (")
lines.append("  SELECT b.id FROM battles b JOIN beats bt ON b.beat_id = bt.id WHERE bt.is_curated = true")
lines.append(");")
lines.append("DELETE FROM battles WHERE beat_id IN (SELECT id FROM beats WHERE is_curated = true);")
lines.append("DELETE FROM beats WHERE is_curated = true;")
lines.append("")

for category, beats in BEATS.items():
    lines.append(f"-- {category.upper()} ({len(beats)} beats)")
    lines.append(f"INSERT INTO beats (title, audio_url, is_curated, category) VALUES")
    values = []
    for local_file, archive_id, archive_file, title in beats:
        url = make_url(archive_id, archive_file)
        values.append(f"('{escape_sql(title)}', '{escape_sql(url)}', true, '{category}')")
    lines.append(",\n".join(values) + ";")
    lines.append("")

print("\n".join(lines))
