import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';

/**
 * ⚠️ IMPORTANT: Admin API Operations
 * 
 * The Supabase Admin API (supabase.auth.admin.*) requires a service_role key
 * and should NOT be used directly from client-side code.
 * 
 * For production, you should:
 * 1. Create a server-side API endpoint (Node.js/Python) that uses the service_role key
 * 2. Or use Supabase Edge Functions
 * 3. Or use a backend service with the service_role key
 * 
 * The service_role key bypasses RLS and should NEVER be exposed in client code.
 * 
 * Current implementation uses the client SDK which may work in development
 * but will fail in production without proper server-side implementation.
 */

// Rôles et permissions
export const ROLES = {
  admin: {
    label: 'Administrateur',
    permissions: ['all']
  },
  commercial: {
    label: 'Commercial',
    permissions: ['leads', 'devis', 'commandes', 'clients']
  },
  technicien: {
    label: 'Technicien',
    permissions: ['commandes', 'installation', 'produits']
  },
  comptable: {
    label: 'Comptable',
    permissions: ['factures', 'paiements', 'devis', 'commandes']
  },
  lecture: {
    label: 'Lecture seule',
    permissions: ['view_only']
  }
};

// Générer un mot de passe aléatoire
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Redimensionner une image à 200x200px
 */
function resizeImage(file, maxWidth = 200, maxHeight = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, file.type, 0.9);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(file, userId) {
  try {
    logger.log('Upload avatar pour utilisateur:', userId);

    // Valider le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Type de fichier invalide. Utilisez JPG, PNG ou WebP.');
    }

    // Valider la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux. Taille maximum: 2MB.');
    }

    // Redimensionner l'image
    const resizedFile = await resizeImage(file, 200, 200);

    // Générer le nom du fichier
    const fileExt = resizedFile.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, resizedFile, { 
        upsert: true,
        cacheControl: '3600',
        contentType: resizedFile.type
      });

    if (uploadError) {
      logger.error('Erreur upload avatar:', uploadError);
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    // Récupérer l'URL publique
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    logger.log('✅ Avatar uploadé:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    logger.error('Erreur upload avatar:', error);
    throw error;
  }
}

/**
 * Créer un utilisateur avec Auth et profil
 * @param {Object} userData - Données de l'utilisateur
 * @param {File} photoFile - Fichier photo optionnel
 */
