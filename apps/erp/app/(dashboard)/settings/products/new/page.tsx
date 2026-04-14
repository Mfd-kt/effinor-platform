import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCreateForm } from "@/features/products/components/product-create-form";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

export default async function NewProductPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/settings/products"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 inline-flex text-muted-foreground",
          )}
        >
          <ArrowLeft className="size-3.5" data-icon="inline-start" />
          Produits
        </Link>
      </div>

      <PageHeader
        title="Nouveau produit"
        description="Renseignez les informations minimales. Vous pourrez compléter la fiche, les caractéristiques et les photos ensuite."
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ProductCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
