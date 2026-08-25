<script setup>
import { ref, computed } from 'vue';
import { store } from '../store.js';

const props = defineProps({
  system: { type: Object, default: null }, // null = create mode
});
const emit = defineEmits(['close', 'saved']);

const isEdit = computed(() => !!props.system);

const name = ref(props.system?.name || '');
const url = ref(props.system?.url || '');
const categoryId = ref(props.system?.categoryId || store.categories[0]?.id || '');
const imageFile = ref(null);
const removeImage = ref(false);
const preview = ref(props.system?.thumbnail || null);
const saving = ref(false);
const error = ref('');

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  imageFile.value = file;
  removeImage.value = false;
  preview.value = URL.createObjectURL(file);
}

function clearImage() {
  imageFile.value = null;
  preview.value = null;
  removeImage.value = true;
}

async function submit() {
  error.value = '';
  if (!name.value.trim() || !url.value.trim() || !categoryId.value) {
    error.value = 'Name, URL and category are required.';
    return;
  }
  saving.value = true;
  try {
    const formData = new FormData();
    formData.append('name', name.value.trim());
    formData.append('url', url.value.trim());
    formData.append('categoryId', categoryId.value);
    if (imageFile.value) formData.append('image', imageFile.value);
    if (removeImage.value) formData.append('removeImage', 'true');

    if (isEdit.value) {
      await store.editSystem(props.system.id, formData);
    } else {
      await store.addSystem(formData);
    }
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal">
      <h2>{{ isEdit ? 'Edit system' : 'Add system' }}</h2>

      <div class="field">
        <label for="sys-name">Name</label>
        <input id="sys-name" v-model="name" type="text" placeholder="e.g. Grafana" />
      </div>

      <div class="field">
        <label for="sys-url">URL</label>
        <input id="sys-url" v-model="url" type="text" placeholder="e.g. grafana.internal.cda.com" />
      </div>

      <div class="field">
        <label for="sys-category">Category</label>
        <select id="sys-category" v-model="categoryId">
          <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <span v-if="!store.categories.length" class="field-hint">
          No categories yet — add one on the Settings page first.
        </span>
      </div>

      <div class="field">
        <label>Thumbnail</label>
        <div class="thumb-row">
          <div class="thumb-preview">
            <img v-if="preview" :src="preview" alt="" />
            <span v-else>No image</span>
          </div>
          <div class="thumb-controls">
            <label class="btn">
              Choose image
              <input type="file" accept="image/*" class="hidden-file" @change="onFileChange" />
            </label>
            <button v-if="preview" type="button" class="btn btn-danger" @click="clearImage">Remove</button>
          </div>
        </div>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="modal-actions">
        <button class="btn" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" :disabled="saving" @click="submit">
          {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add system' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumb-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thumb-preview {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.thumb-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.hidden-file {
  display: none;
}
</style>

