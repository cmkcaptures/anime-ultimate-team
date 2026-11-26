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
const F = 'trunks_future', P = 'deku_fullcowl', Q = 'shigaraki_handjack'
const W = 'trunks_ssj_sword', Y = 'bakugo_finalwar', O = 'all_for_one_symbol_of_evil'
const V = 'deku_ofa_unleashed', X = 'all_for_one_quirk_overload'

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
  { name: 'Two Places Missing', sub: 'Dragon Ball × My Hero Academia', missions: [
    mission('Footsteps in an Empty City', 'city', [F], [T], work(2, 'Search the street', 'signal'),
      [[F,'Nobody has lived on this block in years. These footprints are fresh.']],
      [[F,'They go straight into a wall. There’s a voice on the other side.']]),
    mission('The Shelter Exit', 'corridor', [P], [C], work(3, 'Escort a group', 'cover'),
      [[P,'Stay behind me. We’ll check the next exit together.']],
      [[P,'That door opened onto a city I’ve never seen. Put something in the jamb.']]),
    mission('Keep the Door Open', 'city', [F], [T], hold(3),
      [[F,'Someone’s wedged the door with a chair. I’ll hold this end.']],
      [[F,'They heard me. The people in there are alive.']], { reward: F }),
    mission('Two New Marks', 'deck', [A,J], [H], work(2, 'Plot the moving route', 'signal'),
      [[A,'The mark grew again. Same place, every time someone crossed.'], [J,'Show me where we can get close without moving the coast again.']],
      [[A,'Here. The two marks are pointing at the same door.']]),
    mission('The Evacuation Line', 'city', [P], [Q], half,
      [[P,'There are families behind me, Shigaraki. You’re coming through me first.']],
      [[P,'He’s pulled back. Get everyone inside while we’ve got the street.']], { reward: P }),
    mission('A Light Across the Hall', 'corridor', [P,U], [H], work(2, 'Clear the landing', 'break'),
      [[P,'The light went out again. Can you reach the mark from here?'], [U,'I can reach it. You keep the thing in the hall off me.']],
      [[U,'The signal’s steady now. Whoever’s outside can see us.']]),
    mission('Same Door, Different Street', 'city', [F,P], [T], work(4, 'Secure Trunks’s side', 'cover'),
      [[F,'I can see the light. If you can hear me, step back from the door.'], [P,'Everyone, against the wall. We’re opening it together.']],
      [[F,'You’re a long way from home.'], [P,'So are they. Can you help me get them out?']],
      { secondFront: { place: 'corridor', cast: [P], goal: work(2, 'Clear the shelter side', 'break') } }),
  ] },
  { name: 'The Other Side of the Door', sub: 'Dragon Ball × My Hero Academia', missions: [
    mission('The First Group Through', 'city', [F,P], [H], work(3, 'Move a group across', 'cover'),
      [[P,'I’ll take the front. Tell me if that street shifts again.'], [F,'I used to live two blocks from here. I know where we can take them.']],
      [[F,'They’re sheltered. Someone else just opened a route.']]),
    mission('A Favor With a Price', 'corridor', [P,U], [O], hold(3),
      [[O,'I’ve sent the wounded through first. Tell me what you’ve done for them.'], [P,'Where did you send them?']],
      [[O,'Somewhere safe. If you wish to join them, ask me next time.']]),
    mission('The Blockade', 'city', [W,P], [Q], null,
      [[P,'He’s blocking the side street. The evacuation line can’t turn around here.'], [W,'Go with them. I’ll clear the street.']],
      [[W,'Side street’s clear. Let’s use it before he comes back.']], { reward: W }),
    mission('Keep the Marker Moving', 'corridor', [Y,P], [H], work(3, 'Cover the marker carrier', 'cover'),
      [[Y,'I’ve got the marker. I can get it there if you keep the hall clear.'], [P,'I’ll take the first turn at the front.']],
      [[Y,'Marker’s in place. Get the group moving.']],
      { carrier: Y }),
    mission('Reclaim Both Ends', 'corridor', [Y,W], [O], work(4, 'Clear the checkpoint', 'break'),
      [[O,'My route is open. Yours is still throwing people into the wrong street.'], [Y,'Then we’ll fix ours. Move.']],
      [[W,'Both ends are back under our control. He left the second gate open on purpose.']],
      { secondFront: { place: 'city', cast: [W], goal: work(2, 'Secure Trunks’s street', 'cover') } }),
    mission('His Gate', 'city', [Y,W,P], [O], half,
      [[W,'He’s heading for the gate with the controls. Cut him off!'], [O,'I’m afraid you’ll need a bigger door.']],
      [[A,'That mark is spreading beyond the block. He’s trying to keep it open.'], [Y,'Then we need to get everyone out now.']], { reward: Y }),
  ] },
  { name: 'Who Gets to Go Home', sub: 'Naruto × Bleach × One Piece × Dragon Ball × My Hero Academia', missions: [
    mission('What the Chart Costs', 'deck', [A,J], [T], work(2, 'Find a safe crossing window', 'signal'),
      [[A,'Every minute it stays open, another piece of the map moves. Look what happens when we close it for a breath.'], [J,'The coast settles. How long can we give them?']],
      [[A,'Long enough for small groups. I’ll call the timing.']]),
    mission('One Window at a Time', 'shrine', [K,U], [T], work(3, 'Guide a group through', 'cover'),
      [[U,'Wait for my signal. When the mark dims, nobody moves.'], [K,'I’ll take the rear. Get the first group ready.']],
      [[K,'They’re through. There’s still a line at the other end.']]),
    mission('Hold the Connection', 'corridor', [B,U], [H], hold(3),
      [[U,'All For One pulled the far end out of position. I need three windows to pull it back.'], [B,'You get it lined up. I’ll keep the hall clear.']],
      [[U,'It’s lined up. Ichigo, keep your blade there until I give the word.']]),
    mission('The Long Way Around', 'city', [W,Y], [Q], work(3, 'Open the side street', 'break'),
      [[W,'The main road is gone. We’re taking the narrow one.'], [Y,'I’ve already checked it. Send them down.']],
      [[Y,'Everyone’s past the corner. I can see the gate from here.']]),
    mission('One For All Unleashed', 'city', [V,Y], [O], half,
      [[V,'Trunks, take the line. If he follows you, we lose the route.'], [O,'You can keep their attention for only so long.']],
      [[V,'I only need the last group through. Nami, tell me when.']], { reward: V }),
    mission('The Last Signal', 'shrine', [U,B,A], [T], work(4, 'Anchor the shrine end', 'cover'),
      [[A,'There’s one group left. I need both ends listening before I can send them.'], [U,'I’ll get the signal to Deku. Ichigo, hold the far end.']],
      [[A,'Both ends are steady. Send them the instant he’s off the gate.']],
      { secondFront: { place: 'corridor', cast: [B], goal: work(2, 'Secure the far end', 'break') } }),
    mission('Close It Behind Them', 'city', [V,Y,W], [X], work(2, 'Send the last group through', 'cover'),
      [[X,'You can leave it open. I’ve kept people alive with this door.'], [V,'You’ve got people waiting on both sides. Get out of their way.']],
      [[V,'The last group is through. Close it, Nami.'], [A,'Closed. The streets are back. Give me the chart. I can keep one route if we open it ourselves.']],
      { reward: X, finale: true, finishAfterWork: true }),
  ] },
]

export const missionId = (chapter, index) => (chapter + 1) + '-' + (index + 1)
export const campaignRewardUnlocks = new Map(TRANSFER_CAMPAIGN.slice(3).flatMap((chapter, ci) =>
  chapter.missions.flatMap((mission, mi) => mission.reward ? [[mission.reward, missionId(ci + 3, mi)]] : [])))
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
  const rawRating = (peak * .65 + mean * .35) / 87
  // Enemies only partly follow your team (55%), so upgrading your cards makes fights easier; chapters set the real difficulty.
  const rating = 1 + (rawRating - 1) * .55
  const progression = 1 + (chapter - 1) * .18 + (mission - 1) * .045
  const size = 1 + Math.max(0, team.length - enemyCount) * .13
  return {
    hp: Math.max(.55, Math.min(5.5, rating ** 1.6 * progression * size)),
    damage: Math.max(.52, Math.min(2.2, rating * (.74 + (chapter - 1) * .12 + (mission - 1) * .028))),
    level: chapter === 1 ? (mission < 5 ? 1 : 2) : chapter === 2 ? 3 : (chapter < 5 && mission < 5 ? 4 : 5),
  }
}
