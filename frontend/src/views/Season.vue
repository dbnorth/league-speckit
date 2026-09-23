<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import seasonServices from "../services/seasonServices.js";
import gameServices from "../services/gameServices.js";
import teamServices from "../services/teamServices.js";
import GameForm from "../components/GameForm.vue";
import { formatDate, toDateInputValue } from "../config/validation.js";

const route = useRoute();

const emptyGameForm = (seasonId) => ({
  seasonId: seasonId ?? null,
  gameDate: "",
  startTime: "",
  location: "",
  homeTeamId: null,
  visitingTeamId: null,
  homeTeamScore: "",
  visitingTeamScore: "",
});

const season = ref(null);
const games = ref([]);
const seasons = ref([]);
const teams = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyGameForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const creatingGames = ref(false);

const formTitle = computed(() => (isAddMode.value ? "Add Game" : "Edit Game"));
const saveLabel = computed(() => (isAddMode.value ? "Create" : "Save Game"));

const seasonId = computed(() => parseInt(route.params.seasonId, 10));

const seasonGames = computed(() =>
  games.value.filter((game) => game.seasonId === seasonId.value)
);

const toTimeInputValue = (value) => {
  if (!value) {
    return "";
  }

  const match = String(value).match(/(\d{2}:\d{2})/);
  return match ? match[1] : String(value);
};

const formatScore = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return value;
};

const optionalScore = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const retrieveSeason = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [seasonsResponse, gamesResponse, teamsResponse] = await Promise.all([
      seasonServices.getseasons(),
      gameServices.getgames(),
      teamServices.getteams(),
    ]);
    seasons.value = seasonsResponse.data;
    games.value = gamesResponse.data;
    teams.value = teamsResponse.data;
    season.value =
      seasonsResponse.data.find((row) => row.id === seasonId.value) ?? null;

    if (!season.value) {
      listError.value = `Season with id=${seasonId.value} not found.`;
    }
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch season.";
  } finally {
    loading.value = false;
  }
};

const createSeasonGames = async () => {
  if (!season.value) {
    return;
  }

  listError.value = "";
  creatingGames.value = true;

  try {
    await seasonServices.creategames(seasonId.value);
    await retrieveSeason();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to create games.";
  } finally {
    creatingGames.value = false;
  }
};

const openAddGameDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyGameForm(seasonId.value);
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditGameDialog = (game) => {
  isAddMode.value = false;
  editingId.value = game.id;
  form.value = {
    seasonId: game.seasonId ?? seasonId.value,
    gameDate: toDateInputValue(game.gameDate),
    startTime: toTimeInputValue(game.startTime),
    location: game.location ?? "",
    homeTeamId: game.homeTeamId ?? null,
    visitingTeamId: game.visitingTeamId ?? null,
    homeTeamScore: game.homeTeamScore ?? "",
    visitingTeamScore: game.visitingTeamScore ?? "",
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveGame = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    seasonId: form.value.seasonId,
    gameDate: form.value.gameDate,
    startTime: form.value.startTime,
    location: isAddMode.value ? null : form.value.location.trim() || null,
    homeTeamId: form.value.homeTeamId,
    visitingTeamId: form.value.visitingTeamId,
    homeTeamScore: optionalScore(form.value.homeTeamScore),
    visitingTeamScore: optionalScore(form.value.visitingTeamScore),
  };

  try {
    if (isAddMode.value) {
      await gameServices.creategame(payload);
    } else {
      await gameServices.updategame(editingId.value, {
        ...payload,
        gameId: editingId.value,
      });
    }
    closeFormDialog();
    await retrieveSeason();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value ? "Failed to create game." : "Failed to update game.");
  } finally {
    saving.value = false;
  }
};

onMounted(retrieveSeason);
watch(() => route.params.seasonId, retrieveSeason);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>{{ season?.name || "Season" }}</v-card-title>
        <v-card-subtitle v-if="season">
          {{ season.league?.name }}
          <template v-if="season.startDate || season.endDate">
            · {{ formatDate(season.startDate) }} – {{ formatDate(season.endDate) }}
          </template>
        </v-card-subtitle>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta mr-2"
            :disabled="!season"
            :loading="creatingGames"
            @click="createSeasonGames"
          >
            Create Games
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :disabled="!season"
            @click="openAddGameDialog"
          >
            Add Games
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <template v-if="!loading && season">
          <p v-if="seasonGames.length === 0" class="text-body-1">
            No games yet. Add the first game.
          </p>

          <v-table v-if="seasonGames.length > 0">
            <thead>
              <tr>
                <th class="text-left">Date</th>
                <th class="text-left">Start time</th>
                <th class="text-left">Location</th>
                <th class="text-left">Home team</th>
                <th class="text-left">Visiting team</th>
                <th class="text-left">Home score</th>
                <th class="text-left">Visiting score</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="game in seasonGames" :key="game.id">
                <td>{{ formatDate(game.gameDate) }}</td>
                <td>{{ toTimeInputValue(game.startTime) }}</td>
                <td>{{ game.location }}</td>
                <td>{{ game.homeTeam?.name }}</td>
                <td>{{ game.visitingTeam?.name }}</td>
                <td>{{ formatScore(game.homeTeamScore) }}</td>
                <td>{{ formatScore(game.visitingTeamScore) }}</td>
                <td>
                  <v-icon
                    size="small"
                    class="mx-4"
                    aria-label="Edit game"
                    @click="openEditGameDialog(game)"
                  >
                    mdi-pencil
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="560">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <GameForm
            ref="formRef"
            v-model="form"
            :seasons="seasons"
            :teams="teams"
            :show-location="!isAddMode"
            @submit="saveGame"
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
            @click="saveGame"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
