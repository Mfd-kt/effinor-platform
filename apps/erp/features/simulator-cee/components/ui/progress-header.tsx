"use client";

import { cn } from "@/lib/utils";

type ProgressHeaderProps = {
  stepIndex: number;
  stepCount: number;
  label: string;
  /** Phase fonctionnelle pour l’en-tête contextuel (ex : « Qualification »). */
  phaseLabel?: string;
};

export function ProgressHeader({ stepIndex, stepCount, label, phaseLabel }: ProgressHeaderProps) {
  const pct = stepCount > 0 ? Math.round(((stepIndex + 1) / stepCount) * 100) : 0;
  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span className="font-medium text-violet-900">
          {phaseLabel ? <span className="opacity-70">{phaseLabel} • </span> : null}
          {label}
        </span>
        <span>
          Étape {stepIndex + 1} / {stepCount}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-violet-100">
        <div
          className={cn("h-full rounded-full bg-violet-500 transition-all duration-300")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
