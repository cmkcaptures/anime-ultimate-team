// CHRONICLE BREAK UI: hub -> moment -> scene -> choice -> fight briefing -> ending.
import { CHRONICLES, COMING, chronById, ENDING_COUNT } from './chronicle.js?v=claude-chron-3'
let SEL = null
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
export function chroniclePage(el, ctx) {
  const { X } = ctx, ST = X.ST(), state = ST.chron || {}
  const card = id => X.POOL.find(c => c.id === id)
  if (SEL && chronById(SEL)) return momentPage(el, ctx, chronById(SEL), state[SEL] || { node: 'start', endings: [] }, card)
  const hub = X.h('section', 'chr-hub')
  hub.innerHTML = `<div class="chr-rift"><i></i><i></i><i></i></div><header class="chr-head"><small>時間干渉 · CHRONICLE BREAK</small><h2>REWRITE HISTORY</h2><p>Drop your team into the most decisive moments in anime and change how they end. Every choice opens a different fight. Every ending is yours to collect.</p></header><div class="chr-grid"></div>`
  const grid = hub.querySelector('.chr-grid')
  for (const C of CHRONICLES) {
    const R = state[C.id] || { endings: [] }, tot = ENDING_COUNT(C), got = (R.endings || []).length, hero = card(C.hero), vil = card(C.villain)
    const b = X.h('button', 'chr-moment')
    b.style.setProperty('--c1', C.col); b.style.setProperty('--c2', C.col2)
    b.innerHTML = `<i class="cm-bg" style="background-image:url('${C.bg}')"></i><i class="cm-hero" style="background-image:url('${hero ? hero.url : ''}')"></i><i class="cm-vil" style="background-image:url('${vil ? vil.url : ''}')"></i><i class="cm-shine"></i>
      <span class="cm-era">${C.era}</span><span class="cm-txt"><b>${C.name}</b><em>${C.title}</em></span>
      <span class="cm-prog"><span>${Array.from({ length: tot }, (_, i) => `<i class="${i < got ? 'on' : ''}"></i>`).join('')}</span><small>${got}/${tot} ENDINGS</small></span>${got >= tot ? '<span class="cm-done">COMPLETE</span>' : ''}`
    b.onclick = () => { SEL = C.id; X.go('battle') }
    grid.append(b)
  }
  for (const c of COMING) grid.append(X.h('div', 'chr-moment soon', `<i class="cm-lock">🔒</i><span class="cm-era">COMING SOON</span><span class="cm-txt"><b>${c.name}</b><em>${c.title}</em></span>`))
  el.append(hub)
}
function momentPage(el, ctx, C, R, card) {
  const { X } = ctx, N = C.nodes[R.node] || C.nodes.start, hero = card(C.hero), vil = card(C.villain)
  const pg = X.h('section', 'chr-page'); pg.style.setProperty('--c1', C.col); pg.style.setProperty('--c2', C.col2)
  pg.innerHTML = `<button class="chr-back">‹ ALL MOMENTS</button>
    <div class="chr-banner"><i class="cb-bg" style="background-image:url('${C.bg}')"></i><i class="cb-vil" style="background-image:url('${vil ? vil.url : ''}')"></i><i class="cb-hero" style="background-image:url('${hero ? hero.url : ''}')"></i><i class="cb-grad"></i>
      <div class="cb-txt"><small>${C.era} · CHRONICLE BREAK</small><h2>${C.name}</h2><em>${C.title}</em></div></div>
    <div class="chr-canon"><small>ORIGINAL HISTORY</small><p>${esc(C.canon)}</p></div>
    <div class="chr-act"></div><div class="chr-tree"></div><div class="chr-ends"><h3>ENDINGS</h3><div class="ce-row"></div></div>`
  pg.querySelector('.chr-back').onclick = () => { SEL = null; X.go('battle') }
  // ---- action panel ----
  const act = pg.querySelector('.chr-act'), castOf = lines => { const m = new Map(); for (const [w] of lines) { const c = card(w); if (c) m.set(w, c) } return m }
  const playScene = (lines, title, done) => lines && lines.length ? ctx.scene(lines, title, C.bg, done, castOf(lines), vil) : done()
  if (N.type === 'choice') {
    act.innerHTML = `<div class="ca-k">${R.node === 'start' ? 'STEP INTO THE MOMENT' : 'A NEW CHOICE'}</div><b class="ca-t">${N.title}</b><p class="ca-d">${R.node === 'start' ? 'The rift is open. What you do next decides how this story ends.' : 'History is already bending. Choose how to finish it.'}</p>`
    const go = X.h('button', 'chr-go', '⏳ ' + (R.node === 'start' ? 'ENTER THE MOMENT' : 'CONTINUE'))
    go.onclick = () => playScene(N.scene, N.title, () => choiceScreen(ctx, C, N, card))
    act.append(go)
  } else if (N.type === 'fight') {
    const foes = N.enemy.map(card).filter(Boolean)
    act.innerHTML = `<div class="ca-k">FIGHT ${N.final ? '· FINAL BATTLE' : ''}</div><b class="ca-t">${N.name}</b><div class="ca-foes"></div><ul class="ca-brief">${(N.brief || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>${R.rules ? `<div class="ca-buff">YOUR EDGE: ${Object.entries(R.rules).map(([k, v]) => ({ dmg: '+' + v + '% damage', dr: v + '% less damage taken', spec: '+' + v + '% Special damage', ultStart: v + '% Ultimate gauge at start' }[k] || k)).join(' · ')}</div>` : ''}${N.final ? '<div class="ca-true">★ Win without losing a fighter to unlock the TRUE ENDING</div>' : ''}`
    const fr = act.querySelector('.ca-foes'); for (const f of foes) { const im = X.cardImg(f, 200); fr.append(im) }
    const row = X.h('div', 'ca-btns'), go = X.h('button', 'chr-go fight', '⚔ FIGHT'), ab = X.h('button', 'chr-ghost', 'ABANDON PATH')
    go.onclick = () => playScene(N.scene, N.name, () => ctx.startBattle({
      mode: 'chronicle', id: 'chron:' + C.id + ':' + R.node, label: 'CHRONICLE BREAK', name: N.name, level: 5, boost: N.boost, team: ctx.campTeam(N.enemy),
      rules: N.rules || {}, encounter: N.encounter, bossAb: N.bossAb === 'deathball' ? { id: 'deathball', name: 'DEATH BALL' } : null, turnLimit: N.turnLimit, limitText: N.limitText,
      fury: N.fury, youRules: R.rules ? { ...R.rules } : null, chronicle: { id: C.id, node: R.node }, bg: C.bg, afterWin: () => X.go('battle'),
    }))
    ab.onclick = async () => { if (!confirm('Abandon this path and return to the start of the moment?')) return; await X.act('chronReset', { id: C.id }); X.go('battle') }
    row.append(go, ab); act.append(row)
  } else if (N.type === 'ending') {
    const rc = N.reward && N.reward.card && card(N.reward.card)
    act.classList.add('ending')
    act.innerHTML = `<div class="ca-k">⏳ TIMELINE REWRITTEN</div><b class="ca-t">${N.name}</b><p class="ca-d">${esc(N.text)}</p>`
    if (rc) act.append(X.cardImg(rc, 260))
    const again = X.h('button', 'chr-go', '↺ REWRITE IT AGAIN'); again.onclick = async () => { await X.act('chronReset', { id: C.id }); X.go('battle') }
    act.append(again)
  }
  // ---- branch tree ----
  const tree = pg.querySelector('.chr-tree'), ends = R.endings || []
  const paths = C.nodes.start.choices.map(ch => { const list = []; let k = ch.next, guard = 0; while (k && C.nodes[k] && guard++ < 12) { const n = C.nodes[k]; list.push([k, n]); k = n.type === 'choice' ? n.choices[0].next : n.next } return { ch, list } })
  tree.innerHTML = '<h3>TIMELINE</h3>'
  const root = X.h('div', 'ct-root' + (R.node === 'start' ? ' cur' : ''), '<i></i><b>THE MOMENT</b>'); tree.append(root)
  for (const p of paths) {
    const row = X.h('div', 'ct-path'), inPath = p.list.some(([k]) => k === R.node)
    row.append(X.h('span', 'ct-lab' + (inPath ? ' on' : ''), p.ch.label))
    for (const [k, n] of p.list) {
      const done = n.type === 'ending' ? ends.includes(n.id) : false
      row.append(X.h('span', 'ct-node ' + n.type + (k === R.node ? ' cur' : '') + (done ? ' done' : ''), `<i></i><small>${n.type === 'fight' ? n.name : n.type === 'ending' ? (done ? n.name : '???') : n.title}</small>`))
    }
    tree.append(row)
  }
  // ---- endings ----
  const er = pg.querySelector('.ce-row'), all = [...Object.values(C.nodes).filter(n => n.type === 'ending'), C.trueEnding && { ...C.trueEnding, isTrue: 1 }].filter(Boolean)
  for (const E of all) {
    const got = ends.includes(E.id), rc = E.reward && E.reward.card && card(E.reward.card)
    const s = X.h('div', 'ce' + (got ? ' got' : '') + (E.isTrue ? ' true' : ''))
    s.innerHTML = `<div class="ce-art"${rc ? ` style="background-image:url('${rc.url}')"` : ''}>${got ? '' : '<b>?</b>'}</div><small>${E.isTrue ? '★ TRUE ENDING' : 'ENDING'}</small><b>${got ? E.name : '???'}</b><em>${rc ? rc.name + ' · ' + rc.ver : ''}</em>`
    er.append(s)
  }
  el.append(pg)
}
function choiceScreen(ctx, C, N, card) {
  const { X } = ctx, o = document.createElement('div'); o.className = 'chr-choice'
  o.style.setProperty('--c1', C.col); o.style.setProperty('--c2', C.col2)
  o.innerHTML = `<i class="cc-bg" style="background-image:url('${C.bg}')"></i><i class="cc-rift"></i><header><small>⏳ DECISIVE MOMENT</small><b>${N.title}</b><span>Choose how history changes.</span></header><div class="cc-row"></div><button class="cc-x">✕</button>`
  const row = o.querySelector('.cc-row')
  N.choices.forEach((ch, i) => {
    const a = card(ch.art), b = document.createElement('button'); b.className = 'cc-opt'; b.style.animationDelay = (i * .12) + 's'
    b.innerHTML = `<i class="cc-art" style="background-image:url('${a ? a.url : ''}');background-position:${Math.round(((a && a.fx) ?? .5) * 100)}% ${Math.round(((a && a.fy) ?? .25) * 100)}%"></i><i class="cc-glow"></i><span class="cc-tag">${ch.tag}</span><span class="cc-txt"><b>${esc(ch.label)}</b><em>${esc(ch.desc)}</em></span><span class="cc-pick">CHOOSE ›</span>`
    b.onclick = async () => { o.classList.add('picked'); b.classList.add('chosen'); const r = await X.act('chronChoose', { id: C.id, choice: ch.id }); setTimeout(() => { o.remove(); if (!r.error) X.go('battle') }, 650) }
    row.append(b)
  })
  o.querySelector('.cc-x').onclick = () => o.remove()
  document.body.append(o)
}
