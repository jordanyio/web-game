// src/store.js
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    // Define your global variables here
    username: localStorage.getItem('username')
  },
  mutations: {
    // Mutations to change your state
    updateUsername(state, newValue) {
      state.username = newValue;
    }
  },

  getters: {
    // Getters to access the state
    getUsername: state => state.username
  }
});
