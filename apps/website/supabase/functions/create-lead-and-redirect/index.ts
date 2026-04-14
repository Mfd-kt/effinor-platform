/**
 * Edge Function Supabase : create-lead-and-redirect
 * 
 * Cette fonction crée un lead dans Supabase et génère l'URL de redirection
 * vers le formulaire complet avec tous les paramètres nécessaires.
 * 
 * ENTRÉE:
 *   - Body JSON : {
 *       name: string,
 *       company: string,
 *       email: string,
 *       phone: string,
 *       buildingType: string,
 *       surfaceArea: string,
 *       postalCode: string,
 *       landing: string (optionnel),
 *       redirectUrl: string (optionnel, URL de base pour redirection)
 *     }
 * 
 * SORTIE:
 *   - Succès (200) : { 
 *       success: true,
 *       leadId: "uuid",
 *       redirectUrl: "https://groupe-effinor.fr/formulaire-complet?leadId=...&prenom=...&nom=..."
 *     }
 *   - Erreur (400/500) : { 
 *       success: false,
 *       error: "...",
 *       details: "..." 
 *     }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Parser la surface depuis une string (ex: "100-500" -> 100)
function parseSurfaceArea(surfaceString: string | undefined): number | null {
  if (!surfaceString) return null;
  
  // Extraire le premier nombre trouvé
  const match = surfaceString.match(/\d+/);
  if (!match) return null;
  
  const value = parseInt(match[0], 10);
  
  // Validation: surface doit être positive et raisonnable (< 100000 m²)
  if (isNaN(value) || value <= 0 || value > 100000) {
    return null;
  }
  
  return value;
}

// Séparer nom et prénom depuis un nom complet
function splitName(fullName: string): { prenom: string; nom: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(' ');
  
  if (parts.length > 1) {
    return {
      prenom: parts[0],
      nom: parts.slice(1).join(' ')
    };
  } else {
    return {
      prenom: trimmed,
      nom: ''
    };
  }
}

Deno.serve(async (req) => {
  // Préflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Méthode non autorisée' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }

  try {
    // Parser le body
    const body = await req.json().catch(() => null);
    
    if (!body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Body JSON requis' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Validation des champs requis
    const { name, company, email, phone, buildingType, surfaceArea, postalCode, landing, redirectUrl } = body;
    
    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Champs requis manquants',
          details: 'name, email et phone sont obligatoires'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Créer un client Supabase avec service_role pour bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parser la surface
    const surfaceValue = parseSurfaceArea(surfaceArea);

    // Séparer nom et prénom
    const { prenom, nom } = splitName(name);

    // Mapper le type de bâtiment vers le format interne
    const buildingTypeMap: Record<string, string> = {
      'Bureau': 'offices',
      'Commerce': 'retail',
      'Industrie': 'factory',
      'Entrepôt': 'warehouse',
      'Autre': 'other'
    };
    const mappedBuildingType = buildingTypeMap[buildingType || ''] || 'warehouse';

    // Créer le premier bâtiment dans formulaire_data.buildings
    const firstBuilding = {
      type: mappedBuildingType,
      surface: surfaceValue,
      ceilingHeight: '',
      heating: false,
      heatingMode: '',
      heatingPower: '',
      heatingSetpoint: '',
    };

    const formulaireData = {
      ...body,
      buildings: [firstBuilding]
    };

    // Logger pour debug
    console.log('[create-lead-and-redirect] Bâtiment créé:', JSON.stringify(firstBuilding, null, 2));
    console.log('[create-lead-and-redirect] formulaire_data avec buildings:', JSON.stringify(formulaireData, null, 2));

    // Préparer les données du lead
    const leadData = {
      nom: nom || prenom, // Si pas de nom séparé, utiliser le prénom comme nom
      prenom: prenom,
      email: email.trim().toLowerCase(),
      telephone: phone.trim(),
      societe: company?.trim() || null,
      type_batiment: buildingType || null,
      surface_m2: surfaceValue,
      code_postal: postalCode?.trim() || null,
      source: landing || 'site_effinor_leadgen',
      type_projet: 'PAC / Déstratification CEE',
      created_at: new Date().toISOString(),
      statut: 'Nouveau lead',
      etape_formulaire: 'mini_form_completed',
      formulaire_complet: false,
      formulaire_data: formulaireData, // Inclure les bâtiments dans formulaire_data (Supabase convertira en JSONB)
    };

    // Créer le lead dans Supabase
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select('id')
      .single();

    if (insertError || !lead) {
      console.error('[create-lead-and-redirect] Erreur création lead:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erreur lors de la création du lead',
          details: insertError?.message || 'Lead non créé'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    const leadId = lead.id;

    // Vérifier que les bâtiments ont bien été sauvegardés
    const { data: createdLead, error: fetchError } = await supabase
      .from('leads')
      .select('formulaire_data')
      .eq('id', leadId)
      .single();

    if (!fetchError && createdLead) {
      try {
        const savedFormData = typeof createdLead.formulaire_data === 'string' 
          ? JSON.parse(createdLead.formulaire_data) 
          : createdLead.formulaire_data;
        const savedBuildings = savedFormData?.buildings || [];
        console.log('[create-lead-and-redirect] ✅ Lead créé avec', savedBuildings.length, 'bâtiment(s)');
        console.log('[create-lead-and-redirect] Bâtiments sauvegardés:', JSON.stringify(savedBuildings, null, 2));
      } catch (e) {
        console.warn('[create-lead-and-redirect] ⚠️ Erreur lors de la vérification des bâtiments:', e);
      }
    }

    // Générer l'URL de redirection
    // Détecter l'URL de base dans cet ordre de priorité :
    // 1) redirectUrl depuis body
    // 2) Header Origin
    // 3) Header Referer
    // 4) Fallback configuré
    const redirectUrlFromBody = typeof redirectUrl === 'string' ? redirectUrl.trim() : '';
    const originHeader = req.headers.get('origin') || '';
    const refererHeader = req.headers.get('referer') || '';
    
    let baseRedirectUrl = '';
    
    // Priorité 1 : redirectUrl depuis le body
    if (redirectUrlFromBody) {
      baseRedirectUrl = redirectUrlFromBody;
    }
    // Priorité 2 : Header Origin
    else if (originHeader) {
      try {
        const originUrl = new URL(originHeader);
        // Si l'origin est la landing, utiliser l'URL du formulaire complet
        baseRedirectUrl = 'https://groupe-effinor.fr/formulaire-complet';
      } catch (e) {
        // Ignorer erreur parsing
      }
    }
    // Priorité 3 : Header Referer
    else if (refererHeader) {
      try {
        const refererUrl = new URL(refererHeader);
        baseRedirectUrl = 'https://groupe-effinor.fr/formulaire-complet';
      } catch (e) {
        // Ignorer erreur parsing
      }
    }
    
    // Priorité 4 : Fallback
    if (!baseRedirectUrl) {
      baseRedirectUrl = 'https://groupe-effinor.fr/formulaire-complet';
    }
    
    // Nettoyer l'URL (enlever le trailing slash)
    baseRedirectUrl = baseRedirectUrl.replace(/\/$/, '');

    // Construire l'URL de redirection avec tous les paramètres
    const redirectUrlObj = new URL(baseRedirectUrl);
    redirectUrlObj.searchParams.set('leadId', leadId);
    
    // Ajouter les données essentielles pour pré-remplissage
    if (prenom) {
      redirectUrlObj.searchParams.set('prenom', prenom);
    }
    if (nom) {
      redirectUrlObj.searchParams.set('nom', nom);
    }
    if (email) {
      redirectUrlObj.searchParams.set('email', email);
    }
    if (phone) {
      redirectUrlObj.searchParams.set('telephone', phone);
    }
    if (postalCode) {
      redirectUrlObj.searchParams.set('code_postal', postalCode);
    }
    if (company) {
      redirectUrlObj.searchParams.set('societe', company);
    }

    const finalRedirectUrl = redirectUrlObj.toString();

    // Retourner le leadId et l'URL de redirection
    return new Response(
      JSON.stringify({
        success: true,
        leadId: leadId,
        redirectUrl: finalRedirectUrl
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders()
        } 
      }
    );

  } catch (error) {
    console.error('[create-lead-and-redirect] Erreur inattendue:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
});

