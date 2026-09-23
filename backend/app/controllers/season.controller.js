import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  WEEKDAYS,
  buildPairings,
  enumerateGameDates,
  scheduleGames,
} from "../services/seasonSchedule.js";

const exports = {};

const gameInclude = [
  {
    model: db.season,
    as: "season",
    attributes: ["id", "name", "leagueId"],
  },
  {
    model: db.team,
    as: "homeTeam",
    attributes: ["id", "name", "leagueId"],
  },
  {
    model: db.team,
    as: "visitingTeam",
    attributes: ["id", "name", "leagueId"],
  },
];

const seasonInclude = {
  model: db.league,
  as: "league",
  attributes: ["id", "name", "sport"],
};

const isEndAfterStart = (startDate, endDate) =>
  Boolean(startDate && endDate && endDate > startDate);

const parseLeagueId = (leagueId) => {
  if (leagueId === undefined || leagueId === null || leagueId === "") {
    return null;
  }

  const parsed = parseInt(leagueId, 10);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const findSeason = (seasonId) =>
  db.season.findByPk(seasonId, { include: seasonInclude });

const parseScheduleFields = ({ gameDays, gameTime, minDaysBetweenGames }) => {
  const hasGameDays = Array.isArray(gameDays) && gameDays.length > 0;
  if (
    !hasGameDays ||
    !gameTime ||
    minDaysBetweenGames === undefined ||
    minDaysBetweenGames === null ||
    minDaysBetweenGames === ""
  ) {
    if (hasGameDays && gameDays.some((day) => !WEEKDAYS.includes(day))) {
      return {
        error: {
          message:
            "Game days must be one or more of sunday, monday, tuesday, wednesday, thursday, friday, saturday.",
        },
      };
    }
    return { error: { message: "Required" } };
  }

  const uniqueDays = [...new Set(gameDays)];
  if (uniqueDays.some((day) => !WEEKDAYS.includes(day))) {
    return {
      error: {
        message:
          "Game days must be one or more of sunday, monday, tuesday, wednesday, thursday, friday, saturday.",
      },
    };
  }

  const gap = Number(minDaysBetweenGames);
  if (!Number.isInteger(gap) || gap < 0 || gap > 99) {
    return {
      error: {
        message: "Minimum days between games must be between 0 and 99.",
      },
    };
  }

  return {
    values: {
      gameDays: uniqueDays,
      gameTime,
      minDaysBetweenGames: gap,
    },
  };
};

exports.findAll = async (req, res) => {
  try {
    const seasons = await db.season.findAll({
      include: seasonInclude,
      order: [["startDate", "ASC"]],
    });

    return res.send(seasons);
  } catch (err) {
    logger.error(`season findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch seasons." });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, startDate, endDate, leagueId } = req.body;
    const parsedLeagueId = parseLeagueId(leagueId);
    const schedule = parseScheduleFields(req.body);

    if (!name?.trim() || !startDate || !endDate || parsedLeagueId === null) {
      return res.status(400).send({ message: "Required" });
    }

    if (schedule.error) {
      return res.status(400).send({ message: schedule.error.message });
    }

    if (name.trim().length > 30) {
      return res.status(400).send({
        message: "Season name must be 30 characters or fewer.",
      });
    }

    if (!isEndAfterStart(startDate, endDate)) {
      return res.status(400).send({
        message: "End date must be after start date.",
      });
    }

    if (Number.isNaN(parsedLeagueId)) {
      return res.status(400).send({ message: "League not found." });
    }

    const league = await db.league.findByPk(parsedLeagueId);
    if (!league) {
      return res.status(400).send({ message: "League not found." });
    }

    const existing = await db.season.findOne({
      where: { leagueId: parsedLeagueId, name: name.trim() },
    });
    if (existing) {
      return res.status(400).send({
        message: "Season name is already taken in this league.",
      });
    }

    const created = await db.season.create({
      name: name.trim(),
      startDate,
      endDate,
      leagueId: parsedLeagueId,
      ...schedule.values,
    });

    return res.status(201).send(await findSeason(created.id));
  } catch (err) {
    logger.error(`season create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create season." });
  }
};

exports.update = async (req, res) => {
  try {
    const seasonId = parseInt(req.params.seasonId, 10) || req.body.seasonId;
    const { name, startDate, endDate, leagueId } = req.body;
    const parsedLeagueId = parseLeagueId(leagueId);
    const schedule = parseScheduleFields(req.body);

    if (seasonId == null || Number.isNaN(Number(seasonId))) {
      return res.status(400).send({ message: "Invalid season id." });
    }

    const season = await db.season.findByPk(seasonId);
    if (!season) {
      return res.status(404).send({
        message: `Season with id=${seasonId} not found.`,
      });
    }

    if (!name?.trim() || !startDate || !endDate || parsedLeagueId === null) {
      return res.status(400).send({ message: "Required" });
    }

    if (schedule.error) {
      return res.status(400).send({ message: schedule.error.message });
    }

    if (name.trim().length > 30) {
      return res.status(400).send({
        message: "Season name must be 30 characters or fewer.",
      });
    }

    if (!isEndAfterStart(startDate, endDate)) {
      return res.status(400).send({
        message: "End date must be after start date.",
      });
    }

    if (Number.isNaN(parsedLeagueId)) {
      return res.status(400).send({ message: "League not found." });
    }

    const league = await db.league.findByPk(parsedLeagueId);
    if (!league) {
      return res.status(400).send({ message: "League not found." });
    }

    const existing = await db.season.findOne({
      where: { leagueId: parsedLeagueId, name: name.trim() },
    });
    if (existing && existing.id !== Number(seasonId)) {
      return res.status(400).send({
        message: "Season name is already taken in this league.",
      });
    }

    await db.season.update(
      {
        name: name.trim(),
        startDate,
        endDate,
        leagueId: parsedLeagueId,
        ...schedule.values,
      },
      {
        where: { id: seasonId },
      }
    );

    return res.status(200).send({ message: "season updated successfully." });
  } catch (err) {
    logger.error(`season update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update season." });
  }
};

exports.remove = async (req, res) => {
  try {
    const seasonId = parseInt(req.params.seasonId, 10);
    if (Number.isNaN(seasonId)) {
      return res.status(400).send({ message: "Invalid season id." });
    }

    const existing = await db.season.findByPk(seasonId);
    if (!existing) {
      return res.status(404).send({
        message: `Season with id=${seasonId} not found.`,
      });
    }

    const gameCount = await db.game.count({ where: { seasonId } });
    if (gameCount > 0) {
      return res.status(400).send({
        message: "Cannot delete season: games still exist.",
      });
    }

    await db.season.destroy({ where: { id: seasonId } });

    return res.status(200).send({ message: "season deleted successfully." });
  } catch (err) {
    logger.error(`season delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete season." });
  }
};

const parseStoredGameDays = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

exports.createGames = async (req, res) => {
  try {
    const seasonId = parseInt(req.params.seasonId, 10);
    if (Number.isNaN(seasonId)) {
      return res.status(400).send({ message: "Invalid season id." });
    }

    const season = await db.season.findByPk(seasonId);
    if (!season) {
      return res.status(404).send({
        message: `Season with id=${seasonId} not found.`,
      });
    }

    const existingCount = await db.game.count({ where: { seasonId } });
    if (existingCount > 0) {
      return res.status(400).send({
        message: "Cannot create games: games already exist.",
      });
    }

    const teams = await db.team.findAll({
      where: { leagueId: season.leagueId },
      order: [["id", "ASC"]],
    });
    if (teams.length < 3) {
      return res.status(400).send({
        message: "At least 3 teams are required to create a schedule.",
      });
    }

    const gameDays = parseStoredGameDays(season.gameDays);
    const dates = enumerateGameDates(season.startDate, season.endDate, gameDays);
    const pairings = buildPairings(teams);
    const scheduled = scheduleGames(pairings, dates, season.minDaysBetweenGames);

    if (!scheduled) {
      return res.status(400).send({
        message: "Season is not long enough to schedule all games.",
      });
    }

    const transaction = await db.sequelize.transaction();
    try {
      for (const row of scheduled) {
        await db.game.create(
          {
            seasonId,
            gameDate: row.gameDate,
            startTime: season.gameTime,
            location: teams.find((team) => team.id === row.homeTeamId)?.homeField
              ?.trim() || null,
            homeTeamId: row.homeTeamId,
            visitingTeamId: row.visitingTeamId,
            homeTeamScore: null,
            visitingTeamScore: null,
          },
          { transaction }
        );
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    const games = await db.game.findAll({
      where: { seasonId },
      include: gameInclude,
      order: [
        ["gameDate", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return res.status(201).send(games);
  } catch (err) {
    logger.error(`season createGames failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create games." });
  }
};

export default exports;
