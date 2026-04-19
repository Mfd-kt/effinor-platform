/** Paramètres d’entrée pour l’import Google Maps via Apify (V1). */
export type RunGoogleMapsApifyImportInput = {
  searchStrings: string[];
  maxCrawledPlacesPerSearch?: number;
  includeWebResults?: boolean;
  /** Zone géographique pour l’actor (`locationQuery`). Si absent ou vide → France métropolitaine côté serveur. */
  locationQuery?: string;
  /** Libellé métier (lot / traçabilité), non envoyé tel quel à l’actor. */
  campaignName?: string;
  campaignSector?: string;
  /** Rattachement métier (rempli côté serveur après validation fiche ↔ équipe). */
  ceeSheetId?: string;
  ceeSheetCode?: string;
  targetTeamId?: string;
};

/** @deprecated Import synchrone (étape 7) — conservé pour typage historique. */
export type RunGoogleMapsApifyImportResult = {
  batchId: string;
  apifyRunId: string;
  datasetId: string;
  fetchedCount: number;
  ingestedCount: number;
  acceptedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  status: "completed" | "failed";
  error?: string;
};

export type StartGoogleMapsApifyImportOk = {
  batchId: string;
  apifyRunId: string;
  datasetId: string;
  externalStatus: string;
};

export type StartGoogleMapsApifyImportOutcome =
  | { ok: true; data: StartGoogleMapsApifyImportOk }
  | { ok: false; error: string; batchId?: string };

export type SyncGoogleMapsApifyImportPhase =
  | "running"
  | "failed"
  | "completed"
  | "already_completed"
  | "batch_failed"
  | "ingesting_elsewhere"
  | "invalid_batch";

export type SyncGoogleMapsApifyImportResult = {
  phase: SyncGoogleMapsApifyImportPhase;
  batchId: string;
  apifyRunId?: string;
  datasetId?: string;
  externalStatus?: string;
  fetchedCount?: number;
  ingestedCount?: number;
  acceptedCount?: number;
  duplicateCount?: number;
  rejectedCount?: number;
  /** Run Apify en échec (ex. ABORTED) mais dataset non vide ingéré. */
  partialApifyDatasetRecovery?: boolean;
  message?: string;
  error?: string;
};

/** Réponse minimale `GET /v2/actor-runs/:runId` (champs utiles). */
export type ApifyActorRunData = {
  id: string;
  status: string;
  defaultDatasetId?: string;
};

export type ApifyEnvelope<T> = {
  data: T;
};
