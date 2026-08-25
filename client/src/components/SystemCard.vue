<script setup>
import { computed } from 'vue';
import { store } from '../store.js';

const props = defineProps({
  system: { type: Object, required: true },
});
const emit = defineEmits(['edit', 'delete']);

const hostname = computed(() => {
  try {
    return new URL(props.system.url).hostname.replace(/^www\./, '');
  } catch {
    return props.system.url;
  }
});

const initial = computed(() => (props.system.name || '?').trim().charAt(0).toUpperCase());
</script>

<template>
  <a
    class="system-card"
    :href="system.url"
    :target="store.settings.openInNewTab ? '_blank' : '_self'"
    rel="noopener noreferrer"
  >
    <div class="thumb">
      <img v-if="system.thumbnail" :src="system.thumbnail" :alt="system.name" />
      <span v-else class="thumb-fallback">{{ initial }}</span>
    </div>
    <div class="info">
      <div class="name">{{ system.name }}</div>
      <div class="host">{{ hostname }}</div>
    </div>
    <div class="row-actions" @click.prevent.stop>
      <button class="btn btn-icon" title="Edit" @click="emit('edit', system)">✎</button>
      <button class="btn btn-icon btn-danger" title="Delete" @click="emit('delete', system)">🗑</button>
    </div>
  </a>
</template>

<style scoped>
.system-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.12s ease, box-shadow 0.12s ease, transform 0.05s ease;
  position: relative;
}

.system-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow);
}

.thumb {
  width: 42px;
  height: 42px;
  border-radius: 9px;
  overflow: hidden;
  background: var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  font-weight: 700;
  color: var(--accent);
  font-size: 16px;
}

.info {
  min-width: 0;
  flex: 1;
}

.name {
  font-weight: 600;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.host {
  font-size: 12px;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.row-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.system-card:hover .row-actions {
  opacity: 1;
}

.row-actions .btn {
  padding: 5px 7px;
  font-size: 13px;
}
</style>

