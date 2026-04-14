import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import SEOStandardMeta from '@/components/SEOStandardMeta';
import { getAbsoluteUrl } from '@/lib/siteUrl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { inferEffinorSourceFromPath, trackCtaCallback, trackCtaStudy } from '@/lib/effinorAnalytics';
import { buildLeadFormHref, inferProjectFromPathname, LEAD_FORM_PATH } from '@/lib/leadFormDestination';
import { PageContainer, CTASection, EffinorButton, SurfaceCard } from '@/components/ds';
import OfferRealisationsSection from '@/components/realisations/OfferRealisationsSection';

/**
 * Layout longue page pour offres PAC / déstratification (SEO + sections pédagogiques + FAQ + CTA).
 *
 * Props étendues (toutes optionnelles et rétro-compatibles) :
 *   heroCtas        [{label, to, kind:'primary'|'secondary'}]  boutons dans le hero
 *   problem.intro   texte introductif avant la liste
 *   problem.items   liste à puces (si absent : paragraphs)
 *   solution.tagline phrase forte mise en avant
 *   reassurance     { title, items[] }  section supplémentaire après bénéfices
 *   ctaBlock        { title, description }  surcharge le bloc CTA final
 *   heroBullets     string[]  2–3 preuves rapides sous le sous-titre hero
 *   pourQui         { title, intro?, items: { label, text }[] }  « pour qui » (après hero)
 *   urgence         { title, items[] }  bloc « pourquoi agir maintenant » (avant CTA final)
 *   internalLinks   { title?, links: { to, label }[] }  maillage blog / offres
 *   serviceSchema   { name, description }  JSON-LD Service (optionnel)
 *   phoneCta        { href, label }  ex. tel — sous les boutons du CTA final
 *   pillarContent   ReactNode — blocs SEO longue traîne (après typologies, avant bénéfices)
 *   afterFaqContent ReactNode — CTA ou texte après FAQ (avant urgence)
 *   heroFootnote    string — micro-copy sous les CTA hero
 */
const SectionBlock = ({ id, title, children, className = '' }) => (
  <section id={id} className={`scroll-mt-24 bg-light-section ${className}`}>
    <h2 className="heading-section mb-3 md:mb-4">{title}</h2>
    {children}
  </section>
);

