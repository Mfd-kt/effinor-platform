"use server";

import { revalidatePath } from "next/cache";

import { leadAddressesComplete } from "@/features/leads/lib/lead-address-validation";
import { fetchLeadInternalNotesPlainBlock } from "@/features/leads/lib/lead-internal-notes-export";
import { buildTechnicalVisitDefaultsFromLead } from "@/features/leads/lib/lead-to-technical-visit";
import { linkTechnicalVisitToWorkflow } from "@/features/cee-workflows/services/workflow-service";
import type { LeadRow } from "@/features/leads/types";
import { ACTIVE_TECHNICAL_VISIT_STATUSES } from "@/features/leads/constants/technical-visit-active-statuses";
import { createTechnicalVisitFromWorkflow } from "@/features/technical-visits/actions/create-technical-visit-from-workflow";
import { geocodeWorksiteForSave } from "@/features/technical-visits/lib/geocode-worksite-for-save";
import { insertFromTechnicalVisitForm } from "@/features/technical-visits/lib/map-to-db";
import { CEE_SHEET_VISIT_TEMPLATE_RESOLUTION_FIELDS } from "@/features/cee-workflows/queries/cee-sheet-workflow-embed";
import {
  resolveVisitTemplateForCeeSheetAsync,
  type CeeSheetForVisitTemplateResolution,
} from "@/features/technical-visits/workflow/cee-sheet-to-visit-template";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import { createClient } from "@/lib/supabase/server";

/** Logs temporaires de traçage création VT depuis lead (retirer une fois le diagnostic terminé). */
function logVtFromLead(payload: Record<string, unknown>) {
  console.info("[VT-FROM-LEAD-DEBUG]", payload);
}

export type CreateTechnicalVisitFromLeadResult =
  | { ok: true; technicalVisitId: string; creationMode: "dynamic" | "legacy"; warnings?: string[] }
  | { ok: false; message: string; existingTechnicalVisitId?: string };

/**
 * Crée une visite technique à partir d’un lead qualifié.
 *
 * - Si `current_workflow_id` est renseigné et que la fiche CEE du workflow est mappée vers un template
 *   (`resolveVisitTemplateForCeeSheet`), délègue à `createTechnicalVisitFromWorkflow` (VT dynamique).
 * - Sinon, comportement legacy : insert sans template, avec `workflow_id` du lead si présent.
 *
 * Garde-fous communs : adresses, société, lead non terminal. Unicité VT active : par workflow en mode
 * dynamique ; globale sur le lead en mode legacy.
 */
