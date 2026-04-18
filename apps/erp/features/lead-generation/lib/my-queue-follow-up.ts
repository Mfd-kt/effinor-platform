import type { LeadGenerationCommercialPriority } from "../domain/statuses";
import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";

/** Fuseau métier pour « aujourd’hui / demain » cohérents côté file commerciale. */
const PARIS_TZ = "Europe/Paris";

export type MyQueueQuickFilter = "all" | "overdue" | "today" | "high_priority" | "ready_now";

export type RelanceBucket = "overdue" | "today" | "tomorrow" | "future" | "none";

export type RelanceDisplay = {
  bucket: RelanceBucket;
  label: string;
};

function parisYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function parisTimeHm(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    timeZone: PARIS_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Lendemain calendaire (Paris) par rapport à l’instant `now`. */
function tomorrowYmdParis(now: Date): string {
  let d = new Date(now.getTime());
  const start = parisYmd(d);
  for (let i = 0; i < 30; i++) {
    d = new Date(d.getTime() + 3600000);
    if (parisYmd(d) !== start) {
      return parisYmd(d);
    }
  }
  return parisYmd(new Date(now.getTime() + 48 * 3600000));
}

export function getRelanceDisplay(item: MyLeadGenerationQueueItem, now: Date = new Date()): RelanceDisplay {
  if (item.hasOverdueFollowUp) {
    return { bucket: "overdue", label: "En retard" };
  }
  const nearest = item.nearestNextActionAt;
  if (!nearest) {
    return { bucket: "none", label: "Pas de relance prévue" };
  }
  const t = new Date(nearest).getTime();
  if (Number.isNaN(t)) {
    return { bucket: "none", label: "Pas de relance prévue" };
  }
  const nowMs = now.getTime();
  if (t < nowMs) {
    return { bucket: "overdue", label: "En retard" };
  }

  const today = parisYmd(now);
  const day = parisYmd(new Date(nearest));
  const tom = tomorrowYmdParis(now);

  if (day === today) {
    return { bucket: "today", label: `Aujourd'hui ${parisTimeHm(nearest)}` };
  }
  if (day === tom) {
    return { bucket: "tomorrow", label: `Demain ${parisTimeHm(nearest)}` };
  }
  return {
    bucket: "future",
    label: new Date(nearest).toLocaleString("fr-FR", {
      timeZone: PARIS_TZ,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function priorityRank(p: LeadGenerationCommercialPriority): number {
  if (p === "critical") return 0;
  if (p === "high") return 1;
  if (p === "normal") return 2;
  return 3;
}

/** Relance future prévue aujourd’hui (Paris), sans retard détecté sur d’autres lignes. */
export function isDueTodayFuture(item: MyLeadGenerationQueueItem, now: Date = new Date()): boolean {
  if (item.hasOverdueFollowUp || !item.nearestNextActionAt) {
    return false;
  }
  const t = new Date(item.nearestNextActionAt).getTime();
  if (Number.isNaN(t) || t < now.getTime()) {
    return false;
  }
  return parisYmd(new Date(item.nearestNextActionAt)) === parisYmd(now);
}

export type QueueKpis = {
  active: number;
  overdue: number;
  dueToday: number;
  highPriority: number;
};

export function computeQueueKpis(items: MyLeadGenerationQueueItem[], now: Date = new Date()): QueueKpis {
  return {
    active: items.length,
    overdue: items.filter((i) => i.hasOverdueFollowUp).length,
    dueToday: items.filter((i) => isDueTodayFuture(i, now)).length,
    highPriority: items.filter((i) => i.commercialPriority === "critical" || i.commercialPriority === "high").length,
  };
}

export function itemMatchesQuickFilter(
  item: MyLeadGenerationQueueItem,
  filter: MyQueueQuickFilter,
  now: Date = new Date(),
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "overdue":
      return item.hasOverdueFollowUp;
    case "today":
      return isDueTodayFuture(item, now);
    case "high_priority":
      return item.commercialPriority === "critical" || item.commercialPriority === "high";
    case "ready_now":
      return item.dispatchQueueStatus === "ready_now";
    default:
      return true;
  }
}

/**
 * Tri : retards → relances du jour → demain → futur → sans date ;
 * puis priorité commerciale, puis score décroissant.
 */
export function sortQueueItems(items: MyLeadGenerationQueueItem[]): MyLeadGenerationQueueItem[] {
  const now = new Date();

  function followUpTier(i: MyLeadGenerationQueueItem): number {
    if (i.hasOverdueFollowUp) return 0;
    const rel = getRelanceDisplay(i, now);
    if (rel.bucket === "today") return 1;
    if (rel.bucket === "tomorrow") return 2;
    if (rel.bucket === "future") return 3;
    return 4;
  }

  return [...items].sort((a, b) => {
    const ta = followUpTier(a);
    const tb = followUpTier(b);
    if (ta !== tb) return ta - tb;

    if (ta === 0) {
      const ae = a.earliestOverdueAt ? new Date(a.earliestOverdueAt).getTime() : 0;
      const be = b.earliestOverdueAt ? new Date(b.earliestOverdueAt).getTime() : 0;
      if (ae !== be) return ae - be;
    }

    if (ta === 1 || ta === 2 || ta === 3) {
      const aNext = a.nearestNextActionAt ? new Date(a.nearestNextActionAt).getTime() : Number.POSITIVE_INFINITY;
      const bNext = b.nearestNextActionAt ? new Date(b.nearestNextActionAt).getTime() : Number.POSITIVE_INFINITY;
      if (aNext !== bNext) return aNext - bNext;
    }

    const pr = priorityRank(a.commercialPriority) - priorityRank(b.commercialPriority);
    if (pr !== 0) return pr;

    if (a.commercialScore !== b.commercialScore) {
      return b.commercialScore - a.commercialScore;
    }
    return new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
  });
}
