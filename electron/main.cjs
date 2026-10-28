const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const { pathToFileURL } = require('node:url');
const { createStore, resolveDataDir, CorruptDataError } = require('./store.cjs');
const { createTmdb } = require('./tmdb.cjs');
const { readZip } = require('./zip.cjs');
const { parsePosterUrl } = require('./posterUrl.cjs');

const IS_DEV = process.env.BLURAY_DEV === '1';

protocol.registerSchemesAsPrivileged([
  { scheme: 'poster', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

let store;
let tmdbApiKey = '';
let win;

const tmdb = () => createTmdb({ apiKey: tmdbApiKey });

function rememberKey(state) {
  tmdbApiKey = state?.settings?.tmdbApiKey || '';
}

// poster://img/<tmdbId>?p=<poster_path TMDB> : sert l'affiche en cache, la télécharge sinon.
async function handlePoster(request) {
  const parsed = parsePosterUrl(request.url);
  if (!parsed) return new Response('', { status: 404 });
  const { id, posterPath } = parsed;
  const file = store.posterPath(id);
  if (!fs.existsSync(file)) {
    if (!posterPath) return new Response('', { status: 404 });
    try {
      await tmdb().downloadPoster(posterPath, file);
    } catch {
      return new Response('', { status: 404 });
    }
  }
  return net.fetch(pathToFileURL(file).toString());
}

function registerIpc() {
  ipcMain.handle('state:load', () => {
    try {
      const state = store.load();
      rememberKey(state);
      return { state };
    } catch (err) {
      if (err instanceof CorruptDataError) return { state: null, error: 'corrupt', backups: store.listBackups() };
      throw err;
    }
  });
  ipcMain.handle('state:save', (_e, state) => {
    store.save(state);
    rememberKey(state);
  });
  ipcMain.on('state:save-sync', (e, state) => {
    store.save(state);
    e.returnValue = true;
  });
  ipcMain.handle('state:restore', (_e, file) => {
    const state = store.restore(file);
    rememberKey(state);
    return state;
  });

  ipcMain.handle('tmdb:search', (_e, query, year) => tmdb().search(query, year));
  ipcMain.handle('tmdb:details', (_e, id) => tmdb().details(id));

  ipcMain.handle('zip:pick', async () => {
    const res = await dialog.showOpenDialog(win, {
      title: 'Export Letterboxd',
      filters: [{ name: 'Export Letterboxd', extensions: ['zip'] }],
      properties: ['openFile'],
    });
    if (res.canceled || !res.filePaths[0]) return null;
    return readZip(fs.readFileSync(res.filePaths[0]));
  });

  ipcMain.handle('data:backup', () => store.backup());
  ipcMain.handle('data:export', async () => {
    const res = await dialog.showSaveDialog(win, {
      defaultPath: `bluray-collection-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePath) return null;
    fs.copyFileSync(store.file, res.filePath);
    return res.filePath;
  });
  ipcMain.handle('data:open', () => shell.openPath(store.dir));
  ipcMain.handle('data:dir', () => store.dir);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1340,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Blu-ray Collection',
    backgroundColor: '#111114',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (IS_DEV) win.loadURL('http://127.0.0.1:5174');
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  store = createStore(resolveDataDir(app));
  protocol.handle('poster', handlePoster);
  registerIpc();
  createWindow();
});
app.on('window-all-closed', () => app.quit());
