<script setup>
import { computed, onMounted, ref } from "vue";
import leagueServices from "../services/leagueServices.js";
import LeagueForm from "../components/LeagueForm.vue";

const emptyForm = () => ({
  name: "",
  sport: "",
});

const leagues = ref([]);
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
const leagueToDelete = ref(null);
const deleting = ref(false);

const formTitle = computed(() =>
  isAddMode.value ? "Add League" : "Edit League",
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save League",
);

const retrieveLeagues = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const response = await leagueServices.getLeagues();
    leagues.value = response.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch leagues.";
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

const openEditDialog = (league) => {
  isAddMode.value = false;
  editingId.value = league.id;
  form.value = {
    name: league.name ?? "",
    sport: league.sport ?? "",
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveLeague = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    name: form.value.name.trim(),
    sport: form.value.sport,
  };

  try {
    if (isAddMode.value) {
      await leagueServices.createLeague(payload);
    } else {
      await leagueServices.updateLeague(editingId.value, {
        ...payload,
        leagueId: editingId.value,
      });
    }

    closeFormDialog();
    await retrieveLeagues();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create league."
        : "Failed to update league.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (league) => {
  leagueToDelete.value = league;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  leagueToDelete.value = null;
};

const confirmDeleteLeague = async () => {
  if (!leagueToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await leagueServices.deleteLeague(leagueToDelete.value.id);
    closeDeleteDialog();
    await retrieveLeagues();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete league.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveLeagues);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Leagues</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New league
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && leagues.length === 0" class="text-body-1">
          No leagues yet. Create your first league.
        </p>

        <v-table v-if="!loading && leagues.length > 0">
          <thead>
            <tr>
              <th class="text-left">League name</th>
              <th class="text-left">Sport</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="league in leagues" :key="league.id">
              <td>{{ league.name }}</td>
              <td>{{ league.sport }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit league"
                  @click="openEditDialog(league)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Delete league"
                  @click="openDeleteDialog(league)"
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
          <LeagueForm ref="formRef" v-model="form" @submit="saveLeague" />
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
            @click="saveLeague"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete League</v-card-title>
        <v-card-text>Delete this league?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteLeague"
          >
            Delete League
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
