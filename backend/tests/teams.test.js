/**
 * Feature 5 — Team Management
 * Spec: features/feature-5-team-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  registerAdmin,
  authHeader,
  createLeague,
  createPerson,
  validTeam,
  createTeam,
  validPlayer,
  createPlayer,
} from "./helpers.js";

describe("Feature 5 — Team Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-5.2 — Create team", () => {
    it("User creates a new team", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const response = await createTeam(app, token, { leagueId: league.body.id });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "OKC Strikers",
        leagueId: league.body.id,
      });
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.league.name).toBe("OKC Youth Soccer");
      expect(response.body.players).toEqual([]);
    });

    it("User creates a team with an unknown league", async () => {
      const { token } = await registerAdmin(app);
      const response = await createTeam(app, token, { leagueId: 9999 });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "League not found." });
      expect(await db.team.count()).toBe(0);
    });

    it("User creates a team with a duplicate name in the same league", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      await createTeam(app, token, { leagueId: league.body.id });

      const response = await createTeam(app, token, { leagueId: league.body.id });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Team name is already taken in this league.",
      });
      expect(await db.team.count()).toBe(1);
    });
  });

  describe("US-5.3 — View teams", () => {
    it("Teams view loads with existing teams", async () => {
      const { token } = await registerAdmin(app);
      const soccer = await createLeague(app, token);
      const baseball = await createLeague(app, token, {
        name: "Metro Baseball",
        sport: "baseball",
      });
      await createTeam(app, token, {
        name: "OKC Strikers",
        leagueId: soccer.body.id,
      });
      await createTeam(app, token, {
        name: "Metro Sluggers",
        leagueId: baseball.body.id,
      });

      const response = await request(app)
        .get("/courses/teams")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((row) => row.name)).toEqual([
        "Metro Sluggers",
        "OKC Strikers",
      ]);
    });
  });

  describe("US-5.5 — Edit a team", () => {
    it("User edits a team with valid values and saves", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const created = await createTeam(app, token, { leagueId: league.body.id });

      const response = await request(app)
        .put(`/courses/teams/${created.body.id}`)
        .set(authHeader(token))
        .send({
          teamId: created.body.id,
          name: "OKC United",
          leagueId: league.body.id,
        });

      expect(response.status).toBe(200);
      const stored = await db.team.findByPk(created.body.id);
      expect(stored.name).toBe("OKC United");
    });
  });

  describe("US-5.6 — Delete a team", () => {
    it("User deletes a team", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const created = await createTeam(app, token, { leagueId: league.body.id });

      const response = await request(app)
        .delete(`/courses/teams/${created.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(await db.team.findByPk(created.body.id)).toBeNull();
    });

    it("User deletes a team that has players", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const person = await createPerson(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });
      await createPlayer(app, token, team.body.id, { personId: person.body.id });

      const response = await request(app)
        .delete(`/courses/teams/${team.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(await db.team.findByPk(team.body.id)).toBeNull();
      expect(await db.player.count()).toBe(0);
      expect(await db.person.findByPk(person.body.id)).not.toBeNull();
    });
  });

  describe("US-5.7 — Restrict team management to admins", () => {
    it("Student can list teams via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      const league = await createLeague(app, adminToken);
      await createTeam(app, adminToken, { leagueId: league.body.id });

      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .get("/courses/teams")
        .set(authHeader(student.body.token));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it("Student cannot create a team via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      const league = await createLeague(app, adminToken);
      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post("/courses/teams")
        .set(authHeader(student.body.token))
        .send(validTeam({ leagueId: league.body.id }));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.team.count()).toBe(0);
    });

    it("Student cannot add a player via the API", async () => {
      const { token: adminToken } = await registerAdmin(app);
      const league = await createLeague(app, adminToken);
      const person = await createPerson(app, adminToken);
      const team = await createTeam(app, adminToken, { leagueId: league.body.id });
      const { response: student } = await registerUser(app, {
        username: "student1",
        email: "student1@example.com",
      });

      const response = await request(app)
        .post(`/courses/teams/${team.body.id}/players`)
        .set(authHeader(student.body.token))
        .send(validPlayer({ personId: person.body.id }));

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });
      expect(await db.player.count()).toBe(0);
    });

    it("Unauthenticated API request to teams", async () => {
      const response = await request(app).get("/courses/teams");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-5.8 — Manage team players", () => {
    it("User adds a player to a team", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const person = await createPerson(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });

      const response = await createPlayer(app, token, team.body.id, {
        personId: person.body.id,
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        personId: person.body.id,
        position: "Forward",
        number: 10,
      });
      expect(response.body.person.lastName).toBe("Doe");
    });

    it("User adds a player who is already on the team", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const person = await createPerson(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });
      await createPlayer(app, token, team.body.id, { personId: person.body.id });

      const response = await createPlayer(app, token, team.body.id, {
        personId: person.body.id,
        number: 11,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Person is already on this team.",
      });
      expect(await db.player.count()).toBe(1);
    });

    it("User adds a player with a number that is already taken on the team", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const jane = await createPerson(app, token);
      const robert = await createPerson(app, token, {
        firstName: "Robert",
        lastName: "Smith",
        email: "robert.smith@example.com",
        gender: "male",
      });
      const team = await createTeam(app, token, { leagueId: league.body.id });
      await createPlayer(app, token, team.body.id, { personId: jane.body.id });

      const response = await createPlayer(app, token, team.body.id, {
        personId: robert.body.id,
        number: 10,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Player number is already taken on this team.",
      });
      expect(await db.player.count()).toBe(1);
    });

    it("User adds a player with an unknown person", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });

      const response = await createPlayer(app, token, team.body.id, {
        personId: 9999,
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Person not found." });
      expect(await db.player.count()).toBe(0);
    });

    it("User edits a player with valid values and saves", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const person = await createPerson(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });
      const player = await createPlayer(app, token, team.body.id, {
        personId: person.body.id,
      });

      const response = await request(app)
        .put(`/courses/teams/${team.body.id}/players/${player.body.id}`)
        .set(authHeader(token))
        .send({
          personId: person.body.id,
          position: "Midfield",
          number: 8,
        });

      expect(response.status).toBe(200);
      const stored = await db.player.findByPk(player.body.id);
      expect(stored.position).toBe("Midfield");
      expect(stored.number).toBe(8);
    });

    it("User removes a player from a team", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const person = await createPerson(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });
      const player = await createPlayer(app, token, team.body.id, {
        personId: person.body.id,
      });

      const response = await request(app)
        .delete(`/courses/teams/${team.body.id}/players/${player.body.id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(await db.player.findByPk(player.body.id)).toBeNull();
      expect(await db.person.findByPk(person.body.id)).not.toBeNull();
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

    it("User cannot delete a person who is a player", async () => {
      const { token } = await registerAdmin(app);
      const league = await createLeague(app, token);
      const person = await createPerson(app, token);
      const team = await createTeam(app, token, { leagueId: league.body.id });
      const player = await createPlayer(app, token, team.body.id, {
        personId: person.body.id,
      });

      const response = await request(app)
        .delete(`/courses/people/${person.body.id}`)
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
