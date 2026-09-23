<script setup>
import { computed, onMounted, ref } from "vue";
import seasonServices from "../services/seasonServices.js";
import SeasonForm from "../components/SeasonForm.vue";
import { toDateInputValue, formatDate } from "../config/validation.js";

const emptyForm = () => ({
  name: "",
  startDate: "",
  endDate: "",
});

const seasons = ref([]);
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
const seasonToDelete = ref(null);
const deleting = ref(false);

const formTitle = computed(() =>
  isAddMode.value ? "Add Season" : "Edit Season"
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Season"
);

const retrieveSeasons = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const response = await seasonServices.getseasons();
    seasons.value = response.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch seasons.";
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

const openEditDialog = (season) => {
  isAddMode.value = false;
  editingId.value = season.id;
  form.value = {
    name: season.name ?? "",
    startDate: toDateInputValue(season.startDate),
    endDate: toDateInputValue(season.endDate),
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveSeason = async () => {
  formError.value = "";
  const { valid } = await formRef.value.validate();

  if (!valid) {
    return;
  }

  saving.value = true;

  const payload = {
    name: form.value.name.trim(),
    startDate: form.value.startDate,
    endDate: form.value.endDate,
  };

  try {
    if (isAddMode.value) {
      await seasonServices.createseason(payload);
    } else {
      await seasonServices.updateseason(editingId.value, {
        ...payload,
        seasonId: editingId.value,
      });
    }

    closeFormDialog();
    await retrieveSeasons();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create season."
        : "Failed to update season.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (season) => {
  seasonToDelete.value = season;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  seasonToDelete.value = null;
};

const confirmDeleteSeason = async () => {
  if (!seasonToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await seasonServices.deleteseason(seasonToDelete.value.id);
    closeDeleteDialog();
    await retrieveSeasons();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete season.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveSeasons);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Seasons</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New season
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert
          v-if="listError"
          type="error"
          density="compact"
          class="mb-4"
        >
          {{ listError }}
        </v-alert>

        <p v-if="!loading && seasons.length === 0" class="text-body-1">
          No seasons yet. Create your first season.
        </p>

        <v-table v-if="!loading && seasons.length > 0">
          <thead>
            <tr>
              <th class="text-left">Season name</th>
              <th class="text-left">Start date</th>
              <th class="text-left">End date</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="season in seasons" :key="season.id">
              <td>{{ season.name }}</td>
              <td>{{ formatDate(season.startDate) }}</td>
              <td>{{ formatDate(season.endDate) }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit season"
                  @click="openEditDialog(season)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Delete season"
                  @click="openDeleteDialog(season)"
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
          <SeasonForm ref="formRef" v-model="form" @submit="saveSeason" />
          <v-alert
            v-if="formError"
            type="error"
            density="compact"
            class="mt-2"
          >
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
            @click="saveSeason"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Season</v-card-title>
        <v-card-text>Delete this season?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteSeason"
          >
            Delete Season
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
