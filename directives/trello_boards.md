# Trello boards for house projects

## Goal

A signed-in Builder user (GitHub or password) can connect Trello once, then create a board for a saved house. The board is populated **ground-up and in order**: critical utilities first, then earthworks and foundation, with later build phases already filled as backlog themes for the next runs. Sticky notes and Builder decisions append after.

Trello does not use GitHub OAuth. Builder sign-in stays on GitHub/password. Trello authorize is a separate step that stores a user token on the worker.

## Steps

1. Create a Trello Power-Up at https://trello.com/power-ups/admin and copy its API key.
2. Put the key on the knowledge worker: `wrangler secret put TRELLO_API_KEY --config workers/wrangler.jsonc`.
3. Apply D1 migration `workers/migrations/0009_trello.sql` (or let the worker `CREATE TABLE IF NOT EXISTS` path create the tables).
4. In the app, open **Saved houses**, click the Trello icon on a house.
5. If Trello is not connected, the browser opens Trello authorize (`read,write`, fragment return to `/build`). After Allow, Builder saves the token and creates the board.
6. Board layout comes from `src/trello/tasks.ts` via `trelloBoardPlanFromHouse` (left → right):

| List | Role |
| --- | --- |
| 1. Critical first | VA capacity, frost-free depth, electricity plan, insulation, heat source |
| 2. Phase 1: Earthworks | Demarcation → excavation → trenches → gravel → compaction → drainage |
| 3. Phase 2: Foundation | L-elements → under-slab insulation → stub-ins → rebar → pour |
| 4–7. Phases 3–6 | Framing, weatherproofing, rough-ins, interiors — backlog themes pre-filled |
| Builder decisions | Size/roof/facade/openings/floor plan from the saved house |
| Notes | Sticky notes from the house board |
| Doing / Done | Process columns; completed Builder decisions → Done |

Cards are created with `pos=bottom` so checklist order is preserved top-to-bottom.

## Worker routes

| Route | Role |
| --- | --- |
| `GET /api/trello/status?houseId=` | Connected flag + linked board for that house |
| `POST /api/trello/authorize` | Returns Trello authorize URL (`origin` must be in `ALLOWED_ORIGINS`) |
| `POST /api/trello/token` | Saves the user token after authorize |
| `DELETE /api/trello/token` | Disconnects Trello |
| `POST /api/trello/boards` | Creates board, phase lists, and ordered cards for an owned `houseId` |

## Edge cases

- Missing `TRELLO_API_KEY` returns `trello` (same idea as missing GitHub client keys).
- Creating again without `force: true` returns the existing linked board and opens it.
- Notes without text are skipped. At most 80 cards are sent.
- Boards use `defaultLists=false`; Builder creates the phase columns itself.
- A completed Builder milestone (size, roof, facade, openings, `floorPlanDone`) is written to **Done**.
- Authorize return uses `#token=…` on `/build`. The router stashes it before Vue reads the hash; Saved houses finishes the save and pending board create.
