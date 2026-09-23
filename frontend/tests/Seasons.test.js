/**
 * Feature 2 — Season Management
 * Spec: features/feature-2-season-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import SeasonList from "../src/views/SeasonList.vue";
import SeasonForm from "../src/components/SeasonForm.vue";
import seasonServices from "../src/services/seasonServices.js";
import leagueServices from "../src/services/leagueServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/seasonServices.js", () => ({
  default: {
    getseasons: vi.fn(),
    createseason: vi.fn(),
    updateseason: vi.fn(),
    deleteseason: vi.fn(),
  },
}));

vi.mock("../src/services/leagueServices.js", () => ({
  default: {
    getleagues: vi.fn(),
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

const validSeasonForm = (overrides = {}) => ({
  name: "2026 Fall",
  startDate: "2026-08-15",
  endDate: "2026-12-15",
  leagueId: 1,
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

const fillSeasonForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(SeasonForm);
  await form.setValue(validSeasonForm(overrides));
};

const mountSeasons = async () => {
  const mounted = await mountWithPlugins(SeasonList, {
    attachTo: document.body,
    global: {
      stubs: { VDialog: VDialogStub },
    },
  });
  await flushPromises();
  return mounted;
};

describe("Feature 2 — Season Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    seasonServices.getseasons.mockResolvedValue({ data: [] });
    seasonServices.createseason.mockResolvedValue({ data: fall2026 });
    seasonServices.updateseason.mockResolvedValue({ data: fall2026 });
    seasonServices.deleteseason.mockResolvedValue({ data: { message: "season deleted successfully." } });
    leagueServices.getleagues.mockResolvedValue({ data: [soccerLeague] });
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
      seasonServices.getseasons
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [fall2026] });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New season");
      await fillSeasonForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(seasonServices.createseason).toHaveBeenCalledWith({
        name: "2026 Fall",
        startDate: "2026-08-15",
        endDate: "2026-12-15",
        leagueId: 1,
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

      expect(seasonServices.createseason).not.toHaveBeenCalled();
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

      expect(seasonServices.createseason).not.toHaveBeenCalled();
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

      expect(seasonServices.createseason).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("End date must be after start date.");
    });

    it("User creates a season with a duplicate name", async () => {
      seasonServices.createseason.mockRejectedValue({
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

      expect(seasonServices.createseason).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Season name is already taken in this league.");
      expect(wrapper.text()).toContain("+ New season");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    });
  });

  describe("US-2.3 — View seasons", () => {
    it("Seasons view loads with existing seasons", async () => {
      seasonServices.getseasons.mockResolvedValue({
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
      seasonServices.getseasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Edit season"]').exists()).toBe(true);
      expect(wrapper.get('[aria-label="Delete season"]').exists()).toBe(true);
    });
  });

  describe("US-2.5 — Edit a season", () => {
    it("User selects to edit a season", async () => {
      seasonServices.getseasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit season"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Season");
    });

    it("User edits a season with valid values and saves", async () => {
      seasonServices.getseasons
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

      expect(seasonServices.updateseason).toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2027 Spring");
    });

    it("User edits a season with invalid values and saves", async () => {
      seasonServices.getseasons.mockResolvedValue({ data: [fall2026] });
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

      expect(seasonServices.updateseason).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Edit Season");
      expect(wrapper.text()).toContain(
        "Season name must be 30 characters or fewer."
      );
    });

    it("User edits a season and cancels", async () => {
      seasonServices.getseasons.mockResolvedValue({ data: [fall2026] });
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

      expect(seasonServices.updateseason).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2026 Fall");
    });
  });

  describe("US-2.6 — Delete a season", () => {
    it("User selects to delete a season", async () => {
      seasonServices.getseasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete season"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Delete this season?");
    });

    it("User deletes a season", async () => {
      seasonServices.getseasons
        .mockResolvedValueOnce({ data: [fall2026] })
        .mockResolvedValue({ data: [] });

      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete season"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete Season");

      expect(seasonServices.deleteseason).toHaveBeenCalledWith(1);
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("2026 Fall");
    });

    it("User cancels deleting a season", async () => {
      seasonServices.getseasons.mockResolvedValue({ data: [fall2026] });
      const mounted = await mountSeasons();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete season"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Cancel");

      expect(seasonServices.deleteseason).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("2026 Fall");
    });
  });
});
