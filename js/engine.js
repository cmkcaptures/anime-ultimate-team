// Anime Ultimate Team — in-browser game engine.
// Replaces serve.js: same rules, same actions. The save lives in Supabase (one row), with a localStorage copy.
// It answers the app's existing fetch('/api/...') calls, so app.js did not need rewriting.
const CFG = window.AUT_CONFIG || {}
import { initAccount, loadSave, storeSave, publish, me } from './account.js?v=mwpwxrg7'
let LS_SAVE = 'aut-save-v3'
// the old single-player key (from the ?key= link era), used once to move that save onto your account
let OLDKEY = null; try { OLDKEY = localStorage.getItem('aut-key') } catch { }
async function legacySave() {
  if (!OLDKEY || !CFG.apiKey) return null
  try { const r = await fetch('https://firestore.googleapis.com/v1/projects/' + CFG.projectId + '/databases/(default)/documents/aut_saves/' + encodeURIComponent(OLDKEY) + '?key=' + CFG.apiKey); if (!r.ok) return null; const d = await r.json(); return JSON.parse(d.fields.data.stringValue) } catch { return null }
}
const SB = true
async function cloudLoad() { const d = await loadSave(); return d ? { data: d } : null }
let cloudBusy = false, cloudAgain = false
async function cloudSave() {
  if (cloudBusy) { cloudAgain = true; return }
  cloudBusy = true
  try { await storeSave(S); setSync('ok'); publish(summary()) } catch { setSync('err') }
  cloudBusy = false
  if (cloudAgain) { cloudAgain = false; cloudSave() }
}
function summary() {
  const P = S.profile, own = Object.keys(P.club.cards).filter(k => byKey(k)), team = P.team.filter(k => k && byKey(k))
  return { level: levelOf(P.xp || 0).lv, cards: own.length, packs: P.club.packs || 0, cleared: (P.battle && P.battle.cleared) || 0, wins: (P.battle && P.battle.wins) || 0, losses: (P.battle && P.battle.losses) || 0,
    pvpWins: (P.battle && P.battle.pvpW) || 0, title: P.eq && P.eq.title ? (COSMETICS[P.eq.title]?.name || (achList().find(x => 'title_ach_' + x.id === P.eq.title) || {}).rw?.title || '') : '', avatar: P.avatar || '', achN: Object.keys(P.ach || {}).length, border: (P.eq && P.eq.border) || '', rivals: Object.fromEntries(Object.entries(P.rivals || {}).map(([k, v]) => [k, [v.w, v.l]])), bossScore: P.boss && P.boss.day === Math.floor(Date.now() / 864e5) ? P.boss.day * 1e9 + P.boss.best : 0, rating: team.length ? Math.round(team.reduce((n, k) => n + byKey(k).ovr, 0) / team.length) : 0, team, showcase: (P.showcase || []).filter(k => byKey(k)) }
}
function setSync(s) { document.documentElement.dataset.sync = s }

// ---------------- cards ----------------
let CARDS = []
const cards = () => CARDS
const byKey = k => CARDS.find(c => c.key === k)

// ---------------- economy ----------------
const BASE = { C: 200, U: 500, R: 1400, E: 4500, L: 16000, M: 60000, X: 220000 }
const MID = { C: 68, U: 76, R: 82, E: 87, L: 92, M: 96, X: 98.5 }
const PACKS = {
  bronze: { name: 'Bronze Pack', cost: 500 },
  silver: { name: 'Silver Pack', cost: 1200 },
  standard: { name: 'Gold Pack', cost: 1500 },
  jumbo: { name: 'Jumbo Gold', cost: 3600, size: 12 },
  lightning: { name: 'Lightning Pack', cost: 6000, stock: 3 },
  premium: { name: 'Premium Drop', cost: 7500 },
  DBZ: { name: 'Dragon Ball Pack', cost: 2500, anime: 'DBZ' },
  NAR: { name: 'Naruto Pack', cost: 2500, anime: 'NAR' },
  JJK: { name: 'Jujutsu Kaisen Pack', cost: 2500, anime: 'JJK' },
  OP: { name: 'One Piece Pack', cost: 2500, anime: 'OP' },
  MHA: { name: 'Hero Academia Pack', cost: 2500, anime: 'MHA' },
  BC: { name: 'Black Clover Pack', cost: 2500, anime: 'BC' },
  DS: { name: 'Demon Slayer Pack', cost: 2500, anime: 'DS' },
  BLE: { name: 'Bleach Pack', cost: 2500, anime: 'BLE' },
  PKM: { name: 'Pokémon Pack', cost: 2500, anime: 'PKM' },
  OPM: { name: 'One Punch Man Pack', cost: 2500, anime: 'OPM' },
  AOT: { name: 'Attack on Titan Pack', cost: 2500, anime: 'AOT' },
  SL: { name: 'Solo Leveling Pack', cost: 2500, anime: 'SL' },
  DAN: { name: 'Dandadan Pack', cost: 2500, anime: 'DAN' },
  FF: { name: 'Fire Force Pack', cost: 2500, anime: 'FF' },
  HXH: { name: 'Hunter x Hunter Pack', cost: 2500, anime: 'HXH' },
  FT: { name: 'Fairy Tail Pack', cost: 2500, anime: 'FT' },
  JJBA: { name: 'JoJo Pack', cost: 2500, anime: 'JJBA' },
  CSM: { name: 'Chainsaw Man Pack', cost: 2500, anime: 'CSM' },
}
// weekly banner: 2 featured Legendary+ cards, rotates every Monday, same for everyone
const BANNER_COST = 3000, PITY_MYTHIC = 80, PITY_FEATURED = 160
function banner() {
  const wk = Math.floor((Date.now() / 864e5 + 3) / 7), top = CARDS.filter(c => !c.season && 'LMX'.includes(c.r)).sort((a, b) => a.key < b.key ? -1 : 1)
  if (!top.length) return null
  const rnd = n => { let x = Math.sin(wk * 9301 + n * 49297) * 233280; return x - Math.floor(x) }
  const f1 = top[Math.floor(rnd(1) * top.length)], rest = top.filter(c => c.anime !== f1.anime), f2 = (rest.length ? rest : top)[Math.floor(rnd(2) * (rest.length || top.length))]
  const ends = (wk + 1) * 7 * 864e5 - 3 * 864e5
  return { id: 'b' + wk, name: 'FEATURED BANNER', cost: BANNER_COST, featured: [f1.key, f2.key], ends, pityMythic: PITY_MYTHIC, pityFeatured: PITY_FEATURED }
}
const SHARD_GET = { C: 5, U: 10, R: 25, E: 60, L: 150, M: 300, X: 600 }, SHARD_COST = { C: 40, U: 80, R: 200, E: 500, L: 1500, M: 3000, X: 6000 }
const RK = r => 'CURELMX'.indexOf(r)
// challenges: trade cards in for rewards. per = times per day
const SBCS = [
  { id: 'starter', name: 'Starter Squad', d: 'Any 5 cards.', n: 5, per: 3, rw: { pack: 'silver' } },
  { id: 'story', name: 'Same Story', d: '3 cards from the same anime.', n: 3, same: 1, per: 1, rw: { pack: 'standard' } },
  { id: 'rising', name: 'Rising Stars', d: '4 cards, Rare or better.', n: 4, minR: 'R', per: 1, rw: { pack: 'jumbo' } },
  { id: 'cross', name: 'Crossover', d: '5 cards from 5 different anime, Rare or better.', n: 5, minR: 'R', distinct: 1, per: 1, rw: { coins: 4000, shards: 150 } },
  { id: 'elite', name: 'Elite Trade', d: '3 cards, Epic or better.', n: 3, minR: 'E', per: 1, rw: { pack: 'premium' } },
  { id: 'legend', name: 'Legend Exchange', d: '2 cards, Legendary or better.', n: 2, minR: 'L', per: 1, rw: { pack: 'premium', shards: 600 } },
]
const FREE_EVERY = 12 * 3600e3, FREE_MAX = 2, LIGHT_EVERY = 6 * 3600e3, LIGHT_MAX = 3
const PP_PER_PACK = 5, PP_COST = { C: 35, U: 70, R: 150, E: 450, L: 1400, M: 2400, X: 4000 }
function value(c, lvl = 0) {
  if (!c) return 0
  const v = BASE[c.r] * (1 + (c.ovr - MID[c.r]) / 12) * (1 + .18 * lvl) * (S.market.demand[c.key] || 1)
  return Math.max(50, Math.round(v / 50) * 50)
}
const serMult = k => { const o = S && S.profile.club.cards[k]; return o && o.ser ? (o.ser <= 10 ? 3 : o.ser <= 100 ? 1.5 : 1) : 1 }
const quickSell = (c, lvl) => Math.max(50, Math.round(value(c, lvl) * .2 / 50) * 50)
const TAX = .05

