# Feature: League Management

**Feature ID:** 3
**Branch pattern:** `feature/3-league-management`
**Status:** Ready
**Created:** 2026-02-01
**Input:** Signed-in admin users manage a shared league catalog on one screen; new leagues are added via a dialog. Leagues have a name and a sport. Leagues are not assigned to a user.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Season Management](feature-2-season-management.md)

---

## User Stories

### US-3.1: Select to work with Leagues

**As a** signed-in admin user  
**I want to** open the leagues view from the menu  
**So that** I can maintain the league catalog

**Priority:** P1  
**Independent test:** login, view Leagues on menubar; leagues view appears  
**Acceptance scenarios:** see ### US-3.1 under Acceptance Criteria

### US-3.2: Create league

**As a** signed-in admin user  
**I want to** create leagues (e.g. "OKC Youth Soccer", "Metro Baseball")  
**So that** I can track leagues and their sports

**Priority:** P1  
**Independent test:** Open add-league dialog, create a league with a name and sport; it appears in the leagues view  
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria

### US-3.3: View leagues

**As a** signed-in admin user  
**I want to** see all leagues on one screen  
**So that** I can see the league catalog

**Priority:** P1  
**Independent test:** Selecting Leagues loads a screen that displays all leagues  
**Acceptance scenarios:** see ### US-3.3 under Acceptance Criteria

### US-3.4: Manage league rows

**As a** signed-in admin user  
**I want** each league row to show **edit** and **delete** actions  
**So that** I can manage leagues without leaving the leagues view

**Priority:** P1  
**Independent test:** Each league row exposes edit and delete icon actions  
**Acceptance scenarios:** see ### US-3.4 under Acceptance Criteria

### US-3.5: Edit a league

**As a** signed-in admin user  
**I want to** edit league data  
**So that** I can keep the league data accurate

**Priority:** P2  
**Independent test:** Edit a league from row actions; league view updates  
**Acceptance scenarios:** see ### US-3.5 under Acceptance Criteria

### US-3.6: Delete a league

**As a** signed-in admin user  
**I want to** delete a league  
**So that** I can keep the league data accurate

**Priority:** P2  
**Independent test:** Delete a league from row actions; league view updates  
**Acceptance scenarios:** see ### US-3.6 under Acceptance Criteria

### US-3.7: Restrict league management to admins

**As the** application  
**I want to** allow only users with role `admin` to manage the league catalog  
**So that** students cannot create, edit, or delete leagues

