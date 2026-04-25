import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, Phone } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConvertMyLeadAssignmentCeeBundle } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { ConvertMyLeadAssignmentButton } from "@/features/lead-generation/components/convert-my-lead-assignment-button";
import { MyQueueConvertedAutoRedirect } from "@/features/lead-generation/components/my-queue-converted-auto-redirect";
import { LeadGenerationUnifiedAgentActivitySection } from "@/features/lead-generation/components/lead-generation-unified-agent-activity-section";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import { getLeadGenerationAssignmentActivities } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { getLeadGenerationMyQueueStockPageDetail } from "@/features/lead-generation/queries/get-lead-generation-stock-for-agent";
import { getFirstMyQueueStockId, getNextMyQueueStockIdAfter } from "@/features/lead-generation/lib/my-queue-next-stock";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationMyQueue,
  canBypassLeadGenMyQueueAsImpersonationActor,
} from "@/lib/auth/module-access";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(v: string | string[] | undefined): string | null {
  return typeof v === "string" ? v : null;
}

function isSafeReturnTo(href: string | null): boolean {
  return Boolean(href?.startsWith("/lead-generation/my-queue"));
}

const DPE_TONE: Record<string, string> = {
  A: "bg-emerald-600 text-white",
  B: "bg-emerald-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-500 text-slate-900",
  E: "bg-orange-500 text-white",
  F: "bg-red-600 text-white",
  G: "bg-rose-900 text-white",
};

function eur(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="break-words text-slate-900">{value}</p>
    </div>
  );
}

