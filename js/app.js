// ANIME ULTIMATE TEAM — app shell + pages
import { TIER, ORDER, ANIME, TYPE, RB, getArt, drawCard, thumbURL, fontsReady, fitFont, DISP, RARITY_MARK, loadImg } from './cardkit.js'

const $ = s => document.querySelector(s)
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }
const fmt = n => Math.round(n || 0).toLocaleString()
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const wait = ms => new Promise(r => setTimeout(r, ms))
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

// ================= data =================
let POOL = [], BYKEY = {}, ST = null, P = null
const club = () => P.club.cards
const effL = (c, l) => (l ? { ...c, lvl: l } : c)
const eff = c => effL(c, (club()[c.key] && club()[c.key].lvl) || 0)
const owned = () => POOL.filter(c => club()[c.key])
const tierCol = r => r === 'X' ? '#e0c8ff' : TIER[r].pal[1]
const ANAME = a => ANIME[a] ? ANIME[a].name.replace(/\b\w+/g, w => w[0] + w.slice(1).toLowerCase()) : a

async function api(path) { const r = await fetch(path, { cache: 'no-store' }); return r.json() }
async function act(type, data = {}) {
  let r
  try { r = await (await fetch('/api/act', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, ...data }) })).json() }
  catch { toast('The game server is not responding. Is the start.bat window still open?', 'err'); return { error: 'offline' } }
  if (r.state) applyState(r.state)
  if (r.error) toast(r.error, 'err'); else if (r.msg) toast(r.msg, 'ok')
  return r
}
let lastCoins = null
function applyState(s) {
  ST = s; P = s.profile
  for (const n of s.notices || []) toast(n.text, n.kind === 'sold' ? 'gold' : 'ok')
  $('#coinVal').textContent = fmt(P.coins); $('#ppVal').textContent = fmt(P.pp || 0)
  if (lastCoins !== null && lastCoins !== P.coins) { const c = $('#coinChip'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump') }
  lastCoins = P.coins
  const L = s.level; $('#lvlNum').textContent = L.lv; $('#lvlTag').textContent = 'LV ' + L.lv
  $('#lvlRing').style.strokeDashoffset = 132 - 132 * (L.cur / L.need)
  const claim = s.rewards.filter(r => r.done && !r.claimed).length
  $('#fabDot').hidden = !claim; $('#fabDot').textContent = claim || ''
  const sp = $('#sideProfile'); if (sp) sp.innerHTML = `<div class="spr"><div class="spl"><b>${L.lv}</b><small>LEVEL</small></div><div class="spx"><span>PLAYER</span><div class="bar"><i style="width:${L.cur / L.need * 100}%"></i></div><small>${fmt(L.cur)} / ${fmt(L.need)} XP</small></div></div><div class="spc"><div><i class="coin-i"></i><b>${fmt(P.coins)}</b></div><div><i class="pp-i"></i><b>${fmt(P.pp || 0)}</b></div><div><span>📦</span><b>${P.club.packs}</b></div></div>`
}
async function refresh() { try { applyState(await api('/api/state')) } catch { } }

// ================= toasts =================
function toast(text, kind = 'ok') {
  const t = h('div', 'toast ' + kind); t.textContent = text; $('#toasts').append(t)
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove()
  setTimeout(() => t.classList.add('out'), 3800); setTimeout(() => t.remove(), 4300)
}

// ================= card images =================
function cardImg(c, w = 340) { const im = new Image(); im.alt = `${c.name} ${c.ver}, ${TIER[c.r].name}, rated ${c.ovr}`; im.decoding = 'async'; im.draggable = false; thumbURL(c, w).then(u => im.src = u); return im }
const BACK = (() => {
  const c = document.createElement('canvas'); c.width = 340; c.height = 476; const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 340, 476); g.addColorStop(0, '#3a2470'); g.addColorStop(.5, '#120a26'); g.addColorStop(1, '#2db4ff')
  x.fillStyle = g; x.beginPath(); x.roundRect(0, 0, 340, 476, 18); x.fill()
  x.fillStyle = '#0d0820'; x.beginPath(); x.roundRect(8, 8, 324, 460, 12); x.fill()
  x.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 16; y < 470; y += 10) for (let X = 16 + (y / 10 % 2) * 5; X < 330; X += 10) { x.beginPath(); x.arc(X, y, 1.6, 0, 7); x.fill() }
  return c
})()
let BACKURL = null
fontsReady.then(() => {
  const x = BACK.getContext('2d'); x.textAlign = 'center'; x.font = DISP(80); const t = x.createLinearGradient(0, 190, 0, 270); t.addColorStop(0, '#fff'); t.addColorStop(1, '#ffe27a'); x.fillStyle = t; x.fillText('AUT', 170, 268)
  x.font = '800 12px "Sofia Sans"'; x.fillStyle = '#cfc6ee'; x.fillText('ULTIMATE TEAM', 170, 296); BACKURL = BACK.toDataURL()
})

// ================= pack art (Pocket-style booster packs) =================
const PACKLOOK = {
  standard: { t: ['LEGENDS', 'DROP'], c: ['#ff2d9a', '#7a3dff', '#12092e', '#2db4ff', '#3dffb0'], set: 'S1' },
  premium: { t: ['PREMIUM', 'DROP'], c: ['#fff6c9', '#ffd23a', '#b07a1c', '#2a1600', '#ffe9a0'], set: 'S1+' },
  DBZ: { t: ['DRAGON', 'BALL'], c: ['#ffd400', '#ff7a00', '#b80018', '#3a0a00', '#ffd400'], set: 'DB' },
  NAR: { t: ['HIDDEN', 'LEAF'], c: ['#7df9ff', '#00a8ff', '#0030c8', '#061440', '#7df9ff'], set: 'NR' },
  JJK: { t: ['CURSED', 'WORLD'], c: ['#ff5ad1', '#b03dff', '#3d14b8', '#12052e', '#ff5ad1'], set: 'JK' },
  OP: { t: ['GRAND', 'LINE'], c: ['#ffd23a', '#ff3b30', '#7a0010', '#2a0006', '#ffd23a'], set: 'OP' },
  MHA: { t: ['PLUS', 'ULTRA'], c: ['#2dff9a', '#00b86b', '#0a4a2c', '#04140c', '#fff04a'], set: 'HA' },
  BC: { t: ['CLOVER', 'KINGDOM'], c: ['#c8ff3d', '#12c95c', '#04572b', '#021a0c', '#c8ff3d'], set: 'BC' },
  DS: { t: ['DEMON', 'SLAYER'], c: ['#ffb0c8', '#ff3d6a', '#7a0a2a', '#1a0410', '#ffd0e0'], set: 'DS' },
  BL: { t: ['BLUE', 'LOCK'], c: ['#7df9ff', '#2d7dff', '#0a1f8a', '#030a2a', '#7df9ff'], set: 'BL' },
  HXH: { t: ['HUNTER', 'EXAM'], c: ['#c8ff3d', '#2db84a', '#0a4a1c', '#021408', '#7df9ff'], set: 'HX' },
  FT: { t: ['FAIRY', 'TAIL'], c: ['#ffd06a', '#ff5a1a', '#a0101e', '#2a0408', '#ffe06a'], set: 'FT' },
  JJBA: { t: ['BIZARRE', 'STANDS'], c: ['#ffd23a', '#c03dff', '#4a0a8a', '#12042a', '#ff5ad1'], set: 'JJ' },
  CSM: { t: ['CHAINSAW', 'DEVILS'], c: ['#ffb000', '#ff3d00', '#7a0a1a', '#1a0408', '#ff3d9a'], set: 'CS' },
}
const packPool = type => { const a = ST.packs[type] && ST.packs[type].anime; return a ? POOL.filter(c => c.anime === a) : POOL }
const featured = type => packPool(type).slice().sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)[type === 'premium' ? 1 : 0] || POOL[0]
const PACKCANVAS = {}
async function packCanvas(type, w = 300) {
  const k = type + w; if (PACKCANVAS[k]) return PACKCANVAS[k]
  await fontsReady
  const L = PACKLOOK[type] || PACKLOOK.standard, H = Math.round(w * 1.54), c = document.createElement('canvas'); c.width = w; c.height = H
  const x = c.getContext('2d'), s = w / 300
  x.scale(s, s); const W = 300, HH = 462
  const rr = (X, Y, ww, hh, r) => { x.beginPath(); x.roundRect(X, Y, ww, hh, r) }
  const g = x.createLinearGradient(0, 0, W, HH); L.c.forEach((col, i) => g.addColorStop(i / (L.c.length - 1), col))
  rr(0, 0, W, HH, 14); x.fillStyle = g; x.fill()
  x.save(); rr(0, 0, W, HH, 14); x.clip()
  // character art in the window
  const f = featured(type)
  try { const img = await getArt(f); const ar = img.width / img.height; let dh = 340, dw = dh * ar; if (dw < W) { dw = W; dh = W / ar }; x.save(); x.beginPath(); x.rect(0, 56, W, 330); x.clip(); x.drawImage(img, (W - dw) / 2, 50, dw, dh); x.restore() } catch { }
  // foil crimp bands
  for (const [y, hh] of [[0, 56], [386, 76]]) {
    const b = x.createLinearGradient(0, y, W, y + hh); b.addColorStop(0, L.c[0]); b.addColorStop(.5, '#ffffff'); b.addColorStop(1, L.c[1]); x.globalAlpha = .9; x.fillStyle = b; x.fillRect(0, y, W, hh); x.globalAlpha = 1
    x.fillStyle = 'rgba(0,0,0,.18)'; for (let X = 0; X < W; X += 8) x.fillRect(X, y + (y ? 0 : hh - 8), 4, 8)
  }
  x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(30 + i * 30, 26, 9, 0, 7); x.fill() }
  // halftone + sheen
  x.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 60; y < 384; y += 12) for (let X = (y / 12 % 2) * 6; X < W; X += 12) { x.beginPath(); x.arc(X, y, 1.8, 0, 7); x.fill() }
  const sh = x.createLinearGradient(0, 0, W, HH); sh.addColorStop(.3, 'rgba(255,255,255,0)'); sh.addColorStop(.45, 'rgba(255,255,255,.28)'); sh.addColorStop(.55, 'rgba(255,255,255,0)'); x.fillStyle = sh; x.fillRect(0, 0, W, HH)
  // title
  x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowOffsetY = 4
  const tg = x.createLinearGradient(0, 300, 0, 380); tg.addColorStop(0, '#fff'); tg.addColorStop(1, '#ffe27a')
  x.fillStyle = tg; x.save(); x.translate(W / 2, 0); fitFont(x, L.t[0], 66, 270); x.fillText(L.t[0], 0, 340); fitFont(x, L.t[1], 66, 270); x.fillText(L.t[1], 0, 392); x.restore()
  x.shadowColor = 'transparent'; x.font = '800 13px "Sofia Sans"'; x.fillStyle = '#fff'; x.fillText('ANIME ULTIMATE TEAM · 5 CARDS', W / 2, 440)
  x.fillStyle = 'rgba(0,0,0,.7)'; rr(W - 58, 12, 46, 24, 6); x.fill(); x.fillStyle = '#fff'; x.font = '900 13px "Sofia Sans"'; x.fillText(L.set, W - 35, 29)
  x.restore()
  return PACKCANVAS[k] = c
}
const packEl = (type, w) => { const cv = document.createElement('canvas'); packCanvas(type, w).then(src => { cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0) }); return cv }

