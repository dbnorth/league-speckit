import apiClient from "./services.js";

const peopleServices = {
  getpeople() {
    return apiClient.get("people");
  },

  createperson(person) {
    return apiClient.post("people", person);
  },

  updateperson(personId, person) {
    return apiClient.put(`people/${personId}`, person);
  },

  deleteperson(personId) {
    return apiClient.delete(`people/${personId}`);
  },
};

export default peopleServices;
