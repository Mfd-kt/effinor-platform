import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Phone } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConvertAssignmentForm } from "@/features/lead-generation/components/convert-assignment-form";
import { LeadGenerationDeleteStockButton } from "@/features/lead-generation/components/lead-generation-delete-stock-button";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { leadGenerationConvertedStockMessage } from "@/features/lead-generation/lib/lead-generation-operational-scope";
import { getLeadGenerationAssignableAgents } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents";
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
  if (!assignmentId) return "";
  const supabase = await createClient();
  const { data } = await lgTable(supabase, "lead_generation_assignments")
    .select("agent_id")
    .eq("id", assignmentId)
    .maybeSingle();
  return (data as { agent_id: string } | null)?.agent_id ?? "";
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

export default async function LeadGenerationStockDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  const { id } = await params;
  const [detail, agents] = await Promise.all([
    getLeadGenerationStockById(id),
    getLeadGenerationAssignableAgents(),
  ]);
  if (!detail) notFound();

  const { stock } = detail;

  // Champs immobilier — pas typés sur LeadGenerationStockRow mais présents en DB
  // après migration `add_immobilier_columns_to_stock`. Cast contrôlé pour lecture.
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
    is_professional: boolean | null;
  };

  const phoneRaw = stock.phone ?? null;
  const telHref = phoneRaw ? `tel:${phoneRaw.replace(/\s+/g, "")}` : null;
  const cityLine = [stock.postal_code, stock.city].filter(Boolean).join(" ") || null;
  const dpeUpper = immo.dpe_class?.toUpperCase() ?? null;

  const defaultAgentId = await getAssignmentAgentId(stock.current_assignment_id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title={immo.title?.trim() || stock.company_name}
        description={[cityLine, formatLeadGenerationSourceLabel(stock.source)]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <div className="flex flex-wrap items-end justify-end gap-2">
            <LeadGenerationDeleteStockButton
              stockId={stock.id}
              companyName={stock.company_name}
              convertedLeadId={stock.converted_lead_id}
              stockStatus={stock.stock_status}
            />
            <Link
              href="/lead-generation"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              ← Fiches disponibles
            </Link>
          </div>
        }
      />

      {stock.converted_lead_id ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Fiche déjà convertie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{leadGenerationConvertedStockMessage()}</p>
            <Link
              href={`/leads/${stock.converted_lead_id}`}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-fit")}
            >
              Ouvrir la fiche prospect
            </Link>
          </CardContent>
        </Card>
      ) : null}

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
            {immo.is_professional ? (
              <Badge variant="outline" className="text-xs">Professionnel</Badge>
            ) : null}
          </div>
          {immo.title?.trim() ? (
            <p className="text-sm text-slate-700">{immo.title.trim()}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Détails clés */}
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

          {/* Téléphone — bouton cliquable Aircall (tel:) */}
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

          {/* Lien vers l'annonce source */}
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

      {!stock.converted_lead_id && stock.current_assignment_id ? (
        <ConvertAssignmentForm
          assignmentId={stock.current_assignment_id}
          defaultAgentId={defaultAgentId}
          agents={agents}
        />
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="break-words text-slate-900">{value}</p>
    </div>
  );
}
