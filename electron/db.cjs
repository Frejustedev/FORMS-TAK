const fs = require('node:fs');
const path = require('node:path');

const EMPTY_DB = () => ({
  schemaVersion: 1,
  schema: null,
  records: {},
  logs: [],
  logSeq: 0,
});

let store = EMPTY_DB();
let dbFilePath = '';
let saving = null;
let pending = false;

function readSync(filePath) {
  try {
    if (!fs.existsSync(filePath)) return EMPTY_DB();
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return EMPTY_DB();
    const parsed = JSON.parse(raw);
    return {
      schemaVersion: 1,
      schema: parsed.schema || null,
      records: parsed.records || {},
      logs: parsed.logs || [],
      logSeq: parsed.logSeq || (parsed.logs ? parsed.logs.length : 0),
    };
  } catch (e) {
    console.error('Failed to read db file, starting fresh', e);
    return EMPTY_DB();
  }
}

async function persist() {
  if (saving) {
    pending = true;
    return saving;
  }
  saving = (async () => {
    try {
      const tmp = dbFilePath + '.tmp';
      const data = JSON.stringify(store);
      await fs.promises.writeFile(tmp, data, 'utf-8');
      await fs.promises.rename(tmp, dbFilePath);
    } catch (e) {
      console.error('Failed to persist db', e);
    } finally {
      saving = null;
      if (pending) {
        pending = false;
        await persist();
      }
    }
  })();
  return saving;
}

function notifyChanged(getMainWindow) {
  try {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed()) {
      win.webContents.send('records:changed');
    }
  } catch (e) {
    console.error('notifyChanged failed', e);
  }
}

function initDb(filePath) {
  dbFilePath = filePath;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  store = readSync(filePath);
  if (!fs.existsSync(filePath)) persist();
}

function getDataLocation() {
  return dbFilePath || '(non initialisé)';
}

function registerIpc(ipcMain, getMainWindow) {
  const wrap = (fn) => async (...args) => {
    const result = await fn(...args);
    persist().catch((e) => console.error('persist failed', e));
    return result;
  };

  ipcMain.handle('schema:get', () => store.schema);
  ipcMain.handle('schema:save', wrap(async (_e, schema) => {
    store.schema = schema;
    notifyChanged(getMainWindow);
  }));

  ipcMain.handle('records:list', () =>
    Object.values(store.records).sort((a, b) => b.updatedAt - a.updatedAt),
  );
  ipcMain.handle('records:get', (_e, id) => store.records[id] || null);

  ipcMain.handle('records:create', wrap(async (_e, id, data, schemaVersion) => {
    const now = Date.now();
    const stored = {
      id,
      data: data || {},
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      schemaVersion: Number(schemaVersion) || 1,
    };
    store.records[id] = stored;
    notifyChanged(getMainWindow);
    return stored;
  }));

  ipcMain.handle('records:update', wrap(async (_e, id, data, schemaVersion) => {
    const existing = store.records[id];
    if (!existing) throw new Error(`Record ${id} not found`);
    const next = {
      ...existing,
      data: data || {},
      updatedAt: Date.now(),
      schemaVersion: Number(schemaVersion) || existing.schemaVersion,
    };
    store.records[id] = next;
    notifyChanged(getMainWindow);
    return next;
  }));

  ipcMain.handle('records:markComplete', wrap(async (_e, id, completed) => {
    const existing = store.records[id];
    if (!existing) throw new Error(`Record ${id} not found`);
    const next = {
      ...existing,
      completedAt: completed ? Date.now() : null,
      updatedAt: Date.now(),
    };
    store.records[id] = next;
    notifyChanged(getMainWindow);
    return next;
  }));

  ipcMain.handle('records:delete', wrap(async (_e, id) => {
    delete store.records[id];
    notifyChanged(getMainWindow);
  }));

  ipcMain.handle('logs:list', (_e, limit) => {
    const n = Math.max(1, Math.min(Number(limit) || 200, 5000));
    return [...store.logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, n);
  });

  ipcMain.handle('logs:add', wrap(async (_e, action, details) => {
    store.logs.push({
      id: ++store.logSeq,
      action: String(action),
      details: String(details || ''),
      timestamp: Date.now(),
    });
  }));

  ipcMain.handle('app:exportBackup', () => {
    const payload = {
      version: 1,
      platform: 'electron',
      exportedAt: new Date().toISOString(),
      schema: store.schema,
      records: Object.values(store.records),
      logs: store.logs,
    };
    const json = JSON.stringify(payload, null, 2);
    const buf = Buffer.from(json, 'utf-8');
    return {
      filename: `RegistreMOTAK-backup-${Date.now()}.json`,
      bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    };
  });

  ipcMain.handle('app:importBackup', wrap(async (_e, bytes) => {
    const buf = Buffer.from(bytes);
    const parsed = JSON.parse(buf.toString('utf-8'));
    if (parsed.schema) store.schema = parsed.schema;
    if (Array.isArray(parsed.records)) {
      for (const r of parsed.records) {
        if (r && r.id) store.records[r.id] = r;
      }
    }
    if (Array.isArray(parsed.logs)) {
      store.logs.push(...parsed.logs);
      store.logSeq = Math.max(store.logSeq, parsed.logs.length);
    }
    notifyChanged(getMainWindow);
  }));
}

module.exports = { initDb, registerIpc, getDataLocation };
