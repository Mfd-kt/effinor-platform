import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, LogOut, Activity, FileText, ChevronDown, ChevronRight, Cog, BookOpen, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import UserAvatar from '@/components/common/UserAvatar';
import { canAccessRoute } from '@/utils/routePermissions';
import Logo from '@/components/Logo';

const AdminSidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile } = useUser();
  const { notifications } = useNotifications();

  // Fermer le sidebar sur mobile quand on change de route
  useEffect(() => {
    if (isOpen && onClose && window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname]);
  
  // Compter les notifications non lues par type
  const unreadLeadsCount = notifications.filter(n => n.type === 'lead').length;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Erreur lors de la déconnexion', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `La déconnexion a échoué: ${err.message || 'Une erreur est survenue'}`,
      });
    }
  };

  // Use profile from UserContext, fallback to user from auth
  const currentUser = profile || user;
  const userName = currentUser?.full_name || currentUser?.email || 'Utilisateur';

  // State for settings submenu - check if any settings page is active on mount
  const [settingsOpen, setSettingsOpen] = useState(() => {
    return location.pathname.startsWith('/paramètres');
  });
  
  // State for users submenu - check if any users page is active on mount
  const [usersOpen, setUsersOpen] = useState(() => {
    return location.pathname.startsWith('/utilisateurs');
  });
  
  // State for content submenu
  const [contentOpen, setContentOpen] = useState(() => {
    return location.pathname.startsWith('/admin/pages-seo') || 
           location.pathname.startsWith('/admin/blog') ||
           location.pathname.startsWith('/admin/realisations') ||
           location.pathname.startsWith('/admin/medias');
  });

  // Obtenir le rôle de l'utilisateur
  const userRole = profile?.role?.slug || '';
  
  // Définir tous les liens possibles
  // Le dashboard est toujours visible pour tous les utilisateurs authentifiés
  const allNavLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, alwaysVisible: true },
    { 
      href: '/leads', 
      label: 'Leads', 
      icon: FileText,
      badgeCount: unreadLeadsCount > 0 ? unreadLeadsCount : null
    },
    { 
      href: '/paramètres/contenu', 
      label: 'Contenu', 
      icon: Globe,
      children: [
        { href: '/admin/pages-seo', label: 'Pages & SEO' },
        { href: '/admin/blog', label: 'Blog' },
        { href: '/admin/realisations', label: 'Réalisations' },
        { href: '/admin/medias', label: 'Médias' },
      ]
    },
    { 
      href: '/admin/blog', 
      label: 'Blog', 
      icon: BookOpen
    },
    { 
      href: '/utilisateurs', 
      label: 'Utilisateurs', 
      icon: Users, 
      children: [
        { href: '/utilisateurs', label: 'Liste des utilisateurs' },
        { href: '/utilisateurs/new', label: 'Inviter un utilisateur' },
      ]
    },
    { 
      href: '/paramètres/roles', 
      label: 'Réglages', 
      icon: Cog, 
      children: [
        { href: '/paramètres/roles', label: 'Rôles & Permissions' },
        { href: '/paramètres/lead-statuses', label: 'Statuts Leads' },
      ]
    },
    { href: '/visiteurs', label: 'Visiteurs', icon: Activity },
  ];
  
  // Filtrer les liens selon les permissions - NE PAS RENDRE les liens non autorisés
  const filteredNavLinks = allNavLinks.filter(link => {
    // Le dashboard est toujours visible si l'utilisateur est authentifié
    if (link.alwaysVisible) {
      return true;
    }
    
    // Vérifier l'accès à la route principale
    const hasAccess = canAccessRoute(link.href, userRole);
    
    if (!hasAccess) {
      if (import.meta.env.DEV) {
        console.log(`[AdminSidebar] Accès refusé pour ${link.href} avec rôle ${userRole}`);
      }
      return false;
    }
    
    // Si le lien a des enfants, vérifier qu'au moins un enfant est accessible
    if (link.children && link.children.length > 0) {
      const hasAccessibleChild = link.children.some(child => canAccessRoute(child.href, userRole));
      if (!hasAccessibleChild) {
        if (import.meta.env.DEV) {
          console.log(`[AdminSidebar] Aucun enfant accessible pour ${link.href}`);
        }
        return false;
      }
    }
    
    return true;
  });
  
  // Filtrer aussi les enfants des liens qui ont des sous-menus
  const navLinks = filteredNavLinks.map(link => {
    if (link.children && link.children.length > 0) {
      return {
        ...link,
        children: link.children.filter(child => canAccessRoute(child.href, userRole))
      };
    }
    return link;
  });

  // Update settings menu state when location changes
  useEffect(() => {
    const isSettingsActive = location.pathname.startsWith('/paramètres');
    if (isSettingsActive && !settingsOpen) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);
  
  // Update users menu state when location changes
  useEffect(() => {
    const isUsersActive = location.pathname.startsWith('/utilisateurs');
    if (isUsersActive && !usersOpen) {
      setUsersOpen(true);
    }
  }, [location.pathname]);
  
  // Update content menu state when location changes
  useEffect(() => {
    const isContentActive = location.pathname.startsWith('/admin/pages-seo') || 
                           location.pathname.startsWith('/admin/blog') ||
                           location.pathname.startsWith('/admin/realisations') ||
                           location.pathname.startsWith('/admin/medias');
    if (isContentActive && !contentOpen) {
      setContentOpen(true);
    }
  }, [location.pathname]);

  return (
    <aside className={`
      w-64 bg-gray-900 text-white flex-col fixed left-0 top-0 bottom-0 z-50 overflow-hidden
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:fixed lg:z-30
      lg:flex
    `}>
      <div className="flex flex-col h-full">
        <div className="h-20 flex items-center justify-center border-b border-gray-700 flex-shrink-0">
          <Logo to="/dashboard" size="md" showText text="Effinor Admin" />
        </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavLinks.map((link) => {
          // Check if active
          const isActive = location.pathname.startsWith(link.href) || location.pathname === link.href;
          const hasChildren = link.children && link.children.length > 0;
          
          if (hasChildren) {
            // For settings menu, check if it's the settings link
            const isSettingsLink = link.href === '/paramètres/roles';
            const isUsersLink = link.href === '/utilisateurs';
            const isContentLink = link.href === '/paramètres/contenu';
            const menuOpen = isSettingsLink ? settingsOpen : (isUsersLink ? usersOpen : (isContentLink ? contentOpen : false));
            
            return (
              <div key={link.href}>
                <button
                  onClick={() => {
                    if (isSettingsLink) {
                      setSettingsOpen(!settingsOpen);
                    } else if (isUsersLink) {
                      setUsersOpen(!usersOpen);
                    } else if (isContentLink) {
                      setContentOpen(!contentOpen);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-gray-700 font-semibold' 
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <link.icon className="h-5 w-5 mr-3" />
                    {link.label}
                  </div>
                  {menuOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {menuOpen && link.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {link.children.map((child) => {
                      const isChildActive = location.pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm ${
                            isChildActive
                              ? 'bg-gray-700 font-semibold'
                              : 'hover:bg-gray-800 text-gray-300'
                          }`}
                        >
                          <span className="ml-2">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          // Double vérification : ne pas rendre si pas d'accès (sécurité supplémentaire)
          // Sauf pour le dashboard qui est toujours visible
          if (!link.alwaysVisible && !canAccessRoute(link.href, userRole)) {
            return null;
          }
          
          return (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-gray-700 font-semibold' 
                  : 'hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center">
                <link.icon className="h-5 w-5 mr-3" />
                {link.label}
              </div>
              {link.badgeCount && link.badgeCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-emerald-500 text-white rounded-full min-w-[20px] text-center">
                  {link.badgeCount > 9 ? '9+' : link.badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-gray-700 space-y-4">
        <Link
          to="/mon-compte"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer group"
        >
          <UserAvatar 
            user={profile || { email: user?.email, full_name: userName }} 
            size="md"
            className="ring-1 ring-gray-600"
          />
          <div className="flex-1 overflow-hidden">
            <p id="user-name" className="text-sm font-semibold truncate group-hover:text-white">{userName}</p>
            <p className="text-xs text-gray-400 truncate group-hover:text-gray-300">{userRole || 'user'}</p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="mt-4 w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors flex items-center"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Se déconnecter
        </button>
        
        <Link
          to="/"
          className="flex items-center px-4 py-2.5 rounded-lg hover:bg-gray-800 text-sm text-gray-300"
        >
          <Home className="h-5 w-5 mr-3" />
          Retour au site public
        </Link>
      </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;