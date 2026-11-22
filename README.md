# The Opera House Caper

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/aslfahim/heist-game-asl666/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/aslfahim/heist-game-asl666/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A complete, original top-down heist game, built for make.fun's **"Make the best heist game"** bounty. One thief, one baroque opera house after the show, three treasures to steal — and a house full of ushers, cameras and sweeping stage spotlights that would very much like you to stay for the encore.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome. No build step, no network requests, no assets to download.

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080
```

## The heist

- **The rooms:** the golden stage, the backstage corridor, the balcony corridor, the red-carpeted stalls and the chequered foyer — three routes between any two of them.
- **The loot:** the prima donna's jewels (stage), the Stradivarius (backstage), the box-office safe (foyer). Steal at least two, then slip out the **stage door** (top right).
- **The twist — costume disguise:** press **C** to don an opera cloak and stroll slowly past guards; running or stepping close blows it, and cameras see through any costume.
- **The watchers:** four patrolling guards with vision cones (they chase once the alarm passes 55%), four sweeping security cameras, and two rotating stage spotlights.
- **The alarm meter:** rises while any eye is on you, falls in the dark. At 100% you get a 1.2-second grace window to break line of sight — a fair caught moment, not an instant fail.
- **Cover:** hide behind the velvet curtains — no eye in the house can see through them. Seat rows and pillars break movement and sight.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move (mouse: click and hold to walk toward the cursor) |
| SHIFT | Run — faster, but noisy and it drops the disguise |
| C | Costume disguise on/off (drains a charge, refills when off) |
| E | Grab loot up close |
| M | Mute |
| R | Restart after being caught or escaping |
| ENTER / click | Begin |

Score is loot value plus a time bonus for a fast, quiet getaway.

## Layout

- `main.ts` — the Node 22 entrypoint: copies `game/` + `screenshots/` to `/output` and writes `dossier.json` via the vendored make.fun library.
- `game/index.html` — the page; `game/src/` holds the game, one file per job: `config.js` (tuning), `world.js` (floor plan + line of sight), `guards.js` (patrols, cameras, spotlights), `player.js` (the thief + disguise), `render.js` (canvas drawing + HUD), `audio.js` (synthesized sound, no files), `shots.js` (staged screenshot scenes), `main.js` (loop + rules).
- `screenshots/` — four real renders of the game's own code in a browser.
- `vendor/makefun-game.ts` — the kit's library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
