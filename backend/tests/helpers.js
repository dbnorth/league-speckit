import request from "supertest";
import db from "../app/models/index.js";

export const syncTestDatabase = async () => {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.sequelize.getQueryInterface().dropTable("courses").catch(() => {});
  await db.sequelize.sync({ force: true });
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
};

export const validRegisterPayload = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  password: "password123",
  ...overrides,
});

export const registerUser = async (app, overrides = {}) => {
  const payload = validRegisterPayload(overrides);
  const response = await request(app).post("/courses/register").send(payload);
  return { payload, response };
};

export const loginUser = async (app, credentials) => {
  return request(app).post("/courses/login").send(credentials);
};

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const registerAdmin = async (app, overrides = {}) => {
  const { payload, response } = await registerUser(app, {
    username: "adminuser",
    email: "admin@example.com",
    ...overrides,
  });

  const user = await db.user.findByPk(response.body.userId);
  user.role = "admin";
  await user.save();

  return {
    payload,
    response,
    token: response.body.token,
    userId: response.body.userId,
  };
};

export const validSeason = (overrides = {}) => ({
  name: "2026 Fall",
  startDate: "2026-08-15",
  endDate: "2026-12-15",
  ...overrides,
});

export const createSeason = async (app, token, overrides = {}) => {
  return request(app)
    .post("/courses/seasons")
    .set(authHeader(token))
    .send(validSeason(overrides));
};

export const validLeague = (overrides = {}) => ({
  name: "OKC Youth Soccer",
  sport: "soccer",
  ...overrides,
});

export const createLeague = async (app, token, overrides = {}) => {
  return request(app)
    .post("/courses/leagues")
    .set(authHeader(token))
    .send(validLeague(overrides));
};

export const validPerson = (overrides = {}) => ({
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  birthDate: "1990-05-15",
  gender: "female",
  ...overrides,
});

export const createPerson = async (app, token, overrides = {}) => {
  return request(app)
    .post("/courses/people")
    .set(authHeader(token))
    .send(validPerson(overrides));
};

export const validTeam = (overrides = {}) => ({
  name: "OKC Strikers",
  ...overrides,
});

export const createTeam = async (app, token, overrides = {}) => {
  return request(app)
    .post("/courses/teams")
    .set(authHeader(token))
    .send(validTeam(overrides));
};

export const validPlayer = (overrides = {}) => ({
  position: "Forward",
  number: 10,
  ...overrides,
});

export const createPlayer = async (app, token, teamId, overrides = {}) => {
  return request(app)
    .post(`/courses/teams/${teamId}/players`)
    .set(authHeader(token))
    .send(validPlayer(overrides));
};
