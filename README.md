# Notice Period

You quit with no offer in hand. Land a new job while the company dumps work on you, blames you for everything and steals your credit.
A motion-comic arcade game in 5 Issues and 17 levels (~30 min). Two ways to play:
- **Story Mode:** the full comic. Progress saves on the device after every page, choice and level, so you can stop and resume any time (Continue shows where you'll land).
- **Free Play:** skip the story and play any of the 18 games (17 story levels + a Stress Buster bonus) on Easy, Medium or Hard. Best stars are saved per game and difficulty.

**Status:** v0.1 playable end to end. The art is placeholder SVG characters; the story, all 15 games, branches and endings work.

## Run it
```
npm install
npm run dev
```
Open http://localhost:3000. No API keys, no AI, nothing to configure.

**Dev shortcut:** `/?level=7` opens Level 7's intro; `/?level=7&autoplay=1` starts it straight away.

**Phone or computer:** the setup screen asks (pre-selected by touch detection). Phone = touch controls, no zoom or pull-to-refresh.
Computer = mouse plus keys: arrows (maze, stealth, crossing, pong, invaders, boss dodge), SPACE (alt-tab, jump, pour),
← → (résumé stack), 1–5 (poker cards).

## Testing and balance
- **Game bot lab** (dev only): open `/botlab` while `npm run dev` runs. Bots with human-like reaction and accuracy play every
  mini game headlessly, faster than real time, and report the star spread. Options: `?runs=24&levels=3,9`. Bots: `games/botlab.ts`.
- **Story simulator:** `node scripts/simulate.mjs` plays 20,000 runs of the meters, choices, branches and endings.

## How it works
- **The story lives in one file:** `docs/COMIC_SCRIPT.md`. Before `dev` and `build`, `scripts/parse-script.mjs` turns it into
  `content/comic.json`. To change a line, a panel or a level result, edit the script, not the JSON.
- **The comic reader** (`components/Comic.tsx`) shows panels one tap at a time: captions, balloons, thought bubbles, sound effects,
  choice panels and villain cards. `components/Figures.tsx` draws the characters (placeholder art).
- **The flow** (`components/Game.tsx`): covers → pages → level intro → mini game → result panel → meters.
  Branches: low Job Hunt after Level 12 → *Second Chance* (a hard Level 9 replay); Blame 100 → *Terminated*;
  losing the final boss → *Offer Revoked*. A loss replays only that Issue. Progress saves on the device.
- **The rules** (`lib/rules.ts`): starting meters, the offer threshold, ending conditions. Tune balance there.
- **The mini games** (`games/*.ts`): one Phaser scene each, sharing helpers in `games/kit.ts`. Each reports 0–3 stars.

Level ids are stable; the number players see comes from the story order in the script.

| Level id | Game | File |
|---|---|---|
| 1 The Draft | Rage-to-Polite | `games/rage.ts` |
| 2 The Quick Call | Darts | `games/darts.ts` |
| 3 The Portal | HR Portal Maze | `games/maze.ts` |
| 4 Calendar Carnage | Slice the Invites | `games/slice.ts` |
| 5 Apply-o-Matic | CV Slingshot | `games/slingshot.ts` |
| 6 Blame Pong | Pong | `games/pong.ts` |
| 7 Boss Is Coming | Alt-Tab Reflex | `games/alttab.ts` |
| 8 The Great Sneak | Office Stealth | `games/stealth.ts` |
| 9 Tell Me About Yourself | Résumé Stack | `games/stack.ts` |
| 10 The Chase | Office Runner | `games/runner.ts` |
| 11 The Brain Dump | Pour the KT | `games/pour.ts` |
| 12 The Number | Salary Poker | `games/poker.ts` |
| 13 No-Dues Crossing | Laptop Run | `games/crossing.ts` |
| 14 Reply-All Storm | Inbox Invaders | `games/invaders.ts` |
| 15 The Relieving Letter | Boss Fight | `games/boss.ts` |
| 16 The Bin *(first level)* | Paper Toss | `games/toss.ts` |
| 17 One Last Quick Call *(before the final boss)* | Office Brawl, 2D fight | `games/fight.ts` |
| 18 Stress Buster *(Free Play bonus)* | Smash the office | `games/smash.ts` |

## Stack
- Next.js (App Router, TypeScript) · [Phaser 4](https://phaser.io) (MIT) for the mini games ·
  [Astryx](https://github.com/meta/astryx) (Meta) for buttons, inputs and meters · Bangers + Comic Neue fonts (Google Fonts, OFL)
- Hosted on Vercel: import the repo, no environment variables needed.

## Folder map
| Path | What it is |
|---|---|
| `docs/GAME_DESIGN.md` | Story, cast, levels, endings, art direction |
| `docs/COMIC_SCRIPT.md` | The panel-by-panel script for all 5 Issues (the source of truth) |
| `content/comic.json` | Generated from the script; don't edit by hand |
| `components/` | Game flow, comic reader, character art |
| `games/` | The 15 Phaser mini games |
| `lib/` | Types and rules |
| `data/` | Build-only notes (git-ignored) |

## Next
- Replace the placeholder SVG characters with hand-drawn art (the art list is at the end of the comic script).
- Sound effects (CC0 packs), an installable offline app manifest, and balance tuning after real players try it.
