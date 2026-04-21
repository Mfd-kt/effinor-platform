import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import type {
  CommercialAgentCockpitData,
  CommercialAgentPriorityBlock,
  CommercialAgentTrajectoryLead,
} from "@/features/dashboard/domain/commercial-agent-cockpit";
import type { CockpitScopeFilters } from "@/features/dashboard/domain/cockpit";
import type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";
import { getParisDayRangeIso } from "@/lib/datetime/paris-day";
import { lgTable } from "@/features/lead-generation/lib/lg-db";

function pct(n: number, d: number): number | null {
  if (d <= 0) {
    return null;
  }
  return Math.round((n / d) * 1000) / 10;
}

function sumAmount(op: { valuation_amount?: unknown; estimated_quote_amount_ht?: unknown }): number {
  const v = op.valuation_amount;
  const e = op.estimated_quote_amount_ht;
  const nv = typeof v === "number" ? v : v != null ? Number(v) : 0;
  const ne = typeof e === "number" ? e : e != null ? Number(e) : 0;
  return nv || ne || 0;
}

function parseGptReco(payload: unknown): { score: number | null; reco: string | null } {
  if (!payload || typeof payload !== "object") {
    return { score: null, reco: null };
  }
  const o = payload as Record<string, unknown>;
  const score = typeof o.lead_score === "number" ? o.lead_score : null;
  const reco = typeof o.qualification_recommendation === "string" ? o.qualification_recommendation : null;
  return { score, reco };
}

/**
 * Cockpit performance agent : cash, funnel, qualité LG, efficacité, priorités, trajectoires.
 * Périmètre : `sales_owner_id` / leads assignés à l’agent connecté.
 */
