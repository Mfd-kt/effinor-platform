"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { createExistingHeatingUnit } from "@/features/existing-heating/actions/create-existing-heating-unit";
import { updateExistingHeatingUnit } from "@/features/existing-heating/actions/update-existing-heating-unit";
import { EMPTY_EXISTING_HEATING_FORM } from "@/features/existing-heating/lib/form-defaults";
import {
  ExistingHeatingInsertSchema,
  type ExistingHeatingFormInput,
  type ExistingHeatingInsertInput,
} from "@/features/existing-heating/schemas/existing-heating.schema";
import type { ExistingHeatingFormOptions } from "@/features/existing-heating/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type ExistingHeatingFormProps = {
  mode: "create" | "edit";
  existingHeatingUnitId?: string;
  defaultValues?: ExistingHeatingFormInput;
  options: ExistingHeatingFormOptions;
  className?: string;
};

export function ExistingHeatingForm({
  mode,
  existingHeatingUnitId,
  defaultValues,
  options,
  className,
}: ExistingHeatingFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const mergedDefaults = defaultValues ?? EMPTY_EXISTING_HEATING_FORM;

  const form = useForm<ExistingHeatingFormInput, unknown, ExistingHeatingInsertInput>({
    resolver: zodResolver(ExistingHeatingInsertSchema),
    defaultValues: mergedDefaults,
  });

  const { register, handleSubmit, getValues, setValue } = form;

  async function onSubmit(values: ExistingHeatingInsertInput) {
    setFormError(null);

    if (mode === "create") {
      const result = await createExistingHeatingUnit(values);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/existing-heating/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!existingHeatingUnitId) {
      setFormError("Identifiant manquant.");
      return;
    }

    const result = await updateExistingHeatingUnit({ id: existingHeatingUnitId, ...values });
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
          <CardTitle>Modèle catalogue</CardTitle>
          <CardDescription>Référence du générateur ou équipement observé.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="heating_model_id">Modèle de chauffage *</Label>
            <select
              id="heating_model_id"
              className={selectClassName}
              {...register("heating_model_id")}
            >
              <option value="">— Sélectionner —</option>
              {options.heatingModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.type})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caractéristiques</CardTitle>
          <CardDescription>Quantités et puissances mesurées ou estimées.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              inputMode="decimal"
              step="any"
              {...register("quantity")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit_power_kw">Puissance unitaire (kW)</Label>
            <Input
              id="unit_power_kw"
              inputMode="decimal"
              {...register("unit_power_kw")}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label htmlFor="total_power_kw">Puissance totale (kW)</Label>
                <Input
                  id="total_power_kw"
                  inputMode="decimal"
                  {...register("total_power_kw")}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => {
                  const q = getValues("quantity");
                  const u = getValues("unit_power_kw");
                  if (
                    q == null ||
                    u == null ||
                    !Number.isFinite(Number(q)) ||
                    !Number.isFinite(Number(u))
                  ) {
                    return;
                  }
                  const total = Number(q) * Number(u);
                  if (Number.isFinite(total)) {
                    setValue("total_power_kw", Math.round(total * 10000) / 10000);
                  }
                }}
              >
                Suggérer (Q × Pu. unit.)
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Suggestion simple : vous pouvez toujours saisir la puissance totale manuellement.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Observations terrain, état, emplacement, contexte chantier.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea id="notes" rows={4} className="min-h-[100px]" {...register("notes")} />
        </CardContent>
      </Card>

      <Separator />

      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">
          {mode === "create" ? "Créer l’enregistrement" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
