"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Resolver,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

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
import { createLead } from "@/features/leads/actions/create-lead";
import { updateLeadMediaFieldAction } from "@/features/leads/actions/update-lead-media";
import { updateLead } from "@/features/leads/actions/update-lead";
import { DuplicateLeadModal } from "@/features/leads/components/duplicate-lead-modal";
import { HeatingModeField } from "@/features/leads/components/heating-mode-field";
import { LeadMediaFilesField } from "@/features/leads/components/lead-media-files-field";
import { RecordingNotesMarkdownPreview } from "@/features/leads/components/recording-notes-markdown-preview";
import { RecordingNotesAiButton } from "@/features/leads/components/recording-notes-ai-button";
import { BUILDING_TYPE_LABELS, BUILDING_TYPE_VALUES } from "@/features/leads/lib/building-types";
import { EMPTY_LEAD_FORM, leadInsertToFormInput, leadRowToFormValues } from "@/features/leads/lib/form-defaults";
import { mergeAiLeadFillIntoForm } from "@/features/leads/lib/merge-ai-lead-fill";
import { normalizeHeatingModesFromDb } from "@/features/leads/lib/heating-modes";
import { mergeLeadPayloadPreservingUntouchedHeating } from "@/features/leads/lib/lead-form-heating-preserve";
import { stringArrayFromLeadJson } from "@/features/leads/lib/lead-media-json";
import {
  LeadInsertSchema,
  LEAD_SOURCE_VALUES,
  LEAD_STATUS_VALUES,
  type LeadFormInput,
  type LeadInsertInput,
} from "@/features/leads/schemas/lead.schema";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/features/leads/constants";
import { LEAD_CIVILITY_OPTIONS } from "@/features/leads/lib/civility-options";
import type { LeadRow } from "@/features/leads/types";
import type { ProfileOption } from "@/features/leads/queries/get-lead-form-options";
import type { Json } from "@/types/database.types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type LeadFormProps = {
  mode: "create" | "edit";
  leadId?: string;
  defaultValues?: LeadFormInput;
  className?: string;
  /** Super administrateur : modifier l’agent ayant saisi le lead. */
  canReassignCreator?: boolean;
  agentOptions?: ProfileOption[];
  /** When true the submit footer is hidden (rendered externally via formId). */
  externalFooter?: boolean;
  /** Stable id to put on the <form> so an external submit button can target it. */
  formId?: string;
  /** Fiche figée (ex. agent après envoi au confirmateur). */
  readOnly?: boolean;
  /** Agent commercial seul : masque audio, pipeline, pièces — saisie prospect + pré-qualif uniquement. */
  simplifiedAgentView?: boolean;
  /** Catégorie dérivée de la fiche CEE (affichage seul, mode édition). */
  derivedCommercialCategory?: string | null;
};

