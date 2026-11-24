const passive = card => card.pas?.e || {}

export function rankCounters(pool, target, beats, limit = 6) {
  const enemy = passive(target)
  return pool.filter(card => card.key !== target.key).map(card => {
    const kit = passive(card), reasons = []
    const add = (weight, text) => reasons.push({ weight, text })
    const advantage = beats(card.t || 'ki', target.t || 'ki')
    const disadvantage = beats(target.t || 'ki', card.t || 'ki')
    if (advantage) add(13, 'Type advantage increases damage in this matchup.')
    if (enemy.absorbRanged) {
      if (kit.nullPassive) add(29, 'Can seal the passive and stop ranged absorption.')
      else if (kit.antiKit) add(27, 'Attacks bypass ranged absorption.')
      else if (kit.erasure && !card.rangedSpecial) add(24, 'A landed Special can temporarily disable absorption.')
      else if (!card.rangedSpecial) add(12, 'Strikes and the Special avoid ranged absorption. Use melee Arts.')
    }
    if (enemy.shield && kit.galaxyImpact) add(29, 'First Galaxy Impact removes enemy shields before dealing damage.')
    if ((enemy.endure || enemy.revive || enemy.ablaze) && (kit.noSurvive || kit.lastEmbers || kit.ichigoResolve)) {
      add(26, kit.noSurvive ? 'Can prevent survival and revival on a finishing blow.' : 'Its powered-up Ultimate can block survival and revival.')
    }
    if (enemy.guardAuto || enemy.guardStrong) {
      if (kit.pierce || kit.pierceStrike || kit.pierceSpec || /Ignores Guard/.test((card.tx || []).join(' '))) add(17, 'Can pierce Guard with the right attack.')
    }
    if ((enemy.reflect || enemy.dodge || enemy.firstNull) && kit.antiKit) add(24, 'Attacks bypass defensive passives such as dodge and reflection.')
    if (!enemy.absorbRanged && (enemy.regen || enemy.teamHeal || enemy.dmg || enemy.galaxyImpact) && (kit.nullPassive || kit.erasure)) {
      add(20, kit.erasure ? 'A landed Special can temporarily disable the enemy passive.' : 'Can seal the enemy active fighter’s passive.')
    }
    if (kit.vsAnime === target.anime && kit.vsAnimeB) add(14, 'Deals +' + kit.vsAnimeB + '% damage against this series.')
    if ((enemy.dmg || enemy.ultBoost) && (kit.firstNull || kit.endure || kit.revive)) add(9, 'Survival tools help weather the opponent’s burst damage.')
    if (!reasons.length) add(0, disadvantage ? 'High stats, but the opponent has type advantage.' : 'A high-rating option when you lack a direct kit counter.')
    const score = card.ovr * .55 + reasons.reduce((sum, reason) => sum + reason.weight, 0) - (disadvantage ? 12 : 0) - (enemy.absorbRanged && card.rangedSpecial && !kit.antiKit && !kit.nullPassive ? 18 : 0)
    return { card, score, reasons: reasons.sort((a, b) => b.weight - a.weight).slice(0, 2).map(r => r.text) }
  }).sort((a, b) => b.score - a.score).slice(0, limit)
}

let selectedKey = null
let ownedOnly = false

