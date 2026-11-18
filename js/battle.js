// AUT Battle — turn-based hybrid of DB Legends (Arts cards, Energy, Ultimates, switching) and TCG Pocket (turns, energy, bench).
// Win by knocking out all 6 enemy fighters. 1 active fighter + 5 on the bench each side.
import { TIER, TYPE, thumbURL } from './cardkit.js'
import { sfx, sfxOn } from './sfx.js'
import { createFX } from './fx2d.js'

let X = null // app context: { h, $, cardImg, eff, BYKEY, POOL, P, act, go, toast, tierCol, ANAME }
export function initBattle(ctx) { X = ctx }

// ---------------- type matchups: each type beats the next one in the ring ----------------
const RING = ['ki', 'curse', 'chak', 'haki', 'mana', 'quirk', 'ego', 'breath', 'nen', 'magic', 'devil', 'stand', 'ghoul', 'reiatsu', 'kaiju', 'psychic', 'flame', 'hero']
const tOf = c => c.t || 'ki'
export const beats = (a, b) => RING[(RING.indexOf(a) + 1) % RING.length] === b
const matchup = (att, def) => beats(tOf(att.card), tOf(def.card)) ? 1.3 : beats(tOf(def.card), tOf(att.card)) ? .8 : 1
const tcol = c => (TYPE[tOf(c)] || TYPE.ki).c[0]
const tname = c => (TYPE[tOf(c)] || TYPE.ki).en
const weakTo = t => RING[(RING.indexOf(t) - 1 + RING.length) % RING.length]

