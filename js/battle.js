// AUT Battle — turn-based hybrid of DB Legends (Arts cards, Ki, Ultimates, switching) and TCG Pocket (turns, energy, bench).
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
  blast: { name: 'BLAST', cost: 2, col: '#ffc23a', desc: 'Ki blast · KI' },
  guard: { name: 'GUARD', cost: 1, col: '#3dffa0', desc: 'Halve the next hit' },
  special: { name: 'SPECIAL', cost: 4, col: '#4aa8ff', desc: 'Signature move' },
}
const pctOf = c => { const m = /(\d+)%\s*PWR/.exec((c.tx || []).join(' ')); return m ? +m[1] : 220 }
const isAoe = c => /all enemies/i.test((c.tx || []).join(' '))
function fighter(card, lvl = 0) {
  const [pwr, spd, ki, tec, def, iq] = card.st || [70, 70, 70, 70, 70, 70]
  const hp = Math.round(card.ovr * 40 + def * 12 + (card.tag ? 600 : 0))
  return { card, key: card.key, hp, max: hp, pwr, spd, ki, tec, def, iq, guard: 0, ko: false, lvl }
}
function drawArt(f) {
  // the fighter's role nudges which arts show up (fighters strike, supports blast/guard)
  const r = Math.random(), role = f.card.role
  if (r < .14) return 'special'
  if (r < (role === 'TANK' || role === 'SUPPORT' ? .34 : .24)) return 'guard'
  if (r < (role === 'SHOOTER' || role === 'SUPPORT' ? .64 : .52)) return 'blast'
  return 'strike'
}
function newSide(cards) { return { team: cards.map(c => fighter(c)), active: 0, ki: 4, gauge: 0, hand: [], switched: false } }
const act = s => s.team[s.active]
const alive = s => s.team.filter(f => !f.ko)
function refill(s) { while (s.hand.length < HAND) s.hand.push(drawArt(act(s))) }
function hit(att, def, base, stat) {
  const crit = Math.random() < .08 + att.tec / 1200
  const mu = matchup(att, def)
  let dmg = base * (stat / 80) * (100 / (60 + def.def * .5)) * (0.92 + Math.random() * .16) * (crit ? 1.5 : 1) * mu
  if (def.guard) { dmg *= .5; def.guard = 0 }
  dmg = Math.max(1, Math.round(dmg))
  def.hp = Math.max(0, def.hp - dmg); if (def.hp === 0) def.ko = true
  return { dmg, crit, mu }
}
// returns a list of events for the UI to animate
function playArt(B, who, idx) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], art = me.hand[idx], cost = ARTS[art].cost, a = act(me), d = act(foe)
  if (me.ki < cost || a.ko || d.ko) return null
  me.ki -= cost; me.hand.splice(idx, 1)
  const ev = { who, art, hits: [] }
  if (art === 'guard') { a.guard = 1; ev.guard = true }
  else if (art === 'strike') ev.hits.push({ t: d, ...hit(a, d, 260, a.pwr) })
  else if (art === 'blast') ev.hits.push({ t: d, ...hit(a, d, 420, a.ki) })
  else if (art === 'special') {
    const base = pctOf(a.card) * 3.2
    ev.move = a.card.mv
    if (isAoe(a.card)) for (const t of alive(foe)) ev.hits.push({ t, ...hit(a, t, t === d ? base * .75 : base * .3, Math.max(a.pwr, a.ki)) })
    else ev.hits.push({ t: d, ...hit(a, d, base, Math.max(a.pwr, a.ki)) })
  }
  const dealt = ev.hits.reduce((n, x) => n + x.dmg, 0)
  me.gauge = Math.min(GAUGE_MAX, me.gauge + 6 + dealt / 90); foe.gauge = Math.min(GAUGE_MAX, foe.gauge + dealt / 140)
  return ev
}
function ultimate(B, who) {
  const me = B[who], foe = B[who === 'you' ? 'ai' : 'you'], a = act(me), d = act(foe)
  if (me.gauge < GAUGE_MAX || a.ko || d.ko) return null
  me.gauge = 0
  const ev = { who, art: 'ultimate', move: a.card.mv, hits: [] }
  const base = pctOf(a.card) * 6
  if (isAoe(a.card)) for (const t of alive(foe)) ev.hits.push({ t, ...hit(a, t, t === d ? base * .8 : base * .35, Math.max(a.pwr, a.ki)) })
  else ev.hits.push({ t: d, ...hit(a, d, base, Math.max(a.pwr, a.ki)) })
  return ev
}
function nextAlive(s) { const i = s.team.findIndex(f => !f.ko); if (i >= 0) s.active = i; return i >= 0 }

