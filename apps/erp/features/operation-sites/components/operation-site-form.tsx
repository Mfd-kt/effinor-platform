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
import { createOperationSite } from "@/features/operation-sites/actions/create-operation-site";
import { updateOperationSite } from "@/features/operation-sites/actions/update-operation-site";
import { SITE_KIND_LABELS } from "@/features/operation-sites/constants";
import { EMPTY_OPERATION_SITE_FORM } from "@/features/operation-sites/lib/form-defaults";
import {
  OperationSiteInsertSchema,
  SITE_KIND_VALUES,
  type OperationSiteFormInput,
  type OperationSiteInsertInput,
} from "@/features/operation-sites/schemas/operation-site.schema";
import type { OperationSiteFormOptions } from "@/features/operation-sites/types";
import type { SiteKind } from "@/types/database.types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const checkboxClassName =
  "mt-0.5 h-4 w-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type OperationSiteFormProps = {
  mode: "create" | "edit";
  operationSiteId?: string;
  defaultValues?: OperationSiteFormInput;
  options: OperationSiteFormOptions;
  className?: string;
};

export function OperationSiteForm({
  mode,
  operationSiteId,
  defaultValues,
  options,
  className,
}: OperationSiteFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const mergedDefaults = defaultValues ?? EMPTY_OPERATION_SITE_FORM;

  const form = useForm<OperationSiteFormInput, unknown, OperationSiteInsertInput>({
    resolver: zodResolver(OperationSiteInsertSchema),
    defaultValues: mergedDefaults,
  });

  const { register, handleSubmit } = form;

  async function onSubmit(values: OperationSiteInsertInput) {
    setFormError(null);

    if (mode === "create") {
      const result = await createOperationSite(values);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/operation-sites/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!operationSiteId) {
      setFormError("Identifiant site manquant.");
      return;
    }

    const result = await updateOperationSite({ id: operationSiteId, ...values });
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
          <CardTitle>Liaison</CardTitle>
          <CardDescription>Chaque site est rattaché à une opération CEE.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="operation_id">Opération *</Label>
            <select
              id="operation_id"
              className={selectClassName}
              {...register("operation_id")}
            >
              <option value="">— Sélectionner —</option>
              {options.operations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.operation_reference} — {o.title}
                  {o.beneficiary_company_name ? ` · ${o.beneficiary_company_name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="label">Libellé du site *</Label>
            <Input id="label" {...register("label")} placeholder="Ex. Entrepôt Nord, Serre 2…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sequence_number">Ordre d’affichage</Label>
            <Input
              id="sequence_number"
              type="number"
              step={1}
              {...register("sequence_number")}
            />
          </div>
          <div className="flex items-start gap-2 md:col-span-2">
            <input
              id="is_primary"
              type="checkbox"
              className={checkboxClassName}
              {...register("is_primary")}
            />
            <Label htmlFor="is_primary" className="font-normal leading-snug">
              Site principal du dossier (repère terrain prioritaire)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typologie</CardTitle>
          <CardDescription>Nature du lieu et contexte bâtiment / climat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="site_kind">Type de site</Label>
            <select id="site_kind" className={selectClassName} {...register("site_kind")}>
              <option value="">—</option>
              {SITE_KIND_VALUES.map((v) => (
                <option key={v} value={v}>
                  {SITE_KIND_LABELS[v as SiteKind]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity_type">Activité</Label>
            <Input id="activity_type" {...register("activity_type")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="building_type">Type de bâtiment</Label>
            <Input id="building_type" {...register("building_type")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dedicated_building">Bâtiment dédié (libre)</Label>
            <Input
              id="dedicated_building"
              {...register("dedicated_building")}
              placeholder="Précision terrain (champ texte en base)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="climate_zone">Zone climatique</Label>
            <Input id="climate_zone" {...register("climate_zone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operating_mode">Mode d’exploitation</Label>
            <Input id="operating_mode" {...register("operating_mode")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dimensions</CardTitle>
          <CardDescription>Surfaces et volumes pour dimensionnement ultérieur.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="height_m">Hauteur (m)</Label>
            <Input id="height_m" inputMode="decimal" {...register("height_m")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="volume_m3">Volume (m³)</Label>
            <Input id="volume_m3" inputMode="decimal" {...register("volume_m3")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area_m2">Surface (m²)</Label>
            <Input id="area_m2" inputMode="decimal" {...register("area_m2")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chauffage & technique</CardTitle>
          <CardDescription>Puissances et débits — base pour études et devis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="flow_type">Type de flux / aéraulique</Label>
            <Input id="flow_type" {...register("flow_type")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heating_system_type">Système de chauffage</Label>
            <Input id="heating_system_type" {...register("heating_system_type")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="convective_power_kw">Puissance convective (kW)</Label>
            <Input id="convective_power_kw" inputMode="decimal" {...register("convective_power_kw")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radiant_power_kw">Puissance rayonnante (kW)</Label>
            <Input id="radiant_power_kw" inputMode="decimal" {...register("radiant_power_kw")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calculated_power_kw">Puissance calculée (kW)</Label>
            <Input
              id="calculated_power_kw"
              inputMode="decimal"
              {...register("calculated_power_kw")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="air_flow_required_m3h">Débit d’air requis (m³/h)</Label>
            <Input
              id="air_flow_required_m3h"
              inputMode="decimal"
              {...register("air_flow_required_m3h")}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="destratifier_quantity_required">Quantité déstratificateurs (requis)</Label>
            <Input
              id="destratifier_quantity_required"
              type="number"
              step={1}
              {...register("destratifier_quantity_required")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Observations terrain, accès, contraintes.</CardDescription>
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
        <Button type="submit">
          {mode === "create" ? "Créer le site technique" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
