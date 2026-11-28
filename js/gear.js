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