// ---------------- rules ----------------
const ICON = {"strike":"<svg viewBox=\"0 0 64 64\"><path d=\"M14 30c0-4 3-7 7-7h2v-5a5 5 0 0 1 10 0v2a5 5 0 0 1 10 0v3a5 5 0 0 1 9 3v12c0 9-7 16-16 16h-6c-9 0-16-7-16-16z\" fill=\"currentColor\"/><path d=\"M4 16l10 6M2 28h10M6 40l9-4\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>","blast":"<svg viewBox=\"0 0 64 64\"><circle cx=\"32\" cy=\"32\" r=\"13\" fill=\"currentColor\"/><circle cx=\"32\" cy=\"32\" r=\"21\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" opacity=\".55\"/><circle cx=\"32\" cy=\"32\" r=\"28\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" opacity=\".3\"/></svg>","guard":"<svg viewBox=\"0 0 64 64\"><path d=\"M32 4l22 8v16c0 15-10 26-22 32C20 54 10 43 10 28V12z\" fill=\"currentColor\"/><path d=\"M22 32l7 7 13-14\" stroke=\"#0b0d12\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>","special":"<svg viewBox=\"0 0 64 64\"><path d=\"M32 2l6 20 20-6-14 16 14 16-20-6-6 20-6-20-20 6 14-16L6 16l20 6z\" fill=\"currentColor\"/></svg>"}
const KI_PER_TURN = 3, KI_MAX = 10, HAND = 4, GAUGE_MAX = 100
const ARTS = {
  strike: { name: 'STRIKE', cost: 1, col: '#ff4a5a', desc: 'Fast hit · PWR' },
  blast: { name: 'BLAST', cost: 2, col: '#ffc23a', desc: 'Energy blast · ENG' },
  guard: { name: 'GUARD', cost: 1, col: '#3dffa0', desc: 'Halve the next hit' },
  special: { name: 'SPECIAL', cost: 4, col: '#4aa8ff', desc: 'Signature move' },
}
const pctOf = c => { const m = /(\d+)%\s*PWR/.exec((c.tx || []).join(' ')); return m ? +m[1] : 220 }
const isAoe = c => /all enemies/i.test((c.tx || []).join(' '))
const kitTxt = c => (c.tx || []).join(' ')
const kitNum = (c, re) => { const m = re.exec(kitTxt(c)); return m ? +m[1] : 0 }
// applies a card's kit bonuses after its Special / Ultimate lands
function kitEffects(me, a) {
  const c = a.card, notes = []
  const heal = kitNum(c, /Heal (\d+)% max HP/); if (heal) { const h = Math.round(a.max * heal / 100); a.hp = Math.min(a.max, a.hp + h); notes.push('+' + h.toLocaleString() + ' HP') }
  const ki = kitNum(c, /Gain (\d+) Energy/); if (ki) { me.ki = Math.min(KI_MAX, me.ki + ki); notes.push('+' + ki + ' ENERGY') }
  const g = kitNum(c, /Ultimate gauge by (\d+)%/); if (g) { me.gauge = Math.min(GAUGE_MAX, me.gauge + g); notes.push('+' + g + '% ULT') }
  if (/Gain Guard/.test(kitTxt(c))) { a.guard = 1; notes.push('GUARD UP') }
  return notes
}
function fighter(card, lvl = 0) {
  const [pwr, spd, ki, tec, def, iq] = card.st || [70, 70, 70, 70, 70, 70]
  const hp = Math.round(card.ovr * 40 + def * 12 + (card.tag ? 600 : 0))
  return { card, key: card.key, hp, max: hp, pwr, spd, ki, tec, def, iq, guard: 0, ko: false, lvl, dealt: 0, kos: 0, fort: 0 }
}
function drawArt(f) {
  // the fighter's role nudges which arts show up (fighters strike, supports blast/guard)
  const r = Math.random(), role = f.card.role
  if (r < .14) return 'special'
  if (r < (role === 'TANK' || role === 'SUPPORT' ? .34 : .24)) return 'guard'
  if (r < (role === 'SHOOTER' || role === 'SUPPORT' ? .64 : .52)) return 'blast'
  return 'strike'
}
function newSide(cards) { return { team: cards.map(c => fighter(c)), active: 0, ki: 4, gauge: 0, hand: [], switched: false, seq: [] } }
const act = s => s.team[s.active]
const alive = s => s.team.filter(f => !f.ko)
// bench passives: everyone waiting on the bench helps the active fighter
const PASSIVE = { SUPPORT: ['heal', 4, 'MEDIC'], TANK: ['dr', 6, 'BULWARK'], ASSASSIN: ['crit', 4, 'KILLER INSTINCT'], FIGHTER: ['dmg', 3, 'BATTLE CRY'], SHOOTER: ['gauge', 5, 'SPOTTER'], STRIKER: ['gauge', 5, 'SPOTTER'] }
function passives(s) {
  const p = { heal: 0, dr: 0, crit: 0, dmg: 0, gauge: 0 }
  s.team.forEach((f, i) => { if (i === s.active || f.ko) return; const q = PASSIVE[f.card.role]; if (q) p[q[0]] += q[1] })
  p.dr = Math.min(p.dr, 18); p.dmg = Math.min(p.dmg, 12); p.crit = Math.min(p.crit, 12); p.heal = Math.min(p.heal, 12); p.gauge = Math.min(p.gauge, 15)
  return p
}
function refill(s) { while (s.hand.length < HAND) s.hand.push(drawArt(act(s))) }
function hit(att, def, base, stat, pierce, A, D) {
  const pa = A ? passives(A) : {}, pd = D ? passives(D) : {}
  const crit = Math.random() < .08 + att.tec / 1200 + (pa.crit || 0) / 100
  const mu = matchup(att, def)
  let dmg = base * (stat / 80) * (100 / (60 + def.def * .5)) * (0.92 + Math.random() * .16) * (crit ? 1.5 : 1) * mu
  const tagB = att.card.tag ? kitNum(att.card, /\+(\d+)% damage/) : 0; if (tagB) dmg *= 1 + tagB / 100
  if (pa.dmg) dmg *= 1 + pa.dmg / 100
  if (pd.dr) dmg *= 1 - pd.dr / 100
  if (def.fort) dmg *= .7
  if (def.guard) { if (!pierce) dmg *= .5; def.guard = 0 }
  dmg = Math.max(1, Math.round(dmg))
  def.hp = Math.max(0, def.hp - dmg); att.dealt += dmg; if (def.hp === 0 && !def.ko) { def.ko = true; att.kos++ }
  return { dmg, crit, mu }
}
// returns a list of events for the UI to animate
const COMBOS = [
  { seq: ['strike', 'strike', 'blast'], name: 'RUSH COMBO', bonus: .45 },
  { seq: ['blast', 'strike', 'strike'], name: 'BURST CHAIN', bonus: .35 },
  { seq: ['guard', 'special'], name: 'COUNTER ART', bonus: .3 },
  { seq: ['strike', 'blast', 'special'], name: 'FULL ASSAULT', bonus: .6 },
]
function comboFor(seq) { for (const c of COMBOS) { const n = c.seq.length; if (seq.length >= n && c.seq.every((a, i) => seq[seq.length - n + i] === a)) return c } return null }
function playArt(B, who, idx) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], art = me.hand[idx], cost = ARTS[art].cost, a = act(me), d = act(foe)
  if (me.ki < cost || a.ko || d.ko) return null
  me.ki -= cost; me.hand.splice(idx, 1)
  me.seq.push(art)
  const ev = { who, art, hits: [] }
  const combo = comboFor(me.seq), dmgArts = me.seq.filter(x => x !== 'guard').length
  const chain = 1 + Math.min(.32, Math.max(0, dmgArts - 1) * .08) + (combo ? combo.bonus : 0)
  if (combo) { ev.combo = combo.name; me.seq = [] }
  ev.chain = art === 'guard' ? 0 : dmgArts
  const pierce = /Ignores Guard/.test(kitTxt(a.card))
  if (art === 'guard') { a.guard = 1; ev.guard = true }
  else if (art === 'strike') ev.hits.push({ t: d, ...hit(a, d, 260 * chain, a.pwr, false, me, foe) })
  else if (art === 'blast') ev.hits.push({ t: d, ...hit(a, d, 420 * chain, a.ki, false, me, foe) })
  else if (art === 'special') {
    const base = pctOf(a.card) * 3.2 * chain
    ev.move = a.card.mv
    if (isAoe(a.card)) for (const t of alive(foe)) ev.hits.push({ t, ...hit(a, t, t === d ? base * .75 : base * .3, Math.max(a.pwr, a.ki), pierce, me, foe) })
    else ev.hits.push({ t: d, ...hit(a, d, base, Math.max(a.pwr, a.ki), pierce, me, foe) })
  }
  const dealt = ev.hits.reduce((n, x) => n + x.dmg, 0)
  me.gauge = Math.min(GAUGE_MAX, me.gauge + 6 + dealt / 90); foe.gauge = Math.min(GAUGE_MAX, foe.gauge + dealt / 140)
  if (art === 'special') ev.kit = kitEffects(me, a)
  return ev
}
const ULT = { FIGHTER: ['BARRAGE', 'Three crushing hits'], ASSASSIN: ['EXECUTION', 'Pierces Guard · +60% vs targets under 40% HP'], SUPPORT: ['RALLY', 'Big hit · heals the whole team 20%'], TANK: ['FORTRESS', 'Big hit · takes 30% less damage until your next turn'], SHOOTER: ['OVERDRIVE', 'Hits every enemy hard'], STRIKER: ['OVERDRIVE', 'Hits every enemy hard'] }
const ultOf = c => c.tag ? ['DUO FINISH', 'Both partners strike · double hit'] : (ULT[c.role] || ULT.FIGHTER)
function ultimate(B, who) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], a = act(me), d = act(foe)
  if (me.gauge < GAUGE_MAX || a.ko || d.ko) return null
  me.gauge = 0; me.seq = []
  const [uname] = ultOf(a.card), ev = { who, art: 'ultimate', move: a.card.mv, ult: uname, hits: [] }
  const base = pctOf(a.card) * 6, stat = Math.max(a.pwr, a.ki), pierce = /Ignores Guard/.test(kitTxt(a.card))
  const H = (t, b, p) => { if (!t.ko) ev.hits.push({ t, ...hit(a, t, b, stat, p, me, foe) }) }
  if (a.card.tag) { H(d, base * .62, pierce); H(d, base * .62, true) }
  else if (uname === 'BARRAGE') { H(d, base * .45, pierce); H(d, base * .45, pierce); H(d, base * .45, true) }
  else if (uname === 'EXECUTION') H(d, base * (d.hp / d.max < .4 ? 1.6 : 1.05), true)
  else if (uname === 'RALLY') { H(d, base * .9, pierce); for (const f of me.team) if (!f.ko) f.hp = Math.min(f.max, f.hp + Math.round(f.max * .2)); ev.rally = true }
  else if (uname === 'FORTRESS') { H(d, base * .95, pierce); a.fort = 1; a.guard = 1; ev.fort = true }
  else for (const t of alive(foe)) H(t, t === d ? base * .85 : base * .45, pierce)
  ev.kit = kitEffects(me, a)
  return ev
}
function nextAlive(s) { const i = s.team.findIndex(f => !f.ko); if (i >= 0) s.active = i; return i >= 0 }

