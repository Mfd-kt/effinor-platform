export type ImportBatchesListSearchState = {
  source?: string;
  status?: string;
  external_status?: string;
  page?: number;
};

function trim(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === "" ? undefined : t;
}

export function buildImportBatchesListUrl(state: ImportBatchesListSearchState): string {
  const p = new URLSearchParams();
  const src = trim(state.source);
  const st = trim(state.status);
  const es = trim(state.external_status);
  const page = state.page && state.page > 1 ? state.page : undefined;

  if (src) p.set("source", src);
  if (st) p.set("status", st);
  if (es) p.set("external_status", es);
  if (page) p.set("page", String(page));

  const q = p.toString();
  return q ? `/lead-generation/imports?${q}` : "/lead-generation/imports";
}
