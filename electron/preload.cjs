const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (state) => ipcRenderer.invoke('state:save', state),
  saveStateSync: (state) => ipcRenderer.sendSync('state:save-sync', state),
  restoreBackup: (file) => ipcRenderer.invoke('state:restore', file),
  tmdbSearch: (query, year) => ipcRenderer.invoke('tmdb:search', query, year),
  tmdbDetails: (id) => ipcRenderer.invoke('tmdb:details', id),
  pickZip: () => ipcRenderer.invoke('zip:pick'),
  backup: () => ipcRenderer.invoke('data:backup'),
  exportJson: () => ipcRenderer.invoke('data:export'),
  openDataDir: () => ipcRenderer.invoke('data:open'),
  dataDir: () => ipcRenderer.invoke('data:dir'),
});
