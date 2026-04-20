import {
  FORBIDDEN_PROSPECT_EMAIL_PHRASES,
  MAX_EMAIL_BODY_CHARS,
  MAX_EMAIL_SUBJECT_CHARS,
  MAX_BODY_LINES,
  MIN_BODY_LINES,
  MIN_PERSONALIZATION_SCORE,
} from "../domain/constants";
import type { OpenAiGeneratedQualifiedEmail, QualifiedEmailValidationResult } from "../domain/types";
import type { QualifiedLeadEmailContext } from "../domain/types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function containsForbiddenPhrase(text: string): boolean {
  const n = normalize(text);
  return FORBIDDEN_PROSPECT_EMAIL_PHRASES.some((p) => n.includes(normalize(p)));
}

function hasUnresolvedPlaceholder(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text) || /\$\{[^}]+\}/.test(text);
}

function countLines(text: string): number {
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
}

function tokenizeHint(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9àâäéèêëïîôùûüç]+/i)
    .filter((w) => w.length >= 3);
}

/**
 * Score minimal : combien d’indices du contexte apparaissent réellement dans le corps (hors générique).
 */
export function computeEmailPersonalizationScore(
  body: string,
  subject: string,
  ctx: QualifiedLeadEmailContext,
): number {
  const hay = `${subject}\n${body}`;
  const nhay = normalize(hay);
  let score = 0;

  const tryMatch = (frag: string | null | undefined) => {
    if (!frag || frag.trim().length < 2) return;
    const t = normalize(frag.trim());
    if (t.length >= 3 && nhay.includes(t)) score += 1;
  };

  tryMatch(ctx.company_name);
  tryMatch(ctx.city);
  tryMatch(ctx.activity ?? undefined);
  tryMatch(ctx.contact_full_name ?? undefined);
  tryMatch(ctx.contact_role ?? undefined);

  if (ctx.postal_code?.trim() && nhay.includes(normalize(ctx.postal_code.trim()))) score += 1;

  const bs = ctx.building_signals;
  if (bs.heating_type && nhay.includes(normalize(bs.heating_type.slice(0, 40)))) score += 1;
  if (bs.surface && nhay.includes(normalize(bs.surface.slice(0, 30)))) score += 1;
  if (bs.height && nhay.includes(normalize(bs.height.slice(0, 30)))) score += 1;
  if (bs.other_notes) {
    for (const w of tokenizeHint(bs.other_notes).slice(0, 6)) {
      if (w.length >= 4 && nhay.includes(w)) {
        score += 1;
        break;
      }
    }
  }

  return score;
}

export function validateGeneratedQualifiedEmail(
  gen: OpenAiGeneratedQualifiedEmail,
  ctx: QualifiedLeadEmailContext,
  opts?: { isFallback?: boolean },
): QualifiedEmailValidationResult {
  const subject = gen.subject?.trim() ?? "";
  const body = gen.email_body?.trim() ?? "";
  const minLines = opts?.isFallback ? 4 : MIN_BODY_LINES;
  const minScore = opts?.isFallback ? 1 : MIN_PERSONALIZATION_SCORE;

  if (!subject || !body) {
    return { ok: false, reason: "Sujet ou corps vide.", personalizationScore: 0 };
  }
  if (subject.length > MAX_EMAIL_SUBJECT_CHARS || body.length > MAX_EMAIL_BODY_CHARS) {
    return { ok: false, reason: "Sujet ou corps trop long.", personalizationScore: 0 };
  }
  if (hasUnresolvedPlaceholder(subject) || hasUnresolvedPlaceholder(body)) {
    return { ok: false, reason: "Placeholders non résolus.", personalizationScore: 0 };
  }
  if (containsForbiddenPhrase(subject) || containsForbiddenPhrase(body)) {
    return { ok: false, reason: "Formulation interdite détectée.", personalizationScore: 0 };
  }

  const lines = countLines(body);
  if (lines < minLines || lines > MAX_BODY_LINES) {
    return {
      ok: false,
      reason: `Nombre de lignes hors plage (${lines}).`,
      personalizationScore: computeEmailPersonalizationScore(body, subject, ctx),
    };
  }

  const personalizationScore = computeEmailPersonalizationScore(body, subject, ctx);
  if (personalizationScore < minScore) {
    return {
      ok: false,
      reason: "Personnalisation insuffisante (peu de faits du contexte retrouvés dans le texte).",
      personalizationScore,
    };
  }

  if (!opts?.isFallback && gen.confidence === "low") {
    return {
      ok: false,
      reason: "Confiance modèle « low ».",
      personalizationScore,
    };
  }

  return { ok: true, personalizationScore };
}
