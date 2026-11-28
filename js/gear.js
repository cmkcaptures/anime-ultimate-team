// GEAR: 3 slots per fighter (0 Gold, 1 Silver, 2 Bronze). Main stat on the big-number scale + substats.
export const TIERS = { G: { name: 'GOLD', subs: 3, up: 2500, ref: 120, salv: 80, box: 600 }, S: { name: 'SILVER', subs: 2, up: 1500, ref: 50, salv: 30, box: 180 }, B: { name: 'BRONZE', subs: 1, up: 800, ref: 20, salv: 10, box: 60 } }
export const SLOT_TIER = ['G', 'S', 'B'] // legacy labels only: any gear fits any slot now
// requirements: minimum card rarity per gear tier (C<U<R<E<L<M<X)
export const GEAR_REQ = { G: { minR: 'L', text: 'Legendary or higher' }, S: { minR: 'E', text: 'Epic or higher' }, B: null }
export function gearReqOk(card, it) { const q = GEAR_REQ[GEAR_BASES[it.b].t]; return !q || 'CURELMX'.indexOf(card.r) >= 'CURELMX'.indexOf(q.minR) }
export const GEAR_BASES = {
  turtle_shell: { name: 'Turtle Shell', t: 'B', main: 'str' }, dragon_radar: { name: 'Dragon Radar', t: 'B', main: 'bla' }, power_pole: { name: 'Power Pole', t: 'B', main: 'def' },
  scouter: { name: 'Scouter', t: 'S', main: 'bla' }, headband: { name: 'Ninja Headband', t: 'S', main: 'str' }, hunter_license: { name: 'Hunter License', t: 'S', main: 'hp' },
  senzu: { name: 'Senzu Pouch', t: 'G', main: 'hp', fx: { senzuGear: 1 }, fxText: 'Once per battle, heals 25% HP when this fighter starts a turn below 30% HP.' },
  stand_arrow: { name: 'Stand Arrow', t: 'G', main: 'both', fx: { vsHigh: 10 }, fxText: '+10% damage against higher-rated enemies.' },
  capsule: { name: "Hoi-Poi Capsule", t: 'B', main: 'def' },
  den_den_mushi: { name: "Den Den Mushi", t: 'B', main: 'bla' },
  kunai: { name: "Kunai", t: 'B', main: 'str' },
  shuriken: { name: "Shuriken", t: 'B', main: 'bla' },
  explosive_tag: { name: "Explosive Tag", t: 'B', main: 'bla' },
  straw_hat: { name: "Straw Hat", t: 'B', main: 'hp' },
  log_pose: { name: "Log Pose", t: 'B', main: 'def' },
  poke_ball: { name: "Poké Ball", t: 'B', main: 'hp' },
  soul_pager: { name: "Soul Pager", t: 'B', main: 'def' },
  kasugai_crow: { name: "Kasugai Crow", t: 'B', main: 'str' },
  flak_jacket: { name: "Flak Jacket", t: 'B', main: 'def' },
  vivre_card: { name: "Vivre Card", t: 'B', main: 'hp' },
  rare_candy: { name: "Rare Candy", t: 'B', main: 'hp' },
  weighted_gi: { name: "Weighted Gi", t: 'B', main: 'str' },
  akatsuki_cloak: { name: "Akatsuki Cloak", t: 'S', main: 'def' },
  chain_jail: { name: "Chain Jail", t: 'S', main: 'str' },
  demon_slayer_sword: { name: "Demon-Slayer Sword", t: 'S', main: 'str' },
  dragon_ball_4: { name: "Four-Star Ball", t: 'S', main: 'hp' },
  nichirin_blade: { name: "Nichirin Blade", t: 'S', main: 'str' },
  kubikiribocho: { name: "Kubikiribōchō", t: 'S', main: 'str' },
  seastone_cuffs: { name: "Seastone Cuffs", t: 'S', main: 'def' },
  ultra_ball: { name: "Ultra Ball", t: 'S', main: 'bla' },
  heaven_spear: { name: "Inverted Spear", t: 'S', main: 'str' },
  playful_cloud: { name: "Playful Cloud", t: 'S', main: 'str' },
  wado_ichimonji: { name: "Wado Ichimonji", t: 'S', main: 'str' },
  kusanagi: { name: "Kusanagi Blade", t: 'S', main: 'bla' },
  shusui: { name: "Shusui", t: 'S', main: 'str' },
  demon_dweller: { name: "Demon-Dweller Sword", t: 'S', main: 'bla' },
  potara: { name: "Potara Earrings", t: 'G', main: 'both', fx: {first: 1}, fxText: "This fighter always moves first." },
  samehada: { name: "Samehada", t: 'G', main: 'hp', fx: {drain: 15}, fxText: "Steals 15% of damage dealt as HP." },
  gomu_fruit: { name: "Gomu Gomu Fruit", t: 'G', main: 'hp', fx: {dodge: 15}, fxText: "15% chance to dodge attacks." },
  yoru: { name: "Yoru", t: 'G', main: 'str', fx: {pierce: 1,crit: 10}, fxText: "Attacks ignore Guard and gain +10% crit chance." },
  hogyoku: { name: "Hōgyoku", t: 'G', main: 'both', fx: {regen: 4}, fxText: "Heals 4% HP every turn." },
  prison_realm: { name: "Prison Realm", t: 'G', main: 'def', fx: {nullPassive: 1}, fxText: "Seals the enemy fighter’s passive." },
  time_ring: { name: "Time Ring", t: 'G', main: 'bla', fx: {firstNull: 1}, fxText: "The first hit on this fighter never lands." },
  master_ball: { name: "Master Ball", t: 'G', main: 'hp', fx: {endure: 1}, fxText: "Survives one KO." },
  enma: { name: "Enma", t: 'G', main: 'str', fx: {ramp: 4,rampMax: 24}, fxText: "+4% damage every turn, up to +24%." },
  super_dragon_balls: { name: "Super Dragon Balls", t: 'G', main: 'both', fx: {teamHeal: 3}, fxText: "Heals the whole team 3% every turn." },
  ope_fruit: { name: "Ope Ope Fruit", t: 'G', main: 'def', fx: {shield: 20}, fxText: "Starts battle with a 20% max-HP shield." },
  z_sword: { name: "Z Sword", t: 'G', main: 'str', fx: {vsHigh: 15,dmg: 5}, fxText: "+5% damage, and +15% more against higher-rated enemies." },
  great_ball: { name: "Great Ball", t: 'B', main: 'hp' },
  premier_ball: { name: "Premier Ball", t: 'B', main: 'hp' },
  luxury_ball: { name: "Luxury Ball", t: 'B', main: 'def' },
  dusk_ball: { name: "Dusk Ball", t: 'B', main: 'bla' },
  quick_ball: { name: "Quick Ball", t: 'B', main: 'str' },
  choice_band: { name: "Choice Scarf", t: 'B', main: 'str' },
  focus_sash: { name: "Focus Sash", t: 'B', main: 'def' },
  sealing_scroll: { name: "Scroll of Seals", t: 'B', main: 'bla' },
  fox_mask: { name: "Warding Fox Mask", t: 'B', main: 'def' },
  eternal_pose: { name: "Eternal Pose", t: 'B', main: 'def' },
  battle_armor: { name: "Saiyan Battle Armor", t: 'B', main: 'def' },
  clima_tact: { name: "Clima-Tact", t: 'B', main: 'bla' },
  kabuto_sling: { name: "Kabuto Slingshot", t: 'B', main: 'bla' },
  gaara_gourd: { name: "Sand Gourd", t: 'B', main: 'def' },
  chakra_blade: { name: "Chakra Blades", t: 'S', main: 'str' },
  ame_no_habakiri: { name: "Ame no Habakiri", t: 'S', main: 'str' },
  sandai_kitetsu: { name: "Sandai Kitetsu", t: 'S', main: 'str' },
  split_soul_katana: { name: "Split Soul Katana", t: 'S', main: 'str' },
  senbonzakura: { name: "Senbonzakura", t: 'S', main: 'bla' },
  ryujin_jakka: { name: "Ryūjin Jakka", t: 'S', main: 'bla' },
  magic_stone: { name: "Magic Stones", t: 'S', main: 'bla' },
  celestial_keys: { name: "Celestial Keys", t: 'S', main: 'bla' },
  key_stone: { name: "Key Stone", t: 'S', main: 'hp' },
  z_ring: { name: "Z-Ring", t: 'S', main: 'bla' },
  flying_nimbus: { name: "Flying Nimbus", t: 'S', main: 'hp' },
  time_machine: { name: "Time Machine", t: 'S', main: 'def' },
  titan_serum: { name: "Titan Serum", t: 'S', main: 'hp' },
  poneglyph: { name: "Poneglyph", t: 'S', main: 'def' },
  mera_fruit: { name: "Mera Mera Fruit", t: 'G', main: 'bla', fx: {dmg: 12}, fxText: "+12% damage." },
  gura_fruit: { name: "Gura Gura Fruit", t: 'G', main: 'str', fx: {pierce: 1,dmg: 8}, fxText: "Attacks ignore Guard and deal +8% damage." },
  yami_fruit: { name: "Yami Yami Fruit", t: 'G', main: 'def', fx: {drain: 10,dr: 8}, fxText: "Steals 10% of damage as HP and takes 8% less damage." },
  ito_fruit: { name: "Lostvayne", t: 'G', main: 'str', fx: {crit: 15}, fxText: "+15% crit chance." },
  truth_seeking_ball: { name: "Truth-Seeking Ball", t: 'G', main: 'both', fx: {dr: 12,firstNull: 1}, fxText: "Takes 12% less damage and the first hit never lands." },
  namek_dragon_balls: { name: "Namekian Dragon Balls", t: 'G', main: 'hp', fx: {revive: 1}, fxText: "Comes back once after being knocked out." },
  tree_of_might: { name: "Fruit of the Tree of Might", t: 'G', main: 'hp', fx: {regen: 3,dmg: 5}, fxText: "Heals 3% a turn and deals +5% damage." },
  ultra_divine_water: { name: "Ultra Divine Water", t: 'G', main: 'both', fx: {dmg: 10,crit: 5}, fxText: "+10% damage and +5% crit chance." },
  stone_mask: { name: "Stone Mask", t: 'G', main: 'str', fx: {drain: 20}, fxText: "Steals 20% of damage dealt as HP." },
  red_stone_aja: { name: "Red Stone of Aja", t: 'G', main: 'bla', fx: {spec: 15}, fxText: "+15% Special damage." },
  saints_corpse: { name: "Saint’s Corpse", t: 'G', main: 'def', fx: {dr: 15}, fxText: "Takes 15% less damage." },
  greed_island_card: { name: "Greed Island Card", t: 'G', main: 'hp', fx: {dodge: 10,crit: 5}, fxText: "10% dodge and +5% crit chance." },
  moon_ball: { name: "Moon Ball", t: 'B', main: 'hp' },
  nest_ball: { name: "Nest Ball", t: 'B', main: 'hp' },
  net_ball: { name: "Net Ball", t: 'B', main: 'def' },
  heal_ball: { name: "Heal Ball", t: 'B', main: 'hp' },
  timer_ball: { name: "Timer Ball", t: 'B', main: 'bla' },
  safari_ball: { name: "Safari Ball", t: 'B', main: 'def' },
  dive_ball: { name: "Dive Ball", t: 'B', main: 'bla' },
  poke_flute: { name: "Poké Flute", t: 'B', main: 'def' },
  silph_scope: { name: "Silph Scope", t: 'B', main: 'bla' },
  rice_cooker: { name: "Mafuba Rice Cooker", t: 'B', main: 'def' },
  steel_ball: { name: "Steel Ball", t: 'B', main: 'str' },
  fuma_shuriken: { name: "Fūma Shuriken", t: 'B', main: 'str' },
  basho_fan: { name: "Bashōsen", t: 'B', main: 'bla' },
  lacrima: { name: "Lacrima", t: 'B', main: 'bla' },
  seven_star_sword: { name: "Seven-Star Sword", t: 'S', main: 'str' },
  kikoku: { name: "Kikoku", t: 'S', main: 'str' },
  murakumogiri: { name: "Murakumogiri", t: 'S', main: 'str' },
  shodai_kitetsu: { name: "Shodai Kitetsu", t: 'S', main: 'str' },
  thousand_mile_chain: { name: "Thousand-Mile Chain", t: 'S', main: 'str' },
  dragon_bone: { name: "Dragon-Bone", t: 'S', main: 'str' },
  kamutoke: { name: "Kamutoke", t: 'S', main: 'bla' },
  gravity_machine: { name: "Gravity Machine", t: 'S', main: 'def' },
  space_pod: { name: "Saiyan Space Pod", t: 'S', main: 'def' },
  raid_suit: { name: "Raid Suit", t: 'S', main: 'def' },
  black_star_balls: { name: "Black Star Dragon Balls", t: 'S', main: 'hp' },
  dream_ball: { name: "Dream Ball", t: 'S', main: 'hp' },
  beast_ball: { name: "Beast Ball", t: 'S', main: 'bla' },
  sacred_water: { name: "Sacred Water", t: 'S', main: 'hp' },
  goro_fruit: { name: "Herritt", t: 'G', main: 'bla', fx: {spec: 12,pierceSpec: 1}, fxText: "+12% Special damage and Specials pierce Guard." },
  pika_fruit: { name: "Pika Pika Fruit", t: 'G', main: 'bla', fx: {first: 1,dmg: 6}, fxText: "Always moves first and deals +6% damage." },
  magu_fruit: { name: "Magu Magu Fruit", t: 'G', main: 'str', fx: {dmg: 15}, fxText: "+15% damage." },
  hana_fruit: { name: "Sharingan", t: 'G', main: 'def', fx: {dodge: 12,dr: 6}, fxText: "12% dodge and takes 6% less damage." },
  mochi_fruit: { name: "Aldan", t: 'G', main: 'def', fx: {dr: 10,shield: 15}, fxText: "Takes 10% less damage and starts with a 15% shield." },
  suna_fruit: { name: "Chastiefol", t: 'G', main: 'hp', fx: {drain: 12,regen: 2}, fxText: "Steals 12% of damage as HP and heals 2% a turn." },
  nikyu_fruit: { name: "Gideon", t: 'G', main: 'def', fx: {reflect: 15}, fxText: "Reflects 15% of damage taken." },
  hobi_fruit: { name: "Rhitta", t: 'G', main: 'str', fx: {nullPassive: 1,dmg: 5}, fxText: "Seals the enemy passive and deals +5% damage." },
  bomu_fruit: { name: "Nidai Kitetsu", t: 'G', main: 'bla', fx: {crit: 12,dmg: 4}, fxText: "+12% crit chance and +4% damage." },
  gedo_statue: { name: "Outer Path Statue", t: 'G', main: 'hp', fx: {endure: 1,dr: 6}, fxText: "Survives one KO and takes 6% less damage." },
  angel_halo: { name: "Angel Halo", t: 'G', main: 'both', fx: {revive: 1}, fxText: "Comes back once after being knocked out." },
  rokakaka: { name: "Rokakaka Fruit", t: 'G', main: 'hp', fx: {teamHeal: 2,regen: 2}, fxText: "Heals the team 2% and itself 2% every turn." },
}
const MAIN = { B: { str: 1200, bla: 1200, def: 1200, hp: 9000 }, S: { str: 2400, bla: 2400, def: 2400, hp: 18000 }, G: { str: 4000, bla: 4000, def: 4000, hp: 30000 } }
export const MAIN_LABEL = { str: 'STRIKE ATK', bla: 'BLAST ATK', def: 'DEFENSE', hp: 'HP' }
const TAGS = ['Saiyans', 'Swordsmen', 'Heroes', 'Villains', 'Females', 'Demons', 'Monsters', 'Gods & Kings', 'Mentors', 'Protagonist', 'Rival', 'Speedster', 'Berserker', 'Guardian', 'Tactician', 'Blademaster', 'Sovereign', 'Heroine']
const SUBS = [['dmg', 2, 5, 'Damage'], ['dr', 2, 4, 'Damage taken'], ['crit', 2, 5, 'Crit chance'], ['spec', 3, 7, 'Special damage'], ['strikeBoost', 3, 7, 'Strike damage'], ['tagDmg', 4, 9, 'Damage'], ['tagDr', 3, 7, 'Damage taken']]
export const gearIcon = b => 'items/gear/' + b + '.webp?v=2'
export function rollSub(rnd = Math.random) {
  const [k, a, b] = SUBS[Math.floor(rnd() * SUBS.length)], s = { k, v: Math.round(a + rnd() * (b - a)) }
  if (k.startsWith('tag')) s.tag = TAGS[Math.floor(rnd() * TAGS.length)]
  return s
}
export function rollGear(b, rnd = Math.random) { const t = GEAR_BASES[b].t; return { b, lvl: 0, subs: Array.from({ length: TIERS[t].subs }, () => rollSub(rnd)), at: Date.now() } }
export function mainStats(it) {
  const B = GEAR_BASES[it.b], m = MAIN[B.t], k = 1 + (it.lvl || 0) * .08, o = {}
  if (B.main === 'both') { o.str = Math.round(m.str * .75 * k); o.bla = Math.round(m.bla * .75 * k) } else o[B.main] = Math.round(m[B.main] * k)
  return o
}
export const subValue = (s, lvl) => Math.round(s.v * (1 + (lvl || 0) * .04) * 10) / 10
export function subText(s, lvl) { const v = subValue(s, lvl), L = SUBS.find(x => x[0] === s.k)[3]; return (s.tag ? s.tag + ': ' : '') + (s.k.endsWith('Dr') || s.k === 'dr' ? '-' + v + '% ' + L : '+' + v + '% ' + L) }
const tagsOfCard = c => new Set([...(c.cat || []), ...(c.arch || []), c.faction, c.anime].filter(Boolean))
// fold equipped gear into a card: stats (big numbers -> internal units), HP, and passive effects
export function applyGear(c, items) {
  items = items.filter(Boolean); if (!items.length) return c
  const tags = tagsOfCard(c), tot = { str: 0, bla: 0, def: 0, hp: 0 }, e = { ...((c.pas && c.pas.e) || {}) }
  const add = (k, v) => { e[k] = (typeof e[k] === 'number' ? e[k] : 0) + v }
  for (const it of items) {
    for (const [k, v] of Object.entries(mainStats(it))) tot[k] += v
    for (const s of it.subs || []) { const v = subValue(s, it.lvl); if (s.k === 'tagDmg') { if (tags.has(s.tag)) add('dmg', v) } else if (s.k === 'tagDr') { if (tags.has(s.tag)) add('dr', v) } else add(s.k, v) }
    const fx = GEAR_BASES[it.b].fx; if (fx) for (const [k, v] of Object.entries(fx)) add(k, v)
  }
  for (const k of ['dmg', 'dr', 'crit', 'spec', 'strikeBoost']) if (typeof e[k] === 'number') e[k] = Math.round(e[k])
  const st = (c.st || [70, 70, 70, 70, 70, 70]).slice(); st[0] += Math.round(tot.str / 420); st[2] += Math.round(tot.bla / 420); st[4] += Math.round(tot.def / 420)
  return { ...c, st, gearHp: tot.hp, gearTot: tot, pas: { ...(c.pas || { n: 'GEAR', d: '' }), e } }
}
