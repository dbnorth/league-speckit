import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

const teamInclude = [
  {
    model: db.league,
    as: "league",
    attributes: ["id", "name", "sport"],
  },
  {
    model: db.player,
    as: "players",
    include: [
      {
        model: db.person,
        as: "person",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  },
];

const playerInclude = {
  model: db.person,
  as: "person",
  attributes: ["id", "firstName", "lastName"],
};

const findTeam = (teamId) =>
  db.team.findByPk(teamId, {
    include: teamInclude,
    order: [[{ model: db.player, as: "players" }, "number", "ASC"]],
  });

exports.findAll = async (req, res) => {
  try {
    const teams = await db.team.findAll({
      include: teamInclude,
      order: [
        [{ model: db.league, as: "league" }, "name", "ASC"],
        ["name", "ASC"],
        [{ model: db.player, as: "players" }, "number", "ASC"],
      ],
    });

    return res.send(teams);
  } catch (err) {
    logger.error(`team findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch teams." });
  }
};

const parseTeamFields = ({ name, leagueId, homeField }) => {
  if (
    !name?.trim() ||
    leagueId === undefined ||
    leagueId === null ||
    leagueId === "" ||
    !homeField?.toString().trim()
  ) {
    return { error: { message: "Required" } };
  }

  if (name.trim().length > 50) {
    return { error: { message: "Team name must be 50 characters or fewer." } };
  }

  if (homeField.trim().length > 50) {
    return { error: { message: "Home field must be 50 characters or fewer." } };
  }

  const parsedLeagueId = parseInt(leagueId, 10);
  if (Number.isNaN(parsedLeagueId)) {
    return { error: { message: "League not found." } };
  }

  return {
    values: {
      name: name.trim(),
      leagueId: parsedLeagueId,
      homeField: homeField.trim(),
    },
  };
};

exports.create = async (req, res) => {
  try {
    const fields = parseTeamFields(req.body);
    if (fields.error) {
      return res.status(400).send(fields.error);
    }

    const { name, leagueId, homeField } = fields.values;

    const league = await db.league.findByPk(leagueId);
    if (!league) {
      return res.status(400).send({ message: "League not found." });
    }

    const existing = await db.team.findOne({
      where: { leagueId, name },
    });
    if (existing) {
      return res.status(400).send({
        message: "Team name is already taken in this league.",
      });
    }

    const created = await db.team.create({
      name,
      leagueId,
      homeField,
    });

    return res.status(201).send(await findTeam(created.id));
  } catch (err) {
    logger.error(`team create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create team." });
  }
};

exports.update = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId ?? req.body.teamId, 10);

    if (Number.isNaN(teamId)) {
      return res.status(400).send({ message: "Invalid team id." });
    }

    const existing = await db.team.findByPk(teamId);
    if (!existing) {
      return res.status(404).send({
        message: `Team with id=${teamId} not found.`,
      });
    }

    const fields = parseTeamFields(req.body);
    if (fields.error) {
      return res.status(400).send(fields.error);
    }

    const { name, leagueId, homeField } = fields.values;

    const league = await db.league.findByPk(leagueId);
    if (!league) {
      return res.status(400).send({ message: "League not found." });
    }

    const duplicate = await db.team.findOne({
      where: { leagueId, name },
    });
    if (duplicate && duplicate.id !== teamId) {
      return res.status(400).send({
        message: "Team name is already taken in this league.",
      });
    }

    await db.team.update(
      {
        name,
        leagueId,
        homeField,
      },
      { where: { id: teamId } }
    );

    return res.status(200).send({ message: "team updated successfully." });
  } catch (err) {
    logger.error(`team update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update team." });
  }
};

exports.remove = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    if (Number.isNaN(teamId)) {
      return res.status(400).send({ message: "Invalid team id." });
    }

    const existing = await db.team.findByPk(teamId);
    if (!existing) {
      return res.status(404).send({
        message: `Team with id=${teamId} not found.`,
      });
    }

    const gameCount = await db.game.count({
      where: {
        [db.Sequelize.Op.or]: [{ homeTeamId: teamId }, { visitingTeamId: teamId }],
      },
    });
    if (gameCount > 0) {
      return res.status(400).send({
        message: "Cannot delete team: games still exist.",
      });
    }

    await db.player.destroy({ where: { teamId } });
    await db.team.destroy({ where: { id: teamId } });

    return res.status(200).send({ message: "team deleted successfully." });
  } catch (err) {
    logger.error(`team delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete team." });
  }
};

exports.findPlayers = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    if (Number.isNaN(teamId)) {
      return res.status(400).send({ message: "Invalid team id." });
    }

    const team = await db.team.findByPk(teamId);
    if (!team) {
      return res.status(404).send({
        message: `Team with id=${teamId} not found.`,
      });
    }

    const players = await db.player.findAll({
      where: { teamId },
      include: [playerInclude],
      order: [["number", "ASC"]],
    });

    return res.send(players);
  } catch (err) {
    logger.error(`player findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch players." });
  }
};

exports.createPlayer = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const { personId, position, number } = req.body;

    if (Number.isNaN(teamId)) {
      return res.status(400).send({ message: "Invalid team id." });
    }

    const team = await db.team.findByPk(teamId);
    if (!team) {
      return res.status(404).send({
        message: `Team with id=${teamId} not found.`,
      });
    }

    if (
      personId === undefined ||
      personId === null ||
      personId === "" ||
      !position?.toString().trim() ||
      number === undefined ||
      number === null ||
      number === ""
    ) {
      return res.status(400).send({ message: "Required" });
    }

    if (position.trim().length > 30) {
      return res.status(400).send({
        message: "Position must be 30 characters or fewer.",
      });
    }

    const parsedNumber = parseInt(number, 10);
    if (Number.isNaN(parsedNumber) || parsedNumber < 0 || parsedNumber > 99) {
      return res.status(400).send({
        message: "Player number must be between 0 and 99.",
      });
    }

    const parsedPersonId = parseInt(personId, 10);
    if (Number.isNaN(parsedPersonId)) {
      return res.status(400).send({ message: "Person not found." });
    }

    const person = await db.person.findByPk(parsedPersonId);
    if (!person) {
      return res.status(400).send({ message: "Person not found." });
    }

    const existingPerson = await db.player.findOne({
      where: { teamId, personId: parsedPersonId },
    });
    if (existingPerson) {
      return res.status(400).send({
        message: "Person is already on this team.",
      });
    }

    const existingNumber = await db.player.findOne({
      where: { teamId, number: parsedNumber },
    });
    if (existingNumber) {
      return res.status(400).send({
        message: "Player number is already taken on this team.",
      });
    }

    const created = await db.player.create({
      teamId,
      personId: parsedPersonId,
      position: position.trim(),
      number: parsedNumber,
    });

    const player = await db.player.findByPk(created.id, {
      include: [playerInclude],
    });

    return res.status(201).send(player);
  } catch (err) {
    logger.error(`player create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create player." });
  }
};

