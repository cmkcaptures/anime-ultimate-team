const passive = fighter => fighter.card.pas?.e || {}
const MAKI_TOJI = 'maki_toji_heavenly_restricti'

export function shrineWaveReady(fighter) {
  const kit = passive(fighter)
  if (kit.crToji === 1) return fighter.crSaved || fighter.crTagReady || fighter.crBrokeShield || fighter.crSpecials >= 2
  if (kit.crSukuna === 1) return fighter.crSaved || Object.values(fighter.crSpecialTargets || {}).some(count => count >= 2)
  return true
}

export function shrineWaveEnter(fighter, side) {
  const kit = passive(fighter)
  if (kit.crToji === 2) {
    fighter.hp = Math.min(fighter.max, fighter.hp + Math.round(fighter.max * .4))
    side.ki = Math.min(10, side.ki + 3)
  }
  if (kit.crSukuna === 2) {
    fighter.hp = Math.min(fighter.max, fighter.hp + Math.round(fighter.max * .35))
    side.gauge = 100
  }
}

export function shrineWaveSurvive(fighter, note) {
  const kit = passive(fighter)
  if (fighter.crSaved || !(kit.crToji || kit.crSukuna || kit.crGoku)) return false
  fighter.crSaved = true
  fighter.hp = Math.ceil(fighter.max * (kit.crGoku ? .2 : .25))
  note(fighter, 'SURVIVED THE KO')
  return true
}

export function tojiLink(leaving, entering, side, target, note) {
  if (leaving.ko) return false
  if (leaving.card.id === MAKI_TOJI && passive(entering).crToji && !entering.crDuoEntry) {
    entering.crDuoEntry = true
    side.ki = Math.min(10, side.ki + 2)
    if (passive(entering).crToji === 2) entering.crDiscount = true
    else entering.crTagReady = true
    note(entering, 'HEAVENLY RESTRICTION DUO · +2 ENERGY')
  }
  if (entering.card.id !== MAKI_TOJI || !passive(leaving).crToji || leaving.crDuoFollow ||
      leaving.crSealTurn !== (side.formTurn || 0) || leaving.crSealTarget !== target.key || target.ko) return false
  leaving.crDuoFollow = true
  return true
}

export function shrineActive(fighter, opponent) {
  return fighter.crShrineUntil != null && (opponent.formTurn || 0) <= fighter.crShrineUntil
}
