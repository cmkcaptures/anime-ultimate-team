import { gtForm, gtReady, gtEnter } from './gt-goku.js?v=1'

// Battle forms borrow the owned card's stats and identity. The suffix is only
// for rendering so a cached thumbnail can never show the wrong form.
export function formCard(card, formIndex) {
  if (!formIndex) return card
  const { ver, url, fy, mv, tx, pas, rangedSpecial } = card.transformations[formIndex - 1]
  return { ...card, id: card.id + '_phase' + formIndex, ver, url, fy, mv, tx, pas, rangedSpecial: !!rangedSpecial }
}

export function nextTransformation(fighter, side, turn) {
  if (!fighter.card.transformations || fighter.ko || fighter.formsSpent) return null
  const next = fighter.card.transformations[fighter.formIndex || 0]
  if (!next) return null
  const clock = side.formTurn || 0
  const ready = (!gtForm(fighter) || gtReady(fighter)) && turn >= (next.minTurn || 1) && side.gauge >= next.gaugeCost &&
    (!next.fullTurns || clock - fighter.formEntered > next.fullTurns) &&
    (!next.maxHpPercent || fighter.hp * 100 <= fighter.max * next.maxHpPercent)
  return { ...next, ready }
}

export function enterTransformation(fighter, side, turn) {
  const next = nextTransformation(fighter, side, turn)
  if (!next?.ready) return null
  const clock = side.formTurn || 0
  fighter.baseForm ||= fighter.card
  fighter.formIndex = (fighter.formIndex || 0) + 1
  fighter.formEntered = clock
  fighter.formExpires = next.duration ? clock + next.duration : null
  fighter.card = formCard(fighter.baseForm, fighter.formIndex)
  fighter.pe = fighter.card.pas.e
  side.gauge -= next.gaugeCost
  if (next.entryShield) fighter.shieldHp = Math.max(fighter.shieldHp || 0, Math.round(fighter.max * next.entryShield / 100))
  if (gtForm(fighter)) gtEnter(fighter, side)
  return next
}

export function advanceFormTurn(side) {
  side.formTurn = (side.formTurn || 0) + 1
  for (const fighter of side.team) {
    if (fighter.formExpires == null || side.formTurn < fighter.formExpires) continue
    fighter.card = fighter.baseForm
    fighter.pe = fighter.card.pas.e
    fighter.formIndex = 0
    fighter.formExpires = null
    fighter.formsSpent = true
  }
}
