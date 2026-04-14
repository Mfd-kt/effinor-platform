"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createInstalledProduct } from "@/features/installed-products/actions/create-installed-product";
import { updateInstalledProduct } from "@/features/installed-products/actions/update-installed-product";
import { EMPTY_INSTALLED_PRODUCT_FORM } from "@/features/installed-products/lib/form-defaults";
import {
  InstalledProductInsertSchema,
  type InstalledProductFormInput,
  type InstalledProductInsertInput,
} from "@/features/installed-products/schemas/installed-product.schema";
import type { InstalledProductFormOptions } from "@/features/installed-products/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type InstalledProductFormProps = {
  mode: "create" | "edit";
  installedProductId?: string;
  defaultValues?: InstalledProductFormInput;
  options: InstalledProductFormOptions;
  className?: string;
};

export function InstalledProductForm({
  mode,
  installedProductId,
  defaultValues,
  options,
  className,
}: InstalledProductFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const mergedDefaults = defaultValues ?? EMPTY_INSTALLED_PRODUCT_FORM;

  const form = useForm<InstalledProductFormInput, unknown, InstalledProductInsertInput>({
    resolver: zodResolver(InstalledProductInsertSchema),
    defaultValues: mergedDefaults,
  });

  const { register, handleSubmit, setValue, getValues } = form;

  const productOptions = useMemo(() => options.products, [options.products]);

  function applyTotalFromUnit() {
    const q = getValues("quantity");
    const u = getValues("unit_price_ht");
    if (q != null && u != null && typeof q === "number" && typeof u === "number") {
      if (Number.isFinite(q) && Number.isFinite(u)) {
        setValue("total_price_ht", Math.round(q * u * 100) / 100);
      }
    }
  }

  async function onSubmit(values: InstalledProductInsertInput) {
    setFormError(null);

    if (mode === "create") {
      const result = await createInstalledProduct(values);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/installed-products/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!installedProductId) {
      setFormError("Identifiant manquant.");
      return;
    }

    const result = await updateInstalledProduct({ id: installedProductId, ...values });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-8", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Produit catalogue</CardTitle>
          <CardDescription>Référence produit issue du catalogue interne.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product_id">Produit *</Label>
            <select
              id="product_id"
              className={selectClassName}
              {...register("product_id")}
            >
              <option value="">— Sélectionner —</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} · {p.reference} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quantités et prix</CardTitle>
          <CardDescription>Chiffrage saisi ; pas de moteur de devis automatique.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input id="quantity" type="number" step="any" min="0.0001" {...register("quantity")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_price_ht">Prix unitaire HT</Label>
            <Input id="unit_price_ht" type="number" step="0.01" {...register("unit_price_ht")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="total_price_ht">Total HT</Label>
                <Input id="total_price_ht" type="number" step="0.01" {...register("total_price_ht")} />
              </div>
              <Button type="button" variant="secondary" onClick={applyTotalFromUnit}>
                Recalculer (qté × PU HT)
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Astuce : le bouton remplit le total à partir de la quantité et du prix unitaire (arrondi 2
              décimales).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technique &amp; CEE</CardTitle>
          <CardDescription>Puissance unitaire et données réglementaires éventuelles.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="unit_power_w">Puissance unitaire (W)</Label>
            <Input id="unit_power_w" type="number" step="any" {...register("unit_power_w")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cee_sheet_code">Fiche CEE</Label>
            <Input id="cee_sheet_code" {...register("cee_sheet_code")} placeholder="Référence fiche" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cumac_amount">Cumac</Label>
            <Input id="cumac_amount" type="number" step="any" {...register("cumac_amount")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valuation_amount">Valorisation</Label>
            <Input id="valuation_amount" type="number" step="0.01" {...register("valuation_amount")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Précisions terrain, variantes, contraintes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea id="notes" rows={5} className="min-h-[120px]" {...register("notes")} />
        </CardContent>
      </Card>

      <Separator />

      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{mode === "create" ? "Créer" : "Enregistrer"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
