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
let DUCK = false
export function musicDuck(v) { DUCK = !!v; music() }
let MG = null, mTimer = null, mTrack = null, mStep = 0, mNext = 0
const TRACKS = {
  // anime OP-style lobby theme: bright D major, rock band + strings, a hook that comes in on loop 2
  menu: { bpm: 118, chords: [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62]], bass: [38, 33, 35, 31],
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: .7,
    gtr: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], glp: 1400, arp: 2, vol: .42, lp: 2400,
    mel: [[0, 74, 4], [4, 76, 2], [6, 78, 2], [8, 81, 6], [14, 78, 2], [16, 76, 4], [20, 73, 4], [24, 76, 6], [30, 78, 2], [32, 78, 4], [36, 79, 2], [38, 78, 2], [40, 76, 4], [44, 74, 4], [48, 79, 4], [52, 78, 4], [56, 76, 8]],
    melB: [[0, 81, 6], [6, 83, 2], [8, 81, 4], [12, 78, 4], [16, 76, 6], [22, 78, 2], [24, 81, 8], [32, 83, 4], [36, 81, 4], [40, 78, 4], [44, 79, 4], [48, 81, 8], [56, 86, 8]] },
  // battle: hype shonen fight theme, D minor, 150 bpm, chugging guitars
  battle: { bpm: 150, chords: [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64]], bass: [38, 34, 36, 33],
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], hat: .95,
    gtr: [1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1], glp: 2200, arp: 2, vol: .4, lp: 2800, fill: 1,
    mel: [[0, 74, 2], [2, 77, 2], [4, 81, 4], [8, 79, 2], [10, 77, 2], [12, 76, 4], [16, 74, 2], [18, 77, 2], [20, 82, 4], [24, 81, 4], [28, 77, 4], [32, 76, 2], [34, 79, 2], [36, 84, 4], [40, 83, 2], [42, 81, 2], [44, 79, 4], [48, 81, 6], [54, 85, 2], [56, 86, 8]],
    melB: [[0, 86, 4], [4, 84, 2], [6, 82, 2], [8, 81, 4], [12, 77, 4], [16, 82, 4], [20, 81, 2], [22, 79, 2], [24, 77, 8], [32, 79, 4], [36, 81, 4], [40, 84, 4], [44, 83, 4], [48, 81, 4], [52, 79, 4], [56, 81, 8]] },
  // boss: dark villain theme for Dead Zones / Crucible, E minor, taiko toms
  boss: { bpm: 160, chords: [[64, 67, 71], [60, 64, 67], [62, 66, 69], [59, 63, 66]], bass: [40, 36, 38, 35],
    kick: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: .8,
    toms: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1], gtr: [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0], glp: 1600, arp: 2, vol: .4, lp: 2000, fill: 1,
    mel: [[0, 76, 6], [6, 79, 2], [8, 78, 4], [12, 74, 4], [16, 72, 6], [22, 74, 2], [24, 76, 8], [32, 79, 4], [36, 78, 4], [40, 76, 4], [44, 74, 4], [48, 75, 8], [56, 71, 8]],
    melB: [[0, 83, 8], [8, 81, 4], [12, 79, 4], [16, 79, 4], [20, 78, 4], [24, 76, 8], [32, 84, 4], [36, 83, 4], [40, 81, 4], [44, 79, 4], [48, 78, 8], [56, 75, 8]] },
}
function mBus() { if (MG) return MG; MG = A.createGain(); MG.gain.value = 0; MG.connect(OUT); return MG }
function mTick() {
  const T = TRACKS[mTrack]; if (!T || !A) return
  const sp = 60 / T.bpm / 4, L = T.chords.length
  while (mNext < A.currentTime + .25) {
    const s = mStep % 16, barAbs = Math.floor(mStep / 16), bar = barAbs % L, t = mNext, g = MG, V = T.vol, ch = T.chords[bar], sec = Math.floor(mStep / (16 * L)) % 4
    if (s === 0) pad(ch.map(n => n + 12), t, sp * 16, .005 * V, g, T.lp)
    if (T.gtr && T.gtr[s] && sec > 0) for (const n of [ch[0] - 12, ch[0] - 5, ch[0]]) tone('sawtooth', N(n), t, sp * 1.6, .016 * V, g, { lp: T.glp || 1800, q: 2, detune: n % 2 ? 8 : -8 })
    if (s % 2 === 0) tone('triangle', N(T.bass[bar] + (s % 8 === 6 ? 12 : 0)), t, sp * 1.8, .12 * V, g, { lp: 600 })
    if (T.arp && s % T.arp === 0 && sec !== 0) tone('square', N(ch[(s / T.arp) % 3] + 24), t, sp * .9, .006 * V, g, { lp: 3000 })
    if (T.kick[s]) tone('sine', 120, t, .22, .34 * V, g, { to: 40, glide: .12 })
    if (T.snare[s]) { noise(t, .14, .13 * V, g, { type: 'bandpass', f: 1900, q: .7 }); tone('triangle', 190, t, .08, .05 * V, g) }
    if (s % 2 === 0 || T.hat > .8) noise(t, .03, (s % 4 === 2 ? .05 : .03) * T.hat * V, g, { type: 'highpass', f: 7500 })
    if (s === 0 && bar === 0) noise(t, 1.2, .05 * V, g, { type: 'highpass', f: 5000 })
    if (T.toms && T.toms[s]) tone('sine', 90 + (s % 4) * 18, t, .25, .24 * V, g, { to: 50, glide: .2 })
    if (T.fill && bar === L - 1 && s >= 12 && barAbs % 8 === 7) noise(t, .08, .1 * V, g, { type: 'bandpass', f: 1200 + s * 200, q: 1 })
    if (sec > 0) { const M = sec === 2 && T.melB ? T.melB : T.mel, st = (barAbs % 4) * 16 + s; for (const [o, n, l] of M) if (o === st) { tone('square', N(n), t, sp * l * .95, .02 * V, g, { lp: 3200 }); tone('sawtooth', N(n + 12), t, sp * l * .95, .006 * V, g, { lp: 4000, detune: 6 }) } }
    mStep++; mNext += sp
  }
}
export function music(track) {
  mTrack = track || mTrack
  if (!MUS || !mTrack || DUCK) { if (MG) MG.gain.setTargetAtTime(0, A.currentTime, .3); clearInterval(mTimer); mTimer = null; return }
  const a = ctx(); if (!a) return
  if (a.state === 'suspended') a.resume()
  mBus(); MG.gain.cancelScheduledValues(a.currentTime); MG.gain.setTargetAtTime(.0001, a.currentTime, .05)
  setTimeout(() => { mStep = 0; mNext = A.currentTime + .1; MG.gain.setTargetAtTime(.9, A.currentTime, .6) }, 250)
  if (!mTimer) mTimer = setInterval(mTick, 90)
}
export function musicOn(v) { if (v !== undefined) { MUS = !!v; try { localStorage.setItem('aut-music', MUS ? 'on' : 'off') } catch { } music() } return MUS }
// start the menu music on the first tap (browsers block audio before that)
addEventListener('pointerdown', () => { if (!mTimer && MUS && !DUCK) music(document.body.classList.contains('in-battle') ? 'battle' : 'menu') }, { once: true, capture: true })

