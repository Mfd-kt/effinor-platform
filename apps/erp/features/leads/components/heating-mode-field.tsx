"use client";

import type { HeatingMode } from "@/features/leads/lib/heating-modes";
import { HEATING_MODE_OPTIONS } from "@/features/leads/lib/heating-modes";
import { cn } from "@/lib/utils";

type HeatingModeFieldProps = {
  id?: string;
  value: HeatingMode[];
  onChange: (next: HeatingMode[]) => void;
  className?: string;
};

/**
 * Liste unique alignée sur le simulateur (`currentHeatingMode`) — une valeur dans `heating_type`.
 */
export function HeatingModeField({ id = "heating_type", value, onChange, className }: HeatingModeFieldProps) {
  const selected = value[0] ?? "";

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="sr-only">
        Mode de chauffage actuel
      </label>
      <select
        id={id}
        className="flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={selected}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? [v as HeatingMode] : []);
        }}
      >
        <option value="">Sélectionner…</option>
        {HEATING_MODE_OPTIONS.map(({ value: mode, label }) => (
          <option key={mode} value={mode}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
