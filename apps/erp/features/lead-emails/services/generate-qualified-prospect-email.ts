import OpenAI from "openai";

import {
  QUALIFIED_PROSPECT_EMAIL_SYSTEM_PROMPT,
  buildQualifiedProspectEmailUserPrompt,
} from "../lib/build-openai-qualified-email-prompt";
import { getOpenAiQualifiedEmailModel } from "../lib/qualified-prospect-email-config";
import type { OpenAiGeneratedQualifiedEmail, QualifiedLeadEmailContext } from "../domain/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseGeneratedEmail(raw: unknown): OpenAiGeneratedQualifiedEmail | null {
  if (!isRecord(raw)) return null;
  const subject = raw.subject;
  const email_body = raw.email_body;
  const used_signals = raw.used_signals;
  const confidence = raw.confidence;
  if (typeof subject !== "string" || typeof email_body !== "string") return null;
  if (!Array.isArray(used_signals) || !used_signals.every((x) => typeof x === "string")) return null;
  if (confidence !== "high" && confidence !== "medium" && confidence !== "low") return null;
  return {
    subject,
    email_body,
    used_signals,
    confidence,
  };
}

export async function generateQualifiedProspectEmailWithOpenAI(
  context: QualifiedLeadEmailContext,
): Promise<OpenAiGeneratedQualifiedEmail> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquante.");
  }

  const openai = new OpenAI({
    apiKey,
    timeout: Math.max(15_000, parseInt(process.env.OPENAI_QUALIFIED_LEAD_EMAIL_TIMEOUT_MS ?? "60000", 10) || 60_000),
  });

  const model = getOpenAiQualifiedEmailModel();
  const user = buildQualifiedProspectEmailUserPrompt(context);

  const res = await openai.chat.completions.create({
    model,
    temperature: 0.35,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: QUALIFIED_PROSPECT_EMAIL_SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
  });

  const content = res.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Réponse OpenAI vide.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new Error("JSON OpenAI invalide.");
  }

  const out = parseGeneratedEmail(parsed);
  if (!out) {
    throw new Error("Structure JSON OpenAI inattendue.");
  }
  return out;
}
