import { supabase } from '@/lib/supabaseClient';

/**
 * Helper to build a standard error response
 */
const buildError = (error, fallbackMessage = 'Erreur lors du chargement des produits') => {
  console.error('[Products API] ', error);
  return {
    success: false,
    error: error?.message || fallbackMessage,
    data: []
  };
};

/**
 * Catégories à utiliser pour la section best-sellers de la home.
 * On limite volontairement aux familles stratégiques.
 */
const BEST_SELLER_CATEGORIES = [
  'highbay-led',
  'projecteur-led-floodlight',
  'reglettes-led',
  'panneaux-led',
  'borne-recharge-maison',
  'borne-recharge-copro-entreprise'
];

/**
 * Récupérer les produits associés à un secteur d'activité
 * @param {string} secteurSlug - Le slug du secteur (ex: 'industrie-logistique')
 * @returns {Promise<{success: boolean, data: any[], error?: string}>}
 */
export async function getProductsBySector(secteurSlug) {
  if (!secteurSlug) {
    return { success: true, data: [] };
  }

  try {
    // 1) Récupérer les liaisons produit-secteur
    const { data: links, error: linksError } = await supabase
      .from('product_sectors')
      .select('product_id, ordre')
      .eq('secteur_slug', secteurSlug)
      .order('ordre', { ascending: true });

    if (linksError) {
      // Si la table n'existe pas encore, retourner vide
      if (linksError.code === '42P01' || linksError.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw linksError;
    }

    if (!links || links.length === 0) {
      return { success: true, data: [] };
    }

    const productIds = links.map((l) => l.product_id).filter(Boolean);
    if (productIds.length === 0) {
      return { success: true, data: [] };
    }

    // 2) Charger les produits (uniquement ceux actifs avec image)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(
        'id, nom, slug, prix, categorie, actif, image_1, image_2, image_3, image_4, image_url, description, sur_devis, marque, reference, caracteristiques, puissance'
      )
      .in('id', productIds)
      .eq('actif', true)
      .or('image_1.not.is.null,image_url.not.is.null');

    if (productsError) {
      if (productsError.code === '42P01' || productsError.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw productsError;
    }

    // 3) Remettre dans l'ordre défini par ordre / product_id
    const productsById = new Map((products || []).map((p) => [p.id, p]));
    const orderMap = new Map(links.map((l) => [l.product_id, l.ordre ?? 0]));

    const orderedProducts = links
      .map((link) => {
        const prod = productsById.get(link.product_id);
        if (!prod) return null;
        return {
          ...prod,
          secteur_ordre: link.ordre ?? 0
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 0;
        const orderB = orderMap.get(b.id) ?? 0;
        return orderA - orderB;
      });

    return {
      success: true,
      data: orderedProducts
    };
  } catch (error) {
    return buildError(error, `Erreur lors du chargement des produits pour le secteur ${secteurSlug}`);
  }
}

/**
 * Charger les accessoires pour un produit donné.
 *
 * Un "accessoire" est lui-même un produit dans la table `products`,
 * relié via la table de liaison `product_accessories`.
 *
 * @param {string|number} productId - ID du produit principal
 * @returns {Promise<{success: boolean, data: any[], error?: string}>}
 */
export async function getAccessoriesForProduct(productId) {
  if (!productId) {
    return { success: true, data: [] };
  }

  try {
    // 1) Récupérer les liens produit -> accessoire
    const { data: links, error: linksError } = await supabase
      .from('product_accessories')
      .select('accessory_id, priorite')
      .eq('product_id', productId)
      .order('priorite', { ascending: true });

    if (linksError) {
      // Si la table n'existe pas encore en dev, ne pas casser le site
      if (linksError.code === '42P01' || linksError.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw linksError;
    }

    if (!links || links.length === 0) {
      return { success: true, data: [] };
    }

    const accessoryIds = links.map((l) => l.accessory_id).filter(Boolean);
    if (accessoryIds.length === 0) {
      return { success: true, data: [] };
    }

    // 2) Charger les produits accessoires (uniquement ceux avec image)
    const { data: accessories, error: productsError } = await supabase
      .from('products')
      .select(
        'id, nom, slug, prix, categorie, actif, image_1, image_2, image_3, image_4, image_url, description, sur_devis'
      )
      .in('id', accessoryIds)
      .eq('actif', true)
      .or('image_1.not.is.null,image_url.not.is.null');

    if (productsError) {
      // Si la table products pose problème, on log mais on ne casse pas
      if (productsError.code === '42P01' || productsError.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw productsError;
    }

    // 3) Remettre dans l'ordre défini par priorite / accessory_id
    const accessoriesById = new Map((accessories || []).map((p) => [p.id, p]));

    const orderedAccessories = links
      .map((link) => {
        const prod = accessoriesById.get(link.accessory_id);
        if (!prod) return null;
        return {
          ...prod,
          priorite: link.priorite ?? null
        };
      })
      .filter(Boolean);

    return {
      success: true,
      data: orderedAccessories
    };
  } catch (error) {
    return buildError(error, 'Erreur lors du chargement des accessoires du produit');
  }
}

/**
 * Charger les accessoires pour une catégorie complète.
 *
 * On regarde tous les produits de la catégorie, puis on récupère
 * les accessoires liés à ces produits, en dédupliquant.
 *
 * @param {string} categorySlug - slug ou identifiant de la catégorie (champ `categorie` du produit)
 * @returns {Promise<{success: boolean, data: any[], error?: string}>}
 */
export async function getAccessoriesForCategory(categorySlug) {
  if (!categorySlug) {
    return { success: true, data: [] };
  }

  try {
    // 1) Récupérer les produits de la catégorie
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('categorie', categorySlug)
      .eq('actif', true);

    if (productsError) {
      if (productsError.code === '42P01' || productsError.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw productsError;
    }

    if (!products || products.length === 0) {
      return { success: true, data: [] };
    }

    const productIds = products.map((p) => p.id);

    // 2) Récupérer tous les liens product_accessories pour ces produits
    const { data: links, error: linksError } = await supabase
      .from('product_accessories')
      .select('product_id, accessory_id, priorite')
      .in('product_id', productIds);

    if (linksError) {
      if (linksError.code === '42P01' || linksError.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw linksError;
    }

    if (!links || links.length === 0) {
      return { success: true, data: [] };
    }

    const accessoryIds = Array.from(new Set(links.map((l) => l.accessory_id).filter(Boolean)));
    if (accessoryIds.length === 0) {
      return { success: true, data: [] };
    }

    // 3) Charger les produits accessoires dédupliqués
    const { data: accessories, error: accessoriesError } = await supabase
      .from('products')
      .select(
        'id, nom, slug, prix, categorie, actif, image_1, image_2, image_3, image_4, image_url, description, sur_devis'
      )
      .in('id', accessoryIds)
      .eq('actif', true)
      .or('image_1.not.is.null,image_url.not.is.null');

    if (accessoriesError) {
      if (accessoriesError.code === '42P01' || accessoriesError.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw accessoriesError;
    }

    return {
      success: true,
      data: accessories || []
    };
  } catch (error) {
    return buildError(error, 'Erreur lors du chargement des accessoires de la catégorie');
  }
}

/**
 * Charger les produits best-sellers pour la page d'accueil.
 * 
 * Exclut les accessoires (produits qui apparaissent dans product_accessories.accessory_id).
 * Filtre uniquement les 6 catégories principales : highbay-led, projecteur-led-floodlight, reglettes-led, panneaux-led, borne-recharge-maison, borne-recharge-copro-entreprise.
 * Ne garde que les produits marqués is_best_seller = true (sélectionnés dans le dashboard).
 * 
 * @param {number} limit - Nombre de produits à retourner (défaut: 8)
 * @returns {Promise<{success: boolean, data: any[], error?: string}>}
 */
export async function getBestSellerProducts(limit = 8) {
  try {
    // 1) Récupérer tous les IDs de produits qui sont des accessoires
    let accessoryIds = [];
    try {
      const { data: accessoriesData, error: accessoriesError } = await supabase
        .from('product_accessories')
        .select('accessory_id');

      if (!accessoriesError && accessoriesData) {
        accessoryIds = Array.from(new Set(accessoriesData.map(a => a.accessory_id).filter(Boolean)));
      }
    } catch (err) {
      // Si la table product_accessories n'existe pas, on continue sans exclure les accessoires
    }

    // 2) Récupérer les produits (on filtrera les accessoires après)
    // IMPORTANT: On filtre uniquement les produits avec is_best_seller = true
    const { data: allData, error } = await supabase
      .from('products')
      .select(
        'id, nom, slug, prix, categorie, actif, image_1, image_2, image_3, image_4, image_url, description, sur_devis, marque, reference, is_best_seller'
      )
      .eq('actif', true)
      .in('categorie', BEST_SELLER_CATEGORIES)
      .eq('is_best_seller', true)
      .or('image_1.not.is.null,image_url.not.is.null')
      .order('ordre', { ascending: true, nullsLast: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42703' || error.message?.includes('column') && error.message?.includes('is_best_seller')) {
        return { success: true, data: [] };
      }
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw error;
    }

    // 3) Filtrer les accessoires en JavaScript
    let filteredData = allData || [];
    if (accessoryIds.length > 0 && filteredData.length > 0) {
      const accessorySet = new Set(accessoryIds);
      filteredData = filteredData.filter(product => !accessorySet.has(product.id));
    }

    // 4) Limiter le nombre de résultats
    const data = filteredData.slice(0, limit);

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    return buildError(error, 'Erreur lors du chargement des produits best-sellers');
  }
}

/**
 * Charger les nouveaux produits pour la page d'accueil.
 * 
 * Récupère les derniers produits créés, actifs et avec images.
 * 
 * @param {number} limit - Nombre de produits à retourner (défaut: 8)
 * @returns {Promise<{success: boolean, data: any[], error?: string}>}
 */
export async function getNewProducts(limit = 8) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(
        'id, nom, slug, prix, categorie, actif, image_1, image_2, image_3, image_4, image_url, description, sur_devis, marque, reference'
      )
      .eq('actif', true)
      .or('image_1.not.is.null,image_url.not.is.null')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return { success: true, data: [] };
      }
      throw error;
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    return buildError(error, 'Erreur lors du chargement des nouveaux produits');
  }
}


