import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Automatisations sont désormais une section de l'onglet Réglages.
 * Cette URL reste un shim pour préserver les anciens bookmarks.
 */
export default function LeadGenerationAutomationRedirectPage() {
  redirect("/lead-generation/settings");
}
