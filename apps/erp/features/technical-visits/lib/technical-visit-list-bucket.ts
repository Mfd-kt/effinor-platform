import { isTechnicalVisitInProgress } from "@/features/technical-visits/lib/visit-in-progress";
import type { TechnicalVisitListRow } from "@/features/technical-visits/types";
import type { TechnicalVisitStatus } from "@/types/database.types";

/** Segments d’affichage liste / carte visites techniques. */
export type TechnicalVisitListBucket =
  | "active"
  | "all"
  | "today"
  | "upcoming"
  | "in_progress"
  | "to_fix"
  | "validated"
  | "other";

export const DEFAULT_TECHNICAL_VISIT_LIST_BUCKET: TechnicalVisitListBucket = "active";

export const TECHNICAL_VISIT_LIST_BUCKET_VALUES: readonly TechnicalVisitListBucket[] = [
  "active",
  "all",
  "today",
  "upcoming",
  "in_progress",
  "to_fix",
  "validated",
  "other",
] as const;

export function parseTechnicalVisitListBucket(raw: string | undefined): TechnicalVisitListBucket {
  if (raw === "all") return "all";
  if (!raw || raw === "") return DEFAULT_TECHNICAL_VISIT_LIST_BUCKET;
  if (TECHNICAL_VISIT_LIST_BUCKET_VALUES.includes(raw as TechnicalVisitListBucket)) {
    return raw as TechnicalVisitListBucket;
  }
  return DEFAULT_TECHNICAL_VISIT_LIST_BUCKET;
}

function calendarKeyParis(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function todayKeyParis(now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

function isScheduledLike(status: TechnicalVisitStatus): boolean {
  return status === "scheduled" || status === "to_schedule";
}

/** Créneau planifié « aujourd’hui » (calendrier Europe/Paris). */
export function isTechnicalVisitScheduledTodayParis(
  row: Pick<TechnicalVisitListRow, "status" | "scheduled_at">,
  now: Date = new Date(),
): boolean {
  if (!isScheduledLike(row.status)) return false;
  if (!row.scheduled_at) return false;
  return calendarKeyParis(row.scheduled_at) === todayKeyParis(now);
}

/**
 * Classe une visite pour les onglets liste (priorité métier : clôturées, alertes, retard, terrain, calendrier).
 */
export function getTechnicalVisitListBucket(
  row: TechnicalVisitListRow,
  openAlertCount: number,
  now: Date = new Date(),
): TechnicalVisitListBucket {
  const { status } = row;
  if (status === "refused" || status === "cancelled") {
    return "other";
  }
  if (status === "validated") {
    return "validated";
  }
  if (openAlertCount > 0) {
    return "to_fix";
  }

  const scheduledAt = row.scheduled_at;
  const todayK = todayKeyParis(now);

  if (isScheduledLike(status) && scheduledAt) {
    const slotK = calendarKeyParis(scheduledAt);
    if (slotK < todayK && !row.started_at) {
      return "to_fix";
    }
  }

  if (isTechnicalVisitInProgress(row) || status === "performed" || status === "report_pending") {
    return "in_progress";
  }

  if (isScheduledLike(status) && scheduledAt) {
    const slotK = calendarKeyParis(scheduledAt);
    if (slotK === todayK) {
      return "today";
    }
    if (slotK > todayK) {
      return "upcoming";
    }
  }

  if (isScheduledLike(status)) {
    return "upcoming";
  }

  return "other";
}

/** Validées, annulées, refusées : hors vue « À faire » (défaut). */
export function isVisitExcludedFromActiveWorklist(row: TechnicalVisitListRow): boolean {
  return row.status === "validated" || row.status === "cancelled" || row.status === "refused";
}

/**
 * Tri pour l’onglet « À faire » : créneau du jour → à rectifier → en cours → à venir → autres.
 * À l’intérieur d’un groupe : date de passage croissante, puis référence.
 */
export function sortVisitsForActiveList(
  rows: TechnicalVisitListRow[],
  alertCounts: Readonly<Record<string, number>>,
  now: Date = new Date(),
): TechnicalVisitListRow[] {
  const t = now;
  const rank = (row: TechnicalVisitListRow): number => {
    const b = getTechnicalVisitListBucket(row, alertCounts[row.id] ?? 0, t);
    const map: Record<TechnicalVisitListBucket, number> = {
      active: 9,
      all: 9,
      today: 0,
      to_fix: 1,
      in_progress: 2,
      upcoming: 3,
      validated: 9,
      other: 4,
    };
    return map[b] ?? 9;
  };
  const slotMs = (row: TechnicalVisitListRow): number => {
    if (!row.scheduled_at) return Number.MAX_SAFE_INTEGER;
    return new Date(row.scheduled_at).getTime();
  };
  return [...rows].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    const da = slotMs(a);
    const db = slotMs(b);
    if (da !== db) return da - db;
    return (a.vt_reference ?? "").localeCompare(b.vt_reference ?? "", "fr");
  });
}

export function countVisitsByBucket(
  rows: TechnicalVisitListRow[],
  alertCounts: Readonly<Record<string, number>>,
  now?: Date,
): Record<TechnicalVisitListBucket, number> {
  const t = now ?? new Date();
  const counts: Record<TechnicalVisitListBucket, number> = {
    active: 0,
    all: rows.length,
    today: 0,
    upcoming: 0,
    in_progress: 0,
    to_fix: 0,
    validated: 0,
    other: 0,
  };
  for (const row of rows) {
    if (!isVisitExcludedFromActiveWorklist(row)) {
      counts.active += 1;
    }
    const b = getTechnicalVisitListBucket(row, alertCounts[row.id] ?? 0, t);
    counts[b] += 1;
  }
  return counts;
}

export function filterVisitsByBucket(
  rows: TechnicalVisitListRow[],
  bucket: TechnicalVisitListBucket,
  alertCounts: Readonly<Record<string, number>>,
  now?: Date,
): TechnicalVisitListRow[] {
  const t = now ?? new Date();
  if (bucket === "all") return rows;
  if (bucket === "active") {
    return rows.filter((row) => !isVisitExcludedFromActiveWorklist(row));
  }
  return rows.filter((row) => getTechnicalVisitListBucket(row, alertCounts[row.id] ?? 0, t) === bucket);
}
