import apiClient from "./services.js";

const peopleServices = {
  getPeople() {
    return apiClient.get("people");
  },

  createPerson(person) {
    return apiClient.post("people", person);
  },

  updatePerson(personId, person) {
    return apiClient.put(`people/${personId}`, person);
  },

  deletePerson(personId) {
    return apiClient.delete(`people/${personId}`);
  },
};

export default peopleServices;
