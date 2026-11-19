// AUT sound design — all synthesized live with Web Audio (no files to download).
// Layered tones + filtered noise through a shared reverb and a master compressor for a polished, "produced" sound.
let A = null, OUT = null, VERB = null, DRY = null
let ON = true; try { ON = localStorage.getItem('aut-sfx') !== 'off' } catch { }

function ctx() {
  if (A) return A
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null
  A = new AC()
  const comp = A.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .2
  OUT = A.createGain(); OUT.gain.value = .55; OUT.connect(comp); comp.connect(A.destination)
  // reverb: generated stereo impulse (a smooth hall tail)
  const len = A.sampleRate * 2.2, ir = A.createBuffer(2, len, A.sampleRate)
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) }
  VERB = A.createConvolver(); VERB.buffer = ir
  const vg = A.createGain(); vg.gain.value = .32; VERB.connect(vg); vg.connect(OUT)
  DRY = A.createGain(); DRY.gain.value = 1; DRY.connect(OUT)
  return A
}
const unlock = () => { const a = ctx(); if (a && a.state === 'suspended') a.resume() }
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, unlock, { capture: true, passive: true })

// --- building blocks ---
function bus(wet = .3) { const g = A.createGain(); g.connect(DRY); if (wet) { const s = A.createGain(); s.gain.value = wet; g.connect(s); s.connect(VERB) } return g }
function env(g, t, a, peak, d, sus = 0, r = .2) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(sus, .0001), t + a + d); if (sus) g.gain.exponentialRampToValueAtTime(.0001, t + a + d + r) }
function tone(type, f, t, dur, vol, dest, opt = {}) {
  const o = A.createOscillator(), g = A.createGain(); o.type = type; o.frequency.setValueAtTime(f, t)
  if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t + (opt.glide || dur))
  if (opt.detune) o.detune.value = opt.detune
  let node = o
  if (opt.lp) { const fl = A.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = opt.lp; fl.Q.value = opt.q || .7; o.connect(fl); node = fl }
  node.connect(g); g.connect(dest); env(g, t, opt.a || .005, vol, dur); o.start(t); o.stop(t + (opt.a || .005) + dur + .05)
}
let NOISE = null
function noise(t, dur, vol, dest, { type = 'bandpass', f = 1200, to, q = 1, a = .005 } = {}) {
  if (!NOISE) { NOISE = A.createBuffer(1, A.sampleRate * 2, A.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1 }
  const s = A.createBufferSource(), fl = A.createBiquadFilter(), g = A.createGain(); s.buffer = NOISE
  fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur); fl.Q.value = q
  s.connect(fl); fl.connect(g); g.connect(dest); env(g, t, a, vol, dur); s.start(t, Math.random()); s.stop(t + a + dur + .05)
}
const N = n => 440 * Math.pow(2, (n - 69) / 12) // midi -> Hz
function bell(n, t, vol, dest, dur = 1.2) { tone('sine', N(n), t, dur, vol, dest); tone('sine', N(n) * 2.01, t, dur * .5, vol * .35, dest); tone('triangle', N(n) * 3.98, t, dur * .2, vol * .12, dest) }
function pad(notes, t, dur, vol, dest, lp = 2200) { for (const n of notes) for (const dt of [-7, 7]) tone('sawtooth', N(n), t, dur, vol, dest, { a: .25, detune: dt, lp, q: .5 }) }
function boom(t, vol, dest) { tone('sine', 110, t, .9, vol, dest, { to: 38, glide: .5 }); noise(t, .35, vol * .5, dest, { type: 'lowpass', f: 600, to: 80 }) }
function riser(t, dur, vol, dest) { noise(t, dur, vol, dest, { type: 'bandpass', f: 400, to: 6000, q: 3, a: dur * .9 }); tone('sawtooth', 110, t, dur, vol * .25, dest, { to: 880, glide: dur, a: dur * .8, lp: 1800 }) }

