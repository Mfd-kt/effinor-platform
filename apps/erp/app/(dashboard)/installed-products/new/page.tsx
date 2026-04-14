import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { InstalledProductForm } from "@/features/installed-products/components/installed-product-form";
import { INSTALLED_PRODUCT_MODULE_DESCRIPTION } from "@/features/installed-products/constants";
import { EMPTY_INSTALLED_PRODUCT_FORM } from "@/features/installed-products/lib/form-defaults";
import { getInstalledProductFormOptions } from "@/features/installed-products/queries/get-installed-product-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessInstalledProductsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function NewInstalledProductPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessInstalledProductsModule(access)) {
    notFound();
  }

  const options = await getInstalledProductFormOptions();

  return (
    <div>
      <PageHeader
        title="Nouveau produit installé"
        description={INSTALLED_PRODUCT_MODULE_DESCRIPTION}
        actions={
          <Link href="/installed-products" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à la liste
          </Link>
        }
      />

      {options.products.length === 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          Aucun produit dans le catalogue. Complétez le référentiel produits avant d'ajouter des lignes
          installées.
        </p>
      ) : (
        <InstalledProductForm
          mode="create"
          defaultValues={EMPTY_INSTALLED_PRODUCT_FORM}
          options={options}
          className="max-w-4xl"
        />
      )}
    </div>
  );
}
