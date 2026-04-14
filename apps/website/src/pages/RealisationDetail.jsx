import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Home,
  Loader2,
  MapPin,
  Building2,
  Ruler,
  Tag,
} from 'lucide-react';
import { getPublicRealisationBySlug } from '@/lib/api/realisations';
import { getRelatedRealisations } from '@/lib/realisationsAirtable';
import BlogContentRenderer from '@/components/blog/BlogContentRenderer';
import BlogImage from '@/components/blog/BlogImage';
import { PageContainer } from '@/components/ds/PageContainer';
import { RealisationGallery } from '@/components/realisations/RealisationGallery';
import { RealisationKeyFigures } from '@/components/realisations/RealisationKeyFigures';
import { RealisationCTA } from '@/components/realisations/RealisationCTA';
import { RealisationCard } from '@/components/realisations/RealisationCard';
import {
  BLOG_COVER_FALLBACK_PATH,
  getAbsoluteBlogImageUrl,
  getBestBlogImageUrl,
  getBlogImageAlt,
} from '@/lib/blogImages';
import { getSiteUrl } from '@/lib/siteUrl';

const formatDate = (s) =>
  s
    ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

const MetaChip = ({ icon: Icon, children }) =>
  children ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
      {Icon ? <Icon className="h-3.5 w-3.5 text-primary-600" /> : null}
      {children}
    </span>
  ) : null;

const SectionBlock = ({ title, children }) =>
  children ? (
    <section className="my-8 md:my-10">
      <h2 className="heading-subsection mb-3 text-gray-900">{title}</h2>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
        <div className="prose prose-gray max-w-none text-gray-700 prose-p:leading-relaxed prose-p:my-3 first:prose-p:mt-0 last:prose-p:mb-0">
          {typeof children === 'string' ? (
            <p className="whitespace-pre-line leading-relaxed">{children}</p>
          ) : (
            children
          )}
        </div>
      </div>
    </section>
  ) : null;

