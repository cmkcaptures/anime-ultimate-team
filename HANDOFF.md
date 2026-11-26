# Handoff log — newest first
Every AI adds an entry here at the end of a session (see AGENTS.md).

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
