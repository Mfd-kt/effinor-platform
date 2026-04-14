import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InstalledProductDetailRow } from "@/features/installed-products/types";
import { formatEur } from "@/lib/format";

type InstalledProductSummaryCardsProps = {
  row: InstalledProductDetailRow;
};

export function InstalledProductSummaryCards({ row }: InstalledProductSummaryCardsProps) {
  const product = row.products;

  const productTitle = product
    ? `${product.brand} · ${product.reference}`
    : "—";
  const productSub = product?.name ?? "";

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Produit catalogue</CardDescription>
          <CardTitle className="text-lg leading-snug">{productTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">{productSub || "—"}</CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Quantité</CardDescription>
          <CardTitle className="font-mono text-xl tabular-nums">{String(row.quantity)}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Prix unitaire HT</CardDescription>
          <CardTitle className="text-xl tabular-nums">{formatEur(row.unit_price_ht)}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Total HT</CardDescription>
          <CardTitle className="text-xl tabular-nums">{formatEur(row.total_price_ht)}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Fiche CEE</CardDescription>
          <CardTitle className="font-mono text-base">{row.cee_sheet_code ?? "—"}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardDescription>Valorisation</CardDescription>
          <CardTitle className="text-xl tabular-nums">{formatEur(row.valuation_amount)}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
