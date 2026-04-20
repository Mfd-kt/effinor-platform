import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadGenerationDropcontactPanel } from "@/features/lead-generation/components/lead-generation-dropcontact-panel";
import { LeadGenerationGptResearchPanel } from "@/features/lead-generation/components/lead-generation-gpt-research-panel";
import { LeadGenerationQuantificationActions } from "@/features/lead-generation/components/lead-generation-quantification-actions";
import { LeadGenerationQuantificationGptPrefillProvider } from "@/features/lead-generation/components/lead-generation-quantification-gpt-prefill-context";
import { LeadGenerationQuickValidationPanel } from "@/features/lead-generation/components/lead-generation-quick-validation-panel";
import { LeadGenerationStreetViewSection } from "@/features/lead-generation/components/lead-generation-street-view-section";
import { isEligibleForDropcontactEnrichment } from "@/features/lead-generation/dropcontact/build-dropcontact-request";
import { canInitiateLeadGenerationGptResearch } from "@/features/lead-generation/lib/lead-generation-gpt-research-access";
import { isStockVisibleOnQuantificationPage } from "@/features/lead-generation/lib/quantification-batch-ownership";
import { resolveQuantificationImportBatchScope } from "@/features/lead-generation/lib/quantification-viewer-scope";
import { buildLeadGenerationStreetViewModel } from "@/features/lead-generation/lib/lead-generation-street-view";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import { getLeadGenerationStockById } from "@/features/lead-generation/queries/get-lead-generation-stock-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub, canAccessLeadGenerationQuantification } from "@/lib/auth/module-access";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function shortId(id: string): string {
  return id.length <= 14 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function statusBadgeLabel(status: string): string {
  if (status === "to_validate") return "À qualifier";
  if (status === "pending") return "À qualifier";
  return status;
}

export default async function LeadGenerationQuantificationDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  const hub = access.kind === "authenticated" ? await canAccessLeadGenerationHub(access) : false;
  const quantifier = access.kind === "authenticated" && canAccessLeadGenerationQuantification(access);
  if (access.kind !== "authenticated" || !(quantifier || hub)) {
    notFound();
  }

  const { id } = await params;
  const detail = await getLeadGenerationStockById(id);
  if (!detail) {
    notFound();
  }

  const { stock, import_batch } = detail;
  const batchScope = await resolveQuantificationImportBatchScope(access);
  if (
    !batchScope ||
    !isStockVisibleOnQuantificationPage(stock, import_batch?.created_by_user_id ?? null, batchScope)
  ) {
    notFound();
  }

  const maps = buildLeadGenerationStreetViewModel(stock);
  const ceeCode = import_batch?.cee_sheet_code?.trim() || null;
  const sourceLabel = import_batch?.source ? formatLeadGenerationSourceLabel(import_batch.source) : "—";
  const dropcontactElig = isEligibleForDropcontactEnrichment(stock);
  const primaryEmail = stock.email?.trim() || stock.enriched_email?.trim() || null;
  const primarySite = stock.website?.trim() || stock.enriched_website?.trim() || null;
  const canGptResearch = await canInitiateLeadGenerationGptResearch(access);

  return (
    <LeadGenerationQuantificationGptPrefillProvider>
    <div className="space-y-8">
      <PageHeader
        title={stock.company_name}
        description="File à qualifier — validez le prospect ou sortez-le du pipe avant diffusion commerciale."
        actions={
          <Link href="/lead-generation/quantification" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            ← File à qualifier
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Société</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Raison sociale</dt>
                <dd className="font-semibold text-foreground">{stock.company_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Téléphone</dt>
                <dd className="font-medium">{(stock.phone ?? stock.normalized_phone ?? "").trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Ville</dt>
                <dd className="font-medium">{(stock.city ?? "").trim() || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Adresse</dt>
                <dd className="font-medium">
                  {[(stock.address ?? "").trim(), (stock.postal_code ?? "").trim()].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Fiche CEE (lot)</dt>
                <dd className="font-medium">{ceeCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Source import</dt>
                <dd className="font-medium">{sourceLabel}</dd>
              </div>
              {import_batch?.id ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Lot d’import</dt>
                  <dd className="font-mono text-xs text-muted-foreground">{shortId(import_batch.id)}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <LeadGenerationQuickValidationPanel
          stockId={stock.id}
          mapsUrl={maps.openMapsUrl}
          showMapsLink={maps.canShowSection}
          disabled={false}
          variant="quantifier"
        />
      </div>

      <LeadGenerationStreetViewSection stock={stock} />

      <LeadGenerationGptResearchPanel
        stockId={stock.id}
        canRun={canGptResearch}
        researchGptStatus={stock.research_gpt_status ?? "idle"}
        researchGptRequestedAt={stock.research_gpt_requested_at ?? null}
        researchGptCompletedAt={stock.research_gpt_completed_at ?? null}
        researchGptLastError={stock.research_gpt_last_error ?? null}
        researchGptSummary={stock.research_gpt_summary ?? null}
        researchGptPayload={stock.research_gpt_payload ?? null}
      />

      <Card className="border-border/80 bg-card/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">E-mail</dt>
              <dd className="break-words font-medium">{primaryEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Site web</dt>
              <dd className="break-words font-medium">{primarySite ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Décideur</dt>
              <dd className="font-medium">{(stock.decision_maker_name ?? "").trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Rôle</dt>
              <dd className="font-medium">{(stock.decision_maker_role ?? "").trim() || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">LinkedIn</dt>
              <dd className="break-all font-medium">
                {stock.linkedin_url?.trim() ? (
                  <a
                    href={stock.linkedin_url.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {stock.linkedin_url.trim()}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/[0.03] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Décision</CardTitle>
          <p className="text-xs text-muted-foreground">
            Qualifiez pour envoyer vers les commerciaux, ou hors cible pour clôturer côté acquisition.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <LeadGenerationQuantificationActions stockId={stock.id} />
          <LeadGenerationDropcontactPanel
            stockId={stock.id}
            canResetDropcontact
            context="quantification"
            eligible={dropcontactElig.ok}
            disabled={false}
            dropcontactStatus={stock.dropcontact_status ?? "idle"}
            dropcontactRequestId={stock.dropcontact_request_id ?? null}
            dropcontactRequestedAt={stock.dropcontact_requested_at ?? null}
            dropcontactCompletedAt={stock.dropcontact_completed_at ?? null}
            dropcontactLastError={stock.dropcontact_last_error ?? null}
            email={stock.email?.trim() || stock.enriched_email?.trim() || null}
            phone={stock.phone?.trim() || stock.normalized_phone?.trim() || null}
            decisionMakerName={stock.decision_maker_name ?? null}
            decisionMakerRole={stock.decision_maker_role ?? null}
            linkedinUrl={stock.linkedin_url ?? null}
          />
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-muted/20 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contexte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Statut qualification : </span>
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-900 dark:text-amber-200">
              {statusBadgeLabel(stock.qualification_status)}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Créée le : </span>
            <span className="font-medium tabular-nums">{formatDateTimeFr(stock.created_at)}</span>
          </p>
          {stock.imported_at ? (
            <p>
              <span className="text-muted-foreground">Importée le : </span>
              <span className="font-medium tabular-nums">{formatDateTimeFr(stock.imported_at)}</span>
            </p>
          ) : null}
          {import_batch?.created_at ? (
            <p>
              <span className="text-muted-foreground">Lot créé le : </span>
              <span className="font-medium tabular-nums">{formatDateTimeFr(import_batch.created_at)}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
    </LeadGenerationQuantificationGptPrefillProvider>
  );
}
