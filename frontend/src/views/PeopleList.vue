<script setup>
import { computed, onMounted, ref } from "vue";
import peopleServices from "../services/peopleServices.js";
import userServices from "../services/userServices.js";
import PersonForm from "../components/PersonForm.vue";

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  gender: "",
  userId: null,
});

const people = ref([]);
const users = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const deleteDialogOpen = ref(false);
const personToDelete = ref(null);
const deleting = ref(false);

const formTitle = computed(() =>
  isAddMode.value ? "Add Person" : "Edit Person",
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Person",
);

const usernameFor = (person) =>
  person.user?.username ??
  users.value.find((user) => user.id === person.userId)?.username ??
  "";

const retrievePeople = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [peopleResponse, usersResponse] = await Promise.all([
      peopleServices.getPeople(),
      userServices.getUsers(),
    ]);
    people.value = peopleResponse.data;
    users.value = usersResponse.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch people.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (person) => {
  isAddMode.value = false;
  editingId.value = person.id;
  form.value = {
    firstName: person.firstName ?? "",
    lastName: person.lastName ?? "",
    email: person.email ?? "",
    birthDate: String(person.birthDate ?? "").slice(0, 10),
    gender: person.gender ?? "",
    userId: person.userId ?? null,
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const savePerson = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName.trim(),
    email: form.value.email.trim(),
    birthDate: form.value.birthDate,
    gender: form.value.gender,
    userId: form.value.userId || null,
  };

  try {
    if (isAddMode.value) {
      await peopleServices.createPerson(payload);
    } else {
      await peopleServices.updatePerson(editingId.value, {
        ...payload,
        personId: editingId.value,
      });
    }

    closeFormDialog();
    await retrievePeople();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create person."
        : "Failed to update person.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (person) => {
  personToDelete.value = person;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  personToDelete.value = null;
};

const confirmDeletePerson = async () => {
  if (!personToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await peopleServices.deletePerson(personToDelete.value.id);
    closeDeleteDialog();
    await retrievePeople();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete person.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrievePeople);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>People</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New person
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && people.length === 0" class="text-body-1">
          No people yet. Create your first person.
        </p>

        <v-table v-if="!loading && people.length > 0">
          <thead>
            <tr>
              <th class="text-left">Last name</th>
              <th class="text-left">First name</th>
              <th class="text-left">Email</th>
              <th class="text-left">Gender</th>
              <th class="text-left">User</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in people" :key="person.id">
              <td>{{ person.lastName }}</td>
              <td>{{ person.firstName }}</td>
              <td>{{ person.email }}</td>
              <td>{{ person.gender }}</td>
              <td>{{ usernameFor(person) }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit person"
                  @click="openEditDialog(person)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Delete person"
                  @click="openDeleteDialog(person)"
                >
                  mdi-trash-can
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <PersonForm
            ref="formRef"
            v-model="form"
            :users="users"
            @submit="savePerson"
          />
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">
            {{ formError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="savePerson"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Person</v-card-title>
        <v-card-text>Delete this person?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeletePerson"
          >
            Delete Person
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
