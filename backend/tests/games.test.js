/**
 * Feature 6 — Game Management
 * Spec: features/feature-6-game-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  registerAdmin,
  authHeader,
  validGame,
  createGame,
  createSeason,
  createLeague,
  createTeam,
} from "./helpers.js";

describe("Feature 6 — Game Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-6.2 — Create game", () => {
    it("User creates a new game", async () => {
      const { token } = await registerAdmin(app);
      const response = await createGame(app, token);

      expect(response.status).toBe(201);
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.season.name).toBe("2026 Fall");
      expect(response.body.homeTeam.name).toBe("OKC Strikers");
      expect(response.body.visitingTeam.name).toBe("Tulsa FC");
      expect(response.body.location).toBe("Memorial Field");
    });

    it("User creates a game with the same home and visiting team", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      const team = await createTeam(app, token, {
        name: "OKC Strikers",
        leagueId: season.body.leagueId,
      });

      const response = await request(app)
        .post("/league/games")
        .set(authHeader(token))
        .send(
          validGame({
            seasonId: season.body.id,
            homeTeamId: team.body.id,
            visitingTeamId: team.body.id,
          })
        );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Home team and visiting team must be different.",
      });
      expect(await db.game.count()).toBe(0);
    });

    it("User creates a game with an unknown season", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const homeTeam = await createTeam(app, token, {
        name: "OKC Strikers",
        leagueId: league.body.id,
      });
      const visitingTeam = await createTeam(app, token, {
        name: "Tulsa FC",
        leagueId: league.body.id,
      });

      const response = await request(app)
        .post("/league/games")
        .set(authHeader(token))
        .send(
          validGame({
            seasonId: 99999,
            homeTeamId: homeTeam.body.id,
            visitingTeamId: visitingTeam.body.id,
          })
        );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Season not found." });
      expect(await db.game.count()).toBe(0);
    });

    it("User creates a game with a team that is not in the season's league", async () => {
      const { token } = await registerAdmin(app);
      const season = await createSeason(app, token);
      const homeTeam = await createTeam(app, token, {
        name: "OKC Strikers",
        leagueId: season.body.leagueId,
      });
      const otherLeague = await createLeague(app, token, {
        name: "Metro Baseball",
        sport: "baseball",
      });
      const visitingTeam = await createTeam(app, token, {
        name: "Metro Sluggers",
        leagueId: otherLeague.body.id,
      });

      const response = await request(app)
        .post("/league/games")
        .set(authHeader(token))
        .send(
          validGame({
            seasonId: season.body.id,
            homeTeamId: homeTeam.body.id,
            visitingTeamId: visitingTeam.body.id,
          })
        );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Home team and visiting team must be in the season's league.",
      });
      expect(await db.game.count()).toBe(0);
    });
  });

  describe("US-6.3 — View games", () => {
    it("Games view loads with existing games", async () => {
      const { token } = await registerAdmin(app);
      await createGame(app, token);
      const laterSeason = await createSeason(app, token, { name: "2026 Spring" });
      const visitingTeam = await db.team.findOne({ where: { name: "Tulsa FC" } });
      const northTeam = await createTeam(app, token, {
        name: "North United",
        homeField: "North Field",
        leagueId: laterSeason.body.leagueId,
      });
      await createGame(app, token, {
        seasonId: laterSeason.body.id,
        homeTeamId: northTeam.body.id,
        visitingTeamId: visitingTeam.id,
        gameDate: "2026-03-12",
        startTime: "10:00",
      });

      const response = await request(app)
        .get("/league/games")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.location)).toEqual([
        "North Field",
        "Memorial Field",
      ]);
    });
  });

  describe("US-6.5 — Edit a game", () => {
    it("User edits a game with valid values and saves", async () => {
      const { token } = await registerAdmin(app);
      const created = await createGame(app, token);

      const response = await request(app)
        .put(`/league/games/${created.body.id}`)
        .set(authHeader(token))
        .send({
          seasonId: created.body.seasonId,
          gameDate: "2026-09-13",
          startTime: "19:00",
          location: "North Field",
          homeTeamId: created.body.homeTeamId,
          visitingTeamId: created.body.visitingTeamId,
          homeTeamScore: 2,
          visitingTeamScore: 1,
        });

      expect(response.status).toBe(200);

      const stored = await db.game.findByPk(created.body.id);
      expect(stored.homeTeamScore).toBe(2);
      expect(stored.visitingTeamScore).toBe(1);
      expect(stored.gameDate).toBe("2026-09-13");
      expect(stored.location).toBe("North Field");
    });
  });

  describe("US-6.6 — Delete a game", () => {
    it("User deletes a game", async () => {
      const { token } = await registerAdmin(app);
      const created = await createGame(app, token);

      const response = await request(app)
        .delete(`/league/games/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(await db.game.findByPk(created.body.id)).toBeNull();
    });
  });

  describe("US-6.7 — Restrict game management to admins", () => {
    it("Student can list games via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      await createGame(app, adminToken);

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .get("/league/games")
        .set(authHeader(student.body.token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it("Student cannot create a game via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      const season = await createSeason(app, adminToken);
      const homeTeam = await createTeam(app, adminToken, {
        name: "OKC Strikers",
        leagueId: season.body.leagueId,
      });
      const visitingTeam = await createTeam(app, adminToken, {
        name: "Tulsa FC",
        leagueId: season.body.leagueId,
      });

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post("/league/games")
        .set(authHeader(student.body.token))
        .send(
          validGame({
            seasonId: season.body.id,
            homeTeamId: homeTeam.body.id,
            visitingTeamId: visitingTeam.body.id,
          })
        );

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.game.count()).toBe(0);
    });

    it("Unauthenticated API request to games", async () => {
      const response = await request(app).get("/league/games");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-6.8 — Block delete of a season or team that has a game", () => {
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

    it("User cannot delete a team that has a game", async () => {
      const { token } = await registerAdmin(app);
      const created = await createGame(app, token);

      const response = await request(app)
        .delete(`/league/teams/${created.body.homeTeamId}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Cannot delete team: games still exist.",
      });
      expect(await db.team.findByPk(created.body.homeTeamId)).not.toBeNull();
      expect(await db.game.findByPk(created.body.id)).not.toBeNull();
    });
  });
});