// ================= router + transitions =================
const TABS = ['home', 'cards', 'team', 'market', 'shop']
const TITLES = { home: '', cards: 'MY CARDS', team: 'MY TEAM', market: 'TRANSFERS', shop: 'SHOP', pack: 'BOOSTER PACKS', results: '', wonder: 'WONDER PICK', missions: 'MISSIONS' }
let CUR = null, CURARG = null, curEl = null
const PAGES = {}
function go(name, arg, opts = {}) {
  document.body.dataset.page = name;
  if (!PAGES[name]) name = 'home'
  const from = CUR, fi = TABS.indexOf(from), ti = TABS.indexOf(name)
  const dir = opts.dir || (fi >= 0 && ti >= 0 ? (ti >= fi ? 1 : -1) : 1)
  CUR = name; CURARG = arg
  if (!opts.silent) history.replaceState(null, '', '#' + name + (arg ? '-' + arg : ''))
  const el = h('section', 'page'); el.style.setProperty('--dir', dir * 26 + 'px')
  closeModal()
  if (curEl) { const old = curEl; old.classList.add('out'); old.style.setProperty('--dir', dir * 26 + 'px'); setTimeout(() => old.remove(), 240) }
  $('#pages').append(el); curEl = el
  PAGES[name](el, arg)
  el.classList.add('in'); setTimeout(() => el.classList.remove('in'), 900)
  $('#ptitle').textContent = TITLES[name] || ''
  const tab = TABS.includes(name) ? name : name === 'pack' || name === 'results' || name === 'wonder' || name === 'missions' ? (name === 'missions' ? null : 'home') : null
  document.querySelectorAll('#nav button').forEach((b, i) => { const on = b.dataset.go === tab; b.classList.toggle('on', on); if (on) $('#navPill').style.setProperty('--i', i) })
  $('#fab').hidden = name !== 'home'
}
const rerender = () => { if (curEl && PAGES[CUR]) { curEl.innerHTML = ''; PAGES[CUR](curEl, CURARG) } }
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => go(b.dataset.go))
$('#fab').onclick = () => go('missions')
$('#lvlBtn').onclick = () => go('missions')

// ================= modal sheet =================
function openModal(build, full) {
  const m = $('#modal'); m.innerHTML = ''; m.hidden = false; m.classList.toggle('full', !!full)
  const sh = h('div', 'sheet'); sh.append(h('div', 'grab')); m.append(sh); build(sh)
  m.onclick = e => { if (e.target === m) closeModal() }
  return sh
}
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = '' }
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal() })

// ================= timers =================
const hms = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return hh ? `${hh}h ${String(mm).padStart(2, '0')}m` : mm ? `${mm}m ${String(ss).padStart(2, '0')}s` : `${ss}s` }
let SKEW = 0
const now = () => Date.now() + SKEW
const CLOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
setInterval(() => {
  for (const e of document.querySelectorAll('[data-until]')) { const left = +e.dataset.until - now(); e.textContent = left > 0 ? hms(left) : (e.dataset.done || 'Ready!'); if (e.dataset.urgent !== undefined) e.classList.toggle('urgent', left < 60000) }
  for (const e of document.querySelectorAll('[data-fill]')) { const [a, b] = e.dataset.fill.split(',').map(Number); e.style.width = clamp((now() - a) / (b - a) * 100, 0, 100) + '%' }
}, 1000)

// ================= HOME =================
let homeIdx = 0
PAGES.home = (el) => {
  const types = Object.keys(ST.packs).filter(t => packPool(t).length)
  const stage = h('div', 'packstage'); stage.append(h('div', 'rays'))
  const car = h('div', 'carousel3'); stage.append(car)
  const place = () => {
    const n = types.length
    ;[...car.children].forEach((b, i) => {
      const d = ((i - homeIdx) % n + n) % n, pos = d === 0 ? 0 : d === 1 ? 1 : d === n - 1 ? -1 : 2
      b.className = 'pk3 ' + (pos === 0 ? 'c' : pos === 1 ? 'r' : pos === -1 ? 'l' : 'h')
      b.style.transform = pos === 2 ? 'translateX(0) scale(.5)' : `translateX(${pos * 118}px) translateZ(${pos ? -120 : 0}px) rotateY(${-pos * 24}deg) scale(${pos ? .82 : 1})`
      b.style.opacity = pos === 2 ? 0 : 1
    })
  }
  types.forEach((t, i) => {
    const b = h('button', 'pk3'); b.setAttribute('aria-label', ST.packs[t].name); b.append(packEl(t, 300))
    b.onclick = () => { if (b.classList.contains('c')) go('pack', t); else { homeIdx = i; place() } }
    car.append(b)
  })
  place()
  let sx = null; car.onpointerdown = e => sx = e.clientX; car.onpointerup = e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) { homeIdx = (homeIdx + (e.clientX < sx ? 1 : -1) + types.length) % types.length; place() } sx = null }
  // free pack timer, Pocket style
  const F = ST.free, foot = h('div', 'foot'), fb = h('div', 'freebar')
  const full = F.charges >= F.max
  fb.innerHTML = `<div class="row"><span class="eyebrow" style="color:#fff">FREE PACKS</span><span class="charges">${Array.from({ length: F.max }, (_, i) => `<i class="${i < F.charges ? 'on' : ''}"></i>`).join('')}</span></div>
    <div class="bar"><i ${full ? 'style="width:100%"' : `data-fill="${F.next - F.every},${F.next}"`}></i></div>
    <div class="row"><span class="timer">${CLOCK_ICON}<span ${full ? '' : `data-until="${F.next}"`}>${full ? 'Full' : ''}</span></span></div>`
  const ob = h('button', 'btn gold sm', F.charges ? 'OPEN FREE' : 'SHOP'); ob.onclick = async () => {
    if (!ST.free.charges) return go('shop')
    const r = await act('freePack'); if (!r.error) openPack('standard')
  }
  foot.append(fb, ob); stage.append(foot)
  el.append(stage)
  // tiles
  const W = ST.wonderE, wcount = ST.wonder.length
  const tiles = h('div', 'tiles2')
  const tile = (cls, title, sub, ico, onclick, badge) => { const t = h('button', 'tile ' + cls, `${badge ? `<span class="badge">${badge}</span>` : ''}${ico}<b>${title}</b><small>${sub}</small>`); t.onclick = onclick; return t }
  tiles.append(
    tile('t-wonder', 'WONDER<br>PICK', `<span class="pips">${Array.from({ length: W.max }, (_, i) => `<i class="${i < W.charges ? 'on' : ''}"></i>`).join('')}</span>`, `<svg class="ico" viewBox="0 0 64 64"><g fill="#ffd23a" stroke="#7a4a00" stroke-width="2"><rect x="8" y="10" width="20" height="28" rx="4"/><rect x="34" y="6" width="22" height="30" rx="4" fill="#fff6c9"/><rect x="18" y="30" width="24" height="28" rx="4" fill="#ffb000"/></g></svg>`, () => go('wonder'), W.charges && wcount ? 'PICK READY' : ''),
    tile('t-shop', 'SHOP', `${fmt(P.pp || 0)} pack points`, `<svg class="ico" viewBox="0 0 64 64"><path d="M14 22h36l-3 34H17Z" fill="#9ad8ff" stroke="#123a6a" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 26v-8a8 8 0 0 1 16 0v8" fill="none" stroke="#123a6a" stroke-width="3"/></svg>`, () => go('shop')),
    tile('t-market', 'MARKET', 'Live auctions', `<svg class="ico" viewBox="0 0 64 64"><g fill="none" stroke="#a8ffcf" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 22h38l-8-8M54 42H16l8 8"/></g></svg>`, () => go('market')),
    tile('t-team', 'MY TEAM', teamSub(), `<svg class="ico" viewBox="0 0 64 64"><g fill="#ff9ecb" stroke="#6a1d4a" stroke-width="2.5"><circle cx="32" cy="20" r="9"/><path d="M16 54a16 16 0 0 1 32 0Z"/></g></svg>`, () => go('team')),
  )
  el.append(tiles)
  const bt = h('div', 'tile t-battle', '<b style="font-size:24px">BATTLE · COMING SOON</b><small>Take your team into 5v5 fights.</small>'); bt.style.minHeight = '84px'; bt.style.marginTop = '12px'; el.append(bt)
  // showcase
  el.append(showcaseBlock())
  // last pulls
  const recent = (P.last || []).map(k => BYKEY[k]).filter(Boolean).map(eff)
  const sec = h('div', 'sec', `<h3>LAST PULLS</h3><button class="link">MY CARDS ›</button>`); sec.querySelector('button').onclick = () => go('cards'); el.append(sec)
  const rs = h('div', 'recent'); if (recent.length) recent.forEach(c => { const im = cardImg(c, 220); im.onclick = () => cardDetail(c.key); im.className = 'tap'; rs.append(im) }); else rs.innerHTML = '<span class="muted" style="font-weight:700">Open a pack to see your pulls here.</span>'
  el.append(rs)
}
function teamSub() { const n = P.team.filter(Boolean).length; return n ? `${n}/6 · rating ${teamStats().rating}` : 'Build your squad' }

