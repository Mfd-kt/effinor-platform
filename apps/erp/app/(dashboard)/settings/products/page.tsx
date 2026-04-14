import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
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
        actions={
          <Link href="/settings/products/new" className={buttonVariants()}>
            <Plus className="size-4" data-icon="inline-start" />
            Nouveau produit
          </Link>
        }
      />
      <AdminProductsTable products={products} />
    </div>
  );
}
