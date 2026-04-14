import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { InstalledProductForm } from "@/features/installed-products/components/installed-product-form";
import { InstalledProductRelationsSection } from "@/features/installed-products/components/installed-product-relations-section";
import { InstalledProductSummaryCards } from "@/features/installed-products/components/installed-product-summary-cards";
import { installedProductRowToFormValues } from "@/features/installed-products/lib/form-defaults";
import { getInstalledProductById } from "@/features/installed-products/queries/get-installed-product-by-id";
import { getInstalledProductFormOptions } from "@/features/installed-products/queries/get-installed-product-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessInstalledProductsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstalledProductDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessInstalledProductsModule(access)) {
    notFound();
  }
  const { id } = await params;
  const [row, options] = await Promise.all([
    getInstalledProductById(id),
    getInstalledProductFormOptions(),
  ]);

  if (!row) {
    notFound();
  }

  const product = row.products;
  const title = product
    ? `${product.brand} · ${product.reference}`
    : "Produit installé";

  return (
    <div>
      <PageHeader
        title={title}
        description={
          <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="font-mono text-xs text-foreground/90">{row.id}</span>
            <span>Màj {formatDateFr(row.updated_at)}</span>
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/installed-products" className={cn(buttonVariants({ variant: "outline" }))}>
              Retour à la liste
            </Link>
          </div>
        }
      />

      <InstalledProductSummaryCards row={row} />

      <InstalledProductRelationsSection row={row} />

      <InstalledProductForm
        key={row.id}
        mode="edit"
        installedProductId={row.id}
        defaultValues={installedProductRowToFormValues(row)}
        options={options}
        className="max-w-4xl"
      />
    </div>
  );
}
