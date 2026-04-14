"use client";

import Image from "next/image";
import { Package, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";

type Props = {
  product: SimulatorProductCardViewModel;
  isRecommended?: boolean;
  onAdd?: (product: SimulatorProductCardViewModel) => void;
  disabled?: boolean;
};

export function SimulatorProductCard({
  product,
  isRecommended,
  onAdd,
  disabled,
}: Props) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3 text-sm ring-1 ring-foreground/5">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-1"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium leading-tight">{product.name}</p>
            {isRecommended ? (
              <Badge variant="secondary" className="mt-0.5 text-[0.6rem]">
                Recommandé
              </Badge>
            ) : null}
          </div>
          {onAdd ? (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onAdd(product)}
              disabled={disabled}
            >
              <Plus />
            </Button>
          ) : null}
        </div>

        {product.descriptionShort ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {product.descriptionShort}
          </p>
        ) : null}

        {product.topSpecs.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.65rem] text-muted-foreground">
            {product.topSpecs.map((s) => (
              <span key={s.label}>
                {s.label}: <strong className="font-medium text-foreground">{s.value}</strong>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
