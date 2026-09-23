# Feature: Create Season Games

**Feature ID:** 8
**Branch pattern:** `feature/8-create-season-games`
**Status:** Ready
**Created:** 2026-09-22
**Input:** Signed-in admin users store schedule settings on a season (game days, regular game time, minimum days between a team's games, start date, and end date). On the season view, **Create Games** builds the season's games so every team in the season's league plays every other team once at home and once as visitor. Generated games start without a location (Feature 6: location is set on edit). Games land only on the season's game days, a team does not play again sooner than the minimum gap, and a team does not play the same opponent in two games in a row. If those rules cannot be met inside the season dates, show an error and create no games.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Season Management](feature-2-season-management.md), [Feature 5 — Team Management](feature-5-team-management.md), [Feature 6 — Game Management](feature-6-game-management.md), [Feature 7 — Season View](feature-7-season-view.md)

---

## User Stories

### US-8.1: Store schedule settings on a season

**As a** signed-in admin user  
**I want** a season to have game days, a regular game time, a minimum number of days between a team's games, and start and end dates  
**So that** the season has enough data to build a schedule

**Priority:** P1  
**Independent test:** Create or edit a season with those fields; they persist and appear on later GET  
**Acceptance scenarios:** see ### US-8.1 under Acceptance Criteria

### US-8.2: Create games from the season view

**As a** signed-in admin user  
**I want** a **Create Games** button on the season view  
**So that** I can generate the season schedule in one action

**Priority:** P1  
**Independent test:** Open a season that has at least three teams and valid schedule settings; **Create Games** creates the games and they appear on the season view  
**Acceptance scenarios:** see ### US-8.2 under Acceptance Criteria

### US-8.3: Double round-robin home and away

**As a** signed-in admin user  
**I want** each team to play every other team once at home and once as visitor  
**So that** the season is a full home-and-away schedule

**Priority:** P1  
**Independent test:** After **Create Games**, every ordered pair of distinct teams in the league has exactly one game  
**Acceptance scenarios:** see ### US-8.3 under Acceptance Criteria

### US-8.4: Honor days, gaps, and no back-to-back rematch

**As the** application  
**I want** generated games to use only the season's game days and regular time, to keep each team's games at least the minimum days apart, and to avoid a team playing the same opponent in two consecutive games  
**So that** the schedule is playable

**Priority:** P1  
**Independent test:** After **Create Games**, every game date is an allowed weekday; each team's consecutive games meet the gap; no team has the same opponent twice in a row  
**Acceptance scenarios:** see ### US-8.4 under Acceptance Criteria

### US-8.5: Refuse a schedule that does not fit

**As the** application  
**I want** to create no games and show an error when the season dates cannot hold a valid schedule  
**So that** a partial or illegal schedule is never stored

**Priority:** P1  
**Independent test:** Shorten the season so the games cannot fit; **Create Games** returns `400` and `GET` games for that season is still empty  
**Acceptance scenarios:** see ### US-8.5 under Acceptance Criteria

### US-8.6: Restrict create-games to admins

**As the** application  
**I want** only role `admin` to generate games  
**So that** students cannot build a schedule

**Priority:** P1  
**Independent test:** Student `POST` to create-games returns `403`; no games stored  
**Acceptance scenarios:** see ### US-8.6 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: A season MUST store schedule settings used to generate games:
  - `gameDays` — required non-empty list of weekdays from `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`
  - `gameTime` — required time; every generated game uses this as `startTime`
  - `minDaysBetweenGames` — required integer `0` through `99`; calendar days between a team's consecutive games MUST be greater than or equal to this value
  - `startDate` and `endDate` — already required (Feature 2); generated game dates MUST fall on or between them
