import { NextResponse } from "next/server";

import { applyDropcontactResultToLead } from "@/features/lead-generation/dropcontact/apply-dropcontact-result";
import { logDropcontact } from "@/features/lead-generation/dropcontact/dropcontact-log";
import { revalidateLeadStockDropcontactPaths } from "@/features/lead-generation/dropcontact/revalidate-lead-stock-dropcontact-paths";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { evaluateLeadGenerationDispatchQueue } from "@/features/lead-generation/queue/evaluate-dispatch-queue";
import { recalculateLeadGenerationCommercialScore } from "@/features/lead-generation/scoring/recalculate-lead-generation-commercial-score";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Le navigateur ouvre l’URL en GET : sans ce handler on obtient 405, ce qui prête à confusion.
 * Dropcontact appelle en POST avec un corps JSON.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Webhook Dropcontact actif. Les livraisons se font en POST (pas depuis la barre d’adresse).",
  });
}

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
    if (id != null && (typeof id === "string" || typeof id === "number")) {
      const s = String(id).trim();
      if (s.length > 0) return s;
    }
  }
  return null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    logDropcontact("webhook", "Corps webhook non JSON", { error: String(e) });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const events: EnrichWebhookPayload[] = Array.isArray(body) ? body : [body as EnrichWebhookPayload];
  logDropcontact("webhook", "POST webhook reçu", {
    eventCount: events.length,
    eventTypes: events.map((ev) => (typeof ev?.event_type === "string" ? ev.event_type : "(absent)")),
  });

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (e) {
    logDropcontact("webhook", "Client admin Supabase indisponible", { error: String(e) });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const stockTable = lgTable(supabase, "lead_generation_stock");

  for (const ev of events) {
    if (ev.event_type !== "enrich_api_result") {
      logDropcontact("webhook", "Événement ignoré (event_type)", {
        eventType: ev.event_type ?? "(absent)",
      });
      continue;
    }
    const inner = ev.data;
    if (!inner || typeof inner !== "object") {
      logDropcontact("webhook", "Payload interne absent ou invalide", { eventType: ev.event_type });
      continue;
    }

    const requestId = typeof inner.request_id === "string" ? inner.request_id.trim() : "";
    const contacts = Array.isArray(inner.data) ? inner.data : [];

    if (!requestId) {
      logDropcontact("webhook", "request_id manquant dans le corps webhook");
      continue;
    }

    let leadIdFromCustomFields: string | null = null;
    const firstContact = contacts[0];
    if (firstContact && typeof firstContact === "object" && firstContact !== null) {
      leadIdFromCustomFields = readLeadIdFromContact(firstContact as Record<string, unknown>);
    }

    logDropcontact("webhook", "Traitement enrich_api_result", {
      requestId,
      leadIdFromCustomFields: leadIdFromCustomFields ?? "(non lu)",
      contactsCount: contacts.length,
    });

    let row: LeadGenerationStockRow | null = null;
    if (leadIdFromCustomFields) {
      const { data } = await stockTable.select("*").eq("id", leadIdFromCustomFields).maybeSingle();
      row = data ? (data as LeadGenerationStockRow) : null;
    }
    if (!row) {
      const { data } = await stockTable.select("*").eq("dropcontact_request_id", requestId).maybeSingle();
      row = data ? (data as LeadGenerationStockRow) : null;
    }

    if (!row) {
      logDropcontact("webhook", "Webhook reçu mais lead introuvable", {
        requestId,
        leadIdFromCustomFields,
        lookupByRequestIdAttempted: true,
      });
      continue;
    }

    const storedRid =
      typeof row.dropcontact_request_id === "string" ? row.dropcontact_request_id.trim() : "";
    if (storedRid.length > 0 && storedRid !== requestId) {
      logDropcontact("webhook", "request_id incohérent avec la fiche", {
        stockId: row.id,
        requestIdWebhook: requestId,
        dropcontact_request_id_db: storedRid,
      });
      continue;
    }

    logDropcontact("webhook", "État DB avant traitement", {
      stockId: row.id,
      dropcontact_status: row.dropcontact_status ?? "(null)",
      dropcontact_request_id: row.dropcontact_request_id ?? "(null)",
    });

    if (row.dropcontact_status !== "pending") {
      logDropcontact("webhook", "Webhook ignoré : statut DB n’est pas pending", {
        stockId: row.id,
        dropcontact_status: row.dropcontact_status ?? "(null)",
      });
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
      const { error: noDataErr } = await stockTable.update(noDataPatch).eq("id", row.id);
      if (noDataErr) {
        logDropcontact("webhook", "Webhook reçu mais update DB refusé (branche sans contact)", {
          stockId: row.id,
          message: noDataErr.message,
        });
      } else {
        logDropcontact("webhook", "Mise à jour OK (aucun contact dans le webhook)", { stockId: row.id });
        revalidateLeadStockDropcontactPaths(row.id, "webhook_no_contact");
      }
      continue;
    }

    const { patch, hasUsefulData } = applyDropcontactResultToLead(row, contact as Record<string, unknown>);
    const { error: upErr } = await stockTable
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", row.id);

    if (upErr) {
      logDropcontact("webhook", "Webhook reçu mais update DB refusé", {
        stockId: row.id,
        message: upErr.message,
      });
      const { error: failErr } = await stockTable
        .update({
          dropcontact_status: "failed",
          dropcontact_last_error: "Webhook reçu mais mise à jour base refusée (voir logs serveur).",
          enrichment_status: "failed",
          enrichment_error: "Webhook reçu mais mise à jour base refusée (voir logs serveur).",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (failErr) {
        logDropcontact("webhook", "Échec secondaire après update refusée", { stockId: row.id, message: failErr.message });
      }
      revalidateLeadStockDropcontactPaths(row.id, "webhook_update_failed");
      continue;
    }

    logDropcontact("webhook", "Mise à jour DB OK", {
      stockId: row.id,
      hasUsefulData,
      dropcontact_status_applied: hasUsefulData ? "completed" : "failed",
    });

    if (hasUsefulData) {
      try {
        await recalculateLeadGenerationCommercialScore(row.id);
        await evaluateLeadGenerationDispatchQueue({ stockId: row.id });
      } catch (e) {
        logDropcontact("webhook", "Post-traitement score/file non bloquant en erreur", {
          stockId: row.id,
          error: String(e),
        });
      }
    }

    revalidateLeadStockDropcontactPaths(row.id, "webhook_success");
    logDropcontact("webhook", "Flux webhook terminé pour la fiche", { stockId: row.id });
  }

  return NextResponse.json({ ok: true });
}