export default async function MyLeadGenerationStockPage({ params, searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    notFound();
  }

  const { id } = await params;
  const sp = await searchParams;
  const fromParam = firstString(sp.from);
  const detail = await getLeadGenerationMyQueueStockPageDetail(
    id,
    access.userId,
    canBypassLeadGenMyQueueAsImpersonationActor(access),
  );
  if (!detail) {
    const fallback = isSafeReturnTo(fromParam) ? fromParam! : "/lead-generation/my-queue";
    const p = new URLSearchParams();
    p.set("stale", "1");
    redirect(`${fallback}${fallback.includes("?") ? "&" : "?"}${p.toString()}`);
  }

  const { stock, assignmentCallTrace, openedViaSupportBypass, currentAssignmentAgentId, lastTerminalAssignmentId } =
    detail;

  const queueOwnerId =
    openedViaSupportBypass && currentAssignmentAgentId ? currentAssignmentAgentId : access.userId;
  const queueItems = await getMyLeadGenerationQueue(queueOwnerId);
  const backHref = isSafeReturnTo(fromParam) ? fromParam! : "/lead-generation/my-queue";

  if (stock.converted_lead_id) {
    const nextAfterConverted = getFirstMyQueueStockId(queueItems);
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageHeader
          title={stock.company_name}
          description="Fiche lead generation convertie"
          actions={
            <Link href={backHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ← Ma file
            </Link>
          }
        />
        <MyQueueConvertedAutoRedirect
          nextStockId={nextAfterConverted}
          fromHref={backHref}
          convertedLeadId={stock.converted_lead_id}
        />
      </div>
    );
  }

  const nextStockId = getNextMyQueueStockIdAfter(queueItems, id);
  const nextHref = nextStockId
    ? (() => {
        const p = new URLSearchParams();
        p.set("from", backHref);
        p.set("focus", nextStockId);
        return `/lead-generation/my-queue/${nextStockId}?${p.toString()}`;
      })()
    : null;
  const assignmentId = stock.current_assignment_id;
  const assignmentIdForHistory = assignmentId ?? lastTerminalAssignmentId ?? null;
  const assignmentBelongsToImpersonatedUser =
    !assignmentId || !currentAssignmentAgentId || currentAssignmentAgentId === access.userId;
  const lockActionsForSupportView = Boolean(openedViaSupportBypass && !assignmentBelongsToImpersonatedUser);
  const callTraceReadOnly = lockActionsForSupportView || !stock.current_assignment_id;

  const activities = assignmentIdForHistory
    ? await getLeadGenerationAssignmentActivities(assignmentIdForHistory, { limit: 120 })
    : [];

  // Champs immobilier — pas typés sur LeadGenerationStockRow mais présents en DB
  const immo = stock as unknown as {
    title: string | null;
    source_url: string | null;
    contact_name: string | null;
    property_type: string | null;
    surface_m2: number | null;
    rooms: number | null;
    bedrooms: number | null;
    dpe_class: string | null;
    ges_class: string | null;
    price_eur: number | null;
    listing_kind: "sale" | "rental" | null;
    published_at: string | null;
  };

  const phoneRaw = stock.phone ?? stock.normalized_phone ?? null;
  const telHref = phoneRaw ? `tel:${phoneRaw.replace(/\s+/g, "")}` : null;
  const cityLine = [stock.postal_code, stock.city].filter(Boolean).join(" ") || null;
  const dpeUpper = immo.dpe_class?.toUpperCase() ?? null;

  const ceeBundle: ConvertMyLeadAssignmentCeeBundle | null = null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {openedViaSupportBypass ? (
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-50">
          <p className="font-medium">Vue support (impersonation)</p>
          <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-100/90">
            Vous consultez cette fiche avec le compte du commercial. Si l&apos;attribution courante n&apos;est pas la
            sienne, les actions sensibles (conversion, journal, suivi d&apos;appel) sont en lecture seule.
          </p>
        </div>
      ) : null}

      <PageHeader
        title={immo.title?.trim() || stock.company_name}
        description={[cityLine, formatLeadGenerationSourceLabel(stock.source)].filter(Boolean).join(" · ")}
        actions={
          <>
            <Link href={backHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              ← Ma file
            </Link>
            {nextHref ? (
              <Link href={nextHref} className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                Suivant →
              </Link>
            ) : null}
          </>
        }
      />

      {/* === SECTION 1 : DÉTAIL DE L'ANNONCE === */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Annonce immobilière</CardTitle>
            {immo.listing_kind === "rental" ? (
              <Badge variant="secondary" className="rounded-full">Location</Badge>
            ) : immo.listing_kind === "sale" ? (
              <Badge variant="secondary" className="rounded-full">Vente</Badge>
            ) : null}
            {dpeUpper ? (
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold",
                  DPE_TONE[dpeUpper] ?? "bg-slate-200 text-slate-700",
                )}
                title={`DPE ${dpeUpper}`}
              >
                {dpeUpper}
              </span>
            ) : null}
          </div>
          {immo.title?.trim() ? (
            <p className="text-sm text-slate-700">{immo.title.trim()}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <DetailRow label="Type de bien" value={immo.property_type ?? "—"} />
            <DetailRow
              label={immo.listing_kind === "rental" ? "Loyer mensuel" : "Prix"}
              value={eur(immo.price_eur)}
            />
            <DetailRow
              label="Surface"
              value={immo.surface_m2 != null ? `${immo.surface_m2} m²` : "—"}
            />
            <DetailRow label="Pièces" value={immo.rooms != null ? String(immo.rooms) : "—"} />
            <DetailRow label="DPE" value={dpeUpper ?? "—"} />
            <DetailRow label="GES" value={immo.ges_class?.toUpperCase() ?? "—"} />
            <DetailRow label="Adresse" value={cityLine ?? "—"} />
            <DetailRow
              label="Publiée le"
              value={immo.published_at ? formatDateTimeFr(immo.published_at) : "—"}
            />
          </div>

          {/* Téléphone Aircall */}
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-900">Téléphone particulier</p>
              <p className="text-lg font-bold text-emerald-950">
                {phoneRaw ?? "Non disponible"}
              </p>
              {immo.contact_name ? (
                <p className="text-xs text-emerald-800">{immo.contact_name}</p>
              ) : null}
            </div>
            {telHref ? (
              <a
                href={telHref}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "gap-2 bg-emerald-600 text-white hover:bg-emerald-700",
                )}
              >
                <Phone className="h-4 w-4" aria-hidden />
                Appeler
              </a>
            ) : null}
          </div>

          {/* Lien annonce source */}
          {immo.source_url ? (
            <a
              href={immo.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "w-full justify-center gap-2 sm:w-auto",
              )}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Voir l&apos;annonce sur {formatLeadGenerationSourceLabel(stock.source)}
            </a>
          ) : null}
        </CardContent>
      </Card>

      {/* === SECTION 2 : ENREGISTREMENT & SUIVI === */}
      {assignmentIdForHistory ? (
        <LeadGenerationUnifiedAgentActivitySection
          assignmentId={assignmentIdForHistory}
          stockId={stock.id}
          nextStockId={nextStockId}
          returnToHref={backHref}
          readOnly={lockActionsForSupportView || callTraceReadOnly}
          initial={assignmentCallTrace}
          initialActivities={activities}
        />
      ) : null}

      {/* Conversion en lead CRM (si fiche assignée) */}
      {assignmentId && !lockActionsForSupportView ? (
        <ConvertMyLeadAssignmentButton
          stock={stock}
          ceeBundle={ceeBundle}
          myQueuePostConversion={{
            nextStockId,
            listHrefForFromParam: backHref,
          }}
        />
      ) : null}

      {!assignmentId ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Aucune attribution active sur cette fiche.
        </p>
      ) : null}
    </div>
  );
}
