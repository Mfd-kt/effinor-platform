/**
 * Vérifie si un utilisateur a une permission spécifique
 * @param {Object} user - Objet utilisateur avec permissions
 * @param {string} permission - Permission à vérifier (ex: 'leads.view')
 * @returns {boolean} - True si l'utilisateur a la permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;

  // Admin a toutes les permissions
  if (user.permissions.includes('all')) return true;

  // Vérifier la permission exacte
  if (user.permissions.includes(permission)) return true;

  // Vérifier les permissions wildcard (ex: "leads.*" correspond à "leads.view")
  const [resource, action] = permission.split('.');
  if (resource && action) {
    // Vérifier "resource.*" (ex: "leads.*")
    if (user.permissions.includes(`${resource}.*`)) return true;

    // Vérifier "*.action" (ex: "*.view")
    if (user.permissions.includes(`*.${action}`)) return true;
  } else if (permission.includes('*')) {
    // Permission wildcard dans la demande
    const pattern = permission.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return user.permissions.some(perm => regex.test(perm));
  }

  return false;
}

/**
 * Vérifie si un utilisateur peut accéder à une route
 * @param {Object} user - Objet utilisateur avec permissions
 * @param {string} route - Route à vérifier (ex: '/admin/leads')
 * @returns {boolean} - True si l'utilisateur peut accéder à la route
 */
export function canAccess(user, route) {
  if (!user || !route) return false;

  // Admin a accès à tout
  if (hasPermission(user, 'all')) return true;

  // Mapping des routes vers les permissions (routes unifiées sans préfixes)
  const routePermissions = {
    '/dashboard': 'dashboard',
    '/leads': 'leads.view',
    '/leads/new': 'leads.create',
    '/devis': 'devis.view',
    '/devis/new': 'devis.create',
    '/commandes': 'commandes.view',
    '/commandes/new': 'commandes.create',
    '/produits': 'produits.view',
    '/produits/new': 'produits.create',
    '/utilisateurs': 'utilisateurs.view',
    '/utilisateurs/new': 'utilisateurs.create',
    '/paramètres/roles': 'utilisateurs.manage',
    '/factures': 'factures.view',
    '/factures/new': 'factures.create',
    '/clients': 'clients.view',
    '/clients/new': 'clients.create',
    '/rapports': 'rapports.view',
    '/paramètres': 'parametres.view',
    // Support des anciennes routes pour compatibilité
    '/admin/dashboard': 'dashboard',
    '/admin/leads': 'leads.view',
    '/admin/leads/new': 'leads.create',
    '/admin/devis': 'devis.view',
    '/admin/devis/new': 'devis.create',
    '/admin/orders': 'commandes.view',
    '/admin/orders/new': 'commandes.create',
    '/admin/products': 'produits.view',
    '/admin/products/new': 'produits.create',
    '/admin/utilisateurs': 'utilisateurs.view',
    '/admin/utilisateurs/new': 'utilisateurs.create',
    '/admin/roles': 'utilisateurs.manage',
    '/admin/factures': 'factures.view',
    '/admin/factures/new': 'factures.create',
    '/admin/clients': 'clients.view',
    '/admin/clients/new': 'clients.create',
    '/admin/rapports': 'rapports.view',
    '/admin/parametres': 'parametres.view',
  };

  // Vérifier la permission pour cette route exacte
  const permission = routePermissions[route];
  if (permission && hasPermission(user, permission)) return true;

  // Vérifier les routes qui commencent par...
  for (const [routePattern, perm] of Object.entries(routePermissions)) {
    if (route.startsWith(routePattern)) {
      if (hasPermission(user, perm)) return true;
    }
  }

  return false;
}

/**
 * Vérifie si un utilisateur peut effectuer une action sur une ressource
 * @param {Object} user - Objet utilisateur
 * @param {string} resource - Ressource (ex: 'leads', 'devis')
 * @param {string} action - Action (ex: 'view', 'create', 'edit', 'delete')
 * @returns {boolean} - True si l'utilisateur peut effectuer l'action
 */
export function canPerform(user, resource, action) {
  const permission = `${resource}.${action}`;
  return hasPermission(user, permission);
}

/**
 * Filtre une liste d'éléments selon les permissions de l'utilisateur
 * @param {Object} user - Objet utilisateur
 * @param {Array} items - Liste d'éléments
 * @param {Function} permissionCheck - Fonction qui retourne la permission requise pour chaque élément
 * @returns {Array} - Liste filtrée
 */
export function filterByPermission(user, items, permissionCheck) {
  if (!user || !items || !Array.isArray(items)) return [];
  return items.filter(item => {
    const permission = permissionCheck(item);
    return hasPermission(user, permission);
  });
}

/**
 * Obtient toutes les permissions d'un utilisateur
 * @param {Object} user - Objet utilisateur
 * @returns {Array} - Liste des permissions
 */
export function getUserPermissions(user) {
  if (!user || !user.permissions) return [];
  return Array.isArray(user.permissions) ? user.permissions : [];
}

/**
 * Vérifie si un utilisateur est admin
 * @param {Object} user - Objet utilisateur
 * @returns {boolean} - True si l'utilisateur est admin
 */
export function isAdmin(user) {
  if (!user) return false;
  const userRole = user.role?.slug || '';
  return userRole === 'admin' || userRole === 'super_admin' || hasPermission(user, 'all');
}









