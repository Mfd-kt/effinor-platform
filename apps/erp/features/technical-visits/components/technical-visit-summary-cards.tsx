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
};

export function TechnicalVisitSummaryCards({ visit }: TechnicalVisitSummaryCardsProps) {
  const leadName = visit.leads?.company_name ?? "—";
  const techLabel =
    visit.technician?.full_name?.trim() ||
    visit.technician?.email?.trim() ||
    null;

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
          <CardDescription>Lead</CardDescription>
          <CardTitle className="text-lg">{leadName}</CardTitle>
        </CardHeader>
        <CardContent>
          {visit.leads ? (
            <Link
              href={`/leads/${visit.leads.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ouvrir la fiche lead
            </Link>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Date planifiée</CardDescription>
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
