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
}
const MAIN = { B: { str: 1200, bla: 1200, def: 1200, hp: 9000 }, S: { str: 2400, bla: 2400, def: 2400, hp: 18000 }, G: { str: 4000, bla: 4000, def: 4000, hp: 30000 } }
export const MAIN_LABEL = { str: 'STRIKE ATK', bla: 'BLAST ATK', def: 'DEFENSE', hp: 'HP' }
const TAGS = ['Saiyans', 'Swordsmen', 'Heroes', 'Villains', 'Females', 'Demons', 'Monsters', 'Gods & Kings', 'Mentors', 'Protagonist', 'Rival', 'Speedster', 'Berserker', 'Guardian', 'Tactician', 'Blademaster', 'Sovereign', 'Heroine']
const SUBS = [['dmg', 2, 5, 'Damage'], ['dr', 2, 4, 'Damage taken'], ['crit', 2, 5, 'Crit chance'], ['spec', 3, 7, 'Special damage'], ['strikeBoost', 3, 7, 'Strike damage'], ['tagDmg', 4, 9, 'Damage'], ['tagDr', 3, 7, 'Damage taken']]
export const gearIcon = b => 'items/gear/' + b + '.webp'
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
