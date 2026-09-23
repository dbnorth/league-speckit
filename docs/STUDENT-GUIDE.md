# Student catalog-copy guide

This app is a **simple Vue + Express + MySQL example**. Copy one catalog at a time. Do not add Pinia, repositories, or extra layers.

## Copy this pattern

For a new list (for example **Venue**), clone **League**:

| Layer | Copy from | Rename to |
| ----- | --------- | --------- |
| Spec | `features/feature-3-league-management.md` | `features/feature-N-venue-management.md` |
| Model | `backend/app/models/league.model.js` | `venue.model.js` |
| Controller | `backend/app/controllers/league.controller.js` | `venue.controller.js` |
| Route | `backend/app/routes/league.routes.js` | `venue.routes.js` |
| Service | `frontend/src/services/leagueServices.js` | `venueServices.js` |
| List + form | `LeagueList.vue`, `LeagueForm.vue` | `VenueList.vue`, `VenueForm.vue` |
| Tests | `backend/tests/leagues.test.js`, `frontend/tests/Leagues.test.js` | matching `it` names from your Gherkin |

Then wire the model in `backend/app/models/index.js`, mount the route in `backend/server.js`, add a menu item and route, and update `features/reference/`.

Use `requiredText` and `parseId` from `backend/app/helpers/fields.js` the same way League does.

## Do not copy first

| File | Why |
| ---- | --- |
| `backend/app/services/seasonSchedule.js` | Feature 8 algorithm only |
| `frontend/src/views/Season.vue` / `Team.vue` | Detail pages on top of a catalog |
| Auth (`auth.controller.js`, Login/Register) | Already implemented |

## Keep the same shape

- Dialogs for add/edit, not separate pages
- Service method names in camelCase (`getLeagues`, `createLeague`)
- GET for any signed-in user; POST/PUT/DELETE for admin
- One feature branch: `feature/N-short-name` from `dev`

Full SDD rules stay in `features/framework.md` and `.cursor/rules/`.
