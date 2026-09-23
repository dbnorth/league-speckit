# Feature: People Management

**Feature ID:** 4
**Branch pattern:** `feature/4-people-management`
**Status:** Ready
**Created:** 2026-02-01
**Input:** Signed-in admin users manage a shared people catalog on one screen; new people are added via a dialog. A person has a first name, last name, email, birth date, and gender. A person may optionally be linked to one Feature 1 user account.
**Depends on:** [Feature 1 — User Authentication](feature-1-user-auth.md), [Feature 2 — Season Management](feature-2-season-management.md), [Feature 3 — League Management](feature-3-league-management.md)

---

## User Stories

### US-4.1: Select to work with People

**As a** signed-in admin user  
**I want to** open the people view from the menu  
**So that** I can maintain the people catalog

**Priority:** P1  
**Independent test:** login, view People on menubar; people view appears  
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Create person

**As a** signed-in admin user  
**I want to** create people (e.g. "Jane Doe", "Robert Smith")  
**So that** I can track people in the league

**Priority:** P1  
**Independent test:** Open add-person dialog, create a person with name, email, birth date, and gender; it appears in the people view  
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: View people

**As a** signed-in admin user  
**I want to** see all people on one screen  
**So that** I can see who is in the catalog

**Priority:** P1  
**Independent test:** Selecting People loads a screen that displays all people  
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Manage person rows

**As a** signed-in admin user  
**I want** each person row to show **edit** and **delete** actions  
**So that** I can manage people without leaving the people view

**Priority:** P1  
**Independent test:** Each person row exposes edit and delete icon actions  
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

### US-4.5: Edit a person

**As a** signed-in admin user  
**I want to** edit person data  
**So that** I can keep the person data accurate

**Priority:** P2  
**Independent test:** Edit a person from row actions; people view updates  
**Acceptance scenarios:** see ### US-4.5 under Acceptance Criteria

### US-4.6: Delete a person

**As a** signed-in admin user  
**I want to** delete a person  
**So that** I can remove people who no longer belong in the catalog

**Priority:** P2  
**Independent test:** Delete a person from row actions; people view updates  
**Acceptance scenarios:** see ### US-4.6 under Acceptance Criteria

### US-4.7: Restrict people management to admins

**As the** application  
**I want to** allow only users with role `admin` to manage the people catalog  
**So that** students cannot create, edit, or delete people

**Priority:** P1  
**Independent test:** Sign in as a student — **People** is hidden; `POST /league/people` returns `403`  
**Acceptance scenarios:** see ### US-4.7 under Acceptance Criteria

## Requirements

### Functional Requirements

- **FR-001**: All people endpoints MUST require a valid session (`authenticate`). `GET /league/people` MUST be allowed for any authenticated role. `POST`, `PUT`, and `DELETE` on people, and `GET /league/users`, MUST require `req.user.role` equal to `admin`.
- **FR-002**: People MUST be a **shared catalog**. A person is not owned by the signed-in admin. Optional `userId` is a **link** to a Feature 1 login account, not row ownership.
- **FR-003**: Authenticated non-admin users (including `student`) MUST receive `403` with `{ "message": "Admin role required." }` on `POST`, `PUT`, and `DELETE` of people and on `GET /league/users`. `GET /league/people` MUST return `200` for any authenticated user. They MUST NOT see **People** in `MenuBar`.
- **FR-004**: Required person fields MUST be present and trimmed; empty or whitespace-only values MUST be rejected (client block and/or `400`).
- **FR-005**: Unauthenticated people API requests MUST return `401`. Unauthenticated navigation to `/people` MUST redirect to `login`.
- **FR-006**: People MUST be ordered alphabetically by `lastName`, then `firstName`, in API responses.
- **FR-007**: This feature MUST deliver admin people CRUD and a **single-view** people UI in `People.vue` (dialog-based add/edit/delete). No sidebar/main split.
- **FR-008**: `firstName` MUST be required, trimmed, and at most 50 characters. Too-long message: **"First name must be 50 characters or fewer."**
- **FR-009**: `lastName` MUST be required, trimmed, and at most 50 characters. Too-long message: **"Last name must be 50 characters or fewer."**
- **FR-010**: `email` MUST be required, unique, trimmed, at most 100 characters, and a valid email address. Invalid format message: **"Email must be a valid email address."** Too-long message: **"Email must be 100 characters or fewer."** Duplicate message: **"Email is already taken."**
- **FR-011**: `birthDate` MUST be required and MUST be a date in the past. Future or same-as-today date message: **"Birth date must be in the past."**
- **FR-012**: `gender` MUST be required and MUST be one of `male`, `female`, `other`. The UI MUST present these as a single-select dropdown. Empty selection is invalid. Values outside that list are invalid. Invalid message: **"Gender must be male, female, or other."**
- **FR-013**: `userId` is **optional**. When omitted or `null`, the person has no login account. When present, it MUST be an integer that exists in `users`. Missing user message: **"User not found."** A given `users.id` MUST be linked to at most one person. Duplicate-link message: **"User is already linked to a person."** Creating or deleting a person MUST NOT create or delete a Feature 1 user.

