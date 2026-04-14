"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProductAction } from "@/features/products/actions/product-admin-actions";
import {
  CEE_CATEGORY_OPTIONS,
  CEE_PRODUCT_CATEGORY,
  PRODUCT_FAMILY_OPTIONS,
  type CeeProductCategoryValue,
} from "@/features/products/lib/product-taxonomy";
import type { ProductFamily } from "@/types/database.types";

const EMPTY_FAMILY = "__none__";

export function ProductCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [productCode, setProductCode] = useState("");
  const [reference, setReference] = useState("");
  const [category, setCategory] = useState<CeeProductCategoryValue>(CEE_PRODUCT_CATEGORY.destrat);
  const [family, setFamily] = useState<string>("destratification");
  const [priceHt, setPriceHt] = useState("");

  function onCategoryChange(next: CeeProductCategoryValue) {
    setCategory(next);
    if (next === CEE_PRODUCT_CATEGORY.pac) setFamily("heat_pump");
    if (next === CEE_PRODUCT_CATEGORY.destrat) setFamily("destratification");
  }

  function onFamilyChange(next: string | null) {
    if (next == null) return;
    setFamily(next);
    if (next === EMPTY_FAMILY) return;
    const f = next as ProductFamily;
    if (f === "heat_pump") setCategory(CEE_PRODUCT_CATEGORY.pac);
    if (f === "destratification") setCategory(CEE_PRODUCT_CATEGORY.destrat);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await createProductAction({
        name,
        brand,
        product_code: productCode,
        reference: reference || undefined,
        category,
        product_family: family === EMPTY_FAMILY ? null : (family as ProductFamily),
        default_price_ht: priceHt ? Number(priceHt) : null,
      });

      if (!res.ok) {
        setError(res.error ?? "Erreur inconnue");
        return;
      }

      router.push(`/settings/products/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="create-name">Nom du produit</Label>
          <Input
            id="create-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Pompe à chaleur air / eau 8 kW"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-brand">Marque</Label>
          <Input
            id="create-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="create-code">Code produit</Label>
          <Input
            id="create-code"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="ex. bosch_pac_air_eau ou teddington_ds7"
            required
          />
          <p className="text-xs text-muted-foreground">
            Identifiant unique (URLs, exports). Pour la fiche PAC des PDF d’étude, utilisez{" "}
            <code className="rounded bg-muted px-1">bosch_pac_air_eau</code>.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="create-ref">Référence fabricant (optionnel)</Label>
          <Input
            id="create-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Si vide, le code produit sera utilisé"
          />
          <p className="text-xs text-muted-foreground">
            Doit être unique pour une même marque.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Catégorie (ligne CEE)</Label>
          <Select value={category} onValueChange={(v) => onCategoryChange(v as CeeProductCategoryValue)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CEE_CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Famille produit</Label>
          <Select value={family} onValueChange={onFamilyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_FAMILY}>Non renseigné</SelectItem>
              {PRODUCT_FAMILY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            À lier aux fiches CEE : <code className="rounded bg-muted px-1">simulator_key pac</code> pour la
            PAC, <code className="rounded bg-muted px-1">destrat</code> pour la déstratification.
          </p>
        </div>
      </div>

      <div className="space-y-2 sm:max-w-xs">
        <Label htmlFor="create-price">Prix HT (€)</Label>
        <Input
          id="create-price"
          type="number"
          step="0.01"
          value={priceHt}
          onChange={(e) => setPriceHt(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
          ) : (
            <Save className="size-3.5" data-icon="inline-start" />
          )}
          Créer le produit
        </Button>
      </div>
    </form>
  );
}
