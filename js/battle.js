// AUT Battle — turn-based hybrid of DB Legends (Arts cards, Energy, Ultimates, switching) and TCG Pocket (turns, energy, bench).
// Win by knocking out all 6 enemy fighters. 1 active fighter + 5 on the bench each side.
import { TIER, TYPE, thumbURL } from './cardkit.js'
import { sfx, sfxOn, music } from './sfx.js'
import { createFX } from './fx2d.js'

let X = null // app context: { h, $, cardImg, eff, BYKEY, POOL, P, act, go, toast, tierCol, ANAME }
export function initBattle(ctx) { X = ctx }

// ---------------- type matchups: each type beats the next one in the ring ----------------
const RING = ['ki', 'curse', 'chak', 'haki', 'mana', 'quirk', 'ego', 'breath', 'nen', 'magic', 'devil', 'stand', 'ghoul', 'reiatsu', 'kaiju', 'psychic', 'flame', 'hero']
const tOf = c => c.t || 'ki'
export const beats = (a, b) => RING[(RING.indexOf(a) + 1) % RING.length] === b
// team combos: these pairs on the same team link up
export const TEAM_COMBOS = [
  { a: 'NARUTO', b: 'SASUKE', n: 'RASENGAN × CHIDORI' }, { a: 'GOKU', b: 'VEGETA', n: 'FINAL KAMEHAMEHA' }, { a: 'DEKU', b: 'BAKUGO', n: 'WONDER DUO' },
  { a: 'GOJO', b: 'GETO', n: 'STRONGEST DUO' }, { a: 'GOJO', b: 'SUKUNA', n: 'STRONGEST VS KING' }, { a: 'ICHIGO', b: 'AIZEN', n: 'BEYOND TRANSCENDENCE' },
  { a: 'LUFFY', b: 'ZORO', n: 'CAPTAIN & FIRST MATE' }, { a: 'GON', b: 'KILLUA', n: 'BEST FRIENDS' }, { a: 'TANJIRO', b: 'ZENITSU', n: 'KAMADO SQUAD' },
  { a: 'ASTA', b: 'YUNO', n: 'RIVALS TO WIZARD KING' }, { a: 'NATSU', b: 'GRAY', n: 'FIRE & ICE' }, { a: 'ITADORI', b: 'TODO', n: 'BEST FRIENDS' },
  { a: 'JOTARO', b: 'DIO', n: 'ZA WARUDO CLASH' }, { a: 'SHINRA', b: 'SHO', n: 'KUSAKABE BROTHERS' }, { a: 'MADARA', b: 'OBITO', n: 'EYE OF THE MOON' },
  { a: 'ITACHI', b: 'SASUKE', n: 'UCHIHA BROTHERS' }, { a: 'DENJI', b: 'POWER', n: 'DEVIL DUO' }, { a: 'YAMI', b: 'ASTA', n: 'SURPASS YOUR LIMITS' },
]
export function combosFor(cards) { const names = new Set(); for (const c of cards) if (c) for (const p of c.name.split(' & ')) names.add(p.trim()); return TEAM_COMBOS.filter(x => names.has(x.a) && names.has(x.b)) }
// series synergy: 3+ fighters from one series boost the whole team's damage
export const SYN = { 3: 4, 4: 6, 5: 8, 6: 10 }
export function synergy(cards) { const n = {}; for (const c of cards) if (c) n[c.anime] = (n[c.anime] || 0) + 1; let best = null; for (const a in n) if (!best || n[a] > n[best]) best = a; const k = best ? n[best] : 0; return { anime: best, n: k, bonus: SYN[Math.min(6, k)] || 0 } }
const matchup = (att, def) => beats(tOf(att.card), tOf(def.card)) ? 1.3 : beats(tOf(def.card), tOf(att.card)) ? .8 : 1
const tcol = c => (TYPE[tOf(c)] || TYPE.ki).c[0]
const tname = c => (TYPE[tOf(c)] || TYPE.ki).en
const weakTo = t => RING[(RING.indexOf(t) - 1 + RING.length) % RING.length]

