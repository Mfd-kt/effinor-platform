import { redirect } from "next/navigation";

/**
 * Ancienne URL du carnet : redirige vers `/lead-generation` avec les mêmes filtres.
 */
export default async function LeadGenerationStockRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (key === "view") {
      continue;
    }
    if (typeof val === "string" && val.trim() !== "") {
      p.set(key, val);
    }
  }
  const qs = p.toString();
  redirect(qs ? `/lead-generation?${qs}` : "/lead-generation");
}
