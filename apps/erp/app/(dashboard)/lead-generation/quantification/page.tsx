import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Quantification fusionne désormais avec l'onglet Imports : le quantifier y voit
 * uniquement ses propres lots (filtre serveur `quantifierOnly`).
 * Cette URL reste un shim pour préserver les anciens bookmarks.
 */
export default function LeadGenerationQuantificationRedirectPage() {
  redirect("/lead-generation/imports");
}
