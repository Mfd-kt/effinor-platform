import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Learning loop est désormais une section de l'onglet Réglages.
 * Cette URL reste un shim pour préserver les anciens bookmarks.
 */
export default function LeadGenerationLearningRedirectPage() {
  redirect("/lead-generation/settings");
}
