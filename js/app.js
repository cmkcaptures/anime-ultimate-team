import { showPatchNotes } from './patch-notes.js?v=1'
import { LV_MAX, trainingQuote } from './training.js?v=1'
import { playerGrantsPage } from './player-grants.js?v=2'
import { deadZoneReward } from './deadzone-rewards.js?v=1'
import { cardCounterPage } from './card-counter.js?v=counter-1'
import { matchesCard, spendableCopies, keepReveal } from './qol.js?v=qol-1'
import { formCard } from './transformations.js?v=fusion-captains-1'
import { createFX } from './fx2d.js?v=mobile-render'
import { initBattle, battlePage, startBattle, synergy, beats, SYN, combosFor, DRAGONS, isDragon, leadHits, leaderInfo, teamAuras, auraHits, AURA_PCT, tagsOf, teamLinks, squadBond, multiverse } from './battle.js?v=balance-pass-1'
const ARCH_ICON = { Protagonist: '🔥', Rival: '⚡', Mentor: '📖', Sovereign: '👑', Monster: '👹', Blademaster: '⚔️', Tactician: '🧠', Berserker: '💥', Guardian: '🛡️', Heroine: '🌸', Speedster: '💨' }
const auraTag = t => t.startsWith('ARCH:') ? (ARCH_ICON[t.slice(5)] || '') + ' ' + t.slice(5) : t.startsWith('S:') ? ANAME(t.slice(2)) : t
import * as ACC from './account.js?v=session-qol-1'
import { sfx, sfxOn, music, musicOn } from './sfx.js?v=form-control'
// ANIME ULTIMATE TEAM — app shell + pages
import { TIER, ORDER, ANIME, TYPE, RB, getArt, drawCard, thumbURL, fontsReady, fitFont, DISP, RARITY_MARK, loadImg, gradeOf, GRADE_COL } from './cardkit.js?v=shrine-wave-1'

const $ = s => document.querySelector(s)
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }
const fmt = n => Math.round(n || 0).toLocaleString()
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const wait = ms => new Promise(r => setTimeout(r, ms))
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

// ================= data =================
let POOL = [], BYKEY = {}, ST = null, P = null
const club = () => P.club.cards
const LB_KEYS = ['dmg', 'dodge', 'dr', 'regen', 'teamHeal', 'spec', 'strikeBoost', 'exec', 'aoeBoost', 'vsAnimeB', 'vsTypeB', 'teamDmg', 'avenge', 'crit', 'spd', 'ultBoost']
const effSig = c => { const o = club()[c.key]; if (!o) return c
  const dia = Math.min(7, o.dia || 3), lv = o.lv || 1, mult = 1 + (dia - 3) * .04 + (lv - 1) * .0015
  const st = (c.st || [70, 70, 70, 70, 70, 70]).map(v => Math.min(99, Math.round(v * mult)))
  let pas = c.pas; if (dia >= 7 && pas && pas.e) { const e = { ...pas.e }; for (const k of LB_KEYS) if (typeof e[k] === 'number') e[k] = Math.round(e[k] * 1.25); pas = { ...pas, e } }
  return { ...c, st, pas, ovr: Math.min(99, c.ovr + (dia - 3) + Math.floor((lv - 1) / 25)), dia, lv, asc: o.asc || 0, maxed: dia >= 7 ? 1 : 0, sig: o.sig ? 1 : 0 } }
const eff = c => { const x = effSig(c), w = []; if (!w.length) return x
  const st = (x.st || [70, 70, 70, 70, 70, 70]).slice(), up = (i, v) => st[i] = Math.min(99, st[i] + v); let ovr = x.ovr
  if (w.includes('pwr')) up(0, 4); if (w.includes('spd')) up(1, 4); if (w.includes('def')) up(4, 4)
  if (w.includes('ovr')) { ovr += 3; for (let i = 0; i < 6; i++) up(i, 2) } if (w.includes('aw')) ovr += 2
  const pe = { ...((x.pas && x.pas.e) || {}) }; if (w.includes('dodge')) pe.dodge = (pe.dodge || 0) + 5; if (w.includes('dmg')) pe.dmg = (pe.dmg || 0) + 8
  return { ...x, ovr: Math.min(99, ovr), st, awk: w.length, awoke: w.includes('aw') ? 1 : 0, pas: x.pas ? { ...x.pas, e: pe } : { n: 'AWAKENED', d: '', e: pe } } }
const owned = () => POOL.filter(c => club()[c.key])
const tierCol = r => r === 'X' ? '#e0c8ff' : TIER[r].pal[1]
const ANAME = a => ANIME[a] ? ANIME[a].name.replace(/\b\w+/g, w => w[0] + w.slice(1).toLowerCase()) : a

async function api(path) { const r = await fetch(path, { cache: 'no-store' }); return r.json() }
async function act(type, data = {}) {
  let r
  try { r = await (await fetch('/api/act', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, ...data }) })).json() }
  catch { sfx('error'); toast('Could not reach the game. Check your connection.', 'err'); return { error: 'offline' } }
  if (r.state) applyState(r.state)
  if (r.error) { sfx('error'); toast(r.error, 'err') } else { if (type === 'claim') sfx('claim'); if (r.msg) toast(r.msg, 'ok') }
  return r
}
let lastCoins = null
function applyState(s) {
  ST = s; P = s.profile
  ambience()
  { const eq = P.eq || {}; document.body.dataset.frame = eq.frame || ''; document.body.dataset.opener = eq.opener || ''; const sp = document.getElementById('sideProfile'); if (sp) sp.dataset.border = eq.border || '' }
  for (const n of s.notices || []) toast(n.text, n.kind === 'sold' ? 'gold' : 'ok')
  $('#coinVal').textContent = fmt(P.coins); $('#ppVal').textContent = fmt(P.pp || 0)
  if (lastCoins !== null && lastCoins !== P.coins) sfx(P.coins > lastCoins ? 'coin' : 'buy')
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
// cards are drawn only when they scroll near the screen (big win on My Cards / binders / shop)
const pendingCardImages = new Set()
const LAZY = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting || !pendingCardImages.delete(target)) continue
    LAZY.unobserve(target)
    if (target.isConnected) target._draw()
  }
}, { rootMargin: '300px' }) : null
if (LAZY) new MutationObserver(records => {
  if (!records.some(record => record.removedNodes.length)) return
  for (const image of pendingCardImages) if (!image.isConnected) {
    LAZY.unobserve(image)
    pendingCardImages.delete(image)
  }
}).observe(document.body, { childList: true, subtree: true })
function cardImg(c, w = 340) {
  const im = new Image(); im.alt = `${c.name} ${c.ver}, ${TIER[c.r].name}, grade ${gradeOf(c.ovr)}`; im.decoding = 'async'; im.draggable = false
  im.width = 680; im.height = 952; im.style.aspectRatio = '680 / 952'; im.dataset.r = c.r; if (c.key) im.dataset.key = c.key; if (c.sig) im.dataset.sig = 1; if (c.maxed) im.dataset.max = 1
  im._draw = () => { delete im._draw; thumbURL(c, w).then(u => { im.src = u }, () => {}) }
  if (LAZY) { pendingCardImages.add(im); LAZY.observe(im) }
  else im._draw()
  return im
}
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
  bronze: { t: ['BRONZE', 'PACK'], c: ['#ffd9b0', '#c87a3a', '#6a3810', '#2a1406', '#ffd9b0'], set: 'BR' },
  silver: { t: ['SILVER', 'PACK'], c: ['#ffffff', '#b8c4d8', '#5a6478', '#1a1e28', '#e8eef8'], set: 'SV' },
  jumbo: { t: ['JUMBO', 'GOLD'], c: ['#fff4c0', '#ffb627', '#a86a00', '#2a1800', '#fff4c0'], set: 'JG' },
  lightning: { t: ['LIGHTNING', 'PACK'], c: ['#e0f4ff', '#3ab8ff', '#4a2bd0', '#0a0a2a', '#ffe14a'], set: 'LT' },
  standard: { t: ['GOLD', 'PACK'], c: ['#ff2d9a', '#7a3dff', '#12092e', '#2db4ff', '#3dffb0'], set: 'S1' },
  premium: { t: ['PREMIUM', 'DROP'], c: ['#fff6c9', '#ffd23a', '#b07a1c', '#2a1600', '#ffe9a0'], set: 'S1+' },
  DBZ: { t: ['DRAGON', 'BALL'], c: ['#ffd400', '#ff7a00', '#b80018', '#3a0a00', '#ffd400'], set: 'DB' },
  BOR: { t: ['NEXT', 'GENERATIONS'], c: ['#a8f3ff', '#bb54ff', '#3931a3', '#140a3d', '#e1b8ff'], set: 'BOR' },
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
  PKM: { t: ['POKÉMON', 'TRAINERS'], c: ['#ffe14a', '#ffcb05', '#2a75bb', '#0a1a3a', '#ff3d3d'], set: 'PK' },
  OPM: { t: ['ONE PUNCH', 'HEROES'], c: ['#fff04a', '#ffcc00', '#c81020', '#2a0408', '#ffffff'], set: 'PM' },
  AOT: { t: ['ATTACK ON', 'TITAN'], c: ['#e8c890', '#c8a070', '#6a3a1a', '#1a0a04', '#ff6a3d'], set: 'AT' },
  SL: { t: ['SOLO', 'LEVELING'], c: ['#9ad8ff', '#3a6aff', '#1a0a5a', '#05031a', '#b88cff'], set: 'SL' },
  DAN: { t: ['DANDADAN', 'OCCULT'], c: ['#ff9ad0', '#ff3d9a', '#5a0a6a', '#14041a', '#7df9ff'], set: 'DD' },
  YYH: { t: ['YU YU', 'HAKUSHO'], c: ['#7affd0', '#1ab07a', '#0a3a5a', '#04121a', '#ffe04a'], set: 'YYH' },
  SDS: { t: ['SEVEN DEADLY', 'SINS'], c: ['#ffe27a', '#e0a020', '#6a1a0a', '#160806', '#ff5a3a'], set: 'SDS' },
}
const PACKABLE = () => POOL.filter(c => !c.season && !c.campaignUnlock && !deadZoneReward(c))
const packPool = type => { const a = ST.packs[type] && ST.packs[type].anime; return a ? PACKABLE().filter(c => c.anime === a) : PACKABLE() }
const featured = type => packPool(type).slice().sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)[type === 'premium' ? 1 : 0] || POOL[0]
const PACKCANVAS = {}
const PACKC = {}
const PACKU = {}
function packURL(type) { return PACKU[type] || (PACKU[type] = packCanvas(type, 400).then(pc => new Promise(res => pc.toBlob(b => res(b ? URL.createObjectURL(b) : pc.toDataURL('image/jpeg', .9)), 'image/jpeg', .9)))) }
function packCanvas(type, w = 300) { const k = type + '|' + w; return PACKC[k] || (PACKC[k] = packCanvas0(type, w)) }
async function packCanvas0(type, w = 300) {
  const k = type + w; if (PACKCANVAS[k]) return PACKCANVAS[k]
  await fontsReady
  const L = PACKLOOK[type] || PACKLOOK.standard, H = Math.round(w * 1.6), c = document.createElement('canvas'); c.width = w; c.height = H
  const x = c.getContext('2d'), sc = w / 300; x.scale(sc, sc); const W = 300, HH = 480
  const finish = type === 'premium' || type === 'standard' || type === 'jumbo' ? 'gold' : type === 'silver' ? 'chrome' : type === 'bronze' ? 'bronze' : 'series'
  const metal = finish === 'bronze' ? ['#ffe0c0', '#d0884a', '#6a3810', '#ffcb98', '#a85c22'] : finish === 'gold' ? ['#fff4c0', '#e8b23a', '#8a5a08', '#ffe9a0', '#b8820a'] : finish === 'chrome' ? ['#ffffff', '#b8c4d8', '#5a6478', '#e8eef8', '#8a96aa'] : [L.c[4] || L.c[0], L.c[0], L.c[2], L.c[0], L.c[1]]
  // ---- wrapper silhouette with serrated crimp edges ----
  const CR = 26, teeth = 22, tw = W / teeth
  const shape = () => { x.beginPath(); x.moveTo(0, CR); for (let i = 0; i <= teeth; i++) x.lineTo(i * tw, i % 2 ? 0 : 7); x.lineTo(W, CR); x.lineTo(W, HH - CR); for (let i = teeth; i >= 0; i--) x.lineTo(i * tw, i % 2 ? HH : HH - 7); x.lineTo(0, HH - CR); x.closePath() }
  x.save(); shape(); x.clip()
  // base colour field
  const bg = x.createLinearGradient(0, 0, W * .4, HH); bg.addColorStop(0, L.c[0]); bg.addColorStop(.45, L.c[1]); bg.addColorStop(1, L.c[3]); x.fillStyle = bg; x.fillRect(0, 0, W, HH)
  // light burst behind the characters
  const lb = x.createRadialGradient(W / 2, 200, 10, W / 2, 200, 260); lb.addColorStop(0, 'rgba(255,255,255,.75)'); lb.addColorStop(.25, 'rgba(255,255,255,.18)'); lb.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = lb; x.fillRect(0, 0, W, HH)
  x.save(); x.globalAlpha = .1; x.strokeStyle = '#fff'; x.lineWidth = 1; for (let i = 0; i < 48; i++) { const ag = i / 48 * Math.PI * 2; x.beginPath(); x.moveTo(W / 2, 200); x.lineTo(W / 2 + Math.cos(ag) * 500, 200 + Math.sin(ag) * 500); x.stroke() } x.restore()
  // ---- character collage: 3 best cards ----
  const pool = packPool(type).filter(c => ((PACKODDS[type] || {}).odds || { C: 1 })[c.r] !== 0).sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)
  const picks = []; for (const cd of pool) { if (!picks.some(p => p.name === cd.name)) picks.push(cd); if (picks.length === 3) break }
  const draw = async (cd, cx, cw, chh, top, alpha, dark) => {
    try {
      const img = await getArt(cd), ar = img.width / img.height; let dh = chh, dw = dh * ar; if (dw < cw) { dw = cw; dh = cw / ar }
      x.save(); x.beginPath(); x.rect(cx - cw / 2, top, cw, chh); x.clip(); x.globalAlpha = alpha
      x.drawImage(img, cx - dw * (cd.fx ?? .5), top - Math.max(0, (dh - chh) * Math.min(1, (cd.fy ?? .22) * 1.1)), dw, dh)
      if (dark) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(0,0,0,' + dark + ')'; x.fillRect(cx - cw / 2, top, cw, chh) }
      x.restore()
    } catch { }
  }
  // side cards angled, centre card in front with fades
  if (picks[1]) { x.save(); x.translate(70, 230); x.rotate(-.12); x.translate(-70, -230); await draw(picks[1], 70, 150, 260, 92, 1, .28); x.restore() }
  if (picks[2]) { x.save(); x.translate(230, 230); x.rotate(.12); x.translate(-230, -230); await draw(picks[2], 230, 150, 260, 92, 1, .28); x.restore() }
  if (picks[0]) {
    await draw(picks[0], W / 2, 190, 300, 70, 1, 0)
    // soft fade on the centre card edges so it melts into the collage
    for (const [x0, dir] of [[W / 2 - 95, 1], [W / 2 + 95, -1]]) { const fg = x.createLinearGradient(x0, 0, x0 + dir * 26, 0); fg.addColorStop(0, L.c[1]); fg.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = .9; x.fillStyle = fg; x.fillRect(Math.min(x0, x0 + dir * 26), 70, 26, 300); x.globalAlpha = 1 }
  }
  // bottom colour flood for the logo block
  const bf = x.createLinearGradient(0, 270, 0, HH); bf.addColorStop(0, 'rgba(0,0,0,0)'); bf.addColorStop(.35, L.c[2] + 'cc'); bf.addColorStop(1, L.c[3]); x.fillStyle = bf; x.fillRect(0, 270, W, HH - 270)
  // ---- foil: holo shimmer (premium/series) + diagonal sheen ----
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = finish === 'chrome' ? .18 : .32
  const hb = x.createLinearGradient(0, 0, W, HH); ['#ff5ab0', '#ffd95a', '#5affb0', '#5ac8ff', '#b88cff', '#ff5ab0', '#ffd95a', '#5affb0'].forEach((cc, i, A) => hb.addColorStop(i / (A.length - 1), cc)); x.fillStyle = hb; x.fillRect(0, 0, W, HH); x.restore()
  const sh = x.createLinearGradient(0, 0, W, HH); sh.addColorStop(.28, 'rgba(255,255,255,0)'); sh.addColorStop(.4, 'rgba(255,255,255,.35)'); sh.addColorStop(.46, 'rgba(255,255,255,0)'); sh.addColorStop(.6, 'rgba(255,255,255,0)'); sh.addColorStop(.64, 'rgba(255,255,255,.18)'); sh.addColorStop(.7, 'rgba(255,255,255,0)'); x.fillStyle = sh; x.fillRect(0, 0, W, HH)
  // pillow shading: darker at the sides, highlight down the middle
  const pl = x.createLinearGradient(0, 0, W, 0); pl.addColorStop(0, 'rgba(0,0,0,.45)'); pl.addColorStop(.12, 'rgba(0,0,0,0)'); pl.addColorStop(.5, 'rgba(255,255,255,.06)'); pl.addColorStop(.88, 'rgba(0,0,0,0)'); pl.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = pl; x.fillRect(0, 0, W, HH)
  // ---- metallic crimp bands ----
  const band = (y, h) => { const mg = x.createLinearGradient(0, y, 0, y + h); metal.forEach((cc, i) => mg.addColorStop(i / (metal.length - 1), cc)); x.fillStyle = mg; x.fillRect(0, y, W, h); x.fillStyle = 'rgba(0,0,0,.22)'; for (let X = 2; X < W; X += 6) x.fillRect(X, y + 3, 2, h - 6); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(0, y + (y ? 0 : h - 2), W, 2) }
  band(0, CR + 4); band(HH - CR - 4, CR + 4)
  // tear notch hint
  x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.moveTo(0, CR + 10); x.lineTo(10, CR + 16); x.lineTo(0, CR + 22); x.fill()
  // ---- logo block ----
  x.textAlign = 'center'
  // brand ribbon
  const rg = x.createLinearGradient(60, 0, 240, 0); metal.slice(0, 3).forEach((cc, i) => rg.addColorStop(i / 2, cc)); x.fillStyle = rg
  x.beginPath(); x.moveTo(70, 318); x.lineTo(230, 318); x.lineTo(222, 338); x.lineTo(78, 338); x.closePath(); x.fill()
  x.fillStyle = '#0a0612'; x.font = '900 12px "Sofia Sans"'; x.fillText('ANIME  ULTIMATE  TEAM', W / 2, 332)
  // big title, two lines, outlined
  const title = (t, y, sz) => { x.save(); x.translate(W / 2, y); fitFont(x, t, sz, 270); x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = '#0a0612'; x.strokeText(t, 0, 0); const tg = x.createLinearGradient(0, -sz, 0, 4); tg.addColorStop(0, '#ffffff'); tg.addColorStop(.55, metal[0]); tg.addColorStop(1, metal[1]); x.fillStyle = tg; x.fillText(t, 0, 0); x.restore() }
  title(L.t[0], 388, 58); title(L.t[1], 436, 50)
  // set badge + card count
  x.fillStyle = 'rgba(0,0,0,.65)'; rr2(x, W - 66, CR + 12, 52, 22, 5); x.fill(); x.fillStyle = '#fff'; x.font = '900 12px "Sofia Sans"'; x.fillText(L.set + ' · S1', W - 40, CR + 27)
  x.fillStyle = 'rgba(0,0,0,.65)'; rr2(x, 14, CR + 12, 62, 22, 5); x.fill(); x.fillStyle = '#fff'; x.fillText(((PACKODDS[type] || {}).size || 5) + ' CARDS', 45, CR + 27)
  if (type === 'premium' || type === 'lightning') { x.fillStyle = '#ffd23a'; x.font = 'italic 900 13px "Sofia Sans Extra Condensed"'; x.fillText(type === 'lightning' ? '⚡ LIMITED STOCK · EPIC+ ⚡' : '★ EPIC+ GUARANTEED ★', W / 2, HH - CR - 14) }
  x.restore()
  // outer rim highlight
  shape(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.5; x.stroke()
  return PACKCANVAS[k] = c
}
function rr2(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r) }
const packEl = (type, w) => { const cv = document.createElement('canvas'); packCanvas(type, w).then(src => { cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0) }); return cv }

