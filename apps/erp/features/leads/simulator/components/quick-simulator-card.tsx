"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
import { simulateAndCreateLead } from "@/features/leads/simulator/actions/simulate-lead";
import { DestratQuickSimulatorUi } from "@/features/leads/simulator/components/destrat-quick-simulator-ui";
import { computeSimulator } from "@/features/leads/simulator/domain/simulator";
import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";
import { toAgentDestratSimulatorInput } from "@/features/leads/simulator/lib/agent-form-to-input";
import {
  DESTRAT_CURRENT_HEATING_MODE_LABELS_FR,
  normalizeSimulatorInput,
  SimulateAndCreateLeadSchema,
  SimulateLeadSchema,
} from "@/features/leads/simulator/schemas/simulator.schema";
import {
  DEFAULT_DESTRAT_AGENT_FORM_STATE,
  type DestratAgentFormState,
} from "@/features/leads/simulator/types/destrat-agent-form-state";
import { LEAD_CIVILITY_OPTIONS } from "@/features/leads/lib/civility-options";
import { cn } from "@/lib/utils";

const civilitySelectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type FormState = DestratAgentFormState & {
  companyName: string;
  civility: string;
  contactName: string;
  phone: string;
  callbackAt: string;
  email: string;
  jobTitle: string;
  department: string;
};

