export type AiInsightAudience = "admin" | "director";

/** Sortie structurée — affichage cockpit + optionnellement enrichie par LLM. */
export type AiInsightResult = {
  summary: string;
  findings: string[];
  priorities: string[];
  recommendations: string[];
  risks: string[];
  /** true si généré sans appel LLM (fallback / pas de clé). */
  heuristicOnly: boolean;
};

/** Contexte compact sérialisable pour prompts (pas de PII inutile). */
export type AdminInsightContext = {
  audience: "admin";
  periodLabel: string;
  funnel: Record<string, number>;
  leadsCreated: { current: number; previous: number };
  alerts: { id: string; severity: string; category: string; title: string; message: string; targetLabel: string | null }[];
  structural: { id: string; severity: string; title: string; message: string }[];
  network: {
    sheets: number;
    teams: number;
    activeWorkflows: number;
  } | null;
  backlogBySheet: { label: string; count: number; sharePct: number }[];
  channelsTop: { channel: string; workflows: number; signed: number }[];
  teamsWithoutCloser: number;
  sheetsWithoutTeam: number;
};

export type DirectorInsightContext = {
  audience: "director";
  periodLabel: string;
  funnel: Record<string, number>;
  leadsCreated: { current: number; previous: number };
  signRatePct: number | null;
  lossRatePct: number | null;
  alerts: { severity: string; category: string; title: string; message: string }[];
  sheetRollup: { label: string; workflows: number; sent: number; signed: number; lost: number }[];
  channelRollup: { channel: string; workflows: number; qualifiedPlus: number; signed: number }[];
  funnelLeakHint: { from: string; to: string; dropPct: number } | null;
};

export type AnyInsightContext = AdminInsightContext | DirectorInsightContext;