export function cardCounterPage(el, ctx, beats) {
  const { h, POOL, BYKEY, P } = ctx
  const text = (tag, cls, value) => { const node = h(tag, cls); node.textContent = value; return node }
  const search = h('input', 'field')
  search.type = 'search'; search.placeholder = 'Search opponents by name, form or ability'
  search.setAttribute('aria-label', 'Search opponents')
  const choices = h('div', 'counter-targets')
  choices.setAttribute('aria-label', 'Opponent cards')
  const hero = h('section', 'counter-hero')
  const targetPanel = h('div', 'counter-matchup')
  hero.append(text('h2', '', 'CARD COUNTER'), text('p', '', 'Pick an opponent and find the fighters whose kits give you an edge.'), targetPanel)
  const content = h('section', 'counter-picks')
  const filters = h('div', 'counter-filters')
  const ownership = h('button', 'btn dark sm', 'OWNED ONLY')
  ownership.type = 'button'
  const heading = text('h3', '', 'Recommended counters')
  filters.append(heading, ownership)
  const results = h('div', 'counter-results')
  content.append(filters, results)
  const roster = h('section', 'counter-roster')
  roster.append(text('h3', '', 'Choose your opponent'), search, choices)
  el.append(hero, roster, content)
  const options = POOL.slice().sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
  const canUse = card => P.club.cards[card.key]?.n > 0
  const renderResults = () => {
    const target = BYKEY[selectedKey]
    ownership.setAttribute('aria-pressed', String(ownedOnly))
    results.replaceChildren()
    targetPanel.replaceChildren()
    if (!target) {
      results.append(text('p', 'muted', 'Select an opponent to scout the matchup.'))
      return
    }
    const portrait = h('button', 'counter-target-card')
    portrait.type = 'button'; portrait.setAttribute('aria-label', 'View ' + target.name + ' kit')
    portrait.append(ctx.cardImg(target, 200))
    portrait.onclick = () => ctx.cardDetail(target.key, { kitOnly: true })
    targetPanel.append(portrait, text('div', 'counter-vs', 'VS'), text('div', 'counter-target-name', target.name + ' · ' + target.ver))
    const picks = rankCounters(ownedOnly ? options.filter(canUse).map(ctx.eff) : options, target, beats)
    if (!picks.length) results.append(text('p', 'muted', 'No eligible cards in your collection. Turn off Owned Only to scout the full roster.'))
    for (const [i, { card, reasons }] of picks.entries()) {
      const cardButton = h('button', 'counter-pick-art')
      cardButton.type = 'button'; cardButton.setAttribute('aria-label', 'View ' + card.name + ' kit')
      cardButton.append(ctx.cardImg(card, 240))
      cardButton.onclick = () => ctx.cardDetail(card.key)
      const copy = h('div', 'counter-pick-copy')
      copy.append(text('small', '', (i === 0 ? 'TOP PICK · ' : '') + (canUse(card) ? 'OWNED' : 'UNOWNED')),
        text('strong', '', card.name), text('span', 'muted', card.ver))
      const list = h('ul', '')
      for (const reason of reasons) list.append(text('li', '', reason))
      copy.append(list)
      const row = h('article', 'counter-pick')
      row.append(cardButton, copy)
      results.append(row)
    }
  }
  let visible = 12
  const renderChoices = () => {
    choices.replaceChildren()
    const matches = options.filter(card => ctx.matchesCard(card, search.value))
    for (const card of matches.slice(0, visible)) {
      const button = h('button', 'counter-target-card')
      button.type = 'button'
      button.setAttribute('aria-pressed', String(card.key === selectedKey))
      button.setAttribute('aria-label', 'Scout ' + card.name + ' · ' + card.ver)
      button.append(ctx.cardImg(card, 160), text('small', '', card.name), text('small', 'muted', card.ver))
      button.onclick = () => {
        selectedKey = card.key
        for (const option of choices.children) option.setAttribute('aria-pressed', String(option === button))
        renderResults()
        content.scrollIntoView({ block: 'nearest' })
      }
      choices.append(button)
    }
    if (!matches.length) choices.append(text('p', 'muted', 'No cards match that search.'))
    if (matches.length > visible) {
      const more = text('button', 'btn dark sm counter-more', 'SHOW MORE · ' + visible + ' OF ' + matches.length)
      more.type = 'button'
      more.onclick = () => { visible += 12; renderChoices(); choices.children[visible - 12]?.focus() }
      choices.append(more)
    }
  }
  ownership.onclick = () => { ownedOnly = !ownedOnly; renderResults() }
  search.oninput = () => { visible = 12; renderChoices() }
  renderChoices()
  renderResults()
}
