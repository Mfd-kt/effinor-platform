"use client";

import { cn } from "@/lib/utils";

type Option<T> = { value: T; label: string };

export function YesNo({
  value,
  onChange,
  yesLabel = "Oui",
  noLabel = "Non",
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  const opts: Option<boolean>[] = [
    { value: true, label: yesLabel },
    { value: false, label: noLabel },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {opts.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-2xl border-2 px-4 py-3 text-center font-semibold transition-colors",
              active
                ? "border-violet-600 bg-white text-violet-950 shadow-sm"
                : "border-violet-100 bg-violet-50/40 text-slate-700 hover:border-violet-200",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function YesNoUnknown<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-2xl border-2 px-4 py-3 text-center font-semibold transition-colors",
              active
                ? "border-violet-600 bg-white text-violet-950 shadow-sm"
                : "border-violet-100 bg-violet-50/40 text-slate-700 hover:border-violet-200",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
