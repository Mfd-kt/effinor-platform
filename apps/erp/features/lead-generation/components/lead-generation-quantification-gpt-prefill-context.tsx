"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type QuantificationGptPrefillIntent = "good" | "review" | "out_of_target";

export type QuantificationGptPrefillPayload = {
  key: number;
  intent: QuantificationGptPrefillIntent;
  note: string;
};

type Ctx = {
  prefill: QuantificationGptPrefillPayload | null;
  applyGptPrefill: (intent: QuantificationGptPrefillIntent, note: string) => void;
};

const QuantificationGptPrefillContext = createContext<Ctx | null>(null);

export function LeadGenerationQuantificationGptPrefillProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<QuantificationGptPrefillPayload | null>(null);

  const applyGptPrefill = useCallback((intent: QuantificationGptPrefillIntent, note: string) => {
    setPrefill((prev) => ({
      key: (prev?.key ?? 0) + 1,
      intent,
      note,
    }));
  }, []);

  const value = useMemo(() => ({ prefill, applyGptPrefill }), [prefill, applyGptPrefill]);

  return <QuantificationGptPrefillContext.Provider value={value}>{children}</QuantificationGptPrefillContext.Provider>;
}

export function useQuantificationGptPrefillContext(): Ctx | null {
  return useContext(QuantificationGptPrefillContext);
}
