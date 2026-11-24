const format = value => Math.round(value || 0).toLocaleString()

export function recapFighter(fighter) {
  return {
    name: fighter.card.name,
    form: fighter.card.ver,
    damage: fighter.dealt || 0,
    healing: fighter.recapHealing || 0,
    shielded: fighter.recapShielded || 0,
    passives: fighter.recapPassives || 0,
    knockouts: fighter.kos || 0,
  }
}

export function addBattleRecap(result, team) {
  const disclosure = document.createElement('details')
  disclosure.className = 'battle-recap'
  const summary = document.createElement('summary')
  summary.textContent = 'Battle Recap'
  const table = document.createElement('table')
  const header = table.createTHead().insertRow()
  const stats = [['DMG', 'damage'], ['HEAL', 'healing'], ['SHIELD', 'shielded'], ['PROCS', 'passives'], ['KO', 'knockouts']]
  for (const label of ['Fighter', ...stats.map(([label]) => label)]) {
    const cell = document.createElement('th')
    cell.scope = 'col'
    cell.textContent = label
    header.append(cell)
  }
  const body = table.createTBody()
  for (const fighter of team.map(recapFighter)) {
    const row = body.insertRow()
    const name = document.createElement('th')
    name.scope = 'row'
    name.textContent = fighter.name
    const form = document.createElement('small')
    form.textContent = fighter.form || ''
    name.append(form)
    row.append(name)
    for (const [, stat] of stats) row.insertCell().textContent = format(fighter[stat])
  }
  const explanation = document.createElement('p')
  explanation.textContent = 'Healing is HP restored to each fighter. Shield is damage absorbed. Procs count named passive activations.'
  const scroll = document.createElement('div')
  scroll.className = 'battle-recap-scroll'
  scroll.tabIndex = 0
  scroll.setAttribute('aria-label', 'Fighter stats')
  scroll.append(table)
  disclosure.append(summary, scroll, explanation)
  result.append(disclosure)
}

const WAR_RECAP_KEY = 'aut-war-recap'
export function warRecap(id) {
  try {
    const saved = JSON.parse(localStorage.getItem(WAR_RECAP_KEY))
    return saved?.id === id ? saved.lanes : []
  } catch {
    return []
  }
}

export function recordWarMvp({ id, round }, fighter) {
  try {
    const lanes = warRecap(id)
    lanes[round] = recapFighter(fighter)
    localStorage.setItem(WAR_RECAP_KEY, JSON.stringify({ id, lanes }))
  } catch { }
}

export function createTurningPoints() {
  const events = []
  let order = 0
  return {
    add(turn, side, text, priority) {
      const event = { turn, side, text, priority, order: order++ }
      events.push(event)
      events.sort((a, b) => b.priority - a.priority || a.order - b.order)
      if (events.length > 6) events.pop()
    },
    list() {
      return events.slice().sort((a, b) => a.turn - b.turn || a.order - b.order)
    },
  }
}

export function addTurningPoints(result, points) {
  if (!points.length) return
  const panel = document.createElement('details')
  panel.className = 'battle-recap turning-points'
  const heading = document.createElement('summary')
  heading.textContent = 'Turning Points'
  const list = document.createElement('ol')
  const standout = points.reduce((best, point) => point.priority > best.priority ? point : best)
  for (const point of points) {
    const item = document.createElement('li')
    const label = document.createElement('strong')
    label.textContent = 'Turn ' + point.turn + ' · ' + (point.side === 'you' ? 'Your team' : 'Opponent')
    if (point === standout) {
      item.className = 'turning-point-standout'
      label.textContent += ' · Standout'
    }
    const detail = document.createElement('span')
    detail.textContent = point.text
    item.append(label, detail)
    list.append(item)
  }
  panel.append(heading, list)
  result.append(panel)
}
