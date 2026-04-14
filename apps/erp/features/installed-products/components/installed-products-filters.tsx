import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import type { InstalledProductFormOptions } from "@/features/installed-products/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type InstalledProductsFiltersProps = {
  defaultQ: string;
  defaultProductId: string;
  defaultCeeSheetCode: string;
  options: InstalledProductFormOptions;
};

export function InstalledProductsFilters({
  defaultQ,
  defaultProductId,
  defaultCeeSheetCode,
  options,
}: InstalledProductsFiltersProps) {
  return (
    <form
      method="get"
      action="/installed-products"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-ip-q">Recherche (notes, fiche CEE)</Label>
        <Input
          id="filter-ip-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Texte libre…"
        />
      </div>
      <div className="w-full min-w-[220px] sm:min-w-[280px]">
        <div className="space-y-2">
          <Label htmlFor="filter-ip-product">Produit catalogue</Label>
          <select
            id="filter-ip-product"
            name="product_id"
            defaultValue={defaultProductId}
            className={selectClassName}
          >
            <option value="all">Tous</option>
            {options.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} · {p.reference} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-w-[160px] flex-1 space-y-2">
        <Label htmlFor="filter-ip-cee">Fiche CEE (extrait)</Label>
        <Input
          id="filter-ip-cee"
          name="cee_sheet_code"
          defaultValue={defaultCeeSheetCode}
          placeholder="Ex. BAR-TH-…"
        />
      </div>
      <button type="submit" className={cn(buttonVariants())}>
        Filtrer
      </button>
    </form>
  );
}