---

## Assumptions

- Features 1–3 (auth/`MenuBar`, seasons, leagues) MUST be merged to `dev` before implementing this feature.
- A user with role `admin` exists (Feature 1 `role`; tests may seed an admin). Feature 1 default register role may be `worker`/`student` — not sufficient for this UI.
- People are a shared catalog. **Depends on Features 2–3** is for `MenuBar` (**Seasons** and **Leagues** already present). No FK from `people` to `seasons` or `leagues` in this feature.
- A person **may** have one Feature 1 user (`userId`). A person with no user is valid. Linking is optional on create and edit. This feature does **not** register login accounts.
- Person `email` uniqueness is only on `people`. A linked user's `users.email` MAY differ from the person's `email`.
- `gender` is a closed list (`male`, `female`, `other`), not free text.
- People use **dialog-based** workflows (no split sidebar / main panel).
- API mount for this resource is `/league/…`. Use `/league/people`.

## Edge Cases

- Empty or whitespace-only required field → client block; **"Required"**; no API call.
- `firstName` longer than 50 characters → **"First name must be 50 characters or fewer."**
- `lastName` longer than 50 characters → **"Last name must be 50 characters or fewer."**
- `email` longer than 100 characters → **"Email must be 100 characters or fewer."**
- Invalid `email` (e.g. `jane.doe`) → **"Email must be a valid email address."**
- Duplicate `email` → `400` with `{ "message": "Email is already taken." }`
- `birthDate` today or in the future → **"Birth date must be in the past."**
- No gender selected → **"Required"**; no API call.
- `gender` not one of `male`, `female`, `other` (e.g. `unknown`) → **"Gender must be male, female, or other."**
- `userId` omitted → person is stored with no linked user.
- Unknown `userId` → `400` with `{ "message": "User not found." }`
- `userId` already linked to another person → `400` with `{ "message": "User is already linked to a person." }`
- Unknown `personId` on PUT/DELETE → `404` with `{ "message": "Person with id=<id> not found." }`
- Delete person that has a linked user → person row is deleted; the Feature 1 user remains.
- Authenticated `student` (or any non-admin) on `POST` / `PUT` / `DELETE` or `GET /league/users` → `403`.
- Authenticated `student` on `GET /league/people` → `200` with the shared catalog.
- Unauthenticated user on `/people` or `GET /league/people` → redirect or `401`.

## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: A signed-in admin can create, view, edit, and delete the shared people catalog on one screen.
- **SC-003**: A signed-in student MAY `GET` the people catalog; they cannot open the people manager and cannot mutate people via the API.
- **SC-004**: A person MAY be created with or without a linked Feature 1 user; a user can be linked to at most one person.
- **SC-005**: `npm test` passes for people API and people view behavior.

---

## Data Ownership & Isolation

People are a **shared catalog**. They are not owned by the signed-in admin. Only role `admin` may manage them. Any authenticated user MAY `GET` the catalog. Role `student` does not see the manager UI. Optional `userId` links a person to a login account; it is not used as an ownership filter.

| Rule               | Requirement                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Read scope**     | `GET /league/people` returns **all** people to any authenticated user.                                                    |
| **Write scope**    | `POST`, `PUT`, and `DELETE` are allowed only when `req.user.role` is `admin`.                                              |
| **Create scope**   | New people have no owner. Optional `userId` links to `users.id` when provided.                                             |
| **Missing person** | Unknown `personId` → `404` with `{ "message": "Person with id=<id> not found." }`. Never use ownership `404` to hide rows. |
| **Non-admin**      | Authenticated non-admin `GET /league/people` → `200`. Mutations and `GET /league/users` → `403` with `{ "message": "Admin role required." }`. |
| **UI scope**       | **People** menu and `/people` are admin-only. Students do not see this manager.                                            |
| **Implementation** | Use `authenticate` on all endpoints. Use `requireAdmin` after `authenticate` on `POST`, `PUT`, `DELETE`, and `GET /league/users`. |

