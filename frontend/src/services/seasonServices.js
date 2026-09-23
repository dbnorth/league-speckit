import apiClient from "./services.js";

const seasonServices = {
  getseasons() {
    return apiClient.get("seasons");
  },

  createseason(season) {
    return apiClient.post("seasons", season);
  },

  updateseason(seasonId, season) {
    return apiClient.put(`seasons/${seasonId}`, season);
  },

  deleteseason(seasonId) {
    return apiClient.delete(`seasons/${seasonId}`);
  },

  creategames(seasonId) {
    return apiClient.post(`seasons/${seasonId}/games`);
  },
};

export default seasonServices;
