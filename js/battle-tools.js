export function fighterStatuses(f, passive, next, side, turn, enemyBasic) {
  const entries = []
  const add = (label, detail) => entries.push({ label, detail })
  if (f.rivalBarrier > 0) add('Barrier ' + f.rivalBarrier + '/3', 'Each landed Strike removes a charge. Ranged Arts deal reduced damage while the barrier holds.')
  if (f.hakaiAt != null) add('Hakai · T' + f.hakaiAt, 'Toppo fires Hakai on enemy turn ' + f.hakaiAt + '. Guard or switch to a tank.')
  if (f.shisuiDamp) add('Kotoamatsukami', 'The next damaging Art deals half damage.')
  if (f.pe.shisuiFlicker && !f.shisuiSpent && f.shisuiMark) add('Koto mark', 'Kotoamatsukami is available when the marked fighter is active and your Ultimate gauge is full.')
  if (passive.skillHunter) add("Read · " + (enemyBasic || "—"), "Strike boosts damage, Blast refunds Energy, Guard strips shields and pierces Guard.")
  if (f.shieldHp > 0) add('⬡ ' + Math.round(f.shieldHp), 'Shield absorbs up to ' + Math.round(f.shieldHp) + ' damage. It stays until depleted or removed.')
  if (f.guard) add('◆ Guard', 'Reduces damage from the next hit unless the attack pierces Guard.')
  if (f.burnT > 0) add('♨ ' + f.burnT, 'Burn triggers at the start of this fighter’s active turn. ' + f.burnT + ' ticks left at ' + f.burn + '% max HP each.')
  if (f.doom > 0) add('☠ ' + f.doom, 'Death Note knocks this fighter out when the active-turn countdown reaches zero.')
  if (f.frozen) add('❄ Frozen', 'This fighter loses their next turn if still frozen.')
  if (f.sealed || f.erasedUntil > 0) add('⊘ Sealed', 'This fighter’s passive is disabled.')
  if (f.pe.absorbRanged) add('Absorb ' + (f.absorbed || 0) + '/4', passive.absorbRanged ?
    'Ranged attacks are absorbed. Four Blasts from the same fighter build Power, Energy, and Defense toward that fighter’s stats.' : 'Absorption is currently disabled.')
  if (f.pe.ichigoResolve) add('Resolve ' + (f.ichigoCharge || 0) + '/3', passive.ichigoResolve ?
    'Land a Strike (+1) or Getsuga Cross (+2), once per team turn. At 3, your next Ultimate becomes Final Getsuga.' : 'Resolve is currently sealed.')
  if (f.pe.galaxyImpact) add('Wipe ' + (f.galaxyUsed ? 'spent' : passive.galaxyImpact ? 'ready' : 'sealed'),
    f.galaxyUsed ? 'Galaxy Impact already removed the enemy shields this battle.' : 'The first Galaxy Impact removes every enemy shield before dealing damage. Requires a full Ultimate gauge and an active passive.')
  if (next) {
    const requirements = []
    if (turn < (next.minTurn || 1)) requirements.push('Reach turn ' + next.minTurn)
    const remaining = (next.fullTurns || 0) + 1 - ((side.formTurn || 0) - f.formEntered)
    if (next.fullTurns && remaining > 0) requirements.push('Wait ' + remaining + ' more team turn' + (remaining === 1 ? '' : 's'))
    if (next.maxHpPercent && f.hp * 100 > f.max * next.maxHpPercent) requirements.push('Reach ' + next.maxHpPercent + '% HP or lower')
    if (side.gauge < next.gaugeCost) requirements.push('Gain ' + Math.ceil(next.gaugeCost - side.gauge) + '% more Ultimate gauge')
    add(next.ver.startsWith('BARYON') ? 'Baryon' : 'Kurama', next.ver + ' · ' + (requirements.join(' · ') || 'Ready when you can act') + ' · Costs ' + next.gaugeCost + '% Ultimate gauge.')
  }
  return entries
}

export function artPreview({ kind, name, desc, active, targets, ranged, pierce, guard, sealed, absorb, unavailable }) {
  const lines = [desc]
  if (targets.length) lines.push('Targets: ' + targets.join(', '))
  if (guard) lines.push(pierce ? 'This attack can pierce Guard.' : 'The active target has Guard.')
  if (ranged && absorb) lines.push('The active target may absorb this ranged attack.')
  if (sealed) lines.push('Your Special is currently disabled.')
  if (unavailable) lines.push('This Art is currently unavailable.')
  if (kind === 'wing' && !targets.length) lines.push('No knocked-out ally to revive.')
  if (kind === 'burst') lines.push('Consumes all remaining Energy.')
  return { title: active + ' · ' + name, lines: lines.filter(Boolean) }
}

export function battleInfo(arena, title, lines) {
  const previous = arena.querySelector('.battle-info')
  if (previous?.open) previous.close()
  previous?.remove()
  const dialog = document.createElement('dialog')
  dialog.className = 'battle-info'
  dialog.setAttribute('aria-label', title)
  const heading = document.createElement('h3')
  heading.textContent = title
  const close = document.createElement('button')
  close.className = 'btn dark sm'
  close.textContent = 'CLOSE'
  close.onclick = () => dialog.close()
  const list = document.createElement('ol')
  for (const text of lines) {
    const item = document.createElement('li')
    item.textContent = text
    list.append(item)
  }
  dialog.append(heading, list, close)
  dialog.addEventListener('close', () => dialog.remove(), { once: true })
  arena.append(dialog)
  dialog.showModal()
}
