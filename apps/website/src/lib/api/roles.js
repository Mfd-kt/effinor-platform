import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';

/**
 * Récupérer tous les rôles avec le nombre d'utilisateurs
 */
export async function getAllRoles() {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        utilisateurs:utilisateurs!utilisateurs_role_id_fkey(count)
      `)
      .order('nom');

    if (error) throw error;

    // Formater les données pour inclure le count
    const rolesWithCount = data?.map(role => ({
      ...role,
      userCount: role.utilisateurs?.[0]?.count || 0
    })) || [];

    return { success: true, data: rolesWithCount };
  } catch (error) {
    logger.error('Erreur récupération rôles:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Récupérer un rôle par ID
 */
export async function getRoleById(id) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Erreur récupération rôle:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Créer un nouveau rôle
 */
export async function createRole(roleData) {
  try {
    logger.log('Création rôle:', roleData);

    // Vérifier que le nom n'existe pas déjà
    const { data: existing } = await supabase
      .from('roles')
      .select('nom')
      .eq('nom', roleData.nom)
      .maybeSingle();

    if (existing) {
      throw new Error('Un rôle avec ce nom existe déjà.');
    }

    const sanitized = sanitizeFormData({
      ...roleData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('roles')
      .insert([sanitized])
      .select()
      .single();

    if (error) throw error;

    logger.log('✅ Rôle créé:', data.id);
    return { success: true, data };
  } catch (error) {
    logger.error('Erreur création rôle:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la création du rôle'
    };
  }
}

/**
 * Mettre à jour un rôle
 */
export async function updateRole(id, updates) {
  try {
    logger.log('Mise à jour rôle:', id, updates);

    // Vérifier si c'est un rôle système (ne pas permettre modification de certains champs)
    const { data: existingRole } = await supabase
      .from('roles')
      .select('is_system, nom')
      .eq('id', id)
      .single();

    if (existingRole?.is_system) {
      // Pour les rôles système, ne permettre que la modification de certains champs
      const allowedUpdates = { ...updates };
      delete allowedUpdates.nom; // Ne pas permettre de changer le nom d'un rôle système
      delete allowedUpdates.is_system; // Ne pas permettre de changer is_system
      
      updates = allowedUpdates;
    }

    const sanitized = sanitizeFormData({
      ...updates,
      updated_at: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('roles')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.log('✅ Rôle mis à jour:', id);
    return { success: true, data };
  } catch (error) {
    logger.error('Erreur mise à jour rôle:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour du rôle'
    };
  }
}

/**
 * Supprimer un rôle
 */
export async function deleteRole(id) {
  try {
    logger.log('Suppression rôle:', id);

    // Vérifier que ce n'est pas un rôle système
    const { data: role, error: fetchError } = await supabase
      .from('roles')
      .select('is_system, nom')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (role?.is_system) {
      throw new Error('Impossible de supprimer un rôle système.');
    }

    // Vérifier qu'aucun utilisateur n'utilise ce rôle
    const { data: users, error: usersError } = await supabase
      .from('utilisateurs')
      .select('id')
      .eq('role', role.nom)
      .limit(1);

    if (usersError) throw usersError;

    if (users && users.length > 0) {
      throw new Error('Impossible de supprimer ce rôle car des utilisateurs l\'utilisent encore.');
    }

    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    logger.log('✅ Rôle supprimé:', id);
    return { success: true };
  } catch (error) {
    logger.error('Erreur suppression rôle:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression du rôle'
    };
  }
}

/**
 * Permissions disponibles dans le système
 */
export const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard', description: 'Accéder au tableau de bord' },
  { id: 'leads.view', label: 'Voir les leads', description: 'Consulter la liste des leads' },
  { id: 'leads.create', label: 'Créer des leads', description: 'Créer de nouveaux leads' },
  { id: 'leads.edit', label: 'Modifier les leads', description: 'Modifier les leads existants' },
  { id: 'leads.delete', label: 'Supprimer les leads', description: 'Supprimer des leads' },
  { id: 'devis.view', label: 'Voir les devis', description: 'Consulter la liste des devis' },
  { id: 'devis.create', label: 'Créer des devis', description: 'Créer de nouveaux devis' },
  { id: 'devis.edit', label: 'Modifier les devis', description: 'Modifier les devis existants' },
  { id: 'devis.delete', label: 'Supprimer les devis', description: 'Supprimer des devis' },
  { id: 'devis.approve', label: 'Approuver les devis', description: 'Approuver des devis' },
  { id: 'commandes.view', label: 'Voir les commandes', description: 'Consulter la liste des commandes' },
  { id: 'commandes.create', label: 'Créer des commandes', description: 'Créer de nouvelles commandes' },
  { id: 'commandes.edit', label: 'Modifier les commandes', description: 'Modifier les commandes existantes' },
  { id: 'commandes.delete', label: 'Supprimer les commandes', description: 'Supprimer des commandes' },
  { id: 'factures.view', label: 'Voir les factures', description: 'Consulter la liste des factures' },
  { id: 'factures.create', label: 'Créer des factures', description: 'Créer de nouvelles factures' },
  { id: 'factures.edit', label: 'Modifier les factures', description: 'Modifier les factures existantes' },
  { id: 'factures.delete', label: 'Supprimer les factures', description: 'Supprimer des factures' },
  { id: 'produits.view', label: 'Voir les produits', description: 'Consulter la liste des produits' },
  { id: 'produits.create', label: 'Créer des produits', description: 'Créer de nouveaux produits' },
  { id: 'produits.edit', label: 'Modifier les produits', description: 'Modifier les produits existants' },
  { id: 'produits.delete', label: 'Supprimer les produits', description: 'Supprimer des produits' },
  { id: 'clients.view', label: 'Voir les clients', description: 'Consulter la liste des clients' },
  { id: 'clients.create', label: 'Créer des clients', description: 'Créer de nouveaux clients' },
  { id: 'clients.edit', label: 'Modifier les clients', description: 'Modifier les clients existants' },
  { id: 'clients.delete', label: 'Supprimer les clients', description: 'Supprimer des clients' },
  { id: 'utilisateurs.view', label: 'Voir les utilisateurs', description: 'Consulter la liste des utilisateurs' },
  { id: 'utilisateurs.create', label: 'Créer des utilisateurs', description: 'Créer de nouveaux utilisateurs' },
  { id: 'utilisateurs.edit', label: 'Modifier les utilisateurs', description: 'Modifier les utilisateurs existants' },
  { id: 'utilisateurs.delete', label: 'Supprimer les utilisateurs', description: 'Supprimer des utilisateurs' },
  { id: 'utilisateurs.manage', label: 'Gérer les rôles', description: 'Gérer les rôles et permissions' },
  { id: 'parametres.view', label: 'Voir les paramètres', description: 'Consulter les paramètres' },
  { id: 'parametres.edit', label: 'Modifier les paramètres', description: 'Modifier les paramètres' },
  { id: 'rapports.view', label: 'Voir les rapports', description: 'Consulter les rapports' },
  { id: 'rapports.export', label: 'Exporter les rapports', description: 'Exporter les rapports' },
  { id: 'all', label: 'Toutes les permissions (admin)', description: 'Accès total à toutes les fonctionnalités' },
];


