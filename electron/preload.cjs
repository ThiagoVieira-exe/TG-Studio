const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  print: (paper) => ipcRenderer.invoke('print-current-page', paper),
});
