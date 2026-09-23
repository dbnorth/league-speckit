/**
 * Feature 3 — League Management
 * Spec: features/feature-3-league-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  registerAdmin,
  authHeader,
  validLeague,
  createLeague,
  createTeam,
} from "./helpers.js";

describe("Feature 3 — League Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.2 — Create league", () => {
    it("User creates a new league", async () => {
      const { token } = await registerAdmin(app);
      const response = await createLeague(app, token);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "OKC Youth Soccer",
        sport: "soccer",
      });
      expect(response.body.id).toEqual(expect.any(Number));

      const stored = await db.league.findOne({
        where: { name: "OKC Youth Soccer" },
      });
      expect(stored).not.toBeNull();
    });

    it("User creates a league with a duplicate name", async () => {
      const { token } = await registerAdmin(app);
      await createLeague(app, token);

      const response = await createLeague(app, token);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "League name is already taken.",
      });

      const count = await db.league.count({
        where: { name: "OKC Youth Soccer" },
      });
      expect(count).toBe(1);
    });
  });

  describe("US-3.3 — View leagues", () => {
    it("Leagues view loads with existing leagues", async () => {
      const { token } = await registerAdmin(app);
      await createLeague(app, token, { name: "OKC Youth Soccer" });
      await createLeague(app, token, {
        name: "Metro Baseball",
        sport: "baseball",
      });

      const response = await request(app)
        .get("/courses/leagues")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.name)).toEqual([
        "Metro Baseball",
        "OKC Youth Soccer",
      ]);
    });
  });

  describe("US-3.5 — Edit a league", () => {
    it("User edits a league with valid values and saves", async () => {
      const { token } = await registerAdmin(app);
      const created = await createLeague(app, token);

      const response = await request(app)
        .put(`/courses/leagues/${created.body.id}`)
        .set(authHeader(token))
        .send({
          leagueId: created.body.id,
          name: "Metro Baseball",
          sport: "baseball",
        });

      expect(response.status).toBe(200);

      const stored = await db.league.findByPk(created.body.id);
      expect(stored.name).toBe("Metro Baseball");
      expect(stored.sport).toBe("baseball");
    });
  });

  describe("US-3.6 — Delete a league", () => {
    it("User deletes a league", async () => {
      const { token } = await registerAdmin(app);
      const created = await createLeague(app, token);

      const response = await request(app)
        .delete(`/courses/leagues/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const stored = await db.league.findByPk(created.body.id);
      expect(stored).toBeNull();
    });
  });

  describe("US-3.7 — Restrict league management to admins", () => {
    it("Student can list leagues via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      await createLeague(app, adminToken);

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .get("/courses/leagues")
        .set(authHeader(student.body.token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it("Student cannot create a league via the API", async () => {
      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post("/courses/leagues")
        .set(authHeader(student.body.token))
        .send(validLeague());

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.league.count()).toBe(0);
    });

    it("Unauthenticated API request to leagues", async () => {
      const response = await request(app).get("/courses/leagues");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-5.9 — Block delete of referenced league or person", () => {
    it("User cannot delete a league that has a team", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });

      const response = await request(app)
        .delete(`/courses/leagues/${league.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete league: teams still exist.",
      });
      expect(await db.league.findByPk(league.body.id)).not.toBeNull();
      expect(await db.team.findByPk(team.body.id)).not.toBeNull();
    });
  });
});
