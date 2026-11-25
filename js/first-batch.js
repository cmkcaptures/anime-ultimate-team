const shield = (f, fraction) => { f.shieldHp = Math.max(f.shieldHp, Math.round(f.max * fraction)) }
const ready = (f, side, field) => f[field] !== (side.formTurn || 0)
const spend = (f, side, field) => { f[field] = side.formTurn || 0 }
const living = side => side.team.filter(f => !f.ko)
const energy = (side, amount) => { side.ki = Math.min(10, side.ki + amount) }
const gauge = (side, amount) => { side.gauge = Math.min(100, side.gauge + amount) }

export function batchTax(art, side, opponent, passive) {
  if (!side || !opponent) return 0
  const repeated = side.batchMemory === art && living(opponent).some(ally => passive(ally).batch === 'gowther')
  const order = side.batchOrder != null && side.batchOrder >= (side.formTurn || 0)
  return (repeated ? 1 : 0) + (order ? 2 : 0)
}

export function batchDefense(att, def, damage, side, area, passive, note) {
  if (!side || !damage) return damage
  const allies = living(side).filter(f => f !== def)
  if (def.batchFeathers && allies.some(f => f.key === def.batchFeathers && passive(f).batch === 'hawks')) {
    def.batchFeathers = false
    note(def, 'FIERCE WINGS · HIT INTERCEPTED')
    return 0
  }
  const gyomei = !area && damage >= def.hp && allies.find(f => passive(f).batch === 'gyomei' && !f.batchSave)
  if (gyomei) {
    gyomei.batchSave = true
    gyomei.batchCounter = true
    const absorbed = Math.min(gyomei.hp - 1, Math.ceil(gyomei.max * .25))
    gyomei.hp -= absorbed
    gyomei.taken = (gyomei.taken || 0) + absorbed
    att.dealt += absorbed
    shield(gyomei, .3)
    note(gyomei, 'STONE BREATHING · ALLY SAVED')
    return 0
  }
  const harribel = side.team.find(f => !f.ko && passive(f).batch === 'harribel' && ready(f, side, 'batchTideTurn'))
  if (harribel) {
    spend(harribel, side, 'batchTideTurn')
    const prevented = Math.ceil(damage * .4)
    harribel.batchTide = Math.min(Math.round(harribel.max * .7), (harribel.batchTide || 0) + prevented)
    note(harribel, 'TIBURÓN · DAMAGE ABSORBED')
    return damage - prevented
  }
  const piccolo = !area && allies.find(f => passive(f).batch === 'piccolo' && ready(f, side, 'batchCover'))
  if (piccolo) {
    spend(piccolo, side, 'batchCover')
    const absorbed = Math.min(Math.ceil(damage * .8), Math.ceil(piccolo.max * .45), piccolo.shieldHp + Math.max(0, piccolo.hp - 1))
    const barrier = Math.min(piccolo.shieldHp, absorbed)
    piccolo.shieldHp -= barrier
    piccolo.hp -= absorbed - barrier
    piccolo.taken = (piccolo.taken || 0) + absorbed - barrier
    piccolo.recapShielded = (piccolo.recapShielded || 0) + barrier
    att.dealt += absorbed - barrier
    piccolo.batchCharge = Math.min(Math.round(piccolo.max * .6), (piccolo.batchCharge || 0) + absorbed)
    if (absorbed) note(piccolo, 'ORANGE PICCOLO · COVER CHANGE')
    return damage - absorbed
  }
  return damage
}

export function batchTag(side, leaving, entering, passive, heal, note) {
  const outgoing = passive(leaving).batch
  const incoming = passive(entering).batch
  if (!leaving.ko && outgoing === 'hawks') {
    entering.batchFeathers = leaving.key
    leaving.batchWingTarget = entering.key
    note(leaving, 'FIERCE WINGS · ALLY COVERED')
  }
  if (!leaving.ko && outgoing === 'diane') shield(entering, .25)
  if (incoming === 'piccolo') shield(entering, .35)
  if (['muichiro', 'mirio', 'juvia'].includes(incoming) && ready(entering, side, 'batchEntry')) {
    spend(entering, side, 'batchEntry')
    entering.batchDodge = true
  }
  const orihime = leaving.batchLastHit > 0 && leaving.hp < leaving.max && !leaving.ko &&
    living(side).find(f => f !== leaving && passive(f).batch === 'orihime' && !f.batchSave)
  if (orihime) {
    orihime.batchSave = true
    heal(leaving, Math.min(leaving.batchLastHit || 0, leaving.max * .45))
    shield(entering, .3)
    note(orihime, 'SŌTEN KISSHUN · DAMAGE REJECTED')
  }
  const covered = incoming === 'hawks' && side.team.find(f => f.key === entering.batchWingTarget && f.batchFeathers === entering.key)
  if (!covered) return false
  covered.batchFeathers = false
  return true
}

