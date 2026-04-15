import { NextRequest, NextResponse } from "next/server";

import { geocodeFranceAddressServer } from "@/features/technical-visits/lib/nominatim-geocode-server";
import { createClient } from "@/lib/supabase/server";

const MAX_QUERY_LEN = 500;

/**
 * Proxy géocodage Nominatim pour le client (carte visites techniques).
 * Évite CORS / fetch navigateur vers openstreetmap.org.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(null);
  }
  if (q.length > MAX_QUERY_LEN) {
    return NextResponse.json({ error: "Requête trop longue." }, { status: 400 });
  }

  const coords = await geocodeFranceAddressServer(q);
  return NextResponse.json(coords);
}
