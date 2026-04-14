import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import type { OperationSiteDetailRow } from "@/features/operation-sites/types";
import { cn } from "@/lib/utils";

type OperationSiteOperationSectionProps = {
  site: OperationSiteDetailRow;
};

export function OperationSiteOperationSection({ site }: OperationSiteOperationSectionProps) {
  const op = site.operations;
  const ben = op?.beneficiaries;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Dossier opération & bénéficiaire</CardTitle>
        <CardDescription>
          Liens vers l’opération CEE et le bénéficiaire rattaché au site.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {op ? (
          <Link
            href={`/operations/${op.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
          >
            Opération {op.operation_reference}
            <span className="ml-2 max-w-[220px] truncate text-muted-foreground text-xs font-normal">
              {op.title}
            </span>
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">Opération non résolue.</span>
        )}

        {ben ? (
          <Link
            href={`/beneficiaries/${ben.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
          >
            Bénéficiaire : {ben.company_name}
          </Link>
        ) : op?.beneficiary_id ? (
          <Link
            href={`/beneficiaries/${op.beneficiary_id}`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Fiche bénéficiaire
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">Aucun bénéficiaire lié à l’opération.</span>
        )}
      </CardContent>
    </Card>
  );
}
