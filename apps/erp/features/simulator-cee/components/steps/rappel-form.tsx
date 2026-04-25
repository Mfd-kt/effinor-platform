"use client";

import { Calendar } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SimulationRappel } from "@/features/simulator-cee/domain/types";

function formatRdv(value: SimulationRappel): string | null {
  if (!value.date || !value.heure) return null;
  const d = new Date(`${value.date}T${value.heure}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RappelForm({
  value,
  onChange,
}: {
  value: SimulationRappel;
  onChange: (next: SimulationRappel) => void;
}) {
  const formatted = formatRdv(value);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rp-date">Date de rappel</Label>
          <Input
            id="rp-date"
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            className="rounded-xl border-violet-200 bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rp-time">Heure</Label>
          <Input
            id="rp-time"
            type="time"
            value={value.heure}
            onChange={(e) => onChange({ ...value, heure: e.target.value })}
            className="rounded-xl border-violet-200 bg-white"
          />
        </div>
      </div>
      {formatted ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <Calendar className="h-4 w-4" aria-hidden />
          <span>
            <span className="font-semibold">RDV programmé :</span> {formatted}
          </span>
        </div>
      ) : null}
    </div>
  );
}
