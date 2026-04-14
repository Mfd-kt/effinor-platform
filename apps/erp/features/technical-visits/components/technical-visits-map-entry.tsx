"use client";

import dynamic from "next/dynamic";

import type { TechnicalVisitListRow } from "@/features/technical-visits/types";

const TechnicalVisitsMap = dynamic(
  () =>
    import("@/features/technical-visits/components/technical-visits-map").then((m) => m.TechnicalVisitsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[min(70vh,560px)] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Chargement de la carte…
      </div>
    ),
  },
);

export function TechnicalVisitsMapEntry({ visits }: { visits: TechnicalVisitListRow[] }) {
  return <TechnicalVisitsMap visits={visits} />;
}
