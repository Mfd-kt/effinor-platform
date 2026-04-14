import { firstInstantOfParisYmd } from "@/lib/datetime/paris-day";

import type { InternalSlaRuleRow, SlaDueDates } from "./sla-types";

function asRecord(j: unknown): Record<string, unknown> {
  return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : {};
}

function num(x: unknown, d: number): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : d;
}

/**
 * Calcule les trois jalons à partir de l’ancre métier et de la règle.
 */
export function computeSlaDueDatesForEntity(rule: InternalSlaRuleRow, anchor: Date, context: { callbackDate?: string }): SlaDueDates | null {
  const cond = asRecord(rule.condition_json);
  const anchorIso = anchor.toISOString();

  if (rule.code === "cb_due_today_eod" && context.callbackDate) {
    const wh = num(cond.warning_paris_hour, 12);
    const wm = num(cond.warning_paris_minute, 30);
    const ch = num(cond.critical_paris_hour, 18);
    const cm = num(cond.critical_paris_minute, 0);
    const dayStart = firstInstantOfParisYmd(context.callbackDate);
    const warningDueAt = new Date(dayStart + (wh * 60 + wm) * 60_000);
    const criticalDueAt = new Date(dayStart + (ch * 60 + cm) * 60_000);
    const mid = dayStart + Math.floor((warningDueAt.getTime() + criticalDueAt.getTime()) / 2 - dayStart);
    const targetDueAt = new Date(mid);
    return {
      warningDueAt,
      targetDueAt,
      criticalDueAt,
      anchorIso,
      anchorLabel: `jour ${context.callbackDate} (Paris)`,
    };
  }

  const wMin = rule.warning_delay_minutes;
  const tMin = rule.target_delay_minutes;
  const cMin = rule.critical_delay_minutes;
  const a = anchor.getTime();
  return {
    warningDueAt: new Date(a + wMin * 60_000),
    targetDueAt: new Date(a + tMin * 60_000),
    criticalDueAt: new Date(a + cMin * 60_000),
    anchorIso,
    anchorLabel: anchorIso,
  };
}
