/**
 * Feature 2 — Season Management
 * Spec: features/feature-2-season-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import SeasonList from "../src/views/SeasonList.vue";
import Season from "../src/views/Season.vue";
import SeasonForm from "../src/components/SeasonForm.vue";
import GameForm from "../src/components/GameForm.vue";
import seasonServices from "../src/services/seasonServices.js";
import leagueServices from "../src/services/leagueServices.js";
import gameServices from "../src/services/gameServices.js";
import teamServices from "../src/services/teamServices.js";
import { formatDate } from "../src/config/validation.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/seasonServices.js", () => ({
  default: {
    getSeasons: vi.fn(),
    createSeason: vi.fn(),
    updateSeason: vi.fn(),
    deleteSeason: vi.fn(),
    createGames: vi.fn(),
  },
}));

vi.mock("../src/services/leagueServices.js", () => ({
  default: {
    getLeagues: vi.fn(),
  },
}));

vi.mock("../src/services/gameServices.js", () => ({
  default: {
    getGames: vi.fn(),
    createGame: vi.fn(),
    updateGame: vi.fn(),
  },
}));

vi.mock("../src/services/teamServices.js", () => ({
  default: {
    getTeams: vi.fn(),
  },
}));

const soccerLeague = {
  id: 1,
  name: "OKC Youth Soccer",
  sport: "soccer",
};

const fall2026 = {
  id: 1,
  name: "2026 Fall",
  startDate: "2026-08-15",
  endDate: "2026-12-15",
  leagueId: 1,
  league: soccerLeague,
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
  season: fall2026,
  homeTeam: okcStrikers,
  visitingTeam: tulsaFc,
};

const northFieldGame = {
  id: 2,
  seasonId: 2,
  gameDate: "2026-03-12",
  startTime: "10:00:00",
  location: "North Field",
  homeTeamId: 1,
  visitingTeamId: 2,
  homeTeamScore: null,
  visitingTeamScore: null,
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

const validSeasonForm = (overrides = {}) => ({
  name: "2026 Fall",
  startDate: "2026-08-15",
  endDate: "2026-12-15",
  leagueId: 1,
  gameDays: ["saturday"],
  gameTime: "18:00",
  minDaysBetweenGames: 7,
  ...overrides,
});

const VDialogStub = {
  name: "VDialog",
  props: { modelValue: Boolean },
  template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
};

const clickButton = async (wrapper, label) => {
  const buttons = wrapper.findAll("button");
  const button =
    buttons.find((item) => item.text().trim() === label) ??
    buttons.find((item) => item.text().includes(label));
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
};

const fillSeasonForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(SeasonForm);
  await form.setValue(validSeasonForm(overrides));
};

const fillGameForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(GameForm);
  await form.setValue(validGameForm(overrides));
};

const mountOptions = {
  attachTo: document.body,
  global: {
    stubs: { VDialog: VDialogStub },
  },
};

const mountSeasons = async () => {
  const mounted = await mountWithPlugins(SeasonList, mountOptions);
  await flushPromises();
  return mounted;
};

const mountSeason = async () => {
  const router = await createTestRouter("/seasons/1");
  const mounted = await mountWithPlugins(Season, {
    ...mountOptions,
    router,
  });
  await flushPromises();
  return mounted;
};

describe("Feature 2 — Season Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    seasonServices.getSeasons.mockResolvedValue({ data: [] });
    gameServices.getGames.mockResolvedValue({ data: [] });
    gameServices.createGame.mockResolvedValue({ data: memorialGame });
    teamServices.getTeams.mockResolvedValue({ data: [okcStrikers, tulsaFc] });
    seasonServices.createSeason.mockResolvedValue({ data: fall2026 });
    seasonServices.updateSeason.mockResolvedValue({ data: fall2026 });
    seasonServices.deleteSeason.mockResolvedValue({ data: { message: "season deleted successfully." } });
    seasonServices.createGames.mockResolvedValue({ data: [] });
    leagueServices.getLeagues.mockResolvedValue({ data: [soccerLeague] });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-2.1 — Select to work with Seasons", () => {
    it("Menu Selection", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Seasons");
      expect(wrapper.text()).toContain("+ New season");
    });
  });

  describe("US-2.2 — Create season", () => {
    it("User creates a new season", async () => {
      seasonServices.getSeasons
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [fall2026] });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(seasonServices.createSeason).toHaveBeenCalledWith({
        name: "2026 Fall",
        startDate: "2026-08-15",
        endDate: "2026-12-15",
        leagueId: 1,
        gameDays: ["saturday"],
        gameTime: "18:00",
        minDaysBetweenGames: 7,
      });
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2026 Fall");
    });

    it("User creates a season with a missing required field", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper, {
        name: "2026 Fall",
        startDate: "2026-08-15",
        endDate: "",
      });
      await clickButton(wrapper, "Create");

      expect(seasonServices.createSeason).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });

    it("User creates a season with a name that is too long", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper, {
        name: "2026 Fall Championship Season!!",
        startDate: "2026-08-15",
        endDate: "2026-12-15",
      });
      await clickButton(wrapper, "Create");

      expect(seasonServices.createSeason).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain(
        "Season name must be 30 characters or fewer."
      );
    });

    it("User creates a season with end date before start date", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper, {
        name: "2026 Fall",
        startDate: "2026-12-15",
        endDate: "2026-08-15",
      });
      await clickButton(wrapper, "Create");

      expect(seasonServices.createSeason).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("End date must be after start date.");
    });

    it("User creates a season with a duplicate name", async () => {
      seasonServices.createSeason.mockRejectedValue({
        response: { data: { message: "Season name is already taken in this league." } },
      });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper, {
        name: "2026 Fall",
        startDate: "2026-08-15",
        endDate: "2026-12-15",
      });
      await clickButton(wrapper, "Create");

      expect(seasonServices.createSeason).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Season name is already taken in this league.");
      expect(wrapper.text()).toContain("+ New season");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    });
  });

  describe("US-2.3 — View seasons", () => {
    it("Seasons view loads with existing seasons", async () => {
      seasonServices.getSeasons.mockResolvedValue({
        data: [
          fall2026,
          {
            id: 2,
            name: "2026 Spring",
            startDate: "2026-01-15",
            endDate: "2026-05-15",
            leagueId: 1,
            league: soccerLeague,
          },
        ],
      });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("2026 Fall");
      expect(wrapper.text()).toContain("2026 Spring");
    });

    it("User has no seasons", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No seasons yet. Create your first season.");
    });
  });

  describe("US-2.4 — Manage season rows", () => {
    it("season rows show edit and delete actions", async () => {
      seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Edit season"]').exists()).toBe(true);
      expect(wrapper.get('[aria-label="Delete season"]').exists()).toBe(true);
    });
  });

  describe("US-2.5 — Edit a season", () => {
    it("User selects to edit a season", async () => {
      seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit season"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Season");
    });

    it("User edits a season with valid values and saves", async () => {
      seasonServices.getSeasons
        .mockResolvedValueOnce({ data: [fall2026] })
        .mockResolvedValue({
          data: [{ ...fall2026, name: "2027 Spring" }],
        });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit season"]').trigger("click");
      await flushPromises();
      await fillSeasonForm(wrapper, {
        name: "2027 Spring",
        startDate: "2027-01-10",
        endDate: "2027-04-30",
      });
      await clickButton(wrapper, "Save Season");

      expect(seasonServices.updateSeason).toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2027 Spring");
    });

    it("User edits a season with invalid values and saves", async () => {
      seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit season"]').trigger("click");
      await flushPromises();
      await fillSeasonForm(wrapper, {
        name: "2026 Fall Championship Season!!",
        startDate: "2026-08-15",
        endDate: "2026-12-15",
      });
      await clickButton(wrapper, "Save Season");

      expect(seasonServices.updateSeason).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Edit Season");
      expect(wrapper.text()).toContain(
        "Season name must be 30 characters or fewer."
      );
    });

    it("User edits a season and cancels", async () => {
      seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit season"]').trigger("click");
      await flushPromises();
      await fillSeasonForm(wrapper, {
        name: "2027 Spring",
        startDate: "2027-01-10",
        endDate: "2027-04-30",
      });
      await clickButton(wrapper, "Cancel");

      expect(seasonServices.updateSeason).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2026 Fall");
    });
  });

  describe("US-2.6 — Delete a season", () => {
    it("User selects to delete a season", async () => {
      seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete season"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Delete this season?");
    });

    it("User deletes a season", async () => {
      seasonServices.getSeasons
        .mockResolvedValueOnce({ data: [fall2026] })
        .mockResolvedValue({ data: [] });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete season"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete Season");

      expect(seasonServices.deleteSeason).toHaveBeenCalledWith(1);
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("2026 Fall");
    });

    it("User cancels deleting a season", async () => {
      seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete season"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Cancel");

      expect(seasonServices.deleteSeason).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2026 Fall");
    });
  });
});

describe("Feature 7 — Season View", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
    leagueServices.getLeagues.mockResolvedValue({ data: [soccerLeague] });
    gameServices.getGames.mockResolvedValue({ data: [] });
    gameServices.createGame.mockResolvedValue({ data: memorialGame });
    teamServices.getTeams.mockResolvedValue({ data: [okcStrikers, tulsaFc] });
    seasonServices.createGames.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-7.1 — Open a season from the list", () => {
    it("season rows show a view season action", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Open season"]').exists()).toBe(true);
    });

    it("User opens a season from the seasons list", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Open season"]').trigger("click");
      await flushPromises();

      expect(mounted.router.currentRoute.value.name).toBe("season");
      expect(mounted.router.currentRoute.value.params.seasonId).toBe("1");
    });
  });

  describe("US-7.2 — View season info and games", () => {
    it("Season view shows season info", async () => {
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("2026 Fall");
      expect(wrapper.text()).toContain("OKC Youth Soccer");
      expect(wrapper.text()).toContain(formatDate("2026-08-15"));
      expect(wrapper.text()).toContain(formatDate("2026-12-15"));
      expect(wrapper.text()).toContain("Add Games");
    });

    it("Season view lists games for that season", async () => {
      gameServices.getGames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Memorial Field");
    });

    it("Season view does not list games from another season", async () => {
      gameServices.getGames.mockResolvedValue({
        data: [memorialGame, northFieldGame],
      });
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Memorial Field");
      expect(wrapper.text()).not.toContain("North Field");
    });

    it("User has no games in the season", async () => {
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No games yet. Add the first game.");
    });
  });

  describe("US-7.3 — Add a game defaulted to this season", () => {
    it("User selects to add a game from the season view", async () => {
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "Add Games");

      expect(wrapper.text()).toContain("Add Game");
      expect(wrapper.findComponent(GameForm).props("modelValue").seasonId).toBe(1);
    });

    it("User creates a game from the season view", async () => {
      gameServices.getGames
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [memorialGame] });

      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "Add Games");
      await fillGameForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(gameServices.createGame).toHaveBeenCalledWith({
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

    it("User creates a game from the season view with a missing required field", async () => {
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "Add Games");
      await fillGameForm(wrapper, { startTime: "" });
      await clickButton(wrapper, "Create");

      expect(gameServices.createGame).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });
  });

  describe("US-7.5 — Edit a game from the season view", () => {
    it("Season view game rows show an edit action", async () => {
      gameServices.getGames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Edit game"]').exists()).toBe(true);
    });

    it("User selects to edit a game from the season view", async () => {
      gameServices.getGames.mockResolvedValue({ data: [memorialGame] });
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit game"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Game");
      expect(wrapper.findComponent(GameForm).props("showLocation")).toBe(true);
      expect(wrapper.findComponent(GameForm).props("modelValue").location).toBe(
        "Memorial Field"
      );
    });

    it("User edits a game from the season view", async () => {
      gameServices.getGames
        .mockResolvedValueOnce({ data: [memorialGame] })
        .mockResolvedValue({
          data: [{ ...memorialGame, location: "North Field" }],
        });
      gameServices.updateGame.mockResolvedValue({
        data: { ...memorialGame, location: "North Field" },
      });

      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit game"]').trigger("click");
      await flushPromises();
      await fillGameForm(wrapper, { location: "North Field" });
      await clickButton(wrapper, "Save Game");

      expect(gameServices.updateGame).toHaveBeenCalledWith(1, {
        seasonId: 1,
        gameDate: "2026-09-12",
        startTime: "18:00",
        location: "North Field",
        homeTeamId: 1,
        visitingTeamId: 2,
        homeTeamScore: null,
        visitingTeamScore: null,
        gameId: 1,
      });
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("North Field");
    });
  });
});

const sixSeasonGames = [1, 2, 3, 4, 5, 6].map((id) => ({
  ...memorialGame,
  id,
  homeTeamId: id % 2 === 0 ? 2 : 1,
  visitingTeamId: id % 2 === 0 ? 1 : 2,
}));

describe("Feature 8 — Create Season Games", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    seasonServices.getSeasons.mockResolvedValue({ data: [fall2026] });
    leagueServices.getLeagues.mockResolvedValue({ data: [soccerLeague] });
    gameServices.getGames.mockResolvedValue({ data: [] });
    gameServices.createGame.mockResolvedValue({ data: memorialGame });
    teamServices.getTeams.mockResolvedValue({ data: [okcStrikers, tulsaFc] });
    seasonServices.createSeason.mockResolvedValue({ data: fall2026 });
    seasonServices.createGames.mockResolvedValue({ data: sixSeasonGames });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-8.1 — Store schedule settings on a season", () => {
    it("User creates a season with schedule settings", async () => {
      seasonServices.getSeasons
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [fall2026] });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(seasonServices.createSeason).toHaveBeenCalledWith({
        name: "2026 Fall",
        startDate: "2026-08-15",
        endDate: "2026-12-15",
        leagueId: 1,
        gameDays: ["saturday"],
        gameTime: "18:00",
        minDaysBetweenGames: 7,
      });
      expect(wrapper.text()).toContain("2026 Fall");
    });

    it("User creates a season with missing schedule settings", async () => {
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper, { gameDays: [] });
      await clickButton(wrapper, "Create");

      expect(seasonServices.createSeason).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });
  });

  describe("US-8.2 — Create games from the season view", () => {
    it("Season view shows Create Games", async () => {
      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Create Games");
    });

    it("User creates games for a season", async () => {
      gameServices.getGames
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: sixSeasonGames });

      const mounted = await mountSeason();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "Create Games");

      expect(seasonServices.createGames).toHaveBeenCalledWith(1);
      expect(wrapper.text()).toContain("OKC Strikers");
      expect(wrapper.findAll("tbody tr")).toHaveLength(6);
    });
  });
});