exports.updatePlayer = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const playerId = parseInt(req.params.playerId, 10);
    const { personId, position, number } = req.body;

    if (Number.isNaN(teamId) || Number.isNaN(playerId)) {
      return res.status(400).send({ message: "Invalid player id." });
    }

    const existing = await db.player.findOne({
      where: { id: playerId, teamId },
    });
    if (!existing) {
      return res.status(404).send({
        message: `Player with id=${playerId} not found.`,
      });
    }

    if (
      personId === undefined ||
      personId === null ||
      personId === "" ||
      !position?.toString().trim() ||
      number === undefined ||
      number === null ||
      number === ""
    ) {
      return res.status(400).send({ message: "Required" });
    }

    if (position.trim().length > 30) {
      return res.status(400).send({
        message: "Position must be 30 characters or fewer.",
      });
    }

    const parsedNumber = parseInt(number, 10);
    if (Number.isNaN(parsedNumber) || parsedNumber < 0 || parsedNumber > 99) {
      return res.status(400).send({
        message: "Player number must be between 0 and 99.",
      });
    }

    const parsedPersonId = parseInt(personId, 10);
    if (Number.isNaN(parsedPersonId)) {
      return res.status(400).send({ message: "Person not found." });
    }

    const person = await db.person.findByPk(parsedPersonId);
    if (!person) {
      return res.status(400).send({ message: "Person not found." });
    }

    const existingPerson = await db.player.findOne({
      where: { teamId, personId: parsedPersonId },
    });
    if (existingPerson && existingPerson.id !== playerId) {
      return res.status(400).send({
        message: "Person is already on this team.",
      });
    }

    const existingNumber = await db.player.findOne({
      where: { teamId, number: parsedNumber },
    });
    if (existingNumber && existingNumber.id !== playerId) {
      return res.status(400).send({
        message: "Player number is already taken on this team.",
      });
    }

    await db.player.update(
      {
        personId: parsedPersonId,
        position: position.trim(),
        number: parsedNumber,
      },
      { where: { id: playerId, teamId } }
    );

    return res.status(200).send({ message: "player updated successfully." });
  } catch (err) {
    logger.error(`player update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update player." });
  }
};

exports.removePlayer = async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId, 10);
    const playerId = parseInt(req.params.playerId, 10);

    if (Number.isNaN(teamId) || Number.isNaN(playerId)) {
      return res.status(400).send({ message: "Invalid player id." });
    }

    const deleted = await db.player.destroy({
      where: { id: playerId, teamId },
    });
    if (!deleted) {
      return res.status(404).send({
        message: `Player with id=${playerId} not found.`,
      });
    }

    return res.status(200).send({ message: "player deleted successfully." });
  } catch (err) {
    logger.error(`player delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete player." });
  }
};

export default exports;
