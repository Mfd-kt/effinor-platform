/** Construit l'URL de la liste des visites techniques en conservant filtres et vue. */
export function buildTechnicalVisitsListUrl(params: {
  q?: string;
  status?: string;
  lead_id?: string;
  view?: "list" | "map";
}): string {
  const p = new URLSearchParams();
  if (params.q?.trim()) p.set("q", params.q.trim());
  if (params.status && params.status !== "all") p.set("status", params.status);
  if (params.lead_id && params.lead_id !== "all") p.set("lead_id", params.lead_id);
  if (params.view === "map") p.set("view", "map");
  const s = p.toString();
  return s ? `/technical-visits?${s}` : "/technical-visits";
}