// ---------------- rules ----------------
const ICON = {"strike":"<svg viewBox=\"0 0 64 64\"><path d=\"M14 30c0-4 3-7 7-7h2v-5a5 5 0 0 1 10 0v2a5 5 0 0 1 10 0v3a5 5 0 0 1 9 3v12c0 9-7 16-16 16h-6c-9 0-16-7-16-16z\" fill=\"currentColor\"/><path d=\"M4 16l10 6M2 28h10M6 40l9-4\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>","blast":"<svg viewBox=\"0 0 64 64\"><circle cx=\"32\" cy=\"32\" r=\"13\" fill=\"currentColor\"/><circle cx=\"32\" cy=\"32\" r=\"21\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" opacity=\".55\"/><circle cx=\"32\" cy=\"32\" r=\"28\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" opacity=\".3\"/></svg>","guard":"<svg viewBox=\"0 0 64 64\"><path d=\"M32 4l22 8v16c0 15-10 26-22 32C20 54 10 43 10 28V12z\" fill=\"currentColor\"/><path d=\"M22 32l7 7 13-14\" stroke=\"#0b0d12\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>","special":"<svg viewBox=\"0 0 64 64\"><path d=\"M32 2l6 20 20-6-14 16 14 16-20-6-6 20-6-20-20 6 14-16L6 16l20 6z\" fill=\"currentColor\"/></svg>"}
const KI_PER_TURN = 3, KI_MAX = 10, HAND = 4, GAUGE_MAX = 100
const ARTS = {
  strike: { name: 'STRIKE', cost: 1, col: '#ff4a5a', desc: 'Fast hit · PWR' },
  blast: { name: 'BLAST', cost: 2, col: '#ffc23a', desc: 'Energy blast · ENG' },
  guard: { name: 'GUARD', cost: 1, col: '#3dffa0', desc: 'Halve the next hit' },
  special: { name: 'SPECIAL', cost: 4, col: '#4aa8ff', desc: 'Signature move' },
  burst: { name: 'BURST', cost: 0, col: '#ff3b6b', desc: 'Spend ALL Energy · huge hit', tactic: 1 },
  charge: { name: 'POWER CHARGE', cost: 1, col: '#ff9a00', desc: 'Next attack +35%, stacks', tactic: 1 },
  transfer: { name: 'ENERGY LINK', cost: 0, col: '#3ab8ff', desc: 'Bench feeds you +2 Energy', tactic: 1 },
  heal: { name: 'RECOVER', cost: 2, col: '#2fe0b0', desc: 'Heal your fighter 18%', tactic: 1 },
  cleanse: { name: 'CLEANSE', cost: 1, col: '#c9a8ff', desc: 'Remove burn/freeze · Guard up', tactic: 1 },
}
// tribes: field 3+ of a tribe for its bonus
export const DRAGONS = ['NATSU', 'ACNOLOGIA', 'GOKU', 'GOGETA', 'VEGITO', 'SHENRON']
const isDragon = c => c.name.split(' & ').some(n => DRAGONS.includes(n.trim()))
const TAC_ICON = { burst: '💥', charge: '⚡', transfer: '🔗', heal: '✚', cleanse: '✦' }
const pctOf = c => { const m = /(\d+)%\s*PWR/.exec((c.tx || []).join(' ')); return m ? +m[1] : 220 }
const isAoe = c => /all enemies/i.test((c.tx || []).join(' '))
const kitTxt = c => (c.tx || []).join(' ')
const kitNum = (c, re) => { const m = re.exec(kitTxt(c)); return m ? +m[1] : 0 }
// applies a card's kit bonuses after its Special / Ultimate lands
function kitEffects(me, a) {
  const c = a.card, notes = []
  const heal = kitNum(c, /Heal (\d+)% max HP/); if (heal) { const h = Math.round(a.max * heal / 100); a.hp = Math.min(a.max, a.hp + h); notes.push('+' + h.toLocaleString() + ' HP') }
  const ki = kitNum(c, /Gain (\d+) Energy/); if (ki) { me.ki = Math.min(KI_MAX, me.ki + ki); notes.push('+' + ki + ' ENERGY') }
  const g = kitNum(c, /Ultimate gauge by (\d+)%/); if (g) { me.gauge = Math.min(GAUGE_MAX, me.gauge + g); notes.push('+' + g + '% ULT') }
  if (/Gain Guard/.test(kitTxt(c))) { a.guard = 1; notes.push('GUARD UP') }
  return notes
}
function fighter(card, lvl = 0) {
  const [pwr, spd, ki, tec, def, iq] = card.st || [70, 70, 70, 70, 70, 70]
  const hp = Math.round(card.ovr * 40 + def * 12 + (card.tag ? 600 : 0))
  const e = (card.pas && card.pas.e) || {}, boost = 1 + (e.allStats || 0) / 100
  const f = { card, key: card.key, hp, max: hp, pwr: Math.round(pwr * boost), spd: Math.round(spd * boost) + (e.spd || 0), ki: Math.round(ki * boost), tec: Math.round(tec * boost), def: Math.round(def * boost), iq, guard: 0, ko: false, lvl, dealt: 0, kos: 0, fort: 0,
    pe: e, endure: e.endure || 0, revive: e.revive || 0, firstNull: e.firstNull || 0, hitsTaken: 0, turns: 0, rage: 0, shieldHp: e.shield ? Math.round(hp * e.shield / 100) : 0, burn: 0, burnT: 0, attacks: 0, ultFired: 0, ultDodge: e.ultDodge || 0, sealed: 0, opened: 0, arise: 0 }
  if (e.emperor) { f.pwr = Math.round(f.pwr * 1.1); f.ki = Math.round(f.ki * 1.1); f.def = Math.round(f.def * 1.1) }
  return f
}
function drawArt(f) {
  // the fighter's role nudges which arts show up (fighters strike, supports blast/guard)
  const r = Math.random(), role = f.card.role
  if (r < .14) return 'special'
  if (r < (role === 'TANK' || role === 'SUPPORT' ? .34 : .24)) return 'guard'
  if (r < (role === 'SHOOTER' || role === 'SUPPORT' ? .64 : .52)) return 'blast'
  return 'strike'
}
function newSide(cards) { return { team: cards.map(c => fighter(c)), active: 0, ki: 4, gauge: 0, hand: [], switched: false, seq: [] } }
const act = s => s.team[s.active]
const alive = s => s.team.filter(f => !f.ko)
const PE = f => (f && !f.sealed && f.pe) || {}
let PASLOG = null // events the UI shows when a passive triggers
const pasNote = (f, extra) => { if (PASLOG && f.card.pas) PASLOG.push({ f, name: f.card.pas.n, extra }) }
// bench passives: everyone waiting on the bench helps the active fighter
const PASSIVE = { SUPPORT: ['heal', 4, 'MEDIC'], TANK: ['dr', 6, 'BULWARK'], ASSASSIN: ['crit', 4, 'KILLER INSTINCT'], FIGHTER: ['dmg', 3, 'BATTLE CRY'], SHOOTER: ['gauge', 5, 'SPOTTER'], STRIKER: ['gauge', 5, 'SPOTTER'] }
function passives(s) {
  const p = { heal: 0, dr: 0, crit: 0, dmg: 0, gauge: 0 }
  s.team.forEach((f, i) => { if (i === s.active || f.ko) return; const q = PASSIVE[f.card.role]; if (q) p[q[0]] += q[1] })
  p.dr = Math.min(p.dr, 18); p.dmg = Math.min(p.dmg, 12); p.crit = Math.min(p.crit, 12); p.heal = Math.min(p.heal, 12); p.gauge = Math.min(p.gauge, 15)
  return p
}
function refill(s) {
  while (s.hand.length < HAND) {
    if (s.deck) { if (!s.pile || !s.pile.length) { s.pile = []; for (const [k, v] of Object.entries(s.deck)) for (let i = 0; i < v; i++) s.pile.push(k); s.pile.sort(() => Math.random() - .5) } s.hand.push(s.pile.pop()) }
    else s.hand.push(drawArt(act(s)))
  }
}
function hit(att, def, base, stat, pierce, A, D, kind) {
  const pa = A ? passives(A) : {}, pd = D ? passives(D) : {}, ea = PE(att), ed = PE(def)
  // defensive dodges / nullifies first
  if (def.firstNull > 0) { def.firstNull--; pasNote(def, 'NULLIFIED'); return { dmg: 0, crit: false, mu: 1, miss: 'NULLIFIED' } }
  if (kind === 'ult' && def.ultDodge > 0) { def.ultDodge--; pasNote(def, 'ERASED'); return { dmg: 0, crit: false, mu: 1, miss: 'ERASED' } }
  if (ed.dodge && Math.random() * 100 < ed.dodge) { pasNote(def, 'DODGE'); return { dmg: 0, crit: false, mu: 1, miss: 'DODGE' } }
  if (ea.onePunch && kind === 'strike' && def.card.r !== 'X' && Math.random() * 100 < ea.onePunch) { const d0 = def.hp; def.hp = 0; def.ko = true; att.kos++; att.dealt += d0; pasNote(att, 'ONE PUNCH'); return { dmg: d0, crit: true, mu: 1 } }
  const crit = Math.random() < .08 + att.tec / 1200 + (pa.crit || 0) / 100 + (ea.crit || 0) / 100 || (ea.every3crit && (att.attacks + 1) % 3 === 0)
  const mu = matchup(att, def)
  let dmg = base * (stat / 80) * (100 / (60 + def.def * .5 * (1 - (def.shred || 0) / 100))) * (0.92 + Math.random() * .16) * (crit ? (ea.critMult || 1.5) : 1) * mu
  const tagB = att.card.tag ? kitNum(att.card, /\+(\d+)% damage/) : 0; if (tagB) dmg *= 1 + tagB / 100
  // attacker passive multipliers
  let m = 1 + (ea.dmg || 0) / 100 + (att.rage || 0) / 100 + (att.arise || 0) / 100
  if (ea.ramp) m += Math.min(ea.rampMax || 99, ea.ramp * att.turns) / 100
  if (ea.stack) m += Math.min(ea.stackMax || 99, ea.stack * att.hitsTaken) / 100
  if (ea.dmgLow && att.hp / att.max * 100 < (ea.lowAt || 50)) m += ea.dmgLow / 100
  if (ea.ablaze && att.hp / att.max < .3) m += ea.ablaze / 100
  if (ea.exec && def.hp / def.max < .4) m += ea.exec / 100
  if (ea.vsHigh && def.card.ovr > att.card.ovr) m += ea.vsHigh / 100
  if (ea.vsAnime && def.card.anime === ea.vsAnime) m += ea.vsAnimeB / 100
  if (ea.vsRole && def.card.role === ea.vsRole) m += ea.vsRoleB / 100
  if (ea.vsType && ea.vsType.includes(def.card.t)) m += ea.vsTypeB / 100
  if (ea.avenge && A && A.team.some(f => f.ko && f !== att)) m += ea.avenge / 100
  if (ea.lastStand && A && alive(A).length === 1) m += ea.lastStand / 100
  if (ea.prideStack && D) m += ea.prideStack * alive(D).length / 100
  if (kind === 'strike' && ea.strikeBoost) m += ea.strikeBoost / 100
  if (kind === 'special' && ea.spec) m += ea.spec / 100
  if (kind === 'ult' && ea.ultBoost && !(ea.ultBoost === 60 && att.ultFired)) m += ea.ultBoost / 100
  if (ea.opener && !att.opened) { m += ea.opener / 100; att.opened = 1 }
  if (A && A.teamDmg) m += A.teamDmg / 100
  if (ed.vuln) m += ed.vuln / 100
  dmg *= m
  if (pa.dmg) dmg *= 1 + pa.dmg / 100
  if (pd.dr) dmg *= 1 - pd.dr / 100
  if (ed.dr) dmg *= 1 - ed.dr / 100
  if (ed.adapt) dmg *= 1 - Math.min(ed.adaptMax || 30, ed.adapt * def.hitsTaken) / 100
  if (def.fort) dmg *= .7
  const pierceAll = pierce || ea.pierce || (kind === 'strike' && ea.pierceStrike) || (kind === 'special' && ea.pierceSpec)
  if (def.guard) { if (!pierceAll) dmg *= ed.guardStrong ? 1 - ed.guardStrong / 100 : .5; def.guard = 0 }
  dmg = Math.max(1, Math.round(dmg))
  if (def.shieldHp > 0) { const s2 = Math.min(def.shieldHp, dmg); def.shieldHp -= s2; dmg -= s2; if (s2) pasNote(def, 'SHIELD') }
  def.hp = Math.max(0, def.hp - dmg); att.dealt += dmg; def.hitsTaken++
  // on-hit passives
  if (ea.drain && !ea.noHeal) att.hp = Math.min(att.max, att.hp + Math.round(dmg * ea.drain / 100))
  if (ed.reflect && dmg > 0) { const rf = Math.round(dmg * ed.reflect / 100); att.hp = Math.max(1, att.hp - rf); pasNote(def, 'REFLECT ' + rf) }
  if (ed.thorns) att.hp = Math.max(1, att.hp - Math.round(att.max * ed.thorns / 100))
  if (ea.shred) def.shred = Math.min(30, (def.shred || 0) + ea.shred)
  if (ea.burn) { def.burn = Math.max(def.burn, ea.burn); def.burnT = 3 }
  if (ea.energyBurn && D) D.ki = Math.max(0, D.ki - ea.energyBurn)
  if (ea.freeze && Math.random() * 100 < ea.freeze) { def.frozen = 1; pasNote(att, 'FROZEN') }
  if (ea.gaugeDeny) def.gaugeDeny = ea.gaugeDeny
  if (ed.bigHitHeal && dmg > def.max * .2 && def.hp > 0) def.hp = Math.min(def.max, def.hp + Math.round(def.max * ed.bigHitHeal / 100))
  if (ea.recoil) att.hp = Math.max(1, att.hp - Math.round(att.max * ea.recoil / 100))
  // knockouts, with survive / revive passives
  if (def.hp === 0 && !def.ko) {
    if (def.endure > 0) { def.endure--; def.hp = 1; pasNote(def, 'ENDURED'); if (ed.endureRage) def.rage = (def.rage || 0) + ed.endureRage; if (ed.endureEnergy && D) D.ki = Math.min(KI_MAX, D.ki + ed.endureEnergy) }
    else if (D && D.angel && D.angel !== def) { D.angel.angelUsed = 1; D.angel = null; def.hp = 1; pasNote(def, 'SAVED') }
    else if (ed.ablaze && !def.ablazeUsed && def.hp / def.max < .3) { def.ablazeUsed = 1; def.hp = 1; pasNote(def, 'HEART ABLAZE') }
    else if (def.revive > 0) { def.hp = Math.round(def.max * def.revive / 100); def.revive = 0; pasNote(def, 'REVIVED') }
    else { def.ko = true; att.kos++; if (ea.arise) att.arise = (att.arise || 0) + ea.arise; if (ea.koHeal) att.hp = Math.min(att.max, att.hp + Math.round(att.max * ea.koHeal / 100)) }
  }
  att.attacks++
  return { dmg, crit, mu }
}
// returns a list of events for the UI to animate
const COMBOS = [
  { seq: ['strike', 'strike', 'blast'], name: 'RUSH COMBO', bonus: .45 },
  { seq: ['blast', 'strike', 'strike'], name: 'BURST CHAIN', bonus: .35 },
  { seq: ['guard', 'special'], name: 'COUNTER ART', bonus: .3 },
  { seq: ['strike', 'blast', 'special'], name: 'FULL ASSAULT', bonus: .6 },
]
function comboFor(seq) { for (const c of COMBOS) { const n = c.seq.length; if (seq.length >= n && c.seq.every((a, i) => seq[seq.length - n + i] === a)) return c } return null }
function playArt(B, who, idx) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], art = me.hand[idx], cost = ARTS[art].cost, a = act(me), d = act(foe)
  if (me.ki < cost || a.ko || d.ko) return null
  if (art === 'special' && me.confiscated) return null
  if (art === 'burst' && me.ki < 2) return null
  me.ki -= cost; me.hand.splice(idx, 1)
  const ev = { who, art, hits: [] }
  if (ARTS[art].tactic && art !== 'burst') {
    if (art === 'charge') { me.chargeNext = (me.chargeNext || 0) + 35; ev.tactic = 'NEXT ATTACK +' + me.chargeNext + '%' }
    else if (art === 'transfer') { me.ki = Math.min(KI_MAX, me.ki + 2); ev.tactic = '+2 ENERGY' }
    else if (art === 'heal') { const h = Math.round(a.max * .18); a.hp = Math.min(a.max, a.hp + h); ev.tactic = '+' + h.toLocaleString() + ' HP' }
    else if (art === 'cleanse') { a.burnT = 0; a.frozen = 0; a.guard = 1; ev.tactic = 'CLEANSED · GUARD UP' }
    return ev
  }
  me.seq.push(art)
  const combo = comboFor(me.seq), dmgArts = me.seq.filter(x => x !== 'guard').length
  let chain = 1 + Math.min(.32, Math.max(0, dmgArts - 1) * .08) + (combo ? combo.bonus : 0)
  if (art !== 'guard' && me.chargeNext) { chain *= 1 + me.chargeNext / 100; ev.charged = me.chargeNext; me.chargeNext = 0 }
  if (combo) { ev.combo = combo.name; me.seq = [] }
  ev.chain = art === 'guard' ? 0 : dmgArts
  const pierce = /Ignores Guard/.test(kitTxt(a.card))
  if (art === 'guard') { a.guard = 1; ev.guard = true }
  else if (art === 'strike') {
    const ea = PE(a), n = ea.tripleStrike ? 3 : 1, per = ea.tripleStrike ? .4 : 1
    for (let i = 0; i < n; i++) ev.hits.push({ t: d, ...hit(a, d, 260 * chain * per, a.pwr, false, me, foe, 'strike') })
    if (ea.doubleStrike && Math.random() * 100 < ea.doubleStrike && !d.ko) { ev.hits.push({ t: d, ...hit(a, d, 260 * chain * .6, a.pwr, false, me, foe, 'strike') }); pasNote(a, 'DOUBLE STRIKE') }
    if (ea.benchChip) { const b = alive(foe).filter(f => f !== d)[0]; if (b) ev.hits.push({ t: b, ...hit(a, b, 260 * ea.benchChip / 100, a.pwr, false, me, foe, 'strike') }) }
    if (ea.chainBoost) a.rage = Math.min(40, (a.rage || 0) + ea.chainBoost)
  }
  else if (art === 'burst') { const k = me.ki + cost, spent = me.ki; me.ki = 0; const drag = me.team.filter(f => !f.ko && isDragon(f.card)).length >= 3; ev.move = 'BURST · ' + spent + ' ENERGY' + (drag ? ' · DRAGON FURY' : ''); ev.hits.push({ t: d, ...hit(a, d, 210 * spent * chain * (drag ? 1.5 : 1), Math.max(a.pwr, a.ki), false, me, foe, 'special') }) }
  else if (art === 'blast') ev.hits.push({ t: d, ...hit(a, d, 420 * chain, a.ki, false, me, foe, 'blast') })
  else if (art === 'special') {
    const base = pctOf(a.card) * 3.2 * chain
    ev.move = a.card.mv
    if (isAoe(a.card)) for (const t of alive(foe)) ev.hits.push({ t, ...hit(a, t, (t === d ? base * .75 : base * .3) * (t !== d && PE(a).aoeBoost ? 1 + PE(a).aoeBoost / 100 : 1), Math.max(a.pwr, a.ki), pierce, me, foe, 'special') })
    else if (PE(a).twinSpec) { ev.hits.push({ t: d, ...hit(a, d, base * .6, Math.max(a.pwr, a.ki), pierce, me, foe, 'special') }); if (!d.ko) ev.hits.push({ t: d, ...hit(a, d, base * .6, Math.max(a.pwr, a.ki), pierce, me, foe, 'special') }) }
    else ev.hits.push({ t: d, ...hit(a, d, base, Math.max(a.pwr, a.ki), pierce, me, foe, 'special') })
    if (PE(a).splash) for (const t of alive(foe)) if (t !== d) ev.hits.push({ t, ...hit(a, t, base * PE(a).splash / 100, Math.max(a.pwr, a.ki), pierce, me, foe, 'special') })
    if (PE(a).shambles && !a.shamUsed && a.hp / a.max < d.hp / d.max) { a.shamUsed = 1; const pa = a.hp / a.max, pd = d.hp / d.max; a.hp = Math.round(a.max * pd); d.hp = Math.max(1, Math.round(d.max * pa)); pasNote(a, 'SHAMBLES') }
  }
  const dealt = ev.hits.reduce((n, x) => n + x.dmg, 0)
  me.gauge = Math.min(GAUGE_MAX, me.gauge + (6 + dealt / 90) * (1 + (PE(a).gaugeBoost || 0) / 100)); foe.gauge = Math.min(GAUGE_MAX, foe.gauge + dealt / 140 * (1 - (d.gaugeDeny || 0) / 100))
  if (art === 'special') ev.kit = kitEffects(me, a)
  return ev
}
const ULT = { FIGHTER: ['BARRAGE', 'Three crushing hits'], ASSASSIN: ['EXECUTION', 'Pierces Guard · +60% vs targets under 40% HP'], SUPPORT: ['RALLY', 'Big hit · heals the whole team 20%'], TANK: ['FORTRESS', 'Big hit · takes 30% less damage until your next turn'], SHOOTER: ['OVERDRIVE', 'Hits every enemy hard'], STRIKER: ['OVERDRIVE', 'Hits every enemy hard'] }
const ultOf = c => c.tag ? ['DUO FINISH', 'Both partners strike · double hit'] : (ULT[c.role] || ULT.FIGHTER)
function ultimate(B, who) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], a = act(me), d = act(foe)
  if (me.gauge < GAUGE_MAX || a.ko || d.ko) return null
  me.gauge = 0; me.seq = []
  const [uname] = ultOf(a.card), ev = { who, art: 'ultimate', move: a.card.mv, ult: uname, hits: [] }
  const base = pctOf(a.card) * 6, stat = Math.max(a.pwr, a.ki), pierce = /Ignores Guard/.test(kitTxt(a.card))
  const H = (t, b, p) => { if (!t.ko) ev.hits.push({ t, ...hit(a, t, b, stat, p || PE(a).pierce, me, foe, 'ult') }) }
  const ea = PE(a)
  if (ea.sacrifice) { for (const t of [d]) H(t, base * ea.sacrifice, true); a.hp = 0; a.ko = true; pasNote(a, 'GATE OF DEATH'); ev.kit = []; a.ultFired = 1; return ev }
  if (ea.ultAoe) { for (const t of alive(foe)) H(t, t === d ? base : base * .55); if (ea.ultHeal) a.hp = Math.min(a.max, a.hp + Math.round(a.max * ea.ultHeal / 100)); ev.kit = kitEffects(me, a); a.ultFired = 1; return ev }
  if (ea.doubleUlt || ea.twinUlt) { const k = ea.twinUlt ? .6 : 1; H(d, base * k); if (!d.ko) H(d, base * k); else { const n = alive(foe)[0]; if (n) H(n, base * k * .7) } ev.kit = kitEffects(me, a); a.ultFired = 1; return ev }
  if (ea.ultHeal) a.hp = Math.min(a.max, a.hp + Math.round(a.max * ea.ultHeal / 100))
  if (a.card.tag) { H(d, base * .62, pierce); H(d, base * .62, true) }
  else if (uname === 'BARRAGE') { H(d, base * .45, pierce); H(d, base * .45, pierce); H(d, base * .45, true) }
  else if (uname === 'EXECUTION') H(d, base * (d.hp / d.max < .4 ? 1.6 : 1.05), true)
  else if (uname === 'RALLY') { H(d, base * .9, pierce); for (const f of me.team) if (!f.ko) f.hp = Math.min(f.max, f.hp + Math.round(f.max * .2)); ev.rally = true }
  else if (uname === 'FORTRESS') { H(d, base * .95, pierce); a.fort = 1; a.guard = 1; ev.fort = true }
  else for (const t of alive(foe)) H(t, t === d ? base * .85 : base * .45, pierce)
  ev.kit = kitEffects(me, a); a.ultFired = 1
  return ev
}
function nextAlive(s) { const i = s.team.findIndex(f => !f.ko); if (i >= 0) s.active = i; return i >= 0 }