// ---------------- save ----------------
const today = () => new Date().toISOString().slice(0, 10)
function fresh() {
  return {
    profile: { coins: 5000, xp: 0, pp: 0, club: { cards: {}, packs: 0 }, team: [null, null, null, null, null, null], last: [], pending: {}, claimed: {}, day: { date: today(), opened: 0, sold: 0, bought: 0, awakened: 0, wonder: 0 }, imported: false, free: { charges: FREE_MAX, at: Date.now() }, wonder: { charges: 1, at: Date.now() } },
    market: { listings: [], history: {}, demand: {}, seq: 1, won: [] },
    wonder: [],
    notices: []
  }
}
let S = null
let saveTimer = null
function save() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { S.savedAt = Date.now(); try { localStorage.setItem(LS_SAVE, JSON.stringify(S)) } catch { } cloudSave() }, 600)
}
function rollDay() { const P = S.profile; if (P.day.date !== today()) P.day = { date: today(), opened: 0, sold: 0, bought: 0, awakened: 0, wonder: 0 } }
const weekId = () => 'w' + Math.floor((Date.now() / 864e5 + 3) / 7)
function rollWeek() { const P = S.profile; if (!P.week || P.week.id !== weekId()) P.week = { id: weekId(), opened: 0, sold: 0, bought: 0, awakened: 0, wonder: 0, epic: 0, legend: 0 } }
function bump(k, n = 1) { rollDay(); rollWeek(); const P = S.profile; P.day[k] = (P.day[k] || 0) + n; P.week[k] = (P.week[k] || 0) + n }
function rollCharge(F, every, max) { while (F.charges < max && Date.now() - F.at >= every) { F.charges++; F.at += every } if (F.charges >= max) F.at = Date.now() }
const WONDER_EVERY = 6 * 3600e3, WONDER_MAX = 2
function rollCharge2(F) { while (F.n < LIGHT_MAX && Date.now() - F.at >= LIGHT_EVERY) { F.n++; F.at += LIGHT_EVERY } if (F.n >= LIGHT_MAX) F.at = Date.now() }
function rollFree() { rollCharge(S.profile.free, FREE_EVERY, FREE_MAX); rollCharge(S.profile.wonder, WONDER_EVERY, WONDER_MAX) }
const notice = (text, kind = 'info') => { S.notices.push({ text, kind, t: Date.now() }); if (S.notices.length > 30) S.notices.shift() }
const cardName = k => { const c = byKey(k); return c ? `${c.name} (${c.ver})` : 'card' }
const PRINT = { C: 9999, U: 7500, R: 5000, E: 2500, L: 1000, M: 500, X: 250 }
const rollSerial = k => { const c = byKey(k), cap = PRINT[c ? c.r : 'C'] || 9999; return 1 + Math.floor(Math.pow(Math.random(), .85) * cap) }
// every new copy gets a serial; the card keeps its lowest (best) one
const giveCard = (k, lvl = 0) => { const sr = rollSerial(k), r = giveCard0(k, lvl), o = S.profile.club.cards[k]; if (o) o.ser = Math.min(o.ser || 1e9, sr); return r }
const giveCard0 = (k) => { const now = Date.now(), C = S.profile.club.cards, had = C[k], e = had || (C[k] = { n: 1, first: now, dia: 3, lv: 1, xp: 0, asc: 0 }); if (had) { if ((e.dia || 3) < 7) e.dia = (e.dia || 3) + 1; else e.n++ } e.last = now; return e }
// ---------- LEVEL (1-100) ----------
const LV_MAX = 100, lvNeed = l => 40 + l * 8
function addCardXP(o, n) { o.lv = o.lv || 1; o.xp = (o.xp || 0) + n; let up = 0; while (o.lv < LV_MAX && o.xp >= lvNeed(o.lv)) { o.xp -= lvNeed(o.lv); o.lv++; up++ } if (o.lv >= LV_MAX) o.xp = 0; return up }
const addXP = n => { const P = S.profile; P.xp = (P.xp || 0) + n; passP().xp += n * 3 }
// ---------- SEASON PASS: 4-week seasons, 50 tiers, 300 pass XP per tier ----------
const PASS_TIER = 300, PASS_TIERS = 50, PASS_COST = 25000
// season themes, keyed by the season number players see (Season 2 = first themed season)
const SEASON_OFFSET = 740
const THEMES = {
  2: { name: 'RIVALS', jp: 'ライバル', c1: '#ff3b5c', c2: '#2a7bff', tag: 'Iconic rivals face off' },
}
const seasonShown = () => Math.max(1, seasonNo() - SEASON_OFFSET)
const theme = () => THEMES[seasonShown()] || { name: 'SEASON ' + seasonShown(), jp: 'シーズン', c1: '#ffcc00', c2: '#7b2ff2', tag: '' }
const seasonCards = () => CARDS.filter(c => c.season === seasonShown()).sort((a, b) => 'CURELMX'.indexOf(a.r) - 'CURELMX'.indexOf(b.r) || a.ovr - b.ovr)
// cosmetics unlocked on the premium track, per theme
const COSMETICS = {
  frame_rivals: { type: 'frame', name: 'Rivals Frame', d: 'Red and blue split border on every card' },
  title_rival: { type: 'title', name: 'Rival', d: 'Profile title' },
  border_rivals: { type: 'border', name: 'Rivals Ring', d: 'Avatar border' },
  opener_rivals: { type: 'opener', name: 'Clash Opener', d: 'Red vs blue pack opening' },
  title_eternal: { type: 'title', name: 'Eternal Rival', d: 'Profile title' },
  frame_rivals_gold: { type: 'frame', name: 'Rivals Gold Frame', d: 'Animated gold rival border' },
  title_capsule: { type: 'title', name: 'Capsule Kid', d: 'Gacha machine title' },
  frame_capsule: { type: 'frame', name: 'Capsule Frame', d: 'Pastel candy border from the gacha machine' },
}
const PREM_COS = { 3: 'title_rival', 15: 'border_rivals', 20: 'frame_rivals', 30: 'opener_rivals', 45: 'title_eternal', 49: 'frame_rivals_gold' }
const seasonNo = () => Math.floor(Date.now() / 864e5 / 28)
function passP() { const P = S.profile, n = seasonNo(); if (!P.pass || P.pass.season !== n) P.pass = { season: n, xp: 0, prem: false, f: [], p: [] }; return P.pass }
function freeCardTiers() { const L = seasonCards(), n = L.length, MS = [10, 25, 40, 50]; const m = {}; L.forEach((c, i) => { let t = Math.max(2, Math.round(48 * (i + 1) / n)); while ((m[t] || MS.includes(t)) && t > 1) t--; m[t] = c.key }); return m }
function passReward(track, t) {
  // milestones: 10, 25, 40, 50 are the big moments on both tracks
  if (track === 'f') {
    const fc = freeCardTiers()[t]; if (fc) { const c = byKey(fc); return { card: fc, label: c.name + ' · ' + c.ver, season: 1 } }
    if (t === 50) return { pack: 'premium', label: 'Premium Drop', big: 1 }
    if (t === 40) return { pack: 'jumbo', label: 'Jumbo Gold', big: 1 }
    if (t === 25) return { pack: 'jumbo', label: 'Jumbo Gold', big: 1 }
    if (t === 10) return { pack: 'standard', label: 'Gold Pack', big: 1 }
    if (t % 5 === 0) return { pack: 'standard', label: 'Gold Pack' }
    if (t % 3 === 0) return { shards: 60 + t * 3, label: '◆' + (60 + t * 3) + ' shards' }
    if (t % 4 === 0) return { pack: 'silver', label: 'Silver Pack' }
    return { coins: 400 + t * 25, label: (400 + t * 25).toLocaleString() + ' coins' }
  }
  if (PREM_COS[t] && theme().name === 'RIVALS') { const id = PREM_COS[t], C = COSMETICS[id]; return { cos: id, label: C.name, d: C.d, big: t >= 20 ? 1 : 0 } }
  if (t === 50) return { pick: 'M', label: 'Pick any Mythic', big: 1 }
  if (t === 25) return { pick: 'L', label: 'Pick any Legendary', big: 1 }
  if (t === 40) return { pack: 'lightning', label: 'Lightning Pack', big: 1 }
  if (t === 10) return { pack: 'lightning', label: 'Lightning Pack', big: 1 }
  if (t % 5 === 0) return { pack: 'premium', label: 'Premium Drop' }
  if (t % 2 === 0) return { shards: 150 + t * 8, label: '◆' + (150 + t * 8) + ' shards' }
  return { coins: 1200 + t * 50, label: (1200 + t * 50).toLocaleString() + ' coins' }
}
// ---------- RANKED LADDER ----------
const RANKS = [
  { id: 'bronze', name: 'Bronze', at: 0, rw: { coins: 3000 } },
  { id: 'silver', name: 'Silver', at: 300, rw: { coins: 6000, pack: 'standard' } },
  { id: 'gold', name: 'Gold', at: 700, rw: { coins: 10000, pack: 'jumbo' } },
  { id: 'plat', name: 'Platinum', at: 1200, rw: { coins: 15000, pack: 'premium' } },
  { id: 'diamond', name: 'Diamond', at: 1800, rw: { coins: 22000, pack: 'premium', shards: 800 } },
  { id: 'master', name: 'Master', at: 2500, rw: { coins: 30000, pack: 'lightning', shards: 1500 } },
  { id: 'legend', name: 'Legend', at: 3300, rw: { coins: 50000, pack: 'lightning', shards: 3000 } },
]
const rankOf = pts => { let i = 0; RANKS.forEach((r, j) => { if (pts >= r.at) i = j }); return i }
function rankP() {
  const P = S.profile, n = seasonNo()
  if (!P.rank) P.rank = { season: n, pts: 0, best: 0, w: 0, l: 0, streak: 0 }
  if (P.rank.season !== n) {
    const R = RANKS[P.rank.best || 0], w = R.rw
    if (P.rank.w + P.rank.l > 0) { P.coins += w.coins; if (w.pack) P.pending[w.pack] = (P.pending[w.pack] || 0) + 1; if (w.shards) P.shards = (P.shards || 0) + w.shards; notice(`Ranked season over! You finished ${R.name}: +${w.coins.toLocaleString()} coins${w.pack ? ' and a ' + PACKS[w.pack].name : ''}.`, 'gold') }
    const keep = Math.max(0, RANKS[Math.max(0, rankOf(P.rank.pts) - 2)].at)
    P.rank = { season: n, pts: keep, best: rankOf(keep), w: 0, l: 0, streak: 0 }
  }
  return P.rank
}
// ---------- DAILY BOSS ----------
const BOSS_TRIES = 3, BOSS_HP = 45
const BOSS_RW = [{ at: 10000, label: '1,000 coins', coins: 1000 }, { at: 25000, label: 'Gold Pack', pack: 'standard' }, { at: 50000, label: '2,500 coins + ◆200', coins: 2500, shards: 200 }, { at: 90000, label: 'Premium Drop', pack: 'premium' }, { at: 150000, label: 'Lightning Pack', pack: 'lightning' }]
function bossToday() {
  const day = Math.floor(Date.now() / 864e5), top = CARDS.filter(c => !c.season && 'MX'.includes(c.r)).sort((a, b) => a.key < b.key ? -1 : 1)
  if (!top.length) return null
  let x = Math.sin(day * 7919) * 10000; x -= Math.floor(x)
  const c = top[Math.floor(x * top.length)]
  const AB = [
    { id: 'aoe', d: 'Every 3rd turn it unleashes a wide attack that hits your whole team for 12% of their max HP.' },
    { id: 'stun', d: 'Every 3rd turn its pressure stuns your active fighter, who loses their next turn.' },
    { id: 'burn', d: 'Every 3rd turn it sets your whole team ablaze: 5% HP burn for 3 turns.' },
    { id: 'drain', d: 'Every 3rd turn it drains 3 of your Energy and steals your Ultimate charge.' },
    { id: 'rage', d: 'Every 3rd turn it powers up: +15% damage, stacking all fight long.' },
  ]
  const ab = AB[day % AB.length]
  return { day, key: c.key, hpMult: BOSS_HP, tries: BOSS_TRIES, rw: BOSS_RW, ends: (day + 1) * 864e5, ab: { ...ab, name: c.mv || 'BOSS ATTACK' } }
}
// ---------- RAID WEEKENDS ----------
// Fri 00:00 -> Mon 00:00 UTC. Everyone hits one shared boss; its HP lives in Firestore.
const RAID_HP = 500000, RAID_TRIES = 3, RAID_BOSSES = ['Story/2c088316237c31915117f8d596539829.jpg', 'Story/e51d1520ff0dc755ba7f4d396c1f2542.jpg', 'Story/muzan final form.jpg', 'Story/Imu.jpg']
const RAID_RW = [{ at: 25000, coins: 3000, label: '3,000 coins' }, { at: 60000, pack: 'jumbo', label: 'Jumbo Gold' }, { at: 120000, pack: 'premium', label: 'Premium Drop' }, { at: 200000, shards: 3000, tickets: 3, label: '◆3,000 + 3 Tickets' }]
function raidNow() {
  const now = Date.now(), day = Math.floor(now / 864e5), dow = (day + 4) % 7 // 0 = Sunday
  const daysSinceFri = (dow + 2) % 7, friDay = day - daysSinceFri, active = daysSinceFri <= 2
  const wk = Math.floor(friDay / 7), key = RAID_BOSSES[wk % RAID_BOSSES.length]
  const AB = [{ id: 'aoe', d: 'Every 3rd turn it hits your whole team for 12% of their max HP.' }, { id: 'drain', d: 'Every 3rd turn it drains 3 Energy and steals your Ultimate charge.' }, { id: 'rage', d: 'Every 3rd turn it powers up: +15% damage, stacking.' }, { id: 'burn', d: 'Every 3rd turn it burns your whole team for 3 turns.' }]
  const c = byKey(key)
  return { id: 'r' + wk, key, active, hp: RAID_HP, tries: RAID_TRIES, rw: RAID_RW, starts: friDay * 864e5, ends: (friDay + 3) * 864e5, next: (friDay + 7) * 864e5, hpMult: 30, ab: { ...AB[wk % AB.length], name: c ? c.mv : 'RAID ATTACK' } }
}
function raidP() { const P = S.profile, R = raidNow(), d = Math.floor(Date.now() / 864e5); if (!P.raid || P.raid.id !== R.id) P.raid = { id: R.id, day: d, tries: 0, best: 0, total: 0, got: [], win: 0 }; if (P.raid.day !== d) { P.raid.day = d; P.raid.tries = 0 } return P.raid }
function bossP() { const P = S.profile, d = Math.floor(Date.now() / 864e5); if (!P.boss || P.boss.day !== d) P.boss = { day: d, tries: 0, best: 0, total: 0, got: [] }; return P.boss }
// ---------- LOGIN STREAK ----------
const LOGIN_RW = [{ coins: 1000 }, { coins: 1500 }, { pack: 'silver' }, { coins: 2500 }, { shards: 300 }, { pack: 'standard' }, { pack: 'premium' }]
function loginP() { const P = S.profile, d = Math.floor(Date.now() / 864e5); if (!P.login) P.login = { last: 0, streak: 0 }; const L = P.login; if (L.last && d - L.last > 1) L.streak = 0; return { L, d, can: L.last !== d, next: L.last !== d ? (L.streak % 7) : ((L.streak - 1) % 7) } }
// ---------- ACHIEVEMENTS ----------
const ANIME_NAMES = { SDS: 'Seven Deadly Sins', AOT: 'Attack on Titan', PKM: 'Pokémon', DBZ: 'Dragon Ball', NAR: 'Naruto', JJK: 'Jujutsu Kaisen', OP: 'One Piece', MHA: 'Hero Academia', BC: 'Black Clover', DS: 'Demon Slayer', BL: 'Blue Lock', JJBA: 'JoJo', HXH: 'Hunter x Hunter', BLE: 'Bleach', CSM: 'Chainsaw Man', FT: 'Fairy Tail', FF: 'Fire Force', YGO: 'Yu-Gi-Oh!', TG: 'Tokyo Ghoul' }
function achList() {
  const P = S.profile, own = k => !!P.club.cards[k], C = CARDS.filter(c => !c.season), B = P.battle || {}, n = Object.keys(P.club.cards).filter(k => byKey(k)).length
  const has = r => C.some(c => c.r === r && own(c.key)), cnt = r => C.filter(c => c.r === r && own(c.key)).length
  const L = [
    { id: 'col25', g: 'COLLECTION', name: 'Collector', d: 'Own 25 different cards', p: n, need: 25, rw: { coins: 2000 } },
    { id: 'col100', g: 'COLLECTION', name: 'Hoarder', d: 'Own 100 different cards', p: n, need: 100, rw: { coins: 8000, shards: 300 } },
    { id: 'colall', g: 'COLLECTION', name: 'Completionist', d: 'Own every card in the game', p: C.filter(c => own(c.key)).length, need: C.length, rw: { coins: 50000, title: 'Completionist' } },
    { id: 'myth5', g: 'COLLECTION', name: 'Mythic Hunter', d: 'Own 5 Mythic cards', p: cnt('M'), need: 5, rw: { coins: 10000, title: 'Mythic Hunter' } },
    { id: 'rainbow', g: 'COLLECTION', name: 'Over the Rainbow', d: 'Pull a Rainbow Secret card', p: has('X') ? 1 : 0, need: 1, rw: { coins: 15000, title: 'Rainbow Pull' } },
    { id: 'packs100', g: 'COLLECTION', name: 'Pack Addict', d: 'Open 100 packs', p: P.club.packs || 0, need: 100, rw: { coins: 5000, pack: 'premium' } },
    { id: 'win25', g: 'BATTLE', name: 'Fighter', d: 'Win 25 battles', p: B.wins || 0, need: 25, rw: { coins: 3000 } },
    { id: 'win100', g: 'BATTLE', name: 'Warlord', d: 'Win 100 battles', p: B.wins || 0, need: 100, rw: { coins: 10000, title: 'Warlord' } },
    { id: 'story', g: 'BATTLE', name: 'Story Complete', d: 'Clear all 10 story stages', p: B.cleared || 0, need: 10, rw: { coins: 5000 } },
    { id: 'tower25', g: 'BATTLE', name: 'Halfway Up', d: 'Clear Tower floor 25', p: (P.tower && P.tower.best) || 0, need: 25, rw: { coins: 6000, shards: 300 } },
    { id: 'tower50', g: 'BATTLE', name: 'Top of the Tower', d: 'Clear Tower floor 50', p: (P.tower && P.tower.best) || 0, need: 50, rw: { coins: 25000, title: 'Tower Master' } },
    { id: 'arcs', g: 'BATTLE', name: 'Arc Hunter', d: 'Complete 5 Story Arcs', p: Object.values(P.arcs || {}).filter(x => x >= 3).length, need: 5, rw: { coins: 12000, title: 'Arc Hunter' } },
    { id: 'diamond', g: 'BATTLE', name: 'Diamond Hands', d: 'Reach Diamond in Ranked', p: P.rank ? P.rank.best : 0, need: 4, rw: { coins: 10000, title: 'Diamond' } },
    { id: 'legend', g: 'BATTLE', name: 'Living Legend', d: 'Reach Legend in Ranked', p: P.rank ? P.rank.best : 0, need: 6, rw: { coins: 30000, title: 'Legend' } },
    { id: 'boss100k', g: 'BATTLE', name: 'Boss Breaker', d: 'Deal 100,000 damage to a Daily Boss in one fight', p: Math.max(P.bossBestEver || 0, (P.boss && P.boss.best) || 0), need: 100000, rw: { coins: 8000, title: 'Boss Breaker' } },
    { id: 'pvp10', g: 'SOCIAL', name: 'Rival', d: 'Win 10 battles against other players', p: B.pvpW || 0, need: 10, rw: { coins: 5000, title: 'Duelist' } },
    { id: 'streak7', g: 'SOCIAL', name: 'Dedicated', d: 'Reach a 7-day login streak', p: P.login ? P.login.streak : 0, need: 7, rw: { coins: 5000, title: 'Dedicated' } },
    { id: 'master', g: 'SOCIAL', name: 'Mastery', d: 'Get a card to Mastery 4', p: Math.max(0, ...Object.values(P.mast || {}).map(mastLv)) - 1, need: 4, rw: { coins: 6000, title: 'Master' } },
  ]
  for (const a of Object.keys(ANIME_NAMES)) { const s = C.filter(c => c.anime === a); if (s.length < 5) continue; L.push({ id: 'set_' + a, g: 'SERIES SETS', name: ANIME_NAMES[a] + ' Master', d: 'Own every ' + ANIME_NAMES[a] + ' card', p: s.filter(c => own(c.key)).length, need: s.length, rw: { coins: 4000 + s.length * 300, title: ANIME_NAMES[a] + ' Master' } }) }
  const got = P.ach || {}
  return L.map(x => ({ ...x, p: Math.min(x.p, x.need), done: x.p >= x.need, claimed: !!got[x.id] }))
}
// ---------- EVOLUTIONS ----------
const EVO_COPIES = { C: 3, U: 3, R: 2, E: 2, L: 1, M: 1 }
function evoNext(k) { const c = byKey(k); if (!c || c.season) return []; const rk = RK(c.r), same = CARDS.filter(x => x.name === c.name && !x.season && RK(x.r) > rk); if (!same.length) return []; const nr = Math.min(...same.map(x => RK(x.r))); return same.filter(x => RK(x.r) === nr).map(x => x.key) }
const evoShards = to => Math.round(SHARD_COST[byKey(to).r] * .4)
// ---------- GACHA MACHINE ----------
const GACHA_COST = 1000
const GACHA = [
  { w: 30, coins: 500, label: '500 coins' }, { w: 18, coins: 1500, label: '1,500 coins' }, { w: 6, coins: 5000, label: '5,000 coins', rare: 1 },
  { w: 16, shards: 100, label: '◆100 shards' }, { w: 6, shards: 400, label: '◆400 shards', rare: 1 },
  { w: 10, pack: 'silver', label: 'Silver Pack' }, { w: 6, pack: 'standard', label: 'Gold Pack' }, { w: 2, pack: 'premium', label: 'Premium Drop', rare: 1 },
  { w: 3, cos: 'title_capsule', label: 'Title: Capsule Kid', rare: 1 }, { w: 2, cos: 'frame_capsule', label: 'Capsule Frame', rare: 1 },
  { w: 1, card: 'L', label: 'Random Legendary card', rare: 1 },
]
// ---------- FUSION ----------
function fusionRecipes() {
  const C = CARDS.filter(c => !c.season), byName = n => C.filter(c => c.name === n)
  const out = []
  for (const c of C) {
    let parts = null
    if (c.name.includes(' & ')) parts = c.name.split(' & ').map(s => s.trim())
    else if (c.name === 'GOGETA' || c.name === 'VEGITO') parts = ['GOKU', 'VEGETA']
    if (!parts || parts.length !== 2) continue
    const [a, b] = parts.map(byName); if (!a.length || !b.length) continue
    out.push({ out: c.key, a: parts[0], b: parts[1], min: Math.max(0, RK(c.r) - 2), cost: Math.round(SHARD_COST[c.r] * .5) })
  }
  return out
}
// ---------- ARTS DECKS ----------
const ITEMS = {
  senzu: { name: 'SENZU BEAN', anime: 'DBZ', art: 'items/senzu.jpg', cost: 2, desc: 'Fully heals your active fighter and clears burn and freeze.' },
  cylinder: { name: 'MAGIC CYLINDER', anime: 'YGO', art: 'items/cylinder.jpg', cost: 2, desc: 'Trap: the next attack on your active fighter is sent straight back at the attacker.' },
}
const ITEM_MAX = 2
function itemsP() { const P = S.profile; if (!P.items) P.items = { senzu: 1, cylinder: 1 }; return P.items }
const DECK_SIZE = 20, DECK_MAX = { strike: 10, blast: 10, guard: 5, special: 4, burst: 3, charge: 3, transfer: 3, heal: 3, cleanse: 3, senzu: 1, cylinder: 1 }, TACTICS = ['burst', 'charge', 'transfer', 'heal', 'cleanse']
const STARTER_DECKS = [
  { name: 'Balanced', c: { strike: 8, blast: 6, guard: 3, special: 3 } },
  { name: 'Dragon Burst', c: { strike: 6, blast: 5, guard: 2, special: 2, burst: 3, transfer: 2 } },
  { name: 'One-Card Carry', c: { strike: 6, blast: 3, guard: 2, special: 2, charge: 3, transfer: 3, heal: 1 } },
  { name: 'Heal Wall', c: { strike: 6, blast: 4, guard: 4, special: 2, heal: 3, cleanse: 1 } },
]
function deckP() { const P = S.profile; if (!P.decks) P.decks = [{ name: 'Balanced', c: { strike: 8, blast: 6, guard: 3, special: 3 } }, { name: 'Dragon Burst', c: { ...STARTER_DECKS[1].c } }, { name: 'One-Card Carry', c: { ...STARTER_DECKS[2].c } }]; if (P.deckOn == null) P.deckOn = 0; return P.decks }
function deckOk(c) { let n = 0, tac = 0; for (const [k, v] of Object.entries(c || {})) { if (!(k in DECK_MAX) || v < 0 || v > DECK_MAX[k] || v !== Math.round(v)) return 'Bad card count.'; n += v; if (TACTICS.includes(k)) tac += v } if (n !== DECK_SIZE) return 'A deck needs exactly 20 cards.'; if (tac > 8) return 'At most 8 Tactic cards.'; { const it = itemsP(); let ni = 0; for (const k in ITEMS) { if ((c[k] || 0) > (it[k] || 0)) return 'You don\'t own that item.'; ni += c[k] || 0 } if (ni > ITEM_MAX) return 'At most 2 items.' }; if (!c.strike) return 'Add at least one Strike.'; return '' }
// ---------- GETTING STARTED ----------
function onboarding() {
  const P = S.profile, B = P.battle || {}, done = P.onb || {}
  const L = [
    { id: 'guide', t: 'Read the How to Play guide', d: 'Tap HOW TO PLAY on Home.', ok: !!P.guideSeen, rw: 500, go: 'guide' },
    { id: 'pack', t: 'Open your first pack', d: 'Tap FREE PACK on Home. They refill every 12 hours.', ok: (P.club.packs || 0) >= 1, rw: 500, go: 'home' },
    { id: 'team', t: 'Build a team of 6', d: 'Team → Auto Build picks your best cards.', ok: P.team.filter(Boolean).length >= 6, rw: 500, go: 'team' },
    { id: 'story', t: 'Win your first battle', d: 'Battle → Story → Stage 1. Tap AUTO if you get stuck.', ok: (B.cleared || 0) >= 1, rw: 1500, go: 'battle' },
    { id: 'deck', t: 'Look at your Arts Deck', d: 'Team → Arts Deck. Load a starter deck and save it.', ok: !!P.deckEdited, rw: 500, go: 'deck' },
    { id: 'login', t: 'Claim a daily login reward', d: 'Pops up on Home each day.', ok: P.login && P.login.streak >= 1, rw: 500, go: 'home' },
    { id: 'pass', t: 'Claim a Season Pass reward', d: 'Battle → Season Pass. Everything you do earns pass XP.', ok: P.pass && (P.pass.f || []).length >= 1, rw: 500, go: 'pass' },
    { id: 'ranked', t: 'Play a Ranked match', d: 'Battle → Ranked → Find Match.', ok: P.rank && (P.rank.w + P.rank.l) >= 1, rw: 1500, go: 'battle' },
  ]
  return L.map(x => ({ ...x, claimed: !!done[x.id] }))
}
// ---------- MASTERY ----------
const MAST = [0, 60, 180, 400, 750], MAST_RW = [0, 500, 1000, 2500, 5000]
const mastLv = x => MAST.filter(t => x >= t).length
// ---------- AWAKENING TREE ----------
const AWK = [
  { id: 'pwr', name: '+4 POWER', d: 'PWR +4', dup: 1, sh: 1, req: null },
  { id: 'spd', name: '+4 SPEED', d: 'SPD +4', dup: 1, sh: 1, req: null },
  { id: 'def', name: '+4 DEFENSE', d: 'DEF +4', dup: 1, sh: 1, req: null },
  { id: 'dodge', name: '+5% DODGE', d: '5% chance to dodge any hit', dup: 1, sh: 2, req: 'spd' },
  { id: 'dmg', name: '+8% DAMAGE', d: 'All damage +8%', dup: 2, sh: 2, req: 'pwr' },
  { id: 'ovr', name: '+3 RATING', d: 'Overall +3 and all stats +2', dup: 2, sh: 3, req: 'def' },
  { id: 'aw', name: 'AWAKENED', d: 'Awakened foil, +10% HP and +2 rating', dup: 3, sh: 5, req: ['dodge', 'dmg', 'ovr'] },
]
const AWK_SH = { C: 60, U: 100, R: 160, E: 260, L: 420, M: 700, X: 1100 }
// ---------- STORY CAMPAIGN ----------
// each stage: intro scene lines [speaker card name, text], enemy card names, rating, reward coins
const CAMPAIGN = [
  { id: 1, name: 'The Worlds Collide', sub: 'Chapter 1 · Attack on Titan × Naruto', boss: 'Mythic/eren founding titan.jpg', stages: [
    { n: 1, name: 'The Sky Breaks', rating: 72, coins: 1000,
      enemy: ['REINER', 'BERTHOLDT', 'ANNIE', 'FALCO', 'ZEKE#81', 'LARA TYBUR'],
      scene: [
        ['ARMIN', 'Captain. The sky over Shiganshina... it\'s cracking. Like a pane of glass.'],
        ['LEVI', 'Glass doesn\'t bleed smoke. Something\'s coming through.'],
        ['MIKASA', 'Those shapes in the steam. That\'s the Armored Titan. And the Colossal.'],
        ['ARMIN', 'That\'s impossible. Bertholdt is dead. I... I\'m the one who ate him.'],
        ['LEVI', 'Then work out how a dead man walks later. Blades out.']],
      outro: [
        ['ARMIN', 'They didn\'t recognise us. Reiner looked at me like we\'d never met.'],
        ['MIKASA', 'Because to them, we haven\'t. They\'re from before. Before any of it.'],
        ['MIKASA', 'Eren. You haven\'t said a word.'],
        ['EREN', '...I\'ve seen this sky before. In someone else\'s memories.']] },
    { n: 2, name: 'Strangers in the Smoke', rating: 76, coins: 1500,
      enemy: ['NARUTO#83', 'SASUKE#83', 'KAKASHI', 'JIRAIYA', 'MIGHT GUY', 'NARUTO#69'],
      scene: [
        ['NARUTO', 'Ugh... Kakashi-sensei? Where\'s the village? Where\'s ANYTHING?'],
        ['KAKASHI', 'Stay sharp. That rift felt like Kamui. Someone pulled us here on purpose.'],
        ['LEVI', 'More of them, falling out of the same crack. Don\'t let them shift.'],
        ['NARUTO', 'Shift?! Hey, wait, we\'re not your enemy!'],
        ['JIRAIYA', 'Save the speech, kid. Soldiers who\'ve lost this much don\'t listen first.']],
      outro: [
        ['KAKASHI', 'Your Titans. Our Tailed Beasts. One great power, split into pieces and handed down through blood.'],
        ['ARMIN', 'You\'re saying our worlds were built the same way?'],
        ['KAKASHI', 'I\'m saying whoever opened that rift knows it too.'],
        ['LEVI', 'Tch. You fight like you mean it. That\'s enough for now.'],
        ['NARUTO', 'So we\'re a team! Believe it!'],
        ['LEVI', 'Don\'t push it.']] },
    { n: 3, name: 'The Man Behind the Mask', rating: 80, coins: 2000,
      enemy: ['OBITO#85', 'REINER', 'ANNIE', 'BERTHOLDT', 'FALCO', 'OBITO#77'],
      scene: [
        ['KAKASHI', 'There. The air\'s twisting again. I\'d know that technique anywhere.'],
        ['OBITO', 'Kakashi. You followed me across worlds. Still chasing the past.'],
        ['ARMIN', 'It\'s him. He\'s pulling the Warriors out of time, back when they still believed in Marley.'],
        ['OBITO', 'Soldiers who already know how to kill Titans. Why build an army when history already built one for me?'],
        ['KAKASHI', 'Obito. Whatever Madara promised you, it isn\'t worth this.']],
      outro: [
        ['OBITO', 'Kill me if you want. The door is already open.'],
        ['OBITO', 'Madara wanted a world without war. And this world has a god buried in its sand.'],
        ['KAKASHI', 'A god?'],
        ['EREN', '...The Founding Titan.'],
        ['MIKASA', 'Eren, how do you know that\'s what he means?']] },
    { n: 4, name: 'Red Clouds Over Paradis', rating: 84, coins: 2500,
      enemy: ['PAIN', 'ITACHI#87', 'OBITO#77', 'MADARA#78', 'ITACHI#83', 'OBITO#85'],
      scene: [
        ['PAIN', 'Shinobi and soldiers standing side by side. Pain has a way of uniting people.'],
        ['JIRAIYA', 'Nagato. Still hiding behind those eyes.'],
        ['ITACHI', 'Naruto. Turn back. You don\'t understand what\'s waiting at the end of this.'],
        ['NARUTO', 'Not a chance! You guys always talk like you\'ve already seen the ending!'],
        ['ITACHI', '...Someone has.']],
      outro: [
        ['ITACHI', 'You fought well. Now listen, because I\'ll only say this once.'],
        ['ITACHI', 'Madara and the Beast Titan aren\'t the ones holding the strings. The first crack was opened from your side of the sky.'],
        ['ARMIN', 'Our side? None of us can do anything like that.'],
        ['ITACHI', 'Not with their hands. With their memories. Watch the one who stays quiet.'],
        ['MIKASA', '...Eren?']] },
    { n: 5, name: 'The Beast\'s Bargain', rating: 88, coins: 3000,
      enemy: ['ZEKE#88', 'MADARA#94', 'YMIR & ZEKE', 'OBITO#93', 'ZEKE#81', 'LARA TYBUR'],
      scene: [
        ['ZEKE', 'Madara and I want the same thing. No more children born just to be fed to war.'],
        ['MADARA', 'The Infinite Tsukuyomi, poured through your Paths. Every living soul dreaming in peace. Forever.'],
        ['LEVI', 'I promised Erwin I\'d cut you down, Zeke. Brought a friend this time? Good. Saves me a trip.'],
        ['ZEKE', 'Eren. You understand, don\'t you? Come and stand beside your brother.'],
        ['EREN', '...Not yet.']],
      outro: [
        ['ZEKE', 'Why... why isn\'t the Coordinate answering me?'],
        ['MADARA', 'The Paths are rejecting the Rinnegan. No... someone is already inside.'],
        ['ARMIN', 'Eren? Eren, where are you going?!'],
        ['EREN', 'I\'m sorry, Armin. I saw all of this, every path. I needed them to tear the sky open.'],
        ['EREN', 'Madara\'s eyes. Zeke\'s blood. Obito\'s door. All of it leads to me.']] },
    { n: 6, name: 'BOSS · Freedom', boss: 1, rating: 92, coins: 5000,
      enemy: ['EREN#94', 'ZEKE#88', 'MADARA#94', 'OBITO#93', 'EREN#87', 'ERWIN'],
      scene: [
        ['EREN', 'Two worlds. Two endless wars. I can end both of them, and I\'m the only one who can.'],
        ['LEVI', 'Erwin... even you? He\'s dragging the dead along on puppet strings.'],
        ['MIKASA', 'Eren. Please. Come home.'],
        ['EREN', 'I\'m free, Mikasa. For the first time in my life, I\'m actually free.'],
        ['NARUTO', 'I know that look. Sasuke had it too. I dragged him back, and I\'ll drag you back!']],
      outro: [
        ['EREN', 'You won. It doesn\'t matter.'],
        ['EREN', 'The Rumbling is already marching. Not here. Through the rift. Into your world, Naruto.'],
        ['KAKASHI', 'Konoha...'],
        ['ARMIN', 'Then we follow it. All of us.'],
        ['NARUTO', 'Yeah. Whatever\'s waiting on the other side, we face it together.']] },
  ] },
  { id: 2, name: 'The Leaf Trembles', sub: 'Chapter 2 · Naruto × Attack on Titan', boss: 'Story/2c088316237c31915117f8d596539829.jpg', stages: [
    { n: 1, name: 'Footsteps in the Leaf', rating: 0, coins: 1500,
      enemy: ['EREN#94', 'EREN#87', 'BERTHOLDT', 'EREN#68', 'EREN#67', 'REINER'],
      scene: [
        ['MINATO', 'The ground hasn\'t stopped shaking since dawn. Something enormous is walking through the Forest of Death.'],
        ['MIGHT GUY', 'Walls. Walls with faces. And they are walking towards Konoha!'],
        ['ARMIN', 'We followed it through the rift. That\'s the Rumbling. Every one of those is a Colossal Titan.'],
        ['NARUTO', 'Eren! I can see him standing on top of the big one. EREN! TALK TO ME!'],
        ['EREN', '...']],
      outro: [
        ['MINATO', 'We slowed them. Only slowed them. They don\'t bleed, they don\'t tire, and they don\'t stop.'],
        ['MIKASA', 'He didn\'t even look at me.'],
        ['KAKASHI', 'He\'s not marching on Konoha. Look at the path. He\'s heading for the old valley. Where the God Tree once stood.']] },
    { n: 2, name: 'The Uchiha Gambit', rating: 0, coins: 1800,
      enemy: ['SASUKE', 'ITACHI#87', 'ITACHI#83', 'SHISUI'],
      scene: [
        ['SASUKE', 'We end this quietly. Shisui\'s eye, one genjutsu, and Eren stops walking.'],
        ['ITACHI', 'Kotoamatsukami would rewrite his will. It would also take away the only thing he has left that is his own.'],
        ['SASUKE', 'Then we take it. That\'s cleaner than a war.'],
        ['NARUTO', 'You were gonna do it without telling anyone? That\'s exactly what Eren did to his friends!'],
        ['SASUKE', 'Then stop me, Naruto. Like always.']],
      outro: [
        ['SHISUI', 'He\'s right, Sasuke. A will that\'s rewritten isn\'t saved. It\'s just erased.'],
        ['ITACHI', 'Forgive me. I keep trying to protect people by deciding for them.'],
        ['SASUKE', '...Fine. We do it your way, idiot. But if it fails, I won\'t hesitate.']] },
    { n: 3, name: 'The Tree Remembers', rating: 0, coins: 2200,
      enemy: ['MADARA#94', 'OBITO#93', 'MADARA#78', 'OBITO#85', 'ZEKE#88'],
      scene: [
        ['HAGOROMO', 'Children of two worlds, listen. Long ago, a single tree took root. Its seeds fell in more than one place.'],
        ['ARMIN', 'The source of all living things. Ymir touched it in the forest. That\'s where the Titans came from.'],
        ['HAGOROMO', 'And my mother ate its fruit. That is where chakra came from. Your Titans and our chakra are the same power, split apart.'],
        ['MADARA', 'Which means whoever reaches the root first gets both. Thank you, old man. You saved us the search.'],
        ['ZEKE', 'Paths and chakra together. Every living thing, at peace. Isn\'t that what we all wanted?']],
      outro: [
        ['OBITO', 'Stop... Madara, something is pulling on the root from the other side.'],
        ['MADARA', 'Impossible. Nothing should be left on the other side.'],
        ['HAGOROMO', '...Mother.']] },
    { n: 4, name: 'Mother of All Chakra', rating: 0, coins: 2600,
      enemy: ['KAGUYA#94', 'MADARA#94', 'OBITO#93', 'ZEKE#88', 'HAGOROMO'],
      scene: [
        ['KAGUYA', 'All this noise. Footsteps that shake the earth, a voice crying through the Paths. You woke me.'],
        ['NARUTO', 'Kaguya?! We sealed you!'],
        ['KAGUYA', 'You sealed me in one world. Someone tore open the walls between them. The Founder\'s call was simply loud enough to follow.'],
        ['KAKASHI', 'Someone tore them open? Eren did that.'],
        ['KAGUYA', 'The boy? No. He only knocked. I didn\'t open this door, little ninja. I was invited.']],
      outro: [
        ['HAGOROMO', 'She has taken Madara and Obito\'s chakra. And she is reaching for the Coordinate.'],
        ['ARMIN', 'If she gets the Founding Titan, she gets every Titan and every Eldian alive.'],
        ['MIKASA', 'Then we reach Eren first.']] },
    { n: 5, name: 'Two Founders', rating: 0, coins: 3000,
      enemy: ['YMIR', 'YMIR & ZEKE', 'REINER', 'ANNIE', 'LARA TYBUR', 'ZEKE#81'],
      scene: [
        ['YMIR', 'She is pulling us. I can feel her hands on the Paths.'],
        ['REINER', 'My body won\'t listen. Get away from me, all of you!'],
        ['ANNIE', 'She\'s using us like Eren did. Like Marley did. Same chains, new master.'],
        ['MIKASA', 'Then I\'ll cut the chain. Eren, if you can hear me, you\'re not alone in there.'],
        ['EREN', 'Mikasa...?']],
      outro: [
        ['EREN', 'I saw every path. In every one, she wins if I stay on this road.'],
        ['EREN', 'I wanted freedom so badly I never asked who opened the door for me.'],
        ['NARUTO', 'Then stop running and fight with us. That\'s the one path you never tried.'],
        ['EREN', '...Yeah. Let\'s end her.']] },
    { n: 6, name: 'BOSS · The Progenitor', boss: 1, rating: 0, coins: 5000,
      enemy: ['KAGUYA', 'MADARA#94', 'OBITO#93', 'ZEKE#88', 'YMIR'],
      scene: [
        ['KAGUYA', 'Two Founders. Two worlds. One root. Everything returns to me.'],
        ['EREN', 'Not this time. I stopped the Rumbling. Every step of it ends with you.'],
        ['NARUTO', 'Sasuke! Eren! Everybody! All at once!'],
        ['SASUKE', 'Try to keep up.'],
        ['MIKASA', 'Together, Eren.']],
      outro: [
        ['KAGUYA', 'Sealed again... but it doesn\'t matter. The walls are broken. They will stay broken.'],
        ['HAGOROMO', 'The rift is spreading faster than before. Something on the other side is pulling it wider.'],
        ['BEERUS', '(far away) Hmm. Someone is breaking the multiverse. How rude. Whis, find out who.']] },
  ] },
  { id: 3, name: 'Gods of Destruction', sub: 'Chapter 3 · Dragon Ball', boss: 'Story/e51d1520ff0dc755ba7f4d396c1f2542.jpg', stages: [
    { n: 1, name: 'A Bored God', rating: 0, coins: 2000,
      enemy: ['BEERUS', 'GOKU BLACK#88', 'BROLY', 'JIREN'],
      scene: [
        ['GOKU', 'Hey Vegeta, did you feel that? It\'s like the whole sky just hiccupped.'],
        ['VEGETA', 'Of course I felt it. That rift dumped a forest and three Titans into my wife\'s garden.'],
        ['BEERUS', 'Worlds are leaking into each other. It\'s messy. It\'s ugly. I\'m going to destroy all of them and start fresh.'],
        ['GOKU', 'Hold on, Lord Beerus! There are people in those worlds!'],
        ['BEERUS', 'Then you have until I finish my pudding to give me a better idea.']],
      outro: [
        ['BEERUS', 'Fine. You have a little time. If you can find who is cracking the walls, I won\'t erase everything.'],
        ['GOKU', 'Deal! ...Uh, how do we find them?'],
        ['VEGETA', 'Follow the biggest, angriest power level. That\'s always how it works.']] },
    { n: 2, name: 'The Legendary Rift', rating: 0, coins: 2400,
      enemy: ['BROLY', 'JIREN', 'GOKU BLACK#88', 'BROLY'],
      scene: [
        ['GOHAN', 'Dad! A rift opened right over the wasteland. Something came through screaming!'],
        ['BROLY', 'KAKAROT!'],
        ['VEGETA', 'Broly. Of course it\'s Broly. And Jiren behind him? Who keeps sending us the worst possible guests?'],
        ['JIREN', 'I was pulled here against my will. Strength is the only thing I trust. Show me yours.']],
      outro: [
        ['JIREN', 'This was not my fight. Someone sent me through deliberately. They wanted us to tear each other apart.'],
        ['GOKU', 'Someone\'s using the rifts like doors. On purpose.'],
        ['GOHAN', 'Then where does the door lead from?']] },
    { n: 3, name: 'Rose in the Ashes', rating: 0, coins: 2800,
      enemy: ['GOKU BLACK#88', 'GOKU BLACK', 'BROLY', 'JIREN'],
      scene: [
        ['GOKU BLACK', 'Son Goku. We meet again, in a world even more broken than the last one.'],
        ['GOKU', 'Black?! We beat you!'],
        ['GOKU BLACK', 'In one timeline. But now there are no timelines. Only rifts. And I hold the key to every one of them.'],
        ['VEGETA', 'A key. Who would hand YOU a key?']],
      outro: [
        ['GOKU BLACK', 'A voice. A beautiful voice from a throne no one is allowed to see.'],
        ['GOKU BLACK', 'It said mortals had ruined enough worlds. I agreed.'],
        ['GOKU', 'Then we take that key off you.']] },
    { n: 4, name: 'Fusion Dance', rating: 0, coins: 3200,
      enemy: ['GOKU BLACK', 'BROLY', 'JIREN', 'BEERUS'],
      scene: [
        ['BEERUS', 'Enough. If you mortals can\'t stop him, I will erase this world with him in it.'],
        ['VEGETA', 'You\'d kill everyone just to stop one man?'],
        ['BEERUS', 'I\'m a god of destruction. It\'s literally the job description.'],
        ['GOKU', 'Vegeta. Only one thing\'s strong enough to stop both of them.'],
        ['VEGETA', 'Don\'t you dare say it... fine. FUSION!']],
      outro: [
        ['GOGETA', 'Hmph. Two minds, one body, zero patience.'],
        ['BEERUS', '...Alright. That was entertaining. I\'ll hold off. For now.']] },
    { n: 5, name: 'The Key Between Worlds', rating: 0, coins: 3600,
      enemy: ['GOKU BLACK', 'GOKU BLACK#88', 'BROLY', 'JIREN', 'BEERUS'],
      scene: [
        ['GOKU BLACK', 'Do you understand yet? Each world you save is another world for mortals to ruin.'],
        ['GOHAN', 'And who decided that? You? Or the voice?'],
        ['GOKU BLACK', 'The voice only showed me the truth. Someone has to sit on the throne above every world.'],
        ['VEGETA', 'Then that someone is about to lose their favourite puppet.']],
      outro: [
        ['GOKU BLACK', 'You can\'t stop it. The rifts are already spreading into every world.'],
        ['GOKU', 'Then why are you running?'],
        ['GOKU BLACK', 'I\'m not running. I\'m going ahead.']] },
    { n: 6, name: 'BOSS · Rift Walker', boss: 1, rating: 0, coins: 6000,
      enemy: ['GOKU BLACK', 'BROLY', 'JIREN', 'BEERUS', 'GOKU BLACK#88'],
      scene: [
        ['GOKU BLACK', 'Behold. The power of every world I have walked through. Rosé, sharpened by a thousand rifts.'],
        ['GOKU', 'You talk too much.'],
        ['VEGETA', 'For once, Kakarot, we agree.'],
        ['BEERUS', 'Go on, then. Impress me.']],
      outro: [
        ['GOKU BLACK', 'Laugh while you can. The next world is already bleeding. A king of curses and a king of demons... and they are about to meet.'],
        ['WHIS', '(appearing) The rift he escaped through leads to a world of cursed energy. And the trail is... sun-shaped.'],
        ['GOKU', 'Sun-shaped?'],
        ['WHIS', 'Someone is signing their work.']] },
  ] },
  { id: 4, name: 'Curse of the Crimson Moon', sub: 'Chapter 4 · Jujutsu Kaisen × Demon Slayer', boss: 'Story/muzan final form.jpg', stages: [
    { n: 1, name: 'Demons in Shibuya', rating: 0, coins: 2400,
      enemy: ['AKAZA', 'DOMA', 'GYUTARO', 'HANTENGU', 'KAIGAKU'],
      scene: [
        ['ITADORI', 'Since when do curses have pupils with kanji in them?'],
        ['TANJIRO', 'Those aren\'t curses. They\'re demons. Upper Moons. They followed the rift into your world.'],
        ['AKAZA', 'A world with no sun? A world full of strong fighters? This is paradise.'],
        ['MEGUMI', 'Great. As if we didn\'t have enough problems.']],
      outro: [
        ['TANJIRO', 'They\'re not hunting people randomly. They\'re searching for something.'],
        ['YUTA', 'Or someone. Strong cursed energy pulls them like moths.'],
        ['ITADORI', '...Sukuna.']] },
    { n: 2, name: 'Flame Hashira', rating: 0, coins: 2600,
      enemy: ['RENGOKU', 'GIYU', 'SHINOBU', 'MITSURI', 'OBANAI', 'TENGEN'],
      scene: [
        ['RENGOKU', 'Jujutsu sorcerers! You hide a demon inside your own body?'],
        ['ITADORI', 'It\'s complicated. Sukuna\'s not a demon, he\'s a curse! There\'s a difference!'],
        ['GIYU', 'There isn\'t.'],
        ['TANJIRO', 'Wait! Everyone, please! He\'s been fighting it the whole time, just like Nezuko!']],
      outro: [
        ['RENGOKU', 'Your heart burns bright, young sorcerer. I was wrong to judge you.'],
        ['SHINOBU', 'Then we have the same enemy. Good. That makes this much simpler.'],
        ['GOJO', '(walking in) Hey, hey. Did I miss the part where everyone teams up? I love that part.']] },
    { n: 3, name: 'Two Kings', rating: 0, coins: 3000,
      enemy: ['SUKUNA', 'MUZAN', 'KOKUSHIBO', 'URAUME', 'GETO'],
      scene: [
        ['SUKUNA', 'So. The coward who hides from the sun has come to my world.'],
        ['MUZAN', 'And the king of curses lives inside a child. How far you have fallen.'],
        ['GETO', 'Gentlemen. Kings shouldn\'t fight. Kings should rule. Together, nothing in either world could stop you.'],
        ['GOJO', 'Ugh. Geto\'s doing the speech again. Okay, Shibuya, round two.']],
      outro: [
        ['GETO', 'Gojo Satoru, you were always the problem. That\'s why I brought this.'],
        ['GOJO', 'Wait. The Prison Realm? Not again—'],
        ['YUTA', 'GOJO-SENSEI!'],
        ['TANJIRO', 'He\'s gone. They sealed him.']] },
    { n: 4, name: 'Without the Strongest', rating: 0, coins: 3400,
      enemy: ['KOKUSHIBO', 'AKAZA', 'DOMA', 'MAHITO & NANAMI', 'GETO', 'URAUME'],
      scene: [
        ['YUTA', 'Gojo-sensei isn\'t coming back this time. It\'s on us now.'],
        ['RENGOKU', 'Then we set our hearts ablaze! Every one of us!'],
        ['KOKUSHIBO', 'Without your strongest... you are just children holding swords.'],
        ['TANJIRO', 'Children holding swords have beaten you before.']],
      outro: [
        ['URAUME', 'You don\'t understand. Lord Muzan doesn\'t want an alliance. He never did.'],
        ['ITADORI', 'What are you talking about?'],
        ['URAUME', 'He\'s going to eat him. He\'s going to eat Sukuna.']] },
    { n: 5, name: 'The Betrayal', rating: 0, coins: 3800,
      enemy: ['MUZAN', 'SUKUNA', 'KOKUSHIBO', 'AKAZA', 'DOMA'],
      scene: [
        ['SUKUNA', 'Muzan. What do you think you are doing with that blood?'],
        ['MUZAN', 'The sun burns me. Curses don\'t burn. With your cursed energy, I become something the sun can\'t touch.'],
        ['SUKUNA', 'You dare?!'],
        ['MUZAN', 'I was promised this. A world without sunlight, and a king to devour. The letters said so.']],
      outro: [
        ['MUZAN', 'Ahh. Yes. This is what it feels like to be complete.'],
        ['TANJIRO', 'Letters? Who sent you letters, Muzan?!'],
        ['MUZAN', 'Every one was sealed with a sun. Ironic, don\'t you think?']] },
    { n: 6, name: 'BOSS · Demon King', boss: 1, rating: 0, coins: 6500,
      enemy: ['MUZAN', 'KOKUSHIBO', 'AKAZA', 'DOMA', 'SUKUNA'],
      scene: [
        ['MUZAN', 'Behold the Demon King. Cursed energy in my blood. The night will never end again.'],
        ['YUTA', 'Rika. Full strength. No holding back.'],
        ['RENGOKU', 'Every Hashira! Every sorcerer! Now!'],
        ['TANJIRO', 'This ends with the sunrise, Muzan. In every world.']],
      outro: [
        ['MUZAN', 'You... broke the seal on the Prison Realm with my own blood...'],
        ['GOJO', '(stepping out, stretching) Sorry I\'m late. Did I miss the boss fight? Aw, I did.'],
        ['TANJIRO', 'The letters. They came from one place. A world with a red sea and a city in the sky.'],
        ['GOJO', 'Then let\'s go knock on the throne room door.']] },
  ] },
  { id: 5, name: 'The Empty Throne', sub: 'Chapter 5 · One Piece · Every World Unites', boss: 'Story/Imu.jpg', stages: [
    { n: 1, name: 'Into the New World', rating: 0, coins: 2800,
      enemy: ['AKAINU', 'KING', 'BLACKBEARD', 'ROCKS D. XEBEC'],
      scene: [
        ['LUFFY', 'Woah! There\'s a guy with a chainsaw dog and a dude made of blue fire on my ship!'],
        ['GOJO', 'Hi. We\'re here to punch a god. You seem like the type who\'d want in.'],
        ['LUFFY', 'Punch a god? I already did that! ...Wait, a different one? I\'M IN!'],
        ['AKAINU', 'Pirates and outsiders. The Marines will bury you all in the sea.']],
      outro: [
        ['LAW', 'The Marines didn\'t care about us. They were stalling. Guarding the road to Mary Geoise.'],
        ['NARUTO', 'Then that\'s where we go.']] },
    { n: 2, name: 'The Emperor\'s Bargain', rating: 0, coins: 3200,
      enemy: ['BLACKBEARD', 'BIG MOM', 'KAIDO', 'KING'],
      scene: [
        ['BLACKBEARD', 'Zehahaha! Heroes from every world, all lined up for me! Do you know what one of your powers is worth?'],
        ['SHANKS', 'Teach. You\'re selling to both sides again.'],
        ['BLACKBEARD', 'Of course! The throne pays very, very well.'],
        ['LUFFY', 'You\'re working for them?!']],
      outro: [
        ['BLACKBEARD', 'Working for them? No. I want the throne for myself. I\'ll let you weaken them first.'],
        ['SHANKS', 'Always the opportunist. Luffy, don\'t trust a word from him.']] },
    { n: 3, name: 'The Red Line', rating: 0, coins: 3600,
      enemy: ['AKAINU', 'KING', 'BIG MOM', 'KAIDO', 'ROCKS D. XEBEC'],
      scene: [
        ['EREN', 'I can feel it through the Paths. Something above the clouds, pulling every rift towards itself.'],
        ['GOKU', 'Yeah. And its power level is... weird. It\'s like it\'s borrowing from everywhere.'],
        ['VEGETA', 'Stealing, you mean.'],
        ['ROCKS D. XEBEC', 'You children think you can climb the Red Line? I tried that once. It didn\'t end well.']],
      outro: [
        ['ROCKS D. XEBEC', 'Go on, then. Show the throne what I couldn\'t. Topple it.'],
        ['LUFFY', 'That\'s the plan!']] },
    { n: 4, name: 'Mary Geoise', rating: 0, coins: 4000,
      enemy: ['IMU', 'AKAINU', 'BLACKBEARD', 'KING', 'BIG MOM'],
      scene: [
        ['TANJIRO', 'This city smells... wrong. Like the sun, but cold.'],
        ['ITACHI', 'The sun seal. It\'s carved into every wall here.'],
        ['IMU', 'Welcome. You have come so far. Every world, every hero. Exactly as I planned.'],
        ['NARUTO', 'You?! You opened the doors? You called Kaguya? You sent Black and Muzan?'],
        ['IMU', 'I gave each of them what they wanted most. And in return, each of them broke a world for me.']],
      outro: [
        ['IMU', 'Did you not wonder why every villain wanted a throne? I only ever offered one.'],
        ['GOJO', 'So that\'s the trick. Everyone fights for the throne, and the one already on it wins.'],
        ['IMU', 'Now come. Kneel before the empty throne.']] },
    { n: 5, name: 'Every World Unites', rating: 0, coins: 4500,
      enemy: ['IMU', 'BLACKBEARD', 'AKAINU', 'ROCKS D. XEBEC', 'KAIDO', 'BIG MOM'],
      scene: [
        ['IMU', 'Kaguya\'s chakra. The Founder\'s Coordinate. Black\'s divinity. Muzan\'s night. I have taken them all.'],
        ['EREN', 'Then we give you something you don\'t have.'],
        ['NARUTO', 'Friends from every world, standing together. You can\'t steal that.'],
        ['GOKU', 'Ha! That sounded cool. Let\'s go!'],
        ['LUFFY', 'EVERYBODY! FREE THE WORLDS!']],
      outro: [
        ['BLACKBEARD', 'Zehahaha... I think I\'ll be leaving now.'],
        ['IMU', 'You think this is my full strength? I haven\'t even stood up from the throne.']] },
    { n: 6, name: 'FINAL BOSS · The Empty Throne', boss: 1, rating: 0, coins: 8000,
      enemy: ['IMU', 'BLACKBEARD', 'AKAINU', 'ROCKS D. XEBEC', 'KAIDO', 'BIG MOM'],
      scene: [
        ['IMU', 'Every history erased. Every world rewritten. I will sit above all of them, alone.'],
        ['LUFFY', 'Sounds lonely. And boring. I\'d rather have friends.'],
        ['GOJO', 'Nah, I\'d win.'],
        ['EREN', 'For freedom.'],
        ['NARUTO', 'Believe it!'],
        ['LUFFY', 'GEAR... FIVE!']],
      outro: [
        ['IMU', 'Impossible... a laughing fool...'],
        ['LUFFY', 'Shishishi! The throne\'s empty again!'],
        ['HAGOROMO', 'The rifts are closing. Every world is returning to its place.'],
        ['GOJO', 'Hm. Not every rift. Look. That one\'s still open.'],
        ['ICHIGO', '(from the other side) Hey! Is anyone over there?! Something just came out of the rift into Soul Society!']] },
  ] },
]
const CAMP_CHEST = [{ at: 9, coins: 5000, pack: 'jumbo' }, { at: 18, coins: 10000, pack: 'premium', shards: 2000 }]
function campP() { const P = S.profile; return P.camp || (P.camp = { stars: {}, chests: [] }) }
// ---------- TOWER / ARCS / EVENTS ----------
const towerFloor = n => ({ rating: Math.min(95, 68 + Math.round(n * .55)), level: Math.min(5, 1 + Math.floor(n / 10)), boost: 1 + Math.max(0, n - 25) * .012, coins: 300 + n * 40, pack: n % 10 === 0 ? (n === 50 ? 'lightning' : n >= 30 ? 'premium' : 'jumbo') : null })
const ARCS = [
  { id: 'jjk', anime: 'JJK', name: 'Shibuya Incident', bad: ['SUKUNA', 'MAHITO & NANAMI', 'MAHORAGA', 'HIGURUMA'] },
  { id: 'ds', anime: 'DS', name: 'Entertainment District', bad: ['GYUTARO', 'DOMA', 'AKAZA', 'HANTENGU'] },
  { id: 'mha', anime: 'MHA', name: 'Paranormal Liberation War', bad: ['SHIGARAKI', 'DABI'] },
  { id: 'nar', anime: 'NAR', name: "Pain's Assault", bad: ['PAIN'] },
  { id: 'op', anime: 'OP', name: 'Onigashima Raid', bad: ['KING', 'GOL D. ROGER'] },
  { id: 'dbz', anime: 'DBZ', name: 'Tournament of Power', bad: ['BROLY', 'GOKU BLACK'] },
  { id: 'jjba', anime: 'JJBA', name: 'Golden Wind Finale', bad: ['DIAVOLO', 'KIRA', 'DIEGO'] },
  { id: 'ble', anime: 'BLE', name: 'Thousand-Year Blood War', bad: ['YHWACH', 'AIZEN', 'ULQUIORRA', 'GRIMMJOW'] },
  { id: 'hxh', anime: 'HXH', name: 'Chimera Ant Arc', bad: ['MERUEM', 'NEFERPITOU', 'SHAIAPOUF', 'HISOKA'] },
  { id: 'bc', anime: 'BC', name: 'Spade Kingdom Raid', bad: ['ZAGRED'] },
  { id: 'ft', anime: 'FT', name: 'Alvarez Empire War', bad: ['ZEREF', 'ACNOLOGIA'] },
  { id: 'ff', anime: 'FF', name: 'The Great Cataclysm', bad: ['THE EVANGELIST', 'HAUMEA', 'SHO'] },
]
const ARC_CH = [{ name: 'Chapter 1', level: 2, boost: 1, coins: 2000 }, { name: 'Chapter 2', level: 3, boost: 1.12, coins: 3000 }, { name: 'Final Boss', level: 5, boost: 1.3, coins: 5000 }]
const EVENT_ANIME = ['JJK', 'DS', 'DBZ', 'OP', 'NAR', 'MHA', 'JJBA', 'HXH', 'BLE', 'BC', 'FT', 'FF']
function eventNow() { const wk = Math.floor((Date.now() / 864e5 + 3) / 7), a = EVENT_ANIME[wk % EVENT_ANIME.length]; return { id: 'e' + wk, anime: a, pack: PACKS[a] ? a : 'standard', ends: (wk + 1) * 7 * 864e5 - 3 * 864e5, tiers: [{ name: 'Normal', level: 2, boost: 1, coins: 1500 }, { name: 'Hard', level: 4, boost: 1.2, coins: 3000 }, { name: 'Nightmare', level: 5, boost: 1.45, coins: 5000, pack: true }] } }

