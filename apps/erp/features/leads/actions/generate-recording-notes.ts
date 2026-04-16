"use server";

import OpenAI, { toFile } from "openai";

import {
  erpJsonToLeadFill,
  splitRecordingAnalysisOutput,
} from "@/features/leads/lib/parse-recording-analysis-output";
import { RECORDING_CALL_ANALYSIS_SYSTEM_PROMPT } from "@/features/leads/lib/recording-analysis-prompt";
import type { LeadInsertInput } from "@/features/leads/schemas/lead.schema";
import { LEAD_MEDIA_BUCKET } from "@/features/leads/lib/lead-media-shared";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseUrl } from "@/lib/supabase/public-env";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/** Évite les abus (SSRF) : seuls les fichiers audio du lead dans le bucket média sont acceptés. */
function validateRecordingUrlsForLead(urls: string[], leadId: string): string | null {
  const base = getPublicSupabaseUrl();
  if (!base) return "PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL manquant.";
  let expectedHost: string;
  try {
    expectedHost = new URL(base).hostname;
  } catch {
    return "URL Supabase invalide.";
  }
  const bucket = LEAD_MEDIA_BUCKET;
  for (const url of urls) {
    try {
      const u = new URL(url);
      if (u.hostname !== expectedHost) return "URL de fichier non autorisée.";
      const path = decodeURIComponent(u.pathname);
      if (!path.includes(`/${bucket}/`) || !path.includes(`/leads/${leadId}/recording/`)) {
        return "URL de fichier non autorisée.";
      }
    } catch {
      return "URL de fichier invalide.";
    }
  }
  return null;
}

function safeFilenameFromUrl(url: string, index: number): string {
  try {
    const last = new URL(url).pathname.split("/").pop()?.split("?")[0] ?? "";
    const cleaned = last.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    return cleaned || `recording-${index}.mp3`;
  } catch {
    return `recording-${index}.mp3`;
  }
}

export type GenerateRecordingNotesResult =
  | { ok: true; notes: string; fill: Partial<LeadInsertInput> }
  | { ok: false; message: string };

export async function generateRecordingNotesFromLeadAction(input: {
  leadId: string;
  /** URLs actuellement présentes dans le formulaire (y compris non encore sauvegardées). */
  recordingUrls: string[];
}): Promise<GenerateRecordingNotesResult> {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPEOPENAI_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      message:
        "Clé API OpenAI manquante. Dans .env.local, utilisez exactement OPENAI_API_KEY=sk-... puis redémarrez npm run dev.",
    };
  }

  const chatModel =
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";
  const { leadId, recordingUrls } = input;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Session expirée, reconnectez-vous." };
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadError || !lead) {
    return { ok: false, message: leadError?.message ?? "Lead introuvable." };
  }

  const urls = recordingUrls.filter((u) => typeof u === "string" && u.trim().length > 0);
  if (!urls.length) {
    return { ok: false, message: "Ajoutez au moins un fichier audio dans « Enregistrements audio »." };
  }
  // Anti-mélange : même si plusieurs URLs arrivent, on transcrit uniquement la plus récente.
  const latestUrl = urls[urls.length - 1]!;
  const urlsToProcess = [latestUrl];

  const urlError = validateRecordingUrlsForLead(urlsToProcess, leadId);
  if (urlError) {
    return { ok: false, message: urlError };
  }

  const openai = new OpenAI({ apiKey });

  const transcriptParts: string[] = [];

  for (let i = 0; i < urlsToProcess.length; i++) {
    const audioUrl = urlsToProcess[i];
    const res = await fetch(audioUrl);
    if (!res.ok) {
      return { ok: false, message: `Téléchargement impossible pour un fichier audio (${res.status}).` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_AUDIO_BYTES) {
      return {
        ok: false,
        message: `Un fichier dépasse la limite de 25 Mo pour la transcription OpenAI : ${safeFilenameFromUrl(audioUrl, i)}.`,
      };
    }

    const name = safeFilenameFromUrl(audioUrl, i);
    const file = await toFile(buf, name);

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "fr",
    });

    const text = typeof transcription === "string" ? transcription : transcription.text;
    if (text?.trim()) {
      transcriptParts.push(text.trim());
    }
  }

  if (!transcriptParts.length) {
    return { ok: false, message: "Transcription vide : vérifiez que l'audio est lisible." };
  }

  const fullTranscript = transcriptParts.join("\n\n");

  const completion = await openai.chat.completions.create({
    model: chatModel,
    messages: [
      { role: "system", content: RECORDING_CALL_ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Voici la transcription brute du dernier enregistrement d'appel :\n\n${fullTranscript}`,
      },
    ],
    max_completion_tokens: 8192,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    return { ok: false, message: "Le modèle n'a pas renvoyé de texte. Réessayez." };
  }

  const { markdown, erp } = splitRecordingAnalysisOutput(raw);
  const fill = erpJsonToLeadFill(erp);

  return {
    ok: true,
    notes: markdown.trim() || raw.trim(),
    fill,
  };
}
