/**
 * Edge Function Supabase : create-stripe-checkout
 * 
 * Cette fonction crée une session Stripe Checkout pour une commande existante.
 * 
 * ENTRÉE:
 *   - Body JSON : { "commande_id": "UUID-de-la-commande", "site_url": "http://..." (optionnel) }
 * 
 * SORTIE:
 *   - Succès (200) : { "sessionId": "cs_test_...", "url": "https://checkout.stripe.com/..." }
 *   - Erreur (400/404/500) : { "error": "...", "details": "..." }
 * 
 * NOTES:
 *   - Les produits sont stockés dans commandes.produits (snapshot JSON).
 *   - La fonction met à jour la commande avec stripe_session_id, paiement_statut, mode_suivi, type_commande.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Dynamic import de Stripe
let stripeClient: any = null;
if (STRIPE_SECRET_KEY) {
  const stripeModule = await import('npm:stripe@14.21.0');
  stripeClient = stripeModule.default(STRIPE_SECRET_KEY);
}

Deno.serve(async (req) => {
  // Préflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }

  // Vérifier la clé Stripe
  if (!STRIPE_SECRET_KEY || !stripeClient) {
    return new Response(
      JSON.stringify({ error: 'Stripe n\'est pas configuré' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }

  try {
    // Parser le body
    const body = await req.json().catch(() => null);
    const commande_id = body?.commande_id;

    if (!commande_id) {
      return new Response(
        JSON.stringify({ error: 'commande_id est requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }

    // Détecter l'URL du site dans cet ordre de priorité :
    // 1) site_url depuis body (envoyé par le frontend)
    // 2) Header Origin
    // 3) Header Referer
    // 4) Fallback localhost (dev uniquement)
    const siteUrlFromBody = typeof body?.site_url === 'string' ? body.site_url.trim() : '';
    const originHeader = req.headers.get('origin') || '';
    const refererHeader = req.headers.get('referer') || '';
    
    let baseUrl = '';
    
    // Priorité 1 : site_url depuis le body
    if (siteUrlFromBody) {
      baseUrl = siteUrlFromBody;
    }
    // Priorité 2 : Header Origin
    else if (originHeader) {
      try {
        baseUrl = new URL(originHeader).origin;
      } catch (e) {
        // Ignorer erreur parsing
      }
    }
    // Priorité 3 : Header Referer
    else if (refererHeader) {
      try {
        baseUrl = new URL(refererHeader).origin;
      } catch (e) {
        // Ignorer erreur parsing
      }
    }
    
    // Priorité 4 : Fallback localhost (dev uniquement)
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }
    
    // Nettoyer l'URL (enlever le trailing slash)
    baseUrl = baseUrl.replace(/\/$/, '');

    // Créer un client Supabase avec service_role pour bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Récupérer la commande
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .select('*')
      .eq('id', commande_id)
      .single()

    if (commandeError || !commande) {
      return new Response(
        JSON.stringify({ error: 'Commande non trouvée', details: commandeError?.message }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }

    // Calculer le montant total TTC
    const totalTtc = commande.total_ttc || (commande.total_ht ? commande.total_ht * 1.2 : 0);
    
    // Vérifier que le montant est valide
    if (!totalTtc || totalTtc <= 0) {
      return new Response(
        JSON.stringify({ error: 'Le montant de la commande doit être supérieur à 0' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }

    // Construire les URLs de redirection avec encodeURIComponent pour les paramètres
    const successUrl = `${baseUrl}/paiement/succes?commande_id=${commande.id}&ref=${encodeURIComponent(commande.reference || '')}`;
    const cancelUrl = `${baseUrl}/paiement/annulee?commande_id=${commande.id}&ref=${encodeURIComponent(commande.reference || '')}`;

    // Créer la session Stripe Checkout
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(totalTtc * 100), // En centimes
            product_data: {
              name: commande.reference || 'Commande Effinor',
              description: 'Commande luminaires Effinor',
            },
          },
        },
      ],
      customer_email: commande.email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        commande_id: commande.id,
        reference: commande.reference || '',
      },
    });

    // Vérifier que l'URL est présente
    if (!session.url) {
      return new Response(
        JSON.stringify({ 
          error: 'URL de checkout non disponible',
          sessionId: session.id,
          details: 'La session Stripe a été créée mais l\'URL de checkout n\'est pas disponible. Vérifiez la configuration Stripe.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Mettre à jour la commande avec stripe_session_id et statuts
    const { error: updateError } = await supabase
      .from('commandes')
      .update({
        stripe_session_id: session.id,
        paiement_statut: 'en_attente',
        mode_suivi: 'paiement_en_ligne',
        type_commande: 'commande',
      })
      .eq('id', commande_id)

    if (updateError) {
      // On continue quand même car la session Stripe est créée
      console.error('[create-stripe-checkout] Erreur mise à jour commande:', updateError);
    }

    // Retourner le sessionId ET l'URL
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders()
        } 
      }
    )

  } catch (error) {
    console.error('[create-stripe-checkout] Erreur:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de la création de la session Stripe',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    )
  }
});
