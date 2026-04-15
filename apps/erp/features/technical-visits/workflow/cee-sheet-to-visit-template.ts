import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import {
  resolveLatestVisitTemplateByKey,
  resolveVisitTemplateByKeyAndVersion,
  type ResolvedLatestVisitTemplate,
} from "@/features/technical-visits/templates/registry";
import { resolveVisitTemplateByKeyAndVersionUnified } from "@/features/technical-visits/workflow/resolve-visit-template-unified";

/**
 * Données fiche CEE nécessaires pour résoudre le template VT.
 * La source métier cible est `technical_visit_template_*` sur `cee_sheets`.
 */
export type CeeSheetForVisitTemplateResolution = Pick<
  Database["public"]["Tables"]["cee_sheets"]["Row"],
  | "code"
  | "label"
  | "simulator_key"
  | "technical_visit_template_key"
  | "technical_visit_template_version"
>;

/** @deprecated Utiliser `ResolvedLatestVisitTemplate` depuis le registry. */
export type ResolvedWorkflowVisitTemplate = ResolvedLatestVisitTemplate;

/**
 * Correspondance legacy `cee_sheets.code` / `simulator_key` → clé de template.
 *
 * TODO(transition): à retirer une fois toutes les fiches concernées renseignées en base
 * (`technical_visit_template_key` / `technical_visit_template_version`) et le backfill validé.
 * Ne pas supprimer avant audit des environnements (prod / préprod).
 */
const LEGACY_CEE_SHEET_CODE_TO_TEMPLATE_KEY: Record<string, string> = {
  DESTRAT: "BAT-TH-142",
  /** Libellé courant en base pour la fiche déstrat (cf. `cee_sheets.code`). */
  "DESTRATIFICATEUR D'AIR": "BAT-TH-142",
};

function normalizeCeeSheetCode(code: string): string {
  return code
    .trim()
    .replace(/\u2018|\u2019/g, "'")
    .toUpperCase();
}

/**
 * Fallback transitoire : même logique qu’avant l’introduction des colonnes sur `cee_sheets`.
 * Appelé uniquement si `technical_visit_template_key` / version sont NULL.
 */
function resolveLegacyVisitTemplateForCeeSheet(
  sheet: Pick<CeeSheetForVisitTemplateResolution, "code" | "simulator_key"> | null | undefined,
): ResolvedLatestVisitTemplate | null {
  const raw = sheet?.code?.trim();
  if (raw) {
    const normalized = normalizeCeeSheetCode(raw);
    const templateKey = LEGACY_CEE_SHEET_CODE_TO_TEMPLATE_KEY[normalized] ?? null;
    if (templateKey) return resolveLatestVisitTemplateByKey(templateKey);
  }

  const sim = sheet?.simulator_key?.trim().toLowerCase();
  if (sim === "destrat") {
    return resolveLatestVisitTemplateByKey("BAT-TH-142");
  }

  return null;
}

/**
 * Résout le gabarit dynamique à partir de la fiche CEE.
 *
 * Ordre :
 * 1. Colonnes `cee_sheets.technical_visit_template_key` + `technical_visit_template_version` (explicites).
 *    Si la version n’existe pas dans le registry → null (pas de fallback legacy ni autre version).
 * 2. Sinon, fallback legacy (mapping code / simulator_key) — **transitoire**.
 * 3. Sinon → null.
 */
export function resolveVisitTemplateForCeeSheet(
  sheet: CeeSheetForVisitTemplateResolution | null | undefined,
): ResolvedLatestVisitTemplate | null {
  const key = sheet?.technical_visit_template_key?.trim() ?? "";
  const version = sheet?.technical_visit_template_version;

  if (key && version != null) {
    return resolveVisitTemplateByKeyAndVersion(key, version);
  }

  return resolveLegacyVisitTemplateForCeeSheet(sheet);
}

/**
 * Résolution complète (registry code + templates publiés builder en base).
 * À utiliser pour création VT, écrans serveur et validation admin.
 */
export async function resolveVisitTemplateForCeeSheetAsync(
  supabase: SupabaseClient<Database>,
  sheet: CeeSheetForVisitTemplateResolution | null | undefined,
): Promise<ResolvedLatestVisitTemplate | null> {
  const key = sheet?.technical_visit_template_key?.trim() ?? "";
  const version = sheet?.technical_visit_template_version;

  if (key && version != null) {
    return resolveVisitTemplateByKeyAndVersionUnified(supabase, key, version);
  }

  return resolveLegacyVisitTemplateForCeeSheet(sheet);
}
