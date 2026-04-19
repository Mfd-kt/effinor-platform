import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { buildGenerateCampaignPlan, parseCustomQueries, sectorNeedsCustomQueries } from "@/features/lead-generation/lib/generate-campaign";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import { unifiedLeadGenerationPipelineBodySchema } from "@/features/lead-generation/schemas/lead-generation-actions.schema";
import { resolveLeadGenerationImportBatchCeeContext } from "@/features/lead-generation/services/resolve-lead-generation-import-batch-cee-context";
import { runUnifiedLeadGenerationPipeline } from "@/features/lead-generation/services/run-unified-lead-generation-pipeline";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";

export const dynamic = "force-dynamic";
/** Parcours unifié : attente Apify (Google Maps) — aligné sur `unifiedPipelineApifyWaitMs`. */
export const maxDuration = 900;

export async function POST(req: Request) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    return NextResponse.json({ ok: false, error: "Accès réservé à l’administration." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = unifiedLeadGenerationPipelineBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ ok: false, error: first?.message ?? "Paramètres invalides." }, { status: 400 });
  }

  const d = parsed.data;
  if (sectorNeedsCustomQueries(d.sector) && parseCustomQueries(d.customQueriesText ?? "").length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Pour ce secteur, ajoutez au moins une requête personnalisée (une ligne = une recherche).",
      },
      { status: 400 },
    );
  }

  const plan = buildGenerateCampaignPlan({
    sector: d.sector,
    zone: d.zone,
    customQueriesText: d.customQueriesText ?? "",
    maxCrawledPlacesPerSearch: d.maxCrawledPlacesPerSearch,
    maxTotalPlaces: d.maxTotalPlaces,
  });

  if (plan.searchStrings.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Veuillez configurer la recherche avant de lancer le parcours." },
      { status: 400 },
    );
  }

  const zone = d.zone.trim();

  try {
    const supabase = await createClient();
    const cee = await resolveLeadGenerationImportBatchCeeContext(supabase, d.ceeSheetId, d.targetTeamId);
    if (!cee.ok) {
      return NextResponse.json({ ok: false, error: cee.error }, { status: 400 });
    }

    const out = await runUnifiedLeadGenerationPipeline({
      searchStrings: plan.searchStrings,
      maxCrawledPlacesPerSearch: plan.effectiveMaxPerSearch,
      includeWebResults: d.includeWebResults,
      locationQuery: zone.length > 0 ? zone : undefined,
      campaignName: d.campaignName.trim(),
      campaignSector: d.sector,
      ceeSheetId: cee.data.cee_sheet_id,
      ceeSheetCode: cee.data.cee_sheet_code,
      targetTeamId: cee.data.target_team_id,
    });
    if (!out.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: humanizeLeadGenerationActionError(out.error),
          blocked: out.blocked === true,
          blockedStep: out.blockedStep,
          steps: out.steps,
          warnings: out.warnings,
        },
        { status: 422 },
      );
    }
    return NextResponse.json(out);
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Erreur lors du parcours unifié.";
    return NextResponse.json({ ok: false, error: humanizeLeadGenerationActionError(raw) }, { status: 500 });
  }
}
