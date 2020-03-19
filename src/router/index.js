import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';

Vue.use(VueRouter);
//! URL charts.assets.kartoteket.as/covid19/embeds/charts/taiwan*,norway/combined
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/embeds/chart/:type?/:slug?/:sub?',
    component: () =>
      import(
        /* webpackChunkName: "embeds-charts-type-slug-sub" */ '../views/Embeds.vue'
      )
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
