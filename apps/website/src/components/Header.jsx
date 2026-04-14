import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, User, ChevronDown, Flame, Wind, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBanner } from '@/contexts/BannerContext';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { inferEffinorSourceFromPath, trackPhoneClick } from '@/lib/effinorAnalytics';
import { buildLeadFormHref } from '@/lib/leadFormDestination';

const PAC_CHILDREN = [
  { path: '/pompe-a-chaleur', label: 'Vue d\'ensemble' },
  { path: '/pompe-a-chaleur/residentiel', label: 'PAC résidentiel' },
  { path: '/pompe-a-chaleur/tertiaire', label: 'PAC tertiaire' },
];

const DESTRAT_CHILDREN = [
  { path: '/destratification', label: 'Vue d\'ensemble' },
  { path: '/destratification/tertiaire', label: 'Déstratification tertiaire' },
  { path: '/destratification/industriel', label: 'Déstratification industriel' },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const location = useLocation();
  const { isBannerVisible } = useBanner();
  const dropdownRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleDropdownEnter = (path) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(path);
  };

  const handleDropdownLeave = (event) => {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && dropdownRef.current && dropdownRef.current.contains(relatedTarget)) {
      return;
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 300);
  };

  const { user } = useAuth();
  const isClient = user;

  const leadFormNavHref = buildLeadFormHref({ source: 'nav', cta: 'header', page: location.pathname });

  const navLinks = [
    { path: '/', label: 'Accueil' },
    {
      path: '/pompe-a-chaleur',
      label: 'Pompe à chaleur',
      hasDropdown: true,
      icon: Flame,
      children: PAC_CHILDREN,
    },
    {
      path: '/destratification',
      label: 'Déstratification',
      hasDropdown: true,
      icon: Wind,
      children: DESTRAT_CHILDREN,
    },
    { path: '/equilibrage-hydraulique', label: 'Équilibrage', icon: Droplets },
    { path: '/blog', label: 'Blog' },
    { path: '/a-propos', label: 'À propos' },
    { path: '/contact', label: 'Analyser mon bâtiment', to: leadFormNavHref },
  ];

  const isLinkActive = (link) => {
    if (location.pathname === link.path) return true;
    if (link.children) {
      return link.children.some((c) => location.pathname === c.path || location.pathname.startsWith(`${c.path}/`));
    }
    return false;
  };

  return (
    <header className={`bg-gray-800 text-white shadow-lg ${isBannerVisible ? 'with-banner' : 'no-banner'}`}>
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-2 md:gap-3 lg:gap-4">
          <Logo size="md" className="flex-shrink-0" />

          <nav className="hidden lg:flex items-center justify-center flex-1 max-w-4xl mx-4">
            <div className="flex items-center space-x-0.5 xl:space-x-1 flex-wrap justify-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = isLinkActive(link);
                const isDropdownOpen = openDropdown === link.path;

                if (link.hasDropdown && link.children) {
                  const DropdownIcon = link.icon;
                  return (
                    <div
                      key={link.path}
                      className="relative group"
                      ref={openDropdown === link.path ? dropdownRef : null}
                      onMouseEnter={() => handleDropdownEnter(link.path)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <Link
                        to={link.path}
                        className={`px-2.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'text-[var(--secondary-500)] bg-gray-700'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {DropdownIcon && <DropdownIcon className="h-3.5 w-3.5" />}
                        {link.label}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </Link>
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] min-w-[220px]"
                            onMouseEnter={() => {
                              if (closeTimeoutRef.current) {
                                clearTimeout(closeTimeoutRef.current);
                                closeTimeoutRef.current = null;
                              }
                            }}
                            onMouseLeave={handleDropdownLeave}
                          >
                            {link.children.map((child) => {
                              const isChildActive = location.pathname === child.path;
                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  className={`block px-4 py-2 text-sm transition-colors ${
                                    isChildActive
                                      ? 'text-[var(--secondary-500)] bg-gray-50 font-semibold'
                                      : 'text-gray-700 hover:text-[var(--secondary-500)] hover:bg-gray-50'
                                  }`}
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-2.5 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-[var(--secondary-500)] bg-gray-700'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 flex-shrink-0">
            <a
              href="tel:+33978455063"
              onClick={() =>
                trackPhoneClick({
                  effinor_source: inferEffinorSourceFromPath(location.pathname),
                  effinor_cta_location: 'header',
                })
              }
              className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="09 78 45 50 63"
            >
              <Phone className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap tabular-nums">09 78 45 50 63</span>
            </a>

            {isClient ? (
              <Link
                to="/espace-client/dashboard"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors font-semibold text-xs md:text-sm whitespace-nowrap"
              >
                <User className="h-4 w-4 md:h-4 md:w-4" />
                <span className="hidden xl:inline">Espace client</span>
              </Link>
            ) : (
              <Link
                to="/espace-client/login"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors font-semibold text-xs md:text-sm whitespace-nowrap"
              >
                <User className="h-4 w-4 md:h-4 md:w-4" />
                <span className="hidden xl:inline">Espace client</span>
              </Link>
            )}

            <button
              className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Ouvrir le menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-gray-800 border-t border-gray-700"
          >
            <nav className="container mx-auto px-3 md:px-4 py-3 md:py-4">
              <div className="flex flex-col space-y-1 mb-4">
                {navLinks.map((link) => {
                  const isActive = isLinkActive(link);
                  const isMobileDropdownOpen = openMobileDropdown === link.path;

                  return (
                    <div key={link.path}>
                      {link.hasDropdown && link.children ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setOpenMobileDropdown(openMobileDropdown === link.path ? null : link.path)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                              isActive
                                ? 'text-[var(--secondary-500)] bg-gray-700'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'
                            }`}
                          >
                            <span>{link.label}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {isMobileDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-4 mt-1 space-y-1 overflow-hidden"
                              >
                                {link.children.map((child) => {
                                  const isChildActive = location.pathname === child.path;
                                  return (
                                    <Link
                                      key={child.path}
                                      to={child.path}
                                      onClick={() => {
                                        setIsMenuOpen(false);
                                        setOpenMobileDropdown(null);
                                      }}
                                      className={`block text-sm px-3 py-2 rounded-md transition-colors ${
                                        isChildActive
                                          ? 'text-[var(--secondary-500)] bg-gray-700 font-semibold'
                                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                      }`}
                                    >
                                      {child.label}
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={link.to ?? link.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? 'text-[var(--secondary-500)] bg-gray-700'
                              : 'text-gray-300 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {link.label}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-700 pt-3 space-y-2">
                {isClient ? (
                  <Link
                    to="/espace-client/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors font-semibold text-sm"
                  >
                    <User className="h-4 w-4" />
                    <span>Espace client</span>
                  </Link>
                ) : (
                  <Link
                    to="/espace-client/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors font-semibold text-sm"
                  >
                    <User className="h-4 w-4" />
                    <span>Espace client</span>
                  </Link>
                )}

                <a
                  href="tel:+33978455063"
                  onClick={() => {
                    setIsMenuOpen(false);
                    trackPhoneClick({
                      effinor_source: inferEffinorSourceFromPath(location.pathname),
                      effinor_cta_location: 'header_mobile',
                    });
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-sm"
                >
                  <Phone className="h-4 w-4" />
                  <span>09 78 45 50 63</span>
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
