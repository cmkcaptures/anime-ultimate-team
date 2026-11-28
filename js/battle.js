import { batchTax, batchDefense, batchTag, batchSpecial, batchUltimate, rewriteLethalHit, batchSupportSpecial } from './first-batch.js?v=balance-pass-1'
import { chroniclePage } from './chronicle-ui.js?v=claude-chron-5'
import { ultraCut, victoryPose } from './ult-fx.js?v=claude-ult-1'
import { CRUCIBLE_STAGES, CRUCIBLE_ITEMS, crucibleReward, crucibleRewardText } from './crucible.js?v=claude-gshard'
import { newGenBalance, newGenIntent, newGenFailed, newGenWarning } from './new-gen-zones.js?v=claude-dz-7'
import { fusionCaptainSave } from './fusion-captains.js?v=1'
import { draftPage } from './draft-page.js?v=1'
import { shrineWaveSurvive, shrineActive, tojiLink } from './shrine-wave.js?v=2'
import { fairyTag, fairySurvive, fairyCharge, fairyAfterArt } from './fairy-tail.js?v=1'
import { gtForm, gtSurvive, gtArt } from './gt-goku.js?v=1'
import { pveSquadPower, pveBalance, deadZoneIntent, deadZonePunishment } from './pve-balance.js?v=claude-2'
import { TRANSFER_CAMPAIGN, CAMPAIGN_ART, campaignMission, campaignScale, missionId } from './transfer-campaign.js?v=claude-1'
import { RESCUE_NAMES } from './last-door.js?v=claude-dzbal-1'
import { recordWaveArt, waveArtTax } from './wave.js?v=wave-1'
import { rivalryLead, chargeBarrier, hakaiStep, VEGETA } from './rivalry.js?v=claude-dzbal-1'
import { artPreview, battleInfo, fighterStatuses } from './battle-tools.js?v=claude-2'
import { addBattleRecap, addTurningPoints, createTurningPoints, recordWarMvp, warRecap } from './battle-recap.js?v=turning-1'
import { fitWarPreset, warCardAllowed, warLineupError, warScore, WAR_REWARD, WAR_TITLE } from './war.js?v=qol-1'
// AUT Battle — turn-based hybrid of DB Legends (Arts cards, Energy, Ultimates, switching) and TCG Pocket (turns, energy, bench).
// Win by knocking out all 6 enemy fighters. 1 active fighter + 5 on the bench each side.
import { TIER, TYPE, thumbURL } from './cardkit.js?v=claude-guts-1'
import { sfx, sfxOn, music } from './sfx.js?v=claude-music-2'
import { createFX } from './fx2d.js?v=mobile-render'
import { nextTransformation, enterTransformation, advanceFormTurn } from './transformations.js?v=fusion-captains-1'

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
// ---- TEAM AURAS: every fighter buffs teammates that match one of its aura tags; grows with diamonds ----
const ROLE_TAG = { FIGHTER: 'Fighters', TANK: 'Tanks', SHOOTER: 'Shooters', ASSASSIN: 'Assassins', SUPPORT: 'Supports' }
export const AURA_PCT = { 3: 3, 4: 4, 5: 5, 6: 7, 7: 10 }, AURA_CAP = 40
export const tagsOf = c => ['S:' + c.anime, c.faction, ...(c.cat || []), ...(c.arch || []), ROLE_TAG[c.role] || 'Fighters']
export const auraHits = (src, c) => !!(src && c && src.aura && src.aura.some(t => tagsOf(c).includes(t)))
// ---- SQUAD BOND: fighters that share a team aura tag protect each other (rewards themed favourite teams) ----
export function squadBond(cards) {
  const team = cards.filter(Boolean); let best = { n: 0, tag: null }
  for (const t of new Set(team.flatMap(c => [...(c.aura || []), ...(c.arch || [])]))) { const n = team.filter(c => tagsOf(c).includes(t) || (c.aura || []).includes(t)).length; if (n > best.n) best = { n, tag: t } }
  const tier = best.n >= 6 ? 3 : best.n >= 5 ? 2 : best.n >= 4 ? 1 : 0
  return { ...best, tier, dr: [0, 10, 15, 20][tier], regen: [0, 0, 2, 3][tier], save: tier === 3 }
}
function applySquadBond(side) {
  const b = squadBond(side.team.map(f => f.card)); side.bond = b; if (!b.tier) return
  for (const f of side.team) { f.pe = { ...(f.pe || {}) }; f.pe.dr = Math.min(45, (f.pe.dr || 0) + b.dr); if (b.regen) f.pe.regen = (f.pe.regen || 0) + b.regen }
  if (b.save && side.team[0]) side.team[0].endure = (side.team[0].endure || 0) + 1
}
// ---- MULTIVERSE: reward for mixing series (the counterweight to single-series synergy) ----
export function multiverse(cards) { const n = new Set(cards.filter(Boolean).map(c => c.anime)).size; return { n, pct: n >= 5 ? 12 : n >= 4 ? 8 : n >= 3 ? 5 : 0, ki: n >= 5 ? 1 : 0 } }
function applyMultiverse(side) {
  const m = multiverse(side.team.map(f => f.card)); side.multi = m; if (!m.pct) return
  for (const f of side.team) { f.max = f.hp = Math.round(f.max * (1 + m.pct / 100)); const k = 1 + m.pct / 100; f.pwr = Math.round(f.pwr * k); f.ki = Math.round(f.ki * k); f.def = Math.round(f.def * k) }
  side.kiBonus = (side.kiBonus || 0) + m.ki
}
export function teamAuras(cards, defDia = 3) { return cards.map(c => { if (!c) return 0; let b = 0; for (const s of cards) if (s && auraHits(s, c)) b += AURA_PCT[Math.min(7, Math.max(3, s.dia || defDia))]; return Math.min(AURA_CAP, b) }) }
function applyAuras(side, defDia) { const b = teamAuras(side.team.map(f => f.card), defDia); side.team.forEach((f, i) => { const x = b[i]; if (!x) return; f.max = f.hp = Math.round(f.max * (1 + x / 100)); const k = 1 + x / 200; f.pwr = Math.round(f.pwr * k); f.ki = Math.round(f.ki * k); f.def = Math.round(f.def * k); f.auraB = x }); side.auraAvg = Math.round(b.reduce((n, v) => n + v, 0) / Math.max(1, b.length)) }
// ---- LINK SKILLS: neighbours in the lineup (Leader → Main 1 → Main 2 → Sub 1 → Sub 2 → Sub 3) link up ----
export const LINKS = [
  { n: 'Saiyan Rivals', a: ['GOKU', 'VEGETA'], pct: 12 }, { n: 'Father & Son', a: ['GOKU', 'GOHAN', 'GOTEN'], pct: 10 }, { n: 'Mentor & Student', a: ['GOHAN', 'PICCOLO'], pct: 10 },
  { n: 'Team 7', a: ['NARUTO', 'SASUKE', 'SAKURA', 'KAKASHI'], pct: 10 }, { n: 'Uchiha Blood', a: ['SASUKE', 'ITACHI', 'MADARA', 'OBITO'], pct: 8 },
  { n: 'Monster Trio', a: ['LUFFY', 'ZORO', 'SANJI'], pct: 10 }, { n: 'ASL Brothers', a: ['LUFFY', 'ACE', 'SABO'], pct: 10 }, { n: 'Emperors', a: ['SHANKS', 'KAIDO', 'BIG MOM', 'BLACKBEARD', 'LUFFY'], pct: 8 },
  { n: 'The Strongest', a: ['GOJO', 'YUTA', 'ITADORI', 'MEGUMI', 'NOBARA'], pct: 10 }, { n: 'King of Curses', a: ['SUKUNA', 'MAHITO', 'JOGO', 'GETO', 'KENJAKU'], pct: 8 },
  { n: 'Kamado Bond', a: ['TANJIRO', 'NEZUKO', 'ZENITSU', 'INOSUKE', 'KAMABOKO'], pct: 10 }, { n: 'Hashira', a: ['RENGOKU', 'GIYU', 'TENGEN', 'SHINOBU', 'MITSURI', 'OBANAI', 'MUICHIRO', 'GYOMEI', 'SANEMI'], pct: 8 },
  { n: 'Urameshi Team', a: ['YUSUKE', 'KUWABARA', 'KURAMA', 'HIEI', 'GENKAI', 'TEAM URAMESHI'], pct: 10 },
  { n: 'Deku & Kacchan', a: ['DEKU', 'BAKUGO', 'ALL MIGHT'], pct: 10 }, { n: 'Soul Reapers', a: ['ICHIGO', 'RUKIA', 'RENJI', 'URAHARA', 'YAMAMOTO', 'KENPACHI', 'BYAKUYA', 'UNOHANA'], pct: 8 },
  { n: 'Seven Deadly Sins', a: ['MELIODAS', 'ESCANOR', 'BAN', 'KING', 'ELIZABETH', 'DIANE', 'GOWTHER', 'MERLIN'], pct: 10, anime: 'SDS' }, { n: 'Hunters', a: ['GON', 'KILLUA', 'KURAPIKA', 'HISOKA'], pct: 8 },
  { n: 'Survey Corps', a: ['LEVI', 'EREN', 'MIKASA', 'ARMIN', 'HANGE'], pct: 8 }, { n: 'Devil Hunters', a: ['DENJI', 'POWER', 'AKI', 'KISHIBE', 'KOBENI', 'MAKIMA'], pct: 8 },
  { n: 'Shinazugawa Brothers', a: ['SANEMI', 'GENYA'], pct: 12, anime: 'DS' },
  { n: 'Ice Zanpakutō', a: ['RUKIA', 'TŌSHIRŌ'], pct: 12, anime: 'BLE' },
  { n: 'Water and Ice', a: ['JUVIA', 'GRAY'], pct: 12, anime: 'FT' },
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
const matchup = (att, def) => { const m = beats(tOf(att.card), tOf(def.card)) ? 1.3 : beats(tOf(def.card), tOf(att.card)) ? .8 : 1; if (m < 1 && att.pe && att.pe.typeNeutral) return 1; if (m > 1 && def.pe && def.pe.typeNeutral) return 1; return m }
const tcol = c => (TYPE[tOf(c)] || TYPE.ki).c[0]
const tname = c => (TYPE[tOf(c)] || TYPE.ki).en
const weakTo = t => RING[(RING.indexOf(t) - 1 + RING.length) % RING.length]

// ---------------- rules ----------------
const ICON = {"strike":"<svg viewBox=\"0 0 64 64\"><path d=\"M14 30c0-4 3-7 7-7h2v-5a5 5 0 0 1 10 0v2a5 5 0 0 1 10 0v3a5 5 0 0 1 9 3v12c0 9-7 16-16 16h-6c-9 0-16-7-16-16z\" fill=\"currentColor\"/><path d=\"M4 16l10 6M2 28h10M6 40l9-4\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>","blast":"<svg viewBox=\"0 0 64 64\"><circle cx=\"32\" cy=\"32\" r=\"13\" fill=\"currentColor\"/><circle cx=\"32\" cy=\"32\" r=\"21\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" opacity=\".55\"/><circle cx=\"32\" cy=\"32\" r=\"28\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" opacity=\".3\"/></svg>","guard":"<svg viewBox=\"0 0 64 64\"><path d=\"M32 4l22 8v16c0 15-10 26-22 32C20 54 10 43 10 28V12z\" fill=\"currentColor\"/><path d=\"M22 32l7 7 13-14\" stroke=\"#0b0d12\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>","special":"<svg viewBox=\"0 0 64 64\"><path d=\"M32 2l6 20 20-6-14 16 14 16-20-6-6 20-6-20-20 6 14-16L6 16l20 6z\" fill=\"currentColor\"/></svg>"}
const KI_PER_TURN = 3, KI_MAX = 10, HAND = 4, GAUGE_MAX = 100
const ARTS = {
  strike: { name: 'STRIKE', cost: 1, col: '#ff4a5a', desc: 'Fast hit · PWR' },
  blast: { name: 'BLAST', cost: 2, col: '#ffc23a', desc: 'Energy blast · ENG' },
  guard: { name: 'GUARD', cost: 1, col: '#3dffa0', desc: 'Block 50–75% of the next hit. Stronger against heavy damage.' },
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
export const DRAGONS = ['NATSU', 'ACNOLOGIA', 'IGNEEL', 'SHENRON', 'GARCHOMP', 'DURALUDON', 'CHARIZARD', 'RESHIRAM', 'ZEKROM', 'SLIFER']
export const isDragon = c => DRAGONS.some(n => c.name.includes(n)) || (/KAIDO/.test(c.name) && /DRAGON/.test(c.ver || ''))
const TAC_ICON = { burst: '💥', charge: '⚡', transfer: '🔗', heal: '✚', cleanse: '✦', senzu: '', cylinder: '', rumble: '', finger: '', deathnote: '', hogyoku: '', wing: '', scroll: '', clock: '' }
const pctOf = c => { if ([14, 20].includes(c.pas?.e?.shinobi)) return 145; const pattern = c.pas?.e?.gtForm ? /(\d+)%/ : /(\d+)%\s*PWR/; const m = pattern.exec((c.tx || []).join(' ')); return m ? +m[1] : 220 }
const isAoe = c => /all enemies/i.test((c.tx || []).join(' '))
const kitTxt = c => (c.tx || []).join(' ')
const kitNum = (c, re) => { const m = re.exec(kitTxt(c)); return m ? +m[1] : 0 }
// applies a card's kit bonuses after its Special / Ultimate lands
function kitEffects(me, a) {
  const c = a.card, notes = []
  if (PE(a).zerefRevive && (a.zerefUsed || 0) < 2 && me.team.some(f => f.ko && f !== a)) {
    const marked = me.team[me.reviveMark], f = marked && marked.ko ? marked : me.team.filter(x => x.ko && x !== a).sort((x, y) => y.card.ovr - x.card.ovr)[0]
    if (f) { f.ko = false; f.hp = 0; healHP(f, f.max * .5); a.zerefUsed = (a.zerefUsed || 0) + 1; me.reviveMark = null; notes.push('ANKHSERAM · ' + f.card.name + ' REVIVED') }
  }
  const th = kitNum(c, /Heal the whole team (\d+)% max HP/); if (th) { for (const f of me.team) if (!f.ko) healHP(f, f.max * th / 100); notes.push('TEAM +' + th + '%') }
  const heal = kitNum(c, /Heal (\d+)% max HP/); if (heal) { const h = healHP(a, a.max * heal / 100); notes.push('+' + h.toLocaleString() + ' HP') }
  const ki = kitNum(c, /Gain (\d+) Energy/); if (ki) { me.ki = Math.min(KI_MAX, me.ki + ki); notes.push('+' + ki + ' ENERGY') }
  const g = kitNum(c, /Ultimate gauge by (\d+)%/); if (g) { me.gauge = Math.min(GAUGE_MAX, me.gauge + g); notes.push('+' + g + '% ULT') }
  if (/Gain Guard/.test(kitTxt(c))) { a.guard = 1; notes.push('GUARD UP') }
  return notes
}
function fighter(card, lvl = 0) {
  const [pwr, spd, ki, tec, def, iq] = card.st || [70, 70, 70, 70, 70, 70]
  const hp = Math.round((card.ovr * 40 + def * 12 + (card.tag ? 600 : 0)) * (card.awoke ? 1.1 : 1)) + Math.round((card.gearHp || 0) / 100)
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
const unwritten = f => f?.card.pas?.e?.lastDoor === 'sever'
const PE = f => (unwritten(f) ? f.pe : f && !f.crSealUntil && !f.silverSealed && !f.sealed && !f.aizenSealed && !(f.erasedUntil > 0) && (f.partnerSide ? f.pe.partner : f.pe)) || {}
const canTagPartner = (f, turn) => !!f.pe.partner && !f.ko && f.partnerTurn !== turn
const partnerNames = f => f.pe.partners || ['ANDROID 17', 'GOLDEN FRIEZA']
function tagPartner(f, turn, side) {
  if (!canTagPartner(f, turn)) return false
  f.partnerTurn = turn
  f.partnerSide = !f.partnerSide
  if (f.pe.tagGuard) f.guard = 1
  if (side && f.pe.team7 && !f.partnerSide) side.ki = Math.min(KI_MAX, side.ki + 2)
  if (side && f.pe.gyro && f.partnerSide) side.gauge = Math.min(GAUGE_MAX, side.gauge + 15)
  pasNote(f, partnerNames(f)[Number(f.partnerSide)] + ' TAGS IN')
  return true
}
function tagFusionKid(f, turn) {
  if (f.pe.fusionStage !== 1 || f.ko || f.fcTagTurn === turn) return false
  f.fcTagTurn = turn
  f.fcTrunks = !f.fcTrunks
  pasNote(f, f.fcTrunks ? 'TRUNKS TAGS IN' : 'GOTEN TAGS IN')
  return true
}
function autoTagPartner(f, turn) {
  if (f.pe.fusionStage === 1 && !!(f.fcAttacks & (f.fcTrunks ? 2 : 1)) && f.fcAttacks !== 3) tagFusionKid(f, turn)

  if (f.pe.team7 || f.pe.beastDuo || f.pe.gyro || f.pe.tagGuard || f.card.id === 'gon_vs_killua_best_friends') return
  const ready = f.pe.deadCalm ? f.sunCounter : f.pe.sashMark ? f.sashReady : f.pe.storeFlame ? f.flame >= 3 : f.hp >= f.max * .6
  if (!!ready !== !!f.partnerSide) tagPartner(f, turn)
}
const rangedHit = (fighter, kind) => kind === 'blast' || kind === 'burst' || (kind === 'special' && fighter.card.rangedSpecial)
// Avoid feeding an absorber if a different attack is affordable. Otherwise
// spend an Art so an all-ranged hand can draw a replacement next turn.
function avoidAbsorbedArts(side, opponent) {
  const fighter = act(side), target = act(opponent)
  return PE(target).absorbRanged && !PE(fighter).antiKit &&
    side.hand.some(kind => ATTACK_ARTS.includes(kind) && !rangedHit(fighter, kind) && artCost(fighter, kind, side, opponent) <= side.ki)
}
function absorbBlast(att, def) {
  if (def.absorbSource !== att.key) { def.absorbSource = att.key; def.absorbed = 0 }
  const steps = Math.max(1, 4 - def.absorbed)
  def.absorbed = Math.min(4, def.absorbed + 1)
  for (const k of ['pwr', 'ki', 'def']) def[k] += Math.ceil(Math.max(0, att[k] - def[k]) / steps)
}
let PASLOG = null // events the UI shows when a passive triggers
const pasNote = (f, extra) => {
  if (!PASLOG || !f?.card?.pas) return
  f.recapPassives = (f.recapPassives || 0) + 1
  PASLOG.push({ f, name: f.card.pas.n, extra })
}
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
const turnClock = side => side?.formTurn || 0
const storyStrikeDiscount = (f, art, side) => art === 'strike' && PE(f).storyRush && f.storyStrikeClock !== turnClock(side) ? 1 : 0
const artCost = (f, art, side, opponent) => ARTS[art].cost + (f.fcFrostTax && ATTACK_ARTS.includes(art) ? 2 : 0) - (art === 'special' && f.crDiscount ? 2 : 0) - (art === 'special' && gtForm(f) === 2 && f.gtDiscountTurn === turnClock(side) ? 2 : 0) - storyStrikeDiscount(f, art, side) + Number(!!f.gravityArts && ATTACK_ARTS.includes(art)) + Number(!!f.sageTax && ATTACK_ARTS.includes(art)) + waveArtTax(side, opponent && act(opponent), ATTACK_ARTS.includes(art), PE) + (ATTACK_ARTS.includes(art) ? batchTax(art, side, opponent, PE) : 0)
const healHP = (f, amount) => {
  if (f.deadZoneEnemy) return 0 // Dead Zones: enemies never heal
  const reduced = amount > 0 && f.hp < f.max && f.crHealCut
  if (reduced) f.crHealCut = false
  const gain = Math.min(f.max - f.hp, Math.round(amount * (f.curseOwner ? .5 : 1) * (reduced ? .5 : 1) * (f.crucibleHalf ? .5 : 1)))
  f.hp += gain
  if (gain > 0) f.recapHealing = (f.recapHealing || 0) + gain
  return gain
}
const addFlame = f => { f.flame = Math.min(3, (f.flame || 0) + 1) }
const artBit = { strike: 1, blast: 2, special: 4 }
function setActive(side, index) {
  if (side.active === index) return
  const leaving = act(side)
  leaving.heat = 0
  if (leaving.pe.shisuiFlicker) leaving.flickerEntry = null
  side.active = index
  side.switchSerial = (side.switchSerial || 0) + 1
  const entering = act(side)
  const kit = PE(leaving)
  if (!leaving.ko && kit.storyCover && !leaving.storyCoverUsed) {
    leaving.storyCoverUsed = true
    entering.shieldHp = Math.max(entering.shieldHp, Math.round(entering.max * kit.storyCover))
    side.ki = Math.min(KI_MAX, side.ki + (kit.storyCoverEnergy || 0))
    pasNote(leaving, kit.storyCoverEnergy ? 'COVER · SHIELD AND +1 ENERGY' : 'COVER · SHIELD')
  }
  if (entering.pe.shisuiFlicker) entering.flickerEntry = side.formTurn || 0
}
function refill(s) {
  while (s.hand.length < HAND) s.hand.push(drawOne(s))
  // never get stuck: a hand with no attacks swaps its oldest card for a fresh draw (up to 3 tries)
  for (let t = 0; t < 3 && !s.hand.some(a => ATTACK_ARTS.includes(a)); t++) { s.hand.shift(); s.hand.push(drawOne(s)) }
}
const weakestBench = (side, active) => side?.team.filter(f => f !== active && !f.ko).sort((a, b) => a.hp - b.hp)[0]
function syncReworkMatchup(side, foe) {
  const a = act(side), d = act(foe)
  a.aizenSealed = d.aizenSealed = false
  const sealA = !!PE(d).aizen, sealD = !!PE(a).aizen
  a.aizenSealed = sealA
  d.aizenSealed = sealD
  for (const [f, enemy] of [[a, d], [d, a]]) if (PE(f).garou) {
    for (const stat of ['pwr', 'ki', 'def']) f[stat] = Math.max(f[stat], enemy[stat])
  }
}
const basicArt = kind => kind === 'strike' || kind === 'blast'
const shinobiAlly = (side, id, excluded) => side?.team.find(f => f !== excluded && !f.ko && PE(f).shinobi === id)
const sealActive = (fighter, side) => (fighter.shinobiSeal || 0) > (side?.formTurn || 0)

const crewMember = f => f.card.anime === 'OP' &&
  ['Straw Hat Pirates', 'Straw Hats'].includes(f.card.faction)
const crewOpening = (attacker, target, side) => {
  if (!crewMember(attacker) || !target.crewOpening) return null
  return side?.team.find(f => f.key === target.crewOpening && f.card.name !== attacker.card.name)
}

function surviveHogyoku(fighter) {
  if (fighter.hp > 0 || !fighter.hogyokuSave) return false
  fighter.hogyokuSave = false
  fighter.hp = 1
  pasNote(fighter, 'HŌGYOKU · SURVIVED AT 1 HP')
  return true
}

function newGenSignatureBudget(att, def, side, kind) {
  // Specials and Ultimates share a per-target budget across their follow-up hits.
  if (!att.newGenBoss || !['strike', 'blast', 'special', 'ult', 'burst'].includes(kind)) return null // every boss attack shares one per-turn budget per target
  if (!side.newGenSignature || side.newGenSignature.turn !== (side.formTurn || 0)) {
    side.newGenSignature = { turn: side.formTurn || 0, targets: new WeakMap() }
  }
  const { targets } = side.newGenSignature
  const fraction = (att.ngEnrage === 2 && !isAoe(att.card) ? .7 : .45) + (side.newGenPunished ? .15 : 0) // late single-target bosses can finish fighters
  const limit = Math.max(1, Math.floor(def.max * fraction))
  const remaining = Math.max(0, limit - (targets.get(def) || 0))
  return { remaining, spend: damage => targets.set(def, limit - remaining + damage) }
}

function hit(att, def, base, stat, pierce, A, D, kind, ranged = rangedHit(att, kind), mod = {}) {
  const pa = A ? passives(A) : {}, pd = D ? passives(D) : {}, ea = PE(att), ed = ea.antiKit || mod.sever ? {} : PE(def) // Toji: enemy defensive kit is cancelled
  const offensive = ['strike', 'blast', 'special', 'ult'].includes(kind)
  const gtAction = A?.reworkAction
  if (offensive && ea.gtForm === 5 && gtAction != null) {
    if (att.gtPierceTurn !== turnClock(A)) {
      att.gtPierceTurn = turnClock(A)
      att.gtPierceAction = gtAction
    }
    if (att.gtPierceAction === gtAction) { pierce = true; mod = { ...mod, noDodge: true } }
  }
  if (kind === 'ult' && ea.ftErza) {
    mod = { ...mod, noDodge: true }
    if (att.ftErzaBreakTurn === turnClock(A)) base *= 1.5
  }
  const ice = (kind === 'special' || kind === 'ult') && def.ftIce
  if (ice) base *= 1.4
  let sharinganRead = false
  if (offensive && ed.storyRead && A && !unwritten(att)) {
    const entry = (A.switchSerial || 0) + ':' + att.key
    if (def.storyObserved?.entry !== entry) {
      def.storyObserved = { entry }
      def.storyPierce = null
    }
    const observation = def.storyObserved
    const action = A.reworkAction || 0
    if (observation.action !== action) {
      if (!observation.used && observation.kind === kind) {
        observation.used = true
        observation.repeated = action
        def.storyPierce = entry
        pasNote(def, 'SHARINGAN READ · DAMAGE REDUCED')
      }
      observation.kind = kind
      observation.action = action
    }
    sharinganRead = observation.used && observation.repeated === action
  }
  const mark = offensive && def.storyMark
  const useMark = mark && A?.team.some(f => f.key === mark.source) && mark.source !== att.key

  const raidOpening = offensive && A?.raidOpening
  if (raidOpening) base *= 1.35
  if (offensive && A?.courtRepeat) base *= .65
  if (offensive && att.ifritIgnited) base *= 1.35
  const clock = A?.formTurn || 0
  const attackKit = ea.shinobi, defenseKit = ed.shinobi
  if (offensive && !mod.noDodge && ed.batch === 'yoruichi' && A && D && def === act(D) && def.batchFlashTurn !== clock) {
    def.batchFlashTurn = clock
    if (D.waveArtRunning) D.waveDodgeTarget = def
    D.ki = Math.min(KI_MAX, D.ki + 1)
    D.gauge = Math.min(GAUGE_MAX, D.gauge + 10)
    def.batchFlash = true
    hit(def, att, 360, def.pwr, true, D, A, 'counter')
    pasNote(def, 'FLASH GODDESS · COUNTER · +1 ENERGY · +10% ULT')
    return { dmg: 0, hpDamage: 0, crit: false, mu: 1, miss: 'DODGED' }
  }
  if (kind !== 'redirect' && !mod.sever) {
    if (defenseKit === 22 && basicArt(kind) && (def.card.maxed || def.card.dia >= 7) && !def.sageDodged) {
      def.sageDodged = true
      att.sageTax = (A?.formTurn || 0) + 2
      if (A) hit(def, att, 100, def.pwr, false, D, A, 'counter')
      pasNote(def, 'SNAKE SAGE COUNTER')
      return { dmg: 0, crit: false, mu: 1, miss: 'DODGED' }
    }
    if (!mod.noDodge && offensive && ed.nikaDodge && def.nikaTurn !== clock) {
      def.nikaTurn = clock
      if (D?.waveArtRunning) D.waveDodgeTarget = def
      pasNote(def, 'RUBBER WORLD · DODGED')
      return { dmg: 0, crit: false, mu: 1, miss: 'DODGED' }
    }
    if (offensive && ranged && ed.magicEater && def.magicTurn !== clock) {
      def.magicTurn = clock
      if (D) D.ki = Math.min(KI_MAX, D.ki + 2)
      if (D?.waveArtRunning) D.waveDodgeTarget = def
      pasNote(def, 'MAGIC EATER · +2 ENERGY')
      return { dmg: 0, crit: false, mu: 1, miss: 'ABSORBED' }
    }
    if (!mod.noDodge && D?.waveArtRunning && D.waveDodgeTarget === def) return { dmg: 0, crit: false, mu: 1, miss: 'DODGED' }
    if (!mod.noDodge && ed.godspeed && !def.waveDodged) {
      def.waveDodged = true
      if (D?.waveArtRunning) D.waveDodgeTarget = def
      pasNote(def, 'GODSPEED · DODGED')
      return { dmg: 0, crit: false, mu: 1, miss: 'DODGED' }
    }
    // defensive dodges / nullifies first
    if (def.cylinder && A !== D) { def.cylinder = 0; const r = Math.round(base * (stat / 80) * (100 / (60 + att.def * .5)) * 1.2); att.hp = Math.max(0, att.hp - r); if (att.hp <= 0 && !surviveHogyoku(att) && !gtSurvive(att, A) && !shrineWaveSurvive(att, pasNote) && !fusionCaptainSave(att, A, pasNote) && !fairySurvive(att, A, PE, pasNote)) att.ko = true; att.taken = (att.taken || 0) + r; pasNote(def, 'MAGIC CYLINDER · ' + r.toLocaleString() + ' REFLECTED'); return { dmg: 0, crit: false, mu: 1, miss: 'REFLECTED' } }
    if (offensive && kind === 'blast' && A && D && (ed.samehada || ed.ukitakeReturn)) {
      const turn = turnClock(A)
      if (def.releaseAbsorbTurn !== turn) {
        def.releaseAbsorbTurn = turn
        if (ed.samehada) {
          def.samehadaCharge = Math.min(3, (def.samehadaCharge || 0) + 1)
          healHP(def, def.max * .12)
          if (A.ki > 0) { A.ki--; D.ki = Math.min(KI_MAX, D.ki + 1) }
        } else {
          def.ukitakeCharge = true
          D.ki = Math.min(KI_MAX, D.ki + 2)
        }
        pasNote(def, ed.samehada ? 'SAMEHADA · BLAST ABSORBED' : 'TWIN FISH · BLAST STORED')
        return { dmg: 0, hpDamage: 0, crit: false, mu: 1, miss: 'ABSORBED' }
      }
    }
    if (offensive && A && D && ed.vermilionEye && !mod.noDodge) {
      const action = A.reworkAction, turn = turnClock(A)
      const previous = def.vermilionObserved
      if (!previous || previous.action !== action || previous.turn !== turn) {
        def.vermilionObserved = { action, turn, kind }
        if (previous?.kind === kind && def.vermilionCounterTurn !== turn) {
          def.vermilionCounterTurn = turn
          def.vermilionReady = true
          if (D.waveArtRunning) D.waveDodgeTarget = def
          hit(def, att, 530, def.pwr, true, D, A, 'counter')
          pasNote(def, 'VERMILION EYE · COUNTER')
          return { dmg: 0, hpDamage: 0, crit: false, mu: 1, miss: 'DODGED' }
        }
      }
    }
    if (ed.absorbRanged && ranged) {
      if (kind === 'blast') {
        const alreadyMatched = def.absorbSource === att.key && def.absorbed === 4
        absorbBlast(att, def)
        if (!alreadyMatched && def.absorbed === 4) PASLOG?.push({ f: def, highlight: 'reached or exceeded ' + att.card.name + '’s Power, Energy and Defense after absorbing four blasts.' })
      }
      if (D) D.ki = Math.min(KI_MAX, D.ki + 1)
      pasNote(def, kind === 'blast' ? `BLAST ABSORBED · ${def.absorbed}/4 · +1 ENERGY` : 'ENERGY ABSORBED · +1 ENERGY')
      return { dmg: 0, crit: false, mu: 1, miss: 'ABSORBED' }
    }
    if (def.firstNull > 0 && !ea.antiKit) { def.firstNull--; pasNote(def, 'NULLIFIED'); return { dmg: 0, crit: false, mu: 1, miss: 'NULLIFIED' } }
    if (kind === 'ult' && !ea.antiKit && !mod.noDodge && def.ultDodge > 0) { def.ultDodge--; pasNote(def, 'ERASED'); return { dmg: 0, crit: false, mu: 1, miss: 'ERASED' } }
    if (!mod.noDodge && ed.dodge && rnd(A || D) * 100 < ed.dodge) {
      if (D && ed.uiEnergy && def.uiEnergyTurn !== clock) {
        def.uiEnergyTurn = clock
        D.ki = Math.min(KI_MAX, D.ki + 2)
      }
      if (ed.muiCounter && offensive && A && D && def.muiCounterTurn !== clock) {
        def.muiCounterTurn = clock
        const counter = hit(def, att, 220, def.pwr, false, D, A, 'counter')
        pasNote(def, 'ULTRA INSTINCT COUNTER · ' + counter.dmg + ' DMG')
      }
      pasNote(def, 'DODGE'); return { dmg: 0, crit: false, mu: 1, miss: 'DODGE' } }
    if (!D?.team.some(f => f !== def && !f.ko && !D.antithesisUsed && PE(f).lastDoor === 'antithesis') && ea.onePunch && kind === 'strike' && !att.shisuiArtDamp && !(ed.remSacrifice && !def.waveRemUsed) && !(ed.yhwach && !def.futureUsed) && !D?.team.some(f => !f.ko && PE(f).choso && !D.chosoSaved) && !D?.team.some(f => f !== def && !f.ko && PE(f).shinobi === 17 && !f.bondUsed) && !def.campaignTell && !def.encounterPhase && !def.scoreBoss && !def.deadZoneEnemy && !(ed.crew === 'asura' && def.endure > 0) && def.rivalBarrier == null && def.card.r !== 'X' && rnd(A || D) * 100 < ea.onePunch) { const d0 = def.hp; if (!ea.antiKit && rewriteLethalHit(def, D, PE, healHP, pasNote)) return { dmg: 0, hpDamage: 0, crit: false, mu: 1, miss: 'REJECTED' }; def.hp = 0; if (!surviveHogyoku(def)) { if (gtSurvive(def, D)) pasNote(def, 'SAIYAN RESOLVE · SURVIVED'); else if (!shrineWaveSurvive(def, pasNote) && !fusionCaptainSave(def, D, pasNote) && !fairySurvive(def, D, PE, pasNote)) { def.ko = true; att.kos++ } } att.dealt += d0; pasNote(att, 'ONE PUNCH'); return { dmg: d0, crit: true, mu: 1 } }
  }
  if (offensive && !mod.noDodge && ed.batch && def.batchDodge && (ed.batch !== 'juvia' || kind === 'strike')) {
    def.batchDodge = false
    if (D?.waveArtRunning) D.waveDodgeTarget = def
    if (ed.batch === 'muichiro') def.batchCounter = true
    if (ed.batch === 'mirio' && A && D && !att.ko) hit(def, att, 510, def.pwr, true, D, A, 'counter')
    pasNote(def, ed.batch === 'mirio' ? 'PERMEATION COUNTER' : 'DODGED')
    return { dmg: 0, crit: false, mu: 1, miss: 'DODGED' }
  }
  if (offensive && att.batchChill) {
    if (att.batchChillAction == null) att.batchChillAction = A?.reworkAction ?? 0
    if (att.batchChillAction === (A?.reworkAction ?? 0)) base *= .5
    else att.batchChill = false
  }
  const opening = offensive && !mod.followup && crewOpening(att, def, A)
  if (opening && ea.crew === 'asura' && kind === 'ult') base *= 1.25
  let ignoreDef = mod.ignoreDef || 0
  if (offensive && A && def.sharinganReveal && def.sharinganReveal !== att.key) {
    def.sharinganReveal = null
    ignoreDef = Math.max(ignoreDef, .15)
  }
  const crit = rnd(A || D) < .08 + att.tec / 1200 + (pa.crit || 0) / 100 + (ea.crit || 0) / 100 || (ea.every3crit && (att.attacks + 1) % 3 === 0)
  const elemental = matchup(att, def)
  const mu = mod.sever ? Math.max(1, elemental) : elemental
  let dmg = base * (stat / 80) * (100 / (60 + def.def * .5 * (1 - (def.shred || 0) / 100) * (1 - ignoreDef))) * (0.92 + rnd(A || D) * .16) * (crit ? (ea.critMult || 1.5) : 1) * mu
  const tagB = att.card.tag ? kitNum(att.card, /\+(\d+)% damage/) : 0; if (tagB) dmg *= 1 + tagB / 100
  // attacker passive multipliers
  // Aokiji cancels the stage bonus when he takes the hit.
  const worldMonarch = ed.stopWorldMonarch ? (ea.worldMonarch || 0) : 0
  const reversed = (att.reversalUntil || 0) > clock
  const suppressBuffs = reversed || sealActive(att, A)
  let m = 1 + ((ea.dmg || 0) - worldMonarch) / 100 + (suppressBuffs ? 0 : (att.rage || 0) + (att.arise || 0)) / 100
  if (ea.ramp && !suppressBuffs) m += Math.min(ea.rampMax || 99, ea.ramp * att.turns) / 100
  if (ea.stack && !suppressBuffs) m += Math.min(ea.stackMax || 99, ea.stack * att.hitsTaken) / 100
  if (ea.dmgLow && att.hp / att.max * 100 < (ea.lowAt || 50)) m += ea.dmgLow / 100
  if (ea.ablaze && att.hp / att.max < .3) m += ea.ablaze / 100
  if (ea.exec && def.hp / def.max < .4) { m += ea.exec / 100; pasNote(att, 'EXECUTE +' + ea.exec + '%') }
  if (ea.vsHigh && def.card.ovr > att.card.ovr) m += ea.vsHigh / 100
  if (ea.vsCat?.some(tag => (def.card.cat || []).includes(tag))) m += ea.vsCatB / 100
  if (ea.vsAnime && def.card.anime === ea.vsAnime) m += ea.vsAnimeB / 100
  if (ea.rika) { m += ea.rika / 100; pasNote(att, 'RIKA +' + ea.rika + '%') }
  if (ea.blackflash && rnd(A || D) * 100 < ea.blackflash) { m *= 2.5; pasNote(att, "BLACK FLASH") }
  const isSpecialOrUltimate = kind === 'special' || kind === 'ult'
  if (ed.weakTo) {
    const hitsWeakness = ed.weakTo.some(t => tagsOf(att.card).includes(t)) ||
      (ed.championWeakness && ea.championWeakness && isSpecialOrUltimate)
    if (hitsWeakness) { m += (ed.weakB || 50) / 100; att.hitWeak = 1 }
    else m -= (def.deadZoneEnemy ? Math.min(30, ed.resist || 0) : (ed.resist || 0)) / 100
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
  if (A && !suppressBuffs) {
    m += (A.teamDmg || 0) / 100
    if (A.team.some(f => f !== att && !f.ko && PE(f).batch === 'soiFon')) m += .2
    if (att.card.faction === 'Espada' || att.card.cat?.includes('Espada')) {
      const nelBonus = A.team.reduce((best, f) => f !== att && !f.ko ? Math.max(best, PE(f).nelEspada || 0) : best, 0)
      m += nelBonus / 100
    }
    if ((A.batchResolveUntil ?? -1) >= turnClock(A)) m += .2
  }
  if (ed.vuln) m += ed.vuln / 100
  if (ea.hellfire) m += (att.heat || 0) * .10
  if (ed.hellfire) m += (def.heat || 0) * .05
  if (ea.sickleMark && dmg > 0 && def.sashOwner === att.key) {
    def.sashOwner = null; att.sashReady = false; m += .35
    def.burn = Math.max(def.burn, 6); def.burnT = Math.max(def.burnT, 3)
    pasNote(att, 'BLOOD SICKLE · MARK CONSUMED')
  }
  if (ea.wheel) m += Math.min(32, 8 * att.hitsTaken) / 100
  dmg *= m * (att.embersSpent ? .75 : 1) * (A?.campaignDamage || 1) * (att.ngEnrage && att.hp < att.max * .5 ? (att.hp < att.max * .25 ? (att.ngEnrage === 2 ? 1.9 : 1.6) : (att.ngEnrage === 2 ? 1.45 : 1.3)) : 1) // late New Gen bosses enrage when low
  if (sharinganRead) dmg *= .6
  if (useMark && mark.kind === 'dogs') dmg *= 1.15
  if (pa.dmg) dmg *= 1 + pa.dmg / 100
  if (pd.dr && !mod.sever) dmg *= 1 - pd.dr / 100
  if (ed.deadCalm && def.deadCalm) { def.deadCalm = false; def.sunCounter = true; dmg *= .5; pasNote(def, 'DEAD CALM · COUNTER READY') }
  if (ed.dr && !ea.trueDmg && !mod.ignoreDR) { dmg *= 1 - ed.dr / 100; if (ed.dr >= 10) pasNote(def, '-' + ed.dr + '% DMG') }
  if (worldMonarch) { dmg *= .6; pasNote(def, 'ICE WALL · -40% DMG') }
  if (ed.adapt && !ea.trueDmg && !mod.ignoreDR) dmg *= 1 - Math.min(ed.adaptMax || 30, ed.adapt * def.hitsTaken) / 100
  if (ed.wheel && !mod.ignoreDR) { const seen = def.wheelSeen || (def.wheelSeen = {}); dmg *= 1 - Math.min(48, 12 * def.hitsTaken) / 100; if (seen[kind]) dmg *= .8; else seen[kind] = 1; if (def.hitsTaken < 4) pasNote(def, def.hitsTaken === 3 ? 'FULLY ADAPTED' : 'WHEEL TURNS · ' + (def.hitsTaken + 1)) }
  if (def.fort && !mod.sever) dmg *= .7
  if (offensive && ranged && ed.truthOrbs &&
      (def.orbTurn !== clock || (A?.reworkAction && def.orbAction === A.reworkAction))) {
    def.orbTurn = clock
    def.orbAction = A?.reworkAction
    dmg *= .5
  }
  if (ea.hiei && def.burnT) dmg *= 1.35
  if (ea.magicEater && isDragon(def.card)) dmg *= 1.3
  if (ea.mugetsu) dmg *= att.ultFired ? 1.1 : 1.25
  if (ea.kashimo && att.ultFired && kind !== 'ult') dmg *= 1.2
  if (att.reworkDamp) dmg *= .5
  if (offensive && D && !ea.antiKit && !mod.sever && !unwritten(att)) {
    const hypnosis = D.team.find(f => !f.ko && PE(f).aizen)
    if (hypnosis && (D.hypnosisTurn !== clock || (A?.reworkAction && D.hypnosisAction === A.reworkAction))) {
      D.hypnosisTurn = clock
      D.hypnosisAction = A?.reworkAction
      dmg *= .5
    }
  }
  if (A?.kuramaTarget === def.key) dmg *= 1.25
  if (A?.waveParasite === def.key) dmg *= 1.2
  if (ed.dweller && kind === 'blast') {
    const prevented = Math.round(dmg * .3)
    def.waveStored = prevented
    dmg -= prevented
  }
  if (offensive && att.uzuhikoWeaken) { dmg *= .75; att.uzuhikoWeaken = false }
  if (offensive && reversed) dmg *= .85
  if (offensive && !suppressBuffs && attackKit === 9 && att.turns <= 2) dmg *= 1.3
  if (offensive && !suppressBuffs && att.karmaSurge) { dmg *= 1.25; att.karmaSurge = false }
  if (basicArt(kind) && attackKit === 5 && def.karmaMark === att.key) { dmg *= 1.3; def.karmaMark = null }
  if (offensive && def.sunMoonMark && def.sunMoonMark !== att.key) { dmg *= 1.2; def.sunMoonMark = null }
  if (defenseKit === 8 && basicArt(kind) && def.hp > def.max / 2) dmg *= .8
  if (defenseKit === 14 && !mod.ignoreDR) dmg *= .8
  if (defenseKit === 21 && !mod.ignoreDR) {
    def.susanooStored = Math.min(Math.round(def.max * .4), (def.susanooStored || 0) + Math.round(dmg * .25))
    dmg *= .75
  }
  if (offensive && ranged && !def.rangedRead && [4, 6, 7].includes(defenseKit)) {
    def.rangedRead = true
    if (defenseKit === 4) dmg *= .65
    if (defenseKit === 6) def.amplifiedReturn = true
    else if (D) D.ki = Math.min(KI_MAX, D.ki + 1)
  }
  if (att.shisuiArtDamp) dmg *= .5
  const flicker = kind === 'strike' && ed.shisuiFlicker && def.flickerEntry != null && !def.flickerUsed
  if (flicker) { dmg *= .5; def.flickerUsed = true; pasNote(def, 'BODY FLICKER · STRIKE DAMAGE HALVED') }
  const flickerPierce = kind === 'strike' && ea.shisuiFlicker && att.flickerPierce
  if (flickerPierce) att.flickerPierce = false
  const barrier = chargeBarrier(def, kind, ranged)
  if (!mod.sever) dmg *= barrier.multiplier * (def.rivalFlame ? .6 : 1)
  if (barrier.remaining != null) pasNote(def, barrier.remaining ? 'DESTRUCTION BARRIER · ' + barrier.remaining + '/3' : 'DESTRUCTION BARRIER BROKEN')
  const pierceAll = pierce || flickerPierce || ea.pierce || (ea.wheel && att.hitsTaken >= 4) || (kind === 'strike' && ea.pierceStrike) || (kind === 'special' && ea.pierceSpec)
  if (sealActive(def, D)) clearShinobiBuffs(def)
  const signatureBudget = A && newGenSignatureBudget(att, def, A, kind)
  if (signatureBudget) dmg = Math.min(dmg, signatureBudget.remaining)
  const piercedGuard = !!def.guard && !!pierceAll
  const blocked = def.guard && !pierceAll
  if (blocked && offensive && ed.crVegeta) {
    def.crShineCharge = Math.min(3, (def.crShineCharge || 0) + 1)
    pasNote(def, 'FINAL SHINE · ' + def.crShineCharge * 20 + '% BONUS')
  }
  if (offensive && ed.queen && def.guard && pierceAll) {
    def.queenCharge = 0
    pasNote(def, 'BRACHIO LAUNCHERS · DISARMED')
  }
  if (def.guard) {
    if (blocked) {
      dmg = guardedDamage(dmg, def.max, ed.guardStrong)
      if (offensive && ed.batch === 'gyomei') def.batchCounter = true
    }
    const merlin = offensive && blocked && !ea.antiKit && !mod.sever && D?.team.find(f => !f.ko && PE(f).batch === 'merlin' && f.batchGuardTurn !== turnClock(D))
    if (merlin) { merlin.batchGuardTurn = turnClock(D); pasNote(merlin, 'INFINITY · GUARD EXTENDED') }
    else def.guard = 0
  }
  dmg = mod.fixedDamage ?? (Math.max(1, Math.round(dmg)) + (mod.stored || 0))
  if (def.gtSaved && def.gtSaveTurn === turnClock(D)) dmg = Math.round(dmg * .5)
  if (ed.gtForm === 1 && !def.turns) dmg = Math.round(dmg * .75)
  if (signatureBudget) {
    dmg = Math.min(dmg, signatureBudget.remaining)
    signatureBudget.spend(dmg)
  }
  const shieldBeforeHit = def.shieldHp
  if (mod.batchStrip) def.shieldHp = 0
  if (def.shieldHp > 0) { const s2 = Math.min(def.shieldHp, dmg); def.shieldHp -= s2; dmg -= s2; if (s2) { def.recapShielded = (def.recapShielded || 0) + s2; pasNote(def, 'SHIELD') } }
  if (ed.elasticLove && shieldBeforeHit > 0 && def.shieldHp === 0) def.elasticCharged = true
  if (offensive && ea.batch === 'gildarts' && (piercedGuard || (shieldBeforeHit > 0 && !def.shieldHp))) {
    att.batchCrush = true
    pasNote(att, 'CRUSH · FOLLOW-UP READY')
  }
  if (offensive && !ea.antiKit && !mod.sever) {
    const remaining = batchDefense(att, def, dmg, D, mod.area || (kind === 'special' && isAoe(att.card)), PE, pasNote)
    if (dmg > 0 && remaining === 0) return { dmg: 0, hpDamage: 0, crit: false, mu, miss: 'INTERCEPTED' }
    dmg = remaining
  }
  const shibai = offensive && !mod.sever && !mod.area && !(kind === 'special' && isAoe(att.card)) && kind !== 'burst' && !ea.antiKit && shinobiAlly(D, 14, def)
  if (shibai && dmg > 0 && alive(D).filter(f => f !== shibai).every(f => f.hp / f.max >= def.hp / def.max)) {
    const share = Math.round(dmg * .3)
    const redirected = Math.min(shibai.hp, Math.round(share * .8))
    dmg -= share
    shibai.hp -= redirected
    shibai.taken = (shibai.taken || 0) + redirected
    if (!shibai.hp && !surviveHogyoku(shibai)) { shibai.ko = true; att.kos++ }
    att.dealt += redirected
    pasNote(shibai, 'DIVINE VESSEL')
  }
  const jinbe = offensive && !mod.sever && !mod.area && kind !== 'burst' && !(kind === 'special' && isAoe(att.card)) &&
    !ea.antiKit && dmg > 0 && def.hp < def.max / 2 &&
    D?.team.find(ally => ally !== def && !ally.ko && !ally.helmUsed && PE(ally).crew === 'helm')
  if (jinbe) {
    jinbe.helmUsed = true
    const share = Math.round(dmg * .35)
    dmg -= share
    const redirected = hit(att, jinbe, 0, stat, true, A, D, 'redirect', false, { fixedDamage: share })
    if (!jinbe.ko && !att.ko) {
      hit(jinbe, att, 110, jinbe.pwr, false, D, A, 'counter')
      if (!att.ko) att.crewOpening = jinbe.key
    }
    pasNote(jinbe, 'FISH-MAN KARATE · ' + redirected.dmg + ' DAMAGE TAKEN')
  }
  const uryu = offensive && !mod.sever && dmg >= def.hp && def.hp > 0 && !D?.antithesisUsed &&
    D?.team.find(ally => ally !== def && !ally.ko && PE(ally).lastDoor === 'antithesis')
  if (uryu && !att.ko) {
    D.antithesisUsed = true
    const reversal = Math.min(dmg, Math.round(att.max * .5), att.hp)
    att.hp -= reversal
    if (!att.hp && !surviveHogyoku(att)) { att.ko = true; uryu.kos++ }
    uryu.dealt += reversal
    pasNote(uryu, 'ANTITHESIS · ' + reversal + ' DAMAGE REVERSED')
    return { dmg: 0, crit: false, mu, miss: 'REVERSED' }
  }
  if (raidOpening && dmg > 0) { A.raidOpening = false; pasNote(att, 'RAID OPENING') }
  if (useMark && dmg > 0) {
    def.storyMark = null
    if (mark.kind === 'quincy') A.ki = Math.min(KI_MAX, A.ki + 1)
    pasNote(att, mark.kind === 'quincy' ? 'COVERING FIRE · +1 ENERGY' : 'DIVINE DOGS · FOLLOW-UP')
  }
  const previousHP = def.hp
  if (def.newGenBoss) dmg = Math.min(dmg, Math.ceil(def.max * def.newGenIncomingHitCap))
  if (dmg >= def.hp && !ea.antiKit && !mod.sever && rewriteLethalHit(def, D, PE, healHP, pasNote))
    return { dmg: 0, hpDamage: 0, crit: false, mu, miss: 'REJECTED' }
  const hpDamage = Math.min(def.hp, dmg)
  if (offensive && hpDamage > 0) {
    if (D?.team.some(f => !f.ko && PE(f).batch === 'orihime')) def.batchLastHit = hpDamage
    if (ed.batch === 'diane') def.batchQuake = Math.min(3, (def.batchQuake || 0) + 1)
  }
  def.hp = Math.max(0, def.hp - dmg); if (def.hp < 1) def.hp = 0; att.dealt += dmg; def.hitsTaken++
  if (D && hpDamage > 0 && (ed.gtForm === 1 || ed.gtForm === 4) && def.gtHitTurn !== turnClock(D)) {
    def.gtHitTurn = turnClock(D)
    if (ed.gtForm === 1) {
      D.ki = Math.min(KI_MAX, D.ki + 1)
      D.gauge = Math.min(GAUGE_MAX, D.gauge + 15)
      pasNote(def, 'SAIYAN RESOLVE · +1 ENERGY · +15% ULT')
    } else {
      def.gtRage = Math.min(3, (def.gtRage || 0) + 1)
      pasNote(def, 'GREAT APE RAGE · ' + def.gtRage + '/3')
    }
  }
  if (ea.crToji === 1 && shieldBeforeHit > 0 && def.shieldHp === 0) att.crBrokeShield = true
  if (hpDamage > 0) {
    fairyCharge(D, def, turnClock(D), PE, pasNote)
    if (ice) {
      def.ftIce = null
      if (ice === att.key && ea.ftGray) healHP(att, att.max * .2)
      pasNote(att, 'DEVIL ICE · SHATTERED')
    }
  }
  // on-hit passives
  if (dmg > 0 && kind === 'strike' && ea.lifeErosion && A && D && att.erosionTurn !== (A.formTurn || 0)) {
    att.erosionTurn = A.formTurn || 0
    const removed = Math.min(def.max - 1, Math.round((def.startingMax || def.max) * .08))
    def.max -= removed
    def.hp = Math.min(def.hp, def.max)
    D.ki = Math.max(0, D.ki - 1)
    pasNote(att, `LIFE FORCE EROSION · −${removed} MAX HP`)
  }
  if (ed.bodyMagic && !def.bodyRestored && def.hp > 0 && def.hp < def.max * .5) {
    def.bodyRestored = true
    healHP(def, def.max * .4)
    def.rage += 25
    pasNote(def, 'BODY MAGIC · REGENERATED')
  }
  if (ea.sashMark && dmg > 0) { def.sashOwner = att.key; att.sashReady = true }
  if (ea.hellfire && dmg > 0) { def.burn = Math.max(def.burn, 3 + (att.heat || 0)); def.burnT = Math.max(def.burnT, 3) }
  if (ea.drain && !ea.noHeal) healHP(att, Math.round((ea.hpDrain ? hpDamage : dmg) * ea.drain / 100))
  if (ed.reflect && dmg > 0 && !(ea.pierceReflect && isSpecialOrUltimate)) { const rf = Math.round((def.card.id === 'meliodas_vs_escanor' ? hpDamage : dmg) * ed.reflect / 100); att.hp = Math.max(1, att.hp - rf); pasNote(def, 'REFLECT ' + rf) }
  if (ed.thorns) att.hp = Math.max(1, att.hp - Math.round(att.max * ed.thorns / 100))
  if (ea.shred) def.shred = Math.min(30, (def.shred || 0) + ea.shred)
  if (hpDamage > 0) {
    if (ea.artBurn && !PE(def).natsuRework && (ea.hiei || kind === 'strike' || kind === 'special')) {
      def.burn = Math.max(def.burn, ea.artBurn); def.burnT = Math.max(def.burnT, 3)
    }
    if (ea.worldCut && (kind === 'special' || kind === 'ult')) {
      def.max = Math.max(Math.round((def.startingMax || def.max) * .7), def.max - Math.round((def.startingMax || def.max) * .1)) // never below 70% of starting max HP
      def.hp = Math.min(def.hp, def.max)
    }
    if (A && D && (def.sealed || def.aizenSealed || def.erasedUntil > 0) && !A.chainReward && A.team.some(f => !f.ko && PE(f).chainJail)) {
      A.chainReward = true
      A.ki = Math.min(KI_MAX, A.ki + 1)
      A.gauge = Math.min(GAUGE_MAX, A.gauge + 10)
    }
  }
  if (kind !== 'redirect' && ea.burn && !PE(def).natsuRework) { def.burn = Math.max(def.burn, ea.burn); def.burnT = 3 }
  if (kind !== 'redirect' && ea.energyBurn && D) D.ki = Math.max(0, D.ki - ea.energyBurn)
  if (kind !== 'redirect' && ea.freeze && rnd(A || D) * 100 < ea.freeze) { def.frozen = 1; pasNote(att, 'FROZEN') }
  if (kind !== 'redirect' && ea.gaugeDeny) def.gaugeDeny = ea.gaugeDeny
  if (ed.bigHitHeal && dmg > def.max * .2 && def.hp > 0) healHP(def, Math.round(def.max * ed.bigHitHeal / 100))
  if (kind !== 'redirect' && ea.recoil) att.hp = Math.max(1, att.hp - Math.round(att.max * ea.recoil / 100))
  // knockouts, with survive / revive passives
  if (def.scoreBoss && def.hp <= 0) def.hp = Math.max(1, Math.round(def.max * .3))
  if (def.campaignTell && def.hp < def.max * .35) def.hp = Math.ceil(def.max * .35)
  if (def.hp === 0 && !def.ko && def.encounterPhase && D) {
    def.encounterPhase = false
    def.hp = Math.max(1, Math.round(def.max * .35))
    def.rage = (def.rage || 0) + 25
    D.gauge = GAUGE_MAX
    if (def.deadZoneEnemy) def.guard = 1
    pasNote(def, 'FINAL STAND · ULTIMATE READY')
  }
  if (def.hp === 0 && !def.ko) surviveHogyoku(def)
  if (def.hp === 0 && !def.ko && gtSurvive(def, D)) pasNote(def, 'SAIYAN RESOLVE · SURVIVED AT 25% HP')
  if (def.hp === 0 && !def.ko && !shrineWaveSurvive(def, pasNote)) fusionCaptainSave(def, D, pasNote)
  if (def.hp === 0 && !def.ko) {
    const noSurvive = !def.newGenBoss && (ea.noSurvive || mod.noSurvive)
    if (!noSurvive) fairySurvive(def, D, PE, pasNote)
  }
  if (def.hp === 0 && !def.ko) {
    const noSurvive = !def.newGenBoss && (ea.noSurvive || mod.noSurvive)
    if (noSurvive && (def.endure > 0 || def.revive > 0 || (ed.ablaze && !def.ablazeUsed))) { def.endure = 0; def.revive = 0; def.ablazeUsed = 1; pasNote(att, 'NO SECOND CHANCES') }
    const choso = !noSurvive && !D?.chosoSaved && D?.team.find(f => !f.ko && PE(f).choso)
    const protector = !noSurvive && !ea.antiKit && D?.team.find(f => f !== def && !f.ko && !f.bondUsed && PE(f).shinobi === 17)
    if (protector && !protector.bondUsed) {
      protector.bondUsed = true
      def.hp = 1
      def.shieldHp = Math.max(def.shieldHp, Math.round(def.max * .2))
      if (A && !att.ko && !['counter', 'redirect'].includes(kind)) hit(protector, att, 120, protector.pwr, false, D, A, 'counter')
      pasNote(protector, 'PROTECTIVE BOND')
    } else if (!noSurvive && ed.hollowInstinct && !def.hollowInstinctUsed && D) {
      def.hollowInstinctUsed = true
      def.hp = Math.max(1, Math.round(def.max * .4))
      D.gauge = GAUGE_MAX
      pasNote(def, 'HOLLOW INSTINCT · SURVIVED · ULTIMATE READY')
    } else if (!noSurvive && ed.yhwach && !def.futureUsed) {
      def.futureUsed = true
      healHP(def, def.max * .4)
      if (D) D.gauge = GAUGE_MAX
      pasNote(def, 'REWRITE THE FUTURE')
    } else if (choso) {
      D.chosoSaved = true
      def.hp = 1
      for (const ally of D.team) if (!ally.ko) ally.shieldHp = Math.max(ally.shieldHp || 0, Math.round(ally.max * .2))
      pasNote(choso, 'BLOOD OF THE ELDEST')
    } else if (!noSurvive && ed.remSacrifice && !def.waveRemUsed) {
      def.waveRemUsed = true
      def.hp = 1
      for (const ally of D?.team || [def]) if (!ally.ko) ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * .15))
      pasNote(def, 'REM’S SACRIFICE · TEAM SHIELDED')
    } else if (def.endure > 0) {
      def.endure--; def.hp = 1
      pasNote(def, 'ENDURED')
      if (ed.endureRage) def.rage += ed.endureRage
      if (ed.endureEnergy && D) D.ki = Math.min(KI_MAX, D.ki + ed.endureEnergy)
      if (ed.ironShadow && !def.shadowEscaped) { def.shadowEscaped = true; def.iron = Math.min(3, (def.iron || 0) + 2); pasNote(def, 'SHADOW ESCAPE') }
      if (ed.lastEmbers && !def.lastStand && D) { def.lastStand = true; D.gauge = GAUGE_MAX; pasNote(def, 'LAST EMBERS · ULTIMATE READY') }
      if (def.pe.forcedTag && !def.sealed && !def.erasedUntil && !def.forcedTagged) {
        def.forcedTagged = true; def.partnerSide = !def.partnerSide
        pasNote(def, partnerNames(def)[Number(def.partnerSide)] + ' TAKES OVER')
      }
    }
    else if (!noSurvive && D && D.angel && D.angel !== def) { D.angel.angelUsed = 1; D.angel = null; def.hp = 1; pasNote(def, 'SAVED') }
    else if (ed.ablaze && !def.ablazeUsed && def.hp / def.max < .3) { def.ablazeUsed = 1; def.hp = 1; pasNote(def, 'HEART ABLAZE') }
    else if (def.revive > 0 && !mod.noRevive) { healHP(def, def.max * def.revive / 100); def.revive = 0;
      if (ed.ashRally && D) for (const ally of D.team) if (ally !== def && !ally.ko) {
        healHP(ally, ally.max * .15)
        ally.guard = 1
      }
      if (ed.jackpot) { def.rage = (def.rage || 0) + ed.jackpot; pasNote(def, 'JACKPOT! FULLY HEALED') } else pasNote(def, 'REVIVED') }
    else {
      def.ko = true; att.kos++
      if (ea.curseWarding && def.curseOwner === att.key && A && D && act(A) === att) {
        const next = alive(D)[0]
        if (next) next.curseOwner = att.key
        A.ki = Math.min(KI_MAX, A.ki + 2)
        pasNote(att, 'CURSE TRANSFER · +2 ENERGY')
      }
      if (ea.arise) att.arise = (att.arise || 0) + ea.arise
      if (ea.koHeal) healHP(att, Math.round(att.max * ea.koHeal / 100))
    }
  }
  if (hpDamage > 0 && defenseKit === 24 && !def.sharinganRead) {
    def.sharinganRead = true
    att.sharinganReveal = def.key
  }
  if (!def.ko && hpDamage > 0) {
    if (defenseKit === 12 && !def.beastGuard && previousHP >= def.max / 2 && def.hp < def.max / 2) {
      def.beastGuard = true
      def.shieldHp = Math.max(def.shieldHp, Math.round(def.max * .2))
    }
    if (defenseKit === 16 && !def.karmaSurged && def.hp <= def.max / 2 && D) {
      def.karmaSurged = def.karmaSurge = true
      D.ki = Math.min(KI_MAX, D.ki + 1)
    }
  }
  if (opening && hpDamage > 0) {
    def.crewOpening = null
    const setup = PE(opening).crew
    if (!opening.ko && setup === 'bounce') {
      opening.shieldHp = Math.max(opening.shieldHp, Math.round(opening.max * .15))
      pasNote(opening, 'CREW FOLLOW-UP · SHIELD')
    }
    if (!opening.ko && setup === 'cook') {
      const weakest = alive(A).reduce((low, f) => !low || f.hp / f.max < low.hp / low.max ? f : low, null)
      if (weakest) healHP(weakest, weakest.max * .15)
      pasNote(opening, 'CREW FOLLOW-UP · HEAL')
    }
  }
  if (blocked && offensive && ed.queen && !def.ko && !att.ko && D && A) {
    def.queenCharge = (def.queenCharge || 0) + 1
    if (def.queenCharge >= 2) {
      def.queenCharge = 0
      hit(def, att, 200, def.ki, true, D, A, 'counter', true)
      pasNote(def, 'BRACHIO LAUNCHERS · COUNTER')
    } else pasNote(def, 'BRACHIO LAUNCHERS · 1/2')
  }
  if (blocked && offensive && ed.crew === 'prayer' && !def.ko && D && A &&
      def.prayerTurn !== (D.formTurn || 0)) {
    def.prayerTurn = D.formTurn || 0
    def.prayer = Math.min(3, (def.prayer || 0) + 1)
    if (!att.ko) hit(def, att, 110, def.pwr, false, D, A, 'counter')
    pasNote(def, 'PRAYER · ' + def.prayer + '/3')
  }
  if (flicker && !def.ko) def.flickerPierce = true
  if (ea.jackpot && !att.ko && rnd(A || D) < .12) { healHP(att, Math.round(att.max * .25)); pasNote(att, 'JACKPOT ROLL · +25% HP') }
  att.attacks++
  return { dmg, crit, mu, hpDamage, blocked: !!blocked, ...(piercedGuard ? { piercedGuard } : {}), ...(opening && hpDamage > 0 ? { usedOpening: true } : {}) }
}
// returns a list of events for the UI to animate
const COMBOS = [
  { seq: ['strike', 'strike', 'blast'], name: 'RUSH COMBO', bonus: .45 },
  { seq: ['blast', 'strike', 'strike'], name: 'BURST CHAIN', bonus: .35 },
  { seq: ['guard', 'special'], name: 'COUNTER ART', bonus: .3 },
  { seq: ['strike', 'blast', 'special'], name: 'FULL ASSAULT', bonus: .6 },
]
function comboFor(seq) { for (const c of COMBOS) { const n = c.seq.length; if (seq.length >= n && c.seq.every((a, i) => seq[seq.length - n + i] === a)) return c } return null }
function storySpecial(attacker, target, side, foe) {
  const kit = PE(attacker)
  const clock = turnClock(side)
  const rush = kit.storyRush && attacker.storyRushClock === clock
  const jet = kit.storyJet && attacker.storyJetClock === clock
  const clay = kit.storyClay && target.storyClayOwner === attacker.key
  const read = kit.storyRead && attacker.storyPierce === (foe.switchSerial || 0) + ':' + target.key
  if (rush) attacker.storyRushClock = null
  if (clay) target.storyClayOwner = null
  if (read) attacker.storyPierce = null
  return { multiplier: (1 + (rush ? kit.storyRush / 100 : 0)) * (jet ? 1.2 : 1) * (clay ? 1.25 : 1),
    pierce: !!(read || (rush && kit.storyRush >= 35)), ignoreDef: kit.storyQuincy ? .2 : 0 }
}

function ghostDetonation(target, side, enemy, extra) {
  if (!target.fcGhost) return null
  const owner = enemy.team.find(f => f.key === target.fcGhost && !f.ko && PE(f).fusionStage === 2)
  delete target.fcGhost
  if (!owner) return null
  pasNote(owner, 'GHOST DETONATION · ' + target.card.name)
  const hits = [target, extra].filter(Boolean).filter(f => !f.ko).map(f => ({
    t: f, ...hit(owner, f, f === target ? 490 : 290, owner.ki, true, enemy, side, 'counter', false, { area: !!extra, noDodge: true }),
  }))
  return { art: 'strike', move: 'GHOST DETONATION', hits }
}

function playArt(B, who, idx) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], art = me.hand[idx], a = act(me), d = act(foe), cost = artCost(a, art, me, foe)
  if (me.ki < cost || a.ko || d.ko) return null
  if (B.noDeathNote && art === 'deathnote') return null
  if (art === 'wing' && !me.team.some(fighter => fighter.ko)) return null
  if (art === 'special' && me.confiscated && !unwritten(a)) return null
  if (art === 'burst' && me.ki < 2) return null
  const firstStoryStrike = storyStrikeDiscount(a, art, me)
  if (firstStoryStrike) a.storyStrikeClock = turnClock(me)
  me.ki -= cost; me.hand.splice(idx, 1)
  if (ATTACK_ARTS.includes(art)) {
    if (foe.team.some(f => !f.ko && PE(f).batch === 'gowther')) me.batchMemory = art
    else me.batchMemory = null
    a.fcFrostTax = false
    const ghost = ghostDetonation(a, me, foe)
    if (ghost && a.ko) return { ...ghost, who: who === 'you' ? 'ai' : 'you' }
  }
  if (who === 'you' && B.dzIntent) {
    const intent = B.dzIntent
    if (intent.art === art) intent.triggered = true
    if (intent.kind === 'mix' && ATTACK_ARTS.includes(art)) {
      if (intent.lastArt === art) intent.triggered = true
      intent.lastArt = art
    }
  }
  if (ATTACK_ARTS.includes(art)) {
    a.sageTax = false
    a.shinobiActedRound = B.turn
    if (PE(a).shinobi === 9 && a.turns <= 2) a.hp = Math.max(1, a.hp - Math.round(a.max * .06))
  }
  if (a.gravityArts && ATTACK_ARTS.includes(art)) a.gravityArts--
  if (ATTACK_ARTS.includes(art)) me.waveAttacked = true
  const brief = art === 'special' && me.waveBrief
  if (brief) me.waveBrief = false
  if (!unwritten(a)) recordWaveArt(me, foe, art, PE, KI_MAX, pasNote)
  const ev = { who, art, hits: [] }
  const crushReady = a.batchCrush
  const gt = gtForm(a), apeArt = gtArt(a, art)
  if (apeArt) ev.move = apeArt.name
  if (art === 'special' && gt === 2) delete a.gtDiscountTurn
  me.reworkAction = (me.reworkAction || 0) + 1
  a.reworkDamp = !unwritten(a) && a.futureDamp && ATTACK_ARTS.includes(art)
  if (ARTS[art].tactic && art !== 'burst') {
    if (art === 'charge') { me.chargeNext = (me.chargeNext || 0) + 35; ev.tactic = 'NEXT ATTACK +' + me.chargeNext + '%' }
    else if (art === 'transfer') { me.ki = Math.min(KI_MAX, me.ki + 2); ev.tactic = '+2 ENERGY' }
    else if (art === 'heal') { const h = healHP(a, a.max * .18); ev.tactic = '+' + h.toLocaleString() + ' HP' }
    else if (art === 'cleanse') { a.burnT = 0; a.frozen = 0; a.doom = 0; a.guard = 1; ev.tactic = 'CLEANSED · GUARD UP' }
    else if (art === 'senzu') { const h = healHP(a, a.max - a.hp); a.burnT = 0; a.frozen = 0; ev.tactic = 'SENZU BEAN · +' + h.toLocaleString() + ' HP' }
    else if (art === 'cylinder') { a.cylinder = 1; ev.tactic = 'TRAP SET · MAGIC CYLINDER' }
    else if (art === 'rumble') { const h = healHP(a, a.max * .35); me.chargeNext = (me.chargeNext || 0) + 25; ev.tactic = 'RUMBLE BALL · +' + h.toLocaleString() + ' HP · NEXT +25%' }
    else if (art === 'finger') { a.hp = Math.max(1, a.hp - Math.round(a.max * .1)); me.chargeNext = (me.chargeNext || 0) + 60; ev.tactic = 'CURSED FINGER · NEXT ATTACK +60%' }
    else if (art === 'deathnote') {
      if (d.campaignTell || d.rivalBarrier != null || d.scoreBoss || d.encounterPhase || d.deadZoneEnemy) ev.tactic = d.card.name + ' RESISTS DEATH NOTE'
      else { d.doom = 3; ev.tactic = 'DEATH NOTE · ' + d.card.name + ' HAS 3 TURNS' }
    }
    else if (art === 'hogyoku') { a.hogyokuSave = true; for (const k of ['pwr', 'ki', 'def']) a[k] = Math.round(a[k] * 1.15); ev.tactic = 'HOGYOKU · EVOLVED' }
    else if (art === 'wing') { const f = me.team.find(x => x.ko); if (f) { f.ko = false; healHP(f, f.max * .4); ev.tactic = 'RAINBOW WING · ' + f.card.name + ' REVIVED' } else ev.tactic = 'RAINBOW WING · NO ONE TO REVIVE' }
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
  const pierce = /Ignores Guard/.test(kitTxt(a.card)), kit = PE(a)
  let finishingForm = false, frostEcho = false
  foe.waveArtRunning = ATTACK_ARTS.includes(art)
  a.shisuiArtDamp = !unwritten(a) && !!a.shisuiDamp && ATTACK_ARTS.includes(art)
  if (art === 'guard') {
    a.guard = 1; ev.guard = true
    if (gt === 4) { a.gtRemembered = true; pasNote(a, 'REMEMBER PAN · SSJ4 READY') }
    if (kit.deadCalm) a.deadCalm = true
    if (kit.ironShadow) a.iron = Math.min(3, (a.iron || 0) + 1)
    if (kit.shadowDrive) a.shadowStrike = true
  }
  else if (art === 'strike') {
    const blackFlash = kit.crYuji && a.crBlackFlash
    if (blackFlash) { a.crBlackFlash = false; ev.move = 'BLACK FLASH' }
    const redLightning = kit.ftRedLightning && a.ftLightningTurn !== turnClock(me)
    if (redLightning) a.ftLightningTurn = turnClock(me)
    const ea = PE(a), n = ea.tripleStrike ? 3 : 1, per = ea.tripleStrike ? .4 : 1
    if (ea.galaxyImpact && d.shieldHp > 0) me.gauge = Math.min(GAUGE_MAX, me.gauge + 10)
    const iron = ea.ironShadow && a.iron > 0, shadow = ea.shadowDrive && a.shadowStrike
    if (iron) { a.iron--; healHP(a, a.max * .12); pasNote(a, 'IRON SHADOW · HEALED') }
    if (shadow) a.shadowStrike = false
    for (let i = 0; i < n; i++) ev.hits.push({ t: d, ...hit(a, d, 260 * chain * per * (gt === 4 ? 1.8 : blackFlash ? 1.75 : 1), a.pwr, iron || shadow || redLightning || blackFlash, me, foe, 'strike') })
    if (shadow && d.ko) me.ki = Math.min(KI_MAX, me.ki + 2)
    if (ea.doubleStrike && rnd(me) * 100 < ea.doubleStrike && !d.ko) { ev.hits.push({ t: d, ...hit(a, d, 260 * chain * .6, a.pwr, false, me, foe, 'strike') }); pasNote(a, 'DOUBLE STRIKE') }
    if (gt === 4) for (const t of alive(foe)) if (t !== d) ev.hits.push({ t, ...hit(a, t, 145 * chain, a.pwr, false, me, foe, 'strike', false, { area: true }) })
    if (blackFlash && ev.hits.some(hit => hit.dmg > 0)) {
      d.crHealCut = true
      pasNote(a, 'BLACK FLASH · NEXT HEAL HALVED')
    }
    if (redLightning) for (const target of alive(foe)) if (target !== d)
      ev.hits.push({ t: target, ...hit(a, target, 185 * chain, a.pwr, true, me, foe, 'strike', false, { area: true }) })
    if (ea.benchChip) { const b = alive(foe).filter(f => f !== d)[0]; if (b) ev.hits.push({ t: b, ...hit(a, b, 260 * ea.benchChip / 100, a.pwr, false, me, foe, 'strike') }) }
    if ((ea.zoro || ea.repeatStrike) && !d.ko) ev.hits.push({ t: d, ...hit(a, d, 130 * chain, a.pwr, false, me, foe, 'strike') })
    const bench = ea.benchStrike && weakestBench(foe, d)
    if (bench) ev.hits.push({ t: bench, ...hit(a, bench, 130 * chain, a.pwr, false, me, foe, 'strike') })
    if (ev.hits.some(x => x.t === d && x.hpDamage > 0)) {
      if (firstStoryStrike) a.storyRushClock = turnClock(me)
      if (ea.storyJet) a.storyJetClock = turnClock(me)
      if (ea.storyDogs && a.storyMarkClock !== turnClock(me) && !d.ko) {
        a.storyMarkClock = turnClock(me)
        d.storyMark = { kind: 'dogs', source: a.key }
      }
    }
    if (ea.chainBoost) a.rage = Math.min(40, (a.rage || 0) + ea.chainBoost)
  }
  else if (art === 'burst') { const k = me.ki + cost, spent = me.ki; me.ki = 0; const drag = me.team.filter(f => !f.ko && isDragon(f.card)).length >= 3; ev.move = 'BURST · ' + spent + ' ENERGY' + (drag ? ' · DRAGON FURY' : ''); ev.hits.push({ t: d, ...hit(a, d, 210 * spent * chain * (drag ? 1.5 : 1), Math.max(a.pwr, a.ki), false, me, foe, 'special', true) }) }
  else if (art === 'blast') {
    const rageBeam = gt === 4 && a.gtRage > 0
    if (rageBeam) a.gtRage--
    ev.hits.push({ t: d, ...hit(a, d, 420 * chain * (rageBeam ? 1.75 : 1), a.ki, rageBeam, me, foe, 'blast') })
    if (ev.hits[0].hpDamage > 0 && !d.ko && a.storyBlastClock !== turnClock(me)) {
      if (kit.storyQuincy) d.storyMark = { kind: 'quincy', source: a.key }
      if (kit.storyClay) d.storyClayOwner = a.key
      if (kit.storyQuincy || kit.storyClay) a.storyBlastClock = turnClock(me)
    }
    if (kit.frostClone && a.cloneReady) {
      a.cloneReady = false; frostEcho = true
      if (!d.ko) ev.hits.push({ t: d, ...hit(a, d, 231 * chain, a.ki, false, me, foe, 'blast') })
      pasNote(a, 'FROST CLONE')
    }
  }
  else if (art === 'special') {
    const batch = kit.batch
    const stone = batch === 'gyomei' && a.batchCounter
    const mist = batch === 'muichiro' && a.batchCounter
    const lotus = batch === 'lee' && a.batchStrikes >= 2
    const blood = batch === 'sanemi' && a.hp < a.max * .6
    const orange = batch === 'piccolo' ? a.batchCharge || 0 : 0
    const scarlet = kit.vermilionEye && a.vermilionReady
    const love = kit.elasticLove && a.elasticCharged
    const hornet = batch === 'soiFon'
    const markedHornet = hornet && d.batchHornet === a.key
    const flash = batch === 'yoruichi' && a.batchFlash
    const tide = batch === 'harribel' ? a.batchTide || 0 : 0
    const story = storySpecial(a, d, me, foe)
    let base = pctOf(a.card) * 3.2 * chain * story.multiplier
    if (stone) base *= 1.55
    if (flash || scarlet) base *= 1.3
    if (love) base *= 1.45
    if (markedHornet) base *= 1.5
    if (blood) base *= 1.45
    if (lotus) { base *= 1.6; a.hp = Math.max(1, a.hp - Math.round(a.max * .08)); a.batchStrikes = 0 }
    const clock = turnClock(me)
    const lightPierce = kit.ftStingForce && a.ftStingPierceTurn !== clock
    const trunksGuard = kit.fusionStage === 1 && a.fcTrunks && a.fcTrunksProc !== clock
    const petalPierce = kit.captainPetals && a.fcPetalTurn !== clock
    if (trunksGuard) a.fcTrunksProc = clock
    if (petalPierce) { a.fcPetalTurn = clock; d.shieldHp = 0 }
    const slayerSpear = kit.crToji === 2 && a.crSpearTurn !== clock
    const dragonFist = kit.crGoku && !a.crFistLanded
    if (a.crDiscount) a.crDiscount = false
    if (slayerSpear) {
      a.crSpearTurn = clock
      d.shieldHp = 0
    }
    const clearHeart = kit.ftErza && a.ftErzaSpecialTurn !== clock
    const brokeDefense = clearHeart && (d.guard || d.shieldHp > 0)
    if (lightPierce) a.ftStingPierceTurn = clock
    if (clearHeart) a.ftErzaSpecialTurn = clock
    if (clearHeart || a.ftMeteor) d.shieldHp = 0
    if (brokeDefense) {
      a.ftErzaBreakTurn = clock
      me.ki = Math.min(KI_MAX, me.ki + 2)
      pasNote(a, 'CLEAR HEART · +2 ENERGY')
    }
    if (a.ftMeteor) { a.ftMeteor = false; base *= 1.35 }
    if (a.ftTwinSpecial) { a.ftTwinSpecial = false; base *= 1.3 }
    if (kit.ftIgnia && d.burnT > 0) base *= 1.45
    if (kit.stripSpecial || kit.zoro || kit.chainJail) d.shieldHp = 0
    if (kit.chainJail && !d.ko) d.erasedUntil = d.turns + 1
    const read = kit.skillHunter && foe.waveBasic
    if (brief) base *= 1.25
    if (read === 'strike') base *= 1.5
    if (read === 'guard') d.shieldHp = 0
    if (kit.remSacrifice && d.hp * 2 < d.max) base *= 1.35
    const stored = kit.dweller ? (a.waveStored || 0) : 0
    if (kit.dweller) a.waveStored = 0
    const wavePierce = brief || read === 'guard'
    ev.move = a.card.mv
    finishingForm = kit.sunCycle && a.sunArts === 7
    const sunCounter = kit.sunCounter && a.sunCounter
    const dragonFlame = kit.igneelFlame && a.flame === 3
    const pairedFlame = kit.spendFlame && a.flame > 0
    const knight = kit.knightOpener && !a.knightUsed && d.card.ovr > a.card.ovr
    if (kit.knightOpener) a.knightUsed = true
    if (finishingForm) { a.sunArts = 0; base *= 1.55; ev.move = 'THIRTEENTH FORM' }
    if (sunCounter) { a.sunCounter = false; base *= 1.45 }
    if (pairedFlame) { base *= 1 + a.flame * .2; a.flame = 0 }
    if (dragonFlame) {
      a.flame = 0
      for (const ally of alive(me)) ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * .15))
      pasNote(a, 'FIRE DRAGON KING · TEAM SHIELDED')
    }
    if (knight) base *= 1.35
    if (kit.overheat && d.burnT) base *= 1.3
    if (kit.overheat && a.lastSpecialTurn === B.turn) a.hp = Math.max(1, a.hp - Math.round(a.max * .08))
    a.lastSpecialTurn = B.turn
    if (kit.zoro) {
      for (let i = 0; i < 3 && !d.ko; i++) ev.hits.push({ t: d, ...hit(a, d, base * .5, a.pwr, true, me, foe, 'special') })
    } else if (isAoe(a.card) || dragonFlame || pairedFlame) for (const t of alive(foe)) ev.hits.push({ t, ...hit(a, t, (t === d ? base * .75 : base * .3) * (t !== d && PE(a).aoeBoost ? 1 + PE(a).aoeBoost / 100 : 1), Math.max(a.pwr, a.ki), pierce || wavePierce || dragonFlame, me, foe, 'special') })
    else if (PE(a).twinSpec || kit.godspeed) { ev.hits.push({ t: d, ...hit(a, d, base * .6, Math.max(a.pwr, a.ki), pierce || wavePierce, me, foe, 'special') }); if (!d.ko) ev.hits.push({ t: d, ...hit(a, d, base * .6, Math.max(a.pwr, a.ki), pierce || wavePierce, me, foe, 'special') }) }
    else ev.hits.push({ t: d, ...hit(a, d, base, Math.max(a.pwr, a.ki), pierce || wavePierce || finishingForm || sunCounter || story.pierce || lightPierce || clearHeart || slayerSpear || dragonFist || trunksGuard || petalPierce || stone || mist || lotus || blood || flash || hornet || orange > 0 || tide > 0, me, foe, 'special', undefined, { ignoreDef: story.ignoreDef, ignoreDR: finishingForm, noRevive: finishingForm, stored: stored + orange + tide, batchStrip: stone || flash || hornet || scarlet, noDodge: !!(slayerSpear || flash) }) })
    if (kit.storyClone && !a.ko && !d.ko && ev.hits[0]?.hpDamage > 0)
      ev.hits.push({ t: d, ...hit(a, d, base * .5, a.pwr, false, me, foe, 'special') })
    const bench = kit.benchSpecial && weakestBench(foe, d)
    if (bench) ev.hits.push({ t: bench, ...hit(a, bench, base * .5, a.pwr, true, me, foe, 'special') })
    const landed = ev.hits.some(x => (x.hpDamage ?? x.dmg) > 0)
    if (batch === 'orihimeFinal' && !a.ko) batchSupportSpecial(me, healHP)
    if (kit.nelEspada && !a.ko) {
      const support = kit.nelRelease ? .22 : .18
      for (const ally of alive(me)) {
        healHP(ally, ally.max * support)
        ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * support))
      }
    }
    if (kit.resonance && landed && !d.ko) d.nobaraMark = a.key
    if (landed && !a.ko) {
      if (scarlet) { a.vermilionReady = false; me.ki = Math.min(KI_MAX, me.ki + 2) }
      if (love) {
        a.elasticCharged = false
        const ally = alive(me).reduce((weakest, f) => f.hp / f.max < weakest.hp / weakest.max ? f : weakest, a)
        ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * .25))
      }
      const ukitake = !d.ko && alive(me).find(f => f !== a && PE(f).ukitakeReturn && f.ukitakeCharge)
      if (ukitake) {
        ukitake.ukitakeCharge = false
        ev.hits.push({ t: d, ...hit(ukitake, d, 520, ukitake.ki, true, me, foe, 'counter') })
        pasNote(ukitake, 'TWIN FISH RETURN')
      }
    }
    if (landed && batch && !a.ko) {
      if (hornet) {
        d.batchHornet = markedHornet || d.ko ? null : a.key
        if (markedHornet) {
          me.ki = Math.min(KI_MAX, me.ki + 2)
          pasNote(a, 'NIGEKI KESSATSU · +2 ENERGY')
        } else if (!d.ko) pasNote(d, 'SUZUMEBACHI · MARKED')
      }
      if (stone || mist) a.batchCounter = false
      if (flash) a.batchFlash = false
      if (tide) { a.batchTide = 0; pasNote(a, 'TIBURÓN · STORED DAMAGE RELEASED') }
      if (batch === 'yoruichi' && !d.ko) {
        d.batchThunder = a.key
        pasNote(d, 'SHUNKŌ · THUNDER MARK')
      }
      if (mist) me.ki = Math.min(KI_MAX, me.ki + 2)
      if (orange) { a.batchCharge = 0; pasNote(a, 'ORANGE COVER CHANGE · POWER RETURNED') }
      if (blood) for (const enemy of alive(foe)) if (enemy !== d)
        ev.hits.push({ t: enemy, ...hit(a, enemy, base * .35, a.pwr, true, me, foe, 'counter') })
      if (!d.ko || batch === 'genya' || (batch === 'toga' && a.batchCopy)) {
        const follow = batchSpecial(a, d, me, foe, PE, healHP, pasNote)
        if (follow && !d.ko) ev.hits.push({ t: d, ...hit(a, d, follow, a.pwr, true, me, foe, 'counter') })
      }
      if (batch === 'rukia' && !d.ko) d.batchChillAction = null
    }
    if (landed && trunksGuard) a.guard = 1
    if (landed && !d.ko) {
      if (kit.fusionStage === 2) { d.fcGhost = a.key; pasNote(d, 'GHOST PLANTED') }
      if (petalPierce) { d.fcPetals = a.key; pasNote(d, 'PETALS · MARKED') }
      if (kit.captainFrost && a.fcFrostTurn !== clock) {
        a.fcFrostTurn = clock
        d.fcFrost = a.key
        d.fcFrostTax = true
        pasNote(d, 'FROST · NEXT ATTACK COSTS +2 ENERGY')
      }
    }
    if (landed && (kit.crToji === 1 || kit.crSukuna === 1)) a.crSpecialLanded = true
    if (landed && slayerSpear) {
      d.crSealUntil = turnClock(foe) + 1
      a.crSealTurn = clock
      a.crSealTarget = d.key
      if (d.ko) me.ki = Math.min(KI_MAX, me.ki + 2)
      pasNote(d, 'CURSED TOOL MASTERY · PASSIVE SEALED')
    }
    if (landed && dragonFist) {
      a.crFistLanded = true
      me.ki = Math.min(KI_MAX, me.ki + 3)
      me.gauge = Math.min(GAUGE_MAX, me.gauge + 25)
      pasNote(a, 'DRAGON FIST · +3 ENERGY · +25% ULT')
    }
    if (landed && kit.crSukuna === 2 && shrineActive(a, foe) && (foe.switchSerial || 0) === a.crShrineSwitch) {
      d.crShrineMark = a.key
      pasNote(d, 'MALEVOLENT SHRINE · MARKED')
    }
    if (landed && lightPierce) {
      me.ki = Math.min(KI_MAX, me.ki + 2)
      pasNote(a, 'DRAGON FORCE · +2 ENERGY')
    }
    if (landed) {
      me.ki = Math.min(KI_MAX, me.ki + (kit.refundRework || Number(!!kit.zoro)))
      if (kit.drainSpecial) foe.ki = Math.max(0, foe.ki - kit.drainSpecial)
      if (kit.kuramaMark) me.kuramaTarget = d.key
      if (kit.choso) healHP(a, ev.hits.reduce((n, x) => n + (x.hpDamage || 0), 0) * .15)
      if (kit.todoroki) { d.burn = Math.max(8, d.burn || 0); d.burnT = 3 }
    }
    if (kit.natsuRework) { healHP(a, a.max * .12); me.ki = Math.min(KI_MAX, me.ki + 2) }
    if (kit.yuta) for (const ally of alive(me)) healHP(ally, ally.max * .1)
    if (kit.truthOrbs && landed) a.shieldHp = Math.max(a.shieldHp || 0, Math.round(a.max * .2))
    if (kit.conjunction) me.conjunction = true
    if (kit.hundredHeal && !a.ko) for (const ally of alive(me)) {
      healHP(ally, ally.max * .15)
      ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * .15))
    }
    if (kit.gravityKing) foe.ki = Math.max(0, foe.ki - 1)
    if (read === 'blast' || (kit.godspeed && landed)) me.ki = Math.min(KI_MAX, me.ki + 2)
    if (landed && kit.parasite) me.waveParasite = d.key
    if (landed && kit.bungee && !d.ko) {
      for (const enemy of foe.team) if (enemy.waveGum === a.key) enemy.waveGum = null
      d.waveGum = a.key
    }
    if (kit.frostClone) a.cloneReady = true
    if (landed) {
      if (knight) me.ki = Math.min(KI_MAX, me.ki + 2)
      if (kit.gravity && !d.ko) d.gravityArts = 2
      if (kit.curseWarding && !d.ko) d.curseOwner = a.key
      if (kit.erasure && !a.erased && !d.ko) { a.erased = true; d.erasedUntil = d.turns + 1; pasNote(a, 'ERASURE · PASSIVE OFF') }
    }
    if (kit.hellfire && a.heat === 4) for (const f of alive(foe)) if (f !== d) { f.burn = Math.max(f.burn, 7); f.burnT = Math.max(f.burnT, 3) }
    for (const ally of alive(me)) if (ally !== a && PE(ally).storeFlame) addFlame(ally)
    if (PE(a).splash) for (const t of alive(foe)) if (t !== d) ev.hits.push({ t, ...hit(a, t, base * PE(a).splash / 100, Math.max(a.pwr, a.ki), pierce, me, foe, 'special') })
    if (d.rivalBarrier == null && PE(a).shambles && !a.shamUsed && a.hp / a.max < d.hp / d.max) { a.shamUsed = 1; const pa = a.hp / a.max, pd = d.hp / d.max; a.hp = Math.round(a.max * pd); d.hp = Math.max(1, Math.round(d.max * pa)); pasNote(a, 'SHAMBLES') }
  }
  if (a.ko) ev.waveCounter = true
  if (kit.crYuji && (art === 'strike' || art === 'special') && ev.hits.some(hit => hit.dmg > 0)) {
    const clock = turnClock(me)
    if (a.crYujiTurn !== clock) { a.crYujiTurn = clock; a.crYujiArts = 0 }
    a.crYujiArts |= art === 'strike' ? 1 : 2
    if (a.crYujiArts === 3 && a.crYujiPrimed !== clock) {
      a.crYujiPrimed = clock
      a.crBlackFlash = true
      pasNote(a, 'BLACK FLASH READY')
    }
  }
  if (kit.fusionStage === 1 && ATTACK_ARTS.includes(art) && ev.hits.some(hit => hit.dmg > 0)) {
    a.fcAttacks = (a.fcAttacks || 0) | (a.fcTrunks ? 2 : 1)
    if (!a.fcTrunks && art === 'strike' && a.fcGotenProc !== turnClock(me)) {
      a.fcGotenProc = turnClock(me)
      me.ki = Math.min(KI_MAX, me.ki + 2)
      pasNote(a, 'GOTEN · +2 ENERGY')
    }
  }
  if (!a.ko && ev.hits.some(result => result.dmg > 0)) {
    if (kit.batch === 'lee' && art === 'strike') a.batchStrikes = Math.min(2, (a.batchStrikes || 0) + 1)
    if (kit.batch === 'gildarts' && art === 'strike' && crushReady) {
      const target = weakestBench(foe, d)
      if (target) {
        a.batchCrush = false
        ev.hits.push({ t: target, ...hit(a, target, 470, a.pwr, true, me, foe, 'counter') })
      }
    }
    if (a.card.anime === 'FT' && a.card.name.startsWith('GRAY') && d.batchWater && !d.ko &&
        alive(me).some(f => f.key === d.batchWater && PE(f).batch === 'juvia')) {
      d.batchWater = null
      ev.hits.push({ t: d, ...hit(a, d, 500, a.ki, true, me, foe, 'counter') })
      pasNote(a, 'WATER AND ICE · FOLLOW-UP')
    }
  }
  fairyAfterArt(a, d, me, art, ev.hits, PE, pasNote)
  const dealt = ev.hits.reduce((n, x) => n + x.dmg, 0)
  if (a.reworkDamp && dealt > 0) a.futureDamp = false
  a.reworkDamp = false
  foe.waveArtRunning = false
  foe.waveDodgeTarget = null
  if (dealt > 0 && a.waveGum && !a.ko) {
    const hisoka = foe.team.find(f => f.key === a.waveGum && !f.ko && PE(f).bungee)
    a.waveGum = null
    if (hisoka) {
      const counter = hit(hisoka, a, 180, hisoka.pwr, false, foe, me, 'counter')
      ev.waveCounter = a.ko
      me.waveDodgeTarget = null
      ev.kit = ['BUNGEE GUM COUNTER · ' + counter.dmg + ' DMG']
      pasNote(hisoka, ev.kit[0])
    }
  }
  if (a.shisuiArtDamp) {
    if (dealt > 0) { a.shisuiDamp = false; pasNote(a, 'KOTOAMATSUKAMI · DAMAGE HALVED') }
    a.shisuiArtDamp = false
  }
  if (kit.shisuiFlicker && dealt > 0 && (art === 'strike' || art === 'special')) {
    if (art === 'special' && a.flickerEntry === (me.formTurn || 0)) me.ki = Math.min(KI_MAX, me.ki + 1)
    if (!a.shisuiSpent && a.shisuiMarkedTurn !== B.turn) {
      if (a.shisuiReadTurn !== B.turn) { a.shisuiReadTurn = B.turn; a.shisuiReads = [] }
      for (const { t, dmg } of ev.hits) {
        if (!dmg || !t || t.ko) continue
        const index = foe.team.indexOf(t)
        a.shisuiReads[index] = (a.shisuiReads[index] || 0) | artBit[art]
        if (a.shisuiReads[index] === 5) {
          a.shisuiMark = t.card.key
          a.shisuiMarkedTurn = B.turn
          pasNote(a, 'KOTOAMATSUKAMI MARK · ' + t.card.name)
          break
        }
      }
    }
  }
  if (gt === 1 && ATTACK_ARTS.includes(art)) a.gtAttacks = (a.gtAttacks || 0) + 1
  if (gt === 2 && ATTACK_ARTS.includes(art)) {
    const clock = turnClock(me)
    if (art === 'special') {
      if (ev.hits.some(h => h.dmg > 0)) a.gtSpecialLanded = true
      if (a.gtSpecialTurn !== clock) { a.gtSpecialTurn = clock; a.guard = 1 }
    }
    if (a.gtMixTurn !== clock) { a.gtMixTurn = clock; a.gtFirstArt = art }
    else if (a.gtFirstArt && a.gtFirstArt !== art) {
      a.gtFirstArt = null
      a.gtDiscountTurn = clock
      if (me.hand.length < 4) me.hand.push('special')
      else me.hand[3] = 'special'
      pasNote(a, 'GOLDEN MOMENTUM · DISCOUNTED SPECIAL')
    }
  }
  if (dealt > 0 && kit.hokageResolve && (art === 'strike' || art === 'blast')) {
    const clock = me.formTurn || 0
    if (a.resolveGaugeTurn !== clock) { a.resolveGaugeTurn = clock; a.resolveGaugeArts = 0 }
    if (a.resolveGaugeArts !== 3) {
      a.resolveGaugeArts |= artBit[art]
      if (a.resolveGaugeArts === 3) { me.gauge = Math.min(GAUGE_MAX, me.gauge + 15); pasNote(a, 'HOKAGE’S RESOLVE · +15% ULT') }
    }
  }
  if (dealt > 0 && art === 'special' && kit.kuramaSpecial && a.kuramaEnergyTurn !== (me.formTurn || 0)) {
    a.kuramaEnergyTurn = me.formTurn || 0
    me.ki = Math.min(KI_MAX, me.ki + 1)
    pasNote(a, 'KURAMA CHAKRA · +1 ENERGY')
  }
  if (dealt > 0 && kit.ichigoResolve && (art === 'strike' || art === 'special') && a.ichigoChargeTurn !== (me.formTurn || 0) && (a.ichigoCharge || 0) < 3) {
    a.ichigoChargeTurn = me.formTurn || 0
    a.ichigoCharge = Math.min(3, (a.ichigoCharge || 0) + (art === 'special' ? 2 : 1))
    pasNote(a, a.ichigoCharge === 3 ? 'FINAL GETSUGA READY' : 'RESOLVE · ' + a.ichigoCharge + '/3')
  }
  if (dealt > 0 && artBit[art]) {
    if (kit.sunCycle && !finishingForm && a.sunArts !== 7) {
      a.sunArts = (a.sunArts || 0) | artBit[art]
      if (a.sunArts === 7) pasNote(a, 'THIRTEENTH FORM READY')
    }
    if (kit.resolve && !a.violetReady) {
      if (a.resolveTurn !== B.turn) { a.resolveTurn = B.turn; a.resolveArts = 0 }
      a.resolveArts |= artBit[art]
      a.violetReady = a.resolveArts === 7
      if (a.violetReady) pasNote(a, 'VIOLET FLASH READY')
    }
  }
  me.gauge = Math.min(GAUGE_MAX, me.gauge + (6 + dealt / 90) * (1 + (PE(a).gaugeBoost || 0) / 100)); foe.gauge = Math.min(GAUGE_MAX, foe.gauge + dealt / 140 * (frostEcho ? .5 : 1) * (1 - (d.gaugeDeny || 0) / 100))
  if (art === 'special') ev.kit = [...(ev.kit || []), ...kitEffects(me, a)]
  return ev
}
const ULT = { FIGHTER: ['BARRAGE', 'Three crushing hits'], ASSASSIN: ['EXECUTION', 'Pierces Guard · +60% vs targets under 40% HP'], SUPPORT: ['RALLY', 'Big hit · heals the whole team 20%'], TANK: ['FORTRESS', 'Big hit · takes 30% less damage until your next turn'], SHOOTER: ['OVERDRIVE', 'Hits every enemy hard'], STRIKER: ['OVERDRIVE', 'Hits every enemy hard'] }
const RELEASE_ULTIMATES = {
  ichigo: ['CERO OF THE HOLLOW', 'Strips shields, pierces Guard, hits all enemies and refunds 15% Ultimate gauge on a damaging hit'],
  ulquiorra: ['LANZA DEL RELÁMPAGO', 'Strips shields and pierces Guard across the enemy team'],
  grimmjow: ['PANTERA EXECUTION', 'Strips shields, pierces Guard and refunds 3 Energy on a knockout'],
}
const ultOf = c => RELEASE_ULTIMATES[c.pas?.e?.releaseUltimate] || defaultUltimate(c)
const defaultUltimate = c => c.pas?.e?.batch === 'soiFon' ? ['JAKUHŌ RAIKŌBEN', 'Strips shields, pierces Guard and detonates the Hornet mark'] :
  c.pas?.e?.batch === 'orihimeFinal' ? ['I REJECT THIS FUTURE', 'Heals, shields and buffs your team'] :
  c.pas?.e?.batch === 'yoruichi' ? ['RAIJIN SENKI', 'Detonates Thunder marks for +50% damage and refunds Energy and gauge'] :
  c.pas?.e?.batch === 'harribel' ? ['CASCADA', 'Hits all enemies, spends stored damage and shields your team'] :
  c.pas?.e?.batch === 'star' ? ['NEW ORDER', 'Choose Protect or Suppress'] :
  c.pas?.e?.batch === 'merlin' ? ['INFINITY', 'Strip buffs and refund Energy and Ultimate gauge'] :
  c.pas?.e?.batch === 'rukia' ? ['WHITE MOON', 'Hits all enemies and shatters ice'] :
  c.pas?.e?.batch === 'diane' ? ['MOTHER CATASTROPHE', 'Hits all enemies and spends accumulated charges'] :
  c.pas?.e?.fusionStage === 2 ? ['SUPER GHOST KAMIKAZE ATTACK', 'Hits all enemies and detonates planted ghosts'] :
  c.pas?.e?.captainPetals ? ['SENKEI', '+60% damage against Petal marks'] :
  c.pas?.e?.captainFrost ? ['DAIGUREN HYŌRINMARU', 'Hits all enemies and shatters Frost'] :
  c.pas?.e?.crVegeta ? ['FINAL SHINE ATTACK', 'Deals up to +60% damage after blocking attacks'] :
  c.pas?.e?.crSukuna === 2 ? ['WORLD CUTTING SLASH', 'Pierces Guard and deals 50% more damage to Shrine-marked enemies'] :
  c.pas?.e?.gtForm === 4 ? ['RAMPAGE', 'Crush the active enemy and hit the entire bench'] :
  c.pas?.e?.gtForm === 5 ? ['10× KAMEHAMEHA', 'Break shields and fire at the active enemy'] : c.tag ? ['DUO FINISH', 'Both partners strike · double hit'] : (ULT[c.role] || ULT.FIGHTER)
