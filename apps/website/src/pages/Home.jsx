import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import SEOStandardMeta from '@/components/SEOStandardMeta';
import { getAbsoluteUrl } from '@/lib/siteUrl';
import { motion } from 'framer-motion';
import {
  Droplets,
  ArrowRight,
  Flame,
  Wind,
  CheckCircle2,
  Building2,
  Phone,
  ClipboardList,
  FileText,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import MiniEstimationForm from '@/components/MiniEstimationForm';
import { EffinorButton } from '@/components/ds/EffinorButton';
import { PageContainer } from '@/components/ds/PageContainer';
import { CTASection } from '@/components/ds/CTASection';
import HomeTrustSection from '@/components/home/HomeTrustSection';
import HomeRealisationsPreview from '@/components/home/HomeRealisationsPreview';
import { ServiceProcessSteps } from '@/components/ds/ServiceProcessSteps';
import { getPublicRealisations } from '@/lib/api/realisations';
import { trackCtaStudy, trackPhoneClick } from '@/lib/effinorAnalytics';
import { buildLeadFormHref } from '@/lib/leadFormDestination';

const FORM = {
  hero: () => buildLeadFormHref({ source: 'home', project: 'home', cta: 'hero', page: '/' }),
  concerned: () => buildLeadFormHref({ source: 'home', project: 'home', cta: 'concerned', page: '/' }),
  solution: (project) => buildLeadFormHref({ source: 'home', project, cta: 'solution', page: '/' }),
  process: () => buildLeadFormHref({ source: 'home', project: 'home', cta: 'process', page: '/' }),
  final: () => buildLeadFormHref({ source: 'home', project: 'home', cta: 'final', page: '/' }),
  body: () => buildLeadFormHref({ source: 'home', project: 'home', cta: 'body_link', page: '/' }),
  example: () => buildLeadFormHref({ source: 'home', project: 'home', cta: 'example', page: '/' }),
};

const Home = () => {
  const [homeRealisations, setHomeRealisations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPublicRealisations()
      .then((res) => {
        if (cancelled || !res.success || !res.data?.length) return;
        setHomeRealisations(res.data.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const solutionBlocks = [
    {
      id: 'pac',
      title: 'Pompe à chaleur',
      line: 'Remplacez une production de chaleur coûteuse par une solution dimensionnée sur votre usage réel.',
      benefit: 'Moins de gaspillage sur le poste chauffage lorsque le scénario tient la route techniquement.',
      to: '/pompe-a-chaleur',
      project: 'pompe-a-chaleur',
      icon: Flame,
      color: 'orange',
    },
    {
      id: 'destrat',
      title: 'Déstratification',
      line: 'Dans les grands volumes, la chaleur monte : on homogénise l’air pour le confort au sol.',
      benefit: 'Souvent moins de surconsommation pour « tenir » la température en bas.',
      to: '/destratification',
      project: 'destratification',
      icon: Wind,
      color: 'teal',
    },
    {
      id: 'equil',
      title: 'Équilibrage hydraulique',
      line: 'Répartir correctement la chaleur sur un réseau collectif déséquilibré.',
      benefit: 'Moins de zones surchauffées / sous-dimensionnées et des réglages tenables.',
      to: '/equilibrage-hydraulique',
      project: 'equilibrage-hydraulique',
      icon: Droplets,
      color: 'blue',
    },
  ];

  const concernedSymptoms = [
    'Factures énergétiques en hausse sans explication claire côté exploitation',
    'Zones trop chaudes en hauteur, trop froides au poste de travail',
    'Travaux récents ou changement d’équipement… sans gain de confort mesurable',
    'Bâtiments au-delà de 500 m² ou halls à grande hauteur libre',
    'Plaintes récurrentes des occupants sur le confort thermique',
  ];

  const whyEffinor = [
    { t: 'Lecture technique, pas discours commercial', d: 'Nous partons des données bâtiment, réseau et usage avant de parler matériel.' },
    { t: 'Analyse globale', d: 'Production, distribution, air : l’ordre des leviers compte autant que le catalogue.' },
    { t: 'Optimisation au cas par cas', d: 'Pas de « standard unique » : chaque site a des contraintes terrain et comité.' },
    { t: 'CEE cadrés', d: 'Quand le dispositif s’applique, nous alignons projet et fiche — sans promesse hors cadre réglementaire.' },
  ];

  const trustCeeItems = [
    {
      icon: FileText,
      title: 'CEE : une aide possible, pas un droit automatique',
      text: 'Une partie des travaux peut être financée selon éligibilité, période et preuves. Nous structurons le dossier pour limiter les rejets et les zones d’ombre.',
    },
    {
      icon: ClipboardList,
      title: 'Transparence sur les conditions',
      text: 'Montants, délais et acteurs dépendent du dispositif : nous le disons tôt pour des arbitrages sérieux en comité.',
    },
    {
      icon: Building2,
      title: 'Aller plus loin',
      text: (
        <>
          Détails sur le mécanisme et nos garde-fous :{' '}
          <Link to="/cee" className="font-semibold text-[var(--secondary-700)] underline hover:opacity-90">
            page CEE
          </Link>
          .
        </>
      ),
    },
  ];

  const homeProcessSteps = [
    {
      icon: Building2,
      title: 'Analyse du bâtiment',
      text: 'Contexte, usages, réseau, contraintes d’exploitation — pour cadrer un périmètre réaliste.',
    },
    {
      icon: FileText,
      title: 'Étude technique',
      text: 'Scénarios comparables, hypothèses explicites, risques nommés — avant engagement.',
    },
    {
      icon: Wrench,
      title: 'Mise en œuvre des solutions',
      text: 'Coordination des étapes, traçabilité chantier et alignement avec le dossier lorsque CEE il y a.',
    },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const homeTitle = 'Effinor | Chauffage B2B : PAC, déstratification, équilibrage hydraulique & CEE';
  const homeDescription =
    'Réduisez la facture et le confort dans vos bâtiments professionnels : analyse technique, pompe à chaleur, déstratification, équilibrage hydraulique, financement CEE selon éligibilité. Étude gratuite.';
  const homeKeywords =
    "pompe à chaleur, déstratification, équilibrage hydraulique, CEE, chauffage collectif, optimisation énergétique, tertiaire, industriel, effinor, étude gratuite";

  const orgJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Effinor',
      url: getAbsoluteUrl('/'),
      logo: getAbsoluteUrl('/favicon.svg'),
      description: homeDescription,
    }),
    [],
  );

  const webSiteJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Effinor',
      url: getAbsoluteUrl('/'),
      publisher: { '@type': 'Organization', name: 'Effinor', url: getAbsoluteUrl('/') },
    }),
    [],
  );

  return (
    <>
      <SEOStandardMeta
        title={homeTitle}
        description={homeDescription}
        pathname="/"
        keywords={homeKeywords}
      />
      <Helmet>
        <style>{`:root { --secondary-500-rgb: 16, 185, 129; }`}</style>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(webSiteJsonLd)}</script>
      </Helmet>

      {/* ── HERO ── */}
      <section className="hero-section bg-dark-section z-0">
        <PageContainer maxWidth="site" className="py-8 md:py-12 lg:py-16 overflow-x-hidden max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-6xl xl:max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center relative z-10">
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <h1 className="heading-hero mb-3 md:mb-4 lg:mb-5">
                Votre bâtiment consomme trop d&apos;énergie
                <span className="text-[var(--secondary-400)]"> — voici comment agir concrètement</span>
              </h1>
              <p className="mb-4 max-w-xl text-base font-semibold text-white/95 md:text-lg border-l-4 border-[var(--secondary-500)] pl-3 text-left">
                Vous payez probablement pour une énergie mal utilisée.
              </p>
              <p className="text-sm md:text-base lg:text-lg text-white/85 mb-4 md:mb-5 max-w-xl leading-relaxed">
                Nous analysons la réalité technique de votre site (bâtiment, réseau, usage), proposons des leviers
                mesurables —{' '}
                <Link to="/pompe-a-chaleur" className="underline hover:text-white font-medium text-white/95">
                  pompe à chaleur
                </Link>
                ,{' '}
                <Link to="/destratification" className="underline hover:text-white font-medium text-white/95">
                  déstratification
                </Link>
                ,{' '}
                <Link to="/equilibrage-hydraulique" className="underline hover:text-white font-medium text-white/95">
                  équilibrage hydraulique
                </Link>{' '}
                — et le financement{' '}
                <Link to="/cee" className="underline hover:text-white font-medium text-white/95">
                  CEE
                </Link>{' '}
                lorsque votre opération entre dans le cadre : pas de montant « garanti » sans hypothèses.
              </p>
              <p className="mb-4 text-xs text-white/60 max-w-xl">
                Urgence : chaque mois sans cadrage, vous payez une facture qui pourrait être mieux orientée — et le
                comité manque d’éléments pour trancher.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-4 md:mb-5">
                <EffinorButton
                  to={FORM.hero()}
                  variant="primary"
                  size="responsive"
                  onClick={() => trackCtaStudy({ effinor_source: 'home', effinor_cta_location: 'hero_text' })}
                >
                  Analyser mon bâtiment gratuitement
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </EffinorButton>
                <EffinorButton
                  href="tel:+33978455063"
                  variant="secondary"
                  size="responsive"
                  onClick={() => trackPhoneClick({ effinor_source: 'home', effinor_cta_location: 'hero_text' })}
                >
                  <Phone className="h-4 w-4 md:h-5 md:w-5" />
                  09 78 45 50 63
                </EffinorButton>
              </div>
              <ul className="mb-4 flex flex-col gap-2 text-left text-sm text-white/90 max-w-xl">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                  <span>Étude technique réelle — pas un devis générique</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                  <span>Réponse sous 24 h ouvrées en règle générale après réception des éléments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                  <span>Sans engagement : vous décidez après lecture de notre retour</span>
                </li>
              </ul>
              <p className="text-[11px] md:text-xs text-white/50 max-w-xl leading-relaxed">
                Nous refusons les promesses hors cadre réglementaire ou hors cohérence technique : l’objectif est un
                arbitrage défendable pour les décideurs et l’exploitation.
              </p>
            </motion.div>
            <MiniEstimationForm />
          </div>
        </PageContainer>
      </section>

      {/* ── Votre bâtiment est-il concerné ? ── */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="border-y border-gray-100 bg-white py-8 md:py-12"
        aria-labelledby="home-concerned-heading"
      >
        <div className="container mx-auto max-w-5xl px-3 md:px-4">
          <h2 id="home-concerned-heading" className="text-xl font-bold text-gray-900 md:text-2xl mb-5 text-center">
            Votre bâtiment est-il concerné ?
          </h2>
          <ul className="max-w-3xl mx-auto space-y-2.5 mb-6">
            {concernedSymptoms.map((s) => (
              <li key={s} className="flex gap-2 text-sm md:text-base text-gray-700">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-gray-600 max-w-2xl mx-auto mb-6">
            Si vous reconnaissez ces signaux, il y a souvent une marge d’optimisation — technique et économique — à
            structurer avant d’investir au hasard.
          </p>
          <div className="flex justify-center">
            <EffinorButton
              to={FORM.concerned()}
              variant="primary"
              size="md"
              className="rounded-lg"
              onClick={() => trackCtaStudy({ effinor_source: 'home', effinor_cta_location: 'home_concerned' })}
            >
              Faire un point sur mon cas
              <ArrowRight className="h-4 w-4" />
            </EffinorButton>
          </div>
        </div>
      </motion.section>

      {/* ── 3 solutions ── */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="py-8 md:py-12 lg:py-16 bg-gray-50"
        aria-labelledby="home-solutions-heading"
      >
        <div className="container mx-auto px-3 md:px-4 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center mb-8 md:mb-10">
            <h2 id="home-solutions-heading" className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Trois leviers pour maîtriser la facture et le confort
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Chaque site est différent : la bonne combinaison dépend du bâtiment et du réseau — pas d’un catalogue
              unique.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {solutionBlocks.map((b) => {
              const Icon = b.icon;
              const ring =
                b.color === 'orange'
                  ? 'border-orange-200 bg-orange-50/50'
                  : b.color === 'teal'
                    ? 'border-teal-200 bg-teal-50/50'
                    : 'border-blue-200 bg-blue-50/50';
              return (
                <div
                  key={b.id}
                  className={`flex flex-col rounded-xl border ${ring} bg-white p-5 md:p-6 shadow-sm`}
                >
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon className="h-6 w-6 text-gray-800" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-700 mb-2">{b.line}</p>
                  <p className="text-xs text-gray-600 mb-4 flex-1">{b.benefit}</p>
                  <Link
                    to={b.to}
                    className="text-sm font-semibold text-[var(--secondary-600)] hover:underline mb-3 inline-flex items-center gap-1"
                  >
                    Voir la fiche métier
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <EffinorButton
                    to={FORM.solution(b.project)}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center border-gray-200"
                    onClick={() =>
                      trackCtaStudy({
                        effinor_source: 'home',
                        effinor_cta_location: 'home_solution_block',
                        effinor_form_project: b.project,
                      })
                    }
                  >
                    Demander une analyse ({b.title.split(' ')[0]}…)
                  </EffinorButton>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── Ce qui se passe vraiment ── */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-8 md:py-12 bg-white border-y border-gray-100"
        aria-labelledby="home-reality-heading"
      >
        <div className="container mx-auto max-w-3xl px-3 md:px-4 text-center">
          <h2 id="home-reality-heading" className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            Dans beaucoup de bâtiments, ce qui se passe
          </h2>
          <ul className="text-left space-y-3 text-sm md:text-base text-gray-700 mb-6 max-w-2xl mx-auto">
            <li className="flex gap-2">
              <span className="text-[var(--secondary-600)] font-bold">·</span>
              La chaleur <strong>stagne en hauteur</strong> (stratification) pendant que le sol reste mal tenable.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--secondary-600)] font-bold">·</span>
              L&apos;énergie est <strong>mal répartie</strong> sur le réseau : certains locaux sont surchauffés, d&apos;autres froids.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--secondary-600)] font-bold">·</span>
              Les <strong>systèmes compensent</strong> en surconsommant — sans traiter la cause.
            </li>
          </ul>
          <p className="text-base font-semibold text-gray-900">
            Vous payez en grande partie pour une énergie mal utilisée.
          </p>
        </div>
      </motion.section>

      {/* ── Exemple terrain ── */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-8 md:py-10 bg-gray-50 border-y border-gray-100"
        aria-labelledby="home-example-heading"
      >
        <div className="container mx-auto max-w-3xl px-3 md:px-4">
          <h2 id="home-example-heading" className="text-lg font-bold text-gray-900 md:text-xl mb-3">
            Cas fréquent en entrepôt / grande hauteur libre
          </h2>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-5">
            <strong className="text-gray-900">Situation :</strong> halle logistique &gt; 8 m, chauffage en marche, mais
            inconfort au sol et facture élevée. <strong className="text-gray-900">Ce qui se joue :</strong> stratification
            de l&apos;air, réseau souvent mal réparti, production qui compense sans traiter la cause. Les arbitrages
            passent par une lecture ordonnée — souvent{' '}
            <Link to="/destratification" className="font-semibold text-[var(--secondary-700)] hover:underline">
              déstratification
            </Link>
            , réglage hydraulique, puis selon le contexte{' '}
            <Link to="/pompe-a-chaleur" className="font-semibold text-[var(--secondary-700)] hover:underline">
              renouvellement de la production
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <EffinorButton
              to={FORM.example()}
              variant="primary"
              size="md"
              className="rounded-lg"
              onClick={() => trackCtaStudy({ effinor_source: 'home', effinor_cta_location: 'home_example_block' })}
            >
              Faire analyser mon cas
              <ArrowRight className="h-4 w-4" />
            </EffinorButton>
            <EffinorButton to="/realisations" variant="outline" size="md" className="rounded-lg border-gray-200">
              Voir des réalisations
            </EffinorButton>
          </div>
        </div>
      </motion.section>

      {/* ── Pourquoi Effinor ── */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="py-8 md:py-12 lg:py-16 bg-gray-50"
        aria-labelledby="home-why-heading"
      >
        <div className="container mx-auto px-3 md:px-4 max-w-5xl">
          <h2 id="home-why-heading" className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
            Pourquoi Effinor
          </h2>
          <p className="text-sm md:text-base text-gray-600 text-center max-w-2xl mx-auto mb-8">
            Un positionnement assumé pour les <strong>bailleurs, dirigeants, directions techniques et exploitants</strong>{' '}
            qui doivent trancher avec des éléments solides.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
            {whyEffinor.map((row) => (
              <div key={row.t} className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1.5">{row.t}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{row.d}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Comment ça marche (3 étapes) ── */}
      <div className="container mx-auto max-w-7xl px-3 md:px-4 py-4 md:py-8">
        <ServiceProcessSteps
          columns={3}
          title="Comment ça se passe, en pratique"
          subtitle="Un parcours court pour les équipes terrain et la direction générale."
          steps={homeProcessSteps}
        />
        <div className="mt-6 flex justify-center">
          <EffinorButton
            to={FORM.process()}
            variant="primary"
            size="md"
            className="rounded-lg"
            onClick={() => trackCtaStudy({ effinor_source: 'home', effinor_cta_location: 'home_process' })}
          >
            Lancer l&apos;analyse
            <ArrowRight className="h-4 w-4" />
          </EffinorButton>
        </div>
      </div>

      {/* ── Réalisations ── */}
      <HomeRealisationsPreview
        title="Des résultats concrets sur des bâtiments similaires au vôtre"
        subtitle="Études de cas terrain : périmètres réels, solutions posées, démarche lisible — pas du marketing flou."
        realisations={homeRealisations}
        formCtaHref={buildLeadFormHref({ source: 'home', project: 'home', cta: 'realisations', page: '/' })}
      />

      {/* ── CEE — bloc confiance ── */}
      <HomeTrustSection
        title="CEE : financer une partie du projet — si le dossier est propre"
        subtitle="Les certificats d’économies d’énergie peuvent réduire le reste à charge lorsque l’opération correspond à une fiche en vigueur et que les preuves sont réunies. Pas de garantie de montant sans analyse."
        items={trustCeeItems}
      />

      {/* ── Maillage ── */}
      <section
        className="border-t border-gray-100 bg-white py-10 md:py-12"
        aria-labelledby="home-next-steps-heading"
      >
        <div className="container mx-auto max-w-5xl px-3 md:px-4">
          <h2
            id="home-next-steps-heading"
            className="mb-3 text-center text-xl font-bold text-gray-900 md:text-2xl"
          >
            Guides, réalisations, contact
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-gray-600 md:text-base">
            Poursuivez la lecture ou passez à une{' '}
            <Link to={FORM.body()} className="font-medium text-[var(--secondary-600)] hover:underline">
              étude gratuite
            </Link>
            .
          </p>
          <nav className="flex flex-wrap justify-center gap-2 md:gap-3" aria-label="Liens utiles">
            <Link
              to="/blog"
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-[var(--secondary-500)] hover:bg-white"
            >
              Blog
            </Link>
            <Link
              to="/realisations"
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-[var(--secondary-500)] hover:bg-white"
            >
              Réalisations
            </Link>
            <Link
              to="/cee"
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-[var(--secondary-500)] hover:bg-white"
            >
              CEE
            </Link>
            <Link
              to="/ressources"
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-[var(--secondary-500)] hover:bg-white"
            >
              Ressources
            </Link>
            <Link
              to="/services-accompagnement"
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-[var(--secondary-500)] hover:bg-white"
            >
              Accompagnement
            </Link>
            <Link
              to={FORM.body()}
              className="inline-flex items-center rounded-full border border-[var(--secondary-500)] bg-secondary-50 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-secondary-100"
            >
              Formulaire d&apos;analyse
            </Link>
          </nav>
        </div>
      </section>

      {/* ── CTA final ── */}
      <CTASection
        variant="darkGradient"
        className="rounded-none"
        innerClassName="!py-10 md:!py-12"
        title="Analysons votre bâtiment en 30 secondes"
        description={
          <>
            Décrivez votre contexte : nous revenons avec une lecture honnête — faisabilité, risques, ordre des leviers et
            pistes CEE lorsque le cadre s’y prête.{' '}
            <strong className="font-semibold text-white">Sans engagement</strong>, réponse rapide, étude réelle.
          </>
        }
        footer="✔ Pas de promesse hors cadre · ✔ Réponse structurée · ✔ B2B & bâtiments professionnels"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full">
          <EffinorButton
            to={FORM.final()}
            variant="primary"
            size="responsive"
            onClick={() => trackCtaStudy({ effinor_source: 'home', effinor_cta_location: 'home_final_cta' })}
          >
            Analyser mon bâtiment gratuitement
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </EffinorButton>
          <EffinorButton
            href="tel:+33978455063"
            variant="inverse"
            size="responsive"
            onClick={() => trackPhoneClick({ effinor_source: 'home', effinor_cta_location: 'home_final_cta' })}
          >
            <Phone className="h-4 w-4 md:h-5 md:w-5" />
            09 78 45 50 63
          </EffinorButton>
        </div>
      </CTASection>
    </>
  );
};

export default Home;