// ================= router + transitions =================
const TABS = ['home', 'cards', 'team', 'battle', 'shop']
const TITLES = { guide: 'HOW TO PLAY',  deck: 'ARTS DECK',  museum: 'MUSEUM',  achieve: 'ACHIEVEMENTS',  home: '', cards: 'MY CARDS', team: 'MY TEAM', shop: 'SHOP', pack: 'BOOSTER PACKS', results: '', wonder: 'WONDER PICK', missions: 'MISSIONS' }
let CUR = null, CURARG = null, curEl = null
const PAGES = {}
const NAVTOP = new Map(); addEventListener('resize', () => NAVTOP.clear())
const navTop = b => { if (!NAVTOP.has(b)) NAVTOP.set(b, b.offsetTop); return NAVTOP.get(b) }
function go(name, arg, opts = {}) {
  if (!opts.silent && name !== CUR) sfx('nav')
  document.body.dataset.page = name;
  if (!PAGES[name]) name = 'home'
  if (CUR === 'cards' && CURARG !== 'counter' && curEl) CF.scroll = curEl.scrollTop
  const from = CUR, fi = TABS.indexOf(from), ti = TABS.indexOf(name)
  const dir = opts.dir || (fi >= 0 && ti >= 0 ? (ti >= fi ? 1 : -1) : 1)
  CUR = name; CURARG = arg
  if (!opts.silent) history.replaceState(null, '', '#' + name + (arg ? '-' + arg : ''))
  const el = h('section', 'page'); el.style.setProperty('--dir', dir * 26 + 'px')
  closeModal()
  if (curEl) { const old = curEl; old.classList.add('out'); old.style.setProperty('--dir', dir * 26 + 'px'); setTimeout(() => old.remove(), 240) }
  $('#pages').append(el); curEl = el
  PAGES[name](el, arg)
  if (name === 'cards' && arg !== 'counter') el.scrollTop = CF.scroll || 0
  el.classList.add('in'); setTimeout(() => el.classList.remove('in'), 900)
  $('#ptitle').textContent = TITLES[name] || ''
  const tab = TABS.includes(name) ? name : name === 'pass' ? 'battle' : name === 'pack' || name === 'results' || name === 'wonder' || name === 'missions' ? (name === 'missions' ? null : 'home') : null
  document.querySelectorAll('#nav button').forEach((b, i) => { const on = b.dataset.go === tab; b.classList.toggle('on', on); if (on) { $('#navPill').style.setProperty('--i', i); $('#navPill').style.setProperty('--py', navTop(b) + 'px') } })
  $('#fab').hidden = name !== 'home'
}
const rerender = () => { if (curEl && PAGES[CUR]) { const scroll = curEl.scrollTop; curEl.innerHTML = ''; PAGES[CUR](curEl, CURARG); curEl.scrollTop = scroll } }
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
  if (new URLSearchParams(location.search).get('pvp') && !window.__pvpGo) { window.__pvpGo = 1; try { sessionStorage.setItem('bmode', 'live') } catch { } setTimeout(() => go('battle'), 0) }
  { const R = ST.rift; if (false && R && R.open && !R.done) { /* rifts paused */ const inv = POOL.filter(c => c.name === R.invader).sort((a, b) => b.ovr - a.ovr)[0], b = h('button', 'rift-alert', `<i style="background-image:url('${inv ? inv.url : ''}')"></i><span><small>🌀 DIMENSIONAL RIFT · CLOSES IN ${Math.max(1, Math.ceil((R.closes - Date.now()) / 60000))} MIN</small><b>${R.title.toUpperCase()}!</b></span><em>SEAL IT ›</em>`); b.onclick = () => { try { sessionStorage.setItem('bmode', 'rift') } catch { } go('battle') }; el.append(b) } }
  const B = ST.banner, partner = P.avatar && BYKEY[P.avatar], feat = partner || (B ? BYKEY[B.featured[0]] : POOL.slice().sort((a, b) => b.ovr - a.ovr)[0])
  const lob = h('section', 'lobby')
  // featured sticker card
  const fc = h('button', 'lb-feat')
  fc.style.setProperty('--art', `url("${feat.url}")`); fc.style.setProperty('--fx', Math.round((feat.fx ?? .5) * 100) + '%'); fc.style.setProperty('--fy', Math.round((feat.fy ?? .22) * 100) + '%')
  fc.innerHTML = `<i class="lb-art"></i><span class="lb-tag"><small>${partner ? 'YOUR PARTNER · 相棒' : B ? 'LIMITED BANNER · 限定' : 'FEATURED · 注目'}</small><b>${feat.name}</b><em>${feat.ver}</em></span>${partner ? `<span class="lb-say">${partnerLine(feat)}</span>` : ''}`
  fc.onclick = () => { if (!partner) return go('shop'); const sy = fc.querySelector('.lb-say'); sy.textContent = partnerLine(feat); sy.classList.remove('pop'); void sy.offsetWidth; sy.classList.add('pop') }
  // menu
  const mn = h('div', 'lb-menu')
  const art = c => c ? `style="--art:url('${c.url}');--fx:${Math.round((c.fx ?? .5) * 100)}%;--fy:${Math.round((c.fy ?? .22) * 100)}%"` : ''
  const pick = f => POOL.filter(f).sort((a, b) => b.ovr - a.ovr)[0]
  const mb = (cls, jp, title, sub, c, fn, badge) => { const b = h('button', 'lb-b ' + cls, `<i class="lb-im" ${art(c)}></i><i class="lb-gl"></i><i class="lb-wm">${jp}</i>${badge ? `<span class="lb-new">${badge}</span>` : ''}<span class="lb-tx"><small>${jp}</small><b>${title}</b>${sub ? `<em>${sub}</em>` : ''}</span>`); b.onclick = fn; return b }
  const owned1 = (P.team || []).map(k => BYKEY[k]).find(Boolean)
  mn.append(
    mb('main', 'バトル', 'BATTLE', 'Story · Tower · Arcs · Event', pick(c => c.anime === 'DBZ') || feat, () => go('battle'), ST.event ? 'EVENT LIVE' : ''),
    mb('c-sum', '召喚', 'SUMMON', B ? 'Limited banner' : 'Packs', feat, () => go('shop'), 'NEW'),
    mb('c-team', 'チーム', 'TEAM', teamSub(), owned1 || pick(c => c.anime === 'FT'), () => go('team')),
    mb('c-cards', 'コレクション', 'CARDS', Object.keys(club()).length + ' owned', pick(c => c.anime === 'BLE'), () => go('cards')),
  )
  { const L = ST.onb, left = L.filter(x => !x.claimed); if (left.length) el.append(onbBlock(L)) }
  lob.append(fc, mn); el.append(lob)
  // quick strip: free packs, wonder pick, pass, players
  const F = ST.free, W = ST.wonderE, full = F.charges >= F.max, qs = h('div', 'lb-quick')
  const q = (title, jp, sub, fn, hot) => { const b = h('button', 'lb-q' + (hot ? ' hot' : ''), `<small>${jp}</small><b>${title}</b><em>${sub}</em>`); b.onclick = fn; return b }
  qs.append(
    q('FREE PACK', '無料', F.charges ? F.charges + ' ready' : `<span data-until="${F.next}"></span>`, async () => { if (!ST.free.charges) return go('shop'); const r = await act('freePack'); if (!r.error) openPack('standard') }, F.charges > 0),
    q('WONDER PICK', 'ワンダー', W.charges + '/' + W.max + ' energy', () => go('wonder'), W.charges > 0),
    q('SEASON PASS', 'パス', ST.pass ? 'Tier ' + ST.pass.tier : '', () => go('pass')),
    q('HOW TO PLAY', '遊び方', 'Guide for new players', () => go('guide'), !ST.profile.guideSeen),
    q('🔥 ' + (ST.login.streak || 0) + '-DAY STREAK', 'ログイン', ST.login.can ? 'Day ' + (ST.login.next + 1) + ' reward ready!' : ST.login.nextM ? (ST.login.nextM - ST.login.streak) + ' days to the ' + ST.login.nextM + '-day bonus' : 'Come back tomorrow', () => loginSheet(), ST.login.can),
    q('PLAYERS', 'ランキング', 'Leaderboard', () => go('players')),
  )
  el.append(qs)
  if (ST.login.can && !window.__loginShown) { window.__loginShown = 1; setTimeout(loginSheet, 700) }
  el.append(showcaseBlock())
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
    history.replaceState(null, '', '#pack-' + t); CURARG = t; (window.requestIdleCallback || setTimeout)(() => packURL(t).catch(() => {}))
    name.innerHTML = `<h2>${pk.name.toUpperCase()}</h2><p>${pool.length} cards · ${t === 'premium' ? 'guaranteed Epic or better' : pk.anime ? ANAME(pk.anime) + ' only' : 'every series'} · +5 pack points</p>${pk.anime ? (() => { const n = (ST.PITY_N || 10) - ((ST.spity || {})[t] || 0); return '<p class="pity">⭐ Legendary+ guaranteed ' + (n <= 1 ? '<b>next pack!</b>' : 'in <b>' + n + '</b> packs') + '</p>' })() : ''}`
    acts.innerHTML = ''
    const free = t === 'standard' && ST.free.charges > 0
    const a = h('button', 'btn ' + (pend || free ? 'green' : 'gold'), pend ? `OPEN PACK<small>${pend} waiting</small>` : free ? `OPEN FREE<small>${ST.free.charges} free left</small>` : `OPEN A PACK<small>${fmt(pk.cost)} coins</small>`)
    a.onclick = async () => { if (pend) return openPack(t); const r = await act(free ? 'freePack' : 'buyPack', { pack: t }); if (!r.error) openPack(t) }
    const c10 = Math.round(pk.cost * 10 * .9), b = h('button', 'btn violet', `BUY 10 & OPEN<small>${fmt(c10)} coins · 10% off</small>`)
    b.disabled = P.coins < c10
    b.onclick = () => buyMulti(t, b)
    acts.append(a, b)
    if (pend > 1) { const o = h('button', 'btn gold block', `OPEN ALL ${pend} PACKS AT ONCE`); o.style.gridColumn = '1 / -1'; o.onclick = () => multiOpen(t, Math.min(pend, 50)); acts.append(o) }
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
let bulkResults = null
PAGES.pulls = el => {
  if (!bulkResults) return PAGES.results(el)
  const { type, n, cards, fresh, upgrades } = bulkResults
  const highlights = [...new Map(cards.map(c => [c.key, c])).values()]
    .filter(c => fresh.has(c.key) || upgrades.has(c.key) || 'LMX'.includes(c.r))
    .sort((a,b) => Number(fresh.has(b.key)) - Number(fresh.has(a.key)) || TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)
  const hero = h('section', 'qol-hero')
  hero.append(h('h2', '', n + '× Pack Results'), h('p', 'qol-metrics',
    cards.length + ' pulled · ' + fresh.size + ' new · ' + upgrades.size + ' Diamond upgrades · ' + cards.filter(c => 'LMX'.includes(c.r)).length + ' Legendary+'))
  const pack = type === 'banner' ? ST.banner : ST.packs[type]
  const cost = pack ? Math.round(pack.cost * 9) : 0
  if (pack && cost > 0 && type !== 'lightning') {
    hero.append(h('p', 'muted', fmt(cost) + ' coins to open again · Balance ' + fmt(P.coins)))
    const again = h('button','btn gold','OPEN ANOTHER 10×')
    again.disabled = P.coins < cost
    again.onclick = () => buyMulti(type, again)
    hero.append(again)
  }
  const exit = h('button','btn dark','BACK TO SHOP')
  exit.onclick = () => go('shop')
  hero.append(exit); el.append(hero)
  const render = (panel, list) => {
    for (const c of list) {
      const button = h('button','cg')
      button.append(cardImg(eff(c), 240))
      if (fresh.has(c.key)) button.append(h('span','nw','NEW'))
      if (upgrades.has(c.key)) button.append(h('span','lv','+' + upgrades.get(c.key) + ' ◆'))
      button.onclick = () => cardDetail(c.key)
      panel.append(button)
    }
  }
  const grid = h('div','cardgrid qol-pull-grid')
  render(grid, highlights.slice(0, 12))
  if (grid.children.length) el.append(h('h3','','Highlights'), grid)
  const details = h('details','qol-hero')
  details.append(h('summary','','All ' + cards.length + ' pulls'))
  details.ontoggle = () => {
    if (!details.open || details.children.length > 1) return
    const full = h('div','cardgrid qol-pull-grid')
    render(full,cards); details.append(full)
  }
  el.append(details)
}
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
const CF = { q: '', anime: 'ALL', rar: 'ALL', mode: 'OWNED', aura: '' }
PAGES.cards = (el, view) => {
  if (view === 'counter') {
    const back = h('button', 'btn dark sm', '‹ COLLECTION')
    back.onclick = () => go('cards')
    back.style.marginBottom = '12px'
    el.append(back)
    return cardCounterPage(el, { h, POOL, BYKEY, P, cardImg, cardDetail, matchesCard, eff }, beats)
  }
  const own = owned(), pct = Math.round(own.length / Math.max(1, POOL.length) * 100)
  const top = own.slice().sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)[0]
  const byR = ORDER.slice().reverse().map(r0 => [r0, own.filter(c => c.r === r0).length, POOL.filter(c => c.r === r0).length]).filter(x => x[2])
  const head = h('section', 'chead')
  head.innerHTML = `${top ? `<div class="ch-card" style="--art:url('${top.url}');--fx:${Math.round((top.fx ?? .5) * 100)}%;--fy:${Math.round((top.fy ?? .22) * 100)}%"><i></i><span>BEST · ${top.name}</span></div>` : ''}
    <div class="ch-main"><small>コレクション</small><h2>COLLECTION</h2>
      <div class="ch-stats"><div class="s1"><b>${own.length}</b><span>OWNED</span></div><div class="s2"><b>${POOL.length}</b><span>IN SET</span></div><div class="s3"><b>${pct}%</b><span>COMPLETE</span></div></div>
      <div class="ch-bar"><i style="width:${pct}%"></i></div>
      <div class="ch-rar">${byR.map(([r0, n, t]) => `<span style="--rc:${tierCol(r0)}"><b>${RARITY_MARK[r0]}</b>${n}/${t}</span>`).join('')}</div></div>`
  if (top) head.querySelector('.ch-card').onclick = () => cardDetail(top.key)
  el.append(head)
  { const mu = h('button', 'btn violet', 'ギャラリー · CARD MUSEUM'); mu.style.marginTop = '4px'; mu.onclick = () => go('museum'); el.append(mu) }
  const counter = h('button', 'btn gold', 'CARD COUNTER')
  counter.style.margin = '4px 0 0 8px'
  counter.onclick = () => go('cards', 'counter')
  el.append(counter)
  const tools = h('div', ''); tools.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:14px'
  const MODES = ['OWNED', 'UNOWNED', 'ALL', 'BINDER', 'WATCHLIST']; const seg = segmented(MODES, Math.max(0, MODES.indexOf(CF.mode)), i => { CF.mode = MODES[i]; draw() })
  const q = h('input', 'field'); q.type = 'search'; q.placeholder = 'Search cards or abilities, e.g. shield break'; q.value = CF.q; q.oninput = () => { CF.q = q.value.trim().toLowerCase(); draw() }
  const an = h('div', 'chips'), ra = h('div', 'chips')
  const auraFilter = h('label', 'tp-f', '<span>TEAM AURA</span>')
  const auraSelect = h('select', 'field')
  auraSelect.append(new Option('Any team aura', ''))
  const auraTags = [...new Set(POOL.flatMap(c => c.aura || []))]
    .sort((a, b) => auraTag(a).localeCompare(auraTag(b)))
  for (const tag of auraTags) auraSelect.append(new Option(auraTag(tag), tag))
  auraSelect.value = CF.aura
  auraSelect.onchange = () => { CF.aura = auraSelect.value; draw() }
  auraFilter.append(auraSelect)
  tools.append(seg, q, auraFilter, an, ra); el.append(tools)
  const grid = h('div', 'cardgrid'); el.append(grid)
  const chipRow = (box, opts, key) => { box.innerHTML = ''; for (const [v, l] of opts) { const b = h('button', 'chip' + (CF[key] === v ? ' on' : ''), l); b.onclick = () => { CF[key] = v; draw() }; box.append(b) } }
  function draw() {
    const animeScroll = an.scrollLeft, rarityScroll = ra.scrollLeft
    chipRow(an, [['ALL', 'All series'], ...[...new Set(POOL.map(c => c.anime))].map(a => [a, ANAME(a)])], 'anime')
    chipRow(ra, [['ALL', 'All rarities'], ...ORDER.slice().reverse().filter(r => POOL.some(c => c.r === r)).map(r => [r, RARITY_MARK[r] + ' ' + TIER[r].name[0] + TIER[r].name.slice(1).toLowerCase()])], 'rar')
    { const b = h('button', 'chip' + (CF.sort === 'NEW' ? ' on' : ''), CF.sort === 'NEW' ? '🆕 Newest' : '⭐ Best first'); b.onclick = () => { CF.sort = CF.sort === 'NEW' ? '' : 'NEW'; draw() }; ra.prepend(b) }
    q.style.display = ra.style.display = auraFilter.style.display = CF.mode === 'BINDER' ? 'none' : ''
    an.scrollLeft = animeScroll; ra.scrollLeft = rarityScroll
    grid.className = 'cardgrid'
    if (CF.mode === 'BINDER') return drawBinder(grid)
    if (CF.mode === 'EVOLVE') return drawEvolve(grid)
    if (CF.mode === 'FUSE') return drawFuse(grid)
    const list = POOL.filter(c => (CF.mode === 'ALL' || (CF.mode === 'WATCHLIST' ? P.watchlist?.includes(c.key) : CF.mode === 'UNOWNED' ? !club()[c.key] : club()[c.key])) && (CF.anime === 'ALL' || c.anime === CF.anime) && (CF.rar === 'ALL' || c.r === CF.rar) && (!CF.aura || tagsOf(c).includes(CF.aura) || c.aura?.includes(CF.aura)) && matchesCard(c, CF.q))
      .sort((a, b) => (CF.aura ? Number(!!b.aura?.includes(CF.aura)) - Number(!!a.aura?.includes(CF.aura)) : 0) || Number(!!club()[b.key]?.favorite) - Number(!!club()[a.key]?.favorite) || (CF.sort === 'NEW' ? (b.added || 0) - (a.added || 0) : 0) || TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)
    grid.innerHTML = ''
    if (!list.length && CF.mode === 'WATCHLIST') {
      const empty = h('div', 'empty', '<b>No matching watched cards</b>Add a card from its detail screen or change your filters.')
      empty.style.gridColumn = '1/-1'; grid.append(empty); return
    }
    if (!list.length) { grid.append(h('div', 'empty', `<b>${own.length ? 'Nothing here' : 'No cards yet'}</b>${own.length ? 'Try a different filter.' : 'Open your free pack on the home screen.'}`)); grid.firstChild.style.gridColumn = '1/-1'; return }
    for (const c of list) {
      const e = club()[c.key], b = h('button', 'cg' + (e ? '' : ' miss')); b.append(cardImg(eff(c), 240))
      if (e) { b.append(h('span', 'n', e.n)); if (e.favorite || e.locked) b.append(h('span', 'card-flags', (e.favorite ? '★' : '') + (e.locked ? ' 🔒' : ''))); if (e.ser && e.ser <= 100) b.append(h('span', 'sr', '#' + e.ser)); if (e.lvl) b.append(h('span', 'lv', '★' + e.lvl)); if ((P.last || []).includes(c.key) && e.n === 1) b.append(h('span', 'nw', 'NEW')) }
      if (!e) b.append(h('span', 'cg-unowned', 'NOT OWNED'))
      if (CF.aura) b.append(h('small', 'watchlist-route',
        c.aura?.includes(CF.aura) ? 'Provides aura' : 'Receives aura'))
      if (CF.mode === 'WATCHLIST') {
        const route = h('small', 'watchlist-route')
        route.textContent = e ? 'Owned' : unlockRoutes(c)[0]
        b.append(route)
      }
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
// press-and-hold (or right-click) any card to open its full profile
{ let t = null, sx = 0, sy = 0, fired = false
  const cardAt = e => { const im = e.target.closest && e.target.closest('img[data-key]'); return im && im.dataset.key }
  addEventListener('pointerdown', e => { fired = false; clearTimeout(t); const k = cardAt(e); if (!k || document.getElementById('opener') || document.querySelector('#arena')) return; sx = e.clientX; sy = e.clientY; t = setTimeout(() => { fired = true; if (navigator.vibrate) navigator.vibrate(15); cardDetail(k) }, 480) }, true)
  addEventListener('pointermove', e => { if (t && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(t); t = null } }, true)
  for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, () => { clearTimeout(t); t = null }, true)
  addEventListener('click', e => { if (fired) { fired = false; e.preventDefault(); e.stopPropagation() } }, true)
  addEventListener('contextmenu', e => { const k = cardAt(e); if (!k || document.getElementById('opener')) return; e.preventDefault(); clearTimeout(t); cardDetail(k) }, true) }
function showForms(card) {
  const dialog = document.createElement('dialog')
  dialog.className = 'forms-preview'
  const header = h('header')
  const close = h('button', 'btn dark sm', 'CLOSE')
  close.onclick = () => dialog.close()
  header.append(h('h2', '', card.name + ' · FORMS'), close)
  const tabs = h('div', 'forms-tabs')
  tabs.setAttribute('role', 'group')
  tabs.setAttribute('aria-label', 'Naruto forms')
  const panel = h('div', 'forms-panel')
  const buttons = [card, ...card.transformations].map((form, i) => {
    const button = h('button', 'btn dark sm', form.ver.split(' · ')[0])
    button.onclick = () => show(i)
    tabs.append(button)
    return button
  })
  function show(i) {
    const form = formCard(card, i)
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === i)))
    const art = cardImg(form, 480)
    // Form previews represent the same owned card, but should never open a second card detail.
    delete art.dataset.key
    const kit = h('div', 'forms-kit')
    kit.setAttribute('aria-live', 'polite')
    kit.append(h('h3', '', form.ver), h('div', 'movebox', `<b>${form.mv}</b><p>${form.tx.join(' ')}</p>`),
      h('div', 'movebox', `<b>${form.pas.n}</b><p>${form.pas.d}</p>`),
      h('p', 'muted', i ? card.transformations[i - 1].requirement : 'Starting form. Transform during battle.'))
    panel.replaceChildren(art, kit)
  }
  dialog.append(header, tabs, panel)
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  document.body.append(dialog)
  dialog.showModal()
  show(0)
}
function formsButton(card) {
  const button = h('button', 'btn gold sm inspect-forms', 'VIEW FORMS & KITS')
  button.onclick = e => { e.stopPropagation(); showForms(eff(card)) }
  return button
}
function compareCards(base) {
  openModal(sh => {
    sh.append(h('h2', '', 'Compare cards'))
    const back = h('button', 'btn dark sm', 'BACK TO CARD')
    back.onclick = () => cardDetail(base.key)
    const pick = h('select', 'field')
    pick.setAttribute('aria-label', 'Second card')
    pick.add(new Option('Choose a card', ''))
    for (const c of POOL.filter(c => c.key !== base.key).sort((a, b) => a.name.localeCompare(b.name))) {
      pick.add(new Option(c.name + ' · ' + c.ver, c.key))
    }
    const slot = h('select', 'field')
    slot.setAttribute('aria-label', 'Team slot to preview')
    for (let i = 0; i < P.team.length; i++) slot.add(new Option('Slot ' + (i + 1) + ' · ' + (BYKEY[P.team[i]]?.name || 'Empty'), i))
    slot.value = String(Math.max(0, P.team.indexOf(base.key)))
    const grid = h('div', 'compare-grid')
    const plain = (tag, value) => { const e = h(tag, ''); e.textContent = value; return e }
    const draw = () => {
      grid.replaceChildren()
      for (const raw of [base, BYKEY[pick.value]].filter(Boolean)) {
        const c = eff(raw), panel = h('section', 'panel pad')
        const lineup = P.team.map(k => BYKEY[k] && eff(BYKEY[k]))
        for (const [i, fighter] of lineup.entries()) if (fighter?.key === c.key) lineup[i] = null
        lineup[Number(slot.value)] = c
        const aura = teamAuras(lineup)
        panel.append(plain('h3', c.name), plain('p', c.ver + ' · ' + c.ovr + ' OVR'),
          plain('p', c.st.map((n, i) => ['PWR', 'SPD', 'ENG', 'TEC', 'DEF', 'IQ'][i] + ' ' + n).join(' · ')),
          plain('strong', c.mv), plain('p', (c.tx || []).join(' ')),
          plain('strong', c.pas?.n || 'Passive'), plain('p', c.pas?.d || '—'),
          plain('strong', 'Team Aura after swap'),
          plain('p', lineup.map((fighter, i) => fighter && aura[i] > 0 ? fighter.name + ' +' + aura[i] + '%' : '').filter(Boolean).join(' · ') || 'No active aura bonuses'))
        grid.append(panel)
      }
    }
    pick.onchange = slot.onchange = draw
    sh.append(back, pick, slot, grid)
    draw()
  }, true)
}
function unlockRoutes(card) {
  const zoneId = deadZoneReward(card)
  const zone = zoneId && ST.deadzones?.find(z => z.id === zoneId)
  if (zone) return [zone.name + ' · Clear every stage']
  if (card.campaignUnlock) return ['Campaign · First clear of ' + card.campaignUnlock]
  if (card.campReward) return ['Campaign · Chapter ' + card.campReward + ' first clear']
  if (card.arcReward) {
    const arc = ST.arcs.find(a => a.id === card.arcReward)
    const cleared = arc && (P.arcs?.[arc.id] || 0) >= arc.chapters.length
    return [cleared ? 'Pack Point Exchange · ' + fmt(ST.ppCost[card.r]) + ' points' : 'Clear ' + (arc?.name || 'its Story Arc')]
  }
  if (card.season === 99) return ['Campaign boss reward']
  if (card.season) return ['Season ' + card.season + ' Pass reward']
  return ['Pack Point Exchange · ' + fmt(ST.ppCost[card.r]) + ' points', 'Craft · ' + fmt(ST.shardCost[card.r]) + ' shards']
}
// ---- plain-language passive breakdown ----
const KIT_WORDS = { dmg: v => '+' + v + '% damage', teamDmg: v => 'Whole team +' + v + '% damage', dodge: v => v + '% chance to dodge attacks', dr: v => 'Takes ' + v + '% less damage', reflect: v => 'Reflects ' + v + '% of damage taken', regen: v => 'Heals ' + v + '% HP every turn', teamHeal: v => 'Heals the whole team ' + v + '% every turn', endure: v => 'Survives ' + (v > 1 ? v + ' KOs' : 'the first KO') + ' at 1 HP', revive: () => 'Comes back once after being KO\'d', first: () => 'Always moves first', pierce: () => 'Every attack ignores Guard', pierceStrike: () => 'Strikes ignore Guard', pierceSpec: () => 'Specials ignore Guard', firstNull: v => 'The first ' + v + ' hit' + (v > 1 ? 's' : '') + ' on this card do nothing', ultDodge: v => 'Erases the first ' + (v > 1 ? v + ' Ultimates' : 'Ultimate') + ' fired at it', nullPassive: () => 'Switches off the enemy\'s passive', burn: v => 'Attacks burn the enemy for ' + v + '% each turn', drain: v => 'Heals for ' + v + '% of damage dealt', exec: v => '+' + v + '% damage to enemies under 40% HP', ramp: v => '+' + v + '% damage every turn it stays in', crit: v => '+' + v + '% critical hit chance', spec: v => 'Specials deal +' + v + '%', strikeBoost: v => 'Strikes deal +' + v + '%', ultBoost: v => 'Ultimate deals +' + v + '%', slow: v => 'Enemy starts with ' + v + ' less Energy', energyBurn: v => 'Each hit removes ' + v + ' enemy Energy', energyTurn: v => '+' + v + ' Energy every turn', doubleUlt: () => 'Ultimate fires twice', twinUlt: () => 'Ultimate fires twice', ultAoe: () => 'Ultimate hits every enemy', doubleStrike: v => v + '% chance for Strikes to hit twice', tripleStrike: () => 'Strikes hit 3 times', adapt: v => 'Takes ' + v + '% less damage after each hit it takes', shield: v => 'Starts with a ' + v + '% HP shield', bleed: v => 'Loses ' + v + '% HP every turn (the cost of its power)', allStats: v => '+' + v + '% to all stats', timeStop: v => v + '% chance per turn to stop the enemy turn', trueDmg: () => 'Ignores the enemy\'s damage reduction', antiKit: () => 'Cancels the enemy\'s defensive passives', blackflash: v => v + '% chance for a 2.5× Black Flash hit' }
function kitBullets(c) { const e = (c.pas && c.pas.e) || {}; const out = []; for (const [k, v] of Object.entries(e)) { const f = KIT_WORDS[k]; if (f) out.push(f(v)) } return out }
async function cardDetail(key, { kitOnly = false, auraDiamonds = 4 } = {}) {
  const base = BYKEY[key]; if (!base) return
  const c = kitOnly ? base : eff(base), e = kitOnly ? null : club()[key], inTeam = P.team.includes(key), spare = spendableCopies(e, inTeam), lvl = e ? e.lvl || 0 : 0
  openModal(sh => {
    const d = h('div', 'detail')
    const big = h('div', 'big'), im = cardImg(c, 600); big.append(im); d.append(big)
    big.onpointermove = ev => { const r = big.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5; im.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg)` }
    big.onpointerleave = () => im.style.transform = ''
    d.append(h('span', 'marks', `<span style="color:${tierCol(c.r)}">${RARITY_MARK[c.r]} ${TIER[c.r].name}</span>`))
    d.append(h('h2', '', c.name), h('span', 'ver', c.ver + (c.tag ? ' · TAG UNIT' : '')))
    if (c.transformations?.length) d.append(formsButton(base))
    if (!kitOnly) {
      const compare = h('button', 'btn dark sm', 'COMPARE CARDS')
      compare.onclick = () => compareCards(base)
      d.append(compare)
      const watched = P.watchlist?.includes(key)
      if (!e || watched) {
        const watch = h('button', 'btn dark sm', watched ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST')
        watch.onclick = async () => {
          watch.disabled = true
          const r = await act('watchCard', { key, value: !watched })
          if (r.error) { watch.disabled = false; return }
          if (CUR === 'cards') rerender()
          cardDetail(key)
        }
        d.append(watch)
        if (!e) {
          const route = h('p', 'muted')
          route.textContent = unlockRoutes(base).join(' · ')
          d.append(route)
        }
      }
    }
    if (e && e.ser) d.append(h('span', 'serial' + (e.ser <= 100 ? ' low' : ''), `SERIAL #${String(e.ser).padStart(4, '0')}${e.ser <= 10 ? ' · ULTRA LOW' : e.ser <= 100 ? ' · LOW SERIAL' : ''}`))
    d.append(h('span', 'eyebrow', `${ANAME(c.anime)} · ${c.faction} · ${c.role}${kitOnly ? ' · OPPONENT' : e ? ` · OWNED ×${e.n}` : ' · NOT OWNED'}`))
    d.append(h('div', 'kv', c.st.map((v, i) => `<div><small>${['PWR', 'SPD', 'ENG', 'TEC', 'DEF', 'IQ'][i]}</small>${v}</div>`).join('')))
    d.append(h('div', 'movebox', `<b style="color:${TYPE[c.t].c[2]}">${TYPE[c.t].en} · ${c.mv}</b><p>${c.tx.join(' ')}</p>`))
    if (e) d.append(progBox(key))
    if (false) { const x = (P.mast || {})[key] || 0, T = ST.mastT, l = T.filter(t => x >= t).length - 1, nx = T[l + 1]; d.append(h('div', 'mastbox', `<b>MASTERY ${l ? 'M' + l : '—'}${l >= 4 ? ' · MASTERED' : ''}</b><i><s style="width:${nx ? Math.min(100, (x - T[l]) / (nx - T[l]) * 100) : 100}%"></s></i><small>${nx ? `${x} / ${nx} XP · win battles with this card in your team` : 'Max mastery reached'}</small>`)) }
    if (c.pas) d.append(h('div', 'movebox pasbox', `<b>⚡ MOMENT · ${c.pas.n}</b><p>${c.pas.d}</p>`))
    { const kb = kitBullets(c); if (kb.length) d.append(h('div', 'movebox howbox', `<b>🔍 HOW IT WORKS</b><ul>${kb.map(x => '<li>' + x + '</li>').join('')}</ul>`)) }
    if (e) { const lv = e.lv || 1, dia = Math.min(7, e.dia || 3), stat = ((lv - 1) * .15).toFixed(1), nextR = lv >= 100 ? null : (Math.floor((lv - 1) / 25) + 1) * 25 + 1; d.append(h('div', 'movebox lvbox', `<b>📈 LEVEL & DIAMONDS</b><p><b>Lv ${lv}/100:</b> +${stat}% all stats, +${Math.floor((lv - 1) / 25)} rating${nextR ? ' · next +1 rating at Lv ' + nextR : ' · MAXED'}. Level 100 = +15% stats, +3 rating. Earn XP from battles (win +60), Training Tickets (+400) or coins.</p><p><b>${dia}◆:</b> +${(dia - 3) * 4}% stats, +${dia - 3} rating from diamonds. Each duplicate pull adds a diamond. 7◆ = Limit Break: the passive gets 25% stronger (e.g. +20% damage → +25%), plus the Awakened Ultimate.</p>`)) }
    if (c.lead) d.append(h('div', 'movebox leadbox', `<b>👑 LEADER SKILL</b><p>${leadText(c.lead)}</p>`))
    if (!kitOnly) { const dd = Math.min(7, (club()[c.key] || {}).dia || 3); d.append(h('div', 'movebox awkbox' + (dd >= 7 ? ' on' : ''), dd >= 7 ? `<b>✦ AWAKENED ULTIMATE · UNLOCKED</b><p>Ultimate deals <b>+35%</b>, gives <b>+2 Energy</b>, heals <b>15%</b> and plays a full cinematic.</p>` : `<b>✦ AWAKENED ULTIMATE · 🔒 7◆</b><p>Reach 7◆ (${dd}/7) to awaken: Ultimate +35% damage, +2 Energy, heals 15%, full cinematic.</p>`)) }
    if (c.aura?.length) { const dd = kitOnly ? auraDiamonds : Math.min(7, (club()[c.key] || {}).dia || 3); d.append(h('div', 'movebox aurabox', `<b>✦ TEAM AURA</b><p>From any slot: <b>+${AURA_PCT[dd]}%</b> to teammates tagged ${c.aura.map(tag => '<span class="atag">' + auraTag(tag) + '</span>').join(' or ')}.</p><small>Grows with diamonds: 3◆ +3% · 5◆ +5% · 7◆ +10%. Auras stack up to +40% per fighter.</small>`)) }
    if (c.arch?.length) d.append(h('div', 'archrow', c.arch.map(x => `<span>${ARCH_ICON[x] || ''} ${x}</span>`).join('')))
    d.append(h('div', 'catrow', [ANAME(c.anime), ...(c.cat || [])].map(x => `<span>${x}</span>`).join('')))
    if (kitOnly) {
      const close = h('button', 'btn dark sm', 'CLOSE KIT')
      close.onclick = closeModal
      d.prepend(close)
      sh.append(d)
      return
    }
    if (e) {
      const a = h('div', 'acts')
      const add = (cls, label, dis, fn) => { const b = h('button', 'btn sm ' + cls, label); b.disabled = !!dis; b.onclick = fn; a.append(b) }
      const flag = async name => {
        const r = await act('cardFlag', { key, flag: name, value: !e[name] })
        if (r.error) return
        if (CUR === 'cards') rerender()
        cardDetail(key)
      }
      add('dark', e.favorite ? '★ REMOVE FAVOURITE' : '☆ FAVOURITE', false, () => flag('favorite'))
      add('dark', e.locked ? '🔒 UNLOCK COPIES' : 'LOCK ALL COPIES', false, () => flag('locked'))
      add('violet', inTeam ? 'IN TEAM' : 'ADD TO TEAM', inTeam, () => { const T = P.team.slice(), i = T.indexOf(null); closeModal(); if (i < 0) { toast('Your team is full. Swap a card on the Team page.'); go('team'); return } T[i] = key; act('team', { team: T }).then(() => go('team')) })
      if (false) add('green', lvl >= 5 ? 'MAX ★' : `LEVEL UP ★${lvl + 1}`, !(e.n > 1 && lvl < 5), async () => { await act('awaken', { key }); cardDetail(key); if (CUR === 'cards') rerender() })
      add('dark', `QUICK SELL ${fmt(ST.quick[key])}`, spare < 1 || ((c.arcReward || c.campReward || c.campaignUnlock || deadZoneReward(c)) && e.n <= 1), async () => { await act('quickSell', { key }); if (club()[key]) cardDetail(key); else closeModal(); if (CUR === 'cards') rerender() })
      if (e.n > 1) add('dark', `SHRED ${e.n - 1} → ◆${fmt((e.n - 1) * ST.shardGet[c.r])}`, spare < 1, async () => { await act('shred', { key }); cardDetail(key); if (CUR === 'cards') rerender() })
      d.append(a)
      d.append(h('span', 'muted', `<small style="font-weight:700">Duplicates add a Diamond (max 7◆). Spare copies after that can be sold or shredded.</small>`))
    }
    if (deadZoneReward(c)) d.append(h('span', 'season-tag', unlockRoutes(c)[0]))
    else if (c.arcReward) {
      const arc = (ST.arcs || []).find(a => a.id === c.arcReward)
      d.append(h('span', 'season-tag', 'STORY ARC REWARD · ' + (arc?.name || 'Clear its Story Arc')))
    } else if (c.campaignUnlock) d.append(h('span', 'season-tag', 'STORY EXCLUSIVE · First clear of ' + c.campaignUnlock))
    else if (c.season) d.append(h('span', 'season-tag', c.season === 99 ? 'STORY EXCLUSIVE · Campaign boss reward' : `SEASON ${c.season} EXCLUSIVE · Season Pass only`))
    else { const cost = ST.shardCost[c.r], cb = h('button', 'btn block dark', `CRAFT FOR ◆${fmt(cost)} SHARDS <small>(you have ${fmt(P.shards || 0)})</small>`); cb.disabled = (P.shards || 0) < cost; cb.onclick = async () => { const r = await act('craft', { key }); if (!r.error) cardDetail(key) }; d.append(cb) }
    sh.append(d)
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
const TB = { target: 'best', series: 'ALL', role: 'ALL', rar: 'ALL', tag: 'ALL' }
const typeOfA = a => (ANIME[a] || {}).type || 'ki'
function buildTargets() {
  const own = owned(), cnt = {}; for (const c of own) cnt[c.anime] = (cnt[c.anime] || 0) + 1
  const T = [{ id: 'best', label: 'BEST OVERALL', sub: 'Highest power, with synergy if it pays off' }]
  if (ST.event) T.push({ id: 'vs:' + ST.event.anime, label: '⚡ EVENT · ' + ANAME(ST.event.anime).toUpperCase(), sub: 'Counter this week\'s event enemies', hot: 1 })
  for (const arc of ST.arcs || []) if (((P.arcs || {})[arc.id] || 0) < arc.chapters.length && POOL.some(c => c.anime === arc.anime)) T.push({ id: 'vs:' + arc.anime, label: 'ARC · ' + arc.name.toUpperCase(), sub: 'Counter ' + ANAME(arc.anime) + ' fighters' })
  for (const a of Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])) if (cnt[a] >= 3) T.push({ id: 'series:' + a, label: ANAME(a).toUpperCase() + ' TEAM', sub: cnt[a] + ' owned · up to +' + (SYN[Math.min(6, cnt[a])] || 0) + '% synergy' })
  return T.filter((t, i, L) => L.findIndex(u => u.id === t.id) === i)
}
function scoreFor(c, target) {
  let v = c.ovr
  if (target.startsWith('vs:')) { const ea = target.slice(3), et = typeOfA(ea); if (beats(c.t || typeOfA(c.anime), et)) v += 8; if (beats(et, c.t || typeOfA(c.anime))) v -= 6; const e = (c.pas || {}).e || {}; if (e.vsAnime === ea) v += 12 }
  return v
}
function autoTeam(target) {
  const own = owned().slice(); if (!own.length) return null
  let pick
  if (target.startsWith('series:')) { const a = target.slice(7); pick = own.filter(c => c.anime === a).sort((x, y) => y.ovr - x.ovr).slice(0, 6); pick = pick.concat(own.filter(c => !pick.includes(c)).sort((x, y) => y.ovr - x.ovr)).slice(0, 6) }
  else {
    const sorted = own.sort((x, y) => scoreFor(y, target) - scoreFor(x, target)), val = L => { const AB = teamAuras(L); return L.reduce((n, c) => n + scoreFor(c, target), 0) / L.length * (1 + synergy(L).bonus / 100) * (1 + AB.reduce((n, v) => n + v, 0) / L.length / 160) }
    pick = sorted.slice(0, 6); let best = val(pick)
    for (const a of new Set(own.map(c => c.anime))) { const S = sorted.filter(c => c.anime === a).slice(0, 6); if (S.length < 3) continue; for (let k = 3; k <= S.length; k++) { const L = S.slice(0, k).concat(sorted.filter(c => c.anime !== a)).slice(0, 6); const v = val(L); if (v > best) { best = v; pick = L } } }
    // aura pass: swap in cards that link up with the team's aura tags
    { const cand = sorted.slice(0, 60); for (let pass = 0; pass < 2; pass++) for (let i = 0; i < pick.length; i++) for (const c of cand) { if (pick.some(p => p.key === c.key)) continue; const L = pick.slice(); L[i] = c; const v = val(L); if (v > best) { best = v; pick = L } } }
  }
  pick.sort((x, y) => scoreFor(y, target) - scoreFor(x, target))
  const lead = pick[0], rest = pick.slice(1).sort((x, y) => ((y.faction === lead.faction) * 2 + (y.anime === lead.anime)) - ((x.faction === lead.faction) * 2 + (x.anime === lead.anime)) || scoreFor(y, target) - scoreFor(x, target))
  const T = [lead, ...rest].map(c => c.key); while (T.length < 6) T.push(null); return T
}
let TTAB = 0; try { TTAB = +(localStorage.getItem('aut-teamTab') || 0) || 0 } catch { }
const teamPower = T => Math.round(T.reduce((n, c) => n + (c ? (c.ovr * 2400 + (c.dia || 3) * 9000 + (c.lv || 1) * 900) * (c.boosted ? 1.12 : 1) : 0), 0))
PAGES.team = (el) => {
  retryPanel(el, 'deck')
  const TC = P.team.map(k => k && BYKEY[k] && eff(BYKEY[k])), LI = leaderInfo(TC[0] ? TC : []), count = TC.filter(Boolean).length
  for (const c of TC) if (c && LI.lead && leadHits(LI.lead, c)) c.boosted = 1
  const presets = ST.presets || []
  // tabs + power
  const top = h('div', 'tm-top')
  for (let i = 0; i < 3; i++) { const t = h('button', 'tm-tab' + (i === TTAB ? ' on' : ''), (presets[i] && presets[i].name) || 'Team ' + (i + 1))
    t.onclick = async () => {
      if (i === TTAB || top.dataset.loading) return
      top.dataset.loading = '1'
      try {
        const saved = await act('teamPreset', { i: TTAB, name: presets[TTAB]?.name || 'Team ' + (TTAB + 1), team: P.team })
        if (saved.error) return
        const loaded = await act('teamPresetLoad', { i })
        if (loaded.error) return
        TTAB = i
        try { localStorage.setItem('aut-teamTab', i) } catch { }
        DK.i = ST.deckOn; DK.c = null
        rerender()
      } finally { delete top.dataset.loading }
    }
    top.append(t) }
  top.append(h('div', 'tm-pow', `<small>TEAM POWER</small><b>${teamPower(TC).toLocaleString()}</b>`))
  el.append(top)
  const SB = slotBoosts(TC), filled = SB.filter(Boolean), avgB = filled.length ? Math.round(filled.reduce((n, b) => n + b.total, 0) / filled.length) : 0
  const lowT = filled.length ? Math.min(...filled.map(b => b.total)) : 0, weakI = SB.findIndex(b => b && b.total === lowT && b.total < avgB * .6)
  if (count) { const MV = multiverse(TC); el.append(h('div', 'tm-bond' + (MV.pct ? ' on mv' : ''), MV.pct ? `<b>🌌 MULTIVERSE · ${MV.n} SERIES</b><span>Mixed team: +${MV.pct}% HP and stats${MV.ki ? ', +1 Energy every turn' : ''}.</span>` : `<b>🌌 MULTIVERSE · ${MV.n} SERIES</b><span>Mix 3+ series for +5% stats, 4 for +8%, 5–6 for +12% and +1 Energy a turn.</span>`)) }
  if (count) { const BD = squadBond(TC); el.append(h('div', 'tm-bond' + (BD.tier ? ' on' : ''), BD.tier ? `<b>🛡️ SQUAD BOND · ${BD.n}/6 ${auraTag(BD.tag || '')}</b><span>Team takes ${BD.dr}% less damage${BD.regen ? ', heals ' + BD.regen + '% a turn' : ''}${BD.save ? ', your leader survives one KO' : ''}.</span>` : `<b>🛡️ SQUAD BOND · ${BD.n}/6</b><span>Get 4+ fighters sharing one aura tag for team damage reduction. 5 adds healing, 6 adds a KO save.</span>`)) }
  if (count) { const bar = h('div', 'tm-boost', `<div><small>TEAM BOOST</small><b>+${avgB}%</b></div><p>${avgB >= 30 ? '🟢 Great fit. Your cards boost each other.' : avgB >= 15 ? '🟡 Decent. Some cards don\'t link up.' : '🔴 Weak links. Cards aren\'t boosting each other.'}</p>`), dt = h('button', 'btn dark sm', TDET ? 'HIDE DETAILS' : 'DETAILS'); dt.onclick = () => { TDET = !TDET; rerender() }; bar.append(dt); el.append(bar)
    { const LA = teamLinks(TC).active; const lr = h('div', 'tm-links', '<b>🔗 LINKS</b>'); if (LA.length) for (const x of LA) lr.append(h('span', 'tl', `${TC[x.i].name.split(' ')[0]} ↔ ${TC[x.j].name.split(' ')[0]} <em>${x.links.map(l => l.n).join(' · ')} +${x.links.reduce((n, l) => n + l.pct, 0)}%</em>`)); else lr.append(h('small', '', 'No links yet. Put characters who belong together next to each other: Goku ↔ Vegeta, Luffy ↔ Zoro, two Swordsmen, same faction…')); el.append(lr) }
    if (TDET) { const t = h('div', 'tm-det', '<div class="tdr th"><span>CARD</span><span>👑 LEADER</span><span>📺 SERIES</span><span>✦ AURA</span><span>🔗 LINK</span><span>TOTAL</span></div>'); TC.forEach((c, i) => { const b = SB[i]; if (!c) return; t.append(h('div', 'tdr', `<span>${c.name}</span><span>+${b.lead}%</span><span>+${b.series}%</span><span title="${(c.aura || []).map(auraTag).join(' · ')}">+${b.aura}%</span><span>+${b.link}%</span><b>+${b.total}%</b>`)) }); t.append(h('small', '', 'Leader: boosts cards sharing its category. Series: 3+ cards from one anime. Aura: tagged recipients gain bonuses from any matching card. Link: neighbours in lineup order (Leader → Main 1 → Main 2 → Sub 1 → Sub 2 → Sub 3) that belong together.')); el.append(t) } }
  // leader + slots
  const main = h('section', 'tm-main'), L = TC[0]
  const lb = h('button', 'tm-lead tap' + (L ? '' : ' empty')); lb.append(h('span', 'tm-tag', 'LEADER'))
  if (L) { lb.append(cardImg(L, 420), h('div', 'tm-meta', `<b>${L.name}</b><span>${diaStr(L.dia || 3)} · Lv ${L.lv || 1}</span>`)) } else lb.append(h('div', 'tm-plus', '+<small>PICK A LEADER</small>'))
  if (L && SB[0]) { const b = SB[0], k = weakI === 0 ? 'r' : b.total >= Math.max(15, avgB * .8) ? 'g' : 'y'; lb.classList.add('fit-' + k); lb.append(h('span', 'tm-badge fb-' + k, (k === 'g' ? '🟢 ' : k === 'y' ? '🟡 ' : '🔴 ') + '+' + b.total + '%')) }
  const auraButton = i => {
    const button = h('button', 'aura-slot-button', '+' + SB[i].aura + '% AURA · FIND TEAMMATES')
    button.onclick = () => auraPlanner(TC, i)
    return button
  }
  lb.onclick = () => teamPicker(0)
  const leaderSlot = h('div', 'aura-team-slot'); leaderSlot.append(lb)
  if (L) leaderSlot.append(auraButton(0))
  main.append(leaderSlot)
  const right = h('div', 'tm-right')
  right.append(h('div', 'tm-skill', LI.lead ? `<b>👑 LEADER SKILL</b><span>${leadText(LI.lead)}</span><em>${LI.n}/${count} BOOSTED</em>` : '<b>👑 NO LEADER</b><span>Put a card in the Leader slot. Its skill boosts every fighter that shares a category with it.</span>'))
  const slot = i => { const c = TC[i], btn = h('button', 'tm-slot tap' + (c ? (c.boosted ? ' bst' : ' nob') : ' empty'))
    if (c) { const b = SB[i], k = i === weakI ? 'r' : b.total >= Math.max(15, avgB * .8) ? 'g' : 'y'; btn.classList.add('fit-' + k); btn.append(cardImg(c, 260), h('span', 'tm-badge fb-' + k, (k === 'g' ? '🟢 ' : k === 'y' ? '🟡 ' : '🔴 ') + '+' + b.total + '%'), h('div', 'tm-sm', `<span>${diaStr(c.dia || 3)}</span><span>Lv ${c.lv || 1}</span>`)) } else btn.append(h('div', 'tm-plus', '+'))
    btn.onclick = () => teamPicker(i)
    if (c) {
      const w = h('div', 'tm-slotwrap aura-team-slot')
      w.append(btn, auraButton(i))
      return w
    }
    return btn }
  right.append(h('div', 'tm-lbl', 'MAIN · FIGHT FIRST')); { const g = h('div', 'tm-mainrow'); g.append(slot(1), slot(2)); right.append(g) }
  right.append(h('div', 'tm-lbl', 'SUB · SWAP IN DURING BATTLE')); { const g = h('div', 'tm-subrow'); g.append(slot(3), slot(4), slot(5)); right.append(g) }
  main.append(right); el.append(main)
  // actions
  const acts = h('div', 'tm-acts')
  const ab = h('button', 'btn gold', 'AUTO BUILD'); ab.onclick = () => { TBX.show = !TBX.show; rerender(); setTimeout(() => document.querySelector('.tbx')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60) }
  const D = ST.decks[ST.deckOn], dk = h('button', 'btn violet', 'ARTS DECK · ' + D.name.toUpperCase()); dk.onclick = () => { DK.i = ST.deckOn; DK.c = null; go('deck') }
  const cl = h('button', 'btn dark', 'CLEAR'); cl.onclick = async () => { await act('team', { team: [null, null, null, null, null, null] }); rerender() }
  const suggest = h('button', 'btn violet', 'SUGGEST TEAMMATES')
  suggest.onclick = () => auraPlanner(TC)
  acts.append(suggest, ab, dk, cl); el.append(acts)
  if (TBX.show) teamBuilderPanel(el)
}
// ---- TEAM BOOST: leader + series synergy + auras rolled into one number per card ----
function slotBoosts(TC) {
  const LI = leaderInfo(TC[0] ? TC : []), syn = synergy(TC), AB = teamAuras(TC), LK = teamLinks(TC).pct
  return TC.map((c, i) => { if (!c) return null; const lead = LI.lead && leadHits(LI.lead, c) ? LI.lead.pct : 0, series = syn.anime && c.anime === syn.anime ? syn.bonus : 0, aura = AB[i] || 0, link = LK[i] || 0; return { lead, series, aura, link, total: lead + series + aura + link } })
}
const TEAM_SLOT_NAMES = ['Leader', 'Main 1', 'Main 2', 'Bench 1', 'Bench 2', 'Bench 3']
const TEAM_KIT_PAIRS = [
  ['byakuya_senbonzakura_senkei', 'toshiro_daiguren_frozen_field', 'Byakuya + Tōshirō · Captain Combo'],
  ['sting_white_dragon', 'rogue_cheney_dragon_force', 'Sting + Rogue · Twin Dragons'],
  ['toji_hidden_inventory_rearm', 'maki_toji_heavenly_restricti', 'Toji + Maki & Toji · Heavenly Restriction Duo'],
  ['vegeta_ssj4_final_shine', 'goku_gt_primal_power', 'SSJ4 Vegeta + GT Goku · Primal Pride'],
]
const kitPairs = team => TEAM_KIT_PAIRS.filter(([a, b]) => team.some(c => c?.id === a) && team.some(c => c?.id === b)).map(pair => pair[2])
function boostChangeRow(card, before, after) {
  const row = h('div', 'aura-swap-row qol-boost-row')
  row.append(h('b', '', card.name))
  for (const [key, label] of [['aura','Aura'],['lead','Leader'],['series','Series'],['link','Links']]) {
    const from = before?.[key] || 0, to = after?.[key] || 0
    row.append(h('small', to > from ? 'gain' : to < from ? 'loss' : 'muted',
      label + ' ' + from + '% → ' + to + '% (' + auraDelta(to - from) + ')'))
  }
  return row
}
const auraDelta = n => n > 0 ? '+' + n + '%' : n < 0 ? '−' + Math.abs(n) + '%' : '0%'
const auraMatch = (source, target) => {
  if (!auraHits(source, target)) return null
  const targetTags = tagsOf(target)
  return { tags: [...new Set(source.aura.filter(tag => targetTags.includes(tag)))],
    pct: AURA_PCT[Math.min(7, Math.max(3, source.dia || 3))] }
}
const auraPairText = (verb, match) => verb + ' +' + match.pct + '% · ' + match.tags.map(auraTag).join(' / ')

function auraPlanner(team, initialFocus, state = {}) {
  let focus = initialFocus ?? team.findIndex(Boolean)
  let { mode = 'any', query = '', limit = 12 } = state
  const filtersState = { series: '', rarity: '', role: '', aura: '', destination: '', sort: 'fit', ...state.filters }
  openModal(sh => {
    sh.classList.add('aura-workbench')
    const close = h('button', 'btn dark sm', 'CLOSE')
    close.onclick = closeModal
    const header = h('header', 'aura-header')
    header.append(h('h2', '', 'Find Teammates'), close)
    const panel = h('div', 'aura-workbench-body')
    sh.append(header, h('p', 'muted', 'Auras give bonuses to fighters with matching tags. They work from any slot, and both fighters can buff each other.'), panel)
    const candidates = owned().filter(c => !team.some(m => m?.key === c.key)).map(eff)
    function draw() {
      panel.replaceChildren()
      const roster = h('div', 'aura-roster chips')
      const focusCard = team[focus]
      for (const [i, card] of team.entries()) {
        if (!card) continue
        const btn = h('button', 'chip' + (i === focus ? ' on' : ''), card.name)
        btn.title = card.ver + ' · ' + TEAM_SLOT_NAMES[i]
        btn.setAttribute('aria-pressed', String(i === focus))
        btn.onclick = () => { focus = i; mode = 'any'; limit = 12; draw() }
        roster.append(btn)
      }
      if (roster.children.length) panel.append(roster)
      const locked = team.filter(c => c && TBX.locks.includes(c.key))
      if (focusCard) {
        const summary = h('section', 'aura-focus')
        const info = h('div')
        const total = teamAuras(team)[focus]
        info.append(h('h3', '', focusCard.name), h('small', '', focusCard.ver),
          h('strong', '', '+' + total + '% current aura'))
        const pin = h('button', 'btn dark sm', TBX.locks.includes(focusCard.key) ? 'UNLOCK FIGHTER' : 'LOCK FIGHTER')
        pin.setAttribute('aria-pressed', String(TBX.locks.includes(focusCard.key)))
        pin.onclick = () => {
          TBX.locks = TBX.locks.includes(focusCard.key)
            ? TBX.locks.filter(key => key !== focusCard.key) : [...TBX.locks, focusCard.key]
          draw()
        }
        summary.append(cardImg(focusCard, 180), info, pin)
        panel.append(summary)
        const sources = h('div', 'aura-sources')
        for (const giver of team.filter(Boolean)) {
          const contribution = auraMatch(giver, focusCard)
          if (contribution) sources.append(h('span', 'aura-pill', auraPairText(giver === focusCard ? 'Self' : giver.name, contribution)))
        }
        if (!sources.children.length) sources.append(h('small', 'muted', 'No current aura sources for this fighter.'))
        else if (total === 40) sources.append(h('small', 'muted', 'Aura cap reached.'))
        panel.append(sources)
      }
      if (locked.length) panel.append(h('p', 'aura-locked', 'Locked for suggestions and Auto Build · ' + locked.map(c => c.name).join(', ')))
      const kits = kitPairs(team)
      if (kits.length) panel.append(h('p', 'aura-locked', 'Battle kit combos · ' + kits.join(' / ')))
      const availableSlots = team.map((_, i) => i).filter(i => i !== focus && (!team[i] || !TBX.locks.includes(team[i].key)))
      if (!availableSlots.length) { panel.append(h('p', 'muted', 'Unlock a fighter to preview a replacement.')); return }

      const options = focusCard ? [['any', 'All matches'], ['in', 'Buffs this fighter'], ['out', 'Receives this aura'], ['both', 'Mutual']] : [['any', 'Available fighters']]
      const filters = h('div', 'aura-filters chips')
      for (const [value, label] of options) {
        const btn = h('button', 'chip' + (mode === value ? ' on' : ''), label)
        btn.setAttribute('aria-pressed', String(mode === value))
        btn.onclick = () => { mode = value; limit = 12; renderResults() }
        filters.append(btn)
      }
      const search = h('input', 'field')
      search.type = 'search'; search.placeholder = 'Search owned cards or tags'; search.value = query
      search.setAttribute('aria-label', 'Search owned teammates')
      const results = h('div', 'aura-results')
      const filterGrid = h('div', 'aura-filter-grid')
      const choices = (values, label = value => value) => [...new Set(values)].filter(Boolean)
        .map(value => [value, label(value)]).sort((a, b) => a[1].localeCompare(b[1]))
      function select(key, label, entries) {
        const field = h('label', 'aura-select')
        const input = h('select', 'field')
        for (const [value, caption] of entries) input.append(new Option(caption, value))
        if (!entries.some(([value]) => value === filtersState[key])) filtersState[key] = entries[0][0]
        input.value = filtersState[key]
        input.onchange = () => { filtersState[key] = input.value; limit = 12; renderResults() }
        field.append(h('span', '', label), input); filterGrid.append(field)
        return input
      }
      select('series', 'Series', [['', 'All series'], ...choices(candidates.map(c => c.anime), ANAME)])
      select('rarity', 'Rarity', [['', 'All rarities'], ...ORDER.slice().reverse().filter(r => candidates.some(c => c.r === r)).map(r => [r, TIER[r].name])])
      select('role', 'Role', [['', 'All roles'], ...choices(candidates.map(c => c.role))])
      select('aura', 'Aura tag', [['', 'Any aura tag'], ...choices(candidates.flatMap(c => [...tagsOf(c), ...(c.aura || [])]), auraTag)])
      select('destination', 'Slot', [['', 'Best available slot'], ...availableSlots.map(i => [String(i), TEAM_SLOT_NAMES[i] + (team[i] ? ' · ' + team[i].name : ' · Empty')])])
      select('sort', 'Sort by', [['fit', 'Best aura fit'], ['rating', 'Highest rating'], ['name', 'Name A–Z']])
      const footer = h('div', 'aura-results-header')
      const count = h('strong')
      const reset = h('button', 'ghost', 'RESET FILTERS')
      reset.onclick = () => {
        Object.assign(filtersState, { series: '', rarity: '', role: '', aura: '', destination: '', sort: 'fit' })
        query = ''; mode = 'any'; limit = 12; draw()
      }
      footer.append(count, reset)
      if (!focusCard) panel.append(h('p', 'aura-locked', 'Start with a fighter, then build around their aura.'))
      panel.append(filters, search, filterGrid, footer, results)
      search.oninput = () => { query = search.value; limit = 12; renderResults() }
      function renderResults() {
        for (const [i, btn] of [...filters.children].entries()) {
          const pressed = mode === options[i][0]
          btn.classList.toggle('on', pressed); btn.setAttribute('aria-pressed', String(pressed))
        }
        const before = teamAuras(team)
        const pinned = team.map((c, i) => c && locked.includes(c) ? i : -1).filter(i => i >= 0)
        const needle = query.trim().toLowerCase()
        const ranked = []
        const oldKits = kitPairs(team)
        for (const card of candidates) {
          if ((filtersState.series && card.anime !== filtersState.series) ||
              (filtersState.rarity && card.r !== filtersState.rarity) ||
              (filtersState.role && card.role !== filtersState.role) ||
              (filtersState.aura && ![...tagsOf(card), ...(card.aura || [])].includes(filtersState.aura))) continue
          const incoming = auraMatch(card, focusCard), outgoing = auraMatch(focusCard, card)
          const helpsLocked = locked.some(c => auraHits(card, c) || auraHits(c, card))
          const addsKit = kitPairs([...team, card]).some(pair => !oldKits.includes(pair))
          if (focusCard && !(mode === 'both' ? incoming && outgoing : mode === 'in' ? incoming : mode === 'out' ? outgoing : incoming || outgoing || helpsLocked || addsKit)) continue
          if (needle && ![card.name, card.ver, ...tagsOf(card), ...(card.aura || [])].some(s => s && auraTag(s).toLowerCase().includes(needle))) continue
          let best
          for (const slot of availableSlots) {
            if (filtersState.destination && slot !== Number(filtersState.destination)) continue
            const next = team.slice(); next[slot] = card
            const after = teamAuras(next)
            const pinnedGain = pinned.reduce((sum, i) => sum + after[i] - before[i], 0)
            const net = after.reduce((sum, value, i) => sum + value - before[i], 0)
            const activatesKit = kitPairs(next).some(pair => !oldKits.includes(pair))
            const score = pinnedGain * 8 + (focusCard ? (after[focus] - before[focus]) * 4 : 0) + net + Number(!team[slot]) * 12 + Number(activatesKit) * 10
            if (!best || score > best.score) best = { slot, score, after, activatesKit }
          }
          if (best) ranked.push({ card, incoming, outgoing, ...best })
        }
        ranked.sort((a, b) => (filtersState.sort === 'name' ? a.card.name.localeCompare(b.card.name) :
          filtersState.sort === 'rating' || !focusCard ? b.card.ovr - a.card.ovr : b.score - a.score) || b.card.ovr - a.card.ovr)
        count.textContent = ranked.length + (ranked.length === 1 ? ' fighter' : ' fighters')
        results.replaceChildren()
        for (const { card, incoming, outgoing, slot, after, activatesKit } of ranked.slice(0, limit)) {
          const tile = h('button', 'aura-candidate')
          const details = h('div')
          details.append(h('b', '', card.name), h('small', 'muted', card.ver), h('small', 'aura-candidate-meta', ANAME(card.anime) + ' · ' + TIER[card.r].name + ' · ' + card.role + ' · ' + card.ovr + ' OVR'))
          if (incoming) details.append(h('span', 'aura-pill', auraPairText('Gives', incoming)))
          if (activatesKit) details.append(h('span', 'aura-pill', 'Battle kit combo'))
          if (outgoing) details.append(h('span', 'aura-pill received', auraPairText('Receives', outgoing)))
          if (focusCard) details.append(h('small', 'muted', focusCard.name + ' aura change · ' + auraDelta(after[focus] - before[focus])))
          details.append(h('small', 'aura-preview-link', (filtersState.destination || focusCard ? 'Preview in ' + TEAM_SLOT_NAMES[slot] : 'Choose a slot') + ' →'))
          tile.append(cardImg(card, 180), details)
          tile.onclick = () => previewTeamSwap(card, slot, () => auraPlanner(team, focus, { filters: filtersState, mode, query, limit }), focusCard?.key)
          results.append(tile)
        }
        if (!ranked.length) results.append(h('p', 'muted', 'No matches. Try another fighter or aura filter.'))
        if (ranked.length > limit) {
          const more = h('button', 'btn dark sm', 'SHOW MORE · ' + (ranked.length - limit))
          more.onclick = () => { limit += 12; renderResults() }; results.append(more)
        }
      }
      renderResults()
    }
    draw()
  })
}

function previewTeamSwap(card, initialSlot, back, protectedKey) {
  let slot = initialSlot
  openModal(sh => {
    sh.classList.add('aura-workbench')
    const heading = h('header', 'aura-header')
    const returnBtn = h('button', 'btn dark sm', 'BACK')
    returnBtn.onclick = back
    heading.append(h('h2', '', 'Preview Swap'), returnBtn)
    const picker = h('select', 'field')
    picker.setAttribute('aria-label', 'Destination slot')
    const breakdown = h('div', 'aura-swap-breakdown')
    const save = h('button', 'btn gold', 'CONFIRM SWAP')
    const team = P.team.map(key => BYKEY[key] ? eff(BYKEY[key]) : null)
    const canPlace = (c, i) => i === initialSlot || (!c || (c.key !== protectedKey && !TBX.locks.includes(c.key)))
    team.forEach((c, i) => { if (canPlace(c, i)) picker.append(new Option(TEAM_SLOT_NAMES[i] + ' · ' + (c?.name || 'Empty'), i)) })
    picker.value = String(slot)
    const focus = h('div', 'aura-focus')
    focus.append(cardImg(card, 200), h('h3', '', card.name + ' · ' + card.ver))
    sh.append(heading, focus, picker, breakdown, save)
    const before = slotBoosts(team)
    const draw = () => {
      const afterTeam = team.slice(); afterTeam[slot] = card
      const after = slotBoosts(afterTeam)
      breakdown.replaceChildren(h('p', 'muted', team[slot] ? 'Replaces ' + team[slot].name + ' in ' + TEAM_SLOT_NAMES[slot] : 'Fills ' + TEAM_SLOT_NAMES[slot]))
      for (const [i, c] of afterTeam.entries()) {
        if (!c) continue
        breakdown.append(boostChangeRow(c, i === slot ? null : before[i], after[i]))
        if (i === slot && team[i]) breakdown.append(boostChangeRow(team[i], before[i], null))
      }
      const kits = kitPairs(afterTeam)
      if (kits.length) breakdown.append(h('p', 'aura-locked', 'Battle kit combos · ' + kits.join(' / ')))
      const links = teamLinks(afterTeam).active.flatMap(x => x.links.map(link => link.n))
      if (links.length) breakdown.append(h('p', 'aura-locked', 'Active lineup links · ' + [...new Set(links)].join(' · ')))
    }
    picker.onchange = () => { slot = Number(picker.value); draw() }
    save.onclick = async () => {
      save.disabled = true
      const keys = P.team.slice()
      if (keys.includes(card.key) || keys.some((key, i) => (key || null) !== (team[i]?.key || null))) {
        toast('Your team changed. Open a fresh preview.', 'red'); save.disabled = false; return
      }
      keys[slot] = card.key
      const result = await act('team', { team: keys })
      if (result.error) { save.disabled = false; return }
      closeModal(); rerender()
    }
    draw()
  })
}
function previewSlotSwap(slot, other) {
  const keys = P.team.slice(), next = keys.slice()
  ;[next[slot], next[other]] = [next[other], next[slot]]
  const lineup = keys => keys.map(key => BYKEY[key] ? eff(BYKEY[key]) : null)
  const before = slotBoosts(lineup(keys)), afterTeam = lineup(next), after = slotBoosts(afterTeam)
  openModal(sh => {
    sh.classList.add('aura-workbench')
    const back = h('button','btn dark sm','BACK'); back.onclick = () => teamPicker(slot)
    sh.append(h('h2','','Preview Slot Swap'),back)
    afterTeam.forEach((card,i) => { if (card) sh.append(boostChangeRow(card,before[keys.indexOf(card.key)],after[i])) })
    const save = h('button','btn gold','CONFIRM SWAP')
    save.onclick = async () => {
      if (keys.some((key,i) => key !== P.team[i])) { toast('Your team changed. Open a fresh preview.','err'); return }
      save.disabled = true
      const result = await act('team',{team:next})
      if (result.error) { save.disabled = false; return }
      closeModal(); rerender()
    }
    sh.append(save)
  })
}
let TDET = false
function teamPicker(slot) {
  openModal(sh => {
    sh.append(h('div', 'sec', `<h3>${slot === 0 ? 'PICK YOUR LEADER' : slot < 3 ? 'PICK A STARTER' : 'PICK A BENCH CARD'}</h3>`))
    if (P.team[slot]) { const rm = h('button', 'ghost', 'Remove this card'); rm.onclick = async () => { const T = P.team.slice(); T[slot] = null; await act('team', { team: T }); closeModal(); rerender() }; sh.append(rm) }
    { // swap with another team slot
      const others = [0, 1, 2, 3, 4, 5].filter(j => j !== slot && (P.team[j] || P.team[slot]))
      if (others.length) { const sw = h('div', 'tp-swap', '<small>SWAP WITH</small>'), row = h('div', 'tp-swrow')
        for (const j of others) { const c = P.team[j] && BYKEY[P.team[j]], b = h('button', 'tp-sw', `<em>${j === 0 ? 'LEADER' : j < 3 ? 'MAIN' : 'SUB'}</em><b>${c ? c.name : 'Empty slot'}</b>`)
          b.onclick = () => previewSlotSwap(slot, j); row.append(b) }
        sw.append(row); sh.append(sw) } }
    const LD0 = slot !== 0 && P.team[0] && BYKEY[P.team[0]] && BYKEY[P.team[0]].lead, avail = owned().filter(c => !P.team.includes(c.key)).sort((x, y) => (LD0 ? leadHits(LD0, y) - leadHits(LD0, x) : 0) || y.ovr - x.ovr), teamAnime = synergy(P.team.map((k, i) => i !== slot && k && BYKEY[k])).anime
    const sel = (lbl, key, opts) => { const w = h('label', 'tp-f', `<span>${lbl}</span>`), s2 = document.createElement('select'); for (const [v, t] of opts) { const o = new Option(t, v); if (TB[key] === v) o.selected = true; s2.append(o) } s2.onchange = () => { TB[key] = s2.value; draw() }; w.append(s2); return w }
    const series = [...new Set(avail.map(c => c.anime))].sort((a, b) => ANAME(a).localeCompare(ANAME(b)))
    const mates = P.team.map((k, j) => j !== slot && k && BYKEY[k]).filter(Boolean), fitsTeam = c => mates.some(m => auraHits(m, c) || auraHits(c, m))
    const bar = h('div', 'tp-bar')
    bar.append(sel('SERIES', 'series', [['ALL', 'All series'], ...(teamAnime ? [['TEAM', 'Matches team (' + ANAME(teamAnime) + ')']] : []), ...series.map(a => [a, ANAME(a)])]), sel('ROLE', 'role', [['ALL', 'All roles'], ...['FIGHTER', 'ASSASSIN', 'TANK', 'SUPPORT', 'SHOOTER', 'STRIKER'].filter(r => avail.some(c => c.role === r)).map(r => [r, r])]), sel('RARITY', 'rar', [['ALL', 'All rarities'], ...ORDER.slice().reverse().filter(r => avail.some(c => c.r === r)).map(r => [r, TIER[r].name])]), (() => { const cnt = {}; for (const c of avail) for (const t of new Set([...(c.arch || []).map(x => 'ARCH:' + x), ...(c.cat || []), ...(c.aura || [])])) cnt[t] = (cnt[t] || 0) + 1; return sel('TAG / AURA', 'tag', [['ALL', 'All tags'], ['FIT', '✦ Fits my team'], ...Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).map(t => [t, auraTag(t) + ' · ' + cnt[t]])]) })())
    sh.append(bar)
    const g = h('div', 'cardgrid'); sh.append(g)
    function draw() {
      g.innerHTML = ''
      const list = avail.filter(c => (TB.series === 'ALL' || (TB.series === 'TEAM' ? c.anime === teamAnime : c.anime === TB.series)) && (TB.role === 'ALL' || c.role === TB.role) && (TB.rar === 'ALL' || c.r === TB.rar) && (TB.tag === 'ALL' || (TB.tag === 'FIT' ? fitsTeam(c) : tagsOf(c).includes(TB.tag.replace(/^ARCH:/, '')) || c.aura?.includes(TB.tag)))).sort((a, b) => scoreFor(b, TB.target) - scoreFor(a, TB.target))
      if (!list.length) g.append(h('div', 'empty', '<b>No cards match</b>Change the filters above.'))
      for (const c of list) { const b = h('button', 'cg'); b.append(cardImg(eff(c), 240)); if (slot !== 0 && P.team[0] && BYKEY[P.team[0]] && leadHits(BYKEY[P.team[0]].lead, c)) b.append(h('span', 'syn-tag', 'BOOSTED')); b.onclick = () => previewTeamSwap(eff(c), slot, () => teamPicker(slot)); g.append(b) }
    }
    draw()
  })
}

