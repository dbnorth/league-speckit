/**
 * Feature 2 — Season Management
 * Spec: features/feature-2-season-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  registerAdmin,
  authHeader,
  validSeason,
  createSeason,
  createGame,
} from "./helpers.js";

describe("Feature 2 — Season Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.2 — Create season", () => {
    it("User creates a new season", async () => {
      const { token } = await registerAdmin(app);
      const response = await createSeason(app, token);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "2026 Fall",
      });
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.leagueId).toEqual(expect.any(Number));
      expect(response.body.startDate).toBeDefined();
      expect(response.body.endDate).toBeDefined();

      const stored = await db.season.findOne({ where: { name: "2026 Fall" } });
      expect(stored).not.toBeNull();
    });

    it("User creates a season with a duplicate name", async () => {
      const { token } = await registerAdmin(app);
      await createSeason(app, token);

      const response = await createSeason(app, token);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Season name is already taken in this league.",
      });

      const count = await db.season.count({ where: { name: "2026 Fall" } });
      expect(count).toBe(1);
    });

    it("User creates a season with an unknown league", async () => {
      const { token } = await registerAdmin(app);
      const response = await createSeason(app, token, { leagueId: 9999 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "League not found." });
      expect(await db.season.count()).toBe(0);
    });
  });

  describe("US-2.3 — View seasons", () => {
    it("Seasons view loads with existing seasons", async () => {
      const { token } = await registerAdmin(app);
      await createSeason(app, token, { name: "2026 Fall" });
      await createSeason(app, token, {
        name: "2026 Spring",
        startDate: "2026-01-15",
        endDate: "2026-05-15",
      });

      const response = await request(app)
        .get("/league/seasons")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.name)).toEqual([
        "2026 Spring",
        "2026 Fall",
      ]);
    });
  });

  describe("US-2.5 — Edit a season", () => {
    it("User edits a season with valid values and saves", async () => {
      const { token } = await registerAdmin(app);
      const created = await createSeason(app, token);

      const response = await request(app)
        .put(`/league/seasons/${created.body.id}`)
        .set(authHeader(token))
        .send({
          seasonId: created.body.id,
          name: "2027 Spring",
          startDate: "2027-01-10",
          endDate: "2027-04-30",
          leagueId: created.body.leagueId,
        });

      expect(response.status).toBe(200);

      const stored = await db.season.findByPk(created.body.id);
      expect(stored.name).toBe("2027 Spring");
    });
  });

  describe("US-2.6 — Delete a season", () => {
    it("User deletes a season", async () => {
      const { token } = await registerAdmin(app);
      const created = await createSeason(app, token);

      const response = await request(app)
        .delete(`/league/seasons/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const stored = await db.season.findByPk(created.body.id);
      expect(stored).toBeNull();
    });
  });

  describe("US-2.7 — Restrict season management to admins", () => {
    it("Student can list seasons via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      await createSeason(app, adminToken);

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .get("/league/seasons")
        .set(authHeader(student.body.token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it("Student cannot create a season via the API", async () => {
      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post("/league/seasons")
        .set(authHeader(student.body.token))
        .send(validSeason());

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.season.count()).toBe(0);
    });

    it("Unauthenticated API request to seasons", async () => {
      const response = await request(app).get("/league/seasons");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it("User cannot delete a season that has a game", async () => {
      const { token } = await registerAdmin(app);
      const created = await createGame(app, token);

      const response = await request(app)
        .delete(`/league/seasons/${created.body.seasonId}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete season: games still exist.",
      });
      expect(await db.season.findByPk(created.body.seasonId)).not.toBeNull();
      expect(await db.game.findByPk(created.body.id)).not.toBeNull();
    });

    it("User cannot delete a league that has a season", async () => {
      const { token } = await registerAdmin(app);
      const created = await createSeason(app, token);

      const response = await request(app)
        .delete(`/league/leagues/${created.body.leagueId}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete league: seasons still exist.",
      });
      expect(await db.league.findByPk(created.body.leagueId)).not.toBeNull();
      expect(await db.season.findByPk(created.body.id)).not.toBeNull();
    });
  });
});
