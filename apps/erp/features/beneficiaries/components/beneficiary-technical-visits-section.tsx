import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { BeneficiaryLinkedTechnicalVisit } from "@/features/beneficiaries/types";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";

type BeneficiaryTechnicalVisitsSectionProps = {
  visits: BeneficiaryLinkedTechnicalVisit[];
};

export function BeneficiaryTechnicalVisitsSection({
  visits,
}: BeneficiaryTechnicalVisitsSectionProps) {
  return (
    <Card className="mt-10 max-w-4xl border-border shadow-sm">
      <CardHeader>
        <CardTitle>Visites techniques liées</CardTitle>
        <CardDescription>
          Historique des passages terrain et comptes-rendus associés à ce bénéficiaire (flux Lead →
          visite → bénéficiaire).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune visite technique n’est encore liée à ce bénéficiaire. Liez une VT depuis la fiche
            visite ou à la création du dossier.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Référence
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Statut
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Planifiée
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Effectuée
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Technicien
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">
                    Lead d’origine
                  </TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wide">
                    &nbsp;
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-sm font-medium">{v.vt_reference}</TableCell>
                    <TableCell>
                      <TechnicalVisitStatusBadge status={v.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {formatDateFr(v.scheduled_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {formatDateFr(v.performed_at)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {v.technician_label ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {v.lead_company_name ? (
                        <Link
                          href={`/leads/${v.lead_id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {v.lead_company_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/technical-visits/${v.id}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Ouvrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
