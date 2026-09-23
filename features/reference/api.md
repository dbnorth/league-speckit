# API Reference

**Status:** Feature 8 create-season-games. Mount path is `/league` (see `backend/server.js`).

## Endpoints

| Method   | Endpoint                     | Auth       | Purpose                                 |
| -------- | ---------------------------- | ---------- | --------------------------------------- |
| `GET`    | `/league/seasons`           | Yes        | Fetch all seasons in the shared catalog |
| `POST`   | `/league/seasons`           | Yes, admin | Create a season                         |
| `PUT`    | `/league/seasons/:seasonId` | Yes, admin | Update a season                         |
| `DELETE` | `/league/seasons/:seasonId` | Yes, admin | Delete a season                         |
| `POST`   | `/league/seasons/:seasonId/games` | Yes, admin | Generate the season home-and-away schedule |
| `GET`    | `/league/leagues`           | Yes        | Fetch all leagues in the shared catalog |
| `POST`   | `/league/leagues`           | Yes, admin | Create a league                         |
| `PUT`    | `/league/leagues/:leagueId` | Yes, admin | Update a league                         |
| `DELETE` | `/league/leagues/:leagueId` | Yes, admin | Delete a league                         |
| `GET`    | `/league/people`            | Yes        | Fetch all people in the shared catalog  |
| `POST`   | `/league/people`            | Yes, admin | Create a person                         |
| `PUT`    | `/league/people/:personId`  | Yes, admin | Update a person                         |
| `DELETE` | `/league/people/:personId`  | Yes, admin | Delete a person                         |
| `GET`    | `/league/users`             | Yes, admin | List users for the optional person link |
| `GET`    | `/league/teams`             | Yes        | Fetch all teams with league and players |
| `POST`   | `/league/teams`             | Yes, admin | Create a team in a league               |
| `PUT`    | `/league/teams/:teamId`     | Yes, admin | Update a team's name or league          |
| `DELETE` | `/league/teams/:teamId`     | Yes, admin | Delete a team and its player rows       |
| `GET`    | `/league/teams/:teamId/players` | Yes    | Fetch players on one team               |
| `POST`   | `/league/teams/:teamId/players` | Yes, admin | Add a player to a team            |
| `PUT`    | `/league/teams/:teamId/players/:playerId` | Yes, admin | Update a player       |
| `DELETE` | `/league/teams/:teamId/players/:playerId` | Yes, admin | Remove a player       |
| `GET`    | `/league/games`             | Yes        | Fetch all games with season and teams |
| `POST`   | `/league/games`             | Yes, admin | Create a game                         |
| `PUT`    | `/league/games/:gameId`     | Yes, admin | Update a game                         |
| `DELETE` | `/league/games/:gameId`     | Yes, admin | Delete a game                         |

**Season create / update body:**

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

**Create season games:** `POST /league/seasons/:seasonId/games` with no body. Success `201` is an array of Feature 6 game objects, count `n * (n - 1)` for `n` teams in the season's league. Generated games have `location` `null`.

**League create / update body:**

```json
{
  "name": "OKC Youth Soccer",
  "sport": "soccer"
}
```

Do not send `id` on create. League `userId` is ignored. Person `userId` is an optional link to `users.id`.

**Person create / update body:**

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

`userId` MAY be omitted or `null`. Sending `null` on update unlinks the user.

**Team create / update body:** `{ "name": "OKC Strikers", "leagueId": 1 }`  
**Player create / update body:** `{ "personId": 1, "position": "Forward", "number": 10 }`  
**Game create / update body:**

```json
{
  "seasonId": 1,
  "gameDate": "2026-09-12",
  "startTime": "18:00",
  "location": "Memorial Field",
  "homeTeamId": 1,
  "visitingTeamId": 2,
  "homeTeamScore": null,
  "visitingTeamScore": null
}
```

Scores MAY be omitted or `null`.

**Success create (`201`):** object with `id`, timestamps, and feature fields. Seasons include nested `league`. Teams include nested `league` and `players`. Games include nested `season`, `homeTeam`, and `visitingTeam`.  
**Success list (`200`):** array of objects. Seasons ordered by `startDate` ascending. Leagues ordered by `name` ascending. People ordered by `lastName`, then `firstName`. Teams ordered by league `name`, then team `name`. Players on a team ordered by `number`. Games ordered by `gameDate`, then `startTime`.  
**User list (`200`):** array of `{ "id", "username", "fName", "lName" }` (no password).  
**Errors:** `{ "message": "..." }`. Missing row → `404`. Validation / missing parent / blocked delete → `400`. Unauthenticated → `401`. Non-admin write (and `GET /league/users`) → `403` `{ "message": "Admin role required." }`.  
**Blocked deletes:** `DELETE` league with seasons → `"Cannot delete league: seasons still exist."` `DELETE` league with teams → `"Cannot delete league: teams still exist."` `DELETE` person on a roster → `"Cannot delete person: team roster still exists."` `DELETE` season with games → `"Cannot delete season: games still exist."` `DELETE` team with games → `"Cannot delete team: games still exist."`

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