// ---------------- AI ----------------
function planTurn(B, level, who = 'ai') {
  const me = B[who], foe = B[who === 'ai' ? 'you' : 'ai'], evs = []
  const smart = level >= 3, clever = level >= 2
  // counter-switch: bring in someone with type advantage, or rescue a dying fighter
  if (smart && !me.switched) {
    const cur = act(me), opp = act(foe), bench = me.team.map((f, i) => [f, i]).filter(([f, i]) => !f.ko && i !== me.active)
    const adv = bench.filter(([f]) => matchup(f, opp) > 1 && f.hp / f.max > .4).sort((x, y) => y[0].hp - x[0].hp)[0]
    const hurt = cur.hp / cur.max < .22 ? bench.sort((x, y) => y[0].hp - x[0].hp)[0] : null
    const pick = (matchup(cur, opp) < 1 && adv) ? adv : hurt
    if (pick) { me.active = pick[1]; me.switched = true; evs.push({ who, swap: true }) }
  }
  let guarded = false
  for (let n = 0; n < 8; n++) {
    if (act(foe).ko || act(me).ko) break
    if (me.gauge >= GAUGE_MAX && (clever || Math.random() < .7)) { const e = ultimate(B, who); if (e) { evs.push(e); continue } }
    const playable = me.hand.map((a, i) => [a, i]).filter(([a]) => ARTS[a].cost <= me.ki)
    if (!playable.length) break
    const hasSpecial = me.hand.includes('special'), opp = act(foe), mine = act(me)
    let pick = null
    { const hi = me.hand.indexOf('heal'), ti = me.hand.indexOf('transfer'), ci = me.hand.indexOf('charge'), bi = me.hand.indexOf('burst'), cl = me.hand.indexOf('cleanse')
      if (hi >= 0 && me.ki >= 2 && mine.hp / mine.max < .5) pick = ['heal', hi]
      else if (ti >= 0 && me.ki <= KI_MAX - 2) pick = ['transfer', ti]
      else if (cl >= 0 && me.ki >= 1 && (mine.burnT > 0)) pick = ['cleanse', cl]
      else if (ci >= 0 && me.ki >= 3 && (hasSpecial || bi >= 0)) pick = ['charge', ci]
      else if (bi >= 0 && me.ki >= 5 && !hasSpecial) pick = ['burst', bi] }
    // 1) finish a low target with the cheapest attack
    if (clever && opp.hp / opp.max < .12) pick = playable.find(([a]) => a === 'strike') || playable.find(([a]) => a !== 'guard')
    // 2) special if affordable
    if (!pick) pick = playable.find(([a]) => a === 'special')
    // 3) guard when an enemy ultimate is coming or when low
    if (!pick && clever && !guarded && (foe.gauge >= 85 || mine.hp / mine.max < .45)) { pick = playable.find(([a]) => a === 'guard'); if (pick) guarded = true }
    // 4) go for a named combo
    if (!pick && level >= 4) { const want = me.seq.length && me.seq[me.seq.length - 1] === 'strike' ? (me.seq.length > 1 && me.seq[me.seq.length - 2] === 'strike' ? 'blast' : 'strike') : 'strike'; pick = playable.find(([a]) => a === want) }
    // 5) save energy for a special next turn
    if (!pick && clever && hasSpecial && me.ki - 1 < 4 - KI_PER_TURN + 1) break
    if (!pick) pick = playable.filter(([a]) => a !== 'guard').sort((x, y) => ARTS[y[0]].cost - ARTS[x[0]].cost)[0]
    if (!pick) break
    if (!smart && Math.random() < .2 && playable.length > 1) pick = playable[playable.length - 1]
    const e = playArt(B, who, pick[1]); if (!e) break; evs.push(e)
  }
  return evs
}
const aiTurn = (B, level) => planTurn(B, level, 'ai')

