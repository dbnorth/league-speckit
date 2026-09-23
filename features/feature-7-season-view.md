# Feature: Season View

**Feature ID:** 7
**Branch pattern:** `feature/7-season-view`
**Status:** Ready
**Created:** 2026-09-22
**Input:** Signed-in admin users open a season from the seasons list. The season view has a heading with season info, a list of that season's games, and an **Add Games** button that opens the add-game dialog with this season already selected.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Season Management](feature-2-season-management.md), [Feature 5 — Team Management](feature-5-team-management.md), [Feature 6 — Game Management](feature-6-game-management.md)

---

## User Stories

### US-7.1: Open a season from the list

**As a** signed-in admin user  
**I want** each season row to show a **view season** icon  
**So that** I can open one season without leaving the seasons catalog

**Priority:** P1  
**Independent test:** From the seasons list, click **Open season**; the season view appears  
**Acceptance scenarios:** see ### US-7.1 under Acceptance Criteria

### US-7.2: View season info and games

**As a** signed-in admin user  
**I want** a season view with a heading for season info and a list of that season's games  
**So that** I can see the schedule for one season

**Priority:** P1  
**Independent test:** Open a season that has games; heading shows season info and the games list shows those games  
**Acceptance scenarios:** see ### US-7.2 under Acceptance Criteria

### US-7.3: Add a game defaulted to this season

**As a** signed-in admin user  
**I want** an **Add Games** button on the season view that starts a new game for this season  
**So that** I do not have to pick the season again

**Priority:** P1  
**Independent test:** On the season view, click **Add Games**; the add-game dialog opens with this season selected  
**Acceptance scenarios:** see ### US-7.3 under Acceptance Criteria

### US-7.4: Restrict the season view to admins

**As the** application  
**I want** `/seasons/:seasonId` to follow the same admin-only UI rules as the seasons list  
**So that** students cannot open the season manager

