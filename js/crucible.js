// THE CRUCIBLE: one continuous run of handmade stages. HP, KOs and Ultimate gauge carry from stage to stage.
// Healing items are only usable between stages. Add a stage = add a row. Make one harder = raise its boost.
// enemy: card names (strongest version is used) or exact card ids. rules: same keys as Dead Zone rules.
export const CRUCIBLE_STAGES = [
  // 1-3 teach the mode
  { name: 'Opening Bell', enemy: ['KAKASHI'], boost: .9, rules: {}, weak: ['Protagonist'], tip: 'Learn the flow: your HP carries into the next stage.' },
  { name: 'Hashira Trial', enemy: ['TANJIRO', 'ZENITSU', 'RENGOKU'], boost: .8, rules: {}, weak: ['Rival'], tip: 'Three enemies chip your bench. Switch before anyone drops too low.' },
  { name: 'The Sand Wall', enemy: ['GAARA'], boost: 1.05, rules: { dr: 15 }, weak: ['Berserker'], tip: 'A wall that takes less damage. Berserkers break it.' },
  // 4-10: real fights start
  { name: 'Flash Step', enemy: ['KILLUA', 'MINATO'], boost: 2.17, rules: { dodge: 22 }, weak: ['Tactician'], tip: 'They dodge a lot. Tacticians and Guard-piercers land the hits.' },
  { name: 'Upper Moons', enemy: ['AKAZA', 'DOMA'], boost: 2.33, rules: { reflect: 25 }, weak: ['Blademaster'], tip: 'Every hit you land bounces back. Few big hits beat many small ones.' },
  { name: 'Royal Guard', enemy: ['NEFERPITOU', 'SHAIAPOUF', 'MERUEM'], boost: 2.33, rules: { dmg: 20 }, weak: ['Protagonist'], tip: 'The King is waiting at the back. Save your Ultimate for him.' },
  { name: 'Moon Breathing', enemy: ['KOKUSHIBO'], boost: 3, rules: { dodge: 18, doubleStrike: 1 }, weak: ['Speedster'], tip: 'His Strikes hit twice. Speedsters get there first.' },
  { name: 'Silent Hands', enemy: ['MAKIMA', 'CHROLLO'], boost: 2.7, rules: { firstNull: 2 }, weak: ['Berserker'], tip: 'Each enemy ignores your first 2 hits. Open with cheap Strikes.' },
  { name: 'Akatsuki', enemy: ['ITACHI', 'KISAME', 'DEIDARA', 'PAIN'], boost: 2.56, rules: { pierceSpec: 1, spec: 25 }, weak: ['Heroine'], tip: 'Their Specials ignore Guard. Heal between stages if you need to.' },
  { name: 'BOSS · The Ogre', enemy: ['YUJIRO HANMA'], boost: 3.67, boss: 1, rules: { dr: 18, endure: 1, ramp: 5, rampMax: 30 }, weak: ['Protagonist'], tip: 'He gets stronger every turn and gets back up once. Burst him.' },
  // 11-20: every stage asks for a specific answer
  { name: 'Espada', enemy: ['GRIMMJOW', 'ULQUIORRA', 'NNOITRA'], boost: 2.46, rules: { dmg: 20, dr: 10 }, weak: ['Blademaster'], tip: 'Hollows fear blades. Bring your swordsmen.' },
  { name: 'Hellfire', enemy: ['DABI', 'AKAINU'], boost: 2.52, rules: { burn: 6, dmg: 15 }, weak: ['Guardian'], tip: 'Everything burns. Guardians hold the line while burns tick.' },
  { name: 'Unreachable', enemy: ['GOJO'], boost: 2.35, rules: { firstNull: 3, dr: 15 }, weak: ['Tactician'], tip: 'Infinity eats your first 3 hits. Plan the opener.' },
  { name: 'Emperors', enemy: ['KAIDO', 'BIG MOM', 'BLACKBEARD'], boost: 2.0, rules: { dr: 15, endure: 1 }, weak: ['Rival'], tip: 'Three Emperors that all get back up once. This is an attrition fight.' },
  { name: 'Pride Trooper', enemy: ['JIREN', 'TOPPO'], boost: 2.25, rules: { reflect: 15, dr: 12 }, weak: ['Sovereign'], tip: 'Gods & Kings punch through their defences.' },
  { name: 'Hero Hunter', enemy: ['GAROU'], boost: 2.5, rules: { adapt: 6, adaptMax: 36, dmg: 15 }, weak: ['Protagonist'], tip: 'He adapts to every hit. End it fast.' },
  { name: 'Bloodline', enemy: ['JACK HANMA', 'PICKLE', 'BISCUIT OLIVA'], boost: 2.15, rules: { dmg: 25 }, weak: ['Tactician'], tip: 'Pure power. Outthink them.' },
  { name: 'Uchiha', enemy: ['MADARA', 'OBITO'], boost: 1.85, rules: { dmg: 15 }, weak: ['Mentor'], tip: 'Their Strikes ignore Guard. Mentors know how to fight legends.' },
  { name: 'Hidden Mist', enemy: ['ZABUZA', 'KISAME'], boost: 2.3, rules: { dodge: 25, dmg: 15 }, weak: ['Speedster'], tip: 'Hard to hit. Speedsters cut through the mist.' },
  { name: 'BOSS · King of Curses', enemy: ['SUKUNA'], boost: 2.85, boss: 1, rules: { dmg: 25, dr: 15, endure: 1, burn: 5 }, weak: ['Protagonist', 'Blademaster'], tip: 'Malevolent Shrine burns. Bring your best for the King.' },
  // 21-30: you need a plan
  { name: 'Shadow Monarch', enemy: ['SUNG JINWOO'], boost: 3.02, rules: { dmg: 20, ramp: 4, rampMax: 28 }, weak: ['Sovereign'], tip: 'He snowballs. Kill him before turn 6.' },
  { name: 'Demon Kings', enemy: ['MUZAN', 'ESCANOR', 'ZELDRIS'], boost: 2.69, rules: { dr: 15, regen: 3 }, weak: ['Guardian', 'Heroine'], tip: 'They heal. Out-damage the regen.' },
  { name: 'The Strongest', enemy: ['TOJI', 'MAHORAGA'], boost: 2.91, rules: { adapt: 7, adaptMax: 42, pierce: 1 }, weak: ['Tactician'], tip: 'Mahoraga adapts and Toji ignores Guard. Change your attacks.' },
  { name: 'Zoldyck Contract', enemy: ['CHROLLO', 'HISOKA', 'SILVA & ZENO', 'ALLUKA'], boost: 2.58, rules: { dodge: 15, reflect: 15 }, weak: ['Protagonist'], tip: 'Four Nen masters that dodge and reflect. Spread your damage carefully.' },
  { name: 'Cross Guild', enemy: ['MIHAWK', 'CROCODILE'], boost: 3.02, rules: { pierce: 1, dmg: 25 }, weak: ['Berserker'], tip: 'Everything ignores Guard. Shields and damage reduction matter.' },
  { name: 'Speed of Light', enemy: ['KIZARU', 'ROB LUCCI'], boost: 3.08, rules: { dodge: 25, dmg: 20 }, weak: ['Speedster'], tip: 'Fast and slippery. Only Speedsters keep up.' },
  { name: 'Hōgyoku', enemy: ['AIZEN'], boost: 3.36, rules: { dodge: 20, firstNull: 2, dr: 15 }, weak: ['Blademaster'], tip: 'Since when were you under the illusion this would be easy?' },
  { name: 'Symbol of Evil', enemy: ['ALL FOR ONE', 'SHIGARAKI'], boost: 3.08, rules: { dmg: 25, endure: 1 }, weak: ['Protagonist'], tip: 'They steal and get back up. Save an item for after this.' },
  { name: 'The World', enemy: ['DIO'], boost: 3.47, rules: { dmg: 30, dr: 15, doubleStrike: 1 }, weak: ['Rival'], tip: 'Time stops for everyone but him.' },
  { name: 'BOSS · The Almighty', enemy: ['YHWACH'], boost: 3.4, boss: 1, rules: { dmg: 30, dr: 20, endure: 1, reflect: 15, pierceSpec: 1 }, weak: ['Protagonist', 'Sovereign'], tip: 'The Almighty sees your future. Everything you saved was for this.' },
  // 31-40: the second climb
  { name: 'Thousand Year War', enemy: ['YAMAMOTO', 'UNOHANA', 'KENPACHI'], boost: 2.9, rules: { dmg: 25, burn: 5 }, weak: ['Blademaster'], tip: 'Three captains, one of them on fire. Swords against swords.' },
  { name: 'Otsutsuki', enemy: ['KAGUYA', 'MOMOSHIKI'], boost: 2.68, rules: { firstNull: 2, pierceSpec: 1, dmg: 20 }, weak: ['Protagonist'], tip: 'Celestial beings ignore your first hits and your Guard.' },
  { name: 'Black Wizard', enemy: ['ZEREF', 'ACNOLOGIA'], boost: 2.72, rules: { dmg: 30, burn: 6, dr: 10 }, weak: ['Guardian'], tip: 'Fire and dragon slayer magic. Guardians and shields first.' },
  { name: 'Destroyer', enemy: ['BEERUS', 'WHIS'], boost: 2.85, rules: { dodge: 25, dr: 20 }, weak: ['Tactician'], tip: 'Gods who dodge and shrug off damage. Outthink them.' },
  { name: 'Rosé', enemy: ['GOKU BLACK', 'BROLY'], boost: 2.76, rules: { reflect: 20, ramp: 5, rampMax: 30 }, weak: ['Rival'], tip: 'One reflects, the other snowballs. Kill Broly first.' },
  { name: 'Yonko War', enemy: ['WHITEBEARD', 'KAIDO', 'BLACKBEARD', 'SHANKS'], boost: 2.34, rules: { dr: 20, endure: 1 }, weak: ['Sovereign'], tip: 'Four Emperors, all of them get back up once. Budget your items.' },
  { name: 'Ancient Sword', enemy: ['YORIICHI', 'KOKUSHIBO'], boost: 3.45, rules: { doubleStrike: 1, pierceStrike: 1, dodge: 15 }, weak: ['Speedster'], tip: 'The Sun and the Moon. Their Strikes hit twice and ignore Guard.' },
  { name: 'Hero Killers', enemy: ['STAIN', 'TURBO GRANNY', 'REZE'], boost: 3.21, rules: { dmg: 35, first: 1 }, weak: ['Guardian'], tip: 'They all move first and hit hard. Lead with a tank.' },
  { name: 'Shadow Army', enemy: ['SUNG JINWOO', 'MUSASHI MIYAMOTO'], boost: 3.5, rules: { dmg: 25, pierce: 1, ramp: 4, rampMax: 24 }, weak: ['Sovereign'], tip: 'Nothing blocks them, and they keep getting stronger.' },
  { name: 'BOSS · Strongest of Today', enemy: ['GOJO'], boost: 3.27, boss: 1, rules: { firstNull: 4, dr: 25, endure: 1, pierceSpec: 1 }, weak: ['Tactician', 'Berserker'], tip: 'Infinity eats your first 4 hits and he gets back up. Bring your heaviest hitters.' },
  // 41-50: the summit
  { name: 'Disaster Level', enemy: ['BOROS', 'TATSUMAKI'], boost: 3.06, rules: { dmg: 35, regen: 4 }, weak: ['Protagonist'], tip: 'Alien regeneration and psychic power. Out-damage the healing.' },
  { name: 'Demon Lords', enemy: ['MUZAN', 'ZELDRIS', 'MELIODAS'], boost: 2.57, rules: { dr: 20, regen: 4, endure: 1 }, weak: ['Heroine'], tip: 'They heal and get back up. A long war of attrition.' },
  { name: 'Requiem', enemy: ['GIORNO', 'DIAVOLO'], boost: 3.6, rules: { firstNull: 3, reflect: 20 }, weak: ['Rival'], tip: 'Your first hits never happen, and the rest bounce back.' },
  { name: 'Ten Shadows', enemy: ['SUKUNA', 'YUTA'], boost: 3.15, rules: { dmg: 30, burn: 6, endure: 1 }, weak: ['Blademaster'], tip: 'Fire and copied techniques. Bring blades.' },
  { name: 'Hanma Blood', enemy: ['YUJIRO HANMA', 'BAKI HANMA'], boost: 3.75, rules: { dmg: 30, adapt: 6, adaptMax: 36 }, weak: ['Tactician'], tip: 'Father and son adapt to everything. Change your attacks.' },
  { name: 'Ultimate Lifeform', enemy: ['KARS', 'PICKLE', 'MERUEM'], boost: 4.14, rules: { drain: 20, dr: 20 }, weak: ['Sovereign'], tip: 'Three apex predators that heal off every hit.' },
  { name: 'The Father of All', enemy: ['IMU'], boost: 3.91, rules: { dmg: 35, dr: 25, nullPassive: 1 }, weak: ['Protagonist', 'Rival'], tip: 'Your passives mean nothing to the ruler of the world.' },
  { name: 'Fusion', enemy: ['GOGETA', 'VEGITO'], boost: 3.36, rules: { dmg: 35, first: 1, dodge: 20 }, weak: ['Berserker'], tip: 'Two fusions that move first and dodge. Brute-force them.' },
  { name: 'One Above All', enemy: ['SAITAMA'], boost: 4.15, rules: { dmg: 40, dr: 30, endure: 1 }, weak: ['Tactician'], tip: 'One punch. Make sure he never gets the chance to throw it.' },
  { name: 'BOSS · Beyond the Hōgyoku', enemy: ['AIZEN', 'YHWACH'], boost: 3.96, boss: 1, rules: { dmg: 40, dr: 25, endure: 1, firstNull: 2, reflect: 15, pierceSpec: 1 }, weak: ['Protagonist', 'Blademaster'], tip: 'The summit. Two gods of Bleach at once. Only a perfect run gets here.' },
].map((s, i) => ({ ...s, n: i + 1 }))

