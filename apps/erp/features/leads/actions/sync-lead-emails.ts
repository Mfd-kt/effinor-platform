"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchEmailsForAddress, type FetchedAttachment } from "@/lib/email/gmail-imap";
import { analyzeEmail, type EmailAnalysis } from "@/lib/ai/analyze-email";
import type { EmailAttachmentMeta } from "@/features/leads/queries/get-lead-emails";

export type SyncAiFlags = {
  signed: boolean;
  urgent: boolean;
  callbackRequested: boolean;
};

export type SyncLeadEmailsResult =
  | { ok: true; synced: number; deleted: number; attachmentsSaved: number; aiFlags: SyncAiFlags }
  | { ok: false; error: string };

/**
 * Synchronise les emails Gmail (envoyés + reçus) pour l'adresse email d'un lead.
 * Les emails déjà importés (par gmail_message_id) sont ignorés.
 * Les pièces jointes des emails reçus sont automatiquement sauvegardées
 * dans le storage Supabase et enregistrées dans lead_documents.
 */
export async function syncLeadEmails(
  leadId: string,
  contactEmail: string,
): Promise<SyncLeadEmailsResult> {
  if (!contactEmail || !contactEmail.includes("@")) {
    return { ok: false, error: "Adresse email du lead manquante." };
  }

  try {
    const gmailUser = process.env.GMAIL_USER;
    if (!gmailUser) {
      return { ok: false, error: "GMAIL_USER non configuré." };
    }

    const fetched = await fetchEmailsForAddress(contactEmail, 30);

    const noFlags: SyncAiFlags = { signed: false, urgent: false, callbackRequested: false };

    const supabase = createAdminClient();

    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    const currentUserId = user?.id ?? null;

    // Fetch ALL existing emails for this lead (with and without gmail_message_id)
    const { data: allExisting } = await supabase
      .from("lead_emails")
      .select("id, gmail_message_id, subject, email_date, direction, tracking_id")
      .eq("lead_id", leadId);

    const existingRows = allExisting ?? [];

    // If Gmail has 0 emails → delete everything from the CRM for this lead
    if (fetched.length === 0 && existingRows.length > 0) {
      const idsToDelete = existingRows.map((e) => e.id);
      const trackingIds = existingRows.map((e) => e.tracking_id).filter(Boolean) as string[];

      await supabase.from("lead_emails").delete().in("id", idsToDelete);
      if (trackingIds.length > 0) {
        await supabase.from("email_tracking").delete().in("id", trackingIds);
      }
      return { ok: true, synced: 0, deleted: idsToDelete.length, attachmentsSaved: 0, aiFlags: noFlags };
    }

    if (fetched.length === 0) {
      return { ok: true, synced: 0, deleted: 0, attachmentsSaved: 0, aiFlags: noFlags };
    }

    const existingIds = new Set(
      existingRows.filter((e) => e.gmail_message_id).map((e) => e.gmail_message_id),
    );

    const fetchedGmailIds = new Set(fetched.map((e) => e.gmailMessageId));

    // Build a fuzzy lookup for matching orphaned emails (no gmail_message_id)
    // Use subject only (dates can differ between Nodemailer and IMAP)
    const fetchedSubjects = new Set(
      fetched.map((e) => e.subject?.toLowerCase().trim()),
    );

    const toDeleteIds: string[] = [];
    const trackingIdsToDelete: string[] = [];

    for (const row of existingRows) {
      if (row.gmail_message_id) {
        if (!fetchedGmailIds.has(row.gmail_message_id)) {
          toDeleteIds.push(row.id);
          if (row.tracking_id) trackingIdsToDelete.push(row.tracking_id);
        }
      } else {
        // No gmail_message_id → match by subject (fuzzy)
        const rowSubject = (row.subject ?? "").toLowerCase().trim();
        const hasMatch = fetchedSubjects.has(rowSubject) ||
          [...fetchedSubjects].some((s) => s && rowSubject && (s.includes(rowSubject) || rowSubject.includes(s)));
        if (!hasMatch) {
          toDeleteIds.push(row.id);
          if (row.tracking_id) trackingIdsToDelete.push(row.tracking_id);
        }
      }
    }

    if (toDeleteIds.length > 0) {
      await supabase.from("lead_emails").delete().in("id", toDeleteIds);
    }

    if (trackingIdsToDelete.length > 0) {
      await supabase.from("email_tracking").delete().in("id", trackingIdsToDelete);
    }

    let totalAttachmentsSaved = 0;
    let hasReceivedAttachments = false;

    const toInsert = [];

    let hasSignedDocument = false;
    let hasUrgent = false;
    let hasCallbackRequested = false;

    for (const e of fetched) {
      if (existingIds.has(e.gmailMessageId)) continue;

      const isSent = e.from.toLowerCase() === gmailUser.toLowerCase();
      const attachmentsMeta: EmailAttachmentMeta[] = [];

      if (!isSent && e.attachments.length > 0) {
        for (const att of e.attachments) {
          try {
            const saved = await saveAttachment(supabase, leadId, att, e.date, currentUserId);
            attachmentsMeta.push(saved);
            totalAttachmentsSaved++;
            hasReceivedAttachments = true;
          } catch (err) {
            console.error("[syncLeadEmails] attachment save error:", err);
          }
        }
      }

      let aiAnalysis: EmailAnalysis | null = null;
      if (!isSent) {
        try {
          aiAnalysis = await analyzeEmail({
            subject: e.subject,
            htmlBody: e.htmlBody,
            textBody: e.textBody,
            fromEmail: e.from,
            hasAttachments: e.attachments.length > 0,
          });
          if (aiAnalysis) {
            if (aiAnalysis.signed) hasSignedDocument = true;
            if (aiAnalysis.urgent) hasUrgent = true;
            if (aiAnalysis.callbackRequested) hasCallbackRequested = true;
          }
        } catch (err) {
          console.error("[syncLeadEmails] AI analysis error:", err);
        }
      }

      toInsert.push({
        lead_id: leadId,
        direction: isSent ? "sent" : "received",
        from_email: e.from,
        to_email: e.to,
        subject: e.subject,
        html_body: e.htmlBody,
        text_body: e.textBody,
        gmail_message_id: e.gmailMessageId,
        email_date: e.date.toISOString(),
        attachments: attachmentsMeta,
        ai_analysis: aiAnalysis,
      });
    }

    if (toInsert.length === 0 && toDeleteIds.length === 0) {
      return { ok: true, synced: 0, deleted: 0, attachmentsSaved: 0, aiFlags: noFlags };
    }

    if (toInsert.length === 0) {
      return { ok: true, synced: 0, deleted: toDeleteIds.length, attachmentsSaved: 0, aiFlags: noFlags };
    }

    const { error } = await supabase
      .from("lead_emails")
      .insert(toInsert);

    if (error) {
      console.error("[syncLeadEmails] insert error:", error.message);
      return { ok: false, error: error.message };
    }

    if (hasSignedDocument || hasReceivedAttachments) {
      await supabase
        .from("leads")
        .update({ lead_status: "accord_received" })
        .eq("id", leadId)
        .in("lead_status", ["dossier_sent"]);

      // TODO: cee-workflows retiré — la mise à jour du workflow CEE (markAgreementSigned)
      // est désactivée jusqu'au nouveau modèle workflow.
    }

    return {
      ok: true,
      synced: toInsert.length,
      deleted: toDeleteIds.length,
      attachmentsSaved: totalAttachmentsSaved,
      aiFlags: {
        signed: hasSignedDocument,
        urgent: hasUrgent,
        callbackRequested: hasCallbackRequested,
      },
    };
  } catch (err) {
    console.error("[syncLeadEmails] error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la synchronisation.";
    return { ok: false, error: message };
  }
}

async function saveAttachment(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string,
  att: FetchedAttachment,
  emailDate: Date,
  createdBy: string | null,
): Promise<EmailAttachmentMeta> {
  const ts = emailDate.getTime();
  const safeName = att.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${leadId}/received/${ts}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("lead-studies")
    .upload(storagePath, att.content, {
      contentType: att.contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("lead-studies")
    .getPublicUrl(storagePath);

  const fileUrl = urlData.publicUrl;

  let documentId: string | undefined;

  if (createdBy) {
    const { data: doc } = await supabase
      .from("lead_documents")
      .insert({
        lead_id: leadId,
        document_type: "received_document",
        title: att.filename,
        file_url: fileUrl,
        storage_bucket: "lead-studies",
        storage_path: storagePath,
        status: "received",
        template_version: "email_attachment",
        metadata: {
          source: "email",
          content_type: att.contentType,
          size_bytes: att.size,
          received_at: emailDate.toISOString(),
        },
        created_by: createdBy,
      })
      .select("id")
      .single();

    documentId = doc?.id ?? undefined;
  }

  return {
    filename: att.filename,
    contentType: att.contentType,
    size: att.size,
    storageUrl: fileUrl,
    documentId,
  };
}
