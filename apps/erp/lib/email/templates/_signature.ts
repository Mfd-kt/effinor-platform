/**
 * Bloc signature minimaliste (prénom uniquement) — utilisé par `_base-layout.ts`.
 *
 * Ce module est volontairement isolé (pas d'import depuis `_base-layout`) pour
 * éviter tout risque de cycle d'import.
 */

const TEXT_PRIMARY = "#1B1B1B";
const TEXT_MUTED = "#5F5E5A";
const FONT_STACK = "Arial,Helvetica,sans-serif";

function escape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Signature HTML minimaliste : prénom de l'agent + mention "L'équipe EFFINOR" en gris.
 */
export function renderSignatureHtml(agentPrenom: string): string {
  const name = (agentPrenom?.trim() || "L'équipe").trim();
  return [
    `<p style="margin:0;color:${TEXT_PRIMARY};font-family:${FONT_STACK};font-size:14px;font-weight:600;">${escape(name)}</p>`,
    `<p style="margin:2px 0 0;color:${TEXT_MUTED};font-family:${FONT_STACK};font-size:12px;">L'équipe EFFINOR</p>`,
  ].join("");
}

/**
 * Version texte brut (clients qui ne lisent pas le HTML).
 */
export function renderSignatureText(agentPrenom: string): string {
  const name = (agentPrenom?.trim() || "L'équipe").trim();
  return `${name}\nL'équipe EFFINOR`;
}
