const REWARD_IDS = {
  rz1: 'muzan_demon_king',
  dt1: 'hiei_dragon_of_the_darkness_flame',
  db1: 'broly_lssj_untamed',
  pk1: 'ash_pikachu_world_monarch',
  'court-unwritten': 'yhwach_the_almighty_futur',
  'ng-afo': 'all_for_one_quirk_overload',
  'ng-dio': 'dio_za_warudo',
  'ng-uchiha': 'obito_six_paths',
  'ng-dragon': 'acnologia_dragon_king',
}

export function deadZoneReward(card) {
  if (card?.crucibleReward) return 'crucible'
  return card?.r === 'M' ? Object.keys(REWARD_IDS).find(zone => REWARD_IDS[zone] === card.id) : undefined
}

export function deadZoneCleared(zone, cleared = []) {
  return zone.stages.length > 0 && zone.stages.every(stage => cleared.includes(stage.n))
}
