import { type NextRequest } from "next/server";

import { handleEmailOpenPixel } from "@/lib/email/email-open-pixel";

/** Pixel d’ouverture : chemin neutre (évite les listes qui bloquent `/track`). */
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handleEmailOpenPixel(req, id, "[api/open]");
}