- **FR-002**: `POST` and `PUT` `/league/seasons` MUST accept and persist the new fields with Feature 2 name, dates, and league rules. Empty `gameDays`, missing `gameTime`, or a `minDaysBetweenGames` that is not an integer `0`–`99` MUST return `400`. Invalid weekday message: **"Game days must be one or more of sunday, monday, tuesday, wednesday, thursday, friday, saturday."** Gap out of range: **"Minimum days between games must be between 0 and 99."**
- **FR-003**: The season view (`Season.vue`) MUST show **Create Games** (`oc-cta`) in the heading area (in addition to Feature 7 **Add Games**). Clicking it MUST call `POST /league/seasons/:seasonId/games` with no body. On success, the season games list MUST refresh. On error, show the API `message` in a `<v-alert type="error">`. Do not open a GameForm for this action.
- **FR-004**: `POST /league/seasons/:seasonId/games` MUST require `authenticate` then admin (`authenticateAdmin`). Unknown `seasonId` → `404` `{ "message": "Season with id=<id> not found." }`. Success → `201` and an array of the created Feature 6 game objects (with nested season and teams), ordered by `gameDate` then `startTime`.
- **FR-005**: Generated games MUST use only teams that belong to the season's league. For every pair of distinct teams `A` and `B` in that league there MUST be exactly one game with home `A` / visiting `B` and exactly one with home `B` / visiting `A`. Scores MUST be `null`. `seasonId` and `startTime` (`gameTime`) MUST match the season. `location` MUST be `null` (set later on Feature 6 **Edit Game**). Home and visiting MUST be different and in the season's league (Feature 6 FR-009).
- **FR-006**: Each generated `gameDate` MUST be on or between the season `startDate` and `endDate`, and that calendar day's weekday MUST be in `gameDays`.
- **FR-007**: For each team, order that team's games by `gameDate` then `startTime`. The number of calendar days between consecutive games for that team MUST be `>= minDaysBetweenGames`. A team MUST NOT play the same opponent in two consecutive games in that ordered list. Opponent means the other team in the game (home or visiting).
- **FR-008**: If no assignment of dates satisfies FR-005 through FR-007, the API MUST return `400` with `{ "message": "Season is not long enough to schedule all games." }` and MUST NOT create any games (all-or-nothing).
- **FR-009**: If the season's league has fewer than **3** teams, return `400` with `{ "message": "At least 3 teams are required to create a schedule." }` and create no games. Two teams cannot avoid a back-to-back rematch (FR-007).
- **FR-010**: If the season already has one or more games, return `400` with `{ "message": "Cannot create games: games already exist." }` and create no additional games. Admins MAY delete games (Feature 6) and try again.
- **FR-011**: Season add / edit dialogs (`SeasonForm`) MUST collect **Game Days** (multi-select of the seven weekdays), **Game Time**, and **Minimum days between games**, plus the existing Feature 2 fields. Client rules: required list / time / integer gap. Invalid submit MUST NOT call the API. Location belongs on each game (Feature 6), not on the season.
- **FR-012**: Feature 7 **Add Games** (single game) and Feature 6 `/games` stay. This feature only adds schedule fields and bulk create.

---

## Assumptions

- Features 1–7 MUST be merged to `dev` before implementing this feature.
- Teams on the schedule are all Feature 5 teams with `leagueId` equal to the season's `leagueId`. Seasons do not have their own roster.
- Location is a Feature 6 game field set on **Edit Game**. **Create Games** stores `null` location on each generated game.
- Calendar-day difference: game on `2026-09-12` and next game on `2026-09-19` is `7` days. Same calendar day is `0` days.
- More than one game MAY share a date when different teams are involved, as long as each team still meets FR-007.
- All generated games share the same `startTime`. Two games on the same date are still ordered by `startTime` then by id if needed for "in a row"; if they share the same time, order by `id` after create, or treat same-date same-time games for one team as `0` days apart (forbidden when `minDaysBetweenGames >= 1`).
- A valid schedule is any assignment that meets the FRs. Tests assert the constraints, not a specific date for each pairing.
- Feature 2 create/update tests MUST send the new required fields after this feature ships.
- Existing season rows without the new columns MAY be backfilled empty; create/update and **Create Games** still require valid values.

## Edge Cases

