<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import teamServices from "../services/teamServices.js";
import leagueServices from "../services/leagueServices.js";
import peopleServices from "../services/peopleServices.js";
import TeamForm from "../components/TeamForm.vue";
import PlayerForm from "../components/PlayerForm.vue";

const route = useRoute();

const emptyTeamForm = () => ({
  name: "",
  leagueId: null,
  homeField: "",
});

const emptyPlayerForm = () => ({
  personId: null,
  position: "",
  number: "",
});

const team = ref(null);
const leagues = ref([]);
const people = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const form = ref(emptyTeamForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const playerDialogOpen = ref(false);
const isAddPlayerMode = ref(true);
const playerForm = ref(emptyPlayerForm());
const playerFormRef = ref(null);
const playerFormError = ref("");
const savingPlayer = ref(false);
const editingPlayerId = ref(null);
const removePlayerDialogOpen = ref(false);
const playerToRemove = ref(null);
const removingPlayer = ref(false);

const teamId = computed(() => parseInt(route.params.teamId, 10));
const playerFormTitle = computed(() =>
  isAddPlayerMode.value ? "Add Player" : "Edit Player",
);
const playerSaveLabel = computed(() =>
  isAddPlayerMode.value ? "Add" : "Save Player",
);
const rosterPlayers = computed(() => team.value?.players ?? []);

const playerName = (player) => {
  const lastName = player.person?.lastName ?? "";
  const firstName = player.person?.firstName ?? "";
  return `${lastName}, ${firstName}`.trim();
};

const retrieveTeam = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [teamsResponse, leaguesResponse, peopleResponse] = await Promise.all([
      teamServices.getteams(),
      leagueServices.getleagues(),
      peopleServices.getpeople(),
    ]);
    leagues.value = leaguesResponse.data;
    people.value = peopleResponse.data;
    team.value =
      teamsResponse.data.find((row) => row.id === teamId.value) ?? null;

    if (!team.value) {
      listError.value = `Team with id=${teamId.value} not found.`;
    }
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch team.";
  } finally {
    loading.value = false;
  }
};

const openEditDialog = () => {
  if (!team.value) {
    return;
  }

  form.value = {
    name: team.value.name ?? "",
    leagueId: team.value.leagueId ?? null,
    homeField: team.value.homeField ?? "",
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
};

const saveTeam = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid || !team.value) {
    return;
  }

  saving.value = true;

  try {
    await teamServices.updateteam(team.value.id, {
      name: form.value.name.trim(),
      leagueId: form.value.leagueId,
      homeField: form.value.homeField.trim(),
      teamId: team.value.id,
    });
    closeFormDialog();
    await retrieveTeam();
  } catch (error) {
    formError.value =
      error.response?.data?.message || "Failed to update team.";
  } finally {
    saving.value = false;
  }
};

const openAddPlayerDialog = () => {
  isAddPlayerMode.value = true;
  editingPlayerId.value = null;
  playerForm.value = emptyPlayerForm();
  playerFormError.value = "";
  playerDialogOpen.value = true;
};

const openEditPlayerDialog = (player) => {
  isAddPlayerMode.value = false;
  editingPlayerId.value = player.id;
  playerForm.value = {
    personId: player.personId ?? null,
    position: player.position ?? "",
    number: player.number,
  };
  playerFormError.value = "";
  playerDialogOpen.value = true;
};

const closePlayerDialog = () => {
  playerDialogOpen.value = false;
  playerFormError.value = "";
  editingPlayerId.value = null;
};

const savePlayer = async () => {
  playerFormError.value = "";
  const result = await playerFormRef.value?.validate();

  if (!result?.valid || !team.value) {
    return;
  }

  savingPlayer.value = true;

  const payload = {
    personId: playerForm.value.personId,
    position: String(playerForm.value.position).trim(),
    number: parseInt(playerForm.value.number, 10),
  };

  try {
    if (isAddPlayerMode.value) {
      await teamServices.createplayer(team.value.id, payload);
    } else {
      await teamServices.updateplayer(
        team.value.id,
        editingPlayerId.value,
        payload,
      );
    }

    closePlayerDialog();
    await retrieveTeam();
  } catch (error) {
    playerFormError.value =
      error.response?.data?.message ||
      (isAddPlayerMode.value
        ? "Failed to add player."
        : "Failed to update player.");
  } finally {
    savingPlayer.value = false;
  }
};

const openRemovePlayerDialog = (player) => {
  playerToRemove.value = player;
  removePlayerDialogOpen.value = true;
};

const closeRemovePlayerDialog = () => {
  removePlayerDialogOpen.value = false;
  playerToRemove.value = null;
};

const confirmRemovePlayer = async () => {
  if (!playerToRemove.value?.id || !team.value) {
    return;
  }

  removingPlayer.value = true;

  try {
    await teamServices.deleteplayer(team.value.id, playerToRemove.value.id);
    closeRemovePlayerDialog();
    await retrieveTeam();
  } catch (error) {
    playerFormError.value =
      error.response?.data?.message || "Failed to remove player.";
  } finally {
    removingPlayer.value = false;
  }
};

onMounted(retrieveTeam);
watch(() => route.params.teamId, retrieveTeam);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>{{ team?.name || "Team" }}</v-card-title>
        <v-card-subtitle v-if="team">
          {{ team.league?.name }}
          <template v-if="team.league?.sport">
            · {{ team.league.sport }}
          </template>
          <template v-if="team.homeField">
            · {{ team.homeField }}
          </template>
        </v-card-subtitle>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta mr-2"
            :disabled="!team"
            @click="openEditDialog"
          >
            Edit team
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :disabled="!team"
            @click="openAddPlayerDialog"
          >
            Add Players
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <template v-if="!loading && team">
          <p v-if="rosterPlayers.length === 0" class="text-body-1">
            No players yet. Add the first player.
          </p>

          <v-table v-if="rosterPlayers.length > 0">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Number</th>
                <th class="text-left">Position</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in rosterPlayers" :key="player.id">
                <td>{{ playerName(player) }}</td>
                <td>{{ player.number }}</td>
                <td>{{ player.position }}</td>
                <td>
                  <v-icon
                    size="small"
                    class="mx-4"
                    aria-label="Edit player"
                    @click="openEditPlayerDialog(player)"
                  >
                    mdi-pencil
                  </v-icon>
                  <v-icon
                    size="small"
                    class="mx-4"
                    aria-label="Remove player"
                    @click="openRemovePlayerDialog(player)"
                  >
                    mdi-trash-can
                  </v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>Edit Team</v-card-title>
        <v-card-text>
          <TeamForm
            ref="formRef"
            v-model="form"
            :leagues="leagues"
            @submit="saveTeam"
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
            @click="saveTeam"
          >
            Save Team
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="playerDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>{{ playerFormTitle }}</v-card-title>
        <v-card-text>
          <PlayerForm
            ref="playerFormRef"
            v-model="playerForm"
            :people="people"
            @submit="savePlayer"
          />
          <v-alert
            v-if="playerFormError"
            type="error"
            density="compact"
            class="mt-2"
          >
            {{ playerFormError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closePlayerDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingPlayer"
            @click="savePlayer"
          >
            {{ playerSaveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="removePlayerDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Remove Player</v-card-title>
        <v-card-text>Remove this player from the team?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeRemovePlayerDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="removingPlayer"
            @click="confirmRemovePlayer"
          >
            Remove Player
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
