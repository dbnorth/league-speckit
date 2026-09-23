import apiClient from "./services.js";

const leagueServices = {
  getleagues() {
    return apiClient.get("leagues");
  },

  createleague(league) {
    return apiClient.post("leagues", league);
  },

  updateleague(leagueId, league) {
    return apiClient.put(`leagues/${leagueId}`, league);
  },

  deleteleague(leagueId) {
    return apiClient.delete(`leagues/${leagueId}`);
  },
};

export default leagueServices;
