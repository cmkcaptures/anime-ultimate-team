# Handoff log — newest first
Every AI adds an entry here at the end of a session (see AGENTS.md).

---
## 2026-11-28 · Claude · gear: open slots + team strip
- Any gear fits any of the 3 slots (SLOT_TIER is now just a legacy label). Requirements live in gear.js GEAR_REQ: Gold needs a Legendary+ card, Silver Epic+, Bronze none. gearReqOk() is checked in engine gearEquip and shown in the picker.
- Team page: gearStrip(key) shows a 3-slot mini gear row under every card. Tapping opens gearPicker and the page re-renders in place.

---
## 2026-11-27 · Claude · GEAR v1
- js/gear.js: GEAR_BASES (8 items, icons in items/gear/*.webp), TIERS, rollGear/rollSub, mainStats (big-number scale), applyGear (folds gear into card st, gearHp, pas.e). 3 slots per fighter: 0 Gold, 1 Silver, 2 Bronze. Signature gear goes in Gold later.
- Engine: P.gear {items, eq{cardKey:[g,s,b]}, shards}, starter kit of 4 pieces. Actions gearEquip/Upgrade/Reforge/Salvage/Buy. Drops on Dead Zone clears and replays, Daily Boss and Crucible clears.
- Battle: fighter() HP += gearHp/100. senzuGear heals 25% once at turn start below 30% HP.
- App: effSig applies gear from ST.gear. loadoutRig on card pages, gearPicker, PAGES.armory with Gear Exchange, gearDetail (upgrade ring, reforge, salvage). Rarity frames in qol.css (.g-B/.g-S/.g-G).
- TODO: Signature gear, a better turtle_shell crop, more items.

---
## 2026-11-27 · Claude · stats beyond 99 + big-number Battle Stats
- Real card stats are no longer capped at 99 (effSig, ascendCard, awakening in app.js), so levels, diamonds and Ascension keep adding. OVR is still capped at 99. The card FACE still shows min(99) (cardkit). Battle uses the real uncapped stats.
- Card page shows battleStatsPanel(): HP = battle HP formula x100, STRIKE/BLAST ATK and DEFENSE = stat x420, SPEED/TECHNIQUE/IQ = stat x100 (STAT_SCALE). Gear (next, DBL-style) should add bonuses on this scale.

---
## 2026-11-27 · Claude · Crucible balance pass (best-team auto run, no items)
- Breather: +12% per stage. Boss stages fully heal and revive KO at 30% (engine crucibleResult). Stage boosts retuned in crucible.js: 4-12 up, 21-29 up, AoE-heavy late stages down, walls 42/44/48/50 down, easy 38/41/46/47 up.
- Result: best team on auto with no items and no saves dies around stage 23, with pressure from stage 6. Clearing 50 needs items, saves and counters, by design.

---
## 2026-11-27 · Claude · Dead Zone balance pass (best-team autoplay sims)
- Team used: boruto X, shanks, kokushibo_moon_eyes, goku_jiren, gogeta blue, gohan ultimate. Target: later zones win but cost fighters, and each zone is a bit harder than the last.
- Late single-target New Gen bosses (ngEnrage 2, not AoE) get a 70% per-turn per-target budget (was 45%), so they can finish fighters.
- Uchiha/Zeref zones (AoE bosses) use the AFO recipe (low pow, low dmg, low cap). Dio and Ankhseram have less HP and more damage. Onigashima stages get extra boost (last-door.js, stage 4 untouched). Pokemon League: resist 35 (was 60/65), boosts x0.8 then x0.82 on stages 2-5. Still hard without Pokemon cards, by design.
- Results after tuning: classic zones and Court are wins with 0-5 lost. Onigashima 0-2 lost. Dio 0/0/2 lost. Uchiha 0/0/1. Dragon 5/3/1. Pokemon mostly losses without PKM cards.

---
## 2026-11-27 · Claude · New Arrivals cinematic + first Ascension
- js/arrivals.js showArrivals(): runs after the patch notes. It shows cards with added > P.seenCardsAt plus cards whose ascension.added > P.seenCardsAt, then act seenCards. Players with no seenCardsAt start from the first batch that shipped with this feature (hardcoded timestamp in arrivals.js). ALWAYS set added: Date.now() on new cards and ascension.added on new kits so they show up.
- Ascensions so far: shigaraki_final (CATASTROPHE: shred, burn, nullPassive, energyBurn, dmg 40, dr 20, endure 1, 300% AoE). First was jotaro_starplatinum (timeStop 25, dmg 40, doubleStrike 35, pierce, +30% vs JJBA, endure, dodge, new Special).
- New: jonathan_hamon_overdrive, bucciarati_sticky_fingers, kakyoin_hierophant_green (pairs with Jotaros).

---
## 2026-11-27 · Claude · ASCENSION system
- Micke picks 1-2 veteran cards each week and we hand-design each kit. To make a card ascendable, add card.ascension = { ver, n, d, e, replace?, mv?, tx?, url?, fy? } in cards-list.json. e adds to (or, with replace:true, replaces) the passive. d is the full new description shown when ascended.
- Requirements (engine act ascend): 7 diamonds, 2 extra copies (e.n>=3), shards (L 8000, M/X 15000). Sets club entry asc=1. app effSig then applies ascendCard(): +2 OVR, +4% stats, kit swap. This uses the old asc field (was a placeholder).
- UI: ascensionPanel (NOW vs ASCENDED compare, requirement chips, gold ASCEND button), ascendFX cinematic, and a cardkit gold frame (ornate border, corner crests, top crest, sparkles, ASCENDED mark), drawn LAST in the render so the rarity frame does not cover it. img[data-asc] gets a pulsing gold aura (qol.css). If the frame design changes, bump the thumbnail key (now t16).
- tools/check.js: diff now only covers js/css/html with a big maxBuffer (the giant cards-list diff crashed it).
- No card has an ascension kit yet. Waiting on Micke's first picks.

---
## 2026-11-27 · Claude · Veteran wave three (40 cards)
- 40 older M/L kits got role-based additions (Giorno and Gogeta SSJ4 reverted after a quick sim: 4/4 vs the top new Mythics, so 38 remain) (only keys they lacked, so existing numbers and text stay true) plus a "Veteran refresh:" line in pas.d and c.vet=1. Skipped Dead Zone bosses, rewards and today's new cards. FIGHTER: drain/endure/pierceSpec/firstNull. ASSASSIN: first/exec/firstNull. TANK: shield/reflect/endure/regen. SUPPORT: teamDmg/teamHeal/endure. SHOOTER: spec/pierceSpec/gaugeBoost. Mythics also get ultDodge. Legendary numbers are x0.8.

---
## 2026-11-27 · Claude · card art tint
- cardkit.js: the type-colour hard-light glow over non-cutout art (alpha .55, radius 560-620) was tinting art, e.g. orange on One Piece cards. Now soft-light alpha .18, radius 220-260 (edges only). Thumbnail cache key bumped to t14 so cards re-render. Micke rule: never cover the art.

---
## 2026-11-27 · Claude · Luffy Gear 5 + flash duo
- luffy_joyboy_dawn (transforms to Gear 5 for 35% gauge from turn 2), kisuke_yoruichi_shunko, soifon_yoruichi_onmitsukido (L). Both duos pair with every SOI FON / YORUICHI card id (list built when they were added, so new Soi Fon or Yoruichi cards need adding to their pair.ids).

---
## 2026-11-27 · Claude · 2 Dead Zones + 3 Story Arcs
- New Gen zones ng-uchiha (stages 15-17: obito_ten_tails, obito_six_paths, madara_ten_tails) and ng-dragon (18-20: zeref_black_wizard, acnologia_dragon_king, zeref_ankhseram). Tuned above the Dio zone, and enrage applies. Full-clear rewards: obito_six_paths and acnologia_dragon_king (now Dead Zone exclusives).
- Story arcs (engine ARCS, existingReward): shibuya (JJK, reward gojo_is_back), infinity-castle (DS, reward ds_trio), blood-war (BLE, reward toshiro_daiguren_frozen_field). Not sim-tuned. Boosts follow the older arcs.

---
## 2026-11-27 · Claude · Demon Slayer wave
- pair can now be an array, and {all:true} requires every listed id on the team. Kamaboko trio: tanjiro_sun_breathing, inosuke_beast_breathing and zenitsu_thunder_god (added).
- New: gojo_infinity_red (L), goku_jiren_mui_clash, kokushibo_moon_eyes, rui_spider_threads (tank).

---
## 2026-11-27 · Claude · bench splash fix
- Sukuna Final (ultAoe) was KO-ing benched cards in the Dead Zone. In the H() hit helper, splash on non-active targets from deadZoneEnemy or ngEnrage attackers is now x0.3. The active target still takes the full hit.

---
## 2026-11-27 · Claude · Zeref/Mavis/Joker/Charon/Shinra Aegis + new kit keys
- New generic passive keys (battle.js startBattle): allyAnime {anime, dmg, dr} boosts every teammate from that series. pair {ids:[...], dmg, dr} gives the card a bonus when a listed card is on its team.
- zerefRevive (kitEffects): Special or Ultimate revives a KO'd ally at 50%, twice per battle. The player taps a KO'd bench slot to mark who (side.reviveMark), otherwise the highest OVR is revived.
- Cards: zeref_ankhseram (zeref_black_wizard already existed), mavis_fairy_heart, joker_trump_card (L), charon_great_wall (L), shinra_bansho_aegis (uses batch piccolo cover, revive 60). shinra_bansho got a pair back to Aegis.

---
## 2026-11-27 · Claude · THE CRUCIBLE (new signature mode)
- js/crucible.js: CRUCIBLE_STAGES (30 rows: enemy names/ids, boost, rules, weak, tip, boss), items, rewards. To add a stage, append a row. To make one harder, raise its boost.
- One continuous run: 6 fighters from My Team. HP, KOs and gauge carry over (stage.crucible to startBattle). Fighters heal 8% after each stage and fully after bosses. Healing in fights is halved (f.crucibleHalf). Items (senzu, revive, team heal) only work between stages, +1 per boss (cap 5).
- Engine actions: crucibleStart, crucibleEnter (leaving mid-fight counts as a loss and reverts to the save), crucibleResult (first clear gives the full reward, replays give 20% coins), crucibleSave, crucibleItem, crucibleAbandon. State is in P.crucible.
- Battle: cruciblePage, crucibleStageObj, crucibleEnd (CONTINUE chains straight into the next stage). Mode tab crucible is in MODES_ON.
- Micke: only stages 1-3 should be easy. The mode must be very strategic and hard but beatable, and very rewarding.
- Tested: a top all-Mythic team on auto, with no items and no saves, falls at stage 8. Bosses at 10, 20 and 30.
- Now 50 stages (bosses at 10, 20, 30, 40 and 50). Enemy HP is x0.62 and attack x1.08 in the Crucible block of startBattle, because fights took too long. Enemies enrage when low from stage 4 (ngEnrage). TODO: exclusive card for the final stage (needs art).

---
## 2026-11-27 · Claude · Story Arcs fix
- Story Arc fights never started. Arc chapters pass chapter.enemy as one id string, and enemyTeam() (changed in cb4bedf) did campTeam(stage.enemy), which looped over the letters and gave an empty enemy team, then crashed in syncReworkMatchup. Fixed with campTeam([stage.enemy].flat()). Also guarded next?.ver?.startsWith in the form button label.

---
## 2026-11-27 · Claude · dual banner + 10 cards
- DUAL BANNER: engine bannerList() returns every live limited banner. Fusion Reborn (DB) and Emperors & Warlords (OP: Shanks, Mihawk & Crocodile, Lucci, Crocodile) both run now until 4 Dec (SAIYAN_START/END). Players pick with act bannerSelect (P.bannerSel). Pending packs stay tied via P.bannerBoughtSel. ST.banners powers the .bnr-switch tabs. The Espada code is still there but unreachable while these run.
- New cards: boruto_two_blue_vortex (X99), minato_reaper_death_seal (L), lucci_cp0_leopard, sasuke_the_last_rinnegan (support), crocodile_sand_king (L), mihawk_crocodile_cross_guild, shanks_divine_departure, naruto_the_last (L), naruto_six_paths_truth and zabuza_demon_of_the_mist.
- All 19 other BOR cards got +10% dmg and +8% dr, noted as "Boruto bonus" in their pas.d.
- Minato art (atg/L_minato_reaper_death_seal.webp) has a phone-number ad at the bottom, so the card is cropped to the top. Re-crop the art file if possible.

---
## 2026-11-27 · Claude · Fusion Reborn banner
- 5 new DBZ Mythics: vegito_potara (transforms: SSJ for 25% gauge from turn 2, then Blue for 40% gauge after one full turn), gogeta_blue_soul_punisher, vegeta_majin_pride, gohan_future_final_stand and gohan_ultimate_awakened (support).
- Limited banner "FUSION REBORN" (engine.js SAIYAN_START/END) runs 28 Nov to 4 Dec and starts right after Resurrección. Featured cards are not exclusive.
- battle.js kitEffects now parses "Heal the whole team X% max HP" in Specials. It was silently ignored before, e.g. Doppo.
- Quick 1v1 sim vs the top 8 Mythics: Gogeta 8/8, both Gohans 7/8, Vegito 6/8, Majin Vegeta 5/8 (then buffed).

---
## 2026-11-27 · Claude · Baki series
- New anime code BAKI (registered in cardkit ANIME, engine ANIME_NAMES + Baki Pack, app pack theme + cinematic). 14 cards from Downloads/ATG, art in atg/*_baki-*.jpg. Ignored Mythic/canvas.png (blank).
- Micke wants the Bakis and Yujiros extremely good: Mythic Baki, Yujiro and Baki & Yujiro at 97 with heavy kits, Legendary Baki and Yujiro at 92. Doppo Epic (doppo_martial_god) is the support: team +15% damage, 6% team heal, 20% shield.
- Not sim-tested yet, and art crops are default (fy .2). Check them on device.

---
## 2026-11-27 · Claude · Mythic Dio
- New card dio_za_warudo (Mythic 96 Assassin, art atg/M_dio_za_warudo.webp). Built to match giorno_gold: in 1v1 autoplay sims it went 4-4 head-to-head with Giorno, and 21/28 vs the top Mythics (Giorno 25/28).

---
## 2026-11-27 · Claude · 2 new Dead Zones
- js/new-gen-zones.js: ng-afo "Symbol of Evil" (stages 9-11: all_for_one_symbol_of_evil read, dabi_final rush, all_for_one_quirk_overload mix) and ng-dio "The World" (12-14: dio_vampire read, dio_the_world break, dio_the_world illusion).
- RULE from Micke: every new Dead Zone must be slightly harder than the last ones. Bosses from index 9 up enrage when low (ngEnrage: +30% damage under 50% HP, +60% under 25%; from index 12 (Dio) ngEnrage=2: +45% and +90%, and their dmg was raised another 25% on 2026-11-27), because Micke wants them still killing late in the fight. Index >= 9 uses Aizen-final strength x (1 + 5% per stage), then a per-stage ngAdj tune: pow = boss stat boost, hp, dmg, cap = biggest share of boss HP one hit can take.
- Tuned with simulated fights (6 Mythics at 94 OVR or lower, autoplay): Aizen final wins every time. New stages were roughly 50/50 for autoplay. RAISED again 2026-11-27 after a friend auto-cleared Road Roller with no losses (Dio stages: dmg 2-2.4, cap .26-.34). Real players who answer the warnings do better.
- AoE bosses (AFO Epic, Dabi) hit the whole bench every turn, so they need low dmg plus low pow, or they wipe 6 fighters in 4-6 turns.
- Full-clear rewards (deadzone-rewards.js): ng-afo gives all_for_one_quirk_overload and ng-dio gives dio_za_warudo (Diavolo is back in packs). Reward cards are removed from packs and evolutions automatically.
- Patch notes 2026112702.

---
## 2026-11-27 · Claude · save backups + error reporting
- Backups (engine.js snapshot() inside save): one snapshot per day on the device (last 7, localStorage key <save>-backups) and in the cloud (users/{uid}/backups/{YYYY-MM-DD}, last 14). Players restore from Players → SAVE BACKUPS. A restore keeps a "before-restore" copy and keeps playerGrantRevision so grants don't loop.
- Errors: window error and unhandledrejection go to the Firestore errors collection (max 10/session, deduped). If that fails, the last 20 stay in localStorage aut-errors.
- Firestore rules for backups + errors were PUBLISHED by Micke on 2026-11-27, so cloud backups and the errors collection are live. When changing rules, start from the live rules in the console, not the old firestore.rules file.
- tools/check.js now also fails if one module is imported with two different ?v= tags (that loads 2 copies). It caught rivalry.js (fixed). account.js must keep the same tag in app.js and engine.js.

---
## 2026-11-27 · Claude · passive text audit
- 47 Epic+ passive descriptions now show their real numbers: a "Base: ..." sentence lists stats from pas.e the text didn't mention (dmg, dr, burn, shield, etc). Outdated "Awakened: +N% damage" lines now read "Total: +X% damage". Netero skipped (2.5× already matches). Check: every numeric pas.e value for those keys appears in pas.d. Keep this true when editing kits.
- Echo Hollow and Unstable Seal are campaign-only enemies with no passive. Left as is on purpose.

---
## 2026-11-27 · Claude · QoL pack
- New engine actions: sellDupes (sells spare copies for coins, keeps 1, skips locked/favourite) and claimAll (login, missions, achievements, Pass free/premium tiers; skips pick tiers; repeats up to 3 sweeps). Shred all now skips locked cards.
- Home: todoStrip() + claimableCount() in app.js, a TO DO box with a Claim All button above the quick strip. Banner countdown on the home featured tile and Summon button.
- My Cards: .dupe-bar with SELL ALL DUPES / SHRED ALL (confirm prompts).
- Patch notes 2026112701 (Quality of Life). Tested locally with the stubbed-login QA copy: claim all, sell dupes (locked kept) and the to-do strip all worked.

---
## 2026-11-27 · Claude
- How It Works (kitBreakdown in js/app.js) is a SHORT plain-words summary. Micke wants it simplified, not the full kit text. It shows a role line, a simplified Special (specialSimple), a simplified passive (passiveSimple + KIT_WORDS numbers), then a tip (kitTip). New passive effect keys need a plain-words entry in KIT_WORDS.

---
## 2026-11-26 · Codex
- Veteran wave two updated 24 existing kits: 12 Legendaries, 9 Mythics and 3 Rainbows. Retained card identities and OVRs, excluded Dead Zone enemy cards, and reused combat effects. Full roster in patch notes 2026112605.

---
## 2026-11-26 · Codex
- How It Works now gives one short play tip based on the kit, including a dedicated Mahoraga tip, across cards and form previews. Full kit text stays in its original panels.
- Legendary, Mythic and Rainbow pack walkouts reveal the framed card with rarity-colored effects in both single and multiple pulls. Reduced motion skips the cinematic.

---
## 2026-11-26 · Codex
- How It Works now renders for every card detail, including unowned cards, kit previews and transformation forms. It includes the Special and falls back to the card’s passive description when its effect keys are custom. Uses text nodes for the bullets.
- No kit changes. The separate audit for inaccurate passive descriptions remains open. Patch notes version 2026112604.

---
## 2026-11-26 · Codex
- Refreshed 30 older cards (20 Legendary, 10 Mythic) with existing kit effects: cover on tag-out, shield stripping, Guard piercing, reflection counters, team healing, bench pressure, Energy drain and targeted Special upgrades. Full roster list is in the version 2026112603 patch notes.
- Kept card IDs, OVRs and rarities intact and excluded every card resolved in current Dead Zone enemy lineups. No battle engine or Dead Zone rule changes. This is a kit pass; the wider passive-description audit is still open.

---
## 2026-11-26 · Codex
- Added two Epic roster alternatives: Armored Titan Reiner gives an incoming ally a 25% shield on his first live tag-out, and Double Mangekyo Kakashi strips the active enemy’s shield with a 245% PWR Special. Reused the existing cover and shield-strip mechanics.
- No changes to Dead Zone rules, top cards, card IDs, rarities or OVRs. Patch note version 2026112602 announces the two buffs. Test more roster slots before expanding this pass.

---
## 2026-11-26 · Codex
- Added the mandatory Balance & Team Building patch notes at startup. Got It records the current numeric version in the signed-in player’s normal local and cloud save. The popup blocks navigation and Escape until dismissed.
- For the next player-facing patch, update the notes and increase PATCH_VERSION in js/patch-notes.js. Bump its importer and entry-point cache tags. Today’s notes include Fast Training, Dead Zone briefings, the rarity audit and the seven-card balance pass.

---
## 2026-11-26 · Codex
- Added exact target-level training and a level-100 shortcut on owned cards. The preview shows costs and balances for coin, ticket, and mixed payment, with a confirmation before spending. Coin training uses the existing 8 coins per XP rate. Tickets-only training warns about unused XP from rounding, and mixed payment uses whole tickets plus the exact coin remainder. The engine rejects stale quotes.
- Existing single-train engine actions and battle XP still work. No card or balance edits.

---
## 2026-11-26 · Codex
- First card balance pass. Reduced Gear 5 Luffy’s Special refunds, Flash Goddess Yoruichi’s counter and mark returns, Full Hollow Ichigo’s Ultimate refund, and Samehada Kisame’s baseline Water Dome shield. Removed Kisame’s generic Energy burn while keeping the Blast absorption and steal.
- Buffed Light-Speed Admiral Kizaru’s shield removal, Ice Age Aokiji’s frontline shield and damage reduction, and Strength of a Hundred Tsunade’s bench healing and team shielding. Card IDs, rarities and OVR are intact. Retest these seven in PvP and dedicated New Gen lineups before broader changes.

---
## 2026-11-26 · Codex
- Added a full-screen pre-fight briefing to every Dead Zone stage. It shows boss kit and stage rules, warning responses, recommended team tools, damage bonus tags and entry requirements. Stage launches still go through the original battle entry point. Locked stages can be scouted.
- No balance changes. The briefing uses the current stage rules and the nine New Gen encounter mechanics.

---
## 2026-11-26 · Codex
- Ranked all 612 playable cards for the first balance pass using 93 headless fights per card, split between solo, 3v3 lead and 3v3 bench scenarios. Three campaign-only NPC cards were excluded. Gear 5 Luffy, Flash Goddess Yoruichi, Gojo & Sukuna, Samehada Kisame and SSJ4 Gogeta led the benchmark.
- Use the results as a baseline for manual testing. Initiative was alternated, gear and player upgrades were excluded, and the benchmark does not simulate live PvP choices or mode-specific boss rules. Hollow Mask Ichigo was #12, Ulquiorra #43, Nel #49 and Grimmjow #56. Test Nel with an all-Espada team before adjusting her. No gameplay edits were made.

---
## 2026-11-26 · Codex
- Completed the OVR portion of the rarity audit. Adjusted 83 cards to their current rarity bands: 7 Epics, 45 Legendaries and 31 Mythics. Kept card IDs, rarities, stats and kits intact.
- The passive-description audit and the later backlog are still open. Card data is fetched without cache, so this change needs no cache-tag bump.

---
## 2026-11-26 · Claude
**Done (all live):**
- Balance: enemies scale 55% with your team in Campaign, Dead Zone and Boss (`TEAM_SCALING`). Dead Zone enemies can't heal
  (heal guard plus an HP ratchet). Sukuna's World Cut is floored at 70% max HP. New Gen signature hits are capped per turn. Aizen New Gen is softened.
- Paused every battle mode except Campaign, Dead Zone, Live PvP, Story Arcs, Daily Boss and Season Pass (`MODES_ON`).
- Team building: Squad Bond (4/5/6 sharing a tag gives damage reduction, regen and a leader KO save), Multiverse bonus (3+ series),
  11 archetype tags (`arch` in cards-list.json, e.g. Protagonist, Rival, Speedster) usable in filters and bonds.
- Cards show "How it works" and "Level & Diamonds" panels. The Limit Break label is explained.
- Battles show passive icons under each fighter. Transformations now animate on the card itself (transform-fx.css).
- Resurrección banner ends 28 Nov 00:00 UTC (`ESPADA_END`).
- Same-name cards got distinct version names. Removed the Epic and Rare Makima (only the Legendary is left). 615 cards.
- Added AGENTS.md, this file and `tools/check.js`.

**Not done / next up:**
- Card audit: 83 cards rated outside their rarity band (Epic 80–87, Legendary 86–92, Mythic 92–97, Rainbow 96–99).
  35 passive descriptions don't show their real +damage number. Micke wants to do this soon.
- Later: Christmas event (mid-Dec), What-If Arcs (needs art), re-enable the paused modes.

- 2026-11-28 (Claude): Gear frames v3 — canvas-drawn tier frames in js/gear-frame.js (gearFrameURL, GEAR_CLIP), used by gearTile in app.js; CSS block "gear frames v3" in qol.css.

- 2026-11-28 (Claude): Team-page gear strip (.tg-slot) uses drawn frames too.

- 2026-11-28 (Claude): Home life — js/home-life.js: LIVE news ticker (banner, new cards, ascensions, top player), auto-rotating featured carousel (banner/ascensions/new arrivals/Dead Zone/Crucible), leader card tilt + breathing + aura motes. CSS "home life" in qol.css.

- 2026-11-28 (Claude): Team Bonuses panel on the Team page (6 tiles: Leader, Series, Auras, Links, Squad Bond, Multiverse; on/off + how to activate) replaces the old .tm-bond/.tm-links text boxes (hidden via CSS). Glowing animated SVG lines between linked fighters (drawTeamLinks in app.js, drawn via ResizeObserver).

- 2026-11-28 (Claude): Mythic GUTS (guts_black_swordsman, new series BERSERK) = Crucible stage-50 first-clear exclusive. Field crucibleReward:50 on the card; deadZoneReward() returns "crucible" for it so it is locked out of packs/exchange; engine crucibleResult gives it on first stage-50 clear; crucibleReward(50) shows it; arrivals says "Earn it by clearing The Crucible". BERSERK registered in app.js ANIME, cardkit.js, engine ANIME_NAMES, pull FX.
