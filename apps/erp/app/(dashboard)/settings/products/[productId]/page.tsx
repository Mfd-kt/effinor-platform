import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCoverUpload } from "@/features/products/components/product-cover-upload";
import { ProductEditForm } from "@/features/products/components/product-edit-form";
import { ProductImageGallery } from "@/features/products/components/product-image-gallery";
import { ProductSpecsPanel } from "@/features/products/components/product-specs-panel";
import { queryProductByIdForAdmin } from "@/features/products/queries/get-product-admin";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ productId: string }>;
};

export default async function SettingsProductDetailPage({ params }: Props) {
  await requireSuperAdmin();
  const { productId } = await params;
  const product = await queryProductByIdForAdmin(productId);

  if (!product) notFound();

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
        title={product.name}
        description={
          <span className="flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              {product.product_code}
            </code>
            <span className="text-muted-foreground">·</span>
            <span>{product.brand}</span>
            <span className="text-muted-foreground">·</span>
            <Badge variant={product.is_active ? "default" : "secondary"}>
              {product.is_active ? "Actif" : "Inactif"}
            </Badge>
          </span>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ProductEditForm product={product} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Caractéristiques</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ProductSpecsPanel
                specs={product.specs}
                keyMetrics={product.keyMetrics}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <ProductImageGallery
                productId={product.id}
                images={product.images}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <ProductCoverUpload
                productId={product.id}
                currentImageUrl={product.image_url}
                productName={product.name}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm">Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Catégorie</dt>
                  <dd>{product.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Famille</dt>
                  <dd>{product.product_family ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Référence</dt>
                  <dd className="font-mono text-xs">{product.reference}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Unité</dt>
                  <dd>{product.unit_label}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ordre</dt>
                  <dd>{product.sort_order}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Créé le</dt>
                  <dd>
                    {new Date(product.created_at).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Modifié le</dt>
                  <dd>
                    {new Date(product.updated_at).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
