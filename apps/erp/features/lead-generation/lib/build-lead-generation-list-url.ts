export type LeadGenerationListSearchState = {
  company_search?: string;
  stock_status?: string;
  qualification_status?: string;
  source?: string;
  city?: string;
  page?: number;
  /** Filtre rapide cockpit : pret | enrichir | rejet | premium | contact_gap (même périmètre que « Leads à améliorer ») */
  filtre?: string;
  /** Limite la liste au lot (UUID `lead_generation_import_batches`). */
  import_batch?: string;
  /** File de dispatch (ready_now, enrich_first, …). */
  dispatch_queue_status?: string;
  /** Préparation closing (low | medium | high). */
  closing_readiness_status?: string;
};

function trim(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === "" ? undefined : t;
}

function appendListStateToParams(p: URLSearchParams, state: LeadGenerationListSearchState): void {
  const cs = trim(state.company_search);
  const ss = trim(state.stock_status);
  const qs = trim(state.qualification_status);
  const src = trim(state.source);
  const city = trim(state.city);
  const page = state.page && state.page > 1 ? state.page : undefined;
  const filtre = trim(state.filtre);
  const importBatch = trim(state.import_batch);
  const dq = trim(state.dispatch_queue_status);
  const cr = trim(state.closing_readiness_status);

  if (cs) p.set("company_search", cs);
  if (ss) p.set("stock_status", ss);
  if (qs) p.set("qualification_status", qs);
  if (src) p.set("source", src);
  if (city) p.set("city", city);
  if (page) p.set("page", String(page));
  if (filtre) p.set("filtre", filtre);
  if (importBatch) p.set("import_batch", importBatch);
  if (dq) p.set("dispatch_queue_status", dq);
  if (cr) p.set("closing_readiness_status", cr);
}

/** Carnet filtré (`/lead-generation`). */
export function buildLeadGenerationStockPageUrl(state: LeadGenerationListSearchState): string {
  const p = new URLSearchParams();
  appendListStateToParams(p, state);
  const q = p.toString();
  return q ? `/lead-generation?${q}` : "/lead-generation";
}

/** Liens rapides depuis le cockpit (vue carnet filtrée). */
export function buildLeadGenerationStockQuickFiltreUrl(
  kind: "pret" | "enrichir" | "rejet" | "premium" | "contact_gap",
): string {
  return `/lead-generation?filtre=${kind}`;
}

/** Fiches « email ou site manquant » limitées au lot du dernier parcours (déverrouille le bouton une fois traitées). */
export function buildLeadGenerationStockLockedPipelineLotUrl(importBatchId: string): string {
  return buildLeadGenerationStockPageUrl({
    filtre: "contact_gap",
    import_batch: importBatchId,
  });
}
