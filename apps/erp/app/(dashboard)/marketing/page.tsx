import { redirect } from "next/navigation";

/**
 * Entrée unique /marketing : renvoie vers le premier onglet (blog).
 */
export default function MarketingIndexPage() {
  redirect("/marketing/blog");
}
