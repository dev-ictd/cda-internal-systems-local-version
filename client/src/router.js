import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './views/Home.vue';
import Settings from './views/Settings.vue';

// Hash history keeps this a truly "just run it" app — no server-side
// rewrite rules needed for client-side routes to work.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/settings', name: 'settings', component: Settings },
  ],
});

