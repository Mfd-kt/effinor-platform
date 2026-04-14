import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { CheckCircle2, ArrowRight, Phone } from 'lucide-react';
import SEOStandardMeta from '@/components/SEOStandardMeta';
import { getAbsoluteUrl } from '@/lib/siteUrl';
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
import { trackCtaCallback, trackCtaStudy } from '@/lib/effinorAnalytics';
import { buildLeadFormHrefForPage } from '@/lib/leadFormDestination';

const CEE_TITLE =
  'CEE : financement des travaux d’efficacité énergétique (PAC, déstratification) | Effinor';
const CEE_DESC =
  'Certificats d’économies d’énergie : comprendre le mécanisme, sécuriser un dossier et aligner technique & fiche d’opération. Accompagnement pour décideurs B2B — sans promesse hors cadre.';

const FAQ_ITEMS = [
  {
    q: 'Qu’est-ce qu’un CEE concrètement pour mon bâtiment ?',
    a: 'C’est un mécanisme où une partie des travaux d’efficacité peut être financée via les obligations des fournisseurs d’énergie — à condition que votre projet corresponde à une opération « fiche » en vigueur et que la traçabilité soit tenue.',
  },
  {
    q: 'Pourquoi ne peut-on pas annoncer un montant d’aide tout de suite ?',
    a: 'Le montant dépend de la période réglementaire, du type d’opération, des caractéristiques du site et, souvent, des preuves de mise en œuvre. Un montant annoncé sans analyse est une source d’échec de dossier — nous préférons un cadrage.',
  },
  {
    q: 'Quel lien avec ma pompe à chaleur ou ma déstratification ?',
    a: 'Ces équipements peuvent entrer dans des opérations standardisées si les critères sont remplis (bâtiment, équipement, preuves). Nous vérifions la cohérence entre votre chantier et la fiche avant d’engager le dossier.',
  },
  {
    q: 'Qui doit constituer le dossier ?',
    a: 'Cela dépend du dispositif et des acteurs (RGE, délégataire, etc.). Nous vous disons quels éléments préparer et pourquoi, pour éviter les dossiers incomplets.',
  },
  {
    q: 'Que se passe-t-il si le projet est mal cadré ?',
    a: 'Risque de rejet ou de retard : perte de temps pour l’exploitant et arbitrage difficile en comité. D’où l’intérêt d’aligner technique et administratif dès le départ.',
  },
  {
    q: 'Effinor remplace-t-il mon délégataire ou mon expert-comptable CEE ?',
    a: 'Non : nous structurons les informations et la cohérence projet. Les acteurs financiers et habilitations restent ceux prévus par le dispositif — nous réduisons les zones d’ombre côté contenu et preuves.',
  },
  {
    q: 'Quels délais pour un dossier CEE ?',
    a: 'Les délais varient selon la complétude des pièces, le calendrier chantier et le circuit des acteurs habilités. Un dossier « propre » dès le départ évite les allers-retours qui allongent la clôture.',
  },
  {
    q: 'Comment savoir si mon projet est éligible ?',
    a: 'On compare le site et l’équipement à une opération standardisée en vigueur : périmètre, critères techniques, preuves attendues. Tant que ces points ne sont pas posés, toute promesse de montant est fragile.',
  },
  {
    q: 'Comment se passe le versement / le financement ?',
    a: 'Le mécanisme dépend du dispositif retenu et des acteurs (prime, délégataire, etc.). Notre rôle est d’aligner le contenu technique et les preuves pour que le dossier soit recevable — pas d’annoncer un flux financier sans cadre.',
  },
  {
    q: 'Quels risques si on se trompe de fiche ou de périmètre ?',
    a: 'Rejet, retraitement, perte de temps et arbitrage interne difficile : on a dépensé du budget chantier sans sécuriser le financement attendu. D’où l’intérêt de cadrer tôt.',
  },
];

