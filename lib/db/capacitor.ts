import type { FormSchema, RecordData, StoredRecord } from '@/lib/schema-types';
import type { DbAdapter, LogEntry } from './types';
import { buildInitialSchema } from '@/lib/initial-schema';

/**
 * Capacitor adapter — stores everything in localStorage as JSON.
 * Native @capacitor-community/sqlite can be wired in later if data volume grows.
 */
const SCHEMA_KEY = 'tak.schema';
const RECORDS_KEY = 'tak.records';
const LOGS_KEY = 'tak.logs';

type Listener = () => void;

function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export class CapacitorAdapter implements DbAdapter {
  readonly platform = 'capacitor' as const;
  private listeners = new Set<Listener>();

  async ready() {
    if (!readJSON<FormSchema | null>(SCHEMA_KEY, null)) {
      writeJSON(SCHEMA_KEY, buildInitialSchema());
    }
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async getSchema(): Promise<FormSchema> {
    return readJSON<FormSchema>(SCHEMA_KEY, buildInitialSchema());
  }
  async saveSchema(schema: FormSchema) {
    writeJSON(SCHEMA_KEY, { ...schema, updatedAt: Date.now() });
    this.notify();
  }

  async listRecords(): Promise<StoredRecord[]> {
    return readJSON<StoredRecord[]>(RECORDS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getRecord(id: string) {
    return readJSON<StoredRecord[]>(RECORDS_KEY, []).find((r) => r.id === id) ?? null;
  }

  async createRecord(id: string, data: RecordData, schemaVersion: number) {
    const list = readJSON<StoredRecord[]>(RECORDS_KEY, []);
    const now = Date.now();
    const stored: StoredRecord = { id, data, createdAt: now, updatedAt: now, completedAt: null, schemaVersion };
    list.push(stored);
    writeJSON(RECORDS_KEY, list);
    this.notify();
    return stored;
  }

  async updateRecord(id: string, data: RecordData, schemaVersion: number) {
    const list = readJSON<StoredRecord[]>(RECORDS_KEY, []);
    const i = list.findIndex((r) => r.id === id);
    if (i < 0) throw new Error(`Record ${id} not found`);
    const next: StoredRecord = { ...list[i], data, updatedAt: Date.now(), schemaVersion };
    list[i] = next;
    writeJSON(RECORDS_KEY, list);
    this.notify();
    return next;
  }

  async markComplete(id: string, completed: boolean) {
    const list = readJSON<StoredRecord[]>(RECORDS_KEY, []);
    const i = list.findIndex((r) => r.id === id);
    if (i < 0) throw new Error(`Record ${id} not found`);
    const next: StoredRecord = { ...list[i], completedAt: completed ? Date.now() : null, updatedAt: Date.now() };
    list[i] = next;
    writeJSON(RECORDS_KEY, list);
    this.notify();
    return next;
  }

  async deleteRecord(id: string) {
    const list = readJSON<StoredRecord[]>(RECORDS_KEY, []).filter((r) => r.id !== id);
    writeJSON(RECORDS_KEY, list);
    this.notify();
  }

  async listLogs(limit = 200) {
    return [...readJSON<LogEntry[]>(LOGS_KEY, [])].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async addLog(action: string, details = '') {
    const list = readJSON<LogEntry[]>(LOGS_KEY, []);
    list.push({ id: list.length + 1, action, details, timestamp: Date.now() });
    writeJSON(LOGS_KEY, list);
  }

  onChanged(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async getDataLocation() {
    return 'Stockage local du navigateur (sandboxé par le système)';
  }

  async exportBackup() {
    const payload = {
      version: 1,
      platform: 'capacitor',
      exportedAt: new Date().toISOString(),
      schema: await this.getSchema(),
      records: await this.listRecords(),
      logs: await this.listLogs(10000),
    };
    const json = JSON.stringify(payload, null, 2);
    const bytes = new TextEncoder().encode(json).buffer;
    return { filename: `RegistreMOTAK-backup-${Date.now()}.json`, bytes };
  }

  async importBackup(bytes: ArrayBuffer) {
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as { schema?: FormSchema; records?: StoredRecord[]; logs?: LogEntry[] };
    if (parsed.schema) writeJSON(SCHEMA_KEY, parsed.schema);
    if (parsed.records) writeJSON(RECORDS_KEY, parsed.records);
    if (parsed.logs) writeJSON(LOGS_KEY, parsed.logs);
    this.notify();
  }
}
