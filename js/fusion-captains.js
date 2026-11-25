const kit = fighter => fighter.card.pas?.e || {}

export function fusionReady(fighter) {
  return kit(fighter).fusionStage !== 1 || fighter.fcSaved || fighter.fcAttacks === 3
}

export function fusionEnter(fighter, side) {
  if (kit(fighter).fusionStage !== 2) return
  fighter.hp = Math.min(fighter.max, fighter.hp + Math.round(fighter.max * .5))
  for (const key of ['burn', 'burnT', 'frozen', 'doom', 'sealed', 'silverSealed', 'aizenSealed', 'erasedUntil',
    'gravityArts', 'sageTax', 'uzuhikoTurns', 'reversalUntil', 'gaugeDeny', 'crSealUntil']) fighter[key] = 0
  for (const key of ['fcGhost', 'fcPetals', 'fcFrost', 'fcFrostTax', 'storyMark', 'crShrineMark']) delete fighter[key]
  side.skip = 0
  side.confiscated = 0
  side.gauge = 100
}

export function fusionCaptainSave(fighter, side, note) {
  const e = kit(fighter)
  if (fighter.fcSaved || (e.fusionStage !== 1 && !e.captainFrost)) return false
  fighter.fcSaved = true
  fighter.hp = Math.ceil(fighter.max * .25)
  if (e.captainFrost && side) side.gauge = Math.min(100, side.gauge + 50)
  note(fighter, e.captainFrost ? 'FROZEN FIELD · SURVIVED' : 'FUSION DANCE READY · SURVIVED')
  return true
}