// ================= PACK SELECT =================
// openPack: see in-app opener at the bottom
PAGES.pack = (el, type) => {
  const types = Object.keys(ST.packs).filter(t => packPool(t).length)
  let idx = Math.max(0, types.indexOf(type))
  const sel = h('div', 'psel'), floor = h('div', 'floor'); sel.append(floor)
  types.forEach((t, i) => { const b = h('button', 'pk3'); b.append(packEl(t, 300)); b.onclick = () => { if (i !== idx) { idx = i; place() } }; sel.append(b) })
  const name = h('div', 'pname'), acts = h('div', 'pacts'), dots = h('div', 'pdots'), more = h('div', 'grid2'); more.style.marginTop = '12px'
  const place = () => {
    const btns = [...sel.querySelectorAll('.pk3')]
    btns.forEach((b, i) => { const d = i - idx; b.className = 'pk3 ' + (d === 0 ? 'c' : 'l'); b.style.transform = `translateX(${d * 190}px) translateZ(${d ? -200 : 0}px) rotateY(${-d * 30}deg) scale(${d ? .78 : 1})`; b.style.opacity = Math.abs(d) > 1 ? 0 : 1; b.style.zIndex = 5 - Math.abs(d) })
    const t = types[idx], pk = ST.packs[t], pend = P.pending[t] || 0, pool = packPool(t)
    history.replaceState(null, '', '#pack-' + t); CURARG = t
    name.innerHTML = `<h2>${pk.name.toUpperCase()}</h2><p>${pool.length} cards · ${t === 'premium' ? 'guaranteed Epic or better' : pk.anime ? ANAME(pk.anime) + ' only' : 'every series'} · +5 pack points</p>`
    acts.innerHTML = ''
    const free = t === 'standard' && ST.free.charges > 0
    const a = h('button', 'btn ' + (pend || free ? 'green' : 'gold'), pend ? `OPEN PACK<small>${pend} waiting</small>` : free ? `OPEN FREE<small>${ST.free.charges} free left</small>` : `OPEN A PACK<small>${fmt(pk.cost)} coins</small>`)
    a.onclick = async () => { if (pend) return openPack(t); const r = await act(free ? 'freePack' : 'buyPack', { pack: t }); if (!r.error) openPack(t) }
    const b = h('button', 'btn violet', `BUY 5<small>${fmt(pk.cost * 5)} coins</small>`)
    b.disabled = P.coins < pk.cost * 5
    b.onclick = async () => { for (let i = 0; i < 5; i++) { const r = await act('buyPack', { pack: t }); if (r.error) break } toast('Packs are waiting in Booster Packs. Tap OPEN PACK.', 'gold'); place() }
    acts.append(a, b)
    dots.innerHTML = types.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join('')
  }
  let sx = null; sel.onpointerdown = e => sx = e.clientX; sel.onpointerup = e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) { idx = clamp(idx + (e.clientX < sx ? 1 : -1), 0, types.length - 1); place() } sx = null }
  const rates = h('button', 'ghost', 'Offering rates'); rates.onclick = () => offeringRates(types[idx])
  const back = h('button', 'ghost', '‹ Back home'); back.onclick = () => go('home', null, { dir: -1 })
  more.append(back, rates)
  el.append(sel, name, dots, acts, more)
  place()
}
function offeringRates(t) {
  const odds = t === 'premium' ? { C: 12, U: 26, R: 30, E: 20, L: 8.5, M: 2.8, X: .7 } : { C: 38, U: 28, R: 18, E: 9.5, L: 4.6, M: 1.5, X: .4 }
  const pool = packPool(t)
  openModal(sh => {
    sh.append(h('h3', '', `<span style="font:italic 900 28px var(--disp)">OFFERING RATES</span>`))
    sh.append(h('p', 'muted', `${ST.packs[t].name}. Chance per card. ${t === 'premium' ? 'At least one Epic or better is guaranteed.' : ''}`))
    for (const r of ORDER.slice().reverse()) {
      const n = pool.filter(c => c.r === r).length; if (!n) continue
      sh.append(h('div', 'mrow', `<b style="color:${tierCol(r)}">${RARITY_MARK[r]} ${TIER[r].name}</b><span class="rew">${odds[r]}%</span><span class="muted" style="grid-column:1/-1;font-size:12px">${n} card${n > 1 ? 's' : ''}: ${pool.filter(c => c.r === r).map(c => c.name + ' (' + c.ver.toLowerCase() + ')').join(', ')}</span>`))
    }
  })
}

// ================= RESULTS =================
PAGES.results = (el) => {
  const got = (P.last || []).map(k => BYKEY[k]).filter(Boolean).map(eff)
  el.append(h('div', 'results-head', `<span class="eyebrow">OPENING RESULTS</span><h2>${got.length ? 'NICE PULLS!' : 'NO PULLS'}</h2>`))
  const g = h('div', 'resgrid')
  got.forEach((c, i) => { const b = h('button', 'cg'); b.style.animationDelay = i * .09 + 's'; b.append(cardImg(c, 300)); const e = club()[c.key]; if (e && e.n === 1) b.append(h('span', 'nw', 'NEW')); b.onclick = () => cardDetail(c.key); g.append(b) })
  el.append(g)
  const row = h('div', 'grid2'), a = h('button', 'btn gold', 'OPEN ANOTHER'), n = h('button', 'btn', 'NEXT')
  a.onclick = () => go('pack', 'standard'); n.onclick = () => go('home')
  row.append(a, n); el.append(row)
}

// ================= MY CARDS (Pocket-style binder) =================
const CF = { q: '', anime: 'ALL', rar: 'ALL', mode: 'OWNED' }
PAGES.cards = (el) => {
  const own = owned(), pct = Math.round(own.length / Math.max(1, POOL.length) * 100)
  const head = h('div', 'panel pad')
  head.innerHTML = `<div class="collhead"><div class="stat"><b>${own.length}</b><span>OWNED</span></div><div class="stat"><b>${POOL.length}</b><span>IN SET</span></div><div class="stat"><b>${pct}%</b><span>COMPLETE</span></div></div><div class="bar" style="margin-top:12px"><i style="width:${pct}%"></i></div>`
  el.append(head)
  const tools = h('div', ''); tools.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:14px'
  const MODES = ['OWNED', 'ALL', 'BINDER']; const seg = segmented(['OWNED', 'ALL CARDS', 'BINDER'], Math.max(0, MODES.indexOf(CF.mode)), i => { CF.mode = MODES[i]; draw() })
  const q = h('input', 'field'); q.type = 'search'; q.placeholder = 'Search characters or forms'; q.value = CF.q; q.oninput = () => { CF.q = q.value.trim().toLowerCase(); draw() }
  const an = h('div', 'chips'), ra = h('div', 'chips')
  tools.append(seg, q, an, ra); el.append(tools)
  const grid = h('div', 'cardgrid'); el.append(grid)
  const chipRow = (box, opts, key) => { box.innerHTML = ''; for (const [v, l] of opts) { const b = h('button', 'chip' + (CF[key] === v ? ' on' : ''), l); b.onclick = () => { CF[key] = v; draw() }; box.append(b) } }
  function draw() {
    chipRow(an, [['ALL', 'All series'], ...[...new Set(POOL.map(c => c.anime))].map(a => [a, ANAME(a)])], 'anime')
    chipRow(ra, [['ALL', 'All rarities'], ...ORDER.slice().reverse().filter(r => POOL.some(c => c.r === r)).map(r => [r, RARITY_MARK[r] + ' ' + TIER[r].name[0] + TIER[r].name.slice(1).toLowerCase()])], 'rar')
    q.style.display = ra.style.display = CF.mode === 'BINDER' ? 'none' : ''
    grid.className = 'cardgrid'
    if (CF.mode === 'BINDER') return drawBinder(grid)
    const list = POOL.filter(c => (CF.mode === 'ALL' || club()[c.key]) && (CF.anime === 'ALL' || c.anime === CF.anime) && (CF.rar === 'ALL' || c.r === CF.rar) && (!CF.q || (c.name + ' ' + c.ver).toLowerCase().includes(CF.q)))
      .sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)
    grid.innerHTML = ''
    if (!list.length) { grid.append(h('div', 'empty', `<b>${own.length ? 'Nothing here' : 'No cards yet'}</b>${own.length ? 'Try a different filter.' : 'Open your free pack on the home screen.'}`)); grid.firstChild.style.gridColumn = '1/-1'; return }
    for (const c of list) {
      const e = club()[c.key], b = h('button', 'cg' + (e ? '' : ' miss')); b.append(cardImg(eff(c), 240))
      if (e) { b.append(h('span', 'n', e.n)); if (e.lvl) b.append(h('span', 'lv', '★' + e.lvl)); if ((P.last || []).includes(c.key) && e.n === 1) b.append(h('span', 'nw', 'NEW')) }
      b.onclick = () => cardDetail(c.key); grid.append(b)
    }
  }
  draw()
}
function segmented(labels, on, pick) {
  const s = h('div', 'seg'), k = h('div', 'knob'); s.append(k)
  const btns = labels.map((l, i) => { const b = h('button', i === on ? 'on' : '', l); b.onclick = () => { btns.forEach((x, j) => x.classList.toggle('on', j === i)); moveK(i); pick(i) }; s.append(b); return b })
  const moveK = i => { k.style.width = `calc((100% - 8px) / ${labels.length})`; k.style.left = `calc(4px + (100% - 8px) / ${labels.length} * ${i})` }
  moveK(on); return s
}

