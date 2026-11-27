// Increase this number and update the notes for each player-facing patch.
export const PATCH_VERSION = 2026112701

const NOTES = [
  ['Quality of Life', ['Home now has a To Do list: Daily Boss tries, Pass rewards, achievements, finished missions, free packs and spare duplicates. Tap any item to go straight there.', 'Claim All collects your daily login, missions, achievements and Season Pass rewards in one tap. Pick rewards still need to be chosen on the Pass page.', 'My Cards has Sell All Dupes (coins) and Shred All (shards). One copy of every card is always kept, and locked or favourite cards are skipped.', 'The banner countdown now shows on Home.', 'How It Works is now a short, simple summary of each card.']],
  ['Veteran Roster · Wave Two', ["24 older cards gained new roles or stronger specialties, including tag-out cover, shield removal, Defense shred and reflection counters.","Legendary: WHITEBEARD (WORLD'S STRONGEST MAN), LEVI (HUMANITY'S STRONGEST), EREN (MARLEY RAID), KARS (ULTIMATE THING), LUFFY (EMPEROR OF THE SEA), GOHAN (FUTURE · LAST HOPE), KING (FAIRY KING), KIRA (A QUIET LIFE), MELIODAS (ASSAULT MODE), JOTARO (STONE OCEAN), VEGETA (SUPER SAIYAN), YAMATO (GUARDIAN OF WANO).","Mythic: BOROS (METEORIC BURST), YUTA (RIKA MANIFESTED), DEKU (ONE FOR ALL · UNLEASHED), SUPER GOGETA (SUPER SAIYAN), RENGOKU (VS AKAZA), ESCANOR (THE ONE), EREN (THE RUMBLING), YAMAMOTO (ZANKA NO TACHI), KANEKI (CENTIPEDE KAKUJA).","Rainbow: NATSU (DRAGON FORCE), NARUTO & SASUKE (TEAM 7 · BONDS), ICHIGO (FALSE TRUE BANKAI · VS YHWACH)."]],
  ['Card Clarity', ['Every card now has a How It Works panel with a Special summary and an explanation of its passive, including unique kits.']],
  ['Veteran Roster Update', [
    '30 older cards have new tools or stronger specialties: 20 Legendaries and 10 Mythics.',
    'Legendaries: Hisoka, Itachi, Geto, Maki, Hagoromo, Sanji, Jiren, Mikasa, Jiraiya, Lara Tybur, Tatsumaki, Neferpitou, Black Cat Yoruichi, Armin, Kishibe, Momo, Final War Bakugo, Reze, Zeldris and Vigilante Deku.',
    'Mythics: Arthur (vs Dragon), Serious Saitama, Super Saiyan 4 Goku, Diavolo, Prime All Might, Blackbeard, Genos (Armor Upgrade), The Evangelist, Final Explosion Vegeta and Super Saiyan Blue Gogeta.',
    'Highlights: Maki, Kishibe, Arthur and Saitama now strip shields with Specials. Jiren, Lara, Momo and All Might protect an incoming ally on their first live tag-out. Hagoromo, Geto, Jiraiya, Momo and The Evangelist offer more team healing. Itachi, Vigilante Deku and Blue Gogeta bypass damage reflection with Specials and Ultimates.',
  ]],
  ['Roster Update', [
    'Epic Reiner (Armored Titan) gives the incoming ally a 25% max-HP shield the first time he tags out alive.',
    'Epic Kakashi (Double Mangekyo) strips the active enemy’s shield with his Special. Its power rises from 220% to 245%.',
  ]],
  ['Battle Balance', [
    'Enemies in Campaign, Dead Zone and Daily Boss scale only partly with your team, so upgrades make a bigger difference. Campaign difficulty now comes mainly from the chapter.',
    'Dead Zone enemies can no longer recover lost HP. Sukuna’s World Cut cannot drop your maximum HP below 70% of its starting value.',
    'New Gen boss attacks share a per-target damage cap each turn, and the Aizen New Gen zone is easier.',
  ]],
  ['Team Building', [
    'Squad Bond: sharing a series, faction or archetype tag gives 10% damage reduction at 4 fighters. At 5, it gives 15% damage reduction and 2% regen. At 6, it gives 20% damage reduction, 3% regen and a one-time KO save for the leader.',
    'Multiverse Bonus: 3 series gives +5% stats, 4 gives +8%, and 5 or more gives +12% and +1 Energy per turn.',
    'Filter and build around 11 archetypes: Protagonist, Rival, Mentor, Sovereign, Monster, Blademaster, Tactician, Berserker, Guardian, Heroine and Speedster.',
  ]],
  ['Dead Zone Briefings & Fast Training', [
    'Choose View Briefing before any Dead Zone fight to see the boss’s kit, how to answer its warnings, what to bring, and bonus-damage tags where they apply. You can scout locked stages.',
    'On an owned card, Train to Level lets you pick an exact target. Train to Max opens the Level 100 preview. Choose coins, Training Tickets or a mix, then review the total and confirm before spending.',
  ]],
  ['Card Balance', [
    '83 base OVRs now fit their existing rarity bands.',
    'Gear 5 Luffy’s Special restores 25% Ultimate gauge and 1 Energy. Flash Goddess Yoruichi’s counter is softer, grants 10% gauge, and her mark detonation refunds 15% gauge without an Energy refund.',
    'Full Hollow Ichigo refunds 15% Ultimate gauge on a damaging Ultimate. Samehada Kisame still absorbs Blasts and steals Energy from them. His regular hits no longer drain Energy, and Water Dome shields allies for 12–30% max HP depending on charges.',
    'Light-Speed Admiral Kizaru’s Special strips the active enemy’s shield. Ice Age Aokiji starts with a 30% shield and takes 20% less damage. Strength of a Hundred Tsunade heals the active ally for 10% from the bench each turn. Her Special heals and shields all living allies for 15% max HP each.',
  ]],
  ['Clarity & Visuals', [
    'Card pages now have How It Works and Level & Diamonds panels. At 7◆, Limit Break boosts the passive by 25% and unlocks the Awakened Ultimate.',
    'Passive icons show under fighters during battle. Transformations charge, flip and burst on the card itself.',
  ]],
  ['Cards', [
    'Same-name cards now have distinct versions, including Muzan (Progenitor / Final Form), Ichigo (Hollow Awakening), Chrollo (Phantom Troupe Head), Luffy (Gear 4 · King Cobra), Hisoka (Elastic Trap), Sanji (Bœuf Burst), Mahoraga (Adaptation) and Natsu (Fire Dragon King).',
    'Removed duplicate Epic and Rare Makima cards and fixed cases where cards showed the wrong art.',
  ]],
  ['Modes & Banner', [
    'Campaign, Dead Zone, Live PvP, Story Arcs, Daily Boss and Season Pass are open. Other modes are paused during balance tuning.',
    'The Resurrección banner ends at midnight UK time as 27 November turns into 28 November.',
  ]],
]

