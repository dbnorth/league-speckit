import apiClient from "./services.js";

const teamServices = {
  getTeams() {
    return apiClient.get("teams");
  },

  createTeam(team) {
    return apiClient.post("teams", team);
  },

  updateTeam(teamId, team) {
    return apiClient.put(`teams/${teamId}`, team);
  },

  deleteTeam(teamId) {
    return apiClient.delete(`teams/${teamId}`);
  },

  getPlayers(teamId) {
    return apiClient.get(`teams/${teamId}/players`);
  },

  createPlayer(teamId, player) {
    return apiClient.post(`teams/${teamId}/players`, player);
  },

  updatePlayer(teamId, playerId, player) {
    return apiClient.put(`teams/${teamId}/players/${playerId}`, player);
  },

  deletePlayer(teamId, playerId) {
    return apiClient.delete(`teams/${teamId}/players/${playerId}`);
  },
};

export default teamServices;
