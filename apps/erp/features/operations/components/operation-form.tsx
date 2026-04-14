"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

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
import type { CreateOperationResult } from "@/features/operations/actions/create-operation";
import { suggestOperationKeyDates } from "@/features/operations/actions/suggest-operation-key-dates";
import type { UpdateOperationResult } from "@/features/operations/actions/update-operation";
import { OPERATION_STATUS_LABELS } from "@/features/operations/constants";
import { OperationCeeFields } from "@/features/operations/components/operation-cee-fields";
import { useCeePrimePreview } from "@/features/operations/hooks/use-cee-prime-preview";
import { formatDateInputFr } from "@/features/operations/lib/datetime";
import { EMPTY_OPERATION_FORM } from "@/features/operations/lib/form-defaults";
import {
  OperationInsertSchema,
  OPERATION_STATUS_VALUES,
  type OperationInsertInput,
} from "@/features/operations/schemas/operation.schema";
import type { OperationFormOptions } from "@/features/operations/types";
import { TECHNICAL_VISIT_STATUS_LABELS } from "@/features/technical-visits/constants";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type OperationFormProps = {
  mode: "create" | "edit";
  operationId?: string;
  defaultValues?: OperationInsertInput;
  options: OperationFormOptions;
  className?: string;
  /** Importées côté page serveur pour éviter les erreurs RSC/Turbopack sur la frontière client. */
  createOperationAction?: (input: unknown) => Promise<CreateOperationResult>;
  updateOperationAction?: (input: unknown) => Promise<UpdateOperationResult>;
  /** Création depuis un lien avec `?beneficiary_id=` : champ non modifiable. */
  lockedBeneficiaryId?: boolean;
  /** Création depuis un lien avec `?reference_technical_visit_id=` : champ non modifiable. */
  lockedReferenceTechnicalVisitId?: boolean;
};

