import type { DbAdapter } from './types';
import { MemoryAdapter } from './memory';

let adapterPromise: Promise<DbAdapter> | null = null;

export async function getDb(): Promise<DbAdapter> {
  if (adapterPromise) return adapterPromise;
  adapterPromise = (async () => {
    if (typeof window === 'undefined') {
      return new MemoryAdapter();
    }
    if (window.electronAPI) {
      const { ElectronAdapter } = await import('./electron');
      const adapter = new ElectronAdapter();
      await adapter.ready();
      return adapter;
    }
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
      const { CapacitorAdapter } = await import('./capacitor');
      const adapter = new CapacitorAdapter();
      await adapter.ready();
      return adapter;
    }
    return new MemoryAdapter();
  })();
  return adapterPromise;
}

export type { DbAdapter, LogEntry } from './types';
