type PostgrestErrorLike = {
  message?: string | null;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
} | null | undefined;

/**
 * PostgREST / Supabase : relation absente du cache schéma (migrations non appliquées, mauvais projet…).
 */
export function isPostgrestMissingTableError(
  err: PostgrestErrorLike,
  table: string,
): boolean {
  if (!err) return false;
  const m = (err.message && String(err.message)) || "";
  if (!m.includes("Could not find the table") && !m.toLowerCase().includes("schema cache")) {
    return false;
  }
  return m.includes(`public.${table}`);
}

/** Message non vide pour ne pas lancer `new Error('')` (Server Components "no message was provided"). */
export function formatPostgrestError(err: PostgrestErrorLike, context?: string): string {
  const m = (err?.message && String(err.message).trim()) || null;
  const code = (err?.code && String(err.code).trim()) || null;
  const details = (err?.details && String(err.details).trim()) || null;
  const hint = (err?.hint && String(err.hint).trim()) || null;
  const parts = [m, code, details, hint].filter((x) => x && x.length > 0) as string[];
  const base =
    parts.length > 0
      ? parts.join(" · ")
      : `Erreur PostgREST${code ? ` [${code}]` : " (aucun message explicite)"}`;
  return context ? `${context} — ${base}` : base;
}
