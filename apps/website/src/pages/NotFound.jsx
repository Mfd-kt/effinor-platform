import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { PageContainer } from '@/components/ds/PageContainer';
import { buildLeadFormHref } from '@/lib/leadFormDestination';

const NOT_FOUND_FORM_HREF = buildLeadFormHref({
  source: '404',
  project: 'home',
  cta: 'not_found',
  page: '/404',
});

/**
 * 404 SPA : noindex pour éviter l’indexation de contenus « vides » ;
 * liens de retour pour le maillage et la récupération utilisateur.
 */
const NotFound = () => (
  <>
    <Helmet>
      <title>Page introuvable | Effinor</title>
      <meta
        name="description"
        content="La page demandée n’existe pas ou a été déplacée. Retrouvez nos offres PAC, déstratification, équilibrage hydraulique et le blog Effinor."
      />
      <meta name="robots" content="noindex, follow" />
    </Helmet>
    <div className="min-h-[55vh] bg-gray-50 py-16 md:py-20">
      <PageContainer maxWidth="site">
        <p className="text-sm font-medium text-primary-600 mb-2">Erreur 404</p>
        <h1 className="heading-page text-3xl md:text-4xl text-gray-900 mb-4">Page introuvable</h1>
        <p className="text-gray-600 max-w-xl mb-8 leading-relaxed">
          L’adresse n’est pas valide ou la page n’existe plus. Utilisez les liens ci-dessous pour poursuivre votre visite.
        </p>
        <ul className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--secondary-500)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--secondary-600)] transition-colors"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
          <Link
            to="/pompe-a-chaleur"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Pompe à chaleur
          </Link>
          <Link
            to="/destratification"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Déstratification
          </Link>
          <Link
            to={NOT_FOUND_FORM_HREF}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Contact / étude gratuite
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Blog
          </Link>
        </ul>
      </PageContainer>
    </div>
  </>
);

export default NotFound;
