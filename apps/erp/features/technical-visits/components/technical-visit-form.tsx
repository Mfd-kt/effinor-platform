"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { applyRecommendedTechnicianAction } from "@/features/technical-visits/actions/apply-recommended-technician";
import { createTechnicalVisit } from "@/features/technical-visits/actions/create-technical-visit";
import { saveTechnicalVisitHybrid } from "@/features/technical-visits/actions/save-technical-visit-hybrid";
import { TechnicalVisitAudioNotesSection } from "@/features/technical-visits/components/technical-visit-audio-notes-section";
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
import type { TechnicalVisitAudioNoteRow } from "@/features/technical-visits/queries/get-technical-visit-audio-notes";
import type { TechnicalVisitFormOptions } from "@/features/technical-visits/types";
import type { VisitTemplateSchema } from "@/features/technical-visits/templates/schema-types";
import { DynamicVisitFormRenderer } from "@/features/technical-visits/dynamic/dynamic-visit-form-renderer";
import type { DynamicAnswers } from "@/features/technical-visits/dynamic/visibility";
import { regionFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-postal-region";
import { cn } from "@/lib/utils";
import type { ApplyRecommendedTechnicianInput } from "@/features/technical-visits/services/apply-recommended-technician.service";

const selectClassName = cn(
  "flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm md:min-h-10 md:py-2",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type TechnicalVisitFormProps = {
  mode: "create" | "edit";
  visitId?: string;
  defaultValues?: TechnicalVisitInsertInput;
  options: TechnicalVisitFormOptions;
  className?: string;
  /** If provided, enables the dynamic template renderer alongside legacy fields. */
  dynamicSchema?: VisitTemplateSchema | null;
  /** Initial answers for the dynamic form (from `form_answers_json`). */
  dynamicAnswers?: DynamicAnswers;
  /** Disable all editing (lifecycle-driven: locked, terminal status, or insufficient rights). */
  readOnly?: boolean;
  /**
   * Technicien terrain : statut et affectation sont réservés au bureau (champs non modifiables,
   * non renvoyés côté serveur pour modification).
   */
  statusAndAssignmentReadOnly?: boolean;
  /** Notes vocales liées (édition uniquement). */
  audioNotes?: TechnicalVisitAudioNoteRow[];
};

export function TechnicalVisitForm({
  mode,
  visitId,
  defaultValues,
  options,
  className,
  dynamicSchema,
  dynamicAnswers: initialDynamicAnswers,
  readOnly = false,
  statusAndAssignmentReadOnly = false,
  audioNotes,
}: TechnicalVisitFormProps) {
  const router = useRouter();
  const [applyRecommendedPending, startApplyRecommendedTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const dynamicAnswersRef = useRef<DynamicAnswers>(initialDynamicAnswers ?? {});
  const autoSelectedRecommendedRef = useRef(false);
  const hasDynamic = Boolean(dynamicSchema);

  const form = useForm<TechnicalVisitInsertInput>({
    resolver: zodResolver(TechnicalVisitInsertSchema) as Resolver<TechnicalVisitInsertInput>,
    defaultValues: defaultValues ?? EMPTY_TECHNICAL_VISIT_FORM,
  });

  const photosGrouped = form.watch("photos");
  const technicianIdWatched = useWatch({ control: form.control, name: "technician_id" });
  const statusWatched = useWatch({ control: form.control, name: "status" });
  const photosMerged = {
    ...EMPTY_TECHNICAL_VISIT_PHOTOS,
    ...(photosGrouped ?? {}),
  };
  const scheduledAtWatched = form.watch("scheduled_at");
  const timeSlotValue = form.watch("time_slot")?.trim() ?? "";
  const timeSlotLegacy =
    timeSlotValue &&
    !TECHNICAL_VISIT_TIME_SLOT_OPTIONS.some((o) => o.value === timeSlotValue)
      ? timeSlotValue
      : null;

  const technicianDisplayLabel = useMemo(() => {
    const id = technicianIdWatched?.trim() ?? "";
    if (!id) return "—";
    if (options.technicianOrphanOption?.id === id) {
      return options.technicianOrphanOption.label;
    }
    return options.profiles.find((p) => p.id === id)?.label ?? id;
  }, [technicianIdWatched, options.profiles, options.technicianOrphanOption]);

  const reco = options.recommendation;
  const recommendedId = reco.recommendedTechnician?.technicianId ?? "";
  const technicianFieldId = technicianIdWatched?.trim() ?? "";
  const showRecommendedApplyButton = useMemo(() => {
    if (readOnly || statusAndAssignmentReadOnly) return false;
    if (reco.availabilityState !== "ready" || !recommendedId) return false;
    if (mode === "create") {
      return !technicianFieldId;
    }
    return reco.selectedTechnicianStatus?.reason !== "recommended";
  }, [
    readOnly,
    statusAndAssignmentReadOnly,
    reco.availabilityState,
    reco.selectedTechnicianStatus?.reason,
    recommendedId,
    mode,
    technicianFieldId,
  ]);

  const emphasizeRecommendedReplace = useMemo(
    () => mode === "edit" && reco.selectedTechnicianStatus?.reason === "no_longer_eligible",
    [mode, reco.selectedTechnicianStatus?.reason],
  );

  const showAlreadyRecommendedNote = useMemo(() => {
    if (readOnly || statusAndAssignmentReadOnly) return false;
    if (reco.availabilityState !== "ready" || !recommendedId) return false;
    if (mode !== "create") return false;
    return Boolean(technicianFieldId) && technicianFieldId === recommendedId;
  }, [
    readOnly,
    statusAndAssignmentReadOnly,
    reco.availabilityState,
    recommendedId,
    mode,
    technicianFieldId,
  ]);

  const handleApplyRecommendedTechnician = useCallback(() => {
    if (readOnly || statusAndAssignmentReadOnly) return;
    if (mode === "edit" && !visitId) return;

    startApplyRecommendedTransition(async () => {
      const v = form.getValues();
      const uiDisplayedRecommendedTechnicianId = reco.recommendedTechnician?.technicianId ?? null;
      const base = {
        scheduled_at: v.scheduled_at,
        time_slot: v.time_slot,
        worksite_address: v.worksite_address,
        worksite_postal_code: v.worksite_postal_code,
        worksite_city: v.worksite_city,
        worksite_country: "France",
        uiDisplayedRecommendedTechnicianId,
      };
      const input: ApplyRecommendedTechnicianInput =
        mode === "create"
          ? { mode: "create", ...base, currentFormTechnicianId: v.technician_id }
          : { mode: "edit", visitId: visitId!, ...base };

      const res = await applyRecommendedTechnicianAction(input);
      if (!res.ok) {
        toast.error(res.message);
        if (res.status === "rejected_stale" || res.status === "rejected_no_recommendation") {
          router.refresh();
        }
        return;
      }
      toast.success(res.message);
      if (res.status === "validated_for_form" && res.technician?.id) {
        form.setValue("technician_id", res.technician.id, { shouldDirty: true, shouldValidate: true });
      }
      if (res.status === "applied") {
        if (res.technician?.id) {
          form.setValue("technician_id", res.technician.id, { shouldDirty: true, shouldValidate: true });
        }
        router.refresh();
      }
    });
  }, [
    readOnly,
    statusAndAssignmentReadOnly,
    mode,
    visitId,
    form,
    reco.recommendedTechnician,
    router,
  ]);

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

  /** Date + créneau renseignés ⇒ statut « Planifiée » ; si on les retire, repasser « À planifier » si on était seulement planifié. */
  useEffect(() => {
    if (readOnly || statusAndAssignmentReadOnly) return;

    const dateRaw =
      typeof scheduledAtWatched === "string"
        ? scheduledAtWatched.trim()
        : scheduledAtWatched != null
          ? String(scheduledAtWatched).trim()
          : "";
    const slotRaw = timeSlotValue.trim();
    const bothPlanned = Boolean(dateRaw && slotRaw);
    const status = form.getValues("status");

    if (bothPlanned && status === "to_schedule") {
      form.setValue("status", "scheduled", { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (!bothPlanned && status === "scheduled") {
      form.setValue("status", "to_schedule", { shouldDirty: true, shouldValidate: true });
    }
  }, [readOnly, statusAndAssignmentReadOnly, scheduledAtWatched, timeSlotValue, form]);

  useEffect(() => {
    if (mode !== "create") return;
    if (autoSelectedRecommendedRef.current) return;
    const selected = (form.getValues("technician_id") ?? "").trim();
    if (selected) return;
    const rec = options.recommendation.recommendedTechnician;
    if (!rec || options.recommendation.availabilityState !== "ready") return;
    form.setValue("technician_id", rec.technicianId, { shouldDirty: true, shouldValidate: true });
    autoSelectedRecommendedRef.current = true;
  }, [mode, options.recommendation, form]);

  async function onSubmit(values: TechnicalVisitInsertInput) {
    setFormError(null);

    const dateRaw =
      typeof values.scheduled_at === "string"
        ? values.scheduled_at.trim()
        : values.scheduled_at != null
          ? String(values.scheduled_at).trim()
          : "";
    const slotRaw = (values.time_slot ?? "").trim();
    const bothPlanned = Boolean(dateRaw && slotRaw);
    let status = values.status;
    if (!statusAndAssignmentReadOnly) {
      if (status === "to_schedule" && bothPlanned) {
        status = "scheduled";
      } else if (status === "scheduled" && !bothPlanned) {
        status = "to_schedule";
      }

      if (status !== values.status) {
        form.setValue("status", status, { shouldDirty: true, shouldValidate: true });
      }
    }

    const derivedRegion = regionFromWorksiteOrHeadOfficePostalCode(values.worksite_postal_code, undefined);
    const payload: TechnicalVisitInsertInput = {
      ...values,
      status,
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

    const result = await saveTechnicalVisitHybrid({
      legacyPayload: { id: visitId, ...payload },
      dynamicSchema: hasDynamic ? dynamicSchema : null,
      dynamicAnswers: hasDynamic ? dynamicAnswersRef.current : null,
    });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn(className)}>
      <fieldset disabled={readOnly} className="space-y-10 md:space-y-8">
      <Card className="shadow-sm">
        <CardHeader className="space-y-1 pb-3 md:pb-3">
          <CardTitle className="text-lg font-semibold tracking-tight md:text-base">
            Statut & affectation
          </CardTitle>
          <CardDescription>
            {statusAndAssignmentReadOnly ? (
              <>
                Gestion réservée au bureau. Vous consultez uniquement le statut et l’affectation actuels.
              </>
            ) : (
              <>
                Statut de la visite. Le technicien est choisi parmi les comptes ayant le rôle « Technicien »
                (Réglages → utilisateurs).
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 md:gap-4">
          {liaisonFieldsLocked ? (
            <>
              <input type="hidden" {...form.register("vt_reference")} />
              <input type="hidden" {...form.register("lead_id")} />
            </>
          ) : (
            <>
              <input type="hidden" {...form.register("vt_reference")} />
              <div className="space-y-2.5 md:space-y-2 md:col-span-2">
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
          {statusAndAssignmentReadOnly ? (
            <>
              <input type="hidden" {...form.register("status")} />
              <input type="hidden" {...form.register("technician_id")} />
              <div className="space-y-2.5 md:space-y-2">
                <Label>Statut</Label>
                <div
                  className={cn(
                    selectClassName,
                    "flex items-center bg-muted/40 text-foreground",
                    "pointer-events-none opacity-90",
                  )}
                >
                  {statusWatched ? TECHNICAL_VISIT_STATUS_LABELS[statusWatched] : "—"}
                </div>
              </div>
              <div className="space-y-2.5 md:space-y-2">
                <Label>Technicien</Label>
                <div
                  className={cn(
                    selectClassName,
                    "flex items-center bg-muted/40 text-foreground",
                    "pointer-events-none opacity-90",
                  )}
                >
                  {technicianDisplayLabel}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2.5 md:space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <select id="status" className={selectClassName} {...form.register("status")}>
                  {TECHNICAL_VISIT_STATUS_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {TECHNICAL_VISIT_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2.5 md:space-y-2">
                <Label htmlFor="technician_id">Technicien</Label>
                <div
                  className={cn(
                    "rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
                    emphasizeRecommendedReplace &&
                      "border-amber-500/50 bg-amber-500/10 text-foreground dark:border-amber-400/40",
                  )}
                >
                  {reco.availabilityState === "insufficient_context" ? (
                    <p>{reco.message}</p>
                  ) : reco.recommendedTechnician ? (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        Technicien recommandé: {reco.recommendedTechnician.fullName}
                      </p>
                      <p>
                        Score {reco.recommendedTechnician.score}
                        {reco.recommendedTechnician.distanceKm != null
                          ? ` · Domicile→chantier ${reco.recommendedTechnician.distanceKm.toLocaleString("fr-FR")} km`
                          : ""}
                        {reco.recommendedTechnician.conflictingVisitDistanceKm != null
                          ? ` · Inter-visites ${reco.recommendedTechnician.conflictingVisitDistanceKm.toLocaleString("fr-FR")} km`
                          : ""}
                      </p>
                      <p>{reco.recommendedTechnician.recommendationReason}</p>
                    </div>
                  ) : (
                    <p>{reco.message ?? "Aucun technicien recommandé."}</p>
                  )}
                  {mode === "edit" && reco.selectedTechnicianStatus ? (
                    <p className="mt-2">
                      {reco.selectedTechnicianStatus.reason === "recommended"
                        ? "Toujours recommandé."
                        : reco.selectedTechnicianStatus.reason === "eligible_not_recommended"
                          ? "Un technicien mieux classé est disponible."
                          : reco.selectedTechnicianStatus.reason === "no_longer_eligible"
                            ? "Le technicien affecté n’est plus éligible."
                            : "Technicien actuel introuvable dans la liste."}
                    </p>
                  ) : null}
                  {showAlreadyRecommendedNote ? (
                    <p className="mt-2 text-foreground/80">
                      Le technicien sélectionné correspond déjà au recommandé.
                    </p>
                  ) : null}
                  {showRecommendedApplyButton ? (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant={emphasizeRecommendedReplace ? "default" : "secondary"}
                        size="sm"
                        className={cn(emphasizeRecommendedReplace && "w-full sm:w-auto")}
                        disabled={applyRecommendedPending}
                        onClick={handleApplyRecommendedTechnician}
                      >
                        {mode === "create"
                          ? "Affecter le technicien recommandé"
                          : "Remplacer par le technicien recommandé"}
                      </Button>
                    </div>
                  ) : null}
                </div>
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
                  {options.profiles.map((p) => {
                    const reasonLabel =
                      p.eligibility_reason === "out_of_home_range"
                        ? "Hors rayon domicile"
                        : p.eligibility_reason === "blocked_by_unavailability"
                          ? "Indisponible"
                          : p.eligibility_reason === "too_far_from_same_day_visit"
                            ? "Trop loin de l’autre visite du jour"
                            : p.eligibility_reason === "missing_location"
                              ? "Coordonnées manquantes"
                              : p.eligibility_reason === "blocked_by_existing_visit"
                                ? "Conflit avec visite existante"
                                : "";
                    const distanceInfo =
                      p.distance_km != null ? ` · Domicile→chantier ${p.distance_km.toLocaleString("fr-FR")} km` : "";
                    const conflictInfo =
                      p.conflicting_visit_distance_km != null
                        ? ` · Inter-visites ${p.conflicting_visit_distance_km.toLocaleString("fr-FR")} km`
                        : "";
                    const suffix = p.is_eligible === false ? ` (${reasonLabel})` : "";
                    return (
                      <option key={p.id} value={p.id} disabled={p.is_eligible === false}>
                        {`${p.label}${suffix}${distanceInfo}${conflictInfo}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="space-y-1 pb-3 md:pb-3">
          <CardTitle className="text-lg font-semibold tracking-tight md:text-base">Planning</CardTitle>
          <CardDescription>Date planifiée et créneau horaire.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 md:gap-4">
          <input type="hidden" {...form.register("performed_at")} />
          <div className="space-y-2.5 md:space-y-2">
            <Label htmlFor="scheduled_at">Date planifiée</Label>
            <Input
              id="scheduled_at"
              type="date"
              className="min-h-11 md:min-h-10"
              {...form.register("scheduled_at")}
            />
          </div>
          <div className="space-y-2.5 md:space-y-2">
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

      <Card className="shadow-sm">
        <CardHeader className="space-y-1 pb-3 md:pb-3">
          <CardTitle className="text-lg font-semibold tracking-tight md:text-base">Données terrain</CardTitle>
          <CardDescription>
            Adresse des travaux comme sur la fiche lead (rue, code postal, ville) ; la région est calculée à partir du
            CP travaux.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2 md:gap-4">
          <div className="space-y-2.5 md:space-y-2 md:col-span-2">
            <Label htmlFor="worksite_address">Adresse travaux</Label>
            <Input
              id="worksite_address"
              autoComplete="street-address"
              className="min-h-11 md:min-h-10"
              {...form.register("worksite_address")}
            />
          </div>
          <div className="grid gap-5 md:col-span-2 md:grid-cols-2 md:gap-4">
            <div className="space-y-2.5 md:space-y-2">
              <Label htmlFor="worksite_postal_code">CP travaux</Label>
              <Input
                id="worksite_postal_code"
                autoComplete="postal-code"
                inputMode="numeric"
                className="min-h-11 md:min-h-10"
                {...worksitePostalRegister}
                onBlur={(e) => {
                  worksitePostalRegister.onBlur(e);
                  syncRegionFromPostal();
                }}
              />
            </div>
            <div className="space-y-2.5 md:space-y-2">
              <Label htmlFor="worksite_city">Ville travaux</Label>
              <Input
                id="worksite_city"
                autoComplete="address-level2"
                className="min-h-11 md:min-h-10"
                {...form.register("worksite_city")}
              />
            </div>
          </div>
          <div className="space-y-2.5 md:space-y-2 md:col-span-2">
            <Label htmlFor="region">Région</Label>
            <Input id="region" {...form.register("region")} readOnly className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Déduite du CP travaux (même règle que le bénéficiaire).</p>
          </div>
          {hasDynamic ? (
            <>
              <input type="hidden" {...form.register("surface_m2")} />
              <input type="hidden" {...form.register("ceiling_height_m")} />
              <input type="hidden" {...form.register("heating_type")} />
            </>
          ) : (
            <>
              <div className="space-y-2.5 md:space-y-2">
                <Label htmlFor="surface_m2">Surface (m²)</Label>
                <Input
                  id="surface_m2"
                  inputMode="decimal"
                  className="min-h-11 md:min-h-10"
                  {...form.register("surface_m2")}
                />
              </div>
              <div className="space-y-2.5 md:space-y-2">
                <Label htmlFor="ceiling_height_m">Hauteur sous plafond (m)</Label>
                <Input
                  id="ceiling_height_m"
                  inputMode="decimal"
                  className="min-h-11 md:min-h-10"
                  {...form.register("ceiling_height_m")}
                />
              </div>
              <div className="space-y-2.5 md:space-y-2 md:col-span-2">
                <Label id="vt_heating_type-label">Mode de chauffage actuel</Label>
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
            </>
          )}
        </CardContent>
      </Card>

      {hasDynamic && dynamicSchema ? (
        <DynamicVisitFormRenderer
          schema={dynamicSchema}
          initialAnswers={dynamicAnswersRef.current}
          technicalVisitId={visitId}
          onAnswersChange={(a) => { dynamicAnswersRef.current = a; }}
        />
      ) : null}

      {hasDynamic ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold tracking-tight md:text-base">Rapport technique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 md:space-y-4">
            <input type="hidden" {...form.register("observations")} />
            <div className="space-y-2.5 md:space-y-2">
              <Label htmlFor="technical_report">Rapport technique (libre)</Label>
              <Textarea id="technical_report" rows={6} {...form.register("technical_report")} />
            </div>
            <p className="text-xs text-muted-foreground">
              Les observations terrain sont saisies dans le formulaire dynamique ci-dessus (section compte-rendu technicien).
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold tracking-tight md:text-base">Compte-rendu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 md:space-y-4">
            <div className="space-y-2.5 md:space-y-2">
              <Label htmlFor="observations">Observations</Label>
              <Textarea id="observations" rows={4} {...form.register("observations")} />
            </div>
            <div className="space-y-2.5 md:space-y-2">
              <Label htmlFor="technical_report">Rapport technique</Label>
              <Textarea id="technical_report" rows={6} {...form.register("technical_report")} />
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "edit" && visitId && audioNotes ? (
        <TechnicalVisitAudioNotesSection
          visitId={visitId}
          readOnly={readOnly}
          initialNotes={audioNotes}
          onInsertDictation={(text) => {
            if (hasDynamic) {
              const cur = form.getValues("technical_report") ?? "";
              form.setValue("technical_report", cur ? `${cur}\n\n${text}` : text, { shouldDirty: true });
            } else {
              const cur = form.getValues("observations") ?? "";
              form.setValue("observations", cur ? `${cur}\n\n${text}` : text, { shouldDirty: true });
            }
            toast.message("Texte inséré dans le compte-rendu", {
              description: "Enregistrez la fiche pour sauvegarder.",
            });
          }}
        />
      ) : null}

      {!hasDynamic ? (
        <Card className="shadow-sm">
          <CardHeader className="space-y-1 pb-3 md:pb-3">
            <CardTitle className="text-lg font-semibold tracking-tight md:text-base">Photos / pièces jointes</CardTitle>
            <CardDescription>
              Téléversement sur le même espace Storage que les leads (glisser-déposer ou bouton). Les URL déjà
              enregistrées restent listées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 md:space-y-8">
            {visitId ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">
                Enregistrez d&apos;abord la visite technique pour téléverser des fichiers (même principe que les documents
                sur une fiche lead).
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {!readOnly ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="min-h-11 w-full font-semibold sm:w-auto"
          >
            {mode === "create"
              ? form.formState.isSubmitting
                ? "Création…"
                : "Créer la visite"
              : form.formState.isSubmitting
                ? "Enregistrement…"
                : "Enregistrer"}
          </Button>
          {mode === "create" ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => router.push("/technical-visits")}
            >
              Annuler
            </Button>
          ) : null}
        </div>
      ) : null}
      </fieldset>
    </form>
  );
}
