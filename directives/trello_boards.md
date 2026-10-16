# Trello boards for house projects

## Goal

A signed-in Builder user (GitHub or password) can connect their Trello account once, then create a Trello board for a saved house. The house project carries over naturally: configurator milestones, construction todos from the saved design, and sticky notes as open tasks. Choices already made in Builder land on **Done**.

Trello does not use GitHub OAuth. Builder sign-in stays on GitHub/password. Trello authorize is a separate step that stores a user token on the worker.

## Steps

1. Create a Trello Power-Up at https://trello.com/power-ups/admin and copy its API key.
2. Put the key on the knowledge worker: `wrangler secret put TRELLO_API_KEY --config workers/wrangler.jsonc`.
3. Apply D1 migration `workers/migrations/0009_trello.sql` (or let the worker `CREATE TABLE IF NOT EXISTS` path create the tables).
4. In the app, open **Saved houses**, click the Trello icon on a house.
5. If Trello is not connected, the browser opens Trello authorize (`read,write`, fragment return to `/build`). After Allow, Builder saves the token and creates the board.
6. Board layout comes from `src/trello/tasks.ts` via `trelloBoardPlanFromHouse`:

| List | Contents |
| --- | --- |
| Milestones | Project overview + size / roof / facade / openings / floor-plan gates |
| Size & permits | Confirm dimensions and permits |
| Structure & facade | Foundation, walls, materials |
| Roof | Roof and covering |
| Openings | Doors, windows, gates (from `wallSlots` + catalog) |
| Loft & outdoor | Loft and terraces when present |
| Floor plan | Interior rooms; respects `floorPlanDone` |
| Notes | Each non-empty sticky note |
| Doing | Empty — for work in progress |
| Done | Milestones and todos already decided in Builder |

## Worker routes

| Route | Role |
| --- | --- |
| `GET /api/trello/status?houseId=` | Connected flag + linked board for that house |
| `POST /api/trello/authorize` | Returns Trello authorize URL (`origin` must be in `ALLOWED_ORIGINS`) |
| `POST /api/trello/token` | Saves the user token after authorize |
| `DELETE /api/trello/token` | Disconnects Trello |
| `POST /api/trello/boards` | Creates board, milestone lists, and cards for an owned `houseId` |

## Edge cases

- Missing `TRELLO_API_KEY` returns `trello` (same idea as missing GitHub client keys).
- Creating again without `force: true` returns the existing linked board and opens it.
- Notes without text are skipped. At most 50 cards are sent.
- Boards are created with `defaultLists=false`; Builder creates the milestone columns itself.
- A completed milestone (size chosen, roof set, facade chosen, openings placed, `floorPlanDone`) is written to the **Done** list, not left open.
- Authorize return uses `#token=…` on `/build`. The router stashes it before Vue reads the hash; Saved houses finishes the save and pending board create.
