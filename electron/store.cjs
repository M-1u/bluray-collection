// Persistance de l'état : collection.json (écriture atomique) + backups/ + posters/.
const fs = require('node:fs');
const path = require('node:path');

class CorruptDataError extends Error {
  constructor(file, cause) {
    super(`Fichier de données illisible : ${file}`);
    this.name = 'CorruptDataError';
    this.cause = cause;
  }
}

function resolveDataDir(app) {
  return process.env.BLURAY_DATA_DIR || app.getPath('userData');
}

function createStore(dir) {
  const file = path.join(dir, 'collection.json');
  const backupsDir = path.join(dir, 'backups');

  function writeAtomic(target, text) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const tmp = `${target}.tmp`;
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, target);
  }

  function load() {
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      throw new CorruptDataError(file, err);
    }
  }

  function save(state) {
    writeAtomic(file, JSON.stringify(state, null, 1));
  }

  function backup() {
    if (!fs.existsSync(file)) return null;
    fs.mkdirSync(backupsDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    let target = path.join(backupsDir, `collection-${stamp}.json`);
    for (let i = 1; fs.existsSync(target); i++) target = path.join(backupsDir, `collection-${stamp}-${i}.json`);
    fs.copyFileSync(file, target);
    return target;
  }

  function listBackups() {
    if (!fs.existsSync(backupsDir)) return [];
    return fs.readdirSync(backupsDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .reverse()
      .map((f) => path.join(backupsDir, f));
  }

  function restore(backupFile) {
    const state = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    save(state);
    return state;
  }

  const posterPath = (tmdbId) => path.join(dir, 'posters', `${tmdbId}.jpg`);

  return { dir, file, load, save, backup, listBackups, restore, posterPath };
}

module.exports = { createStore, resolveDataDir, CorruptDataError };
