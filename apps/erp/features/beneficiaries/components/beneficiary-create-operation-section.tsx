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
import { OperationStatusBadge } from "@/features/operations/components/operation-status-badge";
import type { BeneficiaryOperationCreationContext } from "@/features/beneficiaries/queries/get-beneficiary-operation-creation-context";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type BeneficiaryCreateOperationSectionProps = {
  beneficiaryId: string;
  context: BeneficiaryOperationCreationContext;
};

export function BeneficiaryCreateOperationSection({
  beneficiaryId,
  context,
}: BeneficiaryCreateOperationSectionProps) {
  const params = new URLSearchParams();
  params.set("beneficiary_id", beneficiaryId);
  if (context.recommendedTechnicalVisitId) {
    params.set("reference_technical_visit_id", context.recommendedTechnicalVisitId);
  }
  const href = `/operations/new?${params.toString()}`;

  const { flags, recommendedTechnicalVisitId, technicalVisits, existingOperations } = context;
  const rec = recommendedTechnicalVisitId
    ? technicalVisits.find((v) => v.id === recommendedTechnicalVisitId)
    : null;

  return (
    <Card className="mb-10 max-w-4xl border-border shadow-sm">
      <CardHeader>
        <CardTitle>Opération CEE</CardTitle>
        <CardDescription>
          Dossiers liés à ce bénéficiaire ; vous pouvez en ouvrir un nouveau (formulaire prérempli avec
          bénéficiaire et visite technique de référence si disponible).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {existingOperations.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Référence</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Désignation</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Fiche CEE</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Statut</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Mise à jour</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wide">
                    &nbsp;
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingOperations.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-mono text-sm font-medium">{op.operation_reference}</TableCell>
                    <TableCell className="max-w-[240px] truncate font-medium text-foreground">{op.title}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {op.cee_sheet_code?.trim() ? op.cee_sheet_code : "—"}
                    </TableCell>
                    <TableCell>
                      <OperationStatusBadge status={op.operation_status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                      {formatDateFr(op.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/operations/${op.id}`}
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
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 text-muted-foreground text-sm">
          {existingOperations.length === 0 ? (
            <p>Aucune opération pour ce bénéficiaire pour l’instant.</p>
          ) : (
            <p className="text-foreground/90">Créer un dossier supplémentaire si besoin (bouton à droite).</p>
          )}

          {flags.noTechnicalVisit ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-foreground">
              Aucune visite technique n’est liée à ce bénéficiaire : la VT de référence ne sera pas
              préremplie. Vous pourrez la sélectionner sur le formulaire si une VT est rattachée plus
              tard.
            </p>
          ) : null}

          {flags.noEligibleTechnicalVisit ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-foreground">
              Les visites techniques liées sont en statut refusé ou annulée : aucune VT de référence
              n’est proposée automatiquement.
            </p>
          ) : null}

          {rec ? (
            <p>
              <span className="font-medium text-foreground">VT suggérée :</span>{" "}
              <span className="font-mono text-foreground">{rec.vt_reference}</span>{" "}
              <span className="text-muted-foreground">({rec.status})</span>
            </p>
          ) : null}

          {flags.multipleEligible && rec ? (
            <p className="text-xs leading-relaxed">
              Plusieurs visites éligibles : la plus pertinente (validée ou la plus récente) est
              préremplie ; vous pouvez en choisir une autre sur le formulaire.
            </p>
          ) : null}
        </div>

          <Link href={href} className={cn(buttonVariants({ size: "lg" }), "shrink-0 whitespace-nowrap")}>
            Créer une opération
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
