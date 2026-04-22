import type { CockpitHumanAnomaly } from "../types";
import { computeCockpitPriority } from "./compute-cockpit-priority";

export function buildHumanAnomalies(input: {
  agents: {
    userId: string;
    displayName: string;
    email: string | null;
    leadsDay: number;
    /** Rappels passés en statut terminal aujourd’hui (Paris). */
    callbacksTreatedDay: number;
    /** Rappels traités (terminal) sur 7 j. glissants. */
    treatedWeek: number;
    leadsWeek: number;
  }[];
  closers: {
    userId: string;
    displayName: string;
    email: string | null;
    pipelineOpen: number;
    signedWeek: number;
    signatureRatePct: number | null;
  }[];
  /** Paris calendar date YYYY-MM-DD */
  todayParis: string;
}): CockpitHumanAnomaly[] {
  const out: CockpitHumanAnomaly[] = [];

  for (const a of input.agents) {
    const quietToday = a.leadsDay === 0 && a.callbacksTreatedDay === 0;
    const quietWeek = a.treatedWeek === 0 && a.leadsWeek === 0;
    if (quietToday && quietWeek) {
      const ps = computeCockpitPriority({ valueCents: 0 });
      out.push({
        id: `hum:agent-idle-${a.userId}`,
        userId: a.userId,
        displayName: a.displayName,
        email: a.email,
        role: "agent",
        problem: "Aucune activité : pas de lead créé ni rappel clôturé (aujourd’hui et 7 j.).",
        level: "warning",
        dossiersHref: "/leads",
        priorityScore: ps,
      });
    } else if (quietToday && !quietWeek) {
      const ps = computeCockpitPriority({ valueCents: 0 }) - 50;
      const detail =
        a.treatedWeek === 0 && a.leadsWeek > 0
          ? " — aucun rappel clôturé sur 7 j."
          : a.leadsWeek === 0 && a.treatedWeek > 0
            ? " — aucun nouveau lead sur 7 j."
            : "";
      out.push({
        id: `hum:agent-quietday-${a.userId}`,
        userId: a.userId,
        displayName: a.displayName,
        email: a.email,
        role: "agent",
        problem: `Aucune activité aujourd’hui (leads / rappels).${detail}`,
        level: "warning",
        dossiersHref: "/leads",
        priorityScore: ps,
      });
    }
  }

  for (const c of input.closers) {
    if (c.signedWeek === 0 && c.pipelineOpen >= 5) {
      const ps = computeCockpitPriority({ valueCents: 0, isBlocked: true });
      out.push({
        id: `hum:closer-stuck-${c.userId}`,
        userId: c.userId,
        displayName: c.displayName,
        email: c.email,
        role: "closer",
        problem: `Pipeline élevé (${c.pipelineOpen}) sans signature cette semaine.`,
        level: c.pipelineOpen >= 8 ? "critique" : "warning",
        dossiersHref: "/leads",
        priorityScore: ps,
      });
    }
    if (
      c.signatureRatePct != null &&
      c.pipelineOpen + c.signedWeek >= 4 &&
      c.signatureRatePct < 18
    ) {
      const ps = computeCockpitPriority({ valueCents: 0 });
      out.push({
        id: `hum:closer-rate-${c.userId}`,
        userId: c.userId,
        displayName: c.displayName,
        email: c.email,
        role: "closer",
        problem: `Taux de signature faible (${c.signatureRatePct} %).`,
        level: "warning",
        dossiersHref: "/leads",
        priorityScore: ps,
      });
    }
  }

  const seenId = new Set<string>();
  const byUserRole = new Map<string, CockpitHumanAnomaly>();

  for (const x of out.sort((a, b) => b.priorityScore - a.priorityScore)) {
    if (seenId.has(x.id)) continue;
    seenId.add(x.id);
    const key = `${x.role}:${x.userId}`;
    const prev = byUserRole.get(key);
    if (!prev || x.priorityScore > prev.priorityScore) {
      byUserRole.set(key, x);
    }
  }

  return [...byUserRole.values()].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);
}