// ================= SHOP + PACK POINTS =================
const quickReveal = () => { try { return localStorage.getItem('aut-quick-reveal') === '1' } catch { return false } }
PAGES.shop = (el) => {
  const setting = h('label', 'quick-reveal-setting')
  const toggle = h('input', '')
  toggle.type = 'checkbox'; toggle.checked = quickReveal()
  toggle.onchange = () => { try { localStorage.setItem('aut-quick-reveal', toggle.checked ? '1' : '0') } catch { } }
  setting.append(toggle, ' Quick reveals · pause for Mythics, Secrets and new cards')
  el.append(setting)
  bannerBlock(el)
  shopHero(el)
  gachaBlock(el)
  sbcBlock(el)
  el.append(h('div', 'sec', `<h3>PACK POINT EXCHANGE</h3><span class="cur"><i class="pp-i"></i>${fmt(P.pp || 0)}</span>`))
  el.append(h('p', 'muted', '<small style="font-weight:700">Every pack you open gives 5 pack points. Spend them on the exact card you want.</small>'))
  const g = h('div', 'ppgrid')
  const clearedArcs = new Set(ST.arcs.filter(arc => (P.arcs?.[arc.id] || 0) >= arc.chapters.length).map(arc => arc.id))
  const exchangeCards = POOL.filter(c => c.arcReward ? clearedArcs.has(c.arcReward) : !c.season && !c.campaignUnlock && !deadZoneReward(c))
  for (const c of exchangeCards.sort((a, b) => TIER[a.r].rank - TIER[b.r].rank || a.ovr - b.ovr)) {
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
      sfx('reveal', TIER[pc.r].rank); b.classList.add('chosen'); b.classList.remove('down'); b.classList.add('up'); b.style.transform = ''
      els.filter(x => x !== b).forEach((x, i) => { const ff = x.querySelector('.f'); ff.innerHTML = ''; if (BYKEY[others[i]]) ff.append(cardImg(BYKEY[others[i]], 200)); setTimeout(() => { x.classList.remove('down'); x.classList.add('dim') }, 700 + i * 120) })
      msg.innerHTML = `You got <b style="color:${tierCol(pc.r)}">${pc.name} · ${pc.ver}</b>!`
      const ok = h('button', 'btn block', 'NICE'); ok.onclick = () => { closeModal(); rerender() }; sh.append(ok)
    })
  })
}

