/**
 * Feature 6 — Game Management
 * Spec: features/feature-6-game-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Games from "../src/views/Games.vue";
import GameForm from "../src/components/GameForm.vue";
import gameServices from "../src/services/gameServices.js";
import seasonServices from "../src/services/seasonServices.js";
import teamServices from "../src/services/teamServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/gameServices.js", () => ({
  default: {
    getgames: vi.fn(),
    creategame: vi.fn(),
    updategame: vi.fn(),
    deletegame: vi.fn(),
  },
}));

vi.mock("../src/services/seasonServices.js", () => ({
  default: {
    getseasons: vi.fn(),
  },
}));

vi.mock("../src/services/teamServices.js", () => ({
  default: {
    getteams: vi.fn(),
  },
}));

const fallSeason = {
  id: 1,
  name: "2026 Fall",
  leagueId: 1,
};

const okcStrikers = {
  id: 1,
  name: "OKC Strikers",
  homeField: "Memorial Field",
  leagueId: 1,
};

const tulsaFc = {
  id: 2,
  name: "Tulsa FC",
  leagueId: 1,
};

const memorialGame = {
  id: 1,
  seasonId: 1,
  gameDate: "2026-09-12",
  startTime: "18:00:00",
  location: "Memorial Field",
  homeTeamId: 1,
  visitingTeamId: 2,
  homeTeamScore: null,
  visitingTeamScore: null,
  season: fallSeason,
  homeTeam: okcStrikers,
  visitingTeam: tulsaFc,
};

const validGameForm = (overrides = {}) => ({
  seasonId: 1,
  gameDate: "2026-09-12",
  startTime: "18:00",
  location: "Memorial Field",
  homeTeamId: 1,
  visitingTeamId: 2,
  homeTeamScore: "",
  visitingTeamScore: "",
  ...overrides,
});

const VDialogStub = {
  name: "VDialog",
  props: { modelValue: Boolean },
  template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
};

const clickButton = async (wrapper, label) => {
  const button = wrapper.findAll("button").find((item) => item.text().includes(label));
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
};

const fillGameForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(GameForm);
  await form.setValue(validGameForm(overrides));
};

const mountGames = async () => {
  const mounted = await mountWithPlugins(Games, {
    attachTo: document.body,
    global: {
      stubs: { VDialog: VDialogStub },
    },
  });
  await flushPromises();
  return mounted;
};

describe("Feature 6 — Game Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    gameServices.getgames.mockResolvedValue({ data: [] });
    gameServices.creategame.mockResolvedValue({ data: memorialGame });
    gameServices.updategame.mockResolvedValue({
      data: { message: "game updated successfully." },
    });
    gameServices.deletegame.mockResolvedValue({
      data: { message: "game deleted successfully." },
    });
    seasonServices.getseasons.mockResolvedValue({ data: [fallSeason] });
    teamServices.getteams.mockResolvedValue({ data: [okcStrikers, tulsaFc] });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-6.1 — Select to work with Games", () => {
    it("Menu Selection", async () => {
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Games");
      expect(wrapper.text()).toContain("+ New game");
    });
  });

  describe("US-6.2 — Create game", () => {
    it("User creates a new game", async () => {
      gameServices.getgames
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [memorialGame] });

      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New game");
      await fillGameForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(gameServices.creategame).toHaveBeenCalledWith({
        seasonId: 1,
        gameDate: "2026-09-12",
        startTime: "18:00",
        location: null,
        homeTeamId: 1,
        visitingTeamId: 2,
        homeTeamScore: null,
        visitingTeamScore: null,
      });
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC Strikers");
    });

    it("User creates a game with a missing required field", async () => {
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New game");
      await fillGameForm(wrapper, { startTime: "" });
      await clickButton(wrapper, "Create");

      expect(gameServices.creategame).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });
  });

  describe("US-6.3 — View games", () => {
    it("Games view loads with existing games", async () => {
      gameServices.getgames.mockResolvedValue({ data: [memorialGame] });

      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Memorial Field");
      expect(wrapper.text()).toContain("OKC Strikers");
      expect(wrapper.text()).toContain("Tulsa FC");
      expect(wrapper.text()).toContain("2026 Fall");
    });

    it("User has no games", async () => {
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No games yet. Create your first game.");
    });
  });

  describe("US-6.4 — Manage game rows", () => {
    it("game rows show edit and delete actions", async () => {
      gameServices.getgames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Edit game"]').exists()).toBe(true);
      expect(wrapper.get('[aria-label="Delete game"]').exists()).toBe(true);
    });
  });

  describe("US-6.5 — Edit a game", () => {
    it("User selects to edit a game", async () => {
      gameServices.getgames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit game"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Game");
    });

    it("User edits a game with valid values and saves", async () => {
      gameServices.getgames
        .mockResolvedValueOnce({ data: [memorialGame] })
        .mockResolvedValue({
          data: [
            {
              ...memorialGame,
              homeTeamScore: 2,
              visitingTeamScore: 1,
            },
          ],
        });

      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit game"]').trigger("click");
      await flushPromises();
      await fillGameForm(wrapper, {
        homeTeamScore: 2,
        visitingTeamScore: 1,
      });
      await clickButton(wrapper, "Save Game");

      expect(gameServices.updategame).toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2");
      expect(wrapper.text()).toContain("1");
    });

    it("User edits a game with invalid values and saves", async () => {
      gameServices.getgames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit game"]').trigger("click");
      await flushPromises();
      await fillGameForm(wrapper, {
        location: "Memorial Field Extra Long Location Name Here Now!!!",
      });
      await clickButton(wrapper, "Save Game");

      expect(gameServices.updategame).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Edit Game");
      expect(wrapper.text()).toContain("Location must be 50 characters or fewer.");
    });

    it("User edits a game and cancels", async () => {
      gameServices.getgames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit game"]').trigger("click");
      await flushPromises();
      await fillGameForm(wrapper, {
        location: "North Field",
        homeTeamScore: 2,
        visitingTeamScore: 1,
      });
      await clickButton(wrapper, "Cancel");

      expect(gameServices.updategame).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Memorial Field");
    });
  });

  describe("US-6.6 — Delete a game", () => {
    it("User selects to delete a game", async () => {
      gameServices.getgames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete game"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Delete this game?");
    });

    it("User deletes a game", async () => {
      gameServices.getgames
        .mockResolvedValueOnce({ data: [memorialGame] })
        .mockResolvedValue({ data: [] });

      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete game"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete Game");

      expect(gameServices.deletegame).toHaveBeenCalledWith(1);
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("Memorial Field");
    });

    it("User cancels deleting a game", async () => {
      gameServices.getgames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountGames();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete game"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Cancel");

      expect(gameServices.deletegame).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Memorial Field");
    });
  });
});
