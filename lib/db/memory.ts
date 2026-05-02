import type { FormSchema, RecordData, StoredRecord } from '@/lib/schema-types';
import type { DbAdapter, LogEntry } from './types';
import { buildInitialSchema } from '@/lib/initial-schema';

type Listener = () => void;

export class MemoryAdapter implements DbAdapter {
  readonly platform = 'memory' as const;
  private schema: FormSchema = buildInitialSchema();
  private records = new Map<string, StoredRecord>();
  private logs: LogEntry[] = [];
  private logSeq = 0;
  private listeners = new Set<Listener>();

  async ready() {}

  async getSchema(): Promise<FormSchema> {
    return this.schema;
  }
  async saveSchema(schema: FormSchema): Promise<void> {
    this.schema = { ...schema, updatedAt: Date.now() };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async listRecords(): Promise<StoredRecord[]> {
    return [...this.records.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getRecord(id: string) {
    return this.records.get(id) ?? null;
  }

  async createRecord(id: string, data: RecordData, schemaVersion: number): Promise<StoredRecord> {
    const now = Date.now();
    const stored: StoredRecord = {
      id,
      data,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      schemaVersion,
    };
    this.records.set(id, stored);
    this.notify();
    return stored;
  }

  async updateRecord(id: string, data: RecordData, schemaVersion: number): Promise<StoredRecord> {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Record ${id} not found`);
    const next: StoredRecord = {
      ...existing,
      data,
      updatedAt: Date.now(),
      schemaVersion,
    };
    this.records.set(id, next);
    this.notify();
    return next;
  }

  async markComplete(id: string, completed: boolean): Promise<StoredRecord> {
    const existing = this.records.get(id);
    if (!existing) throw new Error(`Record ${id} not found`);
    const next: StoredRecord = {
      ...existing,
      completedAt: completed ? Date.now() : null,
      updatedAt: Date.now(),
    };
    this.records.set(id, next);
    this.notify();
    return next;
  }

  async deleteRecord(id: string) {
    this.records.delete(id);
    this.notify();
  }

  async listLogs(limit = 200) {
    return [...this.logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async addLog(action: string, details = '') {
    this.logs.push({
      id: ++this.logSeq,
      action,
      details,
      timestamp: Date.now(),
    });
  }

  onChanged(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async getDataLocation() {
    return null;
  }

  async exportBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      schema: this.schema,
      records: [...this.records.values()],
      logs: this.logs,
    };
    const json = JSON.stringify(payload, null, 2);
    const bytes = new TextEncoder().encode(json).buffer;
    return { filename: `RegistreMOTAK-backup-${Date.now()}.json`, bytes };
  }

  async importBackup(bytes: ArrayBuffer) {
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as {
      schema?: FormSchema;
      records?: StoredRecord[];
      logs?: LogEntry[];
    };
    if (parsed.schema) this.schema = parsed.schema;
    if (parsed.records) {
      this.records.clear();
      for (const r of parsed.records) this.records.set(r.id, r);
    }
    if (parsed.logs) {
      this.logs = parsed.logs;
      this.logSeq = parsed.logs.length;
    }
    this.notify();
  }
}