export function showPatchNotes(profile, acknowledge) {
  if ((profile.seenPatchVersion || 0) >= PATCH_VERSION) return Promise.resolve()
  return new Promise(resolve => {
    const make = (tag, text, className = '') => {
      const el = document.createElement(tag)
      el.className = className
      el.textContent = text
      return el
    }
    const dialog = make('dialog', '', 'patch-notes')
    const header = make('header', '')
    const title = make('h2', 'Balance & Team Building')
    title.id = 'patch-notes-title'
    const date = make('time', '26 Nov 2026', 'patch-date')
    date.dateTime = '2026-11-26'
    header.append(make('p', 'Patch notes', 'patch-kicker'), title, date)
    dialog.setAttribute('aria-labelledby', title.id)
    const body = make('div', '', 'patch-body')
    body.tabIndex = 0
    body.setAttribute('aria-label', 'Patch changes')
    for (const [name, points] of NOTES) {
      const section = make('section', '')
      const list = make('ul', '')
      list.append(...points.map(point => make('li', point)))
      section.append(make('h3', name), list)
      body.append(section)
    }
    const footer = make('footer', '')
    const status = make('span', '', 'patch-status')
    status.setAttribute('role', 'status')
    const close = make('button', 'GOT IT', 'btn gold big')
    close.type = 'button'
    close.onclick = async () => {
      if (close.disabled) return
      close.disabled = true
      status.textContent = 'Saving…'
      try {
        if (await acknowledge(PATCH_VERSION)) {
          dialog.close()
          dialog.remove()
          resolve()
          return
        }
      } catch { /* Leave the dialog open so the player can retry. */ }
      status.textContent = 'Couldn’t save. Try again.'
      close.disabled = false
    }
    footer.append(status, close)
    dialog.append(header, body, footer)
    dialog.addEventListener('cancel', event => event.preventDefault())
    document.body.append(dialog)
    dialog.showModal()
    body.focus()
  })
}
