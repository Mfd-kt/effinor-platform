import type { RoleDigest } from "./digest-types";

/** Rendu texte brut (e-mail / log) — sobre. */
export function renderRoleDigestPlainText(d: RoleDigest): string {
  const lines: string[] = [
    d.title,
    "",
    d.summary,
    "",
    ...d.sections.flatMap((s) => [`## ${s.title}`, ...s.items.map((i) => `• ${i}`), ""]),
    "Actions :",
    ...d.actionItems.map((a) => `- ${a.label}${a.actionHref ? ` → ${a.actionHref}` : ""}`),
    "",
    `Généré : ${d.generatedAt}`,
  ];
  return lines.join("\n").trim();
}
