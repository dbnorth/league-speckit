# Feature: Team Management

**Feature ID:** 5
**Branch pattern:** `feature/5-team-management`
**Status:** Ready
**Created:** 2026-02-01
**Input:** Signed-in admin users manage teams on one screen. A team has a name, belongs to a league, and has players. A player is a Feature 4 person on that team with a position and number.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Season Management](feature-2-season-management.md), [Feature 3 — League Management](feature-3-league-management.md), [Feature 4 — People Management](feature-4-people-management.md)

---

## User Stories

### US-5.1: Select to work with Teams

**As a** signed-in admin user  
**I want to** open the teams view from the menu  
**So that** I can maintain league teams

**Priority:** P1  
**Independent test:** login, view Teams on menubar; teams view appears  
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Create team

**As a** signed-in admin user  
**I want to** create a team with a name in a league  
**So that** the league has teams

**Priority:** P1  
**Independent test:** Open add-team dialog, create a team for an existing league; it appears in the teams view  
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: View teams

**As a** signed-in admin user  
**I want to** see all teams on one screen  
**So that** I can see each league's teams

**Priority:** P1  
**Independent test:** Selecting Teams loads a screen that displays all teams  
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Manage team rows

**As a** signed-in admin user  
**I want** each team row to show **edit** and **delete** actions  
**So that** I can manage teams without leaving the teams view

**Priority:** P1  
**Independent test:** Each team row exposes edit and delete icon actions  
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

### US-5.5: Edit a team

**As a** signed-in admin user  
**I want to** edit a team's name or league  
**So that** I can keep team data accurate

**Priority:** P2  
**Independent test:** Edit a team from row actions; teams view updates  
**Acceptance scenarios:** see ### US-5.5 under Acceptance Criteria

### US-5.6: Delete a team

**As a** signed-in admin user  
**I want to** delete a team  
**So that** I can remove teams that no longer belong in a league

**Priority:** P2  
**Independent test:** Delete a team from row actions; teams view updates  
**Acceptance scenarios:** see ### US-5.6 under Acceptance Criteria

### US-5.7: Restrict team management to admins

**As the** application  
**I want to** allow only users with role `admin` to manage teams and players  
**So that** students cannot create, edit, or delete teams or roster rows

**Priority:** P1  
**Independent test:** Sign in as a student — **Teams** is hidden; `POST /courses/teams` returns `403`  
**Acceptance scenarios:** see ### US-5.7 under Acceptance Criteria

### US-5.8: Manage team players

**As a** signed-in admin user  
**I want to** add, edit, and remove players on a team  
**So that** each player is a person with a position and number on that team

**Priority:** P1  
**Independent test:** On an existing team, add a person as a player with position and number; the player appears on the team  
**Acceptance scenarios:** see ### US-5.8 under Acceptance Criteria

### US-5.9: Block delete of referenced league or person

**As the** application  
**I want to** refuse delete of a league that still has teams, and of a person who is still a player  
**So that** teams and rosters are not left pointing at missing rows