const RealisationDetail = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setError('Slug manquant');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setItem(null);
    setRelated([]);

    getPublicRealisationBySlug(slug)
      .then((res) => {
        if (res.success && res.data) {
          setItem(res.data);
          getRelatedRealisations(res.data.slug, res.data.category, 3)
            .then(setRelated)
            .catch(() => {});
        } else {
          setError(res.error || 'Réalisation non trouvée');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Chargement… | Réalisations Effinor</title>
        </Helmet>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary-600" />
            <p className="text-sm text-gray-500">Chargement de la réalisation…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <Helmet>
          <title>Réalisation introuvable | Effinor</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md text-center">
            <span className="mb-4 block text-5xl" aria-hidden>
              📋
            </span>
            <h1 className="mb-3 text-2xl font-bold text-gray-900">Réalisation introuvable</h1>
            <p className="mb-8 text-gray-500">
              {error === 'Réalisation non trouvée'
                ? 'Ce projet n’existe pas ou n’est plus publié.'
                : error}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/realisations"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux réalisations
              </Link>
              <Link
                to="/"
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Accueil
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const base = getSiteUrl();
  const seoTitle = item.seo_title || item.title;
  const seoDesc = item.seo_description || item.excerpt || '';
  const canonicalUrl = `${base}/realisations/${item.slug}`;
  const ogImage =
    getAbsoluteBlogImageUrl(
      getBestBlogImageUrl(item.coverImage, 'og') || BLOG_COVER_FALLBACK_PATH,
      base,
    ) || `${base}${BLOG_COVER_FALLBACK_PATH}`;
  const ogImageAlt =
    item.coverImage?.alt || getBlogImageAlt({ title: item.title, category: item.category });
  const ogImageWidth = item.coverImage?.width || 1200;
  const ogImageHeight = item.coverImage?.height || 630;

  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: seoDesc,
    datePublished: item.published_at || undefined,
    dateModified: item.published_at || undefined,
    articleSection: item.category || 'Réalisations',
    keywords: item.keywords?.join(', ') || '',
    image: ogImage,
    url: canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: { '@type': 'Organization', name: 'Effinor', url: base },
    publisher: {
      '@type': 'Organization',
      name: 'Effinor',
      url: base,
      logo: { '@type': 'ImageObject', url: `${base}/favicon.svg` },
    },
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: base },
      { '@type': 'ListItem', position: 2, name: 'Réalisations', item: `${base}/realisations` },
      { '@type': 'ListItem', position: 3, name: item.title, item: canonicalUrl },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle} | Réalisations Effinor</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={canonicalUrl} />
        {item.keywords?.length > 0 && <meta name="keywords" content={item.keywords.join(', ')} />}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Effinor" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={ogImageAlt} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        {item.published_at && (
          <meta property="article:published_time" content={item.published_at} />
        )}
        {item.category && <meta property="article:section" content={item.category} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={ogImageAlt} />
        <script type="application/ld+json">{JSON.stringify(jsonLdArticle)}</script>
        <script type="application/ld+json">{JSON.stringify(jsonLdBreadcrumb)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="w-full bg-primary-900 bg-dark-section pb-8 pt-24 md:pt-28">
          <PageContainer maxWidth="hero">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/60">
                <Link to="/" className="flex items-center gap-1 transition-colors hover:text-white">
                  <Home className="h-3.5 w-3.5" /> Accueil
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <Link to="/realisations" className="transition-colors hover:text-white">
                  Réalisations
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[min(100%,220px)] truncate text-white/80">{item.title}</span>
              </nav>

              {item.category ? (
                <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {item.category}
                </span>
              ) : null}

              <h1 className="heading-page mb-4 max-w-4xl text-3xl sm:text-4xl md:text-5xl">{item.title}</h1>

              {item.excerpt ? (
                <p className="max-w-3xl text-base leading-relaxed text-white/85 md:text-lg">{item.excerpt}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <MetaChip icon={Calendar}>
                  {item.published_at ? formatDate(item.published_at) : null}
                </MetaChip>
                <MetaChip icon={Building2}>{item.sector}</MetaChip>
                <MetaChip icon={Tag}>{item.client_type}</MetaChip>
                <MetaChip icon={MapPin}>{item.city}</MetaChip>
                <MetaChip icon={Ruler}>{item.surface ? `${item.surface}` : null}</MetaChip>
              </div>
            </motion.div>
          </PageContainer>
        </div>

        <PageContainer maxWidth="site" className="py-6 md:py-8">
          <div className="mx-auto max-w-effinorReadable">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="relative mb-6 aspect-video min-h-[12rem] w-full max-h-[28rem] overflow-hidden rounded-2xl bg-gray-100 shadow-md md:mb-7 md:aspect-[16/10] md:min-h-[14rem]"
            >
              <BlogImage
                coverImage={item.coverImage}
                title={item.title}
                category={item.category}
                variant="hero"
                imgClassName="absolute inset-0 h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, min(896px, 92vw)"
              />
            </motion.div>

            <SectionBlock title="Le besoin">{item.problem}</SectionBlock>
            <SectionBlock title="La solution mise en place">{item.solution}</SectionBlock>
            <SectionBlock title="Les résultats">{item.results}</SectionBlock>

            {item.content ? (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="my-8 md:my-10"
              >
                <h2 className="heading-subsection mb-3 text-gray-900">Retour d’expérience</h2>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7 lg:p-8">
                  <BlogContentRenderer content={item.content} />
                </div>
              </motion.section>
            ) : null}

            <RealisationKeyFigures figures={item.key_figures} />

            <RealisationGallery
              images={item.galleryImages}
              title={item.title}
              category={item.category}
            />

            <RealisationCTA cta={item.cta} category={item.category} sector={item.sector} slug={item.slug} />

            <div className="mt-8 flex justify-center">
              <Link
                to="/realisations"
                className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-primary-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux réalisations
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-10 max-w-5xl border-t border-gray-200 pt-8"
              aria-label="Réalisations liées"
            >
              <h2 className="heading-section mb-4">Réalisations à découvrir</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <RealisationCard key={r.slug} realisation={r} />
                ))}
              </div>
            </motion.section>
          )}
        </PageContainer>
      </div>
    </>
  );
};

export default RealisationDetail;
