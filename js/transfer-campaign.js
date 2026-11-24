export const CAMPAIGN_ART = {
  shrine: 'atg/story-transfer-shrine.jpg',
  corridor: 'atg/story-transfer-corridor.jpg',
  tablet: 'atg/story-transfer-tablet.jpg',
  fragment: 'atg/story-transfer-fragment.jpg',
  deck: 'arenas/grand-line.jpg',
  city: 'arenas/images4.jpg',
}

const K = 'kakashi_copy_ninja', N = 'naruto_clone_rasengan'
const I = 'ichigo_zangetsu', U = 'uryu_quincy_archer'
const D = 'deidara_clay', G = 'grimmjow_sexta', S = 'shiori_transfer'
const H = 'echo_hollow', C = 'deidara_construct', B = 'ichigo_tensa_zangetsu'
const M = 'megumi_ten_shadows', A = 'nami_navigator', L = 'luffy_g2', J = 'jinbe_knight'
const T = 'transfer_unstable'

const objective = (kind, count, action) => ({ kind, count, action })
const work = (count, action, approach = 'advance') => ({ ...objective('work', count, action), approach })
const hold = (count, action = 'Survive enemy rounds') => objective('hold', count, action)
const half = objective('threshold', .5, 'Bring the opponent to half HP')
const mission = (name, place, cast, enemies, goal, intro, outro, extra = {}) =>
  ({ name, place, cast, enemies, goal, intro, outro, ...extra })