**Priority:** P1  
**Independent test:** Create a team with a player; `DELETE` of that league or person returns `400` and the parent row remains  
**Acceptance scenarios:** see ### US-5.9 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: All team and player endpoints MUST require a valid session (`authenticate`). `GET` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` MUST require `req.user.role` equal to `admin`.
- **FR-002**: Teams and players MUST be a **shared catalog**. The `teams` and `players` tables MUST NOT use `userId` as ownership. The API MUST ignore any client-supplied ownership `userId`.
- **FR-003**: Authenticated non-admin users (including `student`) MUST receive `403` with `{ "message": "Admin role required." }` on `POST`, `PUT`, and `DELETE`. `GET` MUST return `200` for any authenticated user. They MUST NOT see **Teams** in `MenuBar`.
- **FR-004**: Required team and player fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`).
- **FR-005**: Unauthenticated team API requests MUST return `401`. Unauthenticated navigation to `/teams` MUST redirect to `login`.
- **FR-006**: Teams MUST be ordered by related league `name`, then team `name`, in API responses. Players on a team MUST be ordered by `number`.
- **FR-007**: This feature MUST deliver admin team CRUD, player (roster) CRUD, and a **single-view** team UI in `Teams.vue` (dialog-based add/edit/delete for teams and players). No sidebar/main split.
- **FR-008**: Team `name` MUST be required, trimmed, and at most 50 characters. Too-long message: **"Team name must be 50 characters or fewer."** The pair (`leagueId`, `name`) MUST be unique. Duplicate message: **"Team name is already taken in this league."**
- **FR-009**: `leagueId` MUST be a required integer that exists in `leagues`. Missing league message: **"League not found."** (HTTP `400`). A league MAY have many teams.
- **FR-010**: A player MUST belong to one team and one Feature 4 person. `teamId` comes from the route. `personId` MUST be a required integer that exists in `people`. Missing person message: **"Person not found."** (HTTP `400`). The pair (`teamId`, `personId`) MUST be unique. Duplicate-person message: **"Person is already on this team."** A person MAY be on more than one team.
- **FR-011**: Player `position` MUST be required, trimmed, and at most 30 characters. Too-long message: **"Position must be 30 characters or fewer."**
- **FR-012**: Player `number` MUST be a required integer from `0` through `99`. Invalid message: **"Player number must be between 0 and 99."** The pair (`teamId`, `number`) MUST be unique. Duplicate-number message: **"Player number is already taken on this team."**
- **FR-013**: `DELETE` of a league MUST fail with `400` when any team references that league. `DELETE` of a person MUST fail with `400` when any player references that person. Do **not** cascade-delete teams when a league is deleted, and do **not** delete people when a player or team is deleted. Messages: **"Cannot delete league: teams still exist."**, **"Cannot delete person: team roster still exists."** The parent row and its dependents MUST remain stored. `DELETE` of a team MUST remove that team's player rows and MUST NOT delete the people.

---

## Assumptions

- Features 1–4 (auth/`MenuBar`, seasons, leagues, people) MUST be merged to `dev` before implementing this feature.
- A user with role `admin` exists (Feature 1 `role`; tests may seed an admin).
- Tests MAY seed at least one league and one person (from Features 3–4) before creating a team or player.
- Teams belong to a **league**, not to a season and not to a signed-in user. No FK from `teams` to `seasons`.
- A team MAY be created with an empty roster. Players are added in this feature.
- A **player** is a roster row (person + position + number on a team), not a second copy of the person.
- `position` is free text (not a closed list). Sports differ by league.
- Add/Edit dialogs load leagues from `GET /courses/leagues` and people from `GET /courses/people`.
- Foreign keys from `teams.leagueId` and `players.personId` MUST use **RESTRICT**. Foreign key from `players.teamId` MUST use **CASCADE** so deleting a team removes roster rows only.
- This feature updates Feature 3–4 `DELETE` handlers for `/courses/leagues/:leagueId` and `/courses/people/:personId` to enforce FR-013.
- Teams use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/courses/…`. Use `/courses/teams`.

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- Team `name` longer than 50 characters → **"Team name must be 50 characters or fewer."**
- Duplicate team `name` in the same league → `400` with `{ "message": "Team name is already taken in this league." }`
- Same team name in a **different** league is allowed.
- Unknown `leagueId` → `400` with `{ "message": "League not found." }`
- Unknown `personId` → `400` with `{ "message": "Person not found." }`
- Person already on that team → `400` with `{ "message": "Person is already on this team." }`
- Same person on a **different** team is allowed.
- Player `number` outside 0–99 → **"Player number must be between 0 and 99."**
- Duplicate `number` on the same team → `400` with `{ "message": "Player number is already taken on this team." }`
- Same number on a **different** team is allowed.
- `position` longer than 30 characters → **"Position must be 30 characters or fewer."**
- Unknown `teamId` or `playerId` on PUT/DELETE → `404` with `{ "message": "Team with id=<id> not found." }` or `{ "message": "Player with id=<id> not found." }`
- `DELETE` league while teams still reference it → `400`; league and teams remain.
- `DELETE` person while a player still references them → `400`; person and player remain.
- `DELETE` team → team and its player rows are removed; people remain.
- Authenticated `student` (or any non-admin) on `POST` / `PUT` / `DELETE` → `403`.
- Authenticated `student` on `GET` → `200`.
- Unauthenticated user on `/teams` or `GET /courses/teams` → redirect or `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can create, view, edit, and delete teams on one screen.
- **SC-003**: A signed-in admin can add, edit, and remove players (person, position, number) on a team.
- **SC-004**: A signed-in student MAY `GET` teams and players; they cannot open the teams manager and cannot mutate teams or players via the API.
- **SC-005**: An admin cannot delete a league that still has teams, or a person who is still on a roster.
- **SC-006**: `npm test` passes for team and player API and teams view behavior.

---

## Data Ownership & Isolation

Teams and players are a **shared catalog**. They are not owned by the signed-in admin. Only role `admin` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI.

| Rule               | Requirement                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Read scope**     | `GET /courses/teams` returns **all** teams (with league and players) to any authenticated user.                          |
| **Write scope**    | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `admin`.                                            |
| **Create scope**   | New teams and players have no owner. Ignore ownership `userId` if sent in the body.                                      |
| **Missing team**   | Unknown `teamId` → `404` with `{ "message": "Team with id=<id> not found." }`. Never use ownership `404` to hide rows.   |
| **Missing player** | Unknown `playerId` → `404` with `{ "message": "Player with id=<id> not found." }`.                                        |
| **Non-admin**      | Authenticated non-admin `GET` → `200`. `POST` / `PUT` / `DELETE` → `403` with `{ "message": "Admin role required." }`.   |
| **UI scope**       | **Teams** menu and `/teams` are admin-only. Students do not see this manager.                                            |
| **Implementation** | Use `authenticate` on all endpoints. Use `requireAdmin` after `authenticate` on `POST`, `PUT`, and `DELETE` only.        |

---

## API Requirements

| Method   | Endpoint                                      | Auth       | Purpose                                      |
| -------- | --------------------------------------------- | ---------- | -------------------------------------------- |
| `GET`    | `/courses/teams`                              | Yes        | Fetch all teams with league and players      |
| `POST`   | `/courses/teams`                              | Yes, admin | Create a team in a league                    |
| `PUT`    | `/courses/teams/:teamId`                      | Yes, admin | Update a team's name or league               |
| `DELETE` | `/courses/teams/:teamId`                      | Yes, admin | Delete a team and its player rows            |
| `GET`    | `/courses/teams/:teamId/players`              | Yes        | Fetch players on one team                    |
| `POST`   | `/courses/teams/:teamId/players`              | Yes, admin | Add a player to a team                       |
| `PUT`    | `/courses/teams/:teamId/players/:playerId`    | Yes, admin | Update a player's position or number         |
| `DELETE` | `/courses/teams/:teamId/players/:playerId`    | Yes, admin | Remove a player from a team                  |

**Create team request body:**

```json
{
  "name": "OKC Strikers",
  "leagueId": 1
}
```

Do not send `id` on create. Players are **not** created in this body.

**Update team request body:** same fields as create (no `id`).

**Team success response** (`200` / `201`):

```json
{
  "id": 1,
  "name": "OKC Strikers",
  "leagueId": 1,
  "league": {
    "id": 1,
    "name": "OKC Youth Soccer",
    "sport": "soccer"
  },
  "players": [],
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /courses/teams` returns an **array** of team objects in this shape, including each team's `players` array.

**Create player request body:**

```json
{
  "personId": 1,
  "position": "Forward",
  "number": 10
}
```

**Update player request body:** `position` and `number` (and `personId` if changing the person). Do not send `teamId` in the body.

**Player success response** (`200` / `201`):

```json
{
  "id": 1,
  "teamId": 1,
  "personId": 1,
  "position": "Forward",
  "number": 10,
  "person": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Doe"
  },
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found:** `404` for unknown `teamId` / `playerId`.  
**Missing parent:** `400` (FR-009 / FR-010).

This feature also changes Feature 3–4 delete APIs (FR-013): `DELETE /courses/leagues/:leagueId` and `DELETE /courses/people/:personId` MUST return `400` with the quoted FR-013 message when teams or players still reference that row.

---

## Screen Requirements

### [View: Teams] — route name `teams` — path `/teams` — `Teams.vue`

- Heading: **Teams**
- Primary action: **+ New team** (`oc-cta`) opens the **Add Team** `<v-dialog>`.
- **Add Team** fields (same set on **Edit Team** for name and league, edit pre-filled):
  - **Team Name** (`v-text-field`)
  - **League** (`v-select` of existing leagues, display league `name`)
- **Add Team** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **team name**, **league**, and **players** (count); rows ordered by league name then team name (FR-006).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Edit team** — opens **Edit Team** `<v-dialog>` pre-filled with current name and league; **Save Team** (`oc-cta`) / **Cancel** (secondary)
  - **Delete team** — opens **Delete Team** confirmation `<v-dialog>` with copy **"Delete this team?"**; **Delete Team** (`oc-cta`) / **Cancel** (secondary)
- **Edit Team** also shows that team's **players** list (last name, first name, position, number) and **+ Add player** (`oc-cta`) which opens the **Add Player** `<v-dialog>`.
- **Add Player** fields (same set on **Edit Player**, edit pre-filled):
  - **Person** (`v-select` of existing people, display last name, first name)
  - **Position** (`v-text-field`)
  - **Number** (`v-text-field` type number)
- **Add Player** actions: **Add** (`oc-cta`) / **Cancel** (secondary).
- Each player row in **Edit Team** has icon-only **Edit player** and **Remove player** actions:
  - **Edit player** — opens **Edit Player** `<v-dialog>`; **Save Player** (`oc-cta`) / **Cancel** (secondary)
  - **Remove player** — opens confirmation **"Remove this player from the team?"**; **Remove Player** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request.
- **Empty state:** **"No teams yet. Create your first team."** when the catalog has zero teams.
- **Empty roster:** **"No players yet. Add the first player."** when the open team has zero players.
- **Loading state:** skeleton or progress indicator while teams are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Admin-only: **Teams** menu item and `/teams` are for signed-in admin users. Other roles do not see the **Teams** item. Unauthenticated navigation to `/teams` redirects to `login`.
- Team and player dialogs live in `Teams.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **Teams** (allowed role `admin`; navigates to `/teams`) to `MenuBar`. Keep name, **Sign out**, **Seasons**, **Leagues**, and **People** from Features 1–4.
- Students MUST NOT see **Teams**.
- After login, the user remains on Feature 1 `home`. Selecting **Teams** in the menu opens this feature's view.

---

## Key Entities

- **Team**: named roster that belongs to one **League**. Shared catalog row. Not owned by a user. A league may have many teams.
- **Player**: a **Person** on a **Team**, with a `position` and `number`. Not a second person record. Deleting a player or team does not delete the person.

---

## Data Model Requirements

### `teams` table

| Field       | Type       | Rules                                          |
| ----------- | ---------- | ---------------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                                 |
| `name`      | STRING(50) | Required; trimmed; at most 50 characters       |
| `leagueId`  | INTEGER FK | Required; references `leagues.id`              |
| `createdAt` | DATE       | Sequelize timestamps                           |
| `updatedAt` | DATE       | Sequelize timestamps                           |

Unique index on (`leagueId`, `name`).  
`leagueId` uses `ON DELETE RESTRICT`.

### `players` table

| Field       | Type       | Rules                                          |
| ----------- | ---------- | ---------------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                                 |
| `teamId`    | INTEGER FK | Required; references `teams.id`                |
| `personId`  | INTEGER FK | Required; references `people.id`               |
| `position`  | STRING(30) | Required; trimmed; at most 30 characters       |
| `number`    | INTEGER    | Required; integer 0–99                         |
| `createdAt` | DATE       | Sequelize timestamps                           |
| `updatedAt` | DATE       | Sequelize timestamps                           |

Unique index on (`teamId`, `personId`).  
Unique index on (`teamId`, `number`).  
`teamId` uses `ON DELETE CASCADE`.  
`personId` uses `ON DELETE RESTRICT`.

### Associations (in `models/index.js`)

- `Team belongsTo League` (`leagueId`, `onDelete: 'RESTRICT'`)
- `League hasMany Team`
- `Player belongsTo Team` (`teamId`, `onDelete: 'CASCADE'`)
- `Player belongsTo Person` (`personId`, `onDelete: 'RESTRICT'`)
- `Team hasMany Player`
- `Person hasMany Player`

---

## Acceptance Criteria (Gherkin)

### US-5.1 — Select to work with Teams

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `admin`
- **When** I click **Teams** in the `MenuBar`
- **Then** the teams view is displayed

### US-5.2 — Create team

#### Scenario: User creates a new team

- **Given** I am signed in as a user with role `admin`
- **And** a league `OKC Youth Soccer` exists
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter team name `OKC Strikers` and select league `OKC Youth Soccer`
- **And** I click **Create**
- **Then** the API returns `201` with a team object containing `id`, `name` `OKC Strikers`, and nested `league.name` `OKC Youth Soccer`
- **And** `OKC Strikers` appears in the teams view list
- **And** the add-team dialog closes

#### Scenario: User creates a team with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates a team with a name that is too long

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter a team name longer than 50 characters with a valid league
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Team name must be 50 characters or fewer."**

#### Scenario: User creates a team with an unknown league

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I send `POST /courses/teams` with a `leagueId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "League not found." }`
- **And** no team is stored

#### Scenario: User creates a team with a duplicate name in the same league

- **Given** I am signed in as a user with role `admin`
- **And** a team named `OKC Strikers` already exists in league `OKC Youth Soccer`
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter team name `OKC Strikers` and select league `OKC Youth Soccer`
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "Team name is already taken in this league." }`
- **And** no second team named `OKC Strikers` is stored in that league

