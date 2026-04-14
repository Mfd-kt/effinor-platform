import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Building2, Filter, Search, ArrowRight, Phone } from 'lucide-react';
import { PageContainer } from '@/components/ds/PageContainer';
import { RealisationCard } from '@/components/realisations/RealisationCard';
import { CTASection } from '@/components/ds/CTASection';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPublicRealisations } from '@/lib/api/realisations';
import { trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { getAbsoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/siteUrl';
import { buildLeadFormHrefForPage } from '@/lib/leadFormDestination';
const SEO_TITLE = 'Réalisations Effinor | Projets PAC, déstratification & efficacité énergétique';
const SEO_DESCRIPTION =
  'Études de cas et chantiers réalisés : pompes à chaleur, déstratification et optimisation énergétique pour bâtiments professionnels. Résultats concrets, accompagnement CEE.';

function matchesSearch(item, q) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  const hay = `${item.title || ''} ${item.excerpt || ''} ${item.city || ''} ${item.sector || ''} ${item.category || ''}`.toLowerCase();
  return hay.includes(s);
}

const Realisations = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('cat') || 'all';
  const activeSector = searchParams.get('sector') || 'all';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPublicRealisations();
      if (result.success) {
        const data = result.data || [];
        setItems(data);
        setCategories([...new Set(data.map((p) => p.category).filter(Boolean))].sort());
        setSectors([...new Set(data.map((p) => p.sector).filter(Boolean))].sort());
      } else {
        setError(result.error || 'Erreur de chargement');
        setItems([]);
      }
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (activeCategory !== 'all' && (r.category || '') !== activeCategory) return false;
      if (activeSector !== 'all' && (r.sector || '') !== activeSector) return false;
      return matchesSearch(r, search);
    });
  }, [items, activeCategory, activeSector, search]);

  const hasFilters =
    activeCategory !== 'all' || activeSector !== 'all' || search.trim().length > 0;

  const setCategory = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'all') next.delete('cat');
    else next.set('cat', cat);
    setSearchParams(next);
  };

  const setSector = (sec) => {
    const next = new URLSearchParams(searchParams);
    if (sec === 'all') next.delete('sector');
    else next.set('sector', sec);
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearch('');
    setSearchParams({});
  };

  const canonicalUrl = useMemo(() => {
    const path = location.pathname || '/realisations';
    const q = location.search || '';
    return getAbsoluteUrl(`${path}${q}`);
  }, [location.pathname, location.search]);

  const formRealisationsSeo = useMemo(
    () => buildLeadFormHrefForPage(location.pathname || '/realisations', { cta: 'seo_block' }),
    [location.pathname],
  );
  const formRealisationsBottom = useMemo(
    () => buildLeadFormHrefForPage(location.pathname || '/realisations', { cta: 'realisations_bottom' }),
    [location.pathname],
  );

  return (
    <>
      <Helmet>
        <title>{SEO_TITLE}</title>
        <meta name="description" content={SEO_DESCRIPTION} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Effinor" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content={SEO_TITLE} />
        <meta property="og:description" content={SEO_DESCRIPTION} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO_TITLE} />
        <meta name="twitter:description" content={SEO_DESCRIPTION} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="w-full bg-primary-900 bg-dark-section pt-32 pb-14">
          <PageContainer maxWidth="hero">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <span className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary-200">
                <Building2 className="h-4 w-4" /> Réalisations terrain
              </span>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-200">
                Vrais projets, vrais résultats
              </p>
              <h1 className="heading-page mb-4 text-4xl sm:text-5xl md:text-6xl">
                Des projets concrets, mesurables
              </h1>
              <p className="text-body mx-auto max-w-2xl text-lg">
                PAC, déstratification, équilibrage hydraulique et dimension CEE : des chantiers sur entrepôts, ateliers,
                bureaux et sites retail — avec un œil sur le confort, les coûts et la défendabilité du dossier.
              </p>
            </motion.div>
          </PageContainer>
        </div>

        <PageContainer maxWidth="site" className="py-8 md:py-12">
          {/* Filtres */}
          <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Filter className="h-4 w-4 text-gray-500" />
              Affiner la liste
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher (titre, ville, secteur…)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  aria-label="Recherche dans les réalisations"
                />
              </div>
              {categories.length > 0 && (
                <Select value={activeCategory} onValueChange={setCategory}>
                  <SelectTrigger aria-label="Filtrer par catégorie">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {sectors.length > 0 && (
                <Select value={activeSector} onValueChange={setSector}>
                  <SelectTrigger aria-label="Filtrer par secteur">
                    <SelectValue placeholder="Secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les secteurs</SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-xs font-medium text-primary-600 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              <strong className="text-gray-800">Catégorie</strong> regroupe le type de prestation ou de solution mise en
              œuvre ; <strong className="text-gray-800">secteur</strong> le type de site (industrie, entrepôt, tertiaire,
              etc.). Combinez recherche et filtres pour isoler des cas proches de votre bâtiment.
            </p>
          </div>

          <div className="mb-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
            <p className="text-sm font-semibold text-gray-900">Données réelles, sites réels, impact lisible</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Les fiches présentées s’appuient sur des projets menés avec nos méthodes : pas de marketing flou — des
              périmètres, des équipements et, lorsque pertinent, une dimension{' '}
              <Link to="/cee" className="font-medium text-primary-700 hover:underline">
                CEE
              </Link>{' '}
              explicitement cadrée.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Pour aller plus loin :{' '}
              <Link to="/pompe-a-chaleur" className="font-medium text-primary-700 hover:underline">
                pompe à chaleur
              </Link>
              ,{' '}
              <Link to="/destratification" className="font-medium text-primary-700 hover:underline">
                déstratification
              </Link>
              ,{' '}
              <Link to="/equilibrage-hydraulique" className="font-medium text-primary-700 hover:underline">
                équilibrage hydraulique
              </Link>
              ,{' '}
              <Link to="/cee" className="font-medium text-primary-700 hover:underline">
                CEE
              </Link>
              ,{' '}
              <Link to={formRealisationsSeo} className="font-medium text-primary-700 hover:underline">
                contact
              </Link>
              .
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary-600" />
              <p className="text-sm text-gray-500">Chargement des réalisations…</p>
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <p className="mb-2 text-lg font-semibold text-gray-700">Impossible de charger les réalisations</p>
              <p className="mb-6 text-sm text-gray-400">{error}</p>
              <button
                type="button"
                onClick={fetchList}
                className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Réessayer
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-500/10">
                <Building2 className="h-7 w-7 text-secondary-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                {hasFilters ? 'Aucun résultat pour ces critères' : 'Les études de cas arrivent'}
              </h2>
              <p className="mx-auto mb-6 max-w-md text-gray-600">
                {hasFilters
                  ? 'Modifiez la recherche ou les filtres pour voir d’autres projets.'
                  : 'Publiez vos premières réalisations dans Airtable (statut Published + Slug renseigné) pour les afficher ici.'}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-primary-600 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-gray-500">
                {filtered.length} réalisation{filtered.length > 1 ? 's' : ''}
                {activeCategory !== 'all' ? ` · ${activeCategory}` : ''}
                {activeSector !== 'all' ? ` · ${activeSector}` : ''}
              </p>
              <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((r, i) => (
                  <motion.div
                    key={r.id || r.slug}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.24) }}
                  >
                    <RealisationCard realisation={r} />
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto mb-12 max-w-3xl rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm md:p-10"
            >
              <h2 className="heading-section mb-3 text-gray-900">Chaque bâtiment est unique</h2>
              <p className="text-body leading-relaxed text-gray-600">
                Les résultats dépendent du volume, des usages et de l’existant. Chaque projet fait l’objet
                d’une étude et d’un dimensionnement adaptés — les fiches ci-dessus illustrent notre méthode
                terrain.
              </p>
            </motion.div>
          )}

          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto max-w-effinorReadable"
            >
              <CTASection
                variant="darkGradient"
                className="rounded-2xl shadow-xl"
                maxWidth="none"
                innerClassName="!py-10 md:!py-12"
                title="Voir ce que nous pouvons faire pour votre bâtiment"
                description="Parlez-nous de votre site : faisabilité, ordre de grandeur, ordre des leviers et pistes CEE lorsque le cadre s’y prête — réponse sous 24 h ouvrées en règle générale."
                footer={
                  <>
                    ✔ Sites industriels & tertiaires &nbsp;·&nbsp; ✔ Étude personnalisée &nbsp;·&nbsp; ✔ Sans
                    engagement
                  </>
                }
              >
                <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
                  <EffinorButton
                    to={formRealisationsBottom}
                    variant="onDarkSolid"
                    size="md"
                    className="rounded-xl"
                    onClick={() =>
                      trackCtaStudy({
                        effinor_source: 'realisations',
                        effinor_cta_location: 'realisations_bottom',
                      })
                    }
                  >
                    Demander une étude gratuite
                    <ArrowRight className="h-4 w-4" />
                  </EffinorButton>
                  <EffinorButton
                    href="tel:+33978455063"
                    variant="inverse"
                    size="md"
                    className="rounded-xl"
                    onClick={() =>
                      trackCtaCallback({
                        effinor_source: 'realisations',
                        effinor_cta_location: 'realisations_bottom',
                      })
                    }
                  >
                    <Phone className="h-4 w-4" />
                    09 78 45 50 63
                  </EffinorButton>
                </div>
              </CTASection>
            </motion.div>
          )}
        </PageContainer>
      </div>
    </>
  );
};

export default Realisations;