function signatureUltimate(f, target) {
  if (PE(f).shinobi || PE(f).crew || PE(f).villain || PE(f).lastDoor) return [f.card.mv, f.card.pas.d]
  const e = PE(f)
  if (e.storyRush || e.storyRead || e.storyClone || e.storyQuincy || e.storyJet || e.storyClay) return [f.card.mv, f.card.pas.d]
  if (e.zoro) return ['THREE THOUSAND WORLDS', 'Pierces Guard and blocks survival and revival']
  if (e.choso) return ['PIERCING BLOOD', 'Pierces Guard and hits the weakest bench fighter too']
  if (e.yhwach) return ['THE ALMIGHTY', 'Halves the target’s next damaging Art']
  if (e.mugetsu && !f.ultFired) return ['MUGETSU', 'Double-strength hit that blocks survival and revival']
  if (f.card.id === VEGETA && target?.rivalBarrier === 0) return ['FINAL EXPLOSION', 'Massive single hit against Toppo after breaking the barrier']
  if (e.shisuiFlicker && !f.shisuiSpent && target && f.shisuiMark === target.card.key) return ['KOTOAMATSUKAMI', 'Pierces Guard and halves the survivor’s next damaging Art']
  if (e.ichigoResolve && f.ichigoCharge === 3) return ['FINAL GETSUGA', 'Pierces Guard, blocks survival and revives, and restores 15% max HP if it deals damage']
  if (e.galaxyImpact && !f.galaxyUsed) return ['GALAXY IMPACT', 'Removes every enemy shield before hitting the enemy team']
  if (e.lastEmbers && f.lastStand && !f.embersSpent) return ['UNITED STATES OF SMASH', 'Pierces Guard and blocks Endure and Revive']
  if (e.resolve && f.violetReady) return ['VIOLET FLASH', 'Pierces Guard and hits harder against high HP']
  return null
}
function restorationTarget(side) {
  if (side.shinobiRestored) return undefined
  return side.team.filter(f => f.ko).sort((a, b) => b.card.ovr - a.card.ovr)[0]
}