// ---------------- AI ----------------
function aiTurn(B, level) {
  const me = B.ai, evs = []
  const smart = level >= 3
  // swap out a nearly dead fighter if a healthier bench member exists
  if (smart && !me.switched && act(me).hp / act(me).max < .22) {
    const best = me.team.map((f, i) => [f, i]).filter(([f, i]) => !f.ko && i !== me.active).sort((x, y) => y[0].hp - x[0].hp)[0]
    if (best) { me.active = best[1]; me.switched = true; evs.push({ who: 'ai', swap: true }) }
  }
  let guard = 0
  for (let n = 0; n < 6; n++) {
    if (act(B.you).ko) break
    if (me.gauge >= GAUGE_MAX && Math.random() < .9) { const e = ultimate(B, 'ai'); if (e) { evs.push(e); continue } }
    const order = me.hand.map((a, i) => [a, i]).filter(([a]) => ARTS[a].cost <= me.ki)
    if (!order.length) break
    // prefer special, then the most damage per ki; guard once if low HP
    order.sort((x, y) => (y[0] === 'special') - (x[0] === 'special') || (y[0] === 'blast') - (x[0] === 'blast'))
    let pick = order[0]
    const g = order.find(([a]) => a === 'guard')
    if (g && !guard && act(me).hp / act(me).max < .5 && Math.random() < .6) pick = g
    if (pick[0] === 'guard') guard++
    if (!smart && Math.random() < .25 && order.length > 1) pick = order[order.length - 1]
    const e = playArt(B, 'ai', pick[1]); if (!e) break; evs.push(e)
  }
  return evs
}

// ---------------- story ----------------
const STAGES = [
  { n: 1, name: 'Training Grounds', rating: 70, level: 1, coins: 1500 },
  { n: 2, name: 'Street Brawl', rating: 74, level: 1, coins: 2000 },
  { n: 3, name: 'Rival Academy', rating: 78, level: 2, coins: 2500 },
  { n: 4, name: 'Tournament Prelims', rating: 81, level: 2, coins: 3000 },
  { n: 5, name: 'Villain Hideout', rating: 84, level: 3, coins: 4000, pack: 'standard' },
  { n: 6, name: 'Shinobi War', rating: 86, level: 3, coins: 5000 },
  { n: 7, name: 'Cursed Domain', rating: 88, level: 3, coins: 6000 },
  { n: 8, name: 'Grand Line Showdown', rating: 90, level: 4, coins: 7500, pack: 'premium' },
  { n: 9, name: 'Tournament of Power', rating: 93, level: 4, coins: 10000 },
  { n: 10, name: 'Gods of Destruction', rating: 96, level: 5, coins: 15000, pack: 'premium' },
]
function enemyTeam(stage) {
  const pool = X.POOL.slice().sort((a, b) => Math.abs(a.ovr - stage.rating) - Math.abs(b.ovr - stage.rating))
  const near = pool.slice(0, Math.max(14, Math.round(pool.length * .25)))
  const out = []; while (out.length < 6 && near.length) out.push(near.splice(Math.floor(Math.random() * near.length), 1)[0])
  return out.sort((a, b) => b.ovr - a.ovr)
}

