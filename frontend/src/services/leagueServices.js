import apiClient from "./services.js";

const leagueServices = {
  getLeagues() {
    return apiClient.get("leagues");
  },

  createLeague(league) {
    return apiClient.post("leagues", league);
  },

  updateLeague(leagueId, league) {
    return apiClient.put(`leagues/${leagueId}`, league);
  },

  deleteLeague(leagueId) {
    return apiClient.delete(`leagues/${leagueId}`);
  },
};

export default leagueServices;
