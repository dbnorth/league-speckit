# Behavior & Rules Reference

**Living snapshot** of product rules currently in force.

| Rule | Enforcement | Introduced |
| ---- | ----------- | ---------- |
| Seasons are a shared catalog (no owner `userId`) | Ignore client `userId`; table has no ownership column | Feature 2 |
| Any authenticated role may `GET` seasons | `authenticate` on `GET /league/seasons` | Feature 2 |
| Only `admin` may create, update, or delete seasons | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 2 |
| Season name is required, unique per league, trimmed, max 30 characters | Client rules + API `400` `"Season name is already taken in this league."` | Feature 2 |
| Seasons belong to one league; a league may have many seasons | `seasons.leagueId` required FK, `League hasMany Season` | Feature 2 |
| Cannot delete a league that still has seasons | API `400` `"Cannot delete league: seasons still exist."` | Feature 2 |
| End date must be after start date | Client rules + API `400` | Feature 2 |
| Seasons are ordered by start date | `order: [["startDate", "ASC"]]` | Feature 2 |
| **Seasons** menu and `/seasons` are admin-only in the UI | `MenuBar` shows **Seasons** when `user.role === "admin"` | Feature 2 |
| Unauthenticated `/seasons` redirects to login | Router `beforeEach` | Feature 2 |
| Leagues are a shared catalog (no owner `userId`) | Ignore client `userId`; table has no ownership column | Feature 3 |
| Any authenticated role may `GET` leagues | `authenticate` on `GET /league/leagues` | Feature 3 |
| Only `admin` may create, update, or delete leagues | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 3 |
| League name is required, unique, trimmed, max 50 characters | Client rules + API `400` | Feature 3 |
| Sport must be `soccer`, `baseball`, `volleyball`, or `football` | Client `v-select` + API `400` | Feature 3 |
| Leagues are ordered by name | `order: [["name", "ASC"]]` | Feature 3 |
| **Leagues** menu and `/leagues` are admin-only in the UI | `MenuBar` shows **Leagues** when `user.role === "admin"` | Feature 3 |
| Unauthenticated `/leagues` redirects to login | Router `beforeEach` | Feature 3 |
| People are a shared catalog; optional `userId` is a login link, not ownership | Persist `userId` only as optional unique FK to `users.id` | Feature 4 |
| Any authenticated role may `GET` people | `authenticate` on `GET /league/people` | Feature 4 |
| Only `admin` may create, update, or delete people | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 4 |
| Only `admin` may list users for the person link | `authenticateAdmin` on `GET /league/users` | Feature 4 |
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
| Team view shows team info, Edit team, Add Players, and a player list | `/teams/:teamId` heading + dialogs; players not in Edit Team | Feature 5 |
| Unauthenticated `/teams` or `/teams/:teamId` redirects to login | Router `beforeEach` | Feature 5 |
| Games are a shared catalog (no owner `userId`) | Ignore client `userId`; table has no ownership column | Feature 6 |
| Any authenticated role may `GET` games | `authenticate` on `GET /league/games` | Feature 6 |
| Only `admin` may create, update, or delete games | `authenticateAdmin` on `POST` / `PUT` / `DELETE` → `403` `{ "message": "Admin role required." }` | Feature 6 |
| Game requires season, date, start time, home team, and visiting team | Client rules + API `400` | Feature 6 |
| Game location on create comes from the home team's home field | `homeField` copied to `location` | Feature 5 / 6 |
| Game location can still be changed on Edit Game | Optional `location`; max 50 when present | Feature 6 |
| Home and visiting teams must be different and in the season's league | API `400` | Feature 6 |
| Scores are optional integers 0–999 | Client rules + API `400` `"Score must be between 0 and 999."` | Feature 6 |
| Cannot delete a season that still has games | API `400` `"Cannot delete season: games still exist."` | Feature 6 |
| Cannot delete a team that still has games | API `400` `"Cannot delete team: games still exist."` | Feature 6 |
| Games are ordered by date, then start time | `order: [["gameDate", "ASC"], ["startTime", "ASC"]]` | Feature 6 |
| **Games** menu and `/games` are admin-only in the UI | `MenuBar` shows **Games** when `user.role === "admin"` | Feature 6 |
| Menu order is Leagues, Teams, Games, People, Seasons | `MenuBar` catalog buttons | Feature 6 |
| Unauthenticated `/games` redirects to login | Router `beforeEach` | Feature 6 |
| Season list opens a season view | **Open season** icon (`mdi-calendar`) goes to `/seasons/:seasonId` | Feature 7 |
| Season view heading shows name, league, start date, and end date | `Season.vue` heading area | Feature 7 |
| Season view lists only that season's games | Filter `GET /league/games` by `seasonId` | Feature 7 |
| **Add Games** on the season view defaults `seasonId` | Add Game dialog opens with this season selected | Feature 7 |
| Season view game rows open **Edit Game** | **Edit game** icon; `PUT /league/games/:gameId` | Feature 7 |
| Unauthenticated `/seasons/:seasonId` redirects to login | Router `beforeEach` | Feature 7 |
| Season stores game days, game time, and min days between games | Required on season create/update | Feature 8 |
| **Create Games** builds a home-and-away schedule for the season's league | `POST /league/seasons/:seasonId/games` | Feature 8 |
| Generated games use season game days, time, and date range | Scheduler + Feature 6 game rows | Feature 8 |
| A team's generated games honor the minimum gap and no back-to-back rematch | Scheduler constraints | Feature 8 |
| Create-games is all-or-nothing | `400` `"Season is not long enough to schedule all games."` and no rows | Feature 8 |
| Create-games needs 3+ teams and an empty season | `400` quoted messages | Feature 8 |
| Only admin may generate season games | `authenticateAdmin` on create-games | Feature 8 |
