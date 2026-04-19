import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConvertAssignmentForm } from "@/features/lead-generation/components/convert-assignment-form";
import { LeadGenerationEnrichStockButton } from "@/features/lead-generation/components/lead-generation-enrich-stock-button";
import { LeadGenerationEnrichmentConfidenceBadge } from "@/features/lead-generation/components/lead-generation-enrichment-confidence-badge";
import { LeadGenerationEnrichmentProvenanceNote } from "@/features/lead-generation/components/lead-generation-enrichment-provenance-note";
import { LeadGenerationEnrichmentStatusBadge } from "@/features/lead-generation/components/lead-generation-enrichment-status-badge";
import { LeadGenerationCommercialPriorityBadge } from "@/features/lead-generation/components/lead-generation-commercial-priority-badge";
import { LeadGenerationCommercialScoreRecalcButton } from "@/features/lead-generation/components/lead-generation-commercial-score-recalc-button";
import { LeadGenerationDispatchQueueBadge } from "@/features/lead-generation/components/lead-generation-dispatch-queue-badge";
import { LeadGenerationDispatchQueueEvaluateButton } from "@/features/lead-generation/components/lead-generation-dispatch-queue-evaluate-button";
import { LeadGenerationIdentifyDecisionMakerButton } from "@/features/lead-generation/components/lead-generation-identify-decision-maker-button";
import {
  LeadGenerationDecisionMakerConfidenceBadge,
  LeadGenerationDecisionMakerIdentifiedBadge,
  LeadGenerationPremiumLeadBadge,
  LeadGenerationTierOutlineBadge,
} from "@/features/lead-generation/components/lead-generation-premium-badges";
import { LeadGenerationStreetViewSection } from "@/features/lead-generation/components/lead-generation-street-view-section";
import { LeadGenerationVerifySiteButton } from "@/features/lead-generation/components/lead-generation-verify-site-button";
import { isEligibleForDropcontactEnrichment } from "@/features/lead-generation/dropcontact/build-dropcontact-request";
import { isEligibleForLeadGenerationEnrichment } from "@/features/lead-generation/enrichment/enrich-lead-generation-stock";
import { isEligibleForVerifiedLeadGenerationEnrichment } from "@/features/lead-generation/enrichment/verified-enrichment-eligibility";
import { formatDuplicateMatchReasonsForDisplay } from "@/features/lead-generation/dedup/duplicate-match-labels";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import { buildLeadGenerationStreetViewModel } from "@/features/lead-generation/lib/lead-generation-street-view";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { LeadGenerationCommercialActivitySection } from "@/features/lead-generation/components/lead-generation-commercial-activity-section";
import { LeadGenerationRecyclingSection } from "@/features/lead-generation/components/lead-generation-recycling-section";
import { getLeadGenerationAssignableAgents } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents";
import { getLeadGenerationStockActivities } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { getLeadGenerationAssignmentRecycleSnapshot } from "@/features/lead-generation/queries/get-lead-generation-assignment-recycle-snapshot";
import { LeadGenerationClosingReadinessBadge } from "@/features/lead-generation/components/lead-generation-closing-readiness-badge";
import { LeadGenerationCallReadinessCard } from "@/features/lead-generation/components/lead-generation-call-readiness-card";
import { LeadGenerationDeleteStockButton } from "@/features/lead-generation/components/lead-generation-delete-stock-button";
import { LeadGenerationDropcontactPanel } from "@/features/lead-generation/components/lead-generation-dropcontact-panel";
import { LeadGenerationQuickValidationPanel } from "@/features/lead-generation/components/lead-generation-quick-validation-panel";
import { LeadGenerationManualReviewPanel } from "@/features/lead-generation/components/lead-generation-manual-review-panel";
import { getLeadGenerationManualReviews } from "@/features/lead-generation/queries/get-lead-generation-manual-reviews";
import { getLeadGenerationStockById } from "@/features/lead-generation/queries/get-lead-generation-stock-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { formatDateTimeFr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getAssignmentAgentId(assignmentId: string | null): Promise<string> {
  if (!assignmentId) {
    return "";
  }
  const supabase = await createClient();
  const { data } = await lgTable(supabase, "lead_generation_assignments")
    .select("agent_id")
    .eq("id", assignmentId)
    .maybeSingle();
  return (data as { agent_id: string } | null)?.agent_id ?? "";
}

