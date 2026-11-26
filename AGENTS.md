# Rules for any AI working on this repo (Claude, ChatGPT/Codex, anyone)

Micke switches between AI assistants. Each one must be able to pick up cold
without being told anything. **Read this file and HANDOFF.md before doing anything.**

## Start of every session
1. `git pull` — the other AI may have pushed since you last looked.
2. Read `HANDOFF.md` (newest entry at the top) to see what changed and what's in progress.
3. Read `git log --oneline -15` for anything not in the handoff.

## Hard rules (these are how the game gets broken)
- **This repo is the source of truth.** Edit files here directly. Never regenerate it from
  another folder or build script (e.g. never run an old `build-site.js` from outside the repo).
- **Cache tags.** `sw.js` caches JS/CSS by URL. If you change a file, bump its `?v=` tag in every
  file that imports it, and keep going up the chain to `index.html`
  (e.g. `pve-balance.js` → its import in `battle.js` → `battle.js` import in `app.js` → `app.js` in `index.html`).
  Skip this and phones keep running the old code. `cards-list.json` is fetched no-cache, so it needs no tag.
- **Card IDs are permanent.** Saves and art are keyed by `id`. Never reuse or duplicate an id.
  Renaming the `ver` is fine. Don't change an existing id unless you also update every reference.
- **Never delete cards or modes without Micke asking.**
- **Small commits, one feature each,** with a clear message. Don't rewrite history and don't force-push.

## Before every push
```
node tools/check.js
```
It checks JS syntax, JSON, duplicate card IDs and missed cache-tag bumps. If it fails, fix it and don't push.
After pushing, wait about a minute and confirm the live site (https://cmkcaptures.github.io/anime-ultimate-team/) serves the new `?v=` tags.

## End of every session (mandatory)
Add an entry to the **top** of `HANDOFF.md`: date, which AI you are, what you changed and why,
what you left unfinished, and any gotchas. Commit it with your work. This is how the next AI catches up.

## Current state (keep updated when it changes)
- Only these battle modes are enabled: Campaign, Dead Zone, Live PvP, Story Arcs, Daily Boss, Season Pass
  (`MODES_ON` in `js/battle.js`). The others are paused until Micke says.
- Balance: enemies scale 55% with your team (`TEAM_SCALING` in `js/pve-balance.js`). Dead Zone enemies can
  never heal. Micke's taste: tough but beatable, and upgrading your team must matter.
- Style: serious AAA-card-game UI, not goofy or Roblox. Never cover the card art with tints or banners.
