import type { FormSchema, RecordData, StoredRecord } from '@/lib/schema-types';
import type { DbAdapter, LogEntry } from './types';

type ElectronAPI = {
  schema: {
    get: () => Promise<FormSchema | null>;
    save: (schema: FormSchema) => Promise<void>;
  };
  records: {
    list: () => Promise<StoredRecord[]>;
    get: (id: string) => Promise<StoredRecord | null>;
    create: (id: string, data: RecordData, schemaVersion: number) => Promise<StoredRecord>;
    update: (id: string, data: RecordData, schemaVersion: number) => Promise<StoredRecord>;
    markComplete: (id: string, completed: boolean) => Promise<StoredRecord>;
    delete: (id: string) => Promise<void>;
    onChanged: (callback: () => void) => () => void;
  };
  logs: {
    list: (limit?: number) => Promise<LogEntry[]>;
    add: (action: string, details?: string) => Promise<void>;
  };
  app: {
    dataLocation: () => Promise<string>;
    exportBackup: () => Promise<{ filename: string; bytes: ArrayBuffer }>;
    importBackup: (bytes: ArrayBuffer) => Promise<void>;
  };
};

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export class ElectronAdapter implements DbAdapter {
  readonly platform = 'electron' as const;
  private api: ElectronAPI;

  constructor() {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('ElectronAPI not available');
    }
    this.api = window.electronAPI;
  }

  async ready() {}

  async getSchema(): Promise<FormSchema> {
    const fromDb = await this.api.schema.get();
    if (fromDb) return fromDb;
    const { buildInitialSchema } = await import('@/lib/initial-schema');
    const seeded = buildInitialSchema();
    await this.api.schema.save(seeded);
    return seeded;
  }
  saveSchema(schema: FormSchema) {
    return this.api.schema.save(schema);
  }

  listRecords() {
    return this.api.records.list();
  }
  getRecord(id: string) {
    return this.api.records.get(id);
  }
  createRecord(id: string, data: RecordData, schemaVersion: number) {
    return this.api.records.create(id, data, schemaVersion);
  }
  updateRecord(id: string, data: RecordData, schemaVersion: number) {
    return this.api.records.update(id, data, schemaVersion);
  }
  markComplete(id: string, completed: boolean) {
    return this.api.records.markComplete(id, completed);
  }
  deleteRecord(id: string) {
    return this.api.records.delete(id);
  }

  listLogs(limit?: number) {
    return this.api.logs.list(limit);
  }
  addLog(action: string, details?: string) {
    return this.api.logs.add(action, details);
  }

  onChanged(callback: () => void) {
    return this.api.records.onChanged(callback);
  }

  async getDataLocation() {
    return this.api.app.dataLocation();
  }
  exportBackup() {
    return this.api.app.exportBackup();
  }
  importBackup(bytes: ArrayBuffer) {
    return this.api.app.importBackup(bytes);
  }
}
