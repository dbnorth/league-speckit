import apiClient from "./services.js";

const teamServices = {
  getteams() {
    return apiClient.get("teams");
  },

  createteam(team) {
    return apiClient.post("teams", team);
  },

  updateteam(teamId, team) {
    return apiClient.put(`teams/${teamId}`, team);
  },

  deleteteam(teamId) {
    return apiClient.delete(`teams/${teamId}`);
  },

  getplayers(teamId) {
    return apiClient.get(`teams/${teamId}/players`);
  },

  createplayer(teamId, player) {
    return apiClient.post(`teams/${teamId}/players`, player);
  },

  updateplayer(teamId, playerId, player) {
    return apiClient.put(`teams/${teamId}/players/${playerId}`, player);
  },

  deleteplayer(teamId, playerId) {
    return apiClient.delete(`teams/${teamId}/players/${playerId}`);
  },
};

export default teamServices;