- Missing schedule field on season create/update → **"Required"** (client and/or `400`).
- Empty `gameDays` → **"Required"**.
- Weekday not in the closed list → **"Game days must be one or more of sunday, monday, tuesday, wednesday, thursday, friday, saturday."**
- `minDaysBetweenGames` not an integer 0–99 → **"Minimum days between games must be between 0 and 99."**
- Fewer than 3 teams in the season's league → `400` **"At least 3 teams are required to create a schedule."**
- Season already has games → `400` **"Cannot create games: games already exist."**
- No date assignment fits start/end, game days, gap, and no back-to-back rematch → `400` **"Season is not long enough to schedule all games."**; game count for that season stays `0`.
- Unknown `seasonId` on create-games → `404`.
- Authenticated `student` on `POST /league/seasons/:seasonId/games` → `403` `{ "message": "Admin role required." }`.
- Unauthenticated create-games → `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: An admin can save schedule settings on a season and generate a full home-and-away schedule from the season view.
- **SC-003**: Generated games obey game days, regular time, minimum gap, and no back-to-back rematch.
- **SC-004**: A season that cannot fit the schedule returns the quoted error and stores no games.
- **SC-005**: `npm test` passes for season field updates and create-games behavior.

---

## Data Ownership & Isolation

Seasons and games stay shared catalogs. Only `admin` may update schedule fields or generate games.

| Rule               | Requirement                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **Read scope**     | Existing `GET /league/seasons` and `GET /league/games` (any authenticated role).                     |
| **Write scope**    | Season create/update and `POST /league/seasons/:seasonId/games` require admin.                       |
| **Create scope**   | Generated games have no owner. Ignore client `userId`.                                               |
| **UI scope**       | **Create Games** lives on the admin season view only.                                                |

---

## API Requirements

| Method   | Endpoint                            | Auth       | Purpose                                      |
| -------- | ----------------------------------- | ---------- | -------------------------------------------- |
| `POST`   | `/league/seasons`                   | Yes, admin | Create a season including schedule settings  |
| `PUT`    | `/league/seasons/:seasonId`         | Yes, admin | Update a season including schedule settings  |
| `GET`    | `/league/seasons`                   | Yes        | List seasons including schedule settings     |
| `POST`   | `/league/seasons/:seasonId/games`   | Yes, admin | Generate the season's home-and-away games    |

**Season create / update body** (extends Feature 2):

```json
{
  "name": "2026 Fall",
  "startDate": "2026-08-15",
  "endDate": "2026-12-15",
  "leagueId": 1,
  "gameDays": ["saturday"],
  "gameTime": "18:00",
  "minDaysBetweenGames": 7
}
```

Do not send `id` on create. `gameDays` order does not matter; store unique weekdays.

**Create-games request:** no body. Season id is in the path.

**Create-games success (`201`):** array of Feature 6 game objects (nested `season`, `homeTeam`, `visitingTeam`), ordered by `gameDate` then `startTime`. Count MUST equal `n * (n - 1)` for `n` teams in the league.

**Error response:** `{ "message": "Human-readable explanation." }` with `400` / `401` / `403` / `404` as above.

---

## Screen Requirements

### [View: Seasons] — `SeasonList.vue` add / edit dialogs

Feature 2 / 7 list unchanged except **Add Season** / **Edit Season** use the extended `SeasonForm`:

- Existing: Season Name, League, Start Date, End Date
- **Game Days** — `v-select` multiple; items `sunday` … `saturday`
- **Game Time** — `v-text-field` type time
- **Minimum days between games** — `v-text-field` type number

### [View: Season] — `Season.vue`

Feature 7 heading and games list, plus:

- Heading action **Create Games** (`oc-cta`) next to **Add Games**
- **Create Games** calls `POST /league/seasons/:seasonId/games` (no GameForm)
- Success: list shows the new games
- Failure: `<v-alert type="error">` with the API message; games list unchanged
- **Add Games** (single game) remains Feature 7

**App chrome**

- No new `MenuBar` item.

---

## Key Entities

- **Season**: Feature 2 row plus schedule settings (`gameDays`, `gameTime`, `minDaysBetweenGames`). Start and end dates already exist. Location is not stored on the season.
- **Game**: Feature 6 row, including `location`. This feature inserts many games for one season; it does not change the game schema.

---

## Data Model Requirements

### `seasons` table (added columns)

| Field                  | Type        | Rules                                                                 |
| ---------------------- | ----------- | --------------------------------------------------------------------- |
| `gameDays`             | JSON        | Required; non-empty array of weekday strings from the closed list     |
| `gameTime`             | TIME        | Required                                                              |
| `minDaysBetweenGames`  | INTEGER     | Required; integer 0–99                                                |

`startDate` and `endDate` stay as in Feature 2. Do not store location on `seasons`.

No change to `games`. Generated rows are normal Feature 6 games (`ON DELETE RESTRICT` from season still applies).

---

## Acceptance Criteria (Gherkin)

### US-8.1 — Store schedule settings on a season

#### Scenario: User creates a season with schedule settings

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click **+ New season**
- **And** I enter season name `2026 Fall`, league `OKC Youth Soccer`, start date `2026-08-15`, end date `2026-12-15`, game days `saturday`, game time `18:00`, and minimum days between games `7`
- **And** I click **Create**
- **Then** the API returns `201` with those schedule fields stored on the season
- **And** `2026 Fall` appears in the seasons view list

#### Scenario: User creates a season with missing schedule settings

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click **+ New season**
- **And** I leave game days empty with otherwise valid season data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

---

### US-8.2 — Create games from the season view

#### Scenario: Season view shows Create Games

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the season view for `2026 Fall`
- **Then** **Create Games** is shown

#### Scenario: User creates games for a season

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` has start date `2026-08-15`, end date `2026-12-15`, game days `saturday`, game time `18:00`, and minimum days between games `7`
- **And** that season's league has teams `OKC Strikers`, `Tulsa FC`, and `Norman United`
- **And** I am viewing the season view for `2026 Fall`
- **And** that season has no games
- **When** I click **Create Games**
- **Then** the API returns `201` with `6` game objects
- **And** every created game has `startTime` for `18:00` and no location
- **And** the season games list shows `6` games

