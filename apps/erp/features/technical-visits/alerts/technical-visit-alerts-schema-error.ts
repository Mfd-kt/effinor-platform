/**
 * PostgREST / Supabase : table absente du cache schéma tant que la migration n’est pas appliquée.
 */
export function isTechnicalVisitAlertsTableUnavailable(err: { message?: string }): boolean {
  const m = (err.message ?? "").toLowerCase();
  return (
    m.includes("technical_visit_alerts") &&
    (m.includes("schema cache") ||
      m.includes("does not exist") ||
      m.includes("could not find the table"))
  );
}
