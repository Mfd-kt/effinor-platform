/**
 * Quand un run Apify se termine en échec (ex. ABORTED) mais que le dataset contient déjà des lignes,
 * on ingère quand même et on trace l’avertissement dans `metadata_json` (sans forcer `status = failed`).
 */

export const APIFY_PARTIAL_IMPORT_META_KEY = "apifyPartialImport" as const;

export type ApifyPartialDatasetRecoveryMeta = {
  kind: "apify_partial_dataset_recovery";
  runStatus: string;
  /** Texte métier pour audit / info (pas le message court UI). */
  warningMessage: string;
  datasetRawItemCount: number;
  at: string;
};

export function buildApifyPartialDatasetRecoveryMetadata(
  runStatus: string,
  datasetRawItemCount: number,
  atIso: string,
): ApifyPartialDatasetRecoveryMeta {
  const st = runStatus.toUpperCase();
  const warningMessage =
    st === "ABORTED"
      ? "Import partiellement récupéré : run Apify interrompu après génération de données (quota / billing)."
      : "Import partiellement récupéré : le run Apify s’est terminé en erreur mais le dataset contenait des lignes exploitables.";

  return {
    kind: "apify_partial_dataset_recovery",
    runStatus,
    warningMessage,
    datasetRawItemCount,
    at: atIso,
  };
}

export function readApifyPartialDatasetRecoveryMeta(
  metadata: unknown,
): ApifyPartialDatasetRecoveryMeta | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>)[APIFY_PARTIAL_IMPORT_META_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.kind !== "apify_partial_dataset_recovery") return null;
  const runStatus = typeof o.runStatus === "string" ? o.runStatus : "";
  const warningMessage = typeof o.warningMessage === "string" ? o.warningMessage : "";
  const datasetRawItemCount = typeof o.datasetRawItemCount === "number" ? o.datasetRawItemCount : 0;
  const at = typeof o.at === "string" ? o.at : "";
  if (!runStatus || datasetRawItemCount <= 0) return null;
  return {
    kind: "apify_partial_dataset_recovery",
    runStatus,
    warningMessage,
    datasetRawItemCount,
    at,
  };
}

/** Message court pour l’UI (détail import, etc.). */
export function formatApifyPartialRecoveryUiMessage(meta: ApifyPartialDatasetRecoveryMeta): string {
  const n = meta.datasetRawItemCount;
  if (n <= 1) {
    return "Apify s’est arrêté avant la fin, mais 1 résultat a été récupéré.";
  }
  return `Apify s’est arrêté avant la fin, mais ${n} résultats ont été récupérés.`;
}
