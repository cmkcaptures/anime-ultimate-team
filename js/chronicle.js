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
    h1: { type: 'fight', name: 'NINE-TAILS RAMPAGE', enemy: ['kurama_unleashed_night'], boost: 5.4, rules: { dmg: 55, dr: 22 }, bossAb: 'tbb', turnLimit: 14, limitText: 'KONOHA FALLS', final: 1,
      brief: ['A raid boss with huge HP. The village falls after 14 turns.', 'Every 3rd turn: TAILED BEAST BOMB smashes your bench.'],
      scene: [['kurama_unleashed_night', 'Small creatures. You will burn with the rest of them.'], ['Narrator', 'Ten thousand shinobi couldn’t stop it. You have to.']], next: 'end_beast' },
    end_mask: { type: 'ending', id: 'mask', name: 'THE MASK BREAKS', text: 'The masked man never reaches Kushina. The Nine-Tails stays sealed, and the night of October 10th becomes just another birthday.', reward: { coins: 30000, gearShards: 2000, card: 'obito_masked_night' } },
    end_parents: { type: 'ending', id: 'parents', name: 'NARUTO’S PARENTS LIVE', text: 'The seal holds, and nobody has to die for it. Naruto grows up with two parents who never stop bragging about him.', reward: { coins: 30000, gearShards: 2000, card: 'minato_kushina_night' } },
    end_beast: { type: 'ending', id: 'beast', name: 'THE BEAST IS FELLED', text: 'The Nine-Tails falls before it reaches the village. The Hidden Leaf never burns, and the shinobi remember the strangers who fought beside them.', reward: { coins: 40000, gearShards: 2500, premium: 2 } },
  },
  trueEnding: { id: 'true', name: 'A NIGHT WITHOUT LOSS', text: 'Not one fighter fell. Even the Nine-Tails, sealed and calm, admits it was beaten fair.', reward: { premium: 3, gearShards: 3000, card: 'kurama_unleashed_night' } },
})

