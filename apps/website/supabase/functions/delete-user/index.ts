// supabase/functions/delete-user/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

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

// CORS pour futur appel depuis le front
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  }

  try {
    const body = await req.json().catch(() => null) as
      | {
          auth_user_id?: string;
          utilisateur_id?: string;
        }
      | null;

    const authUserId = body?.auth_user_id?.trim();
    const utilisateurId = body?.utilisateur_id?.trim();

    if (!authUserId && !utilisateurId) {
      return new Response(
        JSON.stringify({
          error:
            "auth_user_id ou utilisateur_id est obligatoire pour supprimer un utilisateur.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // 1) Supprimer dans auth.users si possible
    let authDeleted = false;

    if (authUserId) {
      const { error: authError } =
        await adminClient.auth.admin.deleteUser(authUserId);

      if (authError) {
        console.error("Erreur suppression auth.users:", authError);
      } else {
        authDeleted = true;
      }
    }

    // 2) Supprimer dans public.utilisateurs
    let where: Record<string, string> = {};

    if (utilisateurId) where = { id: utilisateurId };
    else if (authUserId) where = { auth_user_id: authUserId };

    let tableDeleted = false;

    if (Object.keys(where).length > 0) {
      const { error: tableError } = await adminClient
        .from("utilisateurs")
        .delete()
        .match(where);

      if (tableError) {
        console.error("Erreur suppression public.utilisateurs:", tableError);
      } else {
        tableDeleted = true;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        auth_deleted: authDeleted,
        table_deleted: tableDeleted,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (err) {
    console.error("Erreur inattendue delete-user:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  }
});