export function battlePage(el) {
  const { h, P } = X
  const prog = (P.battle && P.battle.cleared) || 0
  const team = P.team.filter(Boolean)
  const hero = h('section', 'bhero', `<div><span class="sh-tag">STORY MODE</span><h2>BATTLE</h2><p>Turn-based fights with Arts cards. Build Ki, play Strikes, Blasts and Specials, fill your gauge for an Ultimate, and knock out all 6 enemy fighters.</p></div><div class="bstat"><b>${prog}</b><span>/ ${STAGES.length} CLEARED</span></div>`)
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
    r.innerHTML = `<span class="sn">${String(s.n).padStart(2, '0')}</span><div class="si"><b>${s.name}</b><small>Enemy rating ~${s.rating} · AI level ${s.level}</small></div><div class="sr">${done ? '<em>CLEARED</em>' : ''}<span><i class="coin-i"></i>${(done ? Math.round(s.coins / 3) : s.coins).toLocaleString()}</span>${s.pack && !done ? `<span class="pk">+ ${s.pack === 'premium' ? 'PREMIUM' : ''} PACK</span>` : ''}</div>`
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

  const ov = h('div', ''); ov.id = 'arena'
  ov.innerHTML = `<div class="stage3"><div class="st-sky"></div><div class="st-pillars"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="st-floor"><div class="st-plat"><i class="r1"></i><i class="r2"></i><i class="mid"></i><i class="pad ai"></i><i class="pad you"></i></div></div></div>
    <header class="ar-top"><button class="ar-quit">✕ QUIT</button><button class="ar-mute"></button><span class="ar-stage">STAGE ${stage.n} · ${stage.name.toUpperCase()}</span><span class="ar-turn"></span></header>
    <div class="ar-plate ai"><span class="pn">ENEMY · ${stage.name.toUpperCase()}</span><span class="pk"></span></div><div class="ar-side ai"><div class="ar-bench"></div><div class="ar-active"></div><div class="ar-hud"></div></div>
    <div class="ar-mid"><div class="ar-log"></div></div>
    <div class="ar-side you"><div class="ar-hud"></div><div class="ar-active"></div><div class="ar-bench"></div></div><div class="ar-plate you"><span class="pn">YOU</span><span class="pk"></span></div>
    <footer class="ar-ctrl"><div class="ar-ki"></div><div class="ar-hand"></div><div class="ar-btns"><button class="ar-ult"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44"/></svg><b>ULT</b><small></small></button><button class="ar-end"><b>END</b><small>TURN</small></button></div></footer><div class="fxl"></div>`
  document.body.append(ov); document.body.classList.add('in-battle')
  const $a = s => ov.querySelector(s)
  let ST3 = null
  const FXC = createFX(ov)
  // 3D engine removed for performance; the stage is a static CSS scene
  const log = t => { const l = $a('.ar-log'); l.textContent = t; l.classList.remove('pop'); void l.offsetWidth; l.classList.add('pop') }
  const wait = ms => new Promise(r => setTimeout(r, ms))
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
    $a('.ar-ki').innerHTML = `<div class="kring" style="--k:${s.ki / KI_MAX}"><b>${s.ki}</b><small>KI</small></div><div class="kpips">${Array.from({ length: KI_MAX }, (_, i) => `<i class="${i < s.ki ? 'on' : ''}"></i>`).join('')}</div>`
    const hand = $a('.ar-hand'); hand.innerHTML = ''
    const f = act(s), rc = X.tierCol(f.card.r), fx = Math.round((f.card.fx ?? .5) * 100), fy = Math.round((f.card.fy ?? .22) * 100)
    const KIND = { strike: ['PHYSICAL', '#ff3d4a', '#ff9a3a'], blast: ['KI BLAST', '#ffb020', '#fff04a'], guard: ['DEFENSE', '#20e0a0', '#a8ffda'], special: ['SIGNATURE', tcol(f.card), '#ffffff'] }
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
    u.style.setProperty('--g', s.gauge / GAUGE_MAX); u.querySelector('small').textContent = Math.floor(s.gauge) + '%'
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
      <div class="ist">${['PWR', 'SPD', 'KI', 'TEC', 'DEF', 'IQ'].map((k, i) => `<div><span>${k}</span><b>${[f.pwr, f.spd, f.ki, f.tec, f.def, f.iq][i]}</b></div>`).join('')}</div>
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
  function cutin(card, move, sub, col, ult) {
    const c = document.createElement('div'); c.className = 'cutin' + (ult ? ' ult' : '') + (sub === 'ENEMY' ? ' foe' : '')
    c.style.cssText = `--cc:${col};--art:url("${card.url}");--fx:${Math.round((card.fx ?? .5) * 100)}%;--fy:${Math.round((card.fy ?? .22) * 100)}%`
    c.innerHTML = `<div class="ci-dim"></div><div class="ci-bar b1"></div><div class="ci-strip"><i></i></div><div class="ci-bar b2"></div>
      <div class="ci-txt"><small>${ult ? 'ULTIMATE ART' : 'SPECIAL ART'}</small><b>${move}</b><span>${card.name} · ${card.ver}</span></div>`
    FX().append(c); FXC.lines(innerWidth / 2, innerHeight / 2, col, ult ? 1.2 : .9)
    setTimeout(() => c.classList.add('out'), ult ? 1150 : 850); setTimeout(() => c.remove(), ult ? 1500 : 1200)
  }
  function banner(text, sub, col) { const b = document.createElement('div'); b.className = 'mvban'; b.style.setProperty('--bc', col); b.innerHTML = `<small>${sub}</small><b>${text}</b>`; FX().append(b); setTimeout(() => b.remove(), 1300) }
  function floatTag(el, text, cls) { const [x, y] = ctr(el); const t = document.createElement('div'); t.className = 'ftag ' + cls; t.textContent = text; t.style.left = x + 'px'; t.style.top = (y - 70) + 'px'; FX().append(t); setTimeout(() => t.remove(), 1200) }

  async function show(ev) {
    if (ev.swap) { log('Enemy switched fighters'); sfx('bswitch'); draw(); await wait(500); return }
    const side = ev.who, other = side === 'you' ? 'ai' : 'you'
    const atk = $a(`.ar-side.${side} .ar-active`)
    if (ev.guard) { log(`${act(B[side]).card.name} braces · GUARD`); sfx('bguard'); atk.classList.add('guarding'); await wait(450); atk.classList.remove('guarding'); draw(); return }
    const big = ev.art === 'special' || ev.art === 'ultimate', A = act(B[side]), col = tcol(A.card)
    const tgtEl = $a(`.ar-side.${other} .ar-active`)
    log(big ? `${ev.art === 'ultimate' ? 'ULTIMATE · ' : ''}${ev.move}` : `${A.card.name} · ${ARTS[ev.art].name}`)
    // 1) the attacker card pops up and spins
    atk.classList.remove('pop', 'popbig', 'lunge'); void atk.offsetWidth; atk.classList.add(big ? 'popbig' : 'pop')
    atk.style.setProperty('--ac', col)
    if (ev.art === 'ultimate') { ov.classList.add('ult'); ST3 && ST3.ult(side); sfx('bcharge'); FXC.screen(col, .35, .5); cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'ULTIMATE', col, true); shake(2); await wait(1350) }
    else if (big) { sfx('bcharge'); cutin(A.card, ev.move, side === 'ai' ? 'ENEMY' : 'SPECIAL', col); await wait(1000) }
    else await wait(300)
    // 2) the attack lands
    sfx(ev.art === 'strike' ? 'bhit' : ev.art === 'blast' ? 'bblast' : 'bimpact', ev.art === 'ultimate')
    const [tx, ty] = ctr(tgtEl), [ax, ay] = ctr(atk)
    if (ev.art === 'strike') FXC.slash(tx, ty, col)
    if (ev.art === 'blast') FXC.beam(ax, ay, tx, ty, col, 22)
    if (big) { FXC.beam(ax, ay, tx, ty, col, ev.art === 'ultimate' ? 90 : 56); FXC.screen('#ffffff', .25, .2) }
    if (big) await wait(140) // hit-stop: the beam connects, then everything detonates
    ST3 && ST3.hit(other, big)
    shake(ev.art === 'ultimate' ? 3 : big ? 2 : 1)
    for (const x of ev.hits) {
      const isActive = x.t === act(B[other])
      const tgt = isActive ? tgtEl : $a(`.ar-side.${other} .ar-bench`)
      tgt.classList.remove('hurt'); void tgt.offsetWidth; tgt.classList.add('hurt')
      { const [hx, hy] = ctr(tgt); FXC.hit(hx, hy, x.crit ? '#ff5a6a' : big ? '#ffc840' : col, !isActive ? .7 : ev.art === 'ultimate' ? 2.3 : big ? 1.6 : ev.art === 'blast' ? 1.15 : .9) }
      const n = document.createElement('div'); n.className = 'dmg' + (x.crit ? ' crit' : '') + (big ? ' big' : ''); n.textContent = x.dmg.toLocaleString()
      const r = tgt.getBoundingClientRect(); n.style.left = (r.left + r.width / 2) + 'px'; n.style.top = (r.top + r.height * .35) + 'px'
      ov.append(n); setTimeout(() => n.remove(), 1100)
      if (isActive && x.crit) floatTag(tgt, 'CRITICAL!', 'crit')
      else if (isActive && x.mu > 1) floatTag(tgt, 'SUPER EFFECTIVE', 'adv')
      else if (isActive && x.mu < 1) floatTag(tgt, 'RESISTED', 'weak')
    }
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
  function close() { FXC.dispose(); document.body.classList.remove('in-battle'); B.closed = true; ST3 && ST3.dispose(); ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('battle') }

  async function aiPhase() {
    B.busy = true; controls()
    const s = B.ai; s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN); refill(s); s.switched = false
    log('Enemy turn'); await wait(600)
    for (const ev of aiTurn(B, stage.level)) { if (B.over) return; await show(ev); if (B.over) return }
    B.turn++
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN); refill(y); y.switched = false
    B.busy = false; log('Your turn'); sfx('bturn'); draw()
  }
  async function endTurn() { if (B.busy || B.over) return; await aiPhase() }

  async function end(won) {
    B.over = true; controls()
    await wait(500)
    const r = await X.act('battle', { stage: stage.n, won })
    sfx(won ? 'claim' : 'error')
    const box = document.createElement('div'); box.className = 'ar-result ' + (won ? 'win' : 'lose')
    box.innerHTML = `<h2>${won ? 'VICTORY' : 'DEFEAT'}</h2><p>${won ? (r.msg || 'Stage cleared.') : 'Your team was knocked out. Tweak your lineup and try again.'}</p>`
    const b = document.createElement('button'); b.className = 'btn gold'; b.textContent = 'CONTINUE'; b.onclick = close; box.append(b)
    ov.append(box)
  }

  draw()
  if (youFirst) { log(`You move first (${act(B.you).card.name} is faster)`) }
  else { log(`${act(B.ai).card.name} is faster · enemy moves first`); setTimeout(aiPhase, 900) }
}