// ---------------- rewards / missions ----------------
const NAMES = { SDS: 'Seven Deadly Sins', AOT: 'Attack on Titan', PKM: 'Pokémon', DBZ: 'Dragon Ball', NAR: 'Naruto', JJK: 'Jujutsu Kaisen', OP: 'One Piece', MHA: 'My Hero Academia', BC: 'Black Clover', DS: 'Demon Slayer', BL: 'Blue Lock', HXH: 'Hunter x Hunter', FT: 'Fairy Tail', CSM: 'Chainsaw Man', JJBA: 'JoJo', TG: 'Tokyo Ghoul', BLE: 'Bleach', K8: 'Kaiju No. 8', MOB: 'Mob Psycho 100', FF: 'Fire Force', OPM: 'One Punch Man', KGB: 'Kagurabachi', YGO: 'Yu-Gi-Oh!', DAN: 'Dandadan', SL: 'Solo Leveling' }
function rewards() {
  rollDay()
  const P = S.profile, all = cards(), own = all.filter(c => P.club.cards[c.key]), d = P.day.date
  const out = [
    { id: 'daily-login-' + d, group: 'DAILY', name: 'Daily login bonus', prog: 1, need: 1, coins: 1000 },
    { id: 'daily-open-' + d, group: 'DAILY', name: 'Open 3 packs', prog: Math.min(3, P.day.opened), need: 3, coins: 2000 },
    { id: 'daily-wonder-' + d, group: 'DAILY', name: 'Do a Wonder Pick', prog: Math.min(1, P.day.wonder || 0), need: 1, coins: 1000 },
    { id: 'daily-sell-' + d, group: 'DAILY', name: 'Sell a card on the market', prog: Math.min(1, P.day.sold), need: 1, coins: 1500 },
    { id: 'daily-buy-' + d, group: 'DAILY', name: 'Buy or win a card on the market', prog: Math.min(1, P.day.bought), need: 1, coins: 1500 },
    { id: 'daily-awaken-' + d, group: 'DAILY', name: 'Awaken a card', prog: Math.min(1, P.day.awakened), need: 1, coins: 1500 },
  ]
  rollWeek(); const W = P.week, wk = W.id
  out.push(
    { id: 'wk-open-' + wk, group: 'WEEKLY', name: 'Open 20 packs', prog: Math.min(20, W.opened), need: 20, coins: 12000 },
    { id: 'wk-epic-' + wk, group: 'WEEKLY', name: 'Pull 5 Epic or better cards', prog: Math.min(5, W.epic), need: 5, coins: 8000 },
    { id: 'wk-legend-' + wk, group: 'WEEKLY', name: 'Pull a Legendary or better', prog: Math.min(1, W.legend), need: 1, coins: 10000 },
    { id: 'wk-wonder-' + wk, group: 'WEEKLY', name: 'Do 5 Wonder Picks', prog: Math.min(5, W.wonder), need: 5, coins: 6000 },
    { id: 'wk-trade-' + wk, group: 'WEEKLY', name: 'Make 5 market trades', prog: Math.min(5, W.sold + W.bought), need: 5, coins: 9000 },
    { id: 'wk-awaken-' + wk, group: 'WEEKLY', name: 'Awaken 3 cards', prog: Math.min(3, W.awakened), need: 3, coins: 6000 })
  for (const n of [10, 20, 30, 50, 75, 100]) if (n <= all.length || n === 10) out.push({ id: 'collect-' + n, group: 'COLLECTION', name: `Collect ${n} different cards`, prog: Math.min(n, own.length), need: n, coins: n * 500 })
  out.push({ id: 'collect-all-' + all.length, group: 'COLLECTION', name: `Complete the whole set (${all.length})`, prog: own.length, need: all.length, coins: 100000 })
  for (const a of [...new Set(all.map(c => c.anime))]) {
    const set = all.filter(c => c.anime === a), got = set.filter(c => P.club.cards[c.key]).length
    out.push({ id: `anime-${a}-${set.length}`, group: 'COLLECTION', name: `Complete ${NAMES[a] || a} (${set.length} cards)`, prog: got, need: set.length, coins: 4000 * set.length })
  }
  return out.map(r => ({ ...r, done: r.prog >= r.need, claimed: !!P.claimed[r.id] }))
}

