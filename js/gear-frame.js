// Drawn gear frames (canvas), one image per tier, cached. Original design: chamfered octagon,
// layered metal bevel, corner wings, crest gems, tier plate with stars.
const CACHE = {}
const METAL = {
  B: { stops: ['#3a1c08', '#a85f2c', '#ffcf9a', '#c27a3e', '#5a2e10', '#e8a066', '#3a1c08'], edge: '#1c0c02', gem: ['#fff1dc', '#e08a3c', '#7a3810'], stars: 1 },
  S: { stops: ['#2a3446', '#8e9fbb', '#ffffff', '#b3c2dc', '#4c5a74', '#e8f0ff', '#2a3446'], edge: '#0b1220', gem: ['#ffffff', '#7fc4ff', '#1f4f9a'], stars: 2 },
  G: { stops: ['#4a2a02', '#c8871a', '#fff6d8', '#ffd36a', '#8a5408', '#ffe9a8', '#4a2a02'], edge: '#1e1000', gem: ['#ffffff', '#ff6ad0', '#7a1060'], stars: 3 },
}
const S = 256, C = 40 // size, chamfer
function oct(x, i, c) { x.beginPath(); x.moveTo(i + c, i); x.lineTo(S - i - c, i); x.lineTo(S - i, i + c); x.lineTo(S - i, S - i - c); x.lineTo(S - i - c, S - i); x.lineTo(i + c, S - i); x.lineTo(i, S - i - c); x.lineTo(i, i + c); x.closePath() }
export function gearFrameURL(t) {
  if (CACHE[t]) return CACHE[t]
  const M = METAL[t], cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d')
  const metal = (a, b) => { const g = x.createLinearGradient(a, a, b, b); M.stops.forEach((c, i) => g.addColorStop(i / (M.stops.length - 1), c)); return g }
  // outer metal body
  oct(x, 4, C); x.fillStyle = metal(0, S); x.fill()
  x.lineWidth = 3; x.strokeStyle = M.edge; x.stroke()
  // bright outer bevel line + dark inner groove
  oct(x, 9, C - 4); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.55)'; x.stroke()
  oct(x, 20, C - 12); x.lineWidth = 4; x.strokeStyle = M.edge; x.stroke()
  oct(x, 23, C - 14); x.lineWidth = 2; x.strokeStyle = metal(S, 0); x.stroke()
  // cut the window (transparent) so the item art shows through
  x.save(); oct(x, 26, C - 16); x.globalCompositeOperation = 'destination-out'; x.fill(); x.restore()
  // inner shadow around the window
  x.save(); oct(x, 26, C - 16); x.clip(); x.lineWidth = 14; x.strokeStyle = 'rgba(0,0,0,.55)'; x.filter = 'blur(6px)'; oct(x, 26, C - 16); x.stroke(); x.restore()
  // corner wings on the chamfers
  const wing = (cx, cy, rot) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.beginPath(); x.moveTo(-22, 0); x.lineTo(0, -9); x.lineTo(22, 0); x.lineTo(0, 5); x.closePath(); x.fillStyle = metal(-22, 22); x.fill(); x.lineWidth = 2; x.strokeStyle = M.edge; x.stroke(); x.beginPath(); x.moveTo(-14, 0); x.lineTo(14, 0); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1.5; x.stroke(); x.restore() }
  const d = C * .5 + 2
  wing(d + 2, d + 2, -Math.PI / 4); wing(S - d - 2, d + 2, Math.PI / 4); wing(d + 2, S - d - 2, Math.PI / 4); wing(S - d - 2, S - d - 2, -Math.PI / 4)
  // crest gems on top
  const gem = (gx, gy, r) => { x.save(); x.beginPath(); x.moveTo(gx, gy - r); x.lineTo(gx + r, gy); x.lineTo(gx, gy + r); x.lineTo(gx - r, gy); x.closePath(); const g = x.createRadialGradient(gx - r * .3, gy - r * .3, 1, gx, gy, r); g.addColorStop(0, M.gem[0]); g.addColorStop(.45, M.gem[1]); g.addColorStop(1, M.gem[2]); x.fillStyle = g; x.shadowColor = M.gem[1]; x.shadowBlur = 12; x.fill(); x.shadowBlur = 0; x.lineWidth = 3; x.strokeStyle = M.edge; x.stroke(); x.beginPath(); x.moveTo(gx - r * .45, gy - r * .1); x.lineTo(gx, gy - r * .6); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.stroke(); x.restore() }
  const gems = M.stars, sp = 30
  // gem mount plate
  x.beginPath(); x.moveTo(S / 2 - 22 - (gems - 1) * sp / 2, 4); x.lineTo(S / 2 + 22 + (gems - 1) * sp / 2, 4); x.lineTo(S / 2 + 12 + (gems - 1) * sp / 2, 24); x.lineTo(S / 2 - 12 - (gems - 1) * sp / 2, 24); x.closePath(); x.fillStyle = metal(0, S); x.fill(); x.lineWidth = 2; x.strokeStyle = M.edge; x.stroke()
  for (let k = 0; k < gems; k++) gem(S / 2 + (k - (gems - 1) / 2) * sp, 13, 12)
  // bottom tier plate with stars
  const pw = 120; x.beginPath(); x.moveTo(S / 2 - pw / 2, S - 30); x.lineTo(S / 2 + pw / 2, S - 30); x.lineTo(S / 2 + pw / 2 - 12, S - 6); x.lineTo(S / 2 - pw / 2 + 12, S - 6); x.closePath()
  const pg = x.createLinearGradient(0, S - 30, 0, S - 6); pg.addColorStop(0, '#1a1024'); pg.addColorStop(1, '#05030a'); x.fillStyle = pg; x.fill(); x.lineWidth = 3; x.strokeStyle = metal(0, S); x.stroke()
  x.font = '900 15px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = M.gem[1]; x.shadowColor = M.gem[1]; x.shadowBlur = 8
  x.fillText('★'.repeat(gems), S / 2, S - 18); x.shadowBlur = 0
  return (CACHE[t] = cv.toDataURL('image/png'))
}
export const GEAR_CLIP = 'polygon(23% 10%, 77% 10%, 90% 23%, 90% 77%, 77% 90%, 23% 90%, 10% 77%, 10% 23%)'
