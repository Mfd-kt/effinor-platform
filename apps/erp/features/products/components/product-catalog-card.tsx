"use client";

import Image from "next/image";
import { Package, Plus, Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductCatalogCardViewModel } from "@/features/products/domain/types";

type Props = {
  product: ProductCatalogCardViewModel;
  onAdd?: (product: ProductCatalogCardViewModel) => void;
  onViewDetails?: (product: ProductCatalogCardViewModel) => void;
  isAddingToCart?: boolean;
};

export function ProductCatalogCard({
  product,
  onAdd,
  onViewDetails,
  isAddingToCart,
}: Props) {
  return (
    <Card className="flex h-full flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Badge variant="secondary" className="text-[0.65rem] uppercase tracking-wider">
            {product.category}
          </Badge>
        </div>
      </div>

      <CardHeader className="flex-1 pb-2">
        <div className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          {product.brand}
        </div>
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        {product.descriptionShort ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {product.descriptionShort}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="pb-3">
        {product.keyMetrics.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {product.keyMetrics.map((m) => (
              <Badge key={m} variant="outline" className="text-[0.6rem]">
                {m}
              </Badge>
            ))}
          </div>
        ) : null}
        {product.defaultPriceHt != null ? (
          <div className="mt-2 text-sm font-semibold text-foreground">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
            }).format(product.defaultPriceHt)}{" "}
            <span className="text-xs font-normal text-muted-foreground">HT / unité</span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="gap-2">
        {onViewDetails ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(product)}
          >
            <Eye data-icon="inline-start" />
            Détails
          </Button>
        ) : null}
        {onAdd ? (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onAdd(product)}
            disabled={isAddingToCart}
          >
            <Plus data-icon="inline-start" />
            Ajouter
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
