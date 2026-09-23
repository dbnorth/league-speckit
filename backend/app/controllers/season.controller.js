import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const isEndAfterStart = (startDate, endDate) =>
  Boolean(startDate && endDate && endDate > startDate);

exports.findAll = async (req, res) => {
  try {
    const seasons = await db.season.findAll({
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
    const { name, startDate, endDate } = req.body;

    if (!name?.trim()) {
      return res.status(400).send({ message: "Required" });
    }

    if (name.trim().length > 30) {
      return res.status(400).send({
        message: "Season name must be 30 characters or fewer.",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).send({ message: "Required" });
    }

    if (!isEndAfterStart(startDate, endDate)) {
      return res.status(400).send({
        message: "End date must be after start date.",
      });
    }

    const existing = await db.season.findOne({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(400).send({ message: "Season name is already taken." });
    }

    const season = await db.season.create({
      name: name.trim(),
      startDate: startDate,
      endDate: endDate,
    });

    return res.status(201).send(season);
  } catch (err) {
    logger.error(`season create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create season." });
  }
};

exports.update = async (req, res) => {
  try {
    const seasonId = parseInt(req.params.seasonId, 10) || req.body.seasonId;
    const { name, startDate, endDate } = req.body;

    if (seasonId == null || Number.isNaN(Number(seasonId))) {
      return res.status(400).send({ message: "Invalid season id." });
    }

    const season = await db.season.findByPk(seasonId);
    if (!season) {
      return res.status(404).send({
        message: `Season with id=${seasonId} not found.`,
      });
    }

    if (!name?.trim()) {
      return res.status(400).send({ message: "Required" });
    }

    if (name.trim().length > 30) {
      return res.status(400).send({
        message: "Season name must be 30 characters or fewer.",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).send({ message: "Required" });
    }

    if (!isEndAfterStart(startDate, endDate)) {
      return res.status(400).send({
        message: "End date must be after start date.",
      });
    }

    const existing = await db.season.findOne({
      where: { name: name.trim() },
    });
    if (existing && existing.id !== Number(seasonId)) {
      return res.status(400).send({ message: "Season name is already taken." });
    }

    await db.season.update(
      {
        name: name.trim(),
        startDate: startDate,
        endDate: endDate,
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

    const deleted = await db.season.destroy({ where: { id: seasonId } });
    if (!deleted) {
      return res.status(404).send({
        message: `Season with id=${seasonId} not found.`,
      });
    }

    return res.status(200).send({ message: "season deleted successfully." });
  } catch (err) {
    logger.error(`season delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete season." });
  }
};

export default exports;
