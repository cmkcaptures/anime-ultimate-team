const stage = (index, name, card, mechanic, description, ngAdj = { hp: 1, dmg: 1 }) => ({
  n: index % 3 + 1, name, boss: card, enemy: [card], newGen: index, mechanic, ngAdj,
  boost: (3.7 + Math.min(index, 8) * .24) * (ngAdj.pow || 1), final: index % 3 === 2,
  rules: [[name, description, {}]],
  weak: [], weakB: 0, resist: 0, tip: description,
  reward: { coins: 22000 + index * 4500, premium: index % 3 === 2 ? 3 : 1, shards: 1100 + index * 350 },
})

export const NEW_GEN_ZONES = [
  { id: 'ng-sukuna', name: 'King of Curses', sub: 'New Gen · Jujutsu Kaisen', stages: [
    stage(0, 'The Vessel', 'sukuna_vessel', 'read', 'Avoid the called Art or Sukuna charges his Ultimate.'),
    stage(1, 'Divine Flame', 'sukuna_vessel_heian_shrine', 'rush', 'Guard, shield or rotate the marked fighter before Divine Flame lands.'),
    stage(2, 'Malevolent Shrine', 'sukuna_final', 'stay', 'On Shrine rounds, switching feeds Cleave. Stay in and prepare to defend.'),
  ] },
  { id: 'ng-shigaraki', name: 'The End of Heroes', sub: 'New Gen · My Hero Academia', stages: [
    stage(3, 'Decay', 'shigaraki_decay', 'rotate', 'Switch out the marked fighter before Shigaraki attacks.'),
    stage(4, 'Hand Jack', 'shigaraki_handjack', 'read', 'Avoid the called Art or Shigaraki steals 2 Energy.'),
    stage(5, 'All For One Awakened', 'shigaraki_final', 'break', 'Break his Guard to interrupt the Decay charge. He gets back up once.'),
  ] },
  { id: 'ng-aizen', name: 'Beyond the Hōgyoku', sub: 'New Gen · Bleach', stages: [
    stage(6, 'Fifth Division Captain', 'aizen_captain', 'mix', 'Repeating the same attack triggers Aizen’s counter. Mix your Arts.'),
    stage(7, 'Las Noches Throne', 'aizen_throne', 'illusion', 'Read the warning each round. Aizen alternates between attack reads and punishing switches.'),
    stage(8, 'Hōgyoku Fusion', 'aizen_hogyoku', 'break', 'Break Aizen’s Guard to interrupt his charged attack. Save an answer for his second wind.'),
  ] },
  { id: 'ng-afo', name: 'Symbol of Evil', sub: 'New Gen · My Hero Academia', stages: [
    stage(9, 'Stolen Quirks', 'all_for_one_symbol_of_evil', 'read', 'All For One reads your moves. Avoid the called Art or he steals your momentum and charges his Ultimate.', { pow: 0.5, hp: 2.1, dmg: 0.6, cap: 0.1 }),
    stage(10, 'Hellflame Heir', 'dabi_final', 'rush', 'Dabi marks a fighter for his blaze. Guard, shield or switch the marked fighter before it lands.', { pow: 0.65, hp: 1.9, dmg: 1.2, cap: 0.17 }),
    stage(11, 'Quirk Overload', 'all_for_one_quirk_overload', 'mix', 'All For One copies whatever you repeat and throws it back. Mix your Arts every turn.', { hp: 1.2, dmg: 1.4, cap: 0.45 }),
  ] },
  { id: 'ng-dio', name: 'The World', sub: 'New Gen · JoJo', stages: [
    stage(12, 'Space Ripper', 'dio_vampire', 'read', 'Dio reads your next move. Avoid the called Art or his Space Ripper Stingy Eyes punishes it.', { hp: 1.7, dmg: 2, cap: 0.34 }),
    stage(13, 'Road Roller', 'dio_the_world', 'break', 'Dio is charging the Road Roller. Break his Guard to stop it.', { hp: 1.9, dmg: 2.4, cap: 0.28 }),
    stage(14, 'ZA WARUDO', 'dio_the_world', 'illusion', 'Time stops. Read the warning every round: some rounds punish the wrong Art, others punish switching.', { hp: 1.9, dmg: 2.4, cap: 0.26 }),
  ] },
]

export function newGenBalance(index, power, ngAdj = { hp: 1, dmg: 1 }) {
  const elite = Math.min(.9, Math.max(0, power - .94))
  if (index >= 9) { // each stage after Aizen's final is 5% harder than the one before it
    const k = 1 + (index - 8) * .05 // then tuned per boss kit from simulated fights (ngAdj)
    return {
      hp: (2.65 + 8 * .14 + elite * 1.45 * .55) * .82 * k * ngAdj.hp,
      damage: (1.45 + 8 * .07 + elite * .36 * .55) * .86 * k * ngAdj.dmg,
      incomingHitCap: ngAdj.cap || .56 + (index - 8) * .01, // cap = biggest share of the boss HP one hit can take; tuned per stage
    }
  }
  const aizen = index >= 6 // Beyond the Hōgyoku was the hardest zone by far: softer stats, players hit harder
  return {
    hp: (2.65 + index * .14 + elite * 1.45 * .55) * (aizen ? .82 : 1),
    damage: (1.45 + index * .07 + elite * .36 * .55) * (aizen ? .86 : 1),
    incomingHitCap: .36 + index * .015 + (aizen ? .08 : 0),
  }
}

export function newGenIntent(mechanic, lead, enemy, roll) {
  const kind = mechanic === 'illusion' ? (roll < .5 ? 'read' : 'stay') : mechanic
  return { kind, lead, enemy, art: kind === 'read' ? ['strike', 'blast', 'special'][Math.floor(roll * 3)] : null }
}

export function newGenFailed(intent, lead, switched) {
  if (intent.kind === 'stay') return switched
  if (intent.kind === 'rotate') return intent.lead === lead
  if (intent.kind === 'break') return !!intent.enemy.guard
  if (intent.kind === 'rush') return intent.lead === lead && !lead.guard && !lead.shieldHp
  return !!intent.triggered
}

export function newGenWarning(intent, artName) {
  return {
    stay: 'SWITCH TRAP · Stay with your lead',
    rotate: 'DECAY MARK · Switch your lead',
    break: 'CHARGING · Break the boss’s Guard',
    rush: 'HEAVY RUSH · Guard, shield or switch',
    mix: 'COUNTER READY · Vary your attacking Arts',
    read: 'ENEMY READ · Avoid ' + artName,
  }[intent.kind]
}
