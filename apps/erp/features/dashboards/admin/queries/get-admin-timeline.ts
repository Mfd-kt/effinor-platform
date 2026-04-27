import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  listTodayHourBuckets,
  listParisDayBucketRangesInCockpitPeriod,
} from "@/features/dashboard/lib/cockpit-period";

import type { TimelinePoint, TimelineSeries } from "../../widgets/timeline-chart";
import type { DashboardPeriod } from "../../shared/types";
import { getAdminCurrentRange } from "../lib/get-admin-date-ranges";

export type AdminTimeline = {
  points: TimelinePoint[];
  series: TimelineSeries[];
};

function splitRangeEqualParts(
  startIso: string,
  endIso: string,
  parts: number,
  labelPrefix: string,
): { startIso: string; endIso: string; label: string }[] {
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  const w = (b - a) / parts;
  return Array.from({ length: parts }, (_, i) => ({
    startIso: new Date(a + i * w).toISOString(),
    endIso: new Date(a + (i + 1) * w).toISOString(),
    label: `${labelPrefix}${i + 1}`,
  }));
}

/**
 * Courbes leads créés, passages en accord, conversions — par bucket temporel selon la période.
 */
export async function getAdminTimeline(period: DashboardPeriod): Promise<AdminTimeline> {
  const now = new Date();
  const { startIso, endIso } = getAdminCurrentRange(period, now);
  const supabase = await createClient();

  let buckets: { startIso: string; endIso: string; label: string }[];

  if (period === "today") {
    buckets = listTodayHourBuckets(now);
  } else if (period === "7d") {
    buckets = splitRangeEqualParts(startIso, endIso, 7, "J");
  } else if (period === "30d") {
    buckets = listParisDayBucketRangesInCockpitPeriod("days30", now);
  } else {
    buckets = splitRangeEqualParts(startIso, endIso, 12, "S");
  }

  const series: TimelineSeries[] = [
    { key: "leads", label: "Leads créés", color: "#0ea5e9" },
    { key: "agreements", label: "Accords", color: "#10b981" },
    { key: "signed", label: "Signés", color: "#8b5cf6" },
  ];

  const points: TimelinePoint[] = [];

  for (const b of buckets) {
    const [leadsC, agC, sgC] = await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", b.startIso)
        .lt("created_at", b.endIso),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("lead_status", "accord_received")
        .gte("updated_at", b.startIso)
        .lt("updated_at", b.endIso),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("lead_status", "converted")
        .gte("updated_at", b.startIso)
        .lt("updated_at", b.endIso),
    ]);
    if (leadsC.error) throw new Error(leadsC.error.message);
    if (agC.error) throw new Error(agC.error.message);
    if (sgC.error) throw new Error(sgC.error.message);

    points.push({
      date: b.label,
      leads: leadsC.count ?? 0,
      agreements: agC.count ?? 0,
      signed: sgC.count ?? 0,
    });
  }

  return { points, series };
}
