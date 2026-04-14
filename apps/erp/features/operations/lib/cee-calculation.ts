import type { Json } from "@/types/database.types";

export type CeeSelectOption = { value: string; label: string };

/** Définition d’un champ de saisie pour une fiche CEE (stocké en JSON sur `cee_sheets.input_fields`). */
export type CeeInputFieldDef =
  | {
      key: string;
      label: string;
      type: "number";
      unit?: string;
      required?: boolean;
      step?: number;
      min?: number;
      max?: number;
    }
  | {
      key: string;
      label: string;
      type: "select";
      required?: boolean;
      options: CeeSelectOption[];
    };

export const CEE_CALCULATION_PROFILES = [
  "manual",
  "linear_single",
  "product_two",
  "coeff_zone_system_power",
] as const;
export type CeeCalculationProfile = (typeof CEE_CALCULATION_PROFILES)[number];

export function parseCeeInputFields(json: Json | null | undefined): CeeInputFieldDef[] {
  if (!json || !Array.isArray(json)) return [];
  const out: CeeInputFieldDef[] = [];
  for (const item of json) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const key = typeof o.key === "string" ? o.key.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!key || !label) continue;
    const t = o.type === "select" ? "select" : "number";
    if (t === "select") {
      const rawOpts = o.options;
      const options: CeeSelectOption[] = [];
      if (Array.isArray(rawOpts)) {
        for (const opt of rawOpts) {
          if (!opt || typeof opt !== "object") continue;
          const rec = opt as Record<string, unknown>;
          const value = typeof rec.value === "string" ? rec.value.trim() : "";
          const optLabel = typeof rec.label === "string" ? rec.label.trim() : "";
          if (value && optLabel) options.push({ value, label: optLabel });
        }
      }
      if (options.length === 0) continue;
      out.push({
        key,
        label,
        type: "select",
        required: o.required === true,
        options,
      });
    } else {
      out.push({
        key,
        label,
        type: "number",
        unit: typeof o.unit === "string" ? o.unit : undefined,
        required: o.required === true,
        step: typeof o.step === "number" ? o.step : undefined,
        min: typeof o.min === "number" ? o.min : undefined,
        max: typeof o.max === "number" ? o.max : undefined,
      });
    }
  }
  return out;
}

function parseConfig(json: Json | null | undefined): Record<string, unknown> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  return json as Record<string, unknown>;
}

function numFromInput(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export type CeeWarehouseInput = {
  zone: string;
  heating_system: string;
  power_kw: number;
};

function normalizeHeatingKey(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s === "convectif") return "convectif";
  if (s === "radiatif") return "radiatif";
  return null;
}

function kwhcOneLocal(
  coefficients: Record<string, Record<string, number>>,
  zoneRaw: unknown,
  heatingRaw: unknown,
  powerRaw: unknown,
): number | null {
  const zone = String(zoneRaw ?? "")
    .trim()
    .toUpperCase();
  const heat = normalizeHeatingKey(String(heatingRaw ?? ""));
  const P = numFromInput(powerRaw);
  if (!zone || !heat || P == null || P <= 0) return null;
  const row = coefficients[zone];
  if (!row || typeof row !== "object") return null;
  const coeff = Number(row[heat]);
  if (!Number.isFinite(coeff) || coeff < 0) return null;
  return coeff * P;
}

