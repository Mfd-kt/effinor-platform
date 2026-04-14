import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessProductsModule } from "@/lib/auth/module-access";
import { queryProductsForCatalog } from "@/features/products/queries/get-products";
import { toProductCatalogCardFromDetails } from "@/features/products/domain/mappers";
import { ProductCatalogShell } from "@/features/products/components/product-catalog-shell";
import { queryOrCreateCartForLead } from "@/features/products/queries/get-cart";
import { toCartViewModel } from "@/features/products/domain/mappers";

export default async function ProductsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessProductsModule(access)) {
    notFound();
  }

  const productsWithDetails = await queryProductsForCatalog();
  const products = productsWithDetails.map(toProductCatalogCardFromDetails);

  return (
    <>
      <PageHeader
        title="Catalogue produits"
        description="Références techniques, familles CEE et fiches produit. Sélectionnez les équipements pour constituer votre panier projet."
      />
      <ProductCatalogShell products={products} initialCart={null} />
    </>
  );
}
