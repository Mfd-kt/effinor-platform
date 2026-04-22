import type { CockpitBundle } from "@/features/dashboard/queries/get-cockpit-bundle";
import type { AdminInsightContext, DirectorInsightContext } from "@/features/dashboard/ai-insights/domain/types";
import { getCockpitPeriodLabel } from "@/features/dashboard/lib/cockpit-period";
import { conversionRate } from "@/features/dashboard/lib/cockpit-aggregates";

function funnelRecord(f: CockpitBundle["snapshot"]["funnel"]): Record<string, number> {
  const out: Record<string, number> = { total: f.total };
  for (const k of Object.keys(f)) {
    if (k === "total") continue;
    const v = (f as Record<string, number>)[k];
    if (typeof v === "number") out[k] = v;
  }
  return out;
}

export function buildAdminInsightContext(bundle: CockpitBundle): AdminInsightContext {
  const snap = bundle.snapshot;
  const f = snap.funnel;
  const backlogSheets = snap.bySheet
    .map((s) => ({
      label: s.sheetLabel,
      count: (s.byStatus.simulation_done ?? 0) + (s.byStatus.to_confirm ?? 0),
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const totalBacklog = backlogSheets.reduce((a, x) => a + x.count, 0);
  const backlogBySheet = backlogSheets.slice(0, 8).map((s) => ({
    label: s.label,
    count: s.count,
    sharePct: totalBacklog > 0 ? Math.round((s.count / totalBacklog) * 1000) / 10 : 0,
  }));

  const channelsTop = snap.byChannel.slice(0, 8).map((c) => ({
    channel: c.channel,
    workflows: c.workflowCount,
    signed: c.signed,
  }));

  return {
    audience: "admin",
    periodLabel: getCockpitPeriodLabel(bundle.filters.period),
    funnel: funnelRecord(f),
    leadsCreated: { current: bundle.leadsCreatedInPeriod, previous: bundle.leadsCreatedPrevious },
    alerts: bundle.periodAlerts.map((a) => ({
      id: a.id,
      severity: a.severity,
      category: a.category,
      title: a.title,
      message: a.message,
      targetLabel: a.targetLabel,
    })),
    structural: bundle.structuralAlerts.map((a) => ({
      id: a.id,
      severity: a.severity,
      title: a.title,
      message: a.message,
    })),
    network: null,
    backlogBySheet,
    channelsTop,
    teamsWithoutCloser: bundle.teamsWithoutCloser.length,
    sheetsWithoutTeam: bundle.sheetsWithoutTeam.length,
  };
}

export function buildDirectorInsightContext(bundle: CockpitBundle): DirectorInsightContext {
  const snap = bundle.snapshot;
  const f = snap.funnel;
  const signed = f.agreement_signed + f.paid + f.quote_signed;
  const sent = f.agreement_sent;
  const signRatePct = conversionRate(signed, sent + signed);
  const lossRatePct = f.total > 0 ? Math.round((f.lost / f.total) * 1000) / 10 : null;

  const docs = f.docs_prepared + f.to_close;
  const agrSent = f.agreement_sent;
  let funnelLeakHint: DirectorInsightContext["funnelLeakHint"] = null;
  if (docs > 0 && agrSent >= 0) {
    const ratio = agrSent / docs;
    if (ratio < 0.35 && docs >= 5) {
      funnelLeakHint = {
        from: "docs_pret_et_a_closer",
        to: "accords_envoyes",
        dropPct: Math.round((1 - ratio) * 1000) / 10,
      };
    }
  }

  return {
    audience: "director",
    periodLabel: getCockpitPeriodLabel(bundle.filters.period),
    funnel: funnelRecord(f),
    leadsCreated: { current: bundle.leadsCreatedInPeriod, previous: bundle.leadsCreatedPrevious },
    signRatePct,
    lossRatePct,
    alerts: bundle.periodAlerts.map((a) => ({
      severity: a.severity,
      category: a.category,
      title: a.title,
      message: a.message,
    })),
    sheetRollup: snap.bySheet.slice(0, 12).map((s) => ({
      label: s.sheetLabel,
      workflows: s.workflowCount,
      sent: s.sent,
      signed: s.signed,
      lost: s.lost,
    })),
    channelRollup: snap.byChannel.slice(0, 10).map((c) => ({
      channel: c.channel,
      workflows: c.workflowCount,
      qualifiedPlus: c.qualifiedPlus,
      signed: c.signed,
    })),
    funnelLeakHint,
  };
}
