# Behavior & Rules Reference

**Living snapshot** of product rules currently in force.

| Rule | Enforcement | Introduced |
| ---- | ----------- | ---------- |
| Seasons are a shared catalog (no owner `userId`) | Ignore client `userId`; table has no ownership column | Feature 2 |
| Any authenticated role may `GET` seasons | `authenticate` on `GET /courses/seasons` | Feature 2 |
| Only `admin` may create, update, or delete seasons | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 2 |
| Season name is required, unique, trimmed, max 30 characters | Client rules + API `400` | Feature 2 |
| End date must be after start date | Client rules + API `400` | Feature 2 |
| Seasons are ordered by start date | `order: [["startDate", "ASC"]]` | Feature 2 |
| **Seasons** menu and `/seasons` are admin-only in the UI | `MenuBar` shows **Seasons** when `user.role === "admin"` | Feature 2 |
| Unauthenticated `/seasons` redirects to login | Router `beforeEach` | Feature 2 |
| Leagues are a shared catalog (no owner `userId`) | Ignore client `userId`; table has no ownership column | Feature 3 |
| Any authenticated role may `GET` leagues | `authenticate` on `GET /courses/leagues` | Feature 3 |
| Only `admin` may create, update, or delete leagues | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 3 |
| League name is required, unique, trimmed, max 50 characters | Client rules + API `400` | Feature 3 |
| Sport must be `soccer`, `baseball`, `volleyball`, or `football` | Client `v-select` + API `400` | Feature 3 |
| Leagues are ordered by name | `order: [["name", "ASC"]]` | Feature 3 |
| **Leagues** menu and `/leagues` are admin-only in the UI | `MenuBar` shows **Leagues** when `user.role === "admin"` | Feature 3 |
| Unauthenticated `/leagues` redirects to login | Router `beforeEach` | Feature 3 |
| People are a shared catalog; optional `userId` is a login link, not ownership | Persist `userId` only as optional unique FK to `users.id` | Feature 4 |
| Any authenticated role may `GET` people | `authenticate` on `GET /courses/people` | Feature 4 |
| Only `admin` may create, update, or delete people | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 4 |
| Only `admin` may list users for the person link | `authenticateAdmin` on `GET /courses/users` | Feature 4 |
| Person names, email, birth date, and gender are validated | Client rules + API `400` | Feature 4 |
| Email is unique on `people`; a user links to at most one person | API `400` `"Email is already taken."` / `"User is already linked to a person."` | Feature 4 |
| Deleting a person does not delete the linked Feature 1 user | `destroy` person row only | Feature 4 |
| People are ordered by last name, then first name | `order: [["lastName", "ASC"], ["firstName", "ASC"]]` | Feature 4 |
| **People** menu and `/people` are admin-only in the UI | `MenuBar` shows **People** when `user.role === "admin"` | Feature 4 |
| Unauthenticated `/people` redirects to login | Router `beforeEach` | Feature 4 |
| Teams belong to a league; players attach a person with position and number | `teams.leagueId`, `players.teamId` / `personId` | Feature 5 |
| Any authenticated role may `GET` teams and players | `authenticate` on team and player `GET` | Feature 5 |
| Only `admin` may create, update, or delete teams and players | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 5 |
| Team name is unique per league | API `400` `"Team name is already taken in this league."` | Feature 5 |
| Player person and number are unique per team | API `400` `"Person is already on this team."` / `"Player number is already taken on this team."` | Feature 5 |
| Cannot delete a league that still has teams | API `400` `"Cannot delete league: teams still exist."` | Feature 5 |
| Cannot delete a person who is still a player | API `400` `"Cannot delete person: team roster still exists."` | Feature 5 |
| Deleting a team removes player rows only | Destroy players then team; people remain | Feature 5 |
| Teams are ordered by league name, then team name | Include `league` and order those columns | Feature 5 |
| **Teams** menu and `/teams` are admin-only in the UI | `MenuBar` shows **Teams** when `user.role === "admin"` | Feature 5 |
| Unauthenticated `/teams` redirects to login | Router `beforeEach` | Feature 5 |