function clearShinobiBuffs(fighter, damageOnly = false) {
  fighter.rage = fighter.arise = fighter.heat = 0
  fighter.karmaSurge = fighter.amplifiedReturn = false
  if (!damageOnly) {
    fighter.shieldHp = fighter.guard = fighter.fort = 0
  }
}

function ultimate(B, who, choice) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], a = act(me), d = act(foe)
  if (me.gauge < GAUGE_MAX || a.ko || d.ko) return null
  me.reworkAction = (me.reworkAction || 0) + 1
  me.gauge = 0
  const ghost = ghostDetonation(a, me, foe)
  if (ghost && a.ko) return { ...ghost, who: who === 'you' ? 'ai' : 'you' }
  me.seq = []; me.ultTurn = B.turn; a.shinobiActedRound = B.turn
  const [uname] = ultOf(a.card), ev = { who, art: 'ultimate', move: a.card.mv, ult: uname, hits: [] }
  const awk = !!(a.card.maxed || (a.card.dia || 0) >= 7); if (awk) { ev.awakened = 1; me.ki = Math.min(KI_MAX, me.ki + 2); healHP(a, Math.round(a.max * .15)) }
  const base = pctOf(a.card) * 6 * (awk ? 1.35 : 1), stat = Math.max(a.pwr, a.ki), pierce = /Ignores Guard/.test(kitTxt(a.card))
  const kit = PE(a).shinobi
  const crew = PE(a).crew
  const villain = PE(a).villain
  const storyKit = PE(a)
  const storySignature = storyKit.storyRush || storyKit.storyRead || storyKit.storyClone || storyKit.storyQuincy || storyKit.storyJet || storyKit.storyClay
  const lastDoor = PE(a).lastDoor
  const sever = lastDoor === 'sever'
  const quirkDefenders = new Set()
  const opposingKit = PE(d).shinobi
  const single = storyKit.releaseUltimate === 'grimmjow' || (!storyKit.releaseUltimate && !storyKit.nelRelease && !storyKit.samehada && (storyKit.nelEspada || storyKit.resonance || ['star', 'merlin', 'yoruichi', 'soiFon'].includes(storyKit.batch) || PE(a).captainPetals || gtForm(a) === 5 || !!PE(a).crVegeta || PE(a).crSukuna === 2 || !!(kit || crew || villain || lastDoor || storySignature) || (!PE(a).ultAoe && !a.pe.team7 && !a.pe.beastDuo &&
    (a.card.tag || ['BARRAGE', 'EXECUTION', 'RALLY', 'FORTRESS'].includes(uname)) && !PE(a).galaxyImpact && !PE(a).choso)))
  const damaging = kit !== 14 && kit !== 20 && storyKit.batch !== 'orihimeFinal' && !PE(a).antiKit
  const minato = single && damaging && !sever && shinobiAlly(foe, 18, d)
  const interceptor = minato && !minato.raijinUsed ? minato : null
  const isshiki = damaging && !sever && !interceptor && opposingKit === 3 && !d.isshikiUsed
  if (kit === 9 && a.turns <= 2) a.hp = Math.max(1, a.hp - Math.round(a.max * .06))
  const dodged = new Set()
  const H = (t, b, p, mod) => {
    let reduction = 1
    if (t === d && interceptor) {
      if (!interceptor.raijinUsed) { interceptor.raijinUsed = true; pasNote(interceptor, 'FLYING RAIJIN') }
      t = interceptor
      reduction = .5
    }
    if (t === d && isshiki) { reduction = .3; d.isshikiUsed = true }
    if (t !== d && (a.deadZoneEnemy || a.ngEnrage)) reduction *= .3 // Dead Zone / Crucible bosses: bench splash is much weaker
    if (a.ko || t.ko) return
    if (!sever && !PE(a).antiKit && PE(t).villain === 'overload') {
      if (!t.quirkGuardUsed) {
        t.quirkGuardUsed = t.quirkCharged = true
        quirkDefenders.add(t)
        pasNote(t, 'QUIRK OVERLOAD · ULTIMATE CHARGED')
      }
      if (quirkDefenders.has(t)) reduction *= .4
    }
    if (dodged.has(t)) { ev.hits.push({ t, dmg: 0, miss: 'DODGED' }); return }
    const prior = t.waveDodged
    ev.hits.push({ t, ...hit(a, t, b * reduction, stat, p || PE(a).pierce, me, foe, 'ult', undefined, { area: !single, ...mod, stored: Math.round((mod?.stored || 0) * reduction), fixedDamage: mod?.fixedDamage == null ? undefined : Math.round(mod.fixedDamage * reduction) }) })
    if (a.ko) ev.waveCounter = true
    foe.waveDodgeTarget = null
    if ((!prior && t.waveDodged) || ((PE(t).nikaDodge || ['mirio', 'muichiro', 'yoruichi'].includes(PE(t).batch)) && ev.hits.at(-1).miss === 'DODGED') || (PE(t).magicEater && ev.hits.at(-1).miss === 'ABSORBED')) dodged.add(t)
    return ev.hits.at(-1)
  }
  const finish = () => {
    const defender = interceptor?.raijinUsed ? interceptor : isshiki && d.isshikiUsed ? d : null
    if (defender && !defender.ko && !a.ko) {
      const counter = hit(defender, a, isshiki ? 120 : 100, defender.pwr, false, foe, me, 'counter')
      pasNote(defender, 'COUNTER · ' + counter.dmg.toLocaleString() + ' DMG')
      if (a.ko) ev.waveCounter = true
    }
    ev.kit = [...(ev.kit || []), ...kitEffects(me, a)]
    a.ultFired = 1
    return ev
  }
  const ea = PE(a)
  if (ea.fusionStage === 1) a.fcAttacks = (a.fcAttacks || 0) | (a.fcTrunks ? 2 : 1)
  if (ea.fusionStage === 2) {
    let detonations = 0
    for (const target of alive(foe)) {
      const planted = target.fcGhost === a.key
      if (planted) { delete target.fcGhost; detonations++ }
      H(target, base * (target === d ? 1.05 : .54) + (planted ? base * .45 : 0), true)
    }
    me.ki = Math.min(KI_MAX, me.ki + Math.min(3, detonations))
    return finish()
  }
  if (ea.captainPetals) {
    const petals = d.fcPetals === a.key
    H(d, base * (petals ? 1.6 : 1), true)
    if (!ev.hits.some(hit => hit.dmg > 0)) return finish()
    if (petals) delete d.fcPetals
    const toshiro = !me.fcCaptainCombo && me.team.find(f => !f.ko && PE(f).captainFrost && f.key === d.fcFrost)
    if (toshiro) {
      me.fcCaptainCombo = true
      delete d.fcFrost; delete d.fcFrostTax
      if (!d.ko) H(d, base * .65, true)
      me.gauge = Math.min(GAUGE_MAX, me.gauge + 30)
      pasNote(toshiro, 'CAPTAIN COMBO · +30% ULT')
    }
    return finish()
  }
  if (ea.releaseUltimate) {
    const finisher = ea.releaseUltimate === 'grimmjow'
    for (const enemy of finisher ? [d] : alive(foe)) {
      H(enemy, base * (enemy === d ? (finisher ? 1.2 : 1) : .6), true, { batchStrip: true })
    }
    if (ea.releaseUltimate === 'ichigo' && ev.hits.some(hit => hit.hpDamage > 0))
      me.gauge = Math.min(GAUGE_MAX, me.gauge + 15)
    if (finisher && ev.hits.some(hit => hit.t.ko && hit.hpDamage > 0))
      me.ki = Math.min(KI_MAX, me.ki + 3)
    return finish()
  }
  if (ea.nelEspada && !ea.nelRelease) {
    H(d, base, false)
    return finish()
  }
  if (ea.nelRelease || ea.samehada) {
    const charge = ea.samehada ? a.samehadaCharge || 0 : 0
    a.samehadaCharge = 0
    for (const enemy of alive(foe))
      H(enemy, base * (enemy === d ? 1 : .55) * (1 + charge * .15), true, { batchStrip: !!ea.nelRelease })
    if (ea.nelRelease) me.ki = Math.min(KI_MAX, me.ki + 4)
    else for (const ally of alive(me)) ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * (.12 + charge * .06)))
    return finish()
  }
  if (ea.resonance) {
    const target = alive(foe).find(f => f.nobaraMark === a.key) || d
    const marked = target.nobaraMark === a.key
    if (marked) { target.nobaraMark = null; me.gauge = Math.min(GAUGE_MAX, me.gauge + 25) }
    H(target, base * (marked ? 1.5 : 1), true)
    return finish()
  }
  if (batchUltimate(a, d, me, foe, choice, base, H, PE, pasNote, healHP)) return finish()
  if (ea.crVegeta) {
    H(d, base * (1 + (a.crShineCharge || 0) * .2), true)
    a.crShineCharge = 0
    return finish()
  }
  if (ea.crSukuna === 2) {
    const marked = d.crShrineMark === a.key
    H(d, base * (marked ? 1.5 : 1), true)
    if (marked && ev.hits.some(hit => hit.dmg > 0)) d.crShrineMark = null
    return finish()
  }
  const gt = gtForm(a)
  if (gt === 3) a.gtApeReady = true
  if (gt === 4) {
    for (const target of alive(foe)) H(target, base * (target === d ? 1.35 : .57), false)
    return finish()
  }
  if (gt === 5) {
    d.shieldHp = 0
    H(d, base * 1.45, pierce)
    return finish()
  }
  if (storySignature) {
    ev.ult = a.card.mv
    const story = storySpecial(a, interceptor || d, me, foe)
    H(d, base * story.multiplier, pierce || story.pierce, { ignoreDef: story.ignoreDef })
    if (ea.storyClone && ev.hits[0]?.hpDamage > 0) H(d, base * .5, false)
    return finish()
  }
  if (lastDoor) {
    ev.ult = a.card.mv
    const target = interceptor || d
    if (sever) target.shieldHp = 0
    H(d, base * (sever ? 1.25 : 1), sever, { sever, ignoreDR: sever, noDodge: sever })
    if (!sever && !target.ko && ev.hits[0] && !ev.hits[0].miss && !unwritten(target)) {
      clearShinobiBuffs(target)
      target.silverSealed = (foe.formTurn || 0) + 2
      pasNote(a, 'STILL SILVER · PASSIVE SEALED')
    }
    return finish()
  }
  if (villain) {
    ev.ult = a.card.mv
    const target = interceptor || d
    const stain = villain === 'stain'
    const charged = !stain && a.quirkCharged
    if (charged) { a.quirkCharged = false; ev.overloadSpent = true }
    H(d, base * (charged ? 1.5 : 1), stain || pierce, { ignoreDef: stain ? .3 : 0 })
    if (charged) foe.ki = Math.max(0, foe.ki - 2)
    if (stain && ev.hits[0]?.hpDamage > 0) {
      if (target.ko) me.gauge = Math.min(GAUGE_MAX, me.gauge + 50)
      else { target.frozen = 1; pasNote(a, 'BLOODCURDLE') }
    }
    return finish()
  }
  if (crew) {
    ev.ult = a.card.mv
    const target = interceptor || d
    const opening = crewOpening(a, target, me)
    const prayer = a.prayer || 0
    if (crew === 'prayer') ev.prayerSpent = prayer
    const breaksGuard = ['bounce', 'asura', 'prayer'].includes(crew)
    const ignoreDef = crew === 'asura' ? .35 : crew === 'prayer' && prayer === 3 ? .3 : 0
    if (crew === 'prayer') a.prayer = 0
    H(d, base * (crew === 'prayer' ? 1 + prayer * .2 : 1), breaksGuard, { ignoreDef })
    const first = ev.hits[0]
    if (first?.hpDamage > 0 && !target.ko) {
      if (crew === 'cook') {
        target.burn = Math.max(target.burn, 5)
        target.burnT = Math.max(target.burnT, 2)
      }
      if (['bounce', 'cook'].includes(crew) && !target.crewOpening && !first.usedOpening) target.crewOpening = a.key
      if (crew === 'snake' && opening && first.usedOpening) {
        H(d, 0, true, { noDodge: true, followup: true, fixedDamage: Math.round(first.hpDamage * .5 / (interceptor ? .5 : isshiki ? .3 : 1)) })
      }
    }
    return finish()
  }
  if (kit) {
    ev.ult = a.card.mv
    const markedTarget = interceptor || d
    if (kit === 14) {
      const target = choice === undefined ? restorationTarget(me) : Number.isInteger(choice) ? me.team[choice] : undefined
      if (!me.shinobiRestored && target?.ko) {
        me.shinobiRestored = true
        target.ko = false
        target.hp = Math.max(1, Math.round(target.max * .35))
        target.shieldHp = Math.round(target.max * .15)
        target.burnT = target.doom = target.frozen = 0
        ev.ult = 'RESTORATION'
        ev.kit = [target.card.name + ' REVIVED']
      } else {
        foe.teamDmg = foe.chargeNext = 0
        for (const enemy of alive(foe)) {
          clearShinobiBuffs(enemy, true)
          enemy.reversalUntil = (foe.formTurn || 0) + 2
        }
        ev.ult = 'SHINJUTSU REVERSAL'
        ev.kit = ['DAMAGE BUFFS REMOVED · −15% DAMAGE']
      }
    } else if (kit === 20) {
      const allies = alive(me)
      for (const ally of allies) healHP(ally, ally.max * .25)
      me.ki = Math.min(KI_MAX, me.ki + allies.length - 1)
      ev.kit = ['TEAM HEAL · ENERGY RESTORED']
    } else {
      let scale = 1, mod = {}
      if (kit === 2 && !foe.ki) scale = 1.2
      if (kit === 6 && a.amplifiedReturn && !sealActive(a, me) && (a.reversalUntil || 0) <= (me.formTurn || 0)) { scale = 1.3; a.amplifiedReturn = false }
      if (kit === 10) { scale = markedTarget.hp < markedTarget.max / 2 ? 1.2 : 1; mod.noDodge = true }
      if (kit === 11) mod.ignoreDef = .25
      if (kit === 13) {
        clearShinobiBuffs(markedTarget)
        markedTarget.shinobiSeal = (foe.formTurn || 0) + 3
      }
      if (kit === 19 && markedTarget.shinobiActedRound !== B.turn) scale = 1.25
      if (kit === 21) { mod.stored = a.susanooStored || 0; a.susanooStored = 0 }
      const shieldBroken = kit === 25 && markedTarget.shieldHp > 0
      if (kit === 25) { markedTarget.shieldHp = 0; mod.ignoreDef = .3 }
      if ([12, 17].includes(kit)) {
        H(d, base * .62, pierce)
        H(d, base * .62, true)
      } else H(d, base * scale, pierce, mod)
      const primary = ev.hits[0]
      if (primary && !primary.miss) {
        if (kit === 1) { markedTarget.uzuhikoTurns = 3; markedTarget.uzuhikoWeaken = true }
        if (kit === 2 && scale === 1) foe.ki = Math.max(0, foe.ki - 1)
        if (kit === 5) markedTarget.karmaMark = a.key
        if (kit === 23) markedTarget.sunMoonMark = a.key
        const ratio = shieldBroken ? .6 : kit === 15 ? .35 : 0
        if (ratio && !markedTarget.ko && !a.ko && primary.dmg) {
          H(d, 0, true, { fixedDamage: Math.round(primary.dmg * ratio / (interceptor ? .5 : isshiki ? .3 : 1)) })
        }
      }
    }
  } else if (ea.zoro || (ea.mugetsu && !a.ultFired) || ea.choso || ea.yhwach) {
    ev.ult = ea.zoro ? 'THREE THOUSAND WORLDS' : ea.mugetsu ? 'MUGETSU' : ea.choso ? 'PIERCING BLOOD' : 'THE ALMIGHTY'
    H(d, base * (ea.mugetsu ? 2 : ea.zoro ? 1.45 : 1), true, { noSurvive: !!(ea.zoro || ea.mugetsu), noRevive: !!(ea.zoro || ea.mugetsu) })
    const bench = ea.choso && weakestBench(foe, d)
    if (bench) H(bench, base * .55, true)
    if (ea.yhwach && !d.ko) d.futureDamp = true
  } else if (a.card.id === VEGETA && d.rivalBarrier === 0) {
    ev.ult = 'FINAL EXPLOSION'
    H(d, base * 1.85, true)
  } else if (ea.shisuiFlicker && !a.shisuiSpent && a.shisuiMark === d.card.key) {
    ev.ult = 'KOTOAMATSUKAMI'
    a.shisuiSpent = true
    H(d, base * 1.3, true)
    if (!d.ko) d.shisuiDamp = true
  } else if (ea.ichigoResolve && a.ichigoCharge === 3) {
    a.ichigoCharge = 0
    ev.ult = 'FINAL GETSUGA'
    H(d, base * 1.5, true, { noSurvive: true, noRevive: true })
    if (ev.hits.some(hit => hit.dmg > 0)) healHP(a, a.max * .15)
  } else if (ea.galaxyImpact && !a.galaxyUsed) {
    a.galaxyUsed = true
    ev.ult = 'GALAXY IMPACT'
    ev.shieldsBroken = foe.team.filter(enemy => enemy.shieldHp > 0).length
    for (const enemy of foe.team) enemy.shieldHp = 0
    for (const enemy of alive(foe)) H(enemy, base * (enemy === d ? 1 : .65), true)
  } else if (ea.lastEmbers && a.lastStand && !a.embersSpent) {
    ev.ult = 'UNITED STATES OF SMASH'
    H(d, base * 1.6, true, { noSurvive: true })
    a.embersSpent = true
  } else if (ea.resolve && a.violetReady) {
    ev.ult = 'VIOLET FLASH'
    H(d, base * (1 + .5 * d.hp / d.max), true)
    a.violetReady = false; a.resolveArts = 0
  } else if (ea.sacrifice) { for (const t of [d]) H(t, base * ea.sacrifice, true); a.hp = 0; a.ko = true; pasNote(a, 'GATE OF DEATH'); ev.kit = []; a.ultFired = 1; return ev }
  if (kit || ev.ult !== uname) return finish()
  if (a.pe.team7 || a.pe.beastDuo) {
    ev.ult = a.pe.team7 ? 'RASENGAN × CHIDORI' : 'BEAST & ORANGE'
    for (const t of alive(foe)) {
      const ratio = a.pe.team7 ? (t === d ? .68 : .38) : (t === d ? .85 : .28)
      H(t, base * ratio, true)
      H(t, base * ratio, true)
    }
    return finish()
  }
  if (ea.ultAoe) { for (const t of alive(foe)) H(t, t === d ? base * (ea.yusuke ? 1.5 : 1) : base * .55);
    if (ea.yuta) for (const ally of alive(me)) ally.guard = 1
    if (ea.todoroki && !d.ko) d.frozen = 1; if (ea.ultHeal) healHP(a, Math.round(a.max * ea.ultHeal / 100)); return finish() }
  if (ea.doubleUlt || ea.twinUlt) { const k = ea.twinUlt ? .6 : 1; H(d, base * k); if (!d.ko) H(d, base * k); else { const n = alive(foe)[0]; if (n) H(n, base * k * .7) } return finish() }
  if (ea.ultHeal) healHP(a, Math.round(a.max * ea.ultHeal / 100))
  if (ea.natsuRework) { healHP(a, a.max * .12); me.ki = Math.min(KI_MAX, me.ki + 2) }
  if (a.card.tag) { H(d, base * .62, pierce); H(d, base * .62, true) }
  else if (uname === 'BARRAGE') { H(d, base * .45, pierce || (ea.kashimo && !a.ultFired)); H(d, base * .45, pierce || (ea.kashimo && !a.ultFired)); H(d, base * .45, true) }
  else if (uname === 'EXECUTION') H(d, base * (d.hp / d.max < .4 ? 1.6 : 1.05), true)
  else if (uname === 'RALLY') { H(d, base * .9, pierce); for (const f of me.team) if (!f.ko) healHP(f, Math.round(f.max * .2)); ev.rally = true }
  else if (uname === 'FORTRESS') { H(d, base * .95, pierce); a.fort = 1; a.guard = 1; ev.fort = true }
  else for (const t of alive(foe)) H(t, t === d ? base * .85 : base * .45, pierce)
  return finish()
}
function switchFighter(B, who, index) {
  const side = B[who], foe = B[who === 'you' ? 'ai' : 'you'], leaving = act(side)
  if (index === side.active) return null
  const standardTag = side.seq.includes('special') || side.ultTurn === B.turn
  setActive(side, index)
  const entering = act(side), target = act(foe)
  const wingAssist = batchTag(side, leaving, entering, PE, healHP, pasNote)
  const fairyAssist = fairyTag(side, leaving, entering, PE, KI_MAX, pasNote)
  const duoAssist = tojiLink(leaving, entering, side, target, pasNote)
  const ghost = ghostDetonation(leaving, side, foe, entering)
  const trapWho = who === 'you' ? 'ai' : 'you'
  let trap = ghost && { ...ghost, who: trapWho }
  const nobara = !leaving.ko && leaving.nobaraMark &&
    foe.team.find(f => f.key === leaving.nobaraMark && !f.ko && PE(f).resonance)
  if (nobara) {
    leaving.nobaraMark = null
    trap = { who: trapWho, art: 'special', move: 'RESONANCE', before: trap,
      hits: [{ t: leaving, ...hit(nobara, leaving, 690, nobara.ki, true, foe, side, 'counter') }] }
  }
  const petals = !entering.ko && leaving.fcPetals && foe.team.find(f => f.key === leaving.fcPetals && !f.ko && PE(f).captainPetals)
  if (petals) {
    delete leaving.fcPetals
    entering.fcPetals = petals.key
    trap = { who: trapWho, art: 'strike', move: 'THOUSAND PETALS', before: trap,
      hits: [{ t: entering, ...hit(petals, entering, 340, petals.pwr, true, foe, side, 'counter') }] }
  }
  if (!entering.ko && !target.ko && PE(target).crSukuna === 2 && shrineActive(target, side) && target.crCleaveTurn !== turnClock(side)) {
    target.crCleaveTurn = turnClock(side)
    trap = { who: who === 'you' ? 'ai' : 'you', art: 'strike', move: 'SHRINE · CLEAVE', before: trap,
      hits: [{ t: entering, ...hit(target, entering, 410, target.pwr, true, foe, side, 'strike') }] }
    pasNote(target, 'MALEVOLENT SHRINE · CLEAVE')
  }
  if (entering.ko || !(standardTag || fairyAssist || duoAssist || wingAssist) || target.ko) return trap
  side.gauge = Math.min(GAUGE_MAX, side.gauge + 10)
  side.reworkAction = (side.reworkAction || 0) + 1
  return { who, art: 'strike', before: trap, move: wingAssist ? 'FIERCE WINGS' : duoAssist ? 'SPLIT SOUL KATANA' : fairyAssist ? 'FAIRY TAIL FOLLOW-UP' : 'TAG ASSIST',
    hits: [{ t: target, ...hit(entering, target, wingAssist ? 590 : duoAssist ? 420 : fairyAssist ? 300 : 200, Math.max(entering.pwr, entering.ki), duoAssist || wingAssist, side, foe, 'strike') }] }
}
function nextAlive(s) { const i = s.team.findIndex(f => !f.ko); if (i >= 0) setActive(s, i); return i >= 0 }