// ---- anime layer: slashes, shings and booms on top of the base hits ----
function swish(t, v, d) { noise(t, .16, v, d, { type: 'bandpass', f: 900, to: 5200, q: 2.2 }) }
function shing(t, v, d) { tone('sine', 2600, t, .35, v * .5, d, { to: 3400, glide: .05 }); tone('sine', 5300, t, .25, v * .25, d) }
const ANIME_LAYER = {
  bhit: () => { const t = A.currentTime, d = bus(.1); swish(t, .07, d) },
  bblast: () => { const t = A.currentTime, d = bus(.25); noise(t, .45, .09, d, { type: 'lowpass', f: 3000, to: 300 }); tone('sawtooth', 220, t, .4, .03, d, { to: 70, glide: .35, lp: 1500 }) },
  bimpact: big => { const t = A.currentTime, d = bus(.3); boom(t, big ? .22 : .12, d); swish(t, .06, d) },
  crit: () => { const t = A.currentTime, d = bus(.35); shing(t, .12, d); swish(t + .02, .08, d) },
  bko: () => { const t = A.currentTime, d = bus(.5); boom(t, .25, d); riser(t, .5, .05, d) },
  bcharge: () => { const t = A.currentTime, d = bus(.3); riser(t, .55, .05, d) },
}
export function sfx(name, ...args) {
  try { if (ON && A && ANIME_LAYER[name]) ANIME_LAYER[name](...args) } catch { }
  if (!ON) return 0
  const a = ctx(); if (!a || !S[name]) return 0
  if (a.state === 'suspended') a.resume()
  try { return S[name](...args) || 0 } catch { return 0 }
}
export function sfxOn(v) { if (v !== undefined) { ON = !!v; try { localStorage.setItem('aut-sfx', ON ? 'on' : 'off') } catch { } } return ON }