// --- the library ---
const S = {
  click() { const t = A.currentTime, b = bus(.05); noise(t, .03, .22, b, { type: 'highpass', f: 3500 }); tone('sine', 1250, t, .05, .08, b, { to: 700 }) },
  soft() { const t = A.currentTime, b = bus(.05); tone('sine', 880, t, .06, .05, b, { to: 600 }) },
  nav() { const t = A.currentTime, b = bus(.12); noise(t, .22, .12, b, { type: 'bandpass', f: 600, to: 2600, q: 1.4, a: .06 }); tone('sine', N(76), t + .03, .12, .04, b) },
  open() { const t = A.currentTime, b = bus(.15); noise(t, .25, .1, b, { type: 'bandpass', f: 2200, to: 500, q: 1.2, a: .03 }) },
  coin() { const t = A.currentTime, b = bus(.25); bell(88, t, .12, b, .5); bell(95, t + .07, .12, b, .8) },
  buy() { const t = A.currentTime, b = bus(.3); [72, 76, 79, 84].forEach((n, i) => bell(n, t + i * .06, .1, b, .7)); noise(t, .3, .05, b, { type: 'highpass', f: 6000 }) },
  error() { const t = A.currentTime, b = bus(.08); tone('triangle', 196, t, .12, .14, b, { lp: 900 }); tone('triangle', 147, t + .1, .18, .14, b, { lp: 900 }) },
  toast() { const t = A.currentTime, b = bus(.2); bell(84, t, .07, b, .5) },
  claim() { const t = A.currentTime, b = bus(.35); [79, 83, 86, 91].forEach((n, i) => bell(n, t + i * .05, .09, b, .9)); pad([67, 71, 74], t, .9, .02, b) },
  tear() { const t = A.currentTime, b = bus(.15); noise(t, .45, .4, b, { type: 'highpass', f: 1800, to: 5500, q: .8, a: .01 }); for (let i = 0; i < 6; i++) noise(t + i * .05 + Math.random() * .03, .03, .25, b, { type: 'bandpass', f: 2500 + Math.random() * 3000, q: 4 }); boom(t + .02, .12, b) },
  deal() { const t = A.currentTime, b = bus(.08); noise(t, .14, .16, b, { type: 'bandpass', f: 1400, to: 3500, q: 1.1, a: .02 }) },
  swipe() { const t = A.currentTime, b = bus(.1); noise(t, .2, .15, b, { type: 'bandpass', f: 2800, to: 700, q: 1.2, a: .02 }) },
  charge(rank) { const t = A.currentTime, b = bus(.35), d = rank >= 5 ? 1.6 : rank >= 4 ? 1.1 : .5; riser(t, d, rank >= 4 ? .22 : .14, b); return d },
  // ---- battle: short, punchy, low (no chimes) ----
  bhit() { const t = A.currentTime, b = bus(.06); tone('sine', 150, t, .16, .32, b, { to: 55, glide: .14 }); noise(t, .07, .22, b, { type: 'bandpass', f: 1800, q: .9 }); noise(t + .01, .12, .12, b, { type: 'lowpass', f: 500 }) },
  bblast() { const t = A.currentTime, b = bus(.1); noise(t, .22, .14, b, { type: 'bandpass', f: 500, to: 2600, q: 1.2, a: .12 }); tone('sine', 120, t + .2, .3, .32, b, { to: 40, glide: .25 }); noise(t + .2, .25, .16, b, { type: 'lowpass', f: 900, to: 150 }) },
  bcharge() { const t = A.currentTime, b = bus(.12); noise(t, .45, .1, b, { type: 'bandpass', f: 300, to: 2400, q: 2, a: .4 }); tone('sawtooth', 70, t, .45, .05, b, { to: 220, glide: .45, a: .35, lp: 600 }) },
  bimpact(big) { const t = A.currentTime, b = bus(.16); tone('sine', 95, t, big ? .7 : .45, big ? .5 : .38, b, { to: 32, glide: .5 }); noise(t, big ? .5 : .3, big ? .3 : .2, b, { type: 'lowpass', f: 1400, to: 120 }); noise(t, .05, .2, b, { type: 'highpass', f: 2500 }) },
  bguard() { const t = A.currentTime, b = bus(.08); tone('triangle', 330, t, .18, .08, b, { lp: 1200 }); noise(t, .12, .06, b, { type: 'bandpass', f: 900, q: 3 }) },
  bswitch() { const t = A.currentTime, b = bus(.06); noise(t, .18, .1, b, { type: 'bandpass', f: 900, to: 2000, q: 1, a: .05 }) },
  bko() { const t = A.currentTime, b = bus(.2); tone('sine', 70, t, 1, .45, b, { to: 28, glide: .8 }); noise(t, .6, .22, b, { type: 'lowpass', f: 700, to: 80 }) },
  bturn() { const t = A.currentTime, b = bus(.04); tone('sine', 520, t, .06, .04, b) },
  // ---- extra impact + UI ----
  crit() { const t = A.currentTime, b = bus(.2); noise(t, .05, .3, b, { type: 'highpass', f: 4000 }); tone('square', 1800, t, .08, .05, b, { to: 900, lp: 5000 }); tone('sine', 120, t, .4, .4, b, { to: 40, glide: .3 }) },
  whoosh() { const t = A.currentTime, b = bus(.25); noise(t, .5, .22, b, { type: 'bandpass', f: 300, to: 4000, q: 1.5, a: .35 }) },
  heal() { const t = A.currentTime, b = bus(.4); [72, 76, 79, 84].forEach((n, i) => tone('sine', N(n), t + i * .06, .5, .05, b)) },
  hover() { const t = A.currentTime, b = bus(0); tone('sine', 1500, t, .025, .02, b) },
  orb(level) { const t = A.currentTime, b = bus(.5), d = 1.1; tone('sine', N(36 + level * 3), t, d, .12, b, { a: .3 }); tone('sawtooth', N(48 + level * 3), t, d, .03, b, { a: .5, lp: 900 }); noise(t, d, .06, b, { type: 'bandpass', f: 500 + level * 300, to: 3000, q: 4, a: d * .8 }); return d },
  crack(level) { const t = A.currentTime, b = bus(.45); noise(t, .08, .4, b, { type: 'highpass', f: 2500 }); tone('sine', 200, t, .5, .35, b, { to: 50, glide: .4 }); [0, 7, 12].forEach((s, i) => bell(72 + level * 2 + s, t + .05 + i * .04, .07, b, .9)) },
  fanfare(rank) {
    const t = A.currentTime, b = bus(.45), r = rank >= 6 ? 63 : rank >= 5 ? 62 : 60
    boom(t, .5, b)
    const prog = [[r, r + 4, r + 7], [r + 5, r + 9, r + 12], [r + 7, r + 11, r + 14], [r + 12, r + 16, r + 19]]
    prog.forEach((ch, i) => { pad(ch, t + i * .32, .5 + (i === 3 ? 1.6 : 0), .03, b, 3000); tone('square', N(ch[2] + 12), t + i * .32, .25 + (i === 3 ? .8 : 0), .03, b, { lp: 3500 }) })
    ;[0, 4, 7, 12, 16, 19, 24].forEach((s, i) => bell(r + 24 + s, t + 1 + i * .05, .06, b, 1.4))
  },
  win() { const t = A.currentTime, b = bus(.4); [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79]].forEach((ch, i) => { pad(ch, t + i * .18, i === 3 ? 1.6 : .3, .035, b, 3200); tone('square', N(ch[2] + 12), t + i * .18, i === 3 ? .9 : .16, .035, b, { lp: 3000 }) }); boom(t + .54, .3, b) },
  lose() { const t = A.currentTime, b = bus(.4); [[64, 67, 71], [62, 65, 69], [60, 63, 67]].forEach((ch, i) => pad(ch, t + i * .35, i === 2 ? 1.6 : .4, .035, b, 1600)); tone('sine', 82, t + .7, 1.4, .2, b, { to: 55 }) },
  reveal(rank) {
    const t = A.currentTime, b = bus(.45)
    if (rank <= 1) { bell(rank ? 81 : 76, t, .1, b, .6); return }
    if (rank === 2) { [76, 83, 88].forEach((n, i) => bell(n, t + i * .03, .09, b, .9)); return }
    if (rank === 3) { boom(t, .25, b); [74, 81, 86, 93].forEach((n, i) => bell(n, t + i * .05, .1, b, 1.2)); pad([62, 69, 74], t, 1.2, .025, b, 1800); return }
    // Legendary / Mythic / Rainbow: impact, choir-like pad, sparkle run
    boom(t, .45, b); noise(t, 1.2, .08, b, { type: 'highpass', f: 7000, a: .01 })
    const root = rank >= 6 ? 63 : rank === 5 ? 61 : 60
    pad([root, root + 7, root + 12, root + 16], t, 2.4, .035, b, rank >= 5 ? 3200 : 2400)
    const run = rank >= 6 ? [0, 4, 7, 11, 12, 16, 19, 23, 24] : [0, 4, 7, 12, 16, 19, 24]
    run.forEach((s, i) => bell(root + 24 + s, t + .12 + i * .055, .07, b, 1.4))
  },
}