// ---------------- tutorial ----------------
const STEPS = [
  { t: 'THE GOAL', d: 'Battles are 6 vs 6. You fight with <b>one active fighter</b> while the other 5 wait on the <b>bench</b>. Knock out <b>all 6</b> enemy fighters to win.', ic: '🏆' },
  { t: 'TURNS & KI', d: 'You and the enemy take turns. Every turn you gain <b>+3 Ki</b> (the blue bar, max 10). Ki you don\'t spend carries over, so you can save up for a big turn.', ic: '⚡' },
  { t: 'ARTS CARDS', d: 'You hold <b>4 Arts cards</b>, refilled each turn. Tap one to use it; the number in the corner is its Ki cost.<br><span class="tk s">STRIKE</span> 1 Ki · quick hit using PWR<br><span class="tk b">BLAST</span> 2 Ki · stronger ki attack using KI<br><span class="tk g">GUARD</span> 1 Ki · halves the next hit you take<br><span class="tk p">SPECIAL</span> 4 Ki · your fighter\'s signature move', ic: '🃏' },
  { t: 'SPECIALS', d: 'Each fighter\'s Special uses their real card move. Moves that say <b>"all enemies"</b> hit the active fighter <b>and</b> splash the whole enemy bench.', ic: '💥' },
  { t: 'ULTIMATE', d: 'Dealing and taking damage fills the <b>purple gauge</b> under your HP. When it turns <b>gold</b>, the ULTIMATE button lights up: a huge free attack that costs no Ki.', ic: '🌟' },
  { t: 'SWITCHING', d: 'Tap a fighter on <b>your bench</b> to swap them in, <b>once per turn</b>, free. Swap out a hurt fighter to save them, or bring in someone stronger. When a fighter is KO\'d, the next one comes in automatically.', ic: '🔄' },
  { t: 'WHO GOES FIRST', d: 'The fighter with the higher <b>SPD</b> stat moves first. Stronger cards also have more HP, so a well-built team matters. Use <b>Auto Build</b> on My Team if you\'re unsure.', ic: '🏃' },
  { t: 'TIPS', d: '• Save Ki for a Special instead of spending it all on Strikes.<br>• Guard before the enemy\'s turn when your fighter is low.<br>• Fire your Ultimate as soon as it\'s ready.<br>• Hit <b>END TURN</b> when you\'re done.<br><br>Clear stages for coins, and the first clear of stages 5, 8 and 10 gives free packs.', ic: '💡' },
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
