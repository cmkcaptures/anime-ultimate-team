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
  if (f.hogyokuSave) add('Hōgyoku ready', 'This fighter survives their next lethal hit or status effect at 1 HP.')
  if (f.doom > 0) add('☠ ' + f.doom, 'Death Note knocks this fighter out when the active-turn countdown reaches zero.')
  if (f.frozen) add('❄ Frozen', 'This fighter loses their next turn if still frozen.')
  if (f.rivalFlame) add('Flame on', 'King takes 40% less damage. The flame goes out on even rounds.')
  if (passive.queen) add("Launcher · " + (f.queenCharge || 0) + "/2", "Queen counters on the second blocked hit. Piercing his Guard clears the charge.")
  if (f.silverSealed) add('Still Silver', 'This fighter’s passive is sealed until its next full turn ends.')
  if (side.raidOpening) add('Raid Opening', 'The next damaging strike gains 35% damage.')
  if (passive.lastDoor === 'antithesis') add(side.antithesisUsed ? 'Antithesis spent' : 'Antithesis ready', 'Uryū reverses the first lethal enemy hit against another ally.')
  if (f.crewOpening) add('Opening', 'A different Straw Hat can use this Opening on their next damaging hit.')
  if (passive.crew === 'prayer') add('Prayer · ' + (f.prayer || 0) + '/3', 'Zero Hand spends Prayer for bonus damage.')
  if (f.uzuhikoTurns > 0) add('Uzuhiko · ' + f.uzuhikoTurns, 'Takes 8% max HP damage at the start of each team turn.')
  if (f.uzuhikoWeaken) add('Weakened', 'The next damaging attack deals 25% less damage.')
  if ((f.shinobiSeal || 0) > (side.formTurn || 0)) add('Six Paths Seal', 'Active buffs are removed and new buffs are suppressed.')
  if ((f.reversalUntil || 0) > (side.formTurn || 0)) add('Reversal', 'Outgoing damage is reduced by 15%.')
  if (passive.shinobi === 14) add(side.shinobiRestored ? 'Restoration spent' : 'Restoration ready', 'Omnipotence can revive a chosen KO’d ally once per battle or cast Shinjutsu Reversal.')
  if (passive.shinobi === 21 && f.susanooStored) add('Susanoo · ' + f.susanooStored, 'Stored damage is added to Indra’s next Ultimate.')
  if (f.sealed || f.erasedUntil > 0) add('⊘ Sealed', 'This fighter’s passive is disabled.')
  if (f.pe.absorbRanged) add('Absorb ' + (f.absorbed || 0) + '/4', passive.absorbRanged ?
    'Ranged attacks are absorbed. Four Blasts from the same fighter build Power, Energy, and Defense toward that fighter’s stats.' : 'Absorption is currently disabled.')
  if (f.pe.ichigoResolve) add('Resolve ' + (f.ichigoCharge || 0) + '/3', passive.ichigoResolve ?
    'Land a Strike (+1) or Getsuga Cross (+2), once per team turn. At 3, your next Ultimate becomes Final Getsuga.' : 'Resolve is currently sealed.')
  if (f.pe.galaxyImpact) add('Wipe ' + (f.galaxyUsed ? 'spent' : passive.galaxyImpact ? 'ready' : 'sealed'),
    f.galaxyUsed ? 'Galaxy Impact already removed the enemy shields this battle.' : 'The first Galaxy Impact removes every enemy shield before dealing damage. Requires a full Ultimate gauge and an active passive.')
  if (passive.batch === 'orihimeFinal') add('KO rewrites · ' + (2 - (side.batchRewrites || 0)), 'Orihime can cancel two lethal hits against other allies per battle while she is alive.')
  if ((side.batchResolveUntil ?? -1) >= (side.formTurn || 0)) add('Resolve · +20% damage', 'Orihime boosted the team’s damage.')
  if (f.batchHornet) add('Hornet mark', 'Soi Fon can detonate this mark with her Special or Ultimate.')
  if (f.batchFlash && passive.batch === 'yoruichi') add('Shunkō ready', 'Next Special strips shields, pierces Guard and gains 30% damage.')
  if (f.batchThunder) add('Thunder mark', 'Yoruichi can detonate this mark with Raijin Senki.')
  if (f.batchTide && passive.batch === 'harribel') add('Tiburón · ' + f.batchTide, 'Stored damage goes into your next landed Special or Cascada.')
  if (f.batchIce) add('White Moon', f.batchChill && f.batchChillAction == null ?
    'Next damaging attack deals half damage. Rukia or Tōshirō can shatter the ice with their Ultimate.' :
    'Rukia or Tōshirō can shatter the ice with their Ultimate.')
  if (f.batchWater) add('Water Lock', 'An allied Gray can trigger a piercing follow-up on this target.')
  if (f.batchFeathers) add('Fierce Wings', 'Feathers can intercept the next hit while Hawks is on the bench.')
  if (passive.batch === 'piccolo' && f.batchCharge) add('Cover · ' + f.batchCharge, 'Your next Special adds this stored damage and pierces Guard.')
  if (passive.batch === 'toga' && f.batchCopy) add('Copy · ' + f.batchCopy, 'The next landed Special spends this copy.')
  if (passive.batch === 'diane') add('Quake · ' + (f.batchQuake || 0) + '/3', 'Each charge adds 20% Ultimate damage.')
  if ((side.batchOrder ?? -1) >= (side.formTurn || 0)) add('New Order', 'Damaging Arts cost 2 additional Energy.')
  if (f.crSealUntil) add('Passive sealed', 'This fighter’s passive is disabled until the seal expires.')
  if (next) {
    const requirements = []
    if (turn < (next.minTurn || 1)) requirements.push('Reach turn ' + next.minTurn)
    const remaining = (next.fullTurns || 0) + 1 - ((side.formTurn || 0) - f.formEntered)
    if (next.fullTurns && remaining > 0) requirements.push('Wait ' + remaining + ' more team turn' + (remaining === 1 ? '' : 's'))
    if (next.maxHpPercent && f.hp * 100 > f.max * next.maxHpPercent) requirements.push('Reach ' + next.maxHpPercent + '% HP or lower')
    if (side.gauge < next.gaugeCost) requirements.push('Gain ' + Math.ceil(next.gaugeCost - side.gauge) + '% more Ultimate gauge')
    add(next.ver.startsWith('BARYON') ? 'Baryon' : 'Kurama', next.ver + ' · ' + (requirements.join(' · ') || 'Ready when you can act') + ' · Costs ' + next.gaugeCost + '% Ultimate gauge.')
  }
  // always-on passives, shown as icons so players can see what's working
  if (passive && !f.sealed) {
    const p = passive
    if (p.dodge) add('💨 ' + p.dodge + '%', 'Dodges ' + p.dodge + '% of attacks completely.')
    if (p.dr) add('🛡 -' + p.dr + '%', 'Takes ' + p.dr + '% less damage from every hit.')
    if (p.reflect) add('↩ ' + p.reflect + '%', 'Sends ' + p.reflect + '% of damage taken back at the attacker.')
    if (p.regen && !f.deadZoneEnemy) add('✚ ' + p.regen + '%', 'Heals ' + p.regen + '% max HP at the start of each turn.')
    if (p.teamHeal && !f.deadZoneEnemy) add('✚ Team ' + p.teamHeal + '%', 'Heals the whole team ' + p.teamHeal + '% each turn.')
    if (p.dmg) add('⚔ +' + p.dmg + '%', 'Deals ' + p.dmg + '% more damage.')
    if (p.teamDmg) add('⚔ Team +' + p.teamDmg + '%', 'The whole team deals ' + p.teamDmg + '% more damage.')
    if (p.pierce) add('➶ Pierce', 'Every attack ignores Guard.')
    if (p.first) add('⚡ First', 'Always moves first.')
    if (p.ramp) add('📈 +' + Math.min(p.rampMax || 99, p.ramp * (f.turns || 0)) + '%', 'Gains ' + p.ramp + '% damage every turn it stays in (max ' + (p.rampMax || 99) + '%).')
    if (p.nullPassive) add('⊘ Sealer', 'Switches off the active enemy passive.')
  }
  if (f.endure > 0) add('♥ KO save ×' + f.endure, 'Survives ' + (f.endure > 1 ? f.endure + ' more KOs' : 'the next KO') + ' at 1 HP.')
  if (f.firstNull > 0) add('◎ Block ×' + f.firstNull, 'The next ' + f.firstNull + ' hit' + (f.firstNull > 1 ? 's do' : ' does') + ' nothing.')
  if (f.ultDodge > 0) add('✖ Ult erase ×' + f.ultDodge, 'Erases the next Ultimate fired at this fighter.')
  if (side && side.bond && side.bond.tier) add('🔗 Bond ' + side.bond.n + '/6', 'Squad Bond: team takes ' + side.bond.dr + '% less damage' + (side.bond.regen ? ' and heals ' + side.bond.regen + '% a turn' : '') + '.')
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