export function LeadForm({
  mode,
  leadId,
  defaultValues,
  className,
  canReassignCreator = false,
  agentOptions,
  externalFooter = false,
  formId,
  readOnly = false,
  simplifiedAgentView = false,
  derivedCommercialCategory = null,
}: LeadFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  /** Snapshot JSON des valeurs déjà persistées (évite boucles et sauvegardes inutiles). */
  const lastSavedSerializedRef = useRef<string | null>(null);
  /** Derniers modes de chauffage connus en base — évite d’écraser la colonne si le champ n’a pas été modifié (autosave sur le reste du formulaire). */
  const lastCommittedHeatingModesRef = useRef<LeadInsertInput["heating_type"]>(undefined);
  const [duplicateDialog, setDuplicateDialog] = useState<
    | { open: false }
    | {
        open: true;
        leadId: string;
        lead: LeadRow | null;
        reason: "company" | "email" | "phone";
      }
  >({ open: false });

  const form = useForm<LeadFormInput, unknown, LeadInsertInput>({
    resolver: zodResolver(LeadInsertSchema) as Resolver<LeadFormInput, unknown, LeadInsertInput>,
    defaultValues: defaultValues ?? EMPTY_LEAD_FORM,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
    setValue,
    getFieldState,
  } = form;

  const watchedValues = useWatch({ control });
  const recordingFilesRaw = useWatch({ control, name: "recording_files" });
  const recordingFileUrls = stringArrayFromLeadJson(recordingFilesRaw as Json);
  const recordingNotesWatched = useWatch({ control, name: "recording_notes" }) ?? "";

  /** Contenu sérialisé des `defaultValues` (props) — stable si les données ne changent pas, même si l’objet est recréé. */
  const serverSnapshotKey =
    mode === "edit" && defaultValues
      ? (() => {
          const parsed = LeadInsertSchema.safeParse(defaultValues);
          return parsed.success ? JSON.stringify(parsed.data) : null;
        })()
      : null;

  useEffect(() => {
    if (mode !== "edit") {
      lastSavedSerializedRef.current = null;
      lastCommittedHeatingModesRef.current = undefined;
      return;
    }
    if (serverSnapshotKey !== null) {
      lastSavedSerializedRef.current = serverSnapshotKey;
      const parsedDefaults = LeadInsertSchema.safeParse(defaultValues ?? EMPTY_LEAD_FORM);
      if (parsedDefaults.success) {
        lastCommittedHeatingModesRef.current = parsedDefaults.data.heating_type?.length
          ? [...parsedDefaults.data.heating_type]
          : undefined;
      }
    }
  }, [mode, leadId, serverSnapshotKey, defaultValues]);

  useEffect(() => {
    if (readOnly) return;
    if (mode !== "edit" || !leadId) return;
    if (lastSavedSerializedRef.current === null) return;

    const timer = window.setTimeout(() => {
      const parsed = LeadInsertSchema.safeParse(getValues());
      if (!parsed.success) return;
      const heatingDirty = getFieldState("heating_type", form.formState).isDirty;
      const payload = mergeLeadPayloadPreservingUntouchedHeating(parsed.data, {
        heatingFieldDirty: heatingDirty,
        lastCommittedHeating: lastCommittedHeatingModesRef.current,
      });
      const nextSerialized = JSON.stringify(payload);
      if (nextSerialized === lastSavedSerializedRef.current) return;

      void (async () => {
        setAutoSaveState("saving");
        setFormError(null);
        const result = await updateLead({ id: leadId, ...payload });
        if (result.ok) {
          const modes = normalizeHeatingModesFromDb(result.data.heating_type);
          lastCommittedHeatingModesRef.current = modes.length ? modes : undefined;
          const canonical = LeadInsertSchema.safeParse(leadRowToFormValues(result.data));
          if (canonical.success) {
            lastSavedSerializedRef.current = JSON.stringify(canonical.data);
            reset(leadRowToFormValues(result.data));
          } else {
            lastSavedSerializedRef.current = nextSerialized;
            reset(leadInsertToFormInput(payload));
          }
          setAutoSaveState("saved");
          router.refresh();
          window.setTimeout(() => setAutoSaveState("idle"), 2500);
        } else {
          setFormError(result.message);
          setAutoSaveState("idle");
        }
      })();
    }, 1200);

    return () => window.clearTimeout(timer);
   }, [readOnly, watchedValues, mode, leadId, getValues, getFieldState, reset, router, form]);

  async function onSubmit(values: LeadInsertInput) {
    setFormError(null);
    setDuplicateDialog({ open: false });

    if (mode === "create") {
      const result = await createLead(values);
      if (!result.ok) {
        if (result.duplicateLeadId && result.duplicateReason) {
          setDuplicateDialog({
            open: true,
            leadId: result.duplicateLeadId,
            lead: result.duplicateLead ?? null,
            reason: result.duplicateReason,
          });
          return;
        }
        setFormError(result.message);
        return;
      }
      router.push(`/leads/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!leadId) {
      setFormError("Identifiant lead manquant.");
      return;
    }

    const heatingDirty = getFieldState("heating_type", form.formState).isDirty;
    const payload = mergeLeadPayloadPreservingUntouchedHeating(values, {
      heatingFieldDirty: heatingDirty,
      lastCommittedHeating: lastCommittedHeatingModesRef.current,
    });

    const result = await updateLead({ id: leadId, ...payload });
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    const modes = normalizeHeatingModesFromDb(result.data.heating_type);
    lastCommittedHeatingModesRef.current = modes.length ? modes : undefined;
    const canonical = LeadInsertSchema.safeParse(leadRowToFormValues(result.data));
    if (canonical.success) {
      lastSavedSerializedRef.current = JSON.stringify(canonical.data);
      reset(leadRowToFormValues(result.data));
    } else {
      lastSavedSerializedRef.current = JSON.stringify(payload);
      reset(leadInsertToFormInput(payload));
    }
    setAutoSaveState("saved");
    window.setTimeout(() => setAutoSaveState("idle"), 2500);
    router.refresh();
  }

  return (
    <>
      {/* eslint-disable-next-line react-hooks/refs -- RHF handleSubmit ; le handler utilise la ref uniquement au submit */}
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="min-w-0">
        {readOnly && mode === "edit" ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <strong>Consultation agent.</strong> Ce dossier est chez le confirmateur ou plus loin dans le pipeline : la
            fiche est en <strong>lecture seule</strong>. Les brouillons ou simulations non transmises restent modifiables
            depuis le menu <strong>Agent</strong>.
          </div>
        ) : null}
        {simplifiedAgentView && mode === "edit" && !readOnly ? (
          <div className="mb-6 rounded-lg border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
            <strong>Vue agent.</strong> Seules vos saisies (coordonnées, adresses, pré-qualification) et le détail du
            simulateur sont affichés ici. Le reste du dossier est géré par confirmateur et closer.
          </div>
        ) : null}
        <fieldset
          disabled={Boolean(readOnly) && mode === "edit"}
          className={cn("min-w-0 space-y-8 border-0 p-0 disabled:opacity-[0.92]", className)}
        >
          {mode === "edit" ? (
        <>
          <Controller
            name="ai_lead_summary"
            control={control}
            render={({ field }) => <input type="hidden" {...field} />}
          />
          <Controller
            name="ai_lead_score"
            control={control}
            render={({ field }) => (
              <input
                type="hidden"
                name={field.name}
                value={field.value === undefined || field.value === null ? "" : String(field.value)}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    field.onChange(undefined);
                    return;
                  }
                  const n = Number(raw);
                  field.onChange(Number.isFinite(n) ? n : undefined);
                }}
              />
            )}
          />
        </>
      ) : null}

      {mode === "edit" && !simplifiedAgentView ? (
        <Card className="border-primary/15 shadow-md">
          <CardHeader>
            <CardTitle>Enregistrement &amp; analyse d&apos;appel</CardTitle>
            <CardDescription>
              Ajoutez au moins un fichier audio pour lancer l’analyse (transcription puis synthèse). Ce bloc
              alimente uniquement la note d&apos;appel ci‑dessous — les « notes rapides » saisies sur le simulateur
              poste agent sont enregistrées dans les notes internes du lead, au nom de l&apos;auteur.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {leadId ? (
              <Controller
                name="recording_files"
                control={control}
                render={({ field }) => (
                  <LeadMediaFilesField
                    leadId={leadId}
                    kind="recording"
                    label="Enregistrements audio"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm,.opus,.aiff,.wma"
                    icon="audio"
                    value={stringArrayFromLeadJson(field.value as Json)}
                    onChange={field.onChange}
                    onPersist={(urls) =>
                      updateLeadMediaFieldAction({
                        leadId,
                        field: "recording_files",
                        urls,
                      })
                    }
                  />
                )}
              />
            ) : null}
            <div className="space-y-3 md:col-span-2">
              <textarea
                {...register("recording_notes")}
                readOnly
                tabIndex={-1}
                aria-hidden
                className="sr-only"
                rows={1}
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <Label htmlFor="recording-notes-preview">Aperçu mis en page</Label>
                  <p className="text-xs text-muted-foreground">
                    La synthèse propose de compléter les champs encore vides (coordonnées, adresses, intérêt,
                    score, informations utiles pour la suite) à partir de ce qui est dit dans l’audio. Relancez
                    l’analyse pour mettre à jour.
                  </p>
                </div>
                {leadId && !readOnly ? (
                  <RecordingNotesAiButton
                    leadId={leadId}
                    recordingUrls={recordingFileUrls}
                    onAnalysisComplete={({ notes, fill }) => {
                      mergeAiLeadFillIntoForm(fill, getValues(), setValue, notes);
                    }}
                  />
                ) : null}
              </div>
              <div id="recording-notes-preview">
                <RecordingNotesMarkdownPreview text={typeof recordingNotesWatched === "string" ? recordingNotesWatched : ""} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <input type="hidden" {...register("campaign")} />
      <input type="hidden" {...register("landing")} />

      {!simplifiedAgentView ? (
        <Card>
          <CardHeader>
            <CardTitle>1. Suivi commercial</CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Source « Appel froid » enregistrée par défaut. Le reste (rappel, qualification) se complète sur la fiche lead après création."
                : "Pipeline, rappel téléphonique, source et attribution. Le confirmateur est défini à la création d’une visite technique."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {mode === "create" ? (
              <>
                {/* RHF n’inclut pas les champs non enregistrés : source doit être présent pour Zod. */}
                <input type="hidden" {...register("source")} />
                <div className="space-y-2">
                  <Label htmlFor="lead_status">Statut *</Label>
                  <select id="lead_status" className={selectClassName} {...register("lead_status")}>
                    {LEAD_STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {LEAD_STATUS_LABELS[value] ?? value}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lead_status">Statut *</Label>
                  <select id="lead_status" className={selectClassName} {...register("lead_status")}>
                    {LEAD_STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {LEAD_STATUS_LABELS[value] ?? value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callback_at">RDV téléphone (rappel)</Label>
                  <Input id="callback_at" type="datetime-local" {...register("callback_at")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source *</Label>
                  <select id="source" className={selectClassName} {...register("source")}>
                    {LEAD_SOURCE_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {LEAD_SOURCE_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </div>
                {canReassignCreator && agentOptions?.length ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="created_by_agent_id">Agent ayant saisi le lead</Label>
                    <select
                      id="created_by_agent_id"
                      className={selectClassName}
                      {...register("created_by_agent_id")}
                    >
                      <option value="">— Non attribué —</option>
                      {agentOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Réservé au super administrateur — réattribue la paternité du dossier.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{simplifiedAgentView ? "1. Contact & société" : "2. Contact"}</CardTitle>
          <CardDescription>Identité du prospect et coordonnées.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_name">Société *</Label>
            <Input id="company_name" {...register("company_name")} autoComplete="organization" />
            {errors.company_name ? (
              <p className="text-sm text-destructive">{errors.company_name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2 max-w-xs">
            <Label htmlFor="civility">Civilité</Label>
            <select id="civility" className={selectClassName} {...register("civility")}>
              {LEAD_CIVILITY_OPTIONS.map((o) => (
                <option key={o.value === "" ? "_empty" : o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom</Label>
            <Input id="first_name" {...register("first_name")} autoComplete="given-name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Nom</Label>
            <Input id="last_name" {...register("last_name")} autoComplete="family-name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} autoComplete="email" />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" type="tel" {...register("phone")} autoComplete="tel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_role">Fonction</Label>
            <Input id="contact_role" {...register("contact_role")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{simplifiedAgentView ? "2. Adresses" : "3. Adresses"}</CardTitle>
          <CardDescription>Siège social et site des travaux (préparation visite technique).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="head_office_address">Adresse siège</Label>
            <Input id="head_office_address" {...register("head_office_address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head_office_siret">SIRET siège</Label>
            <Input id="head_office_siret" {...register("head_office_siret")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head_office_postal_code">CP siège</Label>
            <Input id="head_office_postal_code" {...register("head_office_postal_code")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head_office_city">Ville siège</Label>
            <Input id="head_office_city" {...register("head_office_city")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="worksite_address">Adresse travaux</Label>
            <Input id="worksite_address" {...register("worksite_address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="worksite_siret">SIRET travaux</Label>
            <Input id="worksite_siret" {...register("worksite_siret")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="worksite_postal_code">CP travaux</Label>
            <Input id="worksite_postal_code" {...register("worksite_postal_code")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="worksite_city">Ville travaux</Label>
            <Input id="worksite_city" {...register("worksite_city")} />
          </div>
        </CardContent>
      </Card>

      {mode === "edit" ? (
      <Card>
        <CardHeader>
          <CardTitle>{simplifiedAgentView ? "3. Pré-qualification technique" : "4. Pré-qualification technique"}</CardTitle>
          <CardDescription>
            Données initiales avant passage terrain (sans moteur de calcul automatique).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Catégorie commerciale
            </p>
            <p className="text-xs text-muted-foreground">
              Dérivée de la <strong>fiche CEE</strong> du dossier (workflow actif ou fiche rattachée au lead). Pour la
              modifier, changez de fiche CEE ou le workflow — pas de saisie manuelle sur cette ligne.
            </p>
            <p className="text-sm font-medium text-foreground">
              {derivedCommercialCategory?.trim() ? derivedCommercialCategory.trim() : "—"}
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Volumes
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="surface_m2">Surface (m²)</Label>
                <Input id="surface_m2" type="number" step="any" {...register("surface_m2")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ceiling_height_m">Hauteur sous plafond (m)</Label>
                <Input id="ceiling_height_m" type="number" step="any" {...register("ceiling_height_m")} />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bâtiment &amp; chauffage (résumé)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="building_type">Type de bâtiment</Label>
                <select id="building_type" className={selectClassName} {...register("building_type")}>
                  <option value="">—</option>
                  {BUILDING_TYPE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {BUILDING_TYPE_LABELS[value]}
                    </option>
                  ))}
                </select>
                {errors.building_type ? (
                  <p className="text-sm text-destructive">{errors.building_type.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="heated_building">Bâtiment chauffé</Label>
                <select id="heated_building" className={selectClassName} {...register("heated_building")}>
                  <option value="">—</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mode de chauffage
            </p>
            <div className="space-y-2">
              <Label id="lead_heating_type-label">Mode de chauffage actuel</Label>
              <Controller
                name="heating_type"
                control={control}
                render={({ field }) => (
                  <HeatingModeField
                    id="lead_heating_type"
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Logistique
            </p>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="warehouse_count">Nombre d&apos;entrepôts</Label>
              <Input id="warehouse_count" type="number" min={0} step={1} {...register("warehouse_count")} />
            </div>
          </section>
        </CardContent>
      </Card>
      ) : null}

      {mode === "edit" && !simplifiedAgentView ? (
        <Card>
          <CardHeader>
            <CardTitle>Documents (aérien &amp; cadastre)</CardTitle>
            <CardDescription>
              Fichiers pour la préparation terrain — distincts de l&apos;enregistrement d&apos;appel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {leadId ? (
              <>
                <Controller
                  name="aerial_photos"
                  control={control}
                  render={({ field }) => (
                    <LeadMediaFilesField
                      leadId={leadId}
                      kind="aerial"
                      label="Photos aériennes"
                      description="Une ou plusieurs images (JPEG, PNG, WebP…)."
                      accept="image/*"
                      icon="image"
                      value={stringArrayFromLeadJson(field.value as Json)}
                      onChange={field.onChange}
                      onPersist={(urls) =>
                        updateLeadMediaFieldAction({
                          leadId,
                          field: "aerial_photos",
                          urls,
                        })
                      }
                    />
                  )}
                />
                <Controller
                  name="cadastral_parcel_files"
                  control={control}
                  render={({ field }) => (
                    <LeadMediaFilesField
                      leadId={leadId}
                      kind="cadastral"
                      label="Parcelle cadastrale"
                      description="Images et/ou PDF."
                      accept="image/*,application/pdf"
                      icon="cadastre"
                      value={stringArrayFromLeadJson(field.value as Json)}
                      onChange={field.onChange}
                      onPersist={(urls) =>
                        updateLeadMediaFieldAction({
                          leadId,
                          field: "cadastral_parcel_files",
                          urls,
                        })
                      }
                    />
                  )}
                />
                <Controller
                  name="study_media_files"
                  control={control}
                  render={({ field }) => (
                    <LeadMediaFilesField
                      leadId={leadId}
                      kind="study"
                      label="Médias de l’étude (visuels complémentaires)"
                      description="Photos complémentaires ou références visuelles pour enrichir l’étude PDF."
                      accept="image/*,application/pdf"
                      icon="image"
                      value={stringArrayFromLeadJson(field.value as Json)}
                      onChange={field.onChange}
                      onPersist={(urls) =>
                        updateLeadMediaFieldAction({
                          leadId,
                          field: "study_media_files",
                          urls,
                        })
                      }
                    />
                  )}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {mode === "edit" && !simplifiedAgentView ? <Separator /> : null}

      {formError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p>{formError}</p>
        </div>
      ) : null}

      {duplicateDialog.open ? (
        <DuplicateLeadModal
          open
          onOpenChange={(open) => {
            if (!open) setDuplicateDialog({ open: false });
          }}
          leadId={duplicateDialog.leadId}
          lead={duplicateDialog.lead}
          matchReason={duplicateDialog.reason}
        />
      ) : null}

      {!externalFooter && (
        <div className="flex flex-wrap items-center gap-4">
          {mode === "edit" ? (
            <>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {autoSaveState === "saving" ? (
                  <span>Enregistrement en cours…</span>
                ) : autoSaveState === "saved" ? (
                  <span className="text-foreground/90">Modifications enregistrées.</span>
                ) : (
                  <span>Sauvegarde automatique (environ 1 s après la dernière modification).</span>
                )}
              </p>
              <Button type="submit" variant="outline" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enregistrement…" : "Enregistrer maintenant"}
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Création…" : "Créer le lead"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/leads")}>
                Annuler
              </Button>
            </>
          )}
        </div>
      )}
      </fieldset>
    </form>
    </>
  );
}
