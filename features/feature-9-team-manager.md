# Feature: Team Manager

**Feature ID:** 9
**Branch pattern:** `feature/9-team-manager`
**Status:** Ready
**Created:** 2026-09-22
**Input:** Assign a Feature 4 person as a team's manager. New users get role `manager`. When a user is added, they can be connected to the person who has the same email.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 4 — People Management](feature-4-people-management.md), [Feature 5 — Team Management](feature-5-team-management.md)

---

## User Stories

### US-9.1: Assign a team manager

**As a** signed-in admin user  
**I want to** assign a person as a team's manager when I add or edit the team  
**So that** each team can have a manager from the people catalog

**Priority:** P1  
**Independent test:** Create or edit a team and select a person as manager; the team stores that person and the team view shows their name  
**Acceptance scenarios:** see ### US-9.1 under Acceptance Criteria

### US-9.2: View the team manager

**As a** signed-in admin user  
**I want** the team view (and teams list) to show the manager  
**So that** I can see who manages the team without opening a separate screen

**Priority:** P1  
**Independent test:** Open a team that has a manager; the heading shows that person's name  
**Acceptance scenarios:** see ### US-9.2 under Acceptance Criteria

### US-9.3: Default new-user role is manager

**As the** application  
**I want** newly registered users to have role `manager`  
**So that** the default login role matches this product (not `student` or `worker`)

**Priority:** P1  
**Independent test:** Register a new account; the payload and stored user have `role` `manager`  
**Acceptance scenarios:** see ### US-9.3 under Acceptance Criteria

### US-9.4: Connect a new user to a person with the same email

**As the** application  
**I want** a new user to be linked to the unlinked person who has the same email  
**So that** a person and their login share one email

**Priority:** P1  
**Independent test:** Create a person with an email, register a user with that email; that person's `userId` is the new user  
**Acceptance scenarios:** see ### US-9.4 under Acceptance Criteria

### US-9.6: Manager sees only their teams

**As a** signed-in user with role `manager`  
**I want to** open **Teams** and see only the teams I manage (the person linked to my user)  
**So that** I cannot see other teams' rosters

**Priority:** P1  
**Independent test:** Sign in as a manager linked to a person who manages one team; **Teams** appears; the list has only that team  
**Acceptance scenarios:** see ### US-9.6 under Acceptance Criteria

### US-9.5: Block delete of a person who manages a team

**As the** application  
**I want** to refuse delete of a person who is still a team manager  
**So that** teams are not left pointing at a missing manager

**Priority:** P1  
**Independent test:** Assign a manager; `DELETE` of that person returns `400` and the person remains  
**Acceptance scenarios:** see ### US-9.5 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: A team MAY have one manager. `managerId` is optional. When omitted or `null`, the team has no manager. When present, it MUST be an integer that exists in `people`. Missing person message: **"Person not found."** (HTTP `400`).
- **FR-002**: A person MAY manage more than one team. A manager MAY also be a player on the same team or another team.
- **FR-003**: Add Team and Edit Team MUST include an optional **Manager** `v-select` of existing people (display last name, first name). Leaving it empty stores `managerId` `null`. Edit MUST allow clearing the manager.
- **FR-004**: The team view heading MUST show the manager's last name, first name when `managerId` is set, and no manager name when it is `null`. The teams list MUST include a **manager** column (name when set, empty when not).
- **FR-005**: Team create/update payloads MAY include `managerId`. Nested team responses MUST include `manager` `{ "id", "firstName", "lastName" }` when a manager is set, and `manager` `null` when not. Existing Feature 5 team fields are unchanged.
- **FR-006**: `DELETE` of a person MUST fail with `400` when any team references that person as manager. Message: **"Cannot delete person: team manager still exists."** Do **not** cascade-clear or delete teams. Feature 5's player-roster delete block still applies when the person is a player.
- **FR-007**: The default `users.role` for a new registration MUST be `manager`. This supersedes Feature 1 **FR-007** (`worker`) and the Feature 1 table default `student`. Existing rows and tests that set `admin` or `student` explicitly stay valid. Role `manager` is a **non-admin** role for Features 2–4 and 6–8 (no those menu items; mutations stay `admin`). **Teams** is shown to `admin` and `manager` (FR-012).
- **FR-008**: When a user is created (`POST /league/register`), if exactly one person has the same email (trimmed, case-insensitive) and that person has no `userId`, the application MUST set that person's `userId` to the new user. Registration still succeeds when no person matches. Registration MUST NOT create a person.
- **FR-009**: When a person already has a `userId`, registration with that email still creates the user and MUST NOT change the existing link.
- **FR-010**: Linking a user to a person (Feature 4 create/update `userId`, or FR-008 auto-link) MUST require the same email (trimmed, case-insensitive). Mismatch message: **"User email must match the person's email."** This supersedes Feature 4's assumption that a linked user's email MAY differ.
- **FR-011**: Team create/update/delete stay admin-only. `GET /league/teams` for `admin` and `student` still returns **all** teams (Feature 5). `GET /league/teams` for `manager` MUST return only teams whose `managerId` is the Feature 4 person linked to `req.user.id`. If the manager user has no linked person, or that person manages no teams, the API MUST return `200` with `[]`. `POST`, `PUT`, and `DELETE` on `/league/teams/:teamId/players` MUST allow `admin`, and MUST allow `manager` when that team is one they manage. A manager MUST receive `403` `{ "message": "Admin role required." }` when changing players on a team they do not manage.
- **FR-012**: `MenuBar` MUST show **Teams** when `user.role` is `admin` or `manager`. A manager MUST see only the teams from FR-011 on `/teams` and MAY open `/teams/:teamId` for those teams. A team they do not manage MUST appear as not found. Managers MUST NOT see **+ New team**, **Delete team**, or **Edit team**. Managers MUST see **Add Players**, **Edit player**, and **Remove player** on the team view for a team they manage. Empty manager list copy: **"No teams assigned."**

