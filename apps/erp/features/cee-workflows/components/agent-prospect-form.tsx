"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_CIVILITY_OPTIONS } from "@/features/leads/lib/civility-options";
import { cn } from "@/lib/utils";

export type AgentProspectFormValue = {
  companyName: string;
  civility: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

export const DEFAULT_AGENT_PROSPECT_FORM: AgentProspectFormValue = {
  companyName: "",
  civility: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  notes: "",
};

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

const selectClassName = cn(
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
);

export function AgentProspectForm({
  value,
  onChange,
}: {
  value: AgentProspectFormValue;
  onChange: (next: AgentProspectFormValue) => void;
}) {
  function patch<K extends keyof AgentProspectFormValue>(key: K, nextValue: AgentProspectFormValue[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Prospect au téléphone</CardTitle>
        <CardDescription>Saisissez les informations minimales pour qualifier et simuler sans quitter l’écran.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field
          id="agent-company-name"
          label="Société *"
          value={value.companyName}
          onChange={(next) => patch("companyName", next)}
          placeholder="Ex. Logistique du Sud"
        />
        <div className="space-y-1.5">
          <Label htmlFor="agent-civility">Civilité</Label>
          <select
            id="agent-civility"
            className={selectClassName}
            value={value.civility}
            onChange={(e) => patch("civility", e.target.value)}
          >
            {LEAD_CIVILITY_OPTIONS.map((o) => (
              <option key={o.value === "" ? "_empty" : o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          id="agent-contact-name"
          label="Contact *"
          value={value.contactName}
          onChange={(next) => patch("contactName", next)}
          placeholder="Ex. Martin"
        />
        <Field
          id="agent-phone"
          label="Téléphone *"
          value={value.phone}
          onChange={(next) => patch("phone", next)}
          placeholder="06 12 34 56 78"
          type="tel"
        />
        <Field
          id="agent-email"
          label="Email"
          value={value.email}
          onChange={(next) => patch("email", next)}
          placeholder="contact@societe.fr"
          type="email"
        />
        <div className="md:col-span-2">
          <Field
            id="agent-address"
            label="Adresse"
            value={value.address}
            onChange={(next) => patch("address", next)}
            placeholder="Adresse du site ou du siège"
          />
        </div>
        <Field
          id="agent-city"
          label="Ville"
          value={value.city}
          onChange={(next) => patch("city", next)}
          placeholder="Lyon"
        />
        <Field
          id="agent-postal-code"
          label="Code postal"
          value={value.postalCode}
          onChange={(next) => patch("postalCode", next)}
          placeholder="69000"
        />
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="agent-notes">Notes rapides</Label>
          <Textarea
            id="agent-notes"
            value={value.notes}
            onChange={(e) => patch("notes", e.target.value)}
            placeholder="Contexte d’appel, timing, objection, rappel clé..."
            className="min-h-24"
          />
        </div>
      </CardContent>
    </Card>
  );
}
