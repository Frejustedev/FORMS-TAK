import type { FormSchema, StoredRecord, RecordData } from '@/lib/schema-types';

export type LogEntry = {
  id: number;
  action: string;
  details: string;
  timestamp: number;
};

export interface DbAdapter {
  readonly platform: 'electron' | 'capacitor' | 'memory';

  ready(): Promise<void>;

  /** Schema (singleton). Returns the seeded one on first call. */
  getSchema(): Promise<FormSchema>;
  saveSchema(schema: FormSchema): Promise<void>;

  /** Records. */
  listRecords(): Promise<StoredRecord[]>;
  getRecord(id: string): Promise<StoredRecord | null>;
  createRecord(id: string, data: RecordData, schemaVersion: number): Promise<StoredRecord>;
  updateRecord(id: string, data: RecordData, schemaVersion: number): Promise<StoredRecord>;
  markComplete(id: string, completed: boolean): Promise<StoredRecord>;
  deleteRecord(id: string): Promise<void>;

  /** Logs. */
  listLogs(limit?: number): Promise<LogEntry[]>;
  addLog(action: string, details?: string): Promise<void>;

  /** Live updates. */
  onChanged(callback: () => void): () => void;

  /** Misc. */
  getDataLocation(): Promise<string | null>;
  exportBackup(): Promise<{ filename: string; bytes: ArrayBuffer }>;
  importBackup(bytes: ArrayBuffer): Promise<void>;
}
