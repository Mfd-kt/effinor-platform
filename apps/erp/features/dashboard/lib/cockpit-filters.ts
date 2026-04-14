import type { CockpitScopeFilters } from "@/features/dashboard/domain/cockpit";
import { DEFAULT_COCKPIT_FILTERS } from "@/features/dashboard/domain/cockpit";

/** Parse Next.js searchParams → filtres cockpit. */
export function parseCockpitFilters(
  raw: Record<string, string | string[] | undefined>,
): CockpitScopeFilters {
  const pick = (k: string): string | null => {
    const v = raw[k];
    if (Array.isArray(v)) return v[0]?.trim() || null;
    return v?.trim() || null;
  };

  const periodRaw = pick("period");
  const period =
    periodRaw === "today" || periodRaw === "week" || periodRaw === "month" || periodRaw === "days30"
      ? periodRaw
      : DEFAULT_COCKPIT_FILTERS.period;

  return {
    ceeSheetId: pick("ceeSheetId"),
    teamId: pick("teamId"),
    leadChannel: pick("channel"),
    period,
  };
}