function parseCoefficientsTable(config: Record<string, unknown>): Record<string, Record<string, number>> | null {
  const c = config.coefficients;
  if (!c || typeof c !== "object" || Array.isArray(c)) return null;
  const out: Record<string, Record<string, number>> = {};
  for (const [z, row] of Object.entries(c as Record<string, unknown>)) {
    const zk = z.trim().toUpperCase();
    if (!zk || typeof row !== "object" || row === null || Array.isArray(row)) continue;
    const inner: Record<string, number> = {};
    for (const [hk, val] of Object.entries(row as Record<string, unknown>)) {
      const n = Number(val);
      if (Number.isFinite(n)) inner[hk.trim().toLowerCase()] = n;
    }
    if (Object.keys(inner).length > 0) out[zk] = inner;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function computeCoeffZoneSystemPower(
  config: Record<string, unknown>,
  values: Record<string, unknown>,
): number | null {
  const table = parseCoefficientsTable(config);
  if (!table) return null;

  const warehousesRaw = values.warehouses;
  if (Array.isArray(warehousesRaw) && warehousesRaw.length > 0) {
    let sum = 0;
    for (const w of warehousesRaw) {
      if (!w || typeof w !== "object" || Array.isArray(w)) return null;
      const o = w as Record<string, unknown>;
      const one = kwhcOneLocal(table, o.zone, o.heating_system, o.power_kw);
      if (one == null) return null;
      sum += one;
    }
    return sum;
  }

  return kwhcOneLocal(table, values.zone, values.heating_system, values.power_kw);
}

/**
 * Calcule la prime CEE en kWhc à partir du profil et des paramètres de la fiche.
 * - manual : pas de formule — la valeur vient de `manualKwhc` (saisie utilisateur).
 * - linear_single : kWhc = values[inputKey] × kwhcPerUnit
 * - product_two : kWhc = values[keyA] × values[keyB] × factorKwhc
 * - coeff_zone_system_power : table zone × (convectif|radiatif) × P (kW), ou somme sur `warehouses`.
 */
export function computeCeeKwhc(
  profile: string,
  config: Record<string, unknown>,
  values: Record<string, unknown>,
  manualKwhc?: number | null,
): number | null {
  if (profile === "manual") {
    if (manualKwhc != null && Number.isFinite(manualKwhc)) return manualKwhc;
    return null;
  }

  if (profile === "linear_single") {
    const inputKey = String(config.inputKey ?? "").trim();
    const per = Number(config.kwhcPerUnit ?? config.coefficientKwhc);
    if (!inputKey || !Number.isFinite(per)) return null;
    const v = numFromInput(values[inputKey]);
    if (v == null) return null;
    return v * per;
  }

  if (profile === "product_two") {
    const keyA = String(config.keyA ?? "").trim();
    const keyB = String(config.keyB ?? "").trim();
    const factor = Number(config.factorKwhc);
    if (!keyA || !keyB || !Number.isFinite(factor)) return null;
    const a = numFromInput(values[keyA]);
    const b = numFromInput(values[keyB]);
    if (a == null || b == null) return null;
    return a * b * factor;
  }

  if (profile === "coeff_zone_system_power") {
    return computeCoeffZoneSystemPower(config, values);
  }

  return null;
}

export function computeCeeKwhcFromSheet(
  sheet: {
    calculation_profile: string;
    calculation_config: Json;
    input_fields: Json;
  },
  values: Record<string, unknown>,
  manualKwhc?: number | null,
): number | null {
  return computeCeeKwhc(sheet.calculation_profile, parseConfig(sheet.calculation_config), values, manualKwhc);
}

/** Nettoie les entrées avant enregistrement (nombres, chaînes, tableau warehouses). */
export function sanitizeCeeInputValuesForSave(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(src)) {
    const key = k.trim();
    if (!key) continue;
    if (v === undefined || v === null) continue;
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
      continue;
    }
    if (typeof v === "string") {
      const t = v.trim();
      if (t !== "") out[key] = t;
      continue;
    }
    if (key === "warehouses" && Array.isArray(v)) {
      const cleaned: { zone: string; heating_system: string; power_kw: number }[] = [];
      for (const item of v) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const o = item as Record<string, unknown>;
        const zone = typeof o.zone === "string" ? o.zone.trim() : "";
        const heating_system =
          typeof o.heating_system === "string" ? o.heating_system.trim() : "";
        const power_kw = numFromInput(o.power_kw);
        if (zone && heating_system && power_kw != null && power_kw > 0) {
          cleaned.push({ zone, heating_system, power_kw });
        }
      }
      if (cleaned.length > 0) out.warehouses = cleaned;
    }
  }
  return out;
}
