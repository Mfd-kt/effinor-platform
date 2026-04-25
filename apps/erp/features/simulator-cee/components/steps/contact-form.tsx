"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SimulationContact } from "@/features/simulator-cee/domain/types";

const CIVILITY_OPTIONS = [
  { value: "M.", label: "M." },
  { value: "Mme", label: "Mme" },
  { value: "Autre", label: "Autre" },
];

export function ContactForm({
  value,
  onChange,
}: {
  value: SimulationContact;
  onChange: (next: SimulationContact) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Civilité</Label>
        <div className="flex flex-wrap gap-2">
          {CIVILITY_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ ...value, civilite: c.value })}
              className={
                value.civilite === c.value
                  ? "rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-violet-200 bg-white px-4 py-1.5 text-sm text-slate-700"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ct-prenom">Prénom</Label>
          <Input
            id="ct-prenom"
            value={value.prenom}
            onChange={(e) => onChange({ ...value, prenom: e.target.value })}
            className="rounded-xl border-violet-200 bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ct-nom">Nom</Label>
          <Input
            id="ct-nom"
            value={value.nom}
            onChange={(e) => onChange({ ...value, nom: e.target.value })}
            className="rounded-xl border-violet-200 bg-white"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ct-email">E-mail</Label>
        <Input
          id="ct-email"
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          className="rounded-xl border-violet-200 bg-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ct-tel">Téléphone</Label>
        <Input
          id="ct-tel"
          type="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          value={value.telephone}
          onChange={(e) => onChange({ ...value, telephone: e.target.value })}
          className="rounded-xl border-violet-200 bg-white"
        />
      </div>
    </div>
  );
}
