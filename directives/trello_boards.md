# Trello boards for house projects

## Goal

A signed-in Builder user (GitHub or password) can connect Trello once, then create a board for a saved house. The board is populated **ground-up and in order**: critical utilities first, then earthworks and foundation, with later build phases already filled as backlog themes for the next runs. Sticky notes and Builder decisions append after.

Trello does not use GitHub OAuth. Builder sign-in stays on GitHub/password. Trello authorize is a separate step that stores a user token on the worker.

## Operator setup

Trello is not GitHub login. Builder sign-in stays on GitHub or a password. Trello is a second authorize step that stores one read/write token per account.

1. Create an app at https://trello.com/apps/admin. Choose “My app doesn't use Power-Up capabilities”. Builder is not a board Power-Up.
2. Open that app, go to the **Trello Auth** tab, and choose **Generate a new API Key**. Copy the API key. Leave the secret on that page. A secret stored as `TRELLO_API_KEY` makes `https://trello.com/1/authorize` show “App not found”.
3. On the same tab, allow the site origins that may return from authorize: `https://builder.rynell.app`, `https://builder.rynell.org`, and `http://localhost:5173` while developing. With no allowed origin, Trello blocks the return even when the key is valid.
4. Put the API key on the knowledge worker: `wrangler secret put TRELLO_API_KEY --config workers/wrangler.jsonc`.
5. Apply D1 migration `workers/migrations/0009_trello.sql`. The worker also creates the tables on first use.
6. Redeploy the worker. Until the key exists, the Trello mark answers that the key is missing.

## What the user sees

The first visit to the builder is a tour on the live screens. Skip is always there. It does not show again after Skip or Start building (`builder.onboarding`). Projects has **How it works**, which plays it again.

1. The house, on the model.
2. The parts, on the options panel: size, roof, doors, and windows.
3. The tools, on the tool dock.
4. The sun, view, measure, and notes trays, each opened in turn.
5. The mood board, open, for pictures, clips, notes, and an invite.
6. The assistant.
7. The project, on the Projects control.
8. The board. Projects opens, and the note points at the Trello mark on a saved house.

Sign in, save the house, then click that mark. Trello asks for `read,write` once and returns to `/build`. Builder creates the board. The same mark opens it later. **Disconnect Trello** in Projects removes the stored token.

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
