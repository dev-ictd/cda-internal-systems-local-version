# CDA Internal Systems

A lightweight dashboard that lists every internal system in one place, grouped
by category, so you don't have to bookmark each one individually.

- **Systems page** — all systems, grouped by category (Internal Systems,
  Databases, Nginx Proxy Managers, Monitoring Systems by default). Search box,
  and an "Add system" button (name, URL, category, optional thumbnail image).
  Hover a card to edit or delete it.
- **Settings page** — manage categories (add, rename, delete, reorder),
  general app settings (title, light/dark/system theme, open-links-in-new-tab),
  and backup/restore (export/import everything as a single JSON file).

Everything is stored in one file (`server/data/db.json`) — no database to
install. Uploaded thumbnail images are saved in `server/uploads/`.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer (includes npm).

## First-time setup

From the project folder, run:

```
npm run install:all
```

This installs the dependencies for both the server and the client.

## Running it

```
npm start
```

This builds the app and starts the server. Open **http://localhost:3001** in
your browser — bookmark that one URL and you're done.

To use a different port:

```
PORT=4000 npm start
```

(On Windows PowerShell: `$env:PORT=4000; npm start`)

## Making changes / developing

Run the backend and frontend separately, with live-reload on the frontend:

```
npm run dev:server   # in one terminal — API on http://localhost:3001
npm run dev:client   # in another terminal — UI on http://localhost:5173
```

Then open http://localhost:5173 while developing.

## Backing up your data

Settings → Data → **Export backup** downloads a JSON file with every system,
category and setting. **Import backup** restores from one (this replaces
whatever is currently in the app). Thumbnail images themselves live in
`server/uploads/` — copy that folder too if you want a full backup including
images.

## Project structure

```
server/   Express API + JSON file storage + uploaded images
client/   Vue 3 + Vite frontend
```

