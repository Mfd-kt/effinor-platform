"use client";

import { Check } from "lucide-react";

import type { TravauxClef } from "@/features/simulator-cee/domain/types";
import { cn } from "@/lib/utils";

const TRAVAUX_META: { key: TravauxClef; label: string; hint: string }[] = [
  { key: "combles", label: "Combles / toiture", hint: "Isolation des combles perdus ou aménagés" },
  { key: "murs", label: "Murs", hint: "Isolation par l’intérieur ou l’extérieur" },
  { key: "fenetres", label: "Fenêtres", hint: "Menuiseries performantes" },
  { key: "vmc", label: "VMC", hint: "Ventilation mécanique contrôlée" },
  { key: "chauffage", label: "Chauffage", hint: "Remplacement / optimisation du système" },
];

export function TravauxMultiselect({
  value,
  onChange,
}: {
  value: Partial<Record<TravauxClef, boolean>>;
  onChange: (next: Partial<Record<TravauxClef, boolean>>) => void;
}) {
  function toggle(k: TravauxClef) {
    onChange({ ...value, [k]: !value[k] });
  }

  return (
    <div className="grid gap-2">
      {TRAVAUX_META.map((m) => {
        const on = value[m.key] === true;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => toggle(m.key)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors",
              on
                ? "border-violet-600 bg-white shadow-sm"
                : "border-violet-100 bg-violet-50/40 hover:border-violet-200",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                on ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200 bg-white",
              )}
            >
              {on ? <Check className="h-4 w-4" /> : null}
            </span>
            <span>
              <span className="font-semibold text-slate-900">{m.label}</span>
              <span className="mt-0.5 block text-sm text-slate-600">{m.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
