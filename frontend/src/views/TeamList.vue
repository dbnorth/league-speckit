<script setup>
import { computed, onMounted, ref } from "vue";
import teamServices from "../services/teamServices.js";
import leagueServices from "../services/leagueServices.js";
import peopleServices from "../services/peopleServices.js";
import TeamForm from "../components/TeamForm.vue";
import PlayerForm from "../components/PlayerForm.vue";

const emptyTeamForm = () => ({
  name: "",
  leagueId: null,
});

const emptyPlayerForm = () => ({
  personId: null,
  position: "",
  number: "",
});

const teams = ref([]);
const leagues = ref([]);
const people = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyTeamForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const editingTeam = ref(null);
const deleteDialogOpen = ref(false);
const teamToDelete = ref(null);
const deleting = ref(false);
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

const formTitle = computed(() =>
  isAddMode.value ? "Add Team" : "Edit Team",
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Team",
);
const playerFormTitle = computed(() =>
  isAddPlayerMode.value ? "Add Player" : "Edit Player",
);
const playerSaveLabel = computed(() =>
  isAddPlayerMode.value ? "Add" : "Save Player",
);
const rosterPlayers = computed(() => editingTeam.value?.players ?? []);

const retrieveTeams = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [teamsResponse, leaguesResponse, peopleResponse] = await Promise.all([
      teamServices.getteams(),
      leagueServices.getleagues(),
      peopleServices.getpeople(),
    ]);
    teams.value = teamsResponse.data;
    leagues.value = leaguesResponse.data;
    people.value = peopleResponse.data;

    if (editingId.value) {
      editingTeam.value =
        teams.value.find((team) => team.id === editingId.value) ?? null;
    }
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch teams.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  editingTeam.value = null;
  form.value = emptyTeamForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (team) => {
  isAddMode.value = false;
  editingId.value = team.id;
  editingTeam.value = team;
  form.value = {
    name: team.name ?? "",
    leagueId: team.leagueId ?? null,
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
  editingTeam.value = null;
};

const saveTeam = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    name: form.value.name.trim(),
    leagueId: form.value.leagueId,
  };

  try {
    if (isAddMode.value) {
      await teamServices.createteam(payload);
      closeFormDialog();
    } else {
      await teamServices.updateteam(editingId.value, {
        ...payload,
        teamId: editingId.value,
      });
      closeFormDialog();
    }

    await retrieveTeams();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value ? "Failed to create team." : "Failed to update team.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (team) => {
  teamToDelete.value = team;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  teamToDelete.value = null;
};

const confirmDeleteTeam = async () => {
  if (!teamToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await teamServices.deleteteam(teamToDelete.value.id);
    closeDeleteDialog();
    await retrieveTeams();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete team.";
  } finally {
    deleting.value = false;
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

  if (!result?.valid || !editingId.value) {
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
      await teamServices.createplayer(editingId.value, payload);
    } else {
      await teamServices.updateplayer(
        editingId.value,
        editingPlayerId.value,
        payload,
      );
    }

    closePlayerDialog();
    await retrieveTeams();
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
  if (!playerToRemove.value?.id || !editingId.value) {
    return;
  }

  removingPlayer.value = true;

  try {
    await teamServices.deleteplayer(editingId.value, playerToRemove.value.id);
    closeRemovePlayerDialog();
    await retrieveTeams();
  } catch (error) {
    playerFormError.value =
      error.response?.data?.message || "Failed to remove player.";
  } finally {
    removingPlayer.value = false;
  }
};

onMounted(retrieveTeams);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Teams</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New team
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && teams.length === 0" class="text-body-1">
          No teams yet. Create your first team.
        </p>

        <v-table v-if="!loading && teams.length > 0">
          <thead>
            <tr>
              <th class="text-left">Team name</th>
              <th class="text-left">League</th>
              <th class="text-left">Players</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="team in teams" :key="team.id">
              <td>{{ team.name }}</td>
              <td>{{ team.league?.name }}</td>
              <td>{{ team.players?.length ?? 0 }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit team"
                  @click="openEditDialog(team)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Delete team"
                  @click="openDeleteDialog(team)"
                >
                  mdi-trash-can
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="640">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
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

          <template v-if="!isAddMode">
            <div class="d-flex align-center justify-space-between mt-6 mb-2">
              <div class="text-subtitle-1">Players</div>
              <v-btn
                color="primary"
                variant="elevated"
                class="oc-cta"
                @click="openAddPlayerDialog"
              >
                + Add player
              </v-btn>
            </div>

            <p v-if="rosterPlayers.length === 0" class="text-body-2">
              No players yet. Add the first player.
            </p>

            <v-table v-if="rosterPlayers.length > 0">
              <thead>
                <tr>
                  <th class="text-left">Last name</th>
                  <th class="text-left">First name</th>
                  <th class="text-left">Position</th>
                  <th class="text-left">Number</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="player in rosterPlayers" :key="player.id">
                  <td>{{ player.person?.lastName }}</td>
                  <td>{{ player.person?.firstName }}</td>
                  <td>{{ player.position }}</td>
                  <td>{{ player.number }}</td>
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
            {{ saveLabel }}
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

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Team</v-card-title>
        <v-card-text>Delete this team?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteTeam"
          >
            Delete Team
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