// ================= MISSIONS =================
PAGES.missions = (el) => {
  { const n = (ST.ach || []).filter(a => a.done && !a.claimed).length, b = h('button', 'btn gold block', `ACHIEVEMENTS${n ? ' · ' + n + ' TO CLAIM' : ''}`); b.style.margin = '4px 0 14px'; b.onclick = () => go('achieve'); el.append(b) }
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
const bootP = (p, t) => { const b = document.getElementById('btBar'), x = document.getElementById('btTx'); if (b) b.style.width = Math.round(p * 100) + '%'; if (x && t) x.textContent = t }
const bootDone = () => { const o = document.getElementById('boot'); if (o) { o.classList.add('out'); setTimeout(() => o.remove(), 500) } }
;(async () => {
  bootP(.1, 'Loading cards…')
  const raw = await api('/api/cards')
  const total = raw.filter(c => !c.campaignEnemy).length
  const entries = raw.map((c, i) => ({ ...c, uid: i, total, t: ANIME[c.anime] ? ANIME[c.anime].type : 'ki' }))
  POOL = entries.filter(c => !c.campaignEnemy)
  BYKEY = Object.fromEntries(entries.map(c => [c.key, c]))
  bootP(.3, 'Loading your club…')
  const s = await api('/api/state'); SKEW = s.now - Date.now(); applyState(s)
  // bring over the very first browser save, once
  try { const old = JSON.parse(localStorage.getItem('aut-club-v1')); if (old && old.cards && Object.keys(old.cards).length && !P.imported && !P.club.packs) { await act('import', { club: old, team: JSON.parse(localStorage.getItem('aut-team-v1')) }); toast('Moved your old box and team into this save.', 'gold') } } catch { }
  bootP(.45, 'Loading fonts…'); await fontsReady
  bootP(1, 'Ready!')
  const hsh = location.hash.slice(1), [name, ...rest] = hsh.split('-')
  bootDone()
  await showPatchNotes(P, async version => !(await act('ackPatchNotes', { version })).error)
  go(PAGES[name] ? name : 'home', rest.join('-') || null, { silent: !hsh })
  setInterval(async () => {
    if (document.hidden || document.body.classList.contains('in-battle') || document.body.classList.contains('in-opener')) return
    await refresh()
  }, 10000)
})()

// ================= POCKET-STYLE PACK OPENING (in-app) =================
const PACKODDS = {
  bronze: { odds: { C: 72, U: 28, R: 0, E: 0, L: 0, M: 0, X: 0 } },
  silver: { odds: { C: 25, U: 47, R: 24, E: 3.6, L: .4, M: 0, X: 0 } },
  standard: { odds: { C: 48, U: 30, R: 14, E: 5.6, L: 1.9, M: .42, X: .08 } },
  jumbo: { odds: { C: 48, U: 30, R: 14, E: 5.6, L: 1.9, M: .42, X: .08 }, size: 12 },
  lightning: { odds: { C: 8, U: 30, R: 36, E: 21.5, L: 3.6, M: .75, X: .15 }, guarantee: 'E' },
  premium: { odds: { C: 22, U: 34, R: 27, E: 12.5, L: 3.6, M: .75, X: .15 }, guarantee: 'E' },
  series: { odds: { C: 46, U: 30, R: 15, E: 6.3, L: 2.1, M: .5, X: .1 } },
}
function rollBannerKeys(n) {
  const B = ST.banner, odds = PACKODDS.standard.odds, pr = ((P.pity || {})[B.id]) || { m: 0, f: 0 }
  const feat = B.featured.map(k => BYKEY[k]).filter(Boolean)
  let m = pr.m, f = pr.f, out = []
  const byTier = r => PACKABLE().filter(c => c.r === r)
  for (let p = 0; p < n; p++) {
    const pack = []
    for (let i = 0; i < 5; i++) {
      let t = Math.random() * 100, tier = 'C'; for (const k of ['X', 'M', 'L', 'E', 'R', 'U']) if ((t -= odds[k]) < 0) { tier = k; break }
      let c = null
      if (i === 4 && f + 1 >= B.pityFeatured) c = feat[Math.floor(Math.random() * feat.length)]
      else if (i === 4 && m + 1 >= B.pityMythic && !'MX'.includes(tier)) tier = 'M'
      if (!c) { const ft = feat.filter(x => x.r === tier); if (ft.length && Math.random() < .5) c = ft[Math.floor(Math.random() * ft.length)] }
      if (!c) { const L = byTier(tier); c = L[Math.floor(Math.random() * L.length)] || POOL[0] }
      pack.push(c)
    }
    m++; f++; if (pack.some(c => 'MX'.includes(c.r))) m = 0; if (pack.some(c => B.featured.includes(c.key))) f = 0
    out.push(pack.sort((a, b) => TIER[a.r].rank - TIER[b.r].rank || a.ovr - b.ovr))
  }
  return out
}
function rollPackKeys(type) {
  if (type === 'banner') return rollBannerKeys(1)[0]
  const info = (ST.packs && ST.packs[type]) || {}, def = PACKODDS[type] || (info.anime ? PACKODDS.series : PACKODDS.standard)
  const pool = POOL.filter(c => !c.campaignUnlock && !deadZoneReward(c) && (!info.anime || c.anime === info.anime))
  const rollT = () => { let r = Math.random() * 100; for (const k of ['X', 'M', 'L', 'E', 'R', 'U']) { if ((r -= def.odds[k]) < 0) return k } return 'C' }
  const pick = r => { const i = ORDER.indexOf(r); for (let d = 0; d < 7; d++) for (const j of [i - d, i + d]) { const l = pool.filter(c => c.r === ORDER[j]); if (l.length) return l[Math.floor(Math.random() * l.length)] } return POOL[0] }
  // weighted draw over the cards that actually exist in this pack, so small series packs don't repeat one card
  const cnt = {}; for (const c of pool) cnt[c.r] = (cnt[c.r] || 0) + 1
  const wOf = c => (def.odds[c.r] ?? 1) / cnt[c.r]
  const drawTier = () => { let t = Math.random() * 100; let tier = 'C'; for (const k of ['X', 'M', 'L', 'E', 'R', 'U']) if ((t -= def.odds[k]) < 0) { tier = k; break } for (let i = ORDER.indexOf(tier); i >= 0; i--) if (cnt[ORDER[i]]) return ORDER[i]; return ORDER.find(k => cnt[k]) }
  const draw = used => { const tr = drawTier(); const L0 = pool.filter(c => c.r === tr && !used.has(c.key)); const L = L0.length ? L0 : pool.filter(c => c.r === tr); return L[Math.floor(Math.random() * L.length)] || pool[0] }
  const drawOld = used => { const avail = pool.filter(c => !used.has(c.key)); const L = avail.length ? avail : pool; let t = Math.random() * L.reduce((n, c) => n + wOf(c), 0); for (const c of L) if ((t -= wOf(c)) < 0) return c; return L[0] }
  const out = [], used = new Set(); for (let i = 0; i < (def.size || 5); i++) { const c = draw(used); out.push(c); used.add(c.key) }
  if (def.guarantee && !out.some(c => TIER[c.r].rank >= TIER[def.guarantee].rank)) out[0] = pick(def.guarantee)
  if (info.anime && ((ST.spity || {})[type] || 0) >= (ST.PITY_N || 10) - 1 && !out.some(c => 'LMX'.includes(c.r))) { const hi = pool.filter(c => 'LMX'.includes(c.r) && !out.some(o => o.key === c.key)); const M = hi.filter(c => c.r !== 'L'), L = hi.filter(c => c.r === 'L'); const g = (M.length && (Math.random() < .2 || !L.length)) ? M[Math.floor(Math.random() * M.length)] : L[Math.floor(Math.random() * L.length)]; if (g) out[0] = g }
  return out.sort((a, b) => TIER[a.r].rank - TIER[b.r].rank || a.ovr - b.ovr) // worst first, best revealed last
}

// series packs get their own opening moment between the tear and the reveal
const PACK_FX = {
  JJK: ['BLACK FLASH', 'crack', '#ff1a3a', '#000'], DBZ: ['KAMEHAMEHA', 'beam', '#4ad8ff', '#fff'], OP: ["CONQUEROR'S HAKI", 'crack', '#ff2a2a', '#1a0010'],
  BOR: ['UZUHIKO', 'spiral', '#a86cff', '#a8f3ff'],
  NAR: ['RASENGAN', 'spiral', '#5ac8ff', '#fff'], BLE: ['GETSUGA TENSHO', 'slash', '#ff2a40', '#000'], DS: ['WATER BREATHING', 'spiral', '#3aa8ff', '#e0f6ff'],
  MHA: ['UNITED STATES OF SMASH', 'impact', '#ffd23a', '#2a7aff'], BC: ['BLACK DIVIDER', 'slash', '#1a1a1a', '#e0ffe0'], PKM: ['I CHOOSE YOU!', 'impact', '#ff3a3a', '#fff'],
  OPM: ['SERIOUS PUNCH', 'impact', '#ffe04a', '#fff'], AOT: ['TITAN SHIFT', 'bolt', '#ffd23a', '#ff8a2a'], SL: ['ARISE', 'spiral', '#7a4aff', '#000'],
  DAN: ['OCCULT AWAKENING', 'spiral', '#ff3d9a', '#7df9ff'], SDS: ['FULL COUNTER', 'slash', '#ffcc33', '#5a0a1a'], FF: ['ADOLLA BURST', 'beam', '#ff7a1a', '#ffe04a'],
  HXH: ['NEN AWAKENS', 'spiral', '#5aff9a', '#fff'], FT: ['DRAGON SLAYER', 'beam', '#ff5a1a', '#ffd23a'], JJBA: ['ZA WARUDO', 'impact', '#ffd23a', '#7a2aff'], YYH: ['SPIRIT GUN', 'beam', '#3affc8', '#fff'],
}
async function packIntro(ov, FXC, anime, shake) {
  const F = PACK_FX[anime]; if (!F) return
  const [name, kind, c1, c2] = F, el = h('div', 'pfx pfx-' + kind)
  el.style.setProperty('--p1', c1); el.style.setProperty('--p2', c2)
  el.innerHTML = '<i class="pfx-a"></i><i class="pfx-b"></i><b class="pfx-t">' + name + '</b>'
  ov.append(el); sfx('charge', 4)
  const cx = innerWidth / 2, cy = innerHeight * .45
  try { FXC.gather(cx, cy, c1, 1, 30) } catch { }
  await wait(700)
  el.classList.add('go'); sfx('crit'); shake(3)
  try { FXC.hit(cx, cy, c1, 2.2); FXC.rays(cx, cy, c1, 18, 900, 1.4); FXC.screen(c1, .5, .3) } catch { }
  await wait(1200); el.classList.add('out'); await wait(300); el.remove()
}
async function openPack(type) {
  if (document.getElementById('opener')) return
  const cards = rollPackKeys(type), sigP = type === 'premium' || type === 'lightning' || type === 'banner' ? .04 : .02, sigs = cards.filter(() => Math.random() < sigP).map(c => c.key)
  const quick = quickReveal()
  const hadBefore = new Set(Object.keys(club()))
  if (quick) {
    const r = await act('openPack', { pack: type, keys: cards.map(c => c.key), sig: sigs })
    if (!r.error) await revealPacks(cards, 1, hadBefore, true, 'results')
    return
  }
  const pre = cards.map(c => thumbURL(c, 440, true)) // start drawing the cards right away
  for (const c of cards) if (TIER[c.r].rank >= 4) { const im = new Image(); im.src = c.url; if (im.decode) im.decode().catch(() => {}) } // walkout art decodes off the critical path
  const r = await act('openPack', { pack: type, keys: cards.map(c => c.key), sig: sigs })
  if (r.error) return
  const cnt = {}; cards.forEach(c => cnt[c.key] = (cnt[c.key] || 0) + 1); const isNew = k => (club()[k]?.n || 0) <= cnt[k]; const seenNew = new Set()
  const best = cards[cards.length - 1], bestRk = TIER[best.r].rank, bcol = tierCol(best.r)
  const ov = h('div', 'op2'); ov.id = 'opener'; ov.style.setProperty('--bc', bcol); ov.dataset.best = best.r
  ov.innerHTML = `<div class="o2-bg"></div><div class="o2-art a1"></div><div class="o2-art a2"></div><div class="o2-grade"></div><div class="o2-spot"></div><div class="o2-floor"></div><div class="o2-beam"></div>
    <div class="o2-stage"></div><div class="o2-label"></div><div class="o2-tray"></div><div class="o2-hint"></div>
    <div class="o2-top"><span class="o2-pk"></span><span class="o2-count"></span><button class="o2-skip">SKIP ›</button></div>`
  document.body.append(ov); document.body.classList.add('in-opener')
  const FXC = createFX(ov), $o = q => ov.querySelector(q), stage = $o('.o2-stage'), hint = $o('.o2-hint'), tray = $o('.o2-tray')
  $o('.o2-pk').textContent = (ST.packs[type] && ST.packs[type].name || 'PACK').toUpperCase()
  const C = () => { const r = stage.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * .45] }
  let artFlip = false
  const setArt = u => { const a = $o(artFlip ? '.o2-art.a1' : '.o2-art.a2'), b = $o(artFlip ? '.o2-art.a2' : '.o2-art.a1'); artFlip = !artFlip; a.style.backgroundImage = `url("${u}")`; a.classList.add('on'); b.classList.remove('on') }
  const shake = n => { ov.classList.remove('shk1', 'shk2', 'shk3'); void ov.offsetWidth; ov.classList.add('shk' + n); setTimeout(() => ov.classList.remove('shk' + n), 600) }
  let skipping = false
  $o('.o2-skip').onclick = () => { skipping = true; finish() }
  let finished = false
  function finish() { if (finished) return; finished = true; try { FXC.dispose() } catch { }; document.body.classList.remove('in-opener'); ov.classList.add('out'); setTimeout(() => ov.remove(), 350); go('results') }

  // ---- 1) the pack ----
  const purl = await packURL(type)
  const pk = h('div', 'o2-pack', `<div class="pk-shine"></div><div class="top" style="background-image:url(${purl})"></div><div class="body" style="background-image:url(${purl})"></div><div class="cut"><i></i></div>`)
  stage.append(pk); setArt(purl); hint.innerHTML = '<b>SWIPE</b> ACROSS THE TOP TO OPEN'
  await new Promise(res => {
    let x0 = null, done = false, lastP = 0
    const cut = pk.querySelector('.cut i'), tear = () => { if (done) return; done = true; res() }
    pk.onpointerdown = e => { x0 = e.clientX; pk.setPointerCapture(e.pointerId); pk.classList.add('grab') }
    pk.onpointermove = e => { if (x0 == null) return; const p = Math.min(1, Math.abs(e.clientX - x0) / pk.offsetWidth); cut.style.transform = `scaleX(${p})`; if (p - lastP > .08) { lastP = p; const rr = pk.getBoundingClientRect(); FXC.hit(rr.left + rr.width * p, rr.top + rr.height * .16, '#ffffff', .35); sfx('soft') } if (p > .65) tear() }
    pk.onpointerup = () => { if (x0 != null && !done) { x0 = null; cut.style.transform = 'scaleX(1)'; tear() } }
  })
  if (skipping) return
  hint.textContent = ''
  { const rr = pk.getBoundingClientRect(); sfx('tear'); pk.classList.add('torn'); shake(2); FXC.hit(rr.left + rr.width / 2, rr.top + rr.height * .16, bcol, 1.6); FXC.screen('#ffffff', .55, .35) }
  await wait(600); pk.remove()
  if (!skipping) { const an = (ST.packs[type] && ST.packs[type].anime) || type; try { await packIntro(ov, FXC, an, shake) } catch { } }
  if (skipping) return

  // ---- 2) rarity tease: a beam of light in the best card's colour ----
  ov.classList.add('beam', 'b' + Math.min(bestRk, 6)); sfx('charge', bestRk)
  { const [cx, cy] = C(); FXC.gather(cx, cy, bcol, .6 + bestRk * .12, 18 + bestRk * 6) }
  await wait(450 + bestRk * 180)
  ov.classList.remove('beam'); { const [cx, cy] = C(); FXC.hit(cx, cy, bcol, .8 + bestRk * .25); if (bestRk >= 3) FXC.rays(cx, cy, bcol, 10 + bestRk * 2, 900, 1.2) } shake(bestRk >= 4 ? 2 : 1)

  // ---- 3) the cards, one by one ----
  const urls = await Promise.all(pre)
  const els = cards.map((c, i) => {
    const rk = TIER[c.r].rank, face = rk >= 3
    const e = h('div', 'o2-card' + (face ? ' facedown' : '') + (sigs.includes(c.key) ? ' sig' : ''), `<div class="in"><div class="f"></div><div class="b"><i class="bk-ring"></i><b>AUT</b><small>${face ? TIER[c.r].name.split(' ')[0] : ''}</small></div></div>`)
    e.style.setProperty('--rc', tierCol(c.r)); e.style.zIndex = 10 - i; e.style.setProperty('--d', i * .06 + 's'); e.dataset.tier = c.r
    e.style.setProperty('--off', i)
    { const im = new Image(); im.src = urls[i]; im.alt = c.name + ' ' + c.ver; im.decoding = 'sync'; e.querySelector('.f').append(im) }
    if (isNew(c.key) && !seenNew.has(c.key) && seenNew.add(c.key)) e.querySelector('.f').append(h('span', 'o2-new', 'NEW'))
    stage.append(e); return e
  })
  sfx('deal')
  const label = $o('.o2-label')
  for (let i = 0; i < els.length; i++) {
    if (skipping) return
    const e = els[i], c = cards[i], rk = TIER[c.r].rank, col = tierCol(c.r)
    $o('.o2-count').textContent = `${i + 1} / ${els.length}`
    e.classList.add('top'); ov.style.setProperty('--bc', col)
    hint.innerHTML = e.classList.contains('facedown') ? '<b>TAP</b> TO REVEAL' : '<b>TAP</b> FOR NEXT'
    if (e.classList.contains('facedown')) {
      await new Promise(res => e.onclick = res); e.onclick = null; hint.textContent = ''
      const [cx, cy] = C()
      if (rk >= 4) { // walkout + orb
        try { await walkout(ov, FXC, c, rk) } catch { return }
        ov.classList.add('cine'); e.classList.add('charge'); shake(1); await wait(300)
      } else { sfx('charge', rk); e.classList.add('charge'); FXC.gather(cx, cy, col, .45, 16); await wait(480) }
      sfx('reveal', rk); e.classList.remove('charge', 'facedown'); e.classList.add('reveal')
      FXC.hit(cx, cy, col, rk >= 6 ? 2.4 : rk >= 5 ? 2 : rk >= 4 ? 1.7 : 1.2); FXC.screen(rk >= 6 ? '#ffffff' : col, rk >= 4 ? .5 : .25, .4); shake(rk >= 4 ? 3 : 2)
      if (rk >= 6) ov.classList.add('rainbow')
      if (rk >= 4) { const st = h('div', 'o2-stamp', `<small>${rk >= 6 ? '♛ SECRET RARE ♛' : rk >= 5 ? 'MYTHIC PULL' : 'LEGENDARY PULL'}</small>`); st.style.setProperty('--rc', col); ov.append(st); setTimeout(() => st.remove(), 1800) }
    } else {
      const [cx, cy] = C(); e.classList.add('reveal'); sfx('reveal', rk); FXC.hit(cx, cy, col, .7 + rk * .2)
      if (!i) await wait(200)
    }
    setArt(urls[i])
    { const [cx, cy] = C(), sr = stage.getBoundingClientRect()
      if (rk >= 2) FXC.rays(cx, cy, col, 8 + rk * 3, 700 + rk * 120, 1.1 + rk * .15)
      FXC.twinkle(cx, cy, sr.width * 1.3, sr.height * 1.1, col, 6 + rk * 3, 1.6)
      if (rk >= 4) FXC.confetti(cx, sr.top + sr.height * .3, rk >= 6 ? ['#ff6ab0', '#ffd95a', '#6affc0', '#6ac8ff', '#b88cff', '#ffffff'] : [col, '#ffffff', rk >= 5 ? '#ff9ae0' : '#ffe08a'], rk >= 6 ? 140 : 90) }
    label.style.setProperty('--rc', col)
    label.innerHTML = `<small>${RARITY_MARK[c.r]} ${TIER[c.r].name}</small><b>${c.name}</b><span>${c.ver}</span>`
    label.classList.remove('show'); void label.offsetWidth; label.classList.add('show')
    await wait(rk >= 4 ? 700 : 260)
    const preview = c.transformations?.length ? formsButton(c) : null
    if (preview) { preview.classList.add('pull-forms'); ov.append(preview) }
    hint.innerHTML = i < els.length - 1 ? '<b>TAP</b> FOR NEXT' : '<b>TAP</b> TO FINISH'
    await new Promise(res => { const go2 = ev => { if (ev.target.closest('.o2-skip')) return; ov.removeEventListener('click', go2); res() }; setTimeout(() => ov.addEventListener('click', go2), 120) })
    preview?.remove()
    label.classList.remove('show'); ov.classList.remove('cine', 'rainbow')
    // fly into the tray
    sfx('swipe'); e.classList.add('gone')
    const slot = h('div', 'o2-slot'); slot.style.setProperty('--rc', col); slot.dataset.tier = c.r
    { const im = new Image(); im.src = urls[i]; slot.append(im) } tray.append(slot)
    await wait(200)
  }
  if (skipping) return
  // ---- 4) line-up of the whole pack ----
  hint.textContent = ''; stage.innerHTML = ''; ov.classList.add('lineup'); ov.style.setProperty('--bc', bcol)
  const line = h('div', 'o2-line')
  cards.forEach((c, i) => { const w = h('div', 'o2-lc'); w.style.setProperty('--rc', tierCol(c.r)); w.style.setProperty('--d', (i * .08) + 's'); w.dataset.tier = c.r; const im = new Image(); im.src = urls[i]; w.append(im); line.append(w) })
  stage.append(line); tray.innerHTML = ''
  const done = h('button', 'btn gold o2-done', 'CONTINUE'); done.onclick = finish; ov.append(done)
  setTimeout(() => ov.addEventListener('click', e => { if (!e.target.closest('.o2-skip')) finish() }, { once: true }), 600)
  sfx('claim')
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
function packOdds(t) { const info = ST.packs[t] || {}; return (PACKODDS[t] || (info.anime ? PACKODDS.series : PACKODDS.standard)).odds }
function packDesc(t) { const pk = ST.packs[t]; return t === 'bronze' ? 'Commons and Uncommons only. Cheap filler for your collection.' : t === 'silver' ? 'Mostly Uncommon and Rare, with a small Epic chance.' : t === 'jumbo' ? '12 cards with Gold odds. The most cards per coin.' : t === 'lightning' ? 'Top odds, Epic or better guaranteed. Only 3 in stock, more every 6 hours.' : t === 'standard' ? 'Every series and every rarity. The classic pull.' : t === 'premium' ? 'Boosted odds with a guaranteed Epic or better in every pack.' : pk.anime ? 'Only ' + ANAME(pk.anime) + ' cards. Chase every moment in the series.' : 'Every series and every rarity. The classic pull.' }
function buyOrOpen(t) { return async () => { if ((P.pending[t] || 0) > 0) return openPack(t); const x = await act('buyPack', { pack: t }); if (!x.error) openPack(t) } }
function shopHero(el) {
  const types = Object.keys(ST.packs).filter(t => packPool(t).length)
  if (!types.includes(SHOPSEL)) SHOPSEL = types[0]
  const t = SHOPSEL, pk = ST.packs[t], L = PACKLOOK[t] || PACKLOOK.standard, pend = P.pending[t] || 0, odds = packOdds(t)
  const hero = h('section', 'shero'); { const fa = featured(t); hero.style.setProperty('--hart', `url("${fa.url}")`); hero.style.setProperty('--hfx', Math.round((fa.fx ?? .5) * 100) + '%'); hero.style.setProperty('--hfy', Math.round((fa.fy ?? .22) * 100) + '%') } hero.style.setProperty('--p1', L.c[0]); hero.style.setProperty('--p2', L.c[1]); hero.style.setProperty('--p3', L.c[2])
  hero.innerHTML = `<div class="sh-bg"></div><div class="sh-stripe"></div>
    <div class="sh-pack"><div class="sh-tilt"></div><div class="sh-floor"></div></div>
    <div class="sh-info">
      <span class="sh-tag">${t === 'premium' ? '★ FEATURED' : pk.anime ? 'SERIES PACK' : 'CORE PACK'}</span>
      <h2>${pk.name}</h2>
      <p>${packDesc(t)}</p>
      <div class="sh-meta"><span><b>${pk.size || 5}</b> cards</span><span><b>${packPool(t).length}</b> in pool</span>${t === 'premium' ? '<span class="gold"><b>EPIC+</b> guaranteed</span>' : ''}</div>
      <div class="sh-odds"></div>
      <div class="sh-buy"></div>
    </div>`
  const tilt = hero.querySelector('.sh-tilt'); tilt.append(packEl(t, 340))
  hero.onpointermove = e => { const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; tilt.style.transform = `rotateY(${x * 26}deg) rotateX(${-y * 18}deg)` }
  hero.onpointerleave = () => tilt.style.transform = ''
  const od = hero.querySelector('.sh-odds')
  for (const r of ORDER.slice().reverse()) { if (!odds[r] && r !== 'C') continue; const v = odds[r] || 0; const row = h('div', 'od', `<span>${TIER[r].name}</span><i><b style="width:${Math.min(100, v * 2.4)}%"></b></i><em>${v}%</em>`); row.style.setProperty('--rc', tierCol(r)); od.append(row) }
  { const per = rk => 1 - Math.pow(1 - (odds[rk] || 0) / 100, 5), fmtN = p => p >= .5 ? Math.round(p * 100) + '%' : '1 in ' + Math.round(1 / p).toLocaleString()
    const pp = h('div', 'sh-per', `<span>PER PACK</span><b style="color:${tierCol('L')}">Legendary+ ${fmtN(per('L') + per('M') + per('X'))}</b><b style="color:${tierCol('M')}">Mythic+ ${fmtN(per('M') + per('X'))}</b><b style="color:#d9b8ff">Rainbow ${fmtN(per('X'))}</b>`)
    od.after(pp) }
  const bb = hero.querySelector('.sh-buy')
  const buy = h('button', 'btn gold big', `<span>BUY</span><b><i class="coin-i"></i>${fmt(pk.cost)}</b>`); buy.disabled = P.coins < pk.cost
  if (t === 'lightning') { const L = ST.light; buy.disabled = buy.disabled || L.n < 1; bb.after(h('div', 'lt-stock', `⚡ <b>${L.n}/${L.max}</b> in stock${L.next ? ` · next in <span class="timer" data-until="${L.next - SKEW}"></span>` : ''}`)) }
  buy.onclick = async () => { const x = await act('buyPack', { pack: t }); if (!x.error) openPack(t) }
  bb.append(buy)
  if (t !== 'lightning') { const c10 = Math.round(pk.cost * 9), ten = h('button', 'btn gold big', `<span>BUY ×10</span><b><i class="coin-i"></i>${fmt(c10)}</b>`); ten.disabled = P.coins < c10; ten.onclick = () => buyMulti(t, ten); bb.append(ten) }
  { const wi = h('button', 'btn dark big', '<span>WHAT\'S INSIDE</span>'); wi.onclick = () => packContents(t); bb.append(wi) }
  if (pend) { const o = h('button', 'btn green big', `<span>OPEN</span><b>${pend} READY</b>`); o.onclick = () => openPack(t); bb.append(o) }
  if (pend > 1) { const o = h('button', 'btn green big', `<span>OPEN ALL</span><b>${Math.min(pend, 50)} AT ONCE</b>`); o.onclick = () => multiOpen(t, Math.min(pend, 50)); bb.append(o) }
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

// ================= UI sounds + mute toggle =================
document.addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.closest('#nav') && !b.closest('#opener')) sfx(b.classList.contains('btn') ? 'click' : 'soft') }, true)
{
  const t = document.createElement('button'); t.className = 'cur sndbtn'; t.setAttribute('aria-label', 'Sound on or off')
  const draw = () => { t.innerHTML = sfxOn() ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'; t.title = sfxOn() ? 'Sound on' : 'Sound off' }
  t.onclick = () => { sfxOn(!sfxOn()); draw(); sfx('click') }; draw()
  document.querySelector('.chips2')?.prepend(t)
  const m = document.createElement('button'); m.className = 'cur sndbtn mus'; m.setAttribute('aria-label', 'Music on or off')
  const mdraw = () => { m.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 17.5A2.5 2.5 0 1 1 6.5 15H9V5l11-2v12.5a2.5 2.5 0 1 1-2.5-2.5H20V7L11 8.6v8.9Z"/></svg>'; m.classList.toggle('off', !musicOn()) }
  m.onclick = () => { musicOn(!musicOn()); mdraw() }; mdraw()
  t.after(m)
}

let retryFight = null
function prepareRetry(label, start, canEditTeam) {
  retryFight = { label, start, canEditTeam }
  go(canEditTeam ? 'team' : 'deck')
}
function retryPanel(el, alternate) {
  if (!retryFight) return
  const panel = h('section','qol-hero')
  const title = h('h3',''); title.textContent = 'Retry · ' + retryFight.label
  const retry = h('button','btn gold','START REMATCH')
  retry.onclick = () => {
    if (!retryFight) return
    const request = retryFight
    retryFight = null
    if (request.start() === false) retryFight = request
  }
  const cancel = h('button','btn dark','CANCEL')
  cancel.onclick = () => { retryFight = null; rerender() }
  panel.append(title,retry)
  if (alternate !== 'team' || retryFight.canEditTeam) {
    const edit = h('button','btn violet',alternate === 'team' ? 'EDIT TEAM' : 'EDIT ARTS DECK')
    edit.onclick = () => go(alternate); panel.append(edit)
  }
  panel.append(cancel); el.append(panel)
}

// ================= BATTLE =================
PAGES.battle = el => battlePage(el)
TITLES.battle = 'BATTLE'
initBattle({ ACC, openModal, closeModal, cardDetail, matchesCard, raidPost: (rid, t) => ACC.raidPost(rid, t), raidStatus: rid => ACC.raidStatus(rid), h, $, cardImg, eff, ST: () => ST, lb: f => ACC.leaderboard(f), get BYKEY() { return BYKEY }, get POOL() { return POOL }, get P() { return P }, act, go, toast, tierCol, ANAME, prepareRetry })

// ================= PLAYERS (accounts, leaderboard, friends, PvP) =================
const PS = { tab: 0, sort: 'level' }
TITLES.players = 'PLAYERS'
PAGES.players = async el => {
  const meP = ACC.me()
  const head = h('div', 'phead')
  { const me = myPub(); head.innerHTML = `${avatarHTML(me)}<div class="pme"><span class="eyebrow">SIGNED IN AS</span><b>${me.name}</b>${titleHTML(me)}</div>` }
  { const ed = h('button', 'btn gold sm', 'EDIT PROFILE'); ed.onclick = profileEdit; head.append(ed); const ab = h('button', 'btn violet sm', 'ACHIEVEMENTS'); ab.onclick = () => go('achieve'); head.append(ab) }
  const so = h('button', 'btn dark sm', 'SIGN OUT'); so.onclick = () => { if (confirm('Sign out of this device?')) ACC.signOut() }; head.append(so)
  el.append(head)
  if (window.AUT_CONFIG?.playerGrantsEnabled && meP.profile?.nameLower === 'aspext') {
    ACC.canSendPlayerGrants().then(allowed => {
      if (!allowed || !head.isConnected) return
      const grants = h('button', 'btn gold sm', 'PLAYER GRANTS')
      grants.onclick = () => go('player-grants')
      head.append(grants)
    }).catch(() => {})
  }
  const seg = segmented(['LEADERBOARD', 'FRIENDS', 'TRADES', 'FIND PLAYER'], PS.tab, i => { PS.tab = i; rerender() }); seg.style.marginTop = '14px'; el.append(seg)
  const body = h('div', 'plist'); el.append(body)
  const row = (p, i) => {
    const r = h('button', 'prow' + (p.uid === meP.uid ? ' me' : ''))
    r.innerHTML = `${i != null ? `<span class="rk">${i + 1}</span>` : ''}${avatarHTML(p, 'sm')}<div class="pi"><b>${p.name}</b>${titleHTML(p)}<small>LV ${p.level || 1} · ${p.cards || 0} cards · ${p.cleared || 0}/10 story · ${p.pvpWins || 0} PvP wins</small></div><span class="pr">${p.rating || '–'}<small>TEAM</small></span>`
    r.onclick = () => playerSheet(p); return r
  }
  body.innerHTML = '<div class="muted" style="padding:20px;text-align:center;font-weight:800">Loading…</div>'
  try {
    if (PS.tab === 0) {
      const sorts = h('div', 'chips'); for (const [k, l] of [['level', 'Level'], ['cards', 'Collection'], ['pvpWins', 'PvP wins'], ['rating', 'Team rating']]) { const c = h('button', 'chip' + (PS.sort === k ? ' on' : ''), l); c.onclick = () => { PS.sort = k; rerender() }; sorts.append(c) }
      const list = await ACC.leaderboard(PS.sort); body.innerHTML = ''; body.append(sorts)
      list.forEach((p, i) => body.append(row(p, i)))
      if (!list.length) body.append(h('div', 'empty', '<b>No players yet</b>Share the link with your mates.'))
    } else if (PS.tab === 2) { await tradesTab(body)
    } else if (PS.tab === 1) {
      const list = await ACC.friends(); body.innerHTML = ''
      list.forEach(p => { const r = row(p), rv = (P.rivals || {})[p.uid]; if (rv) r.querySelector('.pi small').insertAdjacentHTML('beforeend', ` · <b style="color:var(--eY)">you ${rv.w}–${rv.l}</b>`); body.append(r) })
      if (!list.length) body.append(h('div', 'empty', '<b>No friends yet</b>Find a player by name and add them.'))
    } else {
      body.innerHTML = ''
      const f = h('div', 'panel pad'), q = h('input', 'field'); q.placeholder = 'Exact username'; const go2 = h('button', 'btn gold block', 'SEARCH'); go2.style.marginTop = '10px'
      const out = h('div', ''); out.style.marginTop = '12px'
      go2.onclick = async () => { out.innerHTML = ''; const p = await ACC.findByName(q.value); out.append(p ? row(p) : h('div', 'empty', '<b>No player with that name</b>Names are not case sensitive.')) }
      q.onkeydown = e => { if (e.key === 'Enter') go2.click() }
      f.append(q, go2); body.append(f, out)
    }
  } catch (e) { body.innerHTML = `<div class="empty"><b>Could not load players</b>${e.message || ''}</div>` }
}
TITLES['player-grants'] = 'PLAYER GRANTS'
PAGES['player-grants'] = async el => {
  let allowed = false
  if (window.AUT_CONFIG?.playerGrantsEnabled) {
    try { allowed = await ACC.canSendPlayerGrants() } catch { }
  }
  if (!allowed) { el.append(h('p', 'empty', 'Player Grants is unavailable for this account.')); return }
  playerGrantsPage(el, { account: ACC, h, cards: POOL, items: ST.itemDefs })
}
function playerSheet(p) {
  const meP = ACC.me(), mine = p.uid === meP.uid, isF = (meP.profile.friends || []).includes(p.uid)
  openModal(sh => {
    sh.append(h('div', 'psheet', `${avatarHTML(p, 'lg')}<h2>${p.name}</h2>${titleHTML(p)}<span class="muted" style="font-weight:800">LEVEL ${p.level || 1}</span>
      <div class="pst"><div><b>${p.cards || 0}</b><span>CARDS</span></div><div><b>${p.packs || 0}</b><span>PACKS</span></div><div><b>${p.cleared || 0}/10</b><span>STORY</span></div><div><b>${p.pvpWins || 0}</b><span>PVP WINS</span></div><div><b>${p.rating || '–'}</b><span>TEAM</span></div></div>`))
    const sc = (p.showcase || []).map(k => BYKEY[k]).filter(Boolean), tm = (p.team || []).map(k => BYKEY[k]).filter(Boolean)
    if (sc.length) { sh.append(h('div', 'sec', '<h3>SHOWCASE</h3>')); const g = h('div', 'cardgrid'); sc.forEach(c => { const b = h('div', 'cg'); b.append(cardImg(c, 240)); g.append(b) }); sh.append(g) }
    if (tm.length) { sh.append(h('div', 'sec', '<h3>TEAM</h3>')); const g = h('div', 'cardgrid'); tm.forEach(c => { const b = h('div', 'cg'); b.append(cardImg(c, 240)); g.append(b) }); sh.append(g) }
    if (!mine) {
      const my = (P.rivals || {})[p.uid] || { w: 0, l: 0 }, th = (p.rivals || {})[meP.uid] || [0, 0]
      sh.append(h('div', 'rivalbox', `<span class="eyebrow">RIVALRY</span><div class="rv"><div><b>${my.w}–${my.l}</b><small>WHEN YOU CHALLENGE THEM</small></div><i>VS</i><div><b>${th[0]}–${th[1]}</b><small>WHEN THEY CHALLENGE YOU</small></div></div>`))
    }
    const acts = h('div', 'grid2'); acts.style.marginTop = '16px'
    if (!mine) {
      const fb = h('button', 'btn ' + (isF ? 'dark' : 'violet'), isF ? 'REMOVE FRIEND' : 'ADD FRIEND')
      fb.onclick = async () => { isF ? await ACC.removeFriend(p.uid) : await ACC.addFriend(p.uid); toast(isF ? 'Removed from friends.' : p.name + ' added to friends.'); closeModal(); rerender() }
      const bb = h('button', 'btn gold', 'BATTLE THEIR TEAM'); bb.disabled = tm.length < 6 || P.team.filter(Boolean).length < 6
      bb.title = tm.length < 6 ? 'They need a full team of 6.' : 'Your team needs 6 fighters.'
      bb.onclick = () => { closeModal(); startBattle({ n: 0, pvp: true, uid: p.uid, name: p.name, rating: p.rating || 85, level: 4, team: p.team }) }
      const tr = h('button', 'btn green', 'REQUEST A CARD'); tr.onclick = () => tradeSheet(p)
      acts.append(fb, bb, tr)
      if (tm.length < 6) sh.append(h('p', 'muted', '<small style="font-weight:700">They need a full team of 6 before you can battle them.</small>'))
    }
    sh.append(acts)
  })
}

// ================= what's inside a pack =================
function packContents(t) {
  const pool = packPool(t).slice().sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr), odds = packOdds(t)
  const own = pool.filter(c => club()[c.key]).length
  openModal(sh => {
    sh.append(h('div', 'wi-head', `<span class="eyebrow">WHAT'S INSIDE</span><h2>${ST.packs[t].name}</h2><p class="muted" style="font-weight:800">${own} / ${pool.length} collected · 5 cards per pack</p>`))
    for (const rk of ORDER.slice().reverse()) {
      const list = pool.filter(c => c.r === rk); if (!list.length) continue
      const each = (odds[rk] || 0) / list.length
      sh.append(h('div', 'wi-tier', `<b style="color:${tierCol(rk)}">${RARITY_MARK[rk]} ${TIER[rk].name}</b><span>${odds[rk]}% per card · ${list.length} cards · each ${each < .01 ? each.toFixed(3) : each.toFixed(2)}%</span>`))
      const g = h('div', 'cardgrid wi-grid')
      for (const c of list) { const b = h('button', 'cg' + (club()[c.key] ? '' : ' miss')); b.append(cardImg(eff(c), 200)); b.onclick = () => cardDetail(c.key); g.append(b) }
      sh.append(g)
    }
  }, true)
}

// ================= BANNER + x10 =================
function bannerBlock(el) {
  const B = ST.banner; if (!B) return
  const feat = B.featured.map(k => BYKEY[k]).filter(Boolean), pr = ((P.pity || {})[B.id]) || { m: 0, f: 0 }, pend = P.pending.banner || 0
  if (!feat.length) return
  const releaseBanner = B.id === 'espada-2026-11', ended = B.ends <= now()
  const w = h('section', 'bnr')
  w.style.setProperty('--bart1', `url("${feat[0].url}")`); if (feat[1]) w.style.setProperty('--bart2', `url("${feat[1].url}")`)
  w.innerHTML = `<div class="bnr-art a1"></div><div class="bnr-art a2"></div><div class="bnr-shade"></div>
    <div class="bnr-info"><span class="bnr-tag">LIMITED BANNER</span><h2>${releaseBanner ? B.name : feat.map(c => c.name).join(' &amp; ')}</h2>
      <p>A pull that hits a featured rarity has a 50% chance to draw from its featured cards.</p>
      <div class="bnr-time">${ended ? 'Banner ended · unopened packs can still be claimed' : `Ends in <b class="timer" data-until="${B.ends - SKEW}"></b>`}</div>
      <div class="bnr-pity"><div><span>MYTHIC+ GUARANTEED</span><i><s style="width:${Math.min(100, pr.m / B.pityMythic * 100)}%"></s></i><b>${pr.m}/${B.pityMythic}</b></div>
        <div><span>FEATURED GUARANTEED</span><i><s style="width:${Math.min(100, pr.f / B.pityFeatured * 100)}%"></s></i><b>${pr.f}/${B.pityFeatured}</b></div></div>
      <div class="bnr-buy"></div></div>
    <div class="bnr-cards"></div>`
  const cards = w.querySelector('.bnr-cards'); feat.slice(0, 2).forEach((c, i) => { const b = h('button', 'bnr-card c' + i); b.append(cardImg(c, 360)); b.onclick = () => cardDetail(c.key); cards.append(b) })
  const bb = w.querySelector('.bnr-buy')
  const one = h('button', 'btn gold big', `${pend ? '<span>OPEN PACK</span>' : `<span>PULL ×1</span><b><i class="coin-i"></i>${fmt(B.cost)}</b>`}`); one.disabled = !pend && (ended || P.coins < B.cost)
  one.onclick = async () => { if (pend) return openPack('banner'); const x = await act('buyPack', { pack: 'banner', bannerId: B.id }); if (!x.error) openPack('banner'); else rerender() }
  const ten = h('button', 'btn gold big', `<span>PULL ×10</span><b><i class="coin-i"></i>${fmt(Math.round(B.cost * 9))}</b>`); ten.disabled = ended || P.coins < B.cost * 9
  ten.onclick = () => buyMulti('banner', ten, B.id)
  const featured = h('button', 'btn dark big', 'WHO’S FEATURED?')
  featured.onclick = () => openModal(sh => {
    sh.append(h('div', 'sec', '<h3>WHO’S FEATURED?</h3>'))
    const close = h('button', 'btn dark', 'CLOSE')
    close.onclick = () => { closeModal(); featured.focus() }
    const grid = h('div', 'cardgrid')
    for (const card of feat) {
      const tile = h('button', 'cg')
      tile.append(cardImg(card, 240))
      tile.onclick = () => cardDetail(card.key, { kitOnly: true })
      grid.append(tile)
    }
    sh.append(close, grid)
    close.focus()
  }, true)
  bb.append(one, ten, featured); if (pend) bb.append(h('span', 'bnr-pend', pend + ' unopened'))
  el.append(w)
}
let buyingPacks = false
async function buyMulti(type, button, bannerId) {
  if (buyingPacks || openingBulk || document.getElementById('opener')) return
  buyingPacks = button.disabled = true
  try {
    const result = await act('buyPack', { pack: type, count: 10, bannerId })
    if (!result.error) await multiOpen(type, 10)
    else if (bannerId) rerender()
  } finally {
    buyingPacks = false
    if (button.isConnected) {
      const pack = type === 'banner' ? ST.banner : ST.packs[type]
      button.disabled = !pack || P.coins < Math.round(pack.cost * 9)
    }
  }
}
let openingBulk = false
async function multiOpen(type, n) {
  if (openingBulk || document.getElementById('opener')) return
  openingBulk = true
  try {
    const diamonds = new Map(Object.entries(club()).map(([key, entry]) => [key, entry.dia || 3]))
    const packs = type === 'banner' ? rollBannerKeys(n) : Array.from({ length: n }, () => rollPackKeys(type))
    const hadBefore = new Set(Object.keys(club()).filter(k => (club()[k].n || 0) > 0)), all = []
    let opened = 0
    for (const pk of packs) {
      const sg = pk.filter(() => Math.random() < .04).map(c => c.key)
      const r = await act('openPack', { pack: type, keys: pk.map(c => c.key), sig: sg })
      if (r.error) break
      opened++; all.push(...pk)
    }
    if (all.length) {
      const fresh = new Set(all.filter(c => !hadBefore.has(c.key)).map(c => c.key))
      const upgrades = new Map()
      for (const {key} of all) {
        const diff = (club()[key]?.dia || 3) - (diamonds.get(key) || 3)
        if (diff > 0) upgrades.set(key,diff)
      }
      bulkResults = { type, n: opened, cards: all, fresh, upgrades }
      await revealPacks(all, opened, hadBefore, quickReveal(), 'pulls')
    }
  } finally { openingBulk = false }
}
async function revealPacks(cards, n, hadBefore, quick, destination) {
  const newShown = new Set()
  const all = cards.slice().sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)
  const urls = await Promise.all(all.map(c => thumbURL(c, 260, true)))
  const ov = h('div', 'mo'); ov.id = 'opener'
  ov.innerHTML = `<div class="mo-bg"></div><div class="mo-head"><b>${n}× PULL</b><span>${all.length} cards</span><button class="o2-skip">REVEAL ALL</button></div><div class="mo-grid"></div>`
  document.body.append(ov); document.body.classList.add('in-opener')
  const grid = ov.querySelector('.mo-grid'), FXC = createFX(ov)
  const els = all.map((c, i) => { const e = h('div', 'mo-c', `<div class="in"><div class="f"></div><div class="b"></div></div>`); e.dataset.tier = c.r; e.style.setProperty('--rc', tierCol(c.r)); if (!hadBefore.has(c.key) && !newShown.has(c.key)) { newShown.add(c.key); e.classList.add('is-new'); setTimeout(() => e.querySelector('.f').append(h('span', 'o2-new', 'NEW')), 0) } const im = new Image(); im.src = urls[i]; e.querySelector('.f').append(im); grid.append(e); return e })
  let skip = false, closed = false; ov.querySelector('.o2-skip').onclick = () => { skip = true }
  const footer = h('div', 'mo-footer')
  const done = h('button', 'btn gold mo-done', 'CONTINUE')
  done.type = 'button'
  footer.append(done)
  document.body.append(footer)
  let complete
  const completion = new Promise(resolve => { complete = resolve })
  done.onclick = () => {
    if (closed) return
    closed = true
    try { FXC.dispose() } catch { }
    document.body.classList.remove('in-opener')
    ov.remove()
    footer.remove()
    complete()
    go(destination)
  }
  const animate = async () => {
    sfx('deal'); await wait(400)
    // reveal worst first, best last; Epic+ pause with an impact
    for (let i = els.length - 1; i >= 0; i--) {
      if (closed) return
      const e = els[i], rk = TIER[all[i].r].rank
      const spotlight = keepReveal(e.classList.contains('is-new'), rk, quick)
      if (!skip && spotlight && rk >= 4) { e.scrollIntoView({ block: 'center' }); try { await walkout(ov, FXC, all[i], rk) } catch { skip = true } if (closed) return }
      e.classList.add('up')
      if (all[i].transformations?.length) e.append(formsButton(all[i]))
      if (!skip && spotlight && rk >= 3) { const r = e.getBoundingClientRect(); FXC.hit(r.left + r.width / 2, r.top + r.height / 2, tierCol(all[i].r), rk >= 5 ? 2 : rk >= 4 ? 1.5 : 1); if (rk >= 4) FXC.rays(r.left + r.width / 2, r.top + r.height / 2, tierCol(all[i].r), 12, 500, 1); sfx('reveal', rk); await wait(rk >= 5 ? 900 : rk >= 4 ? 600 : 260) }
      else if (!skip && spotlight) await wait(quick ? 400 : 45)
    }
  }
  animate().catch(error => { console.warn('Pack reveal could not animate', error); done.click() })
  return completion
}