const CeeHub = () => {
  const { pathname } = useLocation();
  const formStudyHero = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'cee_hero' }), [pathname]);
  const formStudyFooter = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'cee_footer' }), [pathname]);
  const formCallback = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'callback' }), [pathname]);
  const formInline = useMemo(() => buildLeadFormHrefForPage(pathname, { cta: 'inline' }), [pathname]);

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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: getAbsoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'CEE & financement', item: getAbsoluteUrl('/cee') },
    ],
  };

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Accompagnement dossier CEE — pompe à chaleur & déstratification',
    description:
      'Structuration de projet et préparation des éléments de preuve pour dispositifs CEE lorsque l’opération est dans le cadre réglementaire.',
    provider: { '@type': 'Organization', name: 'Effinor', url: getAbsoluteUrl('/') },
    areaServed: { '@type': 'Country', name: 'France' },
  };

  return (
    <>
      <SEOStandardMeta title={CEE_TITLE} description={CEE_DESC} pathname="/cee" />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        <header className="bg-dark-section border-b border-white/10">
          <PageContainer maxWidth="hero" className="py-12 md:py-16 lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary-400)] mb-3">
              Certificats d’économies d’énergie
            </p>
            <h1 className="heading-page text-3xl md:text-4xl lg:text-5xl mb-4 max-w-4xl">
              CEE : sécuriser le dossier, pas seulement espérer l’aide
            </h1>
            <p className="text-lg text-white/85 leading-relaxed max-w-3xl mb-6">
              Les CEE peuvent réduire le reste à charge lorsque le projet entre dans une opération précise et que les
              preuves sont réunies. Chez Effinor, on aligne la réalité du bâtiment avec la fiche — pour des arbitrages
              tenables en comité.
            </p>
            <ul className="mb-8 max-w-2xl space-y-2 text-sm md:text-base text-white/90">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                <span>Lecture de cohérence : équipement, bâtiment, traçabilité chantier</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                <span>Pas de montant « garanti » sans hypothèses : nous détestons les dossiers fragiles</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                <span>
                  Lien direct avec nos offres{' '}
                  <Link to="/pompe-a-chaleur" className="font-medium text-white underline hover:text-[var(--secondary-300)]">
                    PAC
                  </Link>
                  ,{' '}
                  <Link to="/destratification" className="font-medium text-white underline hover:text-[var(--secondary-300)]">
                    déstratification
                  </Link>
                  ,{' '}
                  <Link
                    to="/equilibrage-hydraulique"
                    className="font-medium text-white underline hover:text-[var(--secondary-300)]"
                  >
                    équilibrage hydraulique
                  </Link>
                </span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <EffinorButton
                to={formStudyHero}
                variant="primary"
                size="md"
                className="rounded-lg"
                onClick={() => trackCtaStudy({ effinor_source: 'cee_page', effinor_cta_location: 'cee_hero' })}
              >
                Tester mon projet (étude gratuite)
                <ArrowRight className="h-5 w-5" />
              </EffinorButton>
              <EffinorButton
                to={formCallback}
                variant="inverse"
                size="md"
                className="rounded-lg border border-white/30 bg-white/10 hover:bg-white/15"
                onClick={() => trackCtaCallback({ effinor_source: 'cee_page', effinor_cta_location: 'cee_hero' })}
              >
                Être rappelé
              </EffinorButton>
            </div>
          </PageContainer>
        </header>

        <PageContainer maxWidth="hero" className="space-y-14 md:space-y-16 py-12 md:py-16">
          <section id="pour-qui" className="scroll-mt-24">
            <h2 className="heading-section mb-3">Pour qui ?</h2>
            <p className="mb-6 max-w-3xl text-sm md:text-base text-gray-600 leading-relaxed">
              Dirigeants, directions techniques, exploitants et responsables énergie : vous devez arbitrer un investissement
              avec un risque réglementaire et un besoin de preuve.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { t: 'Bailleurs & syndics', d: 'Budget charges et image de gestion, AG, transparence.' },
                { t: 'Industriel & logistique', d: 'Projets d’équipements et suivi de performance énergétique.' },
                { t: 'Tertiaire & retail', d: 'Enjeux de image, délais et contraintes multi-sites.' },
                { t: 'Facility & immobilier', d: 'Besoin de standardiser la méthode et les livrables.' },
                { t: 'Responsables QHSE / énergie', d: 'Besoin de cohérence entre fiche, chantier et reporting.' },
              ].map((x) => (
                <li key={x.t} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="font-semibold text-gray-900">{x.t}</p>
                  <p className="mt-1 text-xs md:text-sm text-gray-600 leading-relaxed">{x.d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="cee-qu-est-ce" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <h2 className="heading-section mb-3">Les CEE, en clair</h2>
            <div className="max-w-3xl space-y-3 text-sm md:text-base text-gray-700 leading-relaxed">
              <p>
                Les <strong>certificats d’économies d’énergie</strong> sont un dispositif où une partie des travaux
                d’efficacité peut être financée via les obligations des fournisseurs d’énergie — à condition que votre
                projet corresponde à une <strong>opération précise</strong> (souvent une « fiche ») et que la{' '}
                <strong>traçabilité</strong> soit tenue du début à la fin.
              </p>
              <p className="text-gray-600">
                Ce n’est pas une ligne budgétaire automatique : c’est un <strong>cadre</strong>. Dès qu’on confond
                promesse commerciale et critères de fiche, le dossier devient fragile.
              </p>
            </div>
          </section>

          <section id="cee-mal-compris" className="scroll-mt-24">
            <h2 className="heading-section mb-4">Ce que beaucoup d’entreprises confondent</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  t: 'Ce n’est pas « garanti »',
                  d: 'Le montant et l’éligibilité dépendent du site, de la période réglementaire et des preuves. Un chiffre annoncé trop tôt est souvent la première erreur.',
                },
                {
                  t: 'Ça dépend d’une éligibilité réelle',
                  d: 'Même équipement : si le périmètre ou les critères ne collent pas à la fiche, le dossier ne tient pas.',
                },
                {
                  t: 'Contraintes techniques sérieuses',
                  d: 'Bâtiment, équipement, mise en œuvre : la cohérence technique n’est pas optionnelle — c’est le cœur du contrôle.',
                },
              ].map((x) => (
                <li key={x.t} className="rounded-xl border border-gray-200 bg-slate-50/80 p-4">
                  <p className="font-semibold text-gray-900">{x.t}</p>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{x.d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="cee-risques-sans-cadrage" className="scroll-mt-24 rounded-2xl border border-red-100 bg-red-50/40 p-6 md:p-8">
            <h2 className="heading-section mb-3 text-gray-900">Sans traitement sérieux du dossier : ce que vous risquez</h2>
            <ul className="max-w-3xl space-y-2 text-sm text-gray-800 md:text-base">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                <span>
                  <strong>Dossiers rejetés ou en boucle</strong> : temps perdu côté exploitation et crédibilité en
                  interne.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                <span>
                  <strong>Financement attendu qui ne correspond pas</strong> au réel — arbitrage comité très désagréable.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                <span>
                  <strong>Retards</strong> : chantier engagé, preuves incomplètes, reprises administratives.
                </span>
              </li>
            </ul>
          </section>

          <section id="problematique" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <h2 className="heading-section mb-3">Le problème : un mécanisme puissant… mais exigeant</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Les CEE ne sont pas une « ligne budgétaire » automatique : ce sont des opérations encadrées. Si la promesse
              marketing précède la preuve, le dossier casse — et le projet perd du temps.
            </p>
            <ul className="space-y-2">
              {[
                'Décideur pris entre un fournisseur qui promet et un comité qui demande des garanties',
                'Écart entre discours commercial et exigences de fiche / preuves',
                'Risque de rejet ou de retard si la traçabilité chantier est incomplète',
                'Montant d’aide variable selon période et périmètre — difficile à figer sans analyse',
              ].map((line) => (
                <li key={line} className="flex gap-2 text-sm md:text-base text-gray-800">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="solution-effinor" className="scroll-mt-24">
            <h2 className="heading-section mb-3">Notre rôle : structurer le dossier, sécuriser la conformité, viser l’éligibilité</h2>
            <div className="max-w-3xl space-y-4 text-gray-700 leading-relaxed">
              <p>
                Nous partons de votre projet réel : bâtiment, équipement, mode d’exploitation, calendrier. Nous
                vérifions la cohérence avec les opérations applicables —{' '}
                <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
                  pompe à chaleur
                </Link>
                ,{' '}
                <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
                  déstratification
                </Link>
                ,{' '}
                <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
                  équilibrage hydraulique
                </Link>{' '}
                — pour éviter les dossiers « jolis sur PowerPoint » et fragiles à l’examen.
              </p>
              <ul className="space-y-2 text-sm md:text-base">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                  <span>
                    <strong>Structurer</strong> : périmètre, fiche, liste de preuves — pas de trou dans le récit projet.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                  <span>
                    <strong>Sécuriser la conformité</strong> : alignement chantier ↔ administratif, points de vigilance
                    nommés.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                  <span>
                    <strong>Maximiser l’éligibilité</strong> dans le cadre réel — sans sur-promesse hors critères.
                  </span>
                </li>
              </ul>
              <p className="border-l-4 border-[var(--secondary-500)] pl-4 font-semibold text-gray-900">
                Schéma simple : bon équipement + bon périmètre + bonnes preuves = dossier défendable.
              </p>
            </div>
          </section>

          <section id="processus" className="scroll-mt-24">
            <h2 className="heading-section mb-6">Comment ça se passe</h2>
            <ol className="space-y-4">
              {[
                {
                  t: 'Qualification & données',
                  d: 'Surface, usage, chauffage actuel, objectifs — pour cadrer un périmètre réaliste.',
                },
                { t: 'Lecture de cohérence fiche / site', d: 'Points de vigilance expliqués clairement (sans jargon inutile).' },
                { t: 'Préparation des preuves', d: 'Liste des éléments attendus : photos, factures, caractéristiques, etc.' },
                { t: 'Suivi chantier & clôture', d: 'Alignement entre installation et dossier lorsque le projet est engagé.' },
              ].map((step, i) => (
                <li
                  key={step.t}
                  className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-500)]/15 text-sm font-bold text-[var(--secondary-700)]">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{step.t}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            id="urgence"
            className="scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50/90 p-6 md:p-8"
          >
            <h2 className="heading-section mb-3 text-gray-900">Pourquoi agir maintenant</h2>
            <ul className="space-y-2 text-sm md:text-base text-amber-950/90">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                <span>Les projets mal cadrés coûtent plus cher une fois le chantier engagé.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                <span>La réglementation et les fiches évoluent : un arbitrage tôt évite les mauvaises surprises.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                <span>
                  Fenêtres réglementaires et critères de fiche : mieux vaut cadrer avant que le calendrier interne ne
                  vous impose une décision bancale.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                <span>Vos équipes méritent une méthode claire — pas un empilement de promesses floues.</span>
              </li>
            </ul>
          </section>

          <OfferRealisationsSection
            categoryTokens={['cee', 'CEE', 'certificat', 'économies']}
            title="Réalisations — projets avec dimension CEE"
            limit={3}
            analyticsSource="cee_page"
          />

          <section id="faq" className="scroll-mt-24">
            <h2 className="heading-section mb-4">Questions fréquentes</h2>
            <Accordion type="single" collapsible className="rounded-lg border border-gray-200 bg-white px-2">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`cee-faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm md:text-base">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section id="maillage" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Pour aller plus loin</h2>
            <nav className="flex flex-wrap gap-2" aria-label="Liens internes">
              {[
                { to: '/pompe-a-chaleur', label: 'Pompe à chaleur' },
                { to: '/destratification', label: 'Déstratification' },
                { to: '/equilibrage-hydraulique', label: 'Équilibrage hydraulique' },
                { to: '/services-accompagnement', label: 'Accompagnement projet' },
                { to: '/blog', label: 'Blog' },
                { to: formInline, label: 'Contact' },
              ].map((l) => (
                <Link
                  key={l.label === 'Contact' ? 'contact-form' : l.to}
                  to={l.to}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs md:text-sm font-medium text-gray-800 transition-colors hover:border-[var(--secondary-500)] hover:bg-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </section>
        </PageContainer>

        <CTASection
          variant="dark"
          className="rounded-none"
          innerClassName="!py-10 md:!py-12"
          title="Besoin d’un « oui » solide pour votre comité ?"
          description="Décrivez votre projet : nous revenons vers vous avec une lecture de cohérence et la suite d’étapes — sans engagement sur la base d’informations sincères."
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <EffinorButton
                to={formStudyFooter}
                variant="primary"
                size="md"
                className="rounded-lg"
                onClick={() => trackCtaStudy({ effinor_source: 'cee_page', effinor_cta_location: 'cee_footer' })}
              >
                Étude gratuite
                <ArrowRight className="h-5 w-5" />
              </EffinorButton>
              <EffinorButton
                to={formCallback}
                variant="inverse"
                size="md"
                className="rounded-lg"
                onClick={() => trackCtaCallback({ effinor_source: 'cee_page', effinor_cta_location: 'cee_footer' })}
              >
                Être rappelé
              </EffinorButton>
            </div>
            <a
              href="tel:+33978455063"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
            >
              <Phone className="h-4 w-4" aria-hidden />
              09 78 45 50 63
            </a>
          </div>
        </CTASection>
      </div>
    </>
  );
};

export default CeeHub;
