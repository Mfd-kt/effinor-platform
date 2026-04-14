import { type NextRequest } from "next/server";

import { handleEmailOpenPixel } from "@/lib/email/email-open-pixel";

/** @deprecated Préférer `/api/open/[id]` — ce chemin est souvent bloqué par les bloqueurs de pistage. */
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> },
) {
  const { trackingId } = await params;
  return handleEmailOpenPixel(req, trackingId, "[api/email/track]");
}
