import { reactive } from 'vue';
import { api } from './api.js';

// A small hand-rolled store instead of Pinia/Vuex — this app is a couple of
// screens and a handful of records, a reactive object is plenty.
export const store = reactive({
  categories: [],
  systems: [],
  settings: { title: 'CDA Internal Systems', openInNewTab: true, theme: 'system' },
  loaded: false,
  error: null,

  async load() {
    try {
      const data = await api.bootstrap();
      this.categories = data.categories.sort((a, b) => a.order - b.order);
      this.systems = data.systems;
      this.settings = data.settings;
      this.loaded = true;
      this.applyTheme();
      document.title = this.settings.title || 'CDA Internal Systems';
    } catch (err) {
      this.error = err.message;
    }
  },

  applyTheme() {
    const theme = this.settings.theme || 'system';
    document.documentElement.dataset.theme = theme === 'system' ? '' : theme;
  },

  categoryName(id) {
    const category = this.categories.find((c) => c.id === id);
    return category ? category.name : 'Uncategorized';
  },

  systemsByCategory(categoryId) {
    return this.systems
      .filter((s) => s.categoryId === categoryId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async addSystem(formData) {
    const system = await api.createSystem(formData);
    this.systems.push(system);
    return system;
  },

  async editSystem(id, formData) {
    const updated = await api.updateSystem(id, formData);
    const idx = this.systems.findIndex((s) => s.id === id);
    if (idx !== -1) this.systems[idx] = updated;
    return updated;
  },

  async removeSystem(id) {
    await api.deleteSystem(id);
    this.systems = this.systems.filter((s) => s.id !== id);
  },

  async addCategory(name) {
    const category = await api.createCategory(name);
    this.categories.push(category);
    this.categories.sort((a, b) => a.order - b.order);
    return category;
  },

  async renameCategory(id, name) {
    const category = await api.updateCategory(id, name);
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx !== -1) this.categories[idx] = category;
    return category;
  },

  async reorderCategories(ids) {
    this.categories = await api.reorderCategories(ids);
  },

  async removeCategory(id) {
    await api.deleteCategory(id);
    this.categories = this.categories.filter((c) => c.id !== id);
  },

  async saveSettings(patch) {
    this.settings = await api.updateSettings(patch);
    this.applyTheme();
    document.title = this.settings.title || 'CDA Internal Systems';
    return this.settings;
  },

  async importBackup(formData) {
    const data = await api.importBackup(formData);
    this.categories = data.categories.sort((a, b) => a.order - b.order);
    this.systems = data.systems;
    this.settings = data.settings;
    this.applyTheme();
    document.title = this.settings.title || 'CDA Internal Systems';
  },
});