export async function createUserWithAuth(userData, photoFile = null) {
  try {
    logger.log('=== CRÉATION UTILISATEUR ===');
    logger.log('Données:', { ...userData, password: '***' });

    // Vérifier que l'email n'existe pas déjà
    const { data: existingUser, error: checkError } = await supabase
      .from('utilisateurs')
      .select('id, email')
      .eq('email', userData.email.toLowerCase())
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingUser) {
      throw new Error('Cet email est déjà utilisé par un autre utilisateur.');
    }

    // Générer un mot de passe aléatoire
    const tempPassword = generateRandomPassword();

    // 1. Créer l'utilisateur dans auth.users
    logger.log('Création dans auth.users...');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email.toLowerCase(),
        password: tempPassword,
        email_confirm: true, // Confirmer automatiquement l'email
        user_metadata: {
          prenom: userData.prenom,
          nom: userData.nom,
          full_name: `${userData.prenom} ${userData.nom}`
        }
      });

      if (authError) {
        logger.error('Erreur création auth:', authError);
        
        // Vérifier si c'est une erreur de permissions/service_role
        if (authError.message?.includes('JWT') || authError.message?.includes('service_role') || authError.message?.includes('Invalid API key')) {
          throw new Error('Impossible de créer l\'utilisateur. La fonction admin nécessite une clé service_role. Veuillez utiliser une Edge Function Supabase ou un backend pour créer les utilisateurs.');
        }
        
        throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
      }
      
      logger.log('✅ Utilisateur Auth créé:', authData.user.id);
      
      // 2. Upload de la photo si fournie
      let photoUrl = null;
      if (photoFile) {
        try {
          photoUrl = await uploadAvatar(photoFile, authData.user.id);
        } catch (error) {
          logger.error('Erreur upload photo:', error);
          // Ne pas bloquer la création si l'upload échoue
          // L'utilisateur pourra ajouter une photo plus tard
        }
      }

      // 3. Créer le profil dans utilisateurs
      const roleConfig = ROLES[userData.role] || ROLES.lecture;
      
      const profileData = sanitizeFormData({
        auth_user_id: authData.user.id,
        email: userData.email.toLowerCase(),
        prenom: userData.prenom,
        nom: userData.nom,
        full_name: `${userData.prenom} ${userData.nom}`,
        telephone: userData.telephone || null,
        poste: userData.poste || null,
        role: userData.role,
        permissions: userData.permissions || roleConfig.permissions,
        photo_profil_url: photoUrl,
        statut: userData.statut || 'actif',
        departement: userData.departement || null,
        equipe: userData.equipe || null,
        bio: userData.bio || null,
        created_at: new Date().toISOString()
      });

      logger.log('Création du profil utilisateur...');
      const { data: profile, error: profileError } = await supabase
        .from('utilisateurs')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        // Si le profil échoue, supprimer l'utilisateur Auth
        logger.error('Erreur création profil:', profileError);
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (deleteError) {
          logger.error('Erreur suppression utilisateur Auth:', deleteError);
        }
        
        // Message d'erreur détaillé
        if (profileError.message?.includes('column') && profileError.message?.includes('does not exist')) {
          const missingColumn = profileError.message.match(/column "([^"]+)" does not exist/)?.[1];
          throw new Error(`La colonne "${missingColumn}" n'existe pas dans la table 'utilisateurs'. Veuillez la créer dans Supabase.`);
        }
        
        throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
      }

      logger.log('✅ Profil utilisateur créé:', profile.id);

      return {
        success: true,
        authData,
        profile,
        tempPassword
      };
      
    } catch (adminError) {
      // Si c'est une erreur admin, retourner un message clair
      if (adminError.message?.includes('service_role') || adminError.message?.includes('JWT') || adminError.message?.includes('Invalid API key')) {
        throw new Error('Impossible de créer l\'utilisateur avec l\'API admin. Cette fonctionnalité nécessite une Edge Function Supabase ou un backend avec la clé service_role. Contactez le développeur pour configurer cette fonctionnalité.');
      }
      throw adminError;
    }

    logger.log('✅ Utilisateur Auth créé:', authData.user.id);

    // 2. Upload de la photo si fournie
    let photoUrl = null;
    if (photoFile) {
      try {
        photoUrl = await uploadAvatar(photoFile, authData.user.id);
      } catch (error) {
        logger.error('Erreur upload photo:', error);
        // Ne pas bloquer la création si l'upload échoue
        // L'utilisateur pourra ajouter une photo plus tard
      }
    }

    // 3. Créer le profil dans utilisateurs
    const roleConfig = ROLES[userData.role] || ROLES.lecture;
    
    const profileData = sanitizeFormData({
      auth_user_id: authData.user.id,
      email: userData.email.toLowerCase(),
      prenom: userData.prenom,
      nom: userData.nom,
      full_name: `${userData.prenom} ${userData.nom}`,
      telephone: userData.telephone || null,
      poste: userData.poste || null,
      role: userData.role,
      permissions: userData.permissions || roleConfig.permissions,
      photo_profil_url: photoUrl,
      statut: userData.statut || 'actif',
      departement: userData.departement || null,
      equipe: userData.equipe || null,
      bio: userData.bio || null,
      created_at: new Date().toISOString()
    });

    logger.log('Création du profil utilisateur...');
    const { data: profile, error: profileError } = await supabase
      .from('utilisateurs')
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      // Si le profil échoue, supprimer l'utilisateur Auth
      logger.error('Erreur création profil:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
    }

    logger.log('✅ Profil créé:', profile.id);

    // 3. Optionnel: Envoyer un email d'invitation
    // TODO: Implémenter l'envoi d'email avec le mot de passe temporaire

    return {
      success: true,
      authUser: authData.user,
      profile,
      tempPassword // Retourner le mot de passe pour l'afficher à l'admin
    };

  } catch (error) {
    logger.error('❌ Erreur création utilisateur:', error);
    throw error;
  }
}

/**
 * Récupérer tous les utilisateurs
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select(`
        id,
        auth_user_id,
        email,
        prenom,
        nom,
        full_name,
        telephone,
        poste,
        departement,
        equipe,
        role_id,
        permissions,
        statut,
        statut_emploi,
        active,
        avatar_url,
        photo_profil_url,
        derniere_connexion,
        created_at,
        updated_at,
        role:roles!utilisateurs_role_id_fkey(id, slug, label, nom)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    logger.error('Erreur récupération utilisateurs:', error);
    throw error;
  }
}

/**
 * Récupérer un utilisateur par ID
 */
export async function getUserById(id) {
  try {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    logger.error('Erreur récupération utilisateur:', error);
    throw error;
  }
}

