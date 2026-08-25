// Tiny JSON-file "database". Good enough for a single lightweight internal
// tool used by a handful of people — no real DB server to install or run.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'db.seed.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const seed = fs.existsSync(SEED_FILE)
      ? fs.readFileSync(SEED_FILE, 'utf-8')
      : JSON.stringify({ categories: [], systems: [], settings: {} }, null, 2);
    fs.writeFileSync(DB_FILE, seed);
  }
}

function readRaw() {
  ensureDb();
  const text = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('db.json is corrupted and could not be parsed: ' + err.message);
  }
}

// Serialize writes so two near-simultaneous requests can't clobber each
// other's changes (this is a plain file, not a real transactional DB).
let writeChain = Promise.resolve();

function writeRaw(data) {
  writeChain = writeChain.then(
    () =>
      new Promise((resolve, reject) => {
        const tmpFile = DB_FILE + '.tmp';
        fs.writeFile(tmpFile, JSON.stringify(data, null, 2), (err) => {
          if (err) return reject(err);
          fs.rename(tmpFile, DB_FILE, (err2) => (err2 ? reject(err2) : resolve()));
        });
      })
  );
  return writeChain;
}

function read() {
  return readRaw();
}

async function update(mutator) {
  const data = readRaw();
  const result = mutator(data);
  await writeRaw(data);
  return result;
}

module.exports = { read, update, DATA_DIR, DB_FILE };

