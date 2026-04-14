import { supabase } from '@/lib/supabaseClient';

/**
 * CRM Lead Management API
 * Professional lead management functions for ECPS
 */

// Lead statuses with colors
export const LEAD_STATUSES = {
  nouveau: { label: 'Nouveau', color: 'gray', order: 1 },
  contacte: { label: 'Contacté', color: 'blue', order: 2 },
  qualifie: { label: 'Qualifié', color: 'yellow', order: 3 },
  devis_envoye: { label: 'Devis envoyé', color: 'orange', order: 4 },
  en_negociation: { label: 'En négociation', color: 'purple', order: 5 },
  gagne: { label: 'Gagné', color: 'green', order: 6 },
  perdu: { label: 'Perdu', color: 'red', order: 7 },
  en_attente: { label: 'En attente', color: 'slate', order: 8 }
};

// Priorities
export const PRIORITIES = {
  haute: { label: 'Haute', color: 'red', icon: '🔴' },
  normale: { label: 'Normale', color: 'yellow', icon: '🟡' },
  basse: { label: 'Basse', color: 'gray', icon: '⚪' }
};

// Project types
export const PROJECT_TYPES = [
  'Pompe à chaleur',
  'Déstratificateur d\'air',
  'Climatisation',
  'Isolation',
  'Ventilation',
  'Autre'
];

/**
 * Get all leads with filters and pagination
 */
export async function getAllLeads({ 
  filters = {}, 
  page = 1, 
  pageSize = 50,
  sortBy = 'created_at',
  sortOrder = 'desc',
  searchQuery = ''
} = {}) {
  try {
    let query = supabase
      .from('leads')
      .select(`
        *,
        status:status_id (
          id,
          code,
          label,
          color,
          pipeline_order,
          is_won,
          is_lost,
          is_closed,
          is_default
        ),
        commercial_assigne:commercial_assigne_id (
          id,
          prenom,
          nom,
          email,
          photo_profil_url
        )
      `, { count: 'exact' });

    // Search query (full-text search)
    if (searchQuery) {
      query = query.or(`
        nom.ilike.%${searchQuery}%,
        prenom.ilike.%${searchQuery}%,
        societe.ilike.%${searchQuery}%,
        email.ilike.%${searchQuery}%,
        telephone.ilike.%${searchQuery}%
      `);
    }

    // Apply filters - ONLY apply if value is not 'all', null, undefined, or empty
    if (filters.statut && filters.statut !== 'all') {
      // Handle array for multi-select (can be status slugs or status_id UUIDs)
      if (Array.isArray(filters.statut)) {
        if (filters.statut.length > 0) {
          // Check if it's UUIDs (status_id) or slugs
          const isUUIDs = filters.statut[0] && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.statut[0]);
          if (isUUIDs) {
            query = query.in('status_id', filters.statut);
          } else {
            // Filter by slug via join (fallback to text column for backward compatibility)
            query = query.in('statut', filters.statut);
          }
        }
      } else {
        // Single value: check if UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.statut);
        if (isUUID) {
          query = query.eq('status_id', filters.statut);
        } else {
          // Filter by slug via join (fallback to text column for backward compatibility)
          query = query.eq('statut', filters.statut);
        }
      }
    }
    
    // Filter by status_id if provided (higher priority)
    if (filters.status_id && filters.status_id !== 'all') {
      if (Array.isArray(filters.status_id)) {
        if (filters.status_id.length > 0) {
          query = query.in('status_id', filters.status_id);
        }
      } else {
        query = query.eq('status_id', filters.status_id);
      }
    }

    if (filters.priorite && filters.priorite !== 'all') {
      // Handle array for multi-select
      if (Array.isArray(filters.priorite)) {
        if (filters.priorite.length > 0) {
          query = query.in('priorite', filters.priorite);
        }
      } else {
        query = query.eq('priorite', filters.priorite);
      }
    }

    if (filters.source && filters.source !== 'all') {
      query = query.eq('source', filters.source);
    }

    if (filters.type_projet && filters.type_projet !== 'all') {
      query = query.eq('type_projet', filters.type_projet);
    }

    // For UUID fields, check that it's not 'all' and is a valid UUID format
    if (filters.commercial_assigne_id && 
        filters.commercial_assigne_id !== 'all' && 
        filters.commercial_assigne_id !== null && 
        filters.commercial_assigne_id !== undefined) {
      // Basic UUID format check (8-4-4-4-12 hex digits)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(filters.commercial_assigne_id)) {
        query = query.eq('commercial_assigne_id', filters.commercial_assigne_id);
        if (import.meta.env.DEV) {
          console.log('[getAllLeads] Filtering by commercial_assigne_id:', filters.commercial_assigne_id);
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('[getAllLeads] Invalid UUID format for commercial_assigne_id:', filters.commercial_assigne_id);
        }
      }
    }

    // Date filters - already check for null
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Qualification score filters
    if (filters.score_min !== undefined && filters.score_min !== null && filters.score_min > 0) {
      query = query.gte('qualification_score', filters.score_min);
    }

    if (filters.score_max !== undefined && filters.score_max !== null && filters.score_max < 100) {
      query = query.lte('qualification_score', filters.score_max);
    }

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    };
  } catch (error) {
    console.error('Error fetching leads:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      pagination: { page: 1, pageSize, total: 0, totalPages: 0 }
    };
  }
}

