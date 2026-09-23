# Data Model Reference

**Status:** Feature 5 teams (plus Features 2–4 seasons/leagues/people, auth, and leftover section/faculty tables).

Update this file when a feature that defines schema merges to `dev`.

## Tables

### `seasons`

| Field       | Type       | Rules                                            |
| ----------- | ---------- | ------------------------------------------------ |
| `id`        | INTEGER PK | Auto-increment                                   |
| `name`      | STRING(30) | Required; unique; trimmed; at most 30 characters |
| `startDate` | DATE       | Required                                         |
| `endDate`   | DATE       | Required; must be after `startDate`              |
| `createdAt` | DATE       | Sequelize timestamps                             |
| `updatedAt` | DATE       | Sequelize timestamps                             |

### `leagues`

| Field       | Type       | Rules                                                              |
| ----------- | ---------- | ------------------------------------------------------------------ |
| `id`        | INTEGER PK | Auto-increment                                                     |
| `name`      | STRING(50) | Required; unique; trimmed; at most 50 characters                   |
| `sport`     | STRING     | Required; one of `soccer`, `baseball`, `volleyball`, `football`    |
| `createdAt` | DATE       | Sequelize timestamps                                               |
| `updatedAt` | DATE       | Sequelize timestamps                                               |

### `people`

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

### `teams`

| Field       | Type       | Rules                                          |
| ----------- | ---------- | ---------------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                                 |
| `name`      | STRING(50) | Required; trimmed; at most 50 characters       |
| `leagueId`  | INTEGER FK | Required; references `leagues.id`              |
| `createdAt` | DATE       | Sequelize timestamps                           |
| `updatedAt` | DATE       | Sequelize timestamps                           |

Unique index on (`leagueId`, `name`). `leagueId` uses `ON DELETE RESTRICT`.

### `players`

| Field       | Type       | Rules                                          |
| ----------- | ---------- | ---------------------------------------------- |
| `id`        | INTEGER PK | Auto-increment                                 |
| `teamId`    | INTEGER FK | Required; references `teams.id`                |
| `personId`  | INTEGER FK | Required; references `people.id`               |
| `position`  | STRING(30) | Required; trimmed; at most 30 characters       |
| `number`    | INTEGER    | Required; integer 0–99                         |
| `createdAt` | DATE       | Sequelize timestamps                           |
| `updatedAt` | DATE       | Sequelize timestamps                           |

Unique indexes on (`teamId`, `personId`) and (`teamId`, `number`). `teamId` uses `ON DELETE CASCADE`. `personId` uses `ON DELETE RESTRICT`.

## Associations

None for `seasons`. `Person belongsTo User` (`userId`, optional, `onDelete: SET NULL`). `User hasOne Person`. `Team belongsTo League` (`RESTRICT`). `League hasMany Team`. `Player belongsTo Team` (`CASCADE`). `Player belongsTo Person` (`RESTRICT`). `Team hasMany Player`. `Person hasMany Player`. Leftover section/faculty tables may still exist until later features are rewritten.
