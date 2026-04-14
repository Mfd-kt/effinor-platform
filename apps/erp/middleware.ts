import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Exclure tout `/_next/*` (pas seulement static/image). Sinon le middleware peut
     * s’exécuter sur des requêtes internes Next et le client reçoit une réponse
     * non-Flight → « An unexpected response was received from the server ».
     */
    "/((?!_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
