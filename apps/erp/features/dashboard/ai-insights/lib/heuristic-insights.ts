import type {
  AdminInsightContext,
  AiInsightResult,
  DirectorInsightContext,
} from "@/features/dashboard/ai-insights/domain/types";

function leadDelta(c: { current: number; previous: number }): string | null {
  if (c.previous <= 0) return c.current > 0 ? "Les leads sont en hausse vs la période de référence." : null;
  const pct = Math.round(((c.current - c.previous) / c.previous) * 1000) / 10;
  if (Math.abs(pct) < 5) return null;
  return pct < 0
    ? `Les leads créés reculent d’environ ${Math.abs(pct)} % vs la période précédente.`
    : `Les leads créés progressent d’environ ${pct} % vs la période précédente.`;
}

export function heuristicAdminInsights(ctx: AdminInsightContext): AiInsightResult {
  const findings: string[] = [];
  const priorities: string[] = [];
  const recommendations: string[] = [];
  const risks: string[] = [];

  const ld = leadDelta(ctx.leadsCreated);
  if (ld) findings.push(ld);

  if (ctx.sheetsWithoutTeam > 0) {
    findings.push(`${ctx.sheetsWithoutTeam} fiche(s) sans équipe active — risque de trous dans le réseau.`);
    priorities.push("Rattacher des équipes actives aux fiches orphelines.");
  }
  if (ctx.teamsWithoutCloser > 0) {
    findings.push(`${ctx.teamsWithoutCloser} équipe(s) active(s) sans closer déclaré.`);
    risks.push("Blocage ou délai sur les phases signature sans closer affecté.");
    recommendations.push("Affecter un closer sur chaque équipe commerciale active.");
  }

  for (const a of ctx.structural.filter((x) => x.severity === "critical").slice(0, 3)) {
    risks.push(`${a.title} : ${a.message}`);
  }

  for (const a of ctx.alerts.filter((x) => x.severity === "critical").slice(0, 4)) {
    priorities.push(`${a.title} — ${a.message}`);
  }

  if (priorities.length === 0 && ctx.alerts.length) {
    priorities.push(...ctx.alerts.slice(0, 3).map((a) => `${a.title} (${a.severity})`));
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintenir le rituel de revue hebdomadaire des alertes cockpit et du réseau équipes.");
  }

  const summary =
    findings.length > 0
      ? `Synthèse ${ctx.periodLabel} : ${findings[0]}`
      : `Synthèse ${ctx.periodLabel} : réseau stable sur les indicateurs suivis — surveiller les alertes mineures.`;

  return {
    summary,
    findings: findings.slice(0, 5),
    priorities: priorities.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
    risks: risks.slice(0, 5),
    heuristicOnly: true,
  };
}

export function heuristicDirectorInsights(ctx: DirectorInsightContext): AiInsightResult {
  const findings: string[] = [];
  const priorities: string[] = [];
  const recommendations: string[] = [];
  const risks: string[] = [];

  const ld = leadDelta(ctx.leadsCreated);
  if (ld) findings.push(ld);

  if (ctx.signRatePct != null && ctx.signRatePct < 12) {
    findings.push(`Taux de signature global faible (${ctx.signRatePct} % des dossiers avec accord envoyé ou signé).`);
    priorities.push("Renforcer relances closer et qualité des dossiers transmis.");
  }
  if (ctx.lossRatePct != null && ctx.lossRatePct > 30) {
    findings.push(`Taux de pertes élevé (${ctx.lossRatePct} % des dossiers de la période).`);
    risks.push("Perte de marge commerciale et saturation des équipes sur des dossiers non convertis.");
  }

  if (ctx.funnelLeakHint) {
    findings.push(
      `Fuite probable entre ${ctx.funnelLeakHint.from} et ${ctx.funnelLeakHint.to} (~${ctx.funnelLeakHint.dropPct} % de chute relative).`,
    );
    recommendations.push("Auditer le passage docs → envoi d’accord (closer).");
  }

  const heavy = ctx.sheetRollup.find((s) => s.workflows > 0 && s.sent > 0 && s.signed / (s.sent + s.signed) < 0.12);
  if (heavy) {
    findings.push(
      `La fiche « ${heavy.label} » produit du volume (${heavy.workflows} dossiers) mais signe peu vs les envois.`,
    );
    recommendations.push(`Coaching closer ciblé sur « ${heavy.label} ».`);
  }

  for (const a of ctx.alerts.filter((x) => x.severity === "critical").slice(0, 3)) {
    priorities.push(`${a.title} — ${a.message}`);
  }

  const summary =
    findings.length > 0
      ? `Pilotage commercial (${ctx.periodLabel}) : ${findings[0]}`
      : `Pilotage commercial (${ctx.periodLabel}) : pas d’anomalie majeure détectée sur les agrégés.`;

  return {
    summary,
    findings: findings.slice(0, 5),
    priorities: priorities.slice(0, 5),
    recommendations:
      recommendations.length > 0
        ? recommendations.slice(0, 5)
        : ["Aligner marketing / centre d’appel avec la capacité closer."],
    risks: risks.slice(0, 5),
    heuristicOnly: true,
  };
}
