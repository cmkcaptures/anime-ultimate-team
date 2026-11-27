// THE CRUCIBLE: one continuous run of handmade stages. HP, KOs and Ultimate gauge carry from stage to stage.
// Healing items are only usable between stages. Add a stage = add a row. Make one harder = raise its boost.
// enemy: card names (strongest version is used) or exact card ids. rules: same keys as Dead Zone rules.
export const CRUCIBLE_STAGES = [
  // 1-3 teach the mode
  { name: 'Opening Bell', enemy: ['KAKASHI'], boost: .9, rules: {}, weak: ['Protagonist'], tip: 'Learn the flow: your HP carries into the next stage.' },
  { name: 'Hashira Trial', enemy: ['TANJIRO', 'ZENITSU', 'RENGOKU'], boost: .8, rules: {}, weak: ['Rival'], tip: 'Three enemies chip your bench. Switch before anyone drops too low.' },
  { name: 'The Sand Wall', enemy: ['GAARA'], boost: 1.05, rules: { dr: 15 }, weak: ['Berserker'], tip: 'A wall that takes less damage. Berserkers break it.' },
  // 4-10: real fights start
  { name: 'Flash Step', enemy: ['KILLUA', 'MINATO'], boost: 1.45, rules: { dodge: 22 }, weak: ['Tactician'], tip: 'They dodge a lot. Tacticians and Guard-piercers land the hits.' },
  { name: 'Upper Moons', enemy: ['AKAZA', 'DOMA'], boost: 1.55, rules: { reflect: 25 }, weak: ['Blademaster'], tip: 'Every hit you land bounces back. Few big hits beat many small ones.' },
  { name: 'Royal Guard', enemy: ['NEFERPITOU', 'SHAIAPOUF', 'MERUEM'], boost: 1.55, rules: { dmg: 20 }, weak: ['Protagonist'], tip: 'The King is waiting at the back. Save your Ultimate for him.' },
  { name: 'Moon Breathing', enemy: ['KOKUSHIBO'], boost: 2.0, rules: { dodge: 18, doubleStrike: 1 }, weak: ['Speedster'], tip: 'His Strikes hit twice. Speedsters get there first.' },
  { name: 'Silent Hands', enemy: ['MAKIMA', 'CHROLLO'], boost: 1.8, rules: { firstNull: 2 }, weak: ['Berserker'], tip: 'Each enemy ignores your first 2 hits. Open with cheap Strikes.' },
  { name: 'Akatsuki', enemy: ['ITACHI', 'KISAME', 'DEIDARA', 'PAIN'], boost: 1.7, rules: { pierceSpec: 1, spec: 25 }, weak: ['Heroine'], tip: 'Their Specials ignore Guard. Heal between stages if you need to.' },
  { name: 'BOSS · The Ogre', enemy: ['YUJIRO HANMA'], boost: 2.45, boss: 1, rules: { dr: 18, endure: 1, ramp: 5, rampMax: 30 }, weak: ['Protagonist'], tip: 'He gets stronger every turn and gets back up once. Burst him.' },
  // 11-20: every stage asks for a specific answer
  { name: 'Espada', enemy: ['GRIMMJOW', 'ULQUIORRA', 'NNOITRA'], boost: 2.05, rules: { dmg: 20, dr: 10 }, weak: ['Blademaster'], tip: 'Hollows fear blades. Bring your swordsmen.' },
  { name: 'Hellfire', enemy: ['DABI', 'AKAINU'], boost: 2.1, rules: { burn: 6, dmg: 15 }, weak: ['Guardian'], tip: 'Everything burns. Guardians hold the line while burns tick.' },
  { name: 'Unreachable', enemy: ['GOJO'], boost: 2.35, rules: { firstNull: 3, dr: 15 }, weak: ['Tactician'], tip: 'Infinity eats your first 3 hits. Plan the opener.' },
  { name: 'Emperors', enemy: ['KAIDO', 'BIG MOM', 'BLACKBEARD'], boost: 2.0, rules: { dr: 15, endure: 1 }, weak: ['Rival'], tip: 'Three Emperors that all get back up once. This is an attrition fight.' },
  { name: 'Pride Trooper', enemy: ['JIREN', 'TOPPO'], boost: 2.25, rules: { reflect: 15, dr: 12 }, weak: ['Sovereign'], tip: 'Gods & Kings punch through their defences.' },
  { name: 'Hero Hunter', enemy: ['GAROU'], boost: 2.5, rules: { adapt: 6, adaptMax: 36, dmg: 15 }, weak: ['Protagonist'], tip: 'He adapts to every hit. End it fast.' },
  { name: 'Bloodline', enemy: ['JACK HANMA', 'PICKLE', 'BISCUIT OLIVA'], boost: 2.15, rules: { dmg: 25 }, weak: ['Tactician'], tip: 'Pure power. Outthink them.' },
  { name: 'Uchiha', enemy: ['MADARA', 'OBITO'], boost: 2.3, rules: { pierceStrike: 1, dmg: 20 }, weak: ['Mentor'], tip: 'Their Strikes ignore Guard. Mentors know how to fight legends.' },
  { name: 'Hidden Mist', enemy: ['ZABUZA', 'KISAME'], boost: 2.3, rules: { dodge: 25, dmg: 15 }, weak: ['Speedster'], tip: 'Hard to hit. Speedsters cut through the mist.' },
  { name: 'BOSS · King of Curses', enemy: ['SUKUNA'], boost: 2.85, boss: 1, rules: { dmg: 25, dr: 15, endure: 1, burn: 5 }, weak: ['Protagonist', 'Blademaster'], tip: 'Malevolent Shrine burns. Bring your best for the King.' },
  // 21-30: you need a plan
  { name: 'Shadow Monarch', enemy: ['SUNG JINWOO'], boost: 2.7, rules: { dmg: 20, ramp: 4, rampMax: 28 }, weak: ['Sovereign'], tip: 'He snowballs. Kill him before turn 6.' },
  { name: 'Demon Kings', enemy: ['MUZAN', 'ESCANOR', 'ZELDRIS'], boost: 2.4, rules: { dr: 15, regen: 3 }, weak: ['Guardian', 'Heroine'], tip: 'They heal. Out-damage the regen.' },
  { name: 'The Strongest', enemy: ['TOJI', 'MAHORAGA'], boost: 2.6, rules: { adapt: 7, adaptMax: 42, pierce: 1 }, weak: ['Tactician'], tip: 'Mahoraga adapts and Toji ignores Guard. Change your attacks.' },
  { name: 'Zoldyck Contract', enemy: ['CHROLLO', 'HISOKA', 'SILVA & ZENO', 'ALLUKA'], boost: 2.3, rules: { dodge: 15, reflect: 15 }, weak: ['Protagonist'], tip: 'Four Nen masters that dodge and reflect. Spread your damage carefully.' },
  { name: 'Cross Guild', enemy: ['MIHAWK', 'CROCODILE'], boost: 2.7, rules: { pierce: 1, dmg: 25 }, weak: ['Berserker'], tip: 'Everything ignores Guard. Shields and damage reduction matter.' },
  { name: 'Speed of Light', enemy: ['KIZARU', 'ROB LUCCI'], boost: 2.75, rules: { dodge: 25, dmg: 20 }, weak: ['Speedster'], tip: 'Fast and slippery. Only Speedsters keep up.' },
  { name: 'Hōgyoku', enemy: ['AIZEN'], boost: 3.0, rules: { dodge: 20, firstNull: 2, dr: 15 }, weak: ['Blademaster'], tip: 'Since when were you under the illusion this would be easy?' },
  { name: 'Symbol of Evil', enemy: ['ALL FOR ONE', 'SHIGARAKI'], boost: 2.75, rules: { dmg: 25, endure: 1 }, weak: ['Protagonist'], tip: 'They steal and get back up. Save an item for after this.' },
  { name: 'The World', enemy: ['DIO'], boost: 3.1, rules: { dmg: 30, dr: 15, doubleStrike: 1 }, weak: ['Rival'], tip: 'Time stops for everyone but him.' },
  { name: 'BOSS · The Almighty', enemy: ['YHWACH'], boost: 3.4, boss: 1, rules: { dmg: 30, dr: 20, endure: 1, reflect: 15, pierceSpec: 1 }, weak: ['Protagonist', 'Sovereign'], tip: 'The final wall of season one. Everything you saved was for this.' },
].map((s, i) => ({ ...s, n: i + 1 }))

export const CRUCIBLE_ITEMS = {
  senzu: { name: 'Senzu Bean', icon: '🫘', d: 'Fully heal one fighter.' },
  revive: { name: 'Revive', icon: '✨', d: 'Bring back a KO’d fighter at 40% HP.' },
  heal: { name: 'Team Heal', icon: '💚', d: 'Heal every fighter 25%.' },
}
export const CRUCIBLE_ITEM_CAP = 5

// first clear of a stage pays the full reward; replays pay 20% coins
export function crucibleReward(n) {
  const r = { coins: 2500 + n * 600, shards: 120 + n * 30 }
  if (n % 5 === 0) r.premium = 1
  if (n % 10 === 0) { r.premium = 2 + n / 10; r.tickets = 5 + n / 2; r.shards += 1500 * n / 10; r.item = 1 }
  if (n === CRUCIBLE_STAGES.length) { r.coins += 100000; r.shards += 10000; r.premium += 3 }
  return r
}
export const crucibleRewardText = r => [r.coins && r.coins.toLocaleString() + ' coins', r.shards && '◆' + r.shards.toLocaleString(), r.premium && r.premium + '× Premium', r.tickets && r.tickets + ' Tickets', r.item && '+1 item'].filter(Boolean).join(' · ')