// ---------------- AI traders ----------------
const TRADERS = ['SaiyanSam', 'KonohaKid', 'CursedCarl', 'StrawHatSue', 'NimbusNate', 'SharinganSi', 'DomainDan', 'GomuGomuGabe', 'KameKev', 'RasenRhea', 'SixEyesSol', 'ZoroLost', 'BulmaB', 'TojiFan99', 'ItachiStan', 'GearFiveGio']
const WEIGHT = { C: 30, U: 25, R: 18, E: 12, L: 8, M: 4, X: 1.5 }
const PACK_ODDS = { C: 48, U: 30, R: 14, E: 5.6, L: 1.9, M: .42, X: .08 }
const pick = a => a[Math.floor(Math.random() * a.length)]
function weightedCard(w = WEIGHT) {
  const all = cards().filter(c => !c.season); if (!all.length) return null
  let r = Math.random() * all.reduce((a, c) => a + w[c.r], 0)
  for (const c of all) if ((r -= w[c.r]) < 0) return c
  return all[0]
}
function aiPack() {
  const all = cards().filter(c => !c.season), out = []
  for (let i = 0; i < 5; i++) { let r = Math.random() * 100, t = 'C'; for (const k of ['X', 'M', 'L', 'E', 'R', 'U']) if ((r -= PACK_ODDS[k]) < 0) { t = k; break } const l = all.filter(c => c.r === t); out.push((l.length ? pick(l) : weightedCard()).key) }
  if (Math.random() < .2) out[Math.floor(Math.random() * 5)] = (weightedCard({ C: 0, U: 0, R: 10, E: 5, L: 1.2, M: .25, X: .05 }) || {}).key
  return out.filter(Boolean)
}
function record(key, price) { const h = S.market.history[key] || (S.market.history[key] = []); h.push({ p: price, t: Date.now() }); if (h.length > 40) h.shift() }
const step = p => Math.max(50, Math.round(p * .05 / 50) * 50)
const nextBid = l => l.bid ? l.bid + step(l.bid) : l.start
function settle(l, how, buyer) {
  const M = S.market, P = S.profile, price = how === 'bin' ? l.bin : l.bid
  M.listings.splice(M.listings.indexOf(l), 1); record(l.key, price)
  M.demand[l.key] = Math.min(1.6, (M.demand[l.key] || 1) * 1.03)
  const winner = how === 'bin' ? buyer : l.bidder
  if (how === 'bin' && l.bidder === 'YOU' && buyer !== 'YOU') { P.coins += l.bid; notice(`${cardName(l.key)} was bought outright, so your ${l.bid.toLocaleString()} bid came back.`) }
  if (l.you) { const got = Math.round(price * (1 - TAX)); P.coins += got; bump('sold'); addXP(20); notice(`${winner} ${how === 'bin' ? 'bought' : 'won'} your ${cardName(l.key)} for ${price.toLocaleString()}. You got ${got.toLocaleString()} coins after 5% tax.`, 'sold') }
  if (winner === 'YOU') {
    giveCard(l.key, l.lvl); bump('bought'); P.last = [l.key]; addXP(20)
    M.won = [{ key: l.key, lvl: l.lvl, price, t: Date.now() }, ...(M.won || [])].slice(0, 20)
    if (how === 'bid') notice(`You won ${cardName(l.key)} for ${price.toLocaleString()} coins. It is in your box.`, 'sold')
  }
}
function placeBid(l, who, amount) {
  if (l.bidder === 'YOU') { S.profile.coins += l.bid; if (who !== 'YOU') notice(`You were outbid on ${cardName(l.key)}. Your ${l.bid.toLocaleString()} coins came back.`) }
  l.bid = amount; l.bidder = who
  if (l.exp - Date.now() < 30000) l.exp = Date.now() + 30000
}
function tick(noSave) {
  const M = S.market, now = Date.now(), all = cards().filter(c => !c.season)
  for (const c of all) { const d = M.demand[c.key] || 1; M.demand[c.key] = Math.max(.7, Math.min(1.6, d * (1 + (Math.random() - .5) * .06))) }
  for (const l of [...M.listings]) if (l.exp <= now) {
    if (l.bid) settle(l, 'bid')
    else { M.listings.splice(M.listings.indexOf(l), 1); if (l.you) { giveCard(l.key, l.lvl); notice(`Nobody bought your ${cardName(l.key)}. It went back to your box.`) } }
  }
  const npc = M.listings.filter(l => !l.you).length
  for (let i = 0; i < (npc < 50 ? 4 : npc < 90 ? 1 : 0); i++) {
    const c = weightedCard(); if (!c) break
    const lvl = Math.random() < .15 ? 1 + Math.floor(Math.random() * 3) : 0, v = value(c, lvl)
    const bin = Math.round(v * (.85 + Math.random() * .5) / 50) * 50, start = Math.max(50, Math.round(bin * (.55 + Math.random() * .3) / 50) * 50)
    M.listings.push({ id: M.seq++, key: c.key, lvl, start, bin, bid: 0, bidder: null, seller: pick(TRADERS), you: false, at: now, exp: now + (8 + Math.random() * 170) * 60000 })
  }
  for (const l of [...M.listings]) {
    const c = byKey(l.key); if (!c) { M.listings.splice(M.listings.indexOf(l), 1); if (l.you) notice('A listed card no longer exists and was removed.'); continue }
    const v = value(c, l.lvl)
    if (l.bin && l.bin <= v * (l.you ? 1.15 : .97) && Math.random() < (l.you ? .3 : .08) * Math.pow(v / l.bin, 3)) { settle(l, 'bin', pick(TRADERS)); continue }
    const nb = nextBid(l)
    if (nb < v * .92 && (!l.bin || nb < l.bin) && Math.random() < (l.you ? .35 : .12)) placeBid(l, pick(TRADERS.filter(t => t !== l.seller)), nb)
  }
  S.wonder = S.wonder.filter(w => w.exp > now)
  while (S.wonder.length < 6) S.wonder.push({ id: M.seq++, who: pick(TRADERS), keys: aiPack(), exp: now + (60 + Math.random() * 240) * 60000 })
  if (!noSave) save()
}

