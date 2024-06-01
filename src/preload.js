const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openNotepad: () => ipcRenderer.send('open-notepad')
});

