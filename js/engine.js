// Anime Ultimate Team — in-browser game engine.
// Replaces serve.js: same rules, same actions. The save lives in Supabase (one row), with a localStorage copy.
// It answers the app's existing fetch('/api/...') calls, so app.js did not need rewriting.
const CFG = window.AUT_CONFIG || {}
const LS_SAVE = 'aut-save-v2', LS_KEY = 'aut-key'

// ---- player key: arrives once as ?key=..., then kept on this device ----
const qs = new URLSearchParams(location.search)
if (qs.get('key')) { try { localStorage.setItem(LS_KEY, qs.get('key')) } catch { } history.replaceState(null, '', location.pathname + location.hash) }
let KEY = null; try { KEY = localStorage.getItem(LS_KEY) } catch { }

// ---- Firebase Firestore (plain REST, no library). Doc id = your private key; rules block listing, so it can't be found without it. ----
const SB = CFG.projectId && CFG.apiKey && KEY ? { url: 'https://firestore.googleapis.com/v1/projects/' + CFG.projectId + '/databases/(default)/documents/aut_saves/' + encodeURIComponent(KEY) + '?key=' + CFG.apiKey } : null
async function cloudLoad() {
  if (!SB) return null
  const r = await fetch(SB.url)
  if (r.status === 404) return null
  if (!r.ok) throw new Error('cloud ' + r.status)
  const d = await r.json(); return { data: JSON.parse(d.fields.data.stringValue) }
}
let cloudBusy = false, cloudAgain = false
async function cloudSave() {
  if (!SB) return
  if (cloudBusy) { cloudAgain = true; return }
  cloudBusy = true
  try {
    const r = await fetch(SB.url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(S) }, savedAt: { integerValue: String(S.savedAt || Date.now()) } } }) })
    setSync(r.ok ? 'ok' : 'err')
  } catch { setSync('err') }
  cloudBusy = false
  if (cloudAgain) { cloudAgain = false; cloudSave() }
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
  standard: { name: 'Legends Drop', cost: 1500 },
  premium: { name: 'Premium Drop', cost: 6000 },
  DBZ: { name: 'Dragon Ball Pack', cost: 3000, anime: 'DBZ' },
  NAR: { name: 'Naruto Pack', cost: 3000, anime: 'NAR' },
  JJK: { name: 'Jujutsu Kaisen Pack', cost: 3000, anime: 'JJK' },
  OP: { name: 'One Piece Pack', cost: 3000, anime: 'OP' },
  MHA: { name: 'Hero Academia Pack', cost: 3000, anime: 'MHA' },
  BC: { name: 'Black Clover Pack', cost: 3000, anime: 'BC' },
  DS: { name: 'Demon Slayer Pack', cost: 3000, anime: 'DS' },
  BL: { name: 'Blue Lock Pack', cost: 3000, anime: 'BL' },
  HXH: { name: 'Hunter x Hunter Pack', cost: 3000, anime: 'HXH' },
  FT: { name: 'Fairy Tail Pack', cost: 3000, anime: 'FT' },
  JJBA: { name: 'JoJo Pack', cost: 3000, anime: 'JJBA' },
  CSM: { name: 'Chainsaw Man Pack', cost: 3000, anime: 'CSM' },
}
const FREE_EVERY = 12 * 3600e3, FREE_MAX = 2
const PP_PER_PACK = 5, PP_COST = { C: 35, U: 70, R: 150, E: 400, L: 1000, M: 1500, X: 2500 }
function value(c, lvl = 0) {
  if (!c) return 0
  const v = BASE[c.r] * (1 + (c.ovr - MID[c.r]) / 12) * (1 + .18 * lvl) * (S.market.demand[c.key] || 1)
  return Math.max(50, Math.round(v / 50) * 50)
}
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
function rollFree() { rollCharge(S.profile.free, FREE_EVERY, FREE_MAX); rollCharge(S.profile.wonder, WONDER_EVERY, WONDER_MAX) }
const notice = (text, kind = 'info') => { S.notices.push({ text, kind, t: Date.now() }); if (S.notices.length > 30) S.notices.shift() }
const cardName = k => { const c = byKey(k); return c ? `${c.name} (${c.ver})` : 'card' }
const giveCard = (k, lvl = 0) => { const now = Date.now(), e = S.profile.club.cards[k] || (S.profile.club.cards[k] = { n: 0, first: now, lvl: 0 }); e.n++; e.last = now; e.lvl = Math.max(e.lvl || 0, lvl || 0); return e }
const addXP = n => { S.profile.xp = (S.profile.xp || 0) + n }