// ---------------- actions ----------------
function act(a) {
  rollDay(); rollFree()
  const P = S.profile, M = S.market, now = Date.now()
  const own = k => P.club.cards[k]
  const inTeam = k => P.team.includes(k)
  const spare = k => (own(k) ? own(k).n : 0) - (inTeam(k) ? 1 : 0)
  switch (a.type) {
    case 'import': return { error: 'Not available online.' }
    case 'freePack': {
      if (P.free.charges < 1) return { error: 'No free pack ready yet.' }
      if (P.free.charges >= FREE_MAX) P.free.at = now
      P.free.charges--; P.pending.standard = (P.pending.standard || 0) + 1; return {}
    }
    case 'buyPack': {
      const B = a.pack === 'banner' ? banner() : null, pk = B ? { cost: B.cost } : PACKS[a.pack]; if (!pk) return { error: 'Unknown pack.' }
      const n = a.count === 10 ? 10 : 1, cost = n === 10 ? Math.round(pk.cost * 10 * .9) : pk.cost
      if (P.coins < cost) return { error: `You need ${cost.toLocaleString()} coins.` }
      if (a.pack === 'lightning') { P.light = P.light || { n: LIGHT_MAX, at: now }; rollCharge2(P.light); if (P.light.n < n) return { error: 'Lightning Packs are sold out. More arrive soon.' }; if (P.light.n >= LIGHT_MAX) P.light.at = now; P.light.n -= n }
      P.coins -= cost; P.pending[a.pack] = (P.pending[a.pack] || 0) + n; return {}
    }
    case 'openPack': {
      if (!(P.pending[a.pack] > 0)) return { error: 'No unopened pack of that type.' }
      P.pending[a.pack]--; P.club.packs++; bump('opened'); P.last = []; let itemMsg = ''
      if (Math.random() < (a.pack === 'bronze' || a.pack === 'silver' ? .04 : .08)) { const ks = Object.keys(ITEMS), ik = ks[Math.floor(Math.random() * ks.length)], it = itemsP(); it[ik] = (it[ik] || 0) + 1; itemMsg = 'Bonus item: ' + ITEMS[ik].name + '!' }
      if (a.pack === 'banner') { const B = banner(), pt = P.pity || (P.pity = {}), pr = pt[B.id] || (pt[B.id] = { n: 0, m: 0, f: 0 }); pr.n++; pr.m++; pr.f++; for (const k of a.keys || []) { const c = byKey(k); if (c && 'MX'.includes(c.r)) pr.m = 0; if (B.featured.includes(k)) pr.f = 0 } } P.pp = Math.min(2500, (P.pp || 0) + PP_PER_PACK); addXP(40)
      const SIG = new Set(a.sig || [])
      for (const k of a.keys || []) { const c = byKey(k); if (!c) continue; giveCard(k); if (SIG.has(k)) { const o = P.club.cards[k]; o.sig = (o.sig || 0) + 1; bump('sig') } P.last.push(k); const rk = 'CURELMX'.indexOf(c.r); if (rk >= 3) bump('epic'); if (rk >= 4) bump('legend') }
      return itemMsg ? { msg: itemMsg } : {}
    }
    case 'ppBuy': {
      const c = byKey(a.key); if (!c) return { error: 'Unknown card.' }
      const cost = PP_COST[c.r]; if ((P.pp || 0) < cost) return { error: `You need ${cost} pack points.` }
      P.pp -= cost; giveCard(a.key); P.last = [a.key]; addXP(10)
      return { msg: `Got ${cardName(a.key)} for ${cost} pack points.` }
    }
    case 'wonder': {
      const w = S.wonder.find(w => w.id === a.id); if (!w) return { error: 'That Wonder Pick has gone.' }
      if (P.wonder.charges < 1) return { error: 'No Wonder Pick energy left. It refills every 6 hours.' }
      if (P.wonder.charges >= WONDER_MAX) P.wonder.at = now
      P.wonder.charges--; S.wonder.splice(S.wonder.indexOf(w), 1)
      const keys = w.keys.slice().sort(() => Math.random() - .5), got = keys[0]
      giveCard(got); P.last = [got]; bump('wonder'); addXP(15)
      return { picked: got, keys, msg: `Wonder Pick: ${cardName(got)}!` }
    }
    case 'showcase': { P.showcase = (a.keys || []).filter(k => own(k)).slice(0, 5); return {} }
    case 'team': { if (Array.isArray(a.team) && a.team.length === 6) P.team = a.team.map(k => (k && own(k) ? k : null)); return {} }
    case 'quickSell': {
      const e = own(a.key), c = byKey(a.key); if (!e || !c) return { error: 'You do not own that card.' }
      if (spare(a.key) < 1) return { error: 'That card is in your team. Remove it first.' }
      const got = quickSell(c, e.lvl || 0); P.coins += got; e.n--; if (e.n <= 0) delete P.club.cards[a.key]
      return { msg: `Quick sold for ${got.toLocaleString()} coins.` }
    }
    case 'shred': {
      const list = a.all ? Object.keys(P.club.cards) : [a.key]; let got = 0, cnt = 0
      for (const k of list) { const e = own(k), c = byKey(k); if (!e || !c) continue; const x = Math.min(e.n - 1, spare(k)); if (x < 1) continue; e.n -= x; got += x * SHARD_GET[c.r]; cnt += x }
      if (!cnt) return { error: 'No spare duplicates to shred.' }
      P.shards = (P.shards || 0) + got; return { msg: `Shredded ${cnt} duplicate${cnt > 1 ? 's' : ''} for ${got.toLocaleString()} shards.` }
    }
    case 'craft': {
      const c = byKey(a.key); if (!c) return { error: 'Unknown card.' }
      const cost = SHARD_COST[c.r]; if ((P.shards || 0) < cost) return { error: `You need ${cost.toLocaleString()} shards.` }
      P.shards -= cost; giveCard(a.key); P.last = [a.key]; addXP(10); return { msg: `Crafted ${cardName(a.key)}.` }
    }
    case 'sbc': {
      const q = SBCS.find(x => x.id === a.id); if (!q) return { error: 'Unknown challenge.' }
      const day = Math.floor(Date.now() / 864e5), D = P.sbc && P.sbc.day === day ? P.sbc : (P.sbc = { day, done: {} })
      if ((D.done[q.id] || 0) >= q.per) return { error: 'Done for today. It resets at midnight UTC.' }
      const keys = a.keys || []; if (keys.length !== q.n) return { error: `Needs exactly ${q.n} cards.` }
      const use = {}; for (const k of keys) use[k] = (use[k] || 0) + 1
      for (const k in use) { const c = byKey(k); if (!c || spare(k) < use[k]) return { error: 'You can only use cards you own that are not in your team.' } }
      const cs = keys.map(byKey)
      if (q.minR && cs.some(c => RK(c.r) < RK(q.minR))) return { error: 'Some cards are below the required rarity.' }
      if (q.same && new Set(cs.map(c => c.anime)).size !== 1) return { error: 'All cards must be from the same anime.' }
      if (q.distinct && new Set(cs.map(c => c.anime)).size !== q.n) return { error: 'Every card must be from a different anime.' }
      for (const k in use) { const e = own(k); e.n -= use[k]; if (e.n <= 0) delete P.club.cards[k] }
      D.done[q.id] = (D.done[q.id] || 0) + 1; addXP(25)
      if (q.rw.pack) P.pending[q.rw.pack] = (P.pending[q.rw.pack] || 0) + 1
      if (q.rw.coins) P.coins += q.rw.coins
      if (q.rw.shards) P.shards = (P.shards || 0) + q.rw.shards
      return { msg: `${q.name} complete!`, rw: q.rw }
    }
    case 'awaken': {
      const e = own(a.key); if (!e) return { error: 'You do not own that card.' }
      if ((e.lvl || 0) >= 5) return { error: 'Already fully awakened.' }
      if (e.n < 2) return { error: 'You need a duplicate to awaken this card.' }
      e.n--; e.lvl = (e.lvl || 0) + 1; bump('awakened'); addXP(15); return { msg: `Awakened to ★${e.lvl}. Market value is up; rating and stats stay the same.` }
    }
    case 'list': {
      const e = own(a.key), c = byKey(a.key); if (!e || !c) return { error: 'You do not own that card.' }
      if (spare(a.key) < 1) return { error: 'That card is in your team. Remove it first, or get a duplicate.' }
      const start = Math.round(+a.start / 50) * 50, bin = Math.round(+a.bin / 50) * 50, hours = [1, 3, 6, 12].includes(+a.hours) ? +a.hours : 1
      if (!(start >= 50 && start <= 9999950)) return { error: 'Set a start price between 50 and 9,999,950.' }
      if (!(bin > start && bin <= 9999950)) return { error: 'Buy Now has to be higher than the start price.' }
      if (M.listings.filter(l => l.you).length >= 10) return { error: 'You can have 10 cards on the transfer list at once.' }
      e.n--; const lvl = e.lvl || 0; if (e.n <= 0) delete P.club.cards[a.key]
      M.listings.push({ id: M.seq++, key: a.key, lvl, start, bin, bid: 0, bidder: null, seller: 'YOU', you: true, at: now, exp: now + hours * 3600e3 })
      return { msg: `Listed. Start ${start.toLocaleString()}, Buy Now ${bin.toLocaleString()}, for ${hours}h.` }
    }
    case 'cancel': {
      const l = M.listings.find(l => l.id === a.id && l.you); if (!l) return { error: 'Listing not found.' }
      if (l.bid) return { error: 'Someone has already bid, so this listing cannot be pulled.' }
      M.listings.splice(M.listings.indexOf(l), 1); giveCard(l.key, l.lvl)
      return { msg: 'Listing removed. The card is back in your box.' }
    }
    case 'bid': {
      const l = M.listings.find(l => l.id === a.id); if (!l || l.exp <= now) return { error: 'That auction has ended.' }
      if (l.you) return { error: 'You cannot bid on your own card.' }
      if (l.bidder === 'YOU') return { error: 'You are already the highest bidder.' }
      const amt = Math.round(+a.amount / 50) * 50, min = nextBid(l)
      if (!(amt >= min)) return { error: `The lowest bid allowed is ${min.toLocaleString()}.` }
      if (l.bin && amt >= l.bin) return { error: 'That is the Buy Now price or more. Use Buy Now instead.' }
      if (P.coins < amt) return { error: `You need ${amt.toLocaleString()} coins.` }
      P.coins -= amt; placeBid(l, 'YOU', amt)
      return { msg: `Bid placed: ${amt.toLocaleString()}. Coins are held until you win or get outbid.` }
    }
    case 'buy': {
      const l = M.listings.find(l => l.id === a.id); if (!l || l.exp <= now) return { error: 'Someone else got that one first.' }
      if (l.you) return { error: 'That is your own listing.' }
      if (P.coins < l.bin) return { error: `You need ${l.bin.toLocaleString()} coins.` }
      P.coins -= l.bin; if (l.bidder === 'YOU') P.coins += l.bid
      settle(l, 'bin', 'YOU')
      return { msg: `Bought ${cardName(l.key)} for ${l.bin.toLocaleString()} coins.` }
    }
    case 'pvp': {
      P.battle = P.battle || { cleared: 0, wins: 0, losses: 0 }
      if (a.uid) { const R = (P.rivals = P.rivals || {}), r = R[a.uid] || (R[a.uid] = { name: a.name, w: 0, l: 0 }); r.name = a.name || r.name; a.won ? r.w++ : r.l++ }
      if (!a.won) { P.battle.pvpL = (P.battle.pvpL || 0) + 1; addXP(10); return {} }
      const day = Math.floor(Date.now() / 864e5); if (!P.pvpDay || P.pvpDay.d !== day) P.pvpDay = { d: day, n: 0 }; P.pvpDay.n++
      const pay = P.pvpDay.n <= 3 ? 2500 : 300
      P.battle.pvpW = (P.battle.pvpW || 0) + 1; P.coins += pay; addXP(50)
      return { msg: `You beat ${a.name || 'that player'}'s team! +${pay.toLocaleString()} coins${pay < 2500 ? ' (full rewards for your first 3 PvP wins each day)' : ''}.` }
    }
    case 'battle': {
      // mastery for every fighter in your team
      { const ups = []; for (const k of P.team.filter(Boolean)) { const o = P.club.cards[k]; if (!o) continue; const u = addCardXP(o, a.won ? 60 : 20); if (u) ups.push(cardName(k) + ' Lv ' + o.lv) } if (ups.length) notice('Level up: ' + ups.join(', '), 'ok') }
      if (a.mode === 'raid') {
        const R = raidNow(), Rp = raidP(); if (!R.active) return { error: 'No raid right now.' }; if (Rp.tries >= RAID_TRIES) return { error: 'No raid attempts left today.' }
        Rp.tries++; const dmg = Math.max(0, Math.min(1500000, Math.round(+a.dmg || 0))); Rp.total += dmg; Rp.best = Math.max(Rp.best, dmg); addXP(30)
        const got = []; for (let i = 0; i < RAID_RW.length; i++) { const r = RAID_RW[i]; if (Rp.total >= r.at && !Rp.got.includes(i)) { Rp.got.push(i); if (r.coins) P.coins += r.coins; if (r.pack) P.pending[r.pack] = (P.pending[r.pack] || 0) + 1; if (r.shards) P.shards = (P.shards || 0) + r.shards; if (r.tickets) P.tickets = (P.tickets || 0) + r.tickets; got.push(r.label) } }
        return { msg: 'Raid hit for ' + dmg.toLocaleString() + ' damage!' + (got.length ? ' Unlocked: ' + got.join(', ') + '.' : ''), raidTotal: Rp.total }
      }
      if (a.mode === 'boss') {
        const Bo = bossP(), BD = bossToday(); if (Bo.tries >= BOSS_TRIES) return { error: 'No boss attempts left today.' }
        Bo.tries++; const dmg = Math.max(0, Math.min(2e6, Math.round(+a.dmg || 0))); Bo.total += dmg; const prev = Bo.best; Bo.best = Math.max(Bo.best, dmg); P.bossBestEver = Math.max(P.bossBestEver || 0, dmg); addXP(30)
        const got = []; for (let i = 0; i < BOSS_RW.length; i++) { const r = BOSS_RW[i]; if (Bo.best >= r.at && !Bo.got.includes(i)) { Bo.got.push(i); if (r.coins) P.coins += r.coins; if (r.shards) P.shards = (P.shards || 0) + r.shards; if (r.pack) P.pending[r.pack] = (P.pending[r.pack] || 0) + 1; got.push(r.label) } }
        return { msg: `${dmg.toLocaleString()} damage to the boss${dmg > prev ? ' · NEW BEST' : ''}${got.length ? ' · Unlocked: ' + got.join(', ') : ''}` }
      }
      if (a.mode === 'ranked') {
        const R = rankP(), before = rankOf(R.pts)
        if (a.won) { R.w++; R.streak = Math.max(1, R.streak + 1); const gain = 30 + Math.min(20, (R.streak - 1) * 5); R.pts += gain; P.coins += 400; addXP(35); const now = rankOf(R.pts); R.best = Math.max(R.best, now)
          return { msg: `Ranked win! +${gain} points${R.streak > 1 ? ' (' + R.streak + ' win streak)' : ''}${now > before ? ' · PROMOTED TO ' + RANKS[now].name.toUpperCase() : ''} · +400 coins`, rank: { gain, promo: now > before } } }
        R.l++; R.streak = 0; const floor = RANKS[before].at, loss = 20; R.pts = Math.max(floor, R.pts - loss); addXP(10)
        return { msg: `Ranked loss. -${loss} points (you can't drop below ${RANKS[before].name}).`, rank: { gain: -loss } }
      }
      if (a.mode === 'tower') {
        P.tower = P.tower || { best: 0 }; const n = +a.id; if (n !== P.tower.best + 1 && !(n <= P.tower.best)) return { error: 'Floor locked.' }
        if (!a.won) { addXP(10); return {} }
        const T = towerFloor(n), first = n > P.tower.best; addXP(first ? 50 : 15)
        if (!first) { P.coins += 200; return { msg: 'Floor ' + n + ' replayed. +200 coins.' } }
        P.tower.best = n; P.coins += T.coins; if (T.pack) P.pending[T.pack] = (P.pending[T.pack] || 0) + 1
        return { msg: `Floor ${n} cleared! +${T.coins.toLocaleString()} coins${T.pack ? ' and a ' + PACKS[T.pack].name : ''}.` }
      }
      if (a.mode === 'camp') {
        const hard = String(a.id).startsWith('H'), [ci, si] = String(a.id).replace(/^H/, '').split(':').map(Number), ch = CAMPAIGN.find(c => c.id === ci), st = ch && ch.stages.find(s => s.n === si); if (!st) return { error: 'Unknown stage.' }
        const C = campP()
        if (hard) { // HARD MODE: unlocked by beating the normal boss; double rewards
          const key = 'H' + ci + ':' + si, open = (C.stars[ci + ':6'] || 0) > 0 && (si === 1 || (C.stars['H' + ci + ':' + (si - 1)] || 0) > 0); if (!open) return { error: 'Hard stage locked.' }
          if (!a.won) { addXP(15); return {} }
          const got = 1 + ((a.ko || 0) <= 1 ? 1 : 0) + ((a.turns || 99) <= 12 ? 1 : 0), had = C.stars[key] || 0; C.stars[key] = Math.max(had, got); addXP(had ? 30 : 100)
          if (had) { P.coins += 600; return { msg: '★'.repeat(got) + ' Hard stage replayed. +600 coins.' } }
          P.coins += st.coins * 2; let extra = ''
          if (st.boss) { P.pending.premium = (P.pending.premium || 0) + 2; P.shards = (P.shards || 0) + 3000; P.tickets = (P.tickets || 0) + 5; extra = ', 2 Premium Drops, ◆3,000 shards and 5 Training Tickets' }
          return { msg: `HARD ${'★'.repeat(got)} ${st.name} cleared! +${(st.coins * 2).toLocaleString()} coins${extra}.` }
        }
        const key = ci + ':' + si, prev = si === 1 ? (ci === 1 || (C.stars[(ci - 1) + ':6'] || 0) > 0) : (C.stars[ci + ':' + (si - 1)] || 0) > 0; if (!prev) return { error: 'Stage locked.' }
        if (!a.won) { addXP(10); return {} }
        const got = 1 + ((a.ko || 0) <= 1 ? 1 : 0) + ((a.turns || 99) <= 12 ? 1 : 0), had = C.stars[key] || 0; C.stars[key] = Math.max(had, got); addXP(had ? 20 : 60)
        if (had) { P.coins += 300; return { msg: '★'.repeat(got) + ' Stage replayed. +300 coins.' } }
        P.coins += st.coins; let extra = ''
        if (st.boss) { giveCard(ch.boss); P.last = [ch.boss]; P.pending.premium = (P.pending.premium || 0) + 1; extra = ', ' + cardName(ch.boss) + ' and a Premium Drop' }
        return { msg: `${'★'.repeat(got)} ${st.name} cleared! +${st.coins.toLocaleString()} coins${extra}.` }
      }
      if (a.mode === 'arc') {
        const [id, ch] = String(a.id).split(':'), arc = ARCS.find(x => x.id === id), c = +ch; if (!arc || !ARC_CH[c]) return { error: 'Unknown chapter.' }
        const A = (P.arcs = P.arcs || {}), done = A[id] || 0; if (c > done) return { error: 'Chapter locked.' }
        if (!a.won) { addXP(10); return {} }
        addXP(40); if (c < done) { P.coins += 300; return { msg: 'Chapter replayed. +300 coins.' } }
        A[id] = c + 1; P.coins += ARC_CH[c].coins; let extra = ''
        if (c === 2) { P.pending.premium = (P.pending.premium || 0) + 1; P.shards = (P.shards || 0) + 1000; extra = ', a Premium Drop and ◆1,000 shards' }
        return { msg: `${arc.name}: ${ARC_CH[c].name} cleared! +${ARC_CH[c].coins.toLocaleString()} coins${extra}.` }
      }
      if (a.mode === 'event') {
        const E = eventNow(), t = +a.id, T = E.tiers[t]; if (!T) return { error: 'Unknown event fight.' }
        const day = Math.floor(Date.now() / 864e5), D = P.ev && P.ev.day === day ? P.ev : (P.ev = { day, done: {} })
        if (!a.won) { addXP(10); return {} }
        addXP(40); if (D.done[t]) { P.coins += 200; return { msg: 'Already claimed today. +200 coins.' } }
        D.done[t] = 1; P.coins += T.coins; if (T.pack) P.pending[E.pack] = (P.pending[E.pack] || 0) + 1
        return { msg: `${T.name} cleared! +${T.coins.toLocaleString()} coins${T.pack ? ' and a ' + PACKS[E.pack].name : ''}.` }
      }
      const STG = [0, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7500, 10000, 15000], PK = { 5: 'standard', 8: 'premium', 10: 'premium' }
      const n = +a.stage; if (!(n >= 1 && n <= 10)) return { error: 'Unknown stage.' }
      P.battle = P.battle || { cleared: 0, wins: 0, losses: 0 }
      if (!a.won) { P.battle.losses++; addXP(10); return {} }
      if (n > P.battle.cleared + 1) return { error: 'Stage is locked.' }
      P.battle.wins++
      const first = n > P.battle.cleared, coins = first ? STG[n] : Math.round(STG[n] / 3 / 50) * 50
      P.coins += coins; addXP(first ? 60 : 30)
      let extra = ''
      if (first) { P.battle.cleared = n; if (PK[n]) { P.pending[PK[n]] = (P.pending[PK[n]] || 0) + 1; extra = ` and a ${PK[n] === 'premium' ? 'Premium' : 'Legends'} pack` } }
      return { msg: `Stage ${n} ${first ? 'cleared' : 'won'}! +${coins.toLocaleString()} coins${extra}.` }
    }
    case 'train': { const o = P.club.cards[a.key]; if (!o) return { error: 'You do not own that card.' }; if ((o.lv || 1) >= LV_MAX) return { error: 'Already Lv 100.' }
      if (a.with === 'ticket') { if ((P.tickets || 0) < 1) return { error: 'No Training Tickets.' }; P.tickets--; const u = addCardXP(o, 400); return { msg: '+400 XP' + (u ? ' · Lv ' + o.lv : '') } }
      if (P.coins < 2000) return { error: 'You need 2,000 coins.' }; P.coins -= 2000; const u = addCardXP(o, 250); return { msg: '+250 XP' + (u ? ' · Lv ' + o.lv : '') } }
    case 'loginClaim': {
      const { L, d, can, next } = loginP(); if (!can) return { error: 'Already claimed today. Come back tomorrow!' }
      const R = LOGIN_RW[next]; L.last = d; L.streak++
      if (R.coins) P.coins += R.coins; if (R.shards) P.shards = (P.shards || 0) + R.shards; if (R.pack) P.pending[R.pack] = (P.pending[R.pack] || 0) + 1
      P.tickets = (P.tickets || 0) + 1; addXP(20); return { msg: `Day ${next + 1} reward claimed! +1 Training Ticket`, rw: R }
    }
    case 'tradeEscrow': { if (P.allBak) return { error: 'Trading is off while the temporary all-cards unlock is on.' } }
    // falls through
    case 'tradeEscrow_': {
      const offer = a.offer || [], coins = Math.max(0, Math.round(+a.coins || 0)); if (P.coins < coins) return { error: 'Not enough coins.' }
      const use = {}; for (const k of offer) use[k] = (use[k] || 0) + 1
      for (const k in use) if (spare(k) < use[k]) return { error: 'You can only offer cards you own that are not in your team.' }
      for (const k in use) { const o = own(k); o.n -= use[k]; if (o.n <= 0) delete P.club.cards[k] } P.coins -= coins; return {}
    }
    case 'tradeRefund': { for (const k of a.offer || []) if (byKey(k)) giveCard(k); P.coins += Math.max(0, Math.round(+a.coins || 0)); return { msg: 'A trade request was declined. Your offer was returned.' } }
    case 'tradeGive': {
      if (spare(a.key) < 1) return { error: "You don't have a spare copy of that card (it may be your last or in your team)." }
      const o = own(a.key); o.n--; if (o.n <= 0) delete P.club.cards[a.key]
      for (const k of a.offer || []) if (byKey(k)) giveCard(k); P.coins += Math.max(0, Math.round(+a.coins || 0)); addXP(20)
      return { msg: 'Trade complete!' }
    }
    case 'tradeReceive': { if (byKey(a.key)) giveCard(a.key); P.last = [a.key]; addXP(20); return { msg: `Trade complete! You got ${cardName(a.key)}.` } }
    case 'passBuy': { const S2 = passP(); if (S2.prem) return { error: 'Already unlocked.' }; if (P.coins < PASS_COST) return { error: `You need ${PASS_COST.toLocaleString()} coins.` }; P.coins -= PASS_COST; S2.prem = true; return { msg: 'Premium Pass unlocked!' } }
    case 'passClaim': {
      const S2 = passP(), t = +a.tier, tr = a.track === 'p' ? 'p' : 'f'; if (!(t >= 1 && t <= PASS_TIERS)) return { error: 'Unknown tier.' }
      if (Math.floor(S2.xp / PASS_TIER) < t) return { error: 'Tier not reached yet.' }; if (tr === 'p' && !S2.prem) return { error: 'Unlock the Premium Pass first.' }
      if (S2[tr].includes(t)) return { error: 'Already claimed.' }
      const R = passReward(tr, t)
      if (R.card) { giveCard(R.card); P.last = [R.card] }
      if (R.cos) { const cs = P.cos || (P.cos = []); if (!cs.includes(R.cos)) cs.push(R.cos); const ty = COSMETICS[R.cos].type, eq = P.eq || (P.eq = {}); if (!eq[ty]) eq[ty] = R.cos }
      if (R.pick) { const c = byKey(a.key); if (!c || c.r !== R.pick) return { error: 'Pick a ' + (R.pick === 'M' ? 'Mythic' : 'Legendary') + ' card.' }; giveCard(a.key); P.last = [a.key] }
      S2[tr].push(t); if (R.coins) P.coins += R.coins; if (R.shards) P.shards = (P.shards || 0) + R.shards; if (R.pack) P.pending[R.pack] = (P.pending[R.pack] || 0) + 1
      return { msg: 'Claimed: ' + (R.pick ? cardName(a.key) : R.label), rw: R }
    }
    case 'achClaim': {
      const x = achList().find(z => z.id === a.id)
      if (!x) return { error: 'Unknown achievement.' }; if (!x.done) return { error: 'Not done yet.' }; if (x.claimed) return { error: 'Already claimed.' }
      ;(P.ach = P.ach || {})[x.id] = Date.now(); const R = x.rw
      if (R.coins) P.coins += R.coins; if (R.shards) P.shards = (P.shards || 0) + R.shards; if (R.pack) P.pending[R.pack] = (P.pending[R.pack] || 0) + 1
      if (R.title) { const id = 'title_ach_' + x.id; (P.cos = P.cos || []).includes(id) || P.cos.push(id) }
      addXP(30); return { msg: `Achievement: ${x.name}!${R.title ? ' New title: ' + R.title : ''}`, rw: R }
    }
    case 'evolve': {
      const c = byKey(a.key), t = byKey(a.to); if (!c || !t) return { error: 'Unknown card.' }
      if (!evoNext(a.key).includes(a.to)) return { error: 'That is not the next form.' }
      const need = EVO_COPIES[c.r] || 1, cost = evoShards(a.to), m = mastLv((P.mast || {})[a.key] || 0) - 1
      if (spare(a.key) < need) return { error: `You need ${need} spare cop${need > 1 ? 'ies' : 'y'} of ${c.name} (not in your team).` }
      if ((P.shards || 0) < cost) return { error: `You need ◆${cost.toLocaleString()} shards.` }
      if (m < 1) return { error: 'Reach Mastery 1 with this card first (win battles with it in your team).' }
      const o = own(a.key); o.n -= need; if (o.n <= 0) delete P.club.cards[a.key]
      P.shards -= cost; giveCard(a.to); P.last = [a.to]; bump('evolve'); addXP(40)
      return { msg: `${c.name} evolved into ${t.ver}!`, to: a.to }
    }
    case 'gacha': {
      if (P.coins < GACHA_COST) return { error: 'You need 1,000 coins.' }
      P.coins -= GACHA_COST; let t = Math.random() * GACHA.reduce((n, g) => n + g.w, 0), g = GACHA[0]; for (const x of GACHA) if ((t -= x.w) < 0) { g = x; break }
      const R = { ...g }
      if (g.coins) P.coins += g.coins; if (g.shards) P.shards = (P.shards || 0) + g.shards; if (g.pack) P.pending[g.pack] = (P.pending[g.pack] || 0) + 1
      if (g.cos) { const cs = P.cos || (P.cos = []); if (cs.includes(g.cos)) { P.coins += 2000; R.label += ' (duplicate → 2,000 coins)' } else cs.push(g.cos) }
      if (g.card) { const L = CARDS.filter(c => !c.season && c.r === g.card), c = L[Math.floor(Math.random() * L.length)]; giveCard(c.key); P.last = [c.key]; R.key = c.key; R.label = c.name + ' · ' + c.ver }
      bump('gacha'); addXP(5); return { prize: R }
    }
    case 'fuse': {
      const r = fusionRecipes().find(x => x.out === a.out); if (!r) return { error: 'Unknown fusion.' }
      const ca = byKey(a.ka), cb = byKey(a.kb); if (!ca || !cb || ca.name !== r.a || cb.name !== r.b) return { error: 'Wrong cards for this fusion.' }
      if (RK(ca.r) < r.min || RK(cb.r) < r.min) return { error: 'Those cards are too low a rarity for this fusion.' }
      if (spare(a.ka) < 1 || spare(a.kb) < 1) return { error: 'Both cards need a spare copy (not in your team).' }
      if ((P.shards || 0) < r.cost) return { error: `You need ◆${r.cost.toLocaleString()} shards.` }
      for (const k of [a.ka, a.kb]) { const o = own(k); o.n--; if (o.n <= 0) delete P.club.cards[k] }
      P.shards -= r.cost; giveCard(r.out); P.last = [r.out]; bump('fuse'); addXP(40)
      return { msg: `Fusion complete: ${cardName(r.out)}!` }
    }
    case 'deckSave': { deckP(); P.deckEdited = 1; const i = +a.i; if (!(i >= 0 && i < 3)) return { error: 'Bad slot.' }; const er = deckOk(a.c); if (er) return { error: er }; P.decks[i] = { name: String(a.name || 'Deck ' + (i + 1)).slice(0, 20), c: { ...a.c } }; if (a.use) P.deckOn = i; return { msg: 'Deck saved' + (a.use ? ' and equipped.' : '.') } }
    case 'deckUse': { deckP(); const i = +a.i; if (!(i >= 0 && i < 3)) return { error: 'Bad slot.' }; P.deckOn = i; return {} }
    case 'guideSeen': { P.guideSeen = 1; return {} }
    case 'onbClaim': {
      const L = onboarding(), x = L.find(o => o.id === a.id); if (!x || !x.ok || x.claimed) return { error: 'Not ready yet.' }
      ;(P.onb = P.onb || {})[x.id] = 1; P.coins += x.rw; addXP(20)
      if (L.every(o => o.claimed || o.id === x.id)) { P.pending.premium = (P.pending.premium || 0) + 1; return { msg: 'All done! +' + x.rw.toLocaleString() + ' coins and a Premium Drop for finishing Getting Started.' } }
      return { msg: '+' + x.rw.toLocaleString() + ' coins' }
    }
    case 'campChest': { const C = campP(), ci = +a.c || 1, ii = +a.i, i = ci === 1 ? ii : ci * 10 + ii, R = CAMP_CHEST[ii]; if (!R) return { error: 'Unknown chest.' }; const tot = Object.entries(C.stars).filter(([k]) => k.startsWith(ci + ':')).reduce((n, [, v]) => n + v, 0); if (tot < R.at) return { error: 'Need ' + R.at + ' stars.' }; if (C.chests.includes(i)) return { error: 'Already opened.' }
      C.chests.push(i); let bonus = ''; if (ci === 3 && ii === 1) { giveCard('Story/ab4c25df0a27d36e85485d0a795650ad.jpg'); P.last = ['Story/ab4c25df0a27d36e85485d0a795650ad.jpg']; bonus = ' WHIS joins your club!' } P.coins += R.coins; if (R.pack) P.pending[R.pack] = (P.pending[R.pack] || 0) + 1; if (R.shards) P.shards = (P.shards || 0) + R.shards; return { msg: 'Chest opened: +' + R.coins.toLocaleString() + ' coins and a ' + PACKS[R.pack].name + (R.shards ? ' and ◆' + R.shards.toLocaleString() + ' shards' : '') + '.' + bonus } }
    case 'awk': {
      const c = byKey(a.key), o = c && P.club.cards[a.key], N = AWK.find(n => n.id === a.node); if (!o || !N) return { error: 'Unknown card or node.' }
      const have = o.awk || (o.awk = []); if (have.includes(N.id)) return { error: 'Already unlocked.' }
      const req = N.req ? [].concat(N.req) : []; if (req.some(r => !have.includes(r))) return { error: 'Unlock the nodes below it first.' }
      const sh = N.sh * AWK_SH[c.r], inTeam = P.team.includes(a.key) ? 1 : 0
      if (o.n - 1 < N.dup) return { error: 'Needs ' + N.dup + ' duplicate' + (N.dup > 1 ? 's' : '') + ' (you have ' + (o.n - 1) + ').' }
      if ((P.shards || 0) < sh) return { error: 'Needs ◆' + sh.toLocaleString() + ' shards.' }
      o.n -= N.dup; P.shards -= sh; have.push(N.id); addXP(15)
      return { msg: N.id === 'aw' ? c.name + ' is fully AWAKENED!' : N.name + ' unlocked for ' + c.name + '.' }
    }
    case 'teamPreset': { const i = +a.i; if (!(i >= 0 && i < 3) || !Array.isArray(a.team)) return { error: 'Bad preset.' }; const L = P.presets || (P.presets = []); L[i] = { name: String(a.name || 'Team').slice(0, 18), team: a.team.slice(0, 6).map(k => (k && P.club.cards[k] ? k : null)) }; return { msg: 'Saved ' + L[i].name + '.' } }
    case 'raidWin': { const Rp = raidP(); if (!Rp.total) return { error: 'Hit the raid boss at least once to share the victory.' }; if (Rp.win) return { error: 'Already claimed.' }; if (!(a.globalDown)) return { error: 'The boss is still standing!' }
      Rp.win = 1; P.pending.premium = (P.pending.premium || 0) + 2; P.coins += 20000; P.tickets = (P.tickets || 0) + 5; return { msg: 'RAID VICTORY! +2 Premium Drops, 20,000 coins and 5 Training Tickets.' } }
    case 'avatar': { if (a.key && !own(a.key)) return { error: 'You need to own that card.' }; P.avatar = a.key || null; return {} }
    case 'equip': {
      const ty = a.slot; if (!['frame', 'title', 'border', 'opener'].includes(ty)) return { error: 'Unknown slot.' }
      if (a.id && !(P.cos || []).includes(a.id)) return { error: 'You have not unlocked that yet.' }
      ;(P.eq = P.eq || {})[ty] = a.id || null; return {}
    }
    case 'claim': {
      const r = rewards().find(r => r.id === a.id); if (!r) return { error: 'Reward not found.' }
      if (!r.done) return { error: 'Not finished yet.' }; if (r.claimed) return { error: 'Already claimed.' }
      P.claimed[r.id] = now; P.coins += r.coins; addXP(25); return { msg: `+${r.coins.toLocaleString()} coins.` }
    }
  }
  return { error: 'Unknown action.' }
}
const levelOf = xp => { let lv = 1, need = 100, x = xp; while (x >= need) { x -= need; lv++; need = Math.round(need * 1.15) } return { lv, cur: x, need } }
function state() {
  rollFree()
  const P = S.profile
  const out = {
    profile: P, notices: S.notices, packs: PACKS, banner: banner(), light: (() => { P.light = P.light || { n: LIGHT_MAX, at: Date.now() }; rollCharge2(P.light); return { n: P.light.n, max: LIGHT_MAX, next: P.light.n >= LIGHT_MAX ? 0 : P.light.at + LIGHT_EVERY } })(), rewards: rewards(), quick: {}, values: {}, level: levelOf(P.xp || 0), ppCost: PP_COST, shardGet: SHARD_GET, shardCost: SHARD_COST, sbcs: SBCS.map(q => ({ ...q, left: q.per - (P.sbc && P.sbc.day === Math.floor(Date.now() / 864e5) ? P.sbc.done[q.id] || 0 : 0) })),
    free: { charges: P.free.charges, max: FREE_MAX, next: P.free.charges >= FREE_MAX ? 0 : P.free.at + FREE_EVERY, every: FREE_EVERY },
    wonderE: { charges: P.wonder.charges, max: WONDER_MAX, next: P.wonder.charges >= WONDER_MAX ? 0 : P.wonder.at + WONDER_EVERY },
    wonder: S.wonder, now: Date.now(),
    cos: { ...COSMETICS, ...Object.fromEntries(achList().filter(x => x.rw.title).map(x => ['title_ach_' + x.id, { type: 'title', name: x.rw.title, d: 'Achievement: ' + x.name }])) }, ach: achList(), pass: (() => { const S2 = passP(); return { ...S2, theme: theme(), shown: seasonShown(), seasonCards: seasonCards().map(c => c.key), tier: Math.min(PASS_TIERS, Math.floor(S2.xp / PASS_TIER)), into: S2.xp % PASS_TIER, per: PASS_TIER, max: PASS_TIERS, cost: PASS_COST, ends: (seasonNo() + 1) * 28 * 864e5, rw: Array.from({ length: PASS_TIERS }, (_, i) => [passReward('f', i + 1), passReward('p', i + 1)]) } })(),
    ranked: (() => { const R = rankP(), i = rankOf(R.pts); return { ...R, tier: i, ranks: RANKS, ends: (seasonNo() + 1) * 28 * 864e5 } })(),
    boss: (() => { const BD = bossToday(); return BD ? { ...BD, me: bossP() } : null })(),
    login: (() => { const { L, can, next } = loginP(); return { streak: L.streak, can, next, rw: LOGIN_RW } })(),
    evo: Object.fromEntries(cards().map(c => [c.key, evoNext(c.key)]).filter(x => x[1].length)), evoCopies: EVO_COPIES, evoCost: Object.fromEntries(cards().map(c => [c.key, Math.round(SHARD_COST[c.r] * .4)])),
    fusion: fusionRecipes(), gachaCost: GACHA_COST, gachaPool: GACHA.map(g => ({ label: g.label, rare: !!g.rare, w: g.w })),
    items: itemsP(), itemDefs: ITEMS, itemMax: ITEM_MAX,
    decks: deckP(), deckOn: S.profile.deckOn || 0, deckMax: DECK_MAX, deckSize: DECK_SIZE, starterDecks: STARTER_DECKS,
    onb: onboarding(),
    raid: { ...raidNow(), me: raidP() },
    presets: S.profile.presets || [],
    awkT: AWK, awkSh: AWK_SH, tickets: S.profile.tickets || 0, lvNeed: Array.from({ length: 101 }, (_, l) => lvNeed(l)),
    camp: CAMPAIGN, campP: campP(), campChest: CAMP_CHEST,
    mastT: MAST, tower: Array.from({ length: 50 }, (_, i) => towerFloor(i + 1)), arcs: ARCS, arcCh: ARC_CH, event: (() => { const E = eventNow(), day = Math.floor(Date.now() / 864e5); return { ...E, done: P.ev && P.ev.day === day ? P.ev.done : {} } })()
  }
  for (const c of cards()) { const e = P.club.cards[c.key]; out.values[c.key] = Math.round(value(c, e ? e.lvl || 0 : 0) * (e ? serMult(c.key) : 1)); if (e) out.quick[c.key] = quickSell(c, e.lvl || 0) }
  return JSON.parse(JSON.stringify(out))
}
function market() {
  const now = Date.now(), M = S.market
  return JSON.parse(JSON.stringify({ now, listings: M.listings.filter(l => l.exp > now && byKey(l.key)).map(l => ({ ...l, next: nextBid(l), value: value(byKey(l.key), l.lvl) })), history: M.history, won: M.won || [] }))
}