/**
 * Mettre à jour un utilisateur
 * @param {string} id - ID de l'utilisateur
 * @param {Object} updates - Données à mettre à jour
 * @param {File} photoFile - Fichier photo optionnel
 */
export async function updateUser(id, updates, photoFile = null) {
  try {
    logger.log('Mise à jour utilisateur:', id, updates);

    // Upload de la photo si fournie
    if (photoFile) {
      try {
        // Récupérer auth_user_id pour l'upload
        const { data: user } = await supabase
          .from('utilisateurs')
          .select('auth_user_id')
          .eq('id', id)
          .single();

        if (user?.auth_user_id) {
          const photoUrl = await uploadAvatar(photoFile, user.auth_user_id);
          updates.photo_profil_url = photoUrl;
        }
      } catch (error) {
        logger.error('Erreur upload photo:', error);
        // Ne pas bloquer la mise à jour si l'upload échoue
      }
    }

    const updateData = sanitizeFormData({
      ...updates,
      updated_at: new Date().toISOString()
    });

    // Si le rôle change, mettre à jour les permissions
    if (updates.role && ROLES[updates.role]) {
      updateData.permissions = ROLES[updates.role].permissions;
    }

    const { data, error } = await supabase
      .from('utilisateurs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Si email change, mettre à jour auth.users aussi
    if (updates.email && data.auth_user_id) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        data.auth_user_id,
        {
          email: updates.email.toLowerCase(),
          user_metadata: {
            prenom: updates.prenom || data.prenom,
            nom: updates.nom || data.nom,
            full_name: `${updates.prenom || data.prenom} ${updates.nom || data.nom}`
          }
        }
      );

      if (authError) {
        logger.error('Erreur mise à jour auth:', authError);
        // Ne pas échouer la mise à jour du profil si l'auth échoue
      }
    }

    return { success: true, data };
  } catch (error) {
    logger.error('Erreur mise à jour utilisateur:', error);
    throw error;
  }
}

/**
 * Supprimer un utilisateur
 * Supprime à la fois le profil dans utilisateurs ET l'utilisateur Auth via Edge Function
 */
export async function deleteUser(id) {
  try {
    logger.log('Suppression utilisateur:', id);

    // Récupérer auth_user_id avant suppression (pour l'Edge Function)
    const { data: user, error: fetchError } = await supabase
      .from('utilisateurs')
      .select('auth_user_id, email')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Appeler l'Edge Function qui gère les deux suppressions (auth.users + public.utilisateurs)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const functionUrl = `${supabaseUrl}/functions/v1/delete-user`;
    
    logger.log('📤 Appel Edge Function delete-user:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        utilisateur_id: id, // ID de la table utilisateurs
        auth_user_id: user.auth_user_id || undefined, // ID de auth.users si existe
      }),
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = { error: responseText || 'Erreur inconnue' };
    }

    if (!response.ok) {
      const errorMsg = responseData?.error || 'Erreur lors de la suppression de l\'utilisateur';
      logger.error('❌ Erreur Edge Function delete-user:', errorMsg);
      throw new Error(errorMsg);
    }

    logger.log('✅ Utilisateur supprimé:', {
      utilisateur_id: id,
      auth_deleted: responseData?.auth_deleted,
      table_deleted: responseData?.table_deleted,
    });

    return { 
      success: true,
      auth_deleted: responseData?.auth_deleted,
      table_deleted: responseData?.table_deleted,
    };
  } catch (error) {
    logger.error('Erreur suppression utilisateur:', error);
    throw error;
  }
}

/**
 * Réinitialiser le mot de passe d'un utilisateur
 */
export async function resetUserPassword(userId) {
  try {
    logger.log('Réinitialisation mot de passe:', userId);

    // Récupérer auth_user_id
    const { data: user, error: fetchError } = await supabase
      .from('utilisateurs')
      .select('auth_user_id, email')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (!user.auth_user_id) {
      throw new Error('Aucun compte Auth associé à cet utilisateur.');
    }

    // Générer un nouveau mot de passe
    const newPassword = generateRandomPassword();

    // Mettre à jour le mot de passe
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.auth_user_id,
      {
        password: newPassword
      }
    );

    if (updateError) throw updateError;

    // Optionnel: Envoyer un email avec le nouveau mot de passe
    // TODO: Implémenter l'envoi d'email

    return {
      success: true,
      newPassword // Retourner pour affichage à l'admin
    };
  } catch (error) {
    logger.error('Erreur réinitialisation mot de passe:', error);
    throw error;
  }
}