---

### US-8.3 — Double round-robin home and away

#### Scenario: User creates a home and away game for every pair of teams

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` has three teams `OKC Strikers`, `Tulsa FC`, and `Norman United` in its league
- **And** the season schedule settings allow a valid schedule
- **When** I send `POST /league/seasons/:seasonId/games`
- **Then** the API returns `201`
- **And** there is exactly one game for each ordered pair of those teams
- **And** no team is home against itself

---

### US-8.4 — Honor days, gaps, and no back-to-back rematch

#### Scenario: Created games use only the season game days and time

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` allows only `saturday` and game time `18:00`
- **When** I send `POST /league/seasons/:seasonId/games` and the call succeeds
- **Then** every created game date falls on a Saturday
- **And** every created game is on or between the season start and end dates
- **And** every created game uses start time `18:00`

#### Scenario: A team's games are not closer than the minimum days

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` has `minDaysBetweenGames` `7`
- **When** I send `POST /league/seasons/:seasonId/games` and the call succeeds
- **Then** for each team, consecutive games for that team are at least `7` calendar days apart

#### Scenario: A team does not play the same team twice in a row

- **Given** I am signed in as a user with role `admin`
- **And** I send `POST /league/seasons/:seasonId/games` and the call succeeds
- **Then** for each team, no two consecutive games (by date then start time) have the same opponent

---

### US-8.5 — Refuse a schedule that does not fit

#### Scenario: User cannot create games when the season is too short

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` has three teams in its league
- **And** the season start and end dates include only one allowed game day
- **And** `minDaysBetweenGames` is `7`
- **When** I send `POST /league/seasons/:seasonId/games`
- **Then** the API returns `400` with `{ "message": "Season is not long enough to schedule all games." }`
- **And** no game is stored for that season