CHRONICLES.push({
  id: 'sokyoku', anime: 'BLE', era: 'SOUL SOCIETY ARC', name: 'THE SŌKYOKU HILL', title: 'AN EXECUTION INTERRUPTED', bg: 'assets/chronicle/sokyoku.jpg', hero: 'rukia_rescued', villain: 'aizen_betrayal', col: '#c9a7ff', col2: '#5a2bd6',
  canon: 'Rukia is led to the Sōkyoku for execution. Moments later, Aizen reveals he planned it all, cuts down Ichigo and takes the Hōgyoku from her soul.',
  nodes: {
    start: { type: 'choice', title: 'THE DAY OF THE EXECUTION', scene: [
      ['Narrator', 'The Sōkyoku hill. The execution device burns like a phoenix. Rukia Kuchiki stands at its edge, calm.'],
      ['rukia_rescued', 'It’s fine. I’ve made my peace with it.'],
      ['gin_snake', 'Such a sad little ceremony. Ah, but it ain’t really about her, is it, Captain?'],
      ['aizen_betrayal', 'Everything is proceeding exactly as I planned.'],
      ['Narrator', 'A rift splits the sky over Soul Society. Your team lands on the hill.'] ],
      choices: [
        { id: 'break', tag: 'RESCUE', label: 'BREAK THE EXECUTION', desc: 'Smash the Sōkyoku and fight off the captains guarding it. Rukia lives, but the hill turns on you.', next: 'k1', art: 'rukia_rescued' },
        { id: 'aizen', tag: 'HARDEST', label: 'STOP AIZEN FIRST', desc: 'He hasn’t revealed himself yet. Strike before he takes the Hōgyoku. Illusions everywhere.', next: 'k2', art: 'aizen_betrayal' },
        { id: 'hold', tag: 'HOLD-OUT', label: 'HOLD THE HILL', desc: 'Keep everyone off the hill until Ichigo arrives. Survive the captains and the snake.', next: 'k3', art: 'gin_snake' } ] },
    k1: { type: 'fight', name: 'SHATTER THE SŌKYOKU', enemy: ['byakuya_senbonzakura_senkei', 'TŌSHIRŌ', 'SOI FON'], boost: 2.6, rules: { dmg: 24, dr: 10 }, bossAb: 'illusion', final: 1,
      brief: ['Three captains guard the execution.', 'Every 3rd turn: KYŌKA SUIGETSU. Without Guard you lose 3 Energy to the illusion.'],
      scene: [['byakuya_senbonzakura_senkei', 'Interfere with the law of Soul Society and you will be cut down.']], next: 'end_rukia' },
    k2: { type: 'fight', name: 'THE MAN IN THE ILLUSION', enemy: ['aizen_betrayal', 'gin_snake'], boost: 3.2, rules: { dmg: 32, dr: 12 }, bossAb: 'illusion', turnLimit: 16, limitText: 'AIZEN TAKES THE HŌGYOKU', encounter: 'second-phase', final: 1,
      brief: ['Beat Aizen and Gin before Aizen takes the Hōgyoku: 16 turns.', 'Every 3rd turn: KYŌKA SUIGETSU. Guard or lose 3 Energy.', 'Aizen returns once at 35% HP with a full Ultimate.'],
      scene: [['aizen_betrayal', 'When did you believe you weren’t already under my spell?']], next: 'end_gin' },
    k3: { type: 'fight', name: 'NOBODY TOUCHES HER', enemy: ['gin_snake', 'byakuya_senbonzakura_senkei'], boost: 3.6, rules: { dmg: 45 }, encounter: 'hold-out',
      brief: ['Survive three enemy turns, or KO them.'], scene: [['gin_snake', 'Ooh, scary. Shoot to kill, Shinsō.']], next: 'end_hold' },
    end_rukia: { type: 'ending', id: 'rukia', name: 'RUKIA IS SAVED', text: 'The Sōkyoku shatters and Rukia walks off the hill alive. Soul Society will be talking about the strangers for centuries.', reward: { coins: 30000, gearShards: 2000, card: 'rukia_rescued' } },
    end_gin: { type: 'ending', id: 'gin', name: 'THE SNAKE SHEDS ITS SKIN', text: 'Aizen never takes the Hōgyoku. In the chaos, Gin reveals he was waiting for this exact moment to turn on him.', reward: { coins: 30000, gearShards: 2000, card: 'gin_snake' } },
    end_hold: { type: 'ending', id: 'hold', name: 'THE HILL HOLDS', text: 'You hold the hill until Ichigo arrives. History bends: everyone who was meant to fall that day walks away.', reward: { coins: 40000, gearShards: 2500, premium: 2 } },
  },
  trueEnding: { id: 'true', name: 'NOTHING WAS AN ILLUSION', text: 'Not one fighter fell. For the first time, Aizen admits something happened that he did not plan.', reward: { premium: 3, gearShards: 3000, card: 'aizen_betrayal' } },
})
CHRONICLES.push({
  id: 'temple', anime: 'BC', era: 'UNDERWATER TEMPLE', name: 'THE UNDERWATER TEMPLE', title: 'HIS ARMS WERE NEVER BROKEN', bg: 'assets/chronicle/temple.jpg', hero: 'asta_unbroken', villain: 'vetto_despair', col: '#ff3b3b', col2: '#1d1d1d',
  canon: 'Vetto of the Eye of the Midnight Sun breaks Asta’s arms and curses them, nearly ending his dream of becoming Wizard King.',
  nodes: {
    start: { type: 'choice', title: 'THE BEAST IN THE TEMPLE', scene: [
      ['Narrator', 'The Underwater Temple. The Black Bulls are down. Vetto stands over Asta.'],
      ['vetto_despair', 'Hope is just a lie you tell yourself before you break. Let me show you despair.'],
      ['asta_unbroken', 'I don’t care how strong you are. I’m not giving up!'],
      ['Narrator', 'A rift opens in the water above the temple. Your team crashes through.'] ],
      choices: [
        { id: 'shield', tag: 'PROTECT', label: 'PROTECT ASTA', desc: 'Stand between Asta and Vetto. Keep him standing until his arms are safe.', next: 't1', art: 'asta_unbroken' },
        { id: 'beast', tag: 'HARDEST', label: 'OVERWHELM THE BEAST', desc: 'Go straight for Vetto. Every hit he takes makes him angrier and stronger.', next: 't2', art: 'vetto_despair' },
        { id: 'bond', tag: 'DUO', label: 'FIGHT WITH NOELLE', desc: 'Noelle finds her magic. Fight beside the Black Bulls with her shield over you.', next: 't3', art: 'asta_noelle_bond' } ] },
    t1: { type: 'fight', name: 'HE STAYS STANDING', enemy: ['vetto_despair', 'LICHT'], boost: 3.6, rules: { dmg: 45 }, encounter: 'hold-out', bossAb: 'beastrage',
      brief: ['Survive three enemy turns, or KO them.', 'Every 3rd turn: BEAST RAGE. Vetto gains +15% damage.'], scene: [['vetto_despair', 'You’re protecting the brat? Then you can break first.']], next: 'end_asta' },
    t2: { type: 'fight', name: 'DESPAIR UNLEASHED', enemy: ['vetto_despair'], boost: 6.2, rules: { dmg: 56, dr: 24 }, bossAb: 'beastrage', turnLimit: 14, limitText: 'THE TEMPLE COLLAPSES', final: 1,
      brief: ['A raid boss. Beat Vetto before the temple collapses: 14 turns.', 'Every 3rd turn: BEAST RAGE stacks +15% damage. End it fast.'], scene: [['vetto_despair', 'MORE! Show me more despair!']], next: 'end_vetto' },
    t3: { type: 'fight', name: 'THE SEA DRAGON’S CRADLE', enemy: ['vetto_despair', 'DANTE ZOGRATIS'], boost: 3.4, rules: { dmg: 32, dr: 12 }, bossAb: 'beastrage', fury: 1, youRules: { dr: 12 }, final: 1,
      brief: ['Noelle’s water gives your team 12% damage reduction.', 'When your first fighter falls, the Black Bulls rage: +25% damage, no type disadvantage.'], scene: [['asta_noelle_bond', 'Noelle, cover me! I’m going straight in!']], next: 'end_bond' },
    end_asta: { type: 'ending', id: 'asta', name: 'HIS ARMS ARE SAFE', text: 'Vetto’s curse never lands. Asta keeps both arms, and his dream never even wobbles.', reward: { coins: 30000, gearShards: 2000, card: 'asta_unbroken' } },
    end_vetto: { type: 'ending', id: 'vetto', name: 'DESPAIR BROKEN', text: 'Vetto falls before he ever touches Asta. The Eye of the Midnight Sun loses its strongest fist.', reward: { coins: 30000, gearShards: 2000, card: 'vetto_despair' } },
    end_bond: { type: 'ending', id: 'bond', name: 'THE BLACK BULLS STAND', text: 'Noelle’s water and Asta’s swords break the beast together. The Black Bulls go home loud.', reward: { coins: 40000, gearShards: 2500, premium: 2 } },
  },
  trueEnding: { id: 'true', name: 'NEVER GIVING UP', text: 'Not one fighter fell. Asta and Noelle watched the whole thing and refused to be left behind next time.', reward: { premium: 3, gearShards: 3000, card: 'asta_noelle_bond' } },
})
CHRONICLES.push({
  id: 'kamino', anime: 'MHA', era: 'KAMINO WARD', name: 'KAMINO WARD', title: 'THE SYMBOL OF PEACE', bg: 'assets/chronicle/kamino.jpg', hero: 'all_might_last_ember', villain: 'afo_kamino', col: '#ffd23a', col2: '#1f4bff',
  canon: 'All Might uses the last ember of One For All to defeat All For One. He wins, but the Symbol of Peace is gone forever.',
  nodes: {
    start: { type: 'choice', title: 'THE LAST EMBER', scene: [
      ['Narrator', 'Kamino Ward lies in ruins. All Might’s power is flickering out. All For One smiles.'],
      ['afo_kamino', 'Look at you, All Might. A husk. Shall I tell the boy what you really are?'],
      ['all_might_last_ember', 'I am here. As long as I’m standing, I am still here.'],
      ['Narrator', 'A rift tears open above the ward. Your team lands in the rubble.'] ],
      choices: [
        { id: 'ember', tag: 'ENDURE', label: 'SAVE THE EMBER', desc: 'Fight for All Might so he never has to burn his last power. Endure the villains’ assault.', next: 'w1', art: 'all_might_last_ember' },
        { id: 'boss', tag: 'HARDEST', label: 'TAKE ALL FOR ONE HEAD-ON', desc: 'Go straight for All For One. He steals your Ultimate every few turns.', next: 'w2', art: 'afo_kamino' },
        { id: 'torch', tag: 'DUO', label: 'PASS THE TORCH EARLY', desc: 'Deku and All Might fight together, now. The League of Villains stands in the way.', next: 'w3', art: 'all_might_deku_torch' } ] },
    w1: { type: 'fight', name: 'HOLD THE SYMBOL', enemy: ['afo_kamino', 'SHIGARAKI'], boost: 3.6, rules: { dmg: 45 }, encounter: 'hold-out', bossAb: 'quirksteal',
      brief: ['Survive three enemy turns, or KO them.', 'Every 3rd turn: STOLEN QUIRK takes 40% of your Ultimate gauge unless you Guard.'], scene: [['afo_kamino', 'Heroes protecting a hero. How quaint.']], next: 'end_ember' },
    w2: { type: 'fight', name: 'THE DEMON LORD', enemy: ['afo_kamino'], boost: 4.6, rules: { dmg: 44, dr: 20 }, bossAb: 'quirksteal', turnLimit: 14, limitText: 'ALL MIGHT BURNS OUT', encounter: 'second-phase', final: 1,
      brief: ['A raid boss. Beat All For One before All Might’s ember burns out: 14 turns.', 'Every 3rd turn: STOLEN QUIRK. Guard or lose 40% Ultimate.', 'He comes back once at 35% HP.'], scene: [['afo_kamino', 'Come, then. I have quirks I’ve been saving for you.']], next: 'end_afo' },
    w3: { type: 'fight', name: 'THE NEXT SYMBOL', enemy: ['SHIGARAKI', 'DABI', 'HIMIKO TOGA'], boost: 2.9, rules: { dmg: 28, dr: 10 }, fury: 1, youRules: { dmg: 15 }, final: 1,
      brief: ['Deku and All Might fight with you: your team deals +15% damage.', 'When your first fighter falls, your team gets Plus Ultra: +25% damage, no type disadvantage.'], scene: [['all_might_deku_torch', 'Young Midoriya. It’s your turn now. We go together.']], next: 'end_torch' },
    end_ember: { type: 'ending', id: 'ember', name: 'THE SYMBOL STANDS', text: 'All Might never has to burn his last ember. The Symbol of Peace keeps standing.', reward: { coins: 30000, gearShards: 2000, card: 'all_might_last_ember' } },
    end_afo: { type: 'ending', id: 'afo', name: 'THE DEMON LORD FALLS', text: 'All For One is beaten before he can steal anything else. Kamino is the end of him, not of All Might.', reward: { coins: 30000, gearShards: 2000, card: 'afo_kamino' } },
    end_torch: { type: 'ending', id: 'torch', name: 'THE LEAGUE SCATTERS', text: 'The League of Villains breaks before Kamino ever happens. Deku learns from All Might in the open, side by side.', reward: { coins: 40000, gearShards: 2500, premium: 2 } },
  },
  trueEnding: { id: 'true', name: 'YOU ARE NEXT', text: 'Not one fighter fell. All Might passes the torch on his own terms, smiling.', reward: { premium: 3, gearShards: 3000, card: 'all_might_deku_torch' } },
})
CHRONICLES.push({
  id: 'baki', anime: 'BAKI', era: 'FATHER VS SON', name: 'THE GREATEST FATHER-SON FIGHT', title: 'SURPASS THE OGRE', bg: 'assets/chronicle/baki.jpg', hero: 'baki_strongest', villain: 'yujiro_awakened', col: '#ff5a2a', col2: '#6b0d0d',
  canon: 'Baki and Yujiro’s fight ends without a winner. Yujiro calls his son the strongest, but Baki never truly beats him.',
  nodes: {
    start: { type: 'choice', title: 'THE CITY STOPS TO WATCH', scene: [
      ['Narrator', 'The whole city has come to watch. The strongest father and son in history face each other in the street.'],
      ['yujiro_awakened', 'Show me, Baki. Show me whether my blood was worth it.'],
      ['baki_strongest', 'I’m not here to make you proud. I’m here to win.'],
      ['Narrator', 'A rift opens in the sky. Your team drops into the street between them.'] ],
      choices: [
        { id: 'train', tag: 'GAUNTLET', label: 'TRAIN BAKI FOR IT', desc: 'Fight through the strongest grapplers alive so Baki reaches his peak first.', next: 'b1', art: 'baki_strongest' },
        { id: 'ogre', tag: 'HARDEST', label: 'BREAK THE OGRE', desc: 'Face Yujiro yourself. The demon face on his back ignores your Guard.', next: 'b2', art: 'yujiro_awakened' },
        { id: 'meal', tag: 'STRANGE', label: 'THE IMAGINARY MEAL', desc: 'Help Baki fight the way he fought his father: with imagination. Your team gets stronger, but so does the Ogre.', next: 'b3', art: 'baki_yujiro_pride' } ] },
    b1: { type: 'fight', name: 'THE GRAPPLERS', enemy: ['jack_gouha', 'oliva_unchained'], boost: 3.6, rules: { dmg: 32, dr: 15 }, next: 'b1b',
      brief: ['Jack and Oliva stand in your way.'], scene: [['Narrator', 'The strongest fighters alive line up to test you.']] },
    b1b: { type: 'fight', name: 'THE PRIMEVAL', enemy: ['PICKLE'], boost: 4.2, rules: { dmg: 40, dr: 18 }, encounter: 'second-phase', final: 1,
      brief: ['Pickle, the primeval man. He comes back once at 35% HP with a full Ultimate.'], scene: [['Narrator', 'A man from the age of dinosaurs. Survive him and Baki is ready.']], next: 'end_train' },
    b2: { type: 'fight', name: 'THE OGRE AWAKENS', enemy: ['yujiro_awakened', 'YUJIRO HANMA'], boost: 3.6, rules: { dmg: 36, dr: 15 }, bossAb: 'demonback', turnLimit: 14, limitText: 'THE OGRE WINS', final: 1,
      brief: ['Beat the Ogre in 14 turns.', 'Every 3rd turn: DEMON BACK. Yujiro gains +20% damage and his hits ignore your Guard.'], scene: [['yujiro_awakened', 'You want my son’s fight? Then earn it.']], next: 'end_ogre' },
    b3: { type: 'fight', name: 'A MEAL WITH FATHER', enemy: ['YUJIRO HANMA'], boost: 5.4, rules: { dmg: 50, dr: 22 }, youRules: { dmg: 25 }, bossAb: 'demonback', final: 1,
      brief: ['Your team deals +25% damage from the Imaginary Meal.', 'Every 3rd turn: DEMON BACK. Yujiro grows stronger and ignores Guard.'], scene: [['baki_strongest', 'Dad. Let’s eat together, just once.']], next: 'end_meal' },
    end_train: { type: 'ending', id: 'train', name: 'BAKI SURPASSES THE OGRE', text: 'Baki reaches his peak and finally beats his father cleanly. The whole city saw it.', reward: { coins: 30000, gearShards: 2000, card: 'baki_strongest' } },
    end_ogre: { type: 'ending', id: 'ogre', name: 'THE OGRE KNEELS', text: 'Yujiro goes down to a team nobody has ever heard of. He laughs harder than anyone has ever seen.', reward: { coins: 30000, gearShards: 2000, card: 'yujiro_awakened' } },
    end_meal: { type: 'ending', id: 'meal', name: 'DINNER WITH THE OGRE', text: 'The fight ends at a dinner table. Father and son, finally even.', reward: { coins: 40000, gearShards: 2500, premium: 2 } },
  },
  trueEnding: { id: 'true', name: 'A FATHER’S PRIDE', text: 'Not one fighter fell. Yujiro looks at his son and says it out loud: the strongest on Earth.', reward: { premium: 3, gearShards: 3000, card: 'baki_yujiro_pride' } },
})
export const BOSS_AB = {
  deathball: { name: 'DEATH BALL', warn: '⚠ DEATH BALL INCOMING · GUARD!' },
  tbb: { name: 'TAILED BEAST BOMB', warn: '⚠ TAILED BEAST BOMB · BENCH TARGETED!' },
  kamui: { name: 'KAMUI', warn: '⚠ KAMUI INCOMING · GUARD OR LOSE A TURN!' },
  illusion: { name: 'KYŌKA SUIGETSU', warn: '⚠ KYŌKA SUIGETSU · GUARD OR LOSE 3 ENERGY!' },
  beastrage: { name: 'BEAST RAGE', warn: '⚠ BEAST RAGE · VETTO IS GETTING STRONGER!' },
  quirksteal: { name: 'STOLEN QUIRK', warn: '⚠ STOLEN QUIRK · GUARD OR LOSE 40% ULTIMATE!' },
  demonback: { name: 'DEMON BACK', warn: '⚠ DEMON BACK · THE OGRE IGNORES GUARD!' },
}
export const COMING = [
  { name: 'MARINEFORD', title: 'FIST OF FIRE', anime: 'OP' }, { name: 'SHIBUYA', title: 'THE SEAL', anime: 'JJK' },
]
export const chronById = id => CHRONICLES.find(c => c.id === id)
export const ENDING_COUNT = c => Object.values(c.nodes).filter(n => n.type === 'ending').length + (c.trueEnding ? 1 : 0)
