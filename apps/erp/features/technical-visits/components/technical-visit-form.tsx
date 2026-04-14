"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { HeatingModeField } from "@/features/leads/components/heating-mode-field";
import { createTechnicalVisit } from "@/features/technical-visits/actions/create-technical-visit";
import { updateTechnicalVisit } from "@/features/technical-visits/actions/update-technical-visit";
import { TechnicalVisitMediaFilesField } from "@/features/technical-visits/components/technical-visit-media-files-field";
import {
  TECHNICAL_VISIT_STATUS_LABELS,
  TECHNICAL_VISIT_TIME_SLOT_OPTIONS,
} from "@/features/technical-visits/constants";
import { EMPTY_TECHNICAL_VISIT_FORM } from "@/features/technical-visits/lib/form-defaults";
import { EMPTY_TECHNICAL_VISIT_PHOTOS } from "@/features/technical-visits/lib/photos";
import {
  TechnicalVisitInsertSchema,
  TECHNICAL_VISIT_STATUS_VALUES,
  type TechnicalVisitInsertInput,
} from "@/features/technical-visits/schemas/technical-visit.schema";
import type { TechnicalVisitFormOptions } from "@/features/technical-visits/types";
import { regionFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-postal-region";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type TechnicalVisitFormProps = {
  mode: "create" | "edit";
  visitId?: string;
  defaultValues?: TechnicalVisitInsertInput;
  options: TechnicalVisitFormOptions;
  className?: string;
};