---

## Assumptions

- Features 1, 4, and 5 MUST be merged to `dev` before implementing this feature.
- Manager is a **person assignment** on a team, not a second login role for catalog admin.
- People still come from Feature 4. This feature does not add a people form on the team dialog.
- Email compare is trimmed and case-insensitive. Person email uniqueness is unchanged (Feature 4).
- Tests MAY keep using role `student` as a non-admin. New registrations MUST get `manager`.
- `managerId` uses `ON DELETE RESTRICT`.

## Edge Cases

- Team created with no manager → `managerId` `null`, `manager` `null`.
- Unknown `managerId` → `400` with `{ "message": "Person not found." }`; no team stored (create) or team unchanged (update).
- Clear manager on edit → `managerId` `null`.
- Same person as manager on two teams → allowed.
- Manager who is also a player on that team → allowed.
- Register with no matching person → user stored with role `manager`; no person created or updated.
- Register with one unlinked matching person → that person's `userId` becomes the new user.
- Register when the matching person is already linked → user stored; that person's `userId` is unchanged.
- Admin links a user whose email does not match the person → `400` with `{ "message": "User email must match the person's email." }`.
- `DELETE` person who is a manager → `400`; person and team remain.
- Authenticated `manager` (or `student`) on team `POST` / `PUT` / `DELETE` → `403`.
- Authenticated `manager` on `GET /league/teams` → `200` with only teams they manage.
- Manager user with no linked person → `GET /league/teams` is `[]`.
- Manager whose person manages no teams → `GET /league/teams` is `[]`.
- Manager opening `/teams/:teamId` for a team they do not manage → **"Team with id=<id> not found."**

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in admin can set, change, and clear a team's manager from the existing team dialogs.
- **SC-003**: A newly registered user has role `manager`.
- **SC-004**: Registering a user whose email matches an unlinked person links that person to the user.
- **SC-005**: An admin cannot delete a person who is still a team manager.
- **SC-006**: `npm test` passes for the mapped team, people, and auth scenarios.
- **SC-007**: A signed-in manager sees **Teams** and only the teams managed by their linked person.

---

## Data Ownership & Isolation

Teams remain a **shared catalog** (Feature 5). `managerId` is not ownership. Role `manager` does not grant catalog write.

| Rule            | Requirement                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **Read scope**  | `admin` and `student` `GET` all teams. `manager` `GET` only teams managed by their linked person.   |
| **Write scope** | Only `admin` may create, edit, or delete teams. Managers MAY add, edit, and remove players on teams they manage. |
| **Link scope**  | Auto-link on register writes `people.userId` for the matching unlinked person only.                 |
| **UI scope**    | **Teams** menu is `admin` and `manager`. Managers see their teams and can add, edit, and remove players. |

---

## API Requirements

No new endpoints. This feature changes Feature 1 register, Feature 4 person–user link, and Feature 5 team payloads.

**Create / update team request body** (Feature 5 fields plus optional manager):

```json
{
  "name": "OKC Strikers",
  "leagueId": 1,
  "homeField": "Memorial Field",
  "managerId": 1
}
```

`managerId` MAY be omitted or `null`.

**Team success response** — Feature 5 team object plus:

```json
{
  "managerId": 1,
  "manager": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Doe"
  }
}
```