// ================= SHARDS + CHALLENGES =================
const RKA = r => 'CURELMX'.indexOf(r)
function rwText(rw) { return [rw.pack && (ST.packs[rw.pack] || {}).name, rw.coins && fmt(rw.coins) + ' coins', rw.shards && '◆' + fmt(rw.shards) + ' shards'].filter(Boolean).join(' + ') }
function dupCount() { let n = 0, s = 0; for (const k in club()) { const c = BYKEY[k], e = club()[k]; if (!c) continue; const x = Math.min(e.n - 1, spendableCopies(e, P.team.includes(k))); if (x > 0) { n += x; s += x * ST.shardGet[c.r] } } return { n, s } }
function sbcBlock(el) {
  const dc = dupCount()
  el.append(h('div', 'sec', `<h3>CHALLENGES</h3><span class="cur shard-c">◆ ${fmt(P.shards || 0)}</span>`))
  const sb = h('div', 'shred-bar', `<div><b>DUPLICATES → SHARDS</b><span>${dc.n ? `${dc.n} spare duplicates worth ◆${fmt(dc.s)}` : 'No spare duplicates right now'}. Spend shards on any exact card from its card page.</span></div>`)
  const sbtn = h('button', 'btn gold', 'SHRED ALL'); sbtn.disabled = !dc.n; sbtn.onclick = async () => { const r = await act('shred', { all: 1 }); if (!r.error) rerender() }
  sb.append(sbtn); el.append(sb)
  const g = h('div', 'sbc-grid')
  for (const q of ST.sbcs) {
    const b = h('button', 'sbc' + (q.left < 1 ? ' done' : ''), `<span class="sbc-n">${q.n} CARDS${q.minR ? ' · ' + TIER[q.minR].name.toUpperCase() + '+' : ''}</span><b>${q.name}</b><p>${q.d}</p><div class="sbc-rw"><span>REWARD</span>${rwText(q.rw)}</div><small>${q.left < 1 ? 'DONE TODAY' : q.left + ' left today'}</small>`)
    b.onclick = () => sbcSheet(q); g.append(b)
  }
  el.append(g)
}
function sbcFill(q, lastCopies) {
  const units = []
  for (const k in club()) { const c = BYKEY[k], e = club()[k]; if (!c || (q.minR && RKA(c.r) < RKA(q.minR))) continue; const sp = spendableCopies(e, P.team.includes(k)), x = lastCopies ? sp : Math.min(sp, e.n - 1); for (let i = 0; i < x; i++) units.push(c) }
  units.sort((a, b) => (ST.values[a.key] || 0) - (ST.values[b.key] || 0))
  if (q.same) { const by = {}; for (const c of units) (by[c.anime] = by[c.anime] || []).push(c); let best = null; for (const a in by) { const L = by[a].slice(0, q.n); if (L.length === q.n) { const v = L.reduce((s, c) => s + (ST.values[c.key] || 0), 0); if (!best || v < best.v) best = { L, v } } } return best ? best.L : [] }
  if (q.distinct) { const seen = new Set(), L = []; for (const c of units) if (!seen.has(c.anime)) { seen.add(c.anime); L.push(c) } return L.length >= q.n ? L.slice(0, q.n) : [] }
  return units.length >= q.n ? units.slice(0, q.n) : []
}
function sbcSheet(q, last = false) {
  const pick = sbcFill(q, last)
  openModal(sh => {
    sh.append(h('div', 'wi-head', `<span class="eyebrow">CHALLENGE · ${q.left < 1 ? 'DONE TODAY' : q.left + ' LEFT TODAY'}</span><h2>${q.name}</h2><p class="muted" style="font-weight:800">${q.d} Reward: ${rwText(q.rw)}</p>`))
    const tg = h('label', 'sbc-tog', `<input type="checkbox" ${last ? 'checked' : ''}> Allow using my last copy of a card`); tg.querySelector('input').onchange = e => sbcSheet(q, e.target.checked); sh.append(tg)
    if (!pick.length) { sh.append(h('p', 'muted', `<b>You don't have enough ${last ? 'spare' : 'duplicate'} cards for this yet.${last ? '' : ' Try allowing last copies.'}</b>`)); return }
    sh.append(h('p', 'muted', '<small style="font-weight:700">Auto-picked your cheapest cards that fit. These cards will be used up:</small>'))
    const g = h('div', 'cardgrid wi-grid'); for (const c of pick) { const b = h('div', 'cg'); b.append(cardImg(eff(c), 200)); g.append(b) } sh.append(g)
    const go2 = h('button', 'btn gold block big', `SUBMIT · GET ${rwText(q.rw).toUpperCase()}`); go2.disabled = q.left < 1
    go2.onclick = async () => { const r = await act('sbc', { id: q.id, keys: pick.map(c => c.key) }); if (!r.error) { closeModal(); if (r.rw.pack) openPack(r.rw.pack); else rerender() } }
    sh.append(go2)
  }, true)
}

