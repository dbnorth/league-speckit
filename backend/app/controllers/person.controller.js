import db from "../models/index.js";
import logger from "../config/logger.js";

const GENDERS = ["male", "female", "other"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const exports = {};

const toDateOnly = (value) => String(value ?? "").slice(0, 10);

const todayDateOnly = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isPastDate = (value) => {
  const dateOnly = toDateOnly(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && dateOnly < todayDateOnly();
};

const normalizeUserId = (userId) => {
  if (userId === undefined || userId === null || userId === "") {
    return null;
  }

  const parsed = parseInt(userId, 10);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const personInclude = {
  model: db.user,
  as: "user",
  attributes: ["id", "username", "fName", "lName"],
  required: false,
};

const validatePersonFields = ({ firstName, lastName, email, birthDate, gender }) => {
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !birthDate || !gender) {
    return { message: "Required" };
  }

  if (firstName.trim().length > 50) {
    return { message: "First name must be 50 characters or fewer." };
  }

  if (lastName.trim().length > 50) {
    return { message: "Last name must be 50 characters or fewer." };
  }

  if (email.trim().length > 100) {
    return { message: "Email must be 100 characters or fewer." };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { message: "Email must be a valid email address." };
  }

  if (!isPastDate(birthDate)) {
    return { message: "Birth date must be in the past." };
  }

  if (!GENDERS.includes(gender)) {
    return { message: "Gender must be male, female, or other." };
  }

  return null;
};

const emailsMatch = (left, right) =>
  String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase();

const resolveUserLink = async (userId, personId, personEmail) => {
  const normalized = normalizeUserId(userId);
  if (Number.isNaN(normalized)) {
    return { error: { message: "User not found." } };
  }

  if (normalized === null) {
    return { userId: null };
  }

  const user = await db.user.findByPk(normalized);
  if (!user) {
    return { error: { message: "User not found." } };
  }

  const linked = await db.person.findOne({ where: { userId: normalized } });
  if (linked && linked.id !== personId) {
    return { error: { message: "User is already linked to a person." } };
  }

  if (!emailsMatch(user.email, personEmail)) {
    return { error: { message: "User email must match the person's email." } };
  }

  return { userId: normalized };
};

exports.findAll = async (req, res) => {
  try {
    const people = await db.person.findAll({
      order: [
        ["lastName", "ASC"],
        ["firstName", "ASC"],
      ],
      include: [personInclude],
    });

    return res.send(people);
  } catch (err) {
    logger.error(`person findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch people." });
  }
};

exports.create = async (req, res) => {
  try {
    const { firstName, lastName, email, birthDate, gender, userId } = req.body;
    const fieldError = validatePersonFields({
      firstName,
      lastName,
      email,
      birthDate,
      gender,
    });
    if (fieldError) {
      return res.status(400).send(fieldError);
    }

    const existing = await db.person.findOne({
      where: { email: email.trim() },
    });
    if (existing) {
      return res.status(400).send({ message: "Email is already taken." });
    }

    const link = await resolveUserLink(userId, null, email.trim());
    if (link.error) {
      return res.status(400).send(link.error);
    }

    const person = await db.person.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      birthDate: toDateOnly(birthDate),
      gender,
      userId: link.userId,
    });

    const created = await db.person.findByPk(person.id, {
      include: [personInclude],
    });

    return res.status(201).send(created);
  } catch (err) {
    logger.error(`person create failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to create person." });
  }
};

exports.update = async (req, res) => {
  try {
    const personId = parseInt(req.params.personId ?? req.body.personId, 10);
    const { firstName, lastName, email, birthDate, gender, userId } = req.body;

    if (Number.isNaN(personId)) {
      return res.status(400).send({ message: "Invalid person id." });
    }

    const existing = await db.person.findByPk(personId);
    if (!existing) {
      return res.status(404).send({
        message: `Person with id=${personId} not found.`,
      });
    }

    const fieldError = validatePersonFields({
      firstName,
      lastName,
      email,
      birthDate,
      gender,
    });
    if (fieldError) {
      return res.status(400).send(fieldError);
    }

    const duplicate = await db.person.findOne({
      where: { email: email.trim() },
    });
    if (duplicate && duplicate.id !== personId) {
      return res.status(400).send({ message: "Email is already taken." });
    }

    const link = await resolveUserLink(userId, personId, email.trim());
    if (link.error) {
      return res.status(400).send(link.error);
    }

    await db.person.update(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        birthDate: toDateOnly(birthDate),
        gender,
        userId: link.userId,
      },
      { where: { id: personId } }
    );

    return res.status(200).send({ message: "person updated successfully." });
  } catch (err) {
    logger.error(`person update failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to update person." });
  }
};

exports.remove = async (req, res) => {
  try {
    const personId = parseInt(req.params.personId, 10);
    if (Number.isNaN(personId)) {
      return res.status(400).send({ message: "Invalid person id." });
    }

    const existing = await db.person.findByPk(personId);
    if (!existing) {
      return res.status(404).send({
        message: `Person with id=${personId} not found.`,
      });
    }

    const managerCount = await db.team.count({ where: { managerId: personId } });
    if (managerCount > 0) {
      return res.status(400).send({
        message: "Cannot delete person: team manager still exists.",
      });
    }

    const playerCount = await db.player.count({ where: { personId } });
    if (playerCount > 0) {
      return res.status(400).send({
        message: "Cannot delete person: team roster still exists.",
      });
    }

    await db.person.destroy({ where: { id: personId } });

    return res.status(200).send({ message: "person deleted successfully." });
  } catch (err) {
    logger.error(`person delete failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to delete person." });
  }
};

export default exports;
