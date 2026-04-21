"use server";

import { headers } from "next/headers";

import { canAccessCommercialCallbacks } from "@/features/commercial-callbacks/lib/callback-access";
import { generateInitialCallbackEmail } from "@/features/commercial-callbacks/lib/generate-initial-callback-email";
import { getAccessContext } from "@/lib/auth/access-context";
import { resolvePublicAppBaseUrl } from "@/lib/app-public-url";
import { sendEmail } from "@/lib/email/email-orchestrator";
import { getFromAddress, getMailTransport } from "@/lib/email/gmail-transport";
import { resolveCallbackInitialEmailSimulatorUrl } from "@/features/commercial-callbacks/lib/callback-initial-email-simulator-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function normalizeEmail(e: string | null | undefined): string | null {
  const t = e?.trim();
  if (!t || !t.includes("@")) return null;
  return t;
}

export type SendInitialCallbackEmailResult =
  | { ok: true; skipped?: string }
  | { ok: false; error: string };

/**
 * Envoie l’e-mail de confirmation « premier contact » pour un rappel commercial (idempotent).
 */
export async function sendInitialCallbackEmail(
  callbackId: string,
): Promise<SendInitialCallbackEmailResult> {
  const access = await getAccessContext();
  if (!canAccessCommercialCallbacks(access)) {
    return { ok: false, error: "Accès refusé." };
  }
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Session requise." };
  }

  const userClient = await createClient();
  const { data: row, error: fetchErr } = await userClient
    .from("commercial_callbacks")
    .select(
      "id, email, status, auto_followup_enabled, initial_contact_email_sent, deleted_at, cancelled_at, converted_lead_id, contact_name, callback_date, assigned_agent_user_id, created_by_user_id",
    )
    .eq("id", callbackId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, error: fetchErr.message };
  }
  if (!row) {
    return { ok: false, error: "Rappel introuvable ou non accessible." };
  }

  const to = normalizeEmail(row.email);
  if (!to) {
    return { ok: true, skipped: "no_email" };
  }

  if (row.initial_contact_email_sent) {
    return { ok: true, skipped: "already_sent" };
  }

  if (row.status !== "pending") {
    return { ok: true, skipped: `status:${row.status}` };
  }

  if (!row.auto_followup_enabled) {
    return { ok: true, skipped: "auto_followup_disabled" };
  }

  if (row.deleted_at != null) {
    return { ok: true, skipped: "deleted" };
  }

  if (row.cancelled_at != null) {
    return { ok: true, skipped: "cancelled" };
  }

  if (row.converted_lead_id != null) {
    return { ok: true, skipped: "converted" };
  }

  const admin = createAdminClient();

  const agentId = row.assigned_agent_user_id ?? row.created_by_user_id;
  let agentDisplayName = "L’équipe Effinor";
  if (agentId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", agentId)
      .maybeSingle();
    const fn = profile?.full_name?.trim();
    if (fn) agentDisplayName = fn;
  }

  const nowIso = new Date().toISOString();

  const { data: claimed, error: claimErr } = await admin
    .from("commercial_callbacks")
    .update({
      initial_contact_email_sent: true,
      last_outbound_email_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", callbackId)
    .eq("initial_contact_email_sent", false)
    .eq("status", "pending")
    .eq("auto_followup_enabled", true)
    .is("deleted_at", null)
    .is("cancelled_at", null)
    .is("converted_lead_id", null)
    .select("id")
    .maybeSingle();

  if (claimErr) {
    return { ok: false, error: claimErr.message };
  }
  if (!claimed?.id) {
    return { ok: true, skipped: "claim_failed_or_race" };
  }

  const simulatorLandingUrl = resolveCallbackInitialEmailSimulatorUrl();

  const h = await headers();
  const baseUrl = resolvePublicAppBaseUrl(h);

  const { data: tracking, error: trackErr } = await admin
    .from("email_tracking")
    .insert({
      lead_id: null,
      commercial_callback_id: callbackId,
      recipient: to,
      subject: "[callback_initial]",
    })
    .select("id")
    .single();

  if (trackErr || !tracking?.id) {
    await admin
      .from("commercial_callbacks")
      .update({
        initial_contact_email_sent: false,
        last_outbound_email_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", callbackId);
    return {
      ok: false,
      error: trackErr?.message ?? "Impossible d’enregistrer le suivi e-mail.",
    };
  }

  const trackingId = tracking.id;
  const openPixelSrc = `${baseUrl}/api/open/${trackingId}`;

  const { subject, html, text } = generateInitialCallbackEmail({
    callback: {
      contact_name: row.contact_name,
      callback_date: row.callback_date,
    },
    agentDisplayName,
    simulatorLandingUrl,
    openPixelSrc,
  });

  await admin
    .from("email_tracking")
    .update({ subject: `[callback_initial] ${subject}` })
    .eq("id", trackingId);

  try {
    const send = await sendEmail({
      type: "CALLBACK_INITIAL",
      recipient: to,
      metadata: {
        provider: "smtp",
        sourceModule: "commercial-callbacks",
      },
      execute: async () => {
        const transport = getMailTransport();
        await transport.sendMail({
          from: getFromAddress(),
          to,
          subject,
          html,
          text,
        });
        return { ok: true };
      },
    });
    if (!send.ok) {
      throw new Error(send.error);
    }
  } catch (e) {
    console.error("[sendInitialCallbackEmail] send failed", callbackId, e);
    await admin
      .from("commercial_callbacks")
      .update({
        initial_contact_email_sent: false,
        last_outbound_email_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", callbackId);
    await admin.from("email_tracking").delete().eq("id", trackingId);
    const message = e instanceof Error ? e.message : "Échec d’envoi.";
    return { ok: false, error: message };
  }

  return { ok: true };
}
