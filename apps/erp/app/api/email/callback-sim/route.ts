import { type NextRequest, NextResponse } from "next/server";

import { resolveCallbackInitialEmailSimulatorUrl } from "@/features/commercial-callbacks/lib/callback-initial-email-simulator-url";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

/**
 * Redirection vers le simulateur après enregistrement d’un clic (suivi e-mail rappels commerciaux).
 */
export async function GET(req: NextRequest) {
  const dest = resolveCallbackInitialEmailSimulatorUrl();
  const tid = req.nextUrl.searchParams.get("tid")?.trim() ?? "";

  if (!UUID_RE.test(tid)) {
    return NextResponse.redirect(dest, 302);
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data } = await supabase
      .from("email_tracking")
      .select("click_count, first_clicked_at")
      .eq("id", tid)
      .maybeSingle();

    if (data) {
      await supabase
        .from("email_tracking")
        .update({
          click_count: (data.click_count ?? 0) + 1,
          first_clicked_at: data.first_clicked_at ?? now,
          last_clicked_at: now,
        })
        .eq("id", tid);
    }
  } catch (e) {
    console.error("[api/email/callback-sim]", tid, e);
  }

  return NextResponse.redirect(dest, 302);
}
