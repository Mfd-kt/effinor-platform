import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database.types";
import {
  getVisitTemplate,
  resolveVisitTemplateByKeyAndVersion,
  type ResolvedLatestVisitTemplate,
} from "@/features/technical-visits/templates/registry";
import { safeParseVisitTemplateForRuntime } from "@/features/technical-visits/template-builder/schemas/visit-template-builder.schema";

/**
 * Résout template clé + version : registry code en priorité, puis version publiée en base (builder).
 */
export async function resolveVisitTemplateByKeyAndVersionUnified(
  supabase: SupabaseClient<Database>,
  templateKey: string,
  version: number,
): Promise<ResolvedLatestVisitTemplate | null> {
  const codeResolved = resolveVisitTemplateByKeyAndVersion(templateKey, version);
  if (codeResolved) {
    return codeResolved;
  }

  const key = templateKey?.trim();
  if (!key || !Number.isFinite(version)) {
    return null;
  }

  const { data: master, error: masterErr } = await supabase
    .from("technical_visit_templates")
    .select("id")
    .eq("template_key", key)
    .eq("is_active", true)
    .maybeSingle();

  if (masterErr || !master?.id) {
    return null;
  }

  const { data: row, error: verErr } = await supabase
    .from("technical_visit_template_versions")
    .select("schema_json, version_number, status")
    .eq("template_id", master.id)
    .eq("version_number", version)
    .eq("status", "published")
    .maybeSingle();

  if (verErr || !row?.schema_json) {
    return null;
  }

  const schema = safeParseVisitTemplateForRuntime(row.schema_json);
  if (!schema) {
    return null;
  }

  return {
    templateKey: key,
    version: row.version_number,
    schema,
    visitSchemaSnapshotJson: JSON.parse(JSON.stringify(schema)) as Json,
  };
}

/** Pour la fiche VT : snapshot, puis code, puis DB. */
export async function getVisitTemplateSchemaForDetailUnified(
  supabase: SupabaseClient<Database>,
  snapshot: Json | null | undefined,
  templateKey: string | null | undefined,
  templateVersion: number | null | undefined,
): Promise<import("@/features/technical-visits/templates/schema-types").VisitTemplateSchema | null> {
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    const fromSnap = safeParseVisitTemplateForRuntime(snapshot);
    if (fromSnap) return fromSnap;
  }
  const key = templateKey?.trim();
  const v = templateVersion;
  if (!key || v == null || !Number.isFinite(v)) {
    return null;
  }
  const fromCode = getVisitTemplate(key, v);
  if (fromCode) return fromCode;
  const resolved = await resolveVisitTemplateByKeyAndVersionUnified(supabase, key, v);
  return resolved?.schema ?? null;
}
