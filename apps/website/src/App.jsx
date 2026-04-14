import React, { useEffect, Suspense, lazy, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import ThankYou from '@/pages/ThankYou';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import LegalNotice from '@/pages/LegalNotice';
import CGV from '@/pages/CGV';
import PolitiqueConfidentialite from '@/pages/PolitiqueConfidentialite';
import BlogList from '@/pages/BlogList';
import BlogPost from '@/pages/BlogPost';
import SecteursActivite from '@/pages/SecteursActivite';
import ServicesAccompagnement from '@/pages/ServicesAccompagnement';
import CategoryDetail from '@/pages/CategoryDetail';
import Realisations from '@/pages/Realisations';
import RealisationDetail from '@/pages/RealisationDetail';
import Ressources from '@/pages/Ressources';
import PacHub from '@/pages/pac/PacHub';
import PacResidentiel from '@/pages/pac/PacResidentiel';
import PacTertiaire from '@/pages/pac/PacTertiaire';
import DestratHub from '@/pages/destrat/DestratHub';
import DestratTertiaire from '@/pages/destrat/DestratTertiaire';
import DestratIndustriel from '@/pages/destrat/DestratIndustriel';
import CeeHub from '@/pages/CeeHub';
import EquilibrageHydraulique from '@/pages/EquilibrageHydraulique';
import Simulator from '@/pages/Simulator';
import EligibiliteRedirect from '@/pages/EligibiliteRedirect';
import NotFound from '@/pages/NotFound';
import { RedirectToLeadForm } from '@/components/RedirectToLeadForm';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLogin from '@/pages/admin/AdminLogin';
import ClientLogin from '@/pages/client/ClientLogin';
import RequireClient from '@/components/client/RequireClient';
import AuthCallback from '@/pages/AuthCallback';
import SignUp from '@/pages/SignUp';
import ResetPassword from '@/pages/ResetPassword';
import CookieConsent from '@/components/CookieConsent';
import { trackPageView } from '@/lib/visitorTracker';
import { trackOfferPageView } from '@/lib/effinorAnalytics';
import { useScrollTracking } from '@/hooks/useScrollTracking';
import RequireRole from '@/components/admin/RequireRole';
import RoleBasedRoute from '@/components/admin/RoleBasedRoute';
import RedirectWithParams from '@/components/admin/RedirectWithParams';
import TopNotificationBar from '@/components/TopNotificationBar';
import FloatingCallButton from '@/components/FloatingCallButton';
import { useBanner } from '@/contexts/BannerContext';
import LoginDirect from '@/pages/LoginDirect';
import ScrollToTop from '@/components/ScrollToTop';
import SkipToMain from '@/components/SkipToMain';
import { logger } from '@/utils/logger';
import { useLocation } from 'react-router-dom';
import '@/styles/global-design-system.css';

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUtilisateurs = lazy(() => import('@/pages/admin/AdminUtilisateurs'));
const DetailUtilisateur = lazy(() => import('@/pages/admin/DetailUtilisateur'));
const AdminUserForm = lazy(() => import('@/pages/admin/AdminUserForm'));
const AdminVisitors = lazy(() => import('@/pages/admin/AdminVisitors'));
const AdminLeads = lazy(() => import('@/pages/admin/AdminLeads'));
const DetailLead = lazy(() => import('@/pages/admin/DetailLead'));
const AdminBlogList = lazy(() => import('@/pages/admin/blog/BlogList'));
const BlogEdit = lazy(() => import('@/pages/admin/blog/BlogEdit'));
const PagesSEO = lazy(() => import('@/pages/admin/PagesSEO'));
const RealisationsList = lazy(() => import('@/pages/admin/RealisationsList'));
const RealisationEdit = lazy(() => import('@/pages/admin/RealisationEdit'));
const MediasList = lazy(() => import('@/pages/admin/MediasList'));
const ClientDashboard = lazy(() => import('@/pages/client/ClientDashboard'));
const MonCompte = lazy(() => import('@/pages/admin/MonCompte'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const CommercialDashboard = lazy(() => import('@/pages/admin/CommercialDashboard'));
const SettingsRolesPage = lazy(() => import('@/pages/admin/settings/SettingsRolesPage'));
const SettingsLeadStatusesPage = lazy(() => import('@/pages/admin/settings/SettingsLeadStatusesPage'));

const AdminPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Chargement...</p>
    </div>
  </div>
);

const TrackingWrapper = ({ children }) => {
  const location = useLocation();
  const lastOfferKey = useRef('');
  useScrollTracking();

  useEffect(() => {
    const timer = setTimeout(() => {
      trackPageView();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const path = location.pathname;
    let offer = '';
    let segment = 'hub';
    if (path.startsWith('/pompe-a-chaleur')) {
      offer = 'pac';
      if (path.includes('/residentiel')) segment = 'residentiel';
      else if (path.includes('/tertiaire')) segment = 'tertiaire';
    } else if (path.startsWith('/destratification')) {
      offer = 'destrat';
      if (path.includes('/tertiaire')) segment = 'tertiaire';
      else if (path.includes('/industriel')) segment = 'industriel';
    }

    if (!offer) {
      lastOfferKey.current = '';
      return;
    }

    const key = `${offer}|${segment}|${path}`;
    if (key === lastOfferKey.current) return;
    lastOfferKey.current = key;
    trackOfferPageView({ offer, segment, page: path });
  }, [location.pathname]);

  return <>{children}</>;
};

const MainLayout = ({ children }) => {
  const { isBannerVisible } = useBanner();

  return (
    <div className={isBannerVisible ? 'pt-[52px]' : ''}>
      <SkipToMain />
      <TopNotificationBar />
      <Header />
      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <FloatingCallButton />
    </div>
  );
};

const TechnicienDashboard = () => <Navigate to="/dashboard" replace />;
const CallcenterDashboard = () => <Navigate to="/dashboard" replace />;

const AuthRedirectHandler = () => {
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      return;
    }

    const hash = window.location.hash;
    const search = window.location.search;

    if (hash && hash.length > 1 && hash.includes('access_token')) {
      const callbackUrl = `/auth/callback${hash}${search}`;
      if (import.meta.env.DEV) {
        logger.log('🔀 Redirection vers AuthCallback:', callbackUrl);
      }
      window.location.replace(callbackUrl);
    }
  }, []);

  return null;
};

function App() {
  return (
    <>
      <ScrollToTop />
      <AuthRedirectHandler />
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/login-direct" element={<LoginDirect />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/espace-client/login" element={<ClientLogin />} />
        <Route
          path="/espace-client/dashboard"
          element={
            <RequireClient>
              <MainLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <ClientDashboard />
                </Suspense>
              </MainLayout>
            </RequireClient>
          }
        />

        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <RequireRole roles={['super_admin', 'admin', 'commercial', 'technicien', 'callcenter']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <RoleBasedRoute
                    adminComponent={<AdminDashboard />}
                    commercialComponent={<CommercialDashboard />}
                    technicienComponent={<TechnicienDashboard />}
                    callcenterComponent={<CallcenterDashboard />}
                  />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/leads"
          element={
            <RequireRole roles={['super_admin', 'admin', 'commercial']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminLeads />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/leads/:id"
          element={
            <RequireRole roles={['super_admin', 'admin', 'commercial']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <DetailLead />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/blog"
          element={
            <RequireRole roles={['super_admin', 'admin', 'manager', 'backoffice', 'commercial', 'technicien', 'callcenter']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminBlogList />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/blog/new"
          element={
            <RequireRole roles={['super_admin', 'admin', 'manager', 'backoffice']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <BlogEdit />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/blog/:postId"
          element={
            <RequireRole roles={['super_admin', 'admin', 'manager', 'backoffice', 'commercial', 'technicien', 'callcenter']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <BlogEdit />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/pages-seo"
          element={
            <RequireRole roles={['super_admin', 'admin', 'manager', 'backoffice']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <PagesSEO />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/realisations"
          element={
            <RequireRole roles={['super_admin', 'admin', 'manager', 'backoffice']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <RealisationsList />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/realisations/:id"
          element={
            <RequireRole roles={['super_admin', 'admin', 'manager', 'backoffice']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <RealisationEdit />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/admin/medias"
          element={
            <RequireRole roles={['super_admin', 'admin', 'manager', 'backoffice']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <MediasList />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/utilisateurs"
          element={
            <RequireRole roles={['super_admin', 'admin']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminUtilisateurs />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/utilisateurs/:id"
          element={
            <RequireRole roles={['super_admin', 'admin']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <DetailUtilisateur />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/utilisateurs/new"
          element={
            <RequireRole roles={['super_admin', 'admin']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminUserForm />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/paramètres/roles"
          element={
            <RequireRole roles={['super_admin', 'admin']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <SettingsRolesPage />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/paramètres/lead-statuses"
          element={
            <RequireRole roles={['super_admin', 'admin']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <SettingsLeadStatusesPage />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/visiteurs"
          element={
            <RequireRole roles={['super_admin', 'admin']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <AdminVisitors />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/mon-compte"
          element={
            <RequireRole roles={['super_admin', 'admin', 'commercial', 'technicien', 'callcenter']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <MonCompte />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route
          path="/notifications"
          element={
            <RequireRole roles={['super_admin', 'admin', 'commercial', 'technicien', 'callcenter']}>
              <AdminLayout>
                <Suspense fallback={<AdminPageLoader />}>
                  <NotificationsPage />
                </Suspense>
              </AdminLayout>
            </RequireRole>
          }
        />

        <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/commercial/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/technicien/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/callcenter/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/leads" element={<Navigate to="/leads" replace />} />
        <Route path="/commercial/leads" element={<Navigate to="/leads" replace />} />
        <Route path="/admin/leads/:id" element={<RedirectWithParams to="/leads/:id" />} />
        <Route path="/commercial/leads/:id" element={<RedirectWithParams to="/leads/:id" />} />
        <Route path="/admin/utilisateurs" element={<Navigate to="/utilisateurs" replace />} />
        <Route path="/admin/mon-compte" element={<Navigate to="/mon-compte" replace />} />
        <Route path="/commercial/mon-compte" element={<Navigate to="/mon-compte" replace />} />
        <Route path="/admin/notifications" element={<Navigate to="/notifications" replace />} />
        <Route path="/commercial/notifications" element={<Navigate to="/notifications" replace />} />
        <Route path="/admin/settings/roles" element={<Navigate to="/paramètres/roles" replace />} />
        <Route path="/admin/settings/lead-statuses" element={<Navigate to="/paramètres/lead-statuses" replace />} />
        <Route path="/admin/visitors" element={<Navigate to="/visiteurs" replace />} />

        {/* Anciennes routes e-commerce admin → dashboard (sauf /produits seul : redirection publique vers hub PAC) */}
        <Route path="/commandes" element={<Navigate to="/dashboard" replace />} />
        <Route path="/commandes/:id" element={<Navigate to="/dashboard" replace />} />
        <Route path="/produits/new" element={<Navigate to="/dashboard" replace />} />
        <Route path="/produits/:id/edit" element={<Navigate to="/dashboard" replace />} />
        <Route path="/produits/:productId/accessoires" element={<Navigate to="/dashboard" replace />} />
        <Route path="/categories" element={<Navigate to="/dashboard" replace />} />
        <Route path="/paramètres/order-statuses" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/orders" element={<Navigate to="/dashboard" replace />} />
        <Route path="/commercial/commandes" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/products" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/categories" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/settings/order-statuses" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/*"
          element={
            <TrackingWrapper>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />

                  {/* Nouvelle arborescence lead-gen CEE */}
                  <Route path="/pompe-a-chaleur" element={<PacHub />} />
                  <Route path="/pompe-a-chaleur/residentiel" element={<PacResidentiel />} />
                  <Route path="/pompe-a-chaleur/tertiaire" element={<PacTertiaire />} />
                  <Route path="/destratification" element={<DestratHub />} />
                  <Route path="/destratification/tertiaire" element={<DestratTertiaire />} />
                  <Route path="/destratification/industriel" element={<DestratIndustriel />} />
                  <Route path="/cee" element={<CeeHub />} />
                  <Route path="/equilibrage-hydraulique" element={<EquilibrageHydraulique />} />
                  <Route path="/simulateur" element={<Simulator />} />
                  <Route path="/eligibilite" element={<EligibiliteRedirect />} />
                  <Route path="/secteurs" element={<Navigate to="/secteurs-activite" replace />} />

                  <Route path="/formulaire-complet" element={<RedirectToLeadForm />} />
                  <Route path="/etude" element={<RedirectToLeadForm />} />
                  <Route path="/analyse" element={<RedirectToLeadForm />} />
                  <Route path="/merci" element={<ThankYou />} />
                  <Route path="/a-propos" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/mentions-legales" element={<LegalNotice />} />
                  <Route path="/cgv" element={<CGV />} />
                  <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                  <Route path="/blog" element={<BlogList />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/secteurs-activite" element={<SecteursActivite />} />
                  <Route path="/secteurs-activite/:slug" element={<CategoryDetail />} />
                  <Route path="/realisations" element={<Realisations />} />
                  <Route path="/realisations/:slug" element={<RealisationDetail />} />
                  <Route path="/services-accompagnement" element={<ServicesAccompagnement />} />
                  <Route path="/ressources" element={<Ressources />} />

                  {/* Redirections legacy (catalogue / luminaires / paiement) */}
                  <Route path="/landing/luminaires" element={<Navigate to="/" replace />} />
                  <Route path="/landing/deshumidificateur" element={<Navigate to="/destratification" replace />} />
                  <Route path="/boutique" element={<Navigate to="/pompe-a-chaleur" replace />} />
                  <Route path="/produits-solutions" element={<Navigate to="/pompe-a-chaleur" replace />} />
                  <Route path="/produits-solutions/:slug" element={<Navigate to="/pompe-a-chaleur" replace />} />
                  <Route path="/produit/:slug" element={<Navigate to="/pompe-a-chaleur" replace />} />
                  <Route path="/panier" element={<Navigate to="/" replace />} />
                  <Route path="/paiement/succes" element={<Navigate to="/" replace />} />
                  <Route path="/paiement/annulee" element={<Navigate to="/" replace />} />
                  <Route path="/solutions" element={<Navigate to="/pompe-a-chaleur" replace />} />
                  <Route path="/solutions/:slug" element={<Navigate to="/pompe-a-chaleur" replace />} />
                  <Route path="/produits" element={<Navigate to="/pompe-a-chaleur" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </TrackingWrapper>
          }
        />
      </Routes>
      <CookieConsent />
      <Toaster />
    </>
  );
}

export default App;