// ---- card detail sheet ----
async function cardDetail(key) {
  const base = BYKEY[key]; if (!base) return
  const c = eff(base), e = club()[key], inTeam = P.team.includes(key), spare = e ? e.n - (inTeam ? 1 : 0) : 0, lvl = e ? e.lvl || 0 : 0
  openModal(sh => {
    const d = h('div', 'detail')
    const big = h('div', 'big'), im = cardImg(c, 600); big.append(im); d.append(big)
    big.onpointermove = ev => { const r = big.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5; im.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)` }
    big.onpointerleave = () => im.style.transform = ''
    d.append(h('span', 'marks', `<span style="color:${tierCol(c.r)}">${RARITY_MARK[c.r]} ${TIER[c.r].name}</span>`))
    d.append(h('h2', '', c.name), h('span', 'ver', c.ver + (c.tag ? ' · TAG UNIT' : '')))
    d.append(h('span', 'eyebrow', `${ANAME(c.anime)} · ${c.faction} · ${c.role}${e ? ` · OWNED ×${e.n}` : ' · NOT OWNED'}${lvl ? ' · ★' + lvl : ''}`))
    d.append(h('div', 'kv', c.st.map((v, i) => `<div><small>${['PWR', 'SPD', 'KI', 'TEC', 'DEF', 'IQ'][i]}</small>${v}</div>`).join('')))
    d.append(h('div', 'movebox', `<b style="color:${TYPE[c.t].c[2]}">${TYPE[c.t].en} · ${c.mv}</b><p>${c.tx.join(' ')}</p>`))
    d.append(h('span', 'eyebrow', `MARKET VALUE ~ ${fmt(ST.values[key])} COINS`))
    if (e) {
      const a = h('div', 'acts')
      const add = (cls, label, dis, fn) => { const b = h('button', 'btn sm ' + cls, label); b.disabled = !!dis; b.onclick = fn; a.append(b) }
      add('violet', inTeam ? 'IN TEAM' : 'ADD TO TEAM', inTeam, () => { const T = P.team.slice(), i = T.indexOf(null); closeModal(); if (i < 0) { toast('Your team is full. Swap a card on the Team page.'); go('team'); return } T[i] = key; act('team', { team: T }).then(() => go('team')) })
      add('green', lvl >= 5 ? 'MAX ★' : `AWAKEN ★${lvl + 1}`, !(e.n > 1 && lvl < 5), async () => { await act('awaken', { key }); cardDetail(key); if (CUR === 'cards') rerender() })
      add('gold', 'SELL ON MARKET', spare < 1, () => listSheet(key))
      add('dark', `QUICK SELL ${fmt(ST.quick[key])}`, spare < 1, async () => { await act('quickSell', { key }); if (club()[key]) cardDetail(key); else closeModal(); if (CUR === 'cards') rerender() })
      d.append(a)
      if (e.n > 1) d.append(h('span', 'muted', `<small style="font-weight:700">Awakening uses a duplicate. It adds a star and market value; rating and stats stay the same.</small>`))
    } else {
      const b = h('button', 'btn block', 'FIND ON MARKET'); b.onclick = () => { MS.q = c.name.toLowerCase(); MS.view = 'results'; go('market') }; d.append(b)
    }
    sh.append(d)
  })
}
function listSheet(key) {
  const c = BYKEY[key], v = ST.values[key]
  openModal(sh => {
    sh.append(h('div', 'sec', `<h3>LIST ON TRANSFER MARKET</h3>`))
    const row = h('div', 'shoprow'); const im = cardImg(eff(c), 180); im.style.width = '90px'; row.append(im, h('div', '', `<h4>${c.name}</h4><p>${c.ver}<br>Value ~ ${fmt(v)} coins. Sellers pay 5% tax.</p>`)); sh.append(row)
    const mk = (lbl, val) => { const s = h('div', 'stepper'); s.innerHTML = `<span class="lbl">${lbl}</span><button aria-label="Lower">−</button><input inputmode="numeric" value="${val}"><button aria-label="Higher">+</button>`; const i = s.querySelector('input'); const [mi, pl] = s.querySelectorAll('button'); const st = () => Math.max(50, Math.round(+i.value * .05 / 50) * 50); mi.onclick = () => i.value = Math.max(50, +i.value - st()); pl.onclick = () => i.value = +i.value + st(); return [s, i] }
    const [s1, start] = mk('START', Math.round(v * .7 / 50) * 50), [s2, bin] = mk('BUY NOW', Math.round(v * 1.05 / 50) * 50)
    const f = h('div', 'searchform'); f.append(h('label', '', 'START PRICE'), s1, h('label', '', 'BUY NOW PRICE'), s2, h('label', '', 'DURATION'))
    let hours = 1; f.append(segmented(['1H', '3H', '6H', '12H'], 0, i => hours = [1, 3, 6, 12][i]))
    const go2 = h('button', 'btn gold block', 'LIST CARD'); go2.style.marginTop = '8px'
    go2.onclick = async () => { const r = await act('list', { key, start: +start.value, bin: +bin.value, hours }); if (!r.error) { closeModal(); if (CUR === 'cards') rerender() } }
    f.append(go2); sh.append(f)
  })
}

// ================= TEAM =================
function teamStats() {
  const T = P.team, cs = T.map(k => k && BYKEY[k]).filter(Boolean)
  const rating = cs.length ? Math.round(cs.reduce((a, c) => a + c.ovr, 0) / cs.length) : 0
  const links = [[0, 1], [1, 2]].map(([i, j]) => { const a = BYKEY[T[i]], b = BYKEY[T[j]]; return !a || !b ? -1 : a.faction === b.faction ? 2 : a.anime === b.anime ? 1 : 0 })
  const lead = BYKEY[T[0]], bench = [3, 4, 5].map(i => BYKEY[T[i]]).filter(Boolean)
  const benchMatch = lead ? bench.filter(c => c.anime === lead.anime).length : 0
  const chem = Math.round(links.reduce((a, l) => a + Math.max(0, l), 0) / 4 * 70 + benchMatch / 3 * 30)
  return { rating, chem, links, count: cs.length }
}
PAGES.team = (el) => {
  const st = teamStats()
  const head = h('div', 'panel pad'); head.innerHTML = `<div class="collhead"><div class="stat"><b>${st.rating || '--'}</b><span>RATING</span></div><div class="stat"><b>${st.chem}%</b><span>CHEMISTRY</span></div><div class="stat"><b>${st.count}/6</b><span>CARDS</span></div></div><div class="bar" style="margin-top:12px"><i style="width:${st.chem}%"></i></div>`
  el.append(head)
  const slots = (from, to, title) => {
    el.append(h('div', 'sec', `<h3>${title}</h3>`))
    const g = h('div', 'teamslots')
    for (let i = from; i < to; i++) {
      const k = P.team[i], c = k && BYKEY[k], b = h('button', 'tslot tap', c ? '' : '+')
      b.append(h('span', 'r', i === 0 ? 'LEADER' : i < 3 ? 'STARTER' : 'BENCH'))
      if (c) b.append(cardImg(eff(c), 240))
      b.onclick = () => teamPicker(i); g.append(b)
    }
    el.append(g)
  }
  slots(0, 3, 'STARTERS')
  const chem = h('div', 'chemrow'); const L = ['NO LINK', 'SAME SERIES +', 'SAME FACTION ++']
  st.links.forEach((l, i) => chem.append(h('div', 'stat', `<b style="font-size:18px;color:${l === 2 ? 'var(--green)' : l === 1 ? 'var(--gold)' : l === 0 ? 'var(--red)' : 'var(--ink3)'}">${l < 0 ? 'EMPTY' : L[l]}</b><span>${i === 0 ? 'LEADER ↔ STARTER' : 'STARTER ↔ STARTER'}</span>`)))
  el.append(chem)
  slots(3, 6, 'BENCH')
  const row = h('div', 'grid2'); row.style.marginTop = '16px'
  const auto = h('button', 'btn violet', 'AUTO BUILD'), clear = h('button', 'btn dark', 'CLEAR')
  auto.onclick = async () => {
    const own = owned().sort((a, b) => b.ovr - a.ovr); if (!own.length) return toast('Open some packs first.', 'err')
    const lead = own[0], rest = own.slice(1), sc = c => c.ovr + (c.faction === lead.faction ? 12 : c.anime === lead.anime ? 6 : 0)
    rest.sort((a, b) => sc(b) - sc(a)); const st2 = rest.slice(0, 2), oth = rest.slice(2).sort((a, b) => (b.anime === lead.anime) - (a.anime === lead.anime) || b.ovr - a.ovr)
    const T = [lead, ...st2, ...oth.slice(0, 3)].map(c => c ? c.key : null); while (T.length < 6) T.push(null)
    await act('team', { team: T }); rerender()
  }
  clear.onclick = async () => { await act('team', { team: [null, null, null, null, null, null] }); rerender() }
  row.append(auto, clear); el.append(row)
  el.append(h('p', 'muted', '<small style="font-weight:700;line-height:1.5;display:block;margin-top:12px">Starters next to each other link up: same faction is the strongest link, same series is next. Bench cards from your leader\'s series add chemistry too. Battles are coming soon.</small>'))
}
function teamPicker(slot) {
  openModal(sh => {
    sh.append(h('div', 'sec', `<h3>${slot === 0 ? 'PICK YOUR LEADER' : slot < 3 ? 'PICK A STARTER' : 'PICK A BENCH CARD'}</h3>`))
    if (P.team[slot]) { const rm = h('button', 'ghost', 'Remove this card'); rm.onclick = async () => { const T = P.team.slice(); T[slot] = null; await act('team', { team: T }); closeModal(); rerender() }; sh.append(rm) }
    const g = h('div', 'cardgrid'), list = owned().filter(c => !P.team.includes(c.key)).sort((a, b) => b.ovr - a.ovr)
    if (!list.length) g.append(h('div', 'empty', '<b>No spare cards</b>Open packs to get more.'))
    for (const c of list) { const b = h('button', 'cg'); b.append(cardImg(eff(c), 240)); b.onclick = async () => { const T = P.team.slice(); T[slot] = c.key; await act('team', { team: T }); closeModal(); rerender() }; g.append(b) }
    sh.append(g)
  })
}

// ================= MARKET (FC style) =================
const MS = { tab: 0, view: 'search', q: '', anime: 'ALL', rar: 'ALL', maxBin: 0, page: 0, sel: 0 }
let MKT = { listings: [], history: {}, won: [], now: Date.now() }
async function loadMarket() { try { MKT = await api('/api/market'); SKEW = MKT.now - Date.now() } catch { } }
PAGES.market = async (el) => {
  const tabs = segmented(['SEARCH', 'TRANSFER LIST', 'TARGETS'], MS.tab, i => { MS.tab = i; MS.view = 'search'; rerender() })
  tabs.classList.add('mtabs'); el.append(tabs)
  const body = h('div', ''); el.append(body)
  await loadMarket()
  if (MS.tab === 0) MS.view === 'results' ? marketResults(body) : marketSearch(body)
  else if (MS.tab === 1) transferList(body)
  else transferTargets(body)
}
function marketSearch(el) {
  marketHub(el)
  el.append(h('div', 'sec', '<h3>SEARCH THE MARKET</h3>'))
  const f = h('div', 'panel pad searchform')
  const q = h('input', 'field'); q.type = 'search'; q.placeholder = 'Character name, e.g. Gojo'; q.value = MS.q; q.oninput = () => MS.q = q.value.trim().toLowerCase()
  const an = h('div', 'chips'), ra = h('div', 'chips')
  const chipRow = (box, opts, key) => { box.innerHTML = ''; for (const [v, l] of opts) { const b = h('button', 'chip' + (MS[key] === v ? ' on' : ''), l); if (key === 'rar' && TIER[v]) b.style.setProperty('--rc', tierCol(v)); b.onclick = () => { MS[key] = v; chipRow(box, opts, key) }; box.append(b) } }
  chipRow(an, [['ALL', 'Any series'], ...[...new Set(POOL.map(c => c.anime))].map(a => [a, ANAME(a)])], 'anime'); an.classList.add('serieschips')
  ra.classList.add('rarchips')
  chipRow(ra, [['ALL', 'Any rarity'], ...ORDER.slice().reverse().filter(r => POOL.some(c => c.r === r)).map(r => [r, TIER[r].name[0] + TIER[r].name.slice(1).toLowerCase()])], 'rar')
  const s = h('div', 'stepper'); s.innerHTML = `<span class="lbl">MAX</span><button aria-label="Lower">−</button><input inputmode="numeric" placeholder="Any" value="${MS.maxBin || ''}"><button aria-label="Higher">+</button>`
  const mi = s.querySelector('input'), [m1, m2] = s.querySelectorAll('button'), stp = v => v < 1000 ? 100 : v < 10000 ? 500 : v < 100000 ? 5000 : 25000
  m1.onclick = () => { mi.value = Math.max(0, (+mi.value || 0) - stp(+mi.value || 0)) || ''; MS.maxBin = +mi.value || 0 }; m2.onclick = () => { mi.value = (+mi.value || 0) + stp(+mi.value || 0); MS.maxBin = +mi.value }; mi.oninput = () => MS.maxBin = +mi.value || 0
  const go2 = h('button', 'btn gold block', 'SEARCH'); go2.onclick = () => { MS.view = 'results'; MS.page = 0; MS.sel = 0; rerender() }
  const reset = h('button', 'ghost', 'Reset'); reset.onclick = () => { Object.assign(MS, { q: '', anime: 'ALL', rar: 'ALL', maxBin: 0 }); rerender() }
  f.append(h('label', '', 'NAME'), q, h('label', '', 'SERIES'), an, h('label', '', 'RARITY'), ra, h('label', '', 'MAX BUY NOW PRICE'), s, go2, reset)
  el.append(f)
  const live = MKT.listings.filter(l => !l.you).length
  el.append(h('p', 'muted', `<small style="font-weight:700;display:block;text-align:center;margin-top:12px">${live} cards on the market right now. Traders list new auctions every few seconds.</small>`))
}
function searchHits() {
  return MKT.listings.filter(l => { const c = BYKEY[l.key]; return c && !l.you && (MS.anime === 'ALL' || c.anime === MS.anime) && (MS.rar === 'ALL' || c.r === MS.rar) && (!MS.q || (c.name + ' ' + c.ver).toLowerCase().includes(MS.q)) && (!MS.maxBin || l.bin <= MS.maxBin) })
    .sort((a, b) => a.exp - b.exp)
}
function marketResults(el) {
  el.append(h('div', 'crumbs', 'TRANSFERS › SEARCH › <b>LIVE SEARCH RESULTS</b>'))
  const hits = searchHits(), per = 12, pages = Math.max(1, Math.ceil(hits.length / per))
  MS.page = clamp(MS.page, 0, pages - 1)
  const items = hits.slice(MS.page * per, MS.page * per + per)
  if (!items.length) { el.append(h('div', 'panel pad empty', '<b>No results</b>Try fewer filters or a higher max price.')); const b = h('button', 'btn block', 'BACK TO SEARCH'); b.onclick = () => { MS.view = 'search'; rerender() }; el.append(b); return }
  MS.sel = clamp(MS.sel, 0, items.length - 1)
  const res = h('div', 'results'), pg = h('div', 'rpage', `<span>PAGE ${MS.page + 1} / ${pages}</span><span>${hits.length} RESULTS</span>`)
  const track = h('div', 'rtrack'); res.append(pg, track); el.append(res)
  const deck = h('div', 'adeck'), hero = h('div', 'ahero'), side = h('div', 'aside2')
  const info = h('div', 'auct2'), bidbar = h('div', 'bidbar'), more = h('div', 'grid2'); more.style.marginTop = '10px'
  side.append(info, bidbar, more); deck.append(hero, side); el.append(deck)
  const btns = items.map((l, i) => {
    const b = h('button', 'ritem'); b.append(cardImg(effL(BYKEY[l.key], l.lvl), 300))
    if (l.bidder === 'YOU') b.append(h('span', 'tag2 win', 'WINNING'))
    b.onclick = () => { MS.sel = i; pick(true) }
    track.append(b); return b
  })
  const pick = (scroll) => {
    btns.forEach((b, i) => b.classList.toggle('sel', i === MS.sel))
    if (scroll) btns[MS.sel].scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
    const l = items[MS.sel], c = BYKEY[l.key], d = l.value / l.bin
    const col = tierCol(c.r), dl = d > 1.05 ? ['win', 'GOOD DEAL'] : d < .95 ? ['lose', 'PRICEY'] : ['active', 'FAIR PRICE']
    deck.style.setProperty('--rc', col)
    hero.innerHTML = ''; const hc = h('div', 'ah-card'); hc.append(cardImg(effL(c, l.lvl), 520)); hero.append(h('div', 'ah-rays'), hc)
    hero.onpointermove = e => { const r = hero.getBoundingClientRect(); hc.style.transform = `rotateY(${((e.clientX - r.left) / r.width - .5) * 22}deg) rotateX(${-((e.clientY - r.top) / r.height - .5) * 16}deg)` }
    hero.onpointerleave = () => hc.style.transform = ''
    info.innerHTML = `<div class="a-head"><div><span class="a-rar">${RARITY_MARK[c.r]} ${TIER[c.r].name}</span><h3>${c.name}</h3><small>${c.ver}${l.lvl ? ' · ★' + l.lvl : ''}</small></div><b class="a-ovr">${c.ovr}</b></div>
      <div class="a-timer"><span>TIME REMAINING</span><b data-urgent data-until="${l.exp - SKEW}" data-done="Ended"></b></div>
      <div class="a-tiles">
        <div><span>START</span><b>${fmt(l.start)}</b></div>
        <div class="hl"><span>CURRENT BID</span><b>${l.bid ? fmt(l.bid) : '–'}</b><small>${l.bidder ? (l.bidder === 'YOU' ? 'you are winning' : l.bidder) : 'no bids yet'}</small></div>
        <div class="bn"><span>BUY NOW</span><b>${fmt(l.bin)}</b><small class="status ${dl[0]}">${dl[1]}</small></div>
      </div>
      <div class="a-seller"><span>SELLER</span><b>${l.seller}</b><span>${ANAME(c.anime)}</span></div>`
    bidbar.innerHTML = ''
    const s = h('div', 'stepper'); s.innerHTML = `<span class="lbl">BID</span><button aria-label="Lower bid">−</button><input inputmode="numeric" value="${l.next}"><button aria-label="Raise bid">+</button>`
    const bi = s.querySelector('input'), [b1, b2] = s.querySelectorAll('button'), st = v => Math.max(50, Math.round(v * .05 / 50) * 50)
    b1.onclick = () => bi.value = Math.max(l.next, +bi.value - st(+bi.value)); b2.onclick = () => bi.value = Math.min(l.bin - 50, +bi.value + st(+bi.value))
    const bb = h('button', 'btn violet sm', 'BID'); bb.disabled = l.bidder === 'YOU'
    bb.onclick = async () => { const r = await act('bid', { id: l.id, amount: +bi.value }); if (!r.error) { await loadMarket(); rerender() } }
    bidbar.append(s, bb)
    more.innerHTML = ''
    const buy = h('button', 'btn gold', `BUY NOW<small>${fmt(l.bin)}</small>`); buy.disabled = P.coins < l.bin
    buy.onclick = async () => { buy.disabled = true; const r = await act('buy', { id: l.id }); if (!r.error) { await loadMarket(); rerender() } else buy.disabled = false }
    const cmp = h('button', 'btn dark', 'COMPARE<small>recent sales</small>'); cmp.onclick = () => comparePrice(l.key)
    more.append(buy, cmp)
  }
  track.onscroll = () => { clearTimeout(track._t); track._t = setTimeout(() => { const mid = track.scrollLeft + track.clientWidth / 2; let best = 0, bd = 1e9; btns.forEach((b, i) => { const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i } }); if (best !== MS.sel) { MS.sel = best; pick(false) } }, 90) }
  pick(false); requestAnimationFrame(() => btns[MS.sel].scrollIntoView({ inline: 'center', block: 'nearest' }))
  const nav = h('div', 'grid2'); nav.style.marginTop = '10px'
  const back = h('button', 'ghost', '‹ New search'); back.onclick = () => { MS.view = 'search'; rerender() }
  const next = h('button', 'ghost', pages > 1 ? 'Next page ›' : 'Refresh'); next.onclick = async () => { MS.page = (MS.page + 1) % pages; MS.sel = 0; await loadMarket(); rerender() }
  nav.append(back, next); el.append(nav)
}
function comparePrice(key) {
  const c = BYKEY[key], hist = (MKT.history[key] || []).slice(-20)
  openModal(sh => {
    sh.append(h('div', 'sec', `<h3>COMPARE PRICE · ${c.name}</h3>`))
    sh.append(h('p', 'muted', `${c.ver}. Current value ~ ${fmt(ST.values[key])} coins.`))
    if (hist.length > 1) {
      const max = Math.max(...hist.map(x => x.p)), min = Math.min(...hist.map(x => x.p)), W = 460, H = 60
      const pts = hist.map((x, i) => `${i / (hist.length - 1) * W},${H - 6 - (x.p - min) / Math.max(1, max - min) * (H - 12)}`).join(' ')
      sh.append(h('div', 'panel pad', `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#a8ffcf" stroke-width="3" stroke-linejoin="round"/></svg><div style="display:flex;justify-content:space-between;font:800 12px var(--ui);color:var(--ink3)"><span>LOW ${fmt(min)}</span><span>HIGH ${fmt(max)}</span></div>`))
    }
    const live = MKT.listings.filter(l => l.key === key && !l.you).sort((a, b) => a.bin - b.bin).slice(0, 6)
    sh.append(h('div', 'sec', '<h3>CHEAPEST BUY NOW</h3>'))
    if (!live.length) sh.append(h('p', 'muted', 'None listed right now.'))
    live.forEach(l => sh.append(h('div', 'mrow', `<b>${fmt(l.bin)} coins</b><span class="muted" style="font-weight:800;font-size:12px">${l.seller}</span>`)))
    sh.append(h('div', 'sec', '<h3>RECENT SALES</h3>'))
    if (!hist.length) sh.append(h('p', 'muted', 'No sales yet.'))
    hist.slice().reverse().slice(0, 8).forEach(x => sh.append(h('div', 'mrow', `<b>${fmt(x.p)} coins</b><span class="muted" style="font-weight:800;font-size:12px">${hms(Date.now() - x.t)} ago</span>`)))
  })
}
function transferList(el) {
  el.append(h('div', 'crumbs', 'TRANSFERS › <b>TRANSFER LIST</b>'))
  const mine = MKT.listings.filter(l => l.you).sort((a, b) => a.exp - b.exp)
  el.append(h('p', 'muted', `<small style="font-weight:700">${mine.length}/10 listed. To sell, open a card in My Cards and tap Sell on Market.</small>`))
  if (!mine.length) { el.append(h('div', 'panel pad empty', '<b>Nothing listed</b>Duplicates sell well. Cheaper Buy Now prices sell faster.')); const b = h('button', 'btn block', 'GO TO MY CARDS'); b.onclick = () => go('cards'); el.append(b); return }
  for (const l of mine) {
    const c = BYKEY[l.key], r = h('div', 'mcard'); r.append(cardImg(effL(c, l.lvl), 160))
    r.append(h('div', 'info', `<b>${c.name}</b><span>${c.ver}</span><span>Start ${fmt(l.start)} · Buy Now ${fmt(l.bin)}</span><span>${l.bid ? `Top bid <b style="font:inherit;color:var(--gold)">${fmt(l.bid)}</b> by ${l.bidder}` : 'No bids yet'} · <span data-until="${l.exp - SKEW}" data-done="ending"></span></span>`))
    const side = h('div', '', `<span class="status ${l.bid ? 'bids' : 'active'}">${l.bid ? 'BIDS' : 'ACTIVE'}</span>`); side.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-end'
    if (!l.bid) { const x = h('button', 'ghost', 'Remove'); x.onclick = async () => { await act('cancel', { id: l.id }); await loadMarket(); rerender() }; side.append(x) }
    r.append(side); el.append(r)
  }
}
function transferTargets(el) {
  el.append(h('div', 'crumbs', 'TRANSFERS › <b>TRANSFER TARGETS</b>'))
  const bids = MKT.listings.filter(l => l.bidder === 'YOU')
  el.append(h('div', 'sec', '<h3>ACTIVE BIDS</h3>'))
  if (!bids.length) el.append(h('p', 'muted', 'You are not bidding on anything. Outbid coins come straight back.'))
  for (const l of bids) { const c = BYKEY[l.key], r = h('div', 'mcard'); r.append(cardImg(effL(c, l.lvl), 160)); r.append(h('div', 'info', `<b>${c.name}</b><span>${c.ver}</span><span>Your bid ${fmt(l.bid)} · Buy Now ${fmt(l.bin)}</span><span data-urgent data-until="${l.exp - SKEW}" data-done="ending"></span>`), h('span', 'status win', 'WINNING')); el.append(r) }
  el.append(h('div', 'sec', '<h3>WON ITEMS</h3>'))
  if (!MKT.won.length) el.append(h('p', 'muted', 'Cards you win or buy show up here and go straight to My Cards.'))
  for (const w of MKT.won.slice(0, 10)) { const c = BYKEY[w.key]; if (!c) continue; const r = h('div', 'mcard'); r.append(cardImg(effL(c, w.lvl), 160)); r.append(h('div', 'info', `<b>${c.name}</b><span>${c.ver}</span><span>Paid ${fmt(w.price)} · ${hms(Date.now() - w.t)} ago</span>`), h('span', 'status win', 'WON')); el.append(r) }
}

