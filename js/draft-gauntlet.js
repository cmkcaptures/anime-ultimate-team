const WEEK = 7 * 86400000
const THEMES = [
  { name: 'Dragon Slayers', match: c => c.cat?.some(tag => ['Dragons', 'Dragon Slayers', 'Dragon Clan'].includes(tag)) || (c.anime === 'FT' && ['NATSU', 'LAXUS', 'WENDY', 'STING', 'GAJEEL', 'ROGUE CHENEY', 'ACNOLOGIA'].includes(c.name)) },
  { name: 'Tag Units', match: c => !!c.tag },
  { name: 'Villains', match: c => c.cat?.includes('Villains') },
]
export const DRAFT_SIZE = 6
export const DRAFT_ROUNDS = 3
export const DRAFT_REWARDS = { coins: 12000, shards: 500, pack: 'premium' }

function seededOrder(cards, seed) {
  function rank(key) {
    let hash = seed | 0
    for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
    hash = Math.imul(hash ^ (hash >>> 16), 2246822519)
    return (hash ^ (hash >>> 13)) >>> 0
  }
  return cards.map(card => [rank(card.key), card]).sort(([a, x], [b, y]) => a - b || x.key.localeCompare(y.key)).map(([, card]) => card)
}

export function draftWeek(cards, now = Date.now()) {
  const week = Math.floor((now + 3 * 86400000) / WEEK)
  const theme = THEMES[week % THEMES.length]
  const eligible = cards.filter(card => !card.campaignEnemy)
  const themed = eligible.filter(theme.match)
  const pool = seededOrder(themed, week * 37 + 9).slice(0, 24)
  if (pool.length < 18) pool.push(...seededOrder(eligible.filter(card => !theme.match(card)), week * 41 + 7).slice(0, 18 - pool.length))
  return { week, theme: theme.name, ends: (week + 1) * WEEK - 3 * 86400000, pool: pool.map(card => card.key) }
}

export function draftOffers(info, picks) {
  if (picks.length >= DRAFT_SIZE) return []
  return seededOrder(info.pool.filter(key => !picks.includes(key)).map(key => ({ key })), info.week * 91 + picks.length * 213 + 1)
    .slice(0, 3).map(card => card.key)
}

export function createDraft(info, id) {
  return { id, week: info.week, picks: [], round: 0, hp: [], status: 'drafting' }
}

export function pickDraftCard(run, info, key) {
  if (run.status !== 'drafting' || run.week !== info.week || !draftOffers(info, run.picks).includes(key)) return false
  run.picks.push(key)
  if (run.picks.length === DRAFT_SIZE) {
    run.hp = run.picks.map(() => 1)
    run.status = 'ready'
  }
  return true
}

export function draftEnemyTeam(info, cards, round) {
  const pool = new Set(info.pool)
  const tiers = cards.filter(c => pool.has(c.key)).sort((a, b) => a.ovr - b.ovr || a.key.localeCompare(b.key))
  const shortlist = round === 0 ? tiers.slice(0, 10) : round === 1 ? tiers.slice(4, 16) : tiers.slice(-10)
  return seededOrder(shortlist, info.week * 151 + 71 + round).slice(0, 3 + round).map(card => card.key)
}

export function finishDraftRound(run, round, won, hp) {
  if (run.status !== 'ready' || run.round !== round || typeof won !== 'boolean' || !Array.isArray(hp) ||
      hp.length !== DRAFT_SIZE || hp.some(value => !Number.isFinite(value) || value < 0 || value > 1) ||
      (won && !hp.some(value => value > 0))) return false
  run.hp = hp.slice()
  if (!won) run.status = 'lost'
  else if (++run.round === DRAFT_ROUNDS) run.status = 'won'
  return true
}
