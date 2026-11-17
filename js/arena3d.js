// AUT 3D battle stage (three.js). Lightweight: low pixel ratio, no post-processing, pauses when hidden.
// API: const st = await createArena(container); st.hit('you'|'ai', big) · st.ult(side) · st.ko(side) · st.dispose()
const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js'

function hexTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d')
  const g = x.createRadialGradient(256, 256, 20, 256, 256, 256); g.addColorStop(0, '#2c3448'); g.addColorStop(1, '#10131c'); x.fillStyle = g; x.fillRect(0, 0, 512, 512)
  x.strokeStyle = 'rgba(120,200,255,.22)'; x.lineWidth = 1.5
  const r = 18, w = r * Math.sqrt(3)
  for (let row = -1; row < 22; row++) for (let col = -1; col < 18; col++) {
    const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * r * 1.5
    x.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; x.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) } x.closePath(); x.stroke()
  }
  // scuffs / cracks
  x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 2
  for (let i = 0; i < 14; i++) { x.beginPath(); let px = Math.random() * 512, py = Math.random() * 512; x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (Math.random() - .5) * 60; py += (Math.random() - .5) * 60; x.lineTo(px, py) } x.stroke() }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t
}
function glowTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c)
}
function skyTexture(THREE) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#0a0c18'); g.addColorStop(.45, '#2a1838'); g.addColorStop(.68, '#a8401c'); g.addColorStop(.78, '#3a1410'); g.addColorStop(1, '#0a0a10')
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512)
  // storm clouds
  for (let i = 0; i < 140; i++) { const px = Math.random() * 1024, py = 120 + Math.random() * 260, r = 30 + Math.random() * 90; const cg = x.createRadialGradient(px, py, 0, px, py, r); const warm = Math.random() < .5; cg.addColorStop(0, warm ? 'rgba(255,120,50,.22)' : 'rgba(80,150,255,.16)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = cg; x.fillRect(px - r, py - r, r * 2, r * 2) }
  // distant ruined skyline
  x.fillStyle = '#06060a'; let px = 0; while (px < 1024) { const w = 20 + Math.random() * 60, h = 30 + Math.random() * 120; x.fillRect(px, 380 - h, w, h + 140); px += w + Math.random() * 10 }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

export async function createArena(el) {
  const THREE = await import(THREE_URL)
  const W = () => el.clientWidth, H = () => el.clientHeight
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(1, devicePixelRatio)); renderer.setSize(W(), H()); renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.7
  el.append(renderer.domElement)
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x1a1018, .016)
  const cam = new THREE.PerspectiveCamera(42, W() / H(), .1, 300)
  const CAM = new THREE.Vector3(0, 13.5, 19); cam.position.copy(CAM); cam.lookAt(0, 0, 0)

  // sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.MeshBasicMaterial({ map: skyTexture(THREE), side: THREE.BackSide, fog: false }))
  scene.add(sky)

  // lighting
  scene.add(new THREE.HemisphereLight(0xaabbee, 0x221010, 1.1))
  const key = new THREE.DirectionalLight(0xfff2e0, 1.1); key.position.set(4, 14, 8); scene.add(key)
  const warm = new THREE.PointLight(0xff7a1a, 30, 22, 2); warm.position.set(0, 3, -5); scene.add(warm)
  const cool = new THREE.PointLight(0x00e5ff, 30, 22, 2); cool.position.set(0, 3, 5); scene.add(cool)

  // ground + platform
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 48), new THREE.MeshStandardMaterial({ color: 0x0b0b10, roughness: 1 }))
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.6; scene.add(ground)
  const hex = hexTexture(THREE); hex.wrapS = hex.wrapT = THREE.RepeatWrapping; hex.repeat.set(2.2, 2.2)
  const platMat = new THREE.MeshStandardMaterial({ map: hex, color: 0xffffff, roughness: .55, metalness: .45 })
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(11, 11.6, 1.2, 64, 1), [new THREE.MeshStandardMaterial({ color: 0x15171f, roughness: .6, metalness: .6 }), platMat, platMat])
  plat.position.y = -.6; scene.add(plat)
  // rim light strip
  const rim = new THREE.Mesh(new THREE.TorusGeometry(11.05, .06, 8, 96), new THREE.MeshBasicMaterial({ color: 0x00e5ff }))
  rim.rotation.x = Math.PI / 2; rim.position.y = .01; scene.add(rim)
  // energy rings (centre) + half rings per side
  const ringMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  const r1 = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.32, 96), ringMat(0x00e5ff, .9)); r1.rotation.x = -Math.PI / 2; r1.position.y = .02; scene.add(r1)
  const r2 = new THREE.Mesh(new THREE.RingGeometry(4.1, 4.16, 96), ringMat(0xff7a1a, .6)); r2.rotation.x = -Math.PI / 2; r2.position.y = .02; scene.add(r2)
  const mid = new THREE.Mesh(new THREE.PlaneGeometry(22, .08), ringMat(0xffffff, .35)); mid.rotation.x = -Math.PI / 2; mid.position.y = .03; scene.add(mid)
  // fighter pads
  const glow = glowTexture(THREE)
  const pad = (z, col) => {
    const g = new THREE.Group()
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.9, 48), ringMat(col, .22)); disc.rotation.x = -Math.PI / 2; disc.position.y = .03; g.add(disc)
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.85, 2, 64), ringMat(col, .95)); ring.rotation.x = -Math.PI / 2; ring.position.y = .04; g.add(ring)
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 6, 32, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
    beam.position.y = 3; g.add(beam)
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); spr.scale.set(7, 7, 1); spr.position.y = .2; g.add(spr)
    g.position.z = z; scene.add(g); return { g, ring, disc, beam, spr }
  }
  const P = { ai: pad(-5, 0xff7a1a), you: pad(5, 0x00e5ff) }
  // pillars around the edge with light strips
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a3e4c, roughness: .5, metalness: .7 })
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2 + .3, r = 14.5, h = 5 + (i % 3) * 2.2
    const p = new THREE.Mesh(new THREE.BoxGeometry(.9, h, .9), pillarMat); p.position.set(Math.cos(a) * r, h / 2 - .6, Math.sin(a) * r); p.rotation.y = -a; scene.add(p)
    const strip = new THREE.Mesh(new THREE.BoxGeometry(.12, h * .8, .12), new THREE.MeshBasicMaterial({ color: Math.sin(a) < 0 ? 0xff7a1a : 0x00e5ff }))
    strip.position.set(Math.cos(a) * (r - .5), h / 2 - .6, Math.sin(a) * (r - .5)); scene.add(strip)
  }
  // big atmospheric glows on the horizon
  for (const [x, y, z, c, s] of [[-30, 10, -60, 0xff6a1a, 60], [34, 14, -55, 0x7a3dff, 50], [0, 6, -70, 0xffa040, 70]]) { const g2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: c, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); g2.position.set(x, y, z); g2.scale.set(s, s * .55, 1); scene.add(g2) }
  const centre = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x6ad8ff, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false })); centre.scale.set(16, 16, 1); centre.position.y = .1; scene.add(centre)
  // floating rocks
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4250, roughness: .95, flatShading: true })
  const rocks = []
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.3 + Math.random() * .9, 0), rockMat); const a = Math.random() * Math.PI * 2, r = 16 + Math.random() * 14; m.position.set(Math.cos(a) * r, 2 + Math.random() * 8, Math.sin(a) * r); m.userData = { s: .2 + Math.random() * .5, y: m.position.y, p: Math.random() * 6 }; scene.add(m); rocks.push(m) }
  // embers
  const N = 260, pos = new Float32Array(N * 3), vel = new Float32Array(N)
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 34; pos[i * 3 + 1] = Math.random() * 12; pos[i * 3 + 2] = (Math.random() - .5) * 34; vel[i] = .2 + Math.random() * .6 }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const embers = new THREE.Points(eg, new THREE.PointsMaterial({ map: glow, color: 0xffa060, size: .28, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }))
  scene.add(embers)
  // impact flash + shockwave pool
  const flash = new THREE.PointLight(0xffffff, 0, 30, 2); flash.position.y = 2.5; scene.add(flash)
  const waves = []
  function shockwave(z, col, size = 1) {
    const m = new THREE.Mesh(new THREE.RingGeometry(.5, .75, 64), ringMat(col, 1)); m.rotation.x = -Math.PI / 2; m.position.set(0, .06, z); scene.add(m)
    waves.push({ m, t: 0, size })
  }

  // ---- loop ----
  let shake = 0, t0 = performance.now(), raf = 0, alive = true, hidden = false
  const onVis = () => { hidden = document.hidden; if (!hidden && alive) loop() }
  document.addEventListener('visibilitychange', onVis)
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); fit() }); ro.observe(el)
  function fit() { const a = W() / H(); cam.fov = a < .8 ? 58 : a < 1.2 ? 50 : 42; cam.updateProjectionMatrix() }
  fit()
  let last = performance.now(), slow = 0
  function loop() {
    if (!alive || hidden) return
    raf = requestAnimationFrame(loop)
    const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now
    if (dt > .04) { slow++; if (slow > 40 && renderer.getPixelRatio() > .6) { renderer.setPixelRatio(.6); slow = 0 } } // weak GPU: drop resolution
    const t = (now - t0) / 1000
    r1.rotation.z = t * .15; r2.rotation.z = -t * .1
    for (const k of ['ai', 'you']) { const p = P[k]; p.ring.material.opacity = .75 + Math.sin(t * 2.4 + (k === 'ai' ? 1 : 0)) * .2 }
    for (const r of rocks) { r.rotation.x += dt * r.userData.s; r.rotation.y += dt * r.userData.s * .7; r.position.y = r.userData.y + Math.sin(t * .5 + r.userData.p) * .4 }
    for (let i = 0; i < N; i++) { pos[i * 3 + 1] += vel[i] * dt; if (pos[i * 3 + 1] > 12) pos[i * 3 + 1] = 0 }
    eg.attributes.position.needsUpdate = true
    for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.t += dt; const s = 1 + w.t * 14 * w.size; w.m.scale.set(s, s, s); w.m.material.opacity = Math.max(0, 1 - w.t * 1.6); if (w.t > .65) { scene.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); waves.splice(i, 1) } }
    flash.intensity *= .86
    // very slow camera sway + shake
    shake *= .88
    cam.position.set(CAM.x + Math.sin(t * .13) * .6 + (Math.random() - .5) * shake, CAM.y + (Math.random() - .5) * shake, CAM.z + Math.cos(t * .11) * .3)
    cam.lookAt(0, .4, 0)
    renderer.render(scene, cam)
  }
  loop()

  const COL = { ai: 0xff7a1a, you: 0x00e5ff }
  return {
    hit(side, big) { const z = side === 'ai' ? -5 : 5; shockwave(z, big ? 0xffd23a : 0xffffff, big ? 1.6 : .9); flash.position.z = z; flash.color.set(big ? 0xffc040 : 0xffffff); flash.intensity = big ? 90 : 40; shake = big ? .9 : .35 },
    ult(side) { const p = P[side]; p.beam.material.opacity = .35; setTimeout(() => p.beam.material.opacity = .07, 900); shockwave(side === 'ai' ? -5 : 5, COL[side], 2.2); flash.color.set(COL[side]); flash.position.z = side === 'ai' ? -5 : 5; flash.intensity = 140; shake = 1.2 },
    ko(side) { shockwave(side === 'ai' ? -5 : 5, 0xff3d4a, 1.4); shake = .6 },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); renderer.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => { m.map && m.map.dispose(); m.dispose() }) }); renderer.domElement.remove() }
  }
}
