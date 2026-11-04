const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#09090b',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (isDevelopment) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

ipcMain.handle('print-current-page', async (event, paper) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { success: false, failureReason: 'Janela de impressão indisponível' };

  const width = Number(paper?.width);
  const height = Number(paper?.height);
  const pageSize = Number.isFinite(width) && Number.isFinite(height)
    ? { width: Math.round(width * 1000), height: Math.round(height * 1000) }
    : undefined;

  return new Promise((resolve) => {
    window.webContents.print(
      {
        silent: false,
        printBackground: true,
        margins: { marginType: 'none' },
        ...(pageSize ? { pageSize } : {}),
      },
      (success, failureReason) => resolve({ success, failureReason }),
    );
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
