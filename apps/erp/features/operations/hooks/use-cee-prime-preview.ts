"use client";

import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  computeCeeKwhcFromSheet,
} from "@/features/operations/lib/cee-calculation";
import { parseEuroPerKwhcFromNote } from "@/features/operations/lib/delegator-prime-rate";
import type { OperationInsertInput } from "@/features/operations/schemas/operation.schema";
import type { CeeSheetOption, DelegatorOption } from "@/features/operations/types";

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return { ...(v as Record<string, unknown>) };
}

/**
 * Aperçu kWhc et € calculés depuis la fiche CEE, les saisies et le taux du délégataire.
 */
export function useCeePrimePreview(
  form: UseFormReturn<OperationInsertInput>,
  options: { ceeSheets: CeeSheetOption[]; delegators: DelegatorOption[] },
) {
  const { ceeSheets, delegators } = options;
  const sheetId = useWatch({ control: form.control, name: "cee_sheet_id" });
  const delegatorId = useWatch({ control: form.control, name: "delegator_id" });
  const watchedInputValues = useWatch({ control: form.control, name: "cee_input_values" });
  const manualKwhc = useWatch({ control: form.control, name: "cee_kwhc_calculated" });

  const selected = useMemo(
    () => (sheetId ? ceeSheets.find((s) => s.id === sheetId) : undefined),
    [ceeSheets, sheetId],
  );

  const inputRecord = useMemo(() => asRecord(watchedInputValues ?? {}), [watchedInputValues]);

  const previewKwhc = useMemo(() => {
    if (!selected) return null;
    return computeCeeKwhcFromSheet(selected, inputRecord, manualKwhc ?? null);
  }, [selected, inputRecord, manualKwhc]);

  const delegatorEuroPerKwhc = useMemo(() => {
    const d = delegatorId ? delegators.find((x) => x.id === delegatorId) : undefined;
    return parseEuroPerKwhcFromNote(d?.prime_per_kwhc_note);
  }, [delegators, delegatorId]);

  const previewPrimeEuro = useMemo(() => {
    if (previewKwhc == null || delegatorEuroPerKwhc == null) return null;
    return previewKwhc * delegatorEuroPerKwhc;
  }, [previewKwhc, delegatorEuroPerKwhc]);

  const kwhcFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }),
    [],
  );

  const euroFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }),
    [],
  );

  return {
    hasCeeSheet: !!selected,
    previewKwhc,
    previewPrimeEuro,
    delegatorEuroPerKwhc,
    delegatorId: delegatorId ?? "",
    kwhcFormatter,
    euroFormatter,
  };
}