---

### US-5.3 — View teams

#### Scenario: Teams view loads with existing teams

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** teams exist
- **When** I view the teams list
- **Then** all the teams are displayed in the list

#### Scenario: User has no teams

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** there are no teams
- **When** I view the teams list
- **Then** I see **"No teams yet. Create your first team."**

---

### US-5.4 — Manage team rows

#### Scenario: team rows show edit and delete actions

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I view a team row
- **Then** the team row shows an **Edit team** icon action
- **And** the team row shows a **Delete team** icon action

---

### US-5.5 — Edit a team

#### Scenario: User selects to edit a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I click the edit icon on a team row
- **Then** the team edit dialog is displayed

#### Scenario: User edits a team with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** the team edit dialog is displayed
- **When** I update values in the fields with valid values
- **And** I click **Save Team**
- **Then** the team data is updated
- **And** the dialog is closed

#### Scenario: User edits a team with invalid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** the team edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Team**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed

#### Scenario: User edits a team and cancels

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** the team edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the team data is not updated
- **And** the dialog is closed

---

### US-5.6 — Delete a team

#### Scenario: User selects to delete a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **When** I click the delete icon on a team row
- **Then** the team delete dialog is displayed

#### Scenario: User deletes a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** the team delete dialog is displayed
- **When** I click **Delete Team**
- **Then** the team is deleted
- **And** the dialog is closed
- **And** the team is not in the teams list

