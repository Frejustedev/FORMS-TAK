'use client';

import { useEffect, useMemo, useState } from 'react';
import { useData } from './DataProvider';
import type { FieldDef, FieldType, FormSchema, SectionDef } from '@/lib/schema-types';
import { uniqueFieldId, slugify } from '@/lib/schema-utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
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
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Layers, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const TYPES: FieldType[] = ['text', 'textarea', 'number', 'date', 'enum', 'multi', 'boolean', 'phone'];

export function SchemaEditor() {
  const { schema, db, reloadSchema } = useData();
  const [draft, setDraft] = useState<FormSchema | null>(schema);
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'section' | 'field'; id: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(schema);
    setDirty(false);
  }, [schema]);

  const sortedSections = useMemo(
    () => (draft ? [...draft.sections].sort((a, b) => a.order - b.order) : []),
    [draft],
  );

  if (!draft) {
    return <div className="p-12 text-center text-gray-500">Chargement du schéma...</div>;
  }

  const update = (next: FormSchema) => {
    // updatedAt is bumped at save time (in the save() function), keeping render pure here
    setDraft(next);
    setDirty(true);
  };

  const addSection = () => {
    const id = uniqueSectionId(draft, 'nouvelle_section');
    const order = (draft.sections.reduce((m, s) => Math.max(m, s.order), 0) || 0) + 1;
    update({
      ...draft,
      sections: [...draft.sections, { id, label: 'Nouvelle section', order }],
    });
  };

  const updateSection = (id: string, patch: Partial<SectionDef>) => {
    update({
      ...draft,
      sections: draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const moveSection = (id: string, dir: -1 | 1) => {
    const ss = [...draft.sections].sort((a, b) => a.order - b.order);
    const idx = ss.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= ss.length) return;
    [ss[idx].order, ss[swap].order] = [ss[swap].order, ss[idx].order];
    update({ ...draft, sections: ss });
  };

  const deleteSection = (id: string) => {
    update({
      ...draft,
      sections: draft.sections.filter((s) => s.id !== id),
      fields: draft.fields.filter((f) => f.sectionId !== id),
    });
    setConfirmDelete(null);
  };

  const addField = (sectionId: string) => {
    const id = uniqueFieldId(draft, 'nouveau_champ');
    const order = (draft.fields.filter((f) => f.sectionId === sectionId).reduce((m, f) => Math.max(m, f.order), 0) || 0) + 1;
    const field: FieldDef = {
      id,
      label: 'Nouveau champ',
      sectionId,
      type: 'text',
      order,
    };
    update({ ...draft, fields: [...draft.fields, field] });
  };

  const updateField = (id: string, patch: Partial<FieldDef>) => {
    update({
      ...draft,
      fields: draft.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const moveField = (id: string, dir: -1 | 1) => {
    const f = draft.fields.find((x) => x.id === id);
    if (!f) return;
    const same = draft.fields
      .filter((x) => x.sectionId === f.sectionId)
      .sort((a, b) => a.order - b.order);
    const idx = same.findIndex((x) => x.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= same.length) return;
    [same[idx].order, same[swap].order] = [same[swap].order, same[idx].order];
    update({ ...draft, fields: [...draft.fields] });
  };

  const deleteField = (id: string) => {
    update({ ...draft, fields: draft.fields.filter((f) => f.id !== id) });
    setConfirmDelete(null);
  };

  const save = async () => {
    if (!db || !draft) return;
    try {
      const next: FormSchema = { ...draft, version: draft.version + 1, updatedAt: Date.now() };
      await db.saveSchema(next);
      await reloadSchema();
      toast.success(`Schéma enregistré (v${next.version})`);
      setDirty(false);
      db.addLog('SCHEMA_SAVE', `${draft.sections.length} sections, ${draft.fields.length} champs`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur d'enregistrement");
    }
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 w-full space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-500" />
            Éditeur de questionnaire
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Modifiez les sections et les champs ; les modifications s&apos;appliquent à tous les futurs dossiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              Modifications non enregistrées
            </Badge>
          )}
          <Button variant="outline" onClick={addSection} className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter une section
          </Button>
          <Button onClick={save} disabled={!dirty} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4" /> Enregistrer (v{draft.version + 1})
          </Button>
        </div>
      </header>

      {sortedSections.map((section) => {
        const fields = draft.fields
          .filter((f) => f.sectionId === section.id)
          .sort((a, b) => a.order - b.order);
        return (
          <Card key={section.id} className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-3 flex-row items-start gap-3 space-y-0">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, -1)}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, 1)}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Titre de la section</Label>
                  <Input
                    value={section.label}
                    onChange={(e) => updateSection(section.id, { label: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Description (optionnelle)</Label>
                  <Input
                    value={section.description ?? ''}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDelete({ kind: 'section', id: section.id })}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {fields.length === 0 ? (
                <p className="text-sm text-gray-500 italic px-2">Aucun champ dans cette section.</p>
              ) : (
                fields.map((field) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    schema={draft}
                    onUpdate={(p) => updateField(field.id, p)}
                    onMoveUp={() => moveField(field.id, -1)}
                    onMoveDown={() => moveField(field.id, 1)}
                    onDelete={() => setConfirmDelete({ kind: 'field', id: field.id })}
                  />
                ))
              )}
              <Button variant="outline" size="sm" onClick={() => addField(section.id)} className="gap-2 mt-2">
                <Plus className="w-4 h-4" /> Ajouter un champ
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {confirmDelete?.kind === 'section' ? 'la section' : 'le champ'} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.kind === 'section'
                ? "Cette action supprimera la section et TOUS les champs qu'elle contient. Les valeurs déjà saisies dans les dossiers existants ne seront plus visibles dans le formulaire (mais resteront stockées en base)."
                : "Le champ sera retiré du formulaire. Les valeurs déjà saisies resteront en base mais ne seront plus visibles ni modifiables."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (!confirmDelete) return;
                if (confirmDelete.kind === 'section') deleteSection(confirmDelete.id);
                else deleteField(confirmDelete.id);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FieldEditor({
  field,
  schema,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  field: FieldDef;
  schema: FormSchema;
  onUpdate: (p: Partial<FieldDef>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 bg-white dark:bg-gray-950">
      <div className="flex items-start gap-2">
        <div className="flex flex-col">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp}>
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown}>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Libellé"
          />
          <Select value={field.type} onValueChange={(v) => onUpdate({ type: v as FieldType })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {labelForType(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={!!field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
              />
              Obligatoire
            </label>
            <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)} className="ml-auto gap-1">
              <Pencil className="w-3 h-3" />
              {expanded ? 'Replier' : 'Détails'}
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-500">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 pl-9 grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3">
          <div>
            <Label className="text-xs">Identifiant (clé en base)</Label>
            <Input
              value={field.id}
              onChange={(e) => onUpdate({ id: slugify(e.target.value) || field.id })}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Texte d&apos;aide (hint)</Label>
            <Input
              value={field.hint ?? ''}
              onChange={(e) => onUpdate({ hint: e.target.value })}
            />
          </div>
          {(field.type === 'enum' || field.type === 'multi') && (
            <div className="md:col-span-2">
              <Label className="text-xs">Choix possibles (un par ligne)</Label>
              <textarea
                rows={Math.min(8, Math.max(3, (field.options?.length ?? 0) + 1))}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-muted/50 font-mono"
                value={(field.options ?? []).map((o) => o.value).join('\n')}
                onChange={(e) =>
                  onUpdate({
                    options: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((value) => ({ value })),
                  })
                }
              />
            </div>
          )}
          {field.type === 'number' && (
            <>
              <div>
                <Label className="text-xs">Minimum</Label>
                <Input
                  type="number"
                  value={field.min ?? ''}
                  onChange={(e) => onUpdate({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Maximum</Label>
                <Input
                  type="number"
                  value={field.max ?? ''}
                  onChange={(e) => onUpdate({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <Label className="text-xs">Visible si (optionnel)</Label>
            <div className="flex gap-2">
              <Select
                value={field.visibleIf?.fieldId ?? ''}
                onValueChange={(v) => {
                  if (!v) {
                    onUpdate({ visibleIf: undefined });
                    return;
                  }
                  onUpdate({ visibleIf: { fieldId: v, equals: field.visibleIf?.equals ?? '' } });
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Aucune condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— aucune condition —</SelectItem>
                  {schema.fields
                    .filter((f) => f.id !== field.id)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {field.visibleIf && (
                <Input
                  value={String(field.visibleIf.equals ?? '')}
                  onChange={(e) =>
                    onUpdate({
                      visibleIf: { fieldId: field.visibleIf!.fieldId, equals: e.target.value },
                    })
                  }
                  placeholder="Valeur attendue"
                  className="flex-1"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function uniqueSectionId(schema: FormSchema, base: string): string {
  let id = slugify(base) || 'section';
  let n = 2;
  const existing = new Set(schema.sections.map((s) => s.id));
  while (existing.has(id)) {
    id = `${slugify(base)}_${n}`;
    n++;
  }
  return id;
}

function labelForType(t: FieldType): string {
  switch (t) {
    case 'text': return 'Texte court';
    case 'textarea': return 'Texte long';
    case 'number': return 'Nombre';
    case 'date': return 'Date';
    case 'enum': return 'Liste déroulante (1 choix)';
    case 'multi': return 'Liste déroulante (plusieurs choix)';
    case 'boolean': return 'Oui / Non';
    case 'phone': return 'Téléphone';
    default: return t;
  }
}