export function OperationForm({
  mode,
  operationId,
  defaultValues,
  options,
  className,
  createOperationAction,
  updateOperationAction,
  lockedBeneficiaryId = false,
  lockedReferenceTechnicalVisitId = false,
}: OperationFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<OperationInsertInput>({
    resolver: zodResolver(OperationInsertSchema) as Resolver<OperationInsertInput>,
    defaultValues: defaultValues ?? EMPTY_OPERATION_FORM,
  });

  const beneficiaryId = useWatch({
    control: form.control,
    name: "beneficiary_id",
  });
  const referenceTechnicalVisitId = useWatch({
    control: form.control,
    name: "reference_technical_visit_id",
  });
  const vtOptions = useMemo(
    () =>
      options.technicalVisits.filter(
        (v) => v.beneficiary_id != null && v.beneficiary_id === beneficiaryId,
      ),
    [options.technicalVisits, beneficiaryId],
  );

  const ceePrimePreview = useCeePrimePreview(form, {
    ceeSheets: options.ceeSheets,
    delegators: options.delegators,
  });

  useEffect(() => {
    if (lockedReferenceTechnicalVisitId) return;
    const current = form.getValues("reference_technical_visit_id");
    if (!current) return;
    if (!beneficiaryId) {
      form.setValue("reference_technical_visit_id", undefined);
      return;
    }
    const valid = options.technicalVisits.some(
      (v) => v.id === current && v.beneficiary_id === beneficiaryId,
    );
    if (!valid) {
      form.setValue("reference_technical_visit_id", undefined);
    }
  }, [beneficiaryId, options.technicalVisits, form, lockedReferenceTechnicalVisitId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await suggestOperationKeyDates({
        operationId: mode === "edit" ? operationId : undefined,
        referenceTechnicalVisitId: referenceTechnicalVisitId || undefined,
      });
      if (cancelled || !res.ok) return;
      const s = res.suggestions;
      const keys = [
        "technical_visit_date",
        "quote_sent_at",
        "quote_signed_at",
        "installation_start_at",
        "installation_end_at",
        "deposit_date",
        "prime_paid_at",
      ] as const;
      for (const k of keys) {
        const cur = form.getValues(k);
        if ((cur === undefined || String(cur).trim() === "") && s[k]) {
          form.setValue(k, s[k]!, { shouldDirty: false, shouldValidate: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, operationId, referenceTechnicalVisitId, form]);

  async function onSubmit(values: OperationInsertInput) {
    setFormError(null);

    if (mode === "create") {
      if (!createOperationAction) {
        setFormError("Action de création non configurée.");
        return;
      }
      const result = await createOperationAction(values);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/operations/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!operationId) {
      setFormError("Identifiant opération manquant.");
      return;
    }

    if (!updateOperationAction) {
      setFormError("Action de mise à jour non configurée.");
      return;
    }
    const result = await updateOperationAction({ id: operationId, ...values });
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
          <CardTitle>Pilotage</CardTitle>
          <CardDescription>Statut de l’opération.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation_status">Statut opération *</Label>
            <select
              id="operation_status"
              className={cn(selectClassName, "max-w-xl")}
              {...form.register("operation_status")}
            >
              {OPERATION_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {OPERATION_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" {...form.register("sales_status")} />
          <input type="hidden" {...form.register("admin_status")} />
          <input type="hidden" {...form.register("technical_status")} />
          <input type="hidden" {...form.register("sales_owner_id")} />
          <input type="hidden" {...form.register("confirmer_id")} />
          <input type="hidden" {...form.register("admin_owner_id")} />
          <input type="hidden" {...form.register("technical_owner_id")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identification opération</CardTitle>
          <CardDescription>Bénéficiaire obligatoire et fiche CEE.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={lockedBeneficiaryId ? "beneficiary_id_readonly" : "beneficiary_id"}>
              Bénéficiaire *
            </Label>
            {lockedBeneficiaryId && mode === "create" ? (
              <>
                <input type="hidden" {...form.register("beneficiary_id")} />
                <div
                  id="beneficiary_id_readonly"
                  className="flex min-h-10 items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground"
                  aria-readonly="true"
                >
                  {options.beneficiaries.find((b) => b.id === beneficiaryId)?.company_name ??
                    beneficiaryId ??
                    "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Figé par le lien de création — non modifiable ici.
                </p>
              </>
            ) : (
              <select
                id="beneficiary_id"
                className={selectClassName}
                {...form.register("beneficiary_id")}
              >
                <option value="">— Sélectionner —</option>
                {options.beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.company_name}
                  </option>
                ))}
              </select>
            )}
            {form.formState.errors.beneficiary_id ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.beneficiary_id.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor={
                lockedReferenceTechnicalVisitId ? "reference_technical_visit_readonly" : "reference_technical_visit_id"
              }
            >
              Visite technique de référence
            </Label>
            {lockedReferenceTechnicalVisitId && mode === "create" ? (
              <>
                <input type="hidden" {...form.register("reference_technical_visit_id")} />
                <div
                  id="reference_technical_visit_readonly"
                  className="flex min-h-10 items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground"
                  aria-readonly="true"
                >
                  {(() => {
                    const v = options.technicalVisits.find((x) => x.id === referenceTechnicalVisitId);
                    if (!v) return referenceTechnicalVisitId ?? "—";
                    return `${v.vt_reference} (${TECHNICAL_VISIT_STATUS_LABELS[v.status]})`;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Figé par le lien de création — non modifiable ici.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Liste filtrée sur le bénéficiaire : VT déjà liées à ce bénéficiaire.
                </p>
                <select
                  id="reference_technical_visit_id"
                  className={selectClassName}
                  disabled={!beneficiaryId}
                  {...form.register("reference_technical_visit_id")}
                >
                  <option value="">—</option>
                  {vtOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vt_reference} ({TECHNICAL_VISIT_STATUS_LABELS[v.status]})
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium leading-none">Référence opération</span>
            {mode === "create" ? (
              <>
                <input type="hidden" {...form.register("operation_reference")} />
                <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Attribuée <strong className="font-medium text-foreground">automatiquement</strong> à
                  l’enregistrement (préfixe <span className="font-mono text-foreground">OP-</span>).
                </p>
              </>
            ) : (
              <>
                <Input
                  id="operation_reference"
                  {...form.register("operation_reference")}
                  className="font-mono text-sm"
                  placeholder="Référence métier"
                />
                <p className="text-xs text-muted-foreground">
                  Identifiant du dossier — modifiez seulement si nécessaire.
                </p>
              </>
            )}
          </div>
          <OperationCeeFields
            form={form}
            ceeSheets={options.ceeSheets}
            beneficiaries={options.beneficiaries}
          />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="delegator_id">Délégataire</Label>
            <select
              id="delegator_id"
              className={selectClassName}
              {...form.register("delegator_id")}
            >
              <option value="">—</option>
              {options.delegators.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="lead_id">Lead lié (optionnel)</Label>
            <select id="lead_id" className={selectClassName} {...form.register("lead_id")}>
              <option value="">—</option>
              {options.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.company_name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dates clés</CardTitle>
          <CardDescription>
            Jalons au jour près (non modifiables ici). Les champs vides se complètent depuis la
            visite technique de référence, les devis, chantiers et factures liés à l’opération
            lorsque ces données existent.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["technical_visit_date", "Visite technique"],
              ["quote_sent_at", "Envoi devis"],
              ["quote_signed_at", "Signature devis"],
              ["installation_start_at", "Début installation"],
              ["installation_end_at", "Fin installation"],
              ["deposit_date", "Versement acompte"],
              ["prime_paid_at", "Paiement prime"],
            ] as const
          ).map(([name, label]) => {
            const raw = form.watch(name);
            return (
              <div key={name} className="space-y-2">
                <Label htmlFor={`key-date-${name}`}>{label}</Label>
                <input type="hidden" {...form.register(name)} />
                <div
                  id={`key-date-${name}`}
                  className="flex min-h-10 items-center rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-foreground tabular-nums"
                  aria-readonly="true"
                >
                  {formatDateInputFr(raw)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Finance et estimation</CardTitle>
          <CardDescription>
            Aperçus calculés depuis la fiche CEE et le délégataire ; champs saisis pour les montants
            indicatifs avant devis / facturation détaillée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Aperçu (fiche CEE + taux délégataire)</p>
            <div className="space-y-2 text-sm">
              <div className="rounded-md bg-background/80 px-3 py-2">
                <span className="text-muted-foreground">Prime CEE estimée (aperçu) : </span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {!ceePrimePreview.hasCeeSheet || ceePrimePreview.previewKwhc == null
                    ? "—"
                    : `${ceePrimePreview.kwhcFormatter.format(ceePrimePreview.previewKwhc)} kWhc`}
                </span>
              </div>
              <div className="rounded-md border border-border/40 bg-background/80 px-3 py-2">
                <span className="text-muted-foreground">Prime estimée (€) : </span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {ceePrimePreview.previewPrimeEuro == null
                    ? "—"
                    : ceePrimePreview.euroFormatter.format(ceePrimePreview.previewPrimeEuro)}
                </span>
                {ceePrimePreview.previewKwhc != null && ceePrimePreview.previewPrimeEuro == null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {!ceePrimePreview.delegatorId.trim()
                      ? "Sélectionnez un délégataire (bloc au-dessus) pour appliquer son taux €/kWhc."
                      : ceePrimePreview.delegatorEuroPerKwhc == null
                        ? "Indiquez le montant par kWhc sur le délégataire (Réglages CEE → délégataires), ex. 0,0073 € par kWhc."
                        : null}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["estimated_quote_amount_ht", "Devis HT estimé (€)"],
                ["estimated_prime_amount", "Prime CEE estimée (€)"],
                ["estimated_remaining_cost", "Reste à charge estimé (€)"],
                ["valuation_amount", "Valorisation (€)"],
              ] as const
            ).map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  inputMode="decimal"
                  {...form.register(name)}
                  placeholder="0,00"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liens & suivi</CardTitle>
          <CardDescription>Drive, signature, suivi public et notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="drive_url">Lien Drive</Label>
              <Input id="drive_url" type="url" {...form.register("drive_url")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="signature_url">Lien signature</Label>
              <Input id="signature_url" type="url" {...form.register("signature_url")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="public_tracking_url">URL suivi public</Label>
              <Input id="public_tracking_url" type="url" {...form.register("public_tracking_url")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk_level">Niveau de risque</Label>
              <Input id="risk_level" {...form.register("risk_level")} placeholder="Faible, moyen…" />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={5} {...form.register("notes")} />
          </div>
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
              : "Créer l’opération"
            : form.formState.isSubmitting
              ? "Enregistrement…"
              : "Enregistrer"}
        </Button>
        {mode === "create" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const bid = form.getValues("beneficiary_id");
              router.push(
                bid && String(bid).trim() ? `/beneficiaries/${bid}` : "/beneficiaries",
              );
            }}
          >
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