#### Scenario: User deletes a team that has players

- **Given** I am signed in as a user with role `admin`
- **And** a team `OKC Strikers` has a player
- **And** I am viewing the teams view
- **And** the team delete dialog is displayed
- **When** I click **Delete Team**
- **Then** the team is deleted
- **And** that team's player rows are deleted
- **And** the people who were players still exist

#### Scenario: User cancels deleting a team

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the teams view
- **And** the team delete dialog is displayed
- **When** I click **Cancel**
- **Then** the team is not deleted
- **And** the dialog is closed
- **And** the team is still in the teams list

---

### US-5.7 — Restrict team management to admins

#### Scenario: Student does not see Teams in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **Teams** is not shown

#### Scenario: Student can list teams via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /courses/teams`
- **Then** the API returns `200` with an array of team objects

#### Scenario: Student cannot create a team via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /courses/teams` with a valid team body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new team is stored

#### Scenario: Student cannot add a player via the API

- **Given** I am signed in as a user with role `student`
- **And** a team exists
- **When** I send `POST /courses/teams/:teamId/players` with a valid player body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new player is stored

#### Scenario: Unauthenticated API request to teams

- **Given** I have no valid session token
- **When** I request `GET /courses/teams`
- **Then** the API returns `401` with an unauthorized message

