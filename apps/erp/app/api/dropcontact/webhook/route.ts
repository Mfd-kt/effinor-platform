import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { applyDropcontactResultToLead } from "@/features/lead-generation/dropcontact/apply-dropcontact-result";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { evaluateLeadGenerationDispatchQueue } from "@/features/lead-generation/queue/evaluate-dispatch-queue";
import { recalculateLeadGenerationCommercialScore } from "@/features/lead-generation/scoring/recalculate-lead-generation-commercial-score";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type EnrichWebhookPayload = {
  id?: string;
  event_type?: string;
  data?: {
    data?: unknown[];
    request_id?: string;
  };
};

function readLeadIdFromContact(contact: Record<string, unknown>): string | null {
  const cf = contact.custom_fields;
  if (cf && typeof cf === "object" && !Array.isArray(cf)) {
    const id = (cf as Record<string, unknown>).lead_id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return null;
}

function revalidateLeadStock(id: string) {
  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath(`/lead-generation/${id}`);
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${id}`);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const events: EnrichWebhookPayload[] = Array.isArray(body) ? body : [body as EnrichWebhookPayload];

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.error("[dropcontact/webhook] client admin indisponible", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const stockTable = lgTable(supabase, "lead_generation_stock");

  for (const ev of events) {
    if (ev.event_type !== "enrich_api_result") continue;
    const inner = ev.data;
    if (!inner || typeof inner !== "object") continue;

    const requestId = typeof inner.request_id === "string" ? inner.request_id.trim() : "";
    const contacts = Array.isArray(inner.data) ? inner.data : [];

    if (!requestId) {
      console.warn("[dropcontact/webhook] request_id manquant");
      continue;
    }

    let leadId: string | null = null;
    const firstContact = contacts[0];
    if (firstContact && typeof firstContact === "object" && firstContact !== null) {
      leadId = readLeadIdFromContact(firstContact as Record<string, unknown>);
    }

    let row: LeadGenerationStockRow | null = null;
    if (leadId) {
      const { data } = await stockTable.select("*").eq("id", leadId).maybeSingle();
      row = data ? (data as LeadGenerationStockRow) : null;
    }
    if (!row) {
      const { data } = await stockTable.select("*").eq("dropcontact_request_id", requestId).maybeSingle();
      row = data ? (data as LeadGenerationStockRow) : null;
    }

    if (!row) {
      console.warn("[dropcontact/webhook] fiche introuvable", { requestId, leadId });
      continue;
    }

    if (row.dropcontact_request_id !== requestId) {
      console.warn("[dropcontact/webhook] request_id incohérent", { stockId: row.id, requestId });
      continue;
    }

    if (row.dropcontact_status !== "pending") {
      continue;
    }

    const contact = contacts[0];
    if (!contact || typeof contact !== "object") {
      const noDataPatch = {
        dropcontact_status: "failed",
        dropcontact_completed_at: new Date().toISOString(),
        dropcontact_last_error: "Dropcontact n’a pas trouvé de données exploitables.",
        enrichment_status: "failed",
        enrichment_error: "Dropcontact n’a pas trouvé de données exploitables.",
        enrichment_source: "dropcontact",
        updated_at: new Date().toISOString(),
      };
      await stockTable.update(noDataPatch).eq("id", row.id);
      revalidateLeadStock(row.id);
      continue;
    }

    const { patch, hasUsefulData } = applyDropcontactResultToLead(row, contact as Record<string, unknown>);
    const { error: upErr } = await stockTable
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (upErr) {
      console.error("[dropcontact/webhook] échec mise à jour", row.id, upErr.message);
      await stockTable
        .update({
          dropcontact_status: "failed",
          dropcontact_last_error: "Enrichissement interrompu. Réessayez plus tard.",
          enrichment_status: "failed",
          enrichment_error: "Enrichissement interrompu. Réessayez plus tard.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      revalidateLeadStock(row.id);
      continue;
    }

    if (hasUsefulData) {
      try {
        await recalculateLeadGenerationCommercialScore(row.id);
        await evaluateLeadGenerationDispatchQueue({ stockId: row.id });
      } catch {
        /* non bloquant */
      }
    }

    revalidateLeadStock(row.id);
  }

  return NextResponse.json({ ok: true });
}
