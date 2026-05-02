'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { DbAdapter } from '@/lib/db/types';
import { getDb } from '@/lib/db';
import type { FormSchema } from '@/lib/schema-types';

type DataContextValue = {
  db: DbAdapter | null;
  loading: boolean;
  platform: 'electron' | 'capacitor' | 'memory' | 'unknown';
  schema: FormSchema | null;
  reloadSchema: () => Promise<void>;
};

const DataContext = createContext<DataContextValue>({
  db: null,
  loading: true,
  platform: 'unknown',
  schema: null,
  reloadSchema: async () => {},
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DbAdapter | null>(null);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadSchema = useCallback(async () => {
    if (!db) return;
    const fresh = await db.getSchema();
    setSchema(fresh);
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const adapter = await getDb();
        if (cancelled) return;
        setDb(adapter);
        const s = await adapter.getSchema();
        if (cancelled) return;
        setSchema(s);
      } catch (e) {
        console.error('Failed to initialize database', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({ db, loading, platform: db?.platform ?? 'unknown', schema, reloadSchema }),
    [db, loading, schema, reloadSchema],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);

export async function logAction(db: DbAdapter | null, action: string, details = '') {
  if (!db) return;
  try {
    await db.addLog(action, details);
  } catch (e) {
    console.error('Could not write log', e);
  }
}