// ================= WALKOUT (Legendary+) =================
async function walkout(ov, FXC, c, rk) {
  const cols = ['L', 'M', 'X'].filter(r => TIER[r].rank <= rk).map(tierCol), fin = cols[cols.length - 1]
  const wk = h('div', 'wk', `<div class="wk-bg"></div><div class="wk-beams">${'<i></i>'.repeat(11)}</div><div class="wk-orb"><i></i></div><div class="wk-sil"></div><div class="wk-info"></div><div class="wk-tap">TAP TO SPEED UP</div>`)
  const cv = ov.querySelector('canvas'); cv ? cv.before(wk) : ov.append(wk)
  let fast = false; wk.onclick = () => { fast = true }
  const W = async ms => { await wait(fast ? ms * .2 : ms); if (!ov.isConnected) throw 0 }
  const cx = innerWidth / 2, cy = innerHeight * .45, orb = wk.querySelector('.wk-orb')
  wk.style.setProperty('--oc', cols[0]); await W(30); wk.classList.add('on'); sfx('orb', 0)
  FXC.gather(cx, cy, cols[0], 1.1, 50); await W(1200)
  for (let i = 1; i < cols.length; i++) {
    orb.classList.remove('crack'); void orb.offsetWidth; orb.classList.add('crack')
    wk.style.setProperty('--oc', cols[i]); if (i === 2) wk.classList.add('rb')
    FXC.hit(cx, cy, cols[i], 1.6); FXC.screen(i === 2 ? '#ffffff' : cols[i], .45, .35); FXC.gather(cx, cy, cols[i], 1.3, 50); sfx('crack', i)
    ov.classList.remove('shk2'); void ov.offsetWidth; ov.classList.add('shk2')
    await W(1150)
  }
  sfx('fanfare', rk); FXC.hit(cx, cy, fin, 2.6); FXC.screen('#ffffff', .85, .5); FXC.rays(cx, cy, fin, 26, 1300, 1.7); wk.classList.add('burst')
  await W(650)
  const info = wk.querySelector('.wk-info')
  for (const t of [ANAME(c.anime), c.faction + ' · ' + c.role, c.ver]) { info.innerHTML = `<div class="wk-line"><span>${t}</span><i></i></div>`; sfx('soft'); await W(950) }
  info.innerHTML = ''
  const sil = wk.querySelector('.wk-sil'); sil.style.backgroundImage = `url("${c.url}")`; sil.classList.add('in'); await W(1000)
  sil.classList.add('lit'); sfx('reveal', rk); FXC.hit(cx, cy, fin, 1.8); FXC.rays(cx, cy, fin, 18, 1000, 1.4)
  info.innerHTML = `<div class="wk-name">${c.name}</div>`; await W(1300)
  wk.classList.add('out'); await W(380); wk.remove()
}

// ================= SEASON PASS =================
PAGES.pass = (el) => {
  const S = ST.pass, TH = S.theme
  { let seen = 0; try { seen = +localStorage.getItem('aut-pass-seen-' + S.season) || 0 } catch { } if (S.tier > seen) { if (seen) setTimeout(() => tierUp(S.tier, TH), 400); try { localStorage.setItem('aut-pass-seen-' + S.season, S.tier) } catch { } } }
  const hero = h('section', 'bhero passhero', `<div><span class="sh-tag">SEASON ${S.shown} · ${TH.name} · ENDS IN <b class="timer" data-until="${S.ends - SKEW}"></b></span><h2>${TH.name === 'SEASON ' + S.shown ? 'SEASON PASS' : TH.name}</h2><small class="th-jp">${TH.jp} · ${TH.tag || 'Season Pass'}</small><p>Earn pass XP from everything: battles, packs, challenges, the Tower, arcs and events. The free track has this season's exclusive cards, never sold in packs. Premium adds cosmetics (card frames, titles, avatar borders, opener styles), packs, shards, a Legendary pick at 25 and a Mythic pick at 50.</p>
    <div class="pbar"><b>TIER ${S.tier}</b><i><s style="width:${S.tier >= S.max ? 100 : S.into / S.per * 100}%"></s></i><span>${S.tier >= S.max ? 'MAX' : S.into + ' / ' + S.per + ' XP'}</span></div></div>`)
  if (!S.prem) { const b = h('button', 'btn gold big', `<span>UNLOCK PREMIUM</span><b><i class="coin-i"></i>${fmt(S.cost)}</b>`); b.disabled = P.coins < S.cost; b.onclick = async () => { const r = await act('passBuy'); if (!r.error) rerender() }; hero.querySelector('div').append(b) }
  else hero.querySelector('div').append(h('span', 'pass-own', 'PREMIUM UNLOCKED'))
  hero.style.setProperty('--t1', TH.c1); hero.style.setProperty('--t2', TH.c2); hero.classList.add('themed')
  { const ready = S.rw.reduce((n, [f, p], i) => n + (S.tier >= i + 1 && !S.f.includes(i + 1) ? 1 : 0) + (S.prem && S.tier >= i + 1 && !S.p.includes(i + 1) ? 1 : 0), 0)
    if (ready) { const cl = h('button', 'btn gold big pass-claimall', `CLAIM ALL · ${ready}`); cl.onclick = async () => { cl.disabled = true; let packs = []; for (const [i, [f, p]] of S.rw.entries()) { const t = i + 1; if (S.tier < t) break; for (const [k, R] of [['f', f], ['p', p]]) { if (k === 'p' && !S.prem) continue; if (S[k].includes(t) || R.pick) continue; const r = await act('passClaim', { track: k, tier: t }); if (!r.error && r.rw && r.rw.pack) packs.push(r.rw.pack) } } toast(packs.length ? packs.length + ' packs added. Open them from the Shop.' : 'Rewards claimed!'); rerender() }; hero.querySelector('div').append(cl) } }
  el.append(hero)
  { const best = []; S.rw.forEach(([f, p], i) => { for (const [k, R] of [['FREE', f], ['PREMIUM', p]]) if (R.big || R.card || R.cos) best.push({ t: i + 1, k, R }) })
    const reel = h('div', 'pass-reel'); for (const b of best.slice(0, 12)) { const c = b.R.card && BYKEY[b.R.card], got = (b.k === 'FREE' ? S.f : S.p).includes(b.t)
      const it = h('div', 'pr-it' + (b.k === 'PREMIUM' ? ' p' : '') + (got ? ' got' : ''), `${c ? `<i class="pr-art" style="background-image:url('${c.url}')"></i>` : `<i class="pr-ic">${b.R.cos ? '✦' : b.R.pick ? '★' : '🎴'}</i>`}<small>TIER ${b.t} · ${b.k}</small><b>${b.R.label}</b>`); reel.append(it) }
    el.append(h('div', 'sec', '<h3>SEASON HIGHLIGHTS</h3><span class="muted" style="font-weight:700;font-size:12px">the big rewards this season</span>')); el.append(reel) }
  { const sc = S.seasonCards.map(k => BYKEY[k]).filter(Boolean)
    const box = h('section', 'season-cards'); box.append(h('div', 'sec', `<h3>SEASON ${S.shown} EXCLUSIVES</h3><span class="muted" style="font-weight:700;font-size:12px">free track only · never in packs</span>`))
    const g = h('div', 'cardgrid')
    if (!sc.length) g.append(h('div', 'empty', '<b>Exclusive cards coming soon</b>New ' + TH.name.toLowerCase() + ' cards will appear here and on the free track.'))
    sc.forEach(c => { const b = h('button', 'cg' + (club()[c.key] ? '' : ' miss')); b.append(cardImg(eff(c), 220)); b.onclick = () => cardDetail(c.key); g.append(b) }); box.append(g); el.append(box) }
  el.append(lockerBlock())
  const back = h('button', 'btn dark', '‹ BACK TO BATTLE'); back.onclick = () => go('battle'); el.append(back)
  const tr = h('div', 'ptrack')
  const cell = (t, k, R) => {
    const claimed = S[k].includes(t), reach = S.tier >= t, lock = k === 'p' && !S.prem
    const b = h('button', 'pcell ' + k + (claimed ? ' got' : reach && !lock ? ' ready' : '') + (R.pack || R.pick || R.card || R.cos ? ' big' : '') + (R.card ? ' sc' : '') + (R.cos ? ' cos' : '') + (R.big ? ' ms' : ''), `<small>${k === 'p' ? 'PREMIUM' : 'FREE'}</small><b>${R.label}</b><span>${claimed ? '✓ CLAIMED' : lock ? 'LOCKED' : reach ? 'CLAIM' : 'TIER ' + t}</span>`)
    b.disabled = claimed || !reach || lock
    b.onclick = async () => {
      if (R.pick) return passPick(t, R.pick)
      const r = await act('passClaim', { track: k, tier: t }); if (r.error) return
      if (r.rw && r.rw.pack) openPack(r.rw.pack); else rerender()
    }
    return b
  }
  S.rw.forEach(([f, p], i) => { const col = h('div', 'pcol' + (S.tier >= i + 1 ? ' on' : '')); col.append(h('div', 'pt', String(i + 1)), cell(i + 1, 'f', f), cell(i + 1, 'p', p)); tr.append(col) })
  el.append(tr)
  setTimeout(() => { const c = tr.children[Math.max(0, S.tier - 2)]; if (c) tr.scrollLeft = c.offsetLeft - 20 }, 50)
}
function passPick(t, r) {
  openModal(sh => {
    sh.append(h('div', 'wi-head', `<span class="eyebrow">SEASON PASS · TIER ${t}</span><h2>Pick any ${r === 'M' ? 'Mythic' : 'Legendary'}</h2>`))
    const g = h('div', 'cardgrid wi-grid')
    for (const c of POOL.filter(c => c.r === r && !c.campaignUnlock && !deadZoneReward(c)).sort((a, b) => b.ovr - a.ovr)) { const b = h('button', 'cg'); b.append(cardImg(eff(c), 200)); b.onclick = async () => { const x = await act('passClaim', { track: 'p', tier: t, key: c.key }); if (!x.error) { closeModal(); rerender() } }; g.append(b) }
    sh.append(g)
  }, true)
}

// ================= LOGIN STREAK =================
function lrwText(R) { return [R.pack && ST.packs[R.pack].name, R.coins && fmt(R.coins) + ' coins', R.shards && '◆' + fmt(R.shards), R.tickets && R.tickets + ' Tickets'].filter(Boolean).join(' + ') }
function loginSheet() {
  const L = ST.login
  openModal(sh => {
    sh.append(h('div', 'wi-head', `<span class="eyebrow">ログインボーナス · DAILY LOGIN</span><h2>${L.can ? 'DAY ' + (L.next + 1) : L.streak + ' DAY STREAK'}</h2><p class="muted" style="font-weight:700">Log in every day. Miss a day and the streak starts again at Day 1. Day 7 is a Premium Drop.</p>`))
    const g = h('div', 'lg-grid')
    L.rw.forEach((R, i) => {
      const done = L.can ? i < L.next : i <= L.next, today = L.can && i === L.next
      g.append(h('div', 'lg-d' + (done ? ' done' : '') + (today ? ' today' : '') + (i === 6 ? ' big' : ''), `<small>DAY ${i + 1}</small><b>${lrwText(R)}</b><span>${done ? '✓' : today ? 'TODAY' : ''}</span>`))
    })
    sh.append(g)
    if (L.nextM) { const M = L.nextMrw; sh.append(h('div', 'lg-ms', `🔥 <b>${L.streak}-day streak</b> · ${L.nextM - L.streak} more day${L.nextM - L.streak > 1 ? 's' : ''} to the <b>${L.nextM}-day bonus</b>: ${fmt(M.coins)} coins${M.shards ? ' + ◆' + fmt(M.shards) : ''}${M.premium ? ' + ' + M.premium + ' Premium Drops' : ''}`)) }
    const b = h('button', 'btn gold block big', L.can ? 'CLAIM DAY ' + (L.next + 1) : 'COME BACK TOMORROW'); b.disabled = !L.can
    b.onclick = async () => { const r = await act('loginClaim'); if (r.error) return; closeModal(); if (r.rw.pack) openPack(r.rw.pack); else rerender() }
    sh.append(b)
  })
}
// ================= TRADES =================
async function processTrades() {
  try {
    for (const t of await ACC.tradesOut()) {
      if (t.status === 'accepted') { const r = await act('tradeReceive', { key: t.want }); if (!r.error) await ACC.tradeSet(t.id, 'done') }
      else if (t.status === 'declined') { const r = await act('tradeRefund', { offer: t.offer, coins: t.coins }); if (!r.error) await ACC.tradeSet(t.id, 'refunded') }
    }
  } catch { }
}
setTimeout(processTrades, 4000)
async function tradesTab(body) {
  await processTrades()
  const inc = (await ACC.tradesIn()).filter(t => t.status === 'open'), out = (await ACC.tradesOut()).filter(t => t.status === 'open')
  body.innerHTML = ''
  const desc = t => `${(t.offer || []).map(k => BYKEY[k] ? BYKEY[k].name : '?').join(', ') || ''}${t.coins ? ((t.offer || []).length ? ' + ' : '') + fmt(t.coins) + ' coins' : ''}`
  body.append(h('div', 'sec', '<h3>REQUESTS FOR YOUR CARDS</h3>'))
  if (!inc.length) body.append(h('div', 'empty', '<b>No requests</b>When a friend asks for one of your cards it shows up here.'))
  for (const t of inc) {
    const c = BYKEY[t.want], e = club()[t.want], spare = e ? e.n - (P.team.includes(t.want) ? 1 : 0) : 0
    const r = h('div', 'trow'); const im = cardImg(eff(c), 200); r.append(im)
    r.append(h('div', 'tinfo', `<b>${t.fromName} wants ${c.name}</b><small>${c.ver}</small><span>They offer: ${desc(t) || 'nothing'}</span>${spare < 1 ? '<em>You need a spare copy (not your last, not in your team) to accept.</em>' : ''}`))
    const bx = h('div', 'tbtns'), ok = h('button', 'btn gold sm', 'ACCEPT'), no = h('button', 'btn dark sm', 'DECLINE'); ok.disabled = spare < 1
    ok.onclick = async () => { const x = await act('tradeGive', { key: t.want, offer: t.offer, coins: t.coins }); if (x.error) return; await ACC.tradeSet(t.id, 'accepted'); rerender() }
    no.onclick = async () => { await ACC.tradeSet(t.id, 'declined'); toast('Request declined.'); rerender() }
    bx.append(ok, no); r.append(bx); body.append(r)
  }
  body.append(h('div', 'sec', '<h3>YOUR REQUESTS</h3>'))
  if (!out.length) body.append(h('div', 'empty', '<b>None open</b>Open a friend\'s profile and tap Request a card.'))
  for (const t of out) {
    const c = BYKEY[t.want], r = h('div', 'trow'); r.append(cardImg(eff(c), 200))
    r.append(h('div', 'tinfo', `<b>You asked ${t.toName} for ${c.name}</b><small>${c.ver}</small><span>You offered: ${desc(t) || 'nothing'}. Waiting for them.</span>`))
    const bx = h('div', 'tbtns'), cx = h('button', 'btn dark sm', 'CANCEL')
    cx.onclick = async () => { await ACC.tradeSet(t.id, 'declined'); await processTrades(); rerender() }
    bx.append(cx); r.append(bx); body.append(r)
  }
}
function tradeSheet(p) {
  const pick = { want: null, offer: [], coins: 0 }
  openModal(sh => {
    sh.append(h('div', 'wi-head', `<span class="eyebrow">TRADE REQUEST</span><h2>Ask ${p.name} for a card</h2><p class="muted" style="font-weight:700">Pick the card you want and what you'll give for it. Your offer is held until they accept or decline.</p>`))
    const sum = h('div', 'tsum'); sh.append(sum)
    const q = h('input', 'field'); q.placeholder = 'Search the card you want'; sh.append(q)
    const g1 = h('div', 'cardgrid tpick'); sh.append(g1)
    sh.append(h('div', 'sec', '<h3>YOUR OFFER</h3><span class="muted" style="font-weight:700;font-size:12px">spare cards, up to 3</span>'))
    const g2 = h('div', 'cardgrid tpick'); sh.append(g2)
    const cw = h('label', 'tp-f', '<span>COINS</span>'), ci = h('input', 'field'); ci.inputMode = 'numeric'; ci.placeholder = '0'; ci.oninput = () => { pick.coins = Math.max(0, Math.min(P.coins, +ci.value || 0)); draw() }; cw.append(ci); sh.append(cw)
    const send = h('button', 'btn gold block big', 'SEND REQUEST'); send.style.marginTop = '14px'; sh.append(send)
    const spareList = owned().filter(c => { const e = club()[c.key]; return !c.arcReward && !c.campReward && !c.campaignUnlock && !deadZoneReward(c) && spendableCopies(e, P.team.includes(c.key)) >= 1 && e.n > 1 })
    function draw() {
      sum.innerHTML = `<b>Want:</b> ${pick.want ? BYKEY[pick.want].name + ' · ' + BYKEY[pick.want].ver : 'pick a card'} &nbsp; <b>Offer:</b> ${pick.offer.map(k => BYKEY[k].name).join(', ') || 'no cards'}${pick.coins ? ' + ' + fmt(pick.coins) + ' coins' : ''}`
      send.disabled = !pick.want || (!pick.offer.length && !pick.coins)
      const qq = q.value.trim().toLowerCase(); g1.innerHTML = ''
      for (const c of POOL.filter(c => !c.arcReward && !c.campaignUnlock && !deadZoneReward(c) && (!qq || (c.name + ' ' + c.ver).toLowerCase().includes(qq))).sort((a, b) => b.ovr - a.ovr).slice(0, 18)) { const bt = h('button', 'cg' + (pick.want === c.key ? ' sel' : '')); bt.append(cardImg(eff(c), 200)); bt.onclick = () => { pick.want = c.key; draw() }; g1.append(bt) }
      g2.innerHTML = ''
      if (!spareList.length) g2.append(h('div', 'empty', '<b>No spare duplicates</b>You can still offer coins.'))
      for (const c of spareList) { const on = pick.offer.includes(c.key), bt = h('button', 'cg' + (on ? ' sel' : '')); bt.append(cardImg(eff(c), 200)); bt.onclick = () => { if (on) pick.offer = pick.offer.filter(k => k !== c.key); else if (pick.offer.length < 3) pick.offer.push(c.key); draw() }; g2.append(bt) }
    }
    q.oninput = draw; draw()
    send.onclick = async () => {
      send.disabled = true
      const x = await act('tradeEscrow', { want: pick.want, offer: pick.offer, coins: pick.coins }); if (x.error) { send.disabled = false; return }
      try { await ACC.tradeCreate({ to: p.uid, toName: p.name, want: pick.want, offer: pick.offer, coins: pick.coins }); toast('Request sent to ' + p.name + '!'); closeModal() }
      catch { await act('tradeRefund', { offer: pick.offer, coins: pick.coins }); toast('Could not send the request. Your offer was returned.', 'err'); send.disabled = false }
    }
  })
}

