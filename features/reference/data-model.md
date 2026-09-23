# Data Model Reference

**Status:** Feature 9 team-manager (plus Features 1–8).

Update this file when a feature that defines schema merges to `dev`.

## Tables

### `seasons`

| Field       | Type       | Rules                                            |
| ----------- | ---------- | ------------------------------------------------ |
| `id`        | INTEGER PK | Auto-increment                                   |
| `name`      | STRING(30) | Required; trimmed; at most 30 characters         |
| `startDate` | DATE       | Required                                         |
| `endDate`   | DATE       | Required; must be after `startDate`              |
| `leagueId`             | INTEGER FK | Required; references `leagues.id`                |
| `gameDays`             | JSON       | Required; non-empty weekday list                 |
| `gameTime`             | TIME       | Required; used as generated game start time      |
| `minDaysBetweenGames`  | INTEGER    | Required; integer 0–99                           |
| `createdAt`            | DATE       | Sequelize timestamps                             |
| `updatedAt`            | DATE       | Sequelize timestamps                             |

Unique index on (`leagueId`, `name`). `leagueId` uses `ON DELETE RESTRICT`.

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
| `homeField` | STRING(50) | Required; trimmed; used as home-game location  |
| `leagueId`  | INTEGER FK | Required; references `leagues.id`              |
| `managerId` | INTEGER FK | Optional; references `people.id`               |
| `createdAt` | DATE       | Sequelize timestamps                           |
| `updatedAt` | DATE       | Sequelize timestamps                           |

Unique index on (`leagueId`, `name`). `leagueId` uses `ON DELETE RESTRICT`. `managerId` uses `ON DELETE RESTRICT`.

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

### `games`

| Field               | Type       | Rules                                                       |
| ------------------- | ---------- | ----------------------------------------------------------- |
| `id`                | INTEGER PK | Auto-increment                                              |
| `seasonId`          | INTEGER FK | Required; references `seasons.id`                           |
| `gameDate`          | DATE       | Required                                                    |
| `startTime`         | TIME       | Required                                                    |
| `location`          | STRING(50) | Optional; trimmed; at most 50 characters; `null` when empty |
| `homeTeamId`        | INTEGER FK | Required; references `teams.id`                             |
| `visitingTeamId`    | INTEGER FK | Required; references `teams.id`                             |
| `homeTeamScore`     | INTEGER    | Optional; when present, integer 0–999                       |
| `visitingTeamScore` | INTEGER    | Optional; when present, integer 0–999                       |
| `createdAt`         | DATE       | Sequelize timestamps                                        |
| `updatedAt`         | DATE       | Sequelize timestamps                                        |

`seasonId`, `homeTeamId`, and `visitingTeamId` use `ON DELETE RESTRICT`. Home and visiting teams must be different and belong to the season's league.

## Associations

`Season belongsTo League` (`RESTRICT`). `League hasMany Season`. `Person belongsTo User` (`userId`, optional, `onDelete: SET NULL`). `User hasOne Person`. `Team belongsTo League` (`RESTRICT`). `League hasMany Team`. `Team belongsTo Person` as `manager` (`managerId`, optional, `RESTRICT`). `Person hasMany Team` as `managedTeams`. `Player belongsTo Team` (`CASCADE`). `Player belongsTo Person` (`RESTRICT`). `Team hasMany Player`. `Person hasMany Player`. `Game belongsTo Season` (`RESTRICT`). `Season hasMany Game`. `Game belongsTo Team` as `homeTeam` (`RESTRICT`). `Game belongsTo Team` as `visitingTeam` (`RESTRICT`). `Team hasMany Game` as `homeGames` and `visitingGames`. New users default to role `manager`.
