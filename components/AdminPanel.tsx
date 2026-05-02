'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData, logAction } from './DataProvider';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  ArrowLeft,
  Activity,
  Shield,
  FolderOpen,
  Search,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { LogEntry } from '@/lib/db/types';

const LOGS_PAGE_SIZE = 200;

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const { db, schema, platform } = useData();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logSearch, setLogSearch] = useState('');
  const [dataPath, setDataPath] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const list = await db.listLogs(LOGS_PAGE_SIZE);
      setLogs(list);
      const loc = await db.getDataLocation();
      setDataPath(loc);
    } catch (e) {
      console.error(e);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleBackup = async () => {
    if (!db) return;
    try {
      const { filename, bytes } = await db.exportBackup();
      const blob = new Blob([bytes], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Sauvegarde téléchargée');
      logAction(db, 'BACKUP_EXPORT', filename);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleImport = async (file: File) => {
    if (!db) return;
    try {
      const bytes = await file.arrayBuffer();
      await db.importBackup(bytes);
      toast.success('Sauvegarde restaurée');
      logAction(db, 'BACKUP_IMPORT', file.name);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la restauration');
    }
  };

  const handleExportXlsx = async () => {
    if (!db || !schema) return;
    setIsExporting(true);
    try {
      const records = await db.listRecords();
      // Build dynamic columns from schema (sorted by section + field order)
      const sectionOrder = new Map(schema.sections.map((s) => [s.id, s.order]));
      const fields = [...schema.fields].sort((a, b) => {
        const sa = sectionOrder.get(a.sectionId) ?? 999;
        const sb = sectionOrder.get(b.sectionId) ?? 999;
        if (sa !== sb) return sa - sb;
        return a.order - b.order;
      });

      const rows = records.map((r) => {
        const row: Record<string, unknown> = {
          ID: r.id,
          'Date Ajout': new Date(r.createdAt).toLocaleString('fr-FR'),
          'Mis à jour': new Date(r.updatedAt).toLocaleString('fr-FR'),
          Statut: r.completedAt ? 'Complet' : 'En cours',
        };
        for (const f of fields) {
          const v = r.data[f.id];
          row[f.label] = Array.isArray(v) ? (v as string[]).join(' ; ') : (v ?? '');
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tous_Dossiers');
      XLSX.writeFile(wb, `Export_RegistreMOTAK_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Export de ${records.length} dossier(s) réussi`);
      logAction(db, 'EXPORT_GLOBAL', `${records.length} dossiers exportés`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) =>
      [l.action, l.details].some((v) => (v ?? '').toLowerCase().includes(term)),
    );
  }, [logs, logSearch]);

  return (
    <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} size="icon" className="h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-indigo-500" />
              Administration
            </h1>
            <p className="text-sm text-gray-500">Sauvegardes, exports, journal d&apos;activité</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExportXlsx}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExporting ? 'Export...' : 'Export Excel global'}
          </Button>
          <Button onClick={handleBackup} variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" /> Sauvegarde JSON
          </Button>
          <label className="inline-flex items-center justify-center text-sm font-medium px-4 py-2 rounded-md border border-input bg-background hover:bg-accent cursor-pointer gap-2">
            <Upload className="w-4 h-4" />
            Restaurer
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {dataPath && (
        <div className="mb-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-sm text-blue-900 dark:text-blue-200">
          <strong>Emplacement de la base ({platform})</strong> : <code className="text-xs">{dataPath}</code>
        </div>
      )}

      <div className="bg-white dark:bg-gray-950 border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" /> Journal d&apos;activité
          </h2>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Filtrer..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    {logs.length === 0 ? "Aucun journal d'activité" : 'Aucune entrée ne correspond.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((lg) => (
                  <TableRow key={lg.id}>
                    <TableCell className="whitespace-nowrap tabular-nums text-sm">
                      {new Date(lg.timestamp).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {lg.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{lg.details || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
