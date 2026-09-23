import apiClient from "./services.js";

const gameServices = {
  getgames() {
    return apiClient.get("games");
  },

  creategame(game) {
    return apiClient.post("games", game);
  },

  updategame(gameId, game) {
    return apiClient.put(`games/${gameId}`, game);
  },

  deletegame(gameId) {
    return apiClient.delete(`games/${gameId}`);
  },
};

export default gameServices;