// ---------------- rewards / missions ----------------
const NAMES = { DBZ: 'Dragon Ball', NAR: 'Naruto', JJK: 'Jujutsu Kaisen', OP: 'One Piece', MHA: 'My Hero Academia', BC: 'Black Clover', DS: 'Demon Slayer', BL: 'Blue Lock', HXH: 'Hunter x Hunter', FT: 'Fairy Tail', CSM: 'Chainsaw Man', JJBA: 'JoJo', TG: 'Tokyo Ghoul', BLE: 'Bleach', K8: 'Kaiju No. 8', MOB: 'Mob Psycho 100', FF: 'Fire Force', OPM: 'One Punch Man', KGB: 'Kagurabachi', YGO: 'Yu-Gi-Oh!' }
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
const PACK_ODDS = { C: 38, U: 28, R: 18, E: 9.5, L: 4.6, M: 1.5, X: .4 }
const pick = a => a[Math.floor(Math.random() * a.length)]
function weightedCard(w = WEIGHT) {
  const all = cards(); if (!all.length) return null
  let r = Math.random() * all.reduce((a, c) => a + w[c.r], 0)
  for (const c of all) if ((r -= w[c.r]) < 0) return c
  return all[0]
}
function aiPack() {
  const all = cards(), out = []
  for (let i = 0; i < 5; i++) { let r = Math.random() * 100, t = 'C'; for (const k of ['X', 'M', 'L', 'E', 'R', 'U']) if ((r -= PACK_ODDS[k]) < 0) { t = k; break } const l = all.filter(c => c.r === t); out.push((l.length ? pick(l) : weightedCard()).key) }
  if (Math.random() < .35) out[Math.floor(Math.random() * 5)] = (weightedCard({ C: 0, U: 0, R: 4, E: 6, L: 4, M: 1.5, X: .5 }) || {}).key
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
  const M = S.market, now = Date.now(), all = cards()
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
      const pk = PACKS[a.pack]; if (!pk) return { error: 'Unknown pack.' }
      if (P.coins < pk.cost) return { error: `You need ${pk.cost.toLocaleString()} coins for this pack.` }
      P.coins -= pk.cost; P.pending[a.pack] = (P.pending[a.pack] || 0) + 1; return {}
    }
    case 'openPack': {
      if (!(P.pending[a.pack] > 0)) return { error: 'No unopened pack of that type.' }
      P.pending[a.pack]--; P.club.packs++; bump('opened'); P.last = []; P.pp = Math.min(2500, (P.pp || 0) + PP_PER_PACK); addXP(40)
      for (const k of a.keys || []) { const c = byKey(k); if (!c) continue; giveCard(k); P.last.push(k); const rk = 'CURELMX'.indexOf(c.r); if (rk >= 3) bump('epic'); if (rk >= 4) bump('legend') }
      return {}
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
    profile: P, notices: S.notices, packs: PACKS, rewards: rewards(), quick: {}, values: {}, level: levelOf(P.xp || 0), ppCost: PP_COST,
    free: { charges: P.free.charges, max: FREE_MAX, next: P.free.charges >= FREE_MAX ? 0 : P.free.at + FREE_EVERY, every: FREE_EVERY },
    wonderE: { charges: P.wonder.charges, max: WONDER_MAX, next: P.wonder.charges >= WONDER_MAX ? 0 : P.wonder.at + WONDER_EVERY },
    wonder: S.wonder, now: Date.now()
  }
  for (const c of cards()) { const e = P.club.cards[c.key]; out.values[c.key] = value(c, e ? e.lvl || 0 : 0); if (e) out.quick[c.key] = quickSell(c, e.lvl || 0) }
  return JSON.parse(JSON.stringify(out))
}
function market() {
  const now = Date.now(), M = S.market
  return JSON.parse(JSON.stringify({ now, listings: M.listings.filter(l => l.exp > now && byKey(l.key)).map(l => ({ ...l, next: nextBid(l), value: value(byKey(l.key), l.lvl) })), history: M.history, won: M.won || [] }))
}

// ---------------- boot ----------------
const ready = (async () => {
  CARDS = await (await fetch('cards-list.json', { cache: 'no-cache' })).json()
  let local = null; try { local = JSON.parse(localStorage.getItem(LS_SAVE)) } catch { }
  let cloud = null
  try { const row = await cloudLoad(); cloud = row && row.data; setSync(SB ? 'ok' : 'local') } catch { setSync('err') }
  // newest save wins (cloud vs this device)
  S = cloud && (!local || (cloud.savedAt || 0) >= (local.savedAt || 0)) ? cloud : (local || fresh())
  const f = fresh(); S.profile = { ...f.profile, ...S.profile }; S.market = { ...f.market, ...S.market }; S.notices = S.notices || []; S.wonder = S.wonder || []
  if (!S.market.listings.length) { for (let i = 0; i < 15; i++) tick(true) } else tick(true)
  save()
  setInterval(() => tick(), 10000)
  // pull fresh cloud data when coming back to the tab (e.g. played on the other device)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !SB) return
    try { const row = await cloudLoad(); if (row && row.data && (row.data.savedAt || 0) > (S.savedAt || 0)) { S = row.data; location.reload() } } catch { }
  })
})()

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
