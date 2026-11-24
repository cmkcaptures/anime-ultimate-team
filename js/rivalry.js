export const VEGETA = 'vegeta_ssb_evolved'
export const TOPPO = 'toppo_god_of_destruction'
export const RIVALRY_TITLE = 'title_beyond_destruction'

export function rivalryPage(el, X, launch) {
  const { h, POOL, P } = X
  const vegeta = POOL.find(c => c.id === VEGETA), toppo = POOL.find(c => c.id === TOPPO)
  if (!vegeta || !toppo) return
  const text = (tag, cls, value) => { const node = h(tag, cls); node.textContent = value; return node }
  const hero = h('section', 'rivalry-hero')
  hero.append(text('h2', '', 'RIVALRY BATTLES'), text('p', '', 'Blue Evolution Vegeta and your five fighters vs. God of Destruction Toppo'))
  const art = h('div', 'rivalry-versus')
  for (const card of [vegeta, toppo]) {
    if (card === toppo) art.append(text('strong', '', 'VS'))
    const button = h('button', 'war-card-button')
    button.setAttribute('aria-label', 'View ' + card.name + ' kit')
    button.append(X.cardImg(card, 240))
    button.onclick = () => X.cardDetail(card.key, { kitOnly: true, auraDiamonds: card === toppo ? 5 : 3 })
    art.append(button)
  }
  hero.append(art)
  el.append(hero)
  const squad = h('section', 'panel pad')
  const layout = h('div', 'rivalry-squad')
  const choices = [...new Set(P.team)].filter(key => key !== vegeta.key && P.club.cards[key]?.n > 0).slice(0, 5)
  const selected = Array.from({ length: 5 }, (_, i) => choices[i] || null)
  const pool = POOL.filter(c => c.key !== vegeta.key && P.club.cards[c.key]?.n > 0).sort((a, b) => b.ovr - a.ovr)
  const story = text('button', 'btn gold', P.rivalry?.story ? 'REPLAY STORY' : 'START STORY')
  const mastery = text('button', 'btn dark', P.rivalry?.mastery ? 'REPLAY MASTERY' : 'START MASTERY')
  const controls = h('div', 'battle-result-actions')
  controls.append(story, mastery)
  squad.append(text('h3', '', 'Your squad'), text('p', 'muted', 'Vegeta is your locked leader and starts in battle. Choose five owned cards. Toppo resists instant KOs and HP swaps.'), layout, controls,
    text('p', 'muted', P.rivalry?.story ? 'Story cleared. Mastery requires surviving Hakai and KO’ing Toppo with Final Explosion.' : 'First Story clear earns 5,000 coins and 300 shards.'))
  el.append(squad)
  const draw = () => {
    layout.replaceChildren()
    const leader = h('button', 'war-card-button')
    leader.append(X.cardImg(vegeta, 200), text('small', '', '🔒 Leader · Vegeta'))
    leader.onclick = () => X.cardDetail(vegeta.key, { kitOnly: true, auraDiamonds: 3 })
    layout.append(leader)
    selected.forEach((key, i) => {
      const button = h('button', 'war-card-button war-squad-slot')
      if (key) button.append(X.cardImg(X.eff(X.BYKEY[key]), 200))
      button.append(text('small', '', key ? X.BYKEY[key].name : '+ Fighter ' + (i + 2)))
      button.onclick = () => X.openModal(sheet => {
        const close = text('button', 'btn dark sm', 'CLOSE')
        close.onclick = X.closeModal
        const search = h('input', 'field')
        search.type = 'search'; search.placeholder = 'Search owned fighters'
        const grid = h('div', 'cardgrid')
        const update = () => {
          grid.replaceChildren()
          for (const card of pool.filter(c => (c.key === key || !selected.includes(c.key)) && X.matchesCard(c, search.value))) {
            const pick = h('button', 'cg')
            pick.setAttribute('aria-label', 'Select ' + card.name + ' · ' + card.ver)
            pick.append(X.cardImg(X.eff(card), 240))
            pick.onclick = () => { selected[i] = card.key; X.closeModal(); draw() }
            grid.append(pick)
          }
        }
        search.oninput = update
        sheet.append(close, search, grid)
        update()
      }, true)
      layout.append(button)
    })
    const ready = selected.every(Boolean)
    story.disabled = !ready
    mastery.disabled = !ready || !P.rivalry?.story
  }
  story.onclick = () => launch(vegeta, toppo, selected.slice(), false)
  mastery.onclick = () => launch(vegeta, toppo, selected.slice(), true)
  draw()
}

export function chargeBarrier(boss, kind, ranged) {
  if (!boss.rivalBarrier) return { multiplier: 1 }
  if (kind === 'strike') {
    boss.rivalBarrier--
    return { multiplier: 1, remaining: boss.rivalBarrier }
  }
  return { multiplier: ranged ? .4 : 1 }
}

export function hakaiStep(boss, turn) {
  if (boss.ko || boss.rivalBarrier || boss.rivalBarrier == null) return null
  if (boss.hakaiAt === turn) {
    boss.hakaiAt = null
    boss.nextHakai = turn + 3
    return 'fire'
  }
  if (boss.hakaiAt == null && turn >= (boss.nextHakai || 0)) {
    boss.hakaiAt = turn + 1
    return 'warn'
  }
  return null
}
