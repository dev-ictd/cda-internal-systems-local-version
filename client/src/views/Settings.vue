<script setup>
import { ref } from 'vue';
import { store } from '../store.js';
import { api } from '../api.js';

// --- general settings ---
const title = ref(store.settings.title || '');
const openInNewTab = ref(store.settings.openInNewTab !== false);
const theme = ref(store.settings.theme || 'system');
const savingGeneral = ref(false);
const generalSaved = ref(false);

async function saveGeneral() {
  savingGeneral.value = true;
  generalSaved.value = false;
  try {
    await store.saveSettings({
      title: title.value.trim() || 'CDA Internal Systems',
      openInNewTab: openInNewTab.value,
      theme: theme.value,
    });
    generalSaved.value = true;
    setTimeout(() => (generalSaved.value = false), 2000);
  } finally {
    savingGeneral.value = false;
  }
}

// --- categories ---
const newCategoryName = ref('');
const categoryError = ref('');
const editingId = ref(null);
const editingName = ref('');

async function addCategory() {
  categoryError.value = '';
  const name = newCategoryName.value.trim();
  if (!name) return;
  try {
    await store.addCategory(name);
    newCategoryName.value = '';
  } catch (err) {
    categoryError.value = err.message;
  }
}

function startEdit(category) {
  editingId.value = category.id;
  editingName.value = category.name;
}

async function saveEdit(category) {
  const name = editingName.value.trim();
  if (!name) return;
  try {
    await store.renameCategory(category.id, name);
    editingId.value = null;
  } catch (err) {
    categoryError.value = err.message;
  }
}

async function removeCategory(category) {
  const inUse = store.systems.some((s) => s.categoryId === category.id);
  if (inUse) {
    alert(`"${category.name}" still has systems in it. Move or delete them first.`);
    return;
  }
  if (!confirm(`Delete category "${category.name}"?`)) return;
  try {
    await store.removeCategory(category.id);
  } catch (err) {
    alert(err.message);
  }
}

async function move(category, direction) {
  const ids = store.categories.map((c) => c.id);
  const idx = ids.indexOf(category.id);
  const swapWith = idx + direction;
  if (swapWith < 0 || swapWith >= ids.length) return;
  [ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]];
  await store.reorderCategories(ids);
}

// --- data management ---
const importInput = ref(null);
const importError = ref('');
const importing = ref(false);

function triggerImport() {
  importInput.value?.click();
}

async function onImportFile(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!confirm('Importing a backup replaces all current systems, categories and settings. Continue?')) return;
  importing.value = true;
  importError.value = '';
  try {
    const formData = new FormData();
    formData.append('file', file);
    await store.importBackup(formData);
    title.value = store.settings.title || '';
    openInNewTab.value = store.settings.openInNewTab !== false;
    theme.value = store.settings.theme || 'system';
  } catch (err) {
    importError.value = err.message;
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <h1 class="page-title">Settings</h1>

  <section class="settings-block card">
    <h2>General</h2>

    <div class="field">
      <label for="title">App title</label>
      <input id="title" v-model="title" type="text" />
    </div>

    <div class="field">
      <label for="theme">Appearance</label>
      <select id="theme" v-model="theme">
        <option value="system">Match system</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>

    <label class="checkbox-field">
      <input v-model="openInNewTab" type="checkbox" />
      Open systems in a new tab
    </label>

    <div class="settings-actions">
      <button class="btn btn-primary" :disabled="savingGeneral" @click="saveGeneral">
        {{ savingGeneral ? 'Saving…' : 'Save' }}
      </button>
      <span v-if="generalSaved" class="saved-note">Saved</span>
    </div>
  </section>

  <section class="settings-block card">
    <h2>Categories</h2>
    <p class="field-hint">These are the groups systems are organized under on the Systems page.</p>

    <ul class="category-list">
      <li v-for="(category, idx) in store.categories" :key="category.id">
        <div class="reorder-buttons">
          <button class="btn btn-icon" :disabled="idx === 0" @click="move(category, -1)">↑</button>
          <button class="btn btn-icon" :disabled="idx === store.categories.length - 1" @click="move(category, 1)">↓</button>
        </div>

        <template v-if="editingId === category.id">
          <input v-model="editingName" type="text" class="category-edit-input" @keyup.enter="saveEdit(category)" />
          <button class="btn btn-primary" @click="saveEdit(category)">Save</button>
          <button class="btn" @click="editingId = null">Cancel</button>
        </template>
        <template v-else>
          <span class="category-name">{{ category.name }}</span>
          <span class="category-count">
            {{ store.systems.filter((s) => s.categoryId === category.id).length }} system(s)
          </span>
          <button class="btn" @click="startEdit(category)">Rename</button>
          <button class="btn btn-danger" @click="removeCategory(category)">Delete</button>
        </template>
      </li>
    </ul>

    <form class="add-category-row" @submit.prevent="addCategory">
      <input v-model="newCategoryName" type="text" placeholder="New category name" />
      <button class="btn btn-primary" type="submit">Add category</button>
    </form>
    <p v-if="categoryError" class="error-text">{{ categoryError }}</p>
  </section>

  <section class="settings-block card">
    <h2>Data</h2>
    <p class="field-hint">
      Everything is stored in a single file on the machine running this app. Export a backup
      periodically, or restore from one.
    </p>
    <div class="settings-actions">
      <a class="btn" :href="api.exportUrl()">Export backup</a>
      <button class="btn" :disabled="importing" @click="triggerImport">
        {{ importing ? 'Importing…' : 'Import backup' }}
      </button>
      <input ref="importInput" type="file" accept="application/json" class="hidden-file" @change="onImportFile" />
    </div>
    <p v-if="importError" class="error-text">{{ importError }}</p>
  </section>
</template>

<style scoped>
.page-title {
  font-size: 22px;
  margin: 0 0 20px;
}

.settings-block {
  padding: 20px 22px;
  margin-bottom: 20px;
}

.settings-block h2 {
  font-size: 15px;
  margin: 0 0 16px;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}

.checkbox-field input {
  width: auto;
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.saved-note {
  font-size: 13px;
  color: var(--accent);
}

.category-list {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.reorder-buttons {
  display: flex;
  gap: 2px;
}

.reorder-buttons .btn {
  padding: 4px 6px;
  font-size: 12px;
}

.category-name {
  font-weight: 600;
  font-size: 14px;
}

.category-count {
  font-size: 12px;
  color: var(--text-muted);
  flex: 1;
}

.category-edit-input {
  flex: 1;
}

.add-category-row {
  display: flex;
  gap: 8px;
}

.add-category-row input {
  flex: 1;
  max-width: 280px;
}

.hidden-file {
  display: none;
}
</style>

