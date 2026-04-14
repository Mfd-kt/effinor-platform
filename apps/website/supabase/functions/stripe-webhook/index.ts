// supabase/functions/stripe-webhook/index.ts

// 1) Imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

// 2) Env
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !serviceRoleKey) {
  console.error("[Webhook] Missing env vars. Check STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

// 3) Stripe client
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: "2023-10-16",
});

// 4) Helper : client Supabase (créé dans chaque requête)
const getSupabaseClient = () =>
  createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      persistSession: false,
    },
  });

// 5) Helper : mise à jour de la commande
async function setCommandeStatus(params: {
  commandeId: string | undefined;
  statutPaiement: "en_attente" | "payee" | "refusee" | "annulee";
  stripePaymentIntentId?: string | null;
  lastEventType: string;
  lastError?: string | null;
}) {
  const { commandeId, statutPaiement, stripePaymentIntentId, lastEventType, lastError } = params;

  const supabase = getSupabaseClient();

  // Si pas de commandeId (cas des triggers CLI Stripe sans metadata), on loggue et on sort
  if (!commandeId) {
    console.info("[Webhook] setCommandeStatus ignoré : commandeId absent", {
      statutPaiement,
      lastEventType,
    });
    return;
  }

  console.info("[Webhook] setCommandeStatus", {
    commandeId,
    statutPaiement,
    lastEventType,
    stripePaymentIntentId,
  });

  // On vérifie que la commande existe (évite PGRST116)
  const { data: existing, error: fetchError } = await supabase
    .from("commandes")
    .select("id, paiement_statut")
    .eq("id", commandeId)
    .maybeSingle();

  if (fetchError) {
    console.error("[Webhook] Erreur fetch commande", fetchError);
    return;
  }

  if (!existing) {
    console.warn("[Webhook] Commande introuvable, rien à mettre à jour", { commandeId });
    return;
  }

  // Idempotence simple : si déjà payée, on ne re-bouge pas
  if (existing.paiement_statut === "payee" && statutPaiement === "payee") {
    console.info("[Webhook] Commande déjà marquée payée, on ne modifie pas", { commandeId });
    return;
  }

  const { error: updateError } = await supabase
    .from("commandes")
    .update({
      paiement_statut: statutPaiement,
      stripe_payment_intent_id: stripePaymentIntentId ?? null,
      stripe_last_event: lastEventType,
      stripe_last_event_at: new Date().toISOString(),
      stripe_last_error: lastError ?? null,
    })
    .eq("id", commandeId);

  if (updateError) {
    console.error("[Webhook] Erreur update commande", updateError);
    return;
  }

  console.info("[Webhook] Commande mise à jour avec succès", {
    commandeId,
    statutPaiement,
    lastEventType,
  });
}

// 6) Handler principal
serve(async (req: Request): Promise<Response> => {
  // CORS préflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig || !stripeWebhookSecret) {
    console.error("[Webhook] Missing stripe-signature header ou STRIPE_WEBHOOK_SECRET");
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: string;
  try {
    body = await req.text();
  } catch (err) {
    console.error("[Webhook] Impossible de lire le body", err);
    return new Response(JSON.stringify({ error: "Unable to read body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: Stripe.Event;

  try {
    // IMPORTANT : constructEventAsync (sinon erreur SubtleCryptoProvider)
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      stripeWebhookSecret
    );
  } catch (err: any) {
    console.error("[Webhook] Invalid Stripe signature", err);
    return new Response(
      JSON.stringify({ error: `Invalid signature: ${err.message}` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  console.info("[Webhook] Event reçu", {
    id: event.id,
    type: event.type,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata ?? {};
        const commandeId = metadata["commande_id"] as string | undefined;

        console.info("[Webhook] checkout.session.completed", {
          commandeId,
          metadata,
        });

        await setCommandeStatus({
          commandeId,
          statutPaiement: "payee",
          stripePaymentIntentId: session.payment_intent?.toString() ?? null,
          lastEventType: event.type,
        });

        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metadata = pi.metadata ?? {};
        const commandeId = metadata["commande_id"] as string | undefined;

        console.info("[Webhook] payment_intent.succeeded", {
          commandeId,
          metadata,
        });

        await setCommandeStatus({
          commandeId,
          statutPaiement: "payee",
          stripePaymentIntentId: pi.id,
          lastEventType: event.type,
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metadata = pi.metadata ?? {};
        const commandeId = metadata["commande_id"] as string | undefined;

        const lastError = pi.last_payment_error?.message ?? null;

        console.info("[Webhook] payment_intent.payment_failed", {
          commandeId,
          metadata,
          lastError,
        });

        await setCommandeStatus({
          commandeId,
          statutPaiement: "refusee",
          stripePaymentIntentId: pi.id,
          lastEventType: event.type,
          lastError,
        });

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata ?? {};
        const commandeId = metadata["commande_id"] as string | undefined;

        console.info("[Webhook] checkout.session.expired", {
          commandeId,
          metadata,
        });

        await setCommandeStatus({
          commandeId,
          statutPaiement: "annulee",
          stripePaymentIntentId: session.payment_intent?.toString() ?? null,
          lastEventType: event.type,
        });

        break;
      }

      default: {
        console.info("[Webhook] Event ignoré (type non géré)", {
          type: event.type,
        });
        break;
      }
    }

    // Réponse OK à Stripe
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Webhook] Erreur interne", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});