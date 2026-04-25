/**
 * Types partagés pour l'intégration Apify.
 * Doc API : https://docs.apify.com/api/v2
 */

/** Statuts possibles d'un run Apify (cf. Apify API v2). */
export type ApifyRunStatus =
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "TIMING-OUT"
  | "TIMED-OUT"
  | "ABORTING"
  | "ABORTED";

/** Codes de sources Apify actives dans l'ERP. */
export type ApifySourceCode =
  | "leboncoin_immobilier"
  | "pap"
  | "pap_location";
  // Prochains : "pages_jaunes", "seloger"

/** Définition d'une source Apify dans le registry. */
export type ApifySourceDefinition = {
  code: ApifySourceCode;
  label: string;
  actorId: string;
  description: string;
  requiresCredentials: boolean;
};

/** Représentation d'un run Apify retournée par l'API. */
export type ApifyRun = {
  id: string;
  actId: string;
  status: ApifyRunStatus;
  defaultDatasetId: string;
  defaultKeyValueStoreId?: string;
  startedAt: string | null;
  finishedAt: string | null;
  stats?: {
    inputBodyLen?: number;
    restartCount?: number;
    resurrectCount?: number;
    durationMillis?: number;
  };
};

/** Input générique pour lancer un run Apify. */
export type ApifyStartRunInput = Record<string, unknown>;

/** Un item brut retourné par un dataset Apify. */
export type ApifyDatasetItem = Record<string, unknown>;
