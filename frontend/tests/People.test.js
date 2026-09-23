/**
 * Feature 4 — People Management
 * Spec: features/feature-4-people-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import PeopleList from "../src/views/PeopleList.vue";
import PersonForm from "../src/components/PersonForm.vue";
import peopleServices from "../src/services/peopleServices.js";
import userServices from "../src/services/userServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/peopleServices.js", () => ({
  default: {
    getPeople: vi.fn(),
    createPerson: vi.fn(),
    updatePerson: vi.fn(),
    deletePerson: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const janeDoe = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  birthDate: "1990-05-15",
  gender: "female",
  userId: null,
};

const jdoeUser = {
  id: 2,
  username: "jdoe",
  fName: "Jane",
  lName: "Doe",
};

const validPersonForm = (overrides = {}) => ({
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  birthDate: "1990-05-15",
  gender: "female",
  userId: null,
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

const fillPersonForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(PersonForm);
  await form.setValue(validPersonForm(overrides));
};

const mountPeople = async () => {
  const mounted = await mountWithPlugins(PeopleList, {
    attachTo: document.body,
    global: {
      stubs: { VDialog: VDialogStub },
    },
  });
  await flushPromises();
  return mounted;
};

describe("Feature 4 — People Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    peopleServices.getPeople.mockResolvedValue({ data: [] });
    peopleServices.createPerson.mockResolvedValue({ data: janeDoe });
    peopleServices.updatePerson.mockResolvedValue({
      data: { message: "person updated successfully." },
    });
    peopleServices.deletePerson.mockResolvedValue({
      data: { message: "person deleted successfully." },
    });
    userServices.getUsers.mockResolvedValue({ data: [jdoeUser] });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-4.1 — Select to work with People", () => {
    it("Menu Selection", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("People");
      expect(wrapper.text()).toContain("+ New person");
    });
  });

  describe("US-4.2 — Create person", () => {
    it("User creates a new person without a linked user", async () => {
      peopleServices.getPeople
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [janeDoe] });

      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        birthDate: "1990-05-15",
        gender: "female",
        userId: null,
      });
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Doe");
    });

    it("User creates a new person with a linked user", async () => {
      const linked = { ...janeDoe, userId: 2, user: jdoeUser };
      peopleServices.getPeople
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValue({ data: [linked] });
      peopleServices.createPerson.mockResolvedValue({ data: linked });

      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { userId: 2 });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        birthDate: "1990-05-15",
        gender: "female",
        userId: 2,
      });
      expect(wrapper.text()).toContain("jdoe");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
    });

    it("User creates a person with a missing required field", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { gender: "" });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Required");
    });

    it("User creates a person with a first name that is too long", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { firstName: "A".repeat(51) });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("First name must be 50 characters or fewer.");
    });

    it("User creates a person with a last name that is too long", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { lastName: "B".repeat(51) });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Last name must be 50 characters or fewer.");
    });

    it("User creates a person with an invalid email", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { email: "jane.doe" });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Email must be a valid email address.");
    });

    it("User creates a person with an email that is too long", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { email: `${"a".repeat(90)}@example.com` });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Email must be 100 characters or fewer.");
    });

    it("User creates a person with a duplicate email", async () => {
      peopleServices.createPerson.mockRejectedValue({
        response: { data: { message: "Email is already taken." } },
      });

      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper);
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Email is already taken.");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(true);
    });

    it("User creates a person with a birth date in the future", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { birthDate: "2099-05-15" });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Birth date must be in the past.");
    });

    it("User creates a person with an invalid gender", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { gender: "unknown" });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Gender must be male, female, or other.");
    });

    it("User creates a person with a user that is already linked", async () => {
      peopleServices.createPerson.mockRejectedValue({
        response: { data: { message: "User is already linked to a person." } },
      });

      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await clickButton(wrapper, "+ New person");
      await fillPersonForm(wrapper, { userId: 2 });
      await clickButton(wrapper, "Create");

      expect(peopleServices.createPerson).toHaveBeenCalled();
      expect(wrapper.text()).toContain("User is already linked to a person.");
    });
  });

  describe("US-4.3 — View people", () => {
    it("People view loads with existing people", async () => {
      peopleServices.getPeople.mockResolvedValue({
        data: [
          janeDoe,
          {
            id: 2,
            firstName: "Robert",
            lastName: "Smith",
            email: "robert.smith@example.com",
            birthDate: "1988-03-02",
            gender: "male",
            userId: null,
          },
        ],
      });

      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("Doe");
      expect(wrapper.text()).toContain("Smith");
    });

    it("User has no people", async () => {
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No people yet. Create your first person.");
    });
  });

  describe("US-4.4 — Manage person rows", () => {
    it("person rows show edit and delete actions", async () => {
      peopleServices.getPeople.mockResolvedValue({ data: [janeDoe] });
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      expect(wrapper.get('[aria-label="Edit person"]').exists()).toBe(true);
      expect(wrapper.get('[aria-label="Delete person"]').exists()).toBe(true);
    });
  });

  describe("US-4.5 — Edit a person", () => {
    it("User selects to edit a person", async () => {
      peopleServices.getPeople.mockResolvedValue({ data: [janeDoe] });
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit person"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Person");
    });

    it("User edits a person with valid values and saves", async () => {
      peopleServices.getPeople
        .mockResolvedValueOnce({ data: [janeDoe] })
        .mockResolvedValue({
          data: [{ ...janeDoe, firstName: "Janet" }],
        });

      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit person"]').trigger("click");
      await flushPromises();
      await fillPersonForm(wrapper, { firstName: "Janet" });
      await clickButton(wrapper, "Save Person");

      expect(peopleServices.updatePerson).toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Janet");
    });

    it("User edits a person with invalid values and saves", async () => {
      peopleServices.getPeople.mockResolvedValue({ data: [janeDoe] });
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit person"]').trigger("click");
      await flushPromises();
      await fillPersonForm(wrapper, { firstName: "A".repeat(51) });
      await clickButton(wrapper, "Save Person");

      expect(peopleServices.updatePerson).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Edit Person");
      expect(wrapper.text()).toContain("First name must be 50 characters or fewer.");
    });

    it("User edits a person and cancels", async () => {
      peopleServices.getPeople.mockResolvedValue({ data: [janeDoe] });
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit person"]').trigger("click");
      await flushPromises();
      await fillPersonForm(wrapper, { firstName: "Janet" });
      await clickButton(wrapper, "Cancel");

      expect(peopleServices.updatePerson).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Jane");
    });
  });

  describe("US-4.6 — Delete a person", () => {
    it("User selects to delete a person", async () => {
      peopleServices.getPeople.mockResolvedValue({ data: [janeDoe] });
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete person"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Delete this person?");
    });

    it("User deletes a person", async () => {
      peopleServices.getPeople
        .mockResolvedValueOnce({ data: [janeDoe] })
        .mockResolvedValue({ data: [] });

      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete person"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete Person");

      expect(peopleServices.deletePerson).toHaveBeenCalledWith(1);
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).not.toContain("jane.doe@example.com");
    });

    it("User cancels deleting a person", async () => {
      peopleServices.getPeople.mockResolvedValue({ data: [janeDoe] });
      const mounted = await mountPeople();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Delete person"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Cancel");

      expect(peopleServices.deletePerson).not.toHaveBeenCalled();
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
      expect(wrapper.text()).toContain("Doe");
    });
  });
});