When there is no manager: `"managerId": null`, `"manager": null`.

**Register success response** — same Feature 1 shape; `role` is `"manager"`. When FR-008 applies, the matching person's later `GET` shows the new `userId`.

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.

This feature also changes Feature 4 delete: `DELETE /league/people/:personId` MUST return `400` with the FR-006 message when a team still uses that person as manager.

---

## Screen Requirements

### [View: Teams] — `Teams.vue` (Feature 5)

- **Add Team** / **Edit Team** add **Manager** (`v-select` of people, display last name, first name). Optional.
- Teams list adds column **manager** (person last name, first name, or empty).

### [View: Team] — `Team.vue` (Feature 5)

- Heading area shows **manager** name when set (last name, first name).
- **Edit team** pre-fills **Manager** and can clear it.

No new route. No second `MenuBar` item.

---

## Key Entities

- **Team manager**: optional Feature 4 **Person** assigned to a **Team**. Not a separate table. Not a Feature 1 role on the team row.
- **User role `manager`**: default login role for new accounts. Non-admin.

---

## Data Model Requirements

### `teams` table (delta)

| Field       | Type       | Rules                                           |
| ----------- | ---------- | ----------------------------------------------- |
| `managerId` | INTEGER FK | Optional; references `people.id`                |

`managerId` uses `ON DELETE RESTRICT`. Not unique.

### `users` table (delta)

| Field  | Type       | Rules                    |
| ------ | ---------- | ------------------------ |
| `role` | STRING(20) | Default `manager`        |

### Associations (in `models/index.js`)

- `Team belongsTo Person` as `manager` (`managerId`, optional, `onDelete: 'RESTRICT'`)
- `Person hasMany Team` as managed teams (`foreignKey: 'managerId'`)

---

## Acceptance Criteria (Gherkin)

### US-9.1 — Assign a team manager

#### Scenario: User creates a team with a manager

- **Given** I am signed in as a user with role `admin`
- **And** a league `OKC Youth Soccer` exists
- **And** a person `Jane Doe` exists
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter team name `OKC Strikers`, home field `Memorial Field`, select league `OKC Youth Soccer`, and select manager `Doe, Jane`
- **And** I click **Create**
- **Then** the API returns `201` with a team object whose `managerId` is that person's id and nested `manager.lastName` `Doe`
- **And** `Doe` appears in the manager column for `OKC Strikers`
- **And** the add-team dialog closes

#### Scenario: User creates a team without a manager

- **Given** I am signed in as a user with role `admin`
- **And** a league `OKC Youth Soccer` exists
- **And** I am viewing the teams view
- **When** I click **+ New team**
- **And** I enter team name `OKC Strikers`, home field `Memorial Field`, and select league `OKC Youth Soccer`
- **And** I leave **Manager** empty
- **And** I click **Create**
- **Then** the API returns `201` with `managerId` `null` and `manager` `null`

#### Scenario: User creates a team with an unknown manager

- **Given** I am signed in as a user with role `admin`
- **When** I send `POST /league/teams` with a `managerId` that does not exist and otherwise valid data
- **Then** the API returns `400` with `{ "message": "Person not found." }`
- **And** no team is stored

#### Scenario: User edits a team manager and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the team view
- **And** the team edit dialog is displayed
- **When** I select a different person as **Manager**
- **And** I click **Save Team**
- **Then** the team `managerId` is updated
- **And** the heading area shows the new manager name
- **And** the dialog is closed

#### Scenario: User clears a team manager and saves

- **Given** I am signed in as a user with role `admin`
- **And** team `OKC Strikers` has a manager
- **And** I am viewing the team view
- **And** the team edit dialog is displayed
- **When** I clear **Manager**
- **And** I click **Save Team**
- **Then** the team `managerId` is `null`
- **And** the heading area does not show a manager name

---

### US-9.2 — View the team manager

#### Scenario: Team view shows the manager

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is the manager of team `OKC Strikers`
- **And** I am viewing the team view for `OKC Strikers`
- **Then** the heading area shows manager `Doe, Jane`

#### Scenario: Team view with no manager

- **Given** I am signed in as a user with role `admin`
- **And** team `OKC Strikers` has no manager
- **And** I am viewing the team view for `OKC Strikers`
- **Then** the heading area does not show a manager name

---

### US-9.3 — Default new-user role is manager

#### Scenario: User registers with role manager

- **Given** I am on the registration page
- **When** I enter valid first name, last name, email, username, password, and matching confirm password
- **And** I submit the form
- **Then** the API returns `201` with `role` `manager`
- **And** the stored user has `role` `manager`

