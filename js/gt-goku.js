export const gtForm = fighter => fighter?.card.pas?.e?.gtForm || 0
export const gtSaveReady = fighter => gtForm(fighter) >= 1 && gtForm(fighter) <= 3 && !fighter.gtSaved

export function gtSurvive(fighter, side) {
  if (!gtSaveReady(fighter)) return false
  fighter.gtSaved = true
  fighter.gtSaveTurn = side?.formTurn || 0
  fighter.hp = Math.max(1, Math.ceil(fighter.max * .25))
  fighter.ko = false
  if (gtForm(fighter) === 3) fighter.gtApeReady = true
  return true
}

export function gtReady(fighter) {
  switch (gtForm(fighter)) {
    case 1: return (fighter.gtAttacks || 0) >= 2
    case 2: return !!fighter.gtSpecialLanded
    case 3: return !!fighter.gtApeReady
    case 4: return !!fighter.gtRemembered
    default: return true
  }
}

const APE_ARTS = {
  strike: { name: 'STOMP', desc: 'Hit the active enemy and chip the bench' },
  blast: { name: 'MOUTH BEAM', desc: 'Spend 1 Rage to pierce Guard and deal bonus damage' },
  guard: { name: 'REMEMBER PAN', desc: 'Guard and unlock Super Saiyan 4' },
}
export const gtArt = (fighter, art) => gtForm(fighter) === 4 ? APE_ARTS[art] : undefined

export function gtEnter(fighter, side) {
  switch (gtForm(fighter)) {
    case 2:
      fighter.hp = Math.min(fighter.max, fighter.hp + Math.round(fighter.max * .2))
      break
    case 3:
      side.gauge = Math.max(side.gauge, 50)
      break
    case 4:
      fighter.hp = Math.min(fighter.max, fighter.hp + Math.round(fighter.max * .35))
      fighter.gtRage = 0
      if (!side.hand.includes('guard')) side.hand.splice(3, 1, 'guard')
      break
    case 5:
      fighter.hp = fighter.max
      for (const debuff of ['burn', 'burnT', 'frozen', 'doom', 'sealed', 'silverSealed', 'aizenSealed', 'erasedUntil', 'gravityArts', 'sageTax', 'uzuhikoTurns', 'reversalUntil', 'gaugeDeny', 'bleed', 'sashReady']) fighter[debuff] = 0
      fighter.storyMark = fighter.sashOwner = fighter.storyClayOwner = null
      side.skip = 0
      side.confiscated = 0
      side.gauge = Math.min(100, side.gauge + 25 * fighter.gtRage)
      fighter.gtRage = 0
      break
  }
}
