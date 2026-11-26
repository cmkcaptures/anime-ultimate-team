const clamp = (min, value, max) => Math.max(min, Math.min(max, value))
// How much enemies scale with your team. Low so upgrading your cards actually makes fights easier.
export const TEAM_SCALING = .55

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

export function pveBalance(mode, team, { floor = 1, enemies = 1, episodes = 3, baseBoost = 1, finale = false, progression = 0 } = {}) {
  const power = pveSquadPower(team)
  if (mode === 'redzone') {
    const elite = clamp(0, power - 1.02, .85)
    const size = 1 + clamp(0, 6 - enemies, 5) * .12
    return {
      hp: size * (1.24 + floor * .15 + elite * 1.65 * TEAM_SCALING),
      damage: 1.18 + floor * .063 + elite * .44 * TEAM_SCALING,
      phase: finale,
    }
  }
  if (mode === 'boss') {
    return {
      hp: clamp(1, 1.12 + (power - 1) * .6 * TEAM_SCALING, 1.5),
      damage: clamp(1, 1.05 + (power - 1) * .56 * TEAM_SCALING, 1.3),
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
  if (mode === 'raid') {
    // Every attack contributes raw damage to the same community HP pool.
    return { hp: 1.4, damage: 1.18, scoreBoss: true }
  }
  const profile = OTHER_MODES[mode]
  if (!profile) return null
  const [baseHp, baseDamage, response] = profile
  const late = clamp(0, progression, 1)
  const stronger = clamp(0, (power - .89) / .55, 1)
  const scale = stronger * response * TEAM_SCALING
  const outnumbered = 1 + clamp(0, team.length - enemies, 5) * (mode === 'rivalry' ? .045 : .055)
  return {
    hp: (baseHp + late * .18 + scale * (.45 + late * .25)) * outnumbered,
    damage: baseDamage + late * .12 + scale * .25,
  }
}

const OTHER_MODES = {
  ranked: [1, 1, .8],
  tower: [1, 1, 1],
  event: [1, 1, .85],
  rift: [1.16, 1.06, 1],
  rivalry: [1.1, 1.02, .75],
  war: [1.07, 1.02, .9],
  story: [1, 1, .65],
  camp: [1, 1, .8],
  villain: [1.06, 1.02, .85],
}


const DEAD_ZONE_ARTS = ['strike', 'blast', 'special']

export function deadZoneIntent(floor, turn, lead, enemy, roll) {
  const interval = floor >= 4 ? 2 : 3
  if ((turn - 1) % interval !== 0) return null
  return roll < .5
    ? { lead, enemy, art: null }
    : { lead, enemy, art: DEAD_ZONE_ARTS[Math.floor((roll - .5) * 6)] }
}

export function deadZonePunishment(intent, lead, enemy) {
  if (!intent || intent.enemy !== enemy || enemy.ko) return false
  return intent.art ? !!intent.triggered : lead === intent.lead && !lead.guard && !lead.shieldHp
}
