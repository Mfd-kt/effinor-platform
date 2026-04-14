// supabase/functions/create-user/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

// ⚠️ ICI on lit les NOMS des variables d'environnement,
// pas l'URL / la clé en dur
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans les secrets Edge."
  );
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// CORS (utile quand on appellera la fonction depuis ton front)
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  // Préflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      },
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as
      | {
          email?: string;
          full_name?: string;
          role_slug?: string;
          send_email?: boolean;
        }
      | null;

    const email = body?.email?.trim();
    const full_name = body?.full_name?.trim() || "";
    const role_slug = body?.role_slug?.trim() || null;
    const send_email = body?.send_email ?? true; // pour l’instant non utilisé, mais on le garde

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email obligatoire" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        },
      );
    }

    // 1) Rôle optionnel
    let roleId: string | null = null;

    if (role_slug) {
      const { data: role, error: roleError } = await adminClient
        .from("roles")
        .select("id")
        .eq("slug", role_slug)
        .maybeSingle();

      if (roleError) {
        console.error("Erreur roles:", roleError);
        return new Response(
          JSON.stringify({
            error: "Erreur lors de la récupération du rôle",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          },
        );
      }

      roleId = role?.id ?? null;
    }

    // 2) Création + email d'invitation Auth
    // ⚠️ IMPORTANT: redirectTo doit pointer vers /auth/callback pour que le token soit valide
    const SITE_URL = Deno.env.get("SITE_URL") || "https://groupe-effinor.fr";
    const redirectTo = `${SITE_URL}/auth/callback?type=invite`;
    
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          full_name,
          role_slug,
          role_id: roleId,
        },
      });

    if (inviteError) {
      console.error("Erreur inviteUserByEmail:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        },
      );
    }

    const user = inviteData?.user;

    // 3) Upsert dans ta table utilisateurs
    if (user) {
      const { error: upsertError } = await adminClient
        .from("utilisateurs")
        .upsert(
          {
            auth_user_id: user.id,
            email,
            full_name,
            nom: full_name,
            role_id: roleId,
            active: true,
            invitation_acceptee: false,
            date_invitation: new Date().toISOString(),
          },
          { onConflict: "auth_user_id" },
        );

      if (upsertError) {
        console.error("Erreur upsert utilisateurs:", upsertError);
        // on log seulement
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user?.id ?? null,
        email,
        full_name,
        role_slug,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      },
    );
  } catch (err) {
    console.error("Erreur inattendue create-user:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      },
    );
  }
});