export async function getCommercialAgentCockpitData(
  access: AccessContext,
  range: CockpitIsoRange,
  filters: CockpitScopeFilters,
): Promise<CommercialAgentCockpitData | null> {
  if (access.kind !== "authenticated") {
    return null;
  }
  const userId = access.userId;
  const supabase = await createClient();
  const { startIso, endIso } = range;
  /* Vue agent : seuls la période (range) et la fiche CEE (`filters.ceeSheetId` → code) filtrent les KPI.
     `teamId` et `leadChannel` ne sont pas appliqués aux requêtes (données strictement personnelles). */

  let ceeSheetCode: string | null = null;
  if (filters.ceeSheetId?.trim()) {
    const { data: sh } = await supabase
      .from("cee_sheets")
      .select("code")
      .eq("id", filters.ceeSheetId.trim())
      .maybeSingle();
    ceeSheetCode = sh?.code?.trim() || null;
  }

  const { data: wonRows } = await supabase
    .from("operations")
    .select(
      "id, sales_status, valuation_amount, estimated_quote_amount_ht, quote_signed_at, quote_sent_at, technical_visit_date, updated_at, lead_id, cee_sheet_code",
    )
    .eq("sales_owner_id", userId)
    .is("deleted_at", null)
    .eq("sales_status", "won")
    .gte("quote_signed_at", startIso)
    .lt("quote_signed_at", endIso);

  const { data: lostRows } = await supabase
    .from("operations")
    .select("id, updated_at, lead_id, cee_sheet_code")
    .eq("sales_owner_id", userId)
    .eq("sales_status", "lost")
    .is("deleted_at", null)
    .gte("updated_at", startIso)
    .lt("updated_at", endIso);

  const { data: quoteSentRows } = await supabase
    .from("operations")
    .select("id, quote_sent_at, cee_sheet_code")
    .eq("sales_owner_id", userId)
    .is("deleted_at", null)
    .not("quote_sent_at", "is", null)
    .gte("quote_sent_at", startIso)
    .lt("quote_sent_at", endIso);

  const { data: rdvRows } = await supabase
    .from("operations")
    .select("id, technical_visit_date, cee_sheet_code")
    .eq("sales_owner_id", userId)
    .is("deleted_at", null)
    .not("technical_visit_date", "is", null)
    .gte("technical_visit_date", startIso)
    .lt("technical_visit_date", endIso);

  const filterOpsBySheet = <T extends { cee_sheet_code?: string | null }>(rows: T[] | null): T[] => {
    const r = rows ?? [];
    if (!ceeSheetCode) {
      return r;
    }
    return r.filter((x) => (x.cee_sheet_code ?? "").trim() === ceeSheetCode);
  };

  const wonF = filterOpsBySheet(wonRows);
  const lostF = filterOpsBySheet(lostRows);
  const quotesF = filterOpsBySheet(quoteSentRows);
  const rdvF = filterOpsBySheet(rdvRows);

  const revenueHt = wonF.reduce((s, o) => s + sumAmount(o), 0);
  const signedCount = wonF.length;
  const lostCount = lostF.length;
  const terminal = signedCount + lostCount;
  const signatureRatePct = terminal > 0 ? pct(signedCount, terminal) : null;

  const { data: agentLeads } = await supabase
    .from("leads")
    .select("id, lead_status, created_at, updated_at, assigned_to, created_by_agent_id, company_name, last_call_at, callback_at")
    .is("deleted_at", null)
    .or(`assigned_to.eq.${userId},created_by_agent_id.eq.${userId}`);

  const leadsInPeriod = (agentLeads ?? []).filter(
    (l) => l.created_at >= startIso && l.created_at < endIso,
  );
  const leadsReceived = leadsInPeriod.length;
  const leadsContacted = leadsInPeriod.filter((l) => l.lead_status !== "new").length;

  const pipeline = {
    leadsReceived,
    leadsContacted,
    rdvScheduled: rdvF.length,
    quotesSent: quotesF.length,
    signed: signedCount,
    conversionContactedPct: pct(leadsContacted, leadsReceived),
    conversionRdvPct: pct(rdvF.length, leadsContacted),
    conversionQuotePct: pct(quotesF.length, rdvF.length),
    conversionSignedPct: pct(signedCount, quotesF.length),
  };

  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { data: assignRows } = await assignments
    .select(
      "attempt_count, stock:lead_generation_stock!lead_generation_assignments_stock_id_fkey (research_gpt_payload)",
    )
    .eq("agent_id", userId)
    .eq("outcome", "pending")
    .in("assignment_status", ["assigned", "opened", "in_progress"]);

  let sampleSize = 0;
  let scoreSum = 0;
  let good = 0;
  let review = 0;
  let oot = 0;
  let lgAttempts = 0;

  for (const row of assignRows ?? []) {
    const a = row as { attempt_count?: number; stock?: { research_gpt_payload?: unknown } | null };
    lgAttempts += Math.max(0, Number(a.attempt_count ?? 0));
    const payload = Array.isArray(a.stock) ? a.stock[0]?.research_gpt_payload : a.stock?.research_gpt_payload;
    const { score, reco } = parseGptReco(payload);
    if (reco || score != null) {
      sampleSize += 1;
      if (score != null) {
        scoreSum += score;
      }
      if (reco === "good") {
        good += 1;
      } else if (reco === "review") {
        review += 1;
      } else if (reco === "out_of_target") {
        oot += 1;
      }
    }
  }

  const leadGenQuality = {
    sampleSize,
    avgLeadScore: sampleSize > 0 ? Math.round((scoreSum / sampleSize) * 10) / 10 : null,
    pctGood: sampleSize > 0 ? pct(good, sampleSize) : null,
    pctReview: sampleSize > 0 ? pct(review, sampleSize) : null,
    pctOutOfTarget: sampleSize > 0 ? pct(oot, sampleSize) : null,
  };

  const efficiency = {
    lgCallAttempts: lgAttempts,
    rdvCount: rdvF.length,
    quotesSentCount: quotesF.length,
    signedCount,
    rdvPerLeadPct: pct(rdvF.length, leadsReceived),
    quotePerRdvPct: pct(quotesF.length, rdvF.length),
    signedPerQuotePct: pct(signedCount, quotesF.length),
  };

  const { startIso: todayStart, endIso: todayEnd } = getParisDayRangeIso(new Date());
  const callbacksToday = (agentLeads ?? []).filter((l) => {
    if (!l.callback_at) {
      return false;
    }
    const t = new Date(l.callback_at).getTime();
    return t >= new Date(todayStart).getTime() && t < new Date(todayEnd).getTime();
  }).length;

  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const { data: staleAgreements } = await supabase
    .from("lead_sheet_workflows")
    .select("id, lead_id, agreement_sent_at, workflow_status")
    .eq("workflow_status", "agreement_sent")
    .not("agreement_sent_at", "is", null)
    .lt("agreement_sent_at", threeDaysAgo);

  const staleLeadIds = [...new Set((staleAgreements ?? []).map((r) => (r as { lead_id: string }).lead_id).filter(Boolean))];
  let staleAgreementCount = 0;
  if (staleLeadIds.length > 0) {
    const { data: owners } = await supabase
      .from("leads")
      .select("id")
      .in("id", staleLeadIds)
      .eq("assigned_to", userId)
      .is("deleted_at", null);
    staleAgreementCount = owners?.length ?? 0;
  }

  const neverCalled = (agentLeads ?? []).filter(
    (l) => l.lead_status === "new" && !l.last_call_at,
  ).length;

  const { count: stalledCount } = await supabase
    .from("operations")
    .select("id", { count: "exact", head: true })
    .eq("sales_owner_id", userId)
    .eq("sales_status", "stalled")
    .is("deleted_at", null);

  const atRiskCount = stalledCount ?? 0;

  const priorities: CommercialAgentPriorityBlock[] = [
    {
      id: "callbacks_today",
      title: "Leads à rappeler aujourd’hui",
      count: callbacksToday,
      href: "/agent",
      hint: "Rappel prévu aujourd’hui.",
    },
    {
      id: "never_called",
      title: "Leads jamais appelés",
      count: neverCalled,
      href: "/lead-generation/my-queue?qf=pipeline_new",
    },
    {
      id: "agreements_stale",
      title: "Accords non signés depuis 3 jours",
      count: staleAgreementCount,
      href: "/agent",
    },
    {
      id: "stalled",
      title: "Dossiers à risque",
      count: atRiskCount,
      hint: "Vente en stalled.",
      href: "/agent-operations",
    },
  ];

  const { data: signedLeads } = await supabase
    .from("operations")
    .select("id, quote_signed_at, valuation_amount, estimated_quote_amount_ht, lead_id")
    .eq("sales_owner_id", userId)
    .eq("sales_status", "won")
    .is("deleted_at", null)
    .not("quote_signed_at", "is", null)
    .order("quote_signed_at", { ascending: false })
    .limit(8);

  const signedIds = [...new Set((signedLeads ?? []).map((r) => (r as { lead_id?: string }).lead_id).filter(Boolean))];
  const leadNameById = new Map<string, string>();
  if (signedIds.length > 0) {
    const { data: snLeads } = await supabase.from("leads").select("id, company_name").in("id", signedIds);
    for (const l of snLeads ?? []) {
      leadNameById.set((l as { id: string }).id, (l as { company_name?: string }).company_name?.trim() || "—");
    }
  }

  const signedRecent: CommercialAgentTrajectoryLead[] = (signedLeads ?? []).map((r) => {
    const row = r as {
      id: string;
      lead_id?: string | null;
      quote_signed_at?: string | null;
      valuation_amount?: unknown;
      estimated_quote_amount_ht?: unknown;
    };
    return {
      id: row.lead_id ?? row.id,
      companyName: (row.lead_id && leadNameById.get(row.lead_id)) || "—",
      at: row.quote_signed_at ?? "",
      amountHt: sumAmount(row),
      lossReason: null,
    };
  });

  const { data: lostWf } = await supabase
    .from("lead_sheet_workflows")
    .select("id, lead_id, updated_at, qualification_data_json, workflow_status")
    .eq("workflow_status", "lost")
    .order("updated_at", { ascending: false })
    .limit(24);

  const lostCandidates = (lostWf ?? []) as {
    id: string;
    lead_id: string;
    updated_at: string;
    qualification_data_json?: unknown;
  }[];
  const lostLeadIds = [...new Set(lostCandidates.map((w) => w.lead_id).filter(Boolean))];
  const lostLeadSet = new Set<string>();
  if (lostLeadIds.length > 0) {
    const { data: lostOwners } = await supabase
      .from("leads")
      .select("id, company_name")
      .in("id", lostLeadIds)
      .eq("assigned_to", userId)
      .is("deleted_at", null);
    for (const l of lostOwners ?? []) {
      lostLeadSet.add((l as { id: string }).id);
    }
  }
  const lostNameById = new Map<string, string>();
  if (lostLeadIds.length > 0) {
    const { data: lnLeads } = await supabase.from("leads").select("id, company_name").in("id", lostLeadIds);
    for (const l of lnLeads ?? []) {
      lostNameById.set((l as { id: string }).id, (l as { company_name?: string }).company_name?.trim() || "—");
    }
  }

  const lostRecent: CommercialAgentTrajectoryLead[] = lostCandidates
    .filter((w) => lostLeadSet.has(w.lead_id))
    .slice(0, 8)
    .map((w) => {
      const q = w.qualification_data_json;
      let lossReason: string | null = null;
      if (q && typeof q === "object" && "loss_reason" in q && typeof (q as { loss_reason?: unknown }).loss_reason === "string") {
        lossReason = (q as { loss_reason: string }).loss_reason.trim() || null;
      }
      return {
        id: w.lead_id,
        companyName: lostNameById.get(w.lead_id) ?? "—",
        at: w.updated_at,
        amountHt: null,
        lossReason,
      };
    });

  return {
    range,
    cash: {
      revenueHt,
      signedCount,
      lostCount,
      signatureRatePct,
    },
    pipeline,
    leadGenQuality,
    efficiency,
    priorities,
    signedRecent,
    lostRecent,
  };
}