---

## API Requirements

| Method   | Endpoint                     | Auth       | Purpose                                      |
| -------- | ---------------------------- | ---------- | -------------------------------------------- |
| `GET`    | `/league/people`            | Yes        | Fetch all people in the shared catalog       |
| `POST`   | `/league/people`            | Yes, admin | Create a person in the shared catalog        |
| `PUT`    | `/league/people/:personId`  | Yes, admin | Update a person                              |
| `DELETE` | `/league/people/:personId`  | Yes, admin | Delete a person                              |
| `GET`    | `/league/users`             | Yes, admin | List users for the optional person–user link |

**Create person request body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "birthDate": "1990-05-15",
  "gender": "female",
  "userId": 2
}
```

`userId` MAY be omitted or `null` when the person has no login account. Do not send `id` on create.

**Update person request body:** same fields as create (no `id`). Sending `userId` `null` unlinks the user.

**Person success response** (`200` / `201`):

```json
{
  "id": 1,
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "birthDate": "1990-05-15",
  "gender": "female",
  "userId": 2,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

When the person has no linked user, `userId` is `null`.

`GET /league/people` returns an **array** of person objects in the success shape above.

**User list success response** (`200` on `GET /league/users`): an array of `{ "id", "username", "fName", "lName" }`. Do **not** include `password`.

**Error response:** `{ "message": "Human-readable explanation." }` with appropriate HTTP status.  
**Not found:** `404` (do not use `403` for missing person id).

---

## Screen Requirements

### [View: People] — route name `people` — path `/people` — `People.vue`

- Heading: **People**
- Primary action: **+ New person** (`oc-cta`) opens the **Add Person** `<v-dialog>`.
- **Add Person** fields (same set on **Edit Person**, edit pre-filled):
  - **First Name** (`v-text-field`)
  - **Last Name** (`v-text-field`)
  - **Email** (`v-text-field`)
  - **Birth Date** (`v-date-picker`)
  - **Gender** (`v-select`: `male`, `female`, `other`)
  - **User** (`v-select` of existing Feature 1 users from `GET /league/users`, display `username`; **optional** — may be left empty)
- **Add Person** actions: **Create** (`oc-cta`) / **Cancel** (secondary `variant="text"` or `outlined`).
- List: `v-table` (or `v-list`); columns **last name**, **first name**, **email**, **gender**, and **user** (username when linked, empty when not); rows ordered by last name then first name (FR-006).
- Icon-only row actions use `size="small"` and accessible `aria-label`s:
  - **Edit person** — opens **Edit Person** `<v-dialog>` pre-filled with current data; **Save Person** (`oc-cta`) / **Cancel** (secondary)
  - **Delete person** — opens **Delete Person** confirmation `<v-dialog>` with copy **"Delete this person?"**; **Delete Person** (`oc-cta`) / **Cancel** (secondary)
- Client-side validation: required fields use inline rules (`"Required"`); invalid submit does not send an API request. **User** is not required.
- **Empty state:** **"No people yet. Create your first person."** when the catalog has zero people.
- **Loading state:** skeleton or progress indicator while people are fetching.
- **Error state:** `<v-alert type="error">` for API failures.
- Admin-only: **People** menu item and `/people` are for signed-in admin users. Other roles do not see the **People** item. Unauthenticated navigation to `/people` redirects to `login`.
- People CRUD dialogs live in `People.vue` (or child presentational dialogs). No sidebar/main split.

**App chrome**

- Use the `MenuBar` introduced in [Feature 1](feature-1-user-auth.md). Do **not** create a second `MenuBar`. Do **not** hide it on `login` / `register`.
- Add **People** (allowed role `admin`; navigates to `/people`) to `MenuBar`. Keep name, **Sign out**, **Seasons**, and **Leagues** from Features 1–3.
- Students MUST NOT see **People**.
- After login, the user remains on Feature 1 `home`. Selecting **People** in the menu opens this feature's view.

---

## Key Entities

- **Person**: shared catalog row (first name, last name, email, birth date, gender). Not owned by an admin. May optionally link to one Feature 1 **User**. Admins manage the catalog in this feature.
- **User**: Feature 1 login account. Unchanged except that this feature may reference `users.id` from `people.userId`.

---

## Data Model Requirements

### `people` table

| Field       | Type       | Rules                                                                 |
| ----------- | ---------- | --------------------------------------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                                                        |
| `firstName` | STRING(50) | Required; trimmed; at most 50 characters                              |
| `lastName`  | STRING(50) | Required; trimmed; at most 50 characters                              |
| `email`     | STRING(100)| Required; unique; trimmed; at most 100 characters; valid email        |
| `birthDate` | DATE       | Required; must be in the past                                         |
| `gender`    | STRING     | Required; one of `male`, `female`, `other`                            |
| `userId`    | INTEGER FK | Optional; unique when present; references `users.id`                  |
| `createdAt` | DATE       | Sequelize timestamps                                                  |
| `updatedAt` | DATE       | Sequelize timestamps                                                  |

### Associations (in `models/index.js`)

- `Person belongsTo User` (`userId`, optional, `onDelete: 'SET NULL'`)
- `User hasOne Person`

---

## Acceptance Criteria (Gherkin)

### US-4.1 — Select to work with People

#### Scenario: Menu Selection

- **Given** I am signed in as a user with role `admin`
- **When** I click **People** in the `MenuBar`
- **Then** the people view is displayed

### US-4.2 — Create person

#### Scenario: User creates a new person without a linked user

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter first name `Jane`, last name `Doe`, email `jane.doe@example.com`, birth date `1990-05-15`, and select gender `female`
- **And** I leave **User** empty
- **And** I click **Create**
- **Then** the API returns `201` with a person object containing `id`, `firstName` `Jane`, `lastName` `Doe`, `email` `jane.doe@example.com`, `birthDate` `1990-05-15`, `gender` `female`, and `userId` `null`
- **And** `Doe` appears in the people view list
- **And** the add-person dialog closes

#### Scenario: User creates a new person with a linked user

- **Given** I am signed in as a user with role `admin`
- **And** a Feature 1 user with username `jdoe` exists
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter first name `Jane`, last name `Doe`, email `jane.doe@example.com`, birth date `1990-05-15`, and select gender `female`
- **And** I select user `jdoe`
- **And** I click **Create**
- **Then** the API returns `201` with a person object whose `userId` is that user's id
- **And** `jdoe` appears in the user column for `Doe`
- **And** the add-person dialog closes

#### Scenario: User creates a person with a missing required field

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I leave a required field empty
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Required"**

#### Scenario: User creates a person with a first name that is too long

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter a first name longer than 50 characters with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"First name must be 50 characters or fewer."**

#### Scenario: User creates a person with a last name that is too long

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter a last name longer than 50 characters with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Last name must be 50 characters or fewer."**

#### Scenario: User creates a person with an invalid email

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter email `jane.doe` with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Email must be a valid email address."**

#### Scenario: User creates a person with an email that is too long

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter an email longer than 100 characters with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Email must be 100 characters or fewer."**

#### Scenario: User creates a person with a duplicate email

- **Given** I am signed in as a user with role `admin`
- **And** a person with email `jane.doe@example.com` already exists
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter email `jane.doe@example.com` with otherwise valid data
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "Email is already taken." }`
- **And** no second person with email `jane.doe@example.com` is stored

#### Scenario: User creates a person with a birth date in the future

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter a birth date in the future with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Birth date must be in the past."**

#### Scenario: User creates a person with an invalid gender

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter gender `unknown` with otherwise valid data
- **And** I click **Create**
- **Then** no API call is made
- **And** I see the message **"Gender must be male, female, or other."**

#### Scenario: User creates a person with a user that is already linked

- **Given** I am signed in as a user with role `admin`
- **And** a Feature 1 user with username `jdoe` is already linked to a person
- **And** I am viewing the people view
- **When** I click **+ New person**
- **And** I enter otherwise valid person data
- **And** I select user `jdoe`
- **And** I click **Create**
- **Then** the API returns `400` with `{ "message": "User is already linked to a person." }`
- **And** no second person is linked to `jdoe`

---

### US-4.3 — View people

#### Scenario: People view loads with existing people

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **And** people exist
- **When** I view the people list
- **Then** all the people are displayed in the list

#### Scenario: User has no people

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **And** there are no people
- **When** I view the people list
- **Then** I see **"No people yet. Create your first person."**

---

### US-4.4 — Manage person rows

#### Scenario: person rows show edit and delete actions

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I view a person row
- **Then** the person row shows an **Edit person** icon action
- **And** the person row shows a **Delete person** icon action

---

### US-4.5 — Edit a person

#### Scenario: User selects to edit a person

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click the edit icon on a person row
- **Then** the person edit dialog is displayed

#### Scenario: User edits a person with valid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **And** the person edit dialog is displayed
- **When** I update values in the fields with valid values
- **And** I click **Save Person**
- **Then** the person data is updated
- **And** the dialog is closed

#### Scenario: User edits a person with invalid values and saves

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **And** the person edit dialog is displayed
- **When** I update values in the fields with invalid values
- **And** I click **Save Person**
- **Then** the appropriate error messages are shown
- **And** the dialog is not closed

#### Scenario: User edits a person and cancels

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **And** the person edit dialog is displayed
- **When** I update values in the fields
- **And** I click **Cancel**
- **Then** the person data is not updated
- **And** the dialog is closed

---

### US-4.6 — Delete a person

#### Scenario: User selects to delete a person

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **When** I click the delete icon on a person row
- **Then** the person delete dialog is displayed

#### Scenario: User deletes a person

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **And** the person delete dialog is displayed
- **When** I click **Delete Person**
- **Then** the person is deleted
- **And** the dialog is closed
- **And** the person is not in the people list

#### Scenario: User deletes a person who has a linked user

- **Given** I am signed in as a user with role `admin`
- **And** a person linked to user `jdoe` exists
- **And** I am viewing the people view
- **And** the person delete dialog is displayed
- **When** I click **Delete Person**
- **Then** the person is deleted
- **And** the Feature 1 user `jdoe` still exists

#### Scenario: User cancels deleting a person

- **Given** I am signed in as a user with role `admin`
- **And** I am viewing the people view
- **And** the person delete dialog is displayed
- **When** I click **Cancel**
- **Then** the person is not deleted
- **And** the dialog is closed
- **And** the person is still in the people list

---

### US-4.7 — Restrict people management to admins

#### Scenario: Student does not see People in the menu

- **Given** I am signed in as a user with role `student`
- **When** I view the `MenuBar`
- **Then** **People** is not shown

#### Scenario: Student can list people via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /league/people`
- **Then** the API returns `200` with an array of person objects

