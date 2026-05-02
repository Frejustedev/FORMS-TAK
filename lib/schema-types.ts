/**
 * Dynamic form schema — defines what fields the patient record has.
 * Stored in the database so the admin can edit it via the UI.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'enum'
  | 'multi'
  | 'boolean'
  | 'phone';

export interface FieldOption {
  value: string;
  label?: string;
}

export interface FieldDef {
  /** stable id used as DB key, e.g. "numero", "date_dgc_cdt" */
  id: string;
  /** display label, e.g. "Numéro de dossier" */
  label: string;
  /** optional helper text under the label */
  hint?: string;
  /** id of the section this field belongs to */
  sectionId: string;
  /** input type */
  type: FieldType;
  /** choices for enum / multi */
  options?: FieldOption[];
  /** required for completeness check */
  required?: boolean;
  /** show only if another field has a given value (simple conditional) */
  visibleIf?: { fieldId: string; equals: string | number | boolean | string[] };
  /** numeric bounds */
  min?: number;
  max?: number;
  /** display order within the section */
  order: number;
}

export interface SectionDef {
  id: string;
  label: string;
  description?: string;
  /** display order */
  order: number;
}

export interface FormSchema {
  /** monotonic version, bumped on every save */
  version: number;
  /** canonical updatedAt millis */
  updatedAt: number;
  sections: SectionDef[];
  fields: FieldDef[];
}

/** A patient record uses a dynamic key/value map keyed by field id. */
export type RecordData = Record<string, unknown>;

export interface StoredRecord {
  id: string;
  data: RecordData;
  /** auto-derived */
  createdAt: number;
  updatedAt: number;
  /** explicit "the user clicked Submit and validated" */
  completedAt: number | null;
  /** version of the schema this record was last saved against */
  schemaVersion: number;
}

export type RecordCompletion = {
  filled: number;
  total: number;
  /** 0..1 */
  ratio: number;
  /** ids of required fields still empty, in form order */
  missingRequiredFieldIds: string[];
  /** id of the first empty required field for "resume" UX */
  firstMissingId: string | null;
};

export const SCHEMA_DOC_ID = 'current';
