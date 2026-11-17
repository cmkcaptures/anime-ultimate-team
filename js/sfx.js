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

export function sfx(name, ...args) {
  if (!ON) return 0
  const a = ctx(); if (!a || !S[name]) return 0
  if (a.state === 'suspended') a.resume()
  try { return S[name](...args) || 0 } catch { return 0 }
}
export function sfxOn(v) { if (v !== undefined) { ON = !!v; try { localStorage.setItem('aut-sfx', ON ? 'on' : 'off') } catch { } } return ON }
