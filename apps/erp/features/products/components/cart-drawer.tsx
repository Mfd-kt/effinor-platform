"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { CartViewModel } from "@/features/products/domain/types";
import {
  updateItemQuantity,
  removeFromCart,
} from "@/features/products/actions/cart-actions";

type Props = {
  cart: CartViewModel;
  onCartUpdate: (cart: CartViewModel) => void;
};

export function CartDrawer({ cart, onCartUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  function handleUpdateQty(itemId: string, qty: number) {
    setPendingItemId(itemId);
    startTransition(async () => {
      if (qty <= 0) {
        const result = await removeFromCart(itemId, cart.id);
        if (result.ok) onCartUpdate(result.data);
      } else {
        const result = await updateItemQuantity(itemId, qty, cart.id);
        if (result.ok) onCartUpdate(result.data);
      }
      setPendingItemId(null);
    });
  }

  function handleRemove(itemId: string) {
    setPendingItemId(itemId);
    startTransition(async () => {
      const result = await removeFromCart(itemId, cart.id);
      if (result.ok) onCartUpdate(result.data);
      setPendingItemId(null);
    });
  }

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="relative gap-1.5" />
        }
      >
        <ShoppingCart className="size-4" />
        <span className="hidden sm:inline">Panier</span>
        {cart.totalItems > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
            {cart.totalItems}
          </span>
        ) : null}
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Panier projet</SheetTitle>
          <SheetDescription>
            {cart.totalItems === 0
              ? "Aucun produit sélectionné"
              : `${cart.totalItems} produit${cart.totalItems > 1 ? "s" : ""} · ${cart.totalQuantity} unité${cart.totalQuantity > 1 ? "s" : ""}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <ShoppingCart className="mb-3 size-8 opacity-30" />
              <p className="text-sm">Ajoutez des produits depuis le catalogue</p>
            </div>
          ) : (
            <ul className="divide-y">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium leading-tight">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.productCode}
                    </p>
                    {item.unitPriceHt != null ? (
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unitPriceHt)} HT / unité
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={isPending && pendingItemId === item.id}
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    >
                      <Minus />
                    </Button>
                    <span className="min-w-[1.5rem] text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={isPending && pendingItemId === item.id}
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    >
                      <Plus />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-1 text-destructive"
                      disabled={isPending && pendingItemId === item.id}
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {item.lineTotalHt != null ? (
                    <div className="min-w-[4.5rem] text-right text-sm font-semibold tabular-nums">
                      {formatPrice(item.lineTotalHt)}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.totalItems > 0 ? (
          <SheetFooter>
            <div className="flex w-full items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Sous-total HT
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPrice(cart.subtotalHt)}
              </span>
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
