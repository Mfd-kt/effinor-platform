import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, ArrowLeft, Home, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { getPublicPostBySlug } from '@/lib/api/posts';
import { getRelatedPosts }     from '@/lib/blogAirtable';
import BlogContentRenderer     from '@/components/blog/BlogContentRenderer';
import BlogCTA                 from '@/components/blog/BlogCTA';
import BlogFAQ                 from '@/components/blog/BlogFAQ';
import { PageContainer }       from '@/components/ds/PageContainer';
import BlogImage                from '@/components/blog/BlogImage';
import {
  BLOG_COVER_FALLBACK_PATH,
  getAbsoluteBlogImageUrl,
  getBestBlogImageUrl,
  getBlogImageAlt,
} from '@/lib/blogImages';
import { getSiteUrl } from '@/lib/siteUrl';
import { buildLeadFormHref, inferProjectFromBlogCategory } from '@/lib/leadFormDestination';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (s) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

/**
 * Liens internes vers les pages services, indexés par catégorie d'article.
 * Permet un maillage interne ciblé selon le sujet traité.
 */
const SERVICE_LINKS = {
  PAC: [
    { label: "Pompe à chaleur — vue d\u2019ensemble",   href: '/pompe-a-chaleur' },
    { label: "PAC pour bâtiments tertiaires",            href: '/pompe-a-chaleur/tertiaire' },
    { label: "PAC résidentiel collectif",                href: '/pompe-a-chaleur/residentiel' },
  ],
  "Déstratification": [
    { label: "Déstratification — vue d\u2019ensemble",  href: '/destratification' },
    { label: "Déstratification industrielle",            href: '/destratification/industriel' },
    { label: "Déstratification tertiaire",               href: '/destratification/tertiaire' },
  ],
  "Équilibrage": [
    { label: "Équilibrage hydraulique",                 href: '/equilibrage-hydraulique' },
    { label: "Services & accompagnement",                href: '/services-accompagnement' },
  ],
  CEE: [
    { label: "Financement & dispositifs CEE",           href: '/cee' },
    { label: "Services & accompagnement",                href: '/services-accompagnement' },
  ],
};

const DEFAULT_SERVICE_LINKS = [
  { label: "Nos solutions",                             href: '/services-accompagnement' },
  { label: "Pompe à chaleur",                           href: '/pompe-a-chaleur' },
  { label: "Déstratification",                         href: '/destratification' },
  { label: "Équilibrage hydraulique",                  href: '/equilibrage-hydraulique' },
];

const CATEGORY_COLORS = {
  PAC:              'bg-blue-100 text-blue-800',
  Déstratification: 'bg-green-100 text-green-800',
  Équilibrage:      'bg-orange-100 text-orange-800',
  CEE:              'bg-purple-100 text-purple-800',
  Général:          'bg-gray-100 text-gray-700',
};

// ─── Component ───────────────────────────────────────────────────────────────

