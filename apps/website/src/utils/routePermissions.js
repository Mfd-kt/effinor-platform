/**
 * Utilitaires pour vérifier les permissions d'accès aux routes
 *
 * Mapping des routes vers les rôles autorisés (back-office CRM + contenus, sans e-commerce).
 */

const ROUTE_PERMISSIONS = {
  '/dashboard': ['super_admin', 'admin', 'commercial', 'technicien', 'callcenter'],
  '/leads': ['super_admin', 'admin', 'commercial'],
  '/leads/:id': ['super_admin', 'admin', 'commercial'],
  '/admin/blog': ['super_admin', 'admin', 'manager', 'backoffice', 'commercial', 'technicien', 'callcenter'],
  '/admin/blog/new': ['super_admin', 'admin', 'manager', 'backoffice'],
  '/admin/blog/:postId': ['super_admin', 'admin', 'manager', 'backoffice', 'commercial', 'technicien', 'callcenter'],
  '/admin/pages-seo': ['super_admin', 'admin', 'manager', 'backoffice'],
  '/admin/realisations': ['super_admin', 'admin', 'manager', 'backoffice'],
  '/admin/realisations/:id': ['super_admin', 'admin', 'manager', 'backoffice'],
  '/admin/medias': ['super_admin', 'admin', 'manager', 'backoffice'],
  '/utilisateurs': ['super_admin', 'admin'],
  '/utilisateurs/:id': ['super_admin', 'admin'],
  '/utilisateurs/new': ['super_admin', 'admin'],
  '/paramètres/roles': ['super_admin', 'admin'],
  '/paramètres/lead-statuses': ['super_admin', 'admin'],
  '/paramètres/contenu': ['super_admin', 'admin', 'manager', 'backoffice'],
  '/visiteurs': ['super_admin', 'admin'],
  '/mon-compte': ['super_admin', 'admin', 'commercial', 'technicien', 'callcenter'],
  '/notifications': ['super_admin', 'admin', 'commercial', 'technicien', 'callcenter'],
};

export const canAccessRoute = (route, userRole) => {
  if (!route || !userRole) {
    if (import.meta.env.DEV) {
      console.log(`[canAccessRoute] Route ou userRole manquant: route=${route}, userRole=${userRole}`);
    }
    return false;
  }

  const normalizedRoute = route.replace(/\/:[^/]+/g, '/:id');

  if (ROUTE_PERMISSIONS[normalizedRoute]) {
    const allowedRoles = ROUTE_PERMISSIONS[normalizedRoute];
    const hasAccess = allowedRoles.includes(userRole) ||
      (allowedRoles.includes('admin') && userRole === 'super_admin') ||
      (allowedRoles.includes('super_admin') && (userRole === 'super_admin' || userRole === 'admin'));

    if (import.meta.env.DEV) {
      console.log(`[canAccessRoute] Route: ${route}, userRole: ${userRole}, allowedRoles:`, allowedRoles, `hasAccess: ${hasAccess}`);
    }

    return hasAccess;
  }

  for (const [routePattern, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    const pattern = routePattern.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(route)) {
      const hasAccess = allowedRoles.includes(userRole) ||
        (allowedRoles.includes('admin') && userRole === 'super_admin') ||
        (allowedRoles.includes('super_admin') && (userRole === 'super_admin' || userRole === 'admin'));

      if (import.meta.env.DEV) {
        console.log(`[canAccessRoute] Route pattern: ${routePattern}, userRole: ${userRole}, allowedRoles:`, allowedRoles, `hasAccess: ${hasAccess}`);
      }

      return hasAccess;
    }
  }

  if (import.meta.env.DEV) {
    console.log(`[canAccessRoute] Route non trouvée dans le mapping: ${route}`);
  }
  return false;
};

export const getAllowedRolesForRoute = (route) => {
  const normalizedRoute = route.replace(/\/:[^/]+/g, '/:id');
  return ROUTE_PERMISSIONS[normalizedRoute] || [];
};
