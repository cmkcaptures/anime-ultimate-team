const clamp = (min, value, max) => Math.max(min, Math.min(max, value))

// Use the upgraded battle stats and give the strongest fighter most of the weight.
export function pveSquadPower(team) {
  const values = team.map(fighter => {
    const stats = Math.max(fighter.pwr, fighter.ki) * .57 + fighter.def * .26 + fighter.spd * .17
    const rarity = { L: 1.04, M: 1.09, X: 1.15 }[fighter.card?.r] || 1
    return stats * rarity * (fighter.card?.maxed ? 1.09 : 1)
  })
  if (!values.length) return 1
  const peak = Math.max(...values), average = values.reduce((sum, value) => sum + value, 0) / values.length
  return (.7 * peak + .3 * average) / 103
}

export function pveBalance(mode, team, { floor = 1, enemies = 1, episodes = 3, baseBoost = 1, finale = false } = {}) {
  const power = pveSquadPower(team)
  if (mode === 'redzone') {
    const upper = Math.max(0, power - .94)
    const solo = enemies === 1 ? 1.18 : enemies === 2 ? 1.08 : 1
    return {
      hp: solo * (1.12 + floor * .095 + upper * 1.55),
      damage: 1.04 + floor * .041 + upper * .48,
      phase: finale && enemies === 1,
    }
  }
  if (mode === 'boss') {
    return {
      hp: clamp(1, 1.22 + (power - 1) * .6, 1.75),
      damage: clamp(1, 1.12 + (power - 1) * .56, 1.55),
      scoreBoss: true,
    }
  }
  if (mode === 'arc') {
    const journey = (floor - 1) / Math.max(1, episodes - 1)
    return {
      hp: clamp(1.3, baseBoost, 1.77) * (1.03 + journey * .27) * (team.length > 1 ? 1.12 : 1),
      damage: 1.01 + journey * .18,
      storyBoost: clamp(1.08, 1 + (baseBoost - 1) * .12, 1.17),
    }
  }
  return null
}
