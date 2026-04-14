import { PageHeader } from "@/components/shared/page-header";
import { AdminProductsTable } from "@/features/products/components/admin-products-table";
import { queryAllProductsForAdmin } from "@/features/products/queries/get-product-admin";
import { requireSuperAdmin } from "@/lib/auth/guards";

export default async function SettingsProductsPage() {
  await requireSuperAdmin();
  const products = await queryAllProductsForAdmin();

  return (
    <div>
      <PageHeader
        title="Produits"
        description="Consultez et gérez le catalogue de produits. Cliquez sur un produit pour modifier ses informations et sa galerie photos."
      />
      <AdminProductsTable products={products} />
    </div>
  );
}
