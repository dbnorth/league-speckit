# Feature: Season Management

**Feature ID:** 2
**Branch pattern:** `feature/2-season-management`
**Status:** Ready
**Created:** 2026-02-01
**Input:** Signed-in admin users manage a shared season catalog on one screen; new seasons are added via a dialog. Seasons have a name (30 characters), start date, end date, and one league. A league may have many seasons. Seasons are not assigned to a user.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 3 — League Management](feature-3-league-management.md)

---

## User Stories

### US-2.1: Select to work with Seasons

**As a** signed-in admin user  
**I want to** open the seasons view from the menu  
**So that** I can set season dates for the league

**Priority:** P1  
**Independent test:** login, view Seasons on menubar; seasons view appears
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: Create season

**As a** signed-in admin user  
**I want to** create seasons (e.g. "2026 Fall", "2026 Spring")  
**So that** I can track league seasons

**Priority:** P1  
**Independent test:** Open add-season dialog, create a season; it appears in the seasons view  
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: View seasons

**As a** signed-in admin user  
**I want to** see all seasons on one screen  
**So that** I can see the season catalog

**Priority:** P1  
**Independent test:** Selecting Seasons loads a screen that displays all seasons  
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: Manage season rows

**As a** signed-in admin user  
**I want** each season row to show **edit** and **delete** actions  
**So that** I can manage seasons without leaving the seasons view

**Priority:** P1  
**Independent test:** Each season row exposes edit and delete icon actions  
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

### US-2.5: Edit a season

**As a** signed-in admin user  
**I want to** edit season data  
**So that** I can keep the season data accurate

**Priority:** P2  
**Independent test:** Edit a season from row actions; season view updates  
**Acceptance scenarios:** see ### US-2.5 under Acceptance Criteria

### US-2.6: Delete a season

**As a** signed-in admin user  
**I want to** delete a season  
**So that** I can keep the season data accurate

**Priority:** P2  
**Independent test:** Delete a season from row actions; season view updates  
**Acceptance scenarios:** see ### US-2.6 under Acceptance Criteria

### US-2.7: Restrict season management to admins

**As the** application  
**I want to** allow only users with role `admin` to manage the season catalog  
**So that** students cannot create, edit, or delete seasons

