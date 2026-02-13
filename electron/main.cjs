const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'A4 Layout Editor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the built Vite output
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(createWindow);

// Quit when all windows are closed (macOS convention override)
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