export function batchSpecial(a, d, me, foe, passive, heal, note) {
  const kit = passive(a).batch
  const partner = (...names) => living(me).some(f => names.includes(passive(f).batch))
  if (kit === 'rukia') {
    d.batchIce = a.key
    d.batchChill = true
    note(d, 'WHITE MOON · NEXT ATTACK WEAKENED')
  }
  if (kit === 'hinata') {
    foe.ki = Math.max(0, foe.ki - 2)
    foe.gauge = Math.max(0, foe.gauge - 20)
    note(a, 'GENTLE FIST · ENERGY AND ULT DRAINED')
  }
  if (kit === 'juvia') { d.batchWater = a.key; note(d, 'WATER LOCK · GRAY FOLLOW-UP READY') }
  if (kit === 'genya' && !a.batchSave && (d.card.cat?.includes('Demons') || partner('sanemi'))) {
    a.batchSave = true
    heal(a, a.max * .35)
    return 430
  }
  if (kit === 'toga') {
    if (!a.batchCopy) {
      a.batchCopy = d.card.role
      note(a, 'TRANSFORM · COPIED ' + a.batchCopy)
    } else {
      const copy = a.batchCopy
      delete a.batchCopy
      if (copy === 'TANK') { shield(a, .4); a.guard = 1 }
      else if (copy === 'SUPPORT') { for (const ally of living(me)) heal(ally, ally.max * .18); energy(me, 3) }
      else return 750
    }
  }
  return 0
}

export function batchUltimate(a, d, me, foe, choice, base, hit, passive, note) {
  const kit = passive(a).batch
  if (kit === 'yoruichi') {
    const marked = d.batchThunder === a.key
    const result = hit(d, base * (marked ? 1.5 : 1), true, { noDodge: marked })
    if (marked && result?.dmg > 0) {
      d.batchThunder = null
      gauge(me, 25)
      energy(me, 1)
      note(a, 'RAIJIN SENKI · MARK DETONATED')
    }
    return true
  }
  if (kit === 'harribel') {
    for (const ally of living(me)) shield(ally, .3)
    const stored = a.batchTide || 0
    a.batchTide = 0
    for (const enemy of living(foe)) hit(enemy, base * (enemy === d ? 1 : .58), true, { stored: enemy === d ? stored : 0 })
    note(a, 'CASCADA · TEAM SHIELDED')
    return true
  }
  if (kit === 'star') {
    if (choice === 'suppress' || (choice === undefined && !living(me).some(f => f.hp < f.max * .55))) {
      if (d.card.r !== 'X' && !d.deadZoneEnemy && !d.scoreBoss && !d.encounterPhase && d.rivalBarrier == null) d.crSealUntil = (foe.formTurn || 0) + 1
      foe.batchOrder = (foe.formTurn || 0) + 1
      hit(d, base, true)
      note(a, 'NEW ORDER · SUPPRESS')
    } else {
      for (const ally of living(me)) { shield(ally, .5); ally.guard = 1 }
      hit(d, base * .8, true)
      note(a, 'NEW ORDER · PROTECT')
    }
    return true
  }
  if (kit === 'merlin') {
    for (const enemy of living(foe)) {
      enemy.shieldHp = enemy.guard = enemy.rage = enemy.fort = 0
    }
    energy(me, 4)
    gauge(me, 25)
    hit(d, base, true)
    note(a, 'INFINITY · ENEMY BUFFS STRIPPED')
    return true
  }
  if (kit === 'rukia' || passive(a).captainFrost) {
    let shattered = false
    for (const enemy of living(foe)) {
      const ice = !!enemy.batchIce
      const frost = !!enemy.fcFrost
      const result = hit(enemy, base * (enemy === d ? 1 : .55) * (ice ? 1.75 : frost ? 1.5 : 1), true)
      if (!result?.dmg) continue
      if (frost) { delete enemy.fcFrost; delete enemy.fcFrostTax }
      if (ice) { delete enemy.batchIce; delete enemy.batchChill; shattered = true }
    }
    if (shattered) { gauge(me, 35); energy(me, 2); note(a, 'WHITE MOON SHATTERED · +35% ULT · +2 ENERGY') }
    return true
  }
  if (kit === 'diane') {
    const force = Math.min(3, a.batchQuake || 0)
    for (const enemy of living(foe)) hit(enemy, base * (enemy === d ? 1 : .55) * (1 + force * .2), true)
    a.batchQuake = 0
    return true
  }
  return false
}
