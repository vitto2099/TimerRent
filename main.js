const { app, BrowserWindow } = require('electron');
const path = require('path');

try { require('electron-reload')(__dirname); } catch(e) {}

function createWindow () {
  const win = new BrowserWindow({
    width: 520,
    height: 720,
    minWidth: 360,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'icons', 'icon128.png'),
    autoHideMenuBar: true,
    title: 'TimerRent',
    backgroundColor: '#0a0a0f'
  });

  win.loadFile('popup.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
