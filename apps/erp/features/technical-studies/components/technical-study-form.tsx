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
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import { createTechnicalStudy } from "@/features/technical-studies/actions/create-technical-study";
import { updateTechnicalStudy } from "@/features/technical-studies/actions/update-technical-study";
import {
  STUDY_TYPE_LABELS,
  TECHNICAL_STUDY_STATUS_LABELS,
} from "@/features/technical-studies/constants";
import { EMPTY_TECHNICAL_STUDY_FORM } from "@/features/technical-studies/lib/form-defaults";
import {
  STUDY_TYPE_VALUES,
  TECHNICAL_STUDY_STATUS_VALUES,
  TechnicalStudyInsertSchema,
  type TechnicalStudyFormInput,
  type TechnicalStudyInsertInput,
} from "@/features/technical-studies/schemas/technical-study.schema";
import type { TechnicalStudyFormOptions } from "@/features/technical-studies/types";
import type { DocumentType, StudyType, TechnicalStudyStatus } from "@/types/database.types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type TechnicalStudyFormProps = {
  mode: "create" | "edit";
  technicalStudyId?: string;
  defaultValues?: TechnicalStudyFormInput;
  options: TechnicalStudyFormOptions;
  className?: string;
};

export function TechnicalStudyForm({
  mode,
  technicalStudyId,
  defaultValues,
  options,
  className,
}: TechnicalStudyFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const mergedDefaults = defaultValues ?? EMPTY_TECHNICAL_STUDY_FORM;

  const form = useForm<TechnicalStudyFormInput, unknown, TechnicalStudyInsertInput>({
    resolver: zodResolver(TechnicalStudyInsertSchema),
    defaultValues: mergedDefaults,
  });

  const { register, handleSubmit } = form;

  async function onSubmit(values: TechnicalStudyInsertInput) {
    setFormError(null);

    if (mode === "create") {
      const result = await createTechnicalStudy(values);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/technical-studies/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!technicalStudyId) {
      setFormError("Identifiant étude manquant.");
      return;
    }

    const result = await updateTechnicalStudy({ id: technicalStudyId, ...values });
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
          <CardTitle>Référentiel documentaire</CardTitle>
          <CardDescription>
            Sélectionnez le document principal (PDF ou pièce) auquel cette étude se rattache.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="primary_document_id">Document principal *</Label>
            <select
              id="primary_document_id"
              className={selectClassName}
              {...register("primary_document_id")}
            >
              <option value="">— Sélectionner —</option>
              {options.documents.map((d) => {
                const typeLabel =
                  d.document_type in DOCUMENT_TYPE_LABELS
                    ? DOCUMENT_TYPE_LABELS[d.document_type as DocumentType]
                    : d.document_type;
                const num = d.document_number?.trim();
                return (
                  <option key={d.id} value={d.id}>
                    {typeLabel}
                    {num ? ` · ${num}` : ""}
                  </option>
                );
              })}
            </select>
            {options.documents.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Aucun document dans le référentiel — créez d’abord une fiche document.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Étude</CardTitle>
          <CardDescription>Type, référence métier, statut et bureau.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="study_type">Type d’étude *</Label>
            <select id="study_type" className={selectClassName} {...register("study_type")}>
              {STUDY_TYPE_VALUES.map((v) => (
                <option key={v} value={v}>
                  {STUDY_TYPE_LABELS[v as StudyType]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Référence *</Label>
            <Input id="reference" {...register("reference")} placeholder="Ex. NDD-2026-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Statut *</Label>
            <select id="status" className={selectClassName} {...register("status")}>
              {TECHNICAL_STUDY_STATUS_VALUES.map((v) => (
                <option key={v} value={v}>
                  {TECHNICAL_STUDY_STATUS_LABELS[v as TechnicalStudyStatus]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="study_date">Date de l’étude</Label>
            <Input id="study_date" type="date" {...register("study_date")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="engineering_office">Bureau d’études / auteur</Label>
            <Input id="engineering_office" {...register("engineering_office")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résumé</CardTitle>
          <CardDescription>Synthèse ou conclusions (hors moteur de calcul).</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea id="summary" rows={8} className="min-h-[160px]" {...register("summary")} />
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
          {mode === "create" ? "Créer l’étude" : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
