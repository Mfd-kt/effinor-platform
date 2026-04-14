import React from 'react';
import { Helmet } from 'react-helmet';
import { getSiteUrl, DEFAULT_OG_IMAGE } from '@/lib/siteUrl';

/**
 * Composant pour injecter les meta tags SEO dans le <head>
 * Utilise react-helmet pour gérer les meta tags
 */
const SEOHead = ({
  metaTitle,
  metaDescription,
  ogImage,
  isIndexable = true,
  canonicalUrl,
  h1,
  intro
}) => {
  // Valeurs par défaut
  const title = metaTitle || 'Effinor - Expert en efficacité énergétique pour professionnels | Économies jusqu\'à 80%';
  const description = metaDescription || 'Effinor propose des solutions complètes d\'efficacité énergétique : éclairage LED, ventilation, chauffage, refroidissement, bornes de recharge. Réduisez vos factures jusqu\'à 80%, ROI < 2 ans.';
  const image = ogImage || DEFAULT_OG_IMAGE;
  const siteUrl = getSiteUrl();
  // Canonical: par défaut, on retire les query params (UTM) et le hash pour éviter le duplicate content
  const canonical =
    canonicalUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : siteUrl);

  return (
    <Helmet>
      {/* Langue du site */}
      <html lang="fr" />
      <meta httpEquiv="content-language" content="fr" />
      
      {/* Meta tags de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Robots meta */}
      {!isIndexable && (
        <meta name="robots" content="noindex, nofollow" />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="Effinor" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
};

export default SEOHead;