export const TRANSFER_CAMPAIGN = [
  { name: 'The Transfer Seal', sub: 'Naruto × Bleach', missions: [
    mission('The Missing Patrol', 'shrine', [K,N], [S], half,
      [[K,'The patrol left their packs here. Look at the crate under the gate.'], [N,'There’s a paper seal on it.'], [S,'And there was a crate a second ago. Back away from the gate.']],
      [[K,'She moved it to another mark. Naruto, there are people behind that door.'], [N,'Then I’ll get them out.']], { reward: K }),
    mission('Three Scouts', 'shrine', [N,K], [S], work(3,'Escort a scout', 'cover'),
      [[N,'One clone with each scout. Nobody steps on a marked stone.'], [S,'I need one of them alive to open that chamber. Stay where you are.']],
      [[N,'That’s three. All out.'], [K,'Good. The patrol says someone else was hired to open it.']], { reward: N }),
    mission('A Voice on Repeat', 'corridor', [U,I], [H], work(2,'Trace a genuine call', 'signal'),
      [[I,'I heard somebody call from the far end.'], [U,'It was the same breath, the same pause, every time. Let me find the person it heard first.']],
      [[U,'Two rooms, both occupied. That thing is imitating voices from inside.'], [I,'Point me at the right doors.']], { reward: U }),
    mission('Leave the Door Open', 'corridor', [I,U], [H], work(2,'Clear a room', 'cover'),
      [[H,'Please. I’m down here.'], [I,'That came from behind us.'], [U,'The real people are on your left. Trust me.']],
      [[I,'I’ve got them.'], [U,'Take them upstairs. I’ll watch the bottom of the stairwell.']], { reward: I }),
    mission('Clay at the Gate', 'shrine', [K,N], [D], half,
      [[D,'She paid me to open the chamber. You put the scouts somewhere safe, right?'], [K,'You were still going to set it off.'], [D,'Of course. I want to see if it breaks.']],
      [[D,'You can stop me here. The clay’s already inside.'], [K,'Naruto, with me. Now.']]),
    mission('Close the Chamber', 'tablet', [K,N], [C], work(3,'Advance the seal', 'break'),
      [[N,'There’s a crack right through the blue ring.'], [K,'Keep his clay off me. I can close it if I finish before the crack spreads.']],
      [[K,'It’s closed.'], [N,'Then where did that piece go?']], { reward: D }),
    mission('The Last Stairwell', 'corridor', [U,I], [G], hold(3),
      [[G,'I felt a Soul Reaper down here. Where is he?'], [U,'Busy. You can wait with me.']],
      [[I,'Everyone’s upstairs. I’m coming down.'], [U,'Take your time. He’s finally stopped asking.']]),
    mission('Grimmjow', 'corridor', [I,U], [G], half,
      [[G,'There you are. Let’s see what made all that noise.'], [I,'You wanted me. You’ve got me.']],
      [[G,'Good. Next time, outside.'], [U,'Ichigo? Come back down. There’s a piece of stone in the wall. It wasn’t here when we cleared the rooms.']],
      { reward: G, reveal: 'fragment', revealText: 'A broken segment of the blue ring glows beside the corridor lamp.' }),
  ] },
  { name: 'First Contact', sub: 'Naruto × Bleach', missions: [
    mission('Through the Wall', 'corridor', [N,K], [I], half,
      [[U,'The fragment is pulling away from the wall.'], [S,'I can take it from here.'], [I,'Nobody gets to rip open that wall again.'], [N,'Then let Kakashi through first.']],
      [[K,'Stop. Shiori took the fragment back through while you two were fighting.'], [I,'Then tell me where it goes.']]),
    mission('Follow the Mark', 'corridor', [U,N], [T], work(2,'Trace a live mark', 'signal'),
      [[U,'Pulling it free left its imprint in the wall. I can follow that.'], [N,'Show me the marks. I can check two before either fades.']],
      [[U,'Every mark leads to the same gate.'], [N,'I know the way once we’re through.']]),
    mission('Shiori’s Side', 'shrine', [S], [K], hold(3),
      [[S,'I saw what that crack did. I’m destroying the piece while I still can.'], [K,'Wait until we know what’s still attached to it.']],
      [[S,'If you want the fragment, follow me into the chamber.']], { reward: S }),
    mission('The Other End', 'corridor', [K,I], [T], work(2,'Disable a linked mark', 'break'),
      [[K,'Watch the mark when I touch the shrine side.'], [I,'It moves here too. If she smashes it, the people above us feel it.'], [K,'We’ll give her a better option.']],
      [[I,'My side is clear.'], [K,'Then there’s only one connection left.']]),
    mission('One Mark Left', 'shrine', [N,U], [T], hold(3),
      [[N,'Shiori, hold it still. Uryū can show you where the other end goes.'], [U,'There. That line ends in an occupied building.'], [S,'Tell me when to let go.']],
      [[K,'The shrine end is nearly closed. Ichigo, I’ll show you where to cut.']]),
    mission('Tensa Zangetsu', 'tablet', [B,I], [T], work(2,'Cut a link on Kakashi’s signal', 'break'),
      [[I,'If it pulls away again, I won’t reach it in time.'], [K,'I can hold it once. Be ready.']],
      [[K,'It’s closed. Shiori, you’re coming with me.'], [U,'The mark in Karakura is gone.'], ['Narrator','Far away, a ship lands miles from the sea. In another world, civilians step out of a stairwell and onto its deck.']],
      { reward: B, midpoint: [[K,'Now, Ichigo. Cut the connection.'], [B,'Bankai. Tensa Zangetsu.']], reveal: 'deck', revealText: 'The Sunny has crossed into another world.' }),
  ] },
  { name: 'The Sea Where It Shouldn’t Be', sub: 'Naruto × Bleach × One Piece × Jujutsu Kaisen', missions: [
    mission('No Sea in Sight', 'deck', [J,A], [T], work(2,'Stabilize the deck', 'cover'),
      [[J,'The keel is in the dirt. Keep everyone above deck.'], [A,'The people downstairs say they walked in through a stairwell. I’ll count them.']],
      [[A,'We’ve got them all up here. Why did the last one tell me it smelled like rain in Tokyo?']]),
    mission('The Street That Ends at Sea', 'city', [M], [H], work(2,'Scout an exit', 'signal'),
      [[M,'The trail ends at a door with seawater coming under it. The curse is waiting for someone to come back through.']],
      [[M,'I found the route. Now I need someone on the other side.']], { reward: M }),
    mission('A Ship at the Shrine', 'shrine', [N,J], [T], work(3,'Guide a passenger off', 'cover'),
      [[N,'I recognize that mark on your hull.'], [A,'A stretch of coast disappeared when we landed. We need to get these people ashore before it happens again.']],
      [[J,'The passengers are clear. The Sunny is still moving.']]),
    mission('The Wrong Signal', 'corridor', [U,I], [T], hold(3),
      [[U,'The old mark is back. I’ll send a signal through it.'], [A,'Hello? Whoever that is, do it again so I can find you.']],
      [[I,'Did somebody just answer us from a ship?'], [U,'Yes. Now we know where the next transfer will start.']]),
    mission('What Comes Through', 'city', [M,I], [H], null,
      [[M,'The signal led it here too. Keep it away from the crossing.'], [I,'I’ll take it from here. Tell the people at the other end to move.']],
      [[M,'It pulled back toward the ship. We bought them a window.']]),
    mission('A Route Home', 'deck', [A,J], [T], work(3,'Send a passenger home', 'signal'),
      [[A,'Shiori says we can reverse the route. If we move the Sunny first, everyone still here goes with it.'], [J,'I’ll hold her steady. Send the passengers through.']],
      [[A,'Last passenger is home. Jinbe, take us through.']], { reward: A }),
    mission('Hold Both Ends', 'shrine', [K,S], [T], work(4,'Secure the crossing', 'cover'),
      [[K,'We’ll hold the shrine. Uryū, tell us when your side is ready.'], [U,'Megumi’s clearing the street now. Give him a minute.']],
      [[U,'Street is clear. Both ends are ready.'], [J,'Then we’re going.']],
      { secondFront: { place: 'city', cast: [U,M], goal: work(2,'Clear the street end', 'break') } }),
    mission('Back to the Grand Line', 'deck', [L,J], [H], null,
      [[A,'We’re back on the sea. Something followed us onto the deck.'], [L,'Everybody’s home? Good. Jinbe, keep her steady.']],
      [[J,'It’s off the ship.'], [A,'The coast is back where it belongs. But look at the chart. Two other places moved. One of those marks is getting bigger.']],
      { reward: L, finale: true }),
  ] },
]

