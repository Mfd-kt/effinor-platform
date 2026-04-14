import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHeatingModelLabel } from "@/features/existing-heating/constants";
import type { ExistingHeatingDetailRow } from "@/features/existing-heating/types";

type ExistingHeatingSummaryCardsProps = {
  unit: ExistingHeatingDetailRow;
};

function formatKw(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} kW`;
}

function formatQty(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n);
}

export function ExistingHeatingSummaryCards({ unit }: ExistingHeatingSummaryCardsProps) {
  const hm = unit.heating_models;

  const modelLabel = hm
    ? formatHeatingModelLabel({ brand: hm.brand, model: hm.model, power_kw: hm.power_kw })
    : "—";

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Modèle</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-foreground">{modelLabel}</p>
          {hm ? (
            <p className="mt-1 text-muted-foreground text-xs">Type : {hm.type}</p>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Quantité</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{formatQty(unit.quantity)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Puissances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Unitaire : </span>
            {formatKw(unit.unit_power_kw)}
          </p>
          <p>
            <span className="text-muted-foreground">Totale : </span>
            {formatKw(unit.total_power_kw)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
