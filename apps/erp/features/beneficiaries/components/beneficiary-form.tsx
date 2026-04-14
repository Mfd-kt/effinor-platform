"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import { createBeneficiary } from "@/features/beneficiaries/actions/create-beneficiary";
import { updateBeneficiary } from "@/features/beneficiaries/actions/update-beneficiary";
import {
  BENEFICIARY_STATUS_LABELS,
  CIVILITY_OPTIONS,
} from "@/features/beneficiaries/constants";
import { EMPTY_BENEFICIARY_FORM } from "@/features/beneficiaries/lib/form-defaults";
import {
  BeneficiaryInsertSchema,
  BENEFICIARY_STATUS_VALUES,
  type BeneficiaryInsertInput,
} from "@/features/beneficiaries/schemas/beneficiary.schema";
import { climateZoneFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-climate-zone";
import { regionFromWorksiteOrHeadOfficePostalCode } from "@/lib/fr-postal-region";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type BeneficiaryFormProps = {
  mode: "create" | "edit";
  beneficiaryId?: string;
  defaultValues?: BeneficiaryInsertInput;
  className?: string;
};

export function BeneficiaryForm({
  mode,
  beneficiaryId,
  defaultValues,
  className,
}: BeneficiaryFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<BeneficiaryInsertInput>({
    resolver: zodResolver(BeneficiaryInsertSchema),
    defaultValues: defaultValues ?? EMPTY_BENEFICIARY_FORM,
  });

  const headOfficePostalRegister = form.register("head_office_postal_code");
  const worksitePostalRegister = form.register("worksite_postal_code");

  const syncGeoFromPostalCodes = useCallback(() => {
    const ws = form.getValues("worksite_postal_code");
    const ho = form.getValues("head_office_postal_code");
    const region = regionFromWorksiteOrHeadOfficePostalCode(ws, ho);
    const climate = climateZoneFromWorksiteOrHeadOfficePostalCode(ws, ho);
    if (region !== undefined) {
      form.setValue("region", region, { shouldDirty: true, shouldValidate: true });
    }
    if (climate !== undefined) {
      form.setValue("climate_zone", climate, { shouldDirty: true, shouldValidate: true });
    }
  }, [form]);

  /** Au chargement : compléter région / zone climatique si vides et qu’un CP permet le calcul. */
  useEffect(() => {
    const ws = form.getValues("worksite_postal_code");
    const ho = form.getValues("head_office_postal_code");
    const region = regionFromWorksiteOrHeadOfficePostalCode(ws, ho);
    const climate = climateZoneFromWorksiteOrHeadOfficePostalCode(ws, ho);
    const rCur = form.getValues("region");
    const cCur = form.getValues("climate_zone");
    if (region !== undefined && (!rCur || String(rCur).trim() === "")) {
      form.setValue("region", region, { shouldDirty: true, shouldValidate: true });
    }
    if (climate !== undefined && (!cCur || String(cCur).trim() === "")) {
      form.setValue("climate_zone", climate, { shouldDirty: true, shouldValidate: true });
    }
  }, [form]);

  async function onSubmit(values: BeneficiaryInsertInput) {
    setFormError(null);

    const derivedRegion = regionFromWorksiteOrHeadOfficePostalCode(
      values.worksite_postal_code,
      values.head_office_postal_code,
    );
    const derivedClimate = climateZoneFromWorksiteOrHeadOfficePostalCode(
      values.worksite_postal_code,
      values.head_office_postal_code,
    );
    const payload: BeneficiaryInsertInput = {
      ...values,
      ...(derivedRegion !== undefined ? { region: derivedRegion } : {}),
      ...(derivedClimate !== undefined ? { climate_zone: derivedClimate } : {}),
    };

    if (mode === "create") {
      const result = await createBeneficiary(payload);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/beneficiaries/${result.data.id}`);
      router.refresh();
      return;
    }

    if (!beneficiaryId) {
      setFormError("Identifiant bénéficiaire manquant.");
      return;
    }

    const result = await updateBeneficiary({ id: beneficiaryId, ...payload });
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
          <CardTitle>Informations société</CardTitle>
          <CardDescription>
            Identification légale et source d’acquisition du dossier.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_name">Raison sociale *</Label>
            <Input
              id="company_name"
              {...form.register("company_name")}
              autoComplete="organization"
            />
            {form.formState.errors.company_name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.company_name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siren">SIREN</Label>
            <Input id="siren" {...form.register("siren")} inputMode="numeric" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acquisition_source">Source d’acquisition</Label>
            <Input
              id="acquisition_source"
              {...form.register("acquisition_source")}
              placeholder="Ex. partenaire, historique…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Statut *</Label>
            <select
              id="status"
              className={selectClassName}
              {...form.register("status")}
            >
              {BENEFICIARY_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {BENEFICIARY_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact principal</CardTitle>
          <CardDescription>Interlocuteur privilégié pour les échanges.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="civility">Civilité</Label>
            <select
              id="civility"
              className={selectClassName}
              {...form.register("civility")}
            >
              {CIVILITY_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_role">Fonction</Label>
            <Input id="contact_role" {...form.register("contact_role")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_first_name">Prénom</Label>
            <Input id="contact_first_name" {...form.register("contact_first_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_last_name">Nom</Label>
            <Input id="contact_last_name" {...form.register("contact_last_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile / direct</Label>
            <Input id="phone" type="tel" {...form.register("phone")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="landline">Ligne fixe</Label>
            <Input id="landline" type="tel" {...form.register("landline")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adresse du siège social</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="head_office_address">Adresse</Label>
            <Input id="head_office_address" {...form.register("head_office_address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head_office_postal_code">Code postal</Label>
            <Input
              id="head_office_postal_code"
              {...headOfficePostalRegister}
              onBlur={(e) => {
                headOfficePostalRegister.onBlur(e);
                syncGeoFromPostalCodes();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="head_office_city">Ville</Label>
            <Input id="head_office_city" {...form.register("head_office_city")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="siret_head_office">SIRET siège social</Label>
            <Input
              id="siret_head_office"
              {...form.register("siret_head_office")}
              inputMode="numeric"
              autoComplete="off"
              placeholder="14 chiffres"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adresse des travaux / chantier</CardTitle>
          <CardDescription>
            Lieu d’intervention si différent du siège.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="worksite_address">Adresse</Label>
            <Input id="worksite_address" {...form.register("worksite_address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="worksite_postal_code">Code postal</Label>
            <Input
              id="worksite_postal_code"
              {...worksitePostalRegister}
              onBlur={(e) => {
                worksitePostalRegister.onBlur(e);
                syncGeoFromPostalCodes();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="worksite_city">Ville</Label>
            <Input id="worksite_city" {...form.register("worksite_city")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="siret_worksite">SIRET travaux / chantier</Label>
            <Input
              id="siret_worksite"
              {...form.register("siret_worksite")}
              inputMode="numeric"
              autoComplete="off"
              placeholder="14 chiffres"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suivi interne</CardTitle>
          <CardDescription>Zone climatique, région et notes libres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="climate_zone">Zone climatique</Label>
              <Input id="climate_zone" {...form.register("climate_zone")} placeholder="H1, H2, etc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Input id="region" {...form.register("region")} />
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
              : "Créer le bénéficiaire"
            : form.formState.isSubmitting
              ? "Enregistrement…"
              : "Enregistrer"}
        </Button>
        {mode === "create" ? (
          <Button type="button" variant="outline" onClick={() => router.push("/beneficiaries")}>
            Annuler
          </Button>
        ) : null}
      </div>
    </form>
  );
}
