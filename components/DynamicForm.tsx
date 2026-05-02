'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  FieldDef,
  FormSchema,
  RecordData,
  SectionDef,
} from '@/lib/schema-types';
import { isFieldVisible, orderedFields, computeCompletion } from '@/lib/schema-utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

interface DynamicFormProps {
  schema: FormSchema;
  initialData?: RecordData;
  onChange?: (data: RecordData) => void;
  onSubmit?: (data: RecordData) => void;
  isSubmitting?: boolean;
  /** id of the field to scroll to and focus on mount */
  focusFieldId?: string | null;
  /** show the "Submit" button */
  showSubmit?: boolean;
}

function fieldAnchorId(id: string) {
  return `field-${id}`;
}

export function DynamicForm({
  schema,
  initialData,
  onChange,
  onSubmit,
  isSubmitting,
  focusFieldId,
  showSubmit = true,
}: DynamicFormProps) {
  const [data, setData] = useState<RecordData>(initialData ?? {});
  const containerRef = useRef<HTMLFormElement | null>(null);

  const sortedFields = useMemo(() => orderedFields(schema), [schema]);
  const sectionsById = useMemo(() => {
    const map = new Map<string, SectionDef>();
    for (const s of [...schema.sections].sort((a, b) => a.order - b.order)) map.set(s.id, s);
    return map;
  }, [schema.sections]);

  const visibleFieldsBySection = useMemo(() => {
    const map = new Map<string, FieldDef[]>();
    for (const f of sortedFields) {
      if (!isFieldVisible(f, data)) continue;
      const arr = map.get(f.sectionId) ?? [];
      arr.push(f);
      map.set(f.sectionId, arr);
    }
    return map;
  }, [sortedFields, data]);

  const completion = useMemo(() => computeCompletion(schema, data), [schema, data]);

  useEffect(() => {
    if (!focusFieldId) return;
    const el = document.getElementById(fieldAnchorId(focusFieldId));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, textarea, [role="combobox"]') as HTMLElement | null;
      input?.focus();
    }
  }, [focusFieldId]);

  function setField(id: string, value: unknown) {
    setData((prev) => {
      const next = { ...prev, [id]: value };
      onChange?.(next);
      return next;
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(data);
  };

  function renderField(field: FieldDef) {
    const value = data[field.id];
    const idAttr = field.id;

    switch (field.type) {
      case 'text':
      case 'phone':
        return (
          <Input
            id={idAttr}
            type={field.type === 'phone' ? 'tel' : 'text'}
            value={(value as string) ?? ''}
            onChange={(e) => setField(field.id, e.target.value)}
            className="bg-muted/50"
          />
        );
      case 'textarea':
        return (
          <textarea
            id={idAttr}
            rows={3}
            value={(value as string) ?? ''}
            onChange={(e) => setField(field.id, e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        );
      case 'number':
        return (
          <Input
            id={idAttr}
            type="number"
            min={field.min}
            max={field.max}
            value={value === undefined || value === null || value === '' ? '' : String(value)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') setField(field.id, undefined);
              else {
                const n = Number(v);
                setField(field.id, Number.isFinite(n) ? n : undefined);
              }
            }}
            className="bg-muted/50"
          />
        );
      case 'date':
        return (
          <Input
            id={idAttr}
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => setField(field.id, e.target.value)}
            className="bg-muted/50"
          />
        );
      case 'enum':
        return (
          <Select
            value={(value as string) ?? ''}
            onValueChange={(v) => setField(field.id, v)}
          >
            <SelectTrigger id={idAttr}>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label ?? opt.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multi':
        return (
          <MultiSelect
            id={idAttr}
            value={Array.isArray(value) ? (value as string[]) : []}
            options={field.options ?? []}
            onChange={(v) => setField(field.id, v)}
          />
        );
      case 'boolean':
        return (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setField(field.id, true)}
              className={`px-4 py-2 rounded-md border ${value === true ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-input'}`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setField(field.id, false)}
              className={`px-4 py-2 rounded-md border ${value === false ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-input'}`}
            >
              Non
            </button>
          </div>
        );
      default:
        return <span className="text-sm text-red-500">Type inconnu : {field.type}</span>;
    }
  }

  return (
    <form ref={containerRef} onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Progress header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-3 px-4 rounded-2xl border shadow-sm flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Progression du dossier
            </span>
            <span className="text-xs tabular-nums text-gray-700 dark:text-gray-300">
              {completion.filled} / {completion.total} champs ({Math.round(completion.ratio * 100)}%)
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{ width: `${Math.round(completion.ratio * 100)}%` }}
            />
          </div>
        </div>
        {completion.missingRequiredFieldIds.length > 0 ? (
          <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-3 h-3 mr-1" />
            {completion.missingRequiredFieldIds.length} obligatoire(s) manquant(s)
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Tous les champs requis sont remplis
          </Badge>
        )}
      </div>

      {/* Sections */}
      {[...sectionsById.values()].map((section) => {
        const fields = visibleFieldsBySection.get(section.id) ?? [];
        if (fields.length === 0) return null;
        return (
          <Card key={section.id} className="border-0 shadow-sm ring-1 ring-gray-900/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>{section.label}</span>
                <span className="text-xs font-normal text-gray-400">
                  {fields.filter((f) => isFieldFilledHelper(data[f.id])).length}/{fields.length}
                </span>
              </CardTitle>
              {section.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{section.description}</p>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {fields.map((f) => (
                <div
                  key={f.id}
                  id={fieldAnchorId(f.id)}
                  className="space-y-1.5"
                >
                  <Label htmlFor={f.id} className="flex items-center gap-1">
                    {f.label}
                    {f.required && <span className="text-red-500">*</span>}
                  </Label>
                  {f.hint && <p className="text-xs text-muted-foreground -mt-0.5">{f.hint}</p>}
                  {renderField(f)}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {showSubmit && (
        <div className="sticky sm:bottom-4 bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border rounded-2xl shadow-lg flex justify-end gap-3 z-10">
          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le dossier'}
          </Button>
        </div>
      )}
    </form>
  );
}

function isFieldFilledHelper(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'boolean') return true;
  return false;
}

function MultiSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string[];
  options: { value: string; label?: string }[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md border border-input bg-muted/50 text-left"
      >
        <span className="flex flex-wrap gap-1 min-w-0 items-center">
          {value.length === 0 ? (
            <span className="text-muted-foreground">Sélectionner un ou plusieurs...</span>
          ) : (
            value.map((v) => (
              <Badge key={v} variant="secondary" className="text-[11px]">
                {options.find((o) => o.value === v)?.label ?? v}
              </Badge>
            ))
          )}
        </span>
        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {options.map((opt) => {
            const active = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${active ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              >
                <span>{opt.label ?? opt.value}</span>
                {active && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
