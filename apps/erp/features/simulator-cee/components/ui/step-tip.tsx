"use client";

import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

export function StepTip({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-950">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
