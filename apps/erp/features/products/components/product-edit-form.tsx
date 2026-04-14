"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProductAction } from "@/features/products/actions/product-admin-actions";
import type { Database } from "@/types/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type Props = {
  product: ProductRow;
};

export function ProductEditForm({ product }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(product.name);
  const [brand, setBrand] = useState(product.brand);
  const [descShort, setDescShort] = useState(product.description_short ?? "");
  const [descLong, setDescLong] = useState(product.description_long ?? "");
  const [priceHt, setPriceHt] = useState(
    product.default_price_ht != null ? String(product.default_price_ht) : "",
  );
  const [sortOrder, setSortOrder] = useState(String(product.sort_order));
  const [isActive, setIsActive] = useState(product.is_active);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await updateProductAction(product.id, {
        name,
        brand,
        description_short: descShort || undefined,
        description_long: descLong || undefined,
        default_price_ht: priceHt ? Number(priceHt) : null,
        sort_order: sortOrder ? Number(sortOrder) : 100,
        is_active: isActive,
      });

      if (!res.ok) {
        setError(res.error ?? "Erreur inconnue");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du produit</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Marque</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc_short">Description courte</Label>
        <Textarea
          id="desc_short"
          value={descShort}
          onChange={(e) => setDescShort(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc_long">Description longue</Label>
        <Textarea
          id="desc_long"
          value={descLong}
          onChange={(e) => setDescLong(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price_ht">Prix HT (€)</Label>
          <Input
            id="price_ht"
            type="number"
            step="0.01"
            value={priceHt}
            onChange={(e) => setPriceHt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort_order">Ordre d'affichage</Label>
          <Input
            id="sort_order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex items-end space-x-3 pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-input"
            />
            Produit actif
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          Produit mis à jour avec succès.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
          ) : (
            <Save className="size-3.5" data-icon="inline-start" />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
