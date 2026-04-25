"use client";

import { cn } from "@/lib/utils";

export type RadioOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type RadioCardProps<T extends string> = {
  value: T | undefined;
  onChange: (v: T) => void;
  options: RadioOption<T>[];
  name: string;
};

export function RadioCard<T extends string>({ value, onChange, options, name }: RadioCardProps<T>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            name={name}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-2xl border-2 px-4 py-3 text-left transition-colors",
              active
                ? "border-violet-600 bg-white shadow-sm"
                : "border-violet-100 bg-violet-50/40 hover:border-violet-200",
            )}
          >
            <div className="font-semibold text-slate-900">{opt.label}</div>
            {opt.description ? <p className="mt-1 text-sm text-slate-600">{opt.description}</p> : null}
          </button>
        );
      })}
    </div>
  );
}
