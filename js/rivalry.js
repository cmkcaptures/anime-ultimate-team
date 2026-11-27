import { LAST_DOOR_RIVALS } from './last-door.js?v=claude-dzbal-1'

export const VEGETA = 'vegeta_ssb_evolved'
export const TOPPO = 'toppo_god_of_destruction'
export const RIVALRY_TITLE = 'title_beyond_destruction'

const TOPPO_RIVAL = { id: 'toppo', name: 'Vegeta vs. Toppo', lead: VEGETA, foe: TOPPO,
  goal: 'Survive Hakai and KO Toppo with Final Explosion.' }
export function rivalryLead(card, rival, pool) {
  const kit = rival?.kit && pool.find(entry => entry.id === rival.kit)
  if (!card || !kit) return card
  const form = rival.form && card.transformations?.find(entry => entry.ver.startsWith(rival.form))
  const artwork = form ? { id: card.id + '_rival_form', baseId: card.id, url: form.url, ver: form.ver, fy: form.fy, transformations: undefined } : {}
  return { ...card, ...artwork, mv: kit.mv, tx: kit.tx, pas: kit.pas }
}

let selectedRival = 'toppo'
export function rivalryPage(el, X, launch) {
  const { h, POOL, P } = X
  const options = [TOPPO_RIVAL, ...LAST_DOOR_RIVALS]
  const rival = options.find(option => option.id === selectedRival)
  const legacy = rival === TOPPO_RIVAL
  const progress = (legacy ? P.rivalry : P.rivalry?.[rival.id]) || {}
  const tabs = h('div', 'mtabs dz-tabs')
  for (const option of options) {
    const tab = h('button', 'mtab' + (rival === option ? ' on' : ''), option.name)
    tab.onclick = () => { selectedRival = option.id; X.go('battle') }
    tabs.append(tab)
  }
  el.append(tabs)
  const vegeta = rivalryLead(POOL.find(c => c.id === rival.lead), rival, POOL), toppo = POOL.find(c => c.id === rival.foe)
  if (!vegeta || !toppo) return
  const text = (tag, cls, value) => { const node = h(tag, cls); node.textContent = value; return node }
  const hero = h('section', 'rivalry-hero')
  hero.append(text('h2', '', 'RIVALRY BATTLES'), text('p', '', rival.name + ' · ' + rival.goal))
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
  const restricted = new Set([vegeta.key, POOL.find(c => c.id === rival.kit)?.key, ...(legacy ? [] : [toppo.key])])
  const choices = [...new Set(P.team)].filter(key => !restricted.has(key) && P.club.cards[key]?.n > 0).slice(0, 5)
  const selected = Array.from({ length: 5 }, (_, i) => choices[i] || null)
  const pool = POOL.filter(c => !restricted.has(c.key) && P.club.cards[c.key]?.n > 0).sort((a, b) => b.ovr - a.ovr)
  const story = text('button', 'btn gold', progress.story ? 'REPLAY STORY' : 'START STORY')
  const mastery = text('button', 'btn dark', progress.mastery ? 'REPLAY MASTERY' : 'START MASTERY')
  const controls = h('div', 'battle-result-actions')
  controls.append(story, mastery)
  squad.append(text('h3', '', 'Your squad'), text('p', 'muted', vegeta.name + ' starts as your locked leader. Choose five owned fighters.'), layout, controls,
    text('p', 'muted', progress.story ? 'Mastery · ' + rival.goal : 'First Story clear earns 5,000 coins and 300 shards.'))
  el.append(squad)
  const draw = () => {
    layout.replaceChildren()
    const leader = h('button', 'war-card-button')
    leader.append(X.cardImg(vegeta, 200), text('small', '', '🔒 Leader · ' + vegeta.name))
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
    mastery.disabled = !ready || !progress.story
  }
  story.onclick = () => launch(vegeta, toppo, selected.slice(), false, rival)
  mastery.onclick = () => launch(vegeta, toppo, selected.slice(), true, rival)
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