// ================= MUSIC (generative, Web Audio) =================
let MUS = true; try { MUS = localStorage.getItem('aut-music') !== 'off' } catch { }
let MG = null, mTimer = null, mTrack = null, mStep = 0, mNext = 0
const TRACKS = {
  // chill lobby: Am - F - C - G, laid-back lo-fi groove
  menu: { bpm: 84, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bass: [45, 41, 36, 43], kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: .55, lead: [0, 2, 4, 2, 7, 4, 2, 0], leadEvery: 4, vol: .5, lp: 1600 },
  // battle: driving minor, faster, punchy
  battle: { bpm: 132, chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], bass: [38, 34, 36, 33], kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], hat: .9, lead: [0, 3, 7, 10, 7, 3, 5, 7], leadEvery: 2, vol: .45, lp: 2600 },
}
function mBus() { if (MG) return MG; MG = A.createGain(); MG.gain.value = 0; MG.connect(OUT); return MG }
function mTick() {
  const T = TRACKS[mTrack]; if (!T || !A) return
  const sp = 60 / T.bpm / 4 // 16th notes
  while (mNext < A.currentTime + .25) {
    const s = mStep % 16, bar = Math.floor(mStep / 16) % 4, t = mNext, g = MG
    const ch = T.chords[bar]
    if (s === 0) { for (const n of ch) for (const dt of [-6, 6]) tone('sawtooth', N(n), t, sp * 15, .016 * T.vol, g, { a: .08, detune: dt, lp: T.lp, q: .4 }) }
    if (s % 4 === 0) tone('triangle', N(T.bass[bar]), t, sp * 3, .11 * T.vol, g, { lp: 500 })
    if (T.kick[s]) { tone('sine', 110, t, .22, .3 * T.vol, g, { to: 40, glide: .12 }) }
    if (T.snare[s]) noise(t, .12, .11 * T.vol, g, { type: 'bandpass', f: 1800, q: .8 })
    if (s % 2 === 0 || T.hat > .8) noise(t, .03, (s % 4 === 2 ? .05 : .03) * T.hat * T.vol, g, { type: 'highpass', f: 7000 })
    if (s % T.leadEvery === 0 && Math.floor(mStep / 64) % 2 === 1) { const ln = T.lead[(s / T.leadEvery) % T.lead.length], root = ch[0] + 12; tone('square', N(root + ln), t, sp * T.leadEvery * .9, .018 * T.vol, g, { lp: 2400 }) }
    mStep++; mNext += sp
  }
}
export function music(track) {
  mTrack = track || mTrack
  if (!MUS || !mTrack) { if (MG) MG.gain.setTargetAtTime(0, A.currentTime, .3); clearInterval(mTimer); mTimer = null; return }
  const a = ctx(); if (!a) return
  if (a.state === 'suspended') a.resume()
  mBus(); MG.gain.cancelScheduledValues(a.currentTime); MG.gain.setTargetAtTime(.0001, a.currentTime, .05)
  setTimeout(() => { mStep = 0; mNext = A.currentTime + .1; MG.gain.setTargetAtTime(.9, A.currentTime, .6) }, 250)
  if (!mTimer) mTimer = setInterval(mTick, 90)
}
export function musicOn(v) { if (v !== undefined) { MUS = !!v; try { localStorage.setItem('aut-music', MUS ? 'on' : 'off') } catch { } music() } return MUS }
// start the menu music on the first tap (browsers block audio before that)
addEventListener('pointerdown', () => { if (!mTimer && MUS) music(document.body.classList.contains('in-battle') ? 'battle' : 'menu') }, { once: true, capture: true })

export function sfx(name, ...args) {
  if (!ON) return 0
  const a = ctx(); if (!a || !S[name]) return 0
  if (a.state === 'suspended') a.resume()
  try { return S[name](...args) || 0 } catch { return 0 }
}
export function sfxOn(v) { if (v !== undefined) { ON = !!v; try { localStorage.setItem('aut-sfx', ON ? 'on' : 'off') } catch { } } return ON }
