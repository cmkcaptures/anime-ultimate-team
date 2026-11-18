// Shared card data + drawing, used by the app and the 3D pack opening.
export const RB = ['#ff9ecb', '#ffe08a', '#a8ffcf', '#9ad8ff', '#c9a8ff'];
export const RBH = [0xff4fa3, 0xffd23a, 0x3dffa8, 0x3dc0ff, 0xa66bff];

// ================= DATA =================
export const TIER = {
  C: { name: 'COMMON', rank: 0, pal: ['#f3d1a8', '#c08a58', '#7a4a24'], hex: 0xc08a58, holo: 0 },
  U: { name: 'UNCOMMON', rank: 1, pal: ['#d9fff2', '#6fe0bd', '#1f7a62'], hex: 0x6fe0bd, holo: .04 },
  R: { name: 'RARE', rank: 2, pal: ['#e3f4ff', '#6cc4ff', '#1f5fb8'], hex: 0x4fb4ff, holo: .12 },
  E: { name: 'EPIC', rank: 3, pal: ['#f0e2ff', '#b98bff', '#5a2bd0'], hex: 0x9a5cff, holo: .22 },
  L: { name: 'LEGENDARY', rank: 4, pal: ['#fff6c9', '#ffd45a', '#c98a00'], hex: 0xffb000, holo: .3 },
  M: { name: 'MYTHIC', rank: 5, pal: ['#ffe0f0', '#ff5ab0', '#a01060'], hex: 0xff3d9a, holo: .35 },
  X: { name: 'RAINBOW SECRET', rank: 6, pal: RB, hex: 0xc9a8ff, holo: .35 },
}
export const ORDER = ['C', 'U', 'R', 'E', 'L', 'M', 'X']
export const ANIME = {
  DBZ: { name: 'DRAGON BALL', tag: 'DBZ', type: 'ki' },
  BC: { name: 'BLACK CLOVER', tag: 'BC', type: 'mana' },
  JJK: { name: 'JUJUTSU KAISEN', tag: 'JJK', type: 'curse' },
  NAR: { name: 'NARUTO', tag: 'NAR', type: 'chak' },
  OP: { name: 'ONE PIECE', tag: 'OP', type: 'haki' },
  MHA: { name: 'MY HERO ACADEMIA', tag: 'MHA', type: 'quirk' },
  BL: { name: 'BLUE LOCK', tag: 'BL', type: 'ego' },
  DS: { name: 'DEMON SLAYER', tag: 'DS', type: 'breath' },
  HXH: { name: 'HUNTER X HUNTER', tag: 'HXH', type: 'nen' },
  FT: { name: 'FAIRY TAIL', tag: 'FT', type: 'magic' },
  CSM: { name: 'CHAINSAW MAN', tag: 'CSM', type: 'devil' },
  JJBA: { name: 'JOJO\'S BIZARRE ADVENTURE', tag: 'JJBA', type: 'stand' },
  TG: { name: 'TOKYO GHOUL', tag: 'TG', type: 'ghoul' },
  BLE: { name: 'BLEACH', tag: 'BLE', type: 'reiatsu' },
  K8: { name: 'KAIJU NO. 8', tag: 'K8', type: 'kaiju' },
  MOB: { name: 'MOB PSYCHO 100', tag: 'MOB', type: 'psychic' },
  FF: { name: 'FIRE FORCE', tag: 'FF', type: 'flame' },
  OPM: { name: 'ONE PUNCH MAN', tag: 'OPM', type: 'hero' },
  KGB: { name: 'KAGURABACHI', tag: 'KGB', type: 'flame' },
  YGO: { name: 'YU-GI-OH!', tag: 'YGO', type: 'psychic' },
}
export const TYPE = {
  ki: { c: ['#ff7a00', '#b80018', '#ffd400'], en: 'AURA' },
  mana: { c: ['#12c95c', '#04572b', '#c8ff3d'], en: 'MANA' },
  curse: { c: ['#b03dff', '#3d14b8', '#ff5ad1'], en: 'CURSED' },
  chak: { c: ['#00a8ff', '#0030c8', '#7df9ff'], en: 'CHAKRA' },
  haki: { c: ['#ff3b30', '#7a0010', '#ffd23a'], en: 'HAKI' },
  quirk: { c: ['#2dff9a', '#0a6b3c', '#fff04a'], en: 'QUIRK' },
  ego: { c: ['#2d7dff', '#081a6b', '#7df9ff'], en: 'EGO' },
  breath: { c: ['#ff4a6a', '#5a0a2a', '#ffd0e0'], en: 'BREATH' },
  nen: { c: ['#b0f0ff', '#2a6aff', '#ffffff'], en: 'NEN' },
  magic: { c: ['#ff8a3d', '#c8102e', '#ffe06a'], en: 'MAGIC' },
  devil: { c: ['#ff6a00', '#3a0a1a', '#ff3d9a'], en: 'DEVIL' },
  stand: { c: ['#ffd23a', '#7a3dff', '#ff5ad1'], en: 'STAND' },
  ghoul: { c: ['#ff1a3d', '#1a0008', '#c0c0c0'], en: 'GHOUL' },
  reiatsu: { c: ['#5ac8ff', '#0a0a2a', '#ff8a3d'], en: 'REIATSU' },
  kaiju: { c: ['#3dffd0', '#0a2a3a', '#ff3d6a'], en: 'KAIJU' },
  psychic: { c: ['#d0a0ff', '#3a0a6a', '#ffffff'], en: 'PSYCHIC' },
  flame: { c: ['#ffb000', '#8a1000', '#fff0a0'], en: 'FLAME' },
  hero: { c: ['#ffe03d', '#c81020', '#ffffff'], en: 'HERO' },
}

