import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Analytics sont désormais intégrées au Pilotage (sous-vue analytics).
 * Cette URL reste un shim pour préserver les anciens bookmarks.
 */
export default function LeadGenerationAnalyticsRedirectPage() {
  redirect("/lead-generation/management?view=analytics");
}
