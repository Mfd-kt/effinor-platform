"use client";

import { useState } from "react";

import type { ProductCatalogCardViewModel, CartViewModel } from "@/features/products/domain/types";
import { ProductCatalogGrid } from "./product-catalog-grid";
import { CartDrawer } from "./cart-drawer";

type Props = {
  products: ProductCatalogCardViewModel[];
  initialCart: CartViewModel | null;
};

export function ProductCatalogShell({ products, initialCart }: Props) {
  const [cart, setCart] = useState<CartViewModel | null>(initialCart);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {products.length} produit{products.length !== 1 ? "s" : ""} disponible{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        {cart ? (
          <CartDrawer cart={cart} onCartUpdate={setCart} />
        ) : null}
      </div>

      <ProductCatalogGrid
        products={products}
        cart={cart}
        onCartUpdate={setCart}
      />
    </div>
  );
}
