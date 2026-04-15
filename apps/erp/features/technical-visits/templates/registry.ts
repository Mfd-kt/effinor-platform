import type { Json } from "@/types/database.types";

import type { VisitTemplateSchema } from "./schema-types";
import { BAT_TH_142_V1 } from "./bat-th-142-v1";

const TEMPLATES: Record<string, Record<number, VisitTemplateSchema>> = {
  "BAT-TH-142": {
    1: BAT_TH_142_V1,
  },
};

/** Résout un template par clé + version. */
export function getVisitTemplate(
  key: string,
  version: number,
): VisitTemplateSchema | null {
  return TEMPLATES[key]?.[version] ?? null;
}

/** Dernière version disponible pour une clé de template. */
export function getLatestVisitTemplateVersion(key: string): number | null {
  const versions = TEMPLATES[key];
  if (!versions) return null;
  const nums = Object.keys(versions).map(Number).filter(Number.isFinite);
  return nums.length > 0 ? Math.max(...nums) : null;
}

/** Résout le template dans sa dernière version. */
export function getLatestVisitTemplate(key: string): VisitTemplateSchema | null {
  const v = getLatestVisitTemplateVersion(key);
  return v !== null ? getVisitTemplate(key, v) : null;
}

/**
 * Résolution unique pour persistance VT dynamique : clé, version, schéma et snapshot JSON.
 * Toute création / recopie de `visit_schema_snapshot_json` doit passer par cette fonction.
 */
export type ResolvedLatestVisitTemplate = {
  templateKey: string;
  version: number;
  schema: VisitTemplateSchema;
  visitSchemaSnapshotJson: Json;
};

export function resolveLatestVisitTemplateByKey(templateKey: string): ResolvedLatestVisitTemplate | null {
  const key = templateKey?.trim();
  if (!key) return null;
  const schema = getLatestVisitTemplate(key);
  if (!schema) return null;
  return {
    templateKey: key,
    version: schema.version,
    schema,
    visitSchemaSnapshotJson: JSON.parse(JSON.stringify(schema)) as Json,
  };
}

/**
 * Résolution explicite clé + version (config fiche CEE). Pas de fallback vers une autre version :
 * si la version est absente du registry, log + null.
 */
export function resolveVisitTemplateByKeyAndVersion(
  templateKey: string,
  version: number,
): ResolvedLatestVisitTemplate | null {
  const key = templateKey?.trim();
  if (!key || !Number.isFinite(version)) {
    console.warn("[visit-template] Clé ou version de template invalides.", { templateKey, version });
    return null;
  }
  const schema = getVisitTemplate(key, version);
  if (!schema) {
    console.warn(
      "[visit-template] Aucun template enregistré pour la clé / version demandées (pas de fallback silencieux).",
      { templateKey: key, version },
    );
    return null;
  }
  return {
    templateKey: key,
    version: schema.version,
    schema,
    visitSchemaSnapshotJson: JSON.parse(JSON.stringify(schema)) as Json,
  };
}

/** Liste des clés de template disponibles. */
export function listVisitTemplateKeys(): string[] {
  return Object.keys(TEMPLATES);
}

/** Clé réservée par le registry code (le builder DB ne doit pas les utiliser). */
export function isCodeRegistryTemplateKey(templateKey: string): boolean {
  const k = templateKey?.trim();
  if (!k) return false;
  return Object.prototype.hasOwnProperty.call(TEMPLATES, k);
}

/** Option d’UI admin : une clé de template et ses versions enregistrées dans le registry. */
export type TechnicalVisitTemplateOption = {
  templateKey: string;
  /** Libellé lisible (schéma v1 ou clé). */
  label: string;
  versions: { version: number; label: string }[];
};

/**
 * Source de vérité pour les selects ERP (fiche CEE → template VT).
 * Pas d’options en dur hors registry.
 */
export function listTechnicalVisitTemplateOptions(): TechnicalVisitTemplateOption[] {
  return listVisitTemplateKeys()
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((templateKey) => {
      const byVersion = TEMPLATES[templateKey];
      const versionNums = Object.keys(byVersion)
        .map(Number)
        .filter(Number.isFinite)
        .sort((x, y) => x - y);
      const firstSchema = versionNums.length > 0 ? byVersion[versionNums[0]!] : null;
      const label = firstSchema?.label?.trim() || templateKey;
      return {
        templateKey,
        label,
        versions: versionNums.map((v) => {
          const sch = byVersion[v];
          const vLabel = sch?.label?.trim() || label;
          return {
            version: v,
            label: `v${v} — ${vLabel}`,
          };
        }),
      };
    });
}