// ---------------- AI ----------------
function planTurn(B, level, who = 'ai') {
  const me = B[who], foe = B[who === 'ai' ? 'you' : 'ai'], evs = []
  const smart = level >= 3, clever = level >= 2
  // counter-switch: bring in someone with type advantage, or rescue a dying fighter
  if (smart && !me.switched) {
    const cur = act(me), opp = act(foe), bench = me.team.map((f, i) => [f, i]).filter(([f, i]) => !f.ko && i !== me.active)
    const adv = bench.filter(([f]) => matchup(f, opp) > 1 && f.hp / f.max > .4).sort((x, y) => y[0].hp - x[0].hp)[0]
    const hurt = cur.hp / cur.max < .22 ? bench.sort((x, y) => y[0].hp - x[0].hp)[0] : null
    const pick = (matchup(cur, opp) < 1 && adv) ? adv : hurt
    if (pick) { me.active = pick[1]; me.switched = true; evs.push({ who, swap: true }) }
  }
  let guarded = false
  for (let n = 0; n < 8; n++) {
    if (act(foe).ko || act(me).ko) break
    if (me.gauge >= GAUGE_MAX && (clever || Math.random() < .7)) { const e = ultimate(B, who); if (e) { evs.push(e); continue } }
    const playable = me.hand.map((a, i) => [a, i]).filter(([a]) => ARTS[a].cost <= me.ki)
    if (!playable.length) break
    const hasSpecial = me.hand.includes('special'), opp = act(foe), mine = act(me)
    let pick = null
    // 1) finish a low target with the cheapest attack
    if (clever && opp.hp / opp.max < .12) pick = playable.find(([a]) => a === 'strike') || playable.find(([a]) => a !== 'guard')
    // 2) special if affordable
    if (!pick) pick = playable.find(([a]) => a === 'special')
    // 3) guard when an enemy ultimate is coming or when low
    if (!pick && clever && !guarded && (foe.gauge >= 85 || mine.hp / mine.max < .45)) { pick = playable.find(([a]) => a === 'guard'); if (pick) guarded = true }
    // 4) go for a named combo
    if (!pick && level >= 4) { const want = me.seq.length && me.seq[me.seq.length - 1] === 'strike' ? (me.seq.length > 1 && me.seq[me.seq.length - 2] === 'strike' ? 'blast' : 'strike') : 'strike'; pick = playable.find(([a]) => a === want) }
    // 5) save energy for a special next turn
    if (!pick && clever && hasSpecial && me.ki - 1 < 4 - KI_PER_TURN + 1) break
    if (!pick) pick = playable.filter(([a]) => a !== 'guard').sort((x, y) => ARTS[y[0]].cost - ARTS[x[0]].cost)[0]
    if (!pick) break
    if (!smart && Math.random() < .2 && playable.length > 1) pick = playable[playable.length - 1]
    const e = playArt(B, who, pick[1]); if (!e) break; evs.push(e)
  }
  return evs
}
const aiTurn = (B, level) => planTurn(B, level, 'ai')

