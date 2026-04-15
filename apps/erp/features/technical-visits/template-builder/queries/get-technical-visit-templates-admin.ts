import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type TechnicalVisitTemplateAdminListItem = {
  id: string;
  template_key: string;
  label: string;
  description: string | null;
  cee_sheet_id: string | null;
  cee_sheet_label: string | null;
  is_active: boolean;
  updated_at: string;
  latest_published_version: number | null;
  latest_published_at: string | null;
  draft_exists: boolean;
};

export async function getTechnicalVisitTemplatesAdminList(
  supabase: SupabaseClient<Database>,
): Promise<TechnicalVisitTemplateAdminListItem[]> {
  const { data: masters, error } = await supabase
    .from("technical_visit_templates")
    .select("id, template_key, label, description, cee_sheet_id, is_active, updated_at")
    .order("template_key", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  if (!masters?.length) {
    return [];
  }

  const sheetIds = [...new Set(masters.map((m) => m.cee_sheet_id).filter(Boolean))] as string[];
  const sheetLabels = new Map<string, string>();
  if (sheetIds.length > 0) {
    const { data: sheets } = await supabase
      .from("cee_sheets")
      .select("id, label")
      .in("id", sheetIds);
    for (const s of sheets ?? []) {
      sheetLabels.set(s.id, s.label);
    }
  }

  const { data: allVersions } = await supabase
    .from("technical_visit_template_versions")
    .select("template_id, version_number, status, published_at")
    .in(
      "template_id",
      masters.map((m) => m.id),
    );

  const byTemplate = new Map<string, typeof allVersions>();
  for (const v of allVersions ?? []) {
    const list = byTemplate.get(v.template_id) ?? [];
    list.push(v);
    byTemplate.set(v.template_id, list);
  }

  return masters.map((m) => {
    const vers = byTemplate.get(m.id) ?? [];
    const published = vers.filter((v) => v.status === "published");
    const latestPub =
      published.length > 0
        ? published.reduce((a, b) => (b.version_number > a.version_number ? b : a))
        : null;
    return {
      id: m.id,
      template_key: m.template_key,
      label: m.label,
      description: m.description,
      cee_sheet_id: m.cee_sheet_id,
      cee_sheet_label: m.cee_sheet_id ? sheetLabels.get(m.cee_sheet_id) ?? null : null,
      is_active: m.is_active,
      updated_at: m.updated_at,
      latest_published_version: latestPub?.version_number ?? null,
      latest_published_at: latestPub?.published_at ?? null,
      draft_exists: vers.some((v) => v.status === "draft"),
    };
  });
}

export type TechnicalVisitTemplateVersionRow = {
  id: string;
  version_number: number;
  status: string;
  published_at: string | null;
  updated_at: string;
};

export async function getTechnicalVisitTemplateDetailForAdmin(
  supabase: SupabaseClient<Database>,
  templateId: string,
): Promise<{
  master: Database["public"]["Tables"]["technical_visit_templates"]["Row"];
  versions: TechnicalVisitTemplateVersionRow[];
} | null> {
  const { data: master, error } = await supabase
    .from("technical_visit_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (error || !master) {
    return null;
  }

  const { data: versions } = await supabase
    .from("technical_visit_template_versions")
    .select("id, version_number, status, published_at, updated_at")
    .eq("template_id", templateId)
    .order("version_number", { ascending: false });

  return {
    master,
    versions: versions ?? [],
  };
}

export async function getTechnicalVisitTemplateVersionForEditor(
  supabase: SupabaseClient<Database>,
  versionId: string,
): Promise<{
  version: Database["public"]["Tables"]["technical_visit_template_versions"]["Row"];
  master: Database["public"]["Tables"]["technical_visit_templates"]["Row"];
} | null> {
  const { data: version, error } = await supabase
    .from("technical_visit_template_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (error || !version) {
    return null;
  }

  const { data: master, error: mErr } = await supabase
    .from("technical_visit_templates")
    .select("*")
    .eq("id", version.template_id)
    .maybeSingle();

  if (mErr || !master) {
    return null;
  }

  return { version, master };
}

/** Pour le bouton « modifier » depuis une version publiée (même template, pas nouvelle fiche). */
export async function getTechnicalVisitTemplateDraftEligibility(
  supabase: SupabaseClient<Database>,
  templateId: string,
): Promise<{
  draftExists: boolean;
  latestPublished: { id: string; version_number: number } | null;
}> {
  const { data: rows } = await supabase
    .from("technical_visit_template_versions")
    .select("id, version_number, status")
    .eq("template_id", templateId);

  const list = rows ?? [];
  const draftExists = list.some((r) => r.status === "draft");
  const published = list.filter((r) => r.status === "published");
  const latestPublished =
    published.length > 0
      ? published.reduce((a, b) => (b.version_number > a.version_number ? b : a))
      : null;

  return { draftExists, latestPublished };
}
