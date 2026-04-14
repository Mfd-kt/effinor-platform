"use server";

import { revalidatePath } from "next/cache";

import {
  createLeadSheetWorkflow as createLeadSheetWorkflowInService,
  syncWorkflowCommercialDocumentsFromLeadPdfs,
} from "@/features/cee-workflows/services/workflow-service";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getLeadInternalNotes } from "@/features/leads/queries/get-lead-internal-notes";
import { fetchCeeSheetForStudyPdf } from "@/features/leads/study-pdf/queries/fetch-cee-sheet-for-study-pdf";
import { buildLeadStudyPdfViewModel } from "@/features/leads/study-pdf/domain/build-study-view-model";
import { STUDY_PAC_PRODUCT_RATIONALE } from "@/features/leads/study-pdf/domain/resolve-study-products";
import { resolveStudyTemplatesFromCeeSheet } from "@/features/leads/study-pdf/domain/resolve-study-templates";
import { toStudyProductViewModelFromDetails } from "@/features/leads/study-pdf/domain/study-product-from-db";
import type { StudyProductViewModel } from "@/features/leads/study-pdf/domain/types";
import { buildLeadStudyDocumentInsert } from "@/features/leads/study-pdf/domain/build-document-record";
import type { LeadStudyDocumentRow } from "@/features/leads/study-pdf/domain/types";
import { mergeLeadDetailWithWorkflowSimulationResult } from "@/features/leads/study-pdf/domain/merge-workflow-simulation-into-lead-for-pdf";
import { validateLeadForStudyPdf } from "@/features/leads/study-pdf/domain/validation";
import { renderPresentationHtml } from "@/features/leads/study-pdf/templates/render-presentation-html";
import { renderAccordHtml } from "@/features/leads/study-pdf/templates/render-accord-html";
import { renderHtmlToPdfBuffer } from "@/features/leads/study-pdf/utils/render-html-to-pdf";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";
import { notifyLeadStudyPdfsGenerated } from "@/features/notifications/services/notification-service";
import { getDefaultHeatPumpProductForStudy } from "@/features/products/domain/repository";

const LEAD_STUDY_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_LEAD_STUDY_BUCKET?.trim() || "lead-studies";
const LEAD_STUDY_BUCKET_FALLBACK = "Lads_fichiers";

export type GenerateLeadStudyPdfResult =
  | { ok: true; presentation: LeadStudyDocumentRow; accord: LeadStudyDocumentRow }
  | { ok: false; error: string; missing?: string[] };

function humanizePdfError(message: string): string {
  const oneLine = message.replaceAll(/\s+/g, " ").trim();
  if (oneLine.toLowerCase().includes("executable doesn't exist")) {
    return "Moteur PDF Chromium introuvable sur le serveur. Installez-le avec: npx playwright install chromium";
  }
  if (oneLine.toLowerCase().includes("browsertype.launch")) {
    return "Impossible de démarrer le moteur PDF Chromium.";
  }
  return oneLine;
}

async function uploadPdf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
  pdfBuffer: Buffer,
): Promise<{ bucket: string; publicUrl: string } | { error: string }> {
  let uploadBucket = LEAD_STUDY_BUCKET;
  let { error: uploadError } = await supabase.storage
    .from(uploadBucket)
    .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true, cacheControl: "0" });

  if (uploadError?.message.toLowerCase().includes("bucket not found")) {
    uploadBucket = LEAD_STUDY_BUCKET_FALLBACK;
    ({ error: uploadError } = await supabase.storage
      .from(uploadBucket)
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true, cacheControl: "0" }));
  }

  if (uploadError) return { error: uploadError.message };
  const { data } = supabase.storage.from(uploadBucket).getPublicUrl(storagePath);
  const bustCache = `${data.publicUrl}?v=${Date.now()}`;
  return { bucket: uploadBucket, publicUrl: bustCache };
}

