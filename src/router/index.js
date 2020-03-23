import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';

Vue.use(VueRouter);
// URL charts.corona.kartoteket.as/embeds/chart/line/taiwan*,norway/combined
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/embeds/chart/:type?/:slug?/:sub?/:dimension?',
    component: () =>
      import(
        /* webpackChunkName: "embeds-charts-type-slug-sub" */ '../views/Embeds.vue'
      )
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
