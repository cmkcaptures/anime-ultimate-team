// Anime Ultimate Team — in-browser game engine.
// Replaces serve.js: same rules, same actions. The save lives in Supabase (one row), with a localStorage copy.
// It answers the app's existing fetch('/api/...') calls, so app.js did not need rewriting.
const CFG = window.AUT_CONFIG || {}
import { initAccount, loadSave, storeSave, publish, me } from './account.js?v=mwp5q71a'
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
const giveCard0 = (k, lvl = 0) => { const now = Date.now(), e = S.profile.club.cards[k] || (S.profile.club.cards[k] = { n: 0, first: now, lvl: 0 }); e.n++; e.last = now; e.lvl = Math.max(e.lvl || 0, lvl || 0); return e }
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
function bossP() { const P = S.profile, d = Math.floor(Date.now() / 864e5); if (!P.boss || P.boss.day !== d) P.boss = { day: d, tries: 0, best: 0, total: 0, got: [] }; return P.boss }
// ---------- LOGIN STREAK ----------
const LOGIN_RW = [{ coins: 1000 }, { coins: 1500 }, { pack: 'silver' }, { coins: 2500 }, { shards: 300 }, { pack: 'standard' }, { pack: 'premium' }]
function loginP() { const P = S.profile, d = Math.floor(Date.now() / 864e5); if (!P.login) P.login = { last: 0, streak: 0 }; const L = P.login; if (L.last && d - L.last > 1) L.streak = 0; return { L, d, can: L.last !== d, next: L.last !== d ? (L.streak % 7) : ((L.streak - 1) % 7) } }
// ---------- ACHIEVEMENTS ----------
const ANIME_NAMES = { PKM: 'Pokémon', DBZ: 'Dragon Ball', NAR: 'Naruto', JJK: 'Jujutsu Kaisen', OP: 'One Piece', MHA: 'Hero Academia', BC: 'Black Clover', DS: 'Demon Slayer', BL: 'Blue Lock', JJBA: 'JoJo', HXH: 'Hunter x Hunter', BLE: 'Bleach', CSM: 'Chainsaw Man', FT: 'Fairy Tail', FF: 'Fire Force', YGO: 'Yu-Gi-Oh!', TG: 'Tokyo Ghoul' }
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
const NAMES = { PKM: 'Pokémon', DBZ: 'Dragon Ball', NAR: 'Naruto', JJK: 'Jujutsu Kaisen', OP: 'One Piece', MHA: 'My Hero Academia', BC: 'Black Clover', DS: 'Demon Slayer', BL: 'Blue Lock', HXH: 'Hunter x Hunter', FT: 'Fairy Tail', CSM: 'Chainsaw Man', JJBA: 'JoJo', TG: 'Tokyo Ghoul', BLE: 'Bleach', K8: 'Kaiju No. 8', MOB: 'Mob Psycho 100', FF: 'Fire Force', OPM: 'One Punch Man', KGB: 'Kagurabachi', YGO: 'Yu-Gi-Oh!', DAN: 'Dandadan', SL: 'Solo Leveling' }
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
      { const M = P.mast || (P.mast = {}); const ups = []; for (const k of P.team.filter(Boolean)) { const before = mastLv(M[k] || 0); M[k] = (M[k] || 0) + (a.won ? 25 : 10); const after = mastLv(M[k]); for (let l = before + 1; l <= after; l++) { if (MAST_RW[l - 1]) P.coins += MAST_RW[l - 1]; ups.push(cardName(k) + ' Mastery ' + l) } } if (ups.length) notice('Mastery up: ' + ups.join(', '), 'ok') }
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
    case 'loginClaim': {
      const { L, d, can, next } = loginP(); if (!can) return { error: 'Already claimed today. Come back tomorrow!' }
      const R = LOGIN_RW[next]; L.last = d; L.streak++
      if (R.coins) P.coins += R.coins; if (R.shards) P.shards = (P.shards || 0) + R.shards; if (R.pack) P.pending[R.pack] = (P.pending[R.pack] || 0) + 1
      addXP(20); return { msg: `Day ${next + 1} reward claimed!`, rw: R }
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
  S.market = { ...f.market, ...S.market }; S.notices = S.notices || []; S.wonder = S.wonder || []
  for (const [k, o] of Object.entries(S.profile.club.cards)) if (!o.ser && byKey(k)) o.ser = rollSerial(k)
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
