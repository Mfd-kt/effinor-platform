import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Cockpit est désormais une sous-vue de Pilotage (?view=cockpit).
 * Cette URL reste un shim pour préserver les anciens bookmarks.
 */
export default function LeadGenerationCockpitRedirectPage() {
  redirect("/lead-generation/management?view=cockpit");
}