export function TechnicalVisitForm({
  mode,
  visitId,
  defaultValues,
  options,
  className,
}: TechnicalVisitFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<TechnicalVisitInsertInput>({
    resolver: zodResolver(TechnicalVisitInsertSchema) as Resolver<TechnicalVisitInsertInput>,
    defaultValues: defaultValues ?? EMPTY_TECHNICAL_VISIT_FORM,
  });

  const photosGrouped = form.watch("photos");
  const technicianIdWatched = useWatch({ control: form.control, name: "technician_id" });
  const photosMerged = {
    ...EMPTY_TECHNICAL_VISIT_PHOTOS,
    ...(photosGrouped ?? {}),
  };
  const timeSlotValue = form.watch("time_slot")?.trim() ?? "";
  const timeSlotLegacy =
    timeSlotValue &&
    !TECHNICAL_VISIT_TIME_SLOT_OPTIONS.some((o) => o.value === timeSlotValue)
      ? timeSlotValue
      : null;

  /** Liaisons figées (édition ou création depuis une fiche lead) : champs masqués, valeurs inchangées à l’enregistrement. */
  const liaisonFieldsLocked =
    mode === "edit" || (mode === "create" && Boolean(defaultValues?.lead_id?.trim()));

  const worksitePostalRegister = form.register("worksite_postal_code");

  const syncRegionFromPostal = useCallback(() => {
    const ws = form.getValues("worksite_postal_code");
    const r = regionFromWorksiteOrHeadOfficePostalCode(ws, undefined);
    if (r !== undefined) {
      form.setValue("region", r, { shouldDirty: true, shouldValidate: true });
    }
  }, [form]);

  useEffect(() => {
    const ws = form.getValues("worksite_postal_code");
    const rCur = form.getValues("region");
    const r = regionFromWorksiteOrHeadOfficePostalCode(ws, undefined);
    if (r !== undefined && (!rCur || String(rCur).trim() === "")) {
      form.setValue("region", r, { shouldDirty: true, shouldValidate: true });
    }
  }, [form]);

  async function onSubmit(values: TechnicalVisitInsertInput) {
    setFormError(null);

    const derivedRegion = regionFromWorksiteOrHeadOfficePostalCode(values.worksite_postal_code, undefined);
    const payload: TechnicalVisitInsertInput = {
      ...values,
      region:
        derivedRegion !== undefined
          ? derivedRegion
          : !values.worksite_postal_code?.trim()
            ? undefined
            : values.region,
    };

    if (mode === "create") {
      const result = await createTechnicalVisit(payload);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/technical-visits/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!visitId) {
      setFormError("Identifiant visite technique manquant.");
      return;
    }

    const result = await updateTechnicalVisit({ id: visitId, ...payload });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-8", className)}
    >
      <Card>
        <CardHeader>
          <CardTitle>Statut & affectation</CardTitle>
          <CardDescription>
            Statut de la visite. Le technicien est choisi parmi les comptes ayant le rôle « Technicien »
            (Réglages → utilisateurs).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {liaisonFieldsLocked ? (
            <>
              <input type="hidden" {...form.register("vt_reference")} />
              <input type="hidden" {...form.register("lead_id")} />
            </>
          ) : (
            <>
              <input type="hidden" {...form.register("vt_reference")} />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lead_id">Lead *</Label>
                <select id="lead_id" className={selectClassName} {...form.register("lead_id")}>
                  <option value="">— Sélectionner —</option>
                  {options.leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.company_name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.lead_id ? (
                  <p className="text-sm text-destructive">{form.formState.errors.lead_id.message}</p>
                ) : null}
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="status">Statut *</Label>
            <select id="status" className={selectClassName} {...form.register("status")}>
              {TECHNICAL_VISIT_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {TECHNICAL_VISIT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="technician_id">Technicien</Label>
            <select
              id="technician_id"
              className={selectClassName}
              {...form.register("technician_id")}
            >
              <option value="">—</option>
              {options.technicianOrphanOption &&
              options.technicianOrphanOption.id === (technicianIdWatched?.trim() ?? "") ? (
                <option value={options.technicianOrphanOption.id} disabled>
                  {options.technicianOrphanOption.label} (pas rôle « Technicien »)
                </option>
              ) : null}
              {options.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planning</CardTitle>
          <CardDescription>Date planifiée et créneau horaire.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <input type="hidden" {...form.register("performed_at")} />
          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Date planifiée</Label>
            <Input id="scheduled_at" type="date" {...form.register("scheduled_at")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time_slot">Créneau horaire</Label>
            <select id="time_slot" className={selectClassName} {...form.register("time_slot")}>
              <option value="">— Sélectionner —</option>
              {timeSlotLegacy ? (
                <option value={timeSlotLegacy}>{timeSlotLegacy} (ancienne valeur)</option>
              ) : null}
              {TECHNICAL_VISIT_TIME_SLOT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données terrain</CardTitle>
          <CardDescription>
            Adresse des travaux comme sur la fiche lead (rue, code postal, ville) ; la région est calculée à partir du
            CP travaux.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="worksite_address">Adresse travaux</Label>
            <Input id="worksite_address" autoComplete="street-address" {...form.register("worksite_address")} />
          </div>
          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="worksite_postal_code">CP travaux</Label>
              <Input
                id="worksite_postal_code"
                autoComplete="postal-code"
                inputMode="numeric"
                {...worksitePostalRegister}
                onBlur={(e) => {
                  worksitePostalRegister.onBlur(e);
                  syncRegionFromPostal();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="worksite_city">Ville travaux</Label>
              <Input id="worksite_city" autoComplete="address-level2" {...form.register("worksite_city")} />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="region">Région</Label>
            <Input id="region" {...form.register("region")} readOnly className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Déduite du CP travaux (même règle que le bénéficiaire).</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="surface_m2">Surface (m²)</Label>
            <Input id="surface_m2" inputMode="decimal" {...form.register("surface_m2")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ceiling_height_m">Hauteur sous plafond (m)</Label>
            <Input id="ceiling_height_m" inputMode="decimal" {...form.register("ceiling_height_m")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label id="vt_heating_type-label">Mode de chauffage</Label>
            <Controller
              name="heating_type"
              control={form.control}
              render={({ field }) => (
                <HeatingModeField
                  id="vt_heating_type"
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compte-rendu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="observations">Observations</Label>
            <Textarea id="observations" rows={4} {...form.register("observations")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="technical_report">Rapport technique</Label>
            <Textarea id="technical_report" rows={6} {...form.register("technical_report")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos / pièces jointes</CardTitle>
          <CardDescription>
            Téléversement sur le même espace Storage que les leads (glisser-déposer ou bouton). Les URL déjà
            enregistrées restent listées ; ajoutez des fichiers par catégorie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {visitId ? (
            <>
              <TechnicalVisitMediaFilesField
                technicalVisitId={visitId}
                kind="visit_photos"
                label="Photo de visite"
                description="Images terrain, constats visuels (JPEG, PNG, WebP…)."
                accept="image/*"
                icon="image"
                value={photosMerged.visit_photos}
                onChange={(visit_photos) => {
                  const cur = form.getValues("photos") ?? EMPTY_TECHNICAL_VISIT_PHOTOS;
                  form.setValue("photos", { ...cur, visit_photos }, { shouldDirty: true, shouldValidate: true });
                }}
              />
              <TechnicalVisitMediaFilesField
                technicalVisitId={visitId}
                kind="report_pdfs"
                label="Rapport PDF"
                description="Comptes rendus ou documents PDF."
                accept="application/pdf,.pdf"
                icon="cadastre"
                value={photosMerged.report_pdfs}
                onChange={(report_pdfs) => {
                  const cur = form.getValues("photos") ?? EMPTY_TECHNICAL_VISIT_PHOTOS;
                  form.setValue("photos", { ...cur, report_pdfs }, { shouldDirty: true, shouldValidate: true });
                }}
              />
              <TechnicalVisitMediaFilesField
                technicalVisitId={visitId}
                kind="sketches"
                label="Croquis"
                description="Plans, schémas, dessins (images)."
                accept="image/*"
                icon="image"
                value={photosMerged.sketches}
                onChange={(sketches) => {
                  const cur = form.getValues("photos") ?? EMPTY_TECHNICAL_VISIT_PHOTOS;
                  form.setValue("photos", { ...cur, sketches }, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enregistrez d&apos;abord la visite technique pour téléverser des fichiers (même principe que les documents
              sur une fiche lead).
            </p>
          )}
        </CardContent>
      </Card>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {mode === "create"
            ? form.formState.isSubmitting
              ? "Création…"
              : "Créer la visite"
            : form.formState.isSubmitting
              ? "Enregistrement…"
              : "Enregistrer"}
        </Button>
        {mode === "create" ? (
          <Button type="button" variant="outline" onClick={() => router.push("/technical-visits")}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
