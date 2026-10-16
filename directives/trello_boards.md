# Trello boards for house projects

## Goal

A signed-in Builder user (GitHub or password) can connect Trello once, then create a board for a saved house. The board is populated **ground-up and in order**: critical utilities first, then earthworks and foundation, with later build phases already filled as backlog themes for the next runs. Sticky notes and Builder decisions append after.

Trello does not use GitHub OAuth. Builder sign-in stays on GitHub/password. Trello authorize is a separate step that stores a user token on the worker.

## Operator setup

Trello is not GitHub login. Builder sign-in stays on GitHub or a password. Trello is a second authorize step that stores one read/write token per account.

1. Create a Power-Up at https://trello.com/power-ups/admin and copy its API key.
2. On that Power-Up, allow the site origins that may return from authorize: `https://builder.rynell.app`, `https://builder.rynell.org`, and `http://localhost:5173` while developing.
3. Put the key on the knowledge worker: `wrangler secret put TRELLO_API_KEY --config workers/wrangler.jsonc`.
4. Apply D1 migration `workers/migrations/0009_trello.sql`. The worker also creates the tables on first use.
5. Redeploy the worker. Until the key exists, the Trello mark answers that the key is missing.

## What the user sees

Projects is the home for this. There is no separate Trello page.

1. Sign in.
2. Open **Projects**. The first time, while Trello is not connected, a short note explains the board. **Got it** hides that note on this browser (`builder.trello.intro`).
3. Save the house if it is not in the list yet.
4. Click the Trello mark on that house. The first time, Trello asks for permission (`read,write`) and returns to `/build`. Builder then creates the board.
5. The same mark later opens the linked board. **Disconnect Trello** in Projects removes the stored token.

The board is filled in construction order: critical utilities, earthworks, foundation, then later phases as backlog, plus decisions and sticky notes from the house.

## Board layout

`src/trello/tasks.ts` fills the board left to right:

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
- Authorize return uses `#token=…` on `/build`, plus `?trello_state=` stored for that signed-in user when authorize starts. The token is saved only when the browser pending state and the worker state match. A denial is kept until it is shown. An abandoned pending request does not start authorize again on the next visit.
- Opening a house must succeed before its configuration is sent to Trello.
- A stored token that Trello rejects (401/403) is deleted. Status then reports disconnected. Saved houses can disconnect Trello.
- Board creation claims the house row first, reuses a Trello board whose description is that house id, and keeps the link only when every list and card is created. List position is `top`. A partial board created in that request is deleted.
- Default catalog values (untreated wood, the standard door and window, loft `none`) are not treated as completed decisions. Placed openings, a chosen paint, and a real loft are. Sticky-note text is kept in the card description. Rooms are read from the keyed object the house stores.
- Worker preview deploys do not receive the production accounts database. Preview account features stay off until `workers/wrangler.jsonc` `previews.d1_databases` names a separate database. The knowledge worker uses Workers AI, so board creation runs on a paid Workers plan rather than the 50-subrequest free cap.
