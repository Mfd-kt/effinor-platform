/**
 * Indication métier pour savoir si un import peut être synchronisé (sans logique Apify lourde).
 */
export function getLeadGenerationImportSyncHint(row: {
  status: string;
  external_status: string | null;
}): string {
  const st = row.status;
  const ext = row.external_status?.toUpperCase() ?? "";

  if (st === "completed") return "Terminé";
  if (st === "failed") return "Échec";
  if (st === "pending") return "En attente";

  if (st === "running") {
    if (ext === "SUCCEEDED") return "Prêt à finaliser";
    if (ext === "RUNNING" || ext === "READY" || ext === "") return "Scraping en cours";
    if (ext === "FAILED" || ext === "ABORTED" || ext === "TIMED-OUT") return "Run terminé (erreur)";
    return "En cours";
  }

  return "—";
}
