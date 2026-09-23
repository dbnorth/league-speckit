/**
 * Feature 8 schedule builder — the only algorithm in this demo.
 * Catalog CRUD (league, team, person, season list) does not need a file
 * like this. Copy those controllers and Vue lists instead.
 */
export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const dateOnly = (value) => {
  if (value instanceof Date) {
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${value.getUTCFullYear()}-${month}-${day}`;
  }

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const parsed = new Date(value);
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${parsed.getUTCFullYear()}-${month}-${day}`;
};

const parseUtc = (value) => {
  const [year, month, day] = dateOnly(value).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const formatUtc = (utc) => {
  const date = new Date(utc);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
};

export const daysBetween = (start, end) =>
  Math.round((parseUtc(end) - parseUtc(start)) / 86400000);

export const weekdayName = (value) => WEEKDAYS[new Date(parseUtc(value)).getUTCDay()];

export const enumerateGameDates = (startDate, endDate, gameDays) => {
  const allowed = new Set(gameDays);
  const dates = [];
  let current = parseUtc(startDate);
  const last = parseUtc(endDate);

  while (current <= last) {
    const name = WEEKDAYS[new Date(current).getUTCDay()];
    if (allowed.has(name)) {
      dates.push(formatUtc(current));
    }
    current += 86400000;
  }

  return dates;
};

export const isValidAssignment = (games, minDaysBetweenGames) => {
  const byTeam = new Map();

  for (const game of games) {
    const home = byTeam.get(game.homeTeamId) ?? [];
    home.push({ date: game.gameDate, opponentId: game.visitingTeamId });
    byTeam.set(game.homeTeamId, home);

    const visiting = byTeam.get(game.visitingTeamId) ?? [];
    visiting.push({ date: game.gameDate, opponentId: game.homeTeamId });
    byTeam.set(game.visitingTeamId, visiting);
  }

  for (const list of byTeam.values()) {
    list.sort((left, right) => left.date.localeCompare(right.date));
    for (let index = 1; index < list.length; index += 1) {
      if (daysBetween(list[index - 1].date, list[index].date) < minDaysBetweenGames) {
        return false;
      }
      if (list[index - 1].opponentId === list[index].opponentId) {
        return false;
      }
    }
  }

  return true;
};

export const scheduleGames = (pairings, dates, minDaysBetweenGames) => {
  const search = (index, assigned) => {
    if (index === pairings.length) {
      return assigned;
    }

    const pairing = pairings[index];
    for (const gameDate of dates) {
      const next = [...assigned, { ...pairing, gameDate }];
      if (isValidAssignment(next, minDaysBetweenGames)) {
        const found = search(index + 1, next);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  return search(0, []);
};

export const buildPairings = (teams) => {
  const ids = teams.map((team) => team.id);
  const slots = ids.length % 2 === 1 ? [...ids, null] : [...ids];
  const rounds = slots.length - 1;
  const pairings = [];

  const appendHalf = (swapHome) => {
    const rotation = [...slots];
    for (let round = 0; round < rounds; round += 1) {
      for (let index = 0; index < rotation.length / 2; index += 1) {
        const left = rotation[index];
        const right = rotation[rotation.length - 1 - index];
        if (left == null || right == null) {
          continue;
        }

        pairings.push(
          swapHome
            ? { homeTeamId: right, visitingTeamId: left }
            : { homeTeamId: left, visitingTeamId: right }
        );
      }

      const last = rotation.pop();
      rotation.splice(1, 0, last);
    }
  };

  appendHalf(false);
  appendHalf(true);
  return pairings;
};
