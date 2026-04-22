export type ImportBatchesListSearchState = {
  status?: string;
  page?: number;
};

function trim(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t === "" ? undefined : t;
}

export function buildImportBatchesListUrl(state: ImportBatchesListSearchState): string {
  const p = new URLSearchParams();
  const st = trim(state.status);
  const page = state.page && state.page > 1 ? state.page : undefined;

  if (st) p.set("status", st);
  if (page) p.set("page", String(page));

  const q = p.toString();
  return q ? `/lead-generation/imports?${q}` : "/lead-generation/imports";
}