#### Scenario: Manager sees Teams in the menu

- **Given** I am signed in as a user with role `manager`
- **When** I view the `MenuBar`
- **Then** **Teams** is shown

---

### US-9.4 — Connect a new user to a person with the same email

#### Scenario: User registers and links to a person with the same email

- **Given** a person `Jane Doe` exists with email `jane.doe@example.com` and no linked user
- **And** I am on the registration page
- **When** I register with email `jane.doe@example.com` and otherwise valid data
- **Then** the API returns `201` with a new `userId`
- **And** that person's `userId` is the new user

#### Scenario: User registers when no person has that email

- **Given** no person has email `new.user@example.com`
- **And** I am on the registration page
- **When** I register with email `new.user@example.com` and otherwise valid data
- **Then** the API returns `201`
- **And** no person is created

#### Scenario: User registers when the matching person is already linked

- **Given** a person with email `jane.doe@example.com` is already linked to a user
- **And** I am on the registration page
- **When** I register with email `jane.doe@example.com` and a different username and otherwise valid data
- **Then** the API returns `201`
- **And** that person's `userId` is unchanged

#### Scenario: User cannot link a person to a user with a different email

- **Given** I am signed in as a user with role `admin`
- **And** a person has email `jane.doe@example.com`
- **And** a Feature 1 user has email `other@example.com`
- **When** I send `POST /league/people` or `PUT /league/people/:personId` linking that user to that person
- **Then** the API returns `400` with `{ "message": "User email must match the person's email." }`
- **And** the person is not linked to that user

---

### US-9.5 — Block delete of a person who manages a team

#### Scenario: User cannot delete a person who is a team manager

- **Given** I am signed in as a user with role `admin`
- **And** `Jane Doe` is the manager of a team
- **When** I send `DELETE /league/people/:personId` for that person
- **Then** the API returns `400` with `{ "message": "Cannot delete person: team manager still exists." }`
- **And** the person is still stored
- **And** the team is still stored

---

### US-9.6 — Manager sees only their teams

#### Scenario: Manager can list only the teams they manage via the API

- **Given** I am signed in as a user with role `manager`
- **And** my user is linked to person `Jane Doe`
- **And** `Jane Doe` is the manager of team `OKC Strikers`
- **And** team `Tulsa FC` has a different manager or no manager
- **When** I request `GET /league/teams`
- **Then** the API returns `200` with an array that contains `OKC Strikers`
- **And** the array does not contain `Tulsa FC`

#### Scenario: Manager with no linked person sees no teams

- **Given** I am signed in as a user with role `manager`
- **And** my user is not linked to a person
- **When** I request `GET /league/teams`
- **Then** the API returns `200` with an empty array

#### Scenario: Manager list shows only assigned teams

- **Given** I am signed in as a user with role `manager`
- **And** I am viewing the teams view
- **And** the API returned only `OKC Strikers`
- **When** I view the teams list
- **Then** `OKC Strikers` is displayed
- **And** **+ New team** is not shown

#### Scenario: Manager with no assigned teams sees empty copy

- **Given** I am signed in as a user with role `manager`
- **And** I am viewing the teams view
- **And** there are no teams assigned to me
- **When** I view the teams list
- **Then** I see **"No teams assigned."**

#### Scenario: Manager sees Add Players on the team view

- **Given** I am signed in as a user with role `manager`
- **And** I am viewing the team view for a team I manage
- **Then** **Add Players** is shown
- **And** **Edit team** is not shown

#### Scenario: Manager sees edit and delete players on the roster

- **Given** I am signed in as a user with role `manager`
- **And** a player is on a team I manage
- **And** I am viewing that team view
- **Then** the player row shows an **Edit player** icon action
- **And** the player row shows a **Remove player** icon action

#### Scenario: Manager adds a player to a team they manage

- **Given** I am signed in as a user with role `manager`
- **And** my user is linked to the manager of team `OKC Strikers`
- **And** a person `Robert Smith` exists
- **When** I send `POST /league/teams/:teamId/players` for `OKC Strikers` with person `Robert Smith`, number `10`, and position `Forward`
- **Then** the API returns `201` with a player object for that person

#### Scenario: Manager edits a player on a team they manage

- **Given** I am signed in as a user with role `manager`
- **And** a player is on a team I manage
- **When** I send `PUT /league/teams/:teamId/players/:playerId` with valid number and position
- **Then** the API returns `200`
- **And** the player is updated

#### Scenario: Manager removes a player from a team they manage

- **Given** I am signed in as a user with role `manager`
- **And** a player is on a team I manage
- **When** I send `DELETE /league/teams/:teamId/players/:playerId`
- **Then** the API returns `200`
- **And** the player row is deleted

