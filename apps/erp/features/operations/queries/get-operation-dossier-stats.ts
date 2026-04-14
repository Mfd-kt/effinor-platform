import { createClient } from "@/lib/supabase/server";

export type OperationDossierStats = {
  operationSites: number;
  technicalStudies: number;
  existingHeatingUnits: number;
  installedProducts: number;
  documents: number;
  quotes: number;
  invoices: number;
  installations: number;
};

/**
 * Compteurs légers pour la fiche dossier opération (sous-modules par operation_id ou via sites).
 */
export async function getOperationDossierStats(operationId: string): Promise<OperationDossierStats> {
  const supabase = await createClient();

  const [sitesRes, studiesRes, installedRes, docsRes] = await Promise.all([
    supabase
      .from("operation_sites")
      .select("*", { count: "exact", head: true })
      .eq("operation_id", operationId)
      .is("deleted_at", null),
    supabase
      .from("technical_studies")
      .select("*", { count: "exact", head: true })
      .eq("operation_id", operationId),
    supabase
      .from("installed_products")
      .select("*", { count: "exact", head: true })
      .eq("operation_id", operationId),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("operation_id", operationId)
      .is("deleted_at", null),
  ]);

  const { data: siteRows } = await supabase
    .from("operation_sites")
    .select("id")
    .eq("operation_id", operationId)
    .is("deleted_at", null);

  const siteIds = siteRows?.map((r) => r.id) ?? [];
  let heatingCount = 0;
  if (siteIds.length > 0) {
    const { count } = await supabase
      .from("existing_heating_units")
      .select("*", { count: "exact", head: true })
      .in("operation_site_id", siteIds);
    heatingCount = count ?? 0;
  }

  return {
    operationSites: sitesRes.count ?? 0,
    technicalStudies: studiesRes.count ?? 0,
    existingHeatingUnits: heatingCount,
    installedProducts: installedRes.count ?? 0,
    documents: docsRes.count ?? 0,
    // Tables non présentes dans database.types pour l’instant — à brancher quand le schéma sera généré.
    quotes: 0,
    invoices: 0,
    installations: 0,
  };
}
