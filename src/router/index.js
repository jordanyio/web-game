// src/router/index.js

import Vue from 'vue';
import Router from 'vue-router';
import ConnectFour from '@/components/ConnectFour.vue';
import HomePage from '@/components/HomePage.vue'

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomePage,
    },
    {
      path: '/LiveGame:matchNumber',
      name: 'LiveGame',
      component: ConnectFour,
      props: true
    },
  ],
});
