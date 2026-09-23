import apiClient from "./services.js";

const seasonServices = {
  getSeasons() {
    return apiClient.get("seasons");
  },

  createSeason(season) {
    return apiClient.post("seasons", season);
  },

  updateSeason(seasonId, season) {
    return apiClient.put(`seasons/${seasonId}`, season);
  },

  deleteSeason(seasonId) {
    return apiClient.delete(`seasons/${seasonId}`);
  },

  createGames(seasonId) {
    return apiClient.post(`seasons/${seasonId}/games`);
  },
};

export default seasonServices;
