// AUT battle FX v2 — restrained, "premium card game" impacts: light flares, crisp rings, soft dust, energy gathering.
// One canvas, additive light, only animates while something is alive.
export function createFX(host) {
  const cv = document.createElement('canvas'); cv.className = 'fx2d'; host.append(cv)
  const x = cv.getContext('2d')
  let W = 0, H = 0, DPR = Math.min(innerWidth < 800 ? 1.25 : 1, devicePixelRatio || 1)
  const size = () => { W = host.clientWidth; H = host.clientHeight; cv.width = W * DPR; cv.height = H * DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0) }
  size(); const ro = new ResizeObserver(size); ro.observe(host)
  const P = []
  let raf = 0, last = 0
  const R = (a, b) => a + Math.random() * (b - a)
  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255] }
  const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${Math.max(0, a)})` }
  const ease = t => 1 - (1 - t) ** 3
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step) } }
  function step(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now
    x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.life += dt; if (p.life < (p.delay || 0)) continue; const t = (p.life - (p.delay || 0)) / p.max; if (t >= 1) { P.splice(i, 1); continue } draw[p.k](p, t, dt) }
    x.globalCompositeOperation = 'source-over'
    raf = P.length ? requestAnimationFrame(step) : 0; if (!raf) x.clearRect(0, 0, W, H)
  }
  const glow = (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba('#ffffff', a)); g.addColorStop(.18, rgba(col, a * .8)); g.addColorStop(1, rgba(col, 0)); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2) }
  const draw = {
    flare(p, t) {
      const a = t < .08 ? t / .08 : (1 - t) ** 2, r = p.size * (.6 + ease(t) * .6)
      glow(p.x, p.y, r, p.col, a * .9)
      const sw = p.size * 4 * (.5 + ease(t)), sh = Math.max(2, p.size * .07 * (1 - t))
      const g = x.createLinearGradient(p.x - sw, 0, p.x + sw, 0); g.addColorStop(0, rgba(p.col, 0)); g.addColorStop(.5, rgba('#ffffff', a)); g.addColorStop(1, rgba(p.col, 0))
      x.fillStyle = g; x.fillRect(p.x - sw, p.y - sh / 2, sw * 2, sh)
    },
    ring(p, t) { const r = p.size * ease(t), a = (1 - t) ** 1.6; x.strokeStyle = rgba(p.col, a); x.lineWidth = Math.max(1, p.w * (1 - t)); x.beginPath(); x.ellipse(p.x, p.y, r, r * (p.flat || 1), 0, 0, 7); x.stroke() },
    dust(p, t, dt) { p.vx *= .93; p.vy = p.vy * .93 - 20 * dt; p.x += p.vx * dt; p.y += p.vy * dt; const a = (1 - t) ** 1.3; glow(p.x, p.y, p.size * (1 + t), p.col, a * .7) },
    gather(p, t) { const e = ease(t); const px = p.sx + (p.x - p.sx) * e, py = p.sy + (p.y - p.sy) * e, a = Math.sin(t * Math.PI); glow(px, py, p.size, p.col, a * .8) },
    // god rays: long soft wedges fanning out from a point
    ray(p, t) { const a = (t < .15 ? t / .15 : (1 - t) ** 1.4) * p.a, len = p.size * (.6 + t * .6); x.save(); x.translate(p.x, p.y); x.rotate(p.ang + t * p.spin); const g = x.createLinearGradient(0, 0, len, 0); g.addColorStop(0, rgba('#ffffff', a)); g.addColorStop(.25, rgba(p.col, a * .7)); g.addColorStop(1, rgba(p.col, 0)); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(len, -p.w); x.lineTo(len, p.w); x.closePath(); x.fill(); x.restore() },
    // tumbling confetti (normal blend so colours stay solid)
    conf(p, t, dt) { p.vy += 420 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; x.globalCompositeOperation = 'source-over'; x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.cos(p.life * 9 + p.ph)); x.globalAlpha = Math.min(1, (1 - t) * 1.6); x.fillStyle = p.col; x.fillRect(-p.size, -p.size * .45, p.size * 2, p.size * .9); x.restore(); x.globalCompositeOperation = 'lighter' },
    // twinkling 4-point star
    twk(p, t) { const a = Math.sin(t * Math.PI), s = p.size * (.4 + a * .6); x.save(); x.translate(p.x, p.y); x.fillStyle = rgba('#ffffff', a); x.beginPath(); x.moveTo(0, -s); x.lineTo(s * .12, -s * .12); x.lineTo(s, 0); x.lineTo(s * .12, s * .12); x.lineTo(0, s); x.lineTo(-s * .12, s * .12); x.lineTo(-s, 0); x.lineTo(-s * .12, -s * .12); x.fill(); glow(0, 0, s * 1.4, p.col, a * .5); x.restore() },
    screen(p, t) { x.fillStyle = rgba(p.col, (1 - t) ** 2 * p.a); x.fillRect(0, 0, W, H) },
  }
  const add = o => { P.push({ life: 0, ...o }); kick() }
  function dust(cx, cy, col, n, spd, sz) { for (let i = 0; i < n; i++) { const a = R(0, Math.PI * 2), v = R(spd * .3, spd); add({ k: 'dust', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7, max: R(.5, 1.1), size: R(sz * .5, sz), col }) } }
  return {
    hit(cx, cy, col, power = 1) {
      add({ k: 'flare', x: cx, y: cy, max: .35 + power * .12, size: 60 + 40 * power, col })
      add({ k: 'ring', x: cx, y: cy, max: .45 + power * .1, size: 90 + 70 * power, w: 3, col: '#ffffff' })
      if (power > 1.1) add({ k: 'ring', x: cx, y: cy, max: .6, delay: .05, size: 140 + 90 * power, w: 2, col })
      if (power > 1.5) add({ k: 'ring', x: cx, y: cy + 40, max: .7, size: 320 * power, w: 2, col, flat: .28 })
      dust(cx, cy, col, Math.round(8 + 10 * power), 260 + 120 * power, 7 + 3 * power)
    },
    gather(cx, cy, col, dur = .55, n = 26) { for (let i = 0; i < n; i++) { const a = R(0, Math.PI * 2), d = R(120, 260); add({ k: 'gather', x: cx, y: cy, sx: cx + Math.cos(a) * d, sy: cy + Math.sin(a) * d, max: dur, delay: R(0, .15), size: R(5, 10), col }) } add({ k: 'flare', x: cx, y: cy, max: dur + .2, delay: dur * .6, size: 70, col }) },
    rays(cx, cy, col, n = 14, size = 900, dur = 1.4) { for (let i = 0; i < n; i++) add({ k: 'ray', x: cx, y: cy, max: dur * R(.8, 1.1), ang: i / n * Math.PI * 2 + R(-.1, .1), spin: R(-.12, .12), size: size * R(.7, 1.1), w: R(14, 40), a: R(.35, .7), col }) },
    confetti(cx, cy, cols, n = 90) { for (let i = 0; i < n; i++) { const a = R(-Math.PI, 0), v = R(380, 900); add({ k: 'conf', x: cx + R(-40, 40), y: cy, vx: Math.cos(a) * v * .9, vy: Math.sin(a) * v, max: R(1.6, 2.6), size: R(4, 8), col: cols[i % cols.length], rot: R(0, 6), vr: R(-10, 10), ph: R(0, 6) }) } },
    twinkle(cx, cy, w, h, col, n = 14, dur = 2.2) { for (let i = 0; i < n; i++) add({ k: 'twk', x: cx + R(-w / 2, w / 2), y: cy + R(-h / 2, h / 2), max: R(.6, 1.2), delay: R(0, dur), size: R(8, 18), col }) },
    screen(col, a = .45, dur = .35) { add({ k: 'screen', max: dur, col, a }) },
    ko(cx, cy) { this.hit(cx, cy, '#ff4a5a', 2); this.screen('#ff3d4a', .25, .5) },
    slash() { }, beam() { }, lines() { },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); cv.remove() },
  }
}
