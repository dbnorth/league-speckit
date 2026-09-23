/**
 * Feature 4 — People Management
 * Spec: features/feature-4-people-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  registerAdmin,
  authHeader,
  validPerson,
  createPerson,
  createLeague,
  createTeam,
  createPlayer,
} from "./helpers.js";

describe("Feature 4 — People Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-4.2 — Create person", () => {
    it("User creates a new person without a linked user", async () => {
      const { token } = await registerAdmin(app);
      const response = await createPerson(app, token);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        gender: "female",
        userId: null,
      });
      expect(response.body.id).toEqual(expect.any(Number));
      expect(String(response.body.birthDate).slice(0, 10)).toBe("1990-05-15");

      const stored = await db.person.findOne({
        where: { email: "jane.doe@example.com" },
      });
      expect(stored).not.toBeNull();
      expect(stored.userId).toBeNull();
    });

    it("User creates a new person with a linked user", async () => {
      const { token } = await registerAdmin(app);
      const { response: linkedUser } = await registerUser(app, {
        username: "jdoe",
        email: "jdoe@example.com",
      });

      const response = await createPerson(app, token, {
        userId: linkedUser.body.userId,
      });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(linkedUser.body.userId);
    });

    it("User creates a person with a duplicate email", async () => {
      const { token } = await registerAdmin(app);
      await createPerson(app, token);

      const response = await createPerson(app, token);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Email is already taken." });

      const count = await db.person.count({
        where: { email: "jane.doe@example.com" },
      });
      expect(count).toBe(1);
    });

    it("User creates a person with a user that is already linked", async () => {
      const { token } = await registerAdmin(app);
      const { response: linkedUser } = await registerUser(app, {
        username: "jdoe",
        email: "jdoe@example.com",
      });
      await createPerson(app, token, { userId: linkedUser.body.userId });

      const response = await createPerson(app, token, {
        firstName: "Robert",
        lastName: "Smith",
        email: "robert.smith@example.com",
        gender: "male",
        userId: linkedUser.body.userId,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "User is already linked to a person.",
      });
      expect(await db.person.count()).toBe(1);
    });
  });

  describe("US-4.3 — View people", () => {
    it("People view loads with existing people", async () => {
      const { token } = await registerAdmin(app);
      await createPerson(app, token, {
        firstName: "Robert",
        lastName: "Smith",
        email: "robert.smith@example.com",
        gender: "male",
      });
      await createPerson(app, token);

      const response = await request(app)
        .get("/league/people")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.lastName)).toEqual(["Doe", "Smith"]);
    });
  });

  describe("US-4.5 — Edit a person", () => {
    it("User edits a person with valid values and saves", async () => {
      const { token } = await registerAdmin(app);
      const created = await createPerson(app, token);

      const response = await request(app)
        .put(`/league/people/${created.body.id}`)
        .set(authHeader(token))
        .send({
          personId: created.body.id,
          firstName: "Janet",
          lastName: "Doe",
          email: "janet.doe@example.com",
          birthDate: "1991-06-20",
          gender: "female",
        });

      expect(response.status).toBe(200);

      const stored = await db.person.findByPk(created.body.id);
      expect(stored.firstName).toBe("Janet");
      expect(stored.email).toBe("janet.doe@example.com");
    });
  });

  describe("US-4.6 — Delete a person", () => {
    it("User deletes a person", async () => {
      const { token } = await registerAdmin(app);
      const created = await createPerson(app, token);

      const response = await request(app)
        .delete(`/league/people/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(await db.person.findByPk(created.body.id)).toBeNull();
    });

    it("User deletes a person who has a linked user", async () => {
      const { token } = await registerAdmin(app);
      const { response: linkedUser } = await registerUser(app, {
        username: "jdoe",
        email: "jdoe@example.com",
      });
      const created = await createPerson(app, token, {
        userId: linkedUser.body.userId,
      });

      const response = await request(app)
        .delete(`/league/people/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(await db.person.findByPk(created.body.id)).toBeNull();
      expect(await db.user.findByPk(linkedUser.body.userId)).not.toBeNull();
    });
  });

  describe("US-4.7 — Restrict people management to admins", () => {
    it("Student can list people via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      await createPerson(app, adminToken);

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .get("/league/people")
        .set(authHeader(student.body.token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it("Student cannot create a person via the API", async () => {
      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post("/league/people")
        .set(authHeader(student.body.token))
        .send(validPerson());

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.person.count()).toBe(0);
    });

    it("Student cannot list users via the API", async () => {
      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .get("/league/users")
        .set(authHeader(student.body.token));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
    });

    it("Unauthenticated API request to people", async () => {
      const response = await request(app).get("/league/people");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-5.9 — Block delete of referenced league or person", () => {
    it("User cannot delete a person who is a player", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const person = await createPerson(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });
      const player = await createPlayer(app, token, team.body.id, {
        personId: person.body.id,
      });

      const response = await request(app)
        .delete(`/league/people/${person.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete person: team roster still exists.",
      });
      expect(await db.person.findByPk(person.body.id)).not.toBeNull();
      expect(await db.player.findByPk(player.body.id)).not.toBeNull();
    });
  });
});
