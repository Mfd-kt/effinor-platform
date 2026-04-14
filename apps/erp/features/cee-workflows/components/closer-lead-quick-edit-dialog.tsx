"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLead } from "@/features/leads/actions/update-lead";
import { LEAD_CIVILITY_OPTIONS } from "@/features/leads/lib/civility-options";
import { leadRowToFormValues } from "@/features/leads/lib/form-defaults";
import type { LeadFormInput } from "@/features/leads/schemas/lead.schema";
import type { LeadDetailRow } from "@/features/leads/types";
import { cn } from "@/lib/utils";

const civilitySelectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

/**
 * Le dialogue n’édite qu’un sous-ensemble de champs. En envoyer tout le `LeadFormInput`
 * depuis le state React réécrivait aussi `heating_type`, médias, etc. avec des valeurs
 * parfois désynchronisées du serveur (ex. après saisie confirmateur) → écrasement des
 * modes de chauffage multi-sélection.
 */
function buildCloserQuickEditPayload(lead: LeadDetailRow, leadId: string, form: LeadFormInput) {
  const baseline = leadRowToFormValues(lead);
  const siretLine = (form.siret ?? "").trim() || (form.head_office_siret ?? "").trim();
  return {
    id: leadId,
    ...baseline,
    company_name: form.company_name,
    product_interest: form.product_interest,
    siret: siretLine,
    head_office_siret: siretLine,
    worksite_siret: form.worksite_siret,
    civility: form.civility,
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone,
    contact_role: form.contact_role,
    head_office_address: form.head_office_address,
    head_office_postal_code: form.head_office_postal_code,
    head_office_city: form.head_office_city,
    worksite_address: form.worksite_address,
    worksite_postal_code: form.worksite_postal_code,
    worksite_city: form.worksite_city,
    surface_m2: form.surface_m2,
    ceiling_height_m: form.ceiling_height_m,
    recording_notes: form.recording_notes,
  };
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function CloserLeadQuickEditDialog({
  lead,
  leadId,
  onSaved,
}: {
  lead: LeadDetailRow;
  leadId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LeadFormInput>(() => leadRowToFormValues(lead));
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(leadRowToFormValues(lead));
      setFeedback(null);
    }
  }

  function patch<K extends keyof LeadFormInput>(key: K, value: LeadFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateLead(buildCloserQuickEditPayload(lead, leadId, form));
      if (!result.ok) {
        setFeedback({ type: "err", text: result.message });
        return;
      }
      setFeedback({ type: "ok", text: "Fiche lead mise à jour." });
      onSaved();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Pencil className="size-3.5" />
          Corriger la fiche
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1.5 px-6 pt-6 pr-14 text-left">
          <DialogTitle>Corriger la fiche lead</DialogTitle>
          <DialogDescription>
            Email, coordonnées et adresses sont utilisés pour les envois et les PDF. Les changements sont enregistrés
            sur le lead (visible aussi dans le module Leads).
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-semibold">Société</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="cl-company" label="Raison sociale *">
                  <Input
                    id="cl-company"
                    value={form.company_name}
                    onChange={(e) => patch("company_name", e.target.value)}
                    autoComplete="organization"
                  />
                </Field>
                <Field id="cl-product" label="Intérêt produit">
                  <Input
                    id="cl-product"
                    value={form.product_interest}
                    onChange={(e) => patch("product_interest", e.target.value)}
                  />
                </Field>
                <Field id="cl-siret" label="SIRET (siège / principal)">
                  <Input id="cl-siret" value={form.siret} onChange={(e) => patch("siret", e.target.value)} />
                </Field>
                <Field id="cl-ws-siret" label="SIRET chantier">
                  <Input
                    id="cl-ws-siret"
                    value={form.worksite_siret}
                    onChange={(e) => patch("worksite_siret", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">Contact</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="cl-civility" label="Civilité">
                  <select
                    id="cl-civility"
                    className={civilitySelectClassName}
                    value={form.civility ?? ""}
                    onChange={(e) => patch("civility", e.target.value)}
                  >
                    {LEAD_CIVILITY_OPTIONS.map((o) => (
                      <option key={o.value === "" ? "_empty" : o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="cl-fn" label="Prénom">
                  <Input
                    id="cl-fn"
                    value={form.first_name}
                    onChange={(e) => patch("first_name", e.target.value)}
                    autoComplete="given-name"
                  />
                </Field>
                <Field id="cl-ln" label="Nom">
                  <Input
                    id="cl-ln"
                    value={form.last_name}
                    onChange={(e) => patch("last_name", e.target.value)}
                    autoComplete="family-name"
                  />
                </Field>
                <Field id="cl-email" label="Email">
                  <Input
                    id="cl-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => patch("email", e.target.value)}
                    autoComplete="email"
                  />
                </Field>
                <Field id="cl-phone" label="Téléphone">
                  <Input
                    id="cl-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => patch("phone", e.target.value)}
                    autoComplete="tel"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field id="cl-role" label="Fonction / rôle">
                    <Input
                      id="cl-role"
                      value={form.contact_role}
                      onChange={(e) => patch("contact_role", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">Siège social</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="cl-ho-addr" label="Adresse">
                  <Input
                    id="cl-ho-addr"
                    value={form.head_office_address}
                    onChange={(e) => patch("head_office_address", e.target.value)}
                    className="sm:col-span-2"
                  />
                </Field>
                <Field id="cl-ho-cp" label="Code postal">
                  <Input
                    id="cl-ho-cp"
                    value={form.head_office_postal_code}
                    onChange={(e) => patch("head_office_postal_code", e.target.value)}
                  />
                </Field>
                <Field id="cl-ho-city" label="Ville">
                  <Input
                    id="cl-ho-city"
                    value={form.head_office_city}
                    onChange={(e) => patch("head_office_city", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">Site / chantier</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="cl-ws-addr" label="Adresse">
                  <Input
                    id="cl-ws-addr"
                    value={form.worksite_address}
                    onChange={(e) => patch("worksite_address", e.target.value)}
                    className="sm:col-span-2"
                  />
                </Field>
                <Field id="cl-ws-cp" label="Code postal">
                  <Input
                    id="cl-ws-cp"
                    value={form.worksite_postal_code}
                    onChange={(e) => patch("worksite_postal_code", e.target.value)}
                  />
                </Field>
                <Field id="cl-ws-city" label="Ville">
                  <Input
                    id="cl-ws-city"
                    value={form.worksite_city}
                    onChange={(e) => patch("worksite_city", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">Compléments</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="cl-surf" label="Surface (m²)">
                  <Input
                    id="cl-surf"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.surface_m2 == null ? "" : String(form.surface_m2)}
                    onChange={(e) =>
                      patch("surface_m2", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </Field>
                <Field id="cl-height" label="Hauteur sous plafond (m)">
                  <Input
                    id="cl-height"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.ceiling_height_m == null ? "" : String(form.ceiling_height_m)}
                    onChange={(e) =>
                      patch("ceiling_height_m", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </Field>
                <Field id="cl-notes" label="Notes enregistrées (agent)">
                  <Textarea
                    id="cl-notes"
                    value={form.recording_notes}
                    onChange={(e) => patch("recording_notes", e.target.value)}
                    rows={4}
                    className="sm:col-span-2"
                  />
                </Field>
              </div>
            </div>

            {feedback?.type === "err" ? (
              <p className="text-sm text-destructive">{feedback.text}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={isPending || !form.company_name.trim()}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