#### Scenario: Unauthenticated user navigates to teams

- **Given** I have no session in `localStorage`
- **When** I navigate to `/teams`
- **Then** I am redirected to the login page

---

### US-5.8 — Manage team players

#### Scenario: User adds a player to a team

- **Given** I am signed in as a user with role `admin`
- **And** a team `OKC Strikers` exists
- **And** a person `Jane Doe` exists
- **And** the team edit dialog is displayed
- **When** I click **+ Add player**
- **And** I select person `Doe, Jane`, enter position `Forward`, and number `10`
- **And** I click **Add**
- **Then** the API returns `201` with a player object containing `personId` for `Jane Doe`, `position` `Forward`, and `number` `10`
- **And** `Doe` appears in the team's players list
- **And** the add-player dialog closes

#### Scenario: User adds a player with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** the add-player dialog is displayed
- **When** I leave a required field empty
- **And** I click **Add**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User adds a player who is already on the team

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is already a player on team `OKC Strikers`
- **And** the add-player dialog is displayed
- **When** I select person `Doe, Jane` with otherwise valid data
- **And** I click **Add**
- **Then** the API returns `400` with `{ "message": "Person is already on this team." }`
- **And** no second player row for `Jane Doe` is stored on that team

#### Scenario: User adds a player with a number that is already taken on the team

