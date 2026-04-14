import { supabase } from '@/lib/supabaseClient';

/**
 * Operations CEE Management API
 * Professional operations CEE management functions for ECPS
 */

// Operation statuses with colors
export const STATUSES = {
  brouillon: { label: 'Brouillon', color: 'gray' },
  etude: { label: 'Étude', color: 'blue' },
  signe: { label: 'Signé', color: 'green' },
  valide: { label: 'Validé', color: 'green' },
  refuse: { label: 'Refusé', color: 'red' },
  archive: { label: 'Archivé', color: 'slate' }
};

/**
 * Get all operations with filters
 */
export async function getAllOperations({ 
  filters = {}, 
  page = 1, 
  pageSize = 50,
  sortBy = 'date_creation',
  sortOrder = 'desc'
} = {}) {
  try {
    let query = supabase
      .from('operations_cee')
      .select(`
        *,
        fiche:fiches_cee (
          id,
          numero,
          slug,
          titre
        ),
        lead:leads (
          id,
          nom,
          prenom,
          email,
          societe
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.leadId && filters.leadId !== 'all') {
      query = query.eq('lead_id', filters.leadId);
    }

    if (filters.statut && filters.statut !== 'all') {
      if (Array.isArray(filters.statut)) {
        if (filters.statut.length > 0) {
          query = query.in('statut', filters.statut);
        }
      } else {
        query = query.eq('statut', filters.statut);
      }
    }

    if (filters.ficheCeeId && filters.ficheCeeId !== 'all') {
      query = query.eq('fiche_cee_id', filters.ficheCeeId);
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
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Error fetching operations:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0
    };
  }
}

/**
 * Get operation by ID with criteria and fiche CEE
 */
export async function getOperationById(id) {
  try {
    // Get operation with relations
    const { data: operation, error: opError } = await supabase
      .from('operations_cee')
      .select(`
        *,
        fiche:fiches_cee (
          id,
          numero,
          slug,
          titre,
          criteria_definition
        ),
        lead:leads (
          id,
          nom,
          prenom,
          email,
          societe,
          telephone
        )
      `)
      .eq('id', id)
      .single();

    if (opError) throw opError;

    if (!operation) {
      return {
        success: false,
        error: 'Opération introuvable',
        data: null
      };
    }

    // Get criteria
    const { data: criteria, error: critError } = await supabase
      .from('operations_cee_criteria')
      .select('*')
      .eq('operation_id', id)
      .order('key', { ascending: true });

    // Criteria error is not critical
    if (critError && !critError.message?.includes('does not exist')) {
      console.warn('Error fetching criteria:', critError);
    }

    return {
      success: true,
      data: {
        ...operation,
        criteria: criteria || []
      }
    };
  } catch (error) {
    console.error('Error fetching operation:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Create operation CEE using RPC function (if available) or standard insert
 * This function tries the RPC first, then falls back to standard createOperation
 */
export async function createOperationCee({ 
  leadId, 
  ficheCeeId, 
  statut = 'brouillon' 
}) {
  try {
    // Validate required fields
    if (!ficheCeeId) {
      return {
        success: false,
        error: 'ficheCeeId est obligatoire'
      };
    }

    if (!leadId) {
      return {
        success: false,
        error: 'leadId est obligatoire'
      };
    }

    // Try RPC function first (if it exists)
    try {
      const { data, error: rpcError } = await supabase.rpc('creer_operation_cee', {
        p_lead_id: leadId,
        p_fiche_cee_id: ficheCeeId,
        p_statut: statut
      });

      if (!rpcError && data) {
        // RPC succeeded, return the operation ID
        return {
          success: true,
          data: { id: data }
        };
      }

      // If RPC doesn't exist or fails, fall through to standard method
      console.warn('RPC creer_operation_cee not available, using standard method:', rpcError?.message);
    } catch (rpcError) {
      // RPC function doesn't exist, use standard method
      console.warn('RPC creer_operation_cee not available, using standard method');
    }

    // Fallback to standard createOperation method
    return await createOperation({
      leadId,
      ficheCeeId,
      statut,
      criteria: []
    });

  } catch (error) {
    console.error('Error creating operation CEE:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de l\'opération CEE'
    };
  }
}

/**
 * Get operations for a specific lead
 */
export async function getOperationsByLeadId(leadId) {
  try {
    const { data, error } = await supabase
      .from('operations_cee')
      .select(`
        id,
        reference,
        statut,
        date_creation,
        prime_estimee,
        fiche:fiches_cee (
          id,
          numero,
          slug,
          titre
        )
      `)
      .eq('lead_id', leadId)
      .order('date_creation', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching operations by lead ID:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Create operation with criteria
 */
export async function createOperation({ 
  leadId, 
  commandeId, 
  ficheCeeId, 
  statut = 'brouillon',
  criteria = [],
  prime_estimee = null,
  calcul_kwhc = null
}) {
  try {
    // Validate required fields
    if (!ficheCeeId) {
      return {
        success: false,
        error: 'ficheCeeId est obligatoire'
      };
    }

    // Verify fiche CEE exists
    const { data: fiche, error: ficheError } = await supabase
      .from('fiches_cee')
      .select('id, numero, slug')
      .eq('id', ficheCeeId)
      .single();

    if (ficheError || !fiche) {
      return {
        success: false,
        error: 'Fiche CEE introuvable'
      };
    }

    // Create operation
    const { data: operation, error: opError } = await supabase
      .from('operations_cee')
      .insert({
        lead_id: leadId || null,
        commande_id: commandeId || null,
        fiche_cee_id: ficheCeeId,
        statut,
        prime_estimee: prime_estimee ? parseFloat(prime_estimee) : null,
        calcul_kwhc: calcul_kwhc ? parseFloat(calcul_kwhc) : null
      })
      .select('*')
      .single();

    if (opError || !operation) {
      console.error('Error creating operation:', opError);
      return {
        success: false,
        error: "Impossible de créer l'opération CEE"
      };
    }

    // Insert criteria if provided
    let createdCriteria = [];
    if (Array.isArray(criteria) && criteria.length > 0) {
      const rows = criteria
        .filter((c) => c && typeof c.key === 'string' && c.key.trim() !== '')
        .map((c) => ({
          operation_id: operation.id,
          key: c.key.trim(),
          value: c.value === null || c.value === undefined ? null : String(c.value),
          type: c.type || null,
          unit: c.unit || null
        }));

      if (rows.length > 0) {
        const { data: criteriaData, error: critError } = await supabase
          .from('operations_cee_criteria')
          .insert(rows)
          .select('*');

        if (critError) {
          console.error('Error creating criteria:', critError);
          // Rollback: delete operation
          await supabase
            .from('operations_cee')
            .delete()
            .eq('id', operation.id);

          return {
            success: false,
            error: 'Erreur lors de la création des critères',
            details: critError.message
          };
        }

        createdCriteria = criteriaData || [];
      }
    }

    return {
      success: true,
      data: {
        ...operation,
        criteria: createdCriteria
      }
    };
  } catch (error) {
    console.error('Error creating operation:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de l\'opération'
    };
  }
}

/**
 * Update operation
 */
export async function updateOperation(id, updates) {
  try {
    // Convert numeric fields
    const updatesToApply = { ...updates };
    if (updates.prime_estimee !== undefined) {
      updatesToApply.prime_estimee = updates.prime_estimee === '' || updates.prime_estimee === null 
        ? null 
        : parseFloat(updates.prime_estimee);
    }
    if (updates.calcul_kwhc !== undefined) {
      updatesToApply.calcul_kwhc = updates.calcul_kwhc === '' || updates.calcul_kwhc === null 
        ? null 
        : parseFloat(updates.calcul_kwhc);
    }

    const { data, error } = await supabase
      .from('operations_cee')
      .update({
        ...updatesToApply,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error updating operation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update operation criteria
 * This deletes all existing criteria and inserts new ones
 */
export async function updateOperationCriteria(operationId, criteria) {
  try {
    // Delete existing criteria
    const { error: deleteError } = await supabase
      .from('operations_cee_criteria')
      .delete()
      .eq('operation_id', operationId);

    if (deleteError && !deleteError.message?.includes('does not exist')) {
      console.warn('Error deleting existing criteria:', deleteError);
    }

    // Insert new criteria if provided
    if (Array.isArray(criteria) && criteria.length > 0) {
      const rows = criteria
        .filter((c) => c && typeof c.key === 'string' && c.key.trim() !== '')
        .map((c) => ({
          operation_id: operationId,
          key: c.key.trim(),
          value: c.value === null || c.value === undefined ? null : String(c.value),
          type: c.type || null,
          unit: c.unit || null
        }));

      if (rows.length > 0) {
        const { data: criteriaData, error: insertError } = await supabase
          .from('operations_cee_criteria')
          .insert(rows)
          .select('*');

        if (insertError) {
          throw insertError;
        }

        return {
          success: true,
          data: criteriaData || []
        };
      }
    }

    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error updating criteria:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete operation (cascades to criteria)
 */
export async function deleteOperation(id) {
  try {
    // Delete criteria first (explicit cascade)
    const { error: critError } = await supabase
      .from('operations_cee_criteria')
      .delete()
      .eq('operation_id', id);

    if (critError && !critError.message?.includes('does not exist')) {
      console.warn('Error deleting criteria:', critError);
    }

    // Delete operation
    const { error } = await supabase
      .from('operations_cee')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting operation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
