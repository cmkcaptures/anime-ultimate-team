const abilityIndex = new WeakMap()
const normalize = value => String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const abilityAliases = {
  galaxyImpact: 'shield break strip remove shields', absorbRanged: 'absorb blasts ranged absorption',
  revive: 'revive resurrection', regen: 'healing regeneration', lifeErosion: 'life force max hp drain',
}

export function matchesCard(card, query) {
  const terms = normalize(query).split(' ').filter(Boolean)
  if (!terms.length) return true
  if (!abilityIndex.has(card)) {
    const fields = [card.name, card.ver, card.role, card.faction, ...(card.cat || []), ...(card.aura || [])]
    for (const form of [card, ...(card.transformations || [])]) {
      fields.push(form.ver, form.mv, form.pas?.n, form.pas?.d, ...(form.tx || []))
      for (const key of Object.keys(form.pas?.e || {})) fields.push(abilityAliases[key], key.replace(/([a-z])([A-Z])/g, '$1 $2'))
    }
    abilityIndex.set(card, normalize(fields.join(' ')))
  }
  return terms.every(term => abilityIndex.get(card).includes(term))
}

export function spendableCopies(entry, inTeam) {
  return entry?.locked ? 0 : Math.max(0, (entry?.n || 0) - Number(inTeam))
}

export function keepReveal(first, rank, quick) {
  return !quick || first || rank >= 5
}
