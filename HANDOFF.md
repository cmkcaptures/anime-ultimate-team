# Handoff log — newest first
Every AI adds an entry here at the end of a session (see AGENTS.md).

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