#### Scenario: Manager cannot add a player to a team they do not manage

- **Given** I am signed in as a user with role `manager`
- **And** team `Tulsa FC` is not managed by my linked person
- **When** I send `POST /league/teams/:teamId/players` for `Tulsa FC` with a valid player body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new player is stored

---

## Test Coverage Map

| Story  | Scenario                                                      | Test file                                                       | Test name                                                      |
| ------ | ------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- |
| US-9.1 | User creates a team with a manager                            | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`   | `User creates a team with a manager`                           |
| US-9.1 | User creates a team without a manager                         | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`   | `User creates a team without a manager`                        |
| US-9.1 | User creates a team with an unknown manager                   | `backend/tests/teams.test.js`                                   | `User creates a team with an unknown manager`                  |
| US-9.1 | User edits a team manager and saves                           | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`   | `User edits a team manager and saves`                          |
| US-9.1 | User clears a team manager and saves                          | `backend/tests/teams.test.js`, `frontend/tests/Teams.test.js`   | `User clears a team manager and saves`                         |
| US-9.2 | Team view shows the manager                                   | `frontend/tests/Teams.test.js`                                  | `Team view shows the manager`                                  |
| US-9.2 | Team view with no manager                                     | `frontend/tests/Teams.test.js`                                  | `Team view with no manager`                                    |
| US-9.3 | User registers with role manager                              | `backend/tests/auth.test.js`, `frontend/tests/Register.test.js` | `User registers with role manager`                             |
| US-9.3 | Manager sees Teams in the menu                                | `frontend/tests/MenuBar.test.js`                                | `Manager sees Teams in the menu`                               |
| US-9.4 | User registers and links to a person with the same email      | `backend/tests/auth.test.js`                                    | `User registers and links to a person with the same email`     |
| US-9.4 | User registers when no person has that email                  | `backend/tests/auth.test.js`                                    | `User registers when no person has that email`                 |
| US-9.4 | User registers when the matching person is already linked     | `backend/tests/auth.test.js`                                    | `User registers when the matching person is already linked`    |
| US-9.4 | User cannot link a person to a user with a different email    | `backend/tests/people.test.js`                                  | `User cannot link a person to a user with a different email`   |
| US-9.5 | User cannot delete a person who is a team manager             | `backend/tests/people.test.js`, `backend/tests/teams.test.js`  | `User cannot delete a person who is a team manager`            |
| US-9.6 | Manager can list only the teams they manage via the API       | `backend/tests/teams.test.js`                                   | `Manager can list only the teams they manage via the API`      |
| US-9.6 | Manager with no linked person sees no teams                   | `backend/tests/teams.test.js`                                   | `Manager with no linked person sees no teams`                  |
| US-9.6 | Manager list shows only assigned teams                        | `frontend/tests/Teams.test.js`                                  | `Manager list shows only assigned teams`                       |
| US-9.6 | Manager with no assigned teams sees empty copy                | `frontend/tests/Teams.test.js`                                  | `Manager with no assigned teams sees empty copy`               |
| US-9.6 | Manager sees Add Players on the team view                     | `frontend/tests/Teams.test.js`                                  | `Manager sees Add Players on the team view`                    |
| US-9.6 | Manager sees edit and delete players on the roster            | `frontend/tests/Teams.test.js`                                  | `Manager sees edit and delete players on the roster`           |
| US-9.6 | Manager edits a player on a team they manage                  | `backend/tests/teams.test.js`                                   | `Manager edits a player on a team they manage`                 |
| US-9.6 | Manager removes a player from a team they manage              | `backend/tests/teams.test.js`                                   | `Manager removes a player from a team they manage`             |
| US-9.6 | Manager adds a player to a team they manage                   | `backend/tests/teams.test.js`                                   | `Manager adds a player to a team they manage`                  |
| US-9.6 | Manager cannot add a player to a team they do not manage      | `backend/tests/teams.test.js`                                   | `Manager cannot add a player to a team they do not manage`     |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 9 from @features/feature-9-team-manager.md on branch `feature/9-team-manager`.

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

- Letting a manager create, edit, or delete teams
- Coaches, captains, or staff as extra team roles
- Creating a person during registration
- Changing admin catalog permissions (Features 2–8 stay `admin`)
- A second `MenuBar` item
- Requiring a manager on every team

---

## Delivered to later features

- Role `manager` can open **Teams** and see only teams managed by their linked person. A later feature MAY let them edit those teams.
- New users default to role `manager`. Later features MUST treat `manager` as non-admin except for this Teams read access.
