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

export function HeatingModeField({ id = "heating_type", value, onChange, className }: HeatingModeFieldProps) {
  function toggle(mode: HeatingMode) {
    const next = new Set(value);
    if (next.has(mode)) {
      next.delete(mode);
    } else {
      next.add(mode);
    }
    onChange([...next]);
  }

  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="sr-only" id={`${id}-legend`}>
        Modes de chauffage
      </legend>
      <div
        className="flex flex-wrap gap-x-4 gap-y-2"
        role="group"
        aria-labelledby={`${id}-legend`}
      >
        {HEATING_MODE_OPTIONS.map(({ value: mode, label }) => (
          <label
            key={mode}
            htmlFor={`${id}-${mode}`}
            className="flex cursor-pointer items-center gap-2 text-sm leading-none"
          >
            <input
              id={`${id}-${mode}`}
              type="checkbox"
              checked={value.includes(mode)}
              onChange={() => toggle(mode)}
              className="size-4 rounded border-input accent-primary"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
