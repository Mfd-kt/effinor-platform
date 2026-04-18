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
  /** Batch coordinateur multi-source : ingestion différée jusqu’à fusion Maps + YP. */
  multiSourceCoordinatorBatchId?: string;
  multiSourceDeferIngest?: boolean;
  /**
   * Multi-source : ne pas lancer Pages Jaunes tout de suite ; ingestion Maps seule puis overlay YP (parcours unifié).
   * Ignoré si pas de coordinateur / pas d’actor YP configuré.
   */
  deferYellowPages?: boolean;
};

/** Import Pages Jaunes — même surface de recherche que Maps (adapter l’actor Apify si besoin). */
export type RunYellowPagesApifyImportInput = RunGoogleMapsApifyImportInput & {
  maxYellowPagesResults?: number;
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
  | "completed_deferred"
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