export const DISP = n => `italic 900 ${n}px "Sofia Sans Extra Condensed"`
export function grad(x, x0, x1, cols) { const g = x.createLinearGradient(x0, 0, x1, 0); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); return g }
export function fitFont(x, text, size, max) { let s = size; x.font = DISP(s); while (x.measureText(text).width > max && s > 40) { s -= 6; x.font = DISP(s) } return s }

export function emblem(x, type, r, dark = '#16060a') {
  x.fillStyle = dark
  if (type === 'ki') { x.beginPath(); x.moveTo(0, -.6 * r); x.bezierCurveTo(.12 * r, -.24 * r, .48 * r, -.16 * r, .44 * r, .2 * r); x.bezierCurveTo(.4 * r, .6 * r, -.4 * r, .6 * r, -.44 * r, .2 * r); x.bezierCurveTo(-.46 * r, -.04 * r, -.28 * r, -.16 * r, -.2 * r, -.24 * r); x.bezierCurveTo(-.18 * r, -.04 * r, -.08 * r, .08 * r, .04 * r, .08 * r); x.bezierCurveTo(-.04 * r, -.2 * r, -.16 * r, -.4 * r, 0, -.6 * r); x.fill() }
  else if (type === 'mana') { for (const [a, b] of [[0, -.28], [.28, 0], [0, .28], [-.28, 0]]) { x.beginPath(); x.arc(a * r, b * r, .26 * r, 0, 7); x.fill() } x.fillRect(-.04 * r, .2 * r, .08 * r, .4 * r) }
  else if (type === 'curse') { x.beginPath(); x.moveTo(-.6 * r, 0); x.quadraticCurveTo(0, -.55 * r, .6 * r, 0); x.quadraticCurveTo(0, .55 * r, -.6 * r, 0); x.fill(); x.fillStyle = '#ff5ad1'; x.beginPath(); x.ellipse(0, 0, .08 * r, .26 * r, 0, 0, 7); x.fill() }
  else if (type === 'haki') { x.beginPath(); x.ellipse(0, .14 * r, .62 * r, .18 * r, 0, 0, 7); x.fill(); x.beginPath(); x.arc(0, .08 * r, .34 * r, Math.PI, 0); x.fill(); x.fillStyle = '#ff3b30'; x.fillRect(-.34 * r, -.02 * r, .68 * r, .1 * r) }
  else { x.strokeStyle = dark; x.lineWidth = .12 * r; x.lineCap = 'round'; x.beginPath(); for (let a = 0; a < 12; a += .1) { const rr = .04 * r * a; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) } x.stroke() }
}