export const missionId = (chapter, index) => (chapter + 1) + '-' + (index + 1)
export const missionOrder = TRANSFER_CAMPAIGN.flatMap((chapter, ci) => chapter.missions.map((_, mi) => missionId(ci, mi)))

export function campaignMission(id, progress = {}) {
  const index = missionOrder.indexOf(id)
  if (index < 0) return null
  const [chapter, mission] = id.split('-').map(Number)
  return { id, chapter, mission, data: TRANSFER_CAMPAIGN[chapter - 1].missions[mission - 1],
    open: index === 0 || !!progress[missionOrder[index - 1]], next: missionOrder[index + 1] }
}

// Score the actual upgraded fighters after their starting team bonuses have been applied.
export function campaignScale(team, chapter, mission, enemyCount) {
  const scores = team.map(f => {
    const stats = Math.max(f.pwr, f.ki) * .62 + f.def * .24 + f.spd * .14
    const upgraded = f.card?.maxed ? 1.1 : 1
    const rarity = ({ L: 1.04, M: 1.09, X: 1.15 })[f.card?.r] || 1
    return stats * upgraded * rarity
  })
  const peak = Math.max(...scores, 1)
  const mean = scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length)
  const rating = (peak * .65 + mean * .35) / 87
  const progression = 1 + (chapter - 1) * .18 + (mission - 1) * .045
  const size = 1 + Math.max(0, team.length - enemyCount) * .13
  return {
    hp: Math.max(.55, Math.min(5.5, rating ** 2.15 * progression * size)),
    damage: Math.max(.52, Math.min(2.2, rating * (.74 + (chapter - 1) * .12 + (mission - 1) * .028))),
    level: chapter === 1 ? (mission < 5 ? 1 : 2) : chapter === 2 ? 3 : (mission < 5 ? 4 : 5),
  }
}
