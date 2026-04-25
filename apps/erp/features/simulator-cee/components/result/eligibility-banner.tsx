"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function EligibilityBanner({
  eligible,
  title,
  reasons,
  variant = "pac",
}: {
  eligible: boolean;
  title: string;
  reasons: string[];
  variant?: "pac" | "renov";
}) {
  const Icon = eligible ? CheckCircle2 : XCircle;
  const tone = eligible
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : variant === "pac"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-950";

  return (
    <div className={cn("rounded-2xl border-2 p-4", tone)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{title}</p>
          {reasons.length ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm opacity-90">
              {reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {!eligible ? (
        <p className="mt-3 flex items-center gap-2 text-xs opacity-80">
          <AlertTriangle className="h-4 w-4" />
          Ces motifs sont indicatifs pour orienter l’entretien commercial.
        </p>
      ) : null}
    </div>
  );
}