#### Scenario: Student cannot create a person via the API

- **Given** I am signed in as a user with role `student`
- **When** I send `POST /league/people` with a valid person body
- **Then** the API returns `403` with `{ "message": "Admin role required." }`
- **And** no new person is stored

#### Scenario: Student cannot list users via the API

- **Given** I am signed in as a user with role `student`
- **When** I request `GET /league/users`
- **Then** the API returns `403` with `{ "message": "Admin role required." }`

#### Scenario: Unauthenticated API request to people

- **Given** I have no valid session token
- **When** I request `GET /league/people`
- **Then** the API returns `401` with an unauthorized message

#### Scenario: Unauthenticated user navigates to people

- **Given** I have no session in `localStorage`
- **When** I navigate to `/people`
- **Then** I am redirected to the login page

---

## Test Coverage Map

| Story  | Scenario                                                    | Test file                                                        | Test name                                                     |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| US-4.1 | Menu Selection                                              | `frontend/tests/MenuBar.test.js`, `frontend/tests/People.test.js` | `Menu Selection`                                              |
| US-4.2 | User creates a new person without a linked user             | `backend/tests/people.test.js`, `frontend/tests/People.test.js`  | `User creates a new person without a linked user`             |
| US-4.2 | User creates a new person with a linked user                | `backend/tests/people.test.js`, `frontend/tests/People.test.js`  | `User creates a new person with a linked user`                |
| US-4.2 | User creates a person with a missing required field         | `frontend/tests/People.test.js`                                  | `User creates a person with a missing required field`         |
| US-4.2 | User creates a person with a first name that is too long    | `frontend/tests/People.test.js`                                  | `User creates a person with a first name that is too long`    |
| US-4.2 | User creates a person with a last name that is too long     | `frontend/tests/People.test.js`                                  | `User creates a person with a last name that is too long`     |
| US-4.2 | User creates a person with an invalid email                 | `frontend/tests/People.test.js`                                  | `User creates a person with an invalid email`                 |
| US-4.2 | User creates a person with an email that is too long        | `frontend/tests/People.test.js`                                  | `User creates a person with an email that is too long`        |
| US-4.2 | User creates a person with a duplicate email                | `backend/tests/people.test.js`, `frontend/tests/People.test.js`  | `User creates a person with a duplicate email`                |
| US-4.2 | User creates a person with a birth date in the future       | `frontend/tests/People.test.js`                                  | `User creates a person with a birth date in the future`       |
| US-4.2 | User creates a person with an invalid gender                | `frontend/tests/People.test.js`                                  | `User creates a person with an invalid gender`                |
| US-4.2 | User creates a person with a user that is already linked    | `backend/tests/people.test.js`, `frontend/tests/People.test.js`  | `User creates a person with a user that is already linked`    |
| US-4.3 | People view loads with existing people                      | `backend/tests/people.test.js`, `frontend/tests/People.test.js`  | `People view loads with existing people`                      |
| US-4.3 | User has no people                                          | `frontend/tests/People.test.js`                                  | `User has no people`                                          |
| US-4.4 | person rows show edit and delete actions                    | `frontend/tests/People.test.js`                                  | `person rows show edit and delete actions`                    |
| US-4.5 | User selects to edit a person                               | `frontend/tests/People.test.js`                                  | `User selects to edit a person`                               |
| US-4.5 | User edits a person with valid values and saves             | `backend/tests/people.test.js`, `frontend/tests/People.test.js`  | `User edits a person with valid values and saves`             |
| US-4.5 | User edits a person with invalid values and saves           | `frontend/tests/People.test.js`                                  | `User edits a person with invalid values and saves`           |
| US-4.5 | User edits a person and cancels                             | `frontend/tests/People.test.js`                                  | `User edits a person and cancels`                             |
| US-4.6 | User selects to delete a person                             | `frontend/tests/People.test.js`                                  | `User selects to delete a person`                             |
| US-4.6 | User deletes a person                                       | `backend/tests/people.test.js`, `frontend/tests/People.test.js`  | `User deletes a person`                                       |
| US-4.6 | User deletes a person who has a linked user                 | `backend/tests/people.test.js`                                   | `User deletes a person who has a linked user`                 |
| US-4.6 | User cancels deleting a person                              | `frontend/tests/People.test.js`                                  | `User cancels deleting a person`                              |
| US-4.7 | Student does not see People in the menu                     | `frontend/tests/MenuBar.test.js`                                 | `Student does not see People in the menu`                     |
| US-4.7 | Student can list people via the API                         | `backend/tests/people.test.js`                                   | `Student can list people via the API`                         |
| US-4.7 | Student cannot create a person via the API                  | `backend/tests/people.test.js`                                   | `Student cannot create a person via the API`                  |
| US-4.7 | Student cannot list users via the API                       | `backend/tests/people.test.js`                                   | `Student cannot list users via the API`                       |
| US-4.7 | Unauthenticated API request to people                       | `backend/tests/people.test.js`                                   | `Unauthenticated API request to people`                       |
| US-4.7 | Unauthenticated user navigates to people                    | `frontend/tests/router.test.js`                                  | `Unauthenticated user navigates to people`                    |

---

## Agent implementation request

Copy when asking Cursor to implement this feature (`@` this file):

```text
Implement Feature 4 from @features/feature-4-people-management.md on branch `feature/4-people-management`.

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

- Creating Feature 1 user accounts from the people form (register stays in Feature 1)
- A person having more than one user
- Assigning people to teams ([Feature 5](feature-5-team-management.md) adds a person to a team as a player with position and number)
- Student-facing people catalog UI (API `GET` is in this feature)
- Non-admin people management UI
- Creating `MenuBar` (introduced in [Feature 1](feature-1-user-auth.md); this feature only adds **People** for role `admin`)

---

## Delivered to Feature 5

- `MenuBar` is Feature 1 chrome; Features 2–3 added **Seasons** and **Leagues**; this feature added **People** for `admin`.
- Feature 5 adds **Teams** to this `MenuBar` and MUST use this people catalog for team players; it MUST NOT create a second `MenuBar` or a second people list.
- [Feature 5](feature-5-team-management.md) MUST reject `DELETE /league/people/:personId` with `400` when that person is still a player on a team.

---
