const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const db = require('./db');

const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(express.json());

// ---------- helpers ----------

const ALLOWED_IMAGE_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype] || path.extname(file.originalname) || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES[file.mimetype]) return cb(null, true);
    cb(new Error('Only image files are allowed (png, jpg, gif, webp, svg, ico).'));
  },
});

function slugify(name) {
  return (
    name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || crypto.randomUUID().slice(0, 8)
  );
}

function uniqueId(base, existingIds) {
  let id = base;
  let n = 2;
  while (existingIds.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function normalizeUrl(raw) {
  const value = (raw || '').trim();
  if (!value) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
    return `http://${value}`;
  }
  return value;
}

function deleteUploadedFile(thumbnailPath) {
  if (!thumbnailPath || !thumbnailPath.startsWith('/uploads/')) return;
  const filePath = path.join(UPLOADS_DIR, path.basename(thumbnailPath));
  fs.unlink(filePath, () => {});
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

// ---------- bootstrap ----------

app.get(
  '/api/bootstrap',
  asyncRoute(async (req, res) => {
    const data = db.read();
    res.json(data);
  })
);

// ---------- categories ----------

app.get(
  '/api/categories',
  asyncRoute(async (req, res) => {
    res.json(db.read().categories);
  })
);

app.post(
  '/api/categories',
  asyncRoute(async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const result = await db.update((data) => {
      const existingIds = new Set(data.categories.map((c) => c.id));
      const duplicate = data.categories.some((c) => c.name.toLowerCase() === name.toLowerCase());
      if (duplicate) return { error: 'A category with that name already exists.' };
      const id = uniqueId(slugify(name), existingIds);
      const order = data.categories.length
        ? Math.max(...data.categories.map((c) => c.order)) + 1
        : 0;
      const category = { id, name, order };
      data.categories.push(category);
      return { category };
    });

    if (result.error) return res.status(409).json({ error: result.error });
    res.status(201).json(result.category);
  })
);

app.put(
  '/api/categories/:id',
  asyncRoute(async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const result = await db.update((data) => {
      const category = data.categories.find((c) => c.id === req.params.id);
      if (!category) return { error: 'not_found' };
      const duplicate = data.categories.some(
        (c) => c.id !== category.id && c.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicate) return { error: 'A category with that name already exists.' };
      category.name = name;
      return { category };
    });

    if (result.error === 'not_found') return res.status(404).json({ error: 'Category not found.' });
    if (result.error) return res.status(409).json({ error: result.error });
    res.json(result.category);
  })
);

app.post(
  '/api/categories/reorder',
  asyncRoute(async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : null;
    if (!ids) return res.status(400).json({ error: 'ids array is required.' });

    const result = await db.update((data) => {
      const byId = new Map(data.categories.map((c) => [c.id, c]));
      ids.forEach((id, index) => {
        if (byId.has(id)) byId.get(id).order = index;
      });
      data.categories.sort((a, b) => a.order - b.order);
      return { categories: data.categories };
    });

    res.json(result.categories);
  })
);

app.delete(
  '/api/categories/:id',
  asyncRoute(async (req, res) => {
    const result = await db.update((data) => {
      const category = data.categories.find((c) => c.id === req.params.id);
      if (!category) return { error: 'not_found' };
      const inUse = data.systems.filter((s) => s.categoryId === req.params.id).length;
      if (inUse > 0) return { error: 'in_use', count: inUse };
      data.categories = data.categories.filter((c) => c.id !== req.params.id);
      return { ok: true };
    });

    if (result.error === 'not_found') return res.status(404).json({ error: 'Category not found.' });
    if (result.error === 'in_use') {
      return res.status(409).json({
        error: `${result.count} system(s) still use this category. Move or delete them first.`,
      });
    }
    res.status(204).end();
  })
);

// ---------- systems ----------

app.get(
  '/api/systems',
  asyncRoute(async (req, res) => {
    res.json(db.read().systems);
  })
);

