# API Reference

**Status:** Feature 5 teams. Mount path is `/courses` (see `backend/server.js`).

## Endpoints

| Method   | Endpoint                     | Auth       | Purpose                                 |
| -------- | ---------------------------- | ---------- | --------------------------------------- |
| `GET`    | `/courses/seasons`           | Yes        | Fetch all seasons in the shared catalog |
| `POST`   | `/courses/seasons`           | Yes, admin | Create a season                         |
| `PUT`    | `/courses/seasons/:seasonId` | Yes, admin | Update a season                         |
| `DELETE` | `/courses/seasons/:seasonId` | Yes, admin | Delete a season                         |
| `GET`    | `/courses/leagues`           | Yes        | Fetch all leagues in the shared catalog |
| `POST`   | `/courses/leagues`           | Yes, admin | Create a league                         |
| `PUT`    | `/courses/leagues/:leagueId` | Yes, admin | Update a league                         |
| `DELETE` | `/courses/leagues/:leagueId` | Yes, admin | Delete a league                         |
| `GET`    | `/courses/people`            | Yes        | Fetch all people in the shared catalog  |
| `POST`   | `/courses/people`            | Yes, admin | Create a person                         |
| `PUT`    | `/courses/people/:personId`  | Yes, admin | Update a person                         |
| `DELETE` | `/courses/people/:personId`  | Yes, admin | Delete a person                         |
| `GET`    | `/courses/users`             | Yes, admin | List users for the optional person link |
| `GET`    | `/courses/teams`             | Yes        | Fetch all teams with league and players |
| `POST`   | `/courses/teams`             | Yes, admin | Create a team in a league               |
| `PUT`    | `/courses/teams/:teamId`     | Yes, admin | Update a team's name or league          |
| `DELETE` | `/courses/teams/:teamId`     | Yes, admin | Delete a team and its player rows       |
| `GET`    | `/courses/teams/:teamId/players` | Yes    | Fetch players on one team               |
| `POST`   | `/courses/teams/:teamId/players` | Yes, admin | Add a player to a team            |
| `PUT`    | `/courses/teams/:teamId/players/:playerId` | Yes, admin | Update a player       |
| `DELETE` | `/courses/teams/:teamId/players/:playerId` | Yes, admin | Remove a player       |

**Season create / update body:**

```json
{
  "name": "2026 Fall",
  "startDate": "2026-08-15",
  "endDate": "2026-12-15"
}
```

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

**Success create (`201`):** object with `id`, timestamps, and feature fields. Teams include nested `league` and `players`.  
**Success list (`200`):** array of objects. Seasons ordered by `startDate` ascending. Leagues ordered by `name` ascending. People ordered by `lastName`, then `firstName`. Teams ordered by league `name`, then team `name`. Players on a team ordered by `number`.  
**User list (`200`):** array of `{ "id", "username", "fName", "lName" }` (no password).  
**Errors:** `{ "message": "..." }`. Missing row → `404`. Validation / missing parent / blocked delete → `400`. Unauthenticated → `401`. Non-admin write (and `GET /courses/users`) → `403` `{ "message": "Admin role required." }`.  
**Blocked deletes:** `DELETE` league with teams → `"Cannot delete league: teams still exist."` `DELETE` person on a roster → `"Cannot delete person: team roster still exists."`

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
