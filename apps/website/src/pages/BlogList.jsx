import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { getPublicPosts } from '@/lib/api/posts';
import BlogCard from '@/components/blog/BlogCard';
import { PageContainer } from '@/components/ds/PageContainer';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { getAbsoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/siteUrl';
import { trackCtaStudy } from '@/lib/effinorAnalytics';
import { buildLeadFormHrefForPage } from '@/lib/leadFormDestination';

const POSTS_PER_PAGE = 9;

const BlogList = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage    = parseInt(searchParams.get('page') || '1', 10);
  const activeCategory = searchParams.get('cat') || 'all';

  const [allPosts,    setAllPosts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPublicPosts({ page: 1, limit: 200 });
      if (result.success) {
        setAllPosts(result.data || []);
        const cats = [...new Set((result.data || []).map((p) => p.category).filter(Boolean))].sort();
        setCategories(cats);
      } else {
        setError(result.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = activeCategory === 'all'
    ? allPosts
    : allPosts.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase());

  const total      = filtered.length;
  const totalPages = Math.ceil(total / POSTS_PER_PAGE);
  const from       = (currentPage - 1) * POSTS_PER_PAGE;
  const posts      = filtered.slice(from, from + POSTS_PER_PAGE);

  const setCategory = (cat) => setSearchParams(cat === 'all' ? {} : { cat });
  const goPage      = (p)   => setSearchParams(activeCategory === 'all' ? { page: p } : { cat: activeCategory, page: p });

  const canonicalPath = useMemo(() => {
    const path = location.pathname || '/blog';
    const q = location.search || '';
    return `${path}${q}`;
  }, [location.pathname, location.search]);

  const canonicalBlog = getAbsoluteUrl(canonicalPath);

  const formBlogIntro = useMemo(
    () => buildLeadFormHrefForPage(location.pathname, { cta: 'blog_intro' }),
    [location.pathname],
  );
  const formContactNav = useMemo(
    () => buildLeadFormHrefForPage(location.pathname, { cta: 'inline' }),
    [location.pathname],
  );

  return (
    <>
      <Helmet>
        <title>Blog Effinor | PAC, Déstratification, Équilibrage & CEE</title>
        <meta
          name="description"
          content="Guides, conseils et actualités sur la pompe à chaleur, la déstratification d'air, l'équilibrage hydraulique et les certificats CEE pour les bâtiments professionnels."
        />
        <link rel="canonical" href={canonicalBlog} />
        <meta property="og:title"       content="Blog Effinor | PAC, déstratification, équilibrage & CEE" />
        <meta property="og:description" content="Guides et actualités sur l'efficacité énergétique des bâtiments professionnels et le financement CEE." />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content={canonicalBlog} />
        <meta property="og:image"       content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Effinor" />
        <meta name="twitter:description" content="Guides et actualités sur l'efficacité énergétique des bâtiments." />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="w-full bg-primary-900 bg-dark-section pt-32 pb-14">
          <PageContainer maxWidth="hero">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <span className="inline-flex items-center gap-2 text-primary-200 text-sm font-medium mb-4">
                <BookOpen className="h-4 w-4" /> Blog Effinor
              </span>
              <h1 className="heading-page text-4xl sm:text-5xl md:text-6xl mb-4">
                Ressources & guides
              </h1>
              <p className="text-body text-lg max-w-2xl mx-auto">
                Conseils terrain sur la pompe à chaleur, la déstratification, l&apos;équilibrage hydraulique et le financement CEE.
              </p>
            </motion.div>
          </PageContainer>
        </div>

        <div className="border-b border-gray-200 bg-white">
          <PageContainer maxWidth="site" className="py-8 md:py-10">
            <p className="mb-4 max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base">
              Articles et guides sur l’<strong>efficacité énergétique</strong> des bâtiments professionnels :{' '}
              <strong>pompes à chaleur</strong>, <strong>déstratification</strong> d’air,{' '}
              <strong>équilibrage hydraulique</strong> des réseaux, et <strong>certificats CEE</strong> lorsque le
              financement entre en jeu. L’objectif : des décisions terrain et comité plus solides — pas du jargon gratuit.
            </p>
            <p className="mb-6 text-sm italic text-gray-500">
              Ok, ça me concerne : je cherche à prioriser des leviers (air, générateur, réseau, dossier) sans me tromper
              d’ordre.
            </p>
            <nav className="mb-8 flex flex-wrap gap-2" aria-label="Offres Effinor">
              {[
                { to: '/pompe-a-chaleur', label: 'PAC' },
                { to: '/destratification', label: 'Déstratification' },
                { to: '/equilibrage-hydraulique', label: 'Équilibrage hydraulique' },
                { to: '/cee', label: 'CEE' },
                { to: '/services-accompagnement', label: 'Accompagnement projet' },
                { to: formContactNav, label: 'Contact' },
              ].map((l) => (
                <Link
                  key={l.label === 'Contact' ? 'contact-form' : l.to}
                  to={l.to}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-primary-600 hover:bg-white md:text-sm"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <section aria-labelledby="blog-guides-heading" className="rounded-2xl border border-gray-100 bg-slate-50/80 p-5 md:p-6">
              <h2 id="blog-guides-heading" className="heading-section mb-3 text-gray-900">
                Commencez par ces guides
              </h2>
              <p className="mb-4 text-sm text-gray-600">
                Avant de creuser les articles : les pages métiers donnent le cadre — ordre des travaux, éligibilité,
                risques — puis le blog affine les cas.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { to: '/pompe-a-chaleur', t: 'Pompe à chaleur (résidentiel & tertiaire)', d: 'Scénarios, contraintes, lecture CEE.' },
                  { to: '/destratification', t: 'Déstratification', d: 'Grands volumes, confort, complément PAC.' },
                  { to: '/equilibrage-hydraulique', t: 'Équilibrage hydraulique', d: 'Réseaux collectifs mal répartis.' },
                ].map((g) => (
                  <li key={g.to} className="rounded-xl border border-white bg-white p-4 shadow-sm">
                    <Link to={g.to} className="font-semibold text-primary-900 hover:underline">
                      {g.t}
                    </Link>
                    <p className="mt-1 text-xs text-gray-600">{g.d}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  Un cas précis ? Envoyez votre contexte : analyse ou rappel, sans engagement.
                </p>
                <EffinorButton
                  to={formBlogIntro}
                  variant="primary"
                  size="md"
                  className="rounded-lg"
                  onClick={() =>
                    trackCtaStudy({ effinor_source: 'blog_list', effinor_cta_location: 'blog_intro' })
                  }
                >
                  Demander une étude
                  <ArrowRight className="h-4 w-4" />
                </EffinorButton>
              </div>
            </section>
          </PageContainer>
        </div>

        {/* ── Filtres catégories ─────────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
            <PageContainer maxWidth="site" className="py-2 sm:py-3 flex items-center gap-2 overflow-x-auto">
              {['all', ...categories].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 rounded-full px-4 text-sm font-medium transition-colors min-h-[44px] inline-flex items-center sm:min-h-0 sm:py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 ${
                    activeCategory === cat
                      ? 'bg-primary-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'Tous les articles' : cat}
                </button>
              ))}
            </PageContainer>
          </div>
        )}

        {/* ── Contenu ────────────────────────────────────────────────── */}
        <PageContainer maxWidth="site" className="py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
              <p className="text-gray-500">Chargement des articles…</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-lg font-semibold text-gray-700 mb-2">Impossible de charger les articles</p>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <button
                onClick={fetchPosts}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24">
              <span className="text-6xl mb-4 block">📝</span>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {activeCategory === 'all' ? 'Aucun article disponible' : `Aucun article dans « ${activeCategory} »`}
              </h2>
              <p className="text-gray-500">Les prochains articles arrivent bientôt.</p>
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setCategory('all')}
                  className="mt-6 px-5 py-2 bg-primary-600 text-white rounded-xl text-sm hover:bg-primary-700 transition-colors"
                >
                  Voir tous les articles
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-8">
                {total} article{total > 1 ? 's' : ''}{activeCategory !== 'all' ? ` · ${activeCategory}` : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {posts.map((post, i) => (
                  <BlogCard key={post.id || post.slug} post={post} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === currentPage
                          ? 'bg-primary-900 text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </PageContainer>
      </div>
    </>
  );
};

export default BlogList;
