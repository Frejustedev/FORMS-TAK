'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData, logAction } from './DataProvider';
import type { RecordData, StoredRecord } from '@/lib/schema-types';
import { computeCompletion } from '@/lib/schema-utils';
import { DynamicForm } from './DynamicForm';
import { Button } from './ui/button';
import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import { toast } from 'sonner';

const AUTOSAVE_DELAY_MS = 1500;

export function EditRecordView() {
  const { db, schema, loading } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id') ?? '';

  const [record, setRecord] = useState<StoredRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const dataRef = useRef<RecordData>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);

  // Load record + parse #field-xxx hash
  useEffect(() => {
    if (!db || !recordId) return;
    let cancelled = false;
    (async () => {
      const r = await db.getRecord(recordId);
      if (cancelled) return;
      if (!r) {
        toast.error("Dossier introuvable");
        router.push('/app');
        return;
      }
      setRecord(r);
      dataRef.current = r.data ?? {};
      // Read hash, e.g. "#field-numero" → "numero"
      if (typeof window !== 'undefined' && window.location.hash.startsWith('#field-')) {
        setFocusFieldId(window.location.hash.replace('#field-', ''));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, recordId, router]);

  const persist = async (data: RecordData) => {
    if (!db || !schema || !recordId) return;
    setAutosaving(true);
    try {
      await db.updateRecord(recordId, data, schema.version);
      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setAutosaving(false);
    }
  };

  const onChange = (data: RecordData) => {
    dataRef.current = data;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => persist(data), AUTOSAVE_DELAY_MS);
  };

  const onSubmit = async (data: RecordData) => {
    if (!db || !schema || !recordId) return;
    setSubmitting(true);
    try {
      await db.updateRecord(recordId, data, schema.version);
      const completion = computeCompletion(schema, data);
      const isComplete = completion.firstMissingId === null;
      if (isComplete) {
        await db.markComplete(recordId, true);
        toast.success('Dossier marqué comme complet');
      } else {
        toast.success('Dossier enregistré');
      }
      logAction(db, 'UPDATE_RECORD', `Dossier ${recordId} sauvegardé`);
      router.push('/app');
    } catch (e) {
      console.error(e);
      toast.error("Erreur d'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !schema || !record) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const numero = String(record.data['numero'] ?? '');
  const nom = String(record.data['nom'] ?? '');
  const prenoms = String(record.data['prenoms'] ?? '');

  return (
    <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="flex items-center gap-2 text-primary font-medium mb-1 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
          </button>
          <h1 className="text-3xl font-bold tracking-tight">
            {numero ? `Dossier ${numero}` : 'Dossier en cours'}
            {(nom || prenoms) && (
              <span className="text-gray-500 font-normal ml-2 text-base">
                — {nom.toUpperCase()} {prenoms}
              </span>
            )}
          </h1>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          {autosaving ? (
            <>
              <Save className="w-4 h-4 animate-pulse" /> Enregistrement...
            </>
          ) : savedAt ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Enregistré à{' '}
              {savedAt.toLocaleTimeString('fr-FR')}
            </>
          ) : null}
        </div>
      </div>

      <DynamicForm
        schema={schema}
        initialData={record.data}
        onChange={onChange}
        onSubmit={onSubmit}
        isSubmitting={submitting}
        focusFieldId={focusFieldId}
      />
    </div>
  );
}
