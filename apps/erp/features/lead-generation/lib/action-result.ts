/** Enveloppe commune des server actions lead-generation (validation + erreurs prévisibles). */
export type LeadGenerationActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