export const loadImg = src => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src })
export const CUTOUT = { has: () => true }
export const MAXSIDE = 1100
function cutout(img) {
  const sc = Math.min(1, MAXSIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * sc), h = Math.round(img.naturalHeight * sc), c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h), p = d.data
  const white = i => p[i] > 228 && p[i + 1] > 228 && p[i + 2] > 228
  const seen = new Uint8Array(w * h), q = []
  for (let i = 0; i < w; i++) { q.push(i, (h - 1) * w + i) } for (let j = 0; j < h; j++) { q.push(j * w, j * w + w - 1) }
  while (q.length) { const k = q.pop(); if (seen[k]) continue; seen[k] = 1; if (!white(k * 4)) continue; p[k * 4 + 3] = 0; const X = k % w, Y = (k / w) | 0; if (X > 0) q.push(k - 1); if (X < w - 1) q.push(k + 1); if (Y > 0) q.push(k - w); if (Y < h - 1) q.push(k + w) }
  for (let k = 0; k < w * h; k++) { if (p[k * 4 + 3] === 0) continue; const X = k % w, Y = (k / w) | 0; let n = 0; for (const o of [-1, 1, -w, w]) { const kk = k + o; if (kk >= 0 && kk < w * h && p[kk * 4 + 3] === 0) n++ } if (n) { const lum = (p[k * 4] + p[k * 4 + 1] + p[k * 4 + 2]) / 3; if (lum > 190) p[k * 4 + 3] = Math.max(0, 255 - (lum - 190) * 4) } }
  x.putImageData(d, 0, 0); return c
}
let DBP = null
const idb = () => DBP || (DBP = new Promise(res => { try { const r = indexedDB.open('aut-art', 1); r.onupgradeneeded = () => r.result.createObjectStore('art'); r.onsuccess = () => res(r.result); r.onerror = () => res(null) } catch { res(null) } }))
async function idbGet(k) { const db = await idb(); if (!db) return null; return new Promise(r => { try { const q = db.transaction('art').objectStore('art').get(k); q.onsuccess = () => r(q.result || null); q.onerror = () => r(null) } catch { r(null) } }) }
async function idbPut(k, v) { const db = await idb(); if (!db) return; try { db.transaction('art', 'readwrite').objectStore('art').put(v, k) } catch { } }
export const ART = {}, ARTP = {}
export function getArt(c) {
  return ARTP[c.id] || (ARTP[c.id] = (async () => {
    const ck = `v2|${c.key}|${c.mt}`
    let blob = await idbGet(ck)
    if (!blob) { const can = cutout(await loadImg(c.url)); blob = await new Promise(r => can.toBlob(r, 'image/webp', .92)); idbPut(ck, blob) }
    return ART[c.id] = await loadImg(URL.createObjectURL(blob))
  })())
}