#### Scenario: User cannot create games when games already exist

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` already has a game
- **When** I send `POST /league/seasons/:seasonId/games`
- **Then** the API returns `400` with `{ "message": "Cannot create games: games already exist." }`
- **And** the existing game is still stored
- **And** no additional game is stored

#### Scenario: User cannot create games with fewer than three teams

- **Given** I am signed in as a user with role `admin`
- **And** season `2026 Fall` belongs to a league with only two teams
- **When** I send `POST /league/seasons/:seasonId/games`
- **Then** the API returns `400` with `{ "message": "At least 3 teams are required to create a schedule." }`
- **And** no game is stored

---

### US-8.6 — Restrict create-games to admins

#### Scenario: Student cannot create season games via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /league/seasons/:seasonId/games` for an existing season
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new game is stored

#### Scenario: Unauthenticated API request to create season games

- **Given** I have no valid session token
- **When** I request `POST /league/seasons/:seasonId/games`
- **Then** the API returns `401` with an unauthorized message

---

## Test Coverage Map

| Story  | Scenario                                                      | Test file                                                          | Test name                                                      |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| US-8.1 | User creates a season with schedule settings                  | `backend/tests/seasons.test.js`, `frontend/tests/Seasons.test.js`  | `User creates a season with schedule settings`                 |
| US-8.1 | User creates a season with missing schedule settings          | `frontend/tests/Seasons.test.js`                                   | `User creates a season with missing schedule settings`         |
| US-8.2 | Season view shows Create Games                                | `frontend/tests/Seasons.test.js`                                   | `Season view shows Create Games`                               |
| US-8.2 | User creates games for a season                               | `backend/tests/seasons.test.js`, `frontend/tests/Seasons.test.js`  | `User creates games for a season`                              |
| US-8.3 | User creates a home and away game for every pair of teams     | `backend/tests/seasons.test.js`                                    | `User creates a home and away game for every pair of teams`    |
| US-8.4 | Created games use only the season game days and time          | `backend/tests/seasons.test.js`                                    | `Created games use only the season game days and time`         |
| US-8.4 | A team's games are not closer than the minimum days           | `backend/tests/seasons.test.js`                                    | `A team's games are not closer than the minimum days`          |
| US-8.4 | A team does not play the same team twice in a row             | `backend/tests/seasons.test.js`                                    | `A team does not play the same team twice in a row`            |
| US-8.5 | User cannot create games when the season is too short         | `backend/tests/seasons.test.js`                                    | `User cannot create games when the season is too short`        |
| US-8.5 | User cannot create games when games already exist             | `backend/tests/seasons.test.js`                                    | `User cannot create games when games already exist`            |
| US-8.5 | User cannot create games with fewer than three teams          | `backend/tests/seasons.test.js`                                    | `User cannot create games with fewer than three teams`         |
| US-8.6 | Student cannot create season games via the API                | `backend/tests/seasons.test.js`                                    | `Student cannot create season games via the API`               |
| US-8.6 | Unauthenticated API request to create season games            | `backend/tests/seasons.test.js`                                    | `Unauthenticated API request to create season games`           |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 8 from @features/feature-8-create-season-games.md on branch `feature/8-create-season-games`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

- [x] Backend and frontend implemented per this spec (**FR-00N** satisfied)
- [x] **Success Criteria (SC-00N)** met
- [x] All mapped tests pass (`npm test`)
- [x] Test Coverage Map complete
- [x] `features/reference/data-model.md` updated (if schema changed)
- [x] `features/reference/api.md` updated (if API changed)
- [x] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

- Venues, travel, or bye-week UI beyond Feature 6 game `location` and the listed constraints
- Home/away balancing across weeks (only the pairing set and the listed constraints)
- Playoffs, standings, or reseeding
- Regenerating by deleting existing games automatically
- Student-facing schedule
- Changing Feature 6 single-game create/edit rules
- A second `MenuBar` item

---

## Delivered to later features

- Seasons now carry schedule settings. A later feature MAY edit those on the season view; create/update already persist them from the Feature 2 dialogs.
- `POST /league/seasons/:seasonId/games` is the only bulk generator. Feature 6 and Feature 7 single-game create remain.