// ---------------- arenas ----------------
export const ARENAS = {
  dojo: { name: 'SUNSET DOJO', sub: 'Training Grounds' },
  city: { name: 'NEON DISTRICT', sub: 'Street Arena' },
  forest: { name: 'HIDDEN LEAF SHRINE', sub: 'Forest Arena' },
  domain: { name: 'CURSED DOMAIN', sub: 'Shibuya Underground' },
  deck: { name: 'GRAND LINE DECK', sub: 'Open Sea' },
  cosmos: { name: 'NULL VOID COLOSSEUM', sub: 'Tournament of Power' },
}
const ARENA_KEYS = Object.keys(ARENAS)
let ARENA_IMGS = null
const arenaImgs = () => ARENA_IMGS || (ARENA_IMGS = fetch('arenas-list.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : []).catch(() => []))

// ---------------- story ----------------
const STAGES = [
  { n: 1, name: 'Training Grounds', rating: 70, level: 1, coins: 1500, arena: 'dojo' },
  { n: 2, name: 'Street Brawl', rating: 74, level: 1, coins: 2000, arena: 'city' },
  { n: 3, name: 'Rival Academy', rating: 78, level: 2, coins: 2500, arena: 'forest' },
  { n: 4, name: 'Tournament Prelims', rating: 81, level: 2, coins: 3000, arena: 'city' },
  { n: 5, name: 'Villain Hideout', rating: 84, level: 3, coins: 4000, arena: 'domain', pack: 'standard' },
  { n: 6, name: 'Shinobi War', rating: 86, level: 3, coins: 5000, arena: 'forest' },
  { n: 7, name: 'Cursed Domain', rating: 88, level: 3, coins: 6000, arena: 'domain' },
  { n: 8, name: 'Grand Line Showdown', rating: 90, level: 4, coins: 7500, arena: 'deck', pack: 'premium' },
  { n: 9, name: 'Tournament of Power', rating: 93, level: 4, coins: 10000, arena: 'cosmos' },
  { n: 10, name: 'Gods of Destruction', rating: 96, level: 5, coins: 15000, arena: 'cosmos', pack: 'premium' },
]
function enemyTeam(stage) {
  if (stage.team && stage.team.length) { const t = stage.team.map(k => X.BYKEY[k]).filter(Boolean); if (t.length) return t.slice(0, 6) }
  const pool = X.POOL.slice().sort((a, b) => Math.abs(a.ovr - stage.rating) - Math.abs(b.ovr - stage.rating))
  const near = pool.slice(0, Math.max(14, Math.round(pool.length * .25)))
  const out = []; while (out.length < 6 && near.length) out.push(near.splice(Math.floor(Math.random() * near.length), 1)[0])
  return out.sort((a, b) => b.ovr - a.ovr)
}

export function battlePage(el) {
  const { h, P } = X
  const prog = (P.battle && P.battle.cleared) || 0
  const team = P.team.filter(Boolean)
  const hero = h('section', 'bhero', `<div><span class="sh-tag">STORY MODE</span><h2>BATTLE</h2><p>Turn-based fights with Arts cards. Build Energy, play Strikes, Blasts and Specials, fill your gauge for an Ultimate, and knock out all 6 enemy fighters.</p></div><div class="bstat"><b>${prog}</b><span>/ ${STAGES.length} CLEARED</span></div>`)
  el.append(hero)
  { const t = h('button', 'btn dark', '📖 HOW TO PLAY'); t.style.marginTop = '12px'; t.onclick = () => tutorial(); el.append(t) }
  if (team.length < 6) {
    const w = h('div', 'panel pad', `<b>Your team needs 6 fighters.</b><p class="muted" style="margin:6px 0 12px">You have ${team.length}/6. Set your team first; Auto Build picks the best cards you own.</p>`)
    const b = h('button', 'btn gold', 'GO TO MY TEAM'); b.onclick = () => X.go('team'); w.append(b); el.append(w)
  }
  el.append(h('div', 'sec', '<h3>STAGES</h3><span class="muted" style="font-weight:800;font-size:12px">first clear gives bonus rewards</span>'))
  const list = h('div', 'stages')
  for (const s of STAGES) {
    const locked = s.n > prog + 1, done = s.n <= prog
    const r = h('button', 'stage' + (locked ? ' locked' : '') + (done ? ' done' : ''))
    r.innerHTML = `<span class="sn">${String(s.n).padStart(2, '0')}</span><div class="si"><b>${s.name}</b><small>${ARENAS[s.arena] ? ARENAS[s.arena].name + ' · ' : ''}Enemy rating ~${s.rating} · AI level ${s.level}</small></div><div class="sr">${done ? '<em>CLEARED</em>' : ''}<span><i class="coin-i"></i>${(done ? Math.round(s.coins / 3) : s.coins).toLocaleString()}</span>${s.pack && !done ? `<span class="pk">+ ${s.pack === 'premium' ? 'PREMIUM' : ''} PACK</span>` : ''}</div>`
    r.disabled = locked || team.length < 6
    r.onclick = () => seenTutorial() ? startBattle(s) : tutorial(() => startBattle(s))
    list.append(r)
  }
  el.append(list)
}

// ---------------- arena UI ----------------
export function startBattle(stage) {
  const { h, cardImg, eff, BYKEY, P } = X
  const yours = P.team.filter(Boolean).map(k => eff(BYKEY[k])).filter(Boolean)
  const B = { you: newSide(yours), ai: newSide(enemyTeam(stage)), turn: 1, over: false, busy: false }
  refill(B.you); refill(B.ai)
  const youFirst = act(B.you).spd >= act(B.ai).spd

  const AR = stage.arena && ARENAS[stage.arena] ? stage.arena : ARENA_KEYS[Math.floor(Math.random() * ARENA_KEYS.length)]
  const ov = h('div', 'th-' + AR); ov.id = 'arena'
  ov.innerHTML = `<div class="env"><i class="e-sky"></i><i class="e-far"></i><i class="e-near"></i><i class="e-amb"></i><i class="e-vig"></i></div><div class="stage3"><div class="st-sky"></div><div class="st-pillars"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="st-floor"><div class="st-plat"><i class="r1"></i><i class="r2"></i><i class="mid"></i><i class="pad ai"></i><i class="pad you"></i></div></div></div>
    <header class="ar-top"><button class="ar-quit">✕ QUIT</button><button class="ar-mute"></button><button class="ar-speed"></button><button class="ar-auto">AUTO</button><span class="ar-stage">${stage.pvp ? 'VS ' + stage.name.toUpperCase() : 'STAGE ' + stage.n + ' · ' + stage.name.toUpperCase()}</span><span class="ar-turn"></span></header>
    <div class="ar-plate ai"><span class="pp"></span><span class="pn">${stage.pvp ? stage.name.toUpperCase() : 'ENEMY · ' + stage.name.toUpperCase()}</span><span class="pk"></span></div><div class="mat"><div class="mat-in"><i class="mat-surf"></i><i class="mat-emb"></i><div class="mat-line"></div><span class="mat-tag t-ai">ENEMY ACTIVE</span><span class="mat-tag t-you">YOUR ACTIVE</span><div class="ar-side ai"><div class="ar-bench"></div><div class="ar-active"></div><div class="ar-hud"></div></div>
    <div class="ar-mid"><div class="ar-log"></div></div>
    <div class="ar-side you"><div class="ar-hud"></div><div class="ar-active"></div><div class="ar-bench"></div></div></div></div><div class="ar-plate you"><span class="pp"></span><span class="pn">YOU</span><span class="pk"></span></div>
    <footer class="ar-ctrl"><div class="ar-ki"></div><div class="ar-hand"></div><div class="ar-btns"><button class="ar-ult"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44"/></svg><b>ULT</b><small></small></button><button class="ar-end"><b>END</b><small>TURN</small></button></div></footer><div class="fxl"></div>`
  document.body.append(ov); document.body.classList.add('in-battle')
  const $a = s => ov.querySelector(s)
  let ST3 = null
  const FXC = createFX(ov)
  // 3D engine removed for performance; the stage is a static CSS scene
  const log = t => { const l = $a('.ar-log'); l.textContent = t; l.classList.remove('pop'); void l.offsetWidth; l.classList.add('pop') }
  let SPEED = 1; try { SPEED = +localStorage.getItem('aut-bspeed') || 1 } catch { }
  let AUTO = false
  const wait = ms => new Promise(r => setTimeout(r, ms / SPEED))
  const IMG = new Map()
  const img = (f, w) => { const im = new Image(); im.alt = f.card.name; im.draggable = false; const k = f.key + w; if (!IMG.has(k)) IMG.set(k, thumbURL(f.card, w)); IMG.get(k).then(u => im.src = u); return im }

  function hud(side, s) {
    const f = act(s), el = $a(`.ar-side.${side} .ar-hud`)
    el.innerHTML = `<div class="hn"><b>${f.card.name}</b><small>${f.card.ver}</small></div>
      <div class="hp"><i style="width:${f.hp / f.max * 100}%"></i><span>${f.hp.toLocaleString()} / ${f.max.toLocaleString()}</span></div>
      <div class="gg ${s.gauge >= GAUGE_MAX ? 'full' : ''}"><i style="width:${s.gauge}%"></i></div>`
  }
  function field(side, s) {
    const a = $a(`.ar-side.${side} .ar-active`), f = act(s)
    if (a.dataset.k !== f.key) { a.innerHTML = ''; const im = img(f, 360); a.append(im); a.dataset.k = f.key; a.classList.remove('enter'); void a.offsetWidth; a.classList.add('enter') }
    a.style.setProperty('--rc', X.tierCol(f.card.r))
    let hb = a.querySelector('.hpb'); if (!hb) { hb = document.createElement('div'); hb.className = 'hpb'; a.append(hb) }
    hb.innerHTML = `<b>${f.hp.toLocaleString()}</b><i><s style="width:${f.hp / f.max * 100}%"></s></i>`
    const foeF = act(side === 'you' ? B.ai : B.you), mu = foeF ? matchup(f, foeF) : 1
    let tg = a.querySelector('.mtag'); if (!tg) { tg = document.createElement('div'); a.append(tg) } tg.className = 'mtag ' + (mu > 1 ? 'adv' : mu < 1 ? 'weak' : 'none'); tg.textContent = mu > 1 ? 'ADVANTAGE' : mu < 1 ? 'WEAKNESS' : ''
    a.onclick = () => inspect(f, side)
    ov.querySelector('.ar-plate.' + side + ' .pk').innerHTML = s.team.map(g => `<i class="${g.ko ? 'ko' : ''}"></i>`).join('')
    { const p = passives(s), chips = []; if (p.heal) chips.push(`<b class="pc heal">+${p.heal}% HEAL</b>`); if (p.dr) chips.push(`<b class="pc dr">-${p.dr}% DMG TAKEN</b>`); if (p.dmg) chips.push(`<b class="pc dmg">+${p.dmg}% DMG</b>`); if (p.crit) chips.push(`<b class="pc crit">+${p.crit}% CRIT</b>`); if (p.gauge) chips.push(`<b class="pc gg">+${p.gauge}% ULT/TURN</b>`); ov.querySelector('.ar-plate.' + side + ' .pp').innerHTML = chips.join('') }
    const bn = $a(`.ar-side.${side} .ar-bench`); bn.innerHTML = ''
    s.team.forEach((g, i) => {
      if (i === s.active) return
      const b = document.createElement('button'); b.className = 'bslot' + (g.ko ? ' ko' : ''); b.append(img(g, 160))
      b.append(Object.assign(document.createElement('i'), { style: `width:${g.hp / g.max * 100}%` }))
      b.onclick = () => inspect(g, side, side === 'you' && !g.ko && !B.you.switched && !B.busy && !B.over ? () => doSwitch(i) : null)
      bn.append(b)
    })
  }
  function controls() {
    const s = B.you, my = !B.busy && !B.over
    $a('.ar-ki').innerHTML = `<div class="kring" style="--k:${s.ki / KI_MAX}"><b>${s.ki}</b><small>ENERGY</small></div><div class="kpips">${Array.from({ length: KI_MAX }, (_, i) => `<i class="${i < s.ki ? 'on' : ''}"></i>`).join('')}</div>`
    const hand = $a('.ar-hand'); hand.innerHTML = ''
    const f = act(s), rc = X.tierCol(f.card.r), fx = Math.round((f.card.fx ?? .5) * 100), fy = Math.round((f.card.fy ?? .22) * 100)
    const KIND = { strike: ['PHYSICAL', '#ff3d4a', '#ff9a3a'], blast: ['ENERGY', '#ffb020', '#fff04a'], guard: ['DEFENSE', '#20e0a0', '#a8ffda'], special: ['SIGNATURE', tcol(f.card), '#ffffff'] }
    s.hand.forEach((a, i) => {
      const d = ARTS[a], sp = a === 'special', [kind, c1, c2] = KIND[a], b = document.createElement('button')
      b.className = 'art2 ' + a
      b.style.cssText = `--c1:${c1};--c2:${c2};--rc:${rc};--i:${i - (s.hand.length - 1) / 2};--art:url("${f.card.url}");--fx:${fx}%;--fy:${fy}%`
      b.innerHTML = `<span class="fr"></span><span class="pic"></span><span class="holo"></span><span class="glints"><i></i><i></i><i></i><i></i></span>
        <span class="gem"><b>${d.cost}</b></span><span class="kind">${kind}</span>
        <span class="sym">${ICON[a]}</span>
        <span class="plate"><b>${sp ? f.card.mv : d.name}</b><small>${sp ? (isAoe(f.card) ? 'HITS ALL ENEMIES' : 'MASSIVE SINGLE HIT') : d.desc.toUpperCase()}</small></span>`
      b.disabled = !my || s.ki < d.cost
      b.onclick = () => doArt(i)
      hand.append(b)
    })
    const u = $a('.ar-ult'); u.disabled = !my || s.gauge < GAUGE_MAX; u.classList.toggle('ready', s.gauge >= GAUGE_MAX)
    u.style.setProperty('--g', s.gauge / GAUGE_MAX); u.querySelector('small').textContent = s.gauge >= GAUGE_MAX ? ultOf(f.card)[0] : Math.floor(s.gauge) + '%'; u.title = ultOf(f.card).join(': ')
    $a('.ar-end').disabled = !my
    $a('.ar-turn').textContent = 'TURN ' + B.turn
  }
  function draw() { hud('ai', B.ai); hud('you', B.you); field('ai', B.ai); field('you', B.you); controls() }

  function inspect(f, side, onSwitch) {
    if (B.busy && !onSwitch) { }
    const o = document.createElement('div'); o.className = 'insp'
    const foe = act(side === 'you' ? B.ai : B.you), mu = matchup(f, foe), t = tOf(f.card)
    o.innerHTML = `<div class="insp-card"></div><div class="insp-info"><span class="tp" style="--tc:${tcol(f.card)}">${tname(f.card)}</span><h3>${f.card.name}</h3><small>${f.card.ver}</small>
      <div class="ihp"><i style="width:${f.hp / f.max * 100}%"></i><span>${f.hp.toLocaleString()} / ${f.max.toLocaleString()} HP</span></div>
      <div class="ist">${['PWR', 'SPD', 'ENG', 'TEC', 'DEF', 'IQ'].map((k, i) => `<div><span>${k}</span><b>${[f.pwr, f.spd, f.ki, f.tec, f.def, f.iq][i]}</b></div>`).join('')}</div>
      <div class="imv"><b>${f.card.mv}</b><p>${(f.card.tx || []).join(' ')}</p></div>
      <div class="imu"><span>STRONG VS <b>${(TYPE[RING[(RING.indexOf(t) + 1) % RING.length]] || {}).en || ''}</b></span><span>WEAK TO <b>${(TYPE[weakTo(t)] || {}).en || ''}</b></span>${foe && f !== foe ? `<em class="${mu > 1 ? 'adv' : mu < 1 ? 'weak' : ''}">${mu > 1 ? 'Advantage vs ' + foe.card.name : mu < 1 ? 'Weak vs ' + foe.card.name : 'Neutral vs ' + foe.card.name}</em>` : ''}</div>
      <div class="ibtn"></div></div>`
    o.querySelector('.insp-card').append(img(f, 520))
    const bb = o.querySelector('.ibtn')
    if (onSwitch) { const s2 = document.createElement('button'); s2.className = 'btn gold'; s2.textContent = 'SWITCH IN'; s2.onclick = () => { o.remove(); onSwitch() }; bb.append(s2) }
    const c = document.createElement('button'); c.className = 'btn dark'; c.textContent = 'CLOSE'; c.onclick = () => o.remove(); bb.append(c)
    o.onclick = e => { if (e.target === o) o.remove() }
    ov.append(o)
  }
  const FX = () => ov.querySelector('.fxl')
  const ctr = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] }
  function shake(level) { ov.classList.remove('shk1', 'shk2', 'shk3'); void ov.offsetWidth; ov.classList.add('shk' + level); setTimeout(() => ov.classList.remove('shk' + level), 600) }
  function wash(col, strong) { const w = document.createElement('div'); w.className = 'wash' + (strong ? ' strong' : ''); w.style.setProperty('--wc', col); FX().append(w); setTimeout(() => w.remove(), 900) }
  function sparks(el, col, n = 16) {
    const [x, y] = ctr(el)
    for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.className = 'spk'; const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120; p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--sc:${col};animation-delay:${Math.random() * .06}s`; FX().append(p); setTimeout(() => p.remove(), 800) }
    const ring = document.createElement('i'); ring.className = 'impact'; ring.style.cssText = `left:${x}px;top:${y}px;--sc:${col}`; FX().append(ring); setTimeout(() => ring.remove(), 600)
  }
  function slashes(el, col) {
    const [x, y] = ctr(el)
    for (let i = 0; i < 3; i++) { const sl = document.createElement('i'); sl.className = 'slash'; sl.style.cssText = `left:${x}px;top:${y + (i - 1) * 26}px;--sc:${col};--rot:${-28 + i * 14}deg;animation-delay:${i * .06}s`; FX().append(sl); setTimeout(() => sl.remove(), 700) }
  }
  function beam(from, to, col, wide) {
    const [x1, y1] = ctr(from), [x2, y2] = ctr(to), len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1)
    const b = document.createElement('i'); b.className = 'beam' + (wide ? ' wide' : ''); b.style.cssText = `left:${x1}px;top:${y1}px;width:${len}px;transform:rotate(${ang}rad);--sc:${col}`; FX().append(b); setTimeout(() => b.remove(), 650)
  }
  function cutin(card, move, sub, col, ult, uname) {
    const foe = sub === 'ENEMY', c = document.createElement('div'); c.className = 'cut2' + (ult ? ' ult' : '') + (foe ? ' foe' : '')
    c.style.setProperty('--cc', col)
    c.innerHTML = `<div class="c2-dim"></div><div class="c2-light"></div><div class="c2-line l1"></div><div class="c2-line l2"></div>
      <div class="c2-card"><img alt=""></div>
      <div class="c2-txt"><small>${foe ? 'ENEMY · ' : ''}${ult ? (uname || 'ULTIMATE') + ' · ULTIMATE' : 'SPECIAL ART'}</small><b>${move}</b><span>${card.name}<em>${card.ver}</em></span></div>`
    thumbURL(card, 560).then(u => c.querySelector('img').src = u)
    FX().append(c)
    setTimeout(() => c.classList.add('out'), ult ? 1150 : 850); setTimeout(() => c.remove(), ult ? 1500 : 1200)
  }
  function banner(text, sub, col) { const b = document.createElement('div'); b.className = 'mvban'; b.style.setProperty('--bc', col); b.innerHTML = `<small>${sub}</small><b>${text}</b>`; FX().append(b); setTimeout(() => b.remove(), 1300) }
  function chainPop(side, n, combo) {
    const c = document.createElement('div'); c.className = 'chainpop ' + side + (combo ? ' combo' : '')
    c.innerHTML = combo ? `<small>COMBO</small><b>${combo}</b>` : `<b>${n}</b><small>CHAIN · +${Math.min(32, (n - 1) * 8)}%</small>`
    FX().append(c); setTimeout(() => c.remove(), 1200); if (combo) sfx('bcharge')
  }
  function turnBanner(text, mine) { const t = document.createElement('div'); t.className = 'tban ' + (mine ? 'you' : 'ai'); t.innerHTML = `<b>${text}</b>`; FX().append(t); setTimeout(() => t.remove(), 1100) }
  function floatTag(el, text, cls) { const [x, y] = ctr(el); const t = document.createElement('div'); t.className = 'ftag ' + cls; t.textContent = text; t.style.left = x + 'px'; t.style.top = (y - 70) + 'px'; FX().append(t); setTimeout(() => t.remove(), 1200) }

  async function show(ev) {
    if (ev.swap) { log('Enemy switched fighters'); sfx('bswitch'); draw(); await wait(500); return }
    const side = ev.who, other = side === 'you' ? 'ai' : 'you'
    const atk = $a(`.ar-side.${side} .ar-active`)
    if (ev.guard) { log(`${act(B[side]).card.name} braces · GUARD`); sfx('bguard'); atk.classList.add('guarding'); await wait(450); atk.classList.remove('guarding'); draw(); return }
    const big = ev.art === 'special' || ev.art === 'ultimate', A = act(B[side]), col = tcol(A.card)
    const tgtEl = $a(`.ar-side.${other} .ar-active`)
    log(big ? `${ev.art === 'ultimate' ? ev.ult + ' · ' : ''}${ev.move}` : `${A.card.name} · ${ARTS[ev.art].name}`)
    if (ev.chain > 1 || ev.combo) chainPop(side, ev.chain, ev.combo)
    // 1) the attacker card pops up and spins
    atk.style.setProperty('--ac', col)
    const [tx, ty] = ctr(tgtEl), [ax, ay] = ctr(atk)
    // 1) wind-up: specials/ultimates gather energy into the card first
    if (ev.art === 'ultimate') { ov.classList.add('ult'); sfx('bcharge'); atk.classList.add('charging'); FXC.gather(ax, ay, col, .7, 34); FXC.screen(col, .22, .6); cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'ULTIMATE', col, true, ev.ult); await wait(1350) }
    else if (big) { sfx('bcharge'); atk.classList.add('charging'); FXC.gather(ax, ay, col, .55, 24); cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'SPECIAL', col); await wait(1000) }
    // 2) the card itself dashes into the target and slams it
    const reach = ev.art === 'blast' ? .42 : .82
    atk.style.setProperty('--dx', ((tx - ax) * reach) + 'px'); atk.style.setProperty('--dy', ((ty - ay) * reach) + 'px')
    atk.classList.remove('dash', 'dashbig', 'charging'); void atk.offsetWidth; atk.classList.add(big ? 'dashbig' : 'dash')
    await wait(big ? 260 : 200)
    sfx(ev.art === 'strike' ? 'bhit' : ev.art === 'blast' ? 'bblast' : 'bimpact', ev.art === 'ultimate')
    if (ev.art === 'ultimate') { ov.classList.remove('iframe'); void ov.offsetWidth; ov.classList.add('iframe'); setTimeout(() => ov.classList.remove('iframe'), 90) }
    if (big) { ov.classList.remove('punch'); void ov.offsetWidth; ov.classList.add('punch'); setTimeout(() => ov.classList.remove('punch'), 420); FXC.screen('#ffffff', ev.art === 'ultimate' ? .35 : .18, .25) }
    setTimeout(() => atk.classList.remove('dash', 'dashbig'), 700)
    ST3 && ST3.hit(other, big)
    shake(ev.art === 'ultimate' ? 3 : big ? 2 : 1)
    for (const x of ev.hits) {
      const isActive = x.t === act(B[other])
      const tgt = isActive ? tgtEl : $a(`.ar-side.${other} .ar-bench`)
      tgt.classList.remove('hurt'); void tgt.offsetWidth; tgt.classList.add('hurt')
      { const [hx, hy] = ctr(tgt); FXC.hit(hx, hy, x.crit ? '#ff5a6a' : big ? '#ffc840' : col, !isActive ? .7 : ev.art === 'ultimate' ? 2.3 : big ? 1.6 : ev.art === 'blast' ? 1.15 : .9) }
      const n = document.createElement('div'); n.className = 'dmg' + (x.crit ? ' crit' : '') + (big ? ' big' : '') + (x.mu > 1 ? ' adv' : ''); n.innerHTML = `<b>${x.dmg.toLocaleString()}</b>`; n.style.animationDelay = (ev.hits.indexOf(x) * .09) + 's'
      const r = tgt.getBoundingClientRect(); n.style.left = (r.left + r.width / 2) + 'px'; n.style.top = (r.top + r.height * .35) + 'px'
      ov.append(n); setTimeout(() => n.remove(), 1100)
      if (isActive && x.crit) floatTag(tgt, 'CRITICAL!', 'crit')
      else if (isActive && x.mu > 1) floatTag(tgt, 'SUPER EFFECTIVE', 'adv')
      else if (isActive && x.mu < 1) floatTag(tgt, 'RESISTED', 'weak')
    }
    if (ev.rally) floatTag(atk, 'TEAM HEALED 20%', 'adv')
    if (ev.fort) floatTag(atk, 'FORTRESS · -30% DMG', 'adv')
    if (ev.kit && ev.kit.length) { const [kx, ky] = ctr(atk); const t = document.createElement('div'); t.className = 'ftag kit'; t.textContent = ev.kit.join('  ·  '); t.style.left = kx + 'px'; t.style.top = (ky - 90) + 'px'; FX().append(t); setTimeout(() => t.remove(), 1500) }
    ov.classList.remove('ult')
    draw(); await wait(big ? 650 : 420)
    // knockouts
    const foe = B[other]
    if (act(foe).ko) {
      sfx('bko'); shake(3); { const [kx, ky] = ctr(tgtEl); FXC.ko(kx, ky) } ST3 && ST3.ko(other); log(`${act(foe).card.name} is knocked out!`)
      $a(`.ar-side.${other} .ar-active`).classList.add('kod'); await wait(700); $a(`.ar-side.${other} .ar-active`).classList.remove('kod')
      if (!nextAlive(foe)) return end(other === 'ai')
      if (other === 'you') { await pickReplacement() } else { log(`Enemy sends out ${act(foe).card.name}`); sfx('nav') }
      draw(); await wait(400)
    }
  }
  function pickReplacement() {
    return new Promise(res => {
      log('Your fighter is down. Choose who goes in next.')
      const best = B.you.team.map((f, i) => [f, i]).filter(([f]) => !f.ko)
      B.you.active = best[0][1]; draw()
      // the first healthy one is sent in; the player can still switch once next turn
      setTimeout(res, 500)
    })
  }
  async function doArt(i) {
    if (B.busy || B.over) return
    B.busy = true; controls()
    const ev = playArt(B, 'you', i); if (ev) await show(ev)
    B.busy = false; if (!B.over) controls()
  }
  async function doSwitch(i) {
    if (B.busy || B.over || B.you.switched || B.you.team[i].ko) return
    B.you.active = i; B.you.switched = true; sfx('bswitch'); log(`Go, ${act(B.you).card.name}!`); draw()
  }
  $a('.ar-ult').onclick = async () => { if (B.busy || B.over) return; B.busy = true; controls(); const e = ultimate(B, 'you'); if (e) await show(e); B.busy = false; if (!B.over) controls() }
  const mb = $a('.ar-mute'), mdraw = () => { mb.textContent = sfxOn() ? '🔊 SOUND' : '🔇 MUTED'; mb.classList.toggle('off', !sfxOn()) }
  mb.onclick = () => { sfxOn(!sfxOn()); mdraw() }; mdraw()
  $a('.ar-end').onclick = () => endTurn()
  $a('.ar-quit').onclick = () => { if (B.over || confirm('Quit this battle? It counts as a loss.')) close() }
  function close() {
    if (stage.pvp) { FXC.dispose(); document.body.classList.remove('in-battle'); B.closed = true; ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('players'); return } FXC.dispose(); document.body.classList.remove('in-battle'); B.closed = true; ST3 && ST3.dispose(); ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('battle') }

  async function aiPhase() {
    B.busy = true; controls()
    const s = B.ai; s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN); refill(s); s.switched = false; s.seq = []; startTurn(s); act(B.you).fort = 0
    log('Enemy turn'); turnBanner('ENEMY TURN', false); draw(); await wait(800)
    for (const ev of aiTurn(B, stage.level)) { if (B.over) return; await show(ev); if (B.over) return }
    B.turn++
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN); refill(y); y.switched = false; y.seq = []; startTurn(y); act(B.ai).fort = 0
    B.busy = false; log('Your turn'); turnBanner('YOUR TURN', true); sfx('bturn'); draw(); if (AUTO) autoTurn()
  }
  async function endTurn() { if (B.busy || B.over) return; await aiPhase() }
  function startTurn(s) { const p = passives(s), a = act(s); if (p.heal && !a.ko) a.hp = Math.min(a.max, a.hp + Math.round(a.max * p.heal / 100)); if (p.gauge) s.gauge = Math.min(GAUGE_MAX, s.gauge + p.gauge) }
  async function autoTurn() {
    if (!AUTO || B.busy || B.over) return
    B.busy = true; controls(); await wait(350)
    for (const ev of planTurn(B, 4, 'you')) { if (B.over) return; await show(ev); if (B.over) return }
    B.busy = false; if (!B.over && AUTO) await aiPhase()
  }
  { const sb = $a('.ar-speed'), sd = () => { sb.textContent = SPEED + '×'; sb.classList.toggle('on', SPEED > 1) }; sb.onclick = () => { SPEED = SPEED === 1 ? 2 : SPEED === 2 ? 3 : 1; try { localStorage.setItem('aut-bspeed', SPEED) } catch { } ov.style.setProperty('--spd', SPEED); sd() }; ov.style.setProperty('--spd', SPEED); sd()
    const ab = $a('.ar-auto'); ab.onclick = () => { AUTO = !AUTO; ab.classList.toggle('on', AUTO); ab.textContent = AUTO ? 'AUTO ON' : 'AUTO'; if (AUTO && !B.busy && !B.over) autoTurn() } }

  async function end(won) {
    B.over = true; controls()
    await wait(500)
    const r = stage.pvp ? await X.act('pvp', { won, name: stage.name }) : await X.act('battle', { stage: stage.n, won })
    sfx(won ? 'claim' : 'error')
    const mvp = B.you.team.slice().sort((a, b) => b.dealt - a.dealt)[0], dealt = B.you.team.reduce((n, f) => n + f.dealt, 0), kos = B.you.team.reduce((n, f) => n + f.kos, 0)
    const box = document.createElement('div'); box.className = 'ar-result ' + (won ? 'win' : 'lose')
    box.innerHTML = `<div class="rs-burst"></div><h2>${won ? 'VICTORY' : 'DEFEAT'}</h2><p>${won ? (r.msg || 'Stage cleared.') : 'Your team was knocked out. Tweak your lineup and try again.'}</p>
      <div class="rs-body"><div class="rs-mvp"><span>MVP</span><div class="rs-card"></div><b>${mvp.card.name}</b><small>${mvp.dealt.toLocaleString()} DMG · ${mvp.kos} KO</small></div>
      <div class="rs-stats"><div><b>${B.turn}</b><span>TURNS</span></div><div><b>${dealt.toLocaleString()}</b><span>TOTAL DAMAGE</span></div><div><b>${kos}</b><span>KNOCKOUTS</span></div><div><b>${B.you.team.filter(f => !f.ko).length}/6</b><span>SURVIVED</span></div></div></div>`
    box.querySelector('.rs-card').append(img(mvp, 360))
    const b = document.createElement('button'); b.className = 'btn gold'; b.textContent = 'CONTINUE'; b.onclick = close; box.append(b)
    ov.append(box)
  }

  arenaImgs().then(list => {
    let name = ARENAS[AR].name, sub = ARENAS[AR].sub
    if (list.length) {
      const pick = stage.pvp || !stage.n ? list[Math.floor(Math.random() * list.length)] : list[(stage.n - 1) % list.length]
      ov.classList.add('has-img'); ov.style.setProperty('--bgimg', `url("${pick.url}")`); name = pick.name; sub = stage.pvp ? 'Ranked Arena' : 'Stage ' + stage.n
      // measure how bright the art is and pick a light or dark UI theme to match
      const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = 32; c.height = 18; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 18); const d = x.getImageData(0, 0, 32, 18).data; let L = 0; for (let i = 0; i < d.length; i += 4) L += (.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]) / 255; L /= d.length / 4; ov.classList.toggle('lite', L > .42); ov.style.setProperty('--lum', L.toFixed(2)) } catch { } }; im.src = pick.url
    }
    const t = document.createElement('div'); t.className = 'arena-title'; t.innerHTML = `<small>ARENA</small><b>${name}</b><span>${sub}</span>`; ov.append(t); setTimeout(() => t.remove(), 2300)
  })
  draw()
  if (youFirst) { log(`You move first (${act(B.you).card.name} is faster)`) }
  else { log(`${act(B.ai).card.name} is faster · enemy moves first`); setTimeout(aiPhase, 900) }
}

// ---------------- tutorial ----------------
const STEPS = [
  { t: 'THE GOAL', d: 'Battles are 6 vs 6. You fight with <b>one active fighter</b> while the other 5 wait on the <b>bench</b>. Knock out <b>all 6</b> enemy fighters to win.', ic: '🏆' },
  { t: 'TURNS & ENERGY', d: 'You and the enemy take turns. Every turn you gain <b>+3 Energy</b> (the blue bar, max 10). Energy you don\'t spend carries over, so you can save up for a big turn.', ic: '⚡' },
  { t: 'ARTS CARDS', d: 'You hold <b>4 Arts cards</b>, refilled each turn. Tap one to use it; the number in the corner is its Energy cost.<br><span class="tk s">STRIKE</span> 1 Energy · quick hit using PWR<br><span class="tk b">BLAST</span> 2 Energy · stronger energy attack using ENG<br><span class="tk g">GUARD</span> 1 Energy · halves the next hit you take<br><span class="tk p">SPECIAL</span> 4 Energy · your fighter\'s signature move', ic: '🃏' },
  { t: 'SPECIALS', d: 'Each fighter\'s Special uses their real card move. Moves that say <b>"all enemies"</b> hit the active fighter <b>and</b> splash the whole enemy bench.', ic: '💥' },
  { t: 'ULTIMATE', d: 'Dealing and taking damage fills the <b>purple gauge</b> under your HP. When it turns <b>gold</b>, the ULTIMATE button lights up: a huge free attack that costs no Energy.', ic: '🌟' },
  { t: 'SWITCHING', d: 'Tap a fighter on <b>your bench</b> to swap them in, <b>once per turn</b>, free. Swap out a hurt fighter to save them, or bring in someone stronger. When a fighter is KO\'d, the next one comes in automatically.', ic: '🔄' },
  { t: 'WHO GOES FIRST', d: 'The fighter with the higher <b>SPD</b> stat moves first. Stronger cards also have more HP, so a well-built team matters. Use <b>Auto Build</b> on My Team if you\'re unsure.', ic: '🏃' },
  { t: 'TIPS', d: '• Save Energy for a Special instead of spending it all on Strikes.<br>• Guard before the enemy\'s turn when your fighter is low.<br>• Fire your Ultimate as soon as it\'s ready.<br>• Hit <b>END TURN</b> when you\'re done.<br><br>Clear stages for coins, and the first clear of stages 5, 8 and 10 gives free packs.', ic: '💡' },
]
export function tutorial(onDone) {
  const ov = document.createElement('div'); ov.className = 'tut'; let i = 0
  const draw = () => {
    const s = STEPS[i]
    ov.innerHTML = `<div class="tut-card"><div class="tut-ic">${s.ic}</div><span class="tut-n">HOW TO PLAY · ${i + 1} / ${STEPS.length}</span><h3>${s.t}</h3><p>${s.d}</p>
      <div class="tut-dots">${STEPS.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tut-btns"><button class="tut-skip">${i ? 'BACK' : 'SKIP'}</button><button class="tut-next">${i === STEPS.length - 1 ? "LET'S FIGHT" : 'NEXT'}</button></div></div>`
    ov.querySelector('.tut-next').onclick = () => { sfx('click'); if (i < STEPS.length - 1) { i++; draw() } else close() }
    ov.querySelector('.tut-skip').onclick = () => { sfx('soft'); if (i) { i--; draw() } else close() }
  }
  const close = () => { try { localStorage.setItem('aut-tut', '1') } catch { } ov.remove(); onDone && onDone() }
  draw(); document.body.append(ov)
}
export const seenTutorial = () => { try { return localStorage.getItem('aut-tut') === '1' } catch { return false } }
