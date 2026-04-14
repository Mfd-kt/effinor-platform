/**
 * Blog Posts API — source : Airtable (lib/blogAirtable.js)
 *
 * Les fonctions admin (createPost, updatePost, deletePost, getAdminPosts, getPostById)
 * sont conservées comme stubs pour ne pas casser les imports des pages admin existantes.
 * Elles renvoient des erreurs explicites car le back-office Supabase est désactivé.
 */

import { getBlogPosts, getBlogPostBySlug } from '@/lib/blogAirtable';
import { logger } from '@/utils/logger';

// ─── Site public ─────────────────────────────────────────────────────────────

/**
 * Récupère les posts publiés avec pagination client-side.
 */
export async function getPublicPosts({ page = 1, limit = 10 } = {}) {
  try {
    const all   = await getBlogPosts();
    const total = all.length;
    const from  = (page - 1) * limit;
    const data  = all.slice(from, from + limit);

    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('getPublicPosts error:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
    };
  }
}

/**
 * Récupère un post publié par son slug.
 */
export async function getPublicPostBySlug(slug) {
  try {
    if (!slug) throw new Error('Slug requis');
    const post = await getBlogPostBySlug(slug);
    if (!post) return { success: false, error: 'Article non trouvé', data: null };
    return { success: true, data: post };
  } catch (error) {
    logger.error('getPublicPostBySlug error:', error);
    return { success: false, error: error.message, data: null };
  }
}

// ─── Stubs admin ─────────────────────────────────────────────────────────────
// Conservés pour éviter les erreurs d'import dans les pages admin.

const _adminDisabled = () =>
  Promise.resolve({ success: false, error: 'Back-office désactivé (Supabase supprimé)', data: null });

export const getAdminPosts    = _adminDisabled;
export const getPostById      = _adminDisabled;
export const createPost       = _adminDisabled;
export const updatePost       = _adminDisabled;
export const deletePost       = _adminDisabled;

export function generateSlugFromTitle(title = '') {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