**Priority:** P1  
**Independent test:** Unauthenticated navigation to `/seasons/1` redirects to `login`; students do not see **Seasons**  
**Acceptance scenarios:** see ### US-7.4 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: This feature MUST add a **season view** in `Season.vue` at route name `season`, path `/seasons/:seasonId`. The seasons list remains `SeasonList.vue` at `/seasons`.
- **FR-002**: The seasons list MUST keep Feature 2 create / edit / delete dialogs. Each season row MUST add an **Open season** icon action that navigates to `/seasons/:seasonId`. Season name MUST stay plain text (not a link).
- **FR-003**: The season view MUST have a **heading area** with season info: season **name**, **league** name, **start date**, and **end date**.
- **FR-004**: The season view MUST list **only games whose `seasonId` matches this season**. Columns: **date**, **start time**, **location**, **home team**, **visiting team**, **home score**, **visiting score**. Rows MUST stay ordered by `gameDate`, then `startTime` (Feature 6 FR-006).
- **FR-005**: The season view MUST show **Add Games** (`oc-cta`). That button MUST open the Feature 6 **Add Game** dialog with `seasonId` already set to this season.
- **FR-006**: Creating a game from the season view MUST use `POST /league/games` and Feature 6 field rules (required fields, location length, home ≠ visiting, both teams in the season's league, optional scores 0–999). After a successful create, the dialog MUST close and the new game MUST appear in this season's game list.
- **FR-007**: Empty games list copy MUST be **"No games yet. Add the first game."** Unknown `seasonId` MUST show **"Season with id=<id> not found."**
- **FR-008**: Unauthenticated navigation to `/seasons/:seasonId` MUST redirect to `login`. Students MUST NOT see **Seasons** in `MenuBar` (Feature 2). This feature MUST NOT add a second `MenuBar` item.
- **FR-009**: This feature MUST NOT add a `games` table, new game fields, or new game endpoints. Reuse Feature 6 `GET /league/games`, `POST /league/games`, `GET /league/seasons`, and `GET /league/teams`. Filter games on the client by `seasonId`.
- **FR-010**: Feature 6 **Games** catalog at `/games` MUST remain. Edit and delete of games stay on that catalog unless a later feature moves them.

---

## Assumptions

- Features 1–6 MUST be merged to `dev` before implementing this feature.
- A season view is the same idea as Feature 5's team view: list row opens a dedicated page; mutations stay in dialogs.
- Season info in the heading comes from the existing season object (including nested `league`).
- **Add Games** uses the existing `GameForm` fields. Season is pre-filled; the user still enters date, start time, location, home team, and visiting team.
- Teams shown in the add-game dialog still come from `GET /league/teams`. Feature 6 server rules still reject a team that is not in this season's league.
- No `GET /league/seasons/:seasonId` is required. The view MAY load `GET /league/seasons` and `GET /league/games` and select the matching rows (same pattern as `Team.vue`).
- Feature 2 list edit / delete stay on the seasons list. This feature does not move **Edit Season** onto the season view.

## Edge Cases

- Season with zero games → **"No games yet. Add the first game."**
- Unknown `seasonId` → **"Season with id=<id> not found."**
- **Add Games** with a missing required field → **"Required"**; no `POST`.
- **Add Games** with a location longer than 50 characters → **"Location must be 50 characters or fewer."**; no `POST`.
- Unauthenticated `/seasons/:seasonId` → redirect to `login`.
- Game created from this view for a different season (user changes the pre-filled season) → stored under that season; it MUST NOT stay on this season's list.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can open a season from the list and see season info plus that season's games.
- **SC-003**: **Add Games** on the season view opens the add-game dialog with this season selected and can create a game that appears on the list.
- **SC-004**: `npm test` passes for the season list icon and season view behavior.

---

## Data Ownership & Isolation

No new table. Seasons and games stay shared catalogs (Features 2 and 6). Only role `admin` sees the season list and season view.

| Rule               | Requirement                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| **Read scope**     | Season view shows one season and the games with that `seasonId`.                                    |
| **Write scope**    | Creating a game from this view uses Feature 6 admin `POST /league/games`.                           |
| **UI scope**       | `/seasons` and `/seasons/:seasonId` are admin-only.                                                 |
| **Implementation** | Reuse Feature 2 and Feature 6 services. Do not add ownership `userId`.                              |

---

## API Requirements

No new endpoints.

| Method | Endpoint          | Auth       | Purpose in this feature                                      |
| ------ | ----------------- | ---------- | ------------------------------------------------------------ |
| `GET`  | `/league/seasons` | Yes        | Load seasons; pick the row for `:seasonId`                   |
| `GET`  | `/league/games`   | Yes        | Load games; keep rows whose `seasonId` matches the season    |
| `GET`  | `/league/teams`   | Yes        | Populate home / visiting team selects on **Add Games**       |
| `POST` | `/league/games`   | Yes, admin | Create a game; body is Feature 6 create body with `seasonId` |

Request and error shapes stay as in [Feature 6](feature-6-game-management.md).

---

## Screen Requirements

### [View: Seasons] — route name `seasons` — path `/seasons` — `SeasonList.vue`

Feature 2 list, with this change:

- Season name stays plain text (not a link).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Open season** — season icon (`mdi-calendar`) navigates to the **Season** view (`/seasons/:seasonId`)
  - **Edit season** — Feature 2 edit dialog (unchanged)
  - **Delete season** — Feature 2 delete dialog (unchanged)

### [View: Season] — route name `season` — path `/seasons/:seasonId` — `Season.vue`

- **Heading area** shows season info: season **name**, **league** name, **start date**, and **end date**.
- Heading action: **Add Games** (`oc-cta`) opens the **Add Game** `<v-dialog>` with `seasonId` set to this season.
- **Add Game** fields and validation are Feature 6 (season, date, start time, location, home team, visiting team, optional scores). Season is pre-filled.
- **Add Game** actions: **Create** (`oc-cta`) / **Cancel** (secondary). After a successful create, the dialog closes and the games list refreshes.
- **Games list:** `v-table` (or `v-list`); columns **date**, **start time**, **location**, **home team**, **visiting team**, **home score**, **visiting score**. Do not repeat the season column. Rows ordered by date then start time.
- **Empty games:** **"No games yet. Add the first game."**
- **Loading state:** skeleton or progress indicator while season and games are fetching.
- **Error state:** `<v-alert type="error">` for API failures. Unknown `seasonId` shows **"Season with id=<id> not found."**
- Admin-only: `/seasons/:seasonId` is for signed-in admin users. Unauthenticated navigation redirects to `login`.
- Game add dialog lives in `Season.vue` (reuse `GameForm.vue`). No sidebar/main split.
- This view does not add **Edit Season**. Feature 2 edit stays on the seasons list.
- This view does not add edit / delete game row actions. Feature 6 `/games` remains the game catalog for those actions.

**App chrome**

- Use the Feature 1 `MenuBar`. Do **not** create a second `MenuBar`. Do **not** add another menu item.
- **Seasons** still goes to `/seasons`. Opening a season from that list shows this view.

---

## Key Entities

- **Season**: Feature 2 catalog row. This feature adds a view for one season.
- **Game**: Feature 6 catalog row that belongs to one season. A season may have many games.

---

## Data Model Requirements

No schema change. Existing Feature 2 `seasons` and Feature 6 `games` (`games.seasonId` → `seasons.id`) are enough.

---

## Acceptance Criteria (Gherkin)

### US-7.1 — Open a season from the list

#### Scenario: season rows show a view season action

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I view a season row
- **Then** the season row shows an **Open season** icon action

#### Scenario: User opens a season from the seasons list

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** a season `2026 Fall` exists
- **When** I click the **Open season** icon on the `2026 Fall` row
- **Then** the season view is displayed

---

### US-7.2 — View season info and games

#### Scenario: Season view shows season info

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the season view for `2026 Fall` in league `OKC Youth Soccer`
- **Then** the heading area shows season name `2026 Fall`
- **And** the heading area shows league `OKC Youth Soccer`
- **And** the heading area shows the season start date and end date
- **And** **Add Games** is shown

#### Scenario: Season view lists games for that season

- **Given** I am signed in as a user with role `admin`
- **And** a game at `Memorial Field` exists in season `2026 Fall`
- **And** I am viewing the season view for `2026 Fall`
- **When** I view the games list
- **Then** `Memorial Field` is displayed in the list

#### Scenario: Season view does not list games from another season

- **Given** I am signed in as a user with role `admin`
- **And** a game at `North Field` exists in a different season
- **And** I am viewing the season view for `2026 Fall`
- **When** I view the games list
- **Then** `North Field` is not displayed in the list

#### Scenario: User has no games in the season

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the season view for `2026 Fall`
- **And** that season has no games
- **When** I view the games list
- **Then** I see **"No games yet. Add the first game."**

---

### US-7.3 — Add a game defaulted to this season

#### Scenario: User selects to add a game from the season view

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the season view for `2026 Fall`
- **When** I click **Add Games**
- **Then** the add-game dialog is displayed
- **And** season `2026 Fall` is already selected

#### Scenario: User creates a game from the season view

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the season view for `2026 Fall`
- **And** teams `OKC Strikers` and `Tulsa FC` exist in that season's league
- **When** I click **Add Games**
- **And** I enter date `2026-09-12`, start time `18:00`, location `Memorial Field`, home team `OKC Strikers`, and visiting team `Tulsa FC`
- **And** I click **Create**
- **Then** the API is called with `seasonId` for `2026 Fall`
- **And** `Memorial Field` appears in the season games list
- **And** the add-game dialog closes

#### Scenario: User creates a game from the season view with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the season view for `2026 Fall`
- **When** I click **Add Games**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

---

### US-7.4 — Restrict the season view to admins

#### Scenario: Unauthenticated user navigates to a season

- **Given** I have no session in `localStorage`
- **When** I navigate to `/seasons/1`
- **Then** I am redirected to the login page

---

## Test Coverage Map

| Story  | Scenario                                                    | Test file                                       | Test name                                                    |
| ------ | ----------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| US-7.1 | season rows show a view season action                       | `frontend/tests/Seasons.test.js`                | `season rows show a view season action`                      |
| US-7.1 | User opens a season from the seasons list                   | `frontend/tests/Seasons.test.js`                | `User opens a season from the seasons list`                  |
| US-7.2 | Season view shows season info                               | `frontend/tests/Seasons.test.js`                | `Season view shows season info`                              |
| US-7.2 | Season view lists games for that season                     | `frontend/tests/Seasons.test.js`                | `Season view lists games for that season`                    |
| US-7.2 | Season view does not list games from another season         | `frontend/tests/Seasons.test.js`                | `Season view does not list games from another season`        |
| US-7.2 | User has no games in the season                             | `frontend/tests/Seasons.test.js`                | `User has no games in the season`                            |
| US-7.3 | User selects to add a game from the season view             | `frontend/tests/Seasons.test.js`                | `User selects to add a game from the season view`            |
| US-7.3 | User creates a game from the season view                    | `frontend/tests/Seasons.test.js`                | `User creates a game from the season view`                   |
| US-7.3 | User creates a game from the season view with a missing required field | `frontend/tests/Seasons.test.js`   | `User creates a game from the season view with a missing required field` |
| US-7.4 | Unauthenticated user navigates to a season                  | `frontend/tests/router.test.js`                 | `Unauthenticated user navigates to a season`                 |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 7 from @features/feature-7-season-view.md on branch `feature/7-season-view`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/behavior.md` (season view + **Add Games** default). No data-model or API change unless implementation adds a route.

---

## Definition of Done

- [ ] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [ ] **Success Criteria (SC-00N)** met
- [ ] All mapped tests pass (`npm test`)
- [ ] Test Coverage Map complete
- [ ] `features/reference/data-model.md` updated (if schema changed)
- [ ] `features/reference/api.md` updated (if API changed)
- [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- New game fields or game endpoints (Feature 6)
- Edit or delete games from the season view (Feature 6 `/games`)
- Moving **Edit Season** onto the season view
- Student-facing season or schedule UI
- Standings or filtering games by team
- Creating teams from the add-game dialog
- A second `MenuBar` item

---

## Delivered to later features

- The seasons list now opens `Season.vue`. A later feature MAY add **Edit Season** or game row actions on that view; it MUST NOT create a second seasons `MenuBar` item.
