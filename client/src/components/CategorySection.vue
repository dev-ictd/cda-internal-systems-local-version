<script setup>
import SystemCard from './SystemCard.vue';

defineProps({
  title: { type: String, required: true },
  systems: { type: Array, required: true },
});
const emit = defineEmits(['edit', 'delete']);
</script>

<template>
  <section class="category-section">
    <div class="category-header">
      <h2>{{ title }}</h2>
      <span class="count">{{ systems.length }}</span>
    </div>
    <div v-if="systems.length" class="grid">
      <SystemCard
        v-for="system in systems"
        :key="system.id"
        :system="system"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
    <p v-else class="category-empty">No systems in this category yet.</p>
  </section>
</template>

<style scoped>
.category-section {
  margin-bottom: 32px;
}

.category-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.category-header h2 {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-hover);
  border-radius: 999px;
  padding: 1px 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

.category-empty {
  font-size: 13px;
  color: var(--text-muted);
  padding: 10px 2px;
}
</style>

