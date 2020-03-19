import Vue from 'vue';
import App from './App.vue';
import router from './router';
import VueGtag from 'vue-gtag';
import './assets/tailwind.css';

Vue.use(VueGtag, {
  config: {
    id: 'UA-60185757-4',
    params: {
      anonymizeIp: true
    }
  }
});

Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
