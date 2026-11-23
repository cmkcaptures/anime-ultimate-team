// AUT Battle — turn-based hybrid of DB Legends (Arts cards, Energy, Ultimates, switching) and TCG Pocket (turns, energy, bench).
// Win by knocking out all 6 enemy fighters. 1 active fighter + 5 on the bench each side.
import { TIER, TYPE, thumbURL } from './cardkit.js?v=chimera-reward'
import { sfx, sfxOn, music } from './sfx.js?v=chimera-reward'
import { createFX } from './fx2d.js?v=chimera-reward'

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
// leader skill: the leader boosts every fighter that shares one of its categories
export const leadHits = (lead, c) => !!(lead && c && lead.cats.some(k => k === c.anime || (c.cat || []).includes(k)))
// ---- TEAM AURAS: every fighter buffs teammates that share one of its 2 aura tags; grows with diamonds ----
const ROLE_TAG = { FIGHTER: 'Fighters', TANK: 'Tanks', SHOOTER: 'Shooters', ASSASSIN: 'Assassins', SUPPORT: 'Supports' }
export const AURA_PCT = { 3: 3, 4: 4, 5: 5, 6: 7, 7: 10 }, AURA_CAP = 40
export const tagsOf = c => ['S:' + c.anime, c.faction, ...(c.cat || []), ROLE_TAG[c.role] || 'Fighters']
export const auraHits = (src, c) => !!(src && c && src.aura && src.aura.some(t => tagsOf(c).includes(t)))
export function teamAuras(cards, defDia = 3) { return cards.map(c => { if (!c) return 0; let b = 0; for (const s of cards) if (s && auraHits(s, c)) b += AURA_PCT[Math.min(7, Math.max(3, s.dia || defDia))]; return Math.min(AURA_CAP, b) }) }
function applyAuras(side, defDia) { const b = teamAuras(side.team.map(f => f.card), defDia); side.team.forEach((f, i) => { const x = b[i]; if (!x) return; f.max = f.hp = Math.round(f.max * (1 + x / 100)); const k = 1 + x / 200; f.pwr = Math.round(f.pwr * k); f.ki = Math.round(f.ki * k); f.def = Math.round(f.def * k); f.auraB = x }); side.auraAvg = Math.round(b.reduce((n, v) => n + v, 0) / Math.max(1, b.length)) }
// ---- LINK SKILLS: neighbours in the lineup (Leader → Main 1 → Main 2 → Sub 1 → Sub 2 → Sub 3) link up ----
export const LINKS = [
  { n: 'Saiyan Rivals', a: ['GOKU', 'VEGETA'], pct: 12 }, { n: 'Father & Son', a: ['GOKU', 'GOHAN', 'GOTEN'], pct: 10 }, { n: 'Mentor & Student', a: ['GOHAN', 'PICCOLO'], pct: 10 },
  { n: 'Team 7', a: ['NARUTO', 'SASUKE', 'SAKURA', 'KAKASHI'], pct: 10 }, { n: 'Uchiha Blood', a: ['SASUKE', 'ITACHI', 'MADARA', 'OBITO'], pct: 8 },
  { n: 'Monster Trio', a: ['LUFFY', 'ZORO', 'SANJI'], pct: 10 }, { n: 'ASL Brothers', a: ['LUFFY', 'ACE', 'SABO'], pct: 10 }, { n: 'Emperors', a: ['SHANKS', 'KAIDO', 'BIG MOM', 'BLACKBEARD', 'LUFFY'], pct: 8 },
  { n: 'The Strongest', a: ['GOJO', 'YUTA', 'ITADORI', 'MEGUMI', 'NOBARA'], pct: 10 }, { n: 'King of Curses', a: ['SUKUNA', 'MAHITO', 'JOGO', 'GETO', 'KENJAKU'], pct: 8 },
  { n: 'Kamado Bond', a: ['TANJIRO', 'NEZUKO', 'ZENITSU', 'INOSUKE', 'KAMABOKO'], pct: 10 }, { n: 'Hashira', a: ['RENGOKU', 'GIYU', 'TENGEN', 'SHINOBU', 'MITSURI', 'OBANAI'], pct: 8 },
  { n: 'Urameshi Team', a: ['YUSUKE', 'KUWABARA', 'KURAMA', 'HIEI', 'GENKAI', 'TEAM URAMESHI'], pct: 10 },
  { n: 'Deku & Kacchan', a: ['DEKU', 'BAKUGO', 'ALL MIGHT'], pct: 10 }, { n: 'Soul Reapers', a: ['ICHIGO', 'RUKIA', 'RENJI', 'URAHARA', 'YAMAMOTO', 'KENPACHI', 'BYAKUYA', 'UNOHANA'], pct: 8 },
  { n: 'Seven Deadly Sins', a: ['MELIODAS', 'ESCANOR', 'BAN', 'KING', 'ELIZABETH'], pct: 10, anime: 'SDS' }, { n: 'Hunters', a: ['GON', 'KILLUA', 'KURAPIKA', 'HISOKA'], pct: 8 },
  { n: 'Survey Corps', a: ['LEVI', 'EREN', 'MIKASA', 'ARMIN', 'HANGE'], pct: 8 }, { n: 'Devil Hunters', a: ['DENJI', 'POWER', 'AKI', 'KISHIBE', 'KOBENI', 'MAKIMA'], pct: 8 },
  { n: 'Sword Masters', cat: 'Swordsmen', pct: 5 }, { n: 'Dark Alliance', cat: 'Villains', pct: 5 }, { n: 'Tag Partners', cat: 'Tag Teams', pct: 4 }, { n: 'Power Surge', cat: 'Transformations', pct: 4 },
  { n: 'Comrades', fac: 1, pct: 6 },
]
const LINK_CAP = 30
const memOf = (L, c) => L.anime && c.anime !== L.anime ? [] : L.a.filter(m => c.name === m || c.name.startsWith(m + ' ') || c.name.includes(' ' + m) || c.name.includes(m + ' &') || c.name.includes('& ' + m))
export function linkPair(c1, c2) { if (!c1 || !c2) return []; const out = []
  for (const L of LINKS) {
    if (L.a) { const m1 = memOf(L, c1), m2 = memOf(L, c2); if (m1.length && m2.length && new Set([...m1, ...m2]).size >= 2) out.push(L) }
    else if (L.cat) { if ((c1.cat || []).includes(L.cat) && (c2.cat || []).includes(L.cat)) out.push(L) }
    else if (L.fac && c1.faction && c1.faction === c2.faction) out.push(L)
  } return out }
export function teamLinks(cards) { const pct = cards.map(() => 0), active = []
  for (let i = 0; i < cards.length - 1; i++) { const L = linkPair(cards[i], cards[i + 1]); if (!L.length) continue; const v = L.reduce((n, x) => n + x.pct, 0); pct[i] += v; pct[i + 1] += v; active.push({ i, j: i + 1, links: L }) }
  return { pct: pct.map(v => Math.min(LINK_CAP, v)), active } }
