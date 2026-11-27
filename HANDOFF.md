# Handoff log — newest first
Every AI adds an entry here at the end of a session (see AGENTS.md).

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
- RULE from Micke: every new Dead Zone must be slightly harder than the last ones. Index >= 9 uses Aizen-final strength x (1 + 5% per stage), then a per-stage ngAdj tune: pow = boss stat boost, hp, dmg, cap = biggest share of boss HP one hit can take.
- Tuned with simulated fights (6 Mythics at 94 OVR or lower, autoplay): Aizen final wins every time. New stages are roughly 50/50 for autoplay, harder towards ZA WARUDO. Real players who answer the warnings do better.
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