export function drawCard(x, d) {
  const W = 680, H = 952, [c1, c2, c3] = TYPE[d.t].c, img = ART[d.id], tr = TIER[d.r], low = tr.rank <= 1, real = CUTOUT.has(d.id)
  const rr = (X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r) }
  const stops = (g, cols) => { cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); return g }
  let fg
  if (d.r === 'X') fg = stops(x.createLinearGradient(0, 0, W, H), [...RB, RB[0]])
  else if (d.r === 'M') fg = stops(x.createConicGradient(.6, W / 2, H / 2), ['#ff2d6f', '#ff9d00', '#ffe600', '#3dffb0', '#2db4ff', '#7a3dff', '#ff2dd0', '#ff2d6f'])
  else if (d.r === 'L') fg = stops(x.createLinearGradient(0, 0, W, H), ['#fff6c9', '#f2b632', '#8a5a00', '#ffe9a0', '#fff', '#f2b632', '#7a4c00', '#ffe9a0'])
  else if (d.r === 'C') fg = stops(x.createLinearGradient(0, 0, W, H), ['#f3d1a8', '#b07a48', '#5a3418', '#e0b080', '#7a4a24'])
  else if (d.r === 'U') fg = stops(x.createLinearGradient(0, 0, W, H), ['#e6fff6', '#7fe0c0', '#2a7a64', '#c9fff0', '#3a8a74'])
  else fg = stops(x.createLinearGradient(0, 0, W, H), [c3, c1, c2, '#fff', c2, c1, c3])
  rr(0, 0, W, H, 34); x.fillStyle = fg; x.fill()
  x.save(); rr(14, 14, W - 28, H - 28, 22); x.clip()
  if (d.r === 'X') x.fillStyle = stops(x.createLinearGradient(0, 0, W, H), ['#ff7ab8', '#ffd95a', '#7dffb6', '#6ac8ff', '#b78cff', '#ff7ab8'])
  else { const bg = x.createRadialGradient(390, 320, 0, 390, 320, 720); bg.addColorStop(0, low ? '#e8e2d8' : '#fff'); bg.addColorStop(.09, c3); bg.addColorStop(.32, c1); bg.addColorStop(.64, c2); bg.addColorStop(1, '#07010f'); x.fillStyle = bg }
  x.fillRect(0, 0, W, H)
  const ar = img.width / img.height; let dw = W, dh = W / ar; if (dh < H) { dh = H; dw = H * ar }; const zf = d.z || 1; dw *= zf; dh *= zf
  const fxp = d.fx ?? .5, fyp = d.fy ?? .22, ox = Math.min(0, Math.max(W - dw, W / 2 - fxp * dw)), oy = Math.min(0, Math.max(H - dh, H * .3 - fyp * dh))
  x.filter = real ? 'none' : d.r === 'X' ? 'grayscale(1) contrast(1.45) brightness(1.15)' : low ? 'saturate(1.2) contrast(1.1)' : 'saturate(1.7) contrast(1.22)'
  if (d.fit) { // whole-art mode: blurred cover behind, full image contained in the art window
    const f0 = x.filter; x.filter = (f0 === 'none' ? '' : f0 + ' ') + 'blur(18px) brightness(.55)'; x.drawImage(img, ox, oy, dw, dh); x.filter = f0
    const AH = H * d.fit, s = Math.min(W / img.width, AH / img.height), cw = img.width * s, ch = img.height * s
    x.drawImage(img, (W - cw) / 2, 18, cw, ch)
  } else x.drawImage(img, ox, oy, dw, dh)
  x.filter = 'none'
  if (real) { } else if (d.r === 'X') {
    x.fillStyle = stops(x.createLinearGradient(0, 0, W, H), ['#ff3d9a', '#ffcf2d', '#2dff9a', '#2db4ff', '#9a4dff', '#ff3d9a'])
    x.globalCompositeOperation = 'color'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'soft-light'; x.fillRect(0, 0, W, H)
  } else {
    x.globalCompositeOperation = 'hard-light'; x.globalAlpha = low ? .3 : .55
    let g = x.createRadialGradient(0, H, 0, 0, H, 620); g.addColorStop(0, c3); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H)
    g = x.createRadialGradient(W, 0, 0, W, 0, 560); g.addColorStop(0, c1); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H)
    x.globalAlpha = 1
  }
  x.globalCompositeOperation = 'source-over'
  if (!low && !real) {
    x.globalCompositeOperation = 'overlay'; x.fillStyle = 'rgba(255,255,255,.55)'
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; x.beginPath(); x.moveTo(370, 330); x.lineTo(370 + Math.cos(a) * 900, 330 + Math.sin(a) * 900); x.lineTo(370 + Math.cos(a + .03) * 900, 330 + Math.sin(a + .03) * 900); x.fill() }
    x.globalCompositeOperation = 'source-over'
  }
  if (!real) x.fillStyle = 'rgba(0,0,0,.45)'; else x.fillStyle = 'rgba(0,0,0,0)'; for (let yy = 0; yy < 300; yy += 16) for (let xx = W - 300 + yy; xx < W; xx += 16) { x.beginPath(); x.arc(xx, yy, 3.4, 0, 7); x.fill() }
  if (tr.rank >= 2) {
    const bolt = (pts, w) => { x.save(); x.strokeStyle = '#fff'; x.lineJoin = 'bevel'; x.shadowColor = c3; x.shadowBlur = 26; x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); x.restore() }
    bolt([[120, -10], [168, 90], [104, 170], [190, 260], [140, 350], [222, 430]], 5)
    if (tr.rank >= 3) bolt([[560, 120], [516, 210], [596, 280], [530, 370], [600, 450]], 4)
    const star = (X, Y, s) => { x.save(); x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 14; x.beginPath(); x.moveTo(X, Y - s); x.lineTo(X + s * .16, Y - s * .16); x.lineTo(X + s, Y); x.lineTo(X + s * .16, Y + s * .16); x.lineTo(X, Y + s); x.lineTo(X - s * .16, Y + s * .16); x.lineTo(X - s, Y); x.lineTo(X - s * .16, Y - s * .16); x.fill(); x.restore() }
    star(470, 70, 20); star(80, 300, 13); if (tr.rank >= 3) { star(610, 560, 16); star(310, 150, 9); star(560, 420, 8) }
  }
  const wg = x.createLinearGradient(0, 0, 300, 300); wg.addColorStop(0, 'rgba(0,0,0,.9)'); wg.addColorStop(.4, 'rgba(0,0,0,.5)'); wg.addColorStop(.62, 'rgba(0,0,0,0)'); x.fillStyle = wg; x.fillRect(0, 0, 320, 320)
  const pal = d.r === 'X' ? ['#fff', '#ffe9a8', '#c9f3ff'] : low ? ['#fff', tr.pal[0], tr.pal[1]] : ['#fff', c3, c1]
  const g2 = x.createLinearGradient(0, 30, 0, 160); g2.addColorStop(.15, pal[0]); g2.addColorStop(.6, pal[1]); g2.addColorStop(1, pal[2])
  x.font = DISP(158); x.textBaseline = 'alphabetic'; x.shadowColor = 'rgba(0,0,0,.75)'; x.shadowOffsetY = 6; x.fillStyle = g2; x.fillText(d.ovr, 26, 160)
  x.shadowOffsetY = 3; x.font = DISP(32); x.fillStyle = '#fff'; x.fillText(d.role, 76, 202);
  if (d.lvl) { x.save(); x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowOffsetY = 2; x.font = DISP(30); x.fillStyle = '#ffd23a'; x.fillText('★'.repeat(d.lvl), 30, d.tag ? 282 : 240); x.restore() }
  if (d.tag) { x.save(); x.shadowColor = 'transparent'; const tg = x.createLinearGradient(30, 0, 150, 0); if (d.r === 'X') RB.forEach((c, i) => tg.addColorStop(i / 4, c)); else { tg.addColorStop(0, '#fff'); tg.addColorStop(1, c3) } x.fillStyle = tg; x.beginPath(); x.moveTo(38, 216); x.lineTo(158, 216); x.lineTo(150, 246); x.lineTo(30, 246); x.fill(); x.font = DISP(24); x.fillStyle = '#0a0612'; x.fillText('TAG UNIT', 46, 240); x.restore() } x.fillStyle = d.r === 'X' ? '#fff' : c3; x.fillRect(30, 188, 36, 6)
  x.shadowColor = 'transparent'; x.shadowOffsetY = 0
  x.save(); x.translate(W - 64, 66); const eg = x.createLinearGradient(0, -40, 0, 40); if (d.r === 'X') RB.forEach((c, i) => eg.addColorStop(i / 4, c)); else { eg.addColorStop(0, c3); eg.addColorStop(.6, c1); eg.addColorStop(1, c2) }
  x.fillStyle = eg; x.shadowColor = d.r === 'X' ? '#fff' : c3; x.shadowBlur = 20; x.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; x.lineTo(Math.cos(a) * 40, Math.sin(a) * 40) } x.fill(); x.shadowBlur = 0; emblem(x, d.t, 40, '#0a0612'); x.restore()
  x.save(); x.translate(28, 596); x.rotate(-.07)
  const ng = x.createLinearGradient(0, -110, 0, 10); if (d.r === 'X') { ng.addColorStop(0, '#fff'); ng.addColorStop(.5, '#ffe9a8'); ng.addColorStop(1, '#c9f3ff') } else { ng.addColorStop(.3, '#fff'); ng.addColorStop(.8, low ? tr.pal[0] : c3); ng.addColorStop(1, low ? tr.pal[1] : c1) }
  fitFont(x, d.name, 144, 600); x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowOffsetY = 9; x.fillStyle = ng; x.fillText(d.name, 0, 0)
  x.shadowColor = 'transparent'; fitFont(x, d.ver, 30, 290); const tw = x.measureText(d.ver).width + 50
  const pg = x.createLinearGradient(0, 0, tw, 0); if (d.r === 'X') RB.forEach((c, i) => pg.addColorStop(i / 4, c)); else { pg.addColorStop(0, '#fff'); pg.addColorStop(1, low ? tr.pal[1] : c3) }
  x.fillStyle = pg; x.beginPath(); x.moveTo(14, 22); x.lineTo(tw + 14, 22); x.lineTo(tw, 64); x.lineTo(0, 64); x.fill()
  x.fillStyle = '#0a0612'; x.fillText(d.ver, 30, 55); x.restore()
  const PY = H - 334
  const lg = x.createLinearGradient(0, 0, W, 0); if (d.r === 'X') RB.forEach((c, i) => lg.addColorStop(i / 4, c)); else if (low) { lg.addColorStop(0, tr.pal[0]); lg.addColorStop(.5, tr.pal[1]); lg.addColorStop(1, tr.pal[0]) } else { lg.addColorStop(0, c3); lg.addColorStop(.3, '#fff'); lg.addColorStop(.7, c1); lg.addColorStop(1, c3) }
  x.fillStyle = lg; x.beginPath(); x.moveTo(0, PY + 36); x.lineTo(W * .46, PY + 36); x.lineTo(W * .52, PY); x.lineTo(W, PY); x.lineTo(W, H); x.lineTo(0, H); x.fill()
  const gl = x.createLinearGradient(0, PY, 0, H); gl.addColorStop(0, d.r === 'X' ? 'rgba(30,12,60,.72)' : 'rgba(10,6,20,.82)'); gl.addColorStop(1, 'rgba(6,3,12,.97)')
  x.fillStyle = gl; x.beginPath(); x.moveTo(0, PY + 40); x.lineTo(W * .464, PY + 40); x.lineTo(W * .524, PY + 4); x.lineTo(W, PY + 4); x.lineTo(W, H); x.lineTo(0, H); x.fill()
  const acc = d.r === 'X' ? '#ffe08a' : c3
  x.font = DISP(24); const ew = x.measureText(TYPE[d.t].en).width + 26
  x.fillStyle = acc; x.beginPath(); x.moveTo(36, PY + 62); x.lineTo(36 + ew, PY + 62); x.lineTo(28 + ew, PY + 94); x.lineTo(28, PY + 94); x.fill()
  x.fillStyle = '#0a0612'; x.fillText(TYPE[d.t].en, 44, PY + 87)
  fitFont(x, d.mv, 46, W - 90 - ew); x.fillStyle = acc; x.fillText(d.mv, 48 + ew, PY + 94)
  x.font = '500 23px "Sofia Sans"'; x.fillStyle = '#efeafc'; d.tx.forEach((l, i) => x.fillText(l, 30, PY + 138 + i * 30))
  const sw = (W - 60 - 5 * 8) / 6
  d.st.forEach((v, i) => {
    const X = 30 + i * (sw + 8), Y = PY + 210
    x.save(); x.transform(1, 0, -.18, 1, 0, 0); const bx = x.createLinearGradient(0, Y, 0, Y + 66); bx.addColorStop(0, 'rgba(255,255,255,.18)'); bx.addColorStop(1, 'rgba(255,255,255,.04)')
    x.fillStyle = bx; x.fillRect(X + Y * .18, Y, sw, 66); x.fillStyle = d.r === 'X' ? '#fff' : low ? tr.pal[1] : c1; x.fillRect(X + Y * .18, Y + 62, sw, 4); x.restore()
    x.textAlign = 'center'; x.font = '500 14px "JetBrains Mono"'; x.fillStyle = '#d5cdea'; x.fillText(['PWR', 'SPD', 'ENG', 'TEC', 'DEF', 'IQ'][i], X + sw / 2 - 4, Y + 20)
    x.font = DISP(42); x.fillStyle = '#fff'; x.fillText(v, X + sw / 2 - 6, Y + 58); x.textAlign = 'left'
  })
  const n = tr.rank + 1
  for (let i = 0; i < n; i++) { x.save(); x.translate(40 + i * 20, H - 40); x.rotate(Math.PI / 4); x.fillStyle = d.r === 'X' ? '#fff' : tr.pal[1]; x.fillRect(-6, -6, 12, 12); x.restore() }
  x.font = DISP(25); x.fillStyle = '#fff'; x.fillText(tr.name, 50 + n * 20, H - 31)
  x.font = '500 15px "JetBrains Mono"'; x.fillStyle = '#cfc8e6'; x.textAlign = 'right'; x.fillText(`${ANIME[d.anime].tag} · S01-${String(d.uid + 1).padStart(3, '0')}/${String(d.total || 0).padStart(3, '0')}`, W - 30, H - 33); x.textAlign = 'left'
  x.restore()
}

