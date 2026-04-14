import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import type { StudyCeeSheetForPdf } from "../domain/types";

export async function fetchCeeSheetForStudyPdf(
  supabase: SupabaseClient<Database>,
  opts: { workflowId?: string; leadCeeSheetId: string | null },
): Promise<StudyCeeSheetForPdf | null> {
  let sheetId: string | null = opts.leadCeeSheetId;

  if (opts.workflowId) {
    const { data: wf } = await supabase
      .from("lead_sheet_workflows")
      .select("cee_sheet_id")
      .eq("id", opts.workflowId)
      .maybeSingle();
    if (wf?.cee_sheet_id) {
      sheetId = wf.cee_sheet_id;
    }
  }

  if (!sheetId) {
    return null;
  }

  const { data, error } = await supabase
    .from("cee_sheets")
    .select("id, simulator_key, presentation_template_key, agreement_template_key")
    .eq("id", sheetId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Fiche CEE (étude PDF) : ${error.message}`);
  }
  if (!data) {
    return null;
  }

  return {
    id: data.id,
    simulatorKey: data.simulator_key,
    presentationTemplateKey: data.presentation_template_key,
    agreementTemplateKey: data.agreement_template_key,
  };
}
