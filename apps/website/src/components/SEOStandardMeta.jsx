import React from 'react';
import { Helmet } from 'react-helmet';
import { getAbsoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/siteUrl';

/**
 * Meta SEO complètes : canonical, Open Graph, Twitter.
 * À utiliser sur les pages marketing (offres, hubs, home) pour éviter les oublis.
 */
const SEOStandardMeta = ({
  title,
  description,
  /** Chemin seul (recommandé) ex: `/pompe-a-chaleur` — sans domaine */
  pathname,
  keywords,
  ogImage,
  ogType = 'website',
  noindex = false,
  twitterImageAlt,
  children,
}) => {
  const canonical = pathname != null ? getAbsoluteUrl(pathname) : getAbsoluteUrl('/');
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}

      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Effinor" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {twitterImageAlt ? <meta name="twitter:image:alt" content={twitterImageAlt} /> : null}

      {children}
    </Helmet>
  );
};

export default SEOStandardMeta;