// ---- small card images for menus, cached per card + awakening level ----
const THUMBS = {}
const bucket = w => w <= 260 ? 260 : w <= 440 ? 440 : 560
const sig = c => [c.key, c.lvl || 0, c.ovr, c.name, c.ver, c.r, c.fx, c.fy, c.fit, c.mv, c.total].join('|')
// one render at a time, yielding to the browser between cards so scrolling stays smooth
let QUEUE = Promise.resolve()
const idle = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16)))
export function thumbURL(c, w = 340) {
  const bw = bucket(w), k = 't5|' + sig(c) + '|' + bw
  return THUMBS[k] || (THUMBS[k] = (async () => {
    const hit = await idbGet(k)
    if (hit) return URL.createObjectURL(hit)
    const job = QUEUE.then(async () => {
      await getArt(c); await idle()
      const can = document.createElement('canvas'); can.width = bw; can.height = Math.round(bw * 952 / 680)
      const x = can.getContext('2d'); x.scale(bw / 680, bw / 680); drawCard(x, c)
      const blob = await new Promise(r => can.toBlob(r, 'image/webp', .86))
      idbPut(k, blob); return URL.createObjectURL(blob)
    })
    QUEUE = job.catch(() => { })
    return job
  })())
}
export const RARITY_MARK = { C: '◆', U: '◆◆', R: '◆◆◆', E: '◆◆◆◆', L: '★', M: '★★', X: '♛' }
export const fontsReady = Promise.all([
  document.fonts.load('italic 900 100px "Sofia Sans Extra Condensed"'),
  document.fonts.load('800 30px "Sofia Sans"'),
  document.fonts.load('500 14px "JetBrains Mono"'),
]).catch(() => { })