export async function createTechnicalVisitFromLead(
  leadId: string,
): Promise<CreateTechnicalVisitFromLeadResult> {
  const trimmedId = leadId?.trim();
  if (!trimmedId) {
    return { ok: false, message: "Identifiant lead manquant." };
  }

  const supabase = await createClient();

  const { data: leadRow, error: fetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", trimmedId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!leadRow) {
    return { ok: false, message: "Lead introuvable ou supprimé." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const leadAccessRow = {
    created_by_agent_id: leadRow.created_by_agent_id as string | null,
    confirmed_by_user_id: leadRow.confirmed_by_user_id as string | null,
  };
  if (!canAccessLeadRow(leadAccessRow, access)) {
    return { ok: false, message: "Accès refusé à ce lead." };
  }

  const agentBlock = await getRestrictedAgentLeadEditBlockReason(supabase, access, trimmedId);
  if (agentBlock) {
    return { ok: false, message: agentBlock };
  }

  const lead = leadRow as unknown as LeadRow;

  if (lead.lead_status === "lost" || lead.lead_status === "converted") {
    return {
      ok: false,
      message:
        "Ce lead est en statut terminal (perdu ou converti) : création de visite technique impossible.",
    };
  }

  if (!lead.company_name?.trim()) {
    return { ok: false, message: "Le nom de la société est obligatoire." };
  }

  if (!leadAddressesComplete(lead)) {
    return {
      ok: false,
      message:
        "Complétez les six champs d’adresse (siège et travaux : adresse, code postal, ville).",
    };
  }

  /**
   * Cas dynamique : workflow actif du lead + fiche CEE mappée vers un template (ex. DESTRAT → BAT-TH-142).
   * Délègue à `createTechnicalVisitFromWorkflow` (mêmes garde-fous pipeline / unicité par workflow).
   */
  const workflowId = lead.current_workflow_id?.trim() || null;

  if (!workflowId) {
    logVtFromLead({
      step: "branch_chosen",
      branch: "legacy_fallback",
      leadId: trimmedId,
      reason: "no_current_workflow_id",
    });
  } else {
    const { data: wfRow, error: wfErr } = await supabase
      .from("lead_sheet_workflows")
      .select("id, cee_sheet_id")
      .eq("id", workflowId)
      .maybeSingle();

    if (wfErr) {
      logVtFromLead({
        step: "workflow_fetch_error",
        leadId: trimmedId,
        workflowId,
        error: wfErr.message,
      });
      return { ok: false, message: wfErr.message };
    }

    let sheet: CeeSheetForVisitTemplateResolution | null = null;
    if (wfRow?.cee_sheet_id) {
      const { data: sheetRow, error: sheetErr } = await supabase
        .from("cee_sheets")
        .select(CEE_SHEET_VISIT_TEMPLATE_RESOLUTION_FIELDS)
        .eq("id", wfRow.cee_sheet_id)
        .maybeSingle();
      if (sheetErr) {
        logVtFromLead({
          step: "cee_sheet_fetch_error",
          leadId: trimmedId,
          workflowId,
          cee_sheet_id: wfRow.cee_sheet_id,
          error: sheetErr.message,
        });
        return { ok: false, message: sheetErr.message };
      }
      sheet = sheetRow;
    }

    const resolvedTemplate = await resolveVisitTemplateForCeeSheetAsync(supabase, sheet);

    logVtFromLead({
      step: "dynamic_prereq",
      leadId: trimmedId,
      workflowId,
      workflow_row_found: Boolean(wfRow),
      cee_sheet_id: wfRow?.cee_sheet_id ?? null,
      sheet_found: sheet != null,
      sheet_code: sheet?.code ?? null,
      resolveVisitTemplateForCeeSheet: resolvedTemplate
        ? { templateKey: resolvedTemplate.templateKey, version: resolvedTemplate.version }
        : null,
    });

    if (resolvedTemplate) {
      logVtFromLead({
        step: "branch_chosen",
        branch: "dynamic",
        leadId: trimmedId,
        workflowId,
      });

      const wfResult = await createTechnicalVisitFromWorkflow({ workflowId });
      if (!wfResult.ok) {
        logVtFromLead({
          step: "branch_result",
          branch: "dynamic_refused",
          leadId: trimmedId,
          workflowId,
          message: wfResult.message,
          existingTechnicalVisitId: wfResult.existingTechnicalVisitId ?? null,
        });
        return {
          ok: false,
          message: wfResult.message,
          ...(wfResult.existingTechnicalVisitId
            ? { existingTechnicalVisitId: wfResult.existingTechnicalVisitId }
            : {}),
        };
      }

      const { data: vtDynRow, error: vtDynErr } = await supabase
        .from("technical_visits")
        .select("id, workflow_id, visit_template_key, visit_template_version, visit_schema_snapshot_json")
        .eq("id", wfResult.technicalVisitId)
        .maybeSingle();

      logVtFromLead({
        step: "post_create_dynamic_db",
        leadId: trimmedId,
        technicalVisitId: wfResult.technicalVisitId,
        db_read_ok: !vtDynErr,
        db_read_error: vtDynErr?.message ?? null,
        workflow_id: vtDynRow?.workflow_id ?? null,
        visit_template_key: vtDynRow?.visit_template_key ?? null,
        visit_template_version: vtDynRow?.visit_template_version ?? null,
        snapshot_present: vtDynRow?.visit_schema_snapshot_json != null,
      });

      const {
        data: { user: userDyn },
      } = await supabase.auth.getUser();
      if (userDyn?.id) {
        await supabase
          .from("leads")
          .update({ confirmed_by_user_id: userDyn.id })
          .eq("id", trimmedId)
          .is("deleted_at", null)
          .is("confirmed_by_user_id", null);
      }
      if (lead.lead_status !== "qualified") {
        await supabase
          .from("leads")
          .update({ lead_status: "qualified" })
          .eq("id", trimmedId)
          .is("deleted_at", null);
      }

      revalidatePath("/leads");
      revalidatePath(`/leads/${trimmedId}`);

      console.info("[createTechnicalVisitFromLead] Visite créée en mode dynamique", {
        leadId: trimmedId,
        workflowId,
        technicalVisitId: wfResult.technicalVisitId,
        templateKey: resolvedTemplate.templateKey,
      });

      return {
        ok: true,
        technicalVisitId: wfResult.technicalVisitId,
        creationMode: "dynamic",
        ...(wfResult.warnings?.length ? { warnings: wfResult.warnings } : {}),
      };
    }

    logVtFromLead({
      step: "branch_chosen",
      branch: "legacy_fallback",
      leadId: trimmedId,
      workflowId,
      reason: !wfRow
        ? "workflow_row_missing"
        : !wfRow.cee_sheet_id
          ? "no_cee_sheet_on_workflow"
          : "mapping_unresolved",
      sheet_code: sheet?.code ?? null,
    });
  }

  const { data: existingActive, error: existingError } = await supabase
    .from("technical_visits")
    .select("id, vt_reference")
    .eq("lead_id", trimmedId)
    .is("deleted_at", null)
    .in("status", [...ACTIVE_TECHNICAL_VISIT_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  if (existingActive) {
    return {
      ok: false,
      message: "Une visite technique existe déjà pour ce lead (statut actif).",
      existingTechnicalVisitId: existingActive.id,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Session expirée." };
  }

  const internalNotesBlock = await fetchLeadInternalNotesPlainBlock(supabase, trimmedId);
  const defaults = buildTechnicalVisitDefaultsFromLead(lead, { internalNotesBlock });
  const insertRow = insertFromTechnicalVisitForm(defaults);
  insertRow.created_by_user_id = user.id;
  insertRow.workflow_id = lead.current_workflow_id ?? null;

  const { lat, lng } = await geocodeWorksiteForSave({
    worksite_address: insertRow.worksite_address,
    worksite_postal_code: insertRow.worksite_postal_code,
    worksite_city: insertRow.worksite_city,
  });
  insertRow.worksite_latitude = lat;
  insertRow.worksite_longitude = lng;

  const { data: vt, error: insertError } = await supabase
    .from("technical_visits")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  if (!vt?.id) {
    return { ok: false, message: "Aucune donnée retournée après création de la visite." };
  }

  const { data: vtLegacyRow, error: vtLegacyErr } = await supabase
    .from("technical_visits")
    .select("id, workflow_id, visit_template_key, visit_template_version, visit_schema_snapshot_json")
    .eq("id", vt.id)
    .maybeSingle();

  logVtFromLead({
    step: "post_create_legacy_db",
    leadId: trimmedId,
    technicalVisitId: vt.id,
    db_read_ok: !vtLegacyErr,
    db_read_error: vtLegacyErr?.message ?? null,
    workflow_id: vtLegacyRow?.workflow_id ?? null,
    visit_template_key: vtLegacyRow?.visit_template_key ?? null,
    visit_template_version: vtLegacyRow?.visit_template_version ?? null,
    snapshot_present: vtLegacyRow?.visit_schema_snapshot_json != null,
  });

  /** Confirmateur : l’utilisateur qui crée la VT est enregistré sur le lead (si encore vide). */
  if (user.id) {
    await supabase
      .from("leads")
      .update({ confirmed_by_user_id: user.id })
      .eq("id", trimmedId)
      .is("deleted_at", null)
      .is("confirmed_by_user_id", null);
  }

  /**
   * Après ouverture d’une VT, faire progresser le pipeline sur le lead.
   * Enum `lead_status` : on passe à `qualified` lorsque le lead n’y est pas encore
   * (pas de nouveau statut dans la migration — évite `converted`/`lost` déjà filtrés).
   */
  if (lead.lead_status !== "qualified") {
    await supabase
      .from("leads")
      .update({ lead_status: "qualified" })
      .eq("id", trimmedId)
      .is("deleted_at", null);
  }

  if (lead.current_workflow_id) {
    await linkTechnicalVisitToWorkflow(supabase, {
      workflowId: lead.current_workflow_id,
      technicalVisitId: vt.id,
      actorUserId: user.id,
      markDone: false,
    });
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${trimmedId}`);
  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${vt.id}`);

  console.info("[createTechnicalVisitFromLead] Visite créée en mode legacy", {
    leadId: trimmedId,
    workflowId: lead.current_workflow_id ?? null,
    technicalVisitId: vt.id,
  });

  return { ok: true, technicalVisitId: vt.id, creationMode: "legacy" };
}
