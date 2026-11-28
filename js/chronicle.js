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
export const COMING = [
  { name: 'MARINEFORD', title: 'FIST OF FIRE', anime: 'OP' }, { name: 'SHIBUYA', title: 'THE SEAL', anime: 'JJK' },
  { name: 'THE UCHIHA', title: 'BROTHERS OF THE LEAF', anime: 'NAR' }, { name: 'PLANET VEGETA', title: 'THE SAIYAN PRINCE', anime: 'DBZ' },
]
export const chronById = id => CHRONICLES.find(c => c.id === id)
export const ENDING_COUNT = c => Object.values(c.nodes).filter(n => n.type === 'ending').length + (c.trueEnding ? 1 : 0)
