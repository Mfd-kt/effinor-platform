"use client";

import type { TrancheRevenu } from "@/features/simulator-cee/domain/types";
import type { TrancheOption } from "@/features/simulator-cee/domain/plafonds";
import { cn } from "@/lib/utils";

export function TrancheSelector({
  value,
  onChange,
  options,
}: {
  value: TrancheRevenu | undefined;
  onChange: (v: TrancheRevenu) => void;
  options: TrancheOption[];
}) {
  return (
    <div className="grid gap-3">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-2xl border-2 px-4 py-3 text-left transition-colors",
              active
                ? "border-violet-600 bg-white shadow-sm"
                : "border-violet-100 bg-violet-50/40 hover:border-violet-200",
            )}
          >
            <div className="font-semibold text-slate-900">{opt.label}</div>
            <p className="mt-1 text-sm text-slate-600">{opt.hint}</p>
          </button>
        );
      })}
    </div>
  );
}
