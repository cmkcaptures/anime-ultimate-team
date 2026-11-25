const stage = (index, name, card, mechanic, description) => ({
  n: index % 3 + 1, name, boss: card, enemy: [card], newGen: index, mechanic,
  boost: 3.7 + index * .24, final: index % 3 === 2,
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
]

export function newGenBalance(index, power) {
  const elite = Math.min(.9, Math.max(0, power - .94))
  return { hp: 3 + index * .24 + elite * 2.3, damage: 1.88 + index * .115 + elite * .52 }
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