const OfferPageLayout = ({
  seo: { title, description, keywords = '' },
  h1,
  eyebrow = null,
  heroLead,
  heroCtas = null,
  /**
   * URL d'image de fond pour le héros (Unsplash CDN ou asset local).
   * Un overlay sombre est appliqué automatiquement pour la lisibilité.
   */
  heroBgImage = null,
  heroBgImageAlt = '',
  problem,
  solution,
  buildings,
  benefits,
  reassurance = null,
  process: processSection,
  infoBlock = null,
  faq,
  breadcrumbs = [],
  afterHero = null,
  ctaLabel = 'Demander une étude gratuite',
  ctaTo = '/contact',
  ctaBlock = null,
  heroBullets = null,
  pourQui = null,
  urgence = null,
  internalLinks = null,
  serviceSchema = null,
  phoneCta = null,
  pillarContent = null,
  afterFaqContent = null,
  heroFootnote = null,
  /** Réalisations Airtable filtrées par mots-clés de catégorie — avant FAQ */
  realisationsStrip = null,
}) => {
  const location = useLocation();
  const offerSource = inferEffinorSourceFromPath(location.pathname);
  const projectSlug = inferProjectFromPathname(location.pathname);

  const resolvedCtaTo = useMemo(() => {
    if (ctaTo && ctaTo !== '/contact' && ctaTo !== LEAD_FORM_PATH && !ctaTo.startsWith(`${LEAD_FORM_PATH}?`)) {
      return ctaTo;
    }
    return buildLeadFormHref({
      source: offerSource,
      project: projectSlug,
      cta: 'offer_bottom',
      page: location.pathname,
    });
  }, [ctaTo, offerSource, projectSlug, location.pathname]);

  const callbackFormHref = useMemo(
    () =>
      buildLeadFormHref({
        source: offerSource,
        project: projectSlug,
        cta: 'callback',
        page: location.pathname,
      }),
    [offerSource, projectSlug, location.pathname],
  );

  const resolvedHeroCtas = useMemo(() => {
    if (!heroCtas?.length) return null;
    return heroCtas.map((c) => {
      const toStr = c.to || '';
      const isLead =
        toStr === '/contact' ||
        toStr === LEAD_FORM_PATH ||
        toStr.startsWith('/contact?') ||
        toStr.startsWith(`${LEAD_FORM_PATH}?`);
      if (!isLead) return c;
      const isSecondary = c.kind === 'secondary';
      return {
        ...c,
        to: buildLeadFormHref({
          source: offerSource,
          project: c.project || projectSlug,
          cta: c.cta || (isSecondary ? 'callback' : 'hero'),
          page: location.pathname,
        }),
      };
    });
  }, [heroCtas, offerSource, projectSlug, location.pathname]);

  const ogImage = useMemo(() => {
    if (!heroBgImage) return undefined;
    return /^https?:\/\//i.test(heroBgImage) ? heroBgImage : getAbsoluteUrl(heroBgImage);
  }, [heroBgImage]);

  const faqJsonLd = useMemo(() => {
    if (!faq?.items?.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    };
  }, [faq]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!breadcrumbs?.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: getAbsoluteUrl('/') },
        ...breadcrumbs.map((bc, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: bc.label,
          item: getAbsoluteUrl(bc.to),
        })),
      ],
    };
  }, [breadcrumbs]);

  const serviceJsonLd = useMemo(() => {
    if (!serviceSchema?.name) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: serviceSchema.name,
      description: serviceSchema.description,
      provider: {
        '@type': 'Organization',
        name: 'Effinor',
        url: getAbsoluteUrl('/'),
      },
      areaServed: { '@type': 'Country', name: 'France' },
    };
  }, [serviceSchema]);

  return (
    <>
      <SEOStandardMeta
        title={title}
        description={description}
        pathname={location.pathname}
        keywords={keywords}
        ogImage={ogImage}
        twitterImageAlt={heroBgImageAlt || undefined}
      />
      {(faqJsonLd || breadcrumbJsonLd || serviceJsonLd) && (
        <Helmet>
          {breadcrumbJsonLd && (
            <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
          )}
          {serviceJsonLd && <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>}
          {faqJsonLd && <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>}
        </Helmet>
      )}

      <div className="bg-slate-50 min-h-screen">
        {/* ── HERO ── */}
        <header
          className="relative bg-dark-section overflow-hidden"
          style={
            heroBgImage
              ? { backgroundImage: `url(${heroBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}
          }
          aria-label={heroBgImageAlt || undefined}
        >
          {/* Overlay : plein si pas d'image, semi-transparent sinon pour laisser voir le visuel */}
          {/* Overlay plus léger sur les vraies photos pour laisser l'image respirer */}
          <div
            className={
              heroBgImage
                ? 'absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/72 to-slate-900/75'
                : 'absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
            }
          />
          <PageContainer
            maxWidth="hero"
            className={`relative z-10 ${heroBgImage ? 'py-14 md:py-20' : 'py-10 md:py-14'}`}
          >
            {breadcrumbs.length > 0 && (
              <nav className="text-xs md:text-sm text-white/70 mb-4" aria-label="Fil d'Ariane">
                <ol className="flex flex-wrap gap-x-2 gap-y-1">
                  {breadcrumbs.map((bc, i) => (
                    <li key={bc.to} className="flex items-center gap-2">
                      {i > 0 && <span className="text-white/40">/</span>}
                      <Link to={bc.to} className="hover:text-[var(--secondary-400)] transition-colors">
                        {bc.label}
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {eyebrow ? (
              <p className="text-sm font-medium text-[var(--secondary-400)] mb-2">{eyebrow}</p>
            ) : null}
            <h1 className="heading-page text-3xl md:text-4xl lg:text-5xl mb-4">
              {h1}
            </h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-3xl">{heroLead}</p>

            {heroBullets?.length > 0 && (
              <ul className="mt-5 flex flex-col gap-2 max-w-2xl">
                {heroBullets.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm md:text-base text-white/90">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--secondary-400)]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}

            {resolvedHeroCtas && resolvedHeroCtas.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                {resolvedHeroCtas.map((cta, i) => (
                  <Link
                    key={i}
                    to={cta.to}
                    onClick={cta.onClick}
                    className={
                      cta.kind === 'secondary'
                        ? 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 font-semibold px-5 py-3 text-sm hover:bg-white/15 transition-colors'
                        : 'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--secondary-500)] text-white font-semibold px-5 py-3 text-sm hover:bg-[var(--secondary-600)] transition-colors'
                    }
                  >
                    {cta.label}
                    {cta.kind !== 'secondary' && <ArrowRight className="h-4 w-4" />}
                  </Link>
                ))}
              </div>
            )}
            {heroFootnote ? (
              <p className="mt-4 max-w-xl text-xs text-white/60 md:text-sm">{heroFootnote}</p>
            ) : null}
          </PageContainer>
        </header>

        {afterHero ? (
          <PageContainer maxWidth="hero" className="-mt-6 relative z-10">
            {afterHero}
          </PageContainer>
        ) : null}

        <PageContainer maxWidth="hero" className="py-10 md:py-14 space-y-12 md:space-y-16">

          {/* ── POUR QUI ── */}
          {pourQui && (
            <section id="pour-qui" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <h2 className="heading-section mb-2 md:mb-3">{pourQui.title}</h2>
              {pourQui.intro ? (
                <p className="mb-5 text-sm md:text-base text-gray-600 leading-relaxed max-w-3xl">{pourQui.intro}</p>
              ) : null}
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pourQui.items.map((row) => (
                  <li
                    key={row.label}
                    className="rounded-xl border border-gray-100 bg-slate-50/80 p-4 text-left"
                  >
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{row.label}</p>
                    {row.text ? <p className="mt-1 text-xs md:text-sm text-gray-600 leading-relaxed">{row.text}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── PROBLÈME ── */}
          <SectionBlock id="problematique" title={problem.title}>
            <div className={problem.img ? 'md:grid md:grid-cols-2 md:gap-8 md:items-center' : ''}>
              <div>
                {problem.intro && (
                  <div className="text-gray-700 leading-relaxed mb-3">
                    {typeof problem.intro === 'string' ? <p>{problem.intro}</p> : problem.intro}
                  </div>
                )}
                {problem.items ? (
                  <ul className="space-y-2">
                    {problem.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-gray-700">
                        <CheckCircle2 className="w-5 h-5 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3 text-gray-700 leading-relaxed">
                    {(problem.paragraphs || []).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
              </div>
              {problem.img && (
                <figure className="mt-6 md:mt-0">
                  <img
                    src={problem.img}
                    alt={problem.imgAlt || problem.title}
                    className="w-full rounded-xl shadow-md"
                    loading="lazy"
                  />
                  {problem.imgCaption && (
                    <figcaption className="text-xs text-gray-500 mt-2 text-center leading-relaxed">
                      {problem.imgCaption}
                    </figcaption>
                  )}
                </figure>
              )}
            </div>
          </SectionBlock>

          {/* ── SOLUTION ── */}
          <SectionBlock id="solution" title={solution.title}>
            {/* Mise en page 2 colonnes si une image est fournie, sinon texte seul */}
            <div className={solution.img ? 'md:grid md:grid-cols-2 md:gap-8 md:items-start' : ''}>
              <div>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  {(solution.paragraphs || []).map((p, i) =>
                    typeof p === 'string' ? (
                      <p key={i}>{p}</p>
                    ) : (
                      <div key={i}>{p}</div>
                    ),
                  )}
                </div>
                {solution.tagline && (
                  <p className="mt-4 text-base md:text-lg font-semibold text-gray-900 border-l-4 border-[var(--secondary-500)] pl-4">
                    {solution.tagline}
                  </p>
                )}
              </div>
              {solution.img && (
                <figure className="mt-5 md:mt-0">
                  <img
                    src={solution.img}
                    alt={solution.imgAlt || solution.title}
                    className="w-full rounded-xl shadow-lg object-cover"
                    style={{ maxHeight: '320px' }}
                    loading="lazy"
                    width="800"
                    height="320"
                  />
                  {solution.imgCaption && (
                    <figcaption className="text-xs text-gray-400 mt-2 text-center leading-snug">
                      {solution.imgCaption}
                    </figcaption>
                  )}
                </figure>
              )}
            </div>
          </SectionBlock>

          {/* ── BÂTIMENTS (si fourni) ── */}
          {buildings && (
            <SectionBlock id="batiments" title={buildings.title}>
              {/* Photo-cards si les items ont une propriété `img`, sinon liste standard */}
              {buildings.items.length > 0 && buildings.items[0]?.img ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {buildings.items.map((item, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden shadow-md group"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <img
                        src={item.img}
                        alt={item.imgAlt || item.label}
                        className={`absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105 ${item.schemaCard ? 'object-contain p-4 bg-white' : 'object-cover'}`}
                        style={item.imgPosition ? { objectPosition: item.imgPosition } : undefined}
                        loading="lazy"
                        width="800"
                        height="600"
                      />
                      {item.schemaCard ? (
                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className={`font-semibold leading-snug ${item.schemaCard ? 'text-gray-900' : 'text-white'}`}>{item.label}</p>
                        {item.text && (
                          <p className={`text-xs mt-1 leading-relaxed ${item.schemaCard ? 'text-gray-600' : 'text-white/75'}`}>{item.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {buildings.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                      <span>{typeof item === 'string' ? item : item.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionBlock>
          )}

          {pillarContent}

          {/* ── BÉNÉFICES ── */}
          <SectionBlock id="benefices" title={benefits.title}>
            <ul className="space-y-2">
              {benefits.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionBlock>

          {/* ── RÉASSURANCE (optionnelle) ── */}
          {reassurance && (
            <SectionBlock id="reassurance" title={reassurance.title}>
              <ul className="space-y-2">
                {reassurance.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </SectionBlock>
          )}

          {/* ── PROCESSUS ── */}
          <SectionBlock id="processus" title={processSection.title}>
            <ol className="space-y-3 sm:space-y-4">
              {processSection.steps.map((step, i) => (
                <SurfaceCard
                  key={i}
                  as="li"
                  variant="bordered"
                  className="flex gap-3 sm:gap-4 rounded-xl p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-500)]/15 text-sm font-bold text-[var(--secondary-700)] sm:h-8 sm:w-8">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="mb-1 font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600">{step.text}</p>
                  </div>
                </SurfaceCard>
              ))}
            </ol>
          </SectionBlock>

          {/* ── BLOC INFO LIBRE (ex. CEE) ── */}
          {infoBlock && (
            <section id="financement" className="scroll-mt-24 rounded-2xl bg-slate-900/5 border border-slate-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{infoBlock.title}</h2>
              <div className="text-gray-700 leading-relaxed text-sm md:text-base space-y-3">
                {typeof infoBlock.text === 'string' ? <p>{infoBlock.text}</p> : infoBlock.text}
              </div>
            </section>
          )}

          {realisationsStrip?.tokens?.length > 0 && (
            <OfferRealisationsSection
              categoryTokens={realisationsStrip.tokens}
              title={realisationsStrip.title}
              limit={realisationsStrip.limit ?? 3}
              analyticsSource={offerSource}
            />
          )}

          {/* ── FAQ ── */}
          <SectionBlock id="faq" title={faq.title}>
            <Accordion type="single" collapsible className="w-full border border-gray-200 rounded-lg bg-white px-4">
              {faq.items.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-sm md:text-base">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionBlock>

          {afterFaqContent}

          {urgence && (
            <section
              id="pourquoi-maintenant"
              className="scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50/90 p-6 md:p-8"
            >
              <h2 className="heading-section mb-3 text-gray-900">{urgence.title}</h2>
              <ul className="space-y-2">
                {urgence.items.map((line) => (
                  <li key={line} className="flex gap-2 text-sm md:text-base text-amber-950/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {internalLinks?.links?.length > 0 && (
            <section id="pour-aller-plus-loin" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {internalLinks.title || 'Pour aller plus loin'}
              </h2>
              <nav className="flex flex-wrap gap-2" aria-label="Liens internes">
                {internalLinks.links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs md:text-sm font-medium text-gray-800 transition-colors hover:border-[var(--secondary-500)] hover:bg-white"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </section>
          )}

          {/* ── CTA FINAL ── */}
          <CTASection
            variant="dark"
            className="rounded-2xl bg-slate-900"
            maxWidth="none"
            innerClassName="!py-6 md:!py-8 px-4 sm:px-6"
            title={ctaBlock?.title ?? 'Prochaine étape : cadrer votre projet avec des chiffres'}
            description={
              ctaBlock?.description ?? (
                <>
                  Étude gratuite, même interlocuteur du formulaire au suivi : faisabilité, confort, coûts et financement CEE
                  lorsque l&apos;éligibilité est avérée. Vous pouvez aussi{' '}
                  <Link to="/cee" className="underline hover:text-white">
                    comprendre les CEE en 2 minutes
                  </Link>
                  .
                </>
              )
            }
            footer={
              <>
                <Link to="/" className="underline hover:text-white">
                  Retour à l&apos;accueil
                </Link>
                {' · '}
                <Link to="/blog" className="underline hover:text-white">
                  Blog
                </Link>
                {' · '}
                <Link to="/cee" className="underline hover:text-white">
                  Certificats CEE
                </Link>
              </>
            }
          >
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                <EffinorButton
                  to={resolvedCtaTo}
                  variant="primary"
                  size="md"
                  className="rounded-lg"
                  onClick={() =>
                    trackCtaStudy({
                      effinor_source: offerSource,
                      effinor_cta_location: 'offer_bottom',
                      effinor_form_project: projectSlug,
                    })
                  }
                >
                  {ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </EffinorButton>
                <EffinorButton
                  to={callbackFormHref}
                  variant="inverse"
                  size="md"
                  className="rounded-lg"
                  onClick={() =>
                    trackCtaCallback({
                      effinor_source: offerSource,
                      effinor_cta_location: 'offer_bottom',
                      effinor_form_project: projectSlug,
                    })
                  }
                >
                  Être rappelé
                </EffinorButton>
              </div>
              {phoneCta?.href ? (
                <a
                  href={phoneCta.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {phoneCta.label || 'Appeler un conseiller'}
                </a>
              ) : null}
            </div>
          </CTASection>
        </PageContainer>
      </div>
    </>
  );
};

export default OfferPageLayout;
