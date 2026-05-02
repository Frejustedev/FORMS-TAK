const { contextBridge, ipcRenderer } = require('electron');

const schema = {
  get: () => ipcRenderer.invoke('schema:get'),
  save: (s) => ipcRenderer.invoke('schema:save', s),
};

const records = {
  list: () => ipcRenderer.invoke('records:list'),
  get: (id) => ipcRenderer.invoke('records:get', id),
  create: (id, data, schemaVersion) =>
    ipcRenderer.invoke('records:create', id, data, schemaVersion),
  update: (id, data, schemaVersion) =>
    ipcRenderer.invoke('records:update', id, data, schemaVersion),
  markComplete: (id, completed) => ipcRenderer.invoke('records:markComplete', id, completed),
  delete: (id) => ipcRenderer.invoke('records:delete', id),
  onChanged: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('records:changed', handler);
    return () => ipcRenderer.off('records:changed', handler);
  },
};

const logs = {
  list: (limit) => ipcRenderer.invoke('logs:list', limit),
  add: (action, details) => ipcRenderer.invoke('logs:add', action, details),
};

const appApi = {
  dataLocation: () => ipcRenderer.invoke('app:dataLocation'),
  exportBackup: () => ipcRenderer.invoke('app:exportBackup'),
  importBackup: (bytes) => ipcRenderer.invoke('app:importBackup', bytes),
};

contextBridge.exposeInMainWorld('electronAPI', {
  schema,
  records,
  logs,
  app: appApi,
});
