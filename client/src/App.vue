<script setup>
import { onMounted } from 'vue';
import { store } from './store.js';

onMounted(() => {
  store.load();
});
</script>

<template>
  <header class="topbar">
    <router-link to="/" class="brand">
      <span class="brand-mark">CS</span>
      <span class="brand-name">{{ store.settings.title || 'CDA Internal Systems' }}</span>
    </router-link>
    <nav class="nav">
      <router-link to="/" class="nav-link" exact-active-class="active">Systems</router-link>
      <router-link to="/settings" class="nav-link" exact-active-class="active">Settings</router-link>
    </nav>
  </header>

  <main class="main">
    <div v-if="store.error" class="banner-error">{{ store.error }}</div>
    <router-view v-if="store.loaded" />
    <div v-else-if="!store.error" class="empty-state">Loading…</div>
  </main>
</template>

<style>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 16px;
}

.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 7px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
}

.nav-link:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.nav-link.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px 60px;
}

.banner-error {
  background: var(--danger-soft);
  color: var(--danger);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>