export const CRUCIBLE_ITEMS = {
  senzu: { name: 'Senzu Bean', icon: '🫘', d: 'Fully heal one fighter.' },
  revive: { name: 'Revive', icon: '✨', d: 'Bring back a KO’d fighter at 40% HP.' },
  heal: { name: 'Team Heal', icon: '💚', d: 'Heal every fighter 25%.' },
}
export const CRUCIBLE_ITEM_CAP = 5

// first clear of a stage pays the full reward; replays pay 20% coins
export function crucibleReward(n) {
  const r = { coins: 2500 + n * 600, shards: 120 + n * 30, gearShards: 60 + n * 6 + (n % 10 === 0 ? 400 : 0) }
  if (n % 5 === 0) r.premium = 1
  if (n % 10 === 0) { r.premium = 2 + n / 10; r.tickets = 5 + n / 2; r.shards += 1500 * n / 10; r.item = 1 }
  if (n === CRUCIBLE_STAGES.length) { r.coins += 100000; r.shards += 10000; r.premium += 3; r.card = 'GUTS · Exclusive Mythic' }
  return r
}
export const crucibleRewardText = r => [r.card && '⚔ ' + r.card, r.coins && r.coins.toLocaleString() + ' coins', r.shards && '◆' + r.shards.toLocaleString(), r.gearShards && '◈' + r.gearShards.toLocaleString() + ' gear shards', r.premium && r.premium + '× Premium', r.tickets && r.tickets + ' Tickets', r.item && '+1 item', r.gear && r.gear + ' (gear)'].filter(Boolean).join(' · ')