**Priority:** P1  
**Independent test:** Sign in as a student — **Leagues** is hidden; `POST /courses/leagues` returns `403`  
**Acceptance scenarios:** see ### US-3.7 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: All league endpoints MUST require a valid session (`authenticate`). `GET` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` MUST require `req.user.role` equal to `admin`.
- **FR-002**: Leagues MUST be a **shared catalog**. The `leagues` table MUST NOT include `userId`. The API MUST ignore any client-supplied `userId`.
- **FR-003**: Authenticated non-admin users (including `student`) MUST receive `403` with `{ "message": "Admin role required." }` on `POST`, `PUT`, and `DELETE`. `GET` MUST return `200` for any authenticated user. They MUST NOT see **Leagues** in `MenuBar`.
- **FR-004**: Required league fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`).
- **FR-005**: Unauthenticated league API requests MUST return `401`. Unauthenticated navigation to `/leagues` MUST redirect to `login`.
- **FR-006**: Leagues MUST be ordered alphabetically by `name` in API responses.
- **FR-007**: This feature MUST deliver admin league CRUD and a **single-view** league UI in `Leagues.vue` (dialog-based add/edit/delete). No sidebar/main split.
- **FR-008**: `name` MUST be required, unique, trimmed, and at most 50 characters. Too-long message: **"League name must be 50 characters or fewer."** Duplicate message: **"League name is already taken."**
- **FR-009**: `sport` MUST be required and MUST be one of `soccer`, `baseball`, `volleyball`, `football`. The UI MUST present these as a single-select dropdown. Empty selection is invalid. Values outside that list are invalid. Invalid message: **"Sport must be soccer, baseball, volleyball, or football."**

---

## Assumptions

- Feature 1 auth/`MenuBar` and Feature 2 season management MUST be merged to `dev` before implementing this feature.
- A user with role `admin` exists (Feature 1 `role`; tests may seed an admin). Feature 1 default register role may be `worker`/`student` — not sufficient for this UI.
- Leagues are a shared catalog and are not assigned to users. **Depends on Feature 2** is for `MenuBar` (**Seasons** already present). This feature does **not** add an FK from `leagues` to `seasons`.
- `sport` is a **closed list** (`soccer`, `baseball`, `volleyball`, `football`), not free text. Multiple leagues MAY share the same sport.
- Student enrollment in leagues is a later feature. API `GET` of the league catalog is in this feature.
- Leagues use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/courses/…`. Use `/courses/leagues`.

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- `name` longer than 50 characters → **"League name must be 50 characters or fewer."**
- No sport selected → **"Required"**; no API call.
- `sport` not one of `soccer`, `baseball`, `volleyball`, `football` (e.g. `basketball`) → **"Sport must be soccer, baseball, volleyball, or football."**
- Duplicate `name` → `400` with `{ "message": "League name is already taken." }`
- Unknown `leagueId` on PUT/DELETE → `404` with `{ "message": "League with id=<id> not found." }`
- Authenticated `student` (or any non-admin) on `POST` / `PUT` / `DELETE` → `403`.
- Authenticated `student` on `GET` → `200` with the shared catalog.
- Unauthenticated user on `/leagues` or `GET /courses/leagues` → redirect or `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can create, view, edit, and delete the shared league catalog on one screen.
- **SC-003**: A signed-in student MAY `GET` the league catalog; they cannot open the leagues manager and cannot mutate leagues via the API.
- **SC-004**: `npm test` passes for league API and leagues view behavior.

---

## Data Ownership & Isolation

Leagues are a **shared catalog**. They are not owned by or assigned to a user. Only role `admin` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI (enrollment is a later feature).

| Rule               | Requirement                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Read scope**     | `GET /courses/leagues` returns **all** leagues to any authenticated user.                                                  |
| **Write scope**    | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `admin`.                                              |
| **Create scope**   | New leagues have no owner. Do not persist `userId`. Ignore `userId` if sent in the body.                                   |
| **Missing league** | Unknown `leagueId` → `404` with `{ "message": "League with id=<id> not found." }`. Never use ownership `404` to hide rows. |
| **Non-admin**      | Authenticated non-admin `GET` → `200`. `POST` / `PUT` / `DELETE` → `403` with `{ "message": "Admin role required." }`.     |
| **UI scope**       | **Leagues** menu and `/leagues` are admin-only. Students do not see this manager.                                          |
| **Implementation** | Use `authenticate` on all endpoints. Use `requireAdmin` after `authenticate` on `POST`, `PUT`, and `DELETE` only.          |

---

## API Requirements

| Method   | Endpoint                     | Auth       | Purpose                                 |
| -------- | ---------------------------- | ---------- | --------------------------------------- |
| `GET`    | `/courses/leagues`           | Yes        | Fetch all leagues in the shared catalog |
| `POST`   | `/courses/leagues`           | Yes, admin | Create a league in the shared catalog   |
| `PUT`    | `/courses/leagues/:leagueId` | Yes, admin | Update a league                         |
| `DELETE` | `/courses/leagues/:leagueId` | Yes, admin | Delete a league                         |

**Create league request body:**

```json
{
  "name": "OKC Youth Soccer",
  "sport": "soccer"
}
```

Do not send `id` or `userId` on create. If `userId` is present, ignore it. `GET /courses/leagues` returns an **array** of league objects in the success shape below.

**Update league request body:** same fields as create (no `id` / `userId`).

**League success response** (`200` / `201`):

```json
{
  "id": 1,
  "name": "OKC Youth Soccer",
  "sport": "soccer",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found:** `404` (do not use `403` for missing id).

---

## Screen Requirements

### [View: Leagues] — route name `leagues` — path `/leagues` — `Leagues.vue`

- Heading: **Leagues**
- Primary action: **+ New league** (`oc-cta`) opens the **Add League** `<v-dialog>`.
- **Add League** fields (same set on **Edit League**, edit pre-filled):
  - **League Name** (`v-text-field`)
  - **Sport** (`v-select`: `soccer`, `baseball`, `volleyball`, `football`)
- **Add League** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **league name** and **sport** only; rows ordered by name (FR-006). No Items/sections icon in this feature.
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Edit league** — opens **Edit League** `<v-dialog>` pre-filled with current data; **Save League** (`oc-cta`) / **Cancel** (secondary)
  - **Delete league** — opens **Delete League** confirmation `<v-dialog>` with copy **"Delete this league?"**; **Delete League** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state:** **"No leagues yet. Create your first league."** when the catalog has zero leagues.
- **Loading state:** skeleton or progress indicator while leagues are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Admin-only: **Leagues** menu item and `/leagues` are for signed-in admin users. Other roles do not see the **Leagues** item. Unauthenticated navigation to `/leagues` redirects to `login`.
- League CRUD dialogs live in `Leagues.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Leagues** (allowed role `admin`; navigates to `/leagues`) to `MenuBar`. Keep name, **Sign out**, and **Seasons** from Features 1–2.
- Students MUST NOT see **Leagues**.
- After login, the user remains on Feature 1 `home`. Selecting **Leagues** in the menu opens this feature's view.

---

## Key Entities

- **League**: shared catalog row (name, sport). Not owned by a user. Admins manage it in this feature; students view leagues when they enroll (later feature).

---

## Data Model Requirements

### `leagues` table

| Field       | Type       | Rules                                            |
| ----------- | ---------- | ------------------------------------------------ |
| `id`        | INTEGER PK | Auto-increment                                   |
| `name`      | STRING(50) | Required; unique; trimmed; at most 50 characters |
| `sport`     | STRING     | Required; one of `soccer`, `baseball`, `volleyball`, `football` |
| `createdAt` | DATE       | Sequelize timestamps                             |
| `updatedAt` | DATE       | Sequelize timestamps                             |

### Associations (in `models/index.js`)

None in this feature

---

## Acceptance Criteria (Gherkin)

### US-3.1 — Select to work with Leagues

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `admin`
- **When** I click **Leagues** in the `MenuBar`
- **Then** the leagues view is displayed

### US-3.2 — Create league

#### Scenario: User creates a new league

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **When** I click **+ New league**
- **And** I enter league name `OKC Youth Soccer` and select sport `soccer`
- **And** I click **Create**
- **Then** the API returns `201` with a league object containing `id`, `name` `OKC Youth Soccer`, and `sport` `soccer`
- **And** `OKC Youth Soccer` appears in the leagues view list
- **And** the add-league dialog closes

#### Scenario: User creates a league with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **When** I click **+ New league**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates a league with a name that is too long

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **When** I click **+ New league**
- **And** I enter a league name longer than 50 characters with a valid sport
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"League name must be 50 characters or fewer."**

#### Scenario: User creates a league with an invalid sport

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **When** I click **+ New league**
- **And** I enter league name `OKC Youth Soccer` and sport `basketball`
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Sport must be soccer, baseball, volleyball, or football."**

#### Scenario: User creates a league with a duplicate name

- **Given** I am signed in as a user with role `admin`
- **And** a league named `OKC Youth Soccer` already exists
- **And** I am viewing the leagues view
- **When** I click **+ New league**
- **And** I enter league name `OKC Youth Soccer` and select sport `soccer`
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "League name is already taken." }`
- **And** no second league named `OKC Youth Soccer` is stored

---

### US-3.3 — View leagues

#### Scenario: Leagues view loads with existing leagues

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **And** leagues exist
- **When** I view the leagues list
- **Then** all the leagues are displayed in the list

#### Scenario: User has no leagues

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **And** there are no leagues
- **When** I view the leagues list
- **Then** I see **"No leagues yet. Create your first league."**

---

### US-3.4 — Manage league rows

#### Scenario: league rows show edit and delete actions

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **When** I view a league row
- **Then** the league row shows an **Edit league** icon action
- **And** the league row shows a **Delete league** icon action

---

### US-3.5 — Edit a league

#### Scenario: User selects to edit a league

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **When** I click the edit icon on a league row
- **Then** the league edit dialog is displayed

#### Scenario: User edits a league with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **And** the league edit dialog is displayed
- **When** I update values in the fields with valid values
- **And** I click **Save League**
- **Then** the league data is updated
- **And** the dialog is closed

#### Scenario: User edits a league with invalid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **And** the league edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save League**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed

#### Scenario: User edits a league and cancels

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **And** the league edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the league data is not updated
- **And** the dialog is closed

---

### US-3.6 — Delete a league

#### Scenario: User selects to delete a league

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **When** I click the delete icon on a league row
- **Then** the league delete dialog is displayed

#### Scenario: User deletes a league

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **And** the league delete dialog is displayed
- **When** I click **Delete League**
- **Then** the league is deleted
- **And** the dialog is closed
- **And** the league is not in the leagues list

#### Scenario: User cancels deleting a league

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the leagues view
- **And** the league delete dialog is displayed
- **When** I click **Cancel**
- **Then** the league is not deleted
- **And** the dialog is closed
- **And** the league is still in the leagues list

---

### US-3.7 — Restrict league management to admins

#### Scenario: Student does not see Leagues in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Leagues** is not shown

#### Scenario: Student can list leagues via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /courses/leagues`
- **Then** the API returns `200` with an array of league objects

#### Scenario: Student cannot create a league via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /courses/leagues` with a valid league body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new league is stored

#### Scenario: Unauthenticated API request to leagues

- **Given** I have no valid session token
- **When** I request `GET /courses/leagues`
- **Then** the API returns `401` with an unauthorized message

#### Scenario: Unauthenticated user navigates to leagues

- **Given** I have no session in `localStorage`
- **When** I navigate to `/leagues`
- **Then** I am redirected to the login page

---

## Test Coverage Map

| Story  | Scenario                                              | Test file                                                          | Test name                                               |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| US-3.1 | Menu Selection                                        | `frontend/tests/MenuBar.test.js`, `frontend/tests/Leagues.test.js` | `Menu Selection`                                        |
| US-3.2 | User creates a new league                             | `backend/tests/leagues.test.js`, `frontend/tests/Leagues.test.js`  | `User creates a new league`                             |
| US-3.2 | User creates a league with a missing required field   | `frontend/tests/Leagues.test.js`                                   | `User creates a league with a missing required field`   |
| US-3.2 | User creates a league with a name that is too long    | `frontend/tests/Leagues.test.js`                                   | `User creates a league with a name that is too long`    |
| US-3.2 | User creates a league with an invalid sport           | `frontend/tests/Leagues.test.js`                                   | `User creates a league with an invalid sport`           |
| US-3.2 | User creates a league with a duplicate name           | `backend/tests/leagues.test.js`, `frontend/tests/Leagues.test.js`  | `User creates a league with a duplicate name`           |
| US-3.3 | Leagues view loads with existing leagues              | `backend/tests/leagues.test.js`, `frontend/tests/Leagues.test.js`  | `Leagues view loads with existing leagues`              |
| US-3.3 | User has no leagues                                   | `frontend/tests/Leagues.test.js`                                   | `User has no leagues`                                   |
| US-3.4 | league rows show edit and delete actions              | `frontend/tests/Leagues.test.js`                                   | `league rows show edit and delete actions`              |
| US-3.5 | User selects to edit a league                         | `frontend/tests/Leagues.test.js`                                   | `User selects to edit a league`                         |
| US-3.5 | User edits a league with valid values and saves       | `backend/tests/leagues.test.js`, `frontend/tests/Leagues.test.js`  | `User edits a league with valid values and saves`       |
| US-3.5 | User edits a league with invalid values and saves     | `frontend/tests/Leagues.test.js`                                   | `User edits a league with invalid values and saves`     |
| US-3.5 | User edits a league and cancels                       | `frontend/tests/Leagues.test.js`                                   | `User edits a league and cancels`                       |
| US-3.6 | User selects to delete a league                       | `frontend/tests/Leagues.test.js`                                   | `User selects to delete a league`                       |
| US-3.6 | User deletes a league                                 | `backend/tests/leagues.test.js`, `frontend/tests/Leagues.test.js`  | `User deletes a league`                                 |
| US-3.6 | User cancels deleting a league                        | `frontend/tests/Leagues.test.js`                                   | `User cancels deleting a league`                        |
| US-3.7 | Student does not see Leagues in the menu              | `frontend/tests/MenuBar.test.js`                                   | `Student does not see Leagues in the menu`              |
| US-3.7 | Student can list leagues via the API                  | `backend/tests/leagues.test.js`                                    | `Student can list leagues via the API`                  |
| US-3.7 | Student cannot create a league via the API            | `backend/tests/leagues.test.js`                                    | `Student cannot create a league via the API`            |
| US-3.7 | Unauthenticated API request to leagues                | `backend/tests/leagues.test.js`                                    | `Unauthenticated API request to leagues`                |
| US-3.7 | Unauthenticated user navigates to leagues             | `frontend/tests/router.test.js`                                    | `Unauthenticated user navigates to leagues`             |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 3 from @features/feature-3-league-management.md on branch `feature/3-league-management`.

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

- Student-facing league catalog UI (API `GET` is in this feature)
- Student enrollment in leagues (later feature)
- Assigning a league to a season or user ([Feature 5](feature-5-team-management.md) attaches teams to a league and forbids `DELETE` of a league that still has teams)
- Non-admin league management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Leagues** for role `admin`)
- Sports other than `soccer`, `baseball`, `volleyball`, and `football`

---

## Delivered to Feature 4

- `MenuBar` is Feature 1 chrome; Feature 2 added **Seasons** and this feature added **Leagues** for `admin`.
- [Feature 4](feature-4-people-management.md) adds **People** (allowed role `admin`) to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- The `leagues` table is a shared catalog with no `userId` and no FK to `seasons`. Later features that enroll people or attach teams MUST use this catalog, not a per-user league list.
- [Feature 5](feature-5-team-management.md) MUST reject `DELETE /courses/leagues/:leagueId` with `400` when teams still reference that league.

---