const BlogPost = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [post,         setPost]         = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!slug) { setError('Slug manquant'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    setPost(null);
    setRelatedPosts([]);

    getPublicPostBySlug(slug)
      .then((res) => {
        if (res.success && res.data) {
          setPost(res.data);
          getRelatedPosts(res.data.slug, res.data.category, 3)
            .then(setRelatedPosts)
            .catch(() => {});
        } else {
          setError(res.error || 'Article non trouvé');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const formStudyBlog = useMemo(() => {
    if (!post) {
      return buildLeadFormHref({
        source: 'blog',
        project: 'blog',
        cta: 'article_inline',
        page: location.pathname,
        slug: slug || '',
      });
    }
    return buildLeadFormHref({
      source: 'blog',
      project: inferProjectFromBlogCategory(post.category),
      cta: 'article_inline',
      page: location.pathname,
      slug: slug || post.slug,
      category: post.category || '',
    });
  }, [post, location.pathname, slug]);

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading) return (
    <>
      <Helmet><title>Chargement… | Blog Effinor</title></Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Chargement de l&apos;article…</p>
        </div>
      </div>
    </>
  );

  /* ── 404 ──────────────────────────────────────────────────────────── */
  if (error || !post) return (
    <>
      <Helmet>
        <title>Article introuvable | Blog Effinor</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-4 block">📄</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Article introuvable</h1>
          <p className="text-gray-500 mb-8">
            {error === 'Article non trouvé'
              ? 'Cet article n\'existe pas ou n\'est plus disponible.'
              : error}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/blog" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Retour au blog
            </Link>
            <Link to="/" className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Accueil
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Métadonnées SEO ─────────────────────────────────────────────── */
  const seoTitle     = post.seo_title || post.title;
  const seoDesc      = post.seo_description || post.excerpt || '';
  const base = getSiteUrl();
  const canonicalUrl = `${base}/blog/${post.slug}`;
  const ogImage =
    getAbsoluteBlogImageUrl(
      getBestBlogImageUrl(post.coverImage, 'og') || BLOG_COVER_FALLBACK_PATH,
      base,
    ) || `${base}${BLOG_COVER_FALLBACK_PATH}`;
  const ogImageAlt =
    post.coverImage?.alt ||
    getBlogImageAlt({ title: post.title, category: post.category });
  const ogImageWidth  = post.coverImage?.width || 1200;
  const ogImageHeight = post.coverImage?.height || 630;

  const jsonLdArticle = {
    '@context':    'https://schema.org',
    '@type':       'BlogPosting',
    headline:      post.title,
    description:   seoDesc,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    articleSection: post.category || 'Blog',
    keywords:      post.keywords?.join(', ') || '',
    author: post.author
      ? { '@type': 'Person', name: post.author }
      : { '@type': 'Organization', name: 'Effinor', url: base },
    image:     ogImage,
    url:       canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    publisher: {
      '@type': 'Organization',
      name:    'Effinor',
      url:     base,
      logo:    { '@type': 'ImageObject', url: `${base}/favicon.svg` },
    },
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: base },
      { '@type': 'ListItem', position: 2, name: 'Blog',    item: `${base}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  const serviceLinks = SERVICE_LINKS[post.category] || DEFAULT_SERVICE_LINKS;
  const categoryColor = CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-700';

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <>
      <Helmet>
        <title>{seoTitle} | Blog Effinor</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={canonicalUrl} />
        {post.keywords?.length > 0 && (
          <meta name="keywords" content={post.keywords.join(', ')} />
        )}
        {/* Open Graph */}
        <meta property="og:type"        content="article" />
        <meta property="og:site_name"   content="Effinor" />
        <meta property="og:locale"      content="fr_FR" />
        <meta property="og:title"       content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url"         content={canonicalUrl} />
        <meta property="og:image"       content={ogImage} />
        <meta property="og:image:alt"   content={ogImageAlt} />
        <meta property="og:image:width" content={String(ogImageWidth)} />
        <meta property="og:image:height" content={String(ogImageHeight)} />
        {post.published_at && (
          <meta property="article:published_time" content={post.published_at} />
        )}
        {post.category && (
          <meta property="article:section" content={post.category} />
        )}
        {/* Twitter Card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image"       content={ogImage} />
        <meta name="twitter:image:alt"   content={ogImageAlt} />
        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLdArticle)}</script>
        <script type="application/ld+json">{JSON.stringify(jsonLdBreadcrumb)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="w-full bg-primary-900 bg-dark-section pb-8 pt-24 md:pt-28">
          <PageContainer maxWidth="hero">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Breadcrumb */}
              <nav aria-label="Fil d'ariane" className="mb-4 flex items-center gap-1.5 text-xs text-white/60">
                <Link to="/"     className="hover:text-white transition-colors flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" /> Accueil
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-white/80 truncate max-w-[220px]">{post.title}</span>
              </nav>

              {post.category && (
                <span className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}>
                  {post.category}
                </span>
              )}

              <h1 className="heading-page mb-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl">
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70 sm:gap-4">
                {post.published_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                {post.reading_time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {post.reading_time} min de lecture
                  </span>
                )}
                {post.author && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {post.author}
                  </span>
                )}
              </div>
            </motion.div>
          </PageContainer>
        </div>

        {/* ── Corps ──────────────────────────────────────────────────── */}
        <PageContainer maxWidth="site" className="py-6 md:py-8">
          <div className="mx-auto max-w-effinorReadable">

            {/* Image de couverture (toujours un bloc stable — Airtable ou fallback) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative mb-6 aspect-video min-h-[12rem] w-full max-h-[28rem] overflow-hidden rounded-2xl bg-gray-100 shadow-md md:mb-7 md:aspect-[16/10] md:min-h-[14rem]"
            >
              <BlogImage
                coverImage={post.coverImage}
                title={post.title}
                category={post.category}
                variant="hero"
                imgClassName="absolute inset-0 h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, min(896px, 92vw)"
              />
            </motion.div>

            {/* Extrait */}
            {post.excerpt && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-5 border-l-4 border-primary-400 pl-4 text-base italic leading-relaxed text-gray-600 md:text-lg"
              >
                {post.excerpt}
              </motion.p>
            )}

            {/* Contenu Markdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-7 lg:p-8"
            >
              <BlogContentRenderer content={post.content} />
            </motion.div>

            {/* ── Liens internes services ────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-6 rounded-2xl border border-primary-100 bg-primary-50 p-5 md:p-6"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-600">
                Nos solutions liées
              </p>
              <div className="flex flex-wrap gap-2">
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 bg-white border border-primary-200 rounded-lg px-3.5 py-2 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-200"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
                <Link
                  to={formStudyBlog}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 border border-primary-600 rounded-lg px-3.5 py-2 hover:bg-primary-700 transition-all duration-200"
                >
                  Demander une étude gratuite
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>

            {/* FAQ */}
            {post.faq?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <BlogFAQ items={post.faq} />
              </motion.div>
            )}

            {/* CTA conversion */}
            <BlogCTA cta={post.cta} category={post.category} slug={slug || post.slug} />

            {/* Retour au blog */}
            <div className="mt-6 flex justify-center">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au blog
              </Link>
            </div>
          </div>

          {/* ── Articles liés ────────────────────────────────────────── */}
          {relatedPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-10 max-w-5xl border-t border-gray-200 pt-8"
              aria-label="Articles liés"
            >
              <h2 className="heading-section mb-4">
                Articles similaires
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {relatedPosts.map((related) => {
                  const color = CATEGORY_COLORS[related.category] || 'bg-gray-100 text-gray-700';
                  return (
                    <Link
                      key={related.slug}
                      to={`/blog/${related.slug}`}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-300 flex flex-col"
                    >
                      <div className="relative h-40 overflow-hidden bg-gray-100">
                        <BlogImage
                          coverImage={related.coverImage}
                          title={related.title}
                          category={related.category}
                          variant="related"
                          imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        {related.category && (
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 self-start ${color}`}>
                            {related.category}
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                        {related.excerpt && (
                          <p className="text-xs text-gray-500 line-clamp-2 flex-1">
                            {related.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-4 text-xs font-medium text-primary-600">
                          Lire l'article <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          )}
        </PageContainer>
      </div>
    </>
  );
};

export default BlogPost;