// ---------------- boot ----------------
function bootError(e) {
  const o = document.createElement('div'); o.style.cssText = 'position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:20px;background:#0b0a12;color:#fff;font:700 15px Nunito,sans-serif;text-align:center'
  o.innerHTML = '<div style="max-width:460px"><div style="font:italic 900 34px Sofia Sans Extra Condensed,sans-serif;color:#ff7a85">COULD NOT LOAD YOUR CLUB</div><p style="opacity:.75">Screenshot this and send it to Claude.</p><pre style="white-space:pre-wrap;text-align:left;background:#1a1726;padding:12px;border-radius:10px;font-size:12px"></pre><button style="margin-top:10px;padding:12px 22px;border:0;border-radius:10px;font:900 16px Nunito;cursor:pointer">RETRY</button></div>'
  o.querySelector('pre').textContent = (e && (e.code ? e.code + ': ' : '') + (e.message || e)) + ''
  o.querySelector('button').onclick = () => location.reload()
  document.body.append(o)
}
const ready = (async () => { try { await boot() } catch (e) { console.error(e); bootError(e); throw e } })()
async function boot() {
  CARDS = await (await fetch('cards-list.json', { cache: 'no-cache' })).json()
  const who = await initAccount(CFG); LS_SAVE = 'aut-save-v3-' + who.uid
  let local = null; try { local = JSON.parse(localStorage.getItem(LS_SAVE)) } catch { }
  let cloud = null
  try { const row = await cloudLoad(); cloud = row && row.data; setSync('ok') } catch { setSync('err') }
  // first login: bring over the old save from before accounts existed (only if this account has nothing yet)
  if (!cloud && !local) { const old = await legacySave(); if (old) { cloud = old; try { localStorage.removeItem('aut-key') } catch { } } }
  // newest save wins (cloud vs this device)
  S = cloud && (!local || (cloud.savedAt || 0) >= (local.savedAt || 0)) ? cloud : (local || fresh())
  const f = fresh(); S.profile = { ...f.profile, ...S.profile };
  { const P = S.profile; if (P.allBak) { P.club.cards = P.allBak; delete P.allBak } }
  { const g = new URLSearchParams(location.search).get('gift'), P = S.profile; if (g === '7325c9533d65' && Date.now() < 1795368062184 && !(P.gifts || {})[g]) { (P.gifts = P.gifts || {})[g] = 1; P.coins += 10000000; S.savedAt = Date.now(); setTimeout(save, 500) } if (g) history.replaceState(null, '', location.pathname) }
  try { const S2 = passP(), m = freeCardTiers(), reached = Math.floor(S2.xp / PASS_TIER); for (const [t, k] of Object.entries(m)) if ((S2.f.includes(+t) || reached >= +t && S2.f.length) && !S.profile.club.cards[k] && S2.f.includes(+t)) giveCard(k) } catch (x) { console.warn(x) }
  S.market = { ...f.market, ...S.market }; S.notices = S.notices || []; S.wonder = S.wonder || []
  for (const [k, o] of Object.entries(S.profile.club.cards)) if (!o.ser && byKey(k)) o.ser = rollSerial(k)
  { const P = S.profile, o = P.club.cards['Mythic/imu.jpg']; if (o) { const n = (o.n || 1) + Math.max(0, (o.dia || 3) - 3), sh = 4000 * n; P.shards = (P.shards || 0) + sh; delete P.club.cards['Mythic/imu.jpg']; P.team = P.team.map(k => k === 'Mythic/imu.jpg' ? null : k); notice('Mythic Imu was retired. You got ◆' + sh.toLocaleString() + ' shards.', 'ok') } }
  if (!S.profile.prog2) { const P = S.profile; let refund = 0
    for (const [k, o] of Object.entries(P.club.cards)) { const c = byKey(k), awk = o.awk || []
      if (c) for (const id of awk) { const N = AWK.find(x => x.id === id); if (N) refund += N.sh * (AWK_SH[c.r] || 0) }
      const total = 3 + Math.max(0, (o.n || 1) - 1) + (o.lvl || 0) + awk.length
      o.dia = Math.min(7, total); o.n = 1 + Math.max(0, total - 7); o.lvl = 0; delete o.awk; o.asc = 0
      o.lv = 1; o.xp = 0; addCardXP(o, Math.round(((P.mast || {})[k] || 0) * 2.4)) }
    P.shards = (P.shards || 0) + refund; P.tickets = (P.tickets || 0) + 5; P.prog2 = 1; S.savedAt = Date.now()
    notice('Cards upgraded to the new Diamond system!' + (refund ? ' Refunded ◆' + refund.toLocaleString() + ' shards from Awakening.' : '') + ' +5 Training Tickets.', 'ok') }
  // cards moved between rarity folders get a new key (folder/file); re-link everything by file name
  { const byFile = {}, dup = new Set(); for (const c of CARDS) { const f = c.key.split('/').pop(); if (byFile[f]) dup.add(f); byFile[f] = c.key } for (const f of dup) delete byFile[f]
    const ALIAS = { 'Common/jolyne.jpg': 'Epic/jolyne 5.jpg', 'Epic/jolyne.jpg': 'Uncommon/jolyne.jpg', 'Legendary/dabi.jpg': 'Legendary/dabi 5.jpg', 'Uncommon/dabi.jpg': 'Rare/dabi.jpg' }
    const fix = k => (k && !byKey(k) && (ALIAS[k] || byFile[k.split('/').pop()])) || k, P = S.profile, cc = {}
    for (const [k, e] of Object.entries(P.club.cards)) { const nk = fix(k); if (cc[nk]) { cc[nk].n += e.n; cc[nk].lvl = Math.max(cc[nk].lvl || 0, e.lvl || 0) } else cc[nk] = e }
    P.club.cards = cc; P.team = P.team.map(fix); P.showcase = (P.showcase || []).map(fix); P.last = (P.last || []).map(fix)
    for (const l of S.market.listings) l.key = fix(l.key)
    for (const w of S.wonder) w.keys = w.keys.map(fix)
    S.market.won = (S.market.won || []).map(w => ({ ...w, key: fix(w.key) })) }
  if (!S.market.listings.length) { for (let i = 0; i < 15; i++) tick(true) } else tick(true)
  save(); publish(summary(), true)
  setInterval(() => tick(), 10000)
  // pull fresh cloud data when coming back to the tab (e.g. played on the other device)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !SB) return
    try { const row = await cloudLoad(); if (row && row.data && (row.data.savedAt || 0) > (S.savedAt || 0)) { S = row.data; location.reload() } } catch { }
  })
}

// ---------------- answer the app's /api calls ----------------
const realFetch = window.fetch.bind(window)
const reply = o => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } })
window.fetch = async (input, init = {}) => {
  const u = typeof input === 'string' ? input : input.url
  const p = new URL(u, location.href).pathname
  const m = p.match(/\/api\/(cards|state|market|act)$/)
  if (!m) return realFetch(input, init)
  await ready
  if (m[1] === 'cards') return reply(CARDS)
  if (m[1] === 'state') { const s = state(); S.notices = []; save(); return reply(s) }
  if (m[1] === 'market') return reply(market())
  let a = {}; try { a = JSON.parse(init.body || '{}') } catch { }
  const r = act(a); save(); return reply({ ...r, state: state() })
}
window.AUT_ENGINE = { ready, get save() { return S }, cloud: !!SB }
