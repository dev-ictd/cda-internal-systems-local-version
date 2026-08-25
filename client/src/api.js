async function request(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch (_) {
      /* response wasn't JSON */
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  bootstrap: () => request('/api/bootstrap'),

  listSystems: () => request('/api/systems'),
  createSystem: (formData) => request('/api/systems', { method: 'POST', body: formData }),
  updateSystem: (id, formData) => request(`/api/systems/${id}`, { method: 'PUT', body: formData }),
  deleteSystem: (id) => request(`/api/systems/${id}`, { method: 'DELETE' }),

  listCategories: () => request('/api/categories'),
  createCategory: (name) =>
    request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  updateCategory: (id, name) =>
    request(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  reorderCategories: (ids) =>
    request('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

  getSettings: () => request('/api/settings'),
  updateSettings: (settings) =>
    request('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }),

  exportUrl: () => '/api/export',
  importBackup: (formData) => request('/api/import', { method: 'POST', body: formData }),
};

