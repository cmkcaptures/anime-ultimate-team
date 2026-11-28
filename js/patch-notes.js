// Increase this number and update the notes for each player-facing patch.
export const PATCH_VERSION = 2026112821

const NOTES = [
  ['Chronicle Break: The Nine-Tails Night', ['New moment: October 10th, the night the masked man unleashed the Nine-Tails on the Hidden Leaf.', 'Stop the masked man (Kamui phases your fighter out of the fight), protect Minato and Kushina while they seal it, or hunt the Nine-Tails as a raid boss before Konoha falls.', 'New boss skill: Tailed Beast Bomb hits your BENCH, so keep your backline healthy.', 'Rewards: Mythic Minato & Kushina, Mythic Kurama (Nine-Tails Unleashed) for the true ending, and Legendary Obito (Masked Man).', 'Battle backgrounds for Chronicle Break are now much clearer.']],
  ['NEW MODE: Chronicle Break', ['Battle > ⏳ CHRONICLE BREAK. Your team drops into the decisive moments of anime history and rewrites how they end.', 'First moment: NAMEK. Save Krillin, fight beside the Legendary Super Saiyan, or ambush Frieza before he transforms. Every choice opens different fights.', 'Hard by design: Namek explodes on a countdown, Frieza charges a DEATH BALL every 3rd turn (Guard to halve it), and losing a fighter can trigger Super Saiyan Fury.', 'Collect 4 endings, including a hidden TRUE ENDING for winning a final battle without losing a fighter. Rewards: Mythic Goku (Super Saiyan · Namek), Mythic Frieza (100% Full Power), Legendary Frieza (Third Form), gear shards and Premium Drops.', 'Marineford, Shibuya, the Uchiha and Planet Vegeta are coming next.']],
  ['Battle Cinematics', ['Mythic and Rainbow Ultimates now play a full-screen anime cut-in: split art panels, speed lines, screen shake and a giant kanji. Tap to skip.', 'Win a battle and your MVP strikes a Victory Pose: full art, their damage, KOs and HP left, and a signature quote.']],
  ['NEW: Unique Gear', ['A new prismatic tier above Gold. Each Unique fits ONE exact card and brings an older unit back to the meta.', 'First three: Six Eyes Blindfold (Gojo & Sukuna), Blue Spring Bond (Gojo & Geto) and Ninth Vestige Gauntlets (Deku · One For All Unleashed). Damage, always-first, damage reduction and more.', 'New effect, Type Neutral: no penalty when attacking or defending at a type disadvantage.', 'Buy them in Armory > Pick Exact Gear > UNIQUE for 6,000 gear shards.']],
  ['120 New Gear', ['The Armory now has 128 pieces with real icons: Kunai, Poké Balls, Wado Ichimonji, Samehada, Potara, Devil Fruits, Sacred Treasures, Zanpakutō and more.', 'Gold gear has special effects: always move first, lifesteal, dodge, revive, team heal, reflect, seal passives and more.', 'Any gear fits any slot if your fighter meets the rarity: Silver needs Epic+, Gold needs Legendary+.', 'New drawn frames for each tier, and your gear now shows under each card on the Team page.']],
  ['Gear Shards', ['NEW: Pick Exact Gear. Buy the exact piece you want instead of a random box (4x the box price).', 'Buy gear shards with coins in the Armory: 100 for 2,500, 500 for 11,000, 2,000 for 40,000.', 'Gear shards now drop from the Crucible (more every 10 stages), Dead Zone clears and replays, and the Daily Boss.']],
  ['NEW: Guts', ['Mythic Guts (Black Swordsman · The Struggler) starts the Berserk series. Only one way to get him: clear Crucible stage 50.', 'He grows +6% damage every turn, ignores Guard, and Berserker Armor survives 2 lethal hits with a rage boost each time.']],
  ['Music + Anime Radio', ['NEW: Anime Radio (📻 at the top). Stream anime openings and OSTs from YouTube. Paste any YouTube playlist or video link to add your own stations.', 'Brand-new game music: an anime opening-style menu theme, a hype battle theme and a dark boss theme for Dead Zones and the Crucible.', 'Punchier anime sound effects: slashes, shings and booms on hits, crits and KOs.']],
  ['Home + Team', ['Home: a LIVE news ticker, a rotating featured carousel and an animated leader card.', 'Team page: a new Team Bonuses panel shows all 6 synergy bonuses at a glance, with glowing lines between linked fighters.']],
  ['NEW: Gear', ['Every fighter has 3 gear sockets: Gold, Silver and Bronze. Open any card and use the Loadout Rig to equip gear.', 'Gear adds big stats (Strike ATK, Blast ATK, Defense, HP) plus random substats. Some substats only work on certain tags, like Saiyans or Swordsmen.', 'Gold gear: Senzu Pouch (heals you once when low) and Stand Arrow (bonus damage vs stronger enemies).', 'Earn gear in the Crucible, Dead Zones and Daily Boss. Upgrade to +10, reforge substats or salvage spares in the new ARMORY (on Home). Everyone starts with 4 pieces.']],
  ['Ascension: Shigaraki', ['Mythic Shigaraki (All For One Awakened) can now Ascend into ALL FOR ONE · CATASTROPHE: Decay shreds defence and burns, Stolen Quirk seals passives and drains Energy, and Decay Wave hits all enemies for 300%.']],
  ['Balance: Dead Zones + Crucible', ['Dead Zones were retuned with test runs: Onigashima is harder, Dio is deadlier but shorter, Eye of the Moon and Dragon King Festival are beatable now (still the hardest), and Pokémon League is fairer to non-Pokémon teams.', 'The Crucible: the real fights start at stage 4, area-attack walls were smoothed out, standing fighters now recover 12% after each stage, and boss stages also revive knocked-out fighters at 30%.']],
  ['Ascension + New Arrivals', ['NEW: Ascension. Hand-picked veteran cards get a brand-new kit, +2 OVR, +4% stats and a gold Ascended frame. Needs Limit Break (7◆), 2 extra copies and shards. First up: Legendary Jotaro (Star Platinum · The World).', 'NEW: whenever new cards or Ascensions arrive, a New Arrivals cinematic plays when you load in.', 'Mythic Jonathan Joestar (Sunlight Yellow Overdrive), Mythic Bucciarati (Sticky Fingers) and Mythic Kakyoin (Hierophant Green).']],
  ['Veteran Roster · Wave Three', ['38 older cards gained new tools, shown as a Veteran refresh line on each card. Fighters gain lifesteal, a KO save and Guard-piercing Specials. Assassins move first and execute. Tanks get shields and reflect. Supports boost and heal the team. Mythics also erase the first Ultimate fired at them.', 'Mythic: GOKU · SUPER SAIYAN 4 · DAIMA, GENOS · ARMOR UPGRADE, ERWIN · DEDICATE YOUR HEARTS, KAGUYA · PROGENITOR, IMU · TRUE FORM · EMPTY THRONE, WHIS · ANGEL ATTENDANT, MELIODAS · DEMON KING FORM, YUSUKE · MAZOKU AWAKENING, GOKU · SUPER SAIYAN 4 · DAIMA PRIMAL RUSH, GOMAH · SUPREME DEMON KING · THIRD EYE, CELL MAX · SUPER HERO, BAKUGO · VS ALL FOR ONE, DEKU · ONE FOR ALL · UNLEASHED.', 'Legendary: JIRAIYA · SAGE MODE · FINAL STAND, NATSU · FIRE DRAGON KING, MAHORAGA · ADAPTATION, YORIICHI · THE FIRST BREATH, OKARUN · TRANSFORMATION, SHINRA · ADOLLA BURST · FULL SPEED, NEFERPITOU · ROYAL GUARD, YORUICHI · BLACK CAT, MAGNA · SOUL CHAIN DEATHMATCH, MEREOLEONA · MANA ZONE: CALIDOS BROTZ, AKAINU · FLEET ADMIRAL, HAGOROMO · SAGE OF SIX PATHS, EREN · MARLEY RAID, LEVI · HUMANITY’S STRONGEST, ESTAROSSA · COMMANDMENT OF LOVE, MAKIMA · CONTROL DEVIL, GOKU · SUPER SAIYAN GOD · GOD BIND, MAJIN DUU · SUPER SAIYAN 3 · MIMIC, GOKU · BLUE KAIOKEN X20, VEGITO · SUPER SAIYAN BLUE, BAKUGO · FINAL WAR, GOL D. ROGER · KING OF THE PIRATES, DEKU · VIGILANTE, KURAPIKA · SCARLET EYES, HISOKA · BUNGEE GUM.']],
  ['New Cards: Bleach & One Piece', ['Mythic Luffy (Dawn of Joyboy) transforms into Gear 5 · Sun God Nika: his first 3 hits taken never land, 35% damage reduction, and huge damage.', 'Mythic Kisuke & Yoruichi (Shunkō · Raijū Senki) and Legendary Soi Fon & Yoruichi (Onmitsukidō). Both get stronger with any other Soi Fon or Yoruichi card on the team.']],
  ['New Dead Zones + Story Arcs', ['Dead Zone: Eye of the Moon (Obito and Madara). Full clear: Obito (Six Paths).', 'Dead Zone: Dragon King Festival (Zeref and Acnologia), the hardest yet. Full clear: Acnologia (Dragon King).', 'Story Arc: Shibuya Incident (Jujutsu Kaisen). Story Arc: Infinity Castle (Demon Slayer). Story Arc: Thousand-Year Blood War (Bleach).']],
  ['New Cards: Demon Slayer, Gojo, Goku vs Jiren', ['Mythic Kokushibo (Six Eyes): 62% damage, Strikes hit twice, moves first, regenerates and survives 2 KOs.', 'Mythic Rui (Blood Threads): a defensive wall with 42% damage reduction, 30% reflect and a 35% shield.', 'Mythic Tanjiro (Sun Breathing) and Inosuke (King of the Mountain): stronger together, and strongest with the full Kamaboko Squad.', 'Legendary Gojo (Infinity · Reversal Red): 35% dodge, ignores his first 3 hits, and huge damage.', 'Mythic Goku vs Jiren (Mastered Ultra Instinct · Full Power).']],
  ['New Cards: Fairy Tail & Fire Force', ['Mythic Zeref (Black Wizard): his Special revives a knocked-out ally (twice per battle). Tap a KO’d ally on your bench to choose who. Huge team damage and defences.', 'Mythic Mavis (Fairy Heart): support who boosts every Fairy Tail ally and heals the team. Zeref and Mavis power each other up.', 'Legendary Joker (Trump Card): every Fire Force ally deals +20% damage and takes 10% less damage.', 'Legendary Charon (Great Wall): a reflecting tank.', 'Mythic Shinra (Bansho Man · Aegis): takes hits for allies, comes back after a KO, and pairs with the Rainbow Bansho Man.']],
  ['The Crucible: Stages 31-50', ['20 new stages, with bosses at 40 (Gojo) and 50 (Aizen and Yhwach together).', 'From stage 4, enemies enrage when low: +30% damage under half HP, +60% under a quarter.', 'Clearing all 50 now pays the 100,000 coin grand prize.']],
  ['NEW MODE: The Crucible', ['Our own endurance mode: 30 handmade stages in one continuous run (more coming). Find it in Battle.', 'Your 6 fighters keep their HP, knockouts and Ultimate gauge from stage to stage. Healing items only work between stages, and healing in fights is halved.', 'Every stage has rules and a weakness, so the right units matter. Save after a stage to keep your progress. If your team falls, you go back to your last save.', 'Big first-clear rewards: Premium Drops every 5 stages, a boss bundle every 10, and a huge prize for clearing all 30.']],
  ['Dual Banners + New Cards', ['Two limited banners are live at once until 4 Dec: Fusion Reborn (Dragon Ball) and Emperors & Warlords (One Piece). Switch between them at the top of the banner.', 'Emperors & Warlords: Shanks (Divine Departure), Mihawk & Crocodile (Cross Guild), Rob Lucci (CP0) and Crocodile (Sand King).', 'New: Rainbow Boruto (Two Blue Vortex), Mythic Naruto (Six Paths), Mythic Sasuke (The Last, support), Mythic Zabuza, Legendary Minato (Reaper Death Seal) and Legendary Naruto (The Last).', 'Every other Boruto card: +10% damage and 8% less damage taken.']],
  ['Limited Banner: Fusion Reborn', ['Live now until 4 Dec. Five new Dragon Ball Mythics.', 'Vegito transforms mid-battle: Base, then Super Saiyan, then Super Saiyan Blue.', 'Gogeta (Blue · Soul Punisher), Majin Vegeta (huge damage), Future Gohan (last stand that boosts the team) and Ultimate Gohan (top-tier support).', 'Fix: Specials that heal the whole team now work.']],
  ['New Series: Baki', ['14 new cards and a Baki Pack in the Shop.', 'Mythics: Baki (Strongest), Yujiro (The Ogre), Baki & Yujiro (Father vs Son) and Pickle (Primeval). Legendaries: Baki, Yujiro, Jack, Oliva, Hanayama and Retsu.', 'Doppo Orochi (Epic) is a full support: whole-team damage boost, team healing and a shield.']],
  ['New Dead Zones', ['Symbol of Evil (All For One): Stolen Quirks, Hellflame Heir and Quirk Overload. All For One and Dabi hit your whole team, so bring healing and damage reduction.', 'The World (Dio): Space Ripper, Road Roller and ZA WARUDO. The hardest Dead Zone yet. Each stage is a step up from the last.', 'Both use New Gen warnings: read the warning every round and answer it.', 'Full-clear rewards: Symbol of Evil gives All For One (Quirk Overload) and The World gives the new Mythic Dio (ZA WARUDO). Both are Dead Zone exclusives and no longer drop from packs.']],
  ['Quality of Life', ['Home now has a To Do list: Daily Boss tries, Pass rewards, achievements, finished missions, free packs and spare duplicates. Tap any item to go straight there.', 'Claim All collects your daily login, missions, achievements and Season Pass rewards in one tap. Pick rewards still need to be chosen on the Pass page.', 'My Cards has Sell All Dupes (coins) and Shred All (shards). One copy of every card is always kept, and locked or favourite cards are skipped.', 'The banner countdown now shows on Home.', 'How It Works is now a short, simple summary of each card.']],
  ['Veteran Roster · Wave Two', ["24 older cards gained new roles or stronger specialties, including tag-out cover, shield removal, Defense shred and reflection counters.","Legendary: WHITEBEARD (WORLD'S STRONGEST MAN), LEVI (HUMANITY'S STRONGEST), EREN (MARLEY RAID), KARS (ULTIMATE THING), LUFFY (EMPEROR OF THE SEA), GOHAN (FUTURE · LAST HOPE), KING (FAIRY KING), KIRA (A QUIET LIFE), MELIODAS (ASSAULT MODE), JOTARO (STONE OCEAN), VEGETA (SUPER SAIYAN), YAMATO (GUARDIAN OF WANO).","Mythic: BOROS (METEORIC BURST), YUTA (RIKA MANIFESTED), DEKU (ONE FOR ALL · UNLEASHED), SUPER GOGETA (SUPER SAIYAN), RENGOKU (VS AKAZA), ESCANOR (THE ONE), EREN (THE RUMBLING), YAMAMOTO (ZANKA NO TACHI), KANEKI (CENTIPEDE KAKUJA).","Rainbow: NATSU (DRAGON FORCE), NARUTO & SASUKE (TEAM 7 · BONDS), ICHIGO (FALSE TRUE BANKAI · VS YHWACH)."]],
  ['Card Clarity', ['Every card now has a How It Works panel with a Special summary and an explanation of its passive, including unique kits.']],
  ['Veteran Roster Update', [
    '30 older cards have new tools or stronger specialties: 20 Legendaries and 10 Mythics.',
    'Legendaries: Hisoka, Itachi, Geto, Maki, Hagoromo, Sanji, Jiren, Mikasa, Jiraiya, Lara Tybur, Tatsumaki, Neferpitou, Black Cat Yoruichi, Armin, Kishibe, Momo, Final War Bakugo, Reze, Zeldris and Vigilante Deku.',
    'Mythics: Arthur (vs Dragon), Serious Saitama, Super Saiyan 4 Goku, Diavolo, Prime All Might, Blackbeard, Genos (Armor Upgrade), The Evangelist, Final Explosion Vegeta and Super Saiyan Blue Gogeta.',
    'Highlights: Maki, Kishibe, Arthur and Saitama now strip shields with Specials. Jiren, Lara, Momo and All Might protect an incoming ally on their first live tag-out. Hagoromo, Geto, Jiraiya, Momo and The Evangelist offer more team healing. Itachi, Vigilante Deku and Blue Gogeta bypass damage reflection with Specials and Ultimates.',
  ]],
  ['Roster Update', [
    'Epic Reiner (Armored Titan) gives the incoming ally a 25% max-HP shield the first time he tags out alive.',
    'Epic Kakashi (Double Mangekyo) strips the active enemy’s shield with his Special. Its power rises from 220% to 245%.',
  ]],
  ['Battle Balance', [
    'Enemies in Campaign, Dead Zone and Daily Boss scale only partly with your team, so upgrades make a bigger difference. Campaign difficulty now comes mainly from the chapter.',
    'Dead Zone enemies can no longer recover lost HP. Sukuna’s World Cut cannot drop your maximum HP below 70% of its starting value.',
    'New Gen boss attacks share a per-target damage cap each turn, and the Aizen New Gen zone is easier.',
  ]],
  ['Team Building', [
    'Squad Bond: sharing a series, faction or archetype tag gives 10% damage reduction at 4 fighters. At 5, it gives 15% damage reduction and 2% regen. At 6, it gives 20% damage reduction, 3% regen and a one-time KO save for the leader.',
    'Multiverse Bonus: 3 series gives +5% stats, 4 gives +8%, and 5 or more gives +12% and +1 Energy per turn.',
    'Filter and build around 11 archetypes: Protagonist, Rival, Mentor, Sovereign, Monster, Blademaster, Tactician, Berserker, Guardian, Heroine and Speedster.',
  ]],
  ['Dead Zone Briefings & Fast Training', [
    'Choose View Briefing before any Dead Zone fight to see the boss’s kit, how to answer its warnings, what to bring, and bonus-damage tags where they apply. You can scout locked stages.',
    'On an owned card, Train to Level lets you pick an exact target. Train to Max opens the Level 100 preview. Choose coins, Training Tickets or a mix, then review the total and confirm before spending.',
  ]],
  ['Card Balance', [
    '83 base OVRs now fit their existing rarity bands.',
    'Gear 5 Luffy’s Special restores 25% Ultimate gauge and 1 Energy. Flash Goddess Yoruichi’s counter is softer, grants 10% gauge, and her mark detonation refunds 15% gauge without an Energy refund.',
    'Full Hollow Ichigo refunds 15% Ultimate gauge on a damaging Ultimate. Samehada Kisame still absorbs Blasts and steals Energy from them. His regular hits no longer drain Energy, and Water Dome shields allies for 12–30% max HP depending on charges.',
    'Light-Speed Admiral Kizaru’s Special strips the active enemy’s shield. Ice Age Aokiji starts with a 30% shield and takes 20% less damage. Strength of a Hundred Tsunade heals the active ally for 10% from the bench each turn. Her Special heals and shields all living allies for 15% max HP each.',
  ]],
  ['Clarity & Visuals', [
    'Card pages now have How It Works and Level & Diamonds panels. At 7◆, Limit Break boosts the passive by 25% and unlocks the Awakened Ultimate.',
    'Passive icons show under fighters during battle. Transformations charge, flip and burst on the card itself.',
  ]],
  ['Cards', [
    'Same-name cards now have distinct versions, including Muzan (Progenitor / Final Form), Ichigo (Hollow Awakening), Chrollo (Phantom Troupe Head), Luffy (Gear 4 · King Cobra), Hisoka (Elastic Trap), Sanji (Bœuf Burst), Mahoraga (Adaptation) and Natsu (Fire Dragon King).',
    'Removed duplicate Epic and Rare Makima cards and fixed cases where cards showed the wrong art.',
  ]],
  ['Modes & Banner', [
    'Campaign, Dead Zone, Live PvP, Story Arcs, Daily Boss and Season Pass are open. Other modes are paused during balance tuning.',
    'The Resurrección banner ends at midnight UK time as 27 November turns into 28 November.',
  ]],
]