/**
 * Fetch all relations needed for qualification score calculation
 * @param {string} leadId 
 * @returns {Promise<{activities: Array, notes: Array, operationsCee: Array, leadStatuses: Array}>}
 */
async function fetchLeadRelations(leadId) {
  try {
    // Fetch in parallel for performance
    const [notesResult, operationsResult, statusesResult] = await Promise.all([
      // Notes
      supabase
        .from('notes_internes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false }),
      
      // Operations CEE
      supabase
        .from('operations_cee')
        .select('id, fiche_cee_id, lead_id, statut, date_creation')
        .eq('lead_id', leadId),
      
      // Lead statuses (for all leads, but we only use it for the current lead's status)
      supabase
        .from('lead_statuses')
        .select('id, code, label, color, pipeline_order, is_won, is_lost, is_closed')
        .order('pipeline_order', { ascending: true })
    ]);

    // For activities, we'll use notes since lead_activities table doesn't exist
    // In the future, if lead_activities exists, fetch from there too
    const activities = []; // Empty for now - activities are tracked via notes

    return {
      activities: activities,
      notes: notesResult.data || [],
      operationsCee: operationsResult.data || [],
      leadStatuses: statusesResult.data || []
    };
  } catch (error) {
    console.warn('[fetchLeadRelations] Error fetching relations (non-critical):', error);
    // Return empty arrays on error - score calculation will still work
    return {
      activities: [],
      notes: [],
      operationsCee: [],
      leadStatuses: []
    };
  }
}

/**
 * Calculate and update qualification score for a lead
 * @param {string} leadId 
 * @param {Object} lead 
 * @param {Object} relations 
 * @returns {Promise<{success: boolean, score?: number, breakdown?: Object}>}
 */
async function calculateAndUpdateScore(leadId, lead, relations = null) {
  try {
    // Import qualification score calculator
    const { computeQualificationScore, recalculateAndSaveScore } = await import('@/lib/leads/qualificationScore');
    
    // Fetch relations if not provided
    if (!relations) {
      relations = await fetchLeadRelations(leadId);
    }
    
    // Calculate score
    const breakdown = computeQualificationScore(lead, relations);
    
    // Update lead in database
    const { error } = await supabase
      .from('leads')
      .update({ 
        qualification_score: breakdown.total,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
    
    if (error) {
      console.warn('[calculateAndUpdateScore] Error updating score (non-critical):', error);
      // Return breakdown anyway - the calculation succeeded
      return {
        success: false,
        score: breakdown.total,
        breakdown,
        error: error.message
      };
    }
    
    return {
      success: true,
      score: breakdown.total,
      breakdown
    };
  } catch (error) {
    console.error('[calculateAndUpdateScore] Error calculating score:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get lead by ID with full details and calculated qualification score
 */
export async function getLeadById(id, options = {}) {
  try {
    const { skipScoreCalculation = false } = options;
    
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        status:status_id (
          id,
          code,
          label,
          color,
          pipeline_order,
          is_won,
          is_lost,
          is_closed,
          is_default
        ),
        commercial_assigne:commercial_assigne_id (
          id,
          prenom,
          nom,
          email,
          photo_profil_url,
          telephone
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Calculate and update qualification score if not skipped
    let qualificationBreakdown = null;
    if (!skipScoreCalculation && data) {
      const relations = await fetchLeadRelations(id);
      const scoreResult = await calculateAndUpdateScore(id, data, relations);
      
      if (scoreResult.success && scoreResult.breakdown) {
        qualificationBreakdown = scoreResult.breakdown;
        // Update data with calculated score
        data.qualification_score = scoreResult.score;
      }
    }

    return {
      success: true,
      data,
      qualificationBreakdown
    };
  } catch (error) {
    console.error('Error fetching lead:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Get default status ID from lead_statuses
 */
async function getDefaultStatusId() {
  try {
    // Try to get status with is_default = true
    const { data, error } = await supabase
      .from('lead_statuses')
      .select('id, label, code')
      .eq('is_default', true)
      .order('pipeline_order', { ascending: true, nullsLast: true })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      return data.id;
    }

    // Fallback: try to get by code 'NOUVEAU' (has lead_count=23, so it's active)
    const { data: nouveau } = await supabase
      .from('lead_statuses')
      .select('id, label')
      .eq('code', 'NOUVEAU')
      .order('pipeline_order', { ascending: true, nullsLast: true })
      .limit(1)
      .maybeSingle();
    
    if (nouveau) {
      return nouveau.id;
    }

    // Last fallback: try by slug 'nouveau_lead'
    const { data: fallback } = await supabase
      .from('lead_statuses')
      .select('id, label')
      .or('code.eq.NOUVEAU,code.eq.nouveau_lead')
      .order('pipeline_order', { ascending: true, nullsLast: true })
      .limit(1)
      .maybeSingle();
    
    if (fallback) {
      return fallback.id;
    }

    throw new Error('Aucun statut par défaut trouvé dans lead_statuses');
  } catch (error) {
    console.error('Error fetching default status:', error);
    throw error;
  }
}

/**
 * Get status ID from slug or label
 */
async function getStatusIdFromSlugOrLabel(slugOrLabel) {
  if (!slugOrLabel) return null;
  
  try {
    // Try by slug first (normalized)
    const normalizedSlug = slugOrLabel.toLowerCase().trim().replace(/\s+/g, '_');
    const { data: bySlug } = await supabase
      .from('lead_statuses')
      .select('id')
      .eq('slug', normalizedSlug)
      .single();

    if (bySlug) return bySlug.id;

    // Try by label
    const { data: byLabel } = await supabase
      .from('lead_statuses')
      .select('id')
      .eq('label', slugOrLabel)
      .single();

    if (byLabel) return byLabel.id;

    // If not found, return default
    return await getDefaultStatusId();
  } catch (error) {
    console.error('Error getting status ID:', error);
    return await getDefaultStatusId();
  }
}

/**
 * Create new lead
 */
export async function createLead(leadData) {
  try {
    // Get status_id: use provided status_id, or convert from slug/label, or use default
    let statusId = leadData.status_id;
    let statusLabel = null;

    if (!statusId) {
      if (leadData.statut) {
        // Try to get status_id from slug/label
        statusId = await getStatusIdFromSlugOrLabel(leadData.statut);
      } else {
        // Use default status
        statusId = await getDefaultStatusId();
      }
    }

    // Get status label for compatibility with text column
    if (statusId) {
      const { data: statusData } = await supabase
        .from('lead_statuses')
        .select('label')
        .eq('id', statusId)
        .single();
      
      if (statusData) {
        statusLabel = statusData.label;
      }
    }

    // Sanitize data
    const sanitizedData = {
      civilite: leadData.civilite?.trim() || null,
      nom: leadData.nom?.trim() || '',
      prenom: leadData.prenom?.trim() || '',
      email: leadData.email?.trim().toLowerCase() || null,
      telephone: leadData.telephone?.trim() || null,
      poste: leadData.poste?.trim() || null,
      societe: leadData.societe?.trim() || null,
      siret: leadData.siret?.trim() || null,
      siren: leadData.siren?.trim() || null,
      adresse: leadData.adresse?.trim() || null,
      adresse_siege: leadData.adresse_siege?.trim() || null,
      ville: leadData.ville?.trim() || null,
      ville_siege: leadData.ville_siege?.trim() || null,
      code_postal: leadData.code_postal?.trim() || null,
      code_postal_siege: leadData.code_postal_siege?.trim() || null,
      raison_sociale_travaux: leadData.raison_sociale_travaux?.trim() || null,
      adresse_travaux: leadData.adresse_travaux?.trim() || null,
      ville_travaux: leadData.ville_travaux?.trim() || null,
      code_postal_travaux: leadData.code_postal_travaux?.trim() || null,
      siret_site_travaux: leadData.siret_site_travaux?.trim() || null,
      region: leadData.region?.trim() || null,
      zone_climatique: leadData.zone_climatique?.trim() || null,
      parcelle_cadastrale_travaux: leadData.parcelle_cadastrale_travaux?.trim() || null,
      site_web: leadData.site_web?.trim() || null,
      type_projet: leadData.type_projet || null,
      type_batiment: leadData.type_batiment || null,
      surface_m2: leadData.surface_m2 ? parseFloat(leadData.surface_m2) : null,
      mode_chauffage: leadData.mode_chauffage || null,
      puissance_electrique: leadData.puissance_electrique || null,
      budget_estime: leadData.budget_estime || null,
      date_installation_souhaitee: leadData.date_installation_souhaitee || null,
      source: leadData.source || 'Manuel',
      campagne: leadData.campagne || null,
      page_origine: leadData.page_origine || null,
      utm_params: leadData.utm_params || null,
      status_id: statusId,
      statut: statusLabel || leadData.statut || 'Nouveau lead', // Keep text column for compatibility
      priorite: leadData.priorite || 'normale',
      qualification_score: leadData.qualification_score || 0,
      montant_cee_estime: leadData.montant_cee_estime || null,
      commercial_assigne_id: leadData.commercial_assigne_id || null,
      prochaine_action_date: leadData.prochaine_action_date || null,
      prochaine_action_description: leadData.prochaine_action_description || null,
      tags: leadData.tags || [],
      custom_fields: leadData.custom_fields || {},
      formulaire_complet: leadData.formulaire_complet || false
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([sanitizedData])
      .select(`
        *,
        status:status_id (
          id,
          code,
          label,
          color,
          pipeline_order,
          is_won,
          is_lost,
          is_closed
        )
      `)
      .single();

    if (error) throw error;

    // Log activity
    await addActivity(data.id, {
      type: 'lead_created',
      description: 'Lead créé',
      user_id: null // Will be set from auth context
    });

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error creating lead:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log lead status change in leads_events table
 * This function is NON-BLOCKING - it will never throw an error
 */
async function logLeadStatusChange(leadId, oldStatusId, newStatusId, userId = null) {
  // This function is completely non-blocking - wrap everything in try/catch
  try {
    // Get status labels for logging
    let oldStatusLabel = null;
    let newStatusLabel = null;

    try {
      if (oldStatusId) {
        const { data: oldStatus } = await supabase
          .from('lead_statuses')
          .select('label, code')
          .eq('id', oldStatusId)
          .maybeSingle();
        oldStatusLabel = oldStatus?.label || oldStatusId;
      }

      if (newStatusId) {
        const { data: newStatus } = await supabase
          .from('lead_statuses')
          .select('label, code')
          .eq('id', newStatusId)
          .maybeSingle();
        newStatusLabel = newStatus?.label || newStatusId;
      }
    } catch (statusError) {
      console.warn('[logLeadStatusChange] Could not fetch status labels:', statusError);
      // Continue anyway - we'll use IDs
    }

    // Note: lead_activities table doesn't exist, so we skip logging
    // Status changes are tracked via the status_id column itself
    // Future: When lead_activities table is created, uncomment this:
    /*
    try {
      const activityResult = await addActivity(leadId, {
        type: 'status_changed',
        description: `Statut changé de "${oldStatusLabel || oldStatusId || 'Non défini'}" à "${newStatusLabel || newStatusId || 'Non défini'}"`,
        user_id: userId,
        metadata: {
          old_status_id: oldStatusId,
          new_status_id: newStatusId,
          old_status_label: oldStatusLabel,
          new_status_label: newStatusLabel
        }
      });
      
      if (activityResult.success) {
        return { success: true };
      }
    } catch (activityError) {
      // Silent fail - logging is optional
    }
    */
    
    return { success: true }; // Always succeed - logging is optional
  } catch (error) {
    // Final catch-all - never throw from this function
    console.warn('[logLeadStatusChange] Unexpected error (ignored, non-blocking):', error.message);
    return { success: true }; // Always return success - logging is optional
  }
}

/**
 * Update lead
 */
export async function updateLead(id, updates, userId = null) {
  try {
    // Check if status_id is being updated
    let oldStatusId = null;
    let oldStatusLabel = null;

    if (updates.status_id !== undefined) {
      // Get current status before update
      const { data: currentLead } = await supabase
        .from('leads')
        .select('status_id, statut')
        .eq('id', id)
        .single();

      if (currentLead) {
        oldStatusId = currentLead.status_id;
        oldStatusLabel = currentLead.statut;

        // If status_id is changing, get the new status label
        if (updates.status_id && updates.status_id !== oldStatusId) {
          const { data: newStatus } = await supabase
            .from('lead_statuses')
            .select('label')
            .eq('id', updates.status_id)
            .single();

          if (newStatus) {
            updates.statut = newStatus.label; // Keep text column synchronized
          }
        }
      }
    }

    // Filter out any fields that don't exist in the leads table
    const allowedFields = [
      'civilite', 'nom', 'prenom', 'email', 'telephone', 'poste',
      'societe', 'siret', 'siren', 'site_web',
      'adresse', 'adresse_siege', 'ville', 'ville_siege', 'code_postal', 'code_postal_siege',
      'raison_sociale_travaux', 'adresse_travaux', 'ville_travaux', 'code_postal_travaux',
      'siret_site_travaux', 'region', 'zone_climatique', 'parcelle_cadastrale_travaux',
      'type_projet', 'type_batiment', 'surface', 'surface_m2', 'hauteur_plafond',
      'mode_chauffage', 'puissance_electrique', 'consommation_annuelle',
      'nombre_points_lumineux', 'notes_techniques', 'budget_estime',
      'date_installation_souhaitee', 'montant_cee_estime',
      'statut', 'status_id', 'priorite', 'qualification_score',
      'source', 'campagne', 'page_origine', 'utm_params',
      'commercial_assigne_id', 'prochaine_action_date', 'prochaine_action_description',
      'tags', 'custom_fields', 'formulaire_data', 'formulaire_complet', 'etape_formulaire',
      'products', 'message'
    ];
    
    // Only include fields that exist in the table
    const filteredUpdates = {};
    for (const key in updates) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      } else {
        console.warn(`[updateLead] Field '${key}' not in allowed fields, skipping update`);
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        status:status_id (
          id,
          code,
          label,
          color,
          pipeline_order,
          is_won,
          is_lost,
          is_closed
        )
      `)
      .single();

    if (error) {
      console.error('[updateLead] Error updating lead:', error);
      throw error;
    }

    // Log status change if status_id was updated (non-blocking)
    if (updates.status_id !== undefined && updates.status_id !== oldStatusId) {
      try {
        await logLeadStatusChange(id, oldStatusId, updates.status_id, userId);
      } catch (logError) {
        console.warn('[updateLead] Failed to log status change (non-fatal):', logError);
        // Continue anyway - the update was successful
      }
    }

    // Recalculate qualification score after update (SYNCHRONOUS for immediate UI update)
    // Only recalculate if relevant fields were updated
    const scoreRelevantFields = [
      'statut', 'status_id', 'priorite', 'telephone', 'email', 'civilite', 'prenom', 'nom',
      'societe', 'siret', 'siren', 'raison_sociale_travaux',
      'adresse_siege', 'code_postal_siege', 'ville_siege',
      'adresse_travaux', 'code_postal_travaux', 'ville_travaux',
      'type_projet', 'type_batiment', 'surface', 'surface_m2',
      'mode_chauffage', 'zone_climatique', 'region',
      'montant_cee_estime', 'formulaire_complet', 'etape_formulaire',
      'formulaire_data', 'hauteur_plafond', 'puissance_electrique',
      'nombre_points_lumineux', 'consommation_annuelle'
    ];
    
    const shouldRecalculate = Object.keys(filteredUpdates).some(key => scoreRelevantFields.includes(key));
    
    // Recalculate score SYNCHRONOUSLY to return it in the response
    if (shouldRecalculate && data) {
      try {
        const scoreResult = await calculateAndUpdateScore(id, data);
        if (scoreResult.success) {
          // Update the data object with the new score
          data.qualification_score = scoreResult.score;
          data.qualification_breakdown = scoreResult.breakdown;
          console.log(`[updateLead] Qualification score recalculated: ${scoreResult.score}/100`);
        }
      } catch (scoreError) {
        console.warn('[updateLead] Score recalculation failed (non-fatal):', scoreError);
        // Continue anyway - the update was successful
      }
    }

    return {
      success: true,
      data,
      qualificationScore: data.qualification_score,
      qualificationBreakdown: data.qualification_breakdown
    };
  } catch (error) {
    console.error('[updateLead] Error updating lead:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete lead
 */
export async function deleteLead(id) {
  try {
    // Delete related records first
    await supabase.from('notes_internes').delete().eq('lead_id', id);
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting lead:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Change lead status using status_id (UUID) or slug
 * @param {string} id - Lead ID
 * @param {string} newStatusIdOrSlug - New status ID (UUID) or slug (e.g., 'nouveau_lead')
 * @param {string} userId - User ID making the change
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function changeLeadStatus(id, newStatusIdOrSlug, userId = null) {
  try {
    // Get current status
    const { data: currentLead } = await supabase
      .from('leads')
      .select('status_id, statut')
      .eq('id', id)
      .single();

    if (!currentLead) {
      throw new Error('Lead non trouvé');
    }

    const oldStatusId = currentLead.status_id;
    const oldStatusLabel = currentLead.statut;

    // Determine if newStatusIdOrSlug is a UUID or a slug
    let newStatusId = null;
    let newStatusLabel = null;

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newStatusIdOrSlug);

    if (isUUID) {
      // It's a UUID (status_id)
      newStatusId = newStatusIdOrSlug;
    } else {
      // It's a slug or code, get the status_id
      const normalizedSlug = newStatusIdOrSlug.toLowerCase().trim().replace(/\s+/g, '_');
      const normalizedUpper = newStatusIdOrSlug.toUpperCase().trim();
      
      // Try by code first (uppercase)
      let statusData = null;
      const { data: byCode } = await supabase
        .from('lead_statuses')
        .select('id, label, code')
        .eq('code', normalizedUpper)
        .order('pipeline_order', { ascending: true, nullsLast: true })
        .limit(1)
        .maybeSingle();

      if (byCode) {
        statusData = byCode;
      } else {
        // Try by slug
        const { data: bySlug } = await supabase
          .from('lead_statuses')
          .select('id, label, code')
          .or(`slug.eq.${normalizedSlug},code.ilike.%${normalizedSlug}%`)
          .order('pipeline_order', { ascending: true, nullsLast: true })
          .limit(1)
          .maybeSingle();

        if (bySlug) {
          statusData = bySlug;
        }
      }

      if (!statusData) {
        throw new Error(`Statut "${newStatusIdOrSlug}" non trouvé dans lead_statuses`);
      }

      newStatusId = statusData.id;
      newStatusLabel = statusData.label;
    }

    // Get new status label if we don't have it yet
    if (!newStatusLabel && newStatusId) {
      const { data: statusData } = await supabase
        .from('lead_statuses')
        .select('label')
        .eq('id', newStatusId)
        .single();

      if (statusData) {
        newStatusLabel = statusData.label;
      }
    }

    // Update the lead
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        status_id: newStatusId,
        statut: newStatusLabel || currentLead.statut, // Keep text column synchronized
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        status:status_id (
          id,
          code,
          label,
          color,
          pipeline_order,
          is_won,
          is_lost,
          is_closed
        )
      `)
      .single();

    if (error) {
      console.error('[changeLeadStatus] Error updating lead:', error);
      throw error;
    }

    // Log status change in leads_events (non-blocking)
    // This function NEVER throws - it's completely safe to call
    logLeadStatusChange(id, oldStatusId, newStatusId, userId)
      .then(result => {
        if (!result.success) {
          console.warn('[changeLeadStatus] Status change logged with warnings (non-fatal)');
        }
      })
      .catch(logError => {
        console.warn('[changeLeadStatus] Logging error (completely ignored):', logError);
        // Completely ignore - status change was successful
      });

    // Recalculate qualification score after status change
    let qualificationScore = data.qualification_score;
    let qualificationBreakdown = null;
    
    try {
      const scoreResult = await calculateAndUpdateScore(id, data);
      if (scoreResult.success) {
        qualificationScore = scoreResult.score;
        qualificationBreakdown = scoreResult.breakdown;
        data.qualification_score = qualificationScore;
      }
    } catch (scoreError) {
      console.warn('[changeLeadStatus] Score recalculation failed (non-fatal):', scoreError);
    }

    return {
      success: true,
      data,
      qualificationScore,
      qualificationBreakdown
    };
  } catch (error) {
    console.error('[changeLeadStatus] Error changing lead status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Assign lead to commercial
 */
export async function assignLead(id, commercialId, userId = null) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        commercial_assigne_id: commercialId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        commercial_assigne:commercial_assigne_id (
          id,
          prenom,
          nom,
          email,
          photo_profil_url,
          telephone,
          role
        ),
        status:status_id (
          id,
          code,
          label,
          color,
          pipeline_order,
          is_won,
          is_lost,
          is_closed,
          is_default
        )
      `)
      .single();

    if (error) {
      console.error('[assignLead] Supabase error:', error);
      throw error;
    }

    // Log activity (non-blocking)
    if (commercialId) {
      addActivity(id, {
        type: 'assigned',
        description: 'Lead assigné à un commercial',
        user_id: userId,
        metadata: { commercial_id: commercialId }
      }).catch(err => {
        console.warn('[assignLead] Failed to log activity (non-fatal):', err);
      });
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('[assignLead] Error assigning lead:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add note to lead
 */
export async function addNote(leadId, note, userId = null) {
  try {
    const { data, error } = await supabase
      .from('notes_internes')
      .insert([{
        lead_id: leadId,
        note: note,
        auteur: userId || 'System'
      }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await addActivity(leadId, {
      type: 'note_added',
      description: 'Note ajoutée',
      user_id: userId
    });

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error adding note:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add activity to lead
 * Note: lead_activities table doesn't exist yet, so this function silently succeeds
 */
export async function addActivity(leadId, activity) {
  // Silently succeed - lead_activities table doesn't exist
  // Activities are logged via notes_internes instead
  return {
    success: true
  };
}

/**
 * Get lead timeline (notes only for now, as lead_activities table doesn't exist)
 */
export async function getLeadTimeline(leadId) {
  try {
    // Get notes
    const { data: notes, error: notesError } = await supabase
      .from('notes_internes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.warn('[getLeadTimeline] Error fetching notes:', notesError);
    }

    // Map notes to timeline format
    const timeline = (notes || []).map(note => ({
      ...note,
      type: 'note',
      timestamp: note.created_at
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      success: true,
      data: timeline
    };
  } catch (error) {
    console.error('[getLeadTimeline] Error fetching timeline:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Calculate CEE estimation
 */
export async function calculateCEE(leadData) {
  try {
    // Import CEE calculation utility
    const { calculateCEEPotential } = await import('@/utils/ceeCalculations');
    
    const ceeAmount = calculateCEEPotential({
      surface_m2: leadData.surface_m2,
      type_batiment: leadData.type_batiment,
      type_projet: leadData.type_projet,
      puissance_electrique: leadData.puissance_electrique
    });

    return {
      success: true,
      data: {
        montant_cee_estime: ceeAmount?.totalPotential ?? ceeAmount,
        ceeDetail: ceeAmount,
      }
    };
  } catch (error) {
    console.error('Error calculating CEE:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Search leads (full-text search)
 */
export async function searchLeads(query, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,societe.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error searching leads:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Get lead statistics
 */
export async function getLeadStats(filters = {}) {
  try {
    // Build base query
    let baseQuery = supabase.from('leads').select('id, statut, priorite, montant_cee_estime, created_at, commercial_assigne_id', { count: 'exact' });

    // Apply filters
    if (filters.commercial_assigne_id && filters.commercial_assigne_id !== 'all') {
      // Basic UUID format check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(filters.commercial_assigne_id)) {
        baseQuery = baseQuery.eq('commercial_assigne_id', filters.commercial_assigne_id);
      }
    }
    if (filters.date_from) {
      baseQuery = baseQuery.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      baseQuery = baseQuery.lte('created_at', filters.date_to);
    }

    const { data: leads, error } = await baseQuery;

    if (error) throw error;

    // Calculate stats
    const total = leads?.length || 0;
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      total,
      nouveaux_ce_mois: leads?.filter(l => {
        const created = new Date(l.created_at);
        return created >= thisMonth && l.statut === 'nouveau';
      }).length || 0,
      qualifies: leads?.filter(l => l.statut === 'qualifie').length || 0,
      conversion_rate: total > 0 ? parseFloat(((leads?.filter(l => l.statut === 'gagne').length || 0) / total * 100).toFixed(1)) : 0,
      ca_potentiel: leads?.reduce((sum, l) => sum + (parseFloat(l.montant_cee_estime) || 0), 0) || 0,
      leads_chauds: leads?.filter(l => l.priorite === 'haute').length || 0,
      par_statut: LEAD_STATUSES,
      par_priorite: PRIORITIES
    };

    // Count by status
    Object.keys(LEAD_STATUSES).forEach(status => {
      stats.par_statut[status].count = leads?.filter(l => l.statut === status).length || 0;
    });

    // Count by priority
    Object.keys(PRIORITIES).forEach(priority => {
      stats.par_priorite[priority].count = leads?.filter(l => l.priorite === priority).length || 0;
    });

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}


