import { z } from "zod";

import { normalizeBuildingTypeForLead } from "@/features/leads/lib/building-types";
import { normalizeLeadCivilityFromText } from "@/features/leads/lib/civility-options";
import { HEATING_MODE_VALUES, type HeatingMode } from "@/features/leads/lib/heating-modes";
import { normalizeProductInterestLabel } from "@/features/leads/lib/normalize-product-interest";
import type { LeadInsertInput } from "@/features/leads/schemas/lead.schema";

export { normalizeProductInterestLabel };

/** Schéma aligné sur la section 9 du prompt d’analyse d’appel. */
const ErpJsonBlockSchema = z
  .object({
    company_name: z.string().optional(),
    civility: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    contact_role: z.string().optional(),
    siret: z.string().optional(),
    head_office_address: z.string().optional(),
    head_office_postal_code: z.string().optional(),
    head_office_city: z.string().optional(),
    worksite_address: z.string().optional(),
    worksite_postal_code: z.string().optional(),
    worksite_city: z.string().optional(),
    surface_m2: z.union([z.string(), z.number()]).optional(),
    ceiling_height_m: z.union([z.string(), z.number()]).optional(),
    building_type: z.string().optional(),
    heated_building: z.string().optional(),
    heating_type: z.union([z.string(), z.array(z.string())]).optional(),
    warehouse_count: z.union([z.string(), z.number()]).optional(),
    /** Intérêt produit / thématique CEE (ex. LED, déstratification, étude thermique). */
    product_interest: z.string().optional(),
    qualification_notes: z.string().optional(),
    ai_lead_summary: z.string().optional(),
    ai_lead_score: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export type ParsedRecordingErpFields = z.infer<typeof ErpJsonBlockSchema>;

function parseNumericString(raw: string | number | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseScore(raw: string | number | undefined): number | undefined {
  const n = parseNumericString(raw);
  if (n === undefined) return undefined;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function mapHeatedBuilding(raw: string | undefined): boolean | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toLowerCase();
  if (t === "oui" || t === "yes" || t === "true" || t === "1") return true;
  if (t === "non" || t === "no" || t === "false" || t === "0") return false;
  return null;
}

function heatingModesFromFreeText(raw: string): HeatingMode[] | undefined {
  const t = raw.toLowerCase();
  const found = new Set<HeatingMode>();
  if (/\bgaz\b|gaz\s| au gaz/i.test(t)) found.add("gaz");
  if (/fioul|fuel/i.test(t)) found.add("fioul");
  if (/air\s*[-\/]\s*air|air\s+air|pac\s+air\s*[-\/]\s*air|pompe.*air.*air/i.test(t)) {
    found.add("pac_air_air");
  } else if (/air\s*[-\/]\s*eau|air\s+eau|pompe.*air.*eau/i.test(t)) {
    found.add("pac_air_eau");
  } else if (/\bpac\b|pompe à chaleur|pompe a chaleur/i.test(t)) {
    found.add("pac");
  }
  if (/électric|electr/i.test(t)) found.add("electricite");
  if (/autre|mixte|bois|charbon/i.test(t) && found.size === 0) found.add("autres");
  const arr = [...found].filter((m) => HEATING_MODE_VALUES.includes(m));
  return arr.length ? arr : undefined;
}

function normalizeHeatingType(raw: ParsedRecordingErpFields["heating_type"]): HeatingMode[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    const modes = raw.filter((s): s is HeatingMode =>
      typeof s === "string" && (HEATING_MODE_VALUES as readonly string[]).includes(s),
    );
    return modes.length ? modes : undefined;
  }
  const s = String(raw).trim();
  if (!s) return undefined;
  const fromCodes = s
    .split(/[,;/]/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .map((x) => {
      if (x === "gaz") return "gaz" as const;
      if (x === "fioul") return "fioul" as const;
      if (x === "pac") return "pac" as const;
      if (x === "pac_air_air") return "pac_air_air" as const;
      if (x === "pac_air_eau") return "pac_air_eau" as const;
      if (x === "electricite" || x === "électricité") return "electricite" as const;
      if (x === "autres") return "autres" as const;
      return null;
    })
    .filter((x): x is HeatingMode => x !== null);
  if (fromCodes.length) return [...new Set(fromCodes)];
  return heatingModesFromFreeText(s);
}

/**
 * Extrait le bloc JSON final (section 9) et le texte markdown affichable (sans ce bloc).
 */
export function splitRecordingAnalysisOutput(raw: string): {
  markdown: string;
  erp: ParsedRecordingErpFields | null;
} {
  const text = raw.trimEnd();

  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  if (fences.length) {
    const last = fences[fences.length - 1];
    const inner = last[1]?.trim() ?? "";
    const idx = last.index ?? 0;
    try {
      const parsed = JSON.parse(inner);
      const erpParsed = ErpJsonBlockSchema.safeParse(parsed);
      const markdown = text.slice(0, idx).trimEnd();
      return {
        markdown,
        erp: erpParsed.success ? erpParsed.data : null,
      };
    } catch {
      /* essai suivant : bloc JSON brut en fin de texte */
    }
  }

  const start = text.lastIndexOf("{");
  if (start === -1) {
    return { markdown: text, erp: null };
  }

  let depth = 0;
  for (let j = start; j < text.length; j++) {
    const c = text[j];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        const jsonStr = text.slice(start, j + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          const erpParsed = ErpJsonBlockSchema.safeParse(parsed);
          const markdown = text.slice(0, start).trimEnd();
          return {
            markdown,
            erp: erpParsed.success ? erpParsed.data : null,
          };
        } catch {
          return { markdown: text, erp: null };
        }
      }
    }
  }

  return { markdown: text, erp: null };
}

/** Transforme le JSON ERP en champs formulaire / base (remplissage partiel). */
export function erpJsonToLeadFill(erp: ParsedRecordingErpFields | null): Partial<LeadInsertInput> {
  if (!erp) {
    return {};
  }

  const surface = parseNumericString(erp.surface_m2);
  const ceiling = parseNumericString(erp.ceiling_height_m);
  const warehouse =
    typeof erp.warehouse_count === "number"
      ? Number.isInteger(erp.warehouse_count)
        ? erp.warehouse_count
        : undefined
      : parseNumericString(erp.warehouse_count);
  const wh = warehouse !== undefined && Number.isInteger(warehouse) && warehouse >= 0 ? warehouse : undefined;

  const heatedBool = mapHeatedBuilding(erp.heated_building);
  const heating = normalizeHeatingType(erp.heating_type);

  let summary = (erp.ai_lead_summary ?? "").trim();
  const qual = (erp.qualification_notes ?? "").trim();
  if (qual) {
    summary = summary ? `${summary}\n\n— Qualification —\n${qual}` : `— Qualification —\n${qual}`;
  }

  const score = parseScore(erp.ai_lead_score);

  const out: Partial<LeadInsertInput> = {};

  const str = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);

  if (str(erp.company_name)) out.company_name = str(erp.company_name);
  const civ = normalizeLeadCivilityFromText(erp.civility);
  if (civ) out.civility = civ;
  if (str(erp.first_name)) out.first_name = str(erp.first_name);
  if (str(erp.last_name)) out.last_name = str(erp.last_name);
  if (str(erp.phone)) out.phone = str(erp.phone);
  if (str(erp.email)) out.email = str(erp.email);
  if (str(erp.contact_role)) out.contact_role = str(erp.contact_role);
  if (str(erp.siret)) out.siret = str(erp.siret);
  if (str(erp.head_office_address)) out.head_office_address = str(erp.head_office_address);
  if (str(erp.head_office_postal_code)) out.head_office_postal_code = str(erp.head_office_postal_code);
  if (str(erp.head_office_city)) out.head_office_city = str(erp.head_office_city);
  if (str(erp.worksite_address)) out.worksite_address = str(erp.worksite_address);
  if (str(erp.worksite_postal_code)) out.worksite_postal_code = str(erp.worksite_postal_code);
  if (str(erp.worksite_city)) out.worksite_city = str(erp.worksite_city);
  if (surface !== undefined) out.surface_m2 = surface;
  if (ceiling !== undefined) out.ceiling_height_m = ceiling;
  if (str(erp.building_type)) {
    const bt = normalizeBuildingTypeForLead(str(erp.building_type)!);
    if (bt) out.building_type = bt;
  }
  if (heatedBool !== null) out.heated_building = heatedBool;
  if (heating?.length) out.heating_type = heating;
  if (wh !== undefined) out.warehouse_count = wh;
  if (str(erp.product_interest)) {
    out.product_interest = normalizeProductInterestLabel(str(erp.product_interest)!);
  }
  if (summary) out.ai_lead_summary = summary;
  if (score !== undefined) out.ai_lead_score = score;

  return out;
}