**Priority:** P1  
**Independent test:** Sign in as a student — **Seasons** is hidden; `POST /league/seasons` returns `403`  
**Acceptance scenarios:** see ### US-2.7 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: All season endpoints MUST require a valid session (`authenticate`). `GET` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` MUST require `req.user.role` equal to `admin`.
- **FR-002**: Seasons MUST be a **shared catalog**. The `seasons` table MUST NOT include `userId`. The API MUST ignore any client-supplied `userId`.
- **FR-003**: Authenticated non-admin users (including `student`) MUST receive `403` with `{ "message": "Admin role required." }` on `POST`, `PUT`, and `DELETE`. `GET` MUST return `200` for any authenticated user. They MUST NOT see **Seasons** in `MenuBar`.
- **FR-004**: Required season fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`).
- **FR-005**: Unauthenticated season API requests MUST return `401`. Unauthenticated navigation to `/seasons` MUST redirect to `login`.
- **FR-006**: Seasons MUST be ordered by start date in API responses.
- **FR-007**: This feature MUST deliver admin season CRUD and a **single-view** season UI in `Seasons.vue` (dialog-based add/edit/delete). No sidebar/main split.
- **FR-008**: `name` MUST be required, trimmed, and at most 30 characters. Too-long message: **"Season name must be 30 characters or fewer."** The pair (`leagueId`, `name`) MUST be unique. Duplicate message: **"Season name is already taken in this league."**
- **FR-009**: `startDate` and `endDate` MUST be required. `endDate` MUST be after `startDate`. Date-order message: **"End date must be after start date."**
- **FR-010**: `leagueId` MUST be a required integer that exists in `leagues`. Missing league message: **"League not found."** (HTTP `400`). A league MAY have many seasons. Each season MUST belong to exactly one league.
- **FR-011**: `DELETE` of a league MUST fail with `400` when any season references that league. Message: **"Cannot delete league: seasons still exist."** Do **not** cascade-delete seasons when a league is deleted. The league and its seasons MUST remain stored.

---

## Assumptions

- Feature 1 auth and Feature 3 league catalog MUST be merged to `dev` before implementing this relationship.
- A user with role `admin` exists for this feature (Feature 1 `role`; tests may seed an admin).
- Tests MAY seed at least one league (from Feature 3) before creating a season.
- Seasons belong to a **league**, not to a signed-in user. Any authenticated user MAY `GET` the season catalog. The **Seasons** manager UI is admin-only. Student enrollment UI is a later feature.
- Seasons use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/league/…`. Use `/league/seasons`.

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- `name` longer than 30 characters → **"Season name must be 30 characters or fewer."**
- `endDate` before or equal to `startDate` → **"End date must be after start date."**
- Duplicate `name` in the same league → `400` with `{ "message": "Season name is already taken in this league." }`
- Unknown `leagueId` → `400` with `{ "message": "League not found." }`
- Unknown `seasonId` on PUT/DELETE → `404` (season does not exist — not a per-user hide).
- Authenticated `student` (or any non-admin) on `POST` / `PUT` / `DELETE` → `403`.
- Authenticated `student` on `GET` → `200` with the shared catalog.
- Unauthenticated user on `/seasons` or `GET /league/seasons` → redirect or `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can create, view, edit, and delete the shared season catalog on one screen.
- **SC-003**: A signed-in student MAY `GET` the season catalog; they cannot open the seasons manager and cannot mutate seasons via the API.
- **SC-004**: `npm test` passes for season API and seasons view behavior.

---

## Data Ownership & Isolation

Seasons are a **shared catalog**. They are not owned by or assigned to a user. Only role `admin` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI (enrollment is a later feature).

| Rule               | Requirement                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Read scope**     | `GET /league/seasons` returns **all** seasons to any authenticated user.                                                |
| **Write scope**    | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `admin`.                                            |
| **Create scope**   | New seasons have no owner. Do not persist `userId`. Ignore `userId` if sent in the body.                                 |
| **Missing season** | Unknown `seasonId` → `404` with `{ "message": "Season with id=<id> not found." }`. Never use ownership `404` to hide rows. |
| **Non-admin**      | Authenticated non-admin `GET` → `200`. `POST` / `PUT` / `DELETE` → `403` with `{ "message": "Admin role required." }`.   |
| **UI scope**       | **Seasons** menu and `/seasons` are admin-only. Students do not see this manager.                                        |
| **Implementation** | Use `authenticate` on all endpoints. Use `requireAdmin` after `authenticate` on `POST`, `PUT`, and `DELETE` only.        |

---

## API Requirements

| Method   | Endpoint                     | Auth       | Purpose                                 |
| -------- | ---------------------------- | ---------- | --------------------------------------- |
| `GET`    | `/league/seasons`           | Yes        | Fetch all seasons in the shared catalog |
| `POST`   | `/league/seasons`           | Yes, admin | Create a season in the shared catalog   |
| `PUT`    | `/league/seasons/:seasonId` | Yes, admin | Update a season                         |
| `DELETE` | `/league/seasons/:seasonId` | Yes, admin | Delete a season                         |

**Create season request body:**

```json
{
  "name": "2026 Fall",
  "startDate": "2026-08-15",
  "endDate": "2026-12-15",
  "leagueId": 1
}
```

Do not send `id` or `userId` on create. If `userId` is present, ignore it.

**Update season request body:** same fields as create (no `id` / `userId`).

**Season success response** (`200` / `201`):

```json
{
  "id": 1,
  "name": "2026 Fall",
  "startDate": "2026-08-15",
  "endDate": "2026-12-15",
  "leagueId": 1,
  "league": {
    "id": 1,
    "name": "OKC Youth Soccer",
    "sport": "soccer"
  },
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found / not owned:** `404` (do not use `403`).

---

## Screen Requirements

### [View: Seasons] — route name `seasons` — path `/seasons` — `Seasons.vue`

- Heading: **Seasons**
- Primary action: **+ New season** (`oc-cta`) opens the **Add Season** `<v-dialog>`.
- **Add Season** fields (same set on **Edit Season**, edit pre-filled):
  - **Season Name** (`v-text-field`)
  - **League** (`v-select` of existing Feature 3 leagues from `GET /league/leagues`)
  - **Start Date** (`v-date-picker`)
  - **End Date** (`v-date-picker`)
- **Add Season** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **season name**, **league**, **start date**, and **end date**; rows ordered by start date (FR-006). No Items/sections icon in this feature.
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Edit season** — opens **Edit Season** `<v-dialog>` pre-filled with current data; **Save Season** (`oc-cta`) / **Cancel** (secondary)
  - **Delete season** — opens **Delete Season** confirmation `<v-dialog>` with copy **"Delete this season?"**; **Delete Season** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state:** **"No seasons yet. Create your first season."** when the user has zero seasons.
- **Loading state:** skeleton or progress indicator while seasons are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Admin-only: **Seasons** menu item and `/seasons` are for signed-in admin users. Other roles do not see the **Seasons** item. Unauthenticated navigation to `/seasons` redirects to `login`.
- Season CRUD dialogs live in `Seasons.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Seasons** (allowed role `admin`; navigates to `/seasons`) to `MenuBar`. Keep name and **Sign out** from Feature 1.
- Students MUST NOT see **Seasons** (`user.role` is not `admin`).
- After login, the user remains on Feature 1 `home`. US-2.1 is selecting **Seasons** in the menu.
- **Leagues** is not on `MenuBar` yet — Feature 3 adds that item.

---

## Key Entities

- **Season**: shared catalog row (name, start date, end date) that belongs to one **League**. A league may have many seasons. Not owned by a user. Admins manage it in this feature; students view seasons when they enroll (later feature).

---

## Data Model Requirements

### `seasons` table

| Field       | Type       | Rules                                              |
| ----------- | ---------- | -------------------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                                     |
| `name`      | STRING(30) | Required; trimmed; at most 30 characters           |
| `startDate` | DATE       | Required                                           |
| `endDate`   | DATE       | Required; must be after `startDate`                |
| `leagueId`  | INTEGER FK | Required; references `leagues.id`                  |
| `createdAt` | DATE       | Sequelize timestamps                               |
| `updatedAt` | DATE       | Sequelize timestamps                               |

Unique index on (`leagueId`, `name`).  
`leagueId` uses `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Season belongsTo League` (`leagueId`, `onDelete: 'RESTRICT'`)
- `League hasMany Season`

---

## Acceptance Criteria (Gherkin)

### US-2.1 — Select to work with Seasons

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `admin`
- **When** I click **Seasons** in Menu Bar
- **Then** the seasons view is displayed

### US-2.2 — Create season

#### Scenario: User creates a new season

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click **+ New season**
- **And** I enter season name `2026 Fall`, start date `2026-08-15`, end date `2026-12-15`, and league `OKC Youth Soccer`
- **And** I click **Create**
- **Then** the API returns `201` with a season object containing `id`, `name` `2026 Fall`, `startDate`, `endDate`, and `leagueId`
- **And** `2026 Fall` appears in the seasons view list
- **And** the add-season dialog closes

#### Scenario: User creates a season with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click **+ New season**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates a season with a name that is too long

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click **+ New season**
- **And** I enter season name `2026 Fall Championship Season!!` with valid start and end dates
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Season name must be 30 characters or fewer."**

#### Scenario: User creates a season with end date before start date

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click **+ New season**
- **And** I enter season name `2026 Fall`, start date `2026-12-15`, and end date `2026-08-15`
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"End date must be after start date."**

#### Scenario: User creates a season with a duplicate name

- **Given** I am signed in as a user with role `admin`
- **And** a season named `2026 Fall` already exists in league `OKC Youth Soccer`
- **And** I am viewing the seasons view
- **When** I click **+ New season**
- **And** I enter season name `2026 Fall` with valid start and end dates and that league
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "Season name is already taken in this league." }`
- **And** no second season named `2026 Fall` is stored in that league

#### Scenario: User creates a season with an unknown league

- **Given** I am signed in as a user with role `admin`
- **When** I send `POST /league/seasons` with a `leagueId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "League not found." }`
- **And** no season is stored

---

### US-2.3 — View seasons

#### Scenario: Seasons view loads with existing seasons

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** seasons exist
- **When** I view the seasons list
- **Then** all the seasons are displayed in the list

#### Scenario: User has no seasons

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** there are no seasons
- **When** I view the seasons list
- **Then** I see **"No seasons yet. Create your first season."**

---

### US-2.4 — Manage season rows

#### Scenario: season rows show edit and delete actions

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I view a season row
- **Then** the season row shows an **Edit season** icon action
- **And** the season row shows a **Delete season** icon action

---

### US-2.5 — Edit a season

#### Scenario: User selects to edit a season

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click the edit icon on a season row
- **Then** the season edit dialog is displayed

#### Scenario: User edits a season with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** the season edit dialog is displayed
- **When** I update values in the fields with valid values
- **And** I click **Save Season**
- **Then** the season data is updated
- **And** the dialog is closed

#### Scenario: User edits a season with invalid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** the season edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Season**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed

#### Scenario: User edits a season and cancels

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** the season edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the season data is not updated
- **And** the dialog is closed

---

### US-2.6 — Delete a season

#### Scenario: User selects to delete a season

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **When** I click the delete icon on a season row
- **Then** the season delete dialog is displayed

#### Scenario: User deletes a season

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** the season delete dialog is displayed
- **When** I click **Delete Season**
- **Then** the season is deleted
- **And** the dialog is closed
- **And** the season list is displayed and the season is not in the list

#### Scenario: User cancels deleting a season

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the seasons view
- **And** the season delete dialog is displayed
- **When** I click **Cancel**
- **Then** the season is not deleted
- **And** the dialog is closed
- **And** the season list is displayed and the season is in the list

---

### US-2.7 — Restrict season management to admins

#### Scenario: Student does not see Seasons in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Seasons** is not shown

#### Scenario: Student can list seasons via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /league/seasons`
- **Then** the API returns `200` with an array of season objects

#### Scenario: Student cannot create a season via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /league/seasons` with a valid season body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new season is stored

#### Scenario: Unauthenticated API request to seasons

- **Given** I have no valid session token
- **When** I request `GET /league/seasons`
- **Then** the API returns `401` with an unauthorized message

#### Scenario: Unauthenticated user navigates to seasons

- **Given** I have no session in `localStorage`
- **When** I navigate to `/seasons`
- **Then** I am redirected to the login page

#### Scenario: User cannot delete a league that has a season

- **Given** I am signed in as a user with role `admin`
- **And** a season exists in league `OKC Youth Soccer`
- **When** I send `DELETE /league/leagues/:leagueId` for that league
- **Then** the API returns `400` with `{ "message": "Cannot delete league: seasons still exist." }`
- **And** the league is still stored
- **And** the season is still stored

---

## Test Coverage Map

| Story  | Scenario                                                | Test file                                                         | Test name                                                 |
| ------ | ------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| US-2.1 | Menu Selection                                          | `frontend/tests/MenuBar.test.js`, `frontend/tests/Seasons.test.js` | `Menu Selection`                                          |
| US-2.2 | User creates a new season                               | `backend/tests/seasons.test.js`, `frontend/tests/Seasons.test.js` | `User creates a new season`                               |
| US-2.2 | User creates a season with a missing required field     | `frontend/tests/Seasons.test.js`                                  | `User creates a season with a missing required field`     |
| US-2.2 | User creates a season with a name that is too long      | `frontend/tests/Seasons.test.js`                                  | `User creates a season with a name that is too long`      |
| US-2.2 | User creates a season with end date before start date   | `frontend/tests/Seasons.test.js`                                  | `User creates a season with end date before start date`   |
| US-2.2 | User creates a season with a duplicate name             | `backend/tests/seasons.test.js`, `frontend/tests/Seasons.test.js` | `User creates a season with a duplicate name`             |
| US-2.2 | User creates a season with an unknown league            | `backend/tests/seasons.test.js`                                   | `User creates a season with an unknown league`            |
| US-2.3 | Seasons view loads with existing seasons                | `backend/tests/seasons.test.js`, `frontend/tests/Seasons.test.js` | `Seasons view loads with existing seasons`                |
| US-2.3 | User has no seasons                                     | `frontend/tests/Seasons.test.js`                                  | `User has no seasons`                                     |
| US-2.4 | season rows show edit and delete actions                | `frontend/tests/Seasons.test.js`                                  | `season rows show edit and delete actions`                |
| US-2.5 | User selects to edit a season                           | `frontend/tests/Seasons.test.js`                                  | `User selects to edit a season`                           |
| US-2.5 | User edits a season with valid values and saves         | `backend/tests/seasons.test.js`, `frontend/tests/Seasons.test.js` | `User edits a season with valid values and saves`         |
| US-2.5 | User edits a season with invalid values and saves       | `frontend/tests/Seasons.test.js`                                  | `User edits a season with invalid values and saves`       |
| US-2.5 | User edits a season and cancels                         | `frontend/tests/Seasons.test.js`                                  | `User edits a season and cancels`                         |
| US-2.6 | User selects to delete a season                         | `frontend/tests/Seasons.test.js`                                  | `User selects to delete a season`                         |
| US-2.6 | User deletes a season                                   | `backend/tests/seasons.test.js`, `frontend/tests/Seasons.test.js` | `User deletes a season`                                   |
| US-2.6 | User cancels deleting a season                          | `frontend/tests/Seasons.test.js`                                  | `User cancels deleting a season`                          |
| US-2.7 | Student does not see Seasons in the menu                | `frontend/tests/MenuBar.test.js`                                  | `Student does not see Seasons in the menu`                |
| US-2.7 | Student can list seasons via the API                    | `backend/tests/seasons.test.js`                                   | `Student can list seasons via the API`                    |
| US-2.7 | Student cannot create a season via the API              | `backend/tests/seasons.test.js`                                   | `Student cannot create a season via the API`              |
| US-2.7 | Unauthenticated API request to seasons                  | `backend/tests/seasons.test.js`                                   | `Unauthenticated API request to seasons`                  |
| US-2.7 | Unauthenticated user navigates to seasons               | `frontend/tests/router.test.js`                                   | `Unauthenticated user navigates to seasons`               |
| US-2.7 | User cannot delete a league that has a season           | `backend/tests/seasons.test.js`, `backend/tests/leagues.test.js`  | `User cannot delete a league that has a season`           |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 2 from @features/feature-2-season-management.md on branch `feature/2-season-management`.

Follow layer order in @features/framework.md (models → routes → backend tests → frontend → frontend tests).
Map every Gherkin scenario in the Test Coverage Map; run `npm test` before finishing.
If API routes, payloads, schema, or product rules changed per this spec, update @features/reference/api.md, @features/reference/data-model.md, and/or @features/reference/behavior.md in the same PR to match shipped code.
Complete Definition of Done and the merge checklist in @features/framework.md.
Do not implement behavior not in this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

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

- Student-facing season catalog UI (API `GET` is in this feature)
- Student enrollment in seasons (later feature)
- Assigning a season to a team or user ([Feature 5](feature-5-team-management.md) attaches teams to a league, not to a season)
- Non-admin season management UI
- **Leagues** menu item and leagues view ([Feature 3](feature-3-league-management.md))
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Seasons** for role `admin`)

---

## Delivered to Feature 3

- `MenuBar` is Feature 1 chrome; Feature 2 added **Seasons** for `admin`.
- Feature 3 adds **Leagues** (allowed role `admin`) to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- [Feature 5](feature-5-team-management.md) adds **Teams** to this `MenuBar`. Teams belong to leagues, not to seasons.
- Feature 3 `DELETE /league/leagues/:leagueId` MUST reject `400` when seasons still reference that league.
- [Feature 6](feature-6-game-management.md) attaches games to a season. Feature 6 MUST reject `DELETE /league/seasons/:seasonId` with `400` when games still reference that season.
- [Feature 7](feature-7-season-view.md) adds a season view (`/seasons/:seasonId`) with season info, that season's games, and **Add Games** defaulted to the season.

---
