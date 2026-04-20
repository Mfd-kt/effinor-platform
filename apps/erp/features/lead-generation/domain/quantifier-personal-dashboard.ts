import type { QuantifierScoreBadge, WorkQualityBadge } from "../lib/quantifier-personal-score";

export type QuantifierPersonalAlertKind = "positive" | "warning" | "danger" | "neutral";

export type QuantifierPersonalAlert = {
  kind: QuantifierPersonalAlertKind;
  priority: number;
  title: string;
  message: string;
  actionHint?: string;
};

export type QuantifierActivityItem = {
  kind: "qualify" | "oot" | "return";
  companyName: string;
  at: string;
};

export type QuantifierPersonalWindow = {
  treated: number;
  qualified: number;
  outOfTarget: number;
  qualifyRatePercent: number | null;
  returnRatePercent: number | null;
  commercialReturns: number;
  autoDuplicateOot: number;
  convertedLeads: number;
  withRdv: number;
  withAccord: number;
  withVt: number;
  withInstallation: number;
  rdvVsQualifiedPercent: number | null;
  accordVsQualifiedPercent: number | null;
  requalifiedAfterReturn: number;
  rejectedAfterControl: number;
};

export type QuantifierPersonalRanking = {
  position: number | null;
  teamSize: number;
  aboveAverage: boolean;
  teamAverageScore: number | null;
  topPerformerTodayDisplayName: string | null;
  topPerformerTodayQualifyCount: number;
  userTodayQualifyCount: number;
};

export type QuantifierPersonalDashboardData = {
  userId: string;
  displayName: string;
  today: QuantifierPersonalWindow;
  week: QuantifierPersonalWindow;
  month: QuantifierPersonalWindow;
  score: { value: number; badge: QuantifierScoreBadge };
  primeToday: number;
  primeWeek: number;
  primeMonth: number;
  qualityBadge: WorkQualityBadge;
  ranking: QuantifierPersonalRanking;
  goals: {
    targetTreated: number;
    targetQualified: number;
    treated: number;
    qualified: number;
  };
  activity: QuantifierActivityItem[];
  alerts: QuantifierPersonalAlert[];
};