function applyLinks(side) { const { pct } = teamLinks(side.team.map(f => f.card)); side.team.forEach((f, i) => { const x = pct[i]; if (!x) return; f.max = f.hp = Math.round(f.max * (1 + x / 100)); const k = 1 + x / 200; f.pwr = Math.round(f.pwr * k); f.ki = Math.round(f.ki * k); f.def = Math.round(f.def * k); f.linkB = x }) }
export function leaderInfo(cards) { const L = cards[0], lead = L && L.lead; if (!lead) return { lead: null, n: 0 }; return { lead, leader: L, n: cards.filter(c => c && leadHits(lead, c)).length } }
function applyLeader(side) { const L = side.team[0] && side.team[0].card, lead = L && L.lead; if (!lead) return; side.kiBonus = lead.ki || 0; let n = 0
  for (const f of side.team) if (leadHits(lead, f.card)) { n++; f.max = f.hp = Math.round(f.max * (1 + lead.pct / 100)); const k = 1 + lead.pct / 200; f.pwr = Math.round(f.pwr * k); f.ki = Math.round(f.ki * k); f.def = Math.round(f.def * k); f.boosted = 1 }
  side.leadN = n }
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
  senzu: { name: 'SENZU BEAN', cost: 2, col: '#6ad04a', desc: 'Full heal · clears burn/freeze', tactic: 1, item: 'items/senzu.jpg' },
  cylinder: { name: 'MAGIC CYLINDER', cost: 2, col: '#ff3d6a', desc: 'Next hit bounces back', tactic: 1, item: 'items/cylinder.jpg' },
  rumble: { name: "RUMBLE BALL", cost: 2, col: '#ff7ab0', desc: "Heal 35% · next attack +25%", tactic: 1, item: 'items/rumble.jpg' },
  finger: { name: "CURSED FINGER", cost: 1, col: '#8a0a2a', desc: "Next attack +60% · lose 10% HP", tactic: 1, item: 'items/finger.jpg' },
  deathnote: { name: "DEATH NOTE", cost: 3, col: '#111', desc: "Enemy KO'd in 3 turns", tactic: 1, item: 'items/deathnote.jpg' },
  hogyoku: { name: "HOGYOKU", cost: 2, col: '#7a3aff', desc: "Survive a KO · +15% stats", tactic: 1, item: 'items/hogyoku.jpg' },
  wing: { name: "RAINBOW WING", cost: 3, col: '#ff9a1a', desc: "Revive a KO'd ally at 40%", tactic: 1, item: 'items/wing.jpg' },
  scroll: { name: "SEALING SCROLL", cost: 2, col: '#c8a050', desc: "Seal the enemy passive", tactic: 1, item: 'items/scroll.jpg' },
  clock: { name: "TIME MAGIC CLOCK", cost: 3, col: '#3a8aff', desc: "Enemy skips their next turn", tactic: 1, item: 'items/clock.jpg' },
}
// tribes: field 3+ of a tribe for its bonus
// real dragons and dragon slayers (not Dragon Ball)
export const DRAGONS = ['NATSU', 'ACNOLOGIA', 'SHENRON', 'GARCHOMP', 'DURALUDON', 'CHARIZARD', 'RESHIRAM', 'ZEKROM', 'SLIFER']
export const isDragon = c => DRAGONS.some(n => c.name.includes(n)) || (/KAIDO/.test(c.name) && /DRAGON/.test(c.ver || ''))
const TAC_ICON = { burst: '💥', charge: '⚡', transfer: '🔗', heal: '✚', cleanse: '✦', senzu: '', cylinder: '', rumble: '', finger: '', deathnote: '', hogyoku: '', wing: '', scroll: '', clock: '' }
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
  const hp = Math.round((card.ovr * 40 + def * 12 + (card.tag ? 600 : 0)) * (card.awoke ? 1.1 : 1))
  const e = (card.pas && card.pas.e) || {}, boost = 1 + (e.allStats || 0) / 100
  const f = { card, key: card.key, hp, max: hp, pwr: Math.round(pwr * boost), spd: Math.round(spd * boost) + (e.spd || 0), ki: Math.round(ki * boost), tec: Math.round(tec * boost), def: Math.round(def * boost), iq, guard: 0, ko: false, lvl, dealt: 0, kos: 0, fort: 0,
    pe: e, endure: e.endure || 0, revive: e.revive || 0, firstNull: e.firstNull || 0, hitsTaken: 0, turns: 0, rage: 0, shieldHp: e.shield ? Math.round(hp * e.shield / 100) : 0, burn: 0, burnT: 0, attacks: 0, ultFired: 0, ultDodge: e.ultDodge || 0, sealed: 0, opened: 0, arise: 0 }
  if (e.emperor) { f.pwr = Math.round(f.pwr * 1.1); f.ki = Math.round(f.ki * 1.1); f.def = Math.round(f.def * 1.1) }
  return f
}
function drawArt(f, s) {
  // the fighter's role nudges which arts show up (fighters strike, supports blast/guard)
  const r = rnd(s), role = f.card.role
  if (r < .14) return 'special'
  if (r < (role === 'TANK' || role === 'SUPPORT' ? .34 : .24)) return 'guard'
  if (r < (role === 'SHOOTER' || role === 'SUPPORT' ? .64 : .52)) return 'blast'
  return 'strike'
}
// ---- shared dice for live PvP: each side rolls from its own seeded stream, identical on both devices ----
const rnd = s => { if (!s || s.rngS == null) return Math.random(); const a = s.rngS = (s.rngS + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
function newSide(cards) { return { team: cards.map(c => fighter(c)), active: 0, ki: 4, gauge: 0, hand: [], switched: false, seq: [] } }
const act = s => s.team[s.active]
const alive = s => s.team.filter(f => !f.ko)
const PE = f => (f && !f.sealed && f.pe) || {}
let PASLOG = null // events the UI shows when a passive triggers
const pasNote = (f, extra) => { if (PASLOG && f && f.card && f.card.pas) PASLOG.push({ f, name: f.card.pas.n, extra }) }
// bench passives: everyone waiting on the bench helps the active fighter
const PASSIVE = { SUPPORT: ['heal', 4, 'MEDIC'], TANK: ['dr', 6, 'BULWARK'], ASSASSIN: ['crit', 4, 'KILLER INSTINCT'], FIGHTER: ['dmg', 3, 'BATTLE CRY'], SHOOTER: ['gauge', 5, 'SPOTTER'], STRIKER: ['gauge', 5, 'SPOTTER'] }
function passives(s) {
  const p = { heal: 0, dr: 0, crit: 0, dmg: 0, gauge: 0 }
  s.team.forEach((f, i) => { if (i === s.active || f.ko) return; const q = PASSIVE[f.card.role]; if (q) p[q[0]] += q[1] })
  p.dr = Math.min(p.dr, 18); p.dmg = Math.min(p.dmg, 12); p.crit = Math.min(p.crit, 12); p.heal = Math.min(p.heal, 12); p.gauge = Math.min(p.gauge, 15)
  return p
}
function drawOne(s) { if (s.deck) { if (!s.pile || !s.pile.length) { s.pile = []; for (const [k, v] of Object.entries(s.deck)) for (let i = 0; i < v; i++) s.pile.push(k); for (let i = s.pile.length - 1; i > 0; i--) { const j = Math.floor(rnd(s) * (i + 1)); [s.pile[i], s.pile[j]] = [s.pile[j], s.pile[i]] } } return s.pile.pop() } return drawArt(act(s), s) }
const ATTACK_ARTS = ['strike', 'blast', 'special', 'burst']
function refill(s) {
  while (s.hand.length < HAND) s.hand.push(drawOne(s))
  // never get stuck: a hand with no attacks swaps its oldest card for a fresh draw (up to 3 tries)
  for (let t = 0; t < 3 && !s.hand.some(a => ATTACK_ARTS.includes(a)); t++) { s.hand.shift(); s.hand.push(drawOne(s)) }
}
function hit(att, def, base, stat, pierce, A, D, kind) {
  const pa = A ? passives(A) : {}, pd = D ? passives(D) : {}, ea = PE(att), ed = ea.antiKit ? {} : PE(def) // Toji: enemy defensive kit is cancelled
  // defensive dodges / nullifies first
  if (def.cylinder && A !== D) { def.cylinder = 0; const r = Math.round(base * (stat / 80) * (100 / (60 + att.def * .5)) * 1.2); att.hp = Math.max(0, att.hp - r); if (att.hp <= 0) att.ko = true; att.taken = (att.taken || 0) + r; pasNote(def, 'MAGIC CYLINDER · ' + r.toLocaleString() + ' REFLECTED'); return { dmg: 0, crit: false, mu: 1, miss: 'REFLECTED' } }
  if (def.firstNull > 0 && !ea.antiKit) { def.firstNull--; pasNote(def, 'NULLIFIED'); return { dmg: 0, crit: false, mu: 1, miss: 'NULLIFIED' } }
  if (kind === 'ult' && def.ultDodge > 0) { def.ultDodge--; pasNote(def, 'ERASED'); return { dmg: 0, crit: false, mu: 1, miss: 'ERASED' } }
  if (ed.dodge && rnd(A || D) * 100 < ed.dodge) { pasNote(def, 'DODGE'); return { dmg: 0, crit: false, mu: 1, miss: 'DODGE' } }
  if (ea.onePunch && kind === 'strike' && def.card.r !== 'X' && rnd(A || D) * 100 < ea.onePunch) { const d0 = def.hp; def.hp = 0; def.ko = true; att.kos++; att.dealt += d0; pasNote(att, 'ONE PUNCH'); return { dmg: d0, crit: true, mu: 1 } }
  const crit = rnd(A || D) < .08 + att.tec / 1200 + (pa.crit || 0) / 100 + (ea.crit || 0) / 100 || (ea.every3crit && (att.attacks + 1) % 3 === 0)
  const mu = matchup(att, def)
  let dmg = base * (stat / 80) * (100 / (60 + def.def * .5 * (1 - (def.shred || 0) / 100))) * (0.92 + rnd(A || D) * .16) * (crit ? (ea.critMult || 1.5) : 1) * mu
  const tagB = att.card.tag ? kitNum(att.card, /\+(\d+)% damage/) : 0; if (tagB) dmg *= 1 + tagB / 100
  // attacker passive multipliers
  // Aokiji cancels the stage bonus when he takes the hit.
  const worldMonarch = ed.stopWorldMonarch ? (ea.worldMonarch || 0) : 0
  let m = 1 + ((ea.dmg || 0) - worldMonarch) / 100 + (att.rage || 0) / 100 + (att.arise || 0) / 100
  if (ea.ramp) m += Math.min(ea.rampMax || 99, ea.ramp * att.turns) / 100
  if (ea.stack) m += Math.min(ea.stackMax || 99, ea.stack * att.hitsTaken) / 100
  if (ea.dmgLow && att.hp / att.max * 100 < (ea.lowAt || 50)) m += ea.dmgLow / 100
  if (ea.ablaze && att.hp / att.max < .3) m += ea.ablaze / 100
  if (ea.exec && def.hp / def.max < .4) { m += ea.exec / 100; pasNote(att, 'EXECUTE +' + ea.exec + '%') }
  if (ea.vsHigh && def.card.ovr > att.card.ovr) m += ea.vsHigh / 100
  if (ea.vsAnime && def.card.anime === ea.vsAnime) m += ea.vsAnimeB / 100
  if (ea.rika) { m += ea.rika / 100; pasNote(att, 'RIKA +' + ea.rika + '%') }
  if (ea.blackflash && rnd(A || D) * 100 < ea.blackflash) { m *= 2.5; pasNote(att, "BLACK FLASH") }
  const isSpecialOrUltimate = kind === 'special' || kind === 'ult'
  if (ed.weakTo) {
    const hitsWeakness = ed.weakTo.some(t => tagsOf(att.card).includes(t)) ||
      (ed.championWeakness && ea.championWeakness && isSpecialOrUltimate)
    if (hitsWeakness) { m += (ed.weakB || 50) / 100; att.hitWeak = 1 }
    else m -= (ed.resist || 0) / 100
  }
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
  if (ea.wheel) m += Math.min(32, 8 * att.hitsTaken) / 100
  dmg *= m
  if (pa.dmg) dmg *= 1 + pa.dmg / 100
  if (pd.dr) dmg *= 1 - pd.dr / 100
  if (ed.dr && !ea.trueDmg) { dmg *= 1 - ed.dr / 100; if (ed.dr >= 10) pasNote(def, '-' + ed.dr + '% DMG') }
  if (worldMonarch) { dmg *= .6; pasNote(def, 'ICE WALL · -40% DMG') }
  if (ed.adapt && !ea.trueDmg) dmg *= 1 - Math.min(ed.adaptMax || 30, ed.adapt * def.hitsTaken) / 100
  if (ed.wheel) { const seen = def.wheelSeen || (def.wheelSeen = {}); dmg *= 1 - Math.min(48, 12 * def.hitsTaken) / 100; if (seen[kind]) dmg *= .8; else seen[kind] = 1; if (def.hitsTaken < 4) pasNote(def, def.hitsTaken === 3 ? 'FULLY ADAPTED' : 'WHEEL TURNS · ' + (def.hitsTaken + 1)) }
  if (def.fort) dmg *= .7
  const pierceAll = pierce || ea.pierce || (ea.wheel && att.hitsTaken >= 4) || (kind === 'strike' && ea.pierceStrike) || (kind === 'special' && ea.pierceSpec)
  if (def.guard) { if (!pierceAll) dmg *= ed.guardStrong ? 1 - ed.guardStrong / 100 : .5; def.guard = 0 }
  dmg = Math.max(1, Math.round(dmg))
  if (def.shieldHp > 0) { const s2 = Math.min(def.shieldHp, dmg); def.shieldHp -= s2; dmg -= s2; if (s2) pasNote(def, 'SHIELD') }
  def.hp = Math.max(0, def.hp - dmg); if (def.hp < 1) def.hp = 0; att.dealt += dmg; def.hitsTaken++
  // on-hit passives
  if (ea.drain && !ea.noHeal) att.hp = Math.min(att.max, att.hp + Math.round(dmg * ea.drain / 100))
  if (ed.reflect && dmg > 0 && !(ea.pierceReflect && isSpecialOrUltimate)) { const rf = Math.round(dmg * ed.reflect / 100); att.hp = Math.max(1, att.hp - rf); pasNote(def, 'REFLECT ' + rf) }
  if (ed.thorns) att.hp = Math.max(1, att.hp - Math.round(att.max * ed.thorns / 100))
  if (ea.shred) def.shred = Math.min(30, (def.shred || 0) + ea.shred)
  if (ea.burn) { def.burn = Math.max(def.burn, ea.burn); def.burnT = 3 }
  if (ea.energyBurn && D) D.ki = Math.max(0, D.ki - ea.energyBurn)
  if (ea.freeze && rnd(A || D) * 100 < ea.freeze) { def.frozen = 1; pasNote(att, 'FROZEN') }
  if (ea.gaugeDeny) def.gaugeDeny = ea.gaugeDeny
  if (ed.bigHitHeal && dmg > def.max * .2 && def.hp > 0) def.hp = Math.min(def.max, def.hp + Math.round(def.max * ed.bigHitHeal / 100))
  if (ea.recoil) att.hp = Math.max(1, att.hp - Math.round(att.max * ea.recoil / 100))
  // knockouts, with survive / revive passives
  if (def.hp === 0 && !def.ko) {
    if (ea.noSurvive && (def.endure > 0 || def.revive > 0 || (ed.ablaze && !def.ablazeUsed))) { def.endure = 0; def.revive = 0; def.ablazeUsed = 1; pasNote(att, 'NO SECOND CHANCES') }
    if (def.endure > 0) { def.endure--; def.hp = 1; pasNote(def, 'ENDURED'); if (ed.endureRage) def.rage = (def.rage || 0) + ed.endureRage; if (ed.endureEnergy && D) D.ki = Math.min(KI_MAX, D.ki + ed.endureEnergy) }
    else if (!ea.noSurvive && D && D.angel && D.angel !== def) { D.angel.angelUsed = 1; D.angel = null; def.hp = 1; pasNote(def, 'SAVED') }
    else if (ed.ablaze && !def.ablazeUsed && def.hp / def.max < .3) { def.ablazeUsed = 1; def.hp = 1; pasNote(def, 'HEART ABLAZE') }
    else if (def.revive > 0) { def.hp = Math.round(def.max * def.revive / 100); def.revive = 0; if (ed.jackpot) { def.rage = (def.rage || 0) + ed.jackpot; pasNote(def, 'JACKPOT! FULLY HEALED') } else pasNote(def, 'REVIVED') }
    else { def.ko = true; att.kos++; if (ea.arise) att.arise = (att.arise || 0) + ea.arise; if (ea.koHeal) att.hp = Math.min(att.max, att.hp + Math.round(att.max * ea.koHeal / 100)) }
  }
  if (ea.jackpot && !att.ko && rnd(A || D) < .12) { att.hp = Math.min(att.max, att.hp + Math.round(att.max * .25)); pasNote(att, 'JACKPOT ROLL · +25% HP') }
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
    else if (art === 'cleanse') { a.burnT = 0; a.frozen = 0; a.doom = 0; a.guard = 1; ev.tactic = 'CLEANSED · GUARD UP' }
    else if (art === 'senzu') { const h = a.max - a.hp; a.hp = a.max; a.burnT = 0; a.frozen = 0; ev.tactic = 'SENZU BEAN · +' + h.toLocaleString() + ' HP' }
    else if (art === 'cylinder') { a.cylinder = 1; ev.tactic = 'TRAP SET · MAGIC CYLINDER' }
    else if (art === 'rumble') { const h = Math.round(a.max * .35); a.hp = Math.min(a.max, a.hp + h); me.chargeNext = (me.chargeNext || 0) + 25; ev.tactic = 'RUMBLE BALL · +' + h.toLocaleString() + ' HP · NEXT +25%' }
    else if (art === 'finger') { a.hp = Math.max(1, a.hp - Math.round(a.max * .1)); me.chargeNext = (me.chargeNext || 0) + 60; ev.tactic = 'CURSED FINGER · NEXT ATTACK +60%' }
    else if (art === 'deathnote') { d.doom = 3; ev.tactic = 'DEATH NOTE · ' + d.card.name + ' HAS 3 TURNS' }
    else if (art === 'hogyoku') { a.endure = (a.endure || 0) + 1; for (const k of ['pwr', 'ki', 'def']) a[k] = Math.round(a[k] * 1.15); ev.tactic = 'HOGYOKU · EVOLVED' }
    else if (art === 'wing') { const f = me.team.find(x => x.ko); if (f) { f.ko = false; f.hp = Math.round(f.max * .4); ev.tactic = 'RAINBOW WING · ' + f.card.name + ' REVIVED' } else ev.tactic = 'RAINBOW WING · NO ONE TO REVIVE' }
    else if (art === 'scroll') { d.sealed = 1; ev.tactic = 'SEALED · ' + d.card.name + "'S PASSIVE" }
    else if (art === 'clock') { foe.skip = 1; ev.tactic = 'TIME STOP · ENEMY LOSES A TURN' }
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
    if (ea.doubleStrike && rnd(me) * 100 < ea.doubleStrike && !d.ko) { ev.hits.push({ t: d, ...hit(a, d, 260 * chain * .6, a.pwr, false, me, foe, 'strike') }); pasNote(a, 'DOUBLE STRIKE') }
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
  me.gauge = 0; me.seq = []; me.ultTurn = B.turn
  const [uname] = ultOf(a.card), ev = { who, art: 'ultimate', move: a.card.mv, ult: uname, hits: [] }
  const awk = !!(a.card.maxed || (a.card.dia || 0) >= 7); if (awk) { ev.awakened = 1; me.ki = Math.min(KI_MAX, me.ki + 2); a.hp = Math.min(a.max, a.hp + Math.round(a.max * .15)) }
  const base = pctOf(a.card) * 6 * (awk ? 1.35 : 1), stat = Math.max(a.pwr, a.ki), pierce = /Ignores Guard/.test(kitTxt(a.card))
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
// ===== smart Auto brain (level 5): estimates damage, looks for lethal, plans energy =====
function estHit(att, def, base, stat, pierce) {
  const ea = PE(att)
  let d = base * (stat / 80) * (100 / (60 + def.def * .5)) * matchup(att, def) * (1 + (ea.dmg || 0) / 100 + (att.rage || 0) / 100)
  if (att.card.tag) d *= 1.18
  if (def.guard && !pierce) d *= .5
  if (ea.exec && def.hp / def.max < .4) d *= 1 + ea.exec / 100
  return d
}
function estArt(me, foe, a, chainN) {
  const at = act(me), d = act(foe), chain = 1 + Math.min(.32, Math.max(0, chainN) * .08), pierce = /Ignores Guard/.test(kitTxt(at.card)), ch = me.chargeNext ? 1 + me.chargeNext / 100 : 1
  if (a === 'strike') return estHit(at, d, 260 * chain * ch, at.pwr, false)
  if (a === 'blast') return estHit(at, d, 420 * chain * ch, at.ki, false)
  if (a === 'special') return estHit(at, d, pctOf(at.card) * 3.2 * chain * ch * (isAoe(at.card) ? .75 : 1), Math.max(at.pwr, at.ki), pierce)
  if (a === 'burst') return estHit(at, d, 210 * me.ki * ch, Math.max(at.pwr, at.ki), false)
  return 0
}
function smartTurn(B, who) {
  const me = B[who], foe = B[who === 'ai' ? 'you' : 'ai'], evs = []
  const alive = s => s.team.map((f, i) => [f, i]).filter(([f]) => !f.ko)
  // 1) switching: escape a bad matchup or save a nearly dead fighter for later
  if (!me.switched) {
    const cur = act(me), opp = act(foe), bench = alive(me).filter(([, i]) => i !== me.active)
    const score = f => (matchup(f, opp) - matchup(opp, f)) * 2 + f.hp / f.max + (f.pwr + f.ki) / 400
    const best = bench.sort((x, y) => score(y[0]) - score(x[0]))[0]
    const dying = cur.hp / cur.max < .2 && foe.gauge >= 70
    if (best && ((matchup(opp, cur) > 1 && matchup(best[0], opp) >= 1 && best[0].hp / best[0].max > .45) || (dying && best[0].hp / best[0].max > .5) || score(best[0]) - score(cur) > 1.4)) {
      me.active = best[1]; me.switched = true; evs.push({ who, swap: true })
    }
  }
  let guarded = false
  for (let n = 0; n < 10; n++) {
    const mine = act(me), opp = act(foe); if (!mine || !opp || mine.ko || opp.ko) break
    // 2) ultimate: fire it when it can kill, the foe isn't guarding, or the foe's ult is about to land
    if (me.gauge >= GAUGE_MAX) {
      const ultD = estHit(mine, opp, pctOf(mine.card) * 6, Math.max(mine.pwr, mine.ki), /Ignores Guard/.test(kitTxt(mine.card)))
      if (ultD >= opp.hp || !opp.guard || foe.gauge >= 85 || opp.cylinder) { const e = ultimate(B, who); if (e) { evs.push(e); continue } }
    }
    const hand = me.hand.map((a, i) => [a, i]), can = a => hand.find(([x]) => x === a && ARTS[x].cost <= me.ki && !(x === 'burst' && me.ki < 2))
    const chainN = me.seq.length, dmgOf = a => estArt(me, foe, a, chainN)
    // 3) pop a Magic Cylinder trap with the cheapest hit first
    if (opp.cylinder) { const p = can('strike') || can('blast'); if (p) { const e = playArt(B, who, p[1]); if (e) { evs.push(e); continue } } }
    // 4) emergency items / heals
    const hpP = mine.hp / mine.max, threat = foe.gauge >= 85 || estHit(opp, mine, pctOf(opp.card) * 3.2, Math.max(opp.pwr, opp.ki), false) > mine.hp
    let pick = null
    if (hpP < .35 && can('senzu')) pick = can('senzu')
    else if (threat && !mine.cylinder && can('cylinder')) pick = can('cylinder')
    else if (hpP < .45 && can('heal')) pick = can('heal')
    else if (mine.burnT > 0 && hpP < .6 && can('cleanse')) pick = can('cleanse')
    else if (can('transfer') && me.ki <= KI_MAX - 2) pick = can('transfer')
    else if (can('deathnote') && !opp.doom && opp.hp / opp.max > .3) pick = can('deathnote')
    else if (can('clock') && !foe.skip) pick = can('clock')
    else if (can('scroll') && !opp.sealed && opp.pe && Object.keys(opp.pe).length) pick = can('scroll')
    else if (can('wing') && me.team.some(x => x.ko)) pick = can('wing')
    else if (can('hogyoku') && hpP < .5 && !mine.endure) pick = can('hogyoku')
    else if (can('rumble') && hpP < .6) pick = can('rumble')
    else if (can('finger') && hpP > .4 && !me.chargeNext && (can('special') || me.ki >= 3)) pick = can('finger')
    if (pick) { const e = playArt(B, who, pick[1]); if (e) { evs.push(e); continue } }
    // 5) lethal check: best single attack that kills right now
    const atks = ['special', 'burst', 'blast', 'strike'].map(a => [a, can(a)]).filter(([, p]) => p)
    if (!atks.length) { if (!guarded && !mine.guard && can('guard')) { guarded = true; const e = playArt(B, who, can('guard')[1]); if (e) { evs.push(e); continue } } break }
    const kill = atks.filter(([a]) => dmgOf(a) >= opp.hp + (opp.shieldHp || 0)).sort((x, y) => ARTS[x[0]].cost - ARTS[y[0]].cost)[0]
    if (kill) { const e = playArt(B, who, kill[1][1]); if (e) { evs.push(e); continue } }
    // 6) charge before a big hit
    if (can('charge') && (can('special') || (can('burst') && me.ki >= 5)) && me.ki >= 1 + (can('special') ? ARTS.special.cost : 2) && !me.chargeNext) { const e = playArt(B, who, can('charge')[1]); if (e) { evs.push(e); continue } }
    // 7) guard against an incoming ultimate when hurt
    if (!guarded && !mine.guard && threat && hpP < .6 && can('guard')) { guarded = true; const e = playArt(B, who, can('guard')[1]); if (e) { evs.push(e); continue } }
    // 8) best damage per energy, but don't waste energy that would afford a special next turn
    const best = atks.filter(([a]) => a !== 'burst' || me.ki >= 5).map(([a, p]) => [a, p, dmgOf(a) + (a === 'special' ? 1e6 : 0)]).sort((x, y) => y[2] - x[2])
    if (!best.length) break
    const specialNext = me.hand.includes('special') && !can('special')
    let choice = best[0]
    const e = playArt(B, who, choice[1][1]); if (!e) break; evs.push(e)
  }
  return evs
}
function planTurn(B, level, who = 'ai') {
  if (level >= 5) return smartTurn(B, who)
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
      const si = me.hand.indexOf('senzu'), yi = me.hand.indexOf('cylinder')
      if (si >= 0 && me.ki >= 2 && mine.hp / mine.max < .35) pick = ['senzu', si]
      else if (yi >= 0 && me.ki >= 2 && !mine.cylinder && mine.hp / mine.max < .7) pick = ['cylinder', yi]
      else if ((pick = (() => { const IU = { rumble: mine.hp / mine.max < .6, finger: mine.hp / mine.max > .4, deathnote: 1, hogyoku: mine.hp / mine.max < .5, wing: me.team.some(x => x.ko), scroll: 1, clock: 1 }; for (const k in IU) { const ii = me.hand.indexOf(k); if (ii >= 0 && IU[k] && me.ki >= ARTS[k].cost) return [k, ii] } return null })())) { }
      else if (hi >= 0 && me.ki >= 2 && mine.hp / mine.max < .5) pick = ['heal', hi]
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
// background art arenas: each one powers up a group (+5% HP and stats, both sides)
const ARENA_BONUS = { 'grand-line': 'S:OP', 'blade-graveyard': 'Swordsmen', 'sky-kingdom': 'Gods & Kings', 'cbeccd318d5abbd98cde3d9b024f21bc': 'S:JJK', 'images': 'Pirates', 'images2': 'S:DS', 'images3': 'S:NAR', 'images4': 'Villains' }
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
  if (stage.live) return stage.live.oppTeam
  if (stage.team && stage.team.length) { const t = stage.team.map(k => X.BYKEY[k]).filter(Boolean); if (t.length) return t.slice(0, 6) }
  const pool = X.POOL.slice().sort((a, b) => Math.abs(a.ovr - stage.rating) - Math.abs(b.ovr - stage.rating))
  const near = pool.slice(0, Math.max(14, Math.round(pool.length * .25)))
  const out = []; while (out.length < 6 && near.length) out.push(near.splice(Math.floor(Math.random() * near.length), 1)[0])
  return out.sort((a, b) => b.ovr - a.ovr)
}

let MODE = 'camp'
const mastL = k => { const x = (X.P.mast || {})[k] || 0, T = X.ST().mastT || [0, 60, 180, 400, 750]; return T.filter(t => x >= t).length - 1 }
function teamFrom(main, rating) {
  const used = new Set(main.map(c => c.key)), out = main.slice(0, 6)
  const rest = X.POOL.filter(c => !used.has(c.key)).sort((a, b) => Math.abs(a.ovr - rating) - Math.abs(b.ovr - rating))
  while (out.length < 6 && rest.length) out.push(rest.splice(Math.floor(Math.random() * Math.min(10, rest.length)), 1)[0])
  return out.map(c => c.key)
}
function modeTabs(el) {
  const { h } = X, t = h('div', 'mtabs')
  for (const [k, n] of [['camp', 'CAMPAIGN'], ['live', '⚔️ LIVE PVP'], ['redzone', '💀 DEAD ZONE'], ['villain', '😈 VILLAINS'], ['rift', '🌀 RIFT'], ['raid', 'RAID'], ['ranked', 'RANKED'], ['boss', 'DAILY BOSS'], ['tower', 'TOWER'], ['arcs', 'STORY ARCS'], ['event', 'EVENT'], ['pass', 'SEASON PASS'], ['story', '📖 HOW TO PLAY']]) {
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
    <div class="cx-slot"></div><div class="rk-stats"><span><b>${me.best.toLocaleString()}</b>BEST DAMAGE</span><span><b>${left}/${BD.tries}</b>ATTEMPTS LEFT</span><span><b>${me.total.toLocaleString()}</b>TOTAL TODAY</span></div></div>`
  const go = h('button', 'btn gold big rk-go', left > 0 ? 'FIGHT THE BOSS' : 'COME BACK TOMORROW'); go.disabled = !ok || left < 1
  go.onclick = () => go2({ mode: 'boss', id: 0, boss: BD.hpMult, bossAb: BD.ab, label: 'Daily Boss · ' + c.name, name: c.name, level: 5, team: [BD.key], arena: ARENA_KEYS[BD.day % ARENA_KEYS.length] })
  hero.querySelector('.bh-info').append(go); hero.querySelector('.cx-slot').append(cxBtn(() => [c], 'Daily Boss · ' + c.name)); el.append(hero)
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
// ================= COUNTER TIPS =================
const kitT = c => (c.tx || []).join(' ')
export function counterPicks(enemy, n = 6) {
  const E = enemy.filter(Boolean), EA = {}, own = X.P.club.cards
  for (const e of E) EA[e.anime] = (EA[e.anime] || 0) + 1
  const pe = c => (c.pas && c.pas.e) || {}
  const surv = E.filter(e => pe(e).endure || pe(e).revive || pe(e).ablaze).map(e => e.name), big = E.filter(e => Object.keys(pe(e)).length >= 2 && e.ovr >= 88).map(e => e.name)
  const walls = E.filter(e => pe(e).dr || pe(e).guardStrong || pe(e).shield || e.role === 'TANK').map(e => e.name), healers = E.filter(e => pe(e).teamHeal || pe(e).regen).map(e => e.name)
  const tops = E.slice().sort((x, y) => y.ovr - x.ovr).slice(0, 3)
  const out = []
  for (const c of X.POOL) {
    const e = pe(c), why = []; let s = c.ovr * .4
    const adv = E.filter(x => beats(tOf(c), tOf(x))).length, dis = E.filter(x => beats(tOf(x), tOf(c))).length
    if (adv) { s += adv * 7; why.push('Type beats ' + adv + ' of them') } if (dis) s -= dis * 6
    if (e.vsAnime && EA[e.vsAnime]) { s += 6 * EA[e.vsAnime] + (e.vsAnimeB || 0) / 2; why.push('+' + e.vsAnimeB + '% vs ' + X.ANAME(e.vsAnime)) }
    if (e.noSurvive && surv.length) { s += 18; why.push('Cancels ' + surv.slice(0, 2).join(' & ') + ' surviving KOs') }
    if (e.nullPassive && big.length) { s += 12; why.push('Shuts off ' + big[0] + '\'s passive') }
    if ((/Ignores Guard/.test(kitT(c)) || e.pierce || e.pierceStrike) && walls.length) { s += 6; why.push('Hits through ' + walls[0] + '\'s defence') }
    if (e.firstNull && tops.length) { s += 6; why.push('Blocks the first ' + e.firstNull + ' hits') }
    if (e.wheel) { s += 8; why.push('Adapts and gets tankier every hit') }
    if ((e.exec || e.burst) && healers.length) { s += 5; why.push('Finishes healers like ' + healers[0]) }
    if (e.teamHeal) { s += 4; why.push('Heals your team every turn') }
    if (e.slow && E.length) { s += 3; why.push('Drains their Energy') }
    if (!why.length) continue
    out.push({ c, s, why: why.sort((a, b) => /^(Type|\+)/.test(a) - /^(Type|\+)/.test(b)).slice(0, 2), own: !!own[c.key] })
  }
  const seen = new Set(); return out.sort((x, y) => y.s - x.s).filter(o => !seen.has(o.c.name) && seen.add(o.c.name)).slice(0, n)
}
export function counterSheet(enemy, title) {
  const { h } = X, picks = counterPicks(enemy), E = enemy.filter(Boolean)
  const o = h('div', 'cx-ov'); o.onclick = ev => { if (ev.target === o || ev.target.closest('.cx-x')) o.remove() }
  const box = h('div', 'cx-box', `<button class="cx-x">✕</button><small>WHO WORKS WELL · 攻略</small><h3>${title}</h3><p class="cx-foe">vs ${[...new Set(E.map(e => e.name))].join(', ')}</p>`)
  if (!picks.length) box.append(h('p', 'cx-foe', 'No standout counters. Bring your strongest team.'))
  for (const p of picks) { const row = h('div', 'cx-row' + (p.own ? ' own' : '')); const im = X.cardImg(p.c, 200); row.append(im, h('div', 'cx-tx', `<b>${p.c.name}</b><em>${p.c.ver} · Grade ${p.c.ovr >= 98 ? 'Ω' : p.c.ovr >= 94 ? 'Z' : p.c.ovr >= 88 ? 'S' : p.c.ovr >= 81 ? 'A' : p.c.ovr >= 72 ? 'B' : 'C'}</em>${p.why.map(w => '<span>✓ ' + w + '</span>').join('')}<i>${p.own ? 'IN YOUR CLUB' : 'NOT OWNED'}</i>`)); box.append(row) }
  o.append(box); document.body.append(o)
}
const cxBtn = (enemyFn, title) => { const b = X.h('button', 'cx-btn', '🎯 COUNTERS'); b.onclick = ev => { ev.stopPropagation(); counterSheet(enemyFn(), title) }; return b }
// ================= STORY CAMPAIGN =================
const byName = n => X.POOL.filter(c => c.name === n).sort((a, b) => b.ovr - a.ovr)[0]
function scene(lines, title, bg, done, cast) {
  const { h } = X, o = h('div', 'scn'); let i = 0
  o.innerHTML = `<div class="scn-bg" style="background-image:url('${bg || ''}')"></div><div class="scn-top"><b>${title}</b><button class="btn dark sm scn-skip">SKIP ›</button></div><div class="scn-who"></div><div class="scn-box"><small></small><p></p><em>TAP TO CONTINUE</em></div>`
  const show = () => { const [who, t, speaker] = lines[i], c = cast ? cast.get(who) : byName(who); o.querySelector('.scn-who').style.backgroundImage = c ? `url("${c.url}")` : 'none'; o.querySelector('.scn-who').style.setProperty('--fy', Math.round((c && c.fy != null ? c.fy : .22) * 100) + '%'); o.querySelector('.scn-box small').textContent = speaker || (c && cast ? c.name : who); o.querySelector('.scn-box p').textContent = t; o.querySelector('.scn-who').classList.remove('in'); void o.offsetWidth; o.querySelector('.scn-who').classList.add('in') }
  const end = () => { o.remove(); done() }
  o.onclick = e => { if (e.target.closest('.scn-skip')) return end(); i++; i >= lines.length ? end() : show() }
  document.body.append(o); show()
}
// ================= RAID WEEKENDS =================
let RAIDCACHE = { id: null, at: 0, data: null }
function raidPage(el, ok) {
  const { h } = X, R = X.ST().raid; if (!R) return
  const c = X.BYKEY[R.key], me = R.me, left = R.tries - me.tries
  const hero = h('section', 'bosshero raidhero'); if (c) { hero.style.setProperty('--art', `url("${c.url}")`); hero.style.setProperty('--fx', '50%'); hero.style.setProperty('--fy', Math.round((c.fy ?? .25) * 100) + '%') }
  hero.innerHTML = `<i class="bh-art"></i><div class="bh-info"><small>レイド · ${R.active ? 'ENDS IN <b class="timer" data-until="' + R.ends + '"></b>' : 'NEXT RAID IN <b class="timer" data-until="' + R.next + '"></b>'}</small><h2>RAID WEEKEND</h2>
    <div class="bh-name"><b>${c ? c.name : 'RAID BOSS'}</b><span>${c ? c.ver : ''} · SHARED BY EVERY PLAYER</span></div>
    <div class="rd-hp"><i><s style="width:100%"></s></i><span>Loading boss HP…</span></div>
    <div class="bh-ab"><b>RAID SKILL · ${R.ab.name}</b><span>${R.ab.d}</span></div>
    <p>Every player fights the same boss from Friday to Sunday. All damage is added together. Bring it to 0 before Monday and everyone who hit it shares the victory reward: 2 Premium Drops, 20,000 coins and 5 Training Tickets.</p>
    <div class="rk-stats"><span><b>${me.total.toLocaleString()}</b>YOUR DAMAGE</span><span><b>${me.best.toLocaleString()}</b>BEST HIT</span><span><b>${R.active ? left + '/' + R.tries : '—'}</b>ATTEMPTS TODAY</span></div></div>`
  const go = h('button', 'btn gold big rk-go', !R.active ? 'RAID OPENS FRIDAY' : left > 0 ? 'ATTACK THE RAID BOSS' : 'COME BACK TOMORROW'); go.disabled = !ok || !R.active || left < 1
  go.onclick = () => go2({ mode: 'raid', id: 0, boss: R.hpMult, bossAb: R.ab, label: 'Raid · ' + (c ? c.name : 'Boss'), name: c ? c.name : 'Raid Boss', level: 5, team: [R.key], raidId: R.id })
  hero.querySelector('.bh-info').append(go)
  const win = h('button', 'btn green big', 'CLAIM RAID VICTORY'); win.style.display = 'none'; hero.querySelector('.bh-info').append(win)
  el.append(hero)
  el.append(h('div', 'sec', '<h3>YOUR DAMAGE REWARDS</h3><span class="muted" style="font-weight:700;font-size:12px">your total over the whole weekend</span>'))
  const g = h('div', 'rk-tiers'); R.rw.forEach((r, i) => { const done = me.got.includes(i); g.append(h('div', 'rk-t' + (done ? ' got on' : ''), `<b>${r.at.toLocaleString()}</b><small>DAMAGE</small><span>${done ? '✓ ' : ''}${r.label}</span>`)) }); el.append(g)
  el.append(h('div', 'sec', '<h3>TOP RAIDERS</h3>'))
  const lb = h('div', 'rd-lb', '<p class="muted">Loading…</p>'); el.append(lb)
  const paint = d => {
    const hp = Math.max(0, R.hp - d.sum), pct = hp / R.hp * 100, bar = hero.querySelector('.rd-hp')
    if (bar) bar.innerHTML = `<i><s style="width:${pct.toFixed(1)}%"></s></i><span>${hp <= 0 ? 'DEFEATED!' : hp.toLocaleString() + ' / ' + R.hp.toLocaleString() + ' HP'}</span>`
    lb.innerHTML = d.top.length ? d.top.map((p, i) => `<div class="rd-row"><b>${i + 1}</b><span>${String(p.name || 'Player').replace(/[<>&]/g, '')}</span><em>${(p.dmg || 0).toLocaleString()}</em></div>`).join('') : '<p class="muted">No hits yet. Be the first!</p>'
    if (hp <= 0 && me.total > 0 && !me.win) { win.style.display = ''; win.onclick = async () => { const r = await X.act('raidWin', { globalDown: 1 }); if (!r.error) X.go('battle') } }
  }
  if (RAIDCACHE.id === R.id && Date.now() - RAIDCACHE.at < 20000 && RAIDCACHE.data) paint(RAIDCACHE.data)
  X.raidStatus(R.id).then(d => { RAIDCACHE = { id: R.id, at: Date.now(), data: d }; if (lb.isConnected) paint(d) }).catch(() => { lb.innerHTML = '<p class="muted">Could not reach the raid server.</p>'; const bar = hero.querySelector('.rd-hp span'); if (bar) bar.textContent = 'Boss HP unavailable right now' })
}
function campTeam(specs) {
  const used = new Set(), out = []
  for (const sp of specs) { const [n, o] = sp.split('#'), list = X.POOL.filter(c => c.name === n && !used.has(c.key)).sort((a, b) => b.ovr - a.ovr), c = (o && list.find(x => x.ovr === +o)) || list[0]; if (c) { used.add(c.key); out.push(c.key) } }
  return out
}
const CHARD = {}
let DZSEL = null
// ================= LIVE PVP LOBBY =================
const LIVEST = { code: null, unsub: null, err: '' }
function myLiveData() { const ST = X.ST(), D = (ST.decks || [])[ST.deckOn || 0]; return { team: X.P.team.filter(Boolean).map(k => X.eff(X.BYKEY[k])).filter(Boolean), deck: (D && D.c) || null } }
function startLive(m, role) {
  const me = X.ACC.me().uid, my = role === 'h' ? { team: m.hostTeam, deck: m.hostDeck } : { team: m.guestTeam, deck: m.guestDeck }
  const op = role === 'h' ? { team: m.guestTeam, deck: m.guestDeck, name: m.guestName, uid: m.guest } : { team: m.hostTeam, deck: m.hostDeck, name: m.hostName, uid: m.host }
  startBattle({ n: 0, pvp: true, uid: op.uid, name: op.name, level: 0, label: 'Live PvP · vs ' + op.name, live: { code: m.code, role, seed: m.seed, me, myTeam: my.team, myDeck: my.deck, oppTeam: op.team, oppDeck: op.deck, oppName: op.name, oppUid: op.uid } })
}
function livePage(el, ok) {
  const { h } = X, link = c => location.origin + location.pathname + '?pvp=' + c
  el.append(h('section', 'bhero live-hero', `<div><span class="sh-tag">⚔️ LIVE PVP</span><h2>BATTLE A MATE LIVE</h2><p>Real-time battle against a friend. You both play your own turns with a <b>45-second timer</b>. Your current team and Arts deck are used. Clashes are off in PvP, everything else (auras, links, transformations, items) works.</p></div>`))
  if (!ok) return
  if (LIVEST.code) {
    const c = LIVEST.code, box = h('div', 'panel pad live-wait', `<small>MATCH CODE</small><b class="live-code">${c}</b><p>Send this code or link to your mate. The battle starts as soon as they join.</p><div class="live-row"></div><p class="muted live-dots">Waiting for opponent…</p>`)
    const cp = h('button', 'btn gold', '📋 COPY INVITE LINK'); cp.onclick = async () => { try { await navigator.clipboard.writeText(link(c)); cp.textContent = '✓ COPIED' } catch { prompt('Copy this link:', link(c)) } }
    const sh = h('button', 'btn violet', '📤 SHARE'); sh.onclick = () => { if (navigator.share) navigator.share({ title: 'Anime Ultimate Team', text: 'Fight me live! Code ' + c, url: link(c) }).catch(() => {}); else cp.onclick() }
    const cx = h('button', 'btn dark', 'CANCEL'); cx.onclick = () => { try { LIVEST.unsub && LIVEST.unsub() } catch { } X.ACC.pvpCancel(c); LIVEST.code = null; X.go('battle') }
    box.querySelector('.live-row').append(cp, sh, cx); el.append(box); return
  }
  const row = h('div', 'live-opts')
  const mk = h('div', 'panel pad live-card', '<b>CREATE A MATCH</b><p class="muted">Get a code to send to your mate.</p>'), mb = h('button', 'btn gold big', '⚔️ CREATE MATCH')
  mb.onclick = async () => { mb.disabled = true; try { const d = myLiveData(); const code = await X.ACC.pvpCreate({ hostTeam: d.team, hostDeck: d.deck }); LIVEST.code = code
      LIVEST.unsub = X.ACC.pvpWatch(code, m => { if (m && m.status === 'live' && m.guest && LIVEST.code === code) { try { LIVEST.unsub() } catch { } LIVEST.code = null; startLive({ ...m, code }, 'h') } }); X.go('battle') } catch (e) { LIVEST.err = e.message || String(e); mb.disabled = false; X.go('battle') } }
  mk.append(mb)
  const jn = h('div', 'panel pad live-card', '<b>JOIN A MATCH</b><p class="muted">Type the code your mate sent you.</p>'), inp = h('input', 'live-in'); inp.placeholder = 'CODE'; inp.maxLength = 6; inp.value = new URLSearchParams(location.search).get('pvp') || ''
  const jb = h('button', 'btn violet big', 'JOIN'); jb.onclick = async () => { jb.disabled = true; LIVEST.err = ''; try { const d = myLiveData(); const m = await X.ACC.pvpJoin(inp.value, { guestTeam: d.team, guestDeck: d.deck }); startLive(m, 'g') } catch (e) { LIVEST.err = e.message || String(e); jb.disabled = false; X.go('battle') } }
  jn.append(inp, jb); row.append(mk, jn); el.append(row)
  if (LIVEST.err) el.append(h('p', 'live-err', '⚠ ' + LIVEST.err))
}
const rzTag = t => t.startsWith('S:') ? X.ANAME(t.slice(2)) : t
function redzonePage(el, ok) {
  const { h } = X, ST = X.ST(), ZS = ST.deadzones || []; if (!ZS.length) return
  const Z = ZS.find(z => z.id === DZSEL) || ZS[ZS.length - 1], done = (ST.rzAll || {})[Z.id] || []
  { const t = h('div', 'mtabs dz-tabs'); for (const z of ZS) { const n = ((ST.rzAll || {})[z.id] || []).length, b = h('button', 'mtab' + (z === Z ? ' on' : ''), z.name.toUpperCase() + ' · ' + n + '/' + z.stages.length); b.onclick = () => { DZSEL = z.id; X.go('battle') }; t.append(b) } el.append(t) }
  el.append(h('section', 'bhero rz-hero', `<div><span class="sh-tag">💀 DEAD ZONE · ${Z.sub.toUpperCase()}</span><h2>${Z.name.toUpperCase()}</h2><p>The hardest fights in the game. Every stage has <b>brutal rules</b> and <b>weaknesses</b>: fighters with a weakness tag deal bonus damage, <b>everyone else deals much less</b>. New and strong is not enough. Build for the stage.</p></div><div class="bstat"><b>${done.length}</b><span>/ ${Z.stages.length} CLEARED</span></div>`))
  for (const st of Z.stages) {
    const open = st.n === 1 || done.includes(st.n - 1), clr = done.includes(st.n), boss = X.POOL.filter(c => c.name === st.boss).sort((a, b) => b.ovr - a.ovr)[0], team = campTeam(st.enemy)
    const w = st.reward, rw = [w.coins.toLocaleString() + ' coins', w.premium && w.premium + '× Premium', w.shards && '◆' + w.shards.toLocaleString(), w.tickets && w.tickets + ' Tickets'].filter(Boolean).join(' · ')
    const box = h('section', 'rz-st' + (open ? '' : ' locked') + (clr ? ' done' : '') + (st.final ? ' final' : ''), `<div class="rz-art" style="background-image:url('${boss ? boss.url : ''}')"><span>DZ-${st.n}${st.final ? ' · FINAL' : ''}</span></div>
      <div class="rz-body"><h3>${st.name.toUpperCase()} ${clr ? '<em>✓ CLEARED</em>' : ''}</h3><p class="rz-vs">vs ${st.enemy.join(', ')} · enemy power ×${st.boost}</p>
      <div class="rz-rules">${st.rules.map(r => `<span class="rz-rule"><b>⚠ ${r[0]}</b>${r[1]}</span>`).join('')}</div>
      <div class="rz-weak"><b>WEAK TO</b>${st.weak.map(t => `<span>${rzTag(t)} +${st.weakB}%</span>`).join('')}<i>Everyone else −${st.resist}% damage</i></div>
      <p class="rz-tip">💡 ${st.tip}</p><p class="rz-rw">🎁 First clear: ${rw}</p></div>`)
    const acts = h('div', 'rz-acts'), go = h('button', 'btn gold', open ? (clr ? 'REPLAY' : '💀 ENTER') : '🔒 LOCKED'); go.disabled = !ok || !open
    go.onclick = () => go2({ mode: 'redzone', id: Z.id + ':' + st.n, label: 'Dead Zone · ' + st.name, name: st.name, level: 5, boost: st.boost, team, rules: Object.assign({ weakTo: st.weak, weakB: st.weakB, resist: st.resist }, ...st.rules.map(r => r[2])) })
    acts.append(go, cxBtn(() => team.map(k => X.BYKEY[k]), 'DZ-' + st.n + ' · ' + st.name)); box.querySelector('.rz-body').append(acts); el.append(box)
  }
}
function villainPage(el, ok) {
  { let pend = null; try { pend = JSON.parse(sessionStorage.getItem('vOutro') || 'null') } catch { }
    if (pend) { sessionStorage.removeItem('vOutro'); const C0 = X.ST().vcampP || { stars: {} }, st0 = X.ST().vcamp.stages.find(s => s.n === pend.s); if (st0 && st0.outro && (C0.stars[pend.s] || 0) > 0 && !pend.had) setTimeout(() => scene(st0.outro, 'AFTER · ' + st0.name, null, () => X.go('battle')), 300) } }
  const { h } = X, ST = X.ST(), V = ST.vcamp, C = ST.vcampP || { stars: {} }, boss = X.POOL.filter(c => c.name === V.boss).sort((a, b) => b.ovr - a.ovr)[0]
  el.append(h('section', 'bhero camp-hero villain-hero', `<div><span class="sh-tag">${V.sub.toUpperCase()}</span><h2>😈 ${V.name.toUpperCase()}</h2><p>Play the story from the villains' side. <b>Villain cards on your team get +15% stats</b> in this campaign. Beat the final stage for 2 Premium Drops, ◆3,000 shards and 5 Training Tickets.</p></div><div class="bstat"><b>${Object.values(C.stars).reduce((n, v) => n + v, 0)}</b><span>/ 18 STARS</span></div>`))
  const list = h('div', 'camp-list')
  for (const st of V.stages) {
    const s = C.stars[st.n] || 0, open = st.n === 1 || (C.stars[st.n - 1] || 0) > 0, foe = X.POOL.find(c => c.key === campTeam([st.enemy[0]])[0])
    const row = h('button', 'camp-st' + (s ? ' done' : '') + (open ? '' : ' locked') + (st.boss ? ' boss' : ''), `<span class="cs-art" style="background-image:url('${foe ? foe.url : ''}')"></span><span class="cs-tx"><small>V-${st.n}${st.boss ? ' · BOSS' : ''}</small><b>${st.name}</b><em>vs ${st.enemy.join(', ')}</em></span><span class="cs-stars">${open ? '★'.repeat(s) + '<i>' + '★'.repeat(3 - s) + '</i>' : '🔒'}</span>`)
    row.disabled = !ok || !open
    row.onclick = () => scene(st.scene, 'V-' + st.n + ' · ' + st.name, foe && foe.url, () => {
      try { sessionStorage.setItem('vOutro', JSON.stringify({ s: st.n, had: s > 0 })) } catch { }
      go2({ mode: 'villain', id: st.n, label: 'Villains · ' + st.name, name: st.name, level: st.boss ? 5 : Math.min(5, 2 + Math.floor(st.n / 2)), boost: (st.boss ? 1.45 : 1.15 + st.n * .05), youCat: 'Villains', team: campTeam(st.enemy) })
    })
    list.append(row)
  }
  el.append(list)
}
const fmtT = ms => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + 'h ' + m + 'm' : m + 'm ' + (s % 60) + 's' }
function riftTeam(R) {
  const inv = campTeam([R.invader]), used = new Set(inv)
  const locals = X.POOL.filter(c => c.anime === R.world && !used.has(c.key)).sort((a, b) => ((b.cat || []).includes('Villains') - (a.cat || []).includes('Villains')) || b.ovr - a.ovr)
  const out = inv.slice(); for (const c of locals) { if (out.length >= 6) break; if (!out.some(k => X.BYKEY[k].name === c.name)) out.push(c.key) }
  return out
}
function riftPage(el, ok) {
  const { h } = X, R = X.ST().rift; if (!R) return
  const inv = X.POOL.filter(c => c.name === R.invader).sort((a, b) => b.ovr - a.ovr)[0], now = Date.now()
  const box = h('section', 'bhero rift-hero' + (R.open ? ' open' : ''), `<div><span class="sh-tag">🌀 DIMENSIONAL RIFT</span><h2>${R.open ? R.title.toUpperCase() : 'NO RIFT OPEN'}</h2><p>${R.open ? `A villain has broken through into ${R.place}. Seal the rift before it closes: <b>8,000 coins, ◆1,500 shards and a Premium Drop</b> (25% chance of a second one). One clear per rift.` : 'Rifts tear open every 3 hours and stay open for 90 minutes. Check back soon.'}</p><p class="rift-t">${R.open ? (R.done ? '✓ SEALED · closes in ' : '⏳ CLOSES IN ') + '<b>' + fmtT(R.closes - now) + '</b>' : 'NEXT RIFT IN <b>' + fmtT(R.next - now) + '</b>'}</p></div><div class="rift-ic" style="background-image:url('${inv ? inv.url : ''}')"></div>`)
  el.append(box)
  if (R.open && !R.done) {
    const team = riftTeam(R), b = h('button', 'btn gold big', '⚔️ SEAL THE RIFT'); b.disabled = !ok
    b.onclick = () => go2({ mode: 'rift', id: R.id, label: 'Rift · ' + R.place, name: R.title, level: 5, boost: 1.4, team })
    el.append(b)
    { const cb = cxBtn(() => team.map(k => X.BYKEY[k]), 'Rift · ' + R.title); el.append(cb) }
  }
}
function campPage(el, ok) {
  { let pend = null; try { pend = JSON.parse(sessionStorage.getItem('campOutro') || 'null') } catch { }
    if (pend) { sessionStorage.removeItem('campOutro'); const C0 = X.ST().campP || { stars: {} }; const ch0 = X.ST().camp.find(c => c.id === pend.c), st0 = ch0 && ch0.stages.find(s => s.n === pend.s)
      if (st0 && st0.outro && (C0.stars[pend.c + ':' + pend.s] || 0) > 0 && !pend.had) setTimeout(() => scene(st0.outro, 'AFTER · ' + st0.name, null, () => X.go('battle')), 300) } }
  const { h } = X, ST = X.ST(), C = ST.campP || { stars: {}, chests: [] }
  for (const ch of ST.camp) {
    const tot = Object.entries(C.stars).filter(([k]) => k.startsWith(ch.id + ':')).reduce((n, [, v]) => n + v, 0), unlocked = ch.id === 1 || (C.stars[(ch.id - 1) + ':6'] || 0) > 0
    if (!unlocked) { el.append(h('section', 'bhero camp-hero camp-locked', `<div><span class="sh-tag">${ch.sub.toUpperCase()}</span><h2>🔒 ${ch.name.toUpperCase()}</h2><p>Beat the Chapter ${ch.id - 1} boss to unlock.</p></div>`)); continue }
    const boss = X.POOL.find(c => c.key === ch.boss)
    el.append(h('section', 'bhero camp-hero', `<div><span class="sh-tag">${ch.sub.toUpperCase()}</span><h2>${ch.name.toUpperCase()}</h2><p>Clear each stage to unlock the next. Win with at most 1 fighter KO'd and within 12 turns for 3 stars. The boss drops <b>${boss ? boss.name + ' · ' + boss.ver : 'a Mythic'}</b>.</p></div><div class="bstat"><b>${tot}</b><span>/ ${ch.stages.length * 3} STARS</span></div>`))
    const bossDone = (C.stars[ch.id + ':6'] || 0) > 0, hard = bossDone && CHARD[ch.id]
    { const tg = h('div', 'camp-diff'); for (const [v, l] of [[0, 'NORMAL'], [1, bossDone ? 'HARD' : '🔒 HARD']]) { const b = h('button', 'mtab' + ((!!hard) === !!v ? ' on' : '') + (v ? ' hard' : ''), l); b.disabled = v && !bossDone; b.onclick = () => { CHARD[ch.id] = v; X.go('battle') }; tg.append(b) } if (!bossDone) tg.append(h('small', '', 'Beat the boss to unlock Hard mode')); else if (hard) tg.append(h('small', '', 'Enemies much stronger · double coins · boss gives 2 Premium Drops')); el.append(tg) }
    const chests = h('div', 'camp-chests')
    ST.campChest.forEach((R, i) => { const cid = ch.id === 1 ? i : ch.id * 10 + i, open = C.chests.includes(cid), b = h('button', 'btn ' + (open ? 'dark' : tot >= R.at ? 'gold' : 'dark') + ' sm', open ? '✓ CHEST ' + R.at + '★' : '🎁 ' + R.at + '★ CHEST' + (ch.id === 3 && i === 1 ? ' + WHIS' : '')); b.disabled = open || tot < R.at; b.onclick = async () => { const r = await X.act('campChest', { c: ch.id, i }); if (!r.error) X.go('battle') }; chests.append(b) })
    el.append(chests)
    const list = h('div', 'camp-list')
    ch.stages.forEach(st => {
      const key = (hard ? 'H' : '') + ch.id + ':' + st.n, s = C.stars[key] || 0, open = hard ? (st.n === 1 || (C.stars['H' + ch.id + ':' + (st.n - 1)] || 0) > 0) : st.n === 1 ? unlocked : (C.stars[ch.id + ':' + (st.n - 1)] || 0) > 0, foe = X.POOL.find(c => c.key === campTeam([st.enemy[0]])[0])
      const row = h('button', 'camp-st' + (s ? ' done' : '') + (open ? '' : ' locked') + (st.boss ? ' boss' : ''), `<span class="cs-art" style="background-image:url('${foe ? foe.url : ''}')"></span><span class="cs-tx"><small>${ch.id}-${st.n}${st.boss ? ' · BOSS' : ''}</small><b>${st.name}</b><em>vs ${[...new Set(st.enemy.map(x => x.split('#')[0]))].join(', ')}</em></span><span class="cs-stars">${open ? '★'.repeat(s) + '<i>' + '★'.repeat(3 - s) + '</i>' : '🔒'}</span>`)
      row.disabled = !ok || !open
      { const cb = cxBtn(() => campTeam(st.enemy).map(k => X.BYKEY[k]), ch.id + '-' + st.n + ' · ' + st.name); cb.classList.add('cx-on-row'); const wrap = h('div', 'cx-wrap'); wrap.append(row, cb); list.append(wrap) }
      row.onclick = () => scene(st.scene, ch.id + '-' + st.n + ' · ' + st.name, foe && foe.url, () => {
        try { sessionStorage.setItem('campOutro', JSON.stringify({ c: ch.id, s: st.n, had: s > 0 })) } catch { }
        go2({ mode: 'camp', id: key, label: 'Chapter ' + ch.id + ' · ' + st.name, name: st.name, level: hard || st.boss ? 5 : Math.min(4, 1 + Math.floor(st.n / 2)), boost: (st.boss ? 1.25 : 1 + st.n * .03) + (ch.id - 1) * .06 + (hard ? .35 : 0), team: campTeam(st.enemy) })
      })
    })
    el.append(list)
  }
}
let selectedStoryArc = null
function storyArcCast(arc) {
  const cast = new Map()
  for (const chapter of arc.chapters) {
    for (const id of [chapter.player, chapter.enemy, ...chapter.scene.map(([id]) => id), ...chapter.outro.map(([id]) => id)]) {
      if (id === 'Narrator' || cast.has(id)) continue
      const card = X.POOL.find(c => c.id === id && c.anime === arc.anime)
      if (!card) return null
      cast.set(id, card)
    }
  }
  return cast
}
function storyArcPage(el, arc, cast, done) {
  const { h } = X
  const back = h('button', 'btn dark sm', '‹ ALL STORY ARCS')
  back.onclick = () => { selectedStoryArc = null; X.go('battle') }
  el.append(back, h('section', 'bhero camp-hero', `<div><span class="sh-tag">${X.ANAME(arc.anime)}</span><h2>${arc.name.toUpperCase()}</h2><p>${arc.synopsis}</p></div><div class="bstat"><b>${done}/3</b><span>CHAPTERS CLEARED</span></div>`))
  const reward = X.POOL.find(c => c.id === arc.rewardCard && c.arcReward === arc.id)
  if (reward) {
    const panel = h('div', 'panel pad')
    const unlocked = X.P.arcRewards?.[arc.id]
    panel.append(h('b', '', (unlocked ? '✓ ARC REWARD EARNED · ' : 'CLEAR ALL THREE CHAPTERS · ') + reward.name + ' · ' + reward.ver))
    el.append(panel)
  }
  const list = h('div', 'camp-list')
  arc.chapters.forEach((chapter, i) => {
    const player = cast.get(chapter.player), enemy = cast.get(chapter.enemy)
    const label = `Chapter ${i + 1} · ${chapter.name}`
    const start = withStory => {
      const fight = () => go2({ ...chapter, mode: 'arc', id: arc.id + ':' + i, label, team: [enemy.key], storyPlayer: player.key,
        afterWin: withStory ? () => scene(chapter.outro, chapter.name, enemy.url, () => {}, cast) : null })
      if (withStory) scene(chapter.scene, label, enemy.url, fight, cast)
      else fight()
    }
    const row = h('div', 'camp-st' + (i < done ? ' done' : '') + (i > done ? ' locked' : ''),
      `<span class="cs-art" style="background-image:url('${enemy.url}')"></span><span class="cs-tx"><small>${label}</small><b>${player.name} vs. ${enemy.name}</b><small>${chapter.matchup}</small></span>`)
    const play = h('button', 'btn gold sm', i < done ? 'REPLAY STORY' : i === done ? 'CONTINUE STORY' : 'LOCKED')
    play.disabled = i > done
    play.onclick = () => start(true)
    row.append(play)
    if (i < done) {
      const rematch = h('button', 'btn dark sm', 'REMATCH')
      rematch.onclick = () => start(false)
      row.append(rematch)
    }
    const wrap = h('div', 'cx-wrap')
    const counters = cxBtn(() => [enemy], chapter.name)
    wrap.append(row, counters)
    list.append(wrap)
  })
  el.append(list)
}
function arcsPage(el, ok) {
  const { h, P } = X, ST = X.ST(), A = P.arcs || {}
  const selected = ST.arcs.find(arc => arc.id === selectedStoryArc && arc.chapters)
  const selectedCast = selected && storyArcCast(selected)
  if (selectedCast) return storyArcPage(el, selected, selectedCast, A[selected.id] || 0)
  el.append(h('section', 'bhero', `<div><span class="sh-tag">STORY ARCS</span><h2>STORY ARCS</h2><p>Relive the big fights. Each arc has three chapters against that anime's fighters, ending with its villains as a powered-up final boss. Clearing an arc gives a Premium Drop and ◆1,000 shards.</p></div><div class="bstat"><b>${ST.arcs.filter(a => (A[a.id] || 0) >= 3).length}</b><span>/ ${ST.arcs.length} ARCS</span></div>`))
  const g = h('div', 'arcs')
  for (const arc of ST.arcs) {
    const pool = X.POOL.filter(c => c.anime === arc.anime); if (!pool.length) continue
    const done = A[arc.id] || 0, boss = pool.filter(c => arc.bad.includes(c.name)).sort((a, b) => b.ovr - a.ovr)[0] || pool[0]
    const card = h('div', 'arc' + (done >= 3 ? ' done' : ''))
    card.style.setProperty('--art', `url("${boss.url}")`)
    card.innerHTML = `<div class="arc-art"></div><div class="arc-info"><small>${X.ANAME(arc.anime)}</small><b>${arc.name}</b><span>${done >= 3 ? 'ARC COMPLETE' : done + ' / 3 chapters'}</span><div class="arc-ch"></div></div>`
    const chs = card.querySelector('.arc-ch')
    const cast = arc.chapters && storyArcCast(arc)
    if (cast) {
      const open = h('button', 'btn gold sm', 'OPEN STORY')
      open.onclick = () => { selectedStoryArc = arc.id; X.go('battle') }
      chs.append(open)
      g.append(card)
      continue
    }
    ST.arcCh.forEach((C, i) => {
      const b = h('button', 'btn ' + (i === 2 ? 'gold' : 'dark') + ' sm', `${i < done ? '✓ ' : ''}${C.name}`); b.disabled = !ok || i > done
      b.onclick = () => {
        const bad = pool.filter(c => arc.bad.includes(c.name)).sort((a, b) => b.ovr - a.ovr), good = pool.filter(c => !arc.bad.includes(c.name)).sort((a, b) => a.ovr - b.ovr)
        const main = i === 2 ? bad.concat(good.reverse()) : i === 1 ? good.slice(-3).concat(bad.slice(-1), good) : good.concat(bad.slice(-1))
        go2({ mode: 'arc', id: arc.id + ':' + i, label: arc.name + ' · ' + C.name, name: arc.name, level: C.level, boost: C.boost, team: teamFrom([...new Set(main)], 78 + i * 7) })
      }
      chs.append(b)
    })
    { const bad = pool.filter(c => arc.bad.includes(c.name)).sort((a, b) => b.ovr - a.ovr), good = pool.filter(c => !arc.bad.includes(c.name)).sort((a, b) => b.ovr - a.ovr); card.querySelector('.arc-info').append(cxBtn(() => bad.concat(good).slice(0, 6), arc.name)) }
    g.append(card)
  }
  el.append(g)
}
function eventPage(el, ok) {
  const { h } = X, E = X.ST().event, pool = X.POOL.filter(c => c.anime === E.anime).sort((a, b) => b.ovr - a.ovr)
  const hero = h('section', 'bhero evhero', `<div><span class="sh-tag">LIMITED EVENT · ENDS IN <b class="timer" data-until="${E.ends}"></b></span><h2>${X.ANAME(E.anime).toUpperCase()} WEEK</h2><p>This week's fights are all ${X.ANAME(E.anime)}. Clear each difficulty once a day for coins; Nightmare also gives a ${X.ST().packs[E.pack].name}. A new anime takes over every Monday.</p></div>`)
  if (pool[0]) hero.style.setProperty('--art', `url("${pool[0].url}")`)
  hero.querySelector('div').append(cxBtn(() => pool.slice(0, 6), X.ANAME(E.anime) + ' Week'))
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
  try { const m = sessionStorage.getItem('bmode'); if (m) { sessionStorage.removeItem('bmode'); MODE = m } } catch { }
  const prog = (P.battle && P.battle.cleared) || 0
  const team = P.team.filter(Boolean)
  modeTabs(el)
  if (MODE !== 'story') {
    if (team.length < 6 && MODE !== 'arcs') { const w = h('div', 'panel pad', `<b>Your team needs 6 fighters.</b>`); const b = h('button', 'btn gold', 'GO TO MY TEAM'); b.onclick = () => X.go('team'); w.append(b); el.append(w) }
    return (MODE === 'live' ? livePage : MODE === 'redzone' ? redzonePage : MODE === 'villain' ? villainPage : MODE === 'rift' ? riftPage : MODE === 'raid' ? raidPage : MODE === 'camp' ? campPage : MODE === 'boss' ? bossPage : MODE === 'ranked' ? rankedPage : MODE === 'tower' ? towerPage : MODE === 'arcs' ? arcsPage : eventPage)(el, team.length >= 6)
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
  const LV = stage.live || null
  const yours = LV ? LV.myTeam : stage.storyPlayer ? [BYKEY[stage.storyPlayer]] : P.team.filter(Boolean).map(k => eff(BYKEY[k])).filter(Boolean)
  const B = { you: newSide(yours), ai: newSide(enemyTeam(stage)), turn: 1, over: false, busy: false }
  PASLOG = []
  { const D = (X.ST().decks || [])[X.ST().deckOn || 0]; if (!stage.storyPlayer && D && D.c) { B.you.deck = D.c; B.you.hand = []; B.you.pile = null } }
  if (LV) { B.you.deck = LV.myDeck || null; B.ai.deck = LV.oppDeck || null; B.you.hand = []; B.ai.hand = []; B.you.pile = B.ai.pile = null; B.you.rngS = (LV.seed + (LV.role === 'h' ? 1 : 2)) | 0; B.ai.rngS = (LV.seed + (LV.role === 'h' ? 2 : 1)) | 0 }
  if (stage.boss) for (const f of B.ai.team) { f.hp = f.max = Math.round(f.max * stage.boss); f.pwr = Math.round(f.pwr * .88); f.ki = Math.round(f.ki * .88); f.def = Math.round(f.def * 1.15) }
  if (stage.youCat) for (const f of B.you.team) if ((f.card.cat || []).includes(stage.youCat)) for (const k of ['pwr', 'ki', 'def']) f[k] = Math.round(f[k] * 1.15)
  for (const [side, boost] of [[B.ai, stage.boost], [B.you, stage.playerBoost]]) {
    if (!boost || boost === 1) continue
    for (const f of side.team) {
      f.hp = f.max = Math.round(f.max * boost)
      for (const k of ['pwr', 'ki', 'def']) f[k] = Math.round(f[k] * (1 + (boost - 1) * .6))
    }
  }
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
  if (stage.rules) for (const f of B.ai.team) { const r = { ...stage.rules }; f.pe = { ...(f.pe || {}), ...r, dmg: ((f.pe || {}).dmg || 0) + (r.dmg || 0), dodge: Math.min(60, ((f.pe || {}).dodge || 0) + (r.dodge || 0)), regen: ((f.pe || {}).regen || 0) + (r.regen || 0) }; if (r.endure) f.endure = (f.endure || 0) + r.endure }
  { const all = [...B.you.team, ...B.ai.team], idle = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 60)); let i = 0; const next = () => { const f = all[i++]; if (!f) return; thumbURL(f.card, 560).catch(() => {}).finally(() => idle(next)) }; setTimeout(() => idle(next), 200) }
  applyLeader(B.you); applyLeader(B.ai); applyAuras(B.you, 3); applyAuras(B.ai, (stage.level || 1) >= 5 ? 5 : 4); applyLinks(B.you); applyLinks(B.ai)
  const sealNow = () => { for (const [me, foe] of [[B.you, B.ai], [B.ai, B.you]]) { const a = act(me), o = act(foe); if (a && o && PE(a).nullPassive && !a.ko) o.sealed = 1 } }
  sealNow()
  refill(B.you); refill(B.ai)
  const fA = PE(act(B.you)).first, fB = PE(act(B.ai)).first
  let youFirst = fA && !fB ? true : fB && !fA ? false : act(B.you).spd >= act(B.ai).spd
  if (LV) { const H = LV.role === 'h' ? B.you : B.ai, G = H === B.you ? B.ai : B.you, fH = PE(act(H)).first, fG = PE(act(G)).first, hostFirst = fH && !fG ? true : fG && !fH ? false : act(H).spd >= act(G).spd; youFirst = LV.role === 'h' ? hostFirst : !hostFirst }
  if (youFirst && PE(act(B.you)).stopFirst) B.ai.skip = 1
  if (!youFirst && PE(act(B.ai)).stopFirst) B.you.skip = 1

  const AR = stage.arena && ARENAS[stage.arena] ? stage.arena : ARENA_KEYS[stage.live ? stage.live.seed % ARENA_KEYS.length : Math.floor(Math.random() * ARENA_KEYS.length)]
  const ov = h('div', 'bc th-' + AR); ov.id = 'arena'
  ov.innerHTML = `<div class="bcs"><div class="bcs-wall"></div><div class="bcs-rig r1">${'<i></i>'.repeat(14)}</div><div class="bcs-rig r2">${'<i></i>'.repeat(10)}</div><i class="bcs-spot s1"></i><i class="bcs-spot s2"></i><i class="bcs-spot s3"></i><div class="bcs-crowd"></div><div class="bcs-board"><span>ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · </span></div><div class="bcs-floor"><i class="ln"></i><i class="cc"></i><i class="ccd"></i></div><div class="bcs-haze"></div></div><div class="env"><i class="e-sky"></i><i class="e-far"></i><i class="e-near"></i><i class="e-amb"></i><i class="e-vig"></i></div><div class="stage3"><div class="st-sky"></div><div class="st-pillars"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="st-floor"><div class="st-plat"><i class="r1"></i><i class="r2"></i><i class="mid"></i><i class="pad ai"></i><i class="pad you"></i></div></div></div>
    <header class="ar-top"><button class="ar-quit">✕ QUIT</button><button class="ar-mute"></button><button class="ar-speed"></button><button class="ar-auto"${stage.live ? " hidden" : ""}>AUTO</button>${stage.live ? "<span class=\"pvp-clock\">⏳</span>" : ""}<span class="ar-stage">${stage.label ? stage.label.toUpperCase() : stage.pvp ? 'VS ' + stage.name.toUpperCase() : 'STAGE ' + stage.n + ' · ' + stage.name.toUpperCase()}</span><span class="ar-turn"></span></header>
    <div class="bct"><div class="bct-s you"></div><div class="bct-vs"><b>VS</b><small class="bct-t"></small></div><div class="bct-s ai"></div></div><div class="ar-plate ai"><span class="pe"></span><span class="pp"></span><span class="pn">${stage.pvp ? stage.name.toUpperCase() : 'ENEMY · ' + stage.name.toUpperCase()}</span><span class="pk"></span></div><div class="mat"><div class="mat-in"><i class="mat-surf"></i><i class="mat-emb"></i><div class="mat-line"></div><span class="mat-tag t-ai">ENEMY ACTIVE</span><span class="mat-tag t-you">YOUR ACTIVE</span><div class="ar-side ai"><div class="ar-bench"></div><div class="ar-active"></div><div class="ar-hud"></div></div>
    <div class="ar-mid"><div class="ar-log"></div></div>
    <div class="ar-side you"><div class="ar-hud"></div><div class="ar-active"></div><div class="ar-bench"></div></div></div></div><div class="ar-plate you"><span class="pe"></span><span class="pp"></span><span class="pn">YOU</span><span class="pk"></span></div>
    <footer class="ar-ctrl"><div class="ar-ki"></div><div class="ar-hand"></div><div class="ar-btns"><button class="ar-trans" hidden><b>TRANSFORM</b><small></small></button><button class="ar-ult"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44"/></svg><b>ULT</b><small></small></button><button class="ar-end"><b>END</b><small>TURN</small></button></div></footer><div class="fxl"></div>`
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
    a.style.setProperty('--rc', X.tierCol(f.card.r)); a.classList.toggle('aura', !!f.aura); a.classList.toggle('formed', !!f.transformed && !f.aura)
    let hb = a.querySelector('.hpb'); if (!hb) { hb = document.createElement('div'); hb.className = 'hpb'; a.append(hb) }
    hb.innerHTML = `<b>${f.hp.toLocaleString()}</b><i><s style="width:${f.hp / f.max * 100}%"></s></i>`
    const foeF = act(side === 'you' ? B.ai : B.you), mu = foeF ? matchup(f, foeF) : 1
    let tg = a.querySelector('.mtag'); if (!tg) { tg = document.createElement('div'); a.append(tg) } tg.className = 'mtag ' + (mu > 1 ? 'adv' : mu < 1 ? 'weak' : 'none'); tg.textContent = mu > 1 ? 'ADVANTAGE' : mu < 1 ? 'WEAKNESS' : ''
    a.onclick = () => inspect(f, side)
    ov.querySelector('.ar-plate.' + side + ' .pe').innerHTML = `⚡<b>${s.ki}</b><small>/${KI_MAX}</small>`
    { const bn0 = $a(`.ar-side.${side} .ar-bench`); bn0.classList.toggle('can-swap', side === 'you' && !B.you.switched && !B.busy && !B.over); bn0.classList.toggle('tag-ready', side === 'you' && !B.you.switched && !B.over && (B.you.seq.includes('special') || B.you.ultTurn === B.turn)) }
    ov.querySelector('.ar-plate.' + side + ' .pk').innerHTML = s.team.map(g => `<i class="${g.ko ? 'ko' : ''}"></i>`).join('')
    { const p = passives(s), chips = []; if (p.heal) chips.push(`<b class="pc heal">+${p.heal}% HEAL</b>`); if (p.dr) chips.push(`<b class="pc dr">-${p.dr}% DMG TAKEN</b>`); if (p.dmg) chips.push(`<b class="pc dmg">+${p.dmg}% DMG</b>`); if (p.crit) chips.push(`<b class="pc crit">+${p.crit}% CRIT</b>`); if (p.gauge) chips.push(`<b class="pc gg">+${p.gauge}% ULT/TURN</b>`); ov.querySelector('.ar-plate.' + side + ' .pp').innerHTML = chips.join('') }
    const bn = $a(`.ar-side.${side} .ar-bench`), bkey = s.active + '|' + s.team.map(g => g.key + (g.ko ? 'x' : '')).join(',')
    if (bn.dataset.k === bkey) { let j = 0; s.team.forEach((g, i) => { if (i === s.active) return; const el = bn.children[j++], bar = el && el.querySelector('i'); if (bar) bar.style.width = (g.hp / g.max * 100) + '%' }); return }
    bn.dataset.k = bkey; bn.innerHTML = ''
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
    const hand = $a('.ar-hand'), f = act(s), hkey = f.key + '|' + s.hand.join(',')
    if (hand.dataset.k === hkey && hand.children.length === s.hand.length) { s.hand.forEach((a, i) => { const d = ARTS[a], el = hand.children[i]; el.disabled = !my || s.ki < d.cost || (a === 'burst' && s.ki < 2) }) }
    else { hand.dataset.k = hkey; hand.innerHTML = ''
    const rc = X.tierCol(f.card.r), fx = Math.round((f.card.fx ?? .5) * 100), fy = Math.round((f.card.fy ?? .22) * 100)
    const KIND = { strike: ['PHYSICAL', '#ff3d4a', '#ff9a3a'], blast: ['ENERGY', '#ffb020', '#fff04a'], guard: ['DEFENSE', '#20e0a0', '#a8ffda'], special: ['SIGNATURE', tcol(f.card), '#ffffff'], burst: ['TACTIC', '#ff3b6b', '#ffd0dc'], senzu: ['ITEM', '#3aa83a', '#d8ffb0'], cylinder: ['ITEM', '#c8102e', '#ffd23a'], rumble: ['ITEM', '#ff7ab0', '#ffe0ee'], finger: ['ITEM', '#8a0a2a', '#ffb0c0'], deathnote: ['ITEM', '#111', '#e0e0e0'], hogyoku: ['ITEM', '#7a3aff', '#e0d0ff'], wing: ['ITEM', '#ff9a1a', '#fff0a0'], scroll: ['ITEM', '#c8a050', '#fff3d0'], clock: ['ITEM', '#3a8aff', '#d0e8ff'], charge: ['TACTIC', '#ff9a00', '#ffe2a8'], transfer: ['TACTIC', '#3ab8ff', '#c8ecff'], heal: ['TACTIC', '#2fe0b0', '#c8fff0'], cleanse: ['TACTIC', '#a46bff', '#e8d8ff'] }
    s.hand.forEach((a, i) => {
      const d = ARTS[a], sp = a === 'special', [kind, c1, c2] = KIND[a], b = document.createElement('button')
      b.className = 'art2 ' + a + (d.item ? ' item' : '')
      b.style.cssText = `--c1:${c1};--c2:${c2};--rc:${rc};--i:${i - (s.hand.length - 1) / 2};--art:url("${d.item || f.card.url}");--fx:${d.item ? 50 : fx}%;--fy:${d.item ? 50 : fy}%`
      b.innerHTML = `<span class="fr"></span><span class="pic"></span><span class="holo"></span><span class="glints"><i></i><i></i><i></i><i></i></span>
        <span class="gem"><b>${a === 'burst' ? 'ALL' : d.cost}</b></span><span class="kind">${kind}</span>
        <span class="sym">${ICON[a] || `<b class="tac-ic">${TAC_ICON[a]}</b>`}</span>
        <span class="plate"><b>${sp ? f.card.mv : d.name}</b><small>${sp ? (isAoe(f.card) ? 'HITS ALL ENEMIES' : 'MASSIVE SINGLE HIT') : d.desc.toUpperCase()}</small></span>`
      b.disabled = !my || s.ki < d.cost || (a === 'burst' && s.ki < 2)
      b.onclick = () => doArt(i)
      hand.append(b)
    }) }
    { const tb = $a('.ar-trans'), fA = act(s), ok = canTransform(fA); tb.hidden = !ok; tb.disabled = !my || !ok; if (ok) tb.querySelector('small').textContent = fA.card.form ? fA.card.form.name : 'POWER UP' }
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
  async function awakenCut(card, ev, col) {
    sfx('bcharge'); const c = document.createElement('div'); c.className = 'awk-cut'; c.style.setProperty('--cc', col)
    c.innerHTML = `<div class="ak-bg"></div><div class="ak-streaks"></div><div class="ak-art"><img alt=""></div><div class="ak-flash"></div>
      <div class="ak-txt"><small>✦ AWAKENED ULTIMATE ✦</small><b>${ev.move}</b><span>${card.name} · ${card.ver}</span></div><div class="ak-bars"><i></i><i></i></div>`
    thumbURL(card, 560).then(u => c.querySelector('img').src = u)
    FX().append(c); await wait(350); sfx('crit'); c.classList.add('hit'); await wait(1900); c.classList.add('out'); await wait(350); c.remove()
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
  const TAGN = new Map()
  function floatTag(el, text, cls) { const [x, y] = ctr(el); const n = TAGN.get(el) || 0; TAGN.set(el, n + 1); const t = document.createElement('div'); t.className = 'ftag ' + cls; t.textContent = text; t.style.left = (x + el.getBoundingClientRect().width * .62) + 'px'; t.style.top = (y - 60 + n * 34) + 'px'; FX().append(t); setTimeout(() => { t.remove(); TAGN.set(el, Math.max(0, (TAGN.get(el) || 1) - 1)) }, 2400) }

  function flushPas() { if (!PASLOG || !PASLOG.length) return; const seen = new Set(); let d = 0; for (const n of PASLOG.splice(0)) { const k = n.f.card.name + n.name; if (seen.has(k)) continue; seen.add(k); setTimeout(() => pasPop(n), d); d += 450 } }
  function pasPop(n) { const el = $a(`.ar-side.${n.f === act(B.you) || B.you.team.includes(n.f) ? 'you' : 'ai'} .ar-active`); if (!el) return; const [x, y] = ctr(el); const t = document.createElement('div'); t.className = 'pas-pop'; t.innerHTML = `<small>✦ ${n.f.card.name} · PASSIVE</small><b>${n.name}</b><em>${n.extra || 'ACTIVATED'}</em>`; try { log('✦ ' + n.f.card.name + ': ' + n.name + (n.extra ? ' · ' + n.extra : '')) } catch { } t.style.left = x + 'px'; t.style.top = (y - 120) + 'px'; FX().append(t); setTimeout(() => t.remove(), 2600) }
  // ================= CLASH REACTIONS =================
  const CLASH = {
    JJK: ['DOMAIN CLASH', 'Domain Expansion vs Domain Expansion', 'Enemy passive sealed'],
    DBZ: ['BEAM STRUGGLE', 'Push the beam back!', '+2 Energy'],
    NAR: ['JUTSU CLASH', 'Rasengan vs Chidori', 'Enemy loses their next turn'],
    OP: ["CONQUEROR'S CLASH", 'Haki vs Haki', 'Enemy loses 3 Energy'],
    BLE: ['BANKAI CLASH', 'Reiatsu collision', '+20% damage'],
    DS: ['BREATHING COUNTER', 'Read the form and strike', 'Heal 15%'],
    AOT: ['TITAN GRAPPLE', 'Titan vs Titan', 'Enemy stunned'],
    MHA: ['PLUS ULTRA CLASH', 'Go beyond!', 'Ultimate gauge +50%'],
    PKM: ['TYPE MATCHUP', 'Command your partner!', 'Next attack +30%'],
    YYH: ['SPIRIT CLASH', 'Spirit Gun vs everything!', '+2 Energy'],
  }
  const clashOf = (attCard, team) => { const a = attCard.anime; if (CLASH[a] && team.some(f => !f.ko && f.card.anime === a)) return { key: a, ...cl(CLASH[a]) }; return { key: null, ...cl(['POWER CLASH', 'Raw power vs raw power', 'Counter-hit']) } }
  const cl = ([name, sub, bonus]) => ({ name, sub, bonus })
  function undoHits(ev) { for (const x of ev.hits || []) { if (!x.t || !x.dmg) continue; x.t.hp = Math.min(x.t.max, x.t.hp + x.dmg); if (x.t.hp > 0) x.t.ko = false; x.dmg = 0; x.miss = 'CLASHED' } }
  function clashBonus(key, me, foe) { const a = act(me), d = act(foe)
    if (key === 'JJK') d.sealed = 1; else if (key === 'DBZ' || key === 'YYH') me.ki = Math.min(KI_MAX, me.ki + 2); else if (key === 'NAR' || key === 'AOT') foe.skip = 1
    else if (key === 'OP') foe.ki = Math.max(0, foe.ki - 3); else if (key === 'BLE') a.rage = (a.rage || 0) + 20; else if (key === 'DS') a.hp = Math.min(a.max, a.hp + Math.round(a.max * .15))
    else if (key === 'MHA') me.gauge = Math.min(GAUGE_MAX, me.gauge + 50); else if (key === 'PKM') me.chargeNext = (me.chargeNext || 0) + 30 }
  function tapBattle(C, mine, theirs, auto) { return new Promise(res => {
    const edge = (1 + ((mine.card.ovr || 80) - (theirs.card.ovr || 80)) / 60) * (mine.transformed ? 1.2 : 1)
    if (auto) return res(Math.random() < Math.min(.8, Math.max(.2, .5 * edge)))
    const o = document.createElement('div'); o.className = 'clash'
    o.innerHTML = `<div class="cl-box"><small>⚔️ CLASH!</small><h3>${C.name}</h3><p>${C.sub}</p><div class="cl-bar"><i></i></div><div class="cl-vs"><span>${mine.card.name}</span><b>VS</b><span>${theirs.card.name}</span></div><button class="btn gold big cl-tap">TAP! TAP! TAP!</button><em>3</em></div>`
    ov.append(o); sfx('crack')
    let me = 0, them = 0, t0 = performance.now(); const rate = 6.5 + ((theirs.card.ovr || 80) - 80) * .18
    const bar = o.querySelector('.cl-bar i'), clock = o.querySelector('em')
    o.querySelector('.cl-tap').onpointerdown = e => { e.preventDefault(); me += edge; sfx('nav') }
    const tick = setInterval(() => { const el = (performance.now() - t0) / 1000; them = rate * el; const p = Math.max(5, Math.min(95, 50 + (me - them) * 4)); bar.style.width = p + '%'; clock.textContent = Math.max(0, Math.ceil(3 - el))
      if (el >= 3) { clearInterval(tick); const win = me > them; o.classList.add(win ? 'won' : 'lost'); o.querySelector('h3').textContent = win ? 'CLASH WON!' : 'OVERPOWERED!'; setTimeout(() => { o.remove(); res(win) }, 900) } }, 60)
  }) }
  // the enemy fires a big move: offer the player a clash
  async function maybeClash(ev) {
    const me = B.you, foe = B.ai, mine = act(me), theirs = act(foe); if (!mine || !theirs || B.over || stage.live) return
    if (me.ki < 3 || !(ev.hits || []).some(x => x.dmg > 0)) return
    const C = clashOf(theirs.card, me.team)
    let go = AUTO
    if (!AUTO) go = await new Promise(res => { const o = document.createElement('div'); o.className = 'clash ask'
      o.innerHTML = `<div class="cl-box"><small>⚔️ ${theirs.card.name} uses ${ev.move || 'a big move'}!</small><h3>${C.name}</h3><p>React for 3 Energy? Win: cancel it and counter. ${C.key ? 'Bonus: ' + C.bonus + '.' : ''} Lose: it hits 25% harder.</p><div class="cl-row"><button class="btn gold">REACT</button><button class="btn dark">IGNORE</button></div><em class="cl-t"><s></s></em></div>`
      ov.append(o); const [y, n] = o.querySelectorAll('button'), t = setTimeout(() => { o.remove(); res(false) }, 4000); y.onclick = () => { clearTimeout(t); o.remove(); res(true) }; n.onclick = () => { clearTimeout(t); o.remove(); res(false) } })
    if (!go) return
    me.ki -= 3
    const win = await tapBattle(C, mine, theirs, AUTO)
    if (win) { undoHits(ev); const c = hit(mine, theirs, 330, Math.max(mine.pwr, mine.ki), true, me, foe, 'special'); log(`${C.name} won! ${mine.card.name} counters for ${c.dmg.toLocaleString()}`); banner(C.name + ' WON', C.key ? C.bonus : 'Counter-hit!', '#ffcc00'); if (C.key) clashBonus(C.key, me, foe); sfx('crit'); ev.clashWon = 1 }
    else { for (const x of ev.hits || []) if (x.t && x.dmg) { const extra = Math.round(x.dmg * .25); x.t.hp = Math.max(0, x.t.hp - extra); x.dmg += extra } log(`${theirs.card.name} overpowered the clash!`); banner('OVERPOWERED', '+25% damage', '#ff3d6a') }
    draw()
  }
  // the player fires their Ultimate: strong AI enemies may clash back (resolved automatically)
  async function aiClash(ev) {
    const me = B.ai, foe = B.you, mine = act(me), theirs = act(foe); if (!mine || !theirs || B.over || stage.live || (stage.level || 1) < 5 || me.ki < 3 || Math.random() > .35) return
    const C = clashOf(theirs.card, me.team); me.ki -= 3; banner(C.name, act(B.ai).card.name + ' clashes back!', '#ff3d6a'); await wait(700)
    const win = await tapBattle(C, mine, theirs, true)
    if (win) { undoHits(ev); hit(mine, theirs, 250, Math.max(mine.pwr, mine.ki), true, me, foe, 'special'); log(`Enemy won the clash and countered!`); banner('CLASH LOST', 'Your Ultimate was cancelled', '#ff3d6a') }
    else { log('You won the clash! Your Ultimate goes through.'); banner('CLASH WON', 'Your Ultimate goes through', '#ffcc00') }
    draw()
  }
  // ================= TRANSFORMATIONS (S / Z / Ω, once per fighter, under 50% HP) =================
  function canTransform(f) { return !stage.storyPlayer && !!f && !f.ko && !f.transformed && (f.card.ovr || 0) >= 88 && f.hp / f.max < .5 }
  async function transform(side, who) {
    const f = act(side); if (!canTransform(f)) return
    const full = !!f.card.form, k = full ? 1.25 : 1.15
    f.transformed = 1; f.hp = Math.min(f.max, f.hp + Math.round(f.max * (full ? .3 : .15)))
    f.pwr = Math.round(f.pwr * k); f.ki = Math.round(f.ki * k); f.def = Math.round(f.def * k); f.burnT = 0; f.frozen = 0
    side.gauge = Math.min(GAUGE_MAX, side.gauge + (full ? 30 : 15)); if (who === 'you') side.skip = 0
    if (full) { const e = { ...(f.pe || {}) }; for (const x of ['dmg', 'dodge', 'dr', 'regen', 'teamHeal', 'spec', 'strikeBoost', 'exec', 'aoeBoost', 'crit', 'ultBoost']) if (typeof e[x] === 'number') e[x] = Math.round(e[x] * 1.5); f.pe = e
      f.card = { ...f.card, url: f.card.form.url, ver: f.card.form.name, mv: f.card.form.mv, fy: f.card.form.fy ?? f.card.fy, id: f.card.id + '_form', key: f.card.key + '#form', pas: f.card.pas ? { ...f.card.pas, e } : f.card.pas }; f.key = f.card.key }
    else f.aura = 1
    const name = full ? f.card.form.name : 'POWER UP'
    cutin(f.card, name, (who === 'you' ? '' : 'ENEMY · ') + 'TRANSFORMATION', '#ffcc00', true, name)
    const el = $a(`.ar-side.${who} .ar-active`); if (el) { el.dataset.k = ''; const [x, y] = ctr(el); FXC.gather(x, y, '#ffcc00', .6, 30); setTimeout(() => FXC.hit(x, y, '#ffcc00', 1.6), 600) }
    sfx('bcharge'); log(`${f.card.name} ${full ? 'transforms: ' + name : 'powers up'}!`); await wait(1500); draw()
  }
  async function show(ev) {
    if (ev.swap) { log('Enemy switched fighters'); sfx('bswitch'); draw(); await wait(500); return }
    const side = ev.who, other = side === 'you' ? 'ai' : 'you'
    const atk = $a(`.ar-side.${side} .ar-active`)
    if (ev.tactic) { log(`${act(B[side]).card.name} · ${ARTS[ev.art].name}`); floatTag(atk, ev.tactic, 'adv'); sfx(ev.art === 'heal' ? 'heal' : 'bguard'); await wait(450); draw(); return }
    if (side === 'ai' && (ev.art === 'special' || ev.art === 'ultimate')) await maybeClash(ev)
    else if (side === 'you' && ev.art === 'ultimate') await aiClash(ev)
    if (ev.guard) { log(`${act(B[side]).card.name} braces · GUARD`); sfx('bguard'); atk.classList.add('guarding'); await wait(450); atk.classList.remove('guarding'); draw(); return }
    const big = ev.art === 'special' || ev.art === 'ultimate' || ev.art === 'burst', A = act(B[side]), col = tcol(A.card)
    const tgtEl = $a(`.ar-side.${other} .ar-active`)
    log(big ? `${ev.art === 'ultimate' ? ev.ult + ' · ' : ''}${ev.move}` : `${A.card.name} · ${ARTS[ev.art].name}`)
    if (ev.chain > 1 || ev.combo) chainPop(side, ev.chain, ev.combo)
    // 1) the attacker card pops up and spins
    atk.style.setProperty('--ac', col)
    const [tx, ty] = ctr(tgtEl), [ax, ay] = ctr(atk)
    // 1) wind-up: specials/ultimates gather energy into the card first
    if (ev.art === 'ultimate') { ov.classList.add('ult'); sfx('bcharge'); atk.classList.add('charging'); FXC.gather(ax, ay, col, .7, 34); FXC.screen(col, .22, .6); if (ev.awakened) { await awakenCut(A.card, ev, col); FXC.rays(ax, ay, col, 24, 1100, 1.8); FXC.screen('#ffffff', .6, .4) } else { cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'ULTIMATE', col, true, ev.ult); await wait(1350) } }
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
      const n = document.createElement('div'); n.className = 'dmg' + (x.crit ? ' crit' : '') + (big ? ' big' : '') + (x.mu > 1 ? ' adv' : ''); n.innerHTML = (x.crit ? '<small>CRITICAL!</small>' : '') + `<b>${x.dmg.toLocaleString()}</b>`; if (x.crit) { const fl = document.createElement('div'); fl.className = 'critflash'; ov.append(fl); setTimeout(() => fl.remove(), 260) } n.style.animationDelay = (ev.hits.indexOf(x) * .09) + 's'
      const r = tgt.getBoundingClientRect(); n.style.left = (r.left + r.width / 2) + 'px'; n.style.top = (r.top + r.height * .35) + 'px'
      ov.append(n); setTimeout(() => n.remove(), 1100)
      if (isActive && x.crit) { floatTag(tgt, 'CRITICAL!', 'crit'); sfx('crit') }
      else if (isActive && x.mu > 1) floatTag(tgt, 'SUPER EFFECTIVE', 'adv')
      else if (isActive && x.mu < 1) floatTag(tgt, 'RESISTED', 'weak')
    }
    if (ev.rally) floatTag(atk, 'TEAM HEALED 20%', 'adv')
    if (ev.fort) floatTag(atk, 'FORTRESS · -30% DMG', 'adv')
    if (ev.kit && ev.kit.length) { const [kx, ky] = ctr(atk); const t = document.createElement('div'); t.className = 'ftag kit'; t.textContent = ev.kit.join('  ·  '); t.style.left = kx + 'px'; t.style.top = (ky - 90) + 'px'; FX().append(t); setTimeout(() => t.remove(), 1500) }
    flushPas()
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
    const ev = playArt(B, 'you', i); if (ev) { lvSend({ t: 'art', i }); await show(ev) }
    B.busy = false; if (!B.over) controls()
  }
  async function doSwitch(i) {
    if (B.busy || B.over || B.you.switched || B.you.team[i].ko) return
    const tag = B.you.seq.includes('special') || B.you.ultTurn === B.turn
    B.you.active = i; B.you.switched = true; if (!tag || act(B.ai).ko) lvSend({ t: 'sw', i }); sfx('bswitch'); log(`Go, ${act(B.you).card.name}!`); draw()
    if (tag && !act(B.ai).ko) { // TAG ASSIST: tagging in right after a Special or Ultimate = free follow-up hit
      B.busy = true; controls(); const a = act(B.you), d = act(B.ai)
      const ev = { who: 'you', art: 'strike', move: 'TAG ASSIST', hits: [{ t: d, ...hit(a, d, 200, Math.max(a.pwr, a.ki), false, B.you, B.ai, 'strike') }] }
      B.you.gauge = Math.min(GAUGE_MAX, B.you.gauge + 10); lvSend({ t: 'sw', i }); log(`TAG ASSIST! ${a.card.name} follows up!`); banner('TAG ASSIST', a.card.name + ' jumps in', '#22d8ff')
      await show(ev); B.busy = false; if (!B.over) controls()
    }
  }
  $a('.ar-trans').onclick = async () => { if (B.busy || B.over) return; B.busy = true; controls(); await transform(B.you, 'you'); lvSend({ t: 'tr' }); B.busy = false; if (!B.over) controls() }
  $a('.ar-ult').onclick = async () => { if (B.busy || B.over) return; B.busy = true; controls(); const e = ultimate(B, 'you'); if (e) { lvSend({ t: 'ult' }); await show(e) } B.busy = false; if (!B.over) controls() }
  const mb = $a('.ar-mute'), mdraw = () => { mb.textContent = sfxOn() ? '🔊 SOUND' : '🔇 MUTED'; mb.classList.toggle('off', !sfxOn()) }
  mb.onclick = () => { sfxOn(!sfxOn()); mdraw() }; mdraw()
  $a('.ar-end').onclick = () => endTurn()
  $a('.ar-quit').onclick = () => { if (B.over) return close(); if (ov.querySelector('.qconf')) return; const q = document.createElement('div'); q.className = 'qconf'; q.innerHTML = '<div class="qc-box"><b>QUIT BATTLE?</b><p>You will leave this fight with no rewards.' + (stage.boss ? ' Your boss attempt is not used.' : '') + '</p><div class="qc-b"><button class="btn dark">KEEP FIGHTING</button><button class="btn red">QUIT</button></div></div>'; const [k, x] = q.querySelectorAll('button'); k.onclick = () => q.remove(); x.onclick = () => { q.remove(); close() }; ov.append(q) }
  function close() {
    if (LV && !B.over) { lvSend({ t: "quit" }); B.over = true; try { lvUnsub && lvUnsub(); clearInterval(lvTimer) } catch { } X.ACC.pvpFinish(LV.code, LV.oppUid) }
    if (stage.pvp) { FXC.dispose(); document.body.classList.remove('in-battle'); music('menu'); B.closed = true; ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('players'); return } FXC.dispose(); document.body.classList.remove('in-battle'); music('menu'); B.closed = true; ST3 && ST3.dispose(); ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('battle') }

  // safety net: nobody can sit on 0 HP without being knocked out, and a KO'd active fighter is always replaced
  function sweepKO() { for (const [side, sd] of [['you', B.you], ['ai', B.ai]]) { for (const f of sd.team) if (!f.ko && f.hp <= 0.5) { f.hp = 0; f.ko = true } if (act(sd).ko && !nextAlive(sd)) { end(side === 'ai'); return true } }
    draw(); return false
  }
  async function aiPhase() {
    if (B.over || sweepKO()) return
    if ((stage.level || 1) >= 5 && canTransform(act(B.ai))) await transform(B.ai, 'ai')
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
    const s = B.ai; s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN + (s.kiBonus || 0)); refill(s); s.switched = false; s.seq = []; startTurn(s); act(B.you).fort = 0
    if (s.skip || act(s).frozen) { s.skip = 0; act(s).frozen = 0; log('Enemy loses its turn!'); turnBanner('TIME STOPPED', false); await wait(900); B.turn++; const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN); refill(y); y.switched = false; y.seq = []; startTurn(y); B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); draw(); if (AUTO) autoTurn(); return }
    log('Enemy turn'); turnBanner('ENEMY TURN', false); draw(); await wait(800)
    for (const ev of aiTurn(B, stage.mode === 'ranked' && (stage.rating || 0) >= 80 ? 5 : stage.level)) { if (B.over) return; await show(ev); if (B.over) return }
    if (B.you.skip || act(B.you).frozen) { B.you.skip = 0; act(B.you).frozen = 0; log('You lose your turn!'); turnBanner('TIME STOPPED', true); await wait(900); B.turn++; return aiPhase() }
    B.turn++
    if (B.over || sweepKO()) return
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN + (y.kiBonus || 0)); refill(y); y.switched = false; y.seq = []; startTurn(y); act(B.ai).fort = 0
    B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); sfx('bturn'); draw(); flushPas(); if (AUTO) autoTurn()
  }
  async function endTurn() { if (B.busy || B.over) return; if (LV) { lvSend({ t: 'end' }); return remotePhase() } await aiPhase() }
  // ================= LIVE PVP =================
  const LQ = []; let lvWake = null, lvN = 0, lvLast = Date.now(), lvFirstRemote = !!LV && !youFirst, lvMyTurnAt = 0, lvUnsub = null, lvTimer = null
  const SIDE_KEYS = ['active', 'ki', 'gauge', 'hand', 'pile', 'seq', 'switched', 'skip', 'chargeNext', 'ultTurn', 'rngS', 'kiBonus', 'confiscated']
  const serF = f => { const o = {}; for (const k in f) { if (k === 'card' && !f.transformed) continue; const v = f[k]; if (typeof v !== 'function') o[k] = v } return o }
  const serS = sd => { const o = { team: sd.team.map(serF) }; for (const k of SIDE_KEYS) o[k] = sd[k]; return o }
  const lvSnap = () => { const H = LV.role === 'h' ? B.you : B.ai, G = H === B.you ? B.ai : B.you; return JSON.parse(JSON.stringify({ h: serS(H), g: serS(G), turn: B.turn })) }
  function lvApply(sn) { if (!sn) return; const H = LV.role === 'h' ? B.you : B.ai, G = H === B.you ? B.ai : B.you
    for (const [sd, o] of [[H, sn.h], [G, sn.g]]) { if (!o) continue; for (const k of SIDE_KEYS) sd[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; o.team.forEach((st, i) => { const f = sd.team[i]; if (!f) return; for (const k in st) f[k] = st[k] }) }
    if (sn.turn != null) B.turn = sn.turn }
  function lvSend(a) { if (!LV) return; lvN++; let sn = null; try { sn = lvSnap() } catch (e) { console.warn('snap', e) } X.ACC.pvpSend(LV.code, LV.role, lvN, { ...a, sn }).catch(e => console.warn('pvp send', e)) }
  if (LV) window.__LVB = B
  if (LV) { lvUnsub = X.ACC.pvpMoves(LV.code, m => { if (m.by === LV.me) return; LQ.push(m.a); lvLast = Date.now(); if (lvWake) lvWake() })
    lvTimer = setInterval(() => { if (B.over) return clearInterval(lvTimer); const el = ov.querySelector('.pvp-clock'); if (!el) return
      if (!B.busy && lvMyTurnAt) { const left = Math.max(0, 45 - Math.floor((Date.now() - lvMyTurnAt) / 1000)); el.textContent = '⏱ ' + left + 's'; el.classList.toggle('low', left <= 10); if (left === 0) { lvMyTurnAt = 0; endTurn() } }
      else { const idle = Math.floor((Date.now() - lvLast) / 1000); el.textContent = idle > 50 ? '⏳ ' + (90 - idle) + 's' : '⏳ ' + LV.oppName; el.classList.toggle('low', idle > 50); if (idle >= 90 && !lvMyTurnAt) { log(LV.oppName + ' disconnected. You win!'); end(true) } } }, 500) }
  const myTurnStart = () => { if (LV) { lvMyTurnAt = Date.now(); lvLast = Date.now() } }
  async function lvNext() { for (;;) { if (B.over) return null; if (LQ.length) return LQ.shift(); await new Promise(res => { lvWake = res; setTimeout(res, 1000) }); lvWake = null } }
  async function remoteSwitch(i, sn) {
    const s = B.ai; if (s.switched || !s.team[i] || s.team[i].ko) return
    const tag = s.seq.includes('special') || s.ultTurn === B.turn
    s.active = i; s.switched = true; sfx('bswitch'); log(`${LV.oppName} sends in ${act(s).card.name}!`)
    if (tag && !act(B.you).ko) { const a = act(s), d = act(B.you)
      const ev = { who: 'ai', art: 'strike', move: 'TAG ASSIST', hits: [{ t: d, ...hit(a, d, 200, Math.max(a.pwr, a.ki), false, B.ai, B.you, 'strike') }] }
      s.gauge = Math.min(GAUGE_MAX, s.gauge + 10); lvApply(sn); draw(); banner('TAG ASSIST', a.card.name + ' jumps in', '#ff3d6a'); await show(ev) } else { lvApply(sn); draw() }
  }
  async function remotePhase() {
    if (B.over || sweepKO()) return
    B.busy = true; lvMyTurnAt = 0; controls()
    const s = B.ai
    if (lvFirstRemote) lvFirstRemote = false
    else { s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN + (s.kiBonus || 0)); refill(s); s.switched = false; s.seq = []; startTurn(s); act(B.you).fort = 0
      if (s.skip || act(s).frozen) { s.skip = 0; act(s).frozen = 0; log(LV.oppName + ' loses their turn!'); turnBanner('TIME STOPPED', false); await wait(900); B.turn++; const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN + (y.kiBonus || 0)); refill(y); y.switched = false; y.seq = []; startTurn(y); act(B.ai).fort = 0; B.busy = false; turnBanner('YOUR TURN', true); draw(); myTurnStart(); return } }
    lvLast = Date.now(); log(LV.oppName + "'s turn"); turnBanner(LV.oppName.toUpperCase() + "'S TURN", false); draw()
    for (;;) { const a = await lvNext(); if (!a || B.over) return
      if (a.t === 'end') { lvApply(a.sn); break }
      if (a.t === 'quit') { log(LV.oppName + ' left the match. You win!'); return end(true) }
      if (a.t === 'art') { const ev = playArt(B, 'ai', a.i); lvApply(a.sn); if (ev) await show(ev) }
      else if (a.t === 'ult') { const ev = ultimate(B, 'ai'); lvApply(a.sn); if (ev) await show(ev) }
      else if (a.t === 'sw') await remoteSwitch(a.i, a.sn)
      else if (a.t === 'tr') { await transform(B.ai, 'ai'); lvApply(a.sn) }
      if (B.over) return }
    B.turn++
    if (B.over || sweepKO()) return
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN + (y.kiBonus || 0)); refill(y); y.switched = false; y.seq = []; startTurn(y); act(B.ai).fort = 0
    if (y.skip || act(y).frozen) { y.skip = 0; act(y).frozen = 0; log('You lose your turn!'); turnBanner('TIME STOPPED', true); draw(); await wait(900); lvSend({ t: 'end' }); return remotePhase() }
    B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); sfx('bturn'); draw(); myTurnStart()
  }
  function startTurn(s) {
    const a0 = act(s), e = PE(a0), foe = s === B.you ? B.ai : B.you
    a0.turns++
    { const tags = []; if (e.regen && !e.noHeal) tags.push('REGEN +' + e.regen + '%'); if (e.teamHeal) tags.push('TEAM HEAL +' + e.teamHeal + '%'); if (e.ramp) tags.push('POWER +' + Math.min(e.rampMax || 99, e.ramp * a0.turns) + '%'); if (e.energyTurn) tags.push('+' + e.energyTurn + ' ENERGY'); if (tags.length) pasNote(a0, tags.join(' · ')) }
    if (e.regen && !e.noHeal) a0.hp = Math.min(a0.max, a0.hp + Math.round(a0.max * e.regen / 100))
    if (e.bleed) a0.hp = Math.max(1, a0.hp - Math.round(a0.max * e.bleed / 100))
    if (e.emperor) a0.hp = Math.max(1, a0.hp - Math.round(a0.max * .03))
    if (a0.burnT > 0) { a0.hp = Math.max(1, a0.hp - Math.round(a0.max * a0.burn / 100)); a0.burnT-- }
    if (a0.doom > 0 && --a0.doom === 0) { a0.hp = 0; a0.ko = true; log(a0.card.name + ' — the Death Note takes effect.') }
    if (e.guardAuto) a0.guard = 1
    if (e.energyTurn) s.ki = Math.min(KI_MAX, s.ki + e.energyTurn)
    if (e.haki) { const o = act(foe); if (o && o.card.ovr < a0.card.ovr) foe.ki = Math.max(0, foe.ki - e.haki) }
    for (const f of s.team) { const fe = PE(f); if (fe.teamHeal && !f.ko) for (const g of s.team) if (!g.ko) g.hp = Math.min(g.max, g.hp + Math.round(g.max * fe.teamHeal / 100)) }
    if (e.specDraw && rnd(s) * 100 < e.specDraw) { s.hand[0] = 'special' }
    if (e.timeStop && rnd(s) * 100 < e.timeStop) { foe.skip = 1; pasNote(a0, 'TIME STOP') }
    if (e.charge && s.lastSkipped) a0.rage = Math.max(a0.rage || 0, e.charge)
    s.confiscated = 0; sealNow()
    const p = passives(s), a = act(s); if (p.heal && !a.ko) a.hp = Math.min(a.max, a.hp + Math.round(a.max * p.heal / 100)); if (p.gauge) s.gauge = Math.min(GAUGE_MAX, s.gauge + p.gauge) }
  async function autoTurn() {
    if (!AUTO || B.busy || B.over) return
    B.busy = true; controls(); await wait(350)
    if (canTransform(act(B.you))) await transform(B.you, 'you')
    for (const ev of planTurn(B, 5, 'you')) { if (B.over) return; await show(ev); if (B.over) return }
    // auto Tag Assist: after a Special/Ultimate, tag in the best bench fighter for a free hit
    if (!B.over && !B.you.switched && (B.you.seq.includes('special') || B.you.ultTurn === B.turn)) { const foe = act(B.ai), cur = act(B.you), sc = f => (matchup(f, foe) - matchup(foe, f)) * 2 + f.hp / f.max, best = B.you.team.map((f, i) => [f, i]).filter(([f, i]) => !f.ko && i !== B.you.active && f.hp / f.max > .35).sort((x, y) => sc(y[0]) - sc(x[0]))[0]; if (best && sc(best[0]) >= sc(cur) - .3) { B.busy = false; await doSwitch(best[1]); B.busy = true } }
    B.busy = false; if (!B.over && AUTO) await aiPhase()
  }
  { const sb = $a('.ar-speed'), sd = () => { sb.textContent = SPEED + '×'; sb.classList.toggle('on', SPEED > 1) }; sb.onclick = () => { SPEED = SPEED === 1 ? 2 : SPEED === 2 ? 3 : 1; try { localStorage.setItem('aut-bspeed', SPEED) } catch { } ov.style.setProperty('--spd', SPEED); sd() }; ov.style.setProperty('--spd', SPEED); sd()
    const ab = $a('.ar-auto'); ab.onclick = () => { AUTO = !AUTO; ab.classList.toggle('on', AUTO); ab.textContent = AUTO ? 'AUTO ON' : 'AUTO'; if (AUTO && !B.busy && !B.over) autoTurn() } }

  async function end(won) {
    B.over = true; controls()
    await wait(500)
    if (LV) { try { lvUnsub && lvUnsub(); clearInterval(lvTimer) } catch { } X.ACC.pvpFinish(LV.code, won ? LV.me : LV.oppUid) }
    const r = stage.pvp ? await X.act('pvp', { won, name: stage.name, uid: stage.uid }) : await X.act('battle', stage.mode ? { mode: stage.mode, id: stage.id, won, dmg: B.you.team.reduce((n, f) => n + f.dealt, 0), ko: B.you.team.filter(f => f.ko).length, turns: B.turn } : { stage: stage.n, won })
    if (stage.mode === 'raid' && r && r.raidTotal != null && X.raidPost) { try { await X.raidPost(stage.raidId, r.raidTotal); RAIDCACHE.at = 0 } catch (e) { console.warn('raid post failed', e) } }
    sfx(stage.boss ? 'claim' : won ? 'win' : 'lose')
    const mvp = B.you.team.slice().sort((a, b) => b.dealt - a.dealt)[0], dealt = B.you.team.reduce((n, f) => n + f.dealt, 0), kos = B.you.team.reduce((n, f) => n + f.kos, 0)
    const box = document.createElement('div'); box.className = 'ar-result ' + (won ? 'win' : 'lose')
    if (won) { const cf = document.createElement('div'); cf.className = 'confetti'; cf.innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="--x:${Math.random() * 100}%;--d:${(Math.random() * .8).toFixed(2)}s;--h:${Math.round(Math.random() * 360)};--r:${Math.round(Math.random() * 720 - 360)}deg"></i>`).join(''); ov.append(cf); setTimeout(() => cf.remove(), 4000) }
    box.innerHTML = `<div class="rs-burst"></div><h2>${stage.boss ? 'BOSS FIGHT' : won ? 'VICTORY' : 'DEFEAT'}</h2><p>${stage.boss ? (r.msg || '') : won ? (r.msg || 'Stage cleared.') : (stage.storyPlayer ? 'Your story fighter was knocked out. Try again.' : 'Your team was knocked out. Tweak your lineup and try again.')}</p>
      <div class="rs-body"><div class="rs-mvp"><span>MVP</span><div class="rs-card"></div><b>${mvp.card.name}</b><small>${mvp.dealt.toLocaleString()} DMG · ${mvp.kos} KO</small></div>
      <div class="rs-stats"><div><b>${B.turn}</b><span>TURNS</span></div><div><b>${dealt.toLocaleString()}</b><span>TOTAL DAMAGE</span></div><div><b>${kos}</b><span>KNOCKOUTS</span></div><div><b>${B.you.team.filter(f => !f.ko).length}/${B.you.team.length}</b><span>SURVIVED</span></div></div></div>`
    box.querySelector('.rs-card').append(img(mvp, 360))
    const b = document.createElement('button'); b.className = 'btn gold'; b.textContent = 'CONTINUE'; b.onclick = () => { close(); if (won && !r.error && stage.afterWin) stage.afterWin() }; box.append(b)
    ov.append(box)
  }

  arenaImgs().then(list => {
    let name = ARENAS[AR].name, sub = ARENAS[AR].sub
    if (list.length) {
      const pick = stage.live ? list[stage.live.seed % list.length] : stage.pvp || !stage.n ? list[Math.floor(Math.random() * list.length)] : list[(stage.n - 1) % list.length]
      ov.classList.add('has-img'); ov.style.setProperty('--bgimg', `url("${pick.url}")`); name = pick.name; sub = stage.pvp ? 'Ranked Arena' : 'Stage ' + stage.n
      { const tag = !stage.live && ARENA_BONUS[pick.id]; if (tag && !B.arenaB) { B.arenaB = tag; for (const sd of [B.you, B.ai]) for (const f of sd.team) if (tagsOf(f.card).includes(tag)) { f.max = Math.round(f.max * 1.05); f.hp = Math.round(f.hp * 1.05); for (const k of ['pwr', 'ki', 'def']) f[k] = Math.round(f[k] * 1.05) } sub = '+5% to ' + (tag.startsWith('S:') ? X.ANAME(tag.slice(2)) : tag) + ' fighters'; try { draw() } catch { } } }
      // measure how bright the art is and pick a light or dark UI theme to match
      const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = 32; c.height = 18; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 18); const d = x.getImageData(0, 0, 32, 18).data; let L = 0; for (let i = 0; i < d.length; i += 4) L += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; L /= d.length / 4; ov.classList.toggle('lite', L > .42); ov.style.setProperty('--lum', L.toFixed(2)) } catch { } }; im.src = pick.url
    }
    const t = document.createElement('div'); t.className = 'arena-title'; t.innerHTML = `<small>ARENA</small><b>${name}</b><span>${sub}</span>`; ov.append(t); setTimeout(() => t.remove(), 2300)
  })
  draw()
  const kick = () => { if (youFirst) { log(`You move first (${act(B.you).card.name} is faster)`); myTurnStart() } else { log(`${act(B.ai).card.name} is faster · ${LV ? LV.oppName : 'enemy'} moves first`); if (LV) { B.busy = true; controls() } setTimeout(LV ? remotePhase : aiPhase, 600) } }
  { // VS intro: both leaders slam in with their leader skills (tap to skip)
    const L = s => { const f = s.team[0], ld = f.card.lead; return `<div class="vsi-card"><div class="vsi-img"></div><b>${f.card.name}</b><small>${ld ? 'LEADER · ' + ld.cats.map(k => X.ANAME(k) || k).join(' / ') + ' +' + ld.pct + '%' : 'NO LEADER SKILL'}</small><em>${s.leadN || 0}/${s.team.length} BOOSTED</em></div>` }
    const o = document.createElement('div'); o.className = 'vsi'; o.innerHTML = `<div class="vsi-l you">${L(B.you)}</div><div class="vsi-vs">VS</div><div class="vsi-l ai">${L(B.ai)}</div><div class="vsi-tap">${stage.label || ''}</div>`
    o.querySelector('.you .vsi-img').append(img(B.you.team[0], 300)); o.querySelector('.ai .vsi-img').append(img(B.ai.team[0], 300))
    ov.append(o); sfx('whoosh'); setTimeout(() => sfx('crack'), 520)
    let gone = false; const done = () => { if (gone) return; gone = true; o.classList.add('out'); setTimeout(() => { o.remove(); kick() }, 320) }
    o.onclick = done; setTimeout(done, 2100)
  }
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
