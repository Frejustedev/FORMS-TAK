import type {
  FieldDef,
  FormSchema,
  RecordCompletion,
  RecordData,
  StoredRecord,
} from './schema-types';

/** Returns true if the field is currently visible given the record values. */
export function isFieldVisible(field: FieldDef, data: RecordData): boolean {
  if (!field.visibleIf) return true;
  const dependent = data[field.visibleIf.fieldId];
  const expected = field.visibleIf.equals;
  if (Array.isArray(expected)) {
    if (Array.isArray(dependent)) return expected.some((e) => dependent.includes(e));
    return expected.includes(dependent as string);
  }
  if (Array.isArray(dependent)) return dependent.includes(expected as string);
  return dependent === expected;
}

/** Returns true if the record has a non-empty value for this field. */
export function isFieldFilled(field: FieldDef, data: RecordData): boolean {
  const v = data[field.id];
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'boolean') return true;
  return false;
}

/** Returns ordered fields (sections by order, then fields by order). */
export function orderedFields(schema: FormSchema): FieldDef[] {
  const sectionOrder = new Map<string, number>();
  schema.sections.forEach((s) => sectionOrder.set(s.id, s.order));
  return [...schema.fields].sort((a, b) => {
    const sa = sectionOrder.get(a.sectionId) ?? 999;
    const sb = sectionOrder.get(b.sectionId) ?? 999;
    if (sa !== sb) return sa - sb;
    return a.order - b.order;
  });
}

/** Compute completion ratio + first missing required field. */
export function computeCompletion(schema: FormSchema, data: RecordData): RecordCompletion {
  const visibleFields = orderedFields(schema).filter((f) => isFieldVisible(f, data));
  const required = visibleFields.filter((f) => f.required);
  const allTotal = visibleFields.length || 1;

  let filled = 0;
  let firstMissing: string | null = null;
  const missingRequired: string[] = [];

  for (const f of visibleFields) {
    const ok = isFieldFilled(f, data);
    if (ok) filled++;
    if (!ok && f.required) {
      missingRequired.push(f.id);
      if (!firstMissing) firstMissing = f.id;
    } else if (!ok && !firstMissing) {
      firstMissing = f.id;
    }
  }

  // If all required are filled but optional ones remain, the "first missing" should be
  // the first unfilled visible field (we already set this above).
  const allRequiredFilled = missingRequired.length === 0;
  if (allRequiredFilled && filled === allTotal) {
    firstMissing = null;
  }

  return {
    filled,
    total: allTotal,
    ratio: filled / allTotal,
    missingRequiredFieldIds: missingRequired,
    firstMissingId: firstMissing,
  };
}

/** Tag a record as incomplete (some visible required field still empty). */
export function isRecordIncomplete(schema: FormSchema, record: StoredRecord): boolean {
  if (record.completedAt != null) return false;
  const c = computeCompletion(schema, record.data);
  return c.missingRequiredFieldIds.length > 0 || c.firstMissingId !== null;
}

/** Slugify helper used by the schema editor when generating field ids. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_+|_+$)/g, '')
    .slice(0, 60);
}

/** Make sure a generated field id is unique within the schema. */
export function uniqueFieldId(schema: FormSchema, base: string): string {
  let id = slugify(base) || 'field';
  let n = 2;
  const existing = new Set(schema.fields.map((f) => f.id));
  while (existing.has(id)) {
    id = `${slugify(base)}_${n}`;
    n++;
  }
  return id;
}
