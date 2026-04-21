import type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";

/** Bloc cash & résultats (période cockpit). */
export type CommercialAgentCashKpis = {
  /** Somme des montants sur dossiers gagnés (HT, valeur retenue en base). */
  revenueHt: number;
  signedCount: number;
  lostCount: number;
  /** % signés parmi (signés + perdus) sur la période ; null si aucun terminal. */
  signatureRatePct: number | null;
};

/** Entonnoir métier (volumétrie période, même fenêtre que le sélecteur cockpit). */
export type CommercialAgentPipelineFunnel = {
  leadsReceived: number;
  leadsContacted: number;
  rdvScheduled: number;
  quotesSent: number;
  signed: number;
  /** Taux entre étapes consécutives (null si dénominateur nul). */
  conversionContactedPct: number | null;
  conversionRdvPct: number | null;
  conversionQuotePct: number | null;
  conversionSignedPct: number | null;
};

/** Agrégats qualité sur stock lead gen (assignations agent avec payload GPT). */
export type CommercialAgentLeadGenQuality = {
  sampleSize: number;
  avgLeadScore: number | null;
  pctGood: number | null;
  pctReview: number | null;
  pctOutOfTarget: number | null;
};

/** Ratios d’efficacité agent (période). */
export type CommercialAgentEfficiency = {
  /** Somme des `attempt_count` sur assignations LG actives (proxy appels). */
  lgCallAttempts: number;
  rdvCount: number;
  quotesSentCount: number;
  signedCount: number;
  rdvPerLeadPct: number | null;
  quotePerRdvPct: number | null;
  signedPerQuotePct: number | null;
};

export type CommercialAgentPriorityBlock = {
  id: string;
  title: string;
  count: number;
  href: string;
  hint?: string;
};

export type CommercialAgentTrajectoryLead = {
  id: string;
  companyName: string;
  at: string;
  amountHt: number | null;
  lossReason: string | null;
};

export type CommercialAgentCockpitData = {
  range: CockpitIsoRange;
  cash: CommercialAgentCashKpis;
  pipeline: CommercialAgentPipelineFunnel;
  leadGenQuality: CommercialAgentLeadGenQuality;
  efficiency: CommercialAgentEfficiency;
  priorities: CommercialAgentPriorityBlock[];
  signedRecent: CommercialAgentTrajectoryLead[];
  lostRecent: CommercialAgentTrajectoryLead[];
};
