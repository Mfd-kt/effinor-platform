/**
 * API publique Réalisations — source Airtable (realisationsAirtable.js).
 */

import { getRealisations, getRealisationBySlug } from '@/lib/realisationsAirtable';
import { logger } from '@/utils/logger';

export async function getPublicRealisations() {
  try {
    const data = await getRealisations();
    return { success: true, data };
  } catch (error) {
    logger.error('getPublicRealisations error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getPublicRealisationBySlug(slug) {
  try {
    if (!slug) throw new Error('Slug requis');
    const item = await getRealisationBySlug(slug);
    if (!item) return { success: false, error: 'Réalisation non trouvée', data: null };
    return { success: true, data: item };
  } catch (error) {
    logger.error('getPublicRealisationBySlug error:', error);
    return { success: false, error: error.message, data: null };
  }
}
