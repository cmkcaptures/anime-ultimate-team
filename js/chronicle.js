// CHRONICLE BREAK: your team drops into a decisive moment of a story and rewrites it.
// Node types: choice (scene + 2-3 options), fight (your own team vs the story's villains), ending (rewards).
// Fights: boost/rules scale enemies; turnLimit = hard countdown; bossAb deathball = telegraphed team nuke (Guard halves it);
// fury = your team gains +25% damage + type neutral after your first KO; youRules = buffs for your team (from ally choices).
export const CHRONICLES = [
  {
    id: 'namek', anime: 'DBZ', era: 'FRIEZA SAGA', name: 'NAMEK', title: 'THE LEGENDARY SUPER SAIYAN', bg: 'assets/chronicle/namek.jpg', hero: 'goku_ssj_namek_legend', villain: 'frieza_full_power_namek', col: '#ffb020', col2: '#b46bff',
    canon: 'Frieza kills Krillin in front of Goku. Rage awakens the Legendary Super Saiyan as Namek begins to tear itself apart.',
    nodes: {
      start: { type: 'choice', title: 'THE MOMENT BEFORE',
        scene: [
          ['Narrator', 'Planet Namek. The Dragon Balls are spent, the sky is black, and the strongest beings in the universe are about to collide.'],
          ['frieza_full_power_namek', 'You Saiyans are so very stubborn. Let me show you what happens to those who defy me.'],
          ['goku_ssj_namek_legend', 'Krillin, stay back. He’s not like anyone we’ve ever fought.'],
          ['Narrator', 'In seconds, Krillin dies and a legend is born. A rift tears open above the battlefield. Your team steps through.'],
          ['frieza_full_power_namek', 'More insects? Where did you come from?'],
        ],
        choices: [
          { id: 'save', tag: 'HARDEST', label: 'SAVE KRILLIN', desc: 'Intercept Frieza’s attack. Krillin lives, but Goku’s rage never awakens. You face Frieza at full power with no legend to save you.', next: 'a1', art: 'frieza_full_power_namek' },
          { id: 'legend', tag: 'CANON+', label: 'FIGHT BESIDE THE LEGEND', desc: 'Let history happen. Hold Frieza back while Goku awakens, then finish it together before Namek explodes.', next: 'b1', art: 'goku_ssj_namek_legend' },
          { id: 'ambush', tag: 'GAUNTLET', label: 'STRIKE BEFORE HE TRANSFORMS', desc: 'Hit Frieza before he reaches his final form and break him one form at a time.', next: 'c1', art: 'frieza_third_form_namek' },
        ] },
      // ---- PATH A: Save Krillin ----
      a1: { type: 'fight', name: 'NO LEGEND NEEDED', enemy: ['frieza_full_power_namek', 'frieza_third_form_namek', 'frieza_emperor_of_the_universe'], boost: 2.95, rules: { dmg: 28, dr: 10 }, bossAb: 'deathball', turnLimit: 18, limitText: 'NAMEK EXPLODES', encounter: 'second-phase', final: 1,
        brief: ['Frieza at 100% with no Super Saiyan to stop him.', 'Every 3rd turn: DEATH BALL. Guard that turn or eat 30% of your team’s HP.', 'Namek explodes after 18 turns.'],
        scene: [['frieza_full_power_namek', 'You saved the little one. How noble. Now you can die in his place.'], ['Narrator', 'Krillin is safe. Goku stays as he is. Everything now rests on you.']],
        next: 'end_krillin' },
      // ---- PATH B: Fight beside the Legend ----
      b1: { type: 'fight', name: 'BUY GOKU TIME', enemy: ['frieza_third_form_namek', 'frieza_emperor_of_the_universe'], boost: 3.6, rules: { dmg: 45 }, encounter: 'hold-out',
        brief: ['Survive three enemy turns while Goku’s rage builds, or KO Frieza outright.'],
        scene: [['Narrator', 'Krillin falls. Goku’s scream shakes the planet. His power is still climbing.'], ['frieza_full_power_namek', 'What... what is this power?!'], ['Narrator', 'Hold Frieza off until the transformation is complete.']],
        next: 'b_ally' },
      b_ally: { type: 'choice', title: 'THE LEGEND AWAKENS',
        scene: [['goku_ssj_namek_legend', 'I am the hope of the universe. I am the answer to all living things that cry out for peace.'], ['goku_ssj_namek_legend', 'Whoever you are, you fought for my friend. Stand with me.'], ['Narrator', 'Choose how the Legendary Super Saiyan fights beside you.']],
        choices: [
          { id: 'fury', tag: 'OFFENSE', label: 'SUPER SAIYAN FURY', desc: 'Goku leads the charge. Your whole team deals +20% damage.', next: 'b2', youRules: { dmg: 20 }, art: 'goku_ssj_namek_legend' },
          { id: 'guard', tag: 'DEFENSE', label: 'SAIYAN PRIDE', desc: 'Goku takes the hits meant for you. Your team takes 18% less damage.', next: 'b2', youRules: { dr: 18 }, art: 'goku_ssj_namek_legend' },
          { id: 'kamehameha', tag: 'BURST', label: 'FATHER’S KAMEHAMEHA', desc: 'Goku charges your Ultimates. Start with 60% Ultimate gauge and +15% Special damage.', next: 'b2', youRules: { spec: 15, ultStart: 60 }, art: 'goku_ssj_namek_legend' },
        ] },
      b2: { type: 'fight', name: 'FIVE MINUTES TO DOOM', enemy: ['frieza_full_power_namek', 'frieza_third_form_namek'], boost: 3.4, rules: { dmg: 32, dr: 12 }, bossAb: 'deathball', turnLimit: 12, limitText: 'NAMEK EXPLODES', fury: 1, final: 1,
        brief: ['Frieza goes 100%. Namek explodes after 12 turns.', 'Every 3rd turn: DEATH BALL. Guard or lose 30% of your team’s HP.', 'When your first fighter falls, your team gets Super Saiyan Fury: +25% damage and no type disadvantage.'],
        scene: [['frieza_full_power_namek', 'Fine! I’ll destroy this whole planet. Let’s see you survive THAT!'], ['goku_ssj_namek_legend', 'Then we’ll finish this before it ends!']],
        next: 'end_legend' },
      // ---- PATH C: Ambush ----
      c1: { type: 'fight', name: 'SECOND FORM', enemy: ['frieza_emperor_of_the_universe'], boost: 4.2, rules: { dmg: 36, dr: 15 }, encounter: 'second-phase',
        brief: ['Frieza returns at 35% HP with a full Ultimate gauge when you first beat him.'],
        scene: [['Narrator', 'You strike before the final transformation. Frieza is caught off guard.'], ['frieza_full_power_namek', 'You dare lay hands on me?!']],
        next: 'c2' },
      c2: { type: 'fight', name: 'THIRD FORM', enemy: ['frieza_third_form_namek', 'frieza_emperor_of_the_universe'], boost: 3.6, rules: { dmg: 32, spec: 15 }, encounter: 'pressure',
        brief: ['The enemy gains 40% Ultimate gauge every even round.'],
        scene: [['frieza_third_form_namek', 'You forced this form out of me. You will regret it.']],
        next: 'c3' },
      c3: { type: 'fight', name: 'FINAL FORM', enemy: ['frieza_full_power_namek'], boost: 4.6, rules: { dmg: 45, dr: 18 }, bossAb: 'deathball', turnLimit: 14, limitText: 'FRIEZA ESCAPES', final: 1,
        brief: ['Break his final form before he reaches full power: 14 turns.', 'Every 3rd turn: DEATH BALL.'],
        scene: [['frieza_full_power_namek', 'Enough! This is my final form, and you will never see the next one!']],
        next: 'end_early' },
      // ---- ENDINGS ----
      end_krillin: { type: 'ending', id: 'krillin', name: 'KRILLIN LIVES', text: 'Krillin survives. Goku never needed the rage, because someone else stood between Frieza and his friends. This timeline remembers you.', reward: { coins: 40000, gearShards: 2500, premium: 2, card: 'krillin_namek' } },
      end_legend: { type: 'ending', id: 'legend', name: 'THE LEGEND RISES', text: 'The Legendary Super Saiyan and an unknown team stand together as Namek burns. Frieza falls before the planet does.', reward: { coins: 30000, gearShards: 2000, card: 'goku_ssj_namek_legend' } },
      end_early: { type: 'ending', id: 'early', name: 'NIPPED IN THE BUD', text: 'Frieza never reaches 100%. The tyrant is broken form by form, and Namek is never destroyed.', reward: { coins: 30000, gearShards: 2000, card: 'frieza_third_form_namek' } },
    },
    // clear any FINAL fight without losing a fighter
    trueEnding: { id: 'true', name: 'FRIEZA HAS NO FUTURE', text: 'Not one fighter fell. In this timeline, the Emperor of the Universe was erased without a single loss.', reward: { premium: 3, gearShards: 3000, card: 'frieza_full_power_namek' } },
  },
]
CHRONICLES.push({
  id: 'ninetails', anime: 'NAR', era: 'THE FOURTH HOKAGE', name: 'THE NINE-TAILS NIGHT', title: 'A FATHER’S LAST SEAL', bg: 'assets/chronicle/ninetails.jpg', hero: 'minato_kushina_night', villain: 'kurama_unleashed_night', col: '#ff7a1a', col2: '#c21a2a',
  canon: 'A masked man rips the Nine-Tails out of Kushina and sets it on the Hidden Leaf. Minato and Kushina die sealing it into their newborn son.',
  nodes: {
    start: { type: 'choice', title: 'THE NIGHT IT ALL ENDED',
      scene: [
        ['Narrator', 'October 10th. Kushina has just given birth. The seal holding the Nine-Tails is at its weakest.'],
        ['obito_masked_night', 'Step away from the Jinchūriki, Fourth Hokage. Or your son goes first.'],
        ['minato_kushina_night', 'Kushina, hold on. I’ll get Naruto somewhere safe.'],
        ['kurama_unleashed_night', 'FREE. After all these years of darkness... I will crush this village into dust!'],
        ['Narrator', 'A rift splits the red sky over the Hidden Leaf. Your team steps through into the worst night in its history.'],
      ],
      choices: [
        { id: 'mask', tag: 'DUEL', label: 'STOP THE MASKED MAN', desc: 'Catch him before Kurama is pulled free. Nothing touches him, and every few turns he phases your fighter out of the fight.', next: 'm1', art: 'obito_masked_night' },
        { id: 'seal', tag: 'CANON+', label: 'PROTECT THE SEALING', desc: 'Let the beast loose, but guard Minato and Kushina while they seal it. If they survive, Naruto grows up with his parents.', next: 's1', art: 'minato_kushina_night' },
        { id: 'hunt', tag: 'RAID BOSS', label: 'HUNT THE BEAST', desc: 'Go straight for the Nine-Tails before it levels the village. A giant boss and a countdown.', next: 'h1', art: 'kurama_unleashed_night' },
      ] },
    m1: { type: 'fight', name: 'THE MAN BEHIND THE MASK', enemy: ['obito_masked_night'], boost: 4.0, rules: { dmg: 40, dr: 15 }, bossAb: 'kamui', encounter: 'second-phase', final: 1,
      brief: ['The first 3 hits on him pass straight through.', 'Every 3rd turn: KAMUI. Your active fighter loses its next turn unless you Guard.', 'When you first beat him, he returns at 35% HP with a full Ultimate gauge.'],
      scene: [['obito_masked_night', 'Who are you people? You aren’t from this time.'], ['Narrator', 'He hasn’t touched the seal yet. Break him first.']], next: 'end_mask' },
    s1: { type: 'fight', name: 'HOLD THE BARRIER', enemy: ['kurama_unleashed_night'], boost: 3.6, rules: { dmg: 45 }, bossAb: 'tbb', encounter: 'hold-out',
      brief: ['Survive three enemy turns while Minato prepares the seal, or knock the beast down.', 'Every 3rd turn: TAILED BEAST BOMB hits your BENCH, not your active fighter.'],
      scene: [['minato_kushina_night', 'Kushina, can you still hold it?'], ['minato_kushina_night', 'Leave it to me! Just buy us a few seconds!']], next: 's_ally' },
    s_ally: { type: 'choice', title: 'THE FOURTH HOKAGE’S PLAN',
      scene: [['minato_kushina_night', 'Whoever you are, you’ve given us a chance. Let’s finish this together.'], ['Narrator', 'Choose how the Hidden Leaf fights beside you.']],
      choices: [
        { id: 'ftg', tag: 'SPEED', label: 'FLYING THUNDER GOD', desc: 'Minato teleports your team out of harm’s way. 15% dodge for every fighter.', next: 's2', youRules: { dodge: 15 }, art: 'minato_kushina_night' },
        { id: 'chains', tag: 'DEFENSE', label: 'ADAMANTINE CHAINS', desc: 'Kushina binds the beast. Your team takes 18% less damage.', next: 's2', youRules: { dr: 18 }, art: 'minato_kushina_night' },
        { id: 'leaf', tag: 'OFFENSE', label: 'WILL OF FIRE', desc: 'The Third Hokage leads every shinobi in. Your team deals +20% damage.', next: 's2', youRules: { dmg: 20 }, art: 'minato_kushina_night' },
      ] },
    s2: { type: 'fight', name: 'THE EIGHT TRIGRAMS SEAL', enemy: ['kurama_unleashed_night', 'obito_masked_night'], boost: 3.4, rules: { dmg: 32, dr: 12 }, bossAb: 'tbb', turnLimit: 12, limitText: 'THE SEAL FAILS', fury: 1, final: 1,
      brief: ['The seal completes in 12 turns. Defeat them before it fails.', 'Every 3rd turn: TAILED BEAST BOMB hits your bench for 35%. Guard to cut it.', 'When your first fighter falls, your team gets the Will of Fire: +25% damage and no type disadvantage.'],
      scene: [['obito_masked_night', 'I won’t let you rewrite this night.'], ['kurama_unleashed_night', 'You insects will not seal me again!']], next: 'end_parents' },
    h1: { type: 'fight', name: 'NINE-TAILS RAMPAGE', enemy: ['kurama_unleashed_night'], boost: 4.4, rules: { dmg: 42, dr: 18 }, bossAb: 'tbb', turnLimit: 14, limitText: 'KONOHA FALLS', final: 1,
      brief: ['A raid boss with huge HP. The village falls after 14 turns.', 'Every 3rd turn: TAILED BEAST BOMB smashes your bench.'],
      scene: [['kurama_unleashed_night', 'Small creatures. You will burn with the rest of them.'], ['Narrator', 'Ten thousand shinobi couldn’t stop it. You have to.']], next: 'end_beast' },
    end_mask: { type: 'ending', id: 'mask', name: 'THE MASK BREAKS', text: 'The masked man never reaches Kushina. The Nine-Tails stays sealed, and the night of October 10th becomes just another birthday.', reward: { coins: 30000, gearShards: 2000, card: 'obito_masked_night' } },
    end_parents: { type: 'ending', id: 'parents', name: 'NARUTO’S PARENTS LIVE', text: 'The seal holds, and nobody has to die for it. Naruto grows up with two parents who never stop bragging about him.', reward: { coins: 30000, gearShards: 2000, card: 'minato_kushina_night' } },
    end_beast: { type: 'ending', id: 'beast', name: 'THE BEAST IS FELLED', text: 'The Nine-Tails falls before it reaches the village. The Hidden Leaf never burns, and the shinobi remember the strangers who fought beside them.', reward: { coins: 40000, gearShards: 2500, premium: 2 } },
  },
  trueEnding: { id: 'true', name: 'A NIGHT WITHOUT LOSS', text: 'Not one fighter fell. Even the Nine-Tails, sealed and calm, admits it was beaten fair.', reward: { premium: 3, gearShards: 3000, card: 'kurama_unleashed_night' } },
})
export const BOSS_AB = {
  deathball: { name: 'DEATH BALL', warn: '⚠ DEATH BALL INCOMING · GUARD!' },
  tbb: { name: 'TAILED BEAST BOMB', warn: '⚠ TAILED BEAST BOMB · BENCH TARGETED!' },
  kamui: { name: 'KAMUI', warn: '⚠ KAMUI INCOMING · GUARD OR LOSE A TURN!' },
}
export const COMING = [
  { name: 'MARINEFORD', title: 'FIST OF FIRE', anime: 'OP' }, { name: 'SHIBUYA', title: 'THE SEAL', anime: 'JJK' },
  { name: 'PLANET VEGETA', title: 'THE SAIYAN PRINCE', anime: 'DBZ' },
]
export const chronById = id => CHRONICLES.find(c => c.id === id)
export const ENDING_COUNT = c => Object.values(c.nodes).filter(n => n.type === 'ending').length + (c.trueEnding ? 1 : 0)
