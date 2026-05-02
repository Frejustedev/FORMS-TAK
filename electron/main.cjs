const { app, BrowserWindow, ipcMain, shell, protocol } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { initDb, registerIpc, getDataLocation } = require('./db.cjs');

const isDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: false,
      corsEnabled: true,
    },
  },
]);

let mainWindow = null;

function getDataDir() {
  if (app.isPackaged && process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data');
  }
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), 'data');
  }
  return path.join(__dirname, '..', 'data');
}

function getOutDir() {
  return path.join(__dirname, '..', 'out');
}

function ensureDataDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function registerAppProtocol() {
  const outDir = getOutDir();
  protocol.handle('app', async (request) => {
    try {
      const reqUrl = new URL(request.url);
      let pathname = decodeURIComponent(reqUrl.pathname);
      if (pathname === '/' || pathname === '') pathname = '/index.html';

      let filePath = path.join(outDir, pathname);

      let exists = false;
      try {
        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) {
          filePath = path.join(filePath, 'index.html');
          await fs.promises.stat(filePath);
        }
        exists = true;
      } catch {
        if (!path.extname(filePath)) {
          const withIdx = path.join(filePath, 'index.html');
          if (fs.existsSync(withIdx)) {
            filePath = withIdx;
            exists = true;
          } else {
            const withHtml = filePath + '.html';
            if (fs.existsSync(withHtml)) {
              filePath = withHtml;
              exists = true;
            }
          }
        } else if (fs.existsSync(filePath)) {
          exists = true;
        }
      }

      if (!exists) {
        const fallback = path.join(outDir, 'index.html');
        if (fs.existsSync(fallback)) filePath = fallback;
        else return new Response('Not Found', { status: 404 });
      }

      const normalizedOut = path.normalize(outDir);
      const normalizedFile = path.normalize(filePath);
      if (!normalizedFile.startsWith(normalizedOut)) {
        return new Response('Forbidden', { status: 403 });
      }

      const data = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      return new Response(data, { headers: { 'Content-Type': contentType } });
    } catch (e) {
      console.error('Protocol handler error', e);
      return new Response(String(e), { status: 500 });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Registre MO TAK',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDescription, validatedURL) => {
    console.error('did-fail-load', { errorCode, errorDescription, validatedURL });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/app').catch((e) => console.error('Failed to load dev URL', e));
  } else {
    mainWindow.loadURL('app://./app/').catch((e) => console.error('Failed to load app://', e));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith('http')) {
      shell.openExternal(target).catch(() => null);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const dataDir = getDataDir();
  ensureDataDir(dataDir);
  initDb(path.join(dataDir, 'registre-mo-tak.json'));
  registerIpc(ipcMain, () => mainWindow);

  ipcMain.handle('app:dataLocation', () => getDataLocation());

  if (!isDev) registerAppProtocol();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, target) => {
    if (
      !target.startsWith('http://localhost') &&
      !target.startsWith('app://') &&
      !target.startsWith('file://')
    ) {
      event.preventDefault();
      shell.openExternal(target).catch(() => null);
    }
  });
});
