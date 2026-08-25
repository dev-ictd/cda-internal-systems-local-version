<script setup>
import { ref, computed } from 'vue';
import { store } from '../store.js';
import CategorySection from '../components/CategorySection.vue';
import SystemFormModal from '../components/SystemFormModal.vue';

const showForm = ref(false);
const editingSystem = ref(null);
const search = ref('');

const filteredSystems = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return store.systems;
  return store.systems.filter(
    (s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q)
  );
});

function systemsFor(categoryId) {
  return filteredSystems.value
    .filter((s) => s.categoryId === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function openAdd() {
  editingSystem.value = null;
  showForm.value = true;
}

function openEdit(system) {
  editingSystem.value = system;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingSystem.value = null;
}

async function onDelete(system) {
  if (!confirm(`Remove "${system.name}"?`)) return;
  try {
    await store.removeSystem(system.id);
  } catch (err) {
    alert(err.message);
  }
}
</script>

<template>
  <div class="home-header">
    <input v-model="search" type="text" placeholder="Search systems…" class="search" />
    <button class="btn btn-primary" @click="openAdd">+ Add system</button>
  </div>

  <div v-if="!store.categories.length" class="empty-state">
    <p>No categories yet. Head to Settings to create your first one.</p>
    <router-link to="/settings" class="btn btn-primary">Go to Settings</router-link>
  </div>

  <div v-else-if="!store.systems.length" class="empty-state">
    <p>No systems added yet.</p>
    <button class="btn btn-primary" @click="openAdd">+ Add your first system</button>
  </div>

  <template v-else>
    <CategorySection
      v-for="category in store.categories"
      v-show="!search.trim() || systemsFor(category.id).length"
      :key="category.id"
      :title="category.name"
      :systems="systemsFor(category.id)"
      @edit="openEdit"
      @delete="onDelete"
    />
  </template>

  <SystemFormModal v-if="showForm" :system="editingSystem" @close="closeForm" @saved="closeForm" />
</template>

<style scoped>
.home-header {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.search {
  flex: 1;
  max-width: 320px;
}
</style>

