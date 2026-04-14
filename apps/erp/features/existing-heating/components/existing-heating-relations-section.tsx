import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHeatingModelLabel } from "@/features/existing-heating/constants";
import type { ExistingHeatingDetailRow } from "@/features/existing-heating/types";

type ExistingHeatingRelationsSectionProps = {
  unit: ExistingHeatingDetailRow;
};

export function ExistingHeatingRelationsSection({ unit }: ExistingHeatingRelationsSectionProps) {
  const hm = unit.heating_models;

  const modelLabel = hm
    ? formatHeatingModelLabel({ brand: hm.brand, model: hm.model, power_kw: hm.power_kw })
    : "—";

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Référentiel</CardTitle>
        <CardDescription>Modèle catalogue associé à cette observation.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {hm ? (
          <span className="inline-flex items-center rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            {modelLabel}
            <span className="ml-2 text-muted-foreground">({hm.type})</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Modèle non résolu.</span>
        )}
      </CardContent>
    </Card>
  );
}
