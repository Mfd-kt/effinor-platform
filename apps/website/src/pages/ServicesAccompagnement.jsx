import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import { PageContainer } from '@/components/ds/PageContainer';
import { CTASection } from '@/components/ds/CTASection';
import { EffinorButton } from '@/components/ds/EffinorButton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import OfferRealisationsSection from '@/components/realisations/OfferRealisationsSection';
import {
  Search,
  Wrench,
  DollarSign,
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  Phone,
} from 'lucide-react';
import { trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { getAbsoluteUrl } from '@/lib/siteUrl';

const SEO_TITLE =
  'Accompagnement projet B2B efficacité énergétique : structurer, sécuriser, CEE | Effinor';
const SEO_DESCRIPTION =
  'Effinor n’est pas un installateur : nous structurons vos projets PAC, déstratification, équilibrage hydraulique et dossiers CEE — validation technique, arbitrage comité, exécution maîtrisée. Étude gratuite.';

const FAQ_ITEMS = [
  {
    q: 'En quoi l’accompagnement Effinor diffère-t-il d’un simple devis équipement ?',
    a: 'Nous cadrons le besoin (bâtiment, usage, réseau) avant de parler de matériel : objectif = arbitrage coût / confort / risque, avec des livrables compréhensibles par la direction et la technique.',
  },
  {
    q: 'Gérez-vous le dossier CEE jusqu’au bout ?',
    a: 'Nous préparons la cohérence projet / fiche et la liste des preuves attendues. Les acteurs habilités et le circuit financier dépendent du dispositif — nous réduisons les zones d’ombre côté contenu.',
  },
  {
    q: 'Travaillez-vous avec nos équipes internes ?',
    a: 'Oui : facility, maintenance, immobilier. Nous adaptons le rythme et les livrables à votre organisation.',
  },
  {
    q: 'Quel délai pour une première restitution ?',
    a: 'Après qualification, nous fixons les compléments nécessaires (visite, données). Le délai dépend de la taille du site et de la disponibilité terrain.',
  },
];

const services = [
  {
    icon: Search,
    title: 'Étude & arbitrage',
    description:
      'Cadrage du besoin réel : bâtiment, occupation, réseau, contraintes d’exploitation — pour choisir un scénario défendable en comité.',
    features: [
      'Collecte structurée des données',
      'Lecture de cohérence technique (PAC, déstrat, réseau)',
      'Préconisations avec hypothèses explicites',
    ],
  },
  {
    icon: Wrench,
    title: 'Mise en œuvre coordonnée',
    description:
      'Pilotage des étapes clés pour limiter l’impact sur l’activité et sécuriser la traçabilité chantier.',
    features: ['Coordination des intervenants', 'Phasage si nécessaire', 'Mise en service et contrôles'],
  },
  {
    icon: DollarSign,
    title: 'Financement & CEE',
    description:
      'Quand le projet entre dans le cadre, nous alignons équipement, fiche d’opération et preuves attendues.',
    features: [
      'Vérification d’éligibilité prudente',
      'Liste des pièces et preuves',
      'Suivi administratif dans la durée du dossier',
    ],
  },
  {
    icon: Settings,
    title: 'Performance dans le temps',
    description:
      'Après installation, l’objectif est une exploitation stable : réglages, retours d’expérience, points de vigilance.',
    features: [
      'Passage de consignes à l’exploitant',
      'Axes d’optimisation progressive',
      'Support sur les questions récurrentes',
    ],
  },
];

const ServicesAccompagnement = () => {
  const seo = usePageSEO('/services-accompagnement');
  const { pathname } = useLocation();
  const formHero = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'services_hero' }), [pathname]);
  const formCallback = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'callback' }), [pathname]);
  const formMid = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'services_mid' }), [pathname]);
  const formFooter = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'services_footer' }), [pathname]);
  const formNav = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'inline' }), [pathname]);

  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }),
    [],
  );

  const serviceJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Accompagnement projet efficacité énergétique B2B',
      description:
        'Étude, coordination de mise en œuvre et accompagnement dossier CEE pour projets chauffage et grands volumes.',
      provider: { '@type': 'Organization', name: 'Effinor', url: getAbsoluteUrl('/') },
      areaServed: { '@type': 'Country', name: 'France' },
    }),
    [],
  );

  const handleCtaStudy = () =>
    trackCtaStudy({ effinor_source: 'services', effinor_cta_location: 'services_cta_block' });
  const handleCtaCallback = () =>
    trackCtaCallback({ effinor_source: 'services', effinor_cta_location: 'services_cta_block' });

  return (
    <>
      <SEOHead
        metaTitle={SEO_TITLE}
        metaDescription={SEO_DESCRIPTION}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable !== false}
        h1="Accompagnement projet"
        intro={null}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        <header className="bg-dark-section border-b border-white/10">
          <PageContainer maxWidth="hero" className="py-12 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary-400)] mb-3">
              Méthode Effinor
            </p>
            <h1 className="heading-page text-3xl md:text-4xl lg:text-5xl mb-4 max-w-4xl text-white">
              Un seul fil conducteur : du besoin métier au dossier propre
            </h1>
            <p className="text-lg text-white/85 leading-relaxed max-w-3xl mb-6">
              PAC, déstratification, réseau hydraulique, CEE : nous structurons les projets pour que la technique et
              l’administratif avancent ensemble — sans promesses hors cadre.
            </p>
            <ul className="mb-8 max-w-2xl space-y-2 text-sm md:text-base text-white/90">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                <span>Interlocuteur unique du web au suivi</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                <span>Arbitrages orientés résultats pour décideurs et exploitants</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                <span>Étude gratuite pour cadrer faisabilité et prochaines étapes</span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <EffinorButton
                to={formHero}
                variant="primary"
                size="md"
                className="rounded-lg"
                onClick={handleCtaStudy}
              >
                Lancer une étude gratuite
                <ArrowRight className="h-5 w-5" />
              </EffinorButton>
              <EffinorButton
                to={formCallback}
                variant="inverse"
                size="md"
                className="rounded-lg border border-white/30 bg-white/10 hover:bg-white/15"
                onClick={handleCtaCallback}
              >
                <Phone className="h-4 w-4" />
                Être rappelé
              </EffinorButton>
            </div>
          </PageContainer>
        </header>

        <PageContainer maxWidth="site" className="space-y-14 py-14 md:py-16">
          <section id="ce-que-nous-faisons" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="heading-section mb-4 text-gray-900">Ce que nous faisons vraiment pour vous</h2>
            <p className="mb-6 max-w-3xl text-sm text-gray-600 md:text-base">
              Pas de catalogue matériel : un rôle de <strong>cadrage, validation et pilotage</strong> — pour éviter les
              arbitrages bancals entre direction, exploitation et financement.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  t: 'Validation technique',
                  d: 'Cohérence bâtiment / réseau / équipement — avant d’engager le gros investissement.',
                },
                {
                  t: 'Optimisation financière (CEE)',
                  d: 'Alignement projet ↔ fiche ↔ preuves lorsque le dispositif s’applique — voir aussi notre page ',
                  link: { to: '/cee', label: 'CEE' },
                },
                {
                  t: 'Structuration de projet',
                  d: 'Jalons, risques nommés, livrables compréhensibles par le comité et la maintenance.',
                },
                {
                  t: 'Contrôle de l’exécution',
                  d: 'Traçabilité chantier et passage de consignes — pour que le dossier tienne après installation.',
                },
              ].map((row) => (
                <li key={row.t} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="font-semibold text-gray-900">{row.t}</p>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                    {row.d}
                    {row.link ? (
                      <Link to={row.link.to} className="font-medium text-[var(--secondary-700)] hover:underline">
                        {row.link.label}
                      </Link>
                    ) : null}
                    {row.link ? '.' : null}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section id="sans-accompagnement" className="scroll-mt-24 rounded-2xl border border-red-100 bg-red-50/50 p-6 md:p-8">
            <h2 className="heading-section mb-3 text-gray-900">Sans accompagnement structuré : ce qui se casse</h2>
            <ul className="space-y-2 text-sm text-gray-800 md:text-base">
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  <strong>Mauvais dimensionnement</strong> ou mauvais ordre des leviers (réseau, air, générateur).
                </span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  <strong>Décisions sous pression</strong> fournisseur — puis arbitrage difficile en comité.
                </span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  <strong>CEE perdus ou retardés</strong> : dossier fragile, promesses hors cadre, preuves incomplètes.
                </span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  <strong>Projet « raté » côté exploitation</strong> : confort, image, coût — alors que la facture matériel
                  est déjà partie.
                </span>
              </li>
            </ul>
          </section>

          <section id="pour-qui">
            <h2 className="heading-section mb-3">Pour qui ?</h2>
            <p className="mb-6 max-w-3xl text-gray-600 leading-relaxed">
              Organisations qui doivent concilier budget, image et contraintes terrain — avec besoin de clarté pour
              valider un investissement.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { t: 'Directions techniques / énergie', d: 'Pilotage de parc et priorisation des projets.' },
                { t: 'Exploitants & facility', d: 'Réduction des aléas d’exploitation et des plaintes.' },
                { t: 'Bailleurs & syndics', d: 'Charges, confort, transparence en assemblée.' },
                { t: 'Industriel & logistique', d: 'Contraintes d’activité et fenêtres d’intervention.' },
                { t: 'Dirigeants / COMEX', d: 'Arbitrage ROI et risque réglementaire.' },
                { t: 'Tertiaire & retail', d: 'Multi-sites, image, délais et coordination occupant.' },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
                  <p className="font-semibold text-gray-900">{x.t}</p>
                  <p className="mt-1 text-sm text-gray-600">{x.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="besoin-accompagnement" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="heading-section mb-3 text-gray-900">Avez-vous besoin d’un accompagnement comme le nôtre ?</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-800">Oui, surtout si…</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-800">
                  <li>Plusieurs leviers possibles (PAC, air, hydraulique, CEE) et besoin de prioriser.</li>
                  <li>Comité / AG / direction qui exigent des hypothèses et des risques clairs.</li>
                  <li>Projet d’envergure ou multi-sites — vous ne voulez pas d’interlocuteurs fragmentés.</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-gray-600">Peut-être moins si…</p>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-700">
                  <li>Intervention ponctuelle déjà cadrée en interne — nous pouvons tout de même valider un point précis.</li>
                  <li>Le périmètre est minime et sans enjeu CEE — nous le disons à l’appel.</li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-center">
              <Link
                to={formMid}
                onClick={handleCtaStudy}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--secondary-700)] hover:underline"
              >
                Faire le point en 15 minutes (contact)
                <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </section>

          <section id="situations-typiques" className="scroll-mt-24">
            <h2 className="heading-section mb-4">Situations typiques que nous traitons</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                'Remplacement PAC ou chaudière : le comité veut un scénario défendable, pas un devis isolé.',
                'Grand volume mal chauffé : arbitrage entre ',
                'Réseau collectif qui tire mal : ',
                'Dossier CEE à monter sans casser la crédibilité interne.',
              ].map((raw, i) => (
                <li key={i} className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-sm">
                  {i === 1 ? (
                    <>
                      Grand volume mal chauffé : arbitrage entre{' '}
                      <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
                        déstratification
                      </Link>{' '}
                      et autre(s) levier(s).
                    </>
                  ) : i === 2 ? (
                    <>
                      Réseau collectif qui tire mal :{' '}
                      <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
                        équilibrage hydraulique
                      </Link>{' '}
                      avant de blâmer le générateur.
                    </>
                  ) : (
                    raw
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Pourquoi agir maintenant</h2>
            <ul className="space-y-2 text-sm md:text-base text-amber-950/90">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                <span>Les projets « à côté » coûtent plus cher une fois l’urgence installée (panne, réglementaire, image).</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                <span>Les arbitrages énergie pèsent de plus en plus en comité — mieux vaut un cadrage tôt.</span>
              </li>
            </ul>
          </section>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-4 bg-[var(--secondary-500)]/10 rounded-xl flex-shrink-0">
                      <Icon className="h-10 w-10 text-[var(--secondary-500)]" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h2>
                      <p className="text-gray-600 leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {service.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 md:p-8 max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Souvent lié</p>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Équilibrage hydraulique</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Après PAC ou sur réseau collectif déséquilibré, l’équilibrage hydraulique stabilise la distribution et
                les réglages.
              </p>
            </div>
            <Link
              to="/equilibrage-hydraulique"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm flex-shrink-0"
            >
              Découvrir
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 md:p-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-[var(--secondary-500)]/10 rounded-xl flex-shrink-0">
                <Target className="h-8 w-8 text-[var(--secondary-500)]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                Une approche orientée résultats mesurables
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Chaque projet est posé avec un objectif business : coûts, confort, délais, risque. Nous traduisons la
                technique en critères de décision — pas l’inverse.
              </p>
              <p>
                Découvrez nos offres détaillées :{' '}
                <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
                  pompe à chaleur
                </Link>
                ,{' '}
                <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
                  déstratification
                </Link>
                ,{' '}
                <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
                  financement CEE
                </Link>
                .
              </p>
            </div>
          </div>

          <section>
            <h2 className="heading-section mb-6 text-center">Déroulé type</h2>
            <ol className="max-w-3xl mx-auto space-y-3">
              {[
                'Qualification & données (web / échanges / visite si nécessaire)',
                'Étude & scénarios comparables',
                'Préconisation & montage CEE si applicable',
                'Coordination installation & preuves chantier',
                'Suivi et clôture administrative lorsque le dossier est engagé',
              ].map((step, i) => (
                <li
                  key={step}
                  className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm md:text-base text-gray-800"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-500)]/15 text-sm font-bold text-[var(--secondary-700)]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <OfferRealisationsSection
            categoryTokens={['accompagnement', 'projet', 'cee']}
            title="Réalisations — accompagnement & projets"
            limit={3}
            analyticsSource="services"
          />

          <section>
            <h2 className="heading-section mb-4">Questions fréquentes</h2>
            <Accordion type="single" collapsible className="max-w-3xl mx-auto rounded-lg border border-gray-200 bg-white px-2">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`svc-faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm md:text-base">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Liens utiles</h2>
            <nav className="flex flex-wrap gap-2" aria-label="Liens internes">
              {[
                { to: '/pompe-a-chaleur', label: 'Pompe à chaleur' },
                { to: '/destratification', label: 'Déstratification' },
                { to: '/equilibrage-hydraulique', label: 'Équilibrage hydraulique' },
                { to: '/cee', label: 'CEE' },
                { to: '/blog', label: 'Blog' },
                { to: '/realisations', label: 'Réalisations' },
                { to: formNav, label: 'Contact' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-gray-800 hover:border-[var(--secondary-500)]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </section>
        </PageContainer>

        <CTASection variant="darkGradient" title="Parlons de votre bâtiment" description="Étude gratuite : nous revenons vers vous avec une suite d’étapes claire et des hypothèses explicites.">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <EffinorButton to={formFooter} variant="primary" size="md" className="rounded-lg" onClick={handleCtaStudy}>
                Demander une étude gratuite
                <ArrowRight className="h-5 w-5" />
              </EffinorButton>
              <EffinorButton
                to={formCallback}
                variant="inverse"
                size="md"
                className="rounded-lg"
                onClick={handleCtaCallback}
              >
                <Phone className="h-4 w-4" />
                Être rappelé
              </EffinorButton>
            </div>
            <a href="tel:+33978455063" className="text-sm font-semibold text-white/90 hover:text-white inline-flex items-center gap-2">
              <Phone className="h-4 w-4" />
              09 78 45 50 63
            </a>
          </div>
        </CTASection>
      </div>
    </>
  );
};

export default ServicesAccompagnement;
