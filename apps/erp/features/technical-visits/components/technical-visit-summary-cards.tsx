import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import type { TechnicalVisitDetailRow } from "@/features/technical-visits/types";

type TechnicalVisitSummaryCardsProps = {
  visit: TechnicalVisitDetailRow;
  fieldAccessLevel?: "full" | "technician_restricted";
};

export function TechnicalVisitSummaryCards({
  visit,
  fieldAccessLevel = "full",
}: TechnicalVisitSummaryCardsProps) {
  const restricted = fieldAccessLevel === "technician_restricted";
  const leadName = restricted ? "—" : (visit.leads?.company_name ?? "—");
  const techLabel =
    visit.technician?.full_name?.trim() ||
    visit.technician?.email?.trim() ||
    null;
  const previewPlace = [visit.worksite_postal_code, visit.worksite_city].filter(Boolean).join(" ").trim();

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Référence</CardDescription>
          <CardTitle className="font-mono text-lg">{visit.vt_reference}</CardTitle>
        </CardHeader>
        <CardContent>
          <TechnicalVisitStatusBadge status={visit.status} />
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>{restricted ? "Dossier commercial" : "Lead"}</CardDescription>
          <CardTitle className="text-lg">{leadName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {restricted ? (
            <p className="text-sm text-muted-foreground">
              Masqué jusqu’à l’ouverture des détails (24h avant le créneau planifié).
            </p>
          ) : visit.leads ? (
            <Link
              href={`/leads/${visit.leads.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ouvrir la fiche lead
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {restricted ? (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Lieu (aperçu)</CardDescription>
            <CardTitle className="text-base font-normal">
              {previewPlace || "—"}
              {visit.region ? ` · ${visit.region}` : ""}
            </CardTitle>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Passage</CardDescription>
          <CardTitle className="text-base font-normal">
            {formatDateFr(visit.scheduled_at)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Date effectuée</CardDescription>
          <CardTitle className="text-base font-normal">
            {formatDateFr(visit.performed_at)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Technicien</CardDescription>
          <CardTitle className="text-base font-normal">{techLabel ?? "—"}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