// ================= PROFILE CARD =================
function avatarHTML(p, size = '') { const c = p && p.avatar && BYKEY[p.avatar], bd = p && p.border ? ' bd-' + p.border : ''; return c ? `<div class="pav av${size ? ' ' + size : ''}${bd}" style="--art:url('${c.url}');--fx:${Math.round((c.fx ?? .5) * 100)}%;--fy:${Math.round((c.fy ?? .22) * 100)}%"></div>` : `<div class="pav${size ? ' ' + size : ''}${bd}">${((p && p.name) || '?')[0].toUpperCase()}</div>` }
function titleHTML(p) { return p && p.title ? `<span class="ptitle2">${p.title}</span>` : '' }
function myPub() { const m = ACC.me ? ACC.me() : null, eq = P.eq || {}, cos = ST.cos || {}; return { name: (m && m.profile && m.profile.name) || 'You', avatar: P.avatar, border: eq.border || '', title: eq.title ? (cos[eq.title] || {}).name : '' } }
function profileEdit() {
  openModal(sh => {
    sh.append(h('div', 'wi-head', '<span class="eyebrow">プロフィール · EDIT PROFILE</span><h2>Your profile card</h2>'))
    const prev = h('div', 'pcard-prev'); sh.append(prev)
    const drawPrev = () => { const me = myPub(); prev.innerHTML = `${avatarHTML(me, 'lg')}<div><b>${me.name}</b>${titleHTML(me)}</div>` }
    drawPrev()
    // titles
    const cos = ST.cos, mine = P.cos || [], eq = P.eq || {}
    sh.append(h('div', 'sec', '<h3>TITLE</h3>'))
    const tg = h('div', 'chips'); tg.style.flexWrap = 'wrap'
    const none = h('button', 'chip' + (!eq.title ? ' on' : ''), 'No title'); none.onclick = async () => { await act('equip', { slot: 'title', id: null }); profileEdit() }; tg.append(none)
    for (const id of mine.filter(i => cos[i] && cos[i].type === 'title')) { const b = h('button', 'chip' + (eq.title === id ? ' on' : ''), cos[id].name); b.onclick = async () => { await act('equip', { slot: 'title', id }); profileEdit() }; tg.append(b) }
    sh.append(tg)
    if (!mine.some(i => cos[i] && cos[i].type === 'title')) sh.append(h('p', 'muted', '<small style="font-weight:700">Earn titles from achievements and the Season Pass premium track.</small>'))
    // avatar
    sh.append(h('div', 'sec', '<h3>AVATAR CARD</h3><span class="muted" style="font-weight:700;font-size:12px">pick any card you own</span>'))
    const q = h('input', 'field'); q.placeholder = 'Search your cards'; sh.append(q)
    const g = h('div', 'cardgrid tpick'); sh.append(g)
    const draw = () => { const qq = q.value.trim().toLowerCase(); g.innerHTML = ''; for (const c of owned().filter(c => !qq || (c.name + ' ' + c.ver).toLowerCase().includes(qq)).sort((a, b) => b.ovr - a.ovr).slice(0, 30)) { const b = h('button', 'cg' + (P.avatar === c.key ? ' sel' : '')); b.append(cardImg(eff(c), 200)); b.onclick = async () => { await act('avatar', { key: c.key }); drawPrev(); draw() }; g.append(b) } }
    q.oninput = draw; draw()
    sh.append(h('p', 'muted', '<small style="font-weight:700">Avatar borders, card frames and opener styles are in the Locker on the Season Pass page.</small>'))
  })
}
// ================= ACHIEVEMENTS =================
PAGES.achieve = (el) => {
  const L = ST.ach, done = L.filter(a => a.claimed).length, ready = L.filter(a => a.done && !a.claimed).length
  el.append(h('section', 'bhero', `<div><span class="sh-tag">実績 · ACHIEVEMENTS</span><h2>ACHIEVEMENTS</h2><p>Permanent goals across the whole game. Each one pays out once, and many unlock a profile title.</p></div><div class="bstat"><b>${done}</b><span>/ ${L.length} DONE${ready ? ' · ' + ready + ' TO CLAIM' : ''}</span></div>`))
  for (const g of [...new Set(L.map(a => a.g))]) {
    el.append(h('div', 'sec', `<h3>${g}</h3>`))
    const box = h('div', 'ach-grid')
    for (const a of L.filter(x => x.g === g).sort((x, y) => (y.done && !y.claimed) - (x.done && !x.claimed) || x.claimed - y.claimed)) {
      const R = a.rw, rw = [R.coins && fmt(R.coins) + ' coins', R.shards && '◆' + R.shards, R.pack && ST.packs[R.pack].name, R.title && 'Title: ' + R.title].filter(Boolean).join(' · ')
      const c = h('div', 'ach' + (a.claimed ? ' got' : a.done ? ' ready' : ''), `<b>${a.name}</b><small>${a.d}</small><i><s style="width:${a.p / a.need * 100}%"></s></i><span>${a.need > 1000 ? fmt(a.p) + ' / ' + fmt(a.need) : a.p + ' / ' + a.need}</span><em>${rw}</em>`)
      if (a.done && !a.claimed) { const b = h('button', 'btn gold sm', 'CLAIM'); b.onclick = async () => { const r = await act('achClaim', { id: a.id }); if (r.error) return; if (r.rw.pack) openPack(r.rw.pack); else rerender() }; c.append(b) }
      else if (a.claimed) c.append(h('span', 'ach-ok', '✓ CLAIMED'))
      box.append(c)
    }
    el.append(box)
  }
}

// ================= LOCKER (cosmetics) =================
function lockerBlock() {
  const C = ST.cos, mine = P.cos || [], eq = P.eq || {}, box = h('section', 'locker')
  box.append(h('div', 'sec', '<h3>LOCKER</h3><span class="muted" style="font-weight:700;font-size:12px">cosmetics from the premium track</span>'))
  const g = h('div', 'lk-grid'), NAMES = { frame: 'CARD FRAME', title: 'TITLE', border: 'AVATAR BORDER', opener: 'PACK OPENER' }
  for (const [id, c] of Object.entries(C)) {
    const have = mine.includes(id), on = eq[c.type] === id
    const b = h('button', 'lk' + (have ? '' : ' locked') + (on ? ' on' : ''), `<i class="lk-ic lk-${id}"></i><small>${NAMES[c.type]}</small><b>${c.name}</b><span>${on ? 'EQUIPPED' : have ? 'TAP TO EQUIP' : 'LOCKED · PREMIUM'}</span>`)
    b.disabled = !have; b.onclick = async () => { const r = await act('equip', { slot: c.type, id: on ? null : id }); if (!r.error) rerender() }
    g.append(b)
  }
  box.append(g); return box
}

// ================= EVOLUTIONS =================
function evoBlock(key) {
  const c = BYKEY[key], e = club()[key], tos = ST.evo[key].map(k => BYKEY[k]).filter(Boolean)
  const need = ST.evoCopies[c.r] || 1, spare = spendableCopies(e, P.team.includes(key)), mx = ((P.mast || {})[key] || 0), m1 = mx >= ST.mastT[1]
  const box = h('div', 'evobox', `<b>⬆ EVOLVES INTO</b><div class="evo-to"></div><ul>
    <li class="${spare >= need ? 'ok' : ''}">${need} spare cop${need > 1 ? 'ies' : 'y'} of this card (you have ${Math.max(0, spare)})</li>
    <li class="${m1 ? 'ok' : ''}">Mastery 1 with this card (${mx}/${ST.mastT[1]} XP)</li>
    <li class="${(P.shards || 0) >= ST.evoCost[tos[0].key] ? 'ok' : ''}">◆${fmt(ST.evoCost[tos[0].key])} shards (you have ${fmt(P.shards || 0)})</li></ul>`)
  const row = box.querySelector('.evo-to')
  for (const t of tos) {
    const b = h('button', 'evo-c'); b.append(cardImg(eff(t), 200)); b.append(h('span', '', 'EVOLVE')); b.disabled = !e || spare < need || !m1 || (P.shards || 0) < ST.evoCost[t.key]
    b.onclick = async () => { const r = await act('evolve', { key, to: t.key }); if (!r.error) { closeModal(); evolveFX(c, t) } }
    row.append(b)
  }
  return box
}
async function evolveFX(from, to) {
  const [u1, u2] = await Promise.all([thumbURL(eff(from), 440, true), thumbURL(eff(to), 440, true)])
  const ov = h('div', 'evo-fx', `<div class="ef-bg"></div><img class="ef-a" src="${u1}"><img class="ef-b" src="${u2}"><div class="ef-flash"></div><div class="ef-txt"><small>進化 · EVOLUTION</small><b>${to.name}</b><span>${to.ver}</span></div>`)
  ov.style.setProperty('--rc', tierCol(to.r)); document.body.append(ov); sfx('orb', 1)
  setTimeout(() => sfx('crack', 1), 1300); setTimeout(() => sfx('fanfare', TIER[to.r].rank), 2000)
  setTimeout(() => { ov.onclick = () => { ov.remove(); rerender() } }, 2600); setTimeout(() => { if (ov.isConnected) { ov.remove(); rerender() } }, 6500)
}
function drawEvolve(grid) {
  grid.className = 'evo-list'; grid.innerHTML = ''
  const heads = Object.keys(ST.evo).filter(k => !Object.values(ST.evo).some(L => L.includes(k)))
  const chainOf = k => { const out = [[k]]; let cur = [k]; for (let i = 0; i < 6; i++) { const nx = [...new Set(cur.flatMap(x => ST.evo[x] || []))]; if (!nx.length) break; out.push(nx); cur = nx } return out }
  const seen = new Set()
  for (const hd of heads.sort((a, b) => BYKEY[a].name.localeCompare(BYKEY[b].name))) {
    const nm = BYKEY[hd].name; if (seen.has(nm)) continue; seen.add(nm)
    const firsts = heads.filter(k => BYKEY[k].name === nm), stages = []
    for (const f of firsts) chainOf(f).forEach((lvl, i) => { stages[i] = [...new Set([...(stages[i] || []), ...lvl])] })
    const row = h('div', 'evo-row', `<b>${nm}</b>`), line = h('div', 'evo-line')
    stages.forEach((lvl, i) => { if (i) line.append(h('i', 'evo-arrow', '›')); const g = h('div', 'evo-stage'); for (const k of lvl) { const c = BYKEY[k], btn = h('button', 'cg' + (club()[k] ? '' : ' miss')); btn.append(cardImg(eff(c), 160)); btn.onclick = () => cardDetail(k); g.append(btn) } line.append(g) })
    row.append(line); grid.append(row)
  }
}
// ================= MUSEUM =================
const MU = { a: 'ALL' }
PAGES.museum = (el) => {
  el.append(h('section', 'bhero', `<div><span class="sh-tag">ギャラリー · MUSEUM</span><h2>CARD MUSEUM</h2><p>Every card's full art and the moment behind it. Owned cards are unlocked; the rest stay in shadow until you pull them.</p></div><div class="bstat"><b>${owned().length}</b><span>/ ${POOL.length} UNLOCKED</span></div>`))
  const chips = h('div', 'chips'); chips.style.flexWrap = 'wrap'
  for (const [v, l] of [['ALL', 'All series'], ...[...new Set(POOL.map(c => c.anime))].map(a => [a, ANAME(a)])]) { const b = h('button', 'chip' + (MU.a === v ? ' on' : ''), l); b.onclick = () => { MU.a = v; rerender() }; chips.append(b) }
  el.append(chips)
  const g = h('div', 'mus-grid')
  for (const c of POOL.filter(c => MU.a === 'ALL' || c.anime === MU.a).sort((a, b) => TIER[b.r].rank - TIER[a.r].rank || b.ovr - a.ovr)) {
    const have = !!club()[c.key], t = h('button', 'mus' + (have ? '' : ' locked'))
    t.style.setProperty('--art', `url("${c.url}")`); t.style.setProperty('--rc', tierCol(c.r))
    t.innerHTML = `<i class="mus-art"></i><div class="mus-tx"><small style="color:${tierCol(c.r)}">${RARITY_MARK[c.r]} ${TIER[c.r].name} · ${ANAME(c.anime)}</small><b>${have ? c.name : '???'}</b><span>${have ? c.ver : 'Not yet pulled'}</span>${have && c.pas ? `<p>"${c.pas.d}"</p>` : ''}</div>`
    t.onclick = () => have ? museumView(c) : toast('Pull this card to unlock its art.')
    g.append(t)
  }
  el.append(g)
}
function museumView(c) {
  const ov = h('div', 'mus-view', `<i class="mv-art" style="background-image:url('${c.url}')"></i><div class="mv-tx"><small>${ANAME(c.anime)} · ${c.faction}</small><b>${c.name}</b><span>${c.ver}</span><p><strong>${c.mv}</strong> — ${(c.tx || []).join(' ')}</p>${c.pas ? `<p><strong>${c.pas.n}</strong> — ${c.pas.d}</p>` : ''}<em>Tap anywhere to close</em></div>`)
  ov.onclick = () => ov.remove(); document.body.append(ov)
}
// ================= HOME PARTNER =================
function partnerLine(c) {
  const L = [`Ready when you are.`, `Let's open some packs!`, `Who are we fighting today?`, `The Daily Boss won't beat itself.`, `I've been training. Try me in Ranked.`, `Check the Season Pass, there's free stuff.`, `Nobody stands above me.`, `Got any rivals for me?`, c.pas ? `${c.pas.n}… you've seen what I can do.` : 'Let\'s go.', `${c.mv}! …just warming up.`]
  return L[Math.floor(Math.random() * L.length)]
}

function tierUp(t, TH) {
  const ov = h('div', 'tierup', `<div class="tu-burst"></div><small>SEASON PASS · ${TH.name}</small><b>TIER ${t}</b><span>New rewards unlocked. Tap to claim them.</span>`)
  ov.style.setProperty('--t1', TH.c1); ov.style.setProperty('--t2', TH.c2); document.body.append(ov); sfx('win')
  ov.onclick = () => ov.remove(); setTimeout(() => ov.isConnected && ov.remove(), 3200)
}

