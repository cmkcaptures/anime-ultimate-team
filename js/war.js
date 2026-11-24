export const WAR_REWARD = { coins: 12000, shards: 600 }
export const WAR_TITLE = 'title_war_sweep'

const formations = [
  ['Mixed Alliance', 'Three different series', 'series'],
  ['Limited Reinforcements', 'At most one Mythic or Secret', 'mythic'],
  ['Faction Clash', 'Three different factions', 'faction'],
]

export function warLanes(cards, week) {
  const [name, rule, kind] = formations[Number(week.slice(1)) % formations.length]
  const named = ids => ids.map(id => cards.find(card => card.id === id)?.key).filter(Boolean)
  const open = named(['garp_galaxy_impact', 'kefla_super_saiyan_2', 'android_17_golden_frieza_universe_7'])
  const restricted = named(['toppo_god_of_destruction', 'super_17_energy_absorption', 'aizawa_erasure'])
  const used = new Set([...open, ...restricted])
  const rotating = []
  for (const card of cards.filter(c => !used.has(c.key) && !c.arcReward).sort((a, b) => Math.abs(a.ovr - 88) - Math.abs(b.ovr - 88))) {
    if (kind === 'series' && rotating.some(c => c.anime === card.anime)) continue
    if (kind === 'faction' && (!card.faction || rotating.some(c => c.faction === card.faction))) continue
    if (kind === 'mythic' && 'MX'.includes(card.r) && rotating.some(c => 'MX'.includes(c.r))) continue
    rotating.push(card)
    if (rotating.length === 3) break
  }
  return [
    { name: 'Open', rule: 'Any rarity', kind: 'open', team: open, level: 4 },
    { name: 'Restricted', rule: 'Epic and below', kind: 'restricted', team: restricted, level: 3 },
    { name, rule, kind, team: rotating.map(c => c.key), level: 4 },
  ]
}

export function warCardAllowed(card, squad, kind) {
  switch (kind) {
    case 'restricted': return 'CURE'.includes(card.r)
    case 'series': return !!card.anime && squad.every(c => c.anime !== card.anime)
    case 'faction': return !!card.faction && squad.every(c => c.faction !== card.faction)
    case 'mythic': return !'MX'.includes(card.r) || squad.every(c => !'MX'.includes(c.r))
    default: return true
  }
}

export function warLineupError(squads, lanes, find, owned) {
  if (!Array.isArray(squads) || squads.length !== 3 || squads.some(squad => !Array.isArray(squad) || squad.length !== 3)) return 'Fill all three squads.'
  const used = new Set()
  for (const [i, keys] of squads.entries()) {
    const squad = []
    for (const key of keys) {
      const card = typeof key === 'string' && find(key)
      if (!card || !owned(key)) return 'Each slot needs a card you own.'
      if (used.has(key)) return 'Each card can only fight in one lane.'
      if (!warCardAllowed(card, squad, lanes[i].kind)) return lanes[i].name + ' requires ' + lanes[i].rule.toLowerCase() + '.'
      used.add(key)
      squad.push(card)
    }
  }
  return null
}

export function warScore(results) {
  const wins = results.filter(Boolean).length
  const losses = results.length - wins
  return { wins, losses, done: wins === 2 || losses === 2 }
}
