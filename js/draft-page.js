import { DRAFT_ROUNDS, DRAFT_SIZE, DRAFT_REWARDS } from './draft-gauntlet.js?v=1'

export function draftPage(el, X, startFight) {
  const { h, cardImg, BYKEY } = X
  const { theme, ends, run, offers, rewarded } = X.ST().draft
  const hero = h('section', 'bhero draft-hero')
  const copy = h('div')
  copy.append(h('span', 'sh-tag', 'WEEKLY DRAFT · ' + theme.toUpperCase()),
    h('h2', '', 'DRAFT GAUNTLET'),
    h('p', '', 'Draft six loaners and win three fights. HP and knockouts carry over. Energy, Arts, and transformations reset each fight.'),
    h('small', '', rewarded ? 'Weekly clear reward earned' : 'First full clear this week · ' + DRAFT_REWARDS.coins.toLocaleString() + ' coins · 500 shards · Premium Drop'))
  const countdown = h('div', 'draft-countdown', 'NEXT DRAFT IN <b class="timer"></b>')
  countdown.querySelector('.timer').dataset.until = ends
  hero.append(copy, countdown)
  el.append(hero)

  const submit = async (button, type, args) => {
    button.disabled = true
    const result = await X.act(type, args)
    if (result.error) button.disabled = false
    else X.go('battle')
  }
  if (!run) {
    const begin = h('button', 'btn gold', 'START DRAFT')
    begin.onclick = () => submit(begin, 'draftStart', {})
    el.append(begin)
    return
  }
  const squad = h('div', 'draft-squad')
  for (const [i, key] of run.picks.entries()) {
    const c = BYKEY[key]
    if (!c) continue
    const hp = run.hp[i]
    const fighter = h('div', 'draft-fighter' + (hp === 0 ? ' defeated' : ''))
    fighter.append(cardImg(c, 180), h('small', '', hp == null ? 'PICK ' + (i + 1) : hp ? Math.ceil(hp * 100) + '% HP' : 'KO'))
    squad.append(fighter)
  }
  if (squad.children.length) el.append(squad)
  if (run.status === 'drafting') {
    el.append(h('div', 'sec', '<h3>PICK ' + (run.picks.length + 1) + ' OF ' + DRAFT_SIZE + '</h3>'))
    const offer = h('div', 'draft-offers')
    for (const key of offers) {
      const c = BYKEY[key]
      if (!c) continue
      const button = h('button', 'draft-fighter')
      button.append(cardImg(c, 320), h('b', '', c.name), h('small', '', c.ver))
      button.onclick = () => {
        for (const choice of offer.children) choice.disabled = true
        submit(button, 'draftPick', { id: run.id, key }).finally(() => {
          for (const choice of offer.children) choice.disabled = false
        })
      }
      offer.append(button)
    }
    el.append(offer)
  }
  if (run.status === 'ready') {
    const progress = h('div', 'draft-rounds')
    for (let round = 0; round < DRAFT_ROUNDS; round++) progress.append(h('span', round < run.round ? 'cleared' : round === run.round ? 'active' : '', 'FIGHT ' + (round + 1) + (round < run.round ? ' ✓' : '')))
    el.append(progress)
    const fight = h('button', 'btn gold', 'FIGHT ' + (run.round + 1))
    fight.onclick = () => startFight(run)
    el.append(fight)
  }
  const done = ['won', 'lost'].includes(run.status)
  if (done) el.append(h('p', 'draft-summary', run.status === 'won' ? 'GAUNTLET CLEARED' : 'RUN ENDED · ' + run.round + '/' + DRAFT_ROUNDS + ' CLEARED'))
  const reset = h('button', 'btn dark sm draft-reset', done ? 'DRAFT AGAIN' : 'ABANDON RUN')
  reset.onclick = () => {
    if (!done && !confirm('Abandon this draft and start over?')) return
    submit(reset, done ? 'draftStart' : 'draftAbandon', { id: run.id })
  }
  el.append(reset)
}
