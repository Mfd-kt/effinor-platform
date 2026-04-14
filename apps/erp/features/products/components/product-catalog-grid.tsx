"use client";

import { useState, useTransition } from "react";

import type { ProductCatalogCardViewModel, CartViewModel } from "@/features/products/domain/types";
import { ProductCatalogCard } from "./product-catalog-card";
import { addToCart } from "@/features/products/actions/cart-actions";

type Props = {
  products: ProductCatalogCardViewModel[];
  cart: CartViewModel | null;
  onCartUpdate?: (cart: CartViewModel) => void;
};

export function ProductCatalogGrid({ products, cart, onCartUpdate }: Props) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(product: ProductCatalogCardViewModel) {
    if (!cart) return;
    setAddingId(product.id);
    startTransition(async () => {
      const result = await addToCart(cart.id, product.id, 1);
      setAddingId(null);
      if (result.ok && onCartUpdate) {
        onCartUpdate(result.data);
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <h3 className="text-lg font-medium text-foreground">Aucun produit actif</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Les produits apparaîtront ici une fois ajoutés au catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCatalogCard
          key={p.id}
          product={p}
          onAdd={cart ? handleAdd : undefined}
          isAddingToCart={addingId === p.id && isPending}
        />
      ))}
    </div>
  );
}
