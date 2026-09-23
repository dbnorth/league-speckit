import db from "../models/index.js";
import logger from "../config/logger.js";

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
    attributes: ["id", "name", "leagueId", "homeField"],
  },
  {
    model: db.team,
    as: "visitingTeam",
    attributes: ["id", "name", "leagueId", "homeField"],
  },
];

const parseRequiredId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const parseOptionalScore = (score) => {
  if (score === undefined || score === null || score === "") {
    return { value: null };
  }

  const parsed = Number(score);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
    return { error: true };
  }

  return { value: parsed };
};

const findGame = (gameId) =>
  db.game.findByPk(gameId, { include: gameInclude });

const validateGameFields = async (
  {
    seasonId,
    gameDate,
    startTime,
    location,
    homeTeamId,
    visitingTeamId,
    homeTeamScore,
    visitingTeamScore,
  },
  { useHomeField = false } = {}
) => {
  const parsedSeasonId = parseRequiredId(seasonId);
  const parsedHomeTeamId = parseRequiredId(homeTeamId);
  const parsedVisitingTeamId = parseRequiredId(visitingTeamId);

  if (
    parsedSeasonId === null ||
    !gameDate ||
    !startTime ||
    parsedHomeTeamId === null ||
    parsedVisitingTeamId === null
  ) {
    return { error: { status: 400, message: "Required" } };
  }

  const trimmedLocation =
    location === undefined || location === null || !String(location).trim()
      ? null
      : String(location).trim();

  if (trimmedLocation && trimmedLocation.length > 50) {
    return {
      error: { status: 400, message: "Location must be 50 characters or fewer." },
    };
  }

  if (Number.isNaN(parsedSeasonId)) {
    return { error: { status: 400, message: "Season not found." } };
  }

  const season = await db.season.findByPk(parsedSeasonId);
  if (!season) {
    return { error: { status: 400, message: "Season not found." } };
  }

  if (Number.isNaN(parsedHomeTeamId)) {
    return { error: { status: 400, message: "Home team not found." } };
  }

  const homeTeam = await db.team.findByPk(parsedHomeTeamId);
  if (!homeTeam) {
    return { error: { status: 400, message: "Home team not found." } };
  }

  if (Number.isNaN(parsedVisitingTeamId)) {
    return { error: { status: 400, message: "Visiting team not found." } };
  }

  const visitingTeam = await db.team.findByPk(parsedVisitingTeamId);
  if (!visitingTeam) {
    return { error: { status: 400, message: "Visiting team not found." } };
  }

  if (parsedHomeTeamId === parsedVisitingTeamId) {
    return {
      error: {
        status: 400,
        message: "Home team and visiting team must be different.",
      },
    };
  }

  if (
    homeTeam.leagueId !== season.leagueId ||
    visitingTeam.leagueId !== season.leagueId
  ) {
    return {
      error: {
        status: 400,
        message: "Home team and visiting team must be in the season's league.",
      },
    };
  }

  const homeScore = parseOptionalScore(homeTeamScore);
  const visitingScore = parseOptionalScore(visitingTeamScore);
  if (homeScore.error || visitingScore.error) {
    return {
      error: { status: 400, message: "Score must be between 0 and 999." },
    };
  }

  return {
    values: {
      seasonId: parsedSeasonId,
      gameDate,
      startTime,
      location: useHomeField
        ? homeTeam.homeField?.trim() || null
        : trimmedLocation,
      homeTeamId: parsedHomeTeamId,
      visitingTeamId: parsedVisitingTeamId,
      homeTeamScore: homeScore.value,
      visitingTeamScore: visitingScore.value,
    },
  };
};

exports.findAll = async (req, res) => {
  try {
    const games = await db.game.findAll({
      include: gameInclude,
      order: [
        ["gameDate", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    return res.send(games);
  } catch (err) {
    logger.error(`game findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch games." });
  }
};

exports.create = async (req, res) => {
  try {
    const result = await validateGameFields(req.body, { useHomeField: true });
    if (result.error) {
      return res.status(result.error.status).send({ message: result.error.message });
    }

    const created = await db.game.create(result.values);

    return res.status(201).send(await findGame(created.id));
  } catch (err) {
    logger.error(`game create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create game." });
  }
};

exports.update = async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId ?? req.body.gameId, 10);

    if (Number.isNaN(gameId)) {
      return res.status(400).send({ message: "Invalid game id." });
    }

    const existing = await db.game.findByPk(gameId);
    if (!existing) {
      return res.status(404).send({
        message: `Game with id=${gameId} not found.`,
      });
    }

    const result = await validateGameFields(req.body);
    if (result.error) {
      return res.status(result.error.status).send({ message: result.error.message });
    }

    await db.game.update(result.values, { where: { id: gameId } });

    return res.status(200).send({ message: "game updated successfully." });
  } catch (err) {
    logger.error(`game update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update game." });
  }
};

exports.remove = async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    if (Number.isNaN(gameId)) {
      return res.status(400).send({ message: "Invalid game id." });
    }

    const existing = await db.game.findByPk(gameId);
    if (!existing) {
      return res.status(404).send({
        message: `Game with id=${gameId} not found.`,
      });
    }

    await db.game.destroy({ where: { id: gameId } });

    return res.status(200).send({ message: "game deleted successfully." });
  } catch (err) {
    logger.error(`game delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete game." });
  }
};

export default exports;
