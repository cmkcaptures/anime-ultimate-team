// AUT Battle — turn-based hybrid of DB Legends (Arts cards, Ki, Ultimates, switching) and TCG Pocket (turns, energy, bench).
// Win by knocking out all 6 enemy fighters. 1 active fighter + 5 on the bench each side.
import { TIER, thumbURL } from './cardkit.js'
import { sfx } from './sfx.js'
import { createArena } from './arena3d.js'

let X = null // app context: { h, $, cardImg, eff, BYKEY, POOL, P, act, go, toast, tierCol, ANAME }
export function initBattle(ctx) { X = ctx }

// ---------------- rules ----------------
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
  let dmg = base * (stat / 80) * (100 / (60 + def.def * .5)) * (0.92 + Math.random() * .16) * (crit ? 1.5 : 1)
  if (def.guard) { dmg *= .5; def.guard = 0 }
  dmg = Math.max(1, Math.round(dmg))
  def.hp = Math.max(0, def.hp - dmg); if (def.hp === 0) def.ko = true
  return { dmg, crit }
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
  ov.innerHTML = `<div class="ar-3d"></div><div class="ar-bg"></div>
    <header class="ar-top"><button class="ar-quit">✕ QUIT</button><span class="ar-stage">STAGE ${stage.n} · ${stage.name.toUpperCase()}</span><span class="ar-turn"></span></header>
    <div class="ar-plate ai"><span class="pn">ENEMY · ${stage.name.toUpperCase()}</span><span class="pk"></span></div><div class="ar-side ai"><div class="ar-bench"></div><div class="ar-active"></div><div class="ar-hud"></div></div>
    <div class="ar-mid"><div class="ar-log"></div></div>
    <div class="ar-side you"><div class="ar-hud"></div><div class="ar-active"></div><div class="ar-bench"></div></div><div class="ar-plate you"><span class="pn">YOU</span><span class="pk"></span></div>
    <footer class="ar-ctrl"><div class="ar-ki"></div><div class="ar-hand"></div><div class="ar-btns"><button class="ar-ult">ULTIMATE</button><button class="ar-end">END TURN</button></div></footer>`
  document.body.append(ov)
  const $a = s => ov.querySelector(s)
  let ST3 = null
  createArena(ov.querySelector('.ar-3d')).then(st => { if (B.closed) return st.dispose(); ST3 = st; ov.classList.add('has3d') }).catch(() => { })
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
    ov.querySelector('.ar-plate.' + side + ' .pk').innerHTML = s.team.map(g => `<i class="${g.ko ? 'ko' : ''}"></i>`).join('')
    const bn = $a(`.ar-side.${side} .ar-bench`); bn.innerHTML = ''
    s.team.forEach((g, i) => {
      if (i === s.active) return
      const b = document.createElement('button'); b.className = 'bslot' + (g.ko ? ' ko' : ''); b.append(img(g, 160))
      b.append(Object.assign(document.createElement('i'), { style: `width:${g.hp / g.max * 100}%` }))
      if (side === 'you' && !g.ko) b.onclick = () => doSwitch(i)
      bn.append(b)
    })
  }
  function controls() {
    const s = B.you, my = !B.busy && !B.over
    $a('.ar-ki').innerHTML = `<span>KI</span>` + Array.from({ length: KI_MAX }, (_, i) => `<i class="${i < s.ki ? 'on' : ''}"></i>`).join('') + `<b>${s.ki}</b>`
    const hand = $a('.ar-hand'); hand.innerHTML = ''
    s.hand.forEach((a, i) => {
      const d = ARTS[a], b = document.createElement('button'); b.className = 'art ' + a; b.style.setProperty('--ac', d.col)
      b.innerHTML = `<em>${d.cost}</em><b>${a === 'special' ? act(s).card.mv : d.name}</b><small>${a === 'special' ? (isAoe(act(s).card) ? 'Hits all enemies' : 'Big single hit') : d.desc}</small>`
      b.disabled = !my || s.ki < d.cost
      b.onclick = () => doArt(i)
      hand.append(b)
    })
    const u = $a('.ar-ult'); u.disabled = !my || s.gauge < GAUGE_MAX; u.classList.toggle('ready', s.gauge >= GAUGE_MAX)
    $a('.ar-end').disabled = !my
    $a('.ar-turn').textContent = 'TURN ' + B.turn
  }
  function draw() { hud('ai', B.ai); hud('you', B.you); field('ai', B.ai); field('you', B.you); controls() }

  async function show(ev) {
    if (ev.swap) { log('Enemy switched fighters'); sfx('swipe'); draw(); await wait(500); return }
    const side = ev.who, other = side === 'you' ? 'ai' : 'you'
    const atk = $a(`.ar-side.${side} .ar-active`)
    if (ev.guard) { log(`${act(B[side]).card.name} braces · GUARD`); sfx('soft'); atk.classList.add('guarding'); await wait(450); atk.classList.remove('guarding'); draw(); return }
    const big = ev.art === 'special' || ev.art === 'ultimate'
    log(big ? `${ev.art === 'ultimate' ? 'ULTIMATE · ' : ''}${ev.move}` : `${act(B[side]).card.name} · ${ARTS[ev.art].name}`)
    if (ev.art === 'ultimate') { ov.classList.add('ult'); ST3 && ST3.ult(side); sfx('charge', 5); await wait(900) } else if (big) { sfx('charge', 3); await wait(380) }
    atk.classList.remove('lunge'); void atk.offsetWidth; atk.classList.add('lunge')
    await wait(160)
    sfx(ev.art === 'strike' ? 'click' : ev.art === 'blast' ? 'deal' : 'reveal', ev.art === 'ultimate' ? 6 : 3)
    ST3 && ST3.hit(other, big)
    for (const x of ev.hits) {
      const isActive = x.t === act(B[other])
      const tgt = isActive ? $a(`.ar-side.${other} .ar-active`) : $a(`.ar-side.${other} .ar-bench`)
      tgt.classList.remove('hurt'); void tgt.offsetWidth; tgt.classList.add('hurt')
      const n = document.createElement('div'); n.className = 'dmg' + (x.crit ? ' crit' : '') + (big ? ' big' : ''); n.textContent = (x.crit ? 'CRIT ' : '') + x.dmg.toLocaleString()
      const r = tgt.getBoundingClientRect(); n.style.left = (r.left + r.width / 2) + 'px'; n.style.top = (r.top + r.height * .35) + 'px'
      ov.append(n); setTimeout(() => n.remove(), 1100)
    }
    ov.classList.remove('ult')
    draw(); await wait(big ? 650 : 420)
    // knockouts
    const foe = B[other]
    if (act(foe).ko) {
      sfx('error'); ST3 && ST3.ko(other); log(`${act(foe).card.name} is knocked out!`)
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
    B.you.active = i; B.you.switched = true; sfx('swipe'); log(`Go, ${act(B.you).card.name}!`); draw()
  }
  $a('.ar-ult').onclick = async () => { if (B.busy || B.over) return; B.busy = true; controls(); const e = ultimate(B, 'you'); if (e) await show(e); B.busy = false; if (!B.over) controls() }
  $a('.ar-end').onclick = () => endTurn()
  $a('.ar-quit').onclick = () => { if (B.over || confirm('Quit this battle? It counts as a loss.')) close() }
  function close() { B.closed = true; ST3 && ST3.dispose(); ov.classList.add('out'); setTimeout(() => ov.remove(), 300); X.go('battle') }

  async function aiPhase() {
    B.busy = true; controls()
    const s = B.ai; s.ki = Math.min(KI_MAX, s.ki + KI_PER_TURN); refill(s); s.switched = false
    log('Enemy turn'); await wait(600)
    for (const ev of aiTurn(B, stage.level)) { if (B.over) return; await show(ev); if (B.over) return }
    B.turn++
    const y = B.you; y.ki = Math.min(KI_MAX, y.ki + KI_PER_TURN); refill(y); y.switched = false
    B.busy = false; log('Your turn'); sfx('soft'); draw()
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