// ================= SHOP + PACK POINTS =================
PAGES.shop = (el) => {
  shopHero(el)
  el.append(h('div', 'sec', `<h3>PACK POINT EXCHANGE</h3><span class="cur"><i class="pp-i"></i>${fmt(P.pp || 0)}</span>`))
  el.append(h('p', 'muted', '<small style="font-weight:700">Every pack you open gives 5 pack points. Spend them on the exact card you want.</small>'))
  const g = h('div', 'ppgrid')
  for (const c of POOL.slice().sort((a, b) => TIER[a.r].rank - TIER[b.r].rank || a.ovr - b.ovr)) {
    const cost = ST.ppCost[c.r], b = h('button', 'cg' + ((P.pp || 0) < cost ? ' dimmed' : ''))
    b.append(cardImg(c, 240), h('span', 'cost', `<i></i>${cost}`)); if ((P.pp || 0) < cost) b.style.opacity = .55
    b.onclick = () => openModal(sh => {
      const d = h('div', 'detail'), big = h('div', 'big'); big.append(cardImg(c, 600)); d.append(big, h('h2', '', c.name), h('span', 'ver', c.ver))
      const x = h('button', 'btn block', `EXCHANGE FOR ${cost} PACK POINTS`); x.disabled = (P.pp || 0) < cost
      x.onclick = async () => { const r = await act('ppBuy', { key: c.key }); if (!r.error) { closeModal(); rerender() } }
      d.append(x, h('span', 'muted', `You have ${fmt(P.pp || 0)} pack points.`)); sh.append(d)
    })
    g.append(b)
  }
  el.append(g)
}

