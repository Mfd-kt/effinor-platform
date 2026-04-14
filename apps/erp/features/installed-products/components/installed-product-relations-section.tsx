import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstalledProductDetailRow } from "@/features/installed-products/types";

type InstalledProductRelationsSectionProps = {
  row: InstalledProductDetailRow;
};

export function InstalledProductRelationsSection({ row }: InstalledProductRelationsSectionProps) {
  const product = row.products;

  return (
    <Card className="mb-8 max-w-4xl border-border shadow-sm">
      <CardHeader>
        <CardTitle>Produit catalogue</CardTitle>
        <CardDescription>Référence issue du catalogue interne.</CardDescription>
      </CardHeader>
      <CardContent>
        {product ? (
          <p className="text-sm">
            <span className="font-medium text-foreground">
              {product.brand} · {product.reference} — {product.name}
            </span>
          </p>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </CardContent>
    </Card>
  );
}