const DEFAULT_FORM: FormState = {
  ...DEFAULT_DESTRAT_AGENT_FORM_STATE,
  companyName: "",
  civility: "",
  contactName: "",
  phone: "",
  callbackAt: "",
  email: "",
  jobTitle: "",
  department: "",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function QuickSimulatorCard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  const leadInput = useMemo(() => toAgentDestratSimulatorInput(form), [form]);

  const leadValidation = useMemo(() => SimulateLeadSchema.safeParse(leadInput), [leadInput]);
  const isHeatedYes = form.buildingHeated === "yes";
  const previewResult: SimulatorComputedResult | null = useMemo(
    () => (isHeatedYes && leadValidation.success ? computeSimulator(normalizeSimulatorInput(leadValidation.data)) : null),
    [isHeatedYes, leadValidation],
  );

  const createValidation = useMemo(() => {
    if (!leadValidation.success) {
      return SimulateAndCreateLeadSchema.safeParse({});
    }
    return SimulateAndCreateLeadSchema.safeParse({
      ...normalizeSimulatorInput(leadValidation.data),
      companyName: form.companyName,
      civility: form.civility,
      contactName: form.contactName,
      phone: form.phone,
      callbackAt: form.callbackAt,
      email: form.email || undefined,
      jobTitle: form.jobTitle || undefined,
      department: form.department || undefined,
      source: "cold_call" as const,
    });
  }, [form, leadValidation]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setStep(1);
    setError(null);
    setSuccess(null);
    setCreatedLeadId(null);
  }

  function goToStep2() {
    setError(null);
    if (!isHeatedYes) {
      setError("Indiquez un bâtiment chauffé pour continuer.");
      return;
    }
    if (!leadValidation.success) {
      setError(leadValidation.error.issues[0]?.message ?? "Complétez tous les champs obligatoires.");
      return;
    }
    setStep(2);
  }

  function onCalculateAndCreate() {
    setError(null);
    setSuccess(null);
    setCreatedLeadId(null);
    startCreate(async () => {
      if (!leadValidation.success) {
        setError("Simulation invalide.");
        return;
      }
      const normalized = normalizeSimulatorInput(leadValidation.data);
      const res = await simulateAndCreateLead({
        ...normalized,
        companyName: form.companyName,
        civility: form.civility,
        contactName: form.contactName,
        phone: form.phone,
        callbackAt: form.callbackAt,
        email: form.email || undefined,
        jobTitle: form.jobTitle || undefined,
        department: form.department || undefined,
        source: "cold_call",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess("Lead enrichi créé avec succès. Redirection vers la fiche pour ajouter un commentaire si besoin.");
      setCreatedLeadId(res.lead.id);
      router.push(`/leads/${res.lead.id}`);
    });
  }

  const progressPct = step === 1 ? 50 : 100;
  const commercialRestToCharge =
    previewResult && previewResult.ceeSolution.solution === "DESTRAT"
      ? Math.max(0, previewResult.restToCharge)
      : 0;

  const destratSlice: DestratAgentFormState = {
    buildingHeated: form.buildingHeated,
    localUsage: form.localUsage,
    heightM: form.heightM,
    surfaceM2: form.surfaceM2,
    currentHeatingMode: form.currentHeatingMode,
    model: form.model,
    consigne: form.consigne,
  };

  const step2Summary =
    previewResult && leadValidation.success ? (
      <p className="text-sm text-muted-foreground">
        Recommandation :{" "}
        <span className="font-medium text-foreground">
          {previewResult.ceeSolution.solution === "DESTRAT"
            ? `Déstratification (${previewResult.ceeSolution.destratCeeSheetCode ?? "BAT-TH-142"})`
            : previewResult.ceeSolution.solution === "PAC"
              ? "Pompe à chaleur air/eau (BAT-TH-163)"
              : "Hors périmètre CEE — suivi commercial"}
        </span>
        {previewResult.ceeSolution.solution === "DESTRAT" && form.currentHeatingMode ? (
          <>
            {" "}
            — {DESTRAT_CURRENT_HEATING_MODE_LABELS_FR[form.currentHeatingMode]}, coût annuel estimé ~{" "}
            {formatCurrency(previewResult.costYearSelected)}, économies déstrat estimées ~{" "}
            {formatCurrency(previewResult.savingEur30Selected)}/an.
          </>
        ) : null}
        {previewResult.ceeSolution.solution === "PAC" && previewResult.pacSavings ? (
          <>
            {" "}
            — estimation théorique PAC : ~{" "}
            {new Intl.NumberFormat("fr-FR").format(previewResult.pacSavings.annualEnergySavingsKwh)} kWh/an (
            {previewResult.pacSavings.annualEnergySavingsPercent} %), à confirmer par étude.
          </>
        ) : null}
      </p>
    ) : null;

  return (
    <Card className="mb-10 border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Simulation rapide</CardTitle>
        <CardDescription>Qualifiez un prospect en direct et créez un lead enrichi.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Etape {step} sur 2</p>
            <p className="text-xs text-muted-foreground">{progressPct}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {step === 1 ? (
          <DestratQuickSimulatorUi
            value={destratSlice}
            onChange={(next) =>
              setForm((prev) => ({
                ...prev,
                ...next,
              }))
            }
            companyNameForScript={form.companyName}
            disabled={isCreating}
            footer={
              <>
                <Button variant="secondary" onClick={goToStep2} disabled={!leadValidation.success || isCreating}>
                  Continuer vers l&apos;etape 2
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isCreating}>
                  Réinitialiser
                </Button>
                <p className="self-center text-xs text-muted-foreground">Recommandation unique (déstrat / PAC / hors périmètre)</p>
              </>
            }
          />
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Etape 2 — Coordonnées pour valider le lead</h3>
              <Button variant="outline" onClick={() => setStep(1)}>
                Retour à l&apos;etape 1
              </Button>
            </div>
            {step2Summary}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2 max-w-xs">
                <Label htmlFor="sim-civility">Civilité</Label>
                <select
                  id="sim-civility"
                  className={civilitySelectClassName}
                  value={form.civility}
                  onChange={(e) => updateField("civility", e.target.value)}
                >
                  {LEAD_CIVILITY_OPTIONS.map((o) => (
                    <option key={o.value === "" ? "_empty" : o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-company">Société *</Label>
                <Input
                  id="sim-company"
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Ex: ECPS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-contact">Nom & prénom *</Label>
                <Input
                  id="sim-contact"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  placeholder="Prénom Nom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-phone">Téléphone *</Label>
                <Input
                  id="sim-phone"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="06..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-callback">Date et heure de rappel *</Label>
                <Input
                  id="sim-callback"
                  type="datetime-local"
                  value={form.callbackAt}
                  onChange={(e) => updateField("callbackAt", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-email">Email pro</Label>
                <Input
                  id="sim-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="contact@entreprise.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-job">Fonction</Label>
                <Input
                  id="sim-job"
                  value={form.jobTitle}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                  placeholder="DG, responsable technique..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sim-department">Département / code postal</Label>
                <Input
                  id="sim-department"
                  value={form.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder="06 - Alpes-Maritimes"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              Sans engagement — un expert vous rappelle sous 24h pour valider l&apos;éligibilité.
            </div>
            {previewResult ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed text-foreground">
                <p className="font-medium">{previewResult.ceeSolution.commercialMessage}</p>
                {previewResult.ceeSolution.solution === "DESTRAT" && commercialRestToCharge > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reste à charge déstrat estimé : {formatCurrency(commercialRestToCharge)}.
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
            {createdLeadId ? (
              <Link href={`/leads/${createdLeadId}`} className="text-sm text-primary underline-offset-4 hover:underline">
                Ouvrir la fiche lead
              </Link>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Retour a l&apos;etape 1
              </Button>
              <Button onClick={onCalculateAndCreate} disabled={isCreating || !createValidation.success || !leadValidation.success}>
                {isCreating ? "Validation..." : "Valider et enregistrer le lead"}
              </Button>
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
