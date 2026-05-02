'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useData, logAction } from '@/components/DataProvider';
import type { RecordData } from '@/lib/schema-types';
import { DynamicForm } from '@/components/DynamicForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewRecordPage() {
  const { db, schema, loading } = useData();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const dataRef = useRef<RecordData>({});

  const onSubmit = async (data: RecordData) => {
    if (!db || !schema) {
      toast.error('Base de données indisponible');
      return;
    }
    try {
      setSubmitting(true);
      const id = crypto.randomUUID();
      await db.createRecord(id, data, schema.version);
      toast.success('Dossier créé');
      logAction(db, 'CREATE_RECORD', `Dossier ${data['numero'] || id} créé`);
      router.push('/app');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !schema) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="flex items-center gap-2 text-primary font-medium mb-1 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau dossier patient</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vous pouvez enregistrer le dossier à tout moment, même partiellement rempli — vous le retrouverez dans
            « À compléter ».
          </p>
        </div>
      </div>
      <DynamicForm
        schema={schema}
        initialData={{}}
        onChange={(d) => {
          dataRef.current = d;
        }}
        onSubmit={onSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
