import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InstalledProductsFilters } from "@/features/installed-products/components/installed-products-filters";
import { InstalledProductsTable } from "@/features/installed-products/components/installed-products-table";
import { INSTALLED_PRODUCT_MODULE_DESCRIPTION } from "@/features/installed-products/constants";
import { getInstalledProductFormOptions } from "@/features/installed-products/queries/get-installed-product-form-options";
import { getInstalledProducts } from "@/features/installed-products/queries/get-installed-products";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessInstalledProductsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    product_id?: string;
    cee_sheet_code?: string;
  }>;
};

export default async function InstalledProductsPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessInstalledProductsModule(access)) {
    notFound();
  }
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawProduct = typeof sp.product_id === "string" ? sp.product_id : "all";
  const rawCee = typeof sp.cee_sheet_code === "string" ? sp.cee_sheet_code : "";

  const productFilter =
    rawProduct !== "all" && rawProduct.trim() !== "" ? rawProduct.trim() : undefined;
  const ceeFilter = rawCee.trim() !== "" ? rawCee.trim() : undefined;

  let rows;
  try {
    rows = await getInstalledProducts({
      q: q || undefined,
      product_id: productFilter,
      cee_sheet_code: ceeFilter,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement des produits installés.";
    return (
      <div>
        <PageHeader
          title="Produits installés"
          description={INSTALLED_PRODUCT_MODULE_DESCRIPTION}
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const options = await getInstalledProductFormOptions();

  const hasFilters =
    Boolean(q.trim()) || rawProduct !== "all" || Boolean(rawCee.trim());

  return (
    <div>
      <PageHeader
        title="Produits installés"
        description={INSTALLED_PRODUCT_MODULE_DESCRIPTION}
        actions={
          <Link href="/installed-products/new" className={cn(buttonVariants())}>
            Nouveau produit installé
          </Link>
        }
      />

      <InstalledProductsFilters
        defaultQ={q}
        defaultProductId={rawProduct}
        defaultCeeSheetCode={rawCee}
        options={options}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucun produit installé"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez une nouvelle ligne."
              : "Enregistrez les équipements prévus ou posés (lien catalogue produit)."
          }
          icon={<Package className="size-10 opacity-50" />}
          action={
            <Link href="/installed-products/new" className={cn(buttonVariants())}>
              Nouveau produit installé
            </Link>
          }
        />
      ) : (
        <InstalledProductsTable data={rows} />
      )}
    </div>
  );
}
