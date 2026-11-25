const kit = fighter => fighter?.card.pas?.e || {}
const rogue = fighter => fighter?.card.id === 'rogue_cheney_dragon_force'
const sting = fighter => !!(kit(fighter).ftSting || kit(fighter).ftStingForce)
const twins = (first, second) => (sting(first) && rogue(second)) || (rogue(first) && sting(second))
const SLAYER_NAMES = new Set(['NATSU', 'GAJEEL', 'LAXUS', 'WENDY', 'STING', 'ROGUE CHENEY', 'ACNOLOGIA'])
const dragonSlayer = fighter => fighter.card.cat?.includes('Dragon Slayers') ||
  (fighter.card.anime === 'FT' && SLAYER_NAMES.has(fighter.card.name))
const shield = (fighter, fraction) => {
  fighter.shieldHp = Math.max(fighter.shieldHp || 0, Math.round(fighter.max * fraction))
}

export function fairyReady(fighter) {
  if (kit(fighter).ftSting) return fighter.ftTagReady || (fighter.ftSpecials || 0) >= 2
  if (kit(fighter).ftLaxus) return fighter.ftSurvived || (fighter.ftCharge || 0) >= 3
  return true
}

export function fairyEnter(fighter, side) {
  const passive = kit(fighter)
  if (passive.ftStingForce) {
    fighter.hp = Math.min(fighter.max, fighter.hp + Math.round(fighter.max * .3))
    side.gauge = Math.min(100, side.gauge + 50)
  } else if (passive.ftRedLightning) {
    fighter.hp = Math.min(fighter.max, fighter.hp + Math.round(fighter.max * .4))
    side.gauge = 100
  }
}

export function fairySurvive(fighter, side, PE, note) {
  const passive = PE(fighter)
  if ((passive.ftSting || passive.ftStingForce || passive.ftLaxus || passive.ftRedLightning) && !fighter.ftSurvived) {
    fighter.ftSurvived = true
    fighter.hp = Math.ceil(fighter.max * .25)
    note(fighter, 'DRAGON SLAYER · SURVIVED')
    return true
  }
  const wendy = !side?.ftWendySaved && side?.team.find(ally => ally !== fighter && !ally.ko && PE(ally).ftWendy)
  if (!wendy) return false
  side.ftWendySaved = true
  fighter.hp = Math.ceil(fighter.max * .25)
  note(wendy, 'SKY ENCHANTMENT · ALLY SAVED')
  return true
}

export function fairyCharge(side, defender, clock, PE, note) {
  for (const laxus of side?.team || []) {
    if (laxus === defender || laxus.ko || !PE(laxus).ftLaxus || laxus.ftChargeTurn === clock || laxus.ftCharge >= 3) continue
    laxus.ftChargeTurn = clock
    laxus.ftCharge = (laxus.ftCharge || 0) + 1
    note(laxus, 'RED LIGHTNING · ' + laxus.ftCharge + '/3')
  }
}

export function fairyTag(side, leaving, entering, PE, maxEnergy, note) {
  if (leaving === entering || leaving.ko) return false
  const passive = PE(leaving)
  let assist = false
  if (PE(entering).ftSting && dragonSlayer(leaving) && leaving.ftLastSpecial === (side.formTurn || 0)) {
    entering.ftTagReady = true
    assist = true
  }
  if (twins(leaving, entering) && side.ftTwinTurn !== (side.formTurn || 0)) {
    side.ftTwinTurn = side.formTurn || 0
    side.ki = Math.min(maxEnergy, side.ki + 2)
    shield(entering, .2)
    note(entering, 'TWIN DRAGONS · SHIELD AND +2 ENERGY')
    assist = true
  }
  if (passive.ftWendy) {
    for (const key of ['burn', 'burnT', 'frozen', 'doom', 'sealed', 'silverSealed', 'aizenSealed', 'erasedUntil', 'gravityArts', 'sageTax', 'uzuhikoTurns', 'reversalUntil', 'gaugeDeny']) entering[key] = 0
    entering.storyMark = null
    shield(entering, .25)
    if (dragonSlayer(entering)) side.ki = Math.min(maxEnergy, side.ki + 2)
    note(entering, 'SKY ENCHANTMENT · CLEANSED AND SHIELDED')
  }
  if (passive.ftJellal && leaving.ftMeteor) {
    leaving.ftMeteor = false
    entering.ftMeteor = true
    side.ki = Math.min(maxEnergy, side.ki + 2)
    note(entering, 'METEOR · NEXT SPECIAL EMPOWERED')
  }
  if (passive.ftHappy && !leaving.ftHappyUsed) {
    leaving.ftHappyUsed = true
    assist = true
    note(entering, 'AERA · FOLLOW-UP')
  }
  return assist
}

export function fairyAfterArt(fighter, foe, side, art, hits, PE, note) {
  const passive = PE(fighter), clock = side.formTurn || 0
  if (!hits.some(hit => hit.dmg > 0)) return
  if (art === 'special') {
    fighter.ftLastSpecial = clock
    if (passive.ftSting) fighter.ftSpecials = (fighter.ftSpecials || 0) + 1
    const partner = side.team.find(ally => !ally.ko && twins(fighter, ally))
    if (partner) partner.ftTwinSpecial = true
    if (passive.ftGray && fighter.ftIceTurn !== clock && !foe.ko) {
      fighter.ftIceTurn = clock
      foe.ftIce = fighter.key
      note(foe, 'DEVIL ICE · MARKED')
    }
  }
  if (passive.ftJellal && (art === 'strike' || art === 'blast')) {
    if (fighter.ftMeteorTurn !== clock) {
      fighter.ftMeteorTurn = clock
      fighter.ftMeteorArts = 0
    }
    if (fighter.ftMeteorArts !== 3) {
      fighter.ftMeteorArts |= art === 'strike' ? 1 : 2
      if (fighter.ftMeteorArts === 3) {
        fighter.ftMeteor = true
        note(fighter, 'METEOR READY')
      }
    }
  }
}
