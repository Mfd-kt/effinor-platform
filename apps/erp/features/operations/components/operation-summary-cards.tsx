import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatEur } from "@/lib/format";

import { OperationStatusBadge } from "@/features/operations/components/operation-status-badge";
import { parseEuroPerKwhcFromNote } from "@/features/operations/lib/delegator-prime-rate";
import type { OperationDetailRow } from "@/features/operations/types";

type OperationSummaryCardsProps = {
  operation: OperationDetailRow;
};

/** Montant enregistré, ou à défaut kWhc × taux €/kWhc du délégataire (comme l’aperçu formulaire). */
function resolveEstimatedPrimeEuro(operation: OperationDetailRow): number | null {
  const stored = operation.estimated_prime_amount;
  if (stored != null && Number.isFinite(stored)) return stored;
  const kwhc = operation.cee_kwhc_calculated;
  const rate = parseEuroPerKwhcFromNote(operation.delegators?.prime_per_kwhc_note ?? null);
  if (kwhc == null || !Number.isFinite(kwhc) || rate == null) return null;
  return kwhc * rate;
}

export function OperationSummaryCards({ operation }: OperationSummaryCardsProps) {
  const beneficiaryName = operation.beneficiaries?.company_name ?? "—";
  const primeEuro = resolveEstimatedPrimeEuro(operation);

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Référence</CardDescription>
          <CardTitle className="font-mono text-lg">{operation.operation_reference}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {operation.title}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Bénéficiaire</CardDescription>
          <CardTitle className="text-lg">{beneficiaryName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div>
            Fiche CEE :{" "}
            <span className="font-mono text-foreground">{operation.cee_sheet_code}</span>
          </div>
          {operation.cee_kwhc_calculated != null && Number.isFinite(operation.cee_kwhc_calculated) ? (
            <div>
              Prime CEE (kWhc) :{" "}
              <span className="font-mono text-foreground tabular-nums">
                {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(
                  operation.cee_kwhc_calculated,
                )}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Statut opération</CardDescription>
        </CardHeader>
        <CardContent>
          <OperationStatusBadge status={operation.operation_status} />
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Prime estimée</CardDescription>
          <CardTitle className="text-xl tabular-nums">{formatEur(primeEuro)}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Reste à charge estimé</CardDescription>
          <CardTitle className="text-xl tabular-nums">
            {formatEur(operation.estimated_remaining_cost)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Devis HT (estim.)</CardDescription>
          <CardTitle className="text-xl tabular-nums">
            {formatEur(operation.estimated_quote_amount_ht)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
