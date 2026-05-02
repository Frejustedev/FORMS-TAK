'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from './DataProvider';
import type { StoredRecord } from '@/lib/schema-types';
import { computeCompletion } from '@/lib/schema-utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { AlertCircle, ArrowRight, Search, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function IncompletePatients() {
  const { db, schema } = useData();
  const router = useRouter();
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const refresh = useCallback(async () => {
    if (!db) return;
    const list = await db.listRecords();
    setRecords(list);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    if (!db) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const off = db.onChanged(() => refresh());
    return off;
  }, [db, refresh]);

  const incomplete = useMemo(() => {
    if (!schema) return [];
    return records
      .map((r) => {
        const c = computeCompletion(schema, r.data);
        return { record: r, completion: c };
      })
      .filter((e) => e.completion.firstMissingId !== null)
      .sort((a, b) => a.completion.ratio - b.completion.ratio);
  }, [records, schema]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return incomplete;
    return incomplete.filter((e) => {
      const nom = String(e.record.data['nom'] ?? '');
      const prenoms = String(e.record.data['prenoms'] ?? '');
      const numero = String(e.record.data['numero'] ?? '');
      return `${nom} ${prenoms} ${numero}`.toLowerCase().includes(term);
    });
  }, [incomplete, searchTerm]);

  function fieldLabel(fieldId: string | null): string {
    if (!fieldId || !schema) return '—';
    return schema.fields.find((f) => f.id === fieldId)?.label ?? fieldId;
  }

  function sectionLabelOf(fieldId: string | null): string {
    if (!fieldId || !schema) return '';
    const field = schema.fields.find((f) => f.id === fieldId);
    if (!field) return '';
    return schema.sections.find((s) => s.id === field.sectionId)?.label ?? '';
  }

  function resume(recordId: string, focusFieldId: string | null) {
    const url = focusFieldId
      ? `/app/records/edit?id=${recordId}#field-${focusFieldId}`
      : `/app/records/edit?id=${recordId}`;
    router.push(url);
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 w-full space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertCircle className="w-7 h-7 text-amber-500" />
            Dossiers à compléter
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cliquez sur « Reprendre » pour atterrir directement sur le premier champ manquant.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {incomplete.length} dossier{incomplete.length > 1 ? 's' : ''} incomplet{incomplete.length > 1 ? 's' : ''}
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <ArrowRight className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold">Aucun dossier incomplet</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              Tous vos dossiers patients sont à jour ! Bravo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ record: r, completion }) => {
            const nom = String(r.data['nom'] ?? '');
            const prenoms = String(r.data['prenoms'] ?? '');
            const numero = String(r.data['numero'] ?? '');
            const pct = Math.round(completion.ratio * 100);
            return (
              <Card key={r.id} className="hover:shadow-md transition border-amber-100 dark:border-amber-900">
                <CardContent className="py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {nom.toUpperCase()} {prenoms}
                      </span>
                      {numero && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                          N° {numero}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 max-w-md h-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                        <div
                          className="h-full rounded bg-gradient-to-r from-amber-400 to-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-gray-500 whitespace-nowrap">
                        {completion.filled}/{completion.total} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {completion.missingRequiredFieldIds.length > 0 ? (
                        <span className="text-amber-700 dark:text-amber-400">
                          {completion.missingRequiredFieldIds.length} champ
                          {completion.missingRequiredFieldIds.length > 1 ? 's' : ''} obligatoire
                          {completion.missingRequiredFieldIds.length > 1 ? 's' : ''} manquant
                          {completion.missingRequiredFieldIds.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span>Champs optionnels à compléter</span>
                      )}
                      {' · '}
                      <span>
                        Reprendre à : <strong>{fieldLabel(completion.firstMissingId)}</strong>
                        {sectionLabelOf(completion.firstMissingId) && (
                          <span className="text-gray-400"> ({sectionLabelOf(completion.firstMissingId)})</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => resume(r.id, completion.firstMissingId)}
                    className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Reprendre
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
