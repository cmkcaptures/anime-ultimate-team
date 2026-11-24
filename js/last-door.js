export const LAST_DOOR = 'ichigo_last_door'
export const KEEPER = 'uryu_keeper_of_names'
export const RESCUE_NAMES = ['Netero', 'Jinbe', 'Kawaki']

const scene = (...lines) => lines.map(([speaker, dialogue]) => [speaker, dialogue])
const stage = (n, name, enemy, intro, outro, special = {}) => ({
  n, name, enemy, scene: intro, outro, rating: 0, coins: n === 6 ? 10000 : 3200 + 450 * n, ...special,
})

export const LAST_DOOR_CHAPTERS = [
  { id: 6, name: 'The Names We Lost', sub: 'Chapter 6 · Soul Society', boss: 'Story/ichigo_last_door.jpg', stages: [
    stage(1, 'The Last Door', ['grimmjow_sexta', 'ulquiorra_segunda'],
      scene(['ICHIGO', 'You heard me? Good. Catch that kid. He falls off that roof every time the bell rings.'], ['LUFFY', 'Then let’s break the bell.'], ['URYU', 'I tried. The hammer fell before I swung it.']),
      scene(['ICHIGO', 'The kid made it past the corner.'], ['URYU', 'And the bell rang anyway. Something is replaying the evacuation.'])),
    stage(2, 'Your Name Is Missing', ['renji_zabimaru', 'kenpachi_nozarashi_zenkai'],
      scene(['URYU', 'There’s a blank page where your name should be.'], ['RENJI', 'I know your face. I just can’t remember why I’m supposed to let you past.'], ['ICHIGO', 'Then watch how I fight.']),
      scene(['RENJI', 'Ichigo. There it is.'], ['URYU', 'The registry still says nobody was here. Good thing you trust your eyes.']),
      { guest: LAST_DOOR, rule: 'unrecorded', hint: 'Guest Ichigo leads. The registry cannot read his Arts.' }),
    stage(3, 'The Other Winner', ['meruem_the_king'],
      scene(['NETERO', 'I remember dying in this room.'], ['MERUEM', 'I remember you helping me to my feet. Which of us do you intend to believe?'], ['ICHIGO', 'Both of you. Now step away from the door.']),
      scene(['MERUEM', 'If I came from a fight that never happened, why do I remember being afraid?'], ['NETERO', 'You can ask me again when we’re outside.'])),
    stage(4, 'Two Truths', ['aizen_kyoka'],
      scene(['AIZEN', 'Choose one history. I can erase the other before dinner.'], ['ICHIGO', 'Those people heard you.'], ['AIZEN', 'Good. They can watch you fight the version of yourself that agreed with me.']),
      scene(['URYU', 'The illusion copied our attacks. It didn’t copy why we stopped.'], ['AIZEN', 'That sounds like an expensive distinction. Let’s see who pays for it.']),
      { rule: 'mirror', hint: 'Aizen adds an echo of your lead to his lineup.' }),
    stage(5, 'Carry the Names', ['aizen_captain', 'ulquiorra_segunda', 'yhwach_the_almighty_futur'],
      scene(['JINBE', 'Three of us can hold the crossing. Tell us where to go.'], ['KAWAKI', 'Nobody leaves me behind just because some book says I’m dead.'], ['ICHIGO', 'Then make enough noise for us to find you.']),
      scene(['URYU', 'I’ve marked who made it through. When the next door opens, call for them.']),
      { rule: 'rescue', hint: 'Netero, Jinbe and Kawaki join as guests. Survivors can return in Chapter 7.' }),
    stage(6, 'BOSS · The World That Won', ['yhwach_the_almighty_futur'],
      scene(['YHWACH', 'Strike next. I have already seen it.'], ['ICHIGO', 'Did you see me open the door for them?'], ['YHWACH', 'That is the future I cut out.']),
      scene(['URYU', 'There’s a recording in here from before the throne existed.'], ['ICHIGO', 'That’s my voice. I’ve never said that.'], ['ICHIGO', 'When you find us, don’t send us back alone.']),
      { boss: 1, rule: 'forecast', hint: 'Yhwach announces the Art he expects. Play a different Art or switch first.' }),
  ] },
  { id: 7, name: 'A Place for the Impossible', sub: 'Chapter 7 · Beyond the Last Rift', boss: 'Story/uryu_keeper_of_names.jpg', stages: [
    stage(1, 'The Cost of Closing', ['jigen', 'kinshiki', 'momoshiki_base'],
      scene(['SHIBAI', 'Choose a history and I’ll give the survivors a world.'], ['URYU', 'What happens to the histories we don’t choose?'], ['ICHIGO', 'Everyone, call out. We need someone to answer from the other side.']),
      scene(['URYU', 'The door opened for a voice the registry says doesn’t exist.'], ['ICHIGO', 'Then we have something the registry doesn’t.']),
      { rule: 'returning', hint: 'Rescued guests join your lineup. Netero charges your Ultimate, Jinbe shields your lead, and Kawaki brings Energy.' }),
    stage(2, 'The Crew Answers', ['king_wildfire', 'kaido_dragon_form'],
      scene(['LUFFY', 'When I make a hole, run through it!'], ['JINBE', 'Captain, the hole is in the enemy line. Please leave the door standing.']),
      scene(['SANJI', 'That was the last boat.'], ['ZORO', 'Then we can stop holding back.']),
      { rule: 'crew', hint: 'The Straw Hats join as guests. Crew follow-ups reinforce the crossing.' }),
    stage(3, 'Borrowed Quirks', ['all_for_one_quirk_overload'],
      scene(['ALL FOR ONE', 'There’s a version of me in every doorway, and each has something I want.'], ['STAIN', 'Hiding behind yourself now? Stand still long enough to bleed.']),
      scene(['STAIN', 'Go. I’ll make sure he remembers which side of the door he’s on.']),
      { guest: 'stain_bloodcurdle', rule: 'transfer', hint: 'Guest Stain leads. Bloodcurdle interrupts the quirk transfer.' }),
    stage(4, 'The First Person Back', ['isshiki', 'momoshiki_fused'],
      scene(['SHIBAI', 'Choose someone you want restored.'], ['URYU', 'You can bring them back. Which life will they remember?'], ['SHIBAI', 'Ask them yourself.']),
      scene(['URYU', 'They remember both lives. Either memory was enough to know who they were.'], ['ICHIGO', 'Take that down. We’re going to need it.']),
      { guest: 'shibai', rule: 'restore', hint: 'Guest Shibai starts with a full Ultimate gauge. Choose a fallen ally to restore.' }),
    stage(5, 'Keep the Door Open', ['BLACKBEARD', 'isshiki', 'jigen'],
      scene(['URYU', 'There are people on both sides. I need someone at each end.'], ['LUFFY', 'I’ll hold this end!'], ['ICHIGO', 'Good. Remember which end that is.']),
      scene(['URYU', 'The last group is through. There’s only one voice left on the other side.']),
      { rule: 'relay', hint: 'Switch fighters to reinforce both sides and shield the incoming ally.' }),
    stage(6, 'FINAL BOSS · One True World', ['isshiki', 'shibai', 'momoshiki_fused'],
      scene(['SHIBAI', 'Let me show you what happens when a god insists on getting the last word.'], ['URYU', 'I’m writing down every name I hear. You’re welcome to give me yours.'], ['ICHIGO', 'I’ll keep him talking.']),
      scene(['URYU', 'Name, home, and where you’d like to go. If you remember two homes, write both.'], ['ICHIGO', 'Next time, knock.'], ['LUFFY', 'Okay!'], ['ICHIGO', 'You’re already through the door.']),
      { boss: 1, rule: 'reversal', hint: 'Shibai can restore a fallen enemy. Watch for the turn he announces Shinjutsu Reversal.' }),
  ] },
]

