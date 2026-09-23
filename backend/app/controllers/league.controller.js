import db from "../models/index.js";
import logger from "../config/logger.js";

const SPORTS = ["soccer", "baseball", "volleyball", "football"];
const exports = {};

exports.findAll = async (req, res) => {
  try {
    const leagues = await db.league.findAll({
      order: [["name", "ASC"]],
    });

    return res.send(leagues);
  } catch (err) {
    logger.error(`league findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch leagues." });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, sport } = req.body;

    if (!name?.trim() || !sport) {
      return res.status(400).send({ message: "Required" });
    }

    if (name.trim().length > 50) {
      return res.status(400).send({
        message: "League name must be 50 characters or fewer.",
      });
    }

    if (!SPORTS.includes(sport)) {
      return res.status(400).send({
        message: "Sport must be soccer, baseball, volleyball, or football.",
      });
    }

    const existing = await db.league.findOne({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(400).send({ message: "League name is already taken." });
    }

    const league = await db.league.create({
      name: name.trim(),
      sport,
    });

    return res.status(201).send(league);
  } catch (err) {
    logger.error(`league create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create league." });
  }
};

exports.update = async (req, res) => {
  try {
    const leagueId = parseInt(req.params.leagueId ?? req.body.leagueId, 10);
    const { name, sport } = req.body;

    if (Number.isNaN(leagueId)) {
      return res.status(400).send({ message: "Invalid league id." });
    }

    const existing = await db.league.findByPk(leagueId);
    if (!existing) {
      return res.status(404).send({
        message: `League with id=${leagueId} not found.`,
      });
    }

    if (!name?.trim() || !sport) {
      return res.status(400).send({ message: "Required" });
    }

    if (name.trim().length > 50) {
      return res.status(400).send({
        message: "League name must be 50 characters or fewer.",
      });
    }

    if (!SPORTS.includes(sport)) {
      return res.status(400).send({
        message: "Sport must be soccer, baseball, volleyball, or football.",
      });
    }

    const duplicate = await db.league.findOne({
      where: { name: name.trim() },
    });
    if (duplicate && duplicate.id !== leagueId) {
      return res.status(400).send({ message: "League name is already taken." });
    }

    await db.league.update(
      {
        name: name.trim(),
        sport,
      },
      { where: { id: leagueId } }
    );

    return res.status(200).send({ message: "league updated successfully." });
  } catch (err) {
    logger.error(`league update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update league." });
  }
};

exports.remove = async (req, res) => {
  try {
    const leagueId = parseInt(req.params.leagueId, 10);
    if (Number.isNaN(leagueId)) {
      return res.status(400).send({ message: "Invalid league id." });
    }

    const existing = await db.league.findByPk(leagueId);
    if (!existing) {
      return res.status(404).send({
        message: `League with id=${leagueId} not found.`,
      });
    }

    const seasonCount = await db.season.count({ where: { leagueId } });
    if (seasonCount > 0) {
      return res.status(400).send({
        message: "Cannot delete league: seasons still exist.",
      });
    }

    const teamCount = await db.team.count({ where: { leagueId } });
    if (teamCount > 0) {
      return res.status(400).send({
        message: "Cannot delete league: teams still exist.",
      });
    }

    await db.league.destroy({ where: { id: leagueId } });

    return res.status(200).send({ message: "league deleted successfully." });
  } catch (err) {
    logger.error(`league delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete league." });
  }
};

export default exports;