export default async function LeadGenerationStockDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  const { id } = await params;
  const [detail, agents, commercialActivities] = await Promise.all([
    getLeadGenerationStockById(id),
    getLeadGenerationAssignableAgents(),
    (async () => {
      try {
        return await getLeadGenerationStockActivities(id);
      } catch {
        return [];
      }
    })(),
  ]);
  if (!detail) {
    notFound();
  }

  const { stock, import_batch } = detail;
  const duplicateRef =
    stock.qualification_status === "duplicate" && stock.duplicate_of_stock_id
      ? (await getLeadGenerationStockById(stock.duplicate_of_stock_id))?.stock ?? null
      : null;

  let manualReviews: Awaited<ReturnType<typeof getLeadGenerationManualReviews>> = [];
  try {
    manualReviews = await getLeadGenerationManualReviews(id);
  } catch {
    manualReviews = [];
  }
  let manualReviewerDisplayName: string | null = null;
  if (stock.manually_reviewed_by_user_id) {
    const supabase = await createClient();
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", stock.manually_reviewed_by_user_id)
      .maybeSingle();
    if (prof) {
      const p = prof as { full_name: string | null; email: string | null };
      manualReviewerDisplayName = p.full_name?.trim() || p.email?.trim() || null;
    }
  }

  let recycleSnapshot = null;
  try {
    recycleSnapshot = await getLeadGenerationAssignmentRecycleSnapshot(stock.current_assignment_id);
  } catch {
    recycleSnapshot = null;
  }
  const defaultAgentId = await getAssignmentAgentId(stock.current_assignment_id);
  const enrichElig = isEligibleForLeadGenerationEnrichment(stock);
  const verifiedElig = isEligibleForVerifiedLeadGenerationEnrichment(stock);
  const dropcontactElig = isEligibleForDropcontactEnrichment(stock);

  const rawJson = JSON.stringify(stock.raw_payload ?? {}, null, 2);
  const streetViewModel = buildLeadGenerationStreetViewModel(stock);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <PageHeader
        title={stock.company_name}
        description={[stock.city, stock.phone].filter(Boolean).join(" · ") || "Fiche stock lead generation"}
        actions={
          <div className="flex flex-wrap items-end justify-end gap-2">
            <LeadGenerationDeleteStockButton
              stockId={stock.id}
              companyName={stock.company_name}
              convertedLeadId={stock.converted_lead_id}
              stockStatus={stock.stock_status}
            />
            <Link href="/lead-generation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ← Fiches disponibles
            </Link>
          </div>
        }
      />

      <LeadGenerationQuickValidationPanel
        stockId={stock.id}
        mapsUrl={streetViewModel.openMapsUrl}
        showMapsLink={streetViewModel.canShowSection}
        disabled={
          Boolean(stock.converted_lead_id) ||
          stock.stock_status === "rejected" ||
          stock.qualification_status === "duplicate"
        }
      />

      <LeadGenerationDropcontactPanel
        stockId={stock.id}
        eligible={dropcontactElig.ok}
        disabled={
          Boolean(stock.converted_lead_id) ||
          stock.stock_status === "rejected" ||
          stock.qualification_status === "duplicate"
        }
        dropcontactStatus={stock.dropcontact_status ?? "idle"}
        dropcontactRequestedAt={stock.dropcontact_requested_at ?? null}
        dropcontactCompletedAt={stock.dropcontact_completed_at ?? null}
        dropcontactLastError={stock.dropcontact_last_error ?? null}
        email={stock.email?.trim() || stock.enriched_email?.trim() || null}
        phone={stock.phone?.trim() || stock.normalized_phone?.trim() || null}
        decisionMakerName={stock.decision_maker_name ?? null}
        decisionMakerRole={stock.decision_maker_role ?? null}
        linkedinUrl={stock.linkedin_url ?? null}
      />

      <LeadGenerationCallReadinessCard stock={stock} />

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          Stock : {stock.stock_status}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Qualification : {stock.qualification_status}
        </Badge>
        <LeadGenerationTierOutlineBadge tier={stock.lead_tier ?? "raw"} />
        <LeadGenerationPremiumLeadBadge tier={stock.lead_tier} />
        <LeadGenerationDecisionMakerIdentifiedBadge hasName={Boolean(stock.decision_maker_name?.trim())} />
        {stock.decision_maker_confidence ? (
          <LeadGenerationDecisionMakerConfidenceBadge confidence={stock.decision_maker_confidence} />
        ) : null}
      </div>

      {stock.qualification_status === "duplicate" && stock.duplicate_of_stock_id ? (
        <Card className="border-amber-500/35 bg-amber-500/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">Doublon</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">
              Cette fiche trace un import en doublon d’une entreprise déjà présente dans le stock.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {stock.duplicate_match_score != null ? (
              <p>
                <span className="text-muted-foreground">Score de rapprochement :</span>{" "}
                <span className="font-medium tabular-nums">{stock.duplicate_match_score}</span> / 100
              </p>
            ) : null}
            {formatDuplicateMatchReasonsForDisplay(stock.duplicate_match_reasons).length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Motifs détectés</p>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {formatDuplicateMatchReasonsForDisplay(stock.duplicate_match_reasons).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-muted-foreground">Fiche de référence (originale)</p>
              <Link
                href={`/lead-generation/${stock.duplicate_of_stock_id}`}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-2 inline-flex")}
              >
                {duplicateRef?.company_name ?? "Ouvrir la fiche de référence"}
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <LeadGenerationManualReviewPanel
        stockId={stock.id}
        stock={stock}
        reviews={manualReviews}
        lastReviewerDisplayName={manualReviewerDisplayName}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations entreprise</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <DetailRow label="Société" value={stock.company_name} />
          <DetailRow label="Téléphone" value={stock.phone ?? "—"} />
          <DetailRow label="Email" value={stock.email ?? "—"} />
          <DetailRow label="Site web" value={stock.website ?? "—"} />
          <DetailRow label="Adresse" value={stock.address ?? "—"} />
          <DetailRow label="Code postal / Ville" value={[stock.postal_code, stock.city].filter(Boolean).join(" ") || "—"} />
          <DetailRow label="Catégorie" value={stock.category ?? "—"} />
          <DetailRow label="Sous-catégorie" value={stock.sub_category ?? "—"} />
          <DetailRow label="SIRET" value={stock.siret ?? "—"} />
        </CardContent>
      </Card>

      <LeadGenerationStreetViewSection stock={stock} />

      <Card className="border-emerald-500/20 bg-emerald-500/[0.04]">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            Prêt pour le closing
            <LeadGenerationClosingReadinessBadge
              status={(stock.closing_readiness_status ?? "low") as "low" | "medium" | "high"}
              score={stock.closing_readiness_score ?? 0}
            />
          </CardTitle>
          <p className="text-xs font-normal text-muted-foreground">
            Lecture terrain : ce qui aide le commercial à passer le standard et cadrer l’appel.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow
              label="Score closing"
              value={String(stock.closing_readiness_score ?? 0)}
            />
            <DetailRow
              label="Calculé le"
              value={stock.closing_scored_at ? formatDateTimeFr(stock.closing_scored_at) : "—"}
            />
            <DetailRow label="Nom décideur" value={stock.decision_maker_name ?? "—"} />
            <DetailRow label="Rôle décideur" value={stock.decision_maker_role ?? "—"} />
            <DetailRow label="Confiance décideur" value={stock.decision_maker_confidence ?? "—"} />
            <DetailRow
              label="Profil public (URL)"
              value={stock.linkedin_url?.trim() ? stock.linkedin_url : "—"}
            />
            <DetailRow label="Angle suggéré" value={stock.approach_angle ?? "—"} />
            <DetailRow label="Accroche téléphone" value={stock.approach_hook ?? "—"} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Pourquoi ce score</p>
            {Array.isArray(stock.closing_reasons) && stock.closing_reasons.length > 0 ? (
              <ul className="mt-1 list-inside list-disc text-sm">
                {(stock.closing_reasons as string[]).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-muted-foreground">Pas encore calculé — lancez « Scorer le closing » depuis le cockpit.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Décideur B2B</CardTitle>
          <p className="text-xs font-normal text-muted-foreground">
            Données extraites uniquement depuis des sources publiques (pas de génération). Les champs déjà renseignés ne
            sont pas écrasés.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Nom" value={stock.decision_maker_name ?? "—"} />
            <DetailRow label="Rôle / fonction" value={stock.decision_maker_role ?? "—"} />
            <DetailRow label="Source extraction" value={stock.decision_maker_source ?? "—"} />
            <DetailRow label="Confiance" value={stock.decision_maker_confidence ?? "—"} />
          </div>
          <LeadGenerationIdentifyDecisionMakerButton stockId={stock.id} />
        </CardContent>
      </Card>

      <Card className="border-violet-500/20 bg-violet-500/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Lead premium</CardTitle>
          <p className="text-xs font-normal text-muted-foreground">
            Classification et score complémentaires au score commercial — recalculés via le cockpit « Leads premium ».
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <LeadGenerationTierOutlineBadge tier={stock.lead_tier ?? "raw"} />
            <LeadGenerationPremiumLeadBadge tier={stock.lead_tier} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Tier" value={stock.lead_tier ?? "raw"} />
            <DetailRow label="Score premium" value={String(stock.premium_score ?? 0)} />
            <DetailRow
              label="Score premium calculé le"
              value={stock.premium_scored_at ? formatDateTimeFr(stock.premium_scored_at) : "—"}
            />
            <DetailRow label="Décideur (nom)" value={stock.decision_maker_name ?? "—"} />
            <DetailRow label="Décideur (rôle)" value={stock.decision_maker_role ?? "—"} />
            <DetailRow label="Confiance décideur" value={stock.decision_maker_confidence ?? "—"} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Motifs du score</p>
            {parsePremiumReasons(stock.premium_reasons).length === 0 ? (
              <p className="mt-1 text-muted-foreground">Aucun motif enregistré (score non calculé ou nul).</p>
            ) : (
              <ul className="mt-1 list-inside list-disc text-sm">
                {parsePremiumReasons(stock.premium_reasons).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">État de la fiche</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <DetailRow label="Statut stock" value={stock.stock_status} />
          <DetailRow label="Qualification" value={stock.qualification_status} />
          <DetailRow label="Motif de rejet" value={stock.rejection_reason ?? "—"} />
          <DetailRow label="Source" value={formatLeadGenerationSourceLabel(stock.source)} />
          <DetailRow label="Importée le" value={stock.imported_at ? formatDateTimeFr(stock.imported_at) : "—"} />
          <DetailRow label="Créée le" value={formatDateTimeFr(stock.created_at)} />
          {import_batch ? (
            <DetailRow label="Import lié" value={import_batch.source_label ?? import_batch.source ?? "—"} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score commercial</CardTitle>
          <p className="text-xs text-muted-foreground">
            Priorisation par règles métier pondérées (étape 12). Recalcul recommandé après enrichissement ou mise à
            jour des données.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Score</p>
              <p className="text-2xl font-semibold tabular-nums leading-tight">{stock.commercial_score ?? 0}</p>
            </div>
            <LeadGenerationCommercialPriorityBadge priority={stock.commercial_priority ?? "normal"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Score historique (import)" value={String(stock.target_score)} />
            <DetailRow
              label="Dernier calcul"
              value={stock.commercial_scored_at ? formatDateTimeFr(stock.commercial_scored_at) : "—"}
            />
          </div>
          <details className="rounded-md border border-border bg-muted/20">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium">Détail du score (JSON)</summary>
            <pre className="max-h-48 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
              {JSON.stringify(stock.commercial_score_breakdown ?? {}, null, 2)}
            </pre>
          </details>
          <LeadGenerationCommercialScoreRecalcButton stockId={stock.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">File « prêt à distribuer »</CardTitle>
          <p className="text-xs text-muted-foreground">
            Décision opérationnelle : la fiche est-elle prête à être mise en relation, à enrichir d’abord, à revoir, ou
            hors cible ? (étape 13 — recalcul manuel.)
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <LeadGenerationDispatchQueueBadge
              status={stock.dispatch_queue_status ?? "review"}
              reason={stock.dispatch_queue_reason}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Rang (tri liste)" value={String(stock.dispatch_queue_rank ?? 0)} />
            <DetailRow
              label="Évaluée le"
              value={stock.dispatch_queue_evaluated_at ? formatDateTimeFr(stock.dispatch_queue_evaluated_at) : "—"}
            />
            <DetailRow label="Motif" value={stock.dispatch_queue_reason ?? "—"} cellClassName="sm:col-span-2" />
          </div>
          <LeadGenerationDispatchQueueEvaluateButton stockId={stock.id} />
        </CardContent>
      </Card>

      <LeadGenerationCommercialActivitySection
        assignmentId={stock.current_assignment_id}
        initialActivities={commercialActivities}
      />

      <LeadGenerationRecyclingSection
        assignmentId={stock.current_assignment_id}
        initialSnapshot={recycleSnapshot}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggestions et vérification</CardTitle>
          <p className="text-xs text-muted-foreground">
            Les suggestions heuristiques sont indicatives. La vérification site lit des pages publiques (coût API
            maîtrisé) — rien n’est garanti sans contrôle humain pour un usage critique.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">État :</span>
            <LeadGenerationEnrichmentStatusBadge status={stock.enrichment_status ?? "not_started"} />
            {stock.enrichment_status === "completed" ? (
              <>
                <Badge variant="secondary" className="text-xs font-normal">
                  {(stock.enrichment_source ?? "heuristic") === "firecrawl"
                    ? "Site public"
                    : (stock.enrichment_source ?? "heuristic") === "dropcontact"
                      ? "Dropcontact"
                      : "Heuristique"}
                </Badge>
                <LeadGenerationEnrichmentConfidenceBadge level={stock.enrichment_confidence ?? "low"} />
              </>
            ) : null}
          </div>
          <LeadGenerationEnrichmentProvenanceNote stock={stock} />
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Email suggéré" value={stock.enriched_email ?? "—"} />
            <DetailRow label="Domaine suggéré" value={stock.enriched_domain ?? "—"} />
            <DetailRow label="Site suggéré" value={stock.enriched_website ?? "—"} cellClassName="sm:col-span-2" />
            <DetailRow
              label="Enregistré le"
              value={stock.enriched_at ? formatDateTimeFr(stock.enriched_at) : "—"}
            />
            {stock.enrichment_error ? (
              <DetailRow label="Message" value={stock.enrichment_error} cellClassName="sm:col-span-2" />
            ) : null}
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">Suggestion (heuristique)</p>
            <LeadGenerationEnrichStockButton
              stockId={stock.id}
              disabled={
                stock.enrichment_status === "completed" ||
                stock.enrichment_status === "in_progress" ||
                !enrichElig.ok
              }
              disabledReason={
                stock.enrichment_status === "in_progress"
                  ? "Enrichissement en cours…"
                  : stock.enrichment_status === "completed"
                    ? "Des suggestions sont déjà enregistrées pour cette fiche."
                    : !enrichElig.ok
                      ? enrichElig.reason
                      : undefined
              }
            />
          </div>
          <LeadGenerationVerifySiteButton
            stockId={stock.id}
            disabled={stock.enrichment_status === "in_progress" || !verifiedElig.ok}
            disabledReason={
              stock.enrichment_status === "in_progress"
                ? "Opération en cours…"
                : !verifiedElig.ok
                  ? verifiedElig.reason
                  : undefined
            }
          />
        </CardContent>
      </Card>

      {stock.converted_lead_id ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Déjà convertie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Cette fiche a déjà été transformée en fiche prospect CRM.</p>
            <Link
              href={`/leads/${stock.converted_lead_id}`}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-fit")}
            >
              Ouvrir la fiche prospect
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!stock.converted_lead_id && stock.current_assignment_id ? (
        <ConvertAssignmentForm
          assignmentId={stock.current_assignment_id}
          defaultAgentId={defaultAgentId}
          agents={agents}
        />
      ) : null}

      {!stock.converted_lead_id && !stock.current_assignment_id ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Aucune attribution active sur cette fiche : la conversion en fiche prospect n’est pas disponible
          depuis cet écran. Distribuez d’abord la fiche à un agent.
        </p>
      ) : null}

      <details className="group rounded-lg border border-border bg-card">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Données techniques
            <span className="text-xs font-normal text-muted-foreground group-open:hidden">Afficher</span>
            <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Masquer</span>
          </span>
        </summary>
        <div className="space-y-4 border-t border-border px-4 py-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <DetailRow label="ID fiche stock" value={stock.id} />
            <DetailRow label="ID externe source" value={stock.source_external_id ?? "—"} />
            <DetailRow label="ID import" value={stock.import_batch_id ?? "—"} />
            <DetailRow label="Doublon de" value={stock.duplicate_of_stock_id ?? "—"} />
            <DetailRow label="ID attribution courante" value={stock.current_assignment_id ?? "—"} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Payload brut (JSON)</p>
            <pre className="max-h-72 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
              {rawJson}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}

function parsePremiumReasons(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function DetailRow({
  label,
  value,
  cellClassName,
}: {
  label: string;
  value: string;
  cellClassName?: string;
}) {
  return (
    <div className={cellClassName}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="break-words">{value}</p>
    </div>
  );
}
