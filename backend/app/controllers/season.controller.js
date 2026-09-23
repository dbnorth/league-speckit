import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

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

    if (!name?.trim() || !startDate || !endDate || parsedLeagueId === null) {
      return res.status(400).send({ message: "Required" });
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

export default exports;