// ---------------- AI ----------------
// ===== smart Auto brain (level 5): estimates damage, looks for lethal, plans energy =====
// A heavy hit gets more mitigation, with a floor so its damage still matters.
function guardedDamage(damage, maxHP, guardBonus = 50) {
  const baseReduction = Math.max(.5, Math.min(.7, guardBonus / 100))
  const heavyHitBonus = Math.min(.2, Math.max(0, damage / maxHP - .25) * .25)
  return damage * (1 - Math.min(.75, baseReduction + heavyHitBonus))
}

function estHit(att, def, base, stat, pierce) {
  const ea = PE(att)
  let d = base * (stat / 80) * (100 / (60 + def.def * .5)) * matchup(att, def) * (1 + (ea.dmg || 0) / 100 + (att.rage || 0) / 100)
  if (att.card.tag) d *= 1.18
  if (ea.exec && def.hp / def.max < .4) d *= 1 + ea.exec / 100
  if (def.guard && !pierce && !ea.pierce) d = guardedDamage(d, def.max, PE(def).guardStrong)
  return d
}
function estArt(me, foe, a, chainN) {
  const at = act(me), d = act(foe), chain = 1 + Math.min(.32, Math.max(0, chainN) * .08), pierce = /Ignores Guard/.test(kitTxt(at.card)), ch = me.chargeNext ? 1 + me.chargeNext / 100 : 1
  if (PE(d).absorbRanged && !PE(at).antiKit && rangedHit(at, a)) return 0
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
      const assist = switchFighter(B, who, best[1]); me.switched = true; evs.push({ who, swap: true }); if (assist) evs.push(assist)
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
    const avoidRanged = avoidAbsorbedArts(me, foe)
    const hand = me.hand.map((a, i) => [a, i]), can = a => hand.find(([x]) => x === a && artCost(mine, x, me, foe) <= me.ki && !(x === 'burst' && me.ki < 2) && !(avoidRanged && rangedHit(mine, x)))
    const chainN = me.seq.length, dmgOf = a => estArt(me, foe, a, chainN)
    // 3) pop a Magic Cylinder trap with the cheapest hit first
    if (opp.cylinder) { const p = can('strike') || can('blast'); if (p) { const e = playArt(B, who, p[1]); if (e) { evs.push(e); continue } } }
    // 4) emergency items / heals
    const hpP = mine.hp / mine.max, threat = foe.gauge >= 85 || estHit(opp, mine, pctOf(opp.card) * 3.2, Math.max(opp.pwr, opp.ki), false) > mine.hp
    let pick = null
    if (gtForm(mine) === 4 && !mine.gtRemembered && can('guard') && (hpP < .55 || mine.gtRage >= 2)) pick = can('guard')
    else if (hpP < .35 && can('senzu')) pick = can('senzu')
    else if (threat && !mine.cylinder && can('cylinder')) pick = can('cylinder')
    else if (hpP < .45 && can('heal')) pick = can('heal')
    else if (mine.burnT > 0 && hpP < .6 && can('cleanse')) pick = can('cleanse')
    else if (can('transfer') && me.ki <= KI_MAX - 2) pick = can('transfer')
    else if (can('deathnote') && !opp.doom && opp.hp / opp.max > .3) pick = can('deathnote')
    else if (can('clock') && !foe.skip) pick = can('clock')
    else if (can('scroll') && !opp.sealed && opp.pe && Object.keys(opp.pe).length) pick = can('scroll')
    else if (can('wing') && me.team.some(x => x.ko)) pick = can('wing')
    else if (can('hogyoku') && hpP < .5 && !mine.hogyokuSave) pick = can('hogyoku')
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
    if (pick) { const assist = switchFighter(B, who, pick[1]); me.switched = true; evs.push({ who, swap: true }); if (assist) evs.push(assist) }
  }
  let guarded = false
  for (let n = 0; n < 8; n++) {
    if (act(foe).ko || act(me).ko) break
    if (me.gauge >= GAUGE_MAX && (clever || Math.random() < .7)) { const e = ultimate(B, who); if (e) { evs.push(e); continue } }
    const avoidRanged = avoidAbsorbedArts(me, foe)
    const playable = me.hand.map((a, i) => [a, i]).filter(([a]) => artCost(act(me), a, me, foe) <= me.ki && !(avoidRanged && rangedHit(act(me), a)))
    if (!playable.length) break
    const hasSpecial = me.hand.includes('special'), opp = act(foe), mine = act(me)
    let pick = null
    { const hi = me.hand.indexOf('heal'), ti = me.hand.indexOf('transfer'), ci = me.hand.indexOf('charge'), bi = me.hand.indexOf('burst'), cl = me.hand.indexOf('cleanse')
      const si = me.hand.indexOf('senzu'), yi = me.hand.indexOf('cylinder')
      if (si >= 0 && me.ki >= 2 && mine.hp / mine.max < .35) pick = ['senzu', si]
      else if (yi >= 0 && me.ki >= 2 && !mine.cylinder && mine.hp / mine.max < .7) pick = ['cylinder', yi]
      else if ((pick = (() => { const IU = { rumble: mine.hp / mine.max < .6, finger: mine.hp / mine.max > .4, deathnote: 1, hogyoku: mine.hp / mine.max < .5 && !mine.hogyokuSave, wing: me.team.some(x => x.ko), scroll: 1, clock: 1 }; for (const k in IU) { const ii = me.hand.indexOf(k); if (ii >= 0 && IU[k] && me.ki >= ARTS[k].cost) return [k, ii] } return null })())) { }
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
  { n: 1, enemy: ['goku_base'], name: 'Training Grounds', rating: 70, level: 1, coins: 1500, arena: 'dojo' },
  { n: 2, enemy: ['DENJI','POWER','AKI'], name: 'Street Brawl', rating: 74, level: 1, coins: 2000, arena: 'city' },
  { n: 3, enemy: ['DEKU','BAKUGO','TODOROKI'], encounter: 'spar', name: 'Rival Academy', rating: 78, level: 2, coins: 2500, arena: 'forest' },
  { n: 4, enemy: ['YUSUKE','HIEI','KURAMA','KUWABARA'], name: 'Tournament Prelims', rating: 81, level: 2, coins: 3000, arena: 'city' },
  { n: 5, enemy: ['shigaraki_decay','dabi_blueflame'], name: 'Villain Hideout', rating: 84, level: 3, coins: 4000, arena: 'domain', pack: 'standard' },
  { n: 6, enemy: ['MADARA','OBITO'], encounter: 'pressure', name: 'Shinobi War', rating: 86, level: 3, coins: 5000, arena: 'forest' },
  { n: 7, enemy: ['uraume_frost','sukuna_vessel'], name: 'Cursed Domain', rating: 88, level: 3, coins: 6000, arena: 'domain' },
  { n: 8, enemy: ['doflamingo_wave','katakuri_sweet_commander'], name: 'Grand Line Showdown', rating: 90, level: 4, coins: 7500, arena: 'deck', pack: 'premium' },
  { n: 9, enemy: ['toppo_god_of_destruction','jiren_full_power'], name: 'Tournament of Power', rating: 93, level: 4, coins: 10000, arena: 'cosmos' },
  { n: 10, enemy: ['BEERUS'], encounter: 'second-phase', name: 'Gods of Destruction', rating: 96, level: 5, coins: 15000, arena: 'cosmos', pack: 'premium' },
]
function enemyTeam(stage) {
  if (stage.live) return stage.live.oppTeam
  if (stage.enemy?.length) return campTeam([stage.enemy].flat()).map(key => X.BYKEY[key]).filter(Boolean)
  if (stage.team && stage.team.length) { const t = stage.team.map(k => X.BYKEY[k]).filter(Boolean); if (t.length) return t.slice(0, 6) }
  const pool = X.POOL.slice().sort((a, b) => Math.abs(a.ovr - stage.rating) - Math.abs(b.ovr - stage.rating))
  const near = pool.slice(0, Math.max(14, Math.round(pool.length * .25)))
  const out = []; while (out.length < 6 && near.length) out.push(near.splice(Math.floor(Math.random() * near.length), 1)[0])
  return out.sort((a, b) => b.ovr - a.ovr)
}

let MODE = 'transfer-campaign'
const mastL = k => { const x = (X.P.mast || {})[k] || 0, T = X.ST().mastT || [0, 60, 180, 400, 750]; return T.filter(t => x >= t).length - 1 }
function eventTeam(pool, difficulty) {
  const distinct = [...new Map(pool.slice().reverse().map(card => [card.name, card])).values()].reverse()
  const sizes = [3, 4, 6]
  const start = Math.min(Math.max(0, distinct.length - sizes[difficulty]), [4, 2, 0][difficulty])
  return distinct.slice(start, start + sizes[difficulty]).map(card => card.key)
}
const MODES_ON = new Set(['chronicle', 'transfer-campaign', 'crucible', 'live', 'redzone', 'arcs', 'boss', 'pass', 'story'])
function modeTabs(el) {
  const { h } = X, t = h('div', 'mtabs')
  // Temporarily limited while core modes are being balanced. Re-add ids here to bring modes back.
  if (!MODES_ON.has(MODE)) MODE = 'transfer-campaign'
  for (const [k, n] of [['chronicle', '⏳ CHRONICLE BREAK'], ['transfer-campaign', 'CAMPAIGN'], ['war', 'MULTI-TEAM WAR'], ['draft', 'DRAFT GAUNTLET'], ['live', '⚔️ LIVE PVP'], ['crucible', '🔥 THE CRUCIBLE'], ['redzone', '💀 DEAD ZONE'], ['rift', '🌀 RIFT'], ['raid', 'RAID'], ['ranked', 'RANKED'], ['boss', 'DAILY BOSS'], ['tower', 'TOWER'], ['arcs', 'STORY ARCS'], ['event', 'EVENT'], ['pass', 'SEASON PASS'], ['story', '📖 HOW TO PLAY']].filter(([k]) => MODES_ON.has(k))) {
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
    <div class="bh-name"><b>${c.name}</b><span>${c.ver} · SQUAD-SCALED</span></div>
    <div class="bh-ab"><b>BOSS SKILL · ${BD.ab.name}</b><span>${BD.ab.d}</span></div>
    <p>Deal as much damage as you can before the boss retreats. Watch for its special attack every third round and increased pressure from round six. Your best attempt counts.</p>
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
    go2({ mode: 'ranked', pveProgress: i / Math.max(1, R.ranks.length - 1), id: 0, label: 'Ranked · ' + cur.name + ' · vs ' + name, name, rating, level, boost: i >= 6 ? 1.05 : 1, arena: ARENA_KEYS[Math.floor(Math.random() * ARENA_KEYS.length)] })
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
    r.disabled = !ok; r.onclick = () => go2({ mode: 'tower', pveProgress: (n - 1) / 49, id: n, label: 'Tower · Floor ' + n, name: 'Floor ' + n, rating: f.rating, level: f.level, boost: f.boost, arena: ARENA_KEYS[n % ARENA_KEYS.length] })
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
function scene(lines, title, bg, done, cast, narratorArt) {
  const { h } = X, o = h('div', 'scn'); let i = 0
  o.innerHTML = `<div class="scn-bg" style="background-image:url('${bg || ''}')"></div><div class="scn-top"><b>${title}</b><button class="btn dark sm scn-skip">SKIP ›</button></div><div class="scn-who"></div><div class="scn-box"><small></small><p></p><em>TAP TO CONTINUE</em></div>`
  const portrait = o.querySelector('.scn-who')
  const show = () => {
    const [who, line, speaker] = lines[i]
    const character = cast ? cast.get(who) : byName(who)
    const art = character || (who === 'Narrator' ? narratorArt : null)
    portrait.style.visibility = art ? '' : 'hidden'
    portrait.style.backgroundImage = art ? `url("${art.url}")` : 'none'
    portrait.style.setProperty('--fy', Math.round((art?.fy ?? .22) * 100) + '%')
    o.querySelector('.scn-box small').textContent = speaker || (character && cast ? character.name : who)
    o.querySelector('.scn-box p').textContent = line
    portrait.classList.remove('in')
    void o.offsetWidth
    portrait.classList.add('in')
  }
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
    <p>Every player fights the same boss from Friday to Sunday. All damage is added together. The boss enrages in round six. Bring it to 0 before Monday and everyone who hit it shares the victory reward: 2 Premium Drops, 20,000 coins and 5 Training Tickets.</p>
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
const cardById = id => X.POOL.find(c => c.id === id)
const rescueCards = () => ['netero_vs_meruem', 'jinbe_knight', 'kawaki'].map(cardById).filter(Boolean)
function campaignLineup(stage) {
  const ids = stage.rule === 'rescue' ? rescueCards().map(c => c.id) :
    stage.rule === 'crew' ? ['luffy_bounceman', 'jinbe_knight', 'sanji_oeuf_burst', 'zoro_asura'] :
    ['returning', 'reversal'].includes(stage.rule) ? rescueCards().filter((_, i) => X.ST().campP?.rescued?.includes(RESCUE_NAMES[i])).map(c => c.id) :
    stage.guest ? [stage.guest] : []
  return [...new Set([...ids.map(id => cardById(id)?.key).filter(Boolean), ...X.P.team.filter(Boolean)])].slice(0, 6)
}
function campTeam(specs) {
  const used = new Set(), out = []
  for (const sp of specs) { const [n, o] = sp.split('#'), list = X.POOL.filter(c => (c.name === n || c.id === n) && !used.has(c.key)).sort((a, b) => b.ovr - a.ovr), c = (o && list.find(x => x.ovr === +o)) || list[0]; if (c) { used.add(c.key); out.push(c.key) } }
  return out
}
const ENCOUNTER_HINTS = {
  spar: 'Lower the opponent to 50% HP to win the spar.',
  'ring-out': 'Lower the opponent to 25% HP to force a ring-out.',
  'hold-out': 'Survive three enemy turns or win by KO.',
  'second-phase': 'The lead returns at 35% HP with a full Ultimate gauge.',
  'break-guard': 'The enemy renews Guard each turn.',
  'guard-school': 'Open with Guard to weather the first exchange.',
  pressure: 'The enemy gains 40% Ultimate gauge on even rounds.',
  relay: 'Switching gives the incoming fighter a 20% HP shield.',
  duet: 'The enemy lead gets a shield while its partner stands.',
  ifrit: 'Sanji gains 35% damage after surviving below half HP.',
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
const DZ_BRIEFINGS = {
  read: ['Enemy Read', 'The warning names an Art. Leave that Art unused for the entire turn.', 'An Arts deck with both Strike and Blast, plus a Guard or support option for turns when your best attack is called.'],
  rush: ['Heavy Rush', 'Have Guard or a shield on your marked fighter at the end of your turn, or swap to a different fighter.', 'Guard Arts, a team shielder, and a healthy backup who can take the lead.'],
  stay: ['Switch Trap', 'Keep your current fighter in for the entire turn. Switching out and back still triggers the trap.', 'A durable lead with shields, damage reduction, or a KO save. Set your lead before the round begins.'],
  rotate: ['Decay Mark', 'End the turn with a different fighter active. Returning to the marked fighter triggers the punishment.', 'At least two fighters who can take a hit. A tag-in shield makes the rotation safer.'],
  break: ['Charging', 'Land an attack into the boss’s Guard to remove it before ending your turn. A cheap hit can do it. Guard-piercing attacks are also useful.', 'Low-cost attacks so you can respond every round, plus a hard hitter for the opening after Guard drops.'],
  mix: ['Counter Ready', 'Alternate attacking Arts during the turn. Strike → Blast → Strike works. Strike → Strike triggers punishment.', 'A mixed Arts deck. Keep a backup attack in hand when your main damage comes from Strikes or Blasts.'],
  illusion: ['Enemy Read or Switch Trap', 'Check the actual warning each turn. Avoid the called Art on Enemy Read rounds and keep your lead in on Switch Trap rounds.', 'A durable lead and a mixed Arts deck so you can respond to either warning.'],
}

function deadZoneBriefing({ zone, stage, boss, enemies, reward, locked, teamReady, cleared, fight }) {
  const { h } = X
  const text = (tag, cls, value) => Object.assign(h(tag, cls), { textContent: value })
  const dialog = h('dialog', 'dz-brief')
  const head = h('header', 'dz-brief-head')
  const back = h('button', 'btn dark sm', '← BACK TO DEAD ZONES')
  back.type = 'button'; back.onclick = () => dialog.close()
  head.append(back)
  const main = h('div', 'dz-brief-main')
  const hero = h('div', 'dz-brief-hero')
  const title = h('div', 'dz-brief-title')
  const heading = text('h2', '', stage.name)
  heading.id = 'dz-brief-title'
  dialog.setAttribute('aria-labelledby', heading.id)
  const opponentNames = enemies.map(card => card.name).join(' · ')
  title.append(text('p', 'dz-brief-kicker', zone.name + ' / DZ-' + stage.n), heading, text('p', '', opponentNames))
  hero.append(title)
  if (boss) {
    const image = h('img', 'dz-brief-art')
    image.src = boss.url
    image.alt = boss.name + ' · ' + boss.ver
    hero.append(image)
  }
  const blocks = h('div', 'dz-brief-grid')
  const section = name => {
    const block = h('section', 'dz-brief-panel')
    block.append(h('h3', '', name))
    blocks.append(block)
    return block
  }
  const add = (element, name, value) => {
    const row = h('div', 'dz-brief-row')
    row.append(text('strong', '', name), text('p', '', value))
    element.append(row)
  }
  const incoming = section('What the boss does')
  if (boss?.pas?.d) add(incoming, boss.pas.n, boss.pas.d)
  if (boss?.tx?.length) add(incoming, boss.mv, boss.tx.join(' '))
  if (boss?.pas?.e?.worldCut) add(incoming, 'World Cut', 'Specials and Ultimates that reach HP cut starting max HP by 10 percentage points, down to a 70% floor. Shields help keep the hit off your HP.')
  if (stage.newGen == null) for (const [name, description] of stage.rules) add(incoming, name, description)
  if (stage.final) add(incoming, 'Final Stand', 'The opening boss returns once at 35% HP with Guard and a full Ultimate gauge. Keep enough Energy to respond.')

  const warning = section('How to read the warning')
  const [name, response, tools] = DZ_BRIEFINGS[stage.mechanic] || [
    'Enemy Read and Heavy Rush',
    'Avoid the called Art on Enemy Read rounds. On Heavy Rush rounds, Guard, gain a shield, or switch away from the marked fighter.',
    'A mixed Arts deck, at least one defensive option, and a second fighter you can safely switch in.',
  ]
  add(warning, name, response)
  if (stage.newGen != null) add(warning, 'What’s at stake', 'Answer correctly to drain 25% of the boss’s Ultimate gauge and reduce its damage that round. A miss gives it 35% gauge, 2 Energy, and extra damage.')
  else add(warning, 'When to expect it', 'Warnings start on round one and recur every ' + (stage.n >= 4 ? 'two' : 'three') + ' rounds.')

  const prep = section('What to bring')
  add(prep, 'Recommended tools', tools)
  if (stage.weak.length) add(prep, 'Bonus damage tags', stage.weak.map(tag => rzTag(tag) + ' +' + stage.weakB + '%').join(' · ') + '. Others deal ' + Math.min(30, stage.resist) + '% less damage.')
  if (stage.newGen == null) {
    const tip = { CELL: 'Bring Saiyans and Mentors to punch through his damage reduction. Save Energy to finish him after his first KO save.',
      'MAJIN BUU': 'Tag Teams and Transformations hit harder here. Keep a shield or KO save ready for his boosted Special.' }[stage.boss] || stage.tip
    if (tip) add(prep, 'Stage plan', tip)
  } else if (stage.newGen === 4) add(prep, 'Hand Jack', 'Missing the read also costs you 2 Energy.')
  add(prep, 'Long fights', 'Bosses cannot recover lost HP through healing. Their damage ramps up from round five, so keep pressure on between warnings.')

  main.append(hero, blocks)
  const foot = h('footer', 'dz-brief-foot')
  const status = locked ? 'Clear DZ-' + (stage.n - 1) + ' to unlock.' : !teamReady ? 'Your team needs six fighters.' : cleared ? 'Stage cleared' : 'First clear · ' + reward
  foot.append(text('p', '', status))
  if (!locked && !teamReady) {
    const teamButton = h('button', 'btn dark', 'EDIT MY TEAM')
    teamButton.onclick = () => { dialog.close(); X.go('team') }
    foot.append(teamButton)
  }
  const start = h('button', 'btn gold big', cleared ? 'REPLAY FIGHT' : 'START FIGHT')
  start.disabled = locked || !teamReady || !enemies.length
  start.onclick = () => { dialog.close(); fight() }
  foot.append(start)
  dialog.append(head, main, foot)
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
  back.focus()
}

// ---------------- THE CRUCIBLE ----------------
const CRU_RULE = { dmg: v => '+' + v + '% damage', dr: v => v + '% less damage taken', dodge: v => v + '% dodge', reflect: v => 'reflect ' + v + '%', endure: () => 'survive 1 KO', firstNull: v => 'ignore your first ' + v + ' hits', doubleStrike: () => 'Strikes hit twice', pierceSpec: () => 'Specials ignore Guard', pierceStrike: () => 'Strikes ignore Guard', pierce: () => 'every attack ignores Guard', spec: v => 'Specials +' + v + '%', burn: v => 'burn ' + v + '%', ramp: (v, r) => '+' + v + '% damage per turn (max ' + r.rampMax + ')', adapt: (v, r) => '-' + v + '% damage per hit taken (max ' + r.adaptMax + ')', regen: v => 'regen ' + v + '%', first: () => 'always move first', nullPassive: () => 'seal your passive', drain: v => 'heal ' + v + '% of damage dealt' }
const cruRules = st => Object.entries(st.rules).map(([k, v]) => CRU_RULE[k] && CRU_RULE[k](v, st.rules)).filter(Boolean).join(' · ') || 'No special rules'
function crucibleStageObj(run) {
  const st = CRUCIBLE_STAGES[run.stage - 1]
  return { mode: 'crucible', id: 'crucible:' + st.n, label: 'Crucible · Stage ' + st.n, name: st.name, n: st.n, level: 5, boost: st.boost, team: campTeam(st.enemy), playerTeam: run.team, pveFloor: st.n, pveFinal: st.boss,
    crucible: { n: st.n, hp: run.hp, gauge: run.gauge }, rules: Object.assign({ weakTo: st.weak, weakB: 50, resist: 35 }, st.rules) }
}
function cruciblePage(el) {
  const { h } = X, C = X.ST().crucible || { best: 0, first: {} }, run = C.run, total = CRUCIBLE_STAGES.length
  el.append(h('section', 'bhero cru-hero', '<div><span class="sh-tag">🔥 THE CRUCIBLE · ' + total + ' STAGES · ONE RUN</span><h2>THE CRUCIBLE</h2><p>One continuous run. HP, knockouts and Ultimate gauge carry from stage to stage. Items only work between stages, and healing in fights is halved. Standing fighters recover 12% after each stage. Boss stages fully heal your team and revive knocked-out fighters at 30%. From stage 4, enemies enrage when low: +30% damage under half HP, +60% under a quarter. Save after a stage to keep your progress; if your team falls, you go back to your last save.</p><small>Best: stage ' + (C.best || 0) + ' / ' + total + '</small></div>'))
  const after = () => X.go('battle')
  if (!run) {
    const team = (X.P.team || []).filter(Boolean)
    const box = h('section', 'panel pad cru-start')
    box.append(h('b', '', 'Your run team (from My Team)'))
    const row = h('div', 'cru-team'); team.forEach(k => { const c = X.BYKEY[k]; if (c) row.append(X.cardImg(X.eff(c), 120)) }); box.append(row)
    const go = h('button', 'btn gold', team.length === 6 ? 'START RUN' : 'SET 6 FIGHTERS IN MY TEAM FIRST')
    go.disabled = team.length !== 6
    go.onclick = async () => { const r = await X.act('crucibleStart', { team }); if (!r.error) after() }
    box.append(go)
    const rw = h('p', 'muted'); rw.textContent = 'Rewards: every stage pays coins and shards on first clear. Every 5th stage adds Premium Drops. Every 10th stage is a boss with a big bundle and +1 item. Clearing all ' + total + ' pays 100,000 coins, ◆10,000 and 3 extra Premium Drops.'
    box.append(rw); el.append(box); return
  }
  const st = CRUCIBLE_STAGES[run.stage - 1]
  const top = h('section', 'panel pad cru-run')
  top.append(h('b', '', 'STAGE ' + run.stage + ' / ' + total + (run.saved ? ' · saved at stage ' + run.saved.stage : '')))
  const team = h('div', 'cru-hp')
  run.team.forEach((k, i) => {
    const c = X.BYKEY[k], x = run.hp[i], r = h('div', 'cru-hpr' + (x === 0 ? ' ko' : ''))
    r.innerHTML = '<b></b><i><u style="width:' + Math.round(x * 100) + '%"></u></i><small>' + (x === 0 ? 'KO' : Math.round(x * 100) + '%') + '</small>'
    r.querySelector('b').textContent = c ? c.name : k
    const use = (item, label) => { const b = h('button', 'btn dark sm', label); b.onclick = async () => { const res = await X.act('crucibleItem', { item, idx: i }); if (!res.error) after() }; r.append(b) }
    if (x > 0 && x < 1 && run.items.senzu > 0) use('senzu', CRUCIBLE_ITEMS.senzu.icon)
    if (x === 0 && run.items.revive > 0) use('revive', CRUCIBLE_ITEMS.revive.icon)
    team.append(r)
  })
  top.append(team)
  const items = h('div', 'cru-items')
  for (const [k, it] of Object.entries(CRUCIBLE_ITEMS)) { const s2 = h('span', 'cru-item'); s2.textContent = it.icon + ' ' + it.name + ' ×' + run.items[k]; s2.title = it.d; items.append(s2) }
  if (run.items.heal > 0) { const b = h('button', 'btn dark sm', '💚 USE TEAM HEAL'); b.onclick = async () => { const res = await X.act('crucibleItem', { item: 'heal' }); if (!res.error) after() }; items.append(b) }
  top.append(items)
  const acts = h('div', 'cru-acts')
  const fight = h('button', 'btn gold', 'FIGHT STAGE ' + run.stage)
  fight.onclick = async () => { const e = await X.act('crucibleEnter', { stage: run.stage }); if (e.error) return after(); go2(crucibleStageObj(X.ST().crucible.run)) }
  const save = h('button', 'btn dark sm', 'SAVE'); save.onclick = async () => { await X.act('crucibleSave'); after() }
  const quit = h('button', 'btn dark sm', 'ABANDON RUN'); quit.onclick = async () => { if (!confirm('Abandon this run? Your stage progress resets (first-clear rewards stay claimed).')) return; await X.act('crucibleAbandon'); after() }
  acts.append(fight, save, quit); top.append(acts); el.append(top)
  const list = h('div', 'camp-list')
  for (const s2 of CRUCIBLE_STAGES.slice(run.stage - 1, run.stage + 2)) {
    const row = h('div', 'camp-st cru-st' + (s2.boss ? ' boss' : ''))
    const boss = X.BYKEY[campTeam([s2.enemy[0]])[0]]
    row.innerHTML = '<span class="cs-art" style="background-image:url(\'' + (boss ? boss.url : '') + '\')"></span><span class="cs-tx"><small></small><b></b><small class="r"></small><small class="t"></small></span>'
    row.querySelector('small').textContent = 'Stage ' + s2.n + (s2.boss ? ' · BOSS' : '') + ' · ' + s2.name + ' · ' + crucibleRewardText(C.first[s2.n] ? { coins: Math.round(crucibleReward(s2.n).coins * .2) } : crucibleReward(s2.n))
    row.querySelector('b').textContent = s2.enemy.map(e => cardById(e)?.name || e).join(', ')
    row.querySelector('.r').textContent = 'Rules: ' + cruRules(s2) + ' · Weak to: ' + s2.weak.join(', ')
    row.querySelector('.t').textContent = s2.tip
    list.append(row)
  }
  el.append(list)
}
function redzonePage(el, ok) {
  const { h } = X, ST = X.ST(), ZS = ST.deadzones || []; if (!ZS.length) return
  const Z = ZS.find(z => z.id === DZSEL) || ZS[ZS.length - 1], done = (ST.rzAll || {})[Z.id] || []
  { const t = h('div', 'mtabs dz-tabs'); for (const z of ZS) { const n = ((ST.rzAll || {})[z.id] || []).length, b = h('button', 'mtab' + (z === Z ? ' on' : ''), z.name.toUpperCase() + ' · ' + n + '/' + z.stages.length); b.onclick = () => { DZSEL = z.id; X.go('battle') }; t.append(b) } el.append(t) }
  el.append(h('section', 'bhero rz-hero', `<div><span class="sh-tag">💀 DEAD ZONE · ${Z.sub.toUpperCase()}</span><h2>${Z.name.toUpperCase()}</h2><p>Open a stage briefing to see the boss’s abilities, how to answer its warnings, and what to bring.</p></div><div class="bstat"><b>${done.length}</b><span>/ ${Z.stages.length} CLEARED</span></div>`))
  const clearReward = X.BYKEY[Z.rewardKey]
  if (clearReward) {
    const name = clearReward.name + ' · ' + clearReward.ver
    const prize = h('button', 'btn gold sm', 'FULL CLEAR REWARD · ' + name)
    prize.onclick = () => X.cardDetail(clearReward.key, { kitOnly: true })
    el.querySelector('.rz-hero > div').append(prize)
  }
  for (const st of Z.stages) {
    const open = st.n === 1 || done.includes(st.n - 1), clr = done.includes(st.n), team = campTeam(st.enemy)
    const boss = X.BYKEY[campTeam([st.boss])[0]]
    const w = st.reward, rw = [w.coins.toLocaleString() + ' coins', w.premium && w.premium + '× Premium', w.shards && '◆' + w.shards.toLocaleString(), w.tickets && w.tickets + ' Tickets'].filter(Boolean).join(' · ')
    const box = h('section', 'rz-st' + (open ? '' : ' locked') + (clr ? ' done' : '') + (st.final ? ' final' : ''), `<div class="rz-art" style="background-image:url('${boss ? boss.url : ''}')"><span>DZ-${st.n}${st.final ? ' · FINAL' : ''}</span></div>
      <div class="rz-body"><h3>${st.name.toUpperCase()} ${clr ? '<em>✓ CLEARED</em>' : ''}</h3><p class="rz-vs">vs ${st.enemy.map(name => cardById(name)?.name || name).join(', ')}</p><p class="rz-rw">${open ? (clr ? 'Ready to replay' : 'First clear · ' + rw) : 'Clear DZ-' + (st.n - 1) + ' to unlock'}</p></div>`)
    const acts = h('div', 'rz-acts'), brief = h('button', 'btn gold', 'VIEW BRIEFING')
    brief.onclick = () => deadZoneBriefing({
      zone: Z, stage: st, boss, enemies: team.map(key => X.BYKEY[key]).filter(Boolean),
      reward: rw, locked: !open, teamReady: ok, cleared: clr,
      fight: () => go2({ mode: 'redzone', id: Z.id + ':' + st.n, label: 'Dead Zone · ' + st.name, name: st.name, level: 5, boost: st.boost, team, pveFloor: st.n, pveFinal: st.final, newGen: st.newGen, ngAdj: st.ngAdj, mechanic: st.mechanic, encounter: st.encounter, chapterRule: st.rule, rules: Object.assign({ weakTo: st.weak, weakB: st.weakB, resist: st.resist }, ...st.rules.map(r => r[2])) }),
    })
    acts.append(brief, cxBtn(() => team.map(k => X.BYKEY[k]), 'DZ-' + st.n + ' · ' + st.name)); box.querySelector('.rz-body').append(acts); el.append(box)
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
    const row = h('button', 'camp-st' + (s ? ' done' : '') + (open ? '' : ' locked') + (st.boss ? ' boss' : ''), `<span class="cs-art" style="background-image:url('${foe ? foe.url : ''}')"></span><span class="cs-tx"><small>V-${st.n}${st.boss ? ' · BOSS' : ''}</small><b>${st.name}</b><em>vs ${st.enemy.map(name => cardById(name)?.name || name).join(', ')}</em>${(st.hint || ENCOUNTER_HINTS[st.encounter]) ? '<small>' + (st.hint || ENCOUNTER_HINTS[st.encounter]) + '</small>' : ''}</span><span class="cs-stars">${open ? '★'.repeat(s) + '<i>' + '★'.repeat(3 - s) + '</i>' : '🔒'}</span>`)
    row.disabled = !ok || !open
    row.onclick = () => scene(st.scene, 'V-' + st.n + ' · ' + st.name, foe && foe.url, () => {
      try { sessionStorage.setItem('vOutro', JSON.stringify({ s: st.n, had: s > 0 })) } catch { }
      go2({ mode: 'villain', pveProgress: (st.n - 1) / 8, id: st.n, label: 'Villains · ' + st.name, name: st.name, level: st.boss ? 5 : Math.min(5, 2 + Math.floor(st.n / 2)), boost: (st.boss ? 1.45 : 1.15 + st.n * .05), youCat: 'Villains', team: campTeam(st.enemy) })
    })
    list.append(row)
  }
  el.append(list)
}
const fmtT = ms => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + 'h ' + m + 'm' : m + 'm ' + (s % 60) + 's' }
function riftTeam(R) {
  const inv = campTeam([R.invader]), used = new Set(inv)
  const locals = X.POOL.filter(c => c.anime === R.world && c.cat?.includes('Villains') && !used.has(c.key)).sort((a, b) => ((b.cat || []).includes('Villains') - (a.cat || []).includes('Villains')) || b.ovr - a.ovr)
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
      const row = h('button', 'camp-st' + (s ? ' done' : '') + (open ? '' : ' locked') + (st.boss ? ' boss' : ''), `<span class="cs-art" style="background-image:url('${foe ? foe.url : ''}')"></span><span class="cs-tx"><small>${ch.id}-${st.n}${st.boss ? ' · BOSS' : ''}</small><b>${st.name}</b><em>vs ${[...new Set(st.enemy.map(x => cardById(x)?.name || x.split('#')[0]))].join(', ')}</em>${(st.hint || ENCOUNTER_HINTS[st.encounter]) ? '<small>' + (st.hint || ENCOUNTER_HINTS[st.encounter]) + '</small>' : ''}</span><span class="cs-stars">${open ? '★'.repeat(s) + '<i>' + '★'.repeat(3 - s) + '</i>' : '🔒'}</span>`)
      row.disabled = !ok || !open
      row.dataset.campStage = key
      { const cb = cxBtn(() => campTeam(st.enemy).map(k => X.BYKEY[k]), ch.id + '-' + st.n + ' · ' + st.name); cb.classList.add('cx-on-row'); const wrap = h('div', 'cx-wrap'); wrap.append(row, cb); list.append(wrap) }
      const following = ch.stages[ch.stages.indexOf(st) + 1]
      const nextKey = following ? (hard ? 'H' : '') + ch.id + ':' + following.n :
        !hard && ST.camp.some(c => c.id === ch.id + 1) ? (ch.id + 1) + ':1' : null
      const nextFight = nextKey && (() => {
        const advance = () => {
          const next = document.querySelector('.page:last-child [data-camp-stage="' + nextKey + '"]')
          if (next && !next.disabled) next.click()
        }
        if (!s && st.outro?.length) scene(st.outro, 'AFTER · ' + st.name, foe?.url, advance)
        else advance()
      })
      row.onclick = () => scene(st.scene, ch.id + '-' + st.n + ' · ' + st.name, foe && foe.url, () => {
        try { sessionStorage.setItem('campOutro', JSON.stringify({ c: ch.id, s: st.n, had: s > 0 })) } catch { }
        go2({ mode: 'camp', pveProgress: (st.n - 1) / Math.max(1, ch.stages.length - 1), id: key, label: 'Chapter ' + ch.id + ' · ' + st.name, name: st.name, level: hard || st.boss ? 5 : Math.min(4, 1 + Math.floor(st.n / 2)), boost: (st.boss ? 1.25 : 1 + st.n * .03) + (ch.id - 1) * .06 + (hard ? .35 : 0), team: campTeam(st.enemy), encounter: st.encounter, chapterRule: st.rule, playerTeam: (st.rule || st.guest) ? campaignLineup(st) : undefined, nextFight })
      })
    })
    el.append(list)
  }
}
let selectedStoryArc = null
function storyArcCast(arc) {
  const cast = new Map()
  for (const chapter of arc.chapters) {
    for (const id of [...[chapter.player].flat(), chapter.enemy, ...chapter.scene.map(([id]) => id), ...chapter.outro.map(([id]) => id)]) {
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
  el.append(back, h('section', 'bhero camp-hero', `<div><span class="sh-tag">${X.ANAME(arc.anime)}</span><h2>${arc.name.toUpperCase()}</h2><p>${arc.synopsis}</p></div><div class="bstat"><b>${done}/${arc.chapters.length}</b><span>CHAPTERS CLEARED</span></div>`))
  const reward = X.POOL.find(c => c.id === arc.rewardCard && (arc.existingReward || c.arcReward === arc.id))
  if (reward) {
    const panel = h('div', 'panel pad')
    const unlocked = X.P.arcRewards?.[arc.id]
    panel.append(h('b', '', (unlocked ? '✓ ARC REWARD EARNED · ' : 'CLEAR EVERY CHAPTER · ') + reward.name + ' · ' + reward.ver))
    panel.append(h('p', 'muted', unlocked ? 'Extra copies are available in the Pack Point Exchange.' : 'Clearing this arc also unlocks extra copies in the Pack Point Exchange.'))
    el.append(panel)
  }
  const list = h('div', 'camp-list')
  arc.chapters.forEach((chapter, i) => {
    const players = [chapter.player].flat().map(id => cast.get(id)), enemy = cast.get(chapter.enemy)
    if (chapter.lockedKit) players[0] = rivalryLead(players[0], { kit: chapter.lockedKit, form: chapter.lockedForm }, X.POOL)
    const label = `Chapter ${i + 1} · ${chapter.name}`
    const start = withStory => {
      const nextChapter = () => {
        const next = document.querySelector('.page:last-child [data-arc-chapter="' + (i + 1) + '"]')
        if (next && !next.disabled) next.click()
      }
      const outro = done => scene(chapter.outro, chapter.name, enemy.url, done, cast, players[0])
      const fight = () => go2({ ...chapter, mode: 'arc', id: arc.id + ':' + i, label, pveFloor: i + 1, pveEpisodes: arc.chapters.length, team: [enemy.key], storyTeam: players.map(c => c.key),
        afterWin: withStory ? () => outro(() => {}) : null,
        nextFight: i + 1 < arc.chapters.length ? () => withStory ? outro(nextChapter) : nextChapter() : null })
      if (withStory) scene(chapter.scene, label, enemy.url, fight, cast, players[0])
      else fight()
    }
    const row = h('div', 'camp-st' + (i < done ? ' done' : '') + (i > done ? ' locked' : ''),
      `<span class="cs-art" style="background-image:url('${enemy.url}')"></span><span class="cs-tx"><small>${label}</small><b>${players.map(c => c.name).join(' & ')} vs. ${enemy.name}</b><small>${chapter.matchup} ${ENCOUNTER_HINTS[chapter.encounter] || ''}</small></span>`)
    const play = h('button', 'btn gold sm', i < done ? 'REPLAY STORY' : i === done ? 'CONTINUE STORY' : 'LOCKED')
    play.disabled = i > done
    play.dataset.arcChapter = i
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
function arcsPage(el) {
  const { h, P } = X, ST = X.ST(), A = P.arcs || {}
  const available = ST.arcs.map(arc => ({ arc, cast: storyArcCast(arc) })).filter(entry => entry.cast)
  const selected = available.find(({ arc }) => arc.id === selectedStoryArc)
  if (selected) return storyArcPage(el, selected.arc, selected.cast, A[selected.arc.id] || 0)
  const total = available.length, cleared = available.filter(({ arc }) => (A[arc.id] || 0) >= arc.chapters.length).length
  el.append(h('section', 'bhero', `<div><h2>STORY ARCS</h2><p>Fight as the characters from each scene. Clear an arc to earn its card, a Premium Drop and ◆1,000 shards.</p></div><div class="bstat"><b>${cleared}</b><span>/ ${total} ARCS</span></div>`))
  const grid = h('div', 'arcs')
  for (const { arc, cast } of available) {
    const done = A[arc.id] || 0, count = arc.chapters.length, boss = cast.get(arc.chapters[count - 1].enemy)
    const card = h('div', 'arc' + (done >= count ? ' done' : ''))
    card.style.setProperty('--art', `url("${boss.url}")`)
    card.innerHTML = `<div class="arc-art"></div><div class="arc-info"><small>${X.ANAME(arc.anime)}</small><b>${arc.name}</b><span>${done >= count ? 'ARC COMPLETE' : done + ' / ' + count + ' chapters'}</span><div class="arc-ch"></div></div>`
    const open = h('button', 'btn gold sm', 'OPEN STORY')
    open.onclick = () => { selectedStoryArc = arc.id; X.go('battle') }
    card.querySelector('.arc-ch').append(open)
    grid.append(card)
  }
  el.append(grid)
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
    r.innerHTML = `<span class="sn">${['I', 'II', 'III'][i]}</span><div class="si"><b>${T.name}</b><small>${[3, 4, 6][i]}-fighter format · AI level ${T.level}${T.boost > 1 ? ' · +' + Math.round((T.boost - 1) * 100) + '% enemy HP' : ''}</small></div><div class="sr">${done ? '<em>DONE TODAY</em>' : ''}<span><i class="coin-i"></i>${(done ? 200 : T.coins).toLocaleString()}</span>${T.pack && !done ? `<span class="pk">+ ${X.ST().packs[E.pack].name.toUpperCase()}</span>` : ''}</div>`
    r.disabled = !ok; r.onclick = () => go2({ mode: 'event', pveProgress: i / Math.max(1, E.tiers.length - 1), id: i, label: X.ANAME(E.anime) + ' Week · ' + T.name, name: T.name, level: T.level, boost: T.boost, team: eventTeam(pool, i) })
    list.append(r)
  })
  el.append(list)
}
let warDraft = null
function warStage(run, lanes) {
  const round = run.results.length, lane = lanes[round]
  if (!lane || warScore(run.results).done) return null
  const playerTeam = run.squads[round]
  if (playerTeam.some(key => !X.BYKEY[key] || !(X.P.club.cards[key]?.n > 0))) return null
  return { n: round + 1, name: lane.name, label: 'WAR · ' + lane.name, level: lane.level, team: lane.team, playerTeam, war: { id: run.id, round } }
}

function warPage(el) {
  const { h, P, BYKEY, POOL } = X
  const war = P.war, lanes = X.ST().warLanes
  const label = (tag, cls, text) => { const item = h(tag, cls); item.textContent = text; return item }
  const run = war.run, score = warScore(run?.results || [])
  const laneMvps = run ? warRecap(run.id) : []
  const locked = !!run && !score.done
  const applyPreset = () => {
    warDraft = { week: war.week, ...fitWarPreset(P.warPreset || [], lanes, key => BYKEY[key], key => P.club.cards[key]?.n > 0) }
  }
  if (!warDraft || warDraft.week !== war.week) applyPreset()
  const squads = locked ? run.squads : warDraft.squads
  const owned = POOL.filter(c => P.club.cards[c.key]?.n > 0).sort((a, b) => b.ovr - a.ovr)
  const hero = h('section', 'bhero war-hero')
  hero.append(h('h2', '', 'MULTI-TEAM WAR'), h('p', '', 'Build three squads of three. Each card can fight in one lane. Win two lanes to take the war.'))
  const reward = WAR_REWARD.coins.toLocaleString() + ' coins · ' + WAR_REWARD.shards.toLocaleString() + ' shards'
  hero.append(h('p', '', war.paid ? 'Weekly win reward collected' : 'First win this week · ' + reward))
  hero.append(h('p', '', (P.cos || []).includes(WAR_TITLE) ? 'War Sweeper title unlocked' : 'Win 2–0 to unlock the War Sweeper title'))
  if (run) hero.append(h('strong', 'war-score', score.wins + '–' + score.losses + (score.done ? score.wins === 2 ? ' · WAR WON' : ' · WAR LOST' : ' · IN PROGRESS')))
  el.append(hero)

  const grid = h('div', 'war-lanes')
  const footer = h('div', 'war-actions')
  const message = h('p', 'muted')
  const primary = h('button', 'btn gold', locked ? 'FIGHT ' + lanes[run.results.length].name.toUpperCase() : 'LOCK SQUADS')
  const draw = () => {
    grid.replaceChildren()
    const used = new Set(squads.flat().filter(Boolean))
    lanes.forEach((lane, i) => {
      const panel = h('section', 'panel war-lane')
      const outcome = run?.results[i]
      panel.append(h('h3', '', lane.name + (locked && i === run.results.length ? ' · NEXT' : '')), h('p', 'muted', lane.rule))
      const mvp = laneMvps[i]
      if (typeof outcome === 'boolean' && mvp) panel.append(label('p', 'muted', 'MVP · ' + mvp.name + ' · ' + Math.round(mvp.damage).toLocaleString() + ' DMG'))
      if (typeof outcome === 'boolean') panel.append(h('strong', 'war-result', outcome ? 'LANE WON' : 'LANE LOST'))
      const opponents = h('div', 'war-opponents')
      for (const key of lane.team) {
        const c = BYKEY[key]
        if (!c) continue
        const entry = h('button', 'war-enemy war-card-button')
        entry.type = 'button'
        entry.setAttribute('aria-label', 'View kit for ' + c.name + ' · ' + c.ver)
        entry.onclick = () => X.cardDetail(c.key, { kitOnly: true, auraDiamonds: lane.level >= 5 ? 5 : 4 })
        entry.append(X.cardImg(c, 160), label('small', '', c.name))
        opponents.append(entry)
      }
      panel.append(h('small', 'war-label', 'OPPONENTS'), opponents, h('small', 'war-label', 'YOUR SQUAD · FIRST SLOT LEADS'))
      const ownCards = h('div', 'war-squad-cards')
      squads[i].forEach((key, j) => {
        const selected = BYKEY[key]
        const invalid = !locked && warDraft.invalid.some(x => x.lane === i && x.slot === j)
        const slot = h('button', 'war-card-button war-squad-slot' + (invalid ? ' war-invalid' : ''))
        slot.type = 'button'
        slot.dataset.warSlot = i + '-' + j
        const slotName = j === 0 ? 'Leader' : 'Fighter ' + (j + 1)
        slot.setAttribute('aria-label', lane.name + ' ' + slotName + (selected ? ' · ' + selected.name : ''))
        if (selected) slot.append(X.cardImg(X.eff(selected), 200), label('small', '', selected.name))
        else slot.append(label('span', '', locked ? 'Unavailable card' : invalid ? 'Replace' : '+'), label('small', '', slotName))
        if (invalid) slot.setAttribute('aria-invalid', 'true')
        if (locked) {
          slot.disabled = !selected
          slot.onclick = () => X.cardDetail(key)
        } else slot.onclick = () => {
          const teammates = squads[i].filter((_, index) => index !== j).map(k => BYKEY[k]).filter(Boolean)
          const eligible = owned.filter(c => c.key === key || (!used.has(c.key) && warCardAllowed(c, teammates, lane.kind)))
          const choose = cardKey => {
            squads[i][j] = cardKey
            warDraft.invalid = warDraft.invalid.filter(x => x.lane !== i || x.slot !== j)
            X.closeModal()
            draw()
            grid.querySelector('[data-war-slot="' + i + '-' + j + '"]')?.focus({ preventScroll: true })
          }
          X.openModal(sheet => {
            const close = h('button', 'btn dark sm', 'CLOSE PICKER')
            close.onclick = () => { X.closeModal(); slot.focus({ preventScroll: true }) }
            sheet.append(close, label('h2', '', lane.name + ' · ' + slotName), label('p', 'muted', lane.rule))
            const filter = h('input', 'field')
            filter.type = 'search'; filter.placeholder = 'Search eligible cards'; filter.setAttribute('aria-label', 'Search eligible cards')
            const choices = h('div', 'cardgrid war-picker-grid')
            const renderChoices = () => {
              choices.replaceChildren()
              for (const card of eligible.filter(c => X.matchesCard(c, filter.value))) {
                const pick = h('button', 'cg' + (card.key === key ? ' sel' : ''))
                pick.type = 'button'
                pick.setAttribute('aria-label', 'Select ' + card.name + ' · ' + card.ver)
                pick.append(X.cardImg(X.eff(card), 240), label('small', 'war-picker-name', card.name + ' · ' + card.ver))
                pick.onclick = () => choose(card.key)
                choices.append(pick)
              }
              if (!choices.children.length) choices.append(label('p', 'muted', 'No eligible cards match.'))
            }
            filter.oninput = renderChoices
            sheet.append(filter)
            if (selected) { const remove = h('button', 'btn dark sm', 'CLEAR SLOT'); remove.onclick = () => choose(null); sheet.append(remove) }
            sheet.append(choices)
            renderChoices()
          }, true)
        }
        ownCards.append(slot)
      })
      panel.append(ownCards)
      grid.append(panel)
    })
    const missing = locked && squads[run.results.length].some(key => !BYKEY[key] || !(P.club.cards[key]?.n > 0))
    const draftError = !locked && used.size === 9 && warLineupError(squads, lanes, key => BYKEY[key], key => P.club.cards[key]?.n > 0)
    if (savePreset) savePreset.disabled = used.size !== 9 || !!draftError
    primary.disabled = missing || !!draftError || (!locked && (used.size !== 9 || lanes.some(lane => lane.team.length !== 3)))
    message.textContent = missing ? 'A locked fighter is no longer in your club. Abandon this war to choose new squads.' :
      locked ? 'Squads are locked. Each round starts with fresh HP, Energy and Ultimate gauge.' :
      owned.length < 9 ? 'You need at least nine owned cards to enter.' : draftError || used.size + '/9 fighters selected'
  }
  primary.onclick = async () => {
    primary.disabled = true
    if (locked) {
      const next = warStage(run, lanes)
      if (next) startBattle(next)
      else draw()
      return
    }
    const r = await X.act('warStart', { week: war.week, squads })
    if (!r.error || r.state) X.go('battle')
    else draw()
  }
  footer.append(message, primary)
  const savePreset = locked ? null : h('button', 'btn dark', 'SAVE WAR PRESET')
  if (savePreset) {
    savePreset.onclick = async () => {
      savePreset.disabled = true
      const result = await X.act('warPreset', { squads })
      if (!result.error) X.go('battle')
      else draw()
    }
    footer.append(savePreset)
    if (P.warPreset) {
      const load = h('button', 'btn dark', 'LOAD WAR PRESET')
      load.onclick = () => { applyPreset(); X.go('battle') }
      footer.append(load)
    }
  }
  if (locked) {
    const abandon = h('button', 'btn dark', 'ABANDON WAR')
    abandon.onclick = async () => {
      if (!confirm('Abandon this war and discard its results?')) return
      abandon.disabled = primary.disabled = true
      const r = await X.act('warAbandon', { id: run.id })
      if (!r.error || r.state) X.go('battle')
      else { abandon.disabled = false; draw() }
    }
    footer.append(abandon)
  }
  el.append(grid, footer)
  draw()
}

function transferCampaignPage(el) {
  const { h, P } = X
  const progress = P.transferCampaign || {}
  const cast = new Map(Object.values(X.BYKEY).map(card => [card.id, card]))
  const squad = P.team.filter(key => key && P.club.cards?.[key]?.n > 0 && X.BYKEY[key])
  const hero = h('section', 'bhero camp-hero', '<div><span class="sh-tag">CAMPAIGN</span><h2>THE TRANSFER SEAL</h2><p>Bring your squad or borrow the story cast. The opposition scales to your lineup.</p></div>')
  const team = h('button', 'btn dark sm', squad.length ? 'EDIT MY SQUAD' : 'BUILD MY SQUAD')
  team.onclick = () => X.go('team')
  hero.firstElementChild.append(team)
  el.append(hero)

  const launch = (chapter, index, loaners = false) => {
    const id = missionId(chapter, index)
    const entry = campaignMission(id, X.P.transferCampaign)
    if (!entry?.open) return
    const { data } = entry
    const lending = [...new Set([...data.cast, ...(data.secondFront?.cast || [])])]
    const fighters = lending.map(key => cast.get(key)?.key).filter(Boolean)
    const required = data.carrier ? [cast.get(data.carrier)?.key].filter(Boolean) : []
    const buildLineup = lineup => chapter >= 3
      ? [...new Set([...(loaners || !lineup.length ? fighters : required), ...lineup])].slice(0, 6)
      : loaners || !lineup.length ? fighters : lineup
    const playerTeam = buildLineup(squad)
    const enemy = data.enemies.map(id => cast.get(id)?.key).filter(Boolean)
    if (!playerTeam.length || enemy.length !== data.enemies.length) {
      X.toast('A campaign fighter is unavailable.', 'red')
      return
    }
    const title = id + ' · ' + data.name
    const outro = (done = () => {}) => {
      scene(data.outro, title, CAMPAIGN_ART[data.place], () => {
        if (data.reveal) scene([['Narrator', data.revealText]], title, CAMPAIGN_ART[data.reveal], done, cast)
        else done()
      }, cast)
    }
    const stage = { mode: 'transfer-campaign', id, name: data.name, label: title, playerTeam, team: enemy,
      retryLineup: loaners ? null : () => buildLineup(X.P.team.filter(key => key && X.BYKEY[key] && X.P.club.cards[key])),
      transfer: entry, arena: data.place === 'deck' ? 'deck' : data.place === 'city' || data.place === 'corridor' ? 'city' : 'forest',
      afterWin: outro, nextFight: entry.next ? () => outro(() => {
        const next = campaignMission(entry.next, X.P.transferCampaign)
        if (next?.open) launch(next.chapter - 1, next.mission - 1, loaners)
      }) : null }
    scene(data.intro, title, CAMPAIGN_ART[data.place], () => startBattle(stage), cast)
  }
  TRANSFER_CAMPAIGN.forEach((chapter, ci) => {
    const cleared = chapter.missions.filter((_, mi) => progress[missionId(ci, mi)]).length
    const chapterHero = h('section', 'bhero camp-hero')
    const text = h('div')
    text.append(h('span', 'sh-tag', 'CHAPTER ' + (ci + 1) + ' · ' + chapter.sub), h('h2', '', chapter.name), h('p', '', cleared + ' / ' + chapter.missions.length + ' cleared'))
    chapterHero.append(text)
    el.append(chapterHero)
    const list = h('div', 'camp-list')
    chapter.missions.forEach((mission, mi) => {
      const id = missionId(ci, mi), entry = campaignMission(id, progress)
      const done = !!progress[id], reward = cast.get(mission.reward)
      const row = h('div', 'camp-st' + (done ? ' done' : '') + (entry.open ? '' : ' locked'))
      const picture = h('span', 'cs-art')
      picture.style.backgroundImage = 'url("' + CAMPAIGN_ART[mission.place] + '")'
      const detail = h('span', 'cs-tx')
      detail.append(h('small', '', id + (done ? ' · CLEARED' : '')), h('b', '', mission.name),
        h('em', '', (mission.finishAfterWork ? 'Evacuate the last group, then defeat All For One' : mission.goal?.action) || 'Defeat ' + mission.enemies.map(id => cast.get(id)?.name || id).join(', ')))
      if (reward) detail.append(h('small', '', 'FIRST CLEAR · ' + reward.name + ' · ' + reward.ver))
      const buttons = h('div', 'battle-result-actions')
      const play = h('button', 'btn gold sm', !entry.open ? 'LOCKED' : done ? 'REPLAY' : 'PLAY')
      play.disabled = !entry.open
      play.onclick = () => launch(ci, mi)
      buttons.append(play)
      if (entry.open && squad.length) {
        const borrow = h('button', 'btn dark sm', 'BORROW CAST')
        borrow.onclick = () => launch(ci, mi, true)
        buttons.append(borrow)
      }
      row.append(picture, detail, buttons)
      list.append(row)
    })
    el.append(list)
  })
}

function draftStage(run) {
  const team = X.ST().draft.enemies
  if (run?.status !== 'ready' || !team.length || !run.picks.every(key => X.BYKEY[key])) return null
  return { mode: 'draft', id: run.round, name: 'Draft Fight ' + (run.round + 1), level: [3, 4, 5][run.round],
    boost: [1, 1.12, 1.25][run.round], team, draft: run }
}

export function battlePage(el) {
  const { h, P } = X
  try { const m = sessionStorage.getItem('bmode'); if (m) { sessionStorage.removeItem('bmode'); MODE = m === 'rivalry' ? 'draft' : ['camp', 'villain'].includes(m) ? 'redzone' : m } } catch { }
  const prog = (P.battle && P.battle.cleared) || 0
  const team = P.team.filter(Boolean)
  modeTabs(el)
  if (MODE === 'chronicle') return chroniclePage(el, { X, startBattle, campTeam, scene })
  if (MODE === 'transfer-campaign') return transferCampaignPage(el)
  if (MODE === 'war') return warPage(el)
  if (MODE === 'draft') return draftPage(el, X, run => {
    const stage = draftStage(run)
    if (stage) go2(stage)
    else X.toast('This draft fight is unavailable.', 'red')
  })
  if (MODE !== 'story') {
    if (team.length < 6 && MODE !== 'arcs') { const w = h('div', 'panel pad', `<b>Your team needs 6 fighters.</b>`); const b = h('button', 'btn gold', 'GO TO MY TEAM'); b.onclick = () => X.go('team'); w.append(b); el.append(w) }
    return (MODE === 'live' ? livePage : MODE === 'crucible' ? cruciblePage : MODE === 'redzone' ? redzonePage : MODE === 'rift' ? riftPage : MODE === 'raid' ? raidPage : MODE === 'boss' ? bossPage : MODE === 'ranked' ? rankedPage : MODE === 'tower' ? towerPage : MODE === 'arcs' ? arcsPage : eventPage)(el, team.length >= 6)
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
const blocksDeathNote = stage => !stage.live && !stage.pvp && stage.mode !== 'ranked'

function battleDeck(deck, stage, random = Math.random) {
  if (!deck?.deathnote || !blocksDeathNote(stage)) return { deck, replacements: [] }
  const { deathnote, ...copy } = deck
  const items = Object.keys(ARTS).filter(key => ARTS[key].item && key !== 'deathnote')
  const replacements = []
  for (let i = 0; i < deathnote; i++) {
    const unused = items.filter(key => !copy[key])
    const pool = unused.length ? unused : items
    const item = pool[Math.floor(random() * pool.length)]
    copy[item] = (copy[item] || 0) + 1
    replacements.push(item)
  }
  return { deck: copy, replacements }
}

export function startBattle(stage) {
  const { h, cardImg, eff, BYKEY, P } = X
  const LV = stage.live || null
  const yours = LV ? LV.myTeam : stage.draft ? stage.draft.picks.map(key => BYKEY[key]) : stage.storyTeam ? stage.storyTeam.map(k => BYKEY[k]) : (stage.playerTeam || P.team).filter(Boolean).map((k, i) => (((stage.rivalry || stage.rival) && i === 0) || ((stage.transfer || i === 0) && !P.club.cards[k])) ? BYKEY[k] : eff(BYKEY[k])).filter(Boolean)
  const lockedKit = stage.rivalrySetup || (stage.lockedKit && { kit: stage.lockedKit, form: stage.lockedForm })
  if (lockedKit?.kit && yours[0]) yours[0] = rivalryLead(yours[0], lockedKit, X.POOL)
  const B = { you: newSide(yours), ai: newSide(enemyTeam(stage)), turn: 1, over: false, busy: false, noDeathNote: blocksDeathNote(stage) }
  PASLOG = []
  if (stage.draft) {
    B.you.team.forEach((f, i) => { f.ko = stage.draft.hp[i] === 0 })
    B.you.active = B.you.team.findIndex(f => !f.ko)
  }
  const mission = stage.transfer
  const operation = mission?.data.goal
  let crossingOpen = false
  const finishAfterWork = mission?.data.finishAfterWork
  const carrierReady = () => !mission?.data.carrier || B.you.team.some(f => BYKEY[f.key]?.id === mission.data.carrier && !f.ko)
  const canWork = () => carrierReady() && (!finishAfterWork || (crossingOpen && steps < operation.count))
  let steps = 0, workedAt = 0, enemyRounds = 0, secondFront = false, objectiveHitAt = 0
  const currentWork = () => secondFront ? mission.data.secondFront.goal : operation
  const workCost = () => currentWork()?.approach === 'break' && objectiveHitAt !== B.turn ? 2 : 1
  const turningPoints = createTurningPoints()
  const highlight = (side, text, priority) => turningPoints.add(B.turn, side, text, priority)
  const selectedDeck = (X.ST().decks || [])[X.ST().deckOn || 0]
  const { deck, replacements } = battleDeck(!stage.storyTeam && !stage.draft ? selectedDeck?.c : null, stage)
  if (deck) { B.you.deck = deck; B.you.hand = []; B.you.pile = null }
  if (LV) { B.you.deck = LV.myDeck || null; B.ai.deck = LV.oppDeck || null; B.you.hand = []; B.ai.hand = []; B.you.pile = B.ai.pile = null; B.you.rngS = (LV.seed + (LV.role === 'h' ? 1 : 2)) | 0; B.ai.rngS = (LV.seed + (LV.role === 'h' ? 2 : 1)) | 0 }
  if (stage.boss) for (const f of B.ai.team) { f.hp = f.max = Math.round(f.max * stage.boss); f.pwr = Math.round(f.pwr * .88); f.ki = Math.round(f.ki * .88); f.def = Math.round(f.def * 1.15) }
  if (stage.youCat) for (const f of B.you.team) if ((f.card.cat || []).includes(stage.youCat)) for (const k of ['pwr', 'ki', 'def']) f[k] = Math.round(f[k] * 1.15)
  const deadZone = stage.mode === 'redzone'
  const arcBalance = stage.mode === 'arc' ? pveBalance('arc', B.you.team, {
    floor: stage.pveFloor, episodes: stage.pveEpisodes, baseBoost: stage.boost,
  }) : null
  const castBoost = arcBalance ? (stage.playerBoost || 1) * arcBalance.storyBoost : stage.playerBoost
  for (const [side, boost] of [[B.ai, arcBalance ? 1 : stage.boost], [B.you, castBoost]]) {
    if (!boost || boost === 1) continue
    for (const f of side.team) {
      f.hp = f.max = Math.round(f.max * boost)
      for (const k of ['pwr', 'ki', 'def']) f[k] = Math.round(f[k] * (1 + (boost - 1) * .6))
    }
  }
  for (const [me, foe] of [[B.you, B.ai], [B.ai, B.you]]) {
    for (const f of me.team) {
      if (f.ko) continue
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
  if (stage.mode === 'redzone') for (const f of B.ai.team) { f.pe = { ...(f.pe || {}) }; for (const k of ['regen', 'teamHeal', 'koHeal', 'drain', 'bigHitHeal', 'ultHeal']) delete f.pe[k] } // Dead Zones: enemies never heal
  if (stage.rules?.ultStart) B.ai.gauge = Math.max(B.ai.gauge, stage.rules.ultStart)
  if (stage.youRules) { const yr = stage.youRules; for (const f of B.you.team) { f.pe = { ...(f.pe || {}) }; for (const [k, v] of Object.entries(yr)) if (k !== 'ultStart' && k !== 'teamDmg') f.pe[k] = typeof v === 'number' && typeof f.pe[k] === 'number' ? f.pe[k] + v : v } if (yr.ultStart) B.you.gauge = Math.max(B.you.gauge, yr.ultStart); if (yr.teamDmg) B.you.teamDmg = (B.you.teamDmg || 0) + yr.teamDmg }
  applyLeader(B.you); applyLeader(B.ai); applyAuras(B.you, 3); applyAuras(B.ai, (stage.level || 1) >= 5 ? 5 : 4); applyLinks(B.you); applyLinks(B.ai)
  for (const side of [B.you, B.ai]) {
    const add = (f, dmg, dr) => { f.pe = { ...(f.pe || {}), dmg: ((f.pe || {}).dmg || 0) + dmg, dr: Math.min(70, ((f.pe || {}).dr || 0) + dr) } }
    for (const src of side.team) {
      const e = src.pe || {}
      if (e.allyAnime) for (const f of side.team) if (f !== src && f.card.anime === e.allyAnime.anime) add(f, e.allyAnime.dmg || 0, e.allyAnime.dr || 0)
      for (const p of [e.pair].flat().filter(Boolean)) { const has = id => side.team.some(f => f !== src && f.card.id === id); if (p.all ? p.ids.every(has) : p.ids.some(has)) add(src, p.dmg || 0, p.dr || 0) }
    }
  }
  applySquadBond(B.you); if (LV) applySquadBond(B.ai)
  applyMultiverse(B.you); if (LV) applyMultiverse(B.ai)
  if (stage.crucible) {
    B.you.team.forEach((f, i) => { const p = stage.crucible.hp[i]; f.crucibleHalf = 1; if (p === 0) { f.ko = true; f.hp = 0 } else if (p != null) f.hp = Math.max(1, Math.round(f.max * p)) })
    B.you.active = Math.max(0, B.you.team.findIndex(f => !f.ko)); B.you.gauge = stage.crucible.gauge || 0
    for (const e of B.ai.team) { e.max = e.hp = Math.max(1, Math.round(e.max * .62)); e.pwr = Math.round(e.pwr * 1.08); e.ki = Math.round(e.ki * 1.08) } // Crucible: shorter fights, same threat
    if (stage.crucible.n >= 4) for (const e of B.ai.team) e.ngEnrage = true // past the tutorial stages, enemies enrage when low
  }
  if (mission) {
    const scaling = campaignScale(B.you.team, mission.chapter, mission.mission, B.ai.team.length)
    stage = { ...stage, level: scaling.level }
    B.ai.campaignDamage = scaling.damage
    for (const enemy of B.ai.team) {
      const ratio = scaling.hp
      enemy.max = enemy.hp = Math.max(1, Math.round(enemy.max * ratio))
    }
    if (mission.data.finale) {
      act(B.ai).campaignTell = true
      act(B.ai).encounterPhase = true
    }
  }
  const balanceMode = stage.mode ?? (stage.war ? 'war' : stage.enemy && !stage.pvp && !LV ? 'story' : null)
  const newGen = stage.newGen != null
  const balance = arcBalance || pveBalance(balanceMode, B.you.team, {
    floor: stage.pveFloor, enemies: B.ai.team.length, finale: stage.pveFinal,
    progression: stage.pveProgress ?? (stage.mode === 'rivalry' ? Number(stage.id === 'mastery') : stage.war ? (stage.level - 1) / 4 : ((stage.n || 1) - 1) / 9),
  })
  if (newGen) Object.assign(balance, newGenBalance(stage.newGen, pveSquadPower(B.you.team), stage.ngAdj))
  if (balance) {
    if (deadZone) for (const enemy of B.ai.team) {
      enemy.deadZoneEnemy = true
      enemy.newGenBoss = newGen
      if (newGen && stage.newGen >= 9) enemy.ngEnrage = stage.newGen >= 12 ? 2 : true
      if (newGen) enemy.newGenIncomingHitCap = balance.incomingHitCap
    }
    B.ai.campaignDamage = balance.damage
    for (const enemy of B.ai.team) {
      if (deadZone) enemy.deadZoneRegenBase = enemy.max
      const hp = Math.round(enemy.max * balance.hp)
      enemy.max = enemy.hp = hp
      if (balance.scoreBoss) enemy.scoreBoss = true
    }
    if (balance.phase) act(B.ai).encounterPhase = true
  }
  if (stage.rivalry) {
    const boss = act(B.ai), mastery = stage.id === 'mastery'
    boss.rivalBarrier = 3
    boss.max = boss.hp = Math.round(boss.max * (mastery ? 6.2 : 4.8))
    boss.pwr = Math.round(boss.pwr * (mastery ? 2.15 : 1.8))
    boss.ki = Math.round(boss.ki * (mastery ? 2.15 : 1.8))
    boss.spd = 0
    B.hakaiSurvived = false
    B.finalExplosionKO = false
  }
  if (stage.chapterRule === 'mirror' && !unwritten(act(B.you))) {
    const copy = fighter(act(B.you).card)
    B.ai.team.push(copy)
  }
  if (['returning', 'reversal'].includes(stage.chapterRule)) {
    const saved = X.ST().campP?.rescued || []
    if (saved.includes('Kawaki')) B.you.ki = Math.min(KI_MAX, B.you.ki + 2)
    if (saved.includes('Netero')) B.you.gauge = Math.min(GAUGE_MAX, B.you.gauge + 20)
    if (saved.includes('Jinbe')) {
      const lead = act(B.you)
      lead.shieldHp = Math.max(lead.shieldHp, Math.round(lead.max * .2))
    }
  }
  if (stage.chapterRule === 'restore') {
    const fallen = B.you.team.at(-1)
    if (fallen !== act(B.you)) { fallen.hp = 0; fallen.ko = true; B.you.gauge = GAUGE_MAX }
  }
  if (stage.rival === 'baryon') B.you.gauge = GAUGE_MAX
  if (stage.rival === 'flame') act(B.ai).rivalFlame = true
  if (stage.chapterRule === 'open-guard' || stage.encounter === 'break-guard') act(B.ai).guard = 1
  if (stage.chapterRule === 'king-flame') act(B.ai).rivalFlame = true
  if (stage.encounter === 'second-phase') act(B.ai).encounterPhase = true
  if (stage.encounter === 'guard-school') {
    B.ai.gauge = 35
    B.you.hand = ['guard', 'strike', 'blast', 'special']
  }
  if (stage.chapterRule === 'open-survive') B.ai.gauge = GAUGE_MAX
  if (stage.rival === 'overload') B.you.gauge = 70
  for (const side of [B.you, B.ai]) for (const f of side.team) f.startingMax = f.max
  if (stage.draft) B.you.team.forEach((f, i) => {
    f.hp = f.ko ? 0 : Math.max(1, Math.round(f.max * stage.draft.hp[i]))
  })
  const sealNow = () => { for (const [me, foe] of [[B.you, B.ai], [B.ai, B.you]]) { const a = act(me), o = act(foe); if (a && o && PE(a).nullPassive && !a.ko) o.sealed = 1 } }
  for (const side of [B.you, B.ai]) {
    const active = act(side)
    if (side.team.some(f => !f.ko && PE(f).beastDuo)) {
      active.shieldHp = Math.max(active.shieldHp || 0, Math.round(active.max * .2))
    }
  }
  sealNow()
  syncReworkMatchup(B.you, B.ai)
  refill(B.you); refill(B.ai)
  const fA = PE(act(B.you)).first, fB = PE(act(B.ai)).first
  let youFirst = fA && !fB ? true : fB && !fA ? false : act(B.you).spd >= act(B.ai).spd
  if (LV) { const H = LV.role === 'h' ? B.you : B.ai, G = H === B.you ? B.ai : B.you, fH = PE(act(H)).first, fG = PE(act(G)).first, hostFirst = fH && !fG ? true : fG && !fH ? false : act(H).spd >= act(G).spd; youFirst = LV.role === 'h' ? hostFirst : !hostFirst }
  if (newGen) youFirst = true
  if (youFirst && PE(act(B.you)).stopFirst) B.ai.skip = 1
  if (!youFirst && PE(act(B.ai)).stopFirst) B.you.skip = 1

  const AR = stage.arena && ARENAS[stage.arena] ? stage.arena : ARENA_KEYS[stage.live ? stage.live.seed % ARENA_KEYS.length : Math.floor(Math.random() * ARENA_KEYS.length)]
  const ov = h('div', 'bc battle-redesign th-' + AR); ov.id = 'arena'
  ov.innerHTML = `<div class="bcs"><div class="bcs-wall"></div><div class="bcs-rig r1">${'<i></i>'.repeat(14)}</div><div class="bcs-rig r2">${'<i></i>'.repeat(10)}</div><i class="bcs-spot s1"></i><i class="bcs-spot s2"></i><i class="bcs-spot s3"></i><div class="bcs-crowd"></div><div class="bcs-board"><span>ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · ANIME ULTIMATE TEAM · LIVE · </span></div><div class="bcs-floor"><i class="ln"></i><i class="cc"></i><i class="ccd"></i></div><div class="bcs-haze"></div></div><div class="env"><i class="e-sky"></i><i class="e-far"></i><i class="e-near"></i><i class="e-amb"></i><i class="e-vig"></i></div><div class="stage3"><div class="st-sky"></div><div class="st-pillars"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="st-floor"><div class="st-plat"><i class="r1"></i><i class="r2"></i><i class="mid"></i><i class="pad ai"></i><i class="pad you"></i></div></div></div>
    <header class="ar-top"><button class="ar-quit">✕ QUIT</button><button class="ar-mute"></button><button class="ar-speed"></button><button class="ar-auto"${stage.live ? " hidden" : ""}>AUTO</button>${stage.live ? "<span class=\"pvp-clock\">⏳</span>" : ""}<span class="ar-stage">${stage.label ? stage.label.toUpperCase() : stage.pvp ? 'VS ' + stage.name.toUpperCase() : 'STAGE ' + stage.n + ' · ' + stage.name.toUpperCase()}</span><span class="ar-form-timer" hidden></span><span class="ar-turn"></span></header>
    <div class="bct"><div class="bct-s you"></div><div class="bct-vs"><b>VS</b><small class="bct-t" role="status"></small></div><div class="bct-s ai"></div></div><div class="battle-objectives"></div><div class="ar-plate ai"><span class="pe"></span><span class="pp"></span><span class="pn">${stage.pvp ? stage.name.toUpperCase() : 'ENEMY · ' + stage.name.toUpperCase()}</span><span class="pk"></span></div><div class="mat"><div class="mat-in"><i class="mat-surf"></i><i class="mat-emb"></i><div class="mat-line"></div><span class="mat-tag t-ai">ENEMY ACTIVE</span><span class="mat-tag t-you">YOUR ACTIVE</span><div class="ar-side ai"><div class="ar-bench"></div><button type="button" class="ar-active"></button><div class="ar-hud"></div></div>
    
    <div class="ar-side you"><div class="ar-hud"></div><button type="button" class="ar-active"></button><div class="ar-bench"></div></div></div></div><div class="ar-plate you"><span class="pe"></span><span class="pp"></span><span class="pn">YOU</span><span class="pk"></span></div>
    <div class="ar-mid"><div class="ar-log" role="status"></div><div class="battle-info-tools"><button type="button" class="battle-art-preview" aria-pressed="false">ART PREVIEW</button><button type="button" class="battle-history">BATTLE LOG</button></div></div>
    <footer class="ar-ctrl" aria-label="Battle commands"><div class="ar-ki"></div><div class="ar-hand"></div><div class="ar-btns"><button class="ar-trans" hidden><b>TRANSFORM</b><small></small></button><button class="ar-trans ar-fusion-tag" hidden><b>TAG</b><small></small></button><button class="ar-ult"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44"/></svg><b>ULT</b><small></small></button><button class="ar-end"><b>END</b><small>TURN</small></button></div></footer><div class="fxl"></div>`
  if (stage.bg) { ov.classList.add('chr-arena'); ov.style.setProperty('--chr-bg', `url('${stage.bg}')`) }
  document.body.append(ov); document.body.classList.add('in-battle'); music(['redzone', 'crucible', 'boss', 'raid'].includes(MODE) ? 'boss' : 'battle')
  for (const side of [B.you, B.ai]) for (const f of side.team) for (const form of f.card.transformations || []) {
    const image = new Image()
    image.src = form.url
    image.decode?.().catch(() => {})
  }
  let advanceObjective
  const dzWarning = deadZone ? h('div', 'transfer-ribbon') : null
  if (dzWarning) {
    dzWarning.hidden = true
    dzWarning.setAttribute('role', 'status')
    ov.querySelector('.battle-objectives').append(dzWarning)
  }
  if (mission) {
    const ribbon = h('div', 'transfer-ribbon')
    const counter = h('span', 'transfer-status')
    counter.setAttribute('aria-live', 'polite')
    const route = h('select', 'transfer-route')
    route.setAttribute('aria-label', 'Choose the genuine signal')
    route.hidden = operation?.approach !== 'signal'
    for (const [value, name] of [[0, 'Choose a mark'], [1, 'Steady mark'], [2, 'Flickering mark']]) {
      const option = h('option', '', name)
      option.value = value
      route.append(option)
    }
    const action = h('button', 'btn gold sm transfer-action')
    action.hidden = operation?.kind !== 'work'
    advanceObjective = async (automatic = false) => {
      if (operation?.kind !== 'work' || !canWork() || (B.busy && !automatic) || B.over || workedAt === B.turn || B.you.ki < workCost() || act(B.you).ko) return
      if (currentWork()?.approach === 'signal') {
        if (automatic) route.value = '1'
        if (!Number(route.value)) { log('Choose the mark with a steady signal.'); return }
        if (route.value !== '1') {
          B.you.ki = Math.max(0, B.you.ki - 1)
          workedAt = B.turn
          log('False signal. Try the steady mark next round.')
          draw()
          return
        }
        route.value = '0'
      }
      B.you.ki -= workCost()
      if (currentWork()?.approach === 'cover') {
        const ally = act(B.you)
        ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * .12))
      }
      workedAt = B.turn
      steps++
      if (mission.data.secondFront && !secondFront && steps === operation.count - mission.data.secondFront.goal.count) {
        secondFront = true
        ov.style.setProperty('--bgimg', 'url("' + CAMPAIGN_ART[mission.data.secondFront.place] + '")')
        log('First front secure. Clear the other end of the crossing.')
        turnBanner('SECOND FRONT', true)
      }
      log((secondFront ? mission.data.secondFront.goal.action : operation.action) + ' · ' + steps + '/' + operation.count)
      if (mission.data.midpoint && steps === 1) {
        B.busy = true
        draw()
        await new Promise(resolve => scene(mission.data.midpoint, 'BANKAI', CAMPAIGN_ART[mission.data.place], resolve,
          new Map(Object.values(BYKEY).map(card => [card.id, card]))))
        B.busy = automatic
        if (!B.closed) draw()
        return
      }
      draw()
      if (steps >= operation.count) {
        if (!finishAfterWork) await end(true)
        else {
          const boss = act(B.ai)
          boss.campaignTell = false
          boss.guard = 1
          B.ai.gauge = GAUGE_MAX
          log('EVACUATION COMPLETE · Defeat All For One to seal the crossing.')
          draw()
        }
      }
    }
    action.onclick = () => advanceObjective()
    ribbon.append(counter, route, action)
    ov.querySelector('.battle-objectives').append(ribbon)
  }
  const $a = s => ov.querySelector(s)
  let ST3 = null
  const FXC = createFX(ov)
  // 3D engine removed for performance; the stage is a static CSS scene
  const history = []
  let previewMode = false
  const previewToggle = $a('.battle-art-preview')
  previewToggle.onclick = () => {
    previewMode = !previewMode
    previewToggle.setAttribute('aria-pressed', String(previewMode))
    previewToggle.textContent = previewMode ? 'PICK AN ART' : 'ART PREVIEW'
    controls()
  }
  $a('.battle-history').onclick = () => battleInfo(ov, 'Battle log', history.length ? history.map(event => 'Turn ' + event.turn + ' · ' + event.text) : ['No events yet.'])
  const remember = t => {
    if (history.at(-1)?.text !== t || history.at(-1)?.turn !== B.turn) {
      history.push({ turn: B.turn, text: t })
      if (history.length > 48) history.shift()
    }
  }
  const log = (t, record = true) => {
    if (record) remember(t)
    const l = $a('.ar-log'); l.textContent = t; l.classList.remove('pop'); void l.offsetWidth; l.classList.add('pop') }
  if (replacements.length) log('Death Note replaced for this battle by ' + replacements.map(item => ARTS[item].name).join(', ') + '.')
  let SPEED = 1; try { SPEED = +localStorage.getItem('aut-bspeed') || 1 } catch { }
  let AUTO = false
  const wait = ms => new Promise(r => setTimeout(r, ms / SPEED))
  const IMG = new Map()
  const img = (f, w) => { const im = new Image(); im.alt = f.card.name; im.draggable = false; const k = f.card.id + ':' + f.key + ':' + w; if (!IMG.has(k)) IMG.set(k, thumbURL(f.card, w, w === 360)); IMG.get(k).then(u => im.src = u, () => {}); return im }

  const markupCache = new WeakMap()
  function updateMarkup(element, markup) {
    if (markupCache.get(element) === markup) return
    element.innerHTML = markup
    markupCache.set(element, markup)
  }

  const battleName = f => stage.chapterRule === 'unrecorded' && unwritten(f) ? 'UNRECORDED' : f.card.name
  function bcHud(side, s) {
    const f = act(s), el = $a('.bct-s.' + side), pct = f.hp / f.max * 100
    if (el.dataset.k !== f.card.id) {
      el.dataset.k = f.card.id
      el.innerHTML = `<div class="bp" style="background-image:url('${f.card.url}');background-position:${Math.round((f.card.fx ?? .5) * 100)}% ${Math.round((f.card.fy ?? .22) * 100)}%"></div><div class="bi"><div class="bn"><b>${battleName(f)}</b>${side === 'you' && mastL(f.key) > 0 ? `<em class="ml">M${mastL(f.key)}</em>` : ''}<small>${f.card.ver}</small></div><div class="bh"><i class="gh"></i><i class="fg"></i><span class="bnum"></span></div><div class="bm"><span class="be"></span><span class="battle-ult-readout"></span><span class="bk"></span></div></div>`
      el.classList.remove('in'); void el.offsetWidth; el.classList.add('in')
      el.querySelector('.gh').style.width = el.querySelector('.fg').style.width = pct + '%'
    }
    let status = el.querySelector('.battle-status')
    if (!status) { status = h('div', 'battle-status'); el.querySelector('.bi').append(status) }
    const statuses = fighterStatuses(f, PE(f), !stage.storyTeam && nextTransformation(f, s, B.turn), s, B.turn, (side === "you" ? B.ai : B.you).waveBasic)
    const statusKey = JSON.stringify(statuses)
    if (status.dataset.key !== statusKey) {
      status.dataset.key = statusKey
      status.replaceChildren(...statuses.map(entry => {
        const chip = h('button', 'battle-status-chip')
        chip.type = 'button'; chip.textContent = entry.label; chip.title = entry.detail
        chip.onclick = () => battleInfo(ov, f.card.name, [entry.detail])
        return chip
      }))
    }
    const fg = el.querySelector('.fg'), gh = el.querySelector('.gh'), was = parseFloat(fg.style.width)
    if (fg.style.width !== pct + '%') {
      fg.style.width = pct + '%'
      setTimeout(() => { gh.style.width = pct + '%' }, 450)
    }
    if (pct < was - .1) { el.classList.remove('dmgd'); void el.offsetWidth; el.classList.add('dmgd') }
    el.classList.toggle('low', pct < 30)
    el.querySelector('.bnum').textContent = f.hp.toLocaleString() + ' / ' + f.max.toLocaleString()
    el.querySelector('.battle-ult-readout').textContent = 'ULT ' + Math.floor(s.gauge) + '%'
    el.querySelector('.be').innerHTML = `⚡ <b>${s.ki}</b>/${KI_MAX}`
    el.querySelector('.bk').innerHTML = s.team.map(g => `<i class="${g.ko ? 'ko' : ''}"></i>`).join('')
    
    $a('.bct-t').textContent = B.over ? 'FINISHED' : B.busy ? 'RESOLVING' : 'YOUR TURN'
  }
  function hud(side, s) {
    const f = act(s), el = $a(`.ar-side.${side} .ar-hud`)
    updateMarkup(el, `<div class="hn"><b>${battleName(f)}</b><small>${f.card.ver}</small></div>
      <div class="hp"><i style="width:${f.hp / f.max * 100}%"></i><span>${f.hp.toLocaleString()} / ${f.max.toLocaleString()}</span></div>
      <div class="gg ${s.gauge >= GAUGE_MAX ? 'full' : ''}"><i style="width:${s.gauge}%"></i></div>`)
  }
  function field(side, s) {
    const a = $a(`.ar-side.${side} .ar-active`), f = act(s)
    if (a.dataset.k !== f.card.id) { a.innerHTML = ''; const im = img(f, 360); a.append(im); a.dataset.k = f.card.id; a.classList.remove('enter'); void a.offsetWidth; a.classList.add('enter') }
    a.style.setProperty('--rc', X.tierCol(f.card.r)); a.classList.toggle('aura', !!f.aura); a.classList.toggle('formed', !!f.transformed && !f.aura)
    let hb = a.querySelector('.hpb'); if (!hb) { hb = document.createElement('div'); hb.className = 'hpb'; a.append(hb) }
    updateMarkup(hb, `<b>${f.hp.toLocaleString()}</b><i><s style="width:${f.hp / f.max * 100}%"></s></i>`)
    const foeF = act(side === 'you' ? B.ai : B.you), mu = foeF ? matchup(f, foeF) : 1
    let tg = a.querySelector('.mtag'); if (!tg) { tg = document.createElement('div'); a.append(tg) } tg.className = 'mtag ' + (mu > 1 ? 'adv' : mu < 1 ? 'weak' : 'none'); tg.textContent = mu > 1 ? 'ADVANTAGE' : mu < 1 ? 'WEAKNESS' : ''
    a.setAttribute('aria-label', (side === 'you' ? 'Your fighter: ' : 'Enemy fighter: ') + battleName(f))
    a.onclick = () => inspect(f, side)
    ov.querySelector('.ar-plate.' + side + ' .pe').innerHTML = `⚡<b>${s.ki}</b><small>/${KI_MAX}</small>`
    { const bn0 = $a(`.ar-side.${side} .ar-bench`); bn0.classList.toggle('can-swap', side === 'you' && (!B.you.switched || B.you.conjunction) && !B.busy && !B.over); bn0.classList.toggle('tag-ready', side === 'you' && !B.you.switched && !B.over && (B.you.seq.includes('special') || B.you.ultTurn === B.turn)) }
    ov.querySelector('.ar-plate.' + side + ' .pk').innerHTML = s.team.map(g => `<i class="${g.ko ? 'ko' : ''}"></i>`).join('')
    { const p = passives(s), chips = []; if (p.heal) chips.push(`<b class="pc heal">+${p.heal}% HEAL</b>`); if (p.dr) chips.push(`<b class="pc dr">-${p.dr}% DMG TAKEN</b>`); if (p.dmg) chips.push(`<b class="pc dmg">+${p.dmg}% DMG</b>`); if (p.crit) chips.push(`<b class="pc crit">+${p.crit}% CRIT</b>`); if (p.gauge) chips.push(`<b class="pc gg">+${p.gauge}% ULT/TURN</b>`); ov.querySelector('.ar-plate.' + side + ' .pp').innerHTML = chips.join('') }
    const bn = $a(`.ar-side.${side} .ar-bench`), bkey = s.active + '|' + s.team.map(g => g.card.id + (g.ko ? 'x' : '')).join(',')
    if (bn.dataset.k === bkey) { let j = 0; s.team.forEach((g, i) => { if (i === s.active) return; const el = bn.children[j++], bar = el && el.querySelector('i'); if (bar) bar.style.width = (g.hp / g.max * 100) + '%' }); return }
    bn.dataset.k = bkey; bn.innerHTML = ''
    s.team.forEach((g, i) => {
      if (i === s.active) return
      const b = document.createElement('button'); b.className = 'bslot' + (g.ko ? ' ko' : ''); b.title = battleName(g); b.append(img(g, 160))
      b.append(Object.assign(document.createElement('i'), { style: `width:${g.hp / g.max * 100}%` }))
      if (side === 'you' && g.ko && s.team.some(z => !z.ko && PE(z).zerefRevive && (z.zerefUsed || 0) < 2)) { b.classList.toggle('revive-mark', s.reviveMark === i); b.onclick = () => { s.reviveMark = i; log('Zeref will revive ' + g.card.name + ' with his next Special.'); bn.dataset.k = ''; draw() }; bn.append(b); return }
      b.onclick = () => inspect(g, side, side === 'you' && !g.ko && (!B.you.switched || B.you.conjunction) && !B.busy && !B.over ? () => doSwitch(i) : null)
      bn.append(b)
    })
  }
  function previewArt(kind, unavailable) {
    const me = B.you, foe = B.ai, f = act(me), target = act(foe), kit = PE(f)
    const attack = ATTACK_ARTS.includes(kind), special = kind === 'special'
    const flames = special && ((kit.igneelFlame && f.flame === 3) || (kit.spendFlame && f.flame > 0))
    const all = special && (isAoe(f.card) || flames || kit.splash)
    const enemy = attack || ['deathnote', 'scroll', 'clock'].includes(kind)
    const targets = kind === 'wing' ? me.team.filter(c => c.ko).slice(0, 1) : all ? alive(foe) : [enemy ? target : f]
    if (kind === 'strike' && gtForm(f) === 4) targets.push(...alive(foe).filter(c => c !== target))
    else if (kind === 'strike' && kit.benchChip) targets.push(...alive(foe).filter(c => c !== target).slice(0, 1))
    const pierce = (kind !== 'burst' && /Ignores Guard/.test(kitTxt(f.card)) && special) || kit.pierce || (kit.wheel && f.hitsTaken >= 4) ||
      (kind === 'strike' && (kit.pierceStrike || (kit.ironShadow && f.iron > 0) || (kit.shadowDrive && f.shadowStrike))) ||
      (special && (kit.pierceSpec || (kit.igneelFlame && f.flame === 3) || (kit.sunCycle && f.sunArts === 7) || (kit.sunCounter && f.sunCounter)))
    return artPreview({ kind, name: special ? f.card.mv : gtArt(f, kind)?.name || ARTS[kind].name,
      desc: special ? (f.card.tx || []).join(' ') : gtArt(f, kind)?.desc || ARTS[kind].desc, active: f.card.name,
      targets: targets.map(t => t.card.name + (t === target ? ' (enemy active)' : t === f ? ' (your active)' : enemy ? ' (enemy bench)' : ' (your bench)')),
      ranged: rangedHit(f, kind), pierce, guard: attack && target.guard, sealed: special && me.confiscated && !unwritten(f),
      absorb: !kit.antiKit && PE(target).absorbRanged, unavailable })
  }

  const unavailableArt = kind => {
    if (B.busy || B.over) return 'Wait for your turn.'
    const s = B.you, f = act(s)
    if (kind === 'special' && s.confiscated && !unwritten(f)) return 'Your Special is sealed.'
    if (kind === 'deathnote' && B.noDeathNote) return 'Death Note is unavailable in this mode.'
    if (kind === 'wing' && !s.team.some(fighter => fighter.ko)) return 'No knocked-out teammate to revive.'
    const missing = Math.max(kind === 'burst' ? 2 : 0, artCost(f, kind, s, B.ai)) - s.ki
    return missing > 0 ? 'Need ' + missing + ' more Energy.' : ''
  }
  function explainUnavailable(title, reason) {
    battleInfo(ov, title, [reason])
  }
  function controls() {
    const s = B.you, my = !B.busy && !B.over
    updateMarkup($a('.ar-ki'), `<div class="kring" style="--k:${s.ki / KI_MAX}"><b>${s.ki}</b><small>ENERGY</small></div><div class="kpips">${Array.from({ length: KI_MAX }, (_, i) => `<i class="${i < s.ki ? 'on' : ''}"></i>`).join('')}</div>`)
    const hand = $a('.ar-hand'), f = act(s), hkey = f.card.id + '|' + s.hand.join(',')
    if (hand.dataset.k === hkey && hand.children.length === s.hand.length) { s.hand.forEach((a, i) => { const el = hand.children[i]; el.querySelector('.gem b').textContent = a === 'burst' ? 'ALL' : artCost(f, a, s, B.ai); el.disabled = !my || s.ki < artCost(f, a, s, B.ai) || (a === 'burst' && s.ki < 2) }) }
    else { hand.dataset.k = hkey; hand.innerHTML = ''
    const rc = X.tierCol(f.card.r), fx = Math.round((f.card.fx ?? .5) * 100), fy = Math.round((f.card.fy ?? .22) * 100)
    const KIND = { strike: ['PHYSICAL', '#ff3d4a', '#ff9a3a'], blast: ['ENERGY', '#ffb020', '#fff04a'], guard: ['DEFENSE', '#20e0a0', '#a8ffda'], special: ['SIGNATURE', tcol(f.card), '#ffffff'], burst: ['TACTIC', '#ff3b6b', '#ffd0dc'], senzu: ['ITEM', '#3aa83a', '#d8ffb0'], cylinder: ['ITEM', '#c8102e', '#ffd23a'], rumble: ['ITEM', '#ff7ab0', '#ffe0ee'], finger: ['ITEM', '#8a0a2a', '#ffb0c0'], deathnote: ['ITEM', '#111', '#e0e0e0'], hogyoku: ['ITEM', '#7a3aff', '#e0d0ff'], wing: ['ITEM', '#ff9a1a', '#fff0a0'], scroll: ['ITEM', '#c8a050', '#fff3d0'], clock: ['ITEM', '#3a8aff', '#d0e8ff'], charge: ['TACTIC', '#ff9a00', '#ffe2a8'], transfer: ['TACTIC', '#3ab8ff', '#c8ecff'], heal: ['TACTIC', '#2fe0b0', '#c8fff0'], cleanse: ['TACTIC', '#a46bff', '#e8d8ff'] }
    s.hand.forEach((a, i) => {
      const d = gtArt(f, a) || ARTS[a], sp = a === 'special', [kind, c1, c2] = KIND[a], b = document.createElement('button')
      b.className = 'art2 ' + a + (d.item ? ' item' : '')
      b.style.cssText = `--c1:${c1};--c2:${c2};--rc:${rc};--i:${i - (s.hand.length - 1) / 2};--art:url("${d.item || f.card.url}");--fx:${d.item ? 50 : fx}%;--fy:${d.item ? 50 : fy}%`
      b.innerHTML = `<span class="fr"></span><span class="pic"></span><span class="holo"></span><span class="glints"><i></i><i></i><i></i><i></i></span>
        <span class="gem"><b>${a === 'burst' ? 'ALL' : artCost(f, a, s, B.ai)}</b></span><span class="kind">${kind}</span>
        <span class="sym">${ICON[a] || `<b class="tac-ic">${TAC_ICON[a]}</b>`}</span>
        <span class="plate"><b>${sp ? f.card.mv : d.name}</b><small>${sp ? (isAoe(f.card) ? 'HITS ALL ENEMIES' : 'MASSIVE SINGLE HIT') : d.desc.toUpperCase()}</small></span>`
      b.disabled = !my || s.ki < artCost(f, a, s, B.ai) || (a === 'burst' && s.ki < 2)
      b.onclick = () => doArt(i)
      hand.append(b)
    }) }
    for (const [i, button] of [...hand.children].entries()) {
      const kind = s.hand[i]
      const reason = unavailableArt(kind)
      const unavailable = !!reason
      button.disabled = false
      button.setAttribute('aria-disabled', String(unavailable && !previewMode))
      button.classList.toggle('art-unavailable', unavailable && !previewMode)
      button.onpointerenter = () => {
        const info = previewArt(kind, unavailable)
        button.title = [...info.lines, reason].filter(Boolean).join(' · ')
      }
      button.onclick = () => {
        if (!previewMode) return reason ? explainUnavailable(ARTS[kind].name, reason) : doArt(i)
        const info = previewArt(kind, unavailable)
        battleInfo(ov, info.title, info.lines)
      }
    }
    {
      const tb = $a('.ar-trans'), partner = !!f.pe.partner, next = !stage.storyTeam && nextTransformation(f, s, B.turn)
      const swapKid = $a('.ar-fusion-tag')
      swapKid.hidden = f.pe.fusionStage !== 1
      swapKid.disabled = !my || f.fcTagTurn === B.turn
      swapKid.querySelector('small').textContent = f.fcTrunks ? '→ GOTEN' : '→ TRUNKS'
      const ok = partner ? canTagPartner(f, B.turn) : canTransform(f, s)
      const timer = $a('.ar-form-timer')
      timer.hidden = f.formExpires == null && gtForm(f) !== 4
      if (gtForm(f) === 4) timer.textContent = 'RAGE ' + f.gtRage + '/3' + (f.gtRemembered ? ' · SSJ4 READY' : '')
      else if (!timer.hidden) timer.textContent = (f.pe.fusionStage === 2 ? 'FUSION · ' : 'BARYON · ') + (f.formExpires - (s.formTurn || 0)) + ' TURNS LEFT'
      const standardForm = !stage.storyTeam && !f.card.transformations && !f.transformed && f.card.ovr >= 88
      tb.hidden = !partner && !next && !standardForm
      tb.disabled = false
      tb.setAttribute('aria-disabled', String(!my || !ok))
      tb.classList.toggle('form-step', !!next)
      tb.classList.toggle('form-ready', !!next && ok && my)
      tb.title = next?.requirement || ''
      const label = next?.buttonLabel || (next?.ver?.startsWith('BARYON') ? 'BARYON' : next?.ver ? 'KURAMA' : 'FORM')
      const status = !next ? '' : next.buttonLabel ? (ok ? 'READY' : next.shortRequirement) : ok ? next.gaugeCost + '% ULT' :
        B.turn < (next.minTurn || 1) ? 'TURN ' + next.minTurn :
          next.fullTurns && (s.formTurn || 0) - f.formEntered <= next.fullTurns ? 'WAIT 1 TURN' :
            next.maxHpPercent && f.hp * 100 > f.max * next.maxHpPercent ? '≤' + next.maxHpPercent + '% HP' :
              'NEED ' + next.gaugeCost + '% ULT'
      tb.querySelector('b').textContent = partner ? 'TAG' : next ? label : 'TRANSFORM'
      tb.querySelector('small').textContent = partner ? '→ ' + partnerNames(f)[Number(!f.partnerSide)] : next ? status : f.card.form?.name || 'POWER UP'
      if (next) tb.setAttribute('aria-label', 'Transform to ' + next.ver + '. ' + status + '. ' + next.requirement)
      else tb.removeAttribute('aria-label')
    }
    const u = $a('.ar-ult'); u.disabled = false; u.setAttribute('aria-disabled', String(!my || s.gauge < GAUGE_MAX)); u.classList.toggle('ready', s.gauge >= GAUGE_MAX)
    const ult = signatureUltimate(f, act(B.ai)) || ultOf(f.card)
    u.style.setProperty('--g', s.gauge / GAUGE_MAX); u.querySelector('small').textContent = s.gauge >= GAUGE_MAX ? ult[0] : Math.floor(s.gauge) + '%'; u.title = ult.join(': ')
    if (mission) {
      const counter = $a('.transfer-status'), action = $a('.transfer-action')
      if (operation?.kind === 'work') {
        const label = secondFront ? mission.data.secondFront.goal.action : operation.action
        counter.textContent = steps + ' / ' + operation.count + ' · ' + label
        const approach = currentWork().approach
        const cue = approach === 'break' && objectiveHitAt !== B.turn ? ' · Land a hit to reduce the cost' :
          approach === 'cover' ? ' · Shields your lead' : approach === 'signal' ? ' · Follow the steady mark' : ''
        counter.textContent += cue
        if (finishAfterWork && !crossingOpen) counter.textContent = 'Drive All For One down to 35% HP'
        if (finishAfterWork && steps >= operation.count) counter.textContent = 'Defeat All For One'
        if (!carrierReady()) counter.textContent = 'The marker carrier has fallen'
        action.hidden = !!(finishAfterWork && steps >= operation.count)
        action.textContent = label + ' · ' + workCost() + ' Energy'
        action.disabled = !canWork() || !my || workedAt === B.turn || s.ki < workCost() || act(s).ko
      } else if (operation?.kind === 'hold') counter.textContent = enemyRounds + ' / ' + operation.count + ' enemy rounds survived'
      else if (operation?.kind === 'threshold') counter.textContent = 'Objective · ' + operation.action
      else if (mission.data.finale) counter.textContent = act(B.ai).campaignTell ? 'The Hollow is watching for an opening' : 'Defeat the Echo Hollow'
      else counter.textContent = 'Objective · Defeat the enemy'
    }
    if (dzWarning) {
      const intent = B.dzIntent
      const warning = intent && intent.enemy === act(B.ai) && !intent.enemy.ko
        ? newGen ? newGenWarning(intent, ARTS[intent.art]?.name) : intent.art ? (intent.triggered ? 'READ LANDED · Boss retaliation incoming' : 'ENEMY READ · Avoid ' + ARTS[intent.art].name)
          : 'HEAVY RUSH · Guard, shield or switch'
        : ''
      dzWarning.hidden = !warning
      if (dzWarning.textContent !== warning) dzWarning.textContent = warning
    }
    $a('.ar-end').disabled = !my
    $a('.ar-turn').textContent = 'TURN ' + B.turn
  }
  function draw() { syncReworkMatchup(B.you, B.ai); hud('ai', B.ai); hud('you', B.you); field('ai', B.ai); field('you', B.you); controls(); bcHud('ai', B.ai); bcHud('you', B.you) }

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

  function flushPas() {
    if (!PASLOG?.length) return
    const seen = new Set()
    let delay = 0
    for (const note of PASLOG.splice(0)) {
      const side = B.you.team.includes(note.f) ? 'you' : 'ai'
      if (note.highlight) {
        highlight(side, note.f.card.name + ' ' + note.highlight, 95)
        continue
      }
      const extra = note.extra || ''
      remember('✦ ' + note.f.card.name + ': ' + note.name + (extra ? ' · ' + extra : ''))
      if (extra === 'DESTRUCTION BARRIER BROKEN') highlight(side, 'Toppo’s Destruction Barrier broke.', 94)
      if (extra.startsWith('LIFE FORCE EROSION') || /^(REVIVED|JACKPOT! FULLY HEALED|LAST EMBERS)/.test(extra)) {
        highlight(side, note.f.card.name + ' · ' + extra, extra.startsWith('LIFE FORCE') ? 70 : 88)
      }
      const key = note.f.card.name + note.name
      if (seen.has(key)) continue
      seen.add(key)
      setTimeout(() => pasPop(note), delay)
      delay += 450
    }
  }
  function pasPop(n) { const el = $a(`.ar-side.${n.f === act(B.you) || B.you.team.includes(n.f) ? 'you' : 'ai'} .ar-active`); if (!el) return; const [x, y] = ctr(el); const t = document.createElement('div'); t.className = 'pas-pop'; t.innerHTML = `<small>✦ ${n.f.card.name} · PASSIVE</small><b>${n.name}</b><em>${n.extra || 'ACTIVATED'}</em>`; try { log('✦ ' + n.f.card.name + ': ' + n.name + (n.extra ? ' · ' + n.extra : ''), false) } catch { } t.style.left = x + 'px'; t.style.top = (y - 120) + 'px'; FX().append(t); setTimeout(() => t.remove(), 2600) }
  // ================= CLASH REACTIONS =================
  const CLASH = {
    JJK: ['DOMAIN CLASH', 'Domain Expansion vs Domain Expansion', 'Enemy passive sealed'],
    DBZ: ['BEAM STRUGGLE', 'Push the beam back!', '+2 Energy'],
    BOR: ['KARMA CLASH', 'Rasengan vs Karma', 'Counter-hit'],
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
    else if (key === 'OP') foe.ki = Math.max(0, foe.ki - 3); else if (key === 'BLE') a.rage = (a.rage || 0) + 20; else if (key === 'DS') healHP(a, Math.round(a.max * .15))
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
  function canTransform(f, side) {
    if (stage.storyTeam || !f || f.ko || f.pe.partner) return false
    if (f.card.transformations) return !!nextTransformation(f, side, B.turn)?.ready
    return !f.transformed && (f.card.ovr || 0) >= 88 && f.hp / f.max < .5
  }
  // In-place transformation: the fighter's own card charges, flips into the new form and bursts. The arena stays visible.
  async function transformFX(who, color, title, sub, kicker) {
    const el = $a(`.ar-side.${who} .ar-active`)
    if (!el) { draw(); return }
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const layer = h('div', 'tfx'); layer.style.setProperty('--tc', color)
    layer.style.cssText += `;--x:${cx}px;--y:${cy}px;--w:${r.width}px;--h:${r.height}px;--t:${r.top}px;--l:${r.left}px`
    layer.innerHTML = '<i class="tfx-pillar"></i><i class="tfx-ring"></i><i class="tfx-ring r2"></i><i class="tfx-flash"></i>'
    ov.append(layer)
    el.classList.add('tfx-charge'); el.style.setProperty('--tc', color)
    sfx('bcharge'); try { FXC.gather(cx, cy, color, .9, 46) } catch { }
    try {
      await wait(900); if (B.closed) return
      layer.classList.add('flash'); el.classList.add('tfx-flip')
      await wait(220); if (B.closed) return
      el.dataset.k = ''; draw()
      const el2 = $a(`.ar-side.${who} .ar-active`) || el; el2.classList.add('tfx-flip', 'tfx-glow'); el2.style.setProperty('--tc', color)
      sfx('reveal', 5); shake(3)
      try { FXC.hit(cx, cy, color, 2.2); FXC.rays(cx, cy, color, 22, 1000, 1.6) } catch { }
      layer.classList.add('burst')
      const plate = h('div', 'tfx-plate', `<small>${kicker}</small><b>${title}</b><span>${sub}</span>`)
      plate.style.cssText = `--tc:${color};left:${cx}px;top:${r.bottom + 6}px`; ov.append(plate)
      await wait(1250)
      plate.classList.add('out'); setTimeout(() => plate.remove(), 400)
      el2.classList.remove('tfx-flip', 'tfx-charge'); setTimeout(() => el2.classList.remove('tfx-glow'), 1600)
    } finally { el.classList.remove('tfx-charge', 'tfx-flip'); layer.remove() }
  }
  async function transformationScene(form, card, side) {
    highlight(side, card.name + ' transformed into ' + card.ver.split(' · ')[0] + '.', form.cinematicStyle === 'baryon' ? 100 : 85)
    await transformFX(side, form.color || '#ffcc00', card.ver.split(' · ')[0], card.name, form.cinematic || 'TRANSFORMATION')
  }
  async function transform(side, who) {
    const f = act(side); if (!canTransform(f, side)) return
    if (f.card.transformations) {
      const next = enterTransformation(f, side, B.turn)
      if (!next) return
      const foe = who === 'you' ? B.ai : B.you
      if (f.pe.crSukuna === 2) {
        f.crShrineUntil = turnClock(foe) + 2
        f.crShrineSwitch = foe.switchSerial || 0
        log('MALEVOLENT SHRINE · ACTIVE FOR TWO ENEMY TURNS')
      }
      log(`${f.card.name} transforms: ${f.card.ver}`)
      await transformationScene(next, f.card, who)
      if (B.closed) return
      const vegeta = gtForm(f) === 5 && side.team.find(ally => !ally.ko && PE(ally).crVegeta && !ally.crGokuAssist)
      const target = act(foe)
      if (vegeta && !target.ko) {
        vegeta.crGokuAssist = true
        const strike = hit(vegeta, target, 480, Math.max(vegeta.pwr, vegeta.ki), true, side, foe, 'strike')
        log('PRIMAL PRIDE · Vegeta assists GT Goku.')
        await show({ who, art: 'strike', move: 'FINAL SHINE ASSIST', hits: [{ t: target, ...strike }] })
      }
      if (!B.closed) draw()
      return
    }
    const full = !!f.card.form, k = full ? 1.25 : 1.15
    f.transformed = 1; healHP(f, Math.round(f.max * (full ? .3 : .15)))
    f.pwr = Math.round(f.pwr * k); f.ki = Math.round(f.ki * k); f.def = Math.round(f.def * k); f.burnT = 0; f.frozen = 0
    side.gauge = Math.min(GAUGE_MAX, side.gauge + (full ? 30 : 15)); if (who === 'you') side.skip = 0
    if (full) { const e = { ...(f.pe || {}) }; for (const x of ['dmg', 'dodge', 'dr', 'regen', 'teamHeal', 'spec', 'strikeBoost', 'exec', 'aoeBoost', 'crit', 'ultBoost']) if (typeof e[x] === 'number') e[x] = Math.round(e[x] * 1.5); f.pe = e
      f.card = { ...f.card, url: f.card.form.url, ver: f.card.form.name, mv: f.card.form.mv, fy: f.card.form.fy ?? f.card.fy, id: f.card.id + '_form', key: f.card.key + '#form', pas: f.card.pas ? { ...f.card.pas, e } : f.card.pas }; f.key = f.card.key }
    else f.aura = 1
    const name = full ? f.card.form.name : 'POWER UP'
    highlight(who, f.card.name + (full ? ' transformed into ' + name : ' powered up') + '.', 80)
    log(`${f.card.name} ${full ? 'transforms: ' + name : 'powers up'}!`)
    await transformFX(who, full ? '#ffcc00' : '#ffd96a', name, f.card.name, (who === 'you' ? '' : 'ENEMY · ') + (full ? 'TRANSFORMATION' : 'POWER UP'))
    if (!B.closed) draw()
  }
  async function show(ev) {
    lockDzHp()
    if (ev.before) { await show(ev.before); if (B.over || B.closed) return }
    if (ev.swap) { log('Enemy switched fighters'); sfx('bswitch'); draw(); await wait(500); return }
    const side = ev.who, other = side === 'you' ? 'ai' : 'you'
    const atk = $a(`.ar-side.${side} .ar-active`)
    if (mission && side === 'you' && ev.hits.some(hit => hit.hpDamage > 0)) objectiveHitAt = B.turn
    if (stage.encounter === 'ifrit' && side === 'ai') {
      const sanji = act(B.you)
      if (!sanji.ko && !sanji.ifritIgnited && sanji.hp <= sanji.max / 2) {
        sanji.ifritIgnited = true
        log('IFRIT JAMBE · Sanji now deals 35% more damage.')
        turnBanner('IFRIT IGNITES', true)
      }
    }
    if (stage.chapterRule === 'crew' && side === 'you' && ev.hits.some(hit => hit.usedOpening)) {
      const active = act(B.you)
      active.shieldHp = Math.max(active.shieldHp, Math.round(active.max * .15))
      log('STRAW HAT FOLLOW-UP · Another boat crosses.')
    }
    if (stage.chapterRule === 'open-guard' && side === 'you' && ev.hits.some(hit => hit.piercedGuard && hit.dmg > 0)) {
      B.you.raidOpening = true
      log('RAID OPENING · Guard broken.')
    }
    if (stage.chapterRule === 'open-survive' && side === 'ai' && ev.art === 'ultimate' &&
        ev.hits.some(hit => hit.hpDamage > 0 && !hit.t.ko)) {
      B.you.raidOpening = true
      log('RAID OPENING · You survived the Ultimate.')
    }
    if (stage.rival === 'overload' && side === 'ai' && ev.overloadSpent &&
        ev.hits.some(hit => hit.hpDamage > 0 && !hit.t.ko)) B.overloadSurvived = true
    if (stage.rival && side === 'you' && act(B.ai).ko) {
      const lead = act(B.you)
      B.rivalMastered = {
        prayer: lead.card.id === stage.rivalrySetup?.lead && ev.prayerSpent === 3,
        flame: lead.card.id === 'zoro_asura' && ev.art === 'ultimate' && !act(B.ai).rivalFlame,
        overload: lead.card.id === 'all_might_united_states_smash' && ev.art === 'ultimate' && B.overloadSurvived,
        baryon: (lead.card.baseId || lead.card.id) === stage.rivalrySetup?.lead && B.turn <= 2,
      }[stage.rival]
    }
    if (ev.tactic) { log(`${act(B[side]).card.name} · ${ARTS[ev.art].name}`); floatTag(atk, ev.tactic, 'adv'); sfx(ev.art === 'heal' ? 'heal' : 'bguard'); await wait(450); draw(); return }
    const target = act(B.ai)
    if (finishAfterWork && !crossingOpen && target.hp <= Math.ceil(target.max * .35)) {
      crossingOpen = true
      log('CROSSING OPEN · Send the last two groups through.')
    }
    const objectiveHP = operation?.kind === 'threshold' ? operation.count : stage.encounter === 'spar' ? .5 : stage.encounter === 'ring-out' ? .25 : 0
    if (side === 'you' && objectiveHP && target === B.ai.team[0] &&
        target.hp <= target.max * objectiveHP && !act(B.you).ko) {
      log(operation?.kind === 'threshold' ? 'OBJECTIVE COMPLETE · The opponent backs off.' : stage.encounter === 'ring-out' ? 'RING OUT · The passage is clear.' : 'SPAR WON · The opponent stands down.')
      await wait(450)
      return end(true)
    }
    if (!mission && !stage.rival && ev.hits.length && !ev.rivalHakai && !unwritten(act(B.ai)) && side === 'ai' && (ev.art === 'special' || ev.art === 'ultimate')) await maybeClash(ev)
    else if (!mission && !stage.rival && !unwritten(act(B.you)) && ev.hits.length && side === 'you' && ev.art === 'ultimate') await aiClash(ev)
    if (ev.guard) { log(`${act(B[side]).card.name} braces · ${ev.move || 'GUARD'}`); sfx('bguard'); atk.classList.add('guarding'); await wait(450); atk.classList.remove('guarding'); draw(); return }
    const big = ev.art === 'special' || ev.art === 'ultimate' || ev.art === 'burst', A = act(B[side]), col = tcol(A.card)
    if (ev.shieldsBroken) highlight(side, A.card.name + ' used Galaxy Impact and broke ' + ev.shieldsBroken + (ev.shieldsBroken === 1 ? ' enemy shield.' : ' enemy shields.'), 95)
    else {
      const damage = ev.hits.reduce((sum, hit) => sum + (hit.dmg || 0), 0)
      if (damage > 0 && (big || ev.hits.some(hit => hit.crit))) {
        const move = ev.art === 'ultimate' ? ev.ult : ev.move || ARTS[ev.art].name
        highlight(side, A.card.name + ' dealt ' + Math.round(damage).toLocaleString() + ' damage with ' + move + '.', 35 + Math.min(38, damage / 100))
      }
    }
    const tgtEl = $a(`.ar-side.${other} .ar-active`)
    log(big ? `${ev.art === 'ultimate' ? ev.ult + ' · ' : ''}${ev.move}` : `${A.card.name} · ${ev.move || ARTS[ev.art].name}`)
    if (ev.chain > 1 || ev.combo) chainPop(side, ev.chain, ev.combo)
    // 1) the attacker card pops up and spins
    atk.style.setProperty('--ac', col)
    const [tx, ty] = ctr(tgtEl), [ax, ay] = ctr(atk)
    // 1) wind-up: specials/ultimates gather energy into the card first
    if (ev.art === 'ultimate') { ov.classList.add('ult'); sfx('bcharge'); atk.classList.add('charging'); FXC.gather(ax, ay, col, .7, 34); FXC.screen(col, .22, .6); if (ev.awakened) { await awakenCut(A.card, ev, col); FXC.rays(ax, ay, col, 24, 1100, 1.8); FXC.screen('#ffffff', .6, .4) } else if (!window.__SIM && 'MX'.includes(A.card.r)) { await ultraCut(A.card, ev.move, col, side === 'ai') } else { cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'ULTIMATE', col, true, ev.ult); await wait(1350) } }
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
    const impacted = ev.hits.some(hit => hit.dmg > 0)
    if (impacted) shake(ev.art === 'ultimate' ? 3 : big ? 2 : 1); if (big && impacted) { ov.classList.remove('hitstop'); void ov.offsetWidth; ov.classList.add('hitstop'); setTimeout(() => ov.classList.remove('hitstop'), 160) }
    for (const x of ev.hits) {
      const isActive = x.t === act(B[other])
      const tgt = isActive ? tgtEl : $a(`.ar-side.${other} .ar-bench`)
      if (!(x.dmg > 0)) {
        if (x.miss || x.hpDamage === 0) floatTag(tgt, x.miss || 'NO HP DAMAGE', 'weak')
        continue
      }
      tgt.classList.remove('hurt'); void tgt.offsetWidth; tgt.classList.add('hurt')
      const impact = h('i', 'battle-impact ' + (big ? 'signature' : ev.art === 'blast' ? 'energy' : 'strike'))
      impact.setAttribute('aria-hidden', 'true')
      const targetBounds = tgt.getBoundingClientRect()
      impact.style.left = (targetBounds.left + targetBounds.width / 2) + 'px'
      impact.style.top = (targetBounds.top + targetBounds.height / 2) + 'px'
      impact.style.setProperty('--impact-color', x.crit ? '#ffbd6a' : col)
      FX().append(impact)
      setTimeout(() => impact.remove(), 520)
      { const [hx, hy] = ctr(tgt); FXC.hit(hx, hy, x.crit ? '#ff5a6a' : big ? '#ffc840' : col, !isActive ? .7 : ev.art === 'ultimate' ? 2.3 : big ? 1.6 : ev.art === 'blast' ? 1.15 : .9) }
      const n = document.createElement('div'); n.className = 'dmg' + (x.crit ? ' crit' : '') + (big ? ' big' : '') + (x.mu > 1 ? ' adv' : ''); n.innerHTML = (x.crit ? '<small>CRITICAL!</small>' : '') + `<b>${(x.hpDamage ?? x.dmg).toLocaleString()}</b>`; if (x.crit) { const fl = document.createElement('div'); fl.className = 'critflash'; ov.append(fl); setTimeout(() => fl.remove(), 260) } n.style.animationDelay = (ev.hits.indexOf(x) * .09) + 's'
      const r = tgt.getBoundingClientRect(); n.style.left = (r.left + r.width / 2) + 'px'; n.style.top = (r.top + r.height * .35) + 'px'
      ov.append(n); setTimeout(() => n.remove(), 1100)
      if (isActive && x.crit) { floatTag(tgt, 'CRITICAL!', 'crit'); sfx('crit') }
      else if (isActive && x.blocked) floatTag(tgt, 'GUARDED', 'weak')
      else if (isActive && x.piercedGuard) floatTag(tgt, 'GUARD PIERCED', 'adv')
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
    if (stage.rivalry && ev.ult === 'FINAL EXPLOSION' && side === 'you' && act(foe).ko) B.finalExplosionKO = true
    if (act(foe).ko) {
      highlight(side, act(foe).card.name + ' was knocked out.', alive(foe).length ? 76 : 92)
      sfx('bko'); shake(3); { const [kx, ky] = ctr(tgtEl); FXC.ko(kx, ky) } ST3 && ST3.ko(other); log(`${act(foe).card.name} is knocked out!`)
      $a(`.ar-side.${other} .ar-active`).classList.add('kod'); { const k = document.createElement('div'); k.className = 'bc-ko ' + other; k.innerHTML = `<b>K.O.</b><small>${act(foe).card.name}</small>`; ov.append(k); ov.classList.add('slowmo'); setTimeout(() => { k.remove(); ov.classList.remove('slowmo') }, 1500) } await wait(1200); $a(`.ar-side.${other} .ar-active`).classList.remove('kod')
      if (!nextAlive(foe)) {
        if (other !== 'ai' || (finishAfterWork && steps >= operation.count) || !['hold', 'work'].includes(operation?.kind)) return end(other === 'ai')
        const threat = act(foe)
        threat.ko = false
        threat.hp = Math.max(1, Math.round(threat.max * .5))
        foe.skip = 1
        log('Threat suppressed · one round to make progress.')
        draw()
        return
      }
      if (other === 'you') { await pickReplacement() } else { log(`Enemy sends out ${act(foe).card.name}`); sfx('nav') }
      draw(); await wait(400)
    }
    if (ev.waveCounter && act(B[side]).ko) {
      log(act(B[side]).card.name + ' was knocked out by a counter!')
      if (!nextAlive(B[side])) return end(side === 'ai')
      draw()
    }
  }
  function pickReplacement() {
    return new Promise(res => {
      log('Your fighter is down. Choose who goes in next.')
      const best = B.you.team.map((f, i) => [f, i]).filter(([f]) => !f.ko)
      setActive(B.you, best[0][1]); draw()
      // the first healthy one is sent in; the player can still switch once next turn
      setTimeout(res, 500)
    })
  }
  async function doArt(i) {
    if (B.busy || B.over) return
    B.busy = true; controls()
    const art = B.you.hand[i]
    const predicted = stage.chapterRule === 'forecast' && B.calledArt === art && !unwritten(act(B.you))
    B.you.courtRepeat = stage.chapterRule === 'repeat' && B.previousArt === art && !unwritten(act(B.you))
    const ev = playArt(B, 'you', i)
    B.you.courtRepeat = false
    if (ev && ATTACK_ARTS.includes(art)) B.previousArt = art
    if (ev && predicted) {
      B.calledArt = null
      B.ai.ki = Math.min(KI_MAX, B.ai.ki + 2)
      B.ai.gauge = Math.min(GAUGE_MAX, B.ai.gauge + 20)
      log('FORECAST FULFILLED · Enemy gains 2 Energy and 20% gauge.')
    }
    if (ev) { lvSend({ t: 'art', i }); await show(ev) }
    B.busy = false; if (!B.over) controls()
  }
  async function doSwitch(i) {
    if (B.busy || B.over || (B.you.switched && !B.you.conjunction) || B.you.team[i].ko) return
    const free = B.you.conjunction && PE(act(B.you)).conjunction
    B.you.conjunction = false
    const assist = switchFighter(B, 'you', i)
    if (stage.chapterRule === 'forecast') B.calledArt = null
    if (stage.chapterRule === 'open-switch') {
      B.you.raidOpening = true
      log('RAID OPENING · The new fighter has a clear shot.')
    }
    if (stage.chapterRule === 'relay' || stage.encounter === 'relay') {
      const ally = act(B.you)
      ally.shieldHp = Math.max(ally.shieldHp, Math.round(ally.max * .2))
      log('CROSSING REINFORCED · Incoming ally shielded.')
    }
    if (free) { act(B.you).guard = 1; B.you.gauge = Math.min(GAUGE_MAX, B.you.gauge + 15) }
    else B.you.switched = true
    lvSend({ t: 'sw', i })
    sfx('bswitch'); log(`Go, ${act(B.you).card.name}!`); draw()
    if (assist) {
      B.busy = true; controls()
      banner(assist.move, act(B[assist.who]).card.name, assist.who === 'you' ? '#22d8ff' : '#ff5335')
      await show(assist); B.busy = false; if (!B.over) controls()
    } else flushPas()
  }
  $a('.ar-fusion-tag').onclick = () => {
    if (!B.over && !B.busy && tagFusionKid(act(B.you), B.turn)) { lvSend({ t: 'fusion-tag' }); draw(); flushPas() }
  }
  $a('.ar-trans').onclick = async () => {
    const f = act(B.you)
    const next = nextTransformation(f, B.you, B.turn)
    if (B.busy || B.over) return explainUnavailable('Transform', 'Wait for your turn.')
    const ready = f.pe.partner ? canTagPartner(f, B.turn) : canTransform(f, B.you)
    if (!ready) {
      const status = $a('.ar-trans small').textContent
      return explainUnavailable(f.pe.partner ? 'Tag' : 'Transform',
        f.pe.partner ? 'This fighter has already tagged this turn.' :
        next ? [next.requirement, status].filter(Boolean).join(' · ') : 'Drop below 50% HP to transform.')
    }
    B.busy = true; controls()
    if (f.pe.partner) {
      if (tagPartner(f, B.turn, B.you)) { lvSend({ t: 'partner' }); draw(); flushPas() }
    } else { await transform(B.you, 'you'); lvSend({ t: 'tr' }) }
     B.busy = false; if (!B.over) controls() }
  async function playerUltimate(choice) {
    if (B.busy || B.over) return
    B.busy = true; controls()
    const e = ultimate(B, 'you', choice)
    if (e) { lvSend({ t: 'ult', choice }); await show(e) }
    B.busy = false
    if (!B.over) controls()
  }
  $a('.ar-ult').onclick = () => {
    if (ov.querySelector('.omnipotence-picker')) return
    if (B.busy || B.over) return explainUnavailable('Ultimate', 'Wait for your turn.')
    if (B.you.gauge < GAUGE_MAX) return explainUnavailable('Ultimate', 'Need ' + Math.ceil(GAUGE_MAX - B.you.gauge) + '% more Ultimate gauge.')
    const kit = PE(act(B.you))
    if (kit.shinobi !== 14 && kit.batch !== 'star') return playerUltimate()
    const picker = document.createElement('div')
    picker.className = 'qconf omnipotence-picker'
    const box = document.createElement('div')
    box.className = 'qc-box'
    const title = document.createElement('b')
    title.textContent = kit.batch === 'star' ? 'NEW ORDER' : 'OMNIPOTENCE'
    box.append(title)
    const options = document.createElement('div')
    options.className = 'qc-b'
    options.style.flexWrap = 'wrap'
    const option = (label, run, primary) => {
      const button = document.createElement('button')
      button.className = 'btn ' + (primary ? 'gold' : 'dark')
      button.textContent = label
      button.onclick = () => { picker.remove(); run?.() }
      options.append(button)
    }
    if (kit.batch === 'star') {
      option('PROTECT · TEAM SHIELD AND GUARD', () => playerUltimate('protect'), true)
      option('SUPPRESS · SEAL AND RAISE ART COSTS', () => playerUltimate('suppress'), true)
    } else {
      option('SHINJUTSU REVERSAL', () => playerUltimate(null), true)
      if (!B.you.shinobiRestored) B.you.team.forEach((ally, i) => {
        if (ally.ko) option('RESTORE ' + ally.card.name + ' · ' + ally.card.ver, () => playerUltimate(i), true)
      })
    }
    option('CANCEL')
    box.append(options)
    picker.append(box)
    ov.append(picker)
    options.firstElementChild.focus()
  }
  const mb = $a('.ar-mute'), mdraw = () => { mb.textContent = sfxOn() ? '🔊 SOUND' : '🔇 MUTED'; mb.classList.toggle('off', !sfxOn()) }
  mb.onclick = () => { sfxOn(!sfxOn()); mdraw() }; mdraw()
  $a('.ar-end').onclick = () => endTurn()
  $a('.ar-quit').onclick = () => { if (B.over) { if (!stage.war && !stage.draft) close(); return } if (ov.querySelector('.qconf')) return; const q = document.createElement('div'); q.className = 'qconf'; q.innerHTML = '<div class="qc-box"><b>QUIT BATTLE?</b><p>You will leave this fight with no rewards.' + (stage.draft ? ' This will end your draft run.' : stage.war ? ' This lane will count as a loss.' : stage.boss ? ' Your boss attempt is not used.' : '') + '</p><div class="qc-b"><button class="btn dark">KEEP FIGHTING</button><button class="btn red">QUIT</button></div></div>'; const [k, x] = q.querySelectorAll('button'); k.onclick = () => q.remove(); x.onclick = async () => { q.remove(); if (stage.war || stage.draft) { if (!B.over) await end(false) } else close() }; ov.append(q) }
  function close({ immediate = false, route = true } = {}) {
    if (B.closed) return
    if (LV && !B.over) { lvSend({ t: "quit" }); B.over = true; try { lvUnsub && lvUnsub(); clearInterval(lvTimer) } catch { } X.ACC.pvpFinish(LV.code, LV.oppUid) }
    FXC.dispose()
    document.body.classList.remove('in-battle')
    music('menu')
    B.closed = true
    ST3?.dispose()
    if (immediate) ov.remove()
    else { ov.classList.add('out'); setTimeout(() => ov.remove(), 300) }
    if (route) X.go(stage.pvp ? 'players' : 'battle')
  }

  // safety net: nobody can sit on 0 HP without being knocked out, and a KO'd active fighter is always replaced
  function lockDzHp() { for (const f of B.ai.team) { if (!f.deadZoneEnemy || f.ko) continue; if (f.dzLow == null || f.hp < f.dzLow) f.dzLow = f.hp; if (f.hp > f.dzLow) f.hp = f.dzLow } }
  function sweepKO() { lockDzHp(); for (const [side, sd] of [['you', B.you], ['ai', B.ai]]) { for (const f of sd.team) if (!f.ko && f.hp <= 0.5) { f.hp = 0; f.ko = true } if (act(sd).ko && !nextAlive(sd)) { end(side === 'ai'); return true } }
    draw(); return false
  }
  async function aiPhase() {
    if (B.over || sweepKO()) return
    if (!carrierReady()) { log('MISSION FAILED · The marker carrier fell.'); return end(false) }
    if (deadZone && B.dzIntentTurn !== B.turn) B.dzIntent = null
    if (operation?.kind === 'hold') {
      enemyRounds++
      if (enemyRounds > operation.count) return end(true)
    }
    if (mission?.data.finale && !finishAfterWork && act(B.ai).campaignTell) {
      act(B.ai).campaignTell = false
      act(B.ai).guard = 1
      log('ECHO HOLLOW · It comes out of cover. Break its Guard.')
    }
    if ((stage.level || 1) >= 5 && canTransform(act(B.ai), B.ai)) await transform(B.ai, 'ai')
    if (stage.boss && B.turn >= 12 && !B.over) { log('Time up! The boss retreats.'); return end(false) }
    if (stage.bossAb && balance?.scoreBoss && B.turn === 6) {
      B.ai.campaignDamage *= 1.2
      B.ai.gauge = Math.min(GAUGE_MAX, B.ai.gauge + 30)
      log('BOSS ENRAGED · +20% damage and +30% Ultimate gauge.')
      turnBanner('BOSS ENRAGED', false)
    }
    if (stage.bossAb && B.turn % 3 === 0 && !B.over) {
      const ab = stage.bossAb, you = B.you, boss = act(B.ai)
      B.busy = true; controls(); sfx('charge', 6); shake(3); wash('#ff3b6b', true)
      cutin(boss.card, ab.name, 'BOSS SKILL', '#ff3b6b', true, ab.name); await wait(1300)
      if (ab.id === 'aoe') { for (const f of you.team) if (!f.ko) f.hp = Math.max(1, f.hp - Math.round(f.max * .12)); log(`${ab.name}! Your whole team takes 12% damage.`) }
      else if (ab.id === 'stun') { you.skip = 1; log(`${ab.name}! ${act(you).card.name} is stunned and loses the next turn.`) }
      else if (ab.id === 'burn') { for (const f of you.team) if (!f.ko) { f.burn = 5; f.burnT = 3 } log(`${ab.name}! Your team is burning.`) }
      else if (ab.id === 'drain') { you.ki = Math.max(0, you.ki - 3); you.gauge = Math.max(0, you.gauge - 30); log(`${ab.name}! You lose 3 Energy and Ultimate charge.`) }
      else if (ab.id === 'tbb') { const g = !!act(you).guard, a0 = act(you); for (const f of you.team) if (!f.ko && f !== a0) f.hp = Math.max(1, f.hp - Math.round(f.max * (g ? .18 : .35))); log(g ? `${ab.name}! Guarded: your bench takes 18%.` : `${ab.name}! Your bench takes 35% damage!`); FXC.screen('#ff7a1a', .5, .6) }
      else if (ab.id === 'kamui') { if (act(you).guard) log(`${ab.name}! You Guarded and stayed in the fight.`); else { you.skip = 1; log(`${ab.name}! ${act(you).card.name} is pulled into another dimension and loses the next turn.`) } }
      else if (ab.id === 'deathball') { const g = !!act(you).guard; for (const f of you.team) if (!f.ko) f.hp = Math.max(1, f.hp - Math.round(f.max * (g ? .12 : .3))); log(g ? `${ab.name}! You Guarded: your team takes 12% damage.` : `${ab.name}! No Guard: your whole team takes 30% damage!`); FXC.screen('#ff4fd8', .5, .6) }
      else if (ab.id === 'rage') { boss.pwr = Math.round(boss.pwr * 1.15); boss.ki = Math.round(boss.ki * 1.15); log(`${ab.name}! The boss powers up: +15% damage.`) }
      { const [x, y] = ctr($a('.ar-side.you .ar-active')); FXC.hit(x, y, '#ff3b6b', 2) }
      draw(); await wait(1100)
    }
    B.busy = true; controls()
    const s = B.ai; s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN + (s.kiBonus || 0)); refill(s); s.switched = false; s.seq = []; startTurn(s); if (B.over) return; act(B.you).fort = 0
    if (deadZone && s.dzSkippedTurn === B.turn - 1 && (s.skip || act(s).frozen)) {
      s.skip = 0
      act(s).frozen = 0
      log('ENEMY RECOVERS · Cannot be stopped two rounds in a row.')
    }
    if (!unwritten(act(s)) && (s.skip || act(s).frozen)) { if (deadZone) s.dzSkippedTurn = B.turn; s.skip = 0; act(s).frozen = 0; log('Enemy loses its turn!'); turnBanner('TIME STOPPED', false); await wait(900); B.turn++; const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN); refill(y); y.switched = false; y.seq = []; startTurn(y); if (B.over) return; if (operation?.kind === 'hold' && enemyRounds >= operation.count) return end(true); B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); draw(); if (AUTO) autoTurn(); return }
    if (stage.chapterRule === 'open-guard' || stage.encounter === 'break-guard') act(s).guard = 1
    if (stage.encounter === 'pressure' && B.turn % 2 === 0) {
      s.gauge = Math.min(GAUGE_MAX, s.gauge + 40)
      log('PRESSURE · The enemy gains 40% Ultimate gauge.')
    }
    if (stage.encounter === 'hold-out' && B.turn % 2 === 0) s.gauge = Math.min(GAUGE_MAX, s.gauge + 30)
    if ((stage.chapterRule === 'emperor-cover' || stage.encounter === 'duet') && alive(s).length > 1) {
      const active = act(s)
      active.shieldHp = Math.max(active.shieldHp, Math.round(active.max * .12))
      log('PARTNER COVER · The enemy lead is shielded.')
    }
    if (stage.chapterRule === 'open-survive' && !B.you.raidOpening && B.turn % 3 === 0) s.gauge = GAUGE_MAX
    if (stage.chapterRule === 'transfer' && act(s).card.id === 'all_for_one_quirk_overload') {
      if (!act(s).frozen) { act(s).rage = Math.min(45, (act(s).rage || 0) + 15); log('QUIRK TRANSFER · All For One gains damage.') }
    }
    if (stage.chapterRule === 'reversal' && act(s).card.id === 'shibai') {
      const restore = !s.shinobiRestored && s.team.some(f => f.ko)
      if (restore || B.turn % 3 === 0) {
        s.gauge = GAUGE_MAX
        const ev = ultimate(B, 'ai', restore ? undefined : null)
        if (ev) await show(ev)
        if (B.over) return
      }
    }
    if (stage.rival === 'overload' && act(s).quirkCharged) s.gauge = GAUGE_MAX
    log('Enemy turn'); turnBanner('ENEMY TURN', false); draw(); await wait(800)
    if (stage.rivalry) {
      const boss = act(B.ai), phase = hakaiStep(boss, B.turn)
      if (phase === 'warn') {
        log('Toppo is charging Hakai. It lands on enemy turn ' + boss.hakaiAt + '.')
        highlight('ai', 'Toppo began charging Hakai.', 85)
      }
      if (phase === 'fire') {
        const target = act(B.you)
        const strike = hit(boss, target, stage.id === 'mastery' ? 1050 : 850, boss.ki, false, B.ai, B.you, 'special', false)
        if (!target.ko) B.hakaiSurvived = true
        highlight('ai', 'Toppo fired Hakai. ' + target.card.name + (target.ko ? ' was knocked out.' : ' survived.'), 96)
        await show({ who: 'ai', art: 'special', move: 'HAKAI', rivalHakai: true, hits: [{ t: target, ...strike }] })
        if (B.over) return
      }
      draw()
    }
    autoTagPartner(act(B.ai), B.turn)
    flushPas()
    if (deadZone) {
      const lateTurns = Math.max(0, B.turn - 4)
      const escalating = newGen ? Math.min(.25, lateTurns * .05) : Math.min(.48, lateTurns * .08)
      const intent = B.dzIntent
      const punished = newGen && intent
        ? newGenFailed(intent, act(B.you), (B.you.switchSerial || 0) !== intent.switchSerial)
        : deadZonePunishment(intent, act(B.you), act(B.ai))
      if (newGen && intent && !punished) {
        s.gauge = Math.max(0, s.gauge - 25)
        log('OPENING · Enemy loses 25% Ultimate gauge and hits softer this round.')
      }
      B.dzIntent = null
      if (newGen) s.newGenPunished = !!punished
      s.campaignDamage = balance.damage * (1 + escalating + (punished ? (newGen ? .28 : .5) : newGen && intent ? -.22 : 0))
      if (punished) {
        if (newGen && stage.newGen === 4) B.you.ki = Math.max(0, B.you.ki - 2)
        s.gauge = Math.min(GAUGE_MAX, s.gauge + 35)
        s.ki = Math.min(KI_MAX, s.ki + 2)
        log('PUNISHED · Enemy gains 35% Ultimate gauge, 2 Energy and extra damage this turn.')
        highlight('ai', 'The boss punished a missed warning.', 75)
      }
      if (B.turn === 5) log('ENRAGED · Enemy damage climbs each round.')
    }
    for (const ev of aiTurn(B, stage.mode === 'ranked' && (stage.rating || 0) >= 80 ? 5 : stage.level)) { if (B.over) return; await show(ev); if (B.over) return }
    const stomp = apeStomp('ai')
    if (stomp) { await show(stomp); if (B.over || B.closed) return }
    if (operation?.kind === 'hold' && enemyRounds >= operation.count) {
      if (!sweepKO()) return end(true)
      return
    }
    if (stage.encounter === 'hold-out' && B.turn >= 3 && !sweepKO()) {
      log('HOLDOUT COMPLETE · You bought enough time.')
      return end(true)
    }
    if (!unwritten(act(B.you)) && (B.you.skip || act(B.you).frozen)) { B.you.skip = 0; act(B.you).frozen = 0; log('You lose your turn!'); turnBanner('TIME STOPPED', true); await wait(900); B.turn++; return aiPhase() }
    B.turn++
    if (B.over || sweepKO()) return
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN + (y.kiBonus || 0)); refill(y); y.switched = false; y.seq = []; startTurn(y); if (B.over) return; act(B.ai).fort = 0
    if (await chronTurn()) return
    B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); sfx('bturn'); draw(); flushPas(); if (AUTO) autoTurn()
  }
  function apeStomp(who) {
    const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], goku = act(me)
    if (gtForm(goku) !== 4 || goku.gtRage < 3 || goku.gtRemembered || goku.ko || act(foe).ko) return null
    goku.gtRage = 0
    goku.hp = Math.max(1, goku.hp - Math.round(goku.max * .1))
    me.reworkAction = (me.reworkAction || 0) + 1
    const hits = alive(foe).map(target => ({
      t: target, ...hit(goku, target, target === act(foe) ? 520 : 160, goku.pwr, false, me, foe, 'strike', false, { area: true }),
    }))
    return { who, art: 'strike', move: 'RAMPAGING STOMP', hits }
  }
  async function endTurn() {
    if (B.busy || B.over) return
    ov.querySelector('.omnipotence-picker')?.remove()
    const stomp = apeStomp('you')
    if (stomp) {
      B.busy = true
      controls()
      lvSend({ t: 'ape-stomp' })
      await show(stomp)
      if (B.over || B.closed) return
      B.busy = false
    }
    if (LV) { lvSend({ t: 'end' }); return remotePhase() }
    await aiPhase()
  }
  // ================= LIVE PVP =================
  const LQ = []; let lvWake = null, lvN = 0, lvLast = Date.now(), lvFirstRemote = !!LV && !youFirst, lvMyTurnAt = 0, lvUnsub = null, lvTimer = null
  const SIDE_KEYS = ['batchRewrites', 'batchResolveUntil', 'batchOrder', 'batchMemory', 'fcCaptainCombo', 'ftWendySaved', 'ftTwinTurn', 'antithesisUsed', 'switchSerial', 'teamDmg', 'shinobiRestored', 'kuramaTarget', 'chosoSaved', 'chainReward', 'conjunction', 'reworkAction', 'hypnosisTurn', 'hypnosisAction', 'waveAttacked', 'waveBasic', 'wavePrevious', 'waveRead', 'waveBrief', 'waveParasite', 'formTurn', 'lastActive', 'flameTarget', 'active', 'ki', 'gauge', 'hand', 'pile', 'seq', 'switched', 'skip', 'chargeNext', 'ultTurn', 'rngS', 'kiBonus', 'confiscated']
  const serF = f => { const o = {}; for (const k in f) { if (k === 'card' && !f.transformed && !f.baseForm) continue; const v = f[k]; if (typeof v !== 'function') o[k] = v } return o }
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
    const assist = switchFighter(B, 'ai', i)
    s.switched = true; sfx('bswitch'); log(`${LV.oppName} sends in ${act(s).card.name}!`)
    lvApply(sn); draw()
    if (assist) await show(assist)
    else flushPas()
  }
  async function remotePhase() {
    if (B.over || sweepKO()) return
    B.busy = true; lvMyTurnAt = 0; controls()
    const s = B.ai
    if (lvFirstRemote) lvFirstRemote = false
    else { s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN + (s.kiBonus || 0)); refill(s); s.switched = false; s.seq = []; startTurn(s); if (B.over) return; act(B.you).fort = 0
      if (deadZone && s.dzSkippedTurn === B.turn - 1 && (s.skip || act(s).frozen)) {
      s.skip = 0
      act(s).frozen = 0
      log('ENEMY RECOVERS · Cannot be stopped two rounds in a row.')
    }
    if (!unwritten(act(s)) && (s.skip || act(s).frozen)) { if (deadZone) s.dzSkippedTurn = B.turn; s.skip = 0; act(s).frozen = 0; log(LV.oppName + ' loses their turn!'); turnBanner('TIME STOPPED', false); await wait(900); B.turn++; const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN + (y.kiBonus || 0)); refill(y); y.switched = false; y.seq = []; startTurn(y); if (B.over) return; act(B.ai).fort = 0; B.busy = false; turnBanner('YOUR TURN', true); draw(); myTurnStart(); return } }
    lvLast = Date.now(); log(LV.oppName + "'s turn"); turnBanner(LV.oppName.toUpperCase() + "'S TURN", false); draw()
    for (;;) { const a = await lvNext(); if (!a || B.over) return
      if (a.t === 'end') { lvApply(a.sn); break }
      if (a.t === 'quit') { log(LV.oppName + ' left the match. You win!'); return end(true) }
      if (a.t === 'art') { const ev = playArt(B, 'ai', a.i); lvApply(a.sn); if (ev) await show(ev) }
      else if (a.t === 'ult') { const ev = ultimate(B, 'ai', a.choice); lvApply(a.sn); if (ev) await show(ev) }
      else if (a.t === 'ape-stomp') { const ev = apeStomp('ai'); lvApply(a.sn); if (ev) await show(ev) }
      else if (a.t === 'sw') await remoteSwitch(a.i, a.sn)
      else if (a.t === 'fusion-tag') { tagFusionKid(act(B.ai), B.turn); lvApply(a.sn); draw(); flushPas() }
      else if (a.t === 'partner') { tagPartner(act(B.ai), B.turn, B.ai); lvApply(a.sn); draw(); flushPas() }
      else if (a.t === 'tr') {
        const fighter = act(B.ai)
        if (fighter.card.transformations && a.sn) {
          lvApply(a.sn)
          const form = fighter.card.transformations[fighter.formIndex - 1]
          if (form) await transformationScene(form, fighter.card, 'ai')
          if (!B.closed) draw()
        } else { await transform(B.ai, 'ai'); lvApply(a.sn) }
      }
      if (B.over) return }
    B.turn++
    if (B.over || sweepKO()) return
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN + (y.kiBonus || 0)); refill(y); y.switched = false; y.seq = []; startTurn(y); if (B.over) return; act(B.ai).fort = 0
    if (!unwritten(act(y)) && (y.skip || act(y).frozen)) { y.skip = 0; act(y).frozen = 0; log('You lose your turn!'); turnBanner('TIME STOPPED', true); draw(); await wait(900); lvSend({ t: 'end' }); return remotePhase() }
    if (await chronTurn()) return
    B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); sfx('bturn'); draw(); myTurnStart()
  }
  function announceChapterRule() {
    if (deadZone && B.dzIntentTurn !== B.turn) {
      B.dzIntentTurn = B.turn
      if (newGen) {
        const intent = newGenIntent(stage.mechanic, act(B.you), act(B.ai), rnd(B.ai))
        intent.switchSerial = B.you.switchSerial || 0
        B.dzIntent = intent
        if (intent.kind === 'break') intent.enemy.guard = 1
        log(newGenWarning(intent, ARTS[intent.art]?.name))
        return
      }
      B.dzIntent = deadZoneIntent(stage.pveFloor, B.turn, act(B.you), act(B.ai), rnd(B.ai))
      if (B.dzIntent) {
        log(B.dzIntent.art ? 'ENEMY READ · Avoid ' + ARTS[B.dzIntent.art].name + ' this turn.'
          : 'HEAVY RUSH · Guard, shield or switch before the enemy attacks.')
      }
    }
    if (stage.bossAb && balance?.scoreBoss && B.turn < 12 && B.turn % 3 === 0) {
      log('BOSS SKILL INCOMING · ' + stage.bossAb.name)
      turnBanner('BOSS SKILL INCOMING', false)
    }
    if (stage.chapterRule === 'forecast') {
      B.calledArt = ['strike', 'blast', 'special'][(B.turn - 1) % 3]
      log('FORECAST · ' + B.calledArt.toUpperCase() + '. Play another Art or switch.')
      turnBanner('FORECAST · ' + B.calledArt.toUpperCase(), false)
    }
    if (stage.chapterRule === 'relay-pressure') {
      if (B.courtLead === act(B.you).key && !unwritten(act(B.you))) {
        B.ai.gauge = Math.min(GAUGE_MAX, B.ai.gauge + 20)
        log('FALSE CAPTAIN · The same lead gave the enemy 20% gauge.')
      }
      B.courtLead = act(B.you).key
    }
    if (stage.chapterRule === 'reversal' && act(B.ai).card.id === 'shibai' && B.turn % 3 === 0)
      turnBanner('SHINJUTSU REVERSAL INCOMING', false)
    if (stage.rival === 'flame' || stage.chapterRule === 'king-flame') {
      const king = act(B.ai)
      king.rivalFlame = B.turn % 2 === 1
      log(king.rivalFlame ? 'KING · FLAME ON · Reduced damage taken.' : 'KING · FLAME OFF · Dead Man’s Game can finish Mastery.')
      turnBanner(king.rivalFlame ? 'KING · FLAME ON' : 'KING · FLAME OFF', false)
    }
  }
  function startTurn(s) {
    s.chainReward = false
    s.conjunction = false
    s.waveAttacked = false
    s.waveRead = false
    advanceFormTurn(s)
    for (const fighter of s.team) if (fighter.crSealUntil && turnClock(s) > fighter.crSealUntil) fighter.crSealUntil = 0
    if (gtForm(act(s)) === 3) s.ki = Math.max(0, s.ki - 1)
    for (const fighter of s.team) if (fighter.silverSealed && fighter.silverSealed <= s.formTurn) fighter.silverSealed = 0
    if (unwritten(act(s))) { s.skip = 0; act(s).frozen = 0 }
    if (s === B.you) announceChapterRule()
    for (const fighter of alive(s)) {
      if (fighter.uzuhikoTurns > 0) {
        fighter.uzuhikoTurns--
        fighter.hp = Math.max(0, fighter.hp - Math.round(fighter.max * .08))
        if (!fighter.hp && !surviveHogyoku(fighter)) fighter.ko = true
        log(fighter.card.name + ' takes 8% max HP from Uzuhiko.')
      }
      if (fighter.sageTax && fighter.sageTax <= s.formTurn) fighter.sageTax = 0
      if (sealActive(fighter, s)) clearShinobiBuffs(fighter)
    }
    if (act(s).ko && !nextAlive(s)) { end(s === B.ai); return }
    const a0 = act(s), foe = s === B.you ? B.ai : B.you
    const previous = foe.team.find(f => f.key === foe.lastActive)
    if (previous?.erasedUntil && previous.turns >= previous.erasedUntil) previous.erasedUntil = 0
    s.lastActive = a0.key
    s.flameTarget = act(foe).key
    syncReworkMatchup(s, foe)
    const e = PE(a0)
    if (PE(act(foe)).shanks) s.ki = Math.max(0, s.ki - 1)
    for (const ally of s.team) if (!ally.ko && PE(ally).choso) healHP(a0, a0.max * .08)
    for (const ally of s.team) if (ally !== a0 && !ally.ko && PE(ally).team7) healHP(a0, a0.max * .08)
    a0.turns++
    for (const ally of s.team) if (ally !== a0 && !ally.ko && PE(ally).hundredHeal) healHP(a0, a0.max * .10)
    if (e.hellfire) a0.heat = Math.min(4, (a0.heat || 0) + 1)
    if (e.igneelFlame && !a0.ko && foe.flameTarget === a0.key) addFlame(a0)
    { const tags = []; if (e.regen && !e.noHeal) tags.push('REGEN +' + e.regen + '%'); if (e.teamHeal) tags.push('TEAM HEAL +' + e.teamHeal + '%'); if (e.ramp) tags.push('POWER +' + Math.min(e.rampMax || 99, e.ramp * a0.turns) + '%'); if (e.energyTurn) tags.push('+' + e.energyTurn + ' ENERGY'); if (tags.length) pasNote(a0, tags.join(' · ')) }
    if (e.senzuGear && !a0.senzuUsed && !a0.ko && a0.hp < a0.max * .3) { a0.senzuUsed = 1; healHP(a0, a0.max * .25); pasNote(a0, 'SENZU POUCH · +25% HP') }
    if (e.regen && !e.noHeal) healHP(a0, Math.round(Math.min(a0.max, a0.deadZoneRegenBase ?? a0.max) * e.regen / 100))
    if (e.bleed) a0.hp = Math.max(1, a0.hp - Math.round(a0.max * e.bleed / 100))
    if (e.emperor) a0.hp = Math.max(1, a0.hp - Math.round(a0.max * .03))
    if (a0.burnT > 0) {
      const burn = Math.round(a0.max * a0.burn / 100)
      if (e.igneelFlame) { healHP(a0, burn); addFlame(a0); pasNote(a0, 'BURN ABSORBED') }
      else if (!e.natsuRework) a0.hp = Math.max(1, a0.hp - burn)
      a0.burnT--
    }
    if (a0.doom > 0 && --a0.doom === 0) { a0.hp = 0; if (!surviveHogyoku(a0)) { a0.ko = true; log(a0.card.name + ' — the Death Note takes effect.') } }
    if (e.guardAuto) a0.guard = 1
    if (e.energyTurn) s.ki = Math.min(KI_MAX, s.ki + e.energyTurn)
    if (e.haki) { const o = act(foe); if (o && o.card.ovr < a0.card.ovr) foe.ki = Math.max(0, foe.ki - e.haki) }
    for (const f of s.team) { const fe = PE(f); if (fe.teamHeal && !f.ko) for (const g of s.team) if (!g.ko) healHP(g, Math.round(g.max * fe.teamHeal / 100)) }
    if (e.specDraw && rnd(s) * 100 < e.specDraw) { s.hand[0] = 'special' }
    if (e.timeStop && rnd(s) * 100 < e.timeStop) { foe.skip = 1; pasNote(a0, 'TIME STOP') }
    if (e.charge && s.lastSkipped) a0.rage = Math.max(a0.rage || 0, e.charge)
    s.confiscated = 0; sealNow()
    const p = passives(s), a = act(s); if (p.heal && !a.ko) healHP(a, Math.round(a.max * p.heal / 100)); if (p.gauge) s.gauge = Math.min(GAUGE_MAX, s.gauge + p.gauge) }
  function chronHud(left) { let el = $a('.chr-hud'); if (!el) { el = document.createElement('div'); el.className = 'chr-hud'; ($a('.ar-top') || ov).append(el) } el.innerHTML = '<small>' + (stage.limitText || 'TIME UP') + ' IN</small><b>' + Math.max(0, left) + '</b><small>TURNS</small>'; el.classList.toggle('crit', left <= 3) }
  async function chronTurn() {
    if (!stage.chronicle) return false
    if (stage.fury && !B.chFury && B.you.team.some(f => f.ko)) { B.chFury = 1; for (const f of B.you.team) if (!f.ko) f.pe = { ...(f.pe || {}), dmg: ((f.pe || {}).dmg || 0) + 25, typeNeutral: 1 }; ov.classList.add('chr-fury'); turnBanner('SUPER SAIYAN FURY', true); log('SUPER SAIYAN FURY · +25% damage and no type disadvantage.'); sfx('bcharge'); await wait(1000) }
    if (stage.turnLimit) { const left = stage.turnLimit - B.turn + 1; chronHud(left); if (left <= 0) { turnBanner(stage.limitText || 'TIME UP', false); log((stage.limitText || 'TIME UP') + '!'); shake(3); await wait(1200); end(false); return true } if (left <= 3) log('⏳ ' + left + ' turn' + (left > 1 ? 's' : '') + ' left!') }
    if (stage.bossAb && stage.bossAb.warn && B.turn % 3 === 0) { turnBanner(stage.bossAb.warn, false); log(stage.bossAb.warn + ' (' + act(B.ai).card.name + ')'); await wait(900) }
    return false
  }
  async function autoTurn() {
    if (!AUTO || B.busy || B.over) return
    B.busy = true; controls(); await wait(350)
    if (B.closed || B.over) return
    await advanceObjective?.(true)
    if (B.closed || B.over) return
    if (!AUTO) { B.busy = false; controls(); return }
    if (canTransform(act(B.you), B.you)) await transform(B.you, 'you')
    const f = act(B.you)
    const side = f.partnerSide
    autoTagPartner(f, B.turn)
    if (side !== f.partnerSide) { lvSend({ t: 'partner' }); draw(); flushPas() }
    for (const ev of planTurn(B, 5, 'you')) { if (B.over) return; await show(ev); if (B.over) return }
    // auto Tag Assist: after a Special/Ultimate, tag in the best bench fighter for a free hit
    if (!B.over && !B.you.switched && (B.you.seq.includes('special') || B.you.ultTurn === B.turn)) { const foe = act(B.ai), cur = act(B.you), sc = f => (matchup(f, foe) - matchup(foe, f)) * 2 + f.hp / f.max, best = B.you.team.map((f, i) => [f, i]).filter(([f, i]) => !f.ko && i !== B.you.active && f.hp / f.max > .35).sort((x, y) => sc(y[0]) - sc(x[0]))[0]; if (best && sc(best[0]) >= sc(cur) - .3) { B.busy = false; await doSwitch(best[1]); B.busy = true } }
    B.busy = false; if (!B.over && AUTO) await endTurn()
  }
  { const sb = $a('.ar-speed'), sd = () => { sb.textContent = SPEED + '×'; sb.classList.toggle('on', SPEED > 1) }; sb.onclick = () => { SPEED = SPEED === 1 ? 2 : SPEED === 2 ? 3 : 1; try { localStorage.setItem('aut-bspeed', SPEED) } catch { } ov.style.setProperty('--spd', SPEED); sd() }; ov.style.setProperty('--spd', SPEED); sd()
    const ab = $a('.ar-auto'); ab.onclick = () => { AUTO = !AUTO; ab.classList.toggle('on', AUTO); ab.textContent = AUTO ? 'AUTO ON' : 'AUTO'; if (AUTO && !B.busy && !B.over) autoTurn() } }

  async function crucibleEnd(won) {
    await wait(600)
    const n = stage.crucible.n, hp = B.you.team.map(f => f.ko ? 0 : Math.min(1, f.hp / f.max))
    const r = await X.act('crucibleResult', { stage: n, won, hp, gauge: B.you.gauge })
    sfx(won ? 'win' : 'lose')
    const box = h('div', 'ar-result cru-result ' + (won ? 'win' : 'lose'))
    const run = X.ST().crucible?.run
    box.innerHTML = '<div class="rs-burst"></div><h2>' + (r.done ? 'CRUCIBLE CLEARED' : won ? 'STAGE ' + n + ' CLEARED' : 'DEFEATED') + '</h2>'
    const p = h('p'); p.textContent = (r.msg || r.error || '') + (r.got ? ' ' + (r.first ? 'First clear: ' : 'Replay: ') + crucibleRewardText(r.got) : ''); box.append(p)
    if (won && run && !r.done) {
      const team = h('div', 'cru-hp'); B.you.team.forEach((f, i) => { const x = run.hp[i], row = h('div', 'cru-hpr' + (x === 0 ? ' ko' : '')); row.innerHTML = '<b></b><i><u style="width:' + Math.round(x * 100) + '%"></u></i><small>' + (x === 0 ? 'KO' : Math.round(x * 100) + '%') + '</small>'; row.querySelector('b').textContent = f.card.name; team.append(row) }); box.append(team)
      const nx = CRUCIBLE_STAGES[run.stage - 1]; if (nx) { const pv = h('div', 'cru-next'); pv.textContent = 'NEXT · Stage ' + nx.n + ' · ' + nx.name + ' · ' + nx.enemy.map(e => cardById(e)?.name || e).join(', '); box.append(pv) }
    }
    const actions = h('div', 'battle-result-actions')
    const btn = (label, cls, fn) => { const b = h('button', 'btn ' + cls, label); b.onclick = fn; actions.append(b) }
    if (won && run && !r.done) {
      btn('CONTINUE', 'gold', async () => { const e = await X.act('crucibleEnter', { stage: run.stage }); if (e.error) return; close({ immediate: true, route: false }); startBattle(crucibleStageObj(X.ST().crucible.run)) })
      btn('SAVE & QUIT', 'dark', async () => { await X.act('crucibleSave'); close() })
      btn('ITEMS & PREVIEW', 'dark', () => close())
    } else btn('BACK', 'gold', () => close())
    box.append(actions); ov.append(box)
  }
  async function end(won) {
    if (B.over) return
    B.over = true; controls()
    if (stage.crucible) return crucibleEnd(won)
    await wait(500)
    if (LV) { try { lvUnsub && lvUnsub(); clearInterval(lvTimer) } catch { } X.ACC.pvpFinish(LV.code, won ? LV.me : LV.oppUid) }
    const mvp = B.you.team.slice().sort((a, b) => b.dealt - a.dealt)[0]
    if (won && mvp && !window.__SIM && !stage.war) { try { await victoryPose(mvp) } catch { } }
    const recordWar = async () => {
      const result = await X.act('warResult', { ...stage.war, won })
      if (!result.error) recordWarMvp(stage.war, mvp)
      return result
    }
    const recordDraft = () => X.act('draftResult', { id: stage.draft.id, round: stage.draft.round, won,
      hp: B.you.team.map(f => f.ko ? 0 : Math.min(1, f.hp / f.max)) })
    const r = stage.chronicle ? await X.act('chronResult', { ...stage.chronicle, won, lost: B.you.team.filter(f => f.ko).length }) : stage.draft ? await recordDraft() : (stage.rivalry || stage.rival) ? await X.act('rivalryResult', { mode: stage.id, rival: stage.rival, won, mastered: B.rivalMastered, survived: B.hakaiSurvived, explosion: B.finalExplosionKO }) : stage.war ? await recordWar() : stage.pvp ? await X.act('pvp', { won, name: stage.name, uid: stage.uid }) : await X.act('battle', stage.mode ? { mode: stage.mode, id: stage.id, won, dmg: B.you.team.reduce((n, f) => n + f.dealt, 0), ko: B.you.team.filter(f => f.ko).length, turns: B.turn, rescued: stage.chapterRule === 'rescue' ? rescueCards().map((card, i) => B.you.team.some(f => f.key === card.key && !f.ko) ? RESCUE_NAMES[i] : null).filter(Boolean) : undefined } : { stage: stage.n, won })
    if (stage.mode === 'raid' && r && r.raidTotal != null && X.raidPost) { try { await X.raidPost(stage.raidId, r.raidTotal); RAIDCACHE.at = 0 } catch (e) { console.warn('raid post failed', e) } }
    sfx(stage.boss ? 'claim' : won ? 'win' : 'lose')
    const dealt = B.you.team.reduce((n, f) => n + f.dealt, 0), kos = B.you.team.reduce((n, f) => n + f.kos, 0)
    const box = document.createElement('div'); box.className = 'ar-result ' + (won ? 'win' : 'lose')
    if (won) { const cf = document.createElement('div'); cf.className = 'confetti'; cf.innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="--x:${Math.random() * 100}%;--d:${(Math.random() * .8).toFixed(2)}s;--h:${Math.round(Math.random() * 360)};--r:${Math.round(Math.random() * 720 - 360)}deg"></i>`).join(''); ov.append(cf); setTimeout(() => cf.remove(), 4000) }
    box.innerHTML = `<div class="rs-burst"></div><h2>${stage.boss ? 'BOSS FIGHT' : won ? 'VICTORY' : 'DEFEAT'}</h2><p>${stage.boss ? (r.msg || '') : (stage.rivalry || stage.rival) ? (r.msg || r.error || 'Toppo defeated your squad.') : stage.draft ? (r.msg || r.error || 'Draft fight recorded.') : stage.war ? (r.msg || (won ? 'Your squad won this lane.' : 'Your squad lost this lane.')) : won ? (r.msg || r.error || 'Stage cleared.') : (stage.storyTeam ? 'Your story lineup was knocked out. Try again.' : 'Your team was knocked out. Tweak your lineup and try again.')}</p>
      <div class="rs-body"><div class="rs-mvp"><span>MVP</span><div class="rs-card"></div><b>${mvp.card.name}</b><small>${mvp.dealt.toLocaleString()} DMG · ${mvp.kos} KO</small></div>
      <div class="rs-stats"><div><b>${B.turn}</b><span>TURNS</span></div><div><b>${dealt.toLocaleString()}</b><span>TOTAL DAMAGE</span></div><div><b>${kos}</b><span>KNOCKOUTS</span></div><div><b>${B.you.team.filter(f => !f.ko).length}/${B.you.team.length}</b><span>SURVIVED</span></div></div></div>`
    box.querySelector('.rs-card').append(img(mvp, 360))
    if (r.reward && BYKEY[r.reward]) {
      const reward = h('div', 'transfer-reward')
      reward.append(h('b', '', deadZone ? 'DEAD ZONE CARD UNLOCKED' : 'STORY CARD UNLOCKED'), cardImg(BYKEY[r.reward], 180))
      box.querySelector('.rs-body').after(reward)
    }
    addBattleRecap(box, B.you.team)
    addTurningPoints(box, turningPoints.list())
    const b = document.createElement('button'); b.className = 'btn gold'; b.textContent = 'CONTINUE'; b.onclick = async () => {
      if ((stage.war || stage.draft) && r.error && !r.state) {
        b.disabled = true
        const result = await (stage.draft ? recordDraft() : recordWar())
        if (result.error && !result.state) { b.disabled = false; return }
      }
      close()
      if (won && !r.error && stage.afterWin) stage.afterWin()
    }
    const actions = h('div', 'battle-result-actions')
    actions.append(b)
    const shortcut = (label, run) => {
      const button = h('button', 'btn dark', label)
      button.onclick = () => { if (!B.closed) run() }
      actions.append(button)
    }
    const run = X.P.war?.run
    const nextWar = stage.war && !r.error && run?.id === stage.war.id && warStage(run, X.ST().warLanes)
    const nextDraft = stage.draft && won && !r.error && draftStage(X.ST().draft.run)
    if (nextDraft) shortcut('NEXT DRAFT FIGHT', () => { close({ immediate: true, route: false }); startBattle(nextDraft) })
    if (nextWar) shortcut('NEXT WAR LANE', () => { close({ immediate: true, route: false }); startBattle(nextWar) })
    if (won && !r.error && stage.nextFight) shortcut('NEXT FIGHT', () => {
      if (stage.mode === 'camp') { try { sessionStorage.removeItem('campOutro') } catch { } }
      close({ immediate: true })
      stage.nextFight()
    })
    if (!stage.war && !stage.pvp && !stage.live && !r.error && ['transfer-campaign', 'camp', 'arc', 'tower', 'redzone', 'villain', 'rivalry', undefined].includes(stage.mode)) {
      shortcut('RETRY', () => { close({ immediate: true, route: false }); startBattle(stage) })
      if (!won && !stage.storyTeam && !stage.draft) {
        const canEditTeam = !!stage.retryLineup || (!stage.playerTeam && !stage.rivalry && !stage.rival)
        shortcut(canEditTeam ? 'EDIT TEAM & RETRY' : 'EDIT DECK & RETRY', () => {
          close({ immediate: true, route: false })
          X.prepareRetry(stage.label || stage.name, () => {
            if (canEditTeam && !stage.retryLineup && !X.P.team.some(Boolean)) {
              X.toast('Add a fighter before starting the rematch.', 'err')
              return false
            }
            startBattle(stage.retryLineup ? { ...stage, playerTeam: stage.retryLineup() } : stage)
          }, canEditTeam)
        })
      }
    }
    box.append(actions)
    ov.append(box)
  }

  arenaImgs().then(list => {
    let name = ARENAS[AR].name, sub = ARENAS[AR].sub
    if (mission) {
      ov.classList.add('has-img')
      ov.style.setProperty('--bgimg', 'url("' + CAMPAIGN_ART[mission.data.place] + '")')
      name = mission.data.name
      sub = 'CHAPTER ' + mission.chapter + ' · MISSION ' + mission.mission
    } else if (list.length) {
      const pick = stage.live ? list[stage.live.seed % list.length] : stage.pvp || !stage.n ? list[Math.floor(Math.random() * list.length)] : list[(stage.n - 1) % list.length]
      ov.classList.add('has-img'); ov.style.setProperty('--bgimg', `url("${pick.url}")`); name = pick.name; sub = stage.pvp ? 'Ranked Arena' : 'Stage ' + stage.n
      { const tag = !stage.live && ARENA_BONUS[pick.id]; if (tag && !B.arenaB) { B.arenaB = tag; for (const sd of [B.you, B.ai]) for (const f of sd.team) if (tagsOf(f.card).includes(tag)) { f.max = Math.round(f.max * 1.05); f.startingMax = Math.round(f.startingMax * 1.05); f.hp = Math.round(f.hp * 1.05); for (const k of ['pwr', 'ki', 'def']) f[k] = Math.round(f[k] * 1.05) } sub = '+5% to ' + (tag.startsWith('S:') ? X.ANAME(tag.slice(2)) : tag) + ' fighters'; try { draw() } catch { } } }
      // measure how bright the art is and pick a light or dark UI theme to match
      const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = 32; c.height = 18; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 18); const d = x.getImageData(0, 0, 32, 18).data; let L = 0; for (let i = 0; i < d.length; i += 4) L += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; L /= d.length / 4; ov.classList.toggle('lite', L > .42); ov.style.setProperty('--lum', L.toFixed(2)) } catch { } }; im.src = pick.url
    }
    const t = document.createElement('div'); t.className = 'arena-title'; t.innerHTML = `<small>ARENA</small><b>${name}</b><span>${sub}</span>`; ov.append(t); setTimeout(() => t.remove(), 2300)
  })
  draw()
  const kick = () => {
    if (B.closed || B.over) return
    const first = youFirst ? B.you : B.ai, second = youFirst ? B.ai : B.you
    first.flameTarget = act(second).key
    first.lastActive = act(first).key
    if (youFirst) { announceChapterRule(); log(`You move first (${act(B.you).card.name} is faster)`); myTurnStart() } else { log(`${act(B.ai).card.name} is faster · ${LV ? LV.oppName : 'enemy'} moves first`); if (LV) { B.busy = true; controls() } setTimeout(LV ? remotePhase : aiPhase, 600) } }
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