export function showPatchNotes(profile, acknowledge) {
  if ((profile.seenPatchVersion || 0) >= PATCH_VERSION) return Promise.resolve()
  return new Promise(resolve => {
    const make = (tag, text, className = '') => {
      const el = document.createElement(tag)
      el.className = className
      el.textContent = text
      return el
    }
    const dialog = make('dialog', '', 'patch-notes')
    const header = make('header', '')
    const title = make('h2', 'Balance & Team Building')
    title.id = 'patch-notes-title'
    const date = make('time', '26 Nov 2026', 'patch-date')
    date.dateTime = '2026-11-26'
    header.append(make('p', 'Patch notes', 'patch-kicker'), title, date)
    dialog.setAttribute('aria-labelledby', title.id)
    const body = make('div', '', 'patch-body')
    body.tabIndex = 0
    body.setAttribute('aria-label', 'Patch changes')
    for (const [name, points] of NOTES) {
      const section = make('section', '')
      const list = make('ul', '')
      list.append(...points.map(point => make('li', point)))
      section.append(make('h3', name), list)
      body.append(section)
    }
    const footer = make('footer', '')
    const status = make('span', '', 'patch-status')
    status.setAttribute('role', 'status')
    const close = make('button', 'GOT IT', 'btn gold big')
    close.type = 'button'
    close.onclick = async () => {
      if (close.disabled) return
      close.disabled = true
      status.textContent = 'Saving…'
      try {
        if (await acknowledge(PATCH_VERSION)) {
          dialog.close()
          dialog.remove()
          resolve()
          return
        }
      } catch { /* Leave the dialog open so the player can retry. */ }
      status.textContent = 'Couldn’t save. Try again.'
      close.disabled = false
    }
    footer.append(status, close)
    dialog.append(header, body, footer)
    dialog.addEventListener('cancel', event => event.preventDefault())
    document.body.append(dialog)
    dialog.showModal()
    body.focus()
  })
}