- **Given** I am signed in as a user with role `admin`
- **And** team `OKC Strikers` already has a player with number `10`
- **And** the add-player dialog is displayed
- **When** I enter number `10` with otherwise valid data
- **And** I click **Add**
- **Then** the API returns `400` with `{ "message": "Player number is already taken on this team." }`
- **And** no second player with number `10` is stored on that team

#### Scenario: User adds a player with an unknown person

- **Given** I am signed in as a user with role `admin`
- **When** I send `POST /courses/teams/:teamId/players` with a `personId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Person not found." }`
- **And** no player is stored

#### Scenario: User edits a player with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** the player edit dialog is displayed
- **When** I update position and number with valid values
- **And** I click **Save Player**
- **Then** the player data is updated
- **And** the dialog is closed

#### Scenario: User removes a player from a team

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is a player on team `OKC Strikers`
- **And** the remove-player dialog is displayed
- **When** I click **Remove Player**
- **Then** the player row is deleted
- **And** `Jane Doe` is not in that team's players list
- **And** the person `Jane Doe` still exists

#### Scenario: Team with no players shows empty roster

- **Given** I am signed in as a user with role `admin`
- **And** team `OKC Strikers` has no players
- **And** the team edit dialog is displayed
- **When** I view the players list
- **Then** I see **"No players yet. Add the first player."**

---

### US-5.9 — Block delete of referenced league or person

#### Scenario: User cannot delete a league that has a team

- **Given** I am signed in as a user with role `admin`
- **And** a team exists in league `OKC Youth Soccer`
- **When** I send `DELETE /courses/leagues/:leagueId` for that league
- **Then** the API returns `400` with `{ "message": "Cannot delete league: teams still exist." }`
- **And** the league is still stored
- **And** the team is still stored

#### Scenario: User cannot delete a person who is a player

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is a player on a team
- **When** I send `DELETE /courses/people/:personId` for that person
- **Then** the API returns `400` with `{ "message": "Cannot delete person: team roster still exists." }`
- **And** the person is still stored
- **And** the player row is still stored

---

## Test Coverage Map

