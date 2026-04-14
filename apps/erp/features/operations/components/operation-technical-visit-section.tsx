import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import type { OperationDetailRow } from "@/features/operations/types";
import { cn } from "@/lib/utils";

type OperationTechnicalVisitSectionProps = {
  operation: OperationDetailRow;
};

export function OperationTechnicalVisitSection({ operation }: OperationTechnicalVisitSectionProps) {
  const ref = operation.reference_technical_visit;

  if (!ref) {
    return (
      <Card className="mb-8 max-w-4xl border-border shadow-sm">
        <CardHeader>
          <CardTitle>Visite technique de référence</CardTitle>
          <CardDescription>
            Aucune visite technique n’est liée à ce dossier. Choisissez une VT rattachée au
            bénéficiaire dans le formulaire ci-dessous (flux Lead → VT → Bénéficiaire → Opération).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-8 max-w-4xl border-border shadow-sm">
      <CardHeader>
        <CardTitle>Visite technique de référence</CardTitle>
        <CardDescription>
          Passage terrain ayant précédé l’ouverture de ce dossier opération.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-sm font-semibold text-foreground">{ref.vt_reference}</p>
          <TechnicalVisitStatusBadge status={ref.status} />
        </div>
        <Link
          href={`/technical-visits/${ref.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Ouvrir la visite
        </Link>
      </CardContent>
    </Card>
  );
}
