import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr/dist/module/createServerClient";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/supabase/public-env";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export const EMAIL_OPEN_PIXEL_HEADERS = {
  "Content-Type": "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function gifResponse(): NextResponse {
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: EMAIL_OPEN_PIXEL_HEADERS,
  });
}

async function isInternalUser(req: NextRequest): Promise<boolean> {
  try {
    const url = getPublicSupabaseUrl();
    const key = getPublicSupabaseAnonKey();
    if (!url || !key) return false;

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Enregistre une ouverture (pixel1×1) pour email_tracking.id = trackingId.
 * Logique partagée par /api/open/[id] et /api/email/track/[id] (ancien chemin).
 */
export async function handleEmailOpenPixel(
  req: NextRequest,
  trackingId: string,
  logLabel: string,
): Promise<NextResponse> {
  if (!UUID_RE.test(trackingId)) {
    return gifResponse();
  }

  try {
    if (await isInternalUser(req)) {
      return gifResponse();
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const ua = req.headers.get("user-agent") ?? null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null;

    const { data } = await supabase
      .from("email_tracking")
      .select("open_count, opened_at")
      .eq("id", trackingId)
      .single();

    if (data) {
      await supabase
        .from("email_tracking")
        .update({
          opened_at: data.opened_at ?? now,
          last_opened_at: now,
          open_count: (data.open_count ?? 0) + 1,
          user_agent: ua,
          ip_address: ip,
        })
        .eq("id", trackingId);
    }
  } catch (err) {
    console.error(logLabel, trackingId, err);
  }

  return gifResponse();
}