// ================= WONDER PICK =================
PAGES.wonder = (el) => {
  const W = ST.wonderE
  const top = h('div', 'panel pad'); top.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><span class="eyebrow">WONDER ENERGY</span><div class="pips" style="margin-top:6px">${Array.from({ length: W.max }, (_, i) => `<i class="${i < W.charges ? 'on' : ''}"></i>`).join('')}</div></div>${W.next ? `<span class="timer">${CLOCK_ICON}<span data-until="${W.next}"></span></span>` : '<span class="timer">Full</span>'}</div>
    <p class="muted" style="margin:10px 0 0;font-weight:700;font-size:13px">Other traders just opened these packs. Pick one: the cards get shuffled face down and you keep the one you choose.</p>`
  el.append(top)
  const feed = h('div', 'wfeed'); feed.style.marginTop = '14px'
  if (!ST.wonder.length) feed.append(h('div', 'empty', '<b>No packs right now</b>Check back in a minute.'))
  for (const w of ST.wonder) {
    const e = h('div', 'wentry tap'), best = w.keys.map(k => BYKEY[k]).filter(Boolean).sort((a, b) => TIER[b.r].rank - TIER[a.r].rank)[0]
    e.innerHTML = `<div class="who"><span class="av">${w.who[0]}</span><b style="flex:1">${w.who}</b>${best ? `<span class="status bids" style="color:${tierCol(best.r)}">${RARITY_MARK[best.r]} ${TIER[best.r].name}</span>` : ''}<span class="timer">${CLOCK_ICON}<span data-until="${w.exp - SKEW}"></span></span></div>`
    const five = h('div', 'cards5'); w.keys.forEach(k => BYKEY[k] && five.append(cardImg(BYKEY[k], 160))); e.append(five)
    e.onclick = () => wonderPick(w)
    feed.append(e)
  }
  el.append(feed)
}
function wonderPick(w) {
  if (ST.wonderE.charges < 1) return toast('No Wonder energy left. It refills every 6 hours.', 'err')
  openModal(async sh => {
    sh.append(h('div', 'sec', `<h3>WONDER PICK · ${w.who}</h3>`))
    const msg = h('p', 'muted', 'Remember where the good ones are…'); msg.style.fontWeight = '800'
    const g = h('div', 'wpick'); sh.append(msg, g)
    const cards = w.keys.map(k => BYKEY[k]).filter(Boolean)
    const els = cards.map(c => { const b = h('button', 'wcard'); const f = h('div', 'f'), bk = h('div', 'b'); f.append(cardImg(c, 200)); const bi = new Image(); bi.src = BACKURL || BACK.toDataURL(); bk.append(bi); b.append(f, bk); g.append(b); return b })
    await wait(1600)
    els.forEach(b => b.classList.add('down')); msg.textContent = 'Shuffling…'
    await wait(650)
    const pos = els.map((_, i) => i)
    for (let r = 0; r < 4; r++) { pos.sort(() => Math.random() - .5); els.forEach((b, i) => { b.style.transform = `rotateY(180deg) translateX(${(pos[i] - i) * 105}%)` }); await wait(330) }
    els.forEach(b => b.style.transform = ''); await wait(250)
    msg.textContent = 'Pick a card!'
    let done = false
    els.forEach(b => b.onclick = async () => {
      if (done) return; done = true
      const r = await act('wonder', { id: w.id }); if (r.error) { closeModal(); return }
      const pc = BYKEY[r.picked], others = r.keys.filter((k, i) => i !== r.keys.indexOf(r.picked))
      const f = b.querySelector('.f'); f.innerHTML = ''; f.append(cardImg(pc, 300))
      b.classList.add('chosen'); b.classList.remove('down'); b.classList.add('up'); b.style.transform = ''
      els.filter(x => x !== b).forEach((x, i) => { const ff = x.querySelector('.f'); ff.innerHTML = ''; if (BYKEY[others[i]]) ff.append(cardImg(BYKEY[others[i]], 200)); setTimeout(() => { x.classList.remove('down'); x.classList.add('dim') }, 700 + i * 120) })
      msg.innerHTML = `You got <b style="color:${tierCol(pc.r)}">${pc.name} · ${pc.ver}</b>!`
      const ok = h('button', 'btn block', 'NICE'); ok.onclick = () => { closeModal(); rerender() }; sh.append(ok)
    })
  })
}

// ================= MISSIONS =================
PAGES.missions = (el) => {
  const L = ST.level
  const lv = h('div', 'panel pad'); lv.innerHTML = `<div class="lvlcard"><span class="big">${L.lv}</span><div style="flex:1"><span class="eyebrow">PLAYER LEVEL</span><div class="bar" style="margin:8px 0 6px"><i style="width:${L.cur / L.need * 100}%"></i></div><small class="muted" style="font-weight:800">${L.cur} / ${L.need} XP · open packs, trade and finish missions to level up</small></div></div>`
  el.append(lv)
  for (const grp of ['DAILY', 'WEEKLY', 'COLLECTION']) {
    el.append(h('div', 'sec', `<h3>${grp === 'DAILY' ? 'DAILY MISSIONS' : grp === 'WEEKLY' ? 'WEEKLY MISSIONS' : 'COLLECTION'}</h3>${grp === 'COLLECTION' ? '' : `<span class="muted" style="font-weight:800;font-size:12px">resets ${grp === 'DAILY' ? 'at midnight' : 'every Monday'}</span>`}`))
    for (const r of ST.rewards.filter(r => r.group === grp)) {
      const row = h('div', 'mrow' + (r.claimed ? ' claimed' : r.done ? ' done' : ''))
      row.append(h('b', '', r.name))
      const right = h('div', 'rew', `<i class="cur" style="height:auto;padding:0;background:none;box-shadow:none"><i class="coin-i" style="width:16px;height:16px"></i></i>${fmt(r.coins)}`)
      if (r.done && !r.claimed) { const b = h('button', 'btn green sm', 'CLAIM'); b.onclick = async () => { await act('claim', { id: r.id }); rerender() }; right.append(b) }
      else right.append(h('span', 'muted', r.claimed ? '✓' : `${Math.min(r.prog, r.need)}/${r.need}`))
      row.append(right, h('div', 'bar', `<i style="width:${Math.min(100, r.prog / r.need * 100)}%"></i>`))
      el.append(row)
    }
  }
}

// ================= boot =================
;(async () => {
  const raw = await api('/api/cards'); POOL = raw.map((c, i) => ({ ...c, uid: i, total: raw.length, t: ANIME[c.anime] ? ANIME[c.anime].type : 'ki' }))
  BYKEY = Object.fromEntries(POOL.map(c => [c.key, c]))
  const s = await api('/api/state'); SKEW = s.now - Date.now(); applyState(s)
  // bring over the very first browser save, once
  try { const old = JSON.parse(localStorage.getItem('aut-club-v1')); if (old && old.cards && Object.keys(old.cards).length && !P.imported && !P.club.packs) { await act('import', { club: old, team: JSON.parse(localStorage.getItem('aut-team-v1')) }); toast('Moved your old box and team into this save.', 'gold') } } catch { }
  await fontsReady
  const hsh = location.hash.slice(1), [name, ...rest] = hsh.split('-')
  go(PAGES[name] ? name : 'home', rest.join('-') || null, { silent: !hsh })
  setInterval(async () => {
    await refresh()
    if (CUR === 'market' && MS.tab !== 0) { await loadMarket(); if ($('#modal').hidden) rerender() }
    if (CUR === 'home' && $('#modal').hidden) { /* timers tick themselves */ }
  }, 10000)
})()

// ================= POCKET-STYLE PACK OPENING (in-app) =================
const PACKODDS = {
  standard: { odds: { C: 38, U: 28, R: 18, E: 9.5, L: 4.6, M: 1.5, X: .4 } },
  premium: { odds: { C: 12, U: 26, R: 30, E: 20, L: 8.5, M: 2.8, X: .7 }, guarantee: 'E' },
}
function rollPackKeys(type) {
  const def = PACKODDS[type] || PACKODDS.standard, info = (ST.packs && ST.packs[type]) || {}
  const pool = info.anime ? POOL.filter(c => c.anime === info.anime) : POOL
  const rollT = () => { let r = Math.random() * 100; for (const k of ['X', 'M', 'L', 'E', 'R', 'U']) { if ((r -= def.odds[k]) < 0) return k } return 'C' }
  const pick = r => { const i = ORDER.indexOf(r); for (let d = 0; d < 7; d++) for (const j of [i - d, i + d]) { const l = pool.filter(c => c.r === ORDER[j]); if (l.length) return l[Math.floor(Math.random() * l.length)] } return POOL[0] }
  const out = []; for (let i = 0; i < 5; i++) out.push(pick(rollT()))
  if (def.guarantee && !out.some(c => TIER[c.r].rank >= TIER[def.guarantee].rank)) out[0] = pick(def.guarantee)
  return out.sort((a, b) => TIER[a.r].rank - TIER[b.r].rank || a.ovr - b.ovr) // worst first, best revealed last
}

async function openPack(type) {
  if (document.getElementById('opener')) return
  const cards = rollPackKeys(type)
  const r = await act('openPack', { pack: type, keys: cards.map(c => c.key) })
  if (r.error) return
  const cnt = {}; cards.forEach(c => cnt[c.key] = (cnt[c.key] || 0) + 1); const isNew = k => (club()[k]?.n || 0) <= cnt[k]; const seenNew = new Set()
  const ov = h('div', ''); ov.id = 'opener'
  const best = cards[cards.length - 1], bcol = tierCol(best.r)
  ov.style.setProperty('--bc', bcol)
  ov.innerHTML = `<div class="op-rays"></div><div class="op-glow"></div><div class="op-stage"></div><div class="op-hint"></div><button class="op-skip">SKIP ›</button>`
  document.body.append(ov)
  const stage = ov.querySelector('.op-stage'), hint = ov.querySelector('.op-hint')
  let skipping = false
  ov.querySelector('.op-skip').onclick = () => { skipping = true; finish() }
  function finish() { ov.classList.add('out'); setTimeout(() => ov.remove(), 350); go('results') }

  // ---- stage 1: tear the pack ----
  const pc = await packCanvas(type, 360), url = pc.toDataURL()
  const pk = h('div', 'op-pack', `<div class="top" style="background-image:url(${url})"></div><div class="body" style="background-image:url(${url})"></div><div class="cut"><i></i></div>`)
  stage.append(pk); hint.textContent = 'SWIPE ACROSS THE TOP TO OPEN'
  await new Promise(res => {
    let x0 = null, done = false
    const cut = pk.querySelector('.cut i')
    const tear = () => { if (done) return; done = true; res() }
    pk.onpointerdown = e => { x0 = e.clientX; pk.setPointerCapture(e.pointerId) }
    pk.onpointermove = e => { if (x0 == null) return; const p = Math.min(1, Math.abs(e.clientX - x0) / pk.offsetWidth); cut.style.width = p * 100 + '%'; if (p > .6) tear() }
    pk.onpointerup = () => { if (x0 != null && !done) { x0 = null; cut.style.width = '100%'; tear() } }
  })
  if (skipping) return
  hint.textContent = ''
  pk.classList.add('torn'); ov.classList.add('flash')
  await wait(650); pk.remove(); ov.classList.remove('flash')

  // ---- stage 2: cards one by one ----
  const stack = h('div', 'op-stack'); stage.append(stack)
  const els = cards.map((c, i) => {
    const big = TIER[c.r].rank >= 3
    const e = h('div', 'op-card' + (big ? ' facedown' : ''), `<div class="in"><div class="f"></div><div class="b"><span>AUT</span></div></div>`)
    e.style.setProperty('--rc', tierCol(c.r)); e.style.zIndex = 10 - i
    e.style.transform = `translateY(${i * -4}px) rotate(${(i - 2) * 1.2}deg)`
    e.querySelector('.f').append(cardImg(c, 420))
    if (isNew(c.key) && !seenNew.has(c.key) && seenNew.add(c.key)) e.querySelector('.f').append(h('span', 'op-new', 'NEW'))
    e.dataset.tier = c.r
    stack.append(e); return e
  })
  ov.querySelector('.op-skip').textContent = 'SKIP ›'
  for (let i = 0; i < els.length; i++) {
    if (skipping) return
    const e = els[i], c = cards[i], rk = TIER[c.r].rank
    e.style.transform = 'none'; e.classList.add('top')
    hint.textContent = e.classList.contains('facedown') ? 'TAP TO REVEAL' : 'TAP FOR NEXT'
    if (e.classList.contains('facedown')) {
      await new Promise(res => e.onclick = res); e.onclick = null; hint.textContent = ''
      ov.style.setProperty('--bc', tierCol(c.r))
      e.classList.add('charge'); ov.classList.add('charging')
      if (rk >= 4) { ov.classList.add('big'); await wait(rk >= 5 ? 1700 : 1200) } else await wait(550)
      e.classList.remove('charge', 'facedown'); e.classList.add('reveal'); ov.classList.remove('charging'); ov.classList.add('burst')
      const lab = h('div', 'op-label', `<small>${TIER[c.r].name}</small><b>${c.name}</b><span>${c.ver}</span>`); lab.style.setProperty('--rc', tierCol(c.r)); stage.append(lab)
      await wait(700); ov.classList.remove('burst', 'big')
      hint.textContent = 'TAP FOR NEXT'
      await new Promise(res => e.onclick = res); lab.remove()
    } else {
      await new Promise(res => e.onclick = res)
    }
    e.onclick = null; e.classList.add('gone')
    await wait(220)
  }
  if (!skipping) finish()
}

// ================= BINDERS =================
function drawBinder(grid) {
  grid.innerHTML = ''; grid.className = 'binders'
  const animes = [...new Set(POOL.map(c => c.anime))].filter(a => CF.anime === 'ALL' || a === CF.anime)
  for (const a of animes) {
    const set = POOL.filter(c => c.anime === a).sort((x, y) => TIER[x.r].rank - TIER[y.r].rank || x.ovr - y.ovr)
    const got = set.filter(c => club()[c.key]).length, pct = Math.round(got / set.length * 100)
    const b = h('section', 'binder')
    b.innerHTML = `<header class="bcover"><div><span class="eyebrow">BINDER</span><h3>${ANAME(a)}</h3></div><div class="bprog"><b>${got}<small>/${set.length}</small></b><div class="bar"><i style="width:${pct}%"></i></div></div></header>`
    const pages = h('div', 'bpages')
    for (let p = 0; p < set.length; p += 9) {
      const pg = h('div', 'bpage'); pg.append(h('span', 'pno', 'PAGE ' + (p / 9 + 1)))
      const part = set.slice(p, p + 9)
      part.forEach((c, i) => {
        const e = club()[c.key], k = h('button', 'pocket' + (e ? '' : ' empty'))
        k.append(cardImg(eff(c), 200)); k.append(h('span', 'num', '#' + String(p + i + 1).padStart(3, '0')))
        if (e && e.n > 1) k.append(h('span', 'n', e.n))
        k.onclick = () => cardDetail(c.key); pg.append(k)
      })
      for (let i = part.length; i < 9; i++) pg.append(h('div', 'pocket blank'))
      pages.append(pg)
    }
    b.append(pages); grid.append(b)
  }
}

// ================= SHOWCASE =================
function showcaseBlock() {
  const sc = (P.showcase || []).filter(k => club()[k])
  const wrap = h('div', 'showcase')
  wrap.append(h('div', 'sec', '<h3>MY SHOWCASE</h3><span class="muted" style="font-weight:800;font-size:12px">tap a slot to pin your best pulls</span>'))
  const row = h('div', 'scrow')
  for (let i = 0; i < 5; i++) {
    const k = sc[i], c = k && BYKEY[k], s = h('button', 'scslot' + (c ? ' on' : ''))
    if (c) { s.style.setProperty('--rc', tierCol(c.r)); s.append(cardImg(eff(c), 260)) } else s.innerHTML = '<i>+</i>'
    s.onclick = () => showcasePicker(i); row.append(s)
  }
  wrap.append(row); return wrap
}
function showcasePicker(slot) {
  openModal(sh => {
    const cur = (P.showcase || []).filter(k => club()[k])
    sh.append(h('div', 'sec', '<h3>PIN TO SHOWCASE</h3>'))
    if (cur[slot]) { const rm = h('button', 'ghost', 'Remove from showcase'); rm.onclick = async () => { const S2 = cur.slice(); S2.splice(slot, 1); await act('showcase', { keys: S2 }); closeModal(); rerender() }; sh.append(rm) }
    const g = h('div', 'cardgrid')
    for (const c of owned().filter(c => !cur.includes(c.key)).sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)) {
      const b = h('button', 'cg'); b.append(cardImg(eff(c), 240))
      b.onclick = async () => { const S2 = cur.slice(); if (slot < S2.length) S2[slot] = c.key; else S2.push(c.key); await act('showcase', { keys: S2 }); closeModal(); rerender() }
      g.append(b)
    }
    sh.append(g)
  })
}

// ================= SHOP v2 =================
let SHOPSEL = 'premium'
function packOdds(t) { return (PACKODDS[t] || PACKODDS.standard).odds }
function packDesc(t) { const pk = ST.packs[t]; return t === 'premium' ? 'Boosted odds with a guaranteed Epic or better in every pack.' : pk.anime ? 'Only ' + ANAME(pk.anime) + ' cards. Chase every moment in the series.' : 'Every series and every rarity. The classic pull.' }
function buyOrOpen(t) { return async () => { if ((P.pending[t] || 0) > 0) return openPack(t); const x = await act('buyPack', { pack: t }); if (!x.error) openPack(t) } }
function shopHero(el) {
  const types = Object.keys(ST.packs).filter(t => packPool(t).length)
  if (!types.includes(SHOPSEL)) SHOPSEL = types[0]
  const t = SHOPSEL, pk = ST.packs[t], L = PACKLOOK[t] || PACKLOOK.standard, pend = P.pending[t] || 0, odds = packOdds(t)
  const hero = h('section', 'shero'); hero.style.setProperty('--p1', L.c[0]); hero.style.setProperty('--p2', L.c[1]); hero.style.setProperty('--p3', L.c[2])
  hero.innerHTML = `<div class="sh-bg"></div><div class="sh-rays"></div><div class="sh-stripe"></div>
    <div class="sh-pack"><div class="sh-tilt"></div><div class="sh-floor"></div></div>
    <div class="sh-info">
      <span class="sh-tag">${t === 'premium' ? '★ FEATURED' : pk.anime ? 'SERIES PACK' : 'CORE PACK'}</span>
      <h2>${pk.name}</h2>
      <p>${packDesc(t)}</p>
      <div class="sh-meta"><span><b>5</b> cards</span><span><b>${packPool(t).length}</b> in pool</span>${t === 'premium' ? '<span class="gold"><b>EPIC+</b> guaranteed</span>' : ''}</div>
      <div class="sh-odds"></div>
      <div class="sh-buy"></div>
    </div>`
  const tilt = hero.querySelector('.sh-tilt'); tilt.append(packEl(t, 340))
  hero.onpointermove = e => { const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; tilt.style.transform = `rotateY(${x * 26}deg) rotateX(${-y * 18}deg)` }
  hero.onpointerleave = () => tilt.style.transform = ''
  const od = hero.querySelector('.sh-odds')
  for (const r of ORDER.slice().reverse()) { if (!odds[r] && r !== 'C') continue; const v = odds[r] || 0; const row = h('div', 'od', `<span>${TIER[r].name}</span><i><b style="width:${Math.min(100, v * 2.4)}%"></b></i><em>${v}%</em>`); row.style.setProperty('--rc', tierCol(r)); od.append(row) }
  const bb = hero.querySelector('.sh-buy')
  const buy = h('button', 'btn gold big', `<span>BUY</span><b><i class="coin-i"></i>${fmt(pk.cost)}</b>`); buy.disabled = P.coins < pk.cost
  buy.onclick = async () => { const x = await act('buyPack', { pack: t }); if (!x.error) openPack(t) }
  bb.append(buy)
  if (pend) { const o = h('button', 'btn green big', `<span>OPEN</span><b>${pend} READY</b>`); o.onclick = () => openPack(t); bb.append(o) }
  el.append(hero)
  // pack selector strip
  const strip = h('div', 'sh-strip')
  for (const k of types) {
    const p = ST.packs[k], Lk = PACKLOOK[k] || PACKLOOK.standard, n = P.pending[k] || 0
    const b = h('button', 'ptile' + (k === t ? ' on' : '')); b.style.setProperty('--p1', Lk.c[0]); b.style.setProperty('--p2', Lk.c[1])
    const art = h('div', 'pt-art'); art.append(packEl(k, 200)); b.append(art)
    b.append(h('div', 'pt-name', p.name), h('div', 'pt-price', `<i class="coin-i"></i>${fmt(p.cost)}`))
    if (n) b.append(h('span', 'pt-badge', n))
    b.onclick = () => { SHOPSEL = k; rerender() }
    strip.append(b)
  }
  el.append(h('div', 'sec', '<h3>ALL PACKS</h3><span class="muted" style="font-weight:800;font-size:12px">pick a pack to preview it</span>'), strip)
}

// ================= MARKET HUB v2 =================
function marketHub(el) {
  const live = MKT.listings.filter(l => !l.you), mine = MKT.listings.filter(l => l.you).length
  const hot = live.slice().sort((a, b) => TIER[BYKEY[b.key]?.r || 'C'].rank - TIER[BYKEY[a.key]?.r || 'C'].rank || a.exp - b.exp).slice(0, 14)
  const hero = h('section', 'mhero')
  hero.innerHTML = `<div class="mh-bg"></div><div class="mh-grid"></div>
    <div class="mh-l"><span class="sh-tag">● LIVE</span><h2>TRANSFER<br>MARKET</h2><p>Snipe deals, win auctions and flip cards for coins.</p></div>
    <div class="mh-stats"><div><b>${live.length}</b><span>LIVE AUCTIONS</span></div><div><b>${mine}</b><span>YOUR LISTINGS</span></div><div><b>${(MKT.won || []).length}</b><span>WON</span></div></div>`
  el.append(hero)
  // ticker
  const tk = h('div', 'mticker'), inner = h('div', 'mt-in')
  const items = live.slice(0, 18).map(l => { const c = BYKEY[l.key]; return c ? `<span><em style="color:${tierCol(c.r)}">◆</em> ${c.name} <small>${c.ver}</small> <b>${fmt(l.bin)}</b></span>` : '' }).join('')
  inner.innerHTML = items + items; tk.append(inner); el.append(tk)
  // hot strip
  el.append(h('div', 'sec', '<h3>🔥 HOT RIGHT NOW</h3><span class="muted" style="font-weight:800;font-size:12px">top rarities, ending soonest</span>'))
  const strip = h('div', 'hotstrip')
  for (const l of hot) {
    const c = BYKEY[l.key]; if (!c) continue
    const b = h('button', 'hot'); b.style.setProperty('--rc', tierCol(c.r))
    b.append(cardImg(eff(c), 240))
    b.append(h('div', 'hot-p', `<span>BUY NOW</span><b><i class="coin-i"></i>${fmt(l.bin)}</b><small class="timer" data-until="${l.exp - SKEW}"></small>`))
    b.onclick = () => { Object.assign(MS, { q: c.name.toLowerCase(), anime: 'ALL', rar: c.r, maxBin: 0, view: 'results', page: 0, sel: 0 }); rerender() }
    strip.append(b)
  }
  if (!hot.length) strip.append(h('div', 'empty', '<b>Quiet market</b>Traders list new cards every few seconds.'))
  el.append(strip)
}