export async function generateLeadStudyPdf(
  leadId: string,
  options?: { workflowId?: string },
): Promise<GenerateLeadStudyPdfResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié." };
  }

  let lead = await getLeadById(leadId, access);
  if (!lead) {
    return { ok: false, error: "Lead introuvable ou accès refusé." };
  }

  let mergedSimulationJson: unknown = lead.sim_payload_json ?? undefined;

  if (options?.workflowId) {
    const supabaseForSim = await createClient();
    const { data: wfRow, error: wfErr } = await supabaseForSim
      .from("lead_sheet_workflows")
      .select("lead_id, simulation_result_json, simulation_input_json")
      .eq("id", options.workflowId)
      .maybeSingle();

    if (wfErr || !wfRow) {
      return { ok: false, error: "Workflow introuvable pour récupérer la simulation." };
    }
    if (wfRow.lead_id !== leadId) {
      return { ok: false, error: "Ce workflow n'est pas rattaché à ce lead." };
    }
    if (wfRow.simulation_result_json) {
      mergedSimulationJson = wfRow.simulation_result_json;
      lead = mergeLeadDetailWithWorkflowSimulationResult(lead, wfRow.simulation_result_json);
    }
    if (wfRow.simulation_input_json) {
      lead = mergeLeadDetailWithWorkflowSimulationResult(lead, wfRow.simulation_input_json);
    }
  }

  if (lead.sim_payload_json) {
    lead = mergeLeadDetailWithWorkflowSimulationResult(lead, lead.sim_payload_json);
  }

  const supabaseForSheet = await createClient();
  const ceeSheetForStudy = await fetchCeeSheetForStudyPdf(supabaseForSheet, {
    workflowId: options?.workflowId,
    leadCeeSheetId: lead.cee_sheet_id,
  });

  const validationIssues = validateLeadForStudyPdf(lead, {
    mergedSimulationJson,
    ceeSheet: ceeSheetForStudy,
  });
  if (validationIssues.length) {
    return {
      ok: false,
      error: "Données manquantes pour générer l'étude PDF.",
      missing: validationIssues.map((i) => i.label),
    };
  }

  const notes = await getLeadInternalNotes(leadId);

  const supabaseForPacProduct = await createClient();
  const templatesPreview = resolveStudyTemplatesFromCeeSheet(
    ceeSheetForStudy ?? null,
    lead,
    mergedSimulationJson,
  );

  let pacStudyProducts: StudyProductViewModel[] | undefined;
  if (templatesPreview.ceeSolutionKind === "pac") {
    const dbPac = await getDefaultHeatPumpProductForStudy(supabaseForPacProduct);
    if (dbPac) {
      pacStudyProducts = [toStudyProductViewModelFromDetails(dbPac, STUDY_PAC_PRODUCT_RATIONALE)];
    }
  }

  const viewModel = buildLeadStudyPdfViewModel({
    lead,
    qualificationNotes: notes.map((n) => n.body),
    generatedByLabel: access.fullName?.trim() || access.email || "Chargé d'étude",
    mergedSimulationJson,
    ceeSheetForStudy: ceeSheetForStudy ?? undefined,
    pacStudyProducts,
  });

  // ── Enrich product images + gallery from Supabase ──

  if (viewModel.products.length > 0) {
    const supabaseForImages = await createClient();
    const productCodes = viewModel.products.map((p) => p.id);

    const { data: dbProducts } = await supabaseForImages
      .from("products")
      .select("id, product_code, image_url, fallback_image_url")
      .in("product_code", productCodes)
      .is("deleted_at", null);

    if (dbProducts && dbProducts.length > 0) {
      const imageMap = new Map(
        dbProducts.map((p) => [p.product_code, p.image_url ?? p.fallback_image_url ?? null]),
      );
      const productIdMap = new Map(dbProducts.map((p) => [p.product_code, p.id]));

      const dbProductIds = dbProducts.map((p) => p.id);
      const { data: galleryImages } = await supabaseForImages
        .from("product_images")
        .select("product_id, url")
        .in("product_id", dbProductIds)
        .order("sort_order");

      const galleryMap = new Map<string, string[]>();
      for (const img of galleryImages ?? []) {
        const arr = galleryMap.get(img.product_id) ?? [];
        arr.push(img.url);
        galleryMap.set(img.product_id, arr);
      }

      for (const product of viewModel.products) {
        const dbImage = imageMap.get(product.id);
        // Image admin (Supabase) prime sur le catalogue TS — même logique que les déstratificateurs.
        if (dbImage) {
          product.imageUrlResolved = dbImage;
        }
        const dbId = productIdMap.get(product.id);
        if (dbId) {
          product.galleryUrls = (galleryMap.get(dbId) ?? []).slice(0, 6);
        }
      }
    }
  }

  // ── Render both PDFs ──

  const presentationHtml = renderPresentationHtml(viewModel);
  const accordHtml = renderAccordHtml(viewModel);

  let presentationBuffer: Buffer;
  let accordBuffer: Buffer;
  try {
    [presentationBuffer, accordBuffer] = await Promise.all([
      renderHtmlToPdfBuffer(presentationHtml),
      renderHtmlToPdfBuffer(accordHtml),
    ]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return { ok: false, error: `Conversion PDF impossible: ${humanizePdfError(msg)}` };
  }

  const supabase = await createClient();
  const slug = lead.company_name.replaceAll(/\s+/g, "-").toLowerCase();

  // ── Delete all previous documents for this lead ──

  const { data: previousDocs } = await supabase
    .from("lead_documents")
    .select("id, storage_bucket, storage_path")
    .eq("lead_id", lead.id)
    .in("document_type", ["study_pdf", "accord_commercial"]);

  if (previousDocs && previousDocs.length > 0) {
    for (const prev of previousDocs) {
      if (prev.storage_path && prev.storage_bucket) {
        await supabase.storage.from(prev.storage_bucket).remove([prev.storage_path]);
      }
    }
    await supabase
      .from("lead_documents")
      .delete()
      .eq("lead_id", lead.id)
      .in("document_type", ["study_pdf", "accord_commercial"]);
  }

  // ── Upload presentation ──

  const presPath = `leads/${lead.id}/study-pdf/presentation-${slug}.pdf`;
  const presUpload = await uploadPdf(supabase, presPath, presentationBuffer);
  if ("error" in presUpload) {
    return { ok: false, error: `Upload présentation impossible: ${presUpload.error}` };
  }

  // ── Upload accord ──

  const accPath = `leads/${lead.id}/study-pdf/accord-${slug}.pdf`;
  const accUpload = await uploadPdf(supabase, accPath, accordBuffer);
  if ("error" in accUpload) {
    return { ok: false, error: `Upload accord impossible: ${accUpload.error}` };
  }

  // ── Save document records ──

  const presTitle = `Présentation projet — ${lead.company_name}`;
  const accTitle = `Accord de principe — ${lead.company_name}`;

  const presPayload = buildLeadStudyDocumentInsert({
    leadId: lead.id,
    createdBy: access.userId,
    fileUrl: presUpload.publicUrl,
    storageBucket: presUpload.bucket,
    storagePath: presPath,
    title: presTitle,
    viewModel,
    documentType: "study_pdf",
  });

  const accPayload = buildLeadStudyDocumentInsert({
    leadId: lead.id,
    createdBy: access.userId,
    fileUrl: accUpload.publicUrl,
    storageBucket: accUpload.bucket,
    storagePath: accPath,
    title: accTitle,
    viewModel,
    documentType: "accord_commercial",
  });

  const { data: presRow, error: presInsertErr } = await supabase
    .from("lead_documents")
    .insert(presPayload)
    .select("*")
    .single();

  const { data: accRow, error: accInsertErr } = await supabase
    .from("lead_documents")
    .insert(accPayload)
    .select("*")
    .single();

  const now = new Date().toISOString();

  const presentationDoc: LeadStudyDocumentRow = presRow
    ? (presRow as LeadStudyDocumentRow)
    : {
        id: `tmp-pres-${Date.now()}`,
        lead_id: lead.id,
        document_type: "study_pdf",
        title: presTitle,
        file_url: presUpload.publicUrl,
        storage_bucket: presUpload.bucket,
        storage_path: presPath,
        status: "generated",
        template_version: viewModel.templateVersion,
        metadata: { fallback: true },
        created_at: now,
        created_by: access.userId,
      };

  const accordDoc: LeadStudyDocumentRow = accRow
    ? (accRow as LeadStudyDocumentRow)
    : {
        id: `tmp-acc-${Date.now()}`,
        lead_id: lead.id,
        document_type: "accord_commercial",
        title: accTitle,
        file_url: accUpload.publicUrl,
        storage_bucket: accUpload.bucket,
        storage_path: accPath,
        status: "generated",
        template_version: viewModel.templateVersion,
        metadata: { fallback: true },
        created_at: now,
        created_by: access.userId,
      };

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/leads");

  const workflowId =
    options?.workflowId ??
    lead.current_workflow_id ??
    (lead.cee_sheet_id
      ? (
          await createLeadSheetWorkflowInService(supabase, {
            leadId: lead.id,
            ceeSheetId: lead.cee_sheet_id,
            actorUserId: access.userId,
            workflowStatus: "qualified",
          })
        ).id
      : null);

  if (workflowId) {
    try {
      await syncWorkflowCommercialDocumentsFromLeadPdfs(supabase, {
        workflowId,
        actorUserId: access.userId,
        presentation: {
          storageBucket: presUpload.bucket,
          storagePath: presPath,
          fileUrl: presUpload.publicUrl,
        },
        agreement: {
          storageBucket: accUpload.bucket,
          storagePath: accPath,
          fileUrl: accUpload.publicUrl,
        },
      });
    } catch {
      // Les enregistrements `lead_documents` sont déjà créés ; l’UI closer s’appuie dessus.
      // Une erreur de transition RLS sur le workflow ne doit pas masquer des PDF valides.
    }
  }

  void notifyLeadStudyPdfsGenerated(lead);

  return { ok: true, presentation: presentationDoc, accord: accordDoc };
}
