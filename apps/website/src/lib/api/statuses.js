import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

/**
 * Status Management API
 * Generic functions to manage statuses for leads, operations, and orders
 */

export const STATUS_TABLES = {
  leads: 'lead_statuses',
  operations: 'operation_statuses',
  orders: 'commande_statuses'
};

/**
 * Get all statuses for a given table
 */
export async function getStatuses(table) {
  try {
    // For lead_statuses, select specific columns that exist
    // For other tables, select all
    let selectColumns = '*';
    
    if (table === 'lead_statuses') {
      // Only select columns that exist in lead_statuses (lead_count is computed, not a real column)
      selectColumns = 'id, code, label, color, pipeline_order, is_default, is_won, is_lost, is_closed, created_at, updated_at';
    }
    
    let query = supabase
      .from(table)
      .select(selectColumns);
    
    // Try to order by pipeline_order (exists for lead_statuses)
    if (table === 'lead_statuses') {
      query = query.order('pipeline_order', { ascending: true, nullsLast: true });
    } else {
      // For other tables, order by created_at or a default order
      query = query.order('created_at', { ascending: true });
    }
    
    const { data, error } = await query;

    if (error) {
      console.error(`[getStatuses] Error for table ${table}:`, error);
      throw error;
    }

    console.log(`[getStatuses] Loaded ${data?.length || 0} statuses from ${table}`, data);

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    logger.error(`Error fetching statuses from ${table}:`, error);
    console.error(`[getStatuses] Full error for ${table}:`, error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Create a new status
 */
export async function createStatus(table, payload) {
  try {
    // Validate required fields
    const needsCode = table === 'lead_statuses';
    
    if (needsCode && !payload.code) {
      return {
        success: false,
        error: 'code est obligatoire pour lead_statuses'
      };
    }
    
    if (!needsCode && !payload.slug) {
      return {
        success: false,
        error: 'slug est obligatoire'
      };
    }
    
    if (!payload.label) {
      return {
        success: false,
        error: 'label est obligatoire'
      };
    }

    // If this is set as default, unset other defaults
    if (payload.is_default === true) {
      await supabase
        .from(table)
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all except non-existent ID
    }

    // Build insert data based on table type
    const insertData = {
      label: payload.label.trim(),
      color: payload.color || 'gray',
      is_default: payload.is_default || false,
      updated_at: new Date().toISOString()
    };

    // Add table-specific fields
    if (needsCode) {
      insertData.code = payload.code.trim().toUpperCase();
      insertData.pipeline_order = payload.pipeline_order || payload.order_index || 0;
      // lead_statuses doesn't have is_active or is_system
    } else {
      insertData.slug = payload.slug.trim();
      insertData.is_active = payload.is_active !== undefined ? payload.is_active : true;
      insertData.is_system = false; // New statuses are never system
      if (payload.order_index !== undefined) {
        insertData.order_index = payload.order_index;
      }
    }

    const { data, error } = await supabase
      .from(table)
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    logger.error(`Error creating status in ${table}:`, error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création du statut'
    };
  }
}

/**
 * Update a status
 */
export async function updateStatus(table, id, payload) {
  try {
    const needsCode = table === 'lead_statuses';
    
    // Check if status is system (cannot modify slug/code or delete)
    // Only check is_system for non-lead_statuses tables
    if (!needsCode) {
      const { data: existingStatus } = await supabase
        .from(table)
        .select('is_system, slug')
        .eq('id', id)
        .single();

      if (existingStatus?.is_system) {
        // Remove slug from updates if it's a system status
        delete payload.slug;
      }
    }

    // If setting as default, unset other defaults
    if (payload.is_default === true) {
      await supabase
        .from(table)
        .update({ is_default: false })
        .neq('id', id);
    }

    const updates = {
      ...payload,
      updated_at: new Date().toISOString()
    };

    // For lead_statuses, map order_index to pipeline_order if provided
    if (needsCode && updates.order_index !== undefined) {
      updates.pipeline_order = updates.order_index;
      delete updates.order_index;
    }

    // Remove fields that don't exist in lead_statuses
    if (needsCode) {
      delete updates.description;
      delete updates.is_active;
      delete updates.is_system;
      delete updates.slug; // lead_statuses uses code, not slug
    }

    // Clean up undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    logger.error(`Error updating status in ${table}:`, error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour du statut'
    };
  }
}

/**
 * Delete a status
 */
export async function deleteStatus(table, id) {
  try {
    // Check if status is system (cannot delete)
    // Only check is_system for non-lead_statuses tables
    if (table !== 'lead_statuses') {
      const { data: existingStatus } = await supabase
        .from(table)
        .select('is_system')
        .eq('id', id)
        .single();

      if (existingStatus?.is_system) {
        return {
          success: false,
          error: 'Impossible de supprimer un statut système'
        };
      }
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true
    };
  } catch (error) {
    logger.error(`Error deleting status from ${table}:`, error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression du statut'
    };
  }
}

/**
 * Set a status as default (and unset others)
 */
export async function setDefaultStatus(table, id) {
  try {
    // First, get all statuses in this table to unset their defaults
    const { data: allStatuses, error: fetchError } = await supabase
      .from(table)
      .select('id')
      .eq('is_default', true);

    if (fetchError && !fetchError.message?.includes('does not exist')) {
      console.warn('Error fetching statuses to unset defaults:', fetchError);
    }

    // Unset all defaults in this table
    if (allStatuses && allStatuses.length > 0) {
      const idsToUpdate = allStatuses.map(s => s.id).filter(sid => sid !== id);
      if (idsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ 
            is_default: false,
            updated_at: new Date().toISOString()
          })
          .in('id', idsToUpdate);

        if (updateError && !updateError.message?.includes('does not exist')) {
          console.warn('Error unsetting defaults:', updateError);
        }
      }
    }

    // Set this one as default
    const { data, error } = await supabase
      .from(table)
      .update({ 
        is_default: true,
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
    logger.error(`Error setting default status in ${table}:`, error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la définition du statut par défaut'
    };
  }
}

