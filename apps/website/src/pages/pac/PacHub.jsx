import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import OfferPageLayout from '@/components/leadgen/OfferPageLayout';
import OfferMidCta from '@/components/leadgen/OfferMidCta';
import { inferEffinorSourceFromPath, trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { IMAGES } from '@/config/images';

const SegmentationCards = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  const cards = [
    {
      to: '/pompe-a-chaleur/residentiel',
      title: 'PAC résidentiel',
      text: 'Copropriétés, bailleurs, logements collectifs',
      cta: 'Voir la PAC résidentiel',
      img: IMAGES.inline.coproprieteImmeuble,
      imgAlt: 'Copropriété — chauffage collectif et pompe à chaleur',
    },
    {
      to: '/pompe-a-chaleur/tertiaire',
      title: 'PAC tertiaire',
      text: 'Bureaux, commerces, ERP, sites mixtes',
      cta: 'Voir la PAC tertiaire',
      img: IMAGES.inline.pacChaufferie,
      imgAlt: 'Chaufferie pompe à chaleur — bâtiment tertiaire',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      {cards.map((card) => (
        <Link
          key={card.to}
          to={card.to}
          onClick={() => trackCtaStudy({ effinor_source: src, effinor_cta_location: 'segment_card' })}
          className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
          style={{ aspectRatio: '16/9' }}
        >
          <img
            src={card.img}
            alt={card.imgAlt || card.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            width="800"
            height="450"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="font-bold text-white text-base leading-snug">{card.title}</h2>
            <p className="text-white/75 text-xs mt-1 leading-relaxed">{card.text}</p>
            <span className="inline-flex items-center gap-1 text-[var(--secondary-300)] text-xs font-semibold mt-2">
              {card.cta} <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

/** Bandeau preuve / résultats — lecture rapide, renvoie vers le détail terrain plus bas */
const PacProofStrip = () => (
  <section
    id="pac-preuve-rapide"
    aria-label="Indicateurs observés sur projets cadrés"
    className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm md:p-5"
  >
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Ce qu’on observe quand le projet est cadré (réseau + dimensionnement)
    </p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold tabular-nums text-[var(--secondary-800)] md:text-xl">10–35 %</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          MWh chauffage — fourchette fréquente si générateur + distribution sont traités sérieusement.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">Comité</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Hypothèses et risques nommés — pas de courbe ROI « vendue » sans données site.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">Plaintes</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Souvent en baisse quand hydraulique et régulation suivent le générateur.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">CEE</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Montant défendable seulement si fiche, mesures et traçabilité tiennent la route.
        </p>
      </div>
    </div>
    <p className="mt-3 text-xs text-slate-600">
      <a href="#pac-resultats-observes" className="font-medium text-[var(--secondary-700)] hover:underline">
        Détail, méthode et limites
      </a>
      {' '}
      — chaque site peut s’écarter sans audit.
    </p>
  </section>
);

/** Blocs longue traîne + comparaisons + ROI + cas + différenciation — insérés avant « Bénéfices » */
const PacPillarBlocks = ({ src }) => {
  const midPrimary = (loc) => () =>
    trackCtaStudy({ effinor_source: src, effinor_cta_location: loc });
  const midSecondary = (loc) => () =>
    trackCtaCallback({ effinor_source: src, effinor_cta_location: loc });

  const typeBlocks = [
    {
      id: 'pac-segment-logistique',
      h: 'Pompe à chaleur pour entrepôt logistique',
      p: 'Neuf et quais, charges ponctuelles, chaufferie souvent surdimensionnée par rapport au confort réel au sol : la PAC peut remplacer une chaudière gaz, mais les volumes hauts peuvent aussi imposer un volet air (voir notre page déstratification).',
      b: 'Moins de MWh pour maintenir la consigne là où vos équipes travaillent.',
    },
    {
      id: 'pac-segment-tertiaire',
      h: 'Pompe à chaleur pour bâtiment tertiaire',
      p: 'Bureaux, commerces, ERP : enjeu de confort, d’image et de prévisibilité budgétaire. Une PAC tertiaire bien intégrée au réseau et à la régulation évite le « sur-chauffage » compensatoire.',
      b: 'Un scénario présentable en comité : coûts, délais, risques — pas un catalogue.',
    },
    {
      id: 'pac-segment-hotel',
      h: 'Pompe à chaleur pour hôtel',
      p: 'Occupation variable, besoin d’ECS et de chauffage simultanés : le dimensionnement et le pilotage comptent autant que la puissance nominale. Nous croisons usage réel et contraintes d’exploitation.',
      b: 'Confort client et charges maîtrisées sur la durée.',
    },
    {
      id: 'pac-segment-copropriete',
      h: 'Pompe à chaleur pour copropriété',
      p: 'Chauffage collectif, plaintes inégales entre logements : avant ou après remplacement du générateur, le réseau hydraulique mérite souvent un œil expert — lien direct avec notre page équilibrage hydraulique.',
      b: 'Moins de déséquilibres, moins de « on monte la consigne pour tout le monde ».',
    },
    {
      id: 'pac-segment-industrie',
      h: 'Pompe à chaleur pour industrie',
      p: 'Ateliers et sites mixtes : contraintes de process, plages horaires, arrêts partiels. Nous dimensionnons avec vos équipes pour éviter un beau catalogue qui ne tient pas la réalité terrain.',
      b: 'Un projet industrialisable : jalons, sécurité, traçabilité.',
    },
  ];

  const segmentNavLinks = [
    { id: 'pac-segment-hotel', label: 'Hôtellerie' },
    { id: 'pac-segment-logistique', label: 'Logistique' },
    { id: 'pac-segment-tertiaire', label: 'Bureaux & tertiaire' },
    { id: 'pac-segment-copropriete', label: 'Copropriété' },
    { id: 'pac-segment-industrie', label: 'Industrie' },
  ];

  return (
    <div className="space-y-12 md:space-y-14">
      <section id="pac-par-type-batiment" className="scroll-mt-24">
        <h2 className="heading-section mb-2 md:mb-4">
          Pompe à chaleur selon votre type de bâtiment
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-600 md:text-base">
          Logistique, tertiaire, hôtellerie, copropriété, industrie : le même mot « PAC » ne couvre pas le même risque.
          Quand le chauffage seul ne suffit pas, nous enchaînons avec{' '}
          <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
            déstratification
          </Link>{' '}
          ou{' '}
          <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
            équilibrage hydraulique
          </Link>
          .
        </p>
        <nav
          aria-label="Accès rapide par type de site"
          className="mb-6 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:p-4"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Aller au détail</p>
          <ul className="flex flex-wrap gap-2">
            {segmentNavLinks.map((seg) => (
              <li key={seg.id}>
                <a
                  href={`#${seg.id}`}
                  className="inline-flex rounded-lg border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-[var(--secondary-400)] hover:bg-white hover:text-[var(--secondary-800)] md:text-sm"
                >
                  {seg.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-6">
          {typeBlocks.map((bl) => (
            <article
              key={bl.id}
              id={bl.id}
              className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 md:text-xl">{bl.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">{bl.p}</p>
              <p className="mt-3 text-sm font-medium text-[var(--secondary-800)]">
                Bénéfice concret : {bl.b}
              </p>
              <Link
                to="/contact"
                onClick={midPrimary('pac_mid_type_batiment')}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--secondary-600)] hover:underline"
              >
                Demander une étude sur ce contexte
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <OfferMidCta
        title="Un bâtiment qui vous ressemble ? Parlons-en avant le devis matériel."
        subtitle="Étude gratuite · Sans engagement · Réponse rapide"
        onPrimary={midPrimary('pac_mid_after_types')}
        onSecondary={midSecondary('pac_mid_after_types')}
      />

      <section id="pac-micro-longue-traine" className="scroll-mt-24">
        <h2 className="heading-section mb-2 md:mb-3">
          Dimensionnement, rénovation, isolation : ce qu’une page produit ne vous dira pas
        </h2>
        <p className="mb-6 max-w-3xl text-sm text-gray-600 md:text-base">
          Cinq sujets fréquents en recherche, traités comme en comité technique — pas comme un glossaire.
        </p>
        <div className="space-y-5">
          <article
            id="pac-dimensionnement-surface"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
          >
            <h3 className="text-base font-bold text-gray-900 md:text-lg">
              Dimensionnement PAC selon la surface : un point de départ, pas une règle
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">
              La puissance utile dépend du <strong>besoin thermique réel</strong> (climat, occupation, apports internes,
              ECS), pas d’un ratio m² → kW figé.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-700 md:text-base">
              <li>
                Petits sites tertiaires : souvent un ordre de grandeur se cadrera en kW après lecture conso et plages
                horaires — pas après un seul relevé m².
              </li>
              <li>
                Grands plateaux / entrepôts : la surface « chauffée » et la surface « utile au sol » ne racontent pas la
                même histoire — voir aussi{' '}
                <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
                  déstratification
                </Link>
                .
              </li>
            </ul>
          </article>

          <article
            id="pac-renovation-vs-neuf"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
          >
            <h3 className="text-base font-bold text-gray-900 md:text-lg">
              PAC en rénovation vs neuf : deux budgets mentaux, deux risques
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">
              En <strong>neuf</strong>, on dimensionne avec l’enveloppe et les températures de distribution prévues. En{' '}
              <strong>rénovation</strong>, on hérite d’un réseau, de vannes et parfois d’une régulation « historique ».
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-700 md:text-base">
              <li>Réno : risque n°1 = caler une PAC neuve sur un réseau qui ment encore aux pièces.</li>
              <li>Neuf : risque n°2 = sous-estimer l’intégration (emplacements, acoustique, appoint).</li>
            </ul>
          </article>

          <article
            id="pac-batiment-mal-isole"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
          >
            <h3 className="text-base font-bold text-gray-900 md:text-lg">
              PAC sur bâtiment mal isolé : plafond de performance, pas miracle
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">
              Une PAC peut remplacer un générateur vieillissant et stabiliser l’exploitation. Elle ne supprime pas une
              enveloppe défaillante : elle <strong>répond à un besoin</strong> que des déperditions élevées maintiennent
              artificiellement haut.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-700 md:text-base">
              <li>Scénario crédible : PAC + plan d’enveloppe phasé, ou PAC « stop-gap » avec stratégie d’isolation derrière.</li>
              <li>À cadrer tôt si vous visez un financement : cohérence fiche / mesure / trajectoire bâtiment.</li>
            </ul>
          </article>

          <article id="pac-vs-isolation" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="text-base font-bold text-gray-900 md:text-lg">PAC vs isolation : l’arbitrage, pas le match</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">
              Ce n’est pas « l’un ou l’autre ». C’est <strong>l’ordre</strong> qui évite de surinvestir en kW ce que des
              kWh perdus rendent nécessaire.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-700 md:text-base">
              <li>Isolation (toiture, menuiseries, ponts) : baisse du besoin → puissance PAC et réseau souvent plus raisonnables.</li>
              <li>Si vous ne pouvez pas isoler tout de suite : dimensionner sans figer une impasse technique pour la suite.</li>
            </ul>
          </article>

          <article
            id="pac-air-eau-vs-autres"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
          >
            <h3 className="text-base font-bold text-gray-900 md:text-lg">
              PAC air/eau vs autres architectures : le bon critère est le site, pas le catalogue
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">
              En tertiaire / collectif, l’<strong>air/eau</strong> est souvent le compromis le plus lisible : unités extérieures,
              liaison fluide, intégration chaufferie. Les autres options existent pour des contraintes précises.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-700 md:text-base">
              <li>
                <strong>Eau/eau</strong> : pertinent quand une source eau stable et exploitable est déjà là (projet, contrainte
                urbaine).
              </li>
              <li>
                <strong>Géothermie / forage</strong> : capex et délais différents ; intérêt à traiter sur étude de sol et
                phasage — pas sur une brochure.
              </li>
              <li>
                L’électrique disponible, l’acoustique et l’accès maintenance décident autant que le type de fluide.
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section
        id="pac-resultats-observes"
        className="scroll-mt-24 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-6 md:p-8"
      >
        <h2 className="heading-section mb-2 text-gray-900">Résultats observés (terrain, pas marketing)</h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-700 md:text-base">
          Fourchettes issues de projets B2B <strong>où le réseau et le dimensionnement ont été traités sérieusement</strong>.
          Ce ne sont pas des garanties : votre site peut s’écarter si l’existant impose des compromis.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Chauffage (MWh)</span>
            <p className="mt-1.5 leading-relaxed">
              Baisses souvent observées dans une fourchette <strong>10 % à 35 %</strong> après remplacement de générateur
              inadapté + corrections de base (régulation, équilibrage partiel, hysteresis).
            </p>
          </li>
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Facture énergétique</span>
            <p className="mt-1.5 leading-relaxed">
              Le €/MWh dépend du contrat et du réseau. Le levier durable reste la <strong>conso</strong>, pas le slogan
              « électricité vs gaz ».
            </p>
          </li>
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Confort / plaintes</span>
            <p className="mt-1.5 leading-relaxed">
              Réduction nette des tickets « trop froid / trop chaud » quand le <strong>déséquilibre hydraulique</strong> est
              adressé en parallèle (
              <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-800)] hover:underline">
                équilibrage
              </Link>
              ).
            </p>
          </li>
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Délai de retour</span>
            <p className="mt-1.5 leading-relaxed">
              Souvent <strong>pluriannuel</strong> dès qu’on inclut travaux de réseau et enveloppe partielle — à modéliser avec
              hypothèses explicites, pas une courbe vendue en amphi.
            </p>
          </li>
        </ul>
      </section>

      <section id="par-ou-commencer" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Par où commencer ?</h2>
        <p className="mb-5 max-w-3xl text-sm text-gray-600 md:text-base">
          Quatre étapes pour éviter le devis matériel avant le constat — court, vérifiable, présentable en interne.
        </p>
        <ol className="space-y-4 text-sm text-gray-800 md:text-base">
          <li className="flex gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[var(--secondary-800)]"
              aria-hidden
            >
              1
            </span>
            <div>
              <p className="font-semibold text-gray-900">Données réelles</p>
              <p className="mt-1 text-gray-700">
                Factures, courbes ou index MWh, plages d’occupation, sinistres récents sur le chauffage.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[var(--secondary-800)]"
              aria-hidden
            >
              2
            </span>
            <div>
              <p className="font-semibold text-gray-900">Échange technique cadré</p>
              <p className="mt-1 text-gray-700">
                Appel ou visite pour qualifier réseau, générateur, contraintes d’accès — pas un catalogue.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[var(--secondary-800)]"
              aria-hidden
            >
              3
            </span>
            <div>
              <p className="font-semibold text-gray-900">Hypothèses & fourchettes</p>
              <p className="mt-1 text-gray-700">
                Scénarios prudents, risques nommés (élec, acoustique, CEE), points bloquants identifiés tôt.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[var(--secondary-800)]"
              aria-hidden
            >
              4
            </span>
            <div>
              <p className="font-semibold text-gray-900">Décision & phasage</p>
              <p className="mt-1 text-gray-700">
                Arbitrage comité : quoi faire maintenant, quoi conditionner — puis{' '}
                <Link to="/contact" onClick={midPrimary('pac_par_ou_commencer')} className="font-medium text-[var(--secondary-700)] hover:underline">
                  prise de contact
                </Link>{' '}
                pour une étude gratuite, sans engagement.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section id="pac-vs-chaudiere-gaz" className="scroll-mt-24">
        <h2 className="heading-section mb-4">Pompe à chaleur vs chaudière gaz (bâtiment tertiaire / entreprise)</h2>
        <p className="mb-6 max-w-3xl text-sm text-gray-600 md:text-base">
          Comparaison utile pour un remplacement de chaudière gaz dans un bâtiment professionnel — sans caricature :
          le bon choix dépend du réseau, de l’usage et du coût total (pas seulement le prix du kWh).
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50">
                <th className="p-3 font-semibold text-gray-900 md:p-4">Critère</th>
                <th className="p-3 font-semibold text-gray-900 md:p-4">Chaudière gaz (existante)</th>
                <th className="p-3 font-semibold text-gray-900 md:p-4">Pompe à chaleur (projet bien dimensionné)</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="p-3 font-medium text-gray-900 md:p-4">Coût d’exploitation</td>
                <td className="p-3 md:p-4">Exposé au prix du combustible ; rendement limité par la technologie et l’âge.</td>
                <td className="p-3 md:p-4">Performance saisonnière (SCOP) : souvent moins de kWh facturés pour le même besoin — selon contexte.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 font-medium text-gray-900 md:p-4">Consommation</td>
                <td className="p-3 md:p-4">Combustible + pertes ; peu de marge si le réseau distribue mal la chaleur.</td>
                <td className="p-3 md:p-4">Électricité pilotée ; intérêt de coupler à une distribution et une régulation saines.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 font-medium text-gray-900 md:p-4">Maintenance</td>
                <td className="p-3 md:p-4">Contrôles gaz, sécurité, pièces vieillissantes.</td>
                <td className="p-3 md:p-4">Entretien spécifique PAC ; veille sur filtres, alarmes et courbes de performance.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-gray-900 md:p-4">Réglementation</td>
                <td className="p-3 md:p-4">Pression sur les équipements fossiles selon sites et échéances — à intégrer dans l’arbitrage.</td>
                <td className="p-3 md:p-4">S’inscrit souvent dans les trajectoires d’efficacité ; CEE possibles si opération dans le cadre (voir{' '}
                  <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">CEE</Link>
                  ).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="cout-pac-batiment" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 md:p-8">
        <h2 className="heading-section mb-3">Quel est le coût d’une pompe à chaleur pour un bâtiment ?</h2>
        <p className="text-sm leading-relaxed text-gray-700 md:text-base">
          Pas de prix « par m² » honnête sans hypothèses. Un projet complet (études, équipements, mise en œuvre, réseau)
          va souvent de <strong>dizaines de milliers à plusieurs centaines de milliers d’euros</strong> — au-delà sur sites
          contraints.
        </p>
        <p className="mt-3 text-sm font-semibold text-gray-900">Ce qui fait bouger la facture</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-gray-700 md:text-base">
          <li>Puissance utile, températures de distribution, reprise sur l’existant.</li>
          <li>
            Travaux annexes : désembouage, régulation,{' '}
            <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
              équilibrage
            </Link>
            .
          </li>
          <li>
            Délais, contraintes d’accès, preuves pour un financement (
            <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
              CEE
            </Link>
            ).
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-gray-700 md:text-base">
          <strong>ROI :</strong> baisse de MWh + stabilité d’exploitation — fourchettes prudentes, hypothèses visibles. Pas de
          « retour en X mois » sans données : en comité, ça se retourne contre vous.
        </p>
      </section>

      <OfferMidCta
        title="Obtenir une fourchette et des hypothèses claires sur votre site"
        subtitle="Nous revenons vers vous après qualification — étude gratuite, sans engagement"
        onPrimary={midPrimary('pac_mid_after_cout')}
        onSecondary={midSecondary('pac_mid_after_cout')}
      />

      <section id="cas-typiques" className="scroll-mt-24">
        <h2 className="heading-section mb-4">Cas typiques que nous rencontrons</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {[
            {
              t: 'Bailleur multi-immeubles',
              d: 'Charges de chauffage qui explosent, AG tendues, besoin d’un plan par patrimoine et de preuves par site.',
            },
            {
              t: 'Exploitant avec facture énergétique élevée',
              d: 'Objectif PGE : réduire le MWh sans stopper l’activité ; phasage et priorisation des sites.',
            },
            {
              t: 'Industriel, chauffage « en bout de course »',
              d: 'Chaudière ancienne, arrêts coûteux : arbitrage entre investissement, risque et disponibilité terrain.',
            },
            {
              t: 'Tertiaire, inconfort thermique',
              d: 'Plaintes au poste de travail alors que la conso reste haute : souvent réseau + production à lire ensemble.',
            },
          ].map((c) => (
            <li
              key={c.t}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="font-semibold text-gray-900">{c.t}</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{c.d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-gray-600">
          Besoin de preuves terrain ? Parcourez nos{' '}
          <Link to="/realisations" className="font-medium text-[var(--secondary-700)] hover:underline">
            réalisations
          </Link>{' '}
          et le{' '}
          <Link to="/blog" className="font-medium text-[var(--secondary-700)] hover:underline">
            blog
          </Link>{' '}
          (guides PAC, CEE, grands volumes).
        </p>
      </section>

      <section id="pourquoi-effinor" className="scroll-mt-24">
        <h2 className="heading-section mb-4">Pourquoi Effinor (et pas un simple commercial catalogue)</h2>
        <ul className="space-y-3 text-sm text-gray-700 md:text-base">
          <li className="flex gap-2">
            <span className="text-[var(--secondary-600)]" aria-hidden>
              —
            </span>
            <span>
              <strong>Approche technique</strong> : on commence par le bâtiment et le réseau — pas par une fiche produit.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--secondary-600)]" aria-hidden>
              —
            </span>
            <span>
              <strong>Étude réelle</strong> : hypothèses visibles, risques nommés, fourchettes prudentes.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--secondary-600)]" aria-hidden>
              —
            </span>
            <span>
              <strong>CEE sérieux</strong> : pas de montant annoncé sans cohérence fiche / site —{' '}
              <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
                lire notre page dédiée
              </Link>
              .
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--secondary-600)]" aria-hidden>
              —
            </span>
            <span>
              <strong>Accompagnement complet</strong> : un fil conducteur du premier échange au suivi — y compris quand il faut
              enchaîner sur la{' '}
              <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
                déstratification
              </Link>{' '}
              ou l’
              <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
                équilibrage hydraulique
              </Link>
              .
            </span>
          </li>
        </ul>
      </section>

      <section id="pac-objections-decideurs" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Objections fréquentes — décideurs B2B</h2>
        <p className="mb-5 max-w-3xl text-sm text-gray-600">
          Réponses courtes. Si l’une d’elles vous bloque, c’est souvent le bon moment pour un échange technique cadré (
          <Link to="/contact" onClick={midPrimary('pac_objections')} className="font-medium text-[var(--secondary-700)] hover:underline">
            contact
          </Link>
          ).
        </p>
        <dl className="space-y-4 text-sm text-gray-800 md:space-y-5 md:text-base">
          <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="font-semibold text-gray-900">Budget / capex</dt>
            <dd className="mt-1.5 leading-relaxed">
              On décompose études, matériel, réseau, aléas et reprises — pas une ligne « fourniture posée » qui explose au
              chantier.
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="font-semibold text-gray-900">ROI & rentabilité</dt>
            <dd className="mt-1.5 leading-relaxed">
              Pas de retour en X mois sans conso et hypothèses d’usage. On lit d’abord les MWh et l’opex sur un horizon
              réaliste — le reste est du storytelling.
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="font-semibold text-gray-900">Perturbation / activité</dt>
            <dd className="mt-1.5 leading-relaxed">
              Phasage, reprises, fenêtres d’intervention : négociés avec l’exploitant — pas imposés par un planning
              fournisseur.
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="font-semibold text-gray-900">Risque technique</dt>
            <dd className="mt-1.5 leading-relaxed">
              Réseau, élec disponible, acoustique, appoint : identifiés avant commande. Éviter le « on verra au chantier »
              qui coûte cher en retards et litiges.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">CEE — incertitude</dt>
            <dd className="mt-1.5 leading-relaxed">
              Un montant se défend quand la fiche, les preuves et le périmètre chantier sont alignés — voir{' '}
              <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
                notre page CEE
              </Link>
              . Sinon, on budgetise sans CEE et on les traite comme un bonus défendable.
            </dd>
          </div>
        </dl>
      </section>

      <section id="erreurs-projet-pac" className="scroll-mt-24 rounded-2xl border border-red-100 bg-red-50/40 p-6 md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Erreurs fréquentes — et risques si le projet est mal cadré</h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-800 md:text-base">
          Une PAC mal posée coûte deux fois : une fois en investissement, une fois en exploitation. Voici ce qu’on voit
          encore trop souvent.
        </p>
        <ul className="space-y-2.5 text-sm text-gray-800 md:text-base">
          <li>
            <strong>Dimensionnement au doigt mouillé</strong> — sur-puissance (cash immobilisé) ou sous-capacité (régimes
            de marche forcée, usure).
          </li>
          <li>
            <strong>Réseau non équilibré</strong> — la PAC ne répartit pas la chaleur à votre place.{' '}
            <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-800)] hover:underline">
              Équilibrage hydraulique
            </Link>
            .
          </li>
          <li>
            <strong>Étude bâclée</strong> — devis « trois lignes », puis surcoûts et délais au chantier.
          </li>
          <li>
            <strong>Promesses CEE / économies irréalistes</strong> — dossier refusé ou contesté ; crédibilité perdue en
            comité.
          </li>
        </ul>
        <p className="mt-5 text-sm font-semibold text-gray-900">Risques concrets d’un projet bâclé</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-gray-800 md:text-base">
          <li>Garanties fabricant mal tenues (eau, mélange, conditions d’usage).</li>
          <li>Inconfort maintenu : plaintes utilisateurs, image « projet raté ».</li>
          <li>Surfacturation électrique ou renfort non anticipé (GFO / tableau).</li>
          <li>Blocage administratif : preuves CEE insuffisantes — voir notre page{' '}
            <Link to="/cee" className="font-medium text-[var(--secondary-800)] hover:underline">CEE</Link>.
          </li>
        </ul>
      </section>

      <OfferMidCta
        title="Évitez ces erreurs : faites valider votre projet avant d’engager le matériel"
        subtitle="Étude personnalisée · Réponse rapide · Sans engagement"
        onPrimary={midPrimary('pac_mid_after_erreurs')}
        onSecondary={midSecondary('pac_mid_after_erreurs')}
      />
    </div>
  );
};

const PacHub = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <OfferPageLayout
      seo={{
        title:
          'Pompe à chaleur tertiaire & entreprise : remplacer chaudière gaz, réduire facture | Effinor',
        description:
          'Pompe à chaleur B2B : dimensionnement selon surface, rénovation vs neuf, bâtiment mal isolé, PAC vs isolation, air/eau. Remplacement chaudière gaz, étude gratuite, CEE si éligible.',
        keywords:
          'pompe à chaleur tertiaire, pompe à chaleur entreprise, dimensionnement PAC surface, PAC rénovation vs neuf, PAC bâtiment mal isolé, PAC vs isolation, PAC air eau, remplacement chaudière gaz bâtiment, chauffage bâtiment économique, réduction facture énergétique entreprise, PAC copropriété, effinor',
      }}
      serviceSchema={{
        name: 'Pompe à chaleur pour bâtiments tertiaires, industriels et collectifs',
        description:
          'Étude, dimensionnement et accompagnement projet pompe à chaleur avec financement CEE selon éligibilité — Effinor.',
      }}
      breadcrumbs={[
        { to: '/', label: 'Accueil' },
        { to: '/pompe-a-chaleur', label: 'Pompe à chaleur' },
      ]}
      h1="Pompe à chaleur entreprise & bâtiment : stopper la fuite de cash sur le chauffage"
      heroBgImage={IMAGES.hero.pac}
      heroBgImageAlt="Chaufferie et bâtiment professionnel — projet pompe à chaleur"
      eyebrow="Pompe à chaleur — tertiaire, industrie, copropriété"
      heroLead="Chaque mois, une partie de votre budget chauffage part en surconsommation ou en mauvaise distribution — pas seulement en prix de l’énergie. La PAC, quand elle est bien dimensionnée sur votre réseau et votre usage, vise moins de MWh pour le même besoin de confort. Ensuite seulement : financement CEE si l’opération est carrée."
      heroBullets={[
        'Pensée pour décideurs B2B : chiffrage prudent, risques nommés',
        'Lecture réseau + générateur : éviter la PAC « catalogue »',
        'Étude gratuite — réponse rapide après qualification',
      ]}
      heroFootnote="Sans engagement sur la base d’informations sincères · Étude personnalisée · Nous ne promettons pas de montants CEE sans cohérence technique"
      heroCtas={[
        {
          label: 'Obtenir mon étude gratuite',
          to: '/contact',
          kind: 'primary',
          onClick: () => trackCtaStudy({ effinor_source: src, effinor_cta_location: 'hero' }),
        },
        {
          label: 'Être rappelé par un expert',
          to: '/contact',
          kind: 'secondary',
          onClick: () => trackCtaCallback({ effinor_source: src, effinor_cta_location: 'hero' }),
        },
      ]}
      afterHero={
        <div className="space-y-4 md:space-y-5">
          <SegmentationCards />
          <PacProofStrip />
        </div>
      }
      pillarContent={<PacPillarBlocks src={src} />}
      pourQui={{
        title: 'Pour qui ?',
        intro:
          'Cette page s’adresse aux organisations qui achètent du chauffage au MWh et rendent des comptes : pas au « particulier basique », mais aux équipes qui doivent arbitrer investissement, risque et image.',
        items: [
          { label: 'Bailleurs & syndics', text: 'Charges, AG, plaintes : besoin de chiffres et de méthode.' },
          { label: 'Exploitants & facility', text: 'Réduction facture énergétique et continuité d’activité.' },
          { label: 'Industriel & logistique', text: 'Chaudière gaz à remplacer, contraintes de production.' },
          { label: 'Tertiaire & ERP', text: 'Confort, image, chauffage bâtiment économique sur la durée.' },
          { label: 'Dirigeants & directions techniques', text: 'ROI, délais, conformité — sans langue de bois.' },
          { label: 'Responsables énergie / QHSE', text: 'Trajectoire carbone et efficacité — avec preuves.' },
        ],
      }}
      problem={{
        title: 'Le problème : vous payez pour un chauffage qui ne colle plus au bâtiment',
        intro: (
          <>
            Générateur et réseau se lisent ensemble — ou pas. Sinon,{' '}
            <strong>chaque mois le site peut perdre du cash</strong> : surconso pour rattraper un réseau menteur, chaudière
            gaz à bout de course, ou air mal mélangé en grand volume (
            <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
              déstratification
            </Link>
            ).
          </>
        ),
        items: [
          'Facture qui monte, confort moyen : symptôme classique d’un besoin mal couvert.',
          'Remplacement chaudière « urgent » sans coût total (capex + opex + risques).',
          'Réseau qui plombe tout générateur neuf — PAC ou gaz.',
          'CEE bloqués : fiche, preuves ou technique ne tiennent pas la route.',
          'Comité sans chiffres prudents : décisions prises sur des slides optimistes.',
        ],
      }}
      solution={{
        title: 'La solution : une PAC calée sur le réel — pas sur un devis catalogue',
        paragraphs: [
          <>
            Nous dimensionnons la <strong>pompe à chaleur</strong> sur puissance utile, températures de distribution,
            calorifère, régulation — pas sur un « watt pour watt » aveugle.
          </>,
          <>
            Le gain sur la facture vient du <strong>rendement global</strong> (production + distribution + pilotage).
            Occupation, métrologie, réseau : sans ça, pas de scénario sérieux.
          </>,
          <>
            Réseau hydraulique déséquilibré ? Nous le disons avant l’achat :{' '}
            <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
              équilibrage hydraulique
            </Link>
            . CEE : cadre sur{' '}
            <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
              la page CEE
            </Link>
            , sans montant magique.
          </>,
        ],
        tagline: 'Moins de MWh gaspillés, un projet présentable en comité.',
        img: IMAGES.inline.pacChaufferie,
        imgAlt: 'Chaufferie pompe à chaleur — ballon tampon et distribution hydraulique',
        imgCaption: 'Exemple d’installation — intégration chaufferie et réseau',
      }}
      buildings={{
        title: 'Typologies de sites souvent concernées',
        items: [
          {
            label: 'Copropriétés & résidentiel collectif',
            text: 'Chauffage collectif, enjeu de charges et de plaintes',
            img: IMAGES.inline.coproprieteImmeuble,
            imgAlt: 'Immeuble collectif — chauffage central',
          },
          {
            label: 'Bureaux & commerces',
            text: 'Pompe à chaleur tertiaire : confort et maîtrise des coûts',
            img: IMAGES.inline.pacChaufferie,
            imgAlt: 'Chaufferie en milieu tertiaire',
          },
        ],
      }}
      benefits={{
        title: 'Bénéfices concrets (ce que le comité peut entendre)',
        items: [
          'Piste de baisse des MWh de chauffage lorsque le remplacement est pertinent et le réseau cohérent',
          'Meilleure prévisibilité : moins de rustines et d’ajustements « à la main »',
          'Image : un projet posé avec hypothèses et risques — pas un pari',
          'Dossier CEE préparé quand l’opération et les preuves sont dans le cadre (voir page CEE)',
          'Passage de relais clair vers maintenance et exploitation',
        ],
      }}
      reassurance={{
        title: 'Ce que nous ne faisons pas (volontairement)',
        items: [
          'Pas de promesse de montant CEE sans lecture de cohérence',
          'Pas d’économies « garanties » en % sans données sérieuses',
          'Pas de dimensionnement catalogue sans lecture de votre réseau',
        ],
      }}
      process={{
        title: 'Comment ça se passe',
        steps: [
          {
            title: 'Analyse & qualification',
            text: 'Données bâtiment, chauffage actuel, occupation, contraintes — pour cadrer un périmètre réaliste.',
          },
          {
            title: 'Étude & scénarios',
            text: 'Comparables prudents, points de vigilance, options réseau / air si besoin.',
          },
          {
            title: 'Préconisation & CEE',
            text: 'Alignement équipement / fiche ; liste des preuves attendues pour un dossier défendable.',
          },
          {
            title: 'Installation & mise en service',
            text: 'Coordination avec vos équipes ; minimisation de l’impact activité.',
          },
          {
            title: 'Suivi & clôture',
            text: 'Accompagnement administratif lorsque le projet est engagé et éligible.',
          },
        ],
      }}
      infoBlock={{
        title: 'CEE : financement utile si le projet est propre — pas un cache-misère',
        text: (
          <>
            <p>
              Les certificats d’économies d’énergie peuvent réduire le reste à charge lorsque l’opération correspond à une
              fiche en vigueur et que la traçabilité chantier est tenue. Nous préférons un dossier solide à une promesse
              optimiste : lisez aussi notre page{' '}
              <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
                CEE
              </Link>
              .
            </p>
            <p className="mt-3">
              Grands volumes ou inconfort vertical ? Enchaînez la lecture avec la{' '}
              <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
                déstratification
              </Link>{' '}
              et les{' '}
              <Link to="/realisations" className="font-medium text-[var(--secondary-700)] hover:underline">
                réalisations terrain
              </Link>
              .
            </p>
          </>
        ),
      }}
      faq={{
        title: 'Questions fréquentes — pompe à chaleur bâtiment & entreprise',
        items: [
          {
            q: 'Quel est le coût d’une pompe à chaleur pour un bâtiment tertiaire ou industriel ?',
            a: 'Il dépend de la puissance, du réseau, des travaux annexes et du contexte d’accès. Nous donnons des fourchettes prudentes et les hypothèses — pas un prix « marketing » sans base.',
          },
          {
            q: 'Quel délai pour une étude puis une installation ?',
            a: 'L’étude dépend de la disponibilité des données et d’une éventuelle visite. L’installation peut s’étaler sur plusieurs semaines selon phasage et contraintes site — nous le planifions avec vous.',
          },
          {
            q: 'Quelle rentabilité / ROI peut-on attendre ?',
            a: 'Le ROI se lit en baisse de MWh et en coût total (investissement + exploitation). Nous présentons des ordres de grandeur prudents ; pas de promesse de retour en X mois sans données.',
          },
          {
            q: 'Quel entretien pour une PAC en entreprise ?',
            a: 'Contrôles périodiques, entretien filtre / unité extérieure selon fabricant, veille sur alarmes et courbes. Nous intégrons ces points dès la préconisation.',
          },
          {
            q: 'Quelle durée de vie ?',
            a: 'Souvent de l’ordre de 15 ans et plus selon usage, qualité d’eau / entretien et environnement — à nuancer par site.',
          },
          {
            q: 'Pompe à chaleur et CEE : comment ça marche ?',
            a: 'Si votre projet correspond à une opération standardisée et que les preuves sont réunies, une partie peut être financée via les CEE. Nous vérifions la cohérence avant d’avancer sur le dossier.',
          },
          {
            q: 'Quels types de bâtiments sont les plus concernés ?',
            a: 'Tertiaire, industrie, copropriété avec chaufferie centrale — dès lors que le remplacement du générateur est pertinent et que le réseau est compatible ou adaptable.',
          },
          {
            q: 'Quelles contraintes techniques peuvent tout bloquer ?',
            a: 'Espaces techniques, températures de distribution, disponibilité électrique, intégration régulation — et parfois le réseau hydraulique à rééquilibrer en parallèle.',
          },
          {
            q: 'PAC vs chaudière gaz : que choisir ?',
            a: 'Souvent la PAC gagne sur le coût d’usage lorsque le dimensionnement et le réseau sont sains — mais l’arbitrage doit inclure investissement, maintenance et trajectoire réglementaire.',
          },
          {
            q: 'Pourquoi passer par Effinor plutôt qu’un installateur seul ?',
            a: 'Parce que nous structurons le projet pour le comité : hypothèses, risques, cohérence CEE et réseau — avec un seul interlocuteur du web au suivi.',
          },
          {
            q: 'Comment dimensionner une PAC sans se fier à un ratio m² → kW ?',
            a: 'On part du besoin (conso, occupation, climat, ECS), des températures de distribution et du réseau — pas d’une règle générique. La surface oriente la discussion, elle ne remplace pas l’audit.',
          },
          {
            q: 'PAC air/eau ou autre : comment trancher en B2B ?',
            a: 'Selon contraintes site : place extérieure, acoustique, élec disponible, source eau éventuelle. L’air/eau est souvent le plus lisible en tertiaire ; le reste se décide sur étude, pas sur une fiche.',
          },
        ],
      }}
      afterFaqContent={
        <OfferMidCta
          title="Il vous reste une question ou un site à chiffrer ?"
          subtitle="Étude gratuite · Réponse rapide · Sans engagement"
          onPrimary={() =>
            trackCtaStudy({ effinor_source: src, effinor_cta_location: 'pac_after_faq' })
          }
          onSecondary={() =>
            trackCtaCallback({ effinor_source: src, effinor_cta_location: 'pac_after_faq' })
          }
        />
      }
      realisationsStrip={{
        tokens: ['pac', 'pompe', 'chaleur'],
        title: 'Réalisations terrain — pompe à chaleur',
        limit: 3,
      }}
      urgence={{
        title: 'Coût de l’inaction',
        items: [
          'Saison après saison : MWh et € partent sans projet structuré — c’est du budget non récupérable.',
          'Panne ou pression réglementaire : on choisit vite, on paie le surcoût (matériel, délais, reprises).',
          'Plus le cadrage tarde, plus les options se réduisent (créneaux élec, phasage, enveloppe).',
          'Risque réputationnel : un « gros matériel » posé sans réseau = plaintes et comité qui resservent le dossier.',
        ],
      }}
      internalLinks={{
        title: 'Maillage utile',
        links: [
          { to: '/pompe-a-chaleur#pac-preuve-rapide', label: 'Indicateurs (preuve rapide)' },
          { to: '/pompe-a-chaleur#pac-par-type-batiment', label: 'PAC par type de site' },
          { to: '/pompe-a-chaleur#pac-objections-decideurs', label: 'Objections décideurs' },
          { to: '/pompe-a-chaleur#par-ou-commencer', label: 'Par où commencer ?' },
          { to: '/destratification', label: 'Déstratification (grands volumes)' },
          { to: '/equilibrage-hydraulique', label: 'Équilibrage hydraulique' },
          { to: '/cee', label: 'CEE & financement' },
          { to: '/blog', label: 'Blog — guides PAC & CEE' },
          { to: '/realisations', label: 'Réalisations' },
          { to: '/services-accompagnement', label: 'Accompagnement projet' },
          { to: '/contact', label: 'Contact / étude gratuite' },
        ],
      }}
      ctaLabel="Demander une étude gratuite"
      ctaTo="/contact"
      phoneCta={{ href: 'tel:+33978455063', label: '09 78 45 50 63' }}
      ctaBlock={{
        title: 'Prêt à arrêter de financer un chauffage qui ne vous rend pas le service attendu ?',
        description:
          'Décrivez votre bâtiment (tertiaire, industrie, copropriété), votre chauffage actuel et votre objectif. Nous revenons vers vous avec une suite d’étapes claire — étude gratuite, sans engagement, réponse rapide après qualification.',
      }}
    />
  );
};

export default PacHub;
