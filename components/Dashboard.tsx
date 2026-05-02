'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData, logAction } from './DataProvider';
import type { StoredRecord } from '@/lib/schema-types';
import { computeCompletion } from '@/lib/schema-utils';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  ActivitySquare,
  AlertCircle,
  CheckCircle2,
  Edit2,
  FilePlus2,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 20;

export function Dashboard() {
  const { db, schema } = useData();
  const router = useRouter();
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'complete'>('all');
  const [recordToDelete, setRecordToDelete] = useState<StoredRecord | null>(null);

  const refresh = useCallback(async () => {
    if (!db) return;
    try {
      const list = await db.listRecords();
      setRecords(list);
    } catch (e) {
      console.error(e);
      toast.error('Impossible de charger les dossiers');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (!db) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const off = db.onChanged(() => refresh());
    return off;
  }, [db, refresh]);

  const enriched = useMemo(() => {
    if (!schema) return [];
    return records.map((r) => {
      const c = computeCompletion(schema, r.data);
      const nom = String(r.data['nom'] ?? '');
      const prenoms = String(r.data['prenoms'] ?? '');
      const numero = String(r.data['numero'] ?? '');
      return { record: r, completion: c, nom, prenoms, numero };
    });
  }, [records, schema]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return enriched.filter((e) => {
      if (term) {
        const hay = `${e.nom} ${e.prenoms} ${e.numero}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (statusFilter === 'complete' && e.completion.firstMissingId !== null) return false;
      if (statusFilter === 'incomplete' && e.completion.firstMissingId === null) return false;
      return true;
    });
  }, [enriched, searchTerm, statusFilter]);

  const incompleteCount = enriched.filter((e) => e.completion.firstMissingId !== null).length;

  const handleDelete = async () => {
    if (!recordToDelete || !db) return;
    try {
      await db.deleteRecord(recordToDelete.id);
      logAction(db, 'DELETE_RECORD', `Dossier ${recordToDelete.id} supprimé`);
      toast.success('Dossier supprimé');
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression');
    } finally {
      setRecordToDelete(null);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <ActivitySquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
              Registre MO TAK — {schema?.fields.length ?? 0} champs actifs · v{schema?.version}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <Button onClick={() => router.push('/app/records/new')} className="gap-2">
            <FilePlus2 className="h-4 w-4" /> Nouveau dossier
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total dossiers" value={records.length} />
        <StatCard
          icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
          label="Dossiers incomplets"
          value={incompleteCount}
          accent={incompleteCount > 0 ? 'amber' : undefined}
          onClick={() => setStatusFilter('incomplete')}
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          label="Dossiers complets"
          value={records.length - incompleteCount}
          accent="emerald"
          onClick={() => setStatusFilter('complete')}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, prénom ou N°..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
          {(
            [
              ['all', 'Tous'],
              ['incomplete', 'Incomplets'],
              ['complete', 'Complets'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === key
                  ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <FilePlus2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold">Aucun dossier</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            Démarrez en créant votre premier dossier patient.
          </p>
          <Button className="mt-8" onClick={() => router.push('/app/records/new')}>
            <FilePlus2 className="w-4 h-4 mr-2" /> Créer un dossier
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-950 border rounded-2xl shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-900/50">
                <TableHead>N° Dossier</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Complétion</TableHead>
                <TableHead>Mis à jour</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    Aucun dossier ne correspond.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, ITEMS_PER_PAGE * 5).map(({ record: r, completion, nom, prenoms, numero }) => (
                  <TableRow key={r.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                    <TableCell className="font-medium">
                      {numero || <span className="text-gray-400 italic">non défini</span>}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{nom.toUpperCase()} {prenoms}</div>
                    </TableCell>
                    <TableCell>
                      {completion.firstMissingId === null ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Complet
                        </Badge>
                      ) : completion.missingRequiredFieldIds.length > 0 ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {completion.missingRequiredFieldIds.length} obligatoires manquants
                        </Badge>
                      ) : (
                        <Badge variant="outline">En cours</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                          <div
                            className={`h-full rounded ${completion.ratio === 1 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.round(completion.ratio * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-gray-500 w-12 text-right">
                          {completion.filled}/{completion.total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(r.updatedAt).toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const focus = completion.firstMissingId;
                            const url = focus
                              ? `/app/records/edit?id=${r.id}#field-${focus}`
                              : `/app/records/edit?id=${r.id}`;
                            router.push(url);
                          }}
                          className="h-8 w-8 text-blue-600"
                          title="Reprendre la saisie"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRecordToDelete(r)}
                          className="h-8 w-8 text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!recordToDelete} onOpenChange={(o) => !o && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données du dossier seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: 'amber' | 'emerald';
  onClick?: () => void;
}) {
  const ring = accent === 'amber' ? 'ring-amber-200' : accent === 'emerald' ? 'ring-emerald-200' : '';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-white dark:bg-gray-950 p-4 border rounded-2xl shadow-sm hover:shadow-md transition ring-1 ${ring}`}
    >
      <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
        {icon} {label}
      </div>
      <div className="text-3xl font-bold mt-1 tabular-nums">{value}</div>
    </button>
  );
}