const floor = (n, name, enemy, rule, tip, weak) => ({
  n, name, enemy, boss: enemy[0], rule, tip, weak, weakB: 60, resist: 45,
  boost: 1.8 + n * .09, final: n === 5,
  rules: [[name, tip, { dmg: 10 + n * 3 }]],
  reward: { coins: [15000, 20000, 25000, 30000, 50000][n - 1], premium: n < 4 ? 1 : n - 2, shards: n >= 3 ? n * 1000 : 0, tickets: n === 5 ? 10 : 0 },
})
export const LAST_DOOR_ZONES = [
  { id: 'court-unwritten', name: 'Court of the Unwritten', sub: 'Bleach', stages: [
    floor(1, 'The Missing Patrol', ['renji_zabimaru', 'grimmjow_sexta', 'urahara_benihime'], 'repeat', 'Repeating the same attacking Art weakens the repeat.', ['S:BLE', 'Mentors']),
    floor(2, 'False Captain', ['aizen_captain', 'yoruichi_shunko', 'unohana_bankai_minazuki'], 'relay-pressure', 'Staying in with the same lead lets the court charge the enemy Ultimate.', ['S:BLE', 'Tag Teams']),
    floor(3, 'The Prison Record', ['ulquiorra_segunda', 'kenpachi_nozarashi_zenkai', 'renji_zabimaru'], 'forecast', 'The court calls an Art. Play another Art or switch first.', ['Swordsmen', 'S:BLE']),
    floor(4, 'Aizen’s Appeal', ['aizen_hogyoku', 'aizen_kyoka', 'grimmjow_sexta'], 'mirror', 'Aizen copies the opening fighter into his lineup.', ['S:BLE', 'Rivals']),
    floor(5, 'The Almighty Verdict', ['yhwach_the_almighty_futur'], 'forecast', 'Yhwach gains Energy when you play the Art he predicted.', ['S:BLE', 'Transformations']),
  ] },
  { id: 'onigashima-siege', name: 'Onigashima Under Siege', sub: 'One Piece', stages: [
    { ...floor(1, 'Push Back Big Mom', ['big_mom_emperor'], null, 'Drive Big Mom to 25% HP to force her off the Live Floor.', ['S:OP', 'Pirates']), encounter: 'ring-out' },
    floor(2, 'Queen’s Lab', ['queen_the_plague'], 'open-guard', 'Pierce Queen’s Guard to clear his launcher charge and create a raid Opening.', ['S:OP', 'Swordsmen']),
    floor(3, 'King’s Last Flame', ['king_wildfire'], 'king-flame', 'King takes less damage on odd rounds. Attack when his flame goes out.', ['S:OP', 'Transformations']),
    floor(4, 'Two Emperors', ['big_mom_emperor', 'kaido_dragon_form'], 'emperor-cover', 'Both Emperors shield their partner while they are alive.', ['S:OP', 'Tag Teams']),
    { ...floor(5, 'Kaido at Dawn', ['kaido_dragon_form'], null, 'Kaido gets back up once and comes back with his Ultimate ready.', ['S:OP', 'Rivals']), encounter: 'second-phase' },
  ] },
]
const episode = (name, player, enemy, matchup, line, ending, opts = {}) => ({
  name, player, enemy, matchup, level: 4, boost: 1.4, playerBoost: 1.15,
  scene: [[Array.isArray(player) ? player[0] : player, line]], outro: [['Narrator', ending]], ...opts,
})
export const LAST_DOOR_ARCS = [
  { id: 'vessel-breaks', anime: 'BOR', name: 'The Vessel Breaks', rewardCard: 'naruto_kawaki', existingReward: true,
    synopsis: 'Jigen breaks into the Hidden Leaf. Kawaki decides who he’s willing to stand beside.',
    chapters: [
      episode('Jigen’s Ambush', 'naruto_seventh_hokage_baryon', 'jigen', 'Naruto faces Jigen while Sasuke looks for an opening.', 'Sasuke, get him to look at me. I’ll tell you when to move.', 'Jigen retreats, leaving Kawaki with a choice he can no longer postpone.'),
      episode('Baryon’s Last Minute', 'naruto_seventh_hokage_baryon', 'isshiki', 'Make Baryon’s opening turns count.', 'Kurama. Tell me how much time we have after it’s over.', 'Kawaki steps into view and gives Isshiki a final target he can’t afford to chase.', { lockedForm: 'BARYON MODE', lockedKit: 'baryon_isshiki' }),
      episode('Kawaki’s Choice', 'kawaki', 'isshiki', 'Fight from Kawaki’s side of the door.', 'I know what he does to people who leave. I’m staying here anyway.', 'Kawaki stalls Isshiki by making him chase the wrong target.', { encounter: 'hold-out' }),
    ] },
  { id: 'pirate-wings', anime: 'OP', name: 'Wings of the Pirate King', rewardCard: 'jinbe_knight', existingReward: true,
    synopsis: 'The crew splits across Onigashima to clear a path for their captain.',
    chapters: [
      episode('The Helmsman Arrives', ['jinbe_knight', 'robin_hana_hana'], 'big_mom_emperor', 'Push Big Mom off the Live Floor.', 'I took the long way round. Captain, you can go on ahead.', 'Jinbe and Robin send Big Mom rolling away from the crew.', { encounter: 'ring-out' }),
      episode('Ifrit Ignites', 'sanji_oeuf_burst', 'queen_the_plague', 'Break Queen’s Guard and ignite Ifrit below half HP.', 'You want to see what these legs can really do?', 'Sanji’s final kick clears the floor.', { encounter: 'ifrit', chapterRule: 'open-guard' }),
      episode('The King of Hell', 'zoro_asura', 'king_wildfire', 'Finish King with Dead Man’s Game.', 'I’ve only got one direction left to go. You’re standing in it.', 'With King down, the crew’s path to the roof is clear.', { chapterRule: 'king-flame' }),
    ] },
  { id: 'heroes-we-choose', anime: 'MHA', name: 'The Heroes We Choose', rewardCard: 'stain_bloodcurdle', existingReward: true,
    synopsis: 'The students face Stain before All Might shows them what his final stand costs.',
    chapters: [
      episode('Hero Killer', ['deku_fullcowl', 'todoroki_half'], 'stain_bloodcurdle', 'Keep a second fighter ready for Bloodcurdle.', 'Todoroki, I sent you my location. Please tell me you saw it.', 'The students get each other out of the alley. Someone has been watching the whole time.'),
      episode('Hideout Raid', 'all_might_prime', 'all_for_one_symbol_of_evil', 'Force the escape route open.', 'Young Bakugo, when I move, your friends are going to reach for you.', 'Bakugo takes the hand offered to him. All Might turns back to the fight.', { encounter: 'hold-out' }),
      episode('United States of Smash', 'all_might_united_states_smash', 'all_for_one_quirk_overload', 'Draw out Quirk Overload before the final blow.', 'Everyone’s still looking this way. I can manage one more.', 'All Might holds up one fist. Then he points at the camera.'),
    ] },
]

export const LAST_DOOR_RIVALS = [
  { id: 'prayer', name: 'Netero vs. Meruem', lead: 'netero_100_type_guanyin', kit: 'netero_vs_meruem', foe: 'meruem_the_king', goal: 'Finish Meruem with a three-Prayer Zero Hand.' },
  { id: 'flame', name: 'Asura Zoro vs. King', lead: 'zoro_asura', foe: 'king_wildfire', goal: 'Finish King with Dead Man’s Game while his flame is out.' },
  { id: 'overload', name: 'All Might vs. All For One', lead: 'all_might_united_states_smash', foe: 'all_for_one_quirk_overload', goal: 'Survive his charged Ultimate, then finish with All Might’s Ultimate.' },
  { id: 'baryon', name: 'Baryon Naruto vs. Isshiki', lead: 'naruto_seventh_hokage_baryon', kit: 'baryon_isshiki', form: 'BARYON MODE', foe: 'isshiki', goal: 'Finish Isshiki with Naruto during his first two active turns.' },
]