// ================= FUSION =================
function drawFuse(grid) {
  grid.className = 'fuse-list'; grid.innerHTML = ''
  grid.append(h('p', 'muted', '<small style="font-weight:700">Fuse one spare copy of each character into their combined card. Inputs must be at most 2 rarities below the result.</small>'))
  const R = ST.fusion.map(r => ({ ...r, o: BYKEY[r.out] })).filter(r => r.o).sort((x, y) => TIER[y.o.r].rank - TIER[x.o.r].rank)
  for (const r of R) {
    const pick = n => owned().filter(c => c.name === n && TIER[c.r].rank >= r.min && spendableCopies(club()[c.key], P.team.includes(c.key)) >= 1).sort((x, y) => x.ovr - y.ovr)[0]
    const a = pick(r.a), b = pick(r.b), ok = a && b && (P.shards || 0) >= r.cost
    const row = h('div', 'fuse-row' + (ok ? ' ok' : ''))
    const slot = (c, n) => { const d = h('div', 'fz-in' + (c ? '' : ' miss')); if (c) d.append(cardImg(eff(c), 160)); else d.innerHTML = `<span>${n}<br><small>${ORDER[r.min] ? TIER[ORDER[r.min]].name : ''}+ spare</small></span>`; return d }
    const res = h('button', 'fz-out'); res.append(cardImg(eff(r.o), 200)); res.onclick = () => cardDetail(r.out)
    row.append(slot(a, r.a), h('i', 'fz-plus', '+'), slot(b, r.b), h('i', 'fz-plus', '='), res)
    const go2 = h('button', 'btn gold sm', `FUSE · ◆${fmt(r.cost)}`); go2.disabled = !ok
    go2.onclick = async () => { const x = await act('fuse', { out: r.out, ka: a.key, kb: b.key }); if (!x.error) evolveFX(a, r.o) }
    row.append(go2); grid.append(row)
  }
}
// ================= GACHA MACHINE =================
function gachaBlock(el) {
  el.append(h('div', 'sec', '<h3>GACHA MACHINE</h3><span class="muted" style="font-weight:700;font-size:12px">ガチャ · 1,000 coins a turn</span>'))
  const box = h('section', 'gacha')
  box.innerHTML = `<div class="gm"><div class="gm-dome">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 80 + 6}%;--y:${(i * 53) % 60 + 20}%;--c:${['#ff3b6b', '#ffcc00', '#2fe0b0', '#3ab8ff', '#a46bff'][i % 5]}"></i>`).join('')}</div><div class="gm-body"><div class="gm-crank"></div><div class="gm-slot"></div></div></div>
    <div class="gm-info"><b>Turn the crank!</b><p>Coins, shards, packs, gacha-only cosmetics, and a 1% shot at a random Legendary.</p><ul>${ST.gachaPool.filter(g => g.rare).map(g => '<li>' + g.label + '</li>').join('')}</ul></div>`
  const b = h('button', 'btn gold big', `<span>TURN</span><b><i class="coin-i"></i>${fmt(ST.gachaCost)}</b>`); b.disabled = P.coins < ST.gachaCost
  b.onclick = async () => {
    b.disabled = true; box.classList.remove('spin'); void box.offsetWidth; box.classList.add('spin'); sfx('charge', 2)
    const r = await act('gacha'); if (r.error) { b.disabled = false; return }
    await wait(1300); sfx(r.prize.rare ? 'fanfare' : 'reveal', r.prize.rare ? 5 : 2)
    const cap = h('div', 'capsule' + (r.prize.rare ? ' rare' : ''), `<i class="cp-top"></i><i class="cp-bot"></i><div class="cp-prize">${r.prize.key ? '' : ''}<small>${r.prize.rare ? '★ RARE PRIZE ★' : 'YOU GOT'}</small><b>${r.prize.label}</b></div>`)
    if (r.prize.key) cap.querySelector('.cp-prize').prepend(cardImg(eff(BYKEY[r.prize.key]), 200))
    document.body.append(cap); cap.onclick = () => { cap.remove(); if (r.prize.pack) toast('Pack added. Open it from the Shop.'); rerender() }
  }
  box.querySelector('.gm-info').append(b); el.append(box)
}
// ================= AMBIENCE: time of day + seasonal events =================
function ambience() {
  const d = new Date(), hr = d.getHours(), m = d.getMonth() + 1, day = d.getDate()
  document.body.dataset.tod = hr >= 21 || hr < 6 ? 'night' : hr >= 17 ? 'dusk' : hr < 10 ? 'dawn' : 'day'
  let fx = ''; try { fx = localStorage.getItem('aut-season-fx') || '' } catch { }
  if (!fx) fx = (m === 10 && day >= 15) || (m === 11 && day <= 2) ? 'halloween' : (m === 12 && day >= 10) || (m === 1 && day <= 3) ? 'winter' : ''
  document.body.dataset.fx = fx
  if (fx && !document.getElementById('fxLayer')) { const L = document.createElement('div'); L.id = 'fxLayer'; L.innerHTML = Array.from({ length: 26 }, (_, i) => `<i style="--x:${(i * 41) % 100}%;--d:${6 + (i % 7)}s;--dl:-${(i * 1.3) % 9}s;--s:${.6 + (i % 4) * .25}"></i>`).join(''); document.body.append(L) }
  if (!fx) document.getElementById('fxLayer')?.remove()
}

// ================= ARTS DECK BUILDER =================
const DK = { i: null, c: null, name: '' }
const DECK_INFO = {
  strike: ['STRIKE', 'Physical hit using PWR. Cheap, chains into combos.', 1], blast: ['BLAST', 'Energy blast using ENG. Hits harder than a Strike.', 2], guard: ['GUARD', 'Halves the next hit you take.', 1], special: ['SPECIAL', "Your active fighter's signature move.", 4],
  burst: ['BURST', 'Spend ALL your Energy on one huge hit. Field 3+ Dragons for Dragon Fury (+50%).', 'ALL'], charge: ['POWER CHARGE', 'Your next attack deals +35%. Stack them for a one-card carry.', 1],
  transfer: ['ENERGY LINK', 'Your bench feeds you +2 Energy.', 0], heal: ['RECOVER', 'Heal your active fighter 18%.', 2], cleanse: ['CLEANSE', 'Remove burn and freeze, and Guard up.', 1],
  senzu: ['SENZU BEAN', 'Fully heals your active fighter and clears burn and freeze.', 2], cylinder: ['MAGIC CYLINDER', 'Trap: the next attack on your fighter bounces back at the attacker.', 2], rumble: ["RUMBLE BALL", "Chopper's Rumble Ball: heals your active fighter 35% and their next attack deals +25%.", 2], finger: ["CURSED FINGER", "Sukuna's finger: your next attack deals +60%, but your fighter loses 10% HP.", 1], deathnote: ["DEATH NOTE", "Write their name: the enemy's active fighter is KO'd after 3 of their turns unless they Cleanse.", 3], hogyoku: ["HOGYOKU", "The Hogyoku evolves its holder: survives the next KO and gains +15% PWR, ENG and DEF.", 2], wing: ["RAINBOW WING", "Ho-Oh's Rainbow Wing: brings back your first KO'd fighter at 40% HP.", 3], scroll: ["SEALING SCROLL", "Seals the enemy active fighter's passive ability.", 2], clock: ["TIME MAGIC CLOCK", "Julius's Time Magic: the enemy loses their next turn.", 3] }
PAGES.deck = (el) => {
  retryPanel(el, 'team')
  if (DK.i == null) DK.i = ST.deckOn
  const D = ST.decks[DK.i]; if (!DK.c) { DK.c = { ...D.c }; DK.name = D.name }
  const total = Object.values(DK.c).reduce((n, v) => n + (v || 0), 0), tac = ['burst', 'charge', 'transfer', 'heal', 'cleanse'].reduce((n, k) => n + (DK.c[k] || 0), 0)
  el.append(h('section', 'bhero', `<div><span class="sh-tag">デッキ · ARTS DECK</span><h2>ARTS DECK</h2><p>Your battle hand is drawn from this 20-card deck. Mix attacks with Tactic cards to build a plan: a Dragon Burst nuke, a one-card carry, or a heal wall. Add up to 2 Items you own (they drop from packs).</p></div><div class="bstat"><b>${total}</b><span>/ 20 CARDS · ${tac}/8 TACTICS</span></div>`))
  const tabs = h('div', 'mtabs'); ST.decks.forEach((d, i) => { const t = h('button', 'mtab' + (DK.i === i ? ' on' : ''), (i === ST.deckOn ? '★ ' : '') + d.name.toUpperCase()); t.onclick = () => { DK.i = i; DK.c = null; rerender() }; tabs.append(t) }); el.append(tabs)
  const nm = h('input', 'field'); nm.value = DK.name; nm.maxLength = 20; nm.oninput = () => DK.name = nm.value; el.append(nm)
  el.append(h('div', 'sec', '<h3>CARDS</h3><span class="muted" style="font-weight:700;font-size:12px">tap − / + to build your deck</span>'))
  const g = h('div', 'dk-grid')
  for (const [k, [n, desc, cost]] of Object.entries(DECK_INFO)) {
    const isI = !!(ST.itemDefs || {})[k], own = isI ? (ST.items || {})[k] || 0 : 99, nI = Object.keys(ST.itemDefs || {}).reduce((n, q) => n + (DK.c[q] || 0), 0)
    const v = DK.c[k] || 0, max = Math.min(ST.deckMax[k], own), isT = !['strike', 'blast', 'guard', 'special'].includes(k) && !isI
    const row = h('div', 'dk-row' + (isT ? ' tac' : '') + (isI ? ' item' : '') + (v ? ' on' : ''), `${isI ? `<span class="dk-cost dk-img" style="background-image:url('${ST.itemDefs[k].art}')"><b>${cost}</b></span>` : `<span class="dk-cost">${cost}</span>`}<div class="dk-tx"><b>${n}${isT ? ' <em>TACTIC</em>' : ''}${isI ? ` <em class="it">ITEM · OWNED ${own}</em>` : ''}</b><small>${desc}</small></div><div class="dk-q"><button>−</button><b>${v}</b><button>+</button></div>`)
    const [mi, pl] = row.querySelectorAll('.dk-q button'); mi.disabled = !v; pl.disabled = v >= max || total >= 20 || (isT && tac >= 8) || (isI && nI >= ST.itemMax)
    mi.onclick = () => { DK.c[k] = v - 1; rerender() }; pl.onclick = () => { DK.c[k] = v + 1; rerender() }
    g.append(row)
  }
  el.append(g)
  const bar = h('div', 'grid2'); bar.style.marginTop = '12px'
  const save = h('button', 'btn gold', 'SAVE & EQUIP FOR TEAM ' + (TTAB + 1)); save.disabled = total !== 20
  save.onclick = async () => { const r = await act('deckSave', { i: DK.i, name: DK.name, c: DK.c, use: true, preset: TTAB }); if (!r.error) { DK.c = null; rerender() } }
  const clr = h('button', 'btn dark', 'CLEAR'); clr.onclick = () => { DK.c = {}; rerender() }
  bar.append(save, clr); el.append(bar)
  el.append(h('div', 'sec', '<h3>STARTER DECKS</h3><span class="muted" style="font-weight:700;font-size:12px">load one into this slot, then tweak it</span>'))
  const sd = h('div', 'dk-starters')
  for (const S0 of ST.starterDecks) { const b = h('button', 'tb-t', `<b>${S0.name.toUpperCase()}</b><small>${Object.entries(S0.c).map(([k, v]) => v + ' ' + DECK_INFO[k][0].toLowerCase()).join(' · ')}</small>`); b.onclick = () => { DK.c = { ...S0.c }; DK.name = S0.name; rerender() }; sd.append(b) }
  el.append(sd)
  el.append(h('p', 'muted', '<small style="font-weight:700">Dragons: Natsu, Acnologia, Kaido (Dragon Form), Slifer and Pokémon trainers with dragons (Charizard, Garchomp, Zekrom, Reshiram, Duraludon). Field 3 or more and every Burst becomes Dragon Fury (+50%).</small>'))
}

// ================= GETTING STARTED =================
function onbBlock(L) {
  const done = L.filter(x => x.claimed).length, box = h('section', 'onb')
  box.innerHTML = `<div class="onb-h"><div><small>はじめに · NEW PLAYER</small><b>GETTING STARTED</b></div><span>${done}/${L.length} · finish all for a Premium Drop</span></div><i class="onb-bar"><s style="width:${done / L.length * 100}%"></s></i><div class="onb-list"></div>`
  const list = box.querySelector('.onb-list')
  for (const x of L.filter(o => !o.claimed).slice(0, 3)) {
    const r = h('div', 'onb-row' + (x.ok ? ' ready' : ''), `<div><b>${x.t}</b><small>${x.d}</small></div>`)
    const btn = x.ok ? h('button', 'btn gold sm', 'CLAIM ' + fmt(x.rw)) : h('button', 'btn sm', 'GO ›')
    btn.onclick = async () => { if (!x.ok) return go(x.go); const r2 = await act('onbClaim', { id: x.id }); if (!r2.error) rerender() }
    r.append(btn); list.append(r)
  }
  return box
}
// ================= HOW TO PLAY =================
const GUIDE = [
  ['🎴', 'WHAT IS THIS GAME?', 'Collect anime fighters as cards, build a team of 6, and battle. Every card is a real moment from an anime (like Goku at the Spirit Bomb), with its own stats, move and a unique passive called a <b>Moment</b>.', 'cards'],
  ['💎', 'RARITIES', 'Common → Uncommon → Rare → Epic → Legendary → Mythic → <b>Rainbow Secret</b> (the rarest). Higher rarity = higher rating and stronger stats. The big number in the corner of a card is its <b>rating</b>.', 'cards'],
  ['📦', 'GETTING CARDS', '<b>Free packs</b> refill on Home every 12 hours. Buy more in the <b>Shop</b> with coins: cheap Bronze packs up to Lightning packs with the best odds. The <b>Banner</b> has 2 featured cards and guarantees a Mythic within 80 pulls. You can also try the <b>Gacha machine</b>, <b>Wonder Pick</b>, or trade with friends.', 'shop'],
  ['🪙', 'COINS & SHARDS', '<b>Coins</b> come from battles, missions, achievements and selling cards. <b>Shards</b> (◆) come from shredding duplicate cards; spend them to craft the exact card you want. Pack Points from opening packs buy specific cards too.', 'shop'],
  ['👥', 'YOUR TEAM', 'Go to <b>Team</b>. You pick 6 cards: a <b>Leader</b>, 2 <b>Starters</b> and 3 on the <b>Bench</b>. Slot 1 is your <b>Leader</b>: its <b>Leader Skill</b> boosts every fighter that shares a category with it (a series like Naruto, or a trait like Villains, Swordsmen or Saiyans). Aim for 6/6 boosted. Not sure? Use the <b>Team Builder</b> with the Leader Boost goal.', 'team'],
  ['⚔️', 'HOW BATTLES WORK', 'It\'s 6 vs 6 but only <b>one fighter</b> is out at a time. Each turn you get <b>+3 Energy</b>. You hold <b>4 cards</b>: tap one to use it (its cost is the number in the corner). Strike = cheap hit, Blast = bigger hit, Guard = block, Special = the fighter\'s signature move. Hit <b>END TURN</b> when you\'re done. Knock out all 6 enemies to win. Stuck? Tap <b>AUTO</b> and the game plays for you.', 'battle'],
  ['🌟', 'ULTIMATES & SWITCHING', 'The ring next to END TURN is your <b>Ultimate</b>. It fills as you fight; when it glows, tap it for a free huge attack. Tap a fighter on your <b>bench</b> to swap them in (once per turn), for example to save a hurt fighter.', 'battle'],
  ['🃏', 'ARTS DECK', 'Your 4 battle cards are drawn from a <b>20-card Arts Deck</b> (Team → Arts Deck). Add <b>Tactic</b> cards to build a strategy: Burst (spend all Energy on one giant hit), Power Charge (boost your next attack), Energy Link (+2 Energy), Recover (heal), Cleanse. New? Load a <b>starter deck</b>.', 'deck'],
  ['🗺️', 'GAME MODES', '<b>Story</b>: 10 stages to start with. <b>Ranked</b>: climb Bronze → Legend each season. <b>Daily Boss</b>: one giant boss a day, deal as much damage as you can. <b>Tower</b>: 50 floors. <b>Story Arcs</b>: famous fights. <b>Event</b>: a new anime every week. <b>Players</b>: battle your friends\' teams.', 'battle'],
  ['📈', 'GETTING STRONGER', '<b>Diamonds</b>: every card starts at ◆◆◆. Each duplicate you pull adds a Diamond, up to 7◆ (stronger stats; 7◆ unlocks <b>Limit Break</b> and a rainbow card). <b>Level</b>: win battles or use Training Tickets to level cards up to Lv 100. <b>Ascension</b> is coming for special cards later.', 'cards'],
  ['🎟️', 'SEASON PASS', 'Everything you do earns pass XP. The free track gives packs and this season\'s <b>exclusive cards</b> you can\'t get anywhere else. Premium (25,000 coins) adds cosmetics, more packs and a Mythic pick at tier 50.', 'pass'],
  ['📋', 'DAILY STUFF', 'Every day: claim your <b>login reward</b>, do <b>Daily Missions</b> (the clipboard button), fight the <b>Daily Boss</b>, do <b>Challenges</b> in the Shop, and open your <b>free packs</b>. That\'s the fastest way to grow.', 'missions'],
]
PAGES.guide = (el) => {
  if (!P.guideSeen) act('guideSeen')
  el.append(h('section', 'bhero', '<div><span class="sh-tag">遊び方 · HOW TO PLAY</span><h2>NEW TO THE GAME?</h2><p>Everything explained in 2 minutes. Tap a topic to open it, or tap GO to jump straight there.</p></div>'))
  const g = h('div', 'guide')
  GUIDE.forEach(([ic, t, d, to], i) => {
    const c = h('details', 'gd'); if (i < 2) c.open = true
    c.innerHTML = `<summary><i>${ic}</i><b>${t}</b><em>›</em></summary><p>${d}</p>`
    const b = h('button', 'btn sm', 'GO TO ' + ({ cards: 'CARDS', shop: 'SHOP', team: 'TEAM', battle: 'BATTLE', deck: 'ARTS DECK', pass: 'SEASON PASS', missions: 'MISSIONS' })[to] + ' ›'); b.onclick = () => go(to); c.append(b)
    g.append(c)
  })
  el.append(g)
  const t = h('button', 'btn gold block big', 'PRACTICE BATTLE TUTORIAL'); t.style.marginTop = '14px'; t.onclick = () => go('battle'); el.append(t)
}

// ================= AWAKENING TREE =================
function awakenSheet(key) {
  const base = BYKEY[key]; if (!base) return
  openModal(sh => {
    const e = club()[key]; if (!e) return
    const have = e.awk || [], c = eff(base), dup = e.n - 1, mult = ST.awkSh[base.r]
    sh.append(h('div', 'sec', '<h3>AWAKENING TREE</h3><span class="muted" style="font-weight:700;font-size:12px">覚醒 · spend duplicates and shards</span>'))
    const top = h('div', 'awk-top'); const im = cardImg(c, 300); im.style.width = '120px'; top.append(im, h('div', 'awk-info', `<b>${c.name}</b><small>${c.ver}</small><span>GRADE ${gradeOf(base.ovr)} → <em>${gradeOf(c.ovr)}</em></span><span>${have.length}/7 NODES</span><span>DUPLICATES ${dup} · ◆${fmt(P.shards || 0)}</span>`)); sh.append(top)
    const rows = [['aw'], ['dodge', 'dmg', 'ovr'], ['spd', 'pwr', 'def']], g = h('div', 'awk-tree')
    for (const r of rows) { const row = h('div', 'awk-row')
      for (const id of r) { const N = ST.awkT.find(n => n.id === id), got = have.includes(id), req = N.req ? [].concat(N.req) : [], open = req.every(q => have.includes(q)), cost = N.sh * mult, can = open && !got && dup >= N.dup && (P.shards || 0) >= cost
        const b = h('button', 'awk-n' + (got ? ' got' : can ? ' can' : open ? ' open' : '') + (id === 'aw' ? ' final' : ''), `<b>${N.name}</b><small>${N.d}</small><em>${got ? 'UNLOCKED' : !open ? '🔒 LOCKED' : N.dup + ' dupe · ◆' + fmt(cost)}</em>`)
        b.disabled = !can; b.onclick = async () => { const x = await act('awk', { key, node: id }); if (!x.error) { if (id === 'aw') sfx('fanfare'); awakenSheet(key); if (CUR === 'cards' || CUR === 'team') rerender() } }
        row.append(b) }
      g.append(row) }
    sh.append(g)
    sh.append(h('p', 'muted', '<small style="font-weight:700">Bottom nodes first. Boosts apply in every battle and to your team rating. Fully awakened cards get a glowing foil.</small>'))
  })
}

// ================= TEAM BUILDER (auto build v2) =================
const TBX = { goal: 'lead', series: [], types: [], roles: [], atags: [], need: {}, rmin: 'C', rmax: 'X', faction: '', tag: 'any', locks: [], excl: [], fill: 'best', open: false }
const GOALS = [['best', 'HIGHEST RATING', 'Strongest six'], ['lead', 'LEADER BOOST', 'All six boosted by the leader'], ['speed', 'SPEED', 'Move first, hit first'], ['tank', 'TANK WALL', 'Defence and survival'], ['burst', 'BURST DAMAGE', 'Power and energy hitters'], ['sustain', 'SUSTAIN', 'Heals, revives, endure'], ['dragon', 'DRAGON DECK', '3+ Dragons for Burst']]
const ROLES = ['FIGHTER', 'ASSASSIN', 'SHOOTER', 'TANK', 'SUPPORT']
const isDrg = isDragon
function goalScore(c, g) {
  const st = c.st || [70, 70, 70, 70, 70, 70], e = (c.pas && c.pas.e) || {}
  if (g === 'speed') return c.ovr * .45 + st[1] * .55 + (e.first ? 8 : 0) + (e.spd || 0) * .5 + (e.dodge || 0) * .3
  if (g === 'tank') return c.ovr * .35 + st[4] * .45 + (c.role === 'TANK' ? 8 : 0) + (e.endure ? 6 : 0) + (e.dr || 0) * .5 + (e.guardStrong ? 4 : 0)
  if (g === 'burst') return c.ovr * .4 + Math.max(st[0], st[2]) * .5 + (e.dmg || 0) * .4 + (e.spec || 0) * .3 + (e.exec ? 4 : 0)
  if (g === 'sustain') return c.ovr * .6 + (e.regen || 0) * 2 + (e.teamHeal || 0) * 2.5 + (e.revive ? 6 : 0) + (e.endure ? 5 : 0) + (c.role === 'SUPPORT' ? 6 : 0)
  if (g === 'dragon') return c.ovr + (isDrg(c) ? 25 : 0)
  if (g.startsWith('vs:')) return scoreFor(c, g)
  return c.ovr
}
function chemOf(T) { const link = (x, y) => !x || !y ? 0 : x.faction === y.faction ? 2 : x.anime === y.anime ? 1 : 0, lead = T[0]; return Math.round((link(T[0], T[1]) + link(T[1], T[2])) / 4 * 70 + (lead ? T.slice(3).filter(c => c && c.anime === lead.anime).length : 0) / 3 * 30) }
function bestLeader(L) { let best = { v: 0, c: null }; for (const c of L) { if (!c.lead) continue; const n = L.filter(x => leadHits(c.lead, x)).length, v = n * c.lead.pct / 10 + (c.lead.ki ? 2 : 0); if (v > best.v) best = { v, c, n } } return best }
function orderTeam(L, g) { const B = bestLeader(L); if (B.c) return [B.c, ...L.filter(x => x !== B.c).sort((x, y) => goalScore(y, g) - goalScore(x, g))]; return orderTeamOld(L, g) }
function orderTeamOld(L, g) { // best lead + chemistry order
  let best = L, bv = -1e9; const sorted = L.slice().sort((x, y) => goalScore(y, g) - goalScore(x, g))
  const perm = (arr, k, out) => { if (k === arr.length) { const v = chemOf(arr) + goalScore(arr[0], g) * .2 + (arr[1] ? goalScore(arr[1], g) * .1 : 0) + (arr[2] ? goalScore(arr[2], g) * .1 : 0); if (v > bv) { bv = v; best = arr.slice() } return } for (let i = k; i < arr.length; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]] } }
  perm(sorted.slice(), 0); return best
}
function chemFast(L) { const f = {}, a = {}; for (const c of L) { f[c.faction] = (f[c.faction] || 0) + 1; a[c.anime] = (a[c.anime] || 0) + 1 } const mf = Math.max(0, ...Object.values(f)), ma = Math.max(0, ...Object.values(a)); const links = mf >= 3 ? 4 : mf === 2 ? 2 + (ma >= 3 ? 1 : 0) : ma >= 3 ? 2 : ma === 2 ? 1 : 0; return Math.round(links / 4 * 70 + Math.min(3, Math.max(0, ma - 1)) / 3 * 30) }
function teamValue(L, g) {
  const n = L.length || 1, avg = L.reduce((t, c) => t + goalScore(c, g), 0) / n, sy = synergy(L).bonus, ch = chemFast(L)
  const roles = new Set(L.map(c => c.role)).size, types = {}; for (const c of L) { const t = c.t || typeOfA(c.anime); types[t] = (types[t] || 0) + 1 }
  const LB = bestLeader(L); let v = avg + LB.v * (g === 'lead' ? 1.6 : .6) + roles * .4 - Math.max(0, Math.max(...Object.values(types)) - 3) * 1.2
  for (const [ro, m] of Object.entries(TBX.need)) { const have = L.filter(c => c.role === ro).length; if (have < m) v -= 100 * (m - have) }
  if (g === 'dragon') { const d = L.filter(isDrg).length; if (d < 3) v -= (3 - d) * 30 }
  return v
}
function builderPool() {
  const R = 'CURELMX', lo = R.indexOf(TBX.rmin), hi = R.indexOf(TBX.rmax)
  return owned().map(eff).filter(c => !c.season || true).filter(c => !TBX.excl.includes(c.key)).filter(c => {
    if (TBX.series.length && !TBX.series.includes(c.anime)) return false
    if (TBX.types.length && !TBX.types.includes(c.t || typeOfA(c.anime))) return false
    if (TBX.roles.length && !TBX.roles.includes(c.role)) return false
    if (TBX.atags.length && !TBX.atags.some(t => tagsOf(c).includes(t.replace(/^ARCH:/, '')))) return false
    const ri = R.indexOf(c.r); if (ri < lo || ri > hi) return false
    if (TBX.faction && c.faction !== TBX.faction) return false
    if (TBX.tag === 'only' && !c.tag) return false; if (TBX.tag === 'none' && c.tag) return false
    return true })
}
function buildOptions() {
  const g = TBX.goal, locks = TBX.locks.map(k => club()[k] && BYKEY[k] && eff(BYKEY[k])).filter(Boolean), pool = builderPool().filter(c => !TBX.locks.includes(c.key))
  const ranked = pool.slice().sort((x, y) => goalScore(y, g) - goalScore(x, g)), cand = ranked.slice(0, 45)
  if (g === 'syn' || g === 'chem' || g === 'dragon') for (const c of ranked.slice(45)) if (cand.length < 90 && (isDrg(c) || ranked.slice(0, 6).some(x => x.anime === c.anime || x.faction === c.faction))) cand.push(c)
  const slots = 6 - locks.length, seen = new Map()
  const climb = start => { let cur = start.slice(), val = teamValue(locks.concat(cur), g), imp = true, guard = 0
    while (imp && guard++ < 40) { imp = false
      for (let i = 0; i < cur.length; i++) for (const c of cand) { if (cur.includes(c)) continue; const t = cur.slice(); t[i] = c; const v = teamValue(locks.concat(t), g); if (v > val + 1e-9) { cur = t; val = v; imp = true } } }
    return [cur, val] }
  const starts = [ranked.slice(0, slots)]
  for (const a of new Set(cand.map(c => c.anime))) starts.push(cand.filter(c => c.anime === a).concat(cand).filter((c, i, L) => L.indexOf(c) === i).slice(0, slots))
  for (let k = 0; k < 14; k++) starts.push(cand.slice().sort(() => Math.random() - .5).slice(0, slots))
  for (const st of starts) { if (st.length < Math.min(slots, cand.length)) continue; const [t, v] = climb(st); const key = t.map(c => c.key).sort().join('|'); if (!seen.has(key) || seen.get(key).v < v) seen.set(key, { t, v }) }
  if (!seen.size && slots > 0) seen.set('x', { t: ranked.slice(0, slots), v: 0 })
  if (slots <= 0) seen.set('l', { t: [], v: 0 })
  const out = [...seen.values()].sort((x, y) => y.v - x.v), picks = []
  for (const o of out) { if (picks.length >= 3) break; if (picks.some(p => p.t.filter(c => o.t.includes(c)).length >= 5)) continue; picks.push(o) }
  return picks.map(o => { let L = locks.concat(o.t)
    if (L.length < 6 && TBX.fill === 'best') { const extra = owned().map(eff).filter(c => !L.some(x => x.key === c.key) && !TBX.excl.includes(c.key)).sort((x, y) => goalScore(y, g) - goalScore(x, g)); L = L.concat(extra.slice(0, 6 - L.length)) }
    const T = orderTeam(L, g); return { T, rating: Math.round(T.reduce((n, c) => n + c.ovr, 0) / (T.length || 1)), syn: synergy(T), chem: chemOf(T), short: L.length < 6 } })
}
function whyFor(c, g) { const e = (c.pas && c.pas.e) || {}, w = []
  if (TBX.locks.includes(c.key)) w.push('locked'); if (g === 'speed') w.push('SPD ' + c.st[1]); if (g === 'tank') w.push('DEF ' + c.st[4]); if (g === 'burst') w.push('PWR ' + c.st[0]); if (g === 'dragon' && isDrg(c)) w.push('Dragon')
  if (e.endure || e.revive) w.push('survives KO'); if (e.regen || e.teamHeal) w.push('heals'); if (e.first) w.push('moves first'); if (!w.length) w.push('Grade ' + gradeOf(c.ovr))
  return w.slice(0, 2).join(' · ') }
function teamBuilderPanel(el) {
  const own = owned(), chip = (on, label, fn, cls = '') => { const b = h('button', 'tb-chip' + (on ? ' on' : '') + cls, label); b.onclick = fn; return b }
  el.append(h('div', 'sec', '<h3>TEAM BUILDER</h3><span class="muted" style="font-weight:700;font-size:12px">pick a goal, add filters, build</span>'))
  const box = h('div', 'tbx')
  const gl = h('div', 'tb-targets'); const goals = GOALS.slice(); if (ST.event) goals.push(['vs:' + ST.event.anime, '⚡ COUNTER EVENT', 'Beat ' + ANAME(ST.event.anime)])
  for (const [id, l, sub] of goals) { const b = h('button', 'tb-t' + (TBX.goal === id ? ' on' : ''), `<b>${l}</b><small>${sub}</small>`); b.onclick = () => { TBX.goal = id; rerender() }; gl.append(b) }
  box.append(gl)
  const nf = TBX.series.length + TBX.types.length + TBX.roles.length + TBX.atags.length + Object.keys(TBX.need).length + (TBX.rmin !== 'C' || TBX.rmax !== 'X') + !!TBX.faction + (TBX.tag !== 'any') + TBX.locks.length + TBX.excl.length
  const tog = h('button', 'btn dark sm', (TBX.open ? '▾ HIDE FILTERS' : '▸ FILTERS') + (nf ? ' · ' + nf + ' ON' : '')); tog.onclick = () => { TBX.open = !TBX.open; rerender() }; box.append(tog)
  if (TBX.open) {
    const sec = (t, kids) => { const d = h('div', 'tb-f', `<small>${t}</small>`), w = h('div', 'tb-chips'); kids.forEach(k => w.append(k)); d.append(w); box.append(d) }
    const flip = (arr, v) => { const i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); rerender() }
    const cnt = {}; for (const c of own) cnt[c.anime] = (cnt[c.anime] || 0) + 1
    sec('SERIES', Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]).map(a => chip(TBX.series.includes(a), ANAME(a) + ' · ' + cnt[a], () => flip(TBX.series, a))))
    const ty = [...new Set(own.map(c => c.t || typeOfA(c.anime)))]; sec('TYPE', ty.map(t => chip(TBX.types.includes(t), (TYPE[t] || {}).en || t, () => flip(TBX.types, t))))
    { const cnt = {}; for (const c of own) for (const t of new Set([...(c.arch || []).map(x => 'ARCH:' + x), ...(c.cat || []), ...(c.aura || [])])) cnt[t] = (cnt[t] || 0) + 1; const tags = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]); sec('CATEGORY / AURA TAG · cards that share the tag boost each other', tags.map(t => chip(TBX.atags.includes(t), auraTag(t) + ' · ' + cnt[t], () => flip(TBX.atags, t)))) }
    sec('ONLY THESE ROLES', ROLES.map(ro => chip(TBX.roles.includes(ro), ro, () => flip(TBX.roles, ro))))
    sec('AT LEAST (ROLES)', ROLES.map(ro => chip(!!TBX.need[ro], ro + (TBX.need[ro] ? ' ×' + TBX.need[ro] : ''), () => { TBX.need[ro] = ((TBX.need[ro] || 0) + 1) % 4; if (!TBX.need[ro]) delete TBX.need[ro]; rerender() })))
    const R = 'CURELMX'.split(''), rs = (v, f) => { const x = h('select', 'tb-sel'); x.innerHTML = R.map(q => `<option value="${q}" ${q === v ? 'selected' : ''}>${TIER[q].name}</option>`).join(''); x.onchange = () => { f(x.value); rerender() }; return x }
    sec('RARITY FROM → TO', [rs(TBX.rmin, v => TBX.rmin = v), rs(TBX.rmax, v => TBX.rmax = v)])
    const facs = [...new Set(own.map(c => c.faction))].sort(), fs2 = h('select', 'tb-sel'); fs2.innerHTML = '<option value="">Any faction</option>' + facs.map(f => `<option ${f === TBX.faction ? 'selected' : ''}>${f}</option>`).join(''); fs2.onchange = () => { TBX.faction = fs2.value; rerender() }
    sec('FACTION', [fs2])
    sec('TAG UNITS', [['any', 'ANY'], ['only', 'TAG ONLY'], ['none', 'NO TAGS']].map(([v, l]) => chip(TBX.tag === v, l, () => { TBX.tag = v; rerender() })))
    sec('LOCK CARDS FROM CURRENT TEAM', P.team.filter(Boolean).map(k => chip(TBX.locks.includes(k), '🔒 ' + BYKEY[k].name, () => flip(TBX.locks, k))))
    if (TBX.excl.length) sec('EXCLUDED (tap to allow again)', TBX.excl.map(k => chip(true, '✕ ' + (BYKEY[k] || {}).name, () => flip(TBX.excl, k))))
    sec('IF FILTERS LEAVE GAPS', [['best', 'FILL WITH BEST'], ['empty', 'LEAVE EMPTY']].map(([v, l]) => chip(TBX.fill === v, l, () => { TBX.fill = v; rerender() })))
    const rs3 = h('button', 'btn dark sm', 'RESET FILTERS'); rs3.onclick = () => { Object.assign(TBX, { series: [], types: [], roles: [], atags: [], need: {}, rmin: 'C', rmax: 'X', faction: '', tag: 'any', locks: [], excl: [] }); rerender() }; box.append(rs3)
  }
  el.append(box)
  const row = h('div', 'grid2'); row.style.margin = '10px 0 4px'
  const auto = h('button', 'btn gold', 'BUILD TEAM'), clear = h('button', 'btn dark', 'CLOSE')
  auto.onclick = () => { if (!own.length) return toast('Open some packs first.', 'err'); builderResults() }
  clear.onclick = () => { TBX.show = false; rerender() }
  row.append(auto, clear); el.append(row)
  // presets
  const ps = (ST.presets || []), pr = h('div', 'tb-presets')
  for (let i = 0; i < 3; i++) { const p = ps[i], w = h('div', 'tb-pre', `<b>${p ? p.name : 'EMPTY SLOT ' + (i + 1)}</b>`)
    if (p) { const l = h('button', 'btn green sm', 'LOAD'); l.onclick = async () => { const result = await act('teamPresetLoad', { i }); if (!result.error) { TTAB = i; try { localStorage.setItem('aut-teamTab', i) } catch { } rerender() } }; w.append(l) }
    const sv = h('button', 'btn dark sm', p ? 'OVERWRITE' : 'SAVE CURRENT'); sv.onclick = async () => { const nm = prompt('Name this team', p ? p.name : 'Team ' + (i + 1)); if (nm == null) return; await act('teamPreset', { i, name: nm.slice(0, 18) || 'Team ' + (i + 1), team: P.team }); rerender() }; w.append(sv)
    pr.append(w) }

}
function builderResults() {
  const opts = buildOptions(), g = TBX.goal
  openModal(sh => {
    sh.append(h('div', 'sec', `<h3>BUILD RESULTS</h3><span class="muted" style="font-weight:700;font-size:12px">${(GOALS.find(x => x[0] === g) || [0, 'COUNTER'])[1]} · tap a card to exclude it</span>`))
    if (!opts.length || !opts[0].T.length) { sh.append(h('p', 'muted', 'No cards match those filters. Loosen them and try again.')); return }
    opts.forEach((o, n) => {
      const w = h('div', 'tb-opt' + (n === 0 ? ' best' : ''))
      w.append(h('div', 'tb-oh', `<b>${n === 0 ? 'BEST PICK' : 'OPTION ' + (n + 1)}</b><span>AVG GRADE <em>${gradeOf(o.rating)}</em></span><span>LEADER BOOST <em>${o.T[0] && o.T[0].lead ? o.T.filter(x => leadHits(o.T[0].lead, x)).length + '/' + o.T.length : '—'}</em></span>${o.short ? '<span class="warn">FILTERS LEFT GAPS</span>' : ''}`))
      const g6 = h('div', 'tb-o6')
      o.T.forEach((c, i) => { const cell = h('button', 'tb-oc'); cell.append(cardImg(c, 200), h('small', '', (i === 0 ? 'LEADER · ' : '') + whyFor(c, g))); cell.onclick = () => { if (TBX.locks.includes(c.key)) return toast('That card is locked.', 'err'); TBX.excl.push(c.key); builderResults() }; g6.append(cell) })
      w.append(g6)
      const ap = h('button', 'btn ' + (n === 0 ? 'gold' : 'violet') + ' block', 'USE THIS TEAM'); ap.onclick = async () => { const T = o.T.map(c => c.key); while (T.length < 6) T.push(null); await act('team', { team: T }); closeModal(); toast('Team set!', 'gold'); rerender() }
      w.append(ap); sh.append(w)
    })
  })
}

// ================= DIAMONDS · LEVEL · ASCENSION =================
const diaStr = n => '◆'.repeat(n) + '◇'.repeat(7 - n)
function trainingSheet(key, initialTarget) {
  const owned = club()[key]
  const card = BYKEY[key]
  if (!card || !owned || (owned.lv || 1) >= LV_MAX) return cardDetail(key)
  const level = owned.lv || 1
  openModal(sh => {
    const panel = h('section', 'training-plan')
    const heading = h('h2', '', 'Train to level')
    const name = h('p', 'muted')
    name.textContent = card.name + ' · Currently Lv ' + level
    const picker = h('div', 'training-picker')
    const target = h('select', 'training-select')
    target.id = 'training-target'
    for (let n = level + 1; n <= LV_MAX; n++) {
      const option = h('option', '', 'Lv ' + n)
      option.value = n
      target.append(option)
    }
    target.value = initialTarget ?? level + 1
    const max = h('button', 'btn dark', 'SET MAX')
    max.onclick = () => { target.value = LV_MAX; render() }
    const targetLabel = h('label', '', 'Target level')
    targetLabel.htmlFor = target.id
    picker.append(target, max)
    const payment = h('select', 'training-select')
    payment.id = 'training-payment'
    for (const [value, label] of [['coins', 'Coins only'], ['tickets', 'Training Tickets only'], ['mixed', 'Tickets + coins']]) {
      const option = h('option', '', label)
      option.value = value
      payment.append(option)
    }
    payment.value = ST.tickets > 0 ? 'mixed' : 'coins'
    const paymentLabel = h('label', '', 'Pay with')
    paymentLabel.htmlFor = payment.id
    const price = h('div', 'training-price')
    price.setAttribute('aria-live', 'polite')
    const warning = h('p', 'training-warning')
    const back = h('button', 'btn dark', 'BACK')
    back.onclick = () => cardDetail(key)
    const train = h('button', 'btn gold', 'CONFIRM TRAINING')
    const actions = h('div', 'training-picker')
    actions.append(back, train)
    let busy = false
    function render() {
      const quote = trainingQuote(club()[key] || owned, Number(target.value), payment.value, ST.tickets || 0)
      const coins = P.coins, tickets = ST.tickets || 0
      price.textContent = quote ? fmt(quote.coins) + ' coins + ' + fmt(quote.tickets) + ' Training Tickets' : 'Choose a higher level.'
      const affordable = quote && coins >= quote.coins && tickets >= quote.tickets
      warning.textContent = !quote ? '' : (affordable ? 'Training spends these resources permanently.' : 'You don’t have enough resources for this option.') +
        (quote.unusedXP ? ' ' + fmt(quote.unusedXP) + ' XP from the final ticket won’t be used.' : '')
      balance.textContent = 'Available: ' + fmt(coins) + ' coins · ' + fmt(tickets) + ' Training Tickets'
      train.disabled = busy || !affordable
      target.disabled = payment.disabled = max.disabled = back.disabled = busy
      return affordable ? quote : null
    }
    const balance = h('p', 'muted')
    target.onchange = payment.onchange = render
    train.onclick = async () => {
      if (busy) return
      const quote = render()
      if (!quote) return
      const next = Number(target.value)
      if (!confirm('Train ' + card.name + ' to Lv ' + next + ' for ' + price.textContent + '? ' + warning.textContent)) return
      busy = true
      render()
      const result = await act('trainTo', { key, target: next, payment: payment.value, ...quote })
      if (!panel.isConnected) return
      if (!result.error) {
        if (CUR === 'cards') rerender()
        cardDetail(key)
      } else {
        busy = false
        render()
      }
    }
    panel.append(heading, name, targetLabel, picker, paymentLabel, payment, price, balance, warning, actions)
    sh.append(panel)
    render()
  })
}

function progBox(key) {
  const o = club()[key], dia = o.dia || 3, lv = o.lv || 1, need = (ST.lvNeed || [])[lv] || 1, xp = o.xp || 0
  const w = h('div', 'prog' + (dia >= 7 ? ' maxed' : ''), `<div class="pg-d"><b>${diaStr(dia)}</b><span>${dia >= 7 ? 'LIMIT BREAK · passive 25% stronger' : (7 - dia) + ' more duplicate' + (7 - dia > 1 ? 's' : '') + ' to max'}</span></div>
    <div class="pg-l"><b>Lv ${lv}</b><i><s style="width:${lv >= 100 ? 100 : Math.round(xp / need * 100)}%"></s></i><span>${lv >= 100 ? 'MAX LEVEL' : xp + ' / ' + need + ' XP'}</span></div>
    <div class="pg-a"><b>A${o.asc || 0}</b><span>ASCENSION · coming soon</span></div>`)
  if (lv < LV_MAX) {
    const actions = h('div', 'pg-train')
    const train = h('button', 'btn green sm', 'TRAIN TO LEVEL')
    const max = h('button', 'btn dark sm', 'TRAIN TO MAX')
    train.onclick = () => trainingSheet(key)
    max.onclick = () => trainingSheet(key, LV_MAX)
    actions.append(train, max)
    w.append(actions)
  }
  return w
}

// ================= LEADER SKILLS =================
const catName = k => ANIME[k] ? ANAME(k) : k
function leadText(L) { return L.cats.map(catName).join(' or ') + ': +' + L.pct + '% HP, +' + Math.round(L.pct / 2) + '% attack and defence' + (L.ki ? ', +' + L.ki + ' Energy per turn' : '') }