app.post(
  '/api/systems',
  upload.single('image'),
  asyncRoute(async (req, res) => {
    const name = (req.body.name || '').trim();
    const url = normalizeUrl(req.body.url);
    const categoryId = req.body.categoryId;

    if (!name || !url || !categoryId) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'name, url and categoryId are required.' });
    }

    const result = await db.update((data) => {
      const category = data.categories.find((c) => c.id === categoryId);
      if (!category) return { error: 'Category not found.' };

      const system = {
        id: crypto.randomUUID(),
        name,
        url,
        categoryId,
        thumbnail: req.file ? `/uploads/${req.file.filename}` : null,
        createdAt: new Date().toISOString(),
      };
      data.systems.push(system);
      return { system };
    });

    if (result.error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.system);
  })
);

app.put(
  '/api/systems/:id',
  upload.single('image'),
  asyncRoute(async (req, res) => {
    const result = await db.update((data) => {
      const system = data.systems.find((s) => s.id === req.params.id);
      if (!system) return { error: 'not_found' };

      if (req.body.categoryId) {
        const category = data.categories.find((c) => c.id === req.body.categoryId);
        if (!category) return { error: 'Category not found.' };
        system.categoryId = req.body.categoryId;
      }
      if (typeof req.body.name === 'string' && req.body.name.trim()) {
        system.name = req.body.name.trim();
      }
      if (typeof req.body.url === 'string' && req.body.url.trim()) {
        system.url = normalizeUrl(req.body.url);
      }

      const oldThumbnail = system.thumbnail;
      if (req.file) {
        system.thumbnail = `/uploads/${req.file.filename}`;
      } else if (req.body.removeImage === 'true') {
        system.thumbnail = null;
      }
      if ((req.file || req.body.removeImage === 'true') && oldThumbnail) {
        deleteUploadedFile(oldThumbnail);
      }

      return { system };
    });

    if (result.error === 'not_found') {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'System not found.' });
    }
    if (result.error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: result.error });
    }
    res.json(result.system);
  })
);

app.delete(
  '/api/systems/:id',
  asyncRoute(async (req, res) => {
    const result = await db.update((data) => {
      const system = data.systems.find((s) => s.id === req.params.id);
      if (!system) return { error: 'not_found' };
      data.systems = data.systems.filter((s) => s.id !== req.params.id);
      return { thumbnail: system.thumbnail };
    });

    if (result.error === 'not_found') return res.status(404).json({ error: 'System not found.' });
    deleteUploadedFile(result.thumbnail);
    res.status(204).end();
  })
);

// ---------- settings ----------

app.get(
  '/api/settings',
  asyncRoute(async (req, res) => {
    res.json(db.read().settings);
  })
);

app.put(
  '/api/settings',
  asyncRoute(async (req, res) => {
    const allowedKeys = ['title', 'openInNewTab', 'theme'];
    const result = await db.update((data) => {
      for (const key of allowedKeys) {
        if (key in req.body) data.settings[key] = req.body[key];
      }
      return { settings: data.settings };
    });
    res.json(result.settings);
  })
);

// ---------- backup / restore ----------

app.get(
  '/api/export',
  asyncRoute(async (req, res) => {
    const data = db.read();
    res.setHeader('Content-Disposition', 'attachment; filename="cda-internal-systems-backup.json"');
    res.json(data);
  })
);

app.post(
  '/api/import',
  upload.single('file'),
  asyncRoute(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No backup file uploaded.' });
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(req.file.path, 'utf-8'));
    } catch (err) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'That file is not valid JSON.' });
    }
    fs.unlink(req.file.path, () => {});

    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.systems) || typeof parsed.settings !== 'object') {
      return res.status(400).json({ error: 'That file does not look like a valid backup.' });
    }

    await db.update((data) => {
      data.categories = parsed.categories;
      data.systems = parsed.systems;
      data.settings = { ...data.settings, ...parsed.settings };
    });

    res.json(db.read());
  })
);

// ---------- static files ----------

app.use('/uploads', express.static(UPLOADS_DIR));

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// ---------- error handling ----------

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`CDA Internal Systems is running at http://localhost:${PORT}`);
});