| Story  | Scenario                                                      | Test file                                                          | Test name                                                       |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| US-5.1 | Menu Selection                                                | `frontend/tests/MenuBar.test.js`, `frontend/tests/Teams.test.js`   | `Menu Selection`                                                |
| US-5.2 | User creates a new team                                       | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User creates a new team`                                       |
| US-5.2 | User creates a team with a missing required field             | `frontend/tests/Teams.test.js`                                     | `User creates a team with a missing required field`             |
| US-5.2 | User creates a team with a name that is too long              | `frontend/tests/Teams.test.js`                                     | `User creates a team with a name that is too long`              |
| US-5.2 | User creates a team with an unknown league                    | `backend/tests/teams.test.js`                                      | `User creates a team with an unknown league`                    |
| US-5.2 | User creates a team with a duplicate name in the same league  | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User creates a team with a duplicate name in the same league`  |
| US-5.3 | Teams view loads with existing teams                          | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `Teams view loads with existing teams`                          |
| US-5.3 | User has no teams                                             | `frontend/tests/Teams.test.js`                                     | `User has no teams`                                             |
| US-5.4 | team rows show edit and delete actions                        | `frontend/tests/Teams.test.js`                                     | `team rows show edit and delete actions`                        |
| US-5.5 | User selects to edit a team                                   | `frontend/tests/Teams.test.js`                                     | `User selects to edit a team`                                   |
| US-5.5 | User edits a team with valid values and saves                 | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User edits a team with valid values and saves`                 |
| US-5.5 | User edits a team with invalid values and saves               | `frontend/tests/Teams.test.js`                                     | `User edits a team with invalid values and saves`               |
| US-5.5 | User edits a team and cancels                                 | `frontend/tests/Teams.test.js`                                     | `User edits a team and cancels`                                 |
| US-5.6 | User selects to delete a team                                 | `frontend/tests/Teams.test.js`                                     | `User selects to delete a team`                                 |
| US-5.6 | User deletes a team                                           | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User deletes a team`                                           |
| US-5.6 | User deletes a team that has players                          | `backend/tests/teams.test.js`                                      | `User deletes a team that has players`                          |
| US-5.6 | User cancels deleting a team                                  | `frontend/tests/Teams.test.js`                                     | `User cancels deleting a team`                                  |
| US-5.7 | Student does not see Teams in the menu                        | `frontend/tests/MenuBar.test.js`                                   | `Student does not see Teams in the menu`                        |
| US-5.7 | Student can list teams via the API                            | `backend/tests/teams.test.js`                                      | `Student can list teams via the API`                            |
| US-5.7 | Student cannot create a team via the API                      | `backend/tests/teams.test.js`                                      | `Student cannot create a team via the API`                      |
| US-5.7 | Student cannot add a player via the API                       | `backend/tests/teams.test.js`                                      | `Student cannot add a player via the API`                       |
| US-5.7 | Unauthenticated API request to teams                          | `backend/tests/teams.test.js`                                      | `Unauthenticated API request to teams`                          |
| US-5.7 | Unauthenticated user navigates to teams                       | `frontend/tests/router.test.js`                                    | `Unauthenticated user navigates to teams`                       |
| US-5.8 | User adds a player to a team                                  | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User adds a player to a team`                                  |
| US-5.8 | User adds a player with a missing required field              | `frontend/tests/Teams.test.js`                                     | `User adds a player with a missing required field`              |
| US-5.8 | User adds a player who is already on the team                 | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User adds a player who is already on the team`                 |
| US-5.8 | User adds a player with a number that is already taken on the team | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js` | `User adds a player with a number that is already taken on the team` |
| US-5.8 | User adds a player with an unknown person                     | `backend/tests/teams.test.js`                                      | `User adds a player with an unknown person`                     |
| US-5.8 | User edits a player with valid values and saves               | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User edits a player with valid values and saves`               |
| US-5.8 | User removes a player from a team                             | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`      | `User removes a player from a team`                             |
| US-5.8 | Team with no players shows empty roster                       | `frontend/tests/Teams.test.js`                                     | `Team with no players shows empty roster`                       |
| US-5.9 | User cannot delete a league that has a team                   | `backend/tests/leagues.test.js`, `backend/tests/teams.test.js`     | `User cannot delete a league that has a team`                   |
| US-5.9 | User cannot delete a person who is a player                   | `backend/tests/people.test.js`, `backend/tests/teams.test.js`      | `User cannot delete a person who is a player`                   |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 5 from @features/feature-5-team-management.md on branch `feature/5-team-management`.

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

- Student-facing team or roster UI (API `GET` is in this feature)
- Assigning a team to a season
- Coaches, staff, or captains as separate roles
- A closed list of positions
- Creating people from the add-player dialog (people stay in [Feature 4](feature-4-people-management.md))
- Non-admin team management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **Teams** for role `admin`)

---

## Delivered to later features

- `MenuBar` is Feature 1 chrome; Features 2–4 added **Seasons**, **Leagues**, and **People**; this feature added **Teams** for `admin`.
- A later feature MUST add its nav item to this `MenuBar`; it MUST NOT create a second `MenuBar`.
- The `teams` table belongs to `leagues`. The `players` table attaches Feature 4 **people** to a team with position and number.

---
