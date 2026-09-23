/**
 * Feature 5 — Team Management
 * Spec: features/feature-5-team-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import TeamList from "../src/views/TeamList.vue";
import Team from "../src/views/Team.vue";
import TeamForm from "../src/components/TeamForm.vue";
import PlayerForm from "../src/components/PlayerForm.vue";
import teamServices from "../src/services/teamServices.js";
import leagueServices from "../src/services/leagueServices.js";
import peopleServices from "../src/services/peopleServices.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/teamServices.js", () => ({
  default: {
    getTeams: vi.fn(),
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    getPlayers: vi.fn(),
    createPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    deletePlayer: vi.fn(),
  },
}));

vi.mock("../src/services/leagueServices.js", () => ({
  default: {
    getLeagues: vi.fn(),
  },
}));

vi.mock("../src/services/peopleServices.js", () => ({
  default: {
    getPeople: vi.fn(),
  },
}));

const soccerLeague = {
  id: 1,
  name: "OKC Youth Soccer",
  sport: "soccer",
};

const janeDoe = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  birthDate: "1990-05-15",
  gender: "female",
  userId: null,
};

const janePlayer = {
  id: 1,
  teamId: 1,
  personId: 1,
  position: "Forward",
  number: 10,
  person: { id: 1, firstName: "Jane", lastName: "Doe" },
};

const strikers = {
  id: 1,
  name: "OKC Strikers",
  leagueId: 1,
  homeField: "Memorial Field",
  league: soccerLeague,
  players: [],
};

const strikersWithJane = {
  ...strikers,
  players: [janePlayer],
};

const validTeamForm = (overrides = {}) => ({
  name: "OKC Strikers",
  leagueId: 1,
  homeField: "Memorial Field",
  ...overrides,
});

const validPlayerForm = (overrides = {}) => ({
  personId: 1,
  position: "Forward",
  number: 10,
  ...overrides,
});

const VDialogStub = {
  name: "VDialog",
  props: { modelValue: Boolean },
  template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
};

const clickExactButton = async (wrapper, label) => {
  const button = wrapper
    .findAll("button")
    .find((item) => item.text().trim() === label);
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
};

const fillTeamForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(TeamForm);
  await form.setValue(validTeamForm(overrides));
};

const fillPlayerForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(PlayerForm);
  await form.setValue(validPlayerForm(overrides));
};

const mountOptions = {
  attachTo: document.body,
  global: {
    stubs: { VDialog: VDialogStub },
  },
};

const mountTeams = async () => {
  const mounted = await mountWithPlugins(TeamList, mountOptions);
  await flushPromises();
  return mounted;
};

const mountTeam = async () => {
  const router = await createTestRouter("/teams/1");
  const mounted = await mountWithPlugins(Team, {
    ...mountOptions,
    router,
  });
  await flushPromises();
  return mounted;
};

describe("Feature 5 — Team Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    teamServices.getTeams.mockResolvedValue({ data: [] });
    teamServices.createTeam.mockResolvedValue({ data: strikers });
    teamServices.updateTeam.mockResolvedValue({
      data: { message: "team updated successfully." },
    });
    teamServices.deleteTeam.mockResolvedValue({
      data: { message: "team deleted successfully." },
    });
    teamServices.createPlayer.mockResolvedValue({ data: janePlayer });
    teamServices.updatePlayer.mockResolvedValue({
      data: { message: "player updated successfully." },
    });
    teamServices.deletePlayer.mockResolvedValue({
      data: { message: "player deleted successfully." },
    });
    leagueServices.getLeagues.mockResolvedValue({ data: [soccerLeague] });
    peopleServices.getPeople.mockResolvedValue({ data: [janeDoe] });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-5.1 — Select to work with Teams", () => {
    it("Menu Selection", async () => {
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Teams");
      expect(wrapper.text()).toContain("+ New team");
    });
  });

  describe("US-5.2 — Create team", () => {
    it("User creates a new team", async () => {
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [strikers] });

      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "+ New team");
      await fillTeamForm(wrapper);
      await clickExactButton(wrapper, "Create");

      expect(teamServices.createTeam).toHaveBeenCalledWith({
        name: "OKC Strikers",
        leagueId: 1,
        homeField: "Memorial Field",
      });
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC Strikers");
    });

    it("User creates a team with a missing required field", async () => {
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "+ New team");
      await fillTeamForm(wrapper, { leagueId: null });
      await clickExactButton(wrapper, "Create");

      expect(teamServices.createTeam).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });

    it("User creates a team with a name that is too long", async () => {
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "+ New team");
      await fillTeamForm(wrapper, { name: "A".repeat(51) });
      await clickExactButton(wrapper, "Create");

      expect(teamServices.createTeam).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Team name must be 50 characters or fewer.");
    });

    it("User creates a team with a duplicate name in the same league", async () => {
      teamServices.createTeam.mockRejectedValue({
        response: {
          data: { message: "Team name is already taken in this league." },
        },
      });

      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "+ New team");
      await fillTeamForm(wrapper);
      await clickExactButton(wrapper, "Create");

      expect(teamServices.createTeam).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Team name is already taken in this league.");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    });
  });

  describe("US-5.3 — View teams", () => {
    it("Teams view loads with existing teams", async () => {
      teamServices.getTeams.mockResolvedValue({
        data: [
          strikers,
          {
            id: 2,
            name: "Metro Sluggers",
            leagueId: 2,
            league: { id: 2, name: "Metro Baseball", sport: "baseball" },
            players: [],
          },
        ],
      });

      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("OKC Strikers");
      expect(wrapper.text()).toContain("Metro Sluggers");
    });

    it("User has no teams", async () => {
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No teams yet. Create your first team.");
    });
  });

  describe("US-5.4 — Manage team rows", () => {
    it("team rows open the team view and show a delete action", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      expect(wrapper.find("a").exists()).toBe(false);
      expect(wrapper.get('[aria-label="Open team"]').exists()).toBe(true);
      expect(wrapper.get('[aria-label="Delete team"]').exists()).toBe(true);
    });
  });

  describe("US-5.10 — View a team", () => {
    it("User opens a team from the teams list", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Open team"]').trigger("click");
      await flushPromises();

      expect(mounted.router.currentRoute.value.name).toBe("team");
      expect(mounted.router.currentRoute.value.params.teamId).toBe("1");
    });

    it("Team view shows team info and actions", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("OKC Strikers");
      expect(wrapper.text()).toContain("OKC Youth Soccer");
      expect(wrapper.text()).toContain("Edit team");
      expect(wrapper.text()).toContain("Add Players");
    });

    it("Team view lists players with name, number, and position", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikersWithJane] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Doe, Jane");
      expect(wrapper.text()).toContain("10");
      expect(wrapper.text()).toContain("Forward");
      expect(wrapper.get('[aria-label="Edit player"]').exists()).toBe(true);
    });
  });

  describe("US-5.5 — Edit a team", () => {
    it("User selects to edit a team", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Edit team");

      expect(wrapper.text()).toContain("Edit Team");
    });

    it("User edits a team with valid values and saves", async () => {
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikers] })
        .mockResolvedValue({
          data: [{ ...strikers, name: "OKC United" }],
        });

      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Edit team");
      await fillTeamForm(wrapper, { name: "OKC United" });
      await clickExactButton(wrapper, "Save Team");

      expect(teamServices.updateTeam).toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC United");
    });

    it("User edits a team with invalid values and saves", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Edit team");
      await fillTeamForm(wrapper, { name: "A".repeat(51) });
      await clickExactButton(wrapper, "Save Team");

      expect(teamServices.updateTeam).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Edit Team");
      expect(wrapper.text()).toContain("Team name must be 50 characters or fewer.");
    });

    it("User edits a team and cancels", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Edit team");
      await fillTeamForm(wrapper, { name: "OKC United" });
      await clickExactButton(wrapper, "Cancel");

      expect(teamServices.updateTeam).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC Strikers");
    });
  });

  describe("US-5.6 — Delete a team", () => {
    it("User selects to delete a team", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete team"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Delete this team?");
    });

    it("User deletes a team", async () => {
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikers] })
        .mockResolvedValue({ data: [] });

      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete team"]').trigger("click");
      await flushPromises();
      await clickExactButton(wrapper, "Delete Team");

      expect(teamServices.deleteTeam).toHaveBeenCalledWith(1);
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("OKC Strikers");
    });

    it("User cancels deleting a team", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeams();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete team"]').trigger("click");
      await flushPromises();
      await clickExactButton(wrapper, "Cancel");

      expect(teamServices.deleteTeam).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("OKC Strikers");
    });
  });

  describe("US-5.8 — Manage team players", () => {
    it("User adds a player to a team", async () => {
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikers] })
        .mockResolvedValue({ data: [strikersWithJane] });

      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Add Players");
      await fillPlayerForm(wrapper);
      await clickExactButton(wrapper, "Add");

      expect(teamServices.createPlayer).toHaveBeenCalledWith(1, {
        personId: 1,
        position: "Forward",
        number: 10,
      });
      expect(wrapper.text()).toContain("Doe, Jane");
      expect(wrapper.text()).toContain("10");
      expect(wrapper.text()).toContain("Forward");
    });

    it("User selects to add a player", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Add Players");

      expect(wrapper.text()).toContain("Add Player");
    });

    it("User adds a player with a missing required field", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Add Players");
      await fillPlayerForm(wrapper, { position: "" });
      await clickExactButton(wrapper, "Add");

      expect(teamServices.createPlayer).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });

    it("User adds a player who is already on the team", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikersWithJane] });
      teamServices.createPlayer.mockRejectedValue({
        response: { data: { message: "Person is already on this team." } },
      });

      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Add Players");
      await fillPlayerForm(wrapper);
      await clickExactButton(wrapper, "Add");

      expect(teamServices.createPlayer).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Person is already on this team.");
    });

    it("User adds a player with a number that is already taken on the team", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikersWithJane] });
      teamServices.createPlayer.mockRejectedValue({
        response: {
          data: { message: "Player number is already taken on this team." },
        },
      });

      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Add Players");
      await fillPlayerForm(wrapper, { personId: 2, number: 10 });
      await clickExactButton(wrapper, "Add");

      expect(teamServices.createPlayer).toHaveBeenCalled();
      expect(wrapper.text()).toContain(
        "Player number is already taken on this team."
      );
    });

    it("User selects to edit a player", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikersWithJane] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit player"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Player");
    });

    it("User edits a player with valid values and saves", async () => {
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikersWithJane] })
        .mockResolvedValue({
          data: [
            {
              ...strikersWithJane,
              players: [{ ...janePlayer, position: "Midfield", number: 8 }],
            },
          ],
        });

      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit player"]').trigger("click");
      await flushPromises();
      await fillPlayerForm(wrapper, { position: "Midfield", number: 8 });
      await clickExactButton(wrapper, "Save Player");

      expect(teamServices.updatePlayer).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Midfield");
      expect(wrapper.text()).toContain("8");
    });

    it("User removes a player from a team", async () => {
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikersWithJane] })
        .mockResolvedValue({ data: [strikers] });

      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Remove player"]').trigger("click");
      await flushPromises();
      await clickExactButton(wrapper, "Remove Player");

      expect(teamServices.deletePlayer).toHaveBeenCalledWith(1, 1);
      expect(wrapper.text()).toContain("No players yet. Add the first player.");
    });

    it("Team with no players shows empty roster", async () => {
      teamServices.getTeams.mockResolvedValue({ data: [strikers] });
      const mounted = await mountTeam();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No players yet. Add the first player.");
    });
  });
});
