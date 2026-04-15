import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import {
  listTechnicalVisitTemplateOptions,
  type TechnicalVisitTemplateOption,
} from "@/features/technical-visits/templates/registry";

function mergeTemplateOptions(
  code: TechnicalVisitTemplateOption[],
  db: TechnicalVisitTemplateOption[],
): TechnicalVisitTemplateOption[] {
  const byKey = new Map<string, TechnicalVisitTemplateOption>();
  for (const o of code) {
    byKey.set(o.templateKey, {
      templateKey: o.templateKey,
      label: o.label,
      versions: [...o.versions],
    });
  }
  for (const o of db) {
    const existing = byKey.get(o.templateKey);
    if (existing) {
      const seen = new Set(existing.versions.map((v) => v.version));
      for (const v of o.versions) {
        if (!seen.has(v.version)) {
          existing.versions.push(v);
          seen.add(v.version);
        }
      }
      existing.versions.sort((a, b) => a.version - b.version);
    } else {
      byKey.set(o.templateKey, {
        templateKey: o.templateKey,
        label: o.label,
        versions: [...o.versions].sort((a, b) => a.version - b.version),
      });
    }
  }
  return [...byKey.values()].sort((a, b) => a.templateKey.localeCompare(b.templateKey, "fr"));
}

/**
 * Registry code + versions publiées (non archivées) du builder, pour selects admin fiche CEE.
 */
export async function getTechnicalVisitTemplateOptionsForAdmin(
  supabase: SupabaseClient<Database>,
): Promise<TechnicalVisitTemplateOption[]> {
  const codeOpts = listTechnicalVisitTemplateOptions();

  const { data: versionRows, error: vErr } = await supabase
    .from("technical_visit_template_versions")
    .select("template_id, version_number")
    .eq("status", "published");

  if (vErr) {
    console.warn("[getTechnicalVisitTemplateOptionsForAdmin]", vErr.message);
    return codeOpts;
  }
  if (!versionRows?.length) {
    return codeOpts;
  }

  const templateIds = [...new Set(versionRows.map((r) => r.template_id))];
  const { data: masters, error: mErr } = await supabase
    .from("technical_visit_templates")
    .select("id, template_key, label, is_active")
    .in("id", templateIds)
    .eq("is_active", true);

  if (mErr) {
    console.warn("[getTechnicalVisitTemplateOptionsForAdmin]", mErr.message);
    return codeOpts;
  }
  if (!masters?.length) {
    return codeOpts;
  }

  const masterById = new Map(masters.map((m) => [m.id, m]));
  const dbByKey = new Map<string, { label: string; versions: { version: number; label: string }[] }>();

  for (const row of versionRows) {
    const m = masterById.get(row.template_id);
    if (!m) continue;
    const key = m.template_key?.trim();
    if (!key) continue;
    const entry = dbByKey.get(key) ?? { label: m.label?.trim() || key, versions: [] };
    entry.versions.push({
      version: row.version_number,
      label: `v${row.version_number} — ${m.label?.trim() || key}`,
    });
    dbByKey.set(key, entry);
  }

  const dbOpts: TechnicalVisitTemplateOption[] = [...dbByKey.entries()].map(([templateKey, v]) => ({
    templateKey,
    label: v.label,
    versions: v.versions.sort((a, b) => a.version - b.version),
  }));

  return mergeTemplateOptions(codeOpts, dbOpts);
}
