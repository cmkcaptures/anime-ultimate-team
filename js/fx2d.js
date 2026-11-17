// AUT battle FX — one full-screen canvas, additive particles. Only animates while something is alive.
export function createFX(host) {
  const cv = document.createElement('canvas'); cv.className = 'fx2d'; host.append(cv)
  const x = cv.getContext('2d')
  let W = 0, H = 0, DPR = Math.min(1.5, devicePixelRatio || 1)
  const size = () => { W = host.clientWidth; H = host.clientHeight; cv.width = W * DPR; cv.height = H * DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0) }
  size(); const ro = new ResizeObserver(size); ro.observe(host)
  const P = [] // particles: {k, x, y, vx, vy, life, max, size, col, ...}
  let raf = 0, last = 0
  const R = (a, b) => a + Math.random() * (b - a)
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})` }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step) } }
  function step(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now
    x.clearRect(0, 0, W, H)
    x.globalCompositeOperation = 'lighter'
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life += dt; const t = p.life / p.max
      if (t >= 1) { P.splice(i, 1); continue }
      if (p.delay && p.life < p.delay) continue
      draw[p.k](p, t, dt)
    }
    x.globalCompositeOperation = 'source-over'
    raf = P.length ? requestAnimationFrame(step) : 0
    if (!raf) x.clearRect(0, 0, W, H)
  }
  const draw = {
    // bright core flash
    flash(p, t) { const r = p.size * (.4 + t * 1.2), a = (1 - t) ** 2; const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.25, rgba(p.col, a * .9)); g.addColorStop(1, rgba(p.col, 0)); x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fill() },
    // starburst spikes
    star(p, t) { const a = (1 - t) ** 1.5, n = p.n, len = p.size * (.6 + t * .9); x.save(); x.translate(p.x, p.y); x.rotate(p.rot + t * .4); x.fillStyle = rgba(p.col, a); for (let i = 0; i < n; i++) { const ang = i / n * Math.PI * 2, l = len * (i % 2 ? .55 : 1); x.beginPath(); x.moveTo(Math.cos(ang - .06) * 6, Math.sin(ang - .06) * 6); x.lineTo(Math.cos(ang) * l, Math.sin(ang) * l); x.lineTo(Math.cos(ang + .06) * 6, Math.sin(ang + .06) * 6); x.fill() } x.restore() },
    // spark streak with gravity
    spark(p, t, dt) { p.vy += 900 * dt; p.vx *= .985; const ox = p.x, oy = p.y; p.x += p.vx * dt; p.y += p.vy * dt; const a = 1 - t; x.strokeStyle = rgba(t < .25 ? '#ffffff' : p.col, a); x.lineWidth = p.size * (1 - t * .6); x.lineCap = 'round'; x.beginPath(); x.moveTo(ox - p.vx * .025, oy - p.vy * .025); x.lineTo(p.x, p.y); x.stroke() },
    // expanding ring
    ring(p, t) { const r = p.size * (.15 + Math.sqrt(t)), a = (1 - t) ** 1.4; x.strokeStyle = rgba(p.col, a); x.lineWidth = p.w * (1 - t) + 1; x.beginPath(); x.ellipse(p.x, p.y, r, r * (p.flat || 1), 0, 0, 7); x.stroke() },
    // soft smoke puff (normal blend)
    smoke(p, t, dt) { p.x += p.vx * dt; p.y += p.vy * dt; const r = p.size * (.5 + t), a = .35 * (1 - t); x.globalCompositeOperation = 'source-over'; const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(40,36,48,${a})`); g.addColorStop(1, 'rgba(40,36,48,0)'); x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fill(); x.globalCompositeOperation = 'lighter' },
    // crescent slash arc
    slash(p, t) { const sweep = Math.min(1, t * 3), a = t < .35 ? 1 : (1 - t) / .65; x.save(); x.translate(p.x, p.y); x.rotate(p.rot); const r = p.size, s0 = -1.1, s1 = s0 + 2.2 * sweep
      x.strokeStyle = rgba(p.col, a * .55); x.lineWidth = 16; x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, r, s0, s1); x.stroke()
      x.strokeStyle = `rgba(255,255,255,${a})`; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, r, s0, s1); x.stroke(); x.restore() },
    // energy beam with wobble
    beam(p, t) { const grow = Math.min(1, t * 4), a = t < .6 ? 1 : (1 - t) / .4, dx = p.x2 - p.x, dy = p.y2 - p.y, len = Math.hypot(dx, dy) * grow, ang = Math.atan2(dy, dx)
      x.save(); x.translate(p.x, p.y); x.rotate(ang)
      for (const [w, c] of [[p.w * 2.2, rgba(p.col, .18 * a)], [p.w, rgba(p.col, .65 * a)], [p.w * .38, `rgba(255,255,255,${a})`]]) { x.fillStyle = c; x.beginPath(); x.moveTo(0, -w / 2); for (let s = 0; s <= 1.001; s += .1) x.lineTo(len * s, -w / 2 + Math.sin(s * 22 + t * 60) * w * .08); for (let s = 1; s >= -.001; s -= .1) x.lineTo(len * s, w / 2 + Math.sin(s * 22 + t * 60 + 2) * w * .08); x.fill() }
      x.restore() },
    // radial speed lines from a point (used by cut-ins / ultimates)
    lines(p, t) { const a = t < .2 ? t / .2 : (1 - t) / .8; x.save(); x.translate(p.x, p.y); for (let i = 0; i < p.n; i++) { const ang = p.seed[i], r0 = p.size * .35 + (t * 300 + i * 37) % (p.size * .4), r1 = r0 + 60 + (i % 5) * 30; x.strokeStyle = rgba(i % 3 ? '#ffffff' : p.col, a * .55); x.lineWidth = 1 + (i % 3); x.beginPath(); x.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0); x.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1); x.stroke() } x.restore() },
    // full-screen color flash
    screen(p, t) { x.fillStyle = rgba(p.col, (1 - t) ** 2 * p.a); x.fillRect(0, 0, W, H) },
  }
  const add = o => { P.push({ life: 0, ...o }); kick() }
  function sparks(cx, cy, col, n, speed, size = 3) { for (let i = 0; i < n; i++) { const a = R(0, Math.PI * 2), v = R(speed * .35, speed); add({ k: 'spark', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * .3, max: R(.35, .8), size: R(size * .6, size * 1.4), col }) } }
  function smoke(cx, cy, n, s) { for (let i = 0; i < n; i++) add({ k: 'smoke', x: cx + R(-20, 20), y: cy + R(-10, 10), vx: R(-60, 60), vy: R(-80, -10), max: R(.6, 1.1), size: R(s * .6, s), col: '#000000' }) }
  return {
    // light / heavy hit at a point
    hit(cx, cy, col, power = 1) {
      add({ k: 'flash', x: cx, y: cy, max: .28 + power * .1, size: 90 * power, col })
      add({ k: 'star', x: cx, y: cy, max: .3 + power * .08, size: 110 * power, col, n: 10 + Math.round(power * 4), rot: R(0, 3) })
      add({ k: 'ring', x: cx, y: cy, max: .45, size: 140 * power, w: 6 * power, col })
      if (power > 1.2) add({ k: 'ring', x: cx, y: cy + 40, max: .6, size: 260 * power, w: 4, col: '#ffffff', flat: .3 })
      sparks(cx, cy, col, Math.round(18 + 22 * power), 520 + 260 * power, 2.5 + power)
      smoke(cx, cy, Math.round(3 + power * 3), 40 + 30 * power)
    },
    slash(cx, cy, col) { for (let i = 0; i < 3; i++) add({ k: 'slash', x: cx + R(-20, 20), y: cy + (i - 1) * 24, max: .42, delay: i * .06, size: R(70, 95), col, rot: -.5 + i * .5 }) },
    beam(x1, y1, x2, y2, col, w = 26) { add({ k: 'beam', x: x1, y: y1, x2, y2, max: .55, w, col }); add({ k: 'flash', x: x1, y: y1, max: .3, size: w * 3, col }) },
    lines(cx, cy, col, dur = .9) { const n = 60; add({ k: 'lines', x: cx, y: cy, max: dur, size: Math.max(W, H) * .7, n, seed: Array.from({ length: n }, () => R(0, Math.PI * 2)), col }) },
    screen(col, a = .45, dur = .35) { add({ k: 'screen', max: dur, col, a }) },
    ko(cx, cy) { this.hit(cx, cy, '#ff3d4a', 2); this.screen('#ff3d4a', .35, .5); smoke(cx, cy, 10, 90) },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); cv.remove() },
  }
}
