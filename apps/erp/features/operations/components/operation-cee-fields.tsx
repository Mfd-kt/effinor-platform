"use client";

import { useEffect, useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCeeInputFields } from "@/features/operations/lib/cee-calculation";
import type { OperationInsertInput } from "@/features/operations/schemas/operation.schema";
import type { BeneficiaryOption, CeeSheetOption } from "@/features/operations/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const PROFILE_HELP: Record<string, string> = {
  manual: "Saisie directe de la prime en kWhc.",
  linear_single: "Une grandeur × coefficient (défini sur la fiche).",
  product_two: "Deux grandeurs × facteur (défini sur la fiche).",
  coeff_zone_system_power:
    "Coefficient (zone climatique × convectif ou radiatif) × puissance P (kW). Somme sur plusieurs locaux si activé.",
};

type OperationCeeFieldsProps = {
  form: UseFormReturn<OperationInsertInput>;
  ceeSheets: CeeSheetOption[];
  beneficiaries: BeneficiaryOption[];
};

function asRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return { ...(v as Record<string, unknown>) };
}

type WarehouseRow = { zone: string; heating_system: string; power_kw?: number };

export function OperationCeeFields({ form, ceeSheets, beneficiaries }: OperationCeeFieldsProps) {
  const sheetId = useWatch({ control: form.control, name: "cee_sheet_id" });
  const beneficiaryId = useWatch({ control: form.control, name: "beneficiary_id" });
  const watchedInputValues = useWatch({ control: form.control, name: "cee_input_values" });

  const selected = useMemo(
    () => (sheetId ? ceeSheets.find((s) => s.id === sheetId) : undefined),
    [ceeSheets, sheetId],
  );

  const inputRecord = useMemo(() => asRecord(watchedInputValues ?? {}), [watchedInputValues]);

  const fieldDefs = useMemo(
    () => (selected ? parseCeeInputFields(selected.input_fields) : []),
    [selected],
  );

  const supportsMultiLocal = useMemo(() => {
    if (!selected) return false;
    const c = selected.calculation_config;
    if (!c || typeof c !== "object" || Array.isArray(c)) return false;
    return (c as Record<string, unknown>).supports_multi_local === true;
  }, [selected]);

  const isCoeffProfile = selected?.calculation_profile === "coeff_zone_system_power";
  const multiLocal =
    isCoeffProfile &&
    supportsMultiLocal &&
    Array.isArray(inputRecord.warehouses) &&
    (inputRecord.warehouses as unknown[]).length > 0;

  const zoneField = fieldDefs.find((f) => f.key === "zone" && f.type === "select");
  const heatField = fieldDefs.find((f) => f.key === "heating_system" && f.type === "select");

  const benClimateZone = useMemo(() => {
    const b = beneficiaries.find((x) => x.id === beneficiaryId);
    const z = b?.cee_climate_zone;
    return z && /^H[123]$/.test(z) ? z : null;
  }, [beneficiaries, beneficiaryId]);

  const setFlatCeeValues = (next: Record<string, unknown>) => {
    form.setValue("cee_input_values", next, { shouldValidate: true, shouldDirty: true });
  };

  const setSingleField = (key: string, value: string | number | undefined) => {
    const next = { ...inputRecord };
    delete next.warehouses;
    if (value === undefined || value === "") {
      delete next[key];
    } else {
      next[key] = value;
    }
    setFlatCeeValues(next);
  };

  useEffect(() => {
    if (!isCoeffProfile || !selected || !benClimateZone || !beneficiaryId) return;

    const prev = asRecord(form.getValues("cee_input_values"));

    if (multiLocal) {
      const w = prev.warehouses;
      if (!Array.isArray(w) || w.length === 0) return;
      const nextW = w.map((row) => {
        const o =
          row && typeof row === "object" && !Array.isArray(row)
            ? (row as Record<string, unknown>)
            : {};
        return { ...o, zone: benClimateZone };
      });
      const prevZones = w.map((row) =>
        row && typeof row === "object" && !Array.isArray(row)
          ? String((row as Record<string, unknown>).zone ?? "")
          : "",
      );
      const nextZones = nextW.map((row) => String(row.zone ?? ""));
      if (prevZones.join("|") === nextZones.join("|")) return;
      setFlatCeeValues({ ...prev, warehouses: nextW });
      return;
    }

    const flat = { ...prev };
    delete flat.warehouses;
    if (flat.zone === benClimateZone) return;
    setFlatCeeValues({ ...flat, zone: benClimateZone });
    // Sync zone (H1/H2/H3) quand bénéficiaire, fiche CEE ou mode multi-locaux change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setFlatCeeValues + getValues : pas besoin de tout lister
  }, [beneficiaryId, benClimateZone, isCoeffProfile, multiLocal, selected?.id]);

  const toggleMultiLocal = (checked: boolean) => {
    const z = benClimateZone ?? "";
    if (checked) {
      setFlatCeeValues({
        warehouses: [{ zone: z, heating_system: "convectif", power_kw: undefined }],
      });
    } else {
      setFlatCeeValues({
        zone: z,
        heating_system: "convectif",
        power_kw: undefined,
      });
    }
  };

  const warehouses: WarehouseRow[] = useMemo(() => {
    const w = inputRecord.warehouses;
    if (!Array.isArray(w)) return [];
    return w.map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        return { zone: "", heating_system: "convectif" };
      }
      const o = row as Record<string, unknown>;
      const power = o.power_kw;
      const power_kw =
        typeof power === "number" && Number.isFinite(power)
          ? power
          : typeof power === "string" && power.trim() !== ""
            ? Number(power.replace(",", "."))
            : undefined;
      return {
        zone: typeof o.zone === "string" ? o.zone : "",
        heating_system: typeof o.heating_system === "string" ? o.heating_system : "convectif",
        power_kw: Number.isFinite(power_kw) ? power_kw : undefined,
      };
    });
  }, [inputRecord.warehouses]);

  const updateWarehouseRow = (index: number, patch: Partial<WarehouseRow>) => {
    const nextRows = warehouses.map((r, i) => (i === index ? { ...r, ...patch } : r));
    setFlatCeeValues({ warehouses: nextRows });
  };

  const addWarehouseRow = () => {
    const z = benClimateZone ?? "";
    setFlatCeeValues({
      warehouses: [...warehouses, { zone: z, heating_system: "convectif", power_kw: undefined }],
    });
  };

  const removeWarehouseRow = (index: number) => {
    const nextRows = warehouses.filter((_, i) => i !== index);
    if (nextRows.length === 0) {
      toggleMultiLocal(false);
      return;
    }
    setFlatCeeValues({ warehouses: nextRows });
  };

  const renderField = (def: (typeof fieldDefs)[number]) => {
    if (def.type === "select") {
      const v =
        inputRecord[def.key] === undefined || inputRecord[def.key] === null
          ? ""
          : String(inputRecord[def.key]);
      return (
        <div key={def.key} className="space-y-2">
          <Label htmlFor={`cee_in_${def.key}`}>
            {def.label}
            {def.required ? " *" : ""}
          </Label>
          <select
            id={`cee_in_${def.key}`}
            className={selectClassName}
            value={v}
            onChange={(e) => {
              const raw = e.target.value;
              setSingleField(def.key, raw === "" ? undefined : raw);
            }}
          >
            <option value="">—</option>
            {def.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {def.key === "zone" && benClimateZone ? (
            <p className="text-xs text-muted-foreground">
              Valeur proposée depuis le bénéficiaire (zone enregistrée ou code postal de l’adresse des
              travaux).
            </p>
          ) : null}
        </div>
      );
    }

    const rawVal = inputRecord[def.key];
    const strVal =
      rawVal === undefined || rawVal === null
        ? ""
        : typeof rawVal === "number"
          ? String(rawVal)
          : String(rawVal);

    return (
      <div key={def.key} className="space-y-2">
        <Label htmlFor={`cee_in_${def.key}`}>
          {def.label}
          {def.unit ? ` (${def.unit})` : ""}
          {def.required ? " *" : ""}
        </Label>
        <Input
          id={`cee_in_${def.key}`}
          type="number"
          inputMode="decimal"
          step={def.step ?? "any"}
          min={def.min}
          max={def.max}
          value={strVal}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "" || raw === "-") {
              setSingleField(def.key, undefined);
            } else {
              const n = parseFloat(raw.replace(",", "."));
              if (Number.isFinite(n)) setSingleField(def.key, n);
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="md:col-span-2 space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="space-y-2">
        <Label htmlFor="cee_sheet_id">Fiche CEE (référentiel)</Label>
        <p className="text-xs text-muted-foreground">
          Choisissez une fiche pour calculer la prime en kWhc, ou laissez vide et saisissez un code à la main
          (dossiers historiques).
        </p>
        <select
          id="cee_sheet_id"
          className={selectClassName}
          value={sheetId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            form.setValue("cee_sheet_id", v === "" ? null : v, { shouldValidate: true });
            if (v === "") {
              form.setValue("cee_input_values", {});
              form.setValue("cee_kwhc_calculated", undefined);
            } else {
              const sh = ceeSheets.find((s) => s.id === v);
              if (sh) {
                form.setValue("cee_sheet_code", sh.code);
                form.setValue("cee_input_values", {});
                form.setValue("cee_kwhc_calculated", undefined);
              }
            }
          }}
        >
          <option value="">— Aucune (code manuel) —</option>
          {ceeSheets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.label}
            </option>
          ))}
        </select>
        {form.formState.errors.cee_sheet_id ? (
          <p className="text-sm text-destructive">{form.formState.errors.cee_sheet_id.message}</p>
        ) : null}
      </div>

      {selected ? (
        <div className="space-y-4">
          <div className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Code fiche (synchronisé)</span>
            <span className="font-mono text-foreground">{selected.code}</span>
            {PROFILE_HELP[selected.calculation_profile] ? (
              <p className="text-xs text-muted-foreground">{PROFILE_HELP[selected.calculation_profile]}</p>
            ) : null}
          </div>

          {selected.calculation_profile === "manual" ? (
            <div className="space-y-2">
              <Label htmlFor="cee_kwhc_calculated">Prime CEE (kWhc)</Label>
              <Input
                id="cee_kwhc_calculated"
                inputMode="decimal"
                {...form.register("cee_kwhc_calculated")}
                placeholder="0"
              />
            </div>
          ) : (
            <>
              {isCoeffProfile && supportsMultiLocal ? (
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-border/50 bg-background/60 px-3 py-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={multiLocal}
                      onChange={(e) => toggleMultiLocal(e.target.checked)}
                    />
                    Plusieurs locaux / entrepôts (somme des kWhc)
                  </label>
                </div>
              ) : null}

              {multiLocal && zoneField?.type === "select" && heatField?.type === "select" ? (
                <div className="space-y-4">
                  {benClimateZone ? (
                    <p className="text-xs text-muted-foreground">
                      Zone climatique préremplie depuis le bénéficiaire pour chaque local (modifiable si
                      besoin).
                    </p>
                  ) : null}
                  {warehouses.map((row, idx) => (
                    <div
                      key={idx}
                      className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">Local / entrepôt {idx + 1}</span>
                        {warehouses.length > 1 ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeWarehouseRow(idx)}>
                            Retirer
                          </Button>
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Zone climatique *</Label>
                          <select
                            className={selectClassName}
                            value={row.zone}
                            onChange={(e) => updateWarehouseRow(idx, { zone: e.target.value })}
                          >
                            <option value="">—</option>
                            {zoneField.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Type de chauffage *</Label>
                          <select
                            className={selectClassName}
                            value={row.heating_system}
                            onChange={(e) => updateWarehouseRow(idx, { heating_system: e.target.value })}
                          >
                            {heatField.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Puissance nominale P (kW) *</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min={0}
                          value={row.power_kw === undefined ? "" : String(row.power_kw)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "" || raw === "-") {
                              updateWarehouseRow(idx, { power_kw: undefined });
                            } else {
                              const n = parseFloat(raw.replace(",", "."));
                              if (Number.isFinite(n)) updateWarehouseRow(idx, { power_kw: n });
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addWarehouseRow}>
                    + Ajouter un local
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">{fieldDefs.map((def) => renderField(def))}</div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cee_sheet_code">Code fiche CEE (manuel) *</Label>
            <Input id="cee_sheet_code" {...form.register("cee_sheet_code")} className="font-mono" />
            {form.formState.errors.cee_sheet_code ? (
              <p className="text-sm text-destructive">{form.formState.errors.cee_sheet_code.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cee_kwhc_calculated_legacy">Prime CEE saisie (kWhc), optionnel</Label>
            <Input
              id="cee_kwhc_calculated_legacy"
              inputMode="decimal"
              {...form.register("cee_kwhc_calculated")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