// ---------------- arenas ----------------
export const ARENAS = {
  dojo: { name: 'SUNSET DOJO', sub: 'Training Grounds' },
  city: { name: 'NEON DISTRICT', sub: 'Street Arena' },
  forest: { name: 'HIDDEN LEAF SHRINE', sub: 'Forest Arena' },
  domain: { name: 'CURSED DOMAIN', sub: 'Shibuya Underground' },
  deck: { name: 'GRAND LINE DECK', sub: 'Open Sea' },
  cosmos: { name: 'NULL VOID COLOSSEUM', sub: 'Tournament of Power' },
}
const ARENA_KEYS = Object.keys(ARENAS)
let ARENA_IMGS = null
const arenaImgs = () => ARENA_IMGS || (ARENA_IMGS = fetch('arenas-list.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).catch(() => []))

// ---------------- story ----------------
const STAGES = [
  { n: 1, name: 'Training Grounds', rating: 70, level: 1, coins: 1500, arena: 'dojo' },
  { n: 2, name: 'Street Brawl', rating: 74, level: 1, coins: 2000, arena: 'city' },
  { n: 3, name: 'Rival Academy', rating: 78, level: 2, coins: 2500, arena: 'forest' },
  { n: 4, name: 'Tournament Prelims', rating: 81, level: 2, coins: 3000, arena: 'city' },
  { n: 5, name: 'Villain Hideout', rating: 84, level: 3, coins: 4000, arena: 'domain', pack: 'standard' },
  { n: 6, name: 'Shinobi War', rating: 86, level: 3, coins: 5000, arena: 'forest' },
  { n: 7, name: 'Cursed Domain', rating: 88, level: 3, coins: 6000, arena: 'domain' },
  { n: 8, name: 'Grand Line Showdown', rating: 90, level: 4, coins: 7500, arena: 'deck', pack: 'premium' },
  { n: 9, name: 'Tournament of Power', rating: 93, level: 4, coins: 10000, arena: 'cosmos' },
  { n: 10, name: 'Gods of Destruction', rating: 96, level: 5, coins: 15000, arena: 'cosmos', pack: 'premium' },
]
function enemyTeam(stage) {
  if (stage.team && stage.team.length) { const t = stage.team.map(k => X.BYKEY[k]).filter(Boolean); if (t.length) return t.slice(0, 6) }
  const pool = X.POOL.slice().sort((a, b) => Math.abs(a.ovr - stage.rating) - Math.abs(b.ovr - stage.rating))
  const near = pool.slice(0, Math.max(14, Math.round(pool.length * .25)))
  const out = []; while (out.length < 6 && near.length) out.push(near.splice(Math.floor(Math.random() * near.length), 1)[0])
  return out.sort((a, b) => b.ovr - a.ovr)
}

let MODE = 'story'
const mastL = k => { const x = (X.P.mast || {})[k] || 0, T = X.ST().mastT || [0, 60, 180, 400, 750]; return T.filter(t => x >= t).length - 1 }
function teamFrom(main, rating) {
  const used = new Set(main.map(c => c.key)), out = main.slice(0, 6)
  const rest = X.POOL.filter(c => !used.has(c.key)).sort((a, b) => Math.abs(a.ovr - rating) - Math.abs(b.ovr - rating))
  while (out.length < 6 && rest.length) out.push(rest.splice(Math.floor(Math.random() * Math.min(10, rest.length)), 1)[0])
  return out.map(c => c.key)
}
function modeTabs(el) {
  const { h } = X, t = h('div', 'mtabs')
  for (const [k, n] of [['story', 'STORY'], ['ranked', 'RANKED'], ['boss', 'DAILY BOSS'], ['tower', 'TOWER'], ['arcs', 'STORY ARCS'], ['event', 'EVENT'], ['pass', 'SEASON PASS']]) {
    const b = h('button', 'mtab' + (MODE === k ? ' on' : ''), n); b.onclick = () => { if (k === 'pass') return X.go('pass'); MODE = k; X.go('battle') }; t.append(b)
  }
  el.append(t)
}
function go2(stage) { seenTutorial() ? startBattle(stage) : tutorial(() => startBattle(stage)) }
const RK_COL = ['#d0884a', '#c8d4e8', '#ffcc33', '#5fe0d0', '#7fc8ff', '#c38cff', '#ff5fa2']
const RIVALS = ['Kenji', 'Aiko', 'Ren', 'Yuki', 'Haru', 'Sora', 'Mika', 'Daichi', 'Rin', 'Kaito', 'Nao', 'Hikari', 'Takeshi', 'Emi', 'Riku', 'Akira']
function bossPage(el, ok) {
  const { h } = X, BD = X.ST().boss; if (!BD) return
  const c = X.BYKEY[BD.key], me = BD.me, left = BD.tries - me.tries
  const hero = h('section', 'bosshero')
  hero.style.setProperty('--art', `url("${c.url}")`); hero.style.setProperty('--fx', Math.round((c.fx ?? .5) * 100) + '%'); hero.style.setProperty('--fy', Math.round((c.fy ?? .22) * 100) + '%')
  hero.innerHTML = `<i class="bh-art"></i><div class="bh-info"><small>デイリーボス · NEW BOSS IN <b class="timer" data-until="${BD.ends}"></b></small><h2>DAILY BOSS</h2>
    <div class="bh-name"><b>${c.name}</b><span>${c.ver} · ${BD.hpMult}× HP</span></div>
    <div class="bh-ab"><b>BOSS SKILL · ${BD.ab.name}</b><span>${BD.ab.d}</span></div>
    <p>Everyone fights the same boss today. You can't win; deal as much damage as you can in 12 turns before it retreats. Your best attempt counts.</p>
    <div class="rk-stats"><span><b>${me.best.toLocaleString()}</b>BEST DAMAGE</span><span><b>${left}/${BD.tries}</b>ATTEMPTS LEFT</span><span><b>${me.total.toLocaleString()}</b>TOTAL TODAY</span></div></div>`
  const go = h('button', 'btn gold big rk-go', left > 0 ? 'FIGHT THE BOSS' : 'COME BACK TOMORROW'); go.disabled = !ok || left < 1
  go.onclick = () => go2({ mode: 'boss', id: 0, boss: BD.hpMult, bossAb: BD.ab, label: 'Daily Boss · ' + c.name, name: c.name, level: 5, team: [BD.key], arena: ARENA_KEYS[BD.day % ARENA_KEYS.length] })
  hero.querySelector('.bh-info').append(go); el.append(hero)
  el.append(h('div', 'sec', '<h3>DAMAGE REWARDS</h3><span class="muted" style="font-weight:700;font-size:12px">unlocked once a day by your best attempt</span>'))
  const g = h('div', 'rk-tiers')
  BD.rw.forEach((r, i) => { const done = me.got.includes(i); g.append(h('div', 'rk-t' + (done ? ' got on' : ''), `<b>${r.at.toLocaleString()}</b><small>DAMAGE</small><span>${done ? '✓ ' : ''}${r.label}</span>`)) })
  el.append(g)
  el.append(h('div', 'sec', '<h3>TODAY\'S TOP DAMAGE</h3>'))
  const lb = h('div', 'boss-lb', '<p class="muted">Loading…</p>'); el.append(lb)
  ;(async () => {
    try {
      const rows = (await X.lb('bossScore')).filter(p => Math.floor((p.bossScore || 0) / 1e9) === BD.day).slice(0, 20)
      lb.innerHTML = rows.length ? rows.map((p, i) => `<div class="bl-row${i < 3 ? ' top' : ''}"><b>${i + 1}</b><span>${p.name || 'Player'}</span><em>${((p.bossScore || 0) % 1e9).toLocaleString()}</em></div>`).join('') : '<p class="muted">No one has fought today\'s boss yet. Be first!</p>'
    } catch { lb.innerHTML = '<p class="muted">Sign in to see the leaderboard.</p>' }
  })()
}
function rankedPage(el, ok) {
  const { h } = X, R = X.ST().ranked, i = R.tier, cur = R.ranks[i], nxt = R.ranks[i + 1], col = RK_COL[i]
  const pct = nxt ? Math.round((R.pts - cur.at) / (nxt.at - cur.at) * 100) : 100
  const hero = h('section', 'rkhero')
  hero.style.setProperty('--rk', col)
  hero.innerHTML = `<div class="rk-badge"><i></i><b>${cur.name.toUpperCase()}</b><small>${R.pts.toLocaleString()} PTS</small></div>
    <div class="rk-info"><small>ランクマッチ · SEASON ENDS IN <b class="timer" data-until="${R.ends}"></b></small><h2>RANKED</h2>
      <div class="rk-bar"><i style="width:${pct}%"></i></div><p>${nxt ? `${(nxt.at - R.pts).toLocaleString()} points to <b>${nxt.name}</b>` : 'Top rank reached. Hold it until the season ends.'}</p>
      <div class="rk-stats"><span><b>${R.w}</b>WINS</span><span><b>${R.l}</b>LOSSES</span><span><b>${R.streak}</b>STREAK</span><span><b>${R.ranks[R.best].name}</b>BEST</span></div></div>`
  const go = h('button', 'btn gold big rk-go', 'FIND MATCH'); go.disabled = !ok
  go.onclick = () => {
    const rating = Math.min(95, Math.round(74 + i * 3.5) + Math.min(2, Math.floor(R.streak / 3))), level = Math.min(5, 1 + Math.ceil(i * .7)), name = RIVALS[Math.floor(Math.random() * RIVALS.length)]
    go2({ mode: 'ranked', id: 0, label: 'Ranked · ' + cur.name + ' · vs ' + name, name, rating, level, boost: i >= 6 ? 1.05 : 1, arena: ARENA_KEYS[Math.floor(Math.random() * ARENA_KEYS.length)] })
  }
  hero.querySelector('.rk-info').append(go)
  el.append(hero)
  el.append(h('p', 'muted', '<small style="font-weight:700">Win: +30 points, plus up to +20 for a win streak, and 400 coins. Loss: −20 points, but you never drop out of a tier once you reach it. Opponents get tougher the higher you climb.</small>'))
  el.append(h('div', 'sec', '<h3>SEASON REWARDS</h3><span class="muted" style="font-weight:700;font-size:12px">based on the best rank you reach</span>'))
  const g = h('div', 'rk-tiers')
  R.ranks.forEach((r, j) => {
    const w = r.rw, ps = X.ST().packs
    const t = h('div', 'rk-t' + (j === i ? ' on' : '') + (j <= R.best ? ' got' : ''), `<i style="--rk:${RK_COL[j]}"></i><b>${r.name}</b><small>${r.at.toLocaleString()}+ pts</small><span>${w.coins.toLocaleString()} coins${w.pack ? '<br>' + ps[w.pack].name : ''}${w.shards ? '<br>◆' + w.shards.toLocaleString() : ''}</span>`)
    g.append(t)
  })
  el.append(g)
}
function towerPage(el, ok) {
  const { h, P } = X, best = (P.tower && P.tower.best) || 0, T = X.ST().tower
  el.append(h('section', 'bhero', `<div><span class="sh-tag">TOWER</span><h2>THE TOWER</h2><p>50 floors. Every floor is harder than the last, and past floor 25 enemies get stronger stats. Your progress is saved, so climb at your own pace. Big rewards every 10 floors.</p></div><div class="bstat"><b>${best}</b><span>/ 50 FLOORS</span></div>`))
  const list = h('div', 'stages tower')
  for (let n = Math.min(50, best + 1); n >= 1; n--) {
    const f = T[n - 1], done = n <= best, r = h('button', 'stage' + (done ? ' done' : '') + (f.pack ? ' milestone' : ''))
    r.innerHTML = `<span class="sn">${String(n).padStart(2, '0')}</span><div class="si"><b>Floor ${n}</b><small>Enemy rating ~${f.rating} · AI level ${f.level}${f.boost > 1 ? ' · +' + Math.round((f.boost - 1) * 100) + '% enemy HP' : ''}</small></div><div class="sr">${done ? '<em>CLEARED</em>' : ''}<span><i class="coin-i"></i>${(done ? 200 : f.coins).toLocaleString()}</span>${f.pack && !done ? `<span class="pk">+ ${X.ST().packs[f.pack].name.toUpperCase()}</span>` : ''}</div>`
    r.disabled = !ok; r.onclick = () => go2({ mode: 'tower', id: n, label: 'Tower · Floor ' + n, name: 'Floor ' + n, rating: f.rating, level: f.level, boost: f.boost, arena: ARENA_KEYS[n % ARENA_KEYS.length] })
    list.append(r)
  }
  { const nx = [10, 20, 30, 40, 50].find(m => m > best); if (nx) el.append(h('p', 'muted', `<b>Next milestone: Floor ${nx}</b> · ${X.ST().packs[T[nx - 1].pack].name}`)) }
  el.append(list)
}
function arcsPage(el, ok) {
  const { h, P } = X, ST = X.ST(), A = P.arcs || {}
  el.append(h('section', 'bhero', `<div><span class="sh-tag">STORY ARCS</span><h2>STORY ARCS</h2><p>Relive the big fights. Each arc has three chapters against that anime's fighters, ending with its villains as a powered-up final boss. Clearing an arc gives a Premium Drop and ◆1,000 shards.</p></div><div class="bstat"><b>${ST.arcs.filter(a => (A[a.id] || 0) >= 3).length}</b><span>/ ${ST.arcs.length} ARCS</span></div>`))
  const g = h('div', 'arcs')
  for (const arc of ST.arcs) {
    const pool = X.POOL.filter(c => c.anime === arc.anime); if (!pool.length) continue
    const done = A[arc.id] || 0, boss = pool.filter(c => arc.bad.includes(c.name)).sort((a, b) => b.ovr - a.ovr)[0] || pool[0]
    const card = h('div', 'arc' + (done >= 3 ? ' done' : ''))
    card.style.setProperty('--art', `url("${boss.url}")`)
    card.innerHTML = `<div class="arc-art"></div><div class="arc-info"><small>${X.ANAME(arc.anime)}</small><b>${arc.name}</b><span>${done >= 3 ? 'ARC COMPLETE' : done + ' / 3 chapters'}</span><div class="arc-ch"></div></div>`
    const chs = card.querySelector('.arc-ch')
    ST.arcCh.forEach((C, i) => {
      const b = h('button', 'btn ' + (i === 2 ? 'gold' : 'dark') + ' sm', `${i < done ? '✓ ' : ''}${C.name}`); b.disabled = !ok || i > done
      b.onclick = () => {
        const bad = pool.filter(c => arc.bad.includes(c.name)).sort((a, b) => b.ovr - a.ovr), good = pool.filter(c => !arc.bad.includes(c.name)).sort((a, b) => a.ovr - b.ovr)
        const main = i === 2 ? bad.concat(good.reverse()) : i === 1 ? good.slice(-3).concat(bad.slice(-1), good) : good.concat(bad.slice(-1))
        go2({ mode: 'arc', id: arc.id + ':' + i, label: arc.name + ' · ' + C.name, name: arc.name, level: C.level, boost: C.boost, team: teamFrom([...new Set(main)], 78 + i * 7) })
      }
      chs.append(b)
    })
    g.append(card)
  }
  el.append(g)
}
function eventPage(el, ok) {
  const { h } = X, E = X.ST().event, pool = X.POOL.filter(c => c.anime === E.anime).sort((a, b) => b.ovr - a.ovr)
  const hero = h('section', 'bhero evhero', `<div><span class="sh-tag">LIMITED EVENT · ENDS IN <b class="timer" data-until="${E.ends}"></b></span><h2>${X.ANAME(E.anime).toUpperCase()} WEEK</h2><p>This week's fights are all ${X.ANAME(E.anime)}. Clear each difficulty once a day for coins; Nightmare also gives a ${X.ST().packs[E.pack].name}. A new anime takes over every Monday.</p></div>`)
  if (pool[0]) hero.style.setProperty('--art', `url("${pool[0].url}")`)
  el.append(hero)
  const list = h('div', 'stages')
  E.tiers.forEach((T, i) => {
    const done = E.done[i], r = h('button', 'stage' + (done ? ' done' : ''))
    r.innerHTML = `<span class="sn">${['I', 'II', 'III'][i]}</span><div class="si"><b>${T.name}</b><small>AI level ${T.level}${T.boost > 1 ? ' · +' + Math.round((T.boost - 1) * 100) + '% enemy HP' : ''}</small></div><div class="sr">${done ? '<em>DONE TODAY</em>' : ''}<span><i class="coin-i"></i>${(done ? 200 : T.coins).toLocaleString()}</span>${T.pack && !done ? `<span class="pk">+ ${X.ST().packs[E.pack].name.toUpperCase()}</span>` : ''}</div>`
    r.disabled = !ok; r.onclick = () => go2({ mode: 'event', id: i, label: X.ANAME(E.anime) + ' Week · ' + T.name, name: T.name, level: T.level, boost: T.boost, team: teamFrom(pool.slice(), 82 + i * 6) })
    list.append(r)
  })
  el.append(list)
}
export function battlePage(el) {
  const { h, P } = X
  const prog = (P.battle && P.battle.cleared) || 0
  const team = P.team.filter(Boolean)
  modeTabs(el)
  if (MODE !== 'story') {
    if (team.length < 6) { const w = h('div', 'panel pad', `<b>Your team needs 6 fighters.</b>`); const b = h('button', 'btn gold', 'GO TO MY TEAM'); b.onclick = () => X.go('team'); w.append(b); el.append(w) }
    return (MODE === 'boss' ? bossPage : MODE === 'ranked' ? rankedPage : MODE === 'tower' ? towerPage : MODE === 'arcs' ? arcsPage : eventPage)(el, team.length >= 6)
  }
  const hero = h('section', 'bhero', `<div><span class="sh-tag">STORY MODE</span><h2>BATTLE</h2><p>Turn-based fights with Arts cards. Build Energy, play Strikes, Blasts and Specials, fill your gauge for an Ultimate, and knock out all 6 enemy fighters.</p></div><div class="bstat"><b>${prog}</b><span>/ ${STAGES.length} CLEARED</span></div>`)
  el.append(hero)
  { const t = h('button', 'btn dark', '📖 HOW TO PLAY'); t.style.marginTop = '12px'; t.onclick = () => tutorial(); el.append(t) }
  if (team.length < 6) {
    const w = h('div', 'panel pad', `<b>Your team needs 6 fighters.</b><p class="muted" style="margin:6px 0 12px">You have ${team.length}/6. Set your team first; Auto Build picks the best cards you own.</p>`)
    const b = h('button', 'btn gold', 'GO TO MY TEAM'); b.onclick = () => X.go('team'); w.append(b); el.append(w)
  }
  el.append(h('div', 'sec', '<h3>STAGES</h3><span class="muted" style="font-weight:800;font-size:12px">first clear gives bonus rewards</span>'))
  const list = h('div', 'stages')
  for (const s of STAGES) {
    const locked = s.n > prog + 1, done = s.n <= prog
    const r = h('button', 'stage' + (locked ? ' locked' : '') + (done ? ' done' : ''))
    r.innerHTML = `<span class="sn">${String(s.n).padStart(2, '0')}</span><div class="si"><b>${s.name}</b><small>${ARENAS[s.arena] ? ARENAS[s.arena].name + ' · ' : ''}Enemy rating ~${s.rating} · AI level ${s.level}</small></div><div class="sr">${done ? '<em>CLEARED</em>' : ''}<span><i class="coin-i"></i>${(done ? Math.round(s.coins / 3) : s.coins).toLocaleString()}</span>${s.pack && !done ? `<span class="pk">+ ${s.pack === 'premium' ? 'PREMIUM' : ''} PACK</span>` : ''}</div>`
    r.disabled = locked || team.length < 6
    r.onclick = () => seenTutorial() ? startBattle(s) : tutorial(() => startBattle(s))
    list.append(r)
  }
  el.append(list)
}

// ---------------- arena UI ----------------
export function startBattle(stage) {
  const { h, cardImg, eff, BYKEY, P } = X
  const yours = P.team.filter(Boolean).map(k => eff(BYKEY[k])).filter(Boolean)
  const B = { you: newSide(yours), ai: newSide(enemyTeam(stage)), turn: 1, over: false, busy: false }
  PASLOG = []
  { const D = (X.ST().decks || [])[X.ST().deckOn || 0]; if (D && D.c) { B.you.deck = D.c; B.you.hand = []; B.you.pile = null } }
  if (stage.boss) for (const f of B.ai.team) { f.hp = f.max = Math.round(f.max * stage.boss); f.pwr = Math.round(f.pwr * .88); f.ki = Math.round(f.ki * .88); f.def = Math.round(f.def * 1.15) }
  if (stage.boost && stage.boost !== 1) for (const f of B.ai.team) { f.hp = f.max = Math.round(f.max * stage.boost); for (const k of ['pwr', 'ki', 'def']) f[k] = Math.round(f[k] * (1 + (stage.boost - 1) * .6)) }
  for (const [me, foe] of [[B.you, B.ai], [B.ai, B.you]]) {
    for (const f of me.team) {
      const e = PE(f)
      if (e.energy) me.ki = Math.min(KI_MAX, me.ki + e.energy)
      if (e.ultStart) me.gauge = Math.max(me.gauge, e.ultStart)
      if (e.teamDmg) me.teamDmg = Math.max(me.teamDmg || 0, e.teamDmg)
      if (e.guardianAngel) me.angel = f
      if (e.slow) foe.ki = Math.max(0, foe.ki - e.slow)
      if (e.slowSpd) for (const g of foe.team) g.spd -= e.slowSpd
      if (e.confiscate) foe.confiscated = 1
      if (e.copyStat) { const best = Math.max(...foe.team.map(g => Math.max(g.pwr, g.ki, g.def))); f.pwr = Math.max(f.pwr, best) }
    }
  }
  for (const sd of [B.you, B.ai]) { const cb = combosFor(sd.team.map(f => f.card)); if (cb.length) { sd.teamDmg = (sd.teamDmg || 0) + 6 * cb.length; sd.combos = cb } }
  for (const sd of [B.you, B.ai]) { const sy = synergy(sd.team.map(f => f.card)); if (sy.bonus) { sd.teamDmg = (sd.teamDmg || 0) + sy.bonus; sd.syn = sy } }
  const sealNow = () => { for (const [me, foe] of [[B.you, B.ai], [B.ai, B.you]]) { const a = act(me), o = act(foe); if (a && o && PE(a).nullPassive && !a.ko) o.sealed = 1 } }
  sealNow()
  refill(B.you); refill(B.ai)
  const fA = PE(act(B.you)).first, fB = PE(act(B.ai)).first
  const youFirst = fA && !fB ? true : fB && !fA ? false : act(B.you).spd >= act(B.ai).spd
  if (youFirst && PE(act(B.you)).stopFirst) B.ai.skip = 1
  if (!youFirst && PE(act(B.ai)).stopFirst) B.you.skip = 1

  const AR = stage.arena && ARENAS[stage.arena] ? stage.arena : ARENA_KEYS[Math.floor(Math.random() * ARENA_KEYS.length)]
  const ov = h('div', 'bc th-' + AR); ov.id = 'arena'
  ov.innerHTML = `<div class="bcs"><div class="bcs-wall"></div><div class="bcs-rig r1">${'<i></i>'.repeat(14)}</div><div class="bcs-rig r2">${'<i></i>'.repeat(10)}</div><i class="bcs-spot s1"></i><i class="bcs-spot s2"></i><i class="bcs-spot s3"></i><div class="bcs-crowd"></div><div class="bcs-board"><span>ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · </span></div><div class="bcs-floor"><i class="ln"></i><i class="cc"></i><i class="ccd"></i></div><div class="bcs-haze"></div></div><div class="env"><i class="e-sky"></i><i class="e-far"></i><i class="e-near"></i><i class="e-amb"></i><i class="e-vig"></i></div><div class="stage3"><div class="st-sky"></div><div class="st-pillars"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="st-floor"><div class="st-plat"><i class="r1"></i><i class="r2"></i><i class="mid"></i><i class="pad ai"></i><i class="pad you"></i></div></div></div>
    <header class="ar-top"><button class="ar-quit">✕ QUIT</button><button class="ar-mute"></button><button class="ar-speed"></button><button class="ar-auto">AUTO</button><span class="ar-stage">${stage.label ? stage.label.toUpperCase() : stage.pvp ? 'VS ' + stage.name.toUpperCase() : 'STAGE ' + stage.n + ' · ' + stage.name.toUpperCase()}</span><span class="ar-turn"></span></header>
    <div class="bct"><div class="bct-s you"></div><div class="bct-vs"><b>VS</b><small class="bct-t"></small></div><div class="bct-s ai"></div></div><div class="ar-plate ai"><span class="pe"></span><span class="pp"></span><span class="pn">${stage.pvp ? stage.name.toUpperCase() : 'ENEMY · ' + stage.name.toUpperCase()}</span><span class="pk"></span></div><div class="mat"><div class="mat-in"><i class="mat-surf"></i><i class="mat-emb"></i><div class="mat-line"></div><span class="mat-tag t-ai">ENEMY ACTIVE</span><span class="mat-tag t-you">YOUR ACTIVE</span><div class="ar-side ai"><div class="ar-bench"></div><div class="ar-active"></div><div class="ar-hud"></div></div>
    <div class="ar-mid"><div class="ar-log"></div></div>
    <div class="ar-side you"><div class="ar-hud"></div><div class="ar-active"></div><div class="ar-bench"></div></div></div></div><div class="ar-plate you"><span class="pe"></span><span class="pp"></span><span class="pn">YOU</span><span class="pk"></span></div>
    <footer class="ar-ctrl"><div class="ar-ki"></div><div class="ar-hand"></div><div class="ar-btns"><button class="ar-ult"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44"/></svg><b>ULT</b><small></small></button><button class="ar-end"><b>END</b><small>TURN</small></button></div></footer><div class="fxl"></div>`
  document.body.append(ov); document.body.classList.add('in-battle'); music('battle')
  const $a = s => ov.querySelector(s)
  let ST3 = null
  const FXC = createFX(ov)
  // 3D engine removed for performance; the stage is a static CSS scene
  const log = t => { const l = $a('.ar-log'); l.textContent = t; l.classList.remove('pop'); void l.offsetWidth; l.classList.add('pop') }
  let SPEED = 1; try { SPEED = +localStorage.getItem('aut-bspeed') || 1 } catch { }
  let AUTO = false
  const wait = ms => new Promise(r => setTimeout(r, ms / SPEED))
  const IMG = new Map()
  const img = (f, w) => { const im = new Image(); im.alt = f.card.name; im.draggable = false; const k = f.key + w; if (!IMG.has(k)) IMG.set(k, thumbURL(f.card, w)); IMG.get(k).then(u => im.src = u); return im }

  function bcHud(side, s) {
    const f = act(s), el = $a('.bct-s.' + side), pct = f.hp / f.max * 100
    if (el.dataset.k !== f.key) {
      el.dataset.k = f.key
      el.innerHTML = `<div class="bp" style="background-image:url('${f.card.url}');background-position:${Math.round((f.card.fx ?? .5) * 100)}% ${Math.round((f.card.fy ?? .22) * 100)}%"></div><div class="bi"><div class="bn"><b>${f.card.name}</b>${side === 'you' && mastL(f.key) > 0 ? `<em class="ml">M${mastL(f.key)}</em>` : ''}<small>${f.card.ver}</small></div><div class="bh"><i class="gh"></i><i class="fg"></i><span class="bnum"></span></div><div class="bm"><span class="be"></span><span class="bk"></span></div></div>`
      el.classList.remove('in'); void el.offsetWidth; el.classList.add('in')
      el.querySelector('.gh').style.width = el.querySelector('.fg').style.width = pct + '%'
    }
    const fg = el.querySelector('.fg'), gh = el.querySelector('.gh'), was = parseFloat(fg.style.width) || 100
    fg.style.width = pct + '%'; setTimeout(() => { gh.style.width = pct + '%' }, 450)
    if (pct < was - .1) { el.classList.remove('dmgd'); void el.offsetWidth; el.classList.add('dmgd') }
    el.classList.toggle('low', pct < 30)
    el.querySelector('.bnum').textContent = f.hp.toLocaleString()
    el.querySelector('.be').innerHTML = `⚡ <b>${s.ki}</b>/${KI_MAX}`
    el.querySelector('.bk').innerHTML = s.team.map(g => `<i class="${g.ko ? 'ko' : ''}"></i>`).join('')
    
    $a('.bct-t').textContent = 'TURN ' + B.turn
  }
  function hud(side, s) {
    const f = act(s), el = $a(`.ar-side.${side} .ar-hud`)
    el.innerHTML = `<div class="hn"><b>${f.card.name}</b><small>${f.card.ver}</small></div>
      <div class="hp"><i style="width:${f.hp / f.max * 100}%"></i><span>${f.hp.toLocaleString()} / ${f.max.toLocaleString()}</span></div>
      <div class="gg ${s.gauge >= GAUGE_MAX ? 'full' : ''}"><i style="width:${s.gauge}%"></i></div>`
  }
  function field(side, s) {
    const a = $a(`.ar-side.${side} .ar-active`), f = act(s)
    if (a.dataset.k !== f.key) { a.innerHTML = ''; const im = img(f, 360); a.append(im); a.dataset.k = f.key; a.classList.remove('enter'); void a.offsetWidth; a.classList.add('enter') }
    a.style.setProperty('--rc', X.tierCol(f.card.r))
    let hb = a.querySelector('.hpb'); if (!hb) { hb = document.createElement('div'); hb.className = 'hpb'; a.append(hb) }
    hb.innerHTML = `<b>${f.hp.toLocaleString()}</b><i><s style="width:${f.hp / f.max * 100}%"></s></i>`
    const foeF = act(side === 'you' ? B.ai : B.you), mu = foeF ? matchup(f, foeF) : 1
    let tg = a.querySelector('.mtag'); if (!tg) { tg = document.createElement('div'); a.append(tg) } tg.className = 'mtag ' + (mu > 1 ? 'adv' : mu < 1 ? 'weak' : 'none'); tg.textContent = mu > 1 ? 'ADVANTAGE' : mu < 1 ? 'WEAKNESS' : ''
    a.onclick = () => inspect(f, side)
    ov.querySelector('.ar-plate.' + side + ' .pe').innerHTML = `⚡<b>${s.ki}</b><small>/${KI_MAX}</small>`
    { const bn0 = $a(`.ar-side.${side} .ar-bench`); bn0.classList.toggle('can-swap', side === 'you' && !B.you.switched && !B.busy && !B.over) }
    ov.querySelector('.ar-plate.' + side + ' .pk').innerHTML = s.team.map(g => `<i class="${g.ko ? 'ko' : ''}"></i>`).join('')
    { const p = passives(s), chips = []; if (p.heal) chips.push(`<b class="pc heal">+${p.heal}% HEAL</b>`); if (p.dr) chips.push(`<b class="pc dr">-${p.dr}% DMG TAKEN</b>`); if (p.dmg) chips.push(`<b class="pc dmg">+${p.dmg}% DMG</b>`); if (p.crit) chips.push(`<b class="pc crit">+${p.crit}% CRIT</b>`); if (p.gauge) chips.push(`<b class="pc gg">+${p.gauge}% ULT/TURN</b>`); ov.querySelector('.ar-plate.' + side + ' .pp').innerHTML = chips.join('') }
    const bn = $a(`.ar-side.${side} .ar-bench`); bn.innerHTML = ''
    s.team.forEach((g, i) => {
      if (i === s.active) return
      const b = document.createElement('button'); b.className = 'bslot' + (g.ko ? ' ko' : ''); b.append(img(g, 160))
      b.append(Object.assign(document.createElement('i'), { style: `width:${g.hp / g.max * 100}%` }))
      b.onclick = () => inspect(g, side, side === 'you' && !g.ko && !B.you.switched && !B.busy && !B.over ? () => doSwitch(i) : null)
      bn.append(b)
    })
  }
  function controls() {
    const s = B.you, my = !B.busy && !B.over
    $a('.ar-ki').innerHTML = `<div class="kring" style="--k:${s.ki / KI_MAX}"><b>${s.ki}</b><small>ENERGY</small></div><div class="kpips">${Array.from({ length: KI_MAX }, (_, i) => `<i class="${i < s.ki ? 'on' : ''}"></i>`).join('')}</div>`
    const hand = $a('.ar-hand'); hand.innerHTML = ''
    const f = act(s), rc = X.tierCol(f.card.r), fx = Math.round((f.card.fx ?? .5) * 100), fy = Math.round((f.card.fy ?? .22) * 100)
    const KIND = { strike: ['PHYSICAL', '#ff3d4a', '#ff9a3a'], blast: ['ENERGY', '#ffb020', '#fff04a'], guard: ['DEFENSE', '#20e0a0', '#a8ffda'], special: ['SIGNATURE', tcol(f.card), '#ffffff'], burst: ['TACTIC', '#ff3b6b', '#ffd0dc'], charge: ['TACTIC', '#ff9a00', '#ffe2a8'], transfer: ['TACTIC', '#3ab8ff', '#c8ecff'], heal: ['TACTIC', '#2fe0b0', '#c8fff0'], cleanse: ['TACTIC', '#a46bff', '#e8d8ff'] }
    s.hand.forEach((a, i) => {
      const d = ARTS[a], sp = a === 'special', [kind, c1, c2] = KIND[a], b = document.createElement('button')
      b.className = 'art2 ' + a
      b.style.cssText = `--c1:${c1};--c2:${c2};--rc:${rc};--i:${i - (s.hand.length - 1) / 2};--art:url("${f.card.url}");--fx:${fx}%;--fy:${fy}%`
      b.innerHTML = `<span class="fr"></span><span class="pic"></span><span class="holo"></span><span class="glints"><i></i><i></i><i></i><i></i></span>
        <span class="gem"><b>${a === 'burst' ? 'ALL' : d.cost}</b></span><span class="kind">${kind}</span>
        <span class="sym">${ICON[a] || `<b class="tac-ic">${TAC_ICON[a]}</b>`}</span>
        <span class="plate"><b>${sp ? f.card.mv : d.name}</b><small>${sp ? (isAoe(f.card) ? 'HITS ALL ENEMIES' : 'MASSIVE SINGLE HIT') : d.desc.toUpperCase()}</small></span>`
      b.disabled = !my || s.ki < d.cost || (a === 'burst' && s.ki < 2)
      b.onclick = () => doArt(i)
      hand.append(b)
    })
    const u = $a('.ar-ult'); u.disabled = !my || s.gauge < GAUGE_MAX; u.classList.toggle('ready', s.gauge >= GAUGE_MAX)
    u.style.setProperty('--g', s.gauge / GAUGE_MAX); u.querySelector('small').textContent = s.gauge >= GAUGE_MAX ? ultOf(f.card)[0] : Math.floor(s.gauge) + '%'; u.title = ultOf(f.card).join(': ')
    $a('.ar-end').disabled = !my
    $a('.ar-turn').textContent = 'TURN ' + B.turn
  }
  function draw() { hud('ai', B.ai); hud('you', B.you); field('ai', B.ai); field('you', B.you); controls(); bcHud('ai', B.ai); bcHud('you', B.you) }

  function inspect(f, side, onSwitch) {
    if (B.busy && !onSwitch) { }
    const o = document.createElement('div'); o.className = 'insp'
    const foe = act(side === 'you' ? B.ai : B.you), mu = matchup(f, foe), t = tOf(f.card)
    o.innerHTML = `<div class="insp-card"></div><div class="insp-info"><span class="tp" style="--tc:${tcol(f.card)}">${tname(f.card)}</span><h3>${f.card.name}</h3><small>${f.card.ver}</small>
      <div class="ihp"><i style="width:${f.hp / f.max * 100}%"></i><span>${f.hp.toLocaleString()} / ${f.max.toLocaleString()} HP</span></div>
      <div class="ist">${['PWR', 'SPD', 'ENG', 'TEC', 'DEF', 'IQ'].map((k, i) => `<div><span>${k}</span><b>${[f.pwr, f.spd, f.ki, f.tec, f.def, f.iq][i]}</b></div>`).join('')}</div>
      <div class="imv"><b>${f.card.mv}</b><p>${(f.card.tx || []).join(' ')}</p></div>${f.card.pas ? `<div class="imp"><b>⚡ ${f.card.pas.n}</b><p>${f.card.pas.d}</p></div>` : ''}
      <div class="imu"><span>STRONG VS <b>${(TYPE[RING[(RING.indexOf(t) + 1) % RING.length]] || {}).en || ''}</b></span><span>WEAK TO <b>${(TYPE[weakTo(t)] || {}).en || ''}</b></span>${foe && f !== foe ? `<em class="${mu > 1 ? 'adv' : mu < 1 ? 'weak' : ''}">${mu > 1 ? 'Advantage vs ' + foe.card.name : mu < 1 ? 'Weak vs ' + foe.card.name : 'Neutral vs ' + foe.card.name}</em>` : ''}</div>
      <div class="ibtn"></div></div>`
    o.querySelector('.insp-card').append(img(f, 520))
    const bb = o.querySelector('.ibtn')
    if (onSwitch) { const s2 = document.createElement('button'); s2.className = 'btn gold'; s2.textContent = 'SWITCH IN'; s2.onclick = () => { o.remove(); onSwitch() }; bb.append(s2) }
    const c = document.createElement('button'); c.className = 'btn dark'; c.textContent = 'CLOSE'; c.onclick = () => o.remove(); bb.append(c)
    o.onclick = e => { if (e.target === o) o.remove() }
    ov.append(o)
  }
  const FX = () => ov.querySelector('.fxl')
  const ctr = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] }
  function shake(level) { ov.classList.remove('shk1', 'shk2', 'shk3'); void ov.offsetWidth; ov.classList.add('shk' + level); setTimeout(() => ov.classList.remove('shk' + level), 600) }
  function wash(col, strong) { const w = document.createElement('div'); w.className = 'wash' + (strong ? ' strong' : ''); w.style.setProperty('--wc', col); FX().append(w); setTimeout(() => w.remove(), 900) }
  function sparks(el, col, n = 16) {
    const [x, y] = ctr(el)
    for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.className = 'spk'; const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120; p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--sc:${col};animation-delay:${Math.random() * .06}s`; FX().append(p); setTimeout(() => p.remove(), 800) }
    const ring = document.createElement('i'); ring.className = 'impact'; ring.style.cssText = `left:${x}px;top:${y}px;--sc:${col}`; FX().append(ring); setTimeout(() => ring.remove(), 600)
  }
  function slashes(el, col) {
    const [x, y] = ctr(el)
    for (let i = 0; i < 3; i++) { const sl = document.createElement('i'); sl.className = 'slash'; sl.style.cssText = `left:${x}px;top:${y + (i - 1) * 26}px;--sc:${col};--rot:${-28 + i * 14}deg;animation-delay:${i * .06}s`; FX().append(sl); setTimeout(() => sl.remove(), 700) }
  }
  function beam(from, to, col, wide) {
    const [x1, y1] = ctr(from), [x2, y2] = ctr(to), len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1)
    const b = document.createElement('i'); b.className = 'beam' + (wide ? ' wide' : ''); b.style.cssText = `left:${x1}px;top:${y1}px;width:${len}px;transform:rotate(${ang}rad);--sc:${col}`; FX().append(b); setTimeout(() => b.remove(), 650)
  }
  function cutin(card, move, sub, col, ult, uname) {
    sfx('whoosh')
    const foe = sub === 'ENEMY', c = document.createElement('div'); c.className = 'cut2' + (ult ? ' ult' : '') + (foe ? ' foe' : '')
    c.style.setProperty('--cc', col)
    c.innerHTML = `<div class="c2-dim"></div><div class="c2-light"></div><div class="c2-line l1"></div><div class="c2-line l2"></div>
      <div class="c2-card"><img alt=""></div>
      <div class="c2-txt"><small>${foe ? 'ENEMY · ' : ''}${ult ? (uname || 'ULTIMATE') + ' · ULTIMATE' : 'SPECIAL ART'}</small><b>${move}</b><span>${card.name}<em>${card.ver}</em></span></div>`
    thumbURL(card, 560).then(u => c.querySelector('img').src = u)
    FX().append(c)
    setTimeout(() => c.classList.add('out'), ult ? 1150 : 850); setTimeout(() => c.remove(), ult ? 1500 : 1200)
  }
  function banner(text, sub, col) { const b = document.createElement('div'); b.className = 'mvban'; b.style.setProperty('--bc', col); b.innerHTML = `<small>${sub}</small><b>${text}</b>`; FX().append(b); setTimeout(() => b.remove(), 1300) }
  function chainPop(side, n, combo) {
    const c = document.createElement('div'); c.className = 'chainpop ' + side + (combo ? ' combo' : '')
    c.innerHTML = combo ? `<small>COMBO</small><b>${combo}</b>` : `<b>${n}</b><small>CHAIN · +${Math.min(32, (n - 1) * 8)}%</small>`
    FX().append(c); setTimeout(() => c.remove(), 1200); if (combo) sfx('bcharge')
  }
  function turnBanner(text, mine) { const t = document.createElement('div'); t.className = 'tban ' + (mine ? 'you' : 'ai'); t.innerHTML = `<b>${text}</b>`; FX().append(t); setTimeout(() => t.remove(), 1100) }
  function floatTag(el, text, cls) { const [x, y] = ctr(el); const t = document.createElement('div'); t.className = 'ftag ' + cls; t.textContent = text; t.style.left = x + 'px'; t.style.top = (y - 70) + 'px'; FX().append(t); setTimeout(() => t.remove(), 1200) }

  function pasPop(n) { const el = $a(`.ar-side.${n.f === act(B.you) || B.you.team.includes(n.f) ? 'you' : 'ai'} .ar-active`); if (!el) return; const [x, y] = ctr(el); const t = document.createElement('div'); t.className = 'pas-pop'; t.innerHTML = `<small>${n.extra || 'PASSIVE'}</small><b>${n.name}</b>`; t.style.left = x + 'px'; t.style.top = (y - 120) + 'px'; FX().append(t); setTimeout(() => t.remove(), 1500) }
  async function show(ev) {
    if (ev.swap) { log('Enemy switched fighters'); sfx('bswitch'); draw(); await wait(500); return }
    const side = ev.who, other = side === 'you' ? 'ai' : 'you'
    const atk = $a(`.ar-side.${side} .ar-active`)
    if (ev.tactic) { log(`${act(B[side]).card.name} · ${ARTS[ev.art].name}`); floatTag(atk, ev.tactic, 'adv'); sfx(ev.art === 'heal' ? 'heal' : 'bguard'); await wait(450); draw(); return }
    if (ev.guard) { log(`${act(B[side]).card.name} braces · GUARD`); sfx('bguard'); atk.classList.add('guarding'); await wait(450); atk.classList.remove('guarding'); draw(); return }
    const big = ev.art === 'special' || ev.art === 'ultimate' || ev.art === 'burst', A = act(B[side]), col = tcol(A.card)
    const tgtEl = $a(`.ar-side.${other} .ar-active`)
    log(big ? `${ev.art === 'ultimate' ? ev.ult + ' · ' : ''}${ev.move}` : `${A.card.name} · ${ARTS[ev.art].name}`)
    if (ev.chain > 1 || ev.combo) chainPop(side, ev.chain, ev.combo)
    // 1) the attacker card pops up and spins
    atk.style.setProperty('--ac', col)
    const [tx, ty] = ctr(tgtEl), [ax, ay] = ctr(atk)
    // 1) wind-up: specials/ultimates gather energy into the card first
    if (ev.art === 'ultimate') { ov.classList.add('ult'); sfx('bcharge'); atk.classList.add('charging'); FXC.gather(ax, ay, col, .7, 34); FXC.screen(col, .22, .6); cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'ULTIMATE', col, true, ev.ult); await wait(1350) }
    else if (big) { sfx('bcharge'); atk.classList.add('charging'); FXC.gather(ax, ay, col, .55, 24); cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'SPECIAL', col); await wait(1000) }
    // 2) the card itself dashes into the target and slams it
    const reach = ev.art === 'blast' ? .42 : .82
    atk.style.setProperty('--dx', ((tx - ax) * reach) + 'px'); atk.style.setProperty('--dy', ((ty - ay) * reach) + 'px')
    atk.classList.remove('dash', 'dashbig', 'charging'); void atk.offsetWidth; atk.classList.add(big ? 'dashbig' : 'dash')
    await wait(big ? 260 : 200)
    sfx(ev.art === 'strike' ? 'bhit' : ev.art === 'blast' ? 'bblast' : 'bimpact', ev.art === 'ultimate')
    if (ev.art === 'ultimate') { ov.classList.remove('iframe'); void ov.offsetWidth; ov.classList.add('iframe'); setTimeout(() => ov.classList.remove('iframe'), 90) }
    if (big) { ov.classList.remove('punch'); void ov.offsetWidth; ov.classList.add('punch'); setTimeout(() => ov.classList.remove('punch'), 420); FXC.screen('#ffffff', ev.art === 'ultimate' ? .35 : .18, .25) }
    setTimeout(() => atk.classList.remove('dash', 'dashbig'), 700)
    ST3 && ST3.hit(other, big)
    shake(ev.art === 'ultimate' ? 3 : big ? 2 : 1); if (big || ev.art === 'ultimate') { ov.classList.remove('hitstop'); void ov.offsetWidth; ov.classList.add('hitstop'); setTimeout(() => ov.classList.remove('hitstop'), 160) }
    for (const x of ev.hits) {
      const isActive = x.t === act(B[other])
      const tgt = isActive ? tgtEl : $a(`.ar-side.${other} .ar-bench`)
      tgt.classList.remove('hurt'); void tgt.offsetWidth; tgt.classList.add('hurt')
      { const [hx, hy] = ctr(tgt); FXC.hit(hx, hy, x.crit ? '#ff5a6a' : big ? '#ffc840' : col, !isActive ? .7 : ev.art === 'ultimate' ? 2.3 : big ? 1.6 : ev.art === 'blast' ? 1.15 : .9) }
      const n = document.createElement('div'); n.className = 'dmg' + (x.crit ? ' crit' : '') + (big ? ' big' : '') + (x.mu > 1 ? ' adv' : ''); n.innerHTML = `<b>${x.dmg.toLocaleString()}</b>`; n.style.animationDelay = (ev.hits.indexOf(x) * .09) + 's'
      const r = tgt.getBoundingClientRect(); n.style.left = (r.left + r.width / 2) + 'px'; n.style.top = (r.top + r.height * .35) + 'px'
      ov.append(n); setTimeout(() => n.remove(), 1100)
      if (isActive && x.crit) { floatTag(tgt, 'CRITICAL!', 'crit'); sfx('crit') }
      else if (isActive && x.mu > 1) floatTag(tgt, 'SUPER EFFECTIVE', 'adv')
      else if (isActive && x.mu < 1) floatTag(tgt, 'RESISTED', 'weak')
    }
    if (ev.rally) floatTag(atk, 'TEAM HEALED 20%', 'adv')
    if (ev.fort) floatTag(atk, 'FORTRESS · -30% DMG', 'adv')
    if (ev.kit && ev.kit.length) { const [kx, ky] = ctr(atk); const t = document.createElement('div'); t.className = 'ftag kit'; t.textContent = ev.kit.join('  ·  '); t.style.left = kx + 'px'; t.style.top = (ky - 90) + 'px'; FX().append(t); setTimeout(() => t.remove(), 1500) }
    if (PASLOG && PASLOG.length) { const seen = new Set(); for (const n of PASLOG.splice(0)) { if (seen.has(n.name)) continue; seen.add(n.name); pasPop(n) } }
    ov.classList.remove('ult')
    draw(); await wait(big ? 650 : 420)
    // knockouts
    const foe = B[other]
    if (act(foe).ko) {
      sfx('bko'); shake(3); { const [kx, ky] = ctr(tgtEl); FXC.ko(kx, ky) } ST3 && ST3.ko(other); log(`${act(foe).card.name} is knocked out!`)
      $a(`.ar-side.${other} .ar-active`).classList.add('kod'); { const k = document.createElement('div'); k.className = 'bc-ko ' + other; k.innerHTML = `<b>K.O.</b><small>${act(foe).card.name}</small>`; ov.append(k); ov.classList.add('slowmo'); setTimeout(() => { k.remove(); ov.classList.remove('slowmo') }, 1500) } await wait(1200); $a(`.ar-side.${other} .ar-active`).classList.remove('kod')
      if (!nextAlive(foe)) return end(other === 'ai')
      if (other === 'you') { await pickReplacement() } else { log(`Enemy sends out ${act(foe).card.name}`); sfx('nav') }
      draw(); await wait(400)
    }
  }
  function pickReplacement() {
    return new Promise(res => {
      log('Your fighter is down. Choose who goes in next.')
      const best = B.you.team.map((f, i) => [f, i]).filter(([f]) => !f.ko)
      B.you.active = best[0][1]; draw()
      // the first healthy one is sent in; the player can still switch once next turn
      setTimeout(res, 500)
    })
  }
  async function doArt(i) {
    if (B.busy || B.over) return
    B.busy = true; controls()
    const ev = playArt(B, 'you', i); if (ev) await show(ev)
    B.busy = false; if (!B.over) controls()
  }
  async function doSwitch(i) {
    if (B.busy || B.over || B.you.switched || B.you.team[i].ko) return
    B.you.active = i; B.you.switched = true; sfx('bswitch'); log(`Go, ${act(B.you).card.name}!`); draw()
  }
  $a('.ar-ult').onclick = async () => { if (B.busy || B.over) return; B.busy = true; controls(); const e = ultimate(B, 'you'); if (e) await show(e); B.busy = false; if (!B.over) controls() }
  const mb = $a('.ar-mute'), mdraw = () => { mb.textContent = sfxOn() ? '🔊 SOUND' : '🔇 MUTED'; mb.classList.toggle('off', !sfxOn()) }
  mb.onclick = () => { sfxOn(!sfxOn()); mdraw() }; mdraw()
  $a('.ar-end').onclick = () => endTurn()
  $a('.ar-quit').onclick = () => { if (B.over) return close(); if (ov.querySelector('.qconf')) return; const q = document.createElement('div'); q.className = 'qconf'; q.innerHTML = '<div class="qc-box"><b>QUIT BATTLE?</b><p>You will leave this fight with no rewards.' + (stage.boss ? ' Your boss attempt is not used.' : '') + '</p><div class="qc-b"><button class="btn dark">KEEP FIGHTING</button><button class="btn red">QUIT</button></div></div>'; const [k, x] = q.querySelectorAll('button'); k.onclick = () => q.remove(); x.onclick = () => { q.remove(); close() }; ov.append(q) }
  function close() {
    if (stage.pvp) { FXC.dispose(); document.body.classList.remove('in-battle'); music('menu'); B.closed = true; ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('players'); return } FXC.dispose(); document.body.classList.remove('in-battle'); music('menu'); B.closed = true; ST3 && ST3.dispose(); ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('battle') }

  async function aiPhase() {
    if (stage.boss && B.turn >= 12 && !B.over) { log('Time up! The boss retreats.'); return end(false) }
    if (stage.bossAb && B.turn % 3 === 0 && !B.over) {
      const ab = stage.bossAb, you = B.you, boss = act(B.ai)
      B.busy = true; controls(); sfx('charge', 6); shake(3); wash('#ff3b6b', true)
      cutin(boss.card, ab.name, 'BOSS SKILL', '#ff3b6b', true, ab.name); await wait(1300)
      if (ab.id === 'aoe') { for (const f of you.team) if (!f.ko) f.hp = Math.max(1, f.hp - Math.round(f.max * .12)); log(`${ab.name}! Your whole team takes 12% damage.`) }
      else if (ab.id === 'stun') { you.skip = 1; log(`${ab.name}! ${act(you).card.name} is stunned and loses the next turn.`) }
      else if (ab.id === 'burn') { for (const f of you.team) if (!f.ko) { f.burn = 5; f.burnT = 3 } log(`${ab.name}! Your team is burning.`) }
      else if (ab.id === 'drain') { you.ki = Math.max(0, you.ki - 3); you.gauge = Math.max(0, you.gauge - 30); log(`${ab.name}! You lose 3 Energy and Ultimate charge.`) }
      else if (ab.id === 'rage') { boss.pwr = Math.round(boss.pwr * 1.15); boss.ki = Math.round(boss.ki * 1.15); log(`${ab.name}! The boss powers up: +15% damage.`) }
      { const [x, y] = ctr($a('.ar-side.you .ar-active')); FXC.hit(x, y, '#ff3b6b', 2) }
      draw(); await wait(1100)
    }
    B.busy = true; controls()
    const s = B.ai; s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN); refill(s); s.switched = false; s.seq = []; startTurn(s); act(B.you).fort = 0
    if (s.skip || act(s).frozen) { s.skip = 0; act(s).frozen = 0; log('Enemy loses its turn!'); turnBanner('TIME STOPPED', false); await wait(900); B.turn++; const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN); refill(y); y.switched = false; y.seq = []; startTurn(y); B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); draw(); if (AUTO) autoTurn(); return }
    log('Enemy turn'); turnBanner('ENEMY TURN', false); draw(); await wait(800)
    for (const ev of aiTurn(B, stage.level)) { if (B.over) return; await show(ev); if (B.over) return }
    if (B.you.skip || act(B.you).frozen) { B.you.skip = 0; act(B.you).frozen = 0; log('You lose your turn!'); turnBanner('TIME STOPPED', true); await wait(900); B.turn++; return aiPhase() }
    B.turn++
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN); refill(y); y.switched = false; y.seq = []; startTurn(y); act(B.ai).fort = 0
    B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); sfx('bturn'); draw(); if (AUTO) autoTurn()
  }
  async function endTurn() { if (B.busy || B.over) return; await aiPhase() }
  function startTurn(s) {
    const a0 = act(s), e = PE(a0), foe = s === B.you ? B.ai : B.you
    a0.turns++
    if (e.regen && !e.noHeal) a0.hp = Math.min(a0.max, a0.hp + Math.round(a0.max * e.regen / 100))
    if (e.bleed) a0.hp = Math.max(1, a0.hp - Math.round(a0.max * e.bleed / 100))
    if (e.emperor) a0.hp = Math.max(1, a0.hp - Math.round(a0.max * .03))
    if (a0.burnT > 0) { a0.hp = Math.max(1, a0.hp - Math.round(a0.max * a0.burn / 100)); a0.burnT-- }
    if (e.guardAuto) a0.guard = 1
    if (e.energyTurn) s.ki = Math.min(KI_MAX, s.ki + e.energyTurn)
    if (e.haki) { const o = act(foe); if (o && o.card.ovr < a0.card.ovr) foe.ki = Math.max(0, foe.ki - e.haki) }
    for (const f of s.team) { const fe = PE(f); if (fe.teamHeal && !f.ko) for (const g of s.team) if (!g.ko) g.hp = Math.min(g.max, g.hp + Math.round(g.max * fe.teamHeal / 100)) }
    if (e.specDraw && Math.random() * 100 < e.specDraw) { s.hand[0] = 'special' }
    if (e.timeStop && Math.random() * 100 < e.timeStop) { foe.skip = 1; pasNote(a0, 'TIME STOP') }
    if (e.charge && s.lastSkipped) a0.rage = Math.max(a0.rage || 0, e.charge)
    s.confiscated = 0; sealNow()
    const p = passives(s), a = act(s); if (p.heal && !a.ko) a.hp = Math.min(a.max, a.hp + Math.round(a.max * p.heal / 100)); if (p.gauge) s.gauge = Math.min(GAUGE_MAX, s.gauge + p.gauge) }
  async function autoTurn() {
    if (!AUTO || B.busy || B.over) return
    B.busy = true; controls(); await wait(350)
    for (const ev of planTurn(B, 4, 'you')) { if (B.over) return; await show(ev); if (B.over) return }
    B.busy = false; if (!B.over && AUTO) await aiPhase()
  }
  { const sb = $a('.ar-speed'), sd = () => { sb.textContent = SPEED + '×'; sb.classList.toggle('on', SPEED > 1) }; sb.onclick = () => { SPEED = SPEED === 1 ? 2 : SPEED === 2 ? 3 : 1; try { localStorage.setItem('aut-bspeed', SPEED) } catch { } ov.style.setProperty('--spd', SPEED); sd() }; ov.style.setProperty('--spd', SPEED); sd()
    const ab = $a('.ar-auto'); ab.onclick = () => { AUTO = !AUTO; ab.classList.toggle('on', AUTO); ab.textContent = AUTO ? 'AUTO ON' : 'AUTO'; if (AUTO && !B.busy && !B.over) autoTurn() } }

  async function end(won) {
    B.over = true; controls()
    await wait(500)
    const r = stage.pvp ? await X.act('pvp', { won, name: stage.name, uid: stage.uid }) : await X.act('battle', stage.mode ? { mode: stage.mode, id: stage.id, won, dmg: B.you.team.reduce((n, f) => n + f.dealt, 0) } : { stage: stage.n, won })
    sfx(stage.boss ? 'claim' : won ? 'win' : 'lose')
    const mvp = B.you.team.slice().sort((a, b) => b.dealt - a.dealt)[0], dealt = B.you.team.reduce((n, f) => n + f.dealt, 0), kos = B.you.team.reduce((n, f) => n + f.kos, 0)
    const box = document.createElement('div'); box.className = 'ar-result ' + (won ? 'win' : 'lose')
    box.innerHTML = `<div class="rs-burst"></div><h2>${stage.boss ? 'BOSS FIGHT' : won ? 'VICTORY' : 'DEFEAT'}</h2><p>${stage.boss ? (r.msg || '') : won ? (r.msg || 'Stage cleared.') : 'Your team was knocked out. Tweak your lineup and try again.'}</p>
      <div class="rs-body"><div class="rs-mvp"><span>MVP</span><div class="rs-card"></div><b>${mvp.card.name}</b><small>${mvp.dealt.toLocaleString()} DMG · ${mvp.kos} KO</small></div>
      <div class="rs-stats"><div><b>${B.turn}</b><span>TURNS</span></div><div><b>${dealt.toLocaleString()}</b><span>TOTAL DAMAGE</span></div><div><b>${kos}</b><span>KNOCKOUTS</span></div><div><b>${B.you.team.filter(f => !f.ko).length}/6</b><span>SURVIVED</span></div></div></div>`
    box.querySelector('.rs-card').append(img(mvp, 360))
    const b = document.createElement('button'); b.className = 'btn gold'; b.textContent = 'CONTINUE'; b.onclick = close; box.append(b)
    ov.append(box)
  }

  arenaImgs().then(list => {
    let name = ARENAS[AR].name, sub = ARENAS[AR].sub
    if (list.length) {
      const pick = stage.pvp || !stage.n ? list[Math.floor(Math.random() * list.length)] : list[(stage.n - 1) % list.length]
      ov.classList.add('has-img'); ov.style.setProperty('--bgimg', `url("${pick.url}")`); name = pick.name; sub = stage.pvp ? 'Ranked Arena' : 'Stage ' + stage.n
      // measure how bright the art is and pick a light or dark UI theme to match
      const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = 32; c.height = 18; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 18); const d = x.getImageData(0, 0, 32, 18).data; let L = 0; for (let i = 0; i < d.length; i += 4) L += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; L /= d.length / 4; ov.classList.toggle('lite', L > .42); ov.style.setProperty('--lum', L.toFixed(2)) } catch { } }; im.src = pick.url
    }
    const t = document.createElement('div'); t.className = 'arena-title'; t.innerHTML = `<small>ARENA</small><b>${name}</b><span>${sub}</span>`; ov.append(t); setTimeout(() => t.remove(), 2300)
  })
  draw()
  if (B.you.combos) setTimeout(() => { for (const [i, cb] of B.you.combos.entries()) setTimeout(() => banner(cb.n, 'TEAM COMBO · +6% DAMAGE', '#ffcc00'), i * 1400) }, 2600)
  if (youFirst) { log(`You move first (${act(B.you).card.name} is faster)`) }
  else { log(`${act(B.ai).card.name} is faster · enemy moves first`); setTimeout(aiPhase, 900) }
}

// ---------------- tutorial ----------------
const STEPS = [
  { t: 'THE GOAL', d: 'Battles are 6 vs 6. You fight with <b>one active fighter</b> while the other 5 wait on the <b>bench</b>. Knock out <b>all 6</b> enemy fighters to win.', ic: '🏆' },
  { t: 'TURNS & ENERGY', d: 'You and the enemy take turns. Every turn you gain <b>+3 Energy</b> (the blue bar, max 10). Energy you don\'t spend carries over, so you can save up for a big turn.', ic: '⚡' },
  { t: 'ARTS CARDS', d: 'You hold <b>4 Arts cards</b>, refilled each turn. Tap one to use it; the number in the corner is its Energy cost.<br><span class="tk s">STRIKE</span> 1 Energy · quick hit using PWR<br><span class="tk b">BLAST</span> 2 Energy · stronger energy attack using ENG<br><span class="tk g">GUARD</span> 1 Energy · halves the next hit you take<br><span class="tk p">SPECIAL</span> 4 Energy · your fighter\'s signature move', ic: '🃏' },
  { t: 'YOUR ARTS DECK', d: 'Your 4 cards are drawn from your <b>20-card Arts Deck</b> (Team → Arts Deck). Besides attacks it can hold <b>Tactic cards</b>: <b>Burst</b> spends all your Energy on one huge hit, <b>Power Charge</b> boosts your next attack, <b>Energy Link</b> gives +2 Energy, <b>Recover</b> heals, <b>Cleanse</b> removes burns.', ic: '🃏' },
  { t: 'SPECIALS', d: 'Each fighter\'s Special uses their real card move. Moves that say <b>"all enemies"</b> hit the active fighter <b>and</b> splash the whole enemy bench.', ic: '💥' },
  { t: 'ULTIMATE', d: 'Dealing and taking damage fills the <b>purple gauge</b> under your HP. When it turns <b>gold</b>, the ULTIMATE button lights up: a huge free attack that costs no Energy.', ic: '🌟' },
  { t: 'SWITCHING', d: 'Tap a fighter on <b>your bench</b> to swap them in, <b>once per turn</b>, free. Swap out a hurt fighter to save them, or bring in someone stronger. When a fighter is KO\'d, the next one comes in automatically.', ic: '🔄' },
  { t: 'BONUSES', d: '<b>Type advantage</b>: some types beat others (look for the green ADVANTAGE tag) for +30% damage.<br><b>Synergy</b>: 3+ fighters from one anime boost your team.<br><b>Combos</b>: famous pairs like Naruto + Sasuke unlock +6% damage.<br><b>Passives</b>: every card has a unique ⚡ Moment ability.', ic: '✨' },
  { t: 'WHO GOES FIRST', d: 'The fighter with the higher <b>SPD</b> stat moves first. Stronger cards also have more HP, so a well-built team matters. Use <b>Auto Build</b> on My Team if you\'re unsure.', ic: '🏃' },
  { t: 'TIPS', d: '• Save Energy for a Special instead of spending it all on Strikes.<br>• Guard before the enemy\'s turn when your fighter is low.<br>• Fire your Ultimate as soon as it\'s ready.<br>• Hit <b>END TURN</b> when you\'re done.<br><br>Clear stages for coins, and the first clear of stages 5, 8 and 10 gives free packs.', ic: '💡' },
]
export function tutorial(onDone) {
  const ov = document.createElement('div'); ov.className = 'tut'; let i = 0
  const draw = () => {
    const s = STEPS[i]
    ov.innerHTML = `<div class="tut-card"><div class="tut-ic">${s.ic}</div><span class="tut-n">HOW TO PLAY · ${i + 1} / ${STEPS.length}</span><h3>${s.t}</h3><p>${s.d}</p>
      <div class="tut-dots">${STEPS.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tut-btns"><button class="tut-skip">${i ? 'BACK' : 'SKIP'}</button><button class="tut-next">${i === STEPS.length - 1 ? "LET'S FIGHT" : 'NEXT'}</button></div></div>`
    ov.querySelector('.tut-next').onclick = () => { sfx('click'); if (i < STEPS.length - 1) { i++; draw() } else close() }
    ov.querySelector('.tut-skip').onclick = () => { sfx('soft'); if (i) { i--; draw() } else close() }
  }
  const close = () => { try { localStorage.setItem('aut-tut', '1') } catch { } ov.remove(); onDone && onDone() }
  draw(); document.body.append(ov)
}
export const seenTutorial = () => { try { return localStorage.getItem('aut-tut') === '1' } catch { return false } }
