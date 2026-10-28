const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const IS_DEV = process.env.BLURAY_DEV === '1';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    title: 'Blu-ray Collection',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (IS_DEV) win.loadURL('http://127.0.0.1:5174');
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
