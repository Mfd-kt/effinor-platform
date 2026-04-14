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
      to: '/destratification/tertiaire',
      title: 'Déstratification tertiaire',
      text: 'Retail, bureaux, sport, halls à forte hauteur',
      cta: 'Voir le détail tertiaire',
      img: IMAGES.inline.gymnaseSalleSport,
      imgAlt: 'Grand volume tertiaire — déstratification',
    },
    {
      to: '/destratification/industriel',
      title: 'Déstratification industrielle',
      text: 'Entrepôts, ateliers, production & logistique',
      cta: 'Voir le détail industriel',
      img: IMAGES.inline.destratInstallation,
      imgAlt: 'Installation déstratificateur — site industriel',
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

/** Accroche mémorable — juste sous les cartes de segmentation */
const DestratHook = () => {
  const location = useLocation();
  const hookSrc = inferEffinorSourceFromPath(location.pathname);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md md:p-5">
      <p className="text-lg font-bold leading-snug text-gray-900 md:text-xl lg:text-2xl">
        Vous ne chauffez pas votre bâtiment : vous chauffez le plafond.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">
        Tant que l’air chaud reste en strates, le générateur travaille pour un volume qui ne correspond pas à l’occupation
        réelle au sol.
      </p>
      <Link
        to="/contact"
        onClick={() =>
          trackCtaStudy({ effinor_source: hookSrc, effinor_cta_location: 'destrat_micro_hook' })
        }
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--secondary-600)] hover:underline"
      >
        Vérifier si votre site est concerné
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

const DestratProofStrip = () => (
  <section
    id="destrat-preuve-rapide"
    aria-label="Indicateurs observés sur projets de déstratification"
    className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm md:p-5"
  >
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Levier : la chaleur est déjà produite — elle est mal répartie
    </p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold tabular-nums text-[var(--secondary-800)] md:text-xl">8–25 %</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          MWh chauffage — ordre de grandeur fréquent quand la stratification était le goulot.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">Sol</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Moins d’écart vertical : le thermostat redevient lisible pour les équipes au poste.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">ROI</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Souvent parmi les plus courts des leviers « grand volume » — capex modéré vs MWh perdus.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">CEE</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Possible si fiche + preuves tiennent — pas un substitut à une étude sérieuse.
        </p>
      </div>
    </div>
    <p className="mt-3 text-xs text-slate-600">
      <a href="#destrat-resultats-observes" className="font-medium text-[var(--secondary-700)] hover:underline">
        Détail méthode et limites
      </a>
      {' '}
      — pas de pourcentage garanti sans hypothèses site.
    </p>
  </section>
);

const DestratPillarBlocks = ({ src }) => {
  const midPrimary = (loc) => () =>
    trackCtaStudy({ effinor_source: src, effinor_cta_location: loc });
  const midSecondary = (loc) => () =>
    trackCtaCallback({ effinor_source: src, effinor_cta_location: loc });

  const MicroCta = ({ label, ctaLocation }) => (
    <Link
      to="/contact"
      onClick={midPrimary(ctaLocation)}
      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--secondary-600)] hover:underline"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );

  const microBlocks = [
    {
      id: 'destrat-segment-logistique',
      h: 'Déstratification entrepôt logistique',
      p: 'Quais ouverts, allées, racks : l’occupation est basse, le plafond est haut. Sans mélange d’air, le chauffage « tient » la consigne au sol en surproduisant en hauteur — vous payez des MWh qui ne servent pas l’activité réelle.',
      b: 'Moins de surconsommation pour obtenir le même ressenti au quai et en picking.',
      link: { to: '/destratification/industriel', label: 'Page industriel / logistique' },
    },
    {
      id: 'destrat-segment-industriel',
      h: 'Déstratification bâtiment industriel',
      p: (
        <>
          Ateliers, lignes, zones chaudes vs zones peu occupées : la stratification masque un confort inégal. Avant de
          changer de générateur, on vérifie si la chaleur est déjà là mais mal distribuée — lien avec une future{' '}
          <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
            PAC
          </Link>{' '}
          seulement si le levier air est cadré.
        </>
      ),
      b: 'Priorisation technique : déstratifier d’abord quand le volume le impose.',
      link: { to: '/contact', label: 'Étude sur votre atelier' },
    },
    {
      id: 'destrat-segment-gym-erp',
      h: 'Déstratification gymnase et ERP',
      p: 'Occupation basse (sport, spectacles), plafond élevé, parfois ventilation forte : la stratification est marquée. Les déstratificateurs sont dimensionnés avec les flux (portes, désenfumage) — pas en copier-coller d’une salle à l’autre.',
      b: 'Confort utilisateurs et image du site sans exploser la conso pour « chauffer le vide ».',
      link: { to: '/destratification/tertiaire', label: 'Détail tertiaire / ERP' },
    },
    {
      id: 'destrat-segment-tertiaire-hauteur',
      h: 'Déstratification tertiaire grande hauteur',
      p: 'Open space, halls, showrooms : le ressenti au poste ne suit pas ce que la chaufferie débite. Le mélange d’air rapproche la température utile du point de mesure — et réduit la tentation de monter les consignes.',
      b: 'Prévisibilité pour le facility : moins de réglages compensatoires.',
      link: { to: '/equilibrage-hydraulique', label: 'Et si le souci est aussi hydraulique ?' },
    },
    {
      id: 'destrat-segment-hangar',
      h: 'Déstratification hangar et stockage',
      p: 'Volumes très larges, charges ponctuelles, parfois faible occupation continue : le risque est de chauffer une masse d’air qui ne profite à personne au sol. On dimensionne avec la hauteur libre, les ouvertures et le mode de chauffage.',
      b: 'MWh mieux alignés sur les zones réellement utilisées.',
      link: { to: '/realisations', label: 'Voir des chantiers comparables' },
    },
  ];

  const segmentNav = [
    { id: 'destrat-segment-logistique', label: 'Logistique' },
    { id: 'destrat-segment-industriel', label: 'Industriel' },
    { id: 'destrat-segment-gym-erp', label: 'Gymnase / ERP' },
    { id: 'destrat-segment-tertiaire-hauteur', label: 'Tertiaire haut' },
    { id: 'destrat-segment-hangar', label: 'Hangar / stockage' },
  ];

  return (
    <div className="space-y-12 md:space-y-14">
      <section id="destrat-ce-qui-se-passe" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-3 text-gray-900">Ce qui se passe vraiment dans votre bâtiment</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base">
          L’air chaud est <strong>moins dense</strong> : il monte. Au-dessus d’environ 4–5 m de hauteur libre, on observe
          souvent un <strong>gradient vertical</strong> : plusieurs degrés entre le niveau occupé et le sous-face de
          toiture. Le capteur ou le thermostat est au niveau humain : il « demande » encore de la production alors qu’une
          partie de la chaleur est déjà stockée <strong>là où personne ne travaille</strong>.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-gray-700 md:text-base">
          Côté énergie, ce n’est pas une « optimisation » manquante : c’est un <strong>déséquilibre thermique</strong> — des
          MWh qui montent en hauteur au lieu de servir le ressenti au sol. D’où la facture qui grimpe sans confort
          proportionnel.
        </p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-gray-800 md:text-base">
          <li>Écart haut/bas : confort inégal, plaintes, réglages compensatoires.</li>
          <li>MWh facturés pour maintenir une consigne au sol alors que la chaleur utile s’accumule au plafond.</li>
          <li>Générateur sollicité comme si le besoin était uniforme dans tout le volume — ce qui est faux en grand espace.</li>
        </ul>
        <p className="mt-4">
          <MicroCta label="Faire cadrer le constat sur votre volume" ctaLocation="destrat_micro_apres_physique" />
        </p>
      </section>

      <section
        id="destrat-exemple-entrepot"
        className="scroll-mt-24 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 md:p-6"
      >
        <h3 className="text-base font-bold text-gray-900 md:text-lg">Exemple concret — nef logistique / industriel</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">
          Une nef de <strong>10 à 12 m</strong> sous bardeau, chauffage par soufflage ou radiants en périphérie, activité au
          sol (quais, picking). Sans mélange d’air, le gradient vertical peut atteindre <strong> plusieurs kelvins</strong>{' '}
          entre le sol et la zone haute — les ordres de grandeur varient selon ouvertures, débits et inertie. Le site
          « tient » une température au sol en <strong>suralimentant</strong> le générateur : vous payez des MWh qui
          réchauffent surtout le haut du volume.
        </p>
        <p className="mt-2 text-sm text-gray-700 md:text-base">
          Les déstratificateurs ne remplacent pas la physique : ils <strong>mélangent</strong> l’air pour rapprocher la
          chaleur du niveau utile — sans promesse miracle si le levier n’est pas le bon.
        </p>
        <p className="mt-4">
          <MicroCta label="Parler de votre nef avec un technicien" ctaLocation="destrat_micro_apres_exemple" />
        </p>
      </section>

      <section id="destrat-pac-combo" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-3 text-gray-900">Quand coupler déstratification et pompe à chaleur ?</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base">
          La <strong>PAC</strong> change la façon de produire la chaleur ; la déstratification change la façon dont elle{' '}
          <strong>se répartit dans l’air</strong>. Si le volume dilue la chaleur en hauteur, une PAC neuve peut continuer à
          « pousser » des MWh dans un milieu mal mélangé —{' '}
          <strong>même générateur performant, confort et facture peuvent rester mauvais</strong>.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-gray-700 md:text-base">
          Ordre de raisonnement courant : <strong>identifier le goulot</strong> (stratification majeure vs réseau hydraulique
          vs générateur obsolète). Souvent : déstratifier ou traiter l’air quand c’est le levier dominant — puis arbitrer un
          remplacement de générateur (
          <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
            voir la page pompe à chaleur
          </Link>
          ) lorsque le dimensionnement et le réseau le justifient.
        </p>
        <p className="mt-4">
          <MicroCta label="Demander un ordre de priorité sur votre site" ctaLocation="destrat_micro_apres_pac_combo" />
        </p>
      </section>

      <section id="destrat-micro-longue-traine" className="scroll-mt-24">
        <h2 className="heading-section mb-2 md:mb-4">
          Déstratification selon votre type de volume
        </h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-600 md:text-base">
          Même principe physique, contextes différents. Quand le chauffage est dimensionné ailleurs (
          <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
            pompe à chaleur
          </Link>
          ,{' '}
          <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
            réseau hydraulique
          </Link>
          ), on enchaîne dans le bon ordre.
        </p>
        <nav
          aria-label="Accès rapide par type de site"
          className="mb-6 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:p-4"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Aller au détail</p>
          <ul className="flex flex-wrap gap-2">
            {segmentNav.map((seg) => (
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
          {microBlocks.map((bl) => (
            <article
              key={bl.id}
              id={bl.id}
              className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 md:text-xl">{bl.h}</h3>
              <div className="mt-2 text-sm leading-relaxed text-gray-700 md:text-base">{bl.p}</div>
              <p className="mt-3 text-sm font-medium text-[var(--secondary-800)]">
                Bénéfice concret : {bl.b}
              </p>
              <Link
                to={bl.link.to}
                onClick={midPrimary(`destrat_micro_${bl.id}`)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--secondary-600)] hover:underline"
              >
                {bl.link.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        id="destrat-perte-chaleur"
        className="scroll-mt-24 rounded-2xl border border-amber-200/90 bg-amber-50/60 p-6 md:p-8"
      >
        <h2 className="heading-section mb-3 text-gray-900">
          Combien de chaleur perdez-vous aujourd’hui ?
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-800 md:text-base">
          Vous ne « optimisez » pas un chauffage :{' '}
          <strong>vous chauffez souvent le plafond, pas le volume utile</strong>. L’air chaud monte ; le thermostat au sol
          demande encore plus de production pour compenser — sans que la chaleur reste là où travaillent les gens.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-gray-800 md:text-base">
          Ce n’est pas une métaphore : c’est de l’énergie facturée qui ne crée pas de confort au bon niveau.
        </p>
        <p className="mt-4">
          <MicroCta label="Chiffrer la piste sur votre bâtiment" ctaLocation="destrat_micro_perte_chaleur" />
        </p>
        <p className="mt-5 text-sm font-semibold text-gray-900">Conséquences concrètes</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-gray-800 md:text-base">
          <li>MWh de chauffage qui montent alors que le sol reste frais ou inégal.</li>
          <li>Consignes relevées pour « tenir » — gaspillage chaque heure de fonctionnement.</li>
          <li>Plaintes au poste de travail alors que la facture grimpe.</li>
          <li>Générateur et réseau sollicités au-delà du besoin réel si le mélange d’air est absent.</li>
          <li>Projets CEE fragiles si on promet des % sans mesure ni contexte — voir{' '}
            <Link to="/cee" className="font-medium text-[var(--secondary-800)] hover:underline">CEE</Link>.
          </li>
        </ul>
      </section>

      <section
        id="destrat-resultats-observes"
        className="scroll-mt-24 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-6 md:p-8"
      >
        <h2 className="heading-section mb-2 text-gray-900">Résultats observés sur nos chantiers</h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-700 md:text-base">
          Fourchettes issues de dossiers où le dimensionnement et le site ont été pris au sérieux —{' '}
          <strong>pas des promesses catalogue</strong>. Votre bâtiment peut s’écarter si les flux ou le chauffage sont le
          vrai problème structurel.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Économies énergétiques</span>
            <p className="mt-1.5 leading-relaxed">
              <strong>8–25 %</strong> de MWh chauffage fréquents lorsque la stratification dominait ; au-delà si le site était
              extrêmement déséquilibré — à confirmer par données.
            </p>
          </li>
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Confort</span>
            <p className="mt-1.5 leading-relaxed">
              Réduction des écarts haut/bas et des plaintes « trop froid au sol » lorsque le mélange était le levier
              manquant.
            </p>
          </li>
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Délai de retour</span>
            <p className="mt-1.5 leading-relaxed">
              Souvent <strong>12 à 36 mois</strong> en ordre de grandeur sur sites à forte conso et stratification marquée —
              à modéliser avec votre prix de l’énergie et l’hypothèse de baisse retenue.
            </p>
          </li>
        </ul>
        <p className="mt-4 text-xs text-gray-600">
          Exemples terrain :{' '}
          <Link to="/realisations" className="font-medium text-[var(--secondary-700)] hover:underline">
            réalisations
          </Link>
          , analyses sur le{' '}
          <Link to="/blog" className="font-medium text-[var(--secondary-700)] hover:underline">
            blog
          </Link>
          .
        </p>
      </section>

      <OfferMidCta
        title="Valider le levier sur votre volume avant d’investir ailleurs"
        subtitle="Étude gratuite · Sans engagement · Réponse rapide après qualification"
        onPrimary={midPrimary('destrat_mid_after_resultats')}
        onSecondary={midSecondary('destrat_mid_after_resultats')}
      />

      <section id="destrat-erreurs-courantes" className="scroll-mt-24 rounded-2xl border border-red-100 bg-red-50/40 p-6 md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Erreurs fréquentes sur un projet de déstratification</h2>
        <ul className="space-y-2.5 text-sm text-gray-800 md:text-base">
          <li>
            <strong>Mauvais dimensionnement</strong> — nombre ou type d’unités sans lecture des flux (quais, portes,
            extraction).
          </li>
          <li>
            <strong>Mauvais positionnement</strong> — zones mortes, recirculation inefficace, bruit ou accès non anticipés.
          </li>
          <li>
            <strong>Ignorer l’air</strong> — ventilation, désenfumage, ouvertures : le mélange ne remplace pas une analyse
            des flux.
          </li>
          <li>
            <strong>Équipement bas de gamme</strong> — rendement électrique, service, pièces : le coût total se paie en
            maintenance et en arrêts.
          </li>
        </ul>
        <p className="mt-5 text-sm font-semibold text-gray-900">Risques réels</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-gray-800 md:text-base">
          <li>Pas d’économie mesurable : capex engagé pour un confort inchangé.</li>
          <li>Inconfort persistant : plaintes et arbitrage « on monte la consigne ».</li>
          <li>Conflit avec la ventilation ou la sécurité incendie si non intégré en amont.</li>
          <li>Dossier CEE contesté si promesses et réalité chantier divergent.</li>
        </ul>
      </section>

      <section id="destrat-cas-typiques" className="scroll-mt-24">
        <h2 className="heading-section mb-4">Situations typiques que nous rencontrons</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {[
            {
              t: 'Froid au sol, chaud sous plafond',
              d: 'Écart vertical fort : les équipes se couvrent pendant que le chauffage « tourne ».',
            },
            {
              t: 'Plaintes utilisateurs',
              d: 'RH / QHSE sollicités : le problème est visible avant la facture détaillée.',
            },
            {
              t: 'Facture de chauffage qui grimpe',
              d: 'MWh en hausse sans changement d’usage : la stratification fait partie des suspects à éliminer.',
            },
            {
              t: 'Grand volume peu efficace',
              d: 'Entrepôt, hall, gymnase : beaucoup de m³ pour peu d’occupation utile au bon niveau.',
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
      </section>

      <section id="destrat-objections-decideurs" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Objections fréquentes — décideurs B2B</h2>
        <p className="mb-5 max-w-3xl text-sm text-gray-600">
          Réponses courtes. Bloqué sur un point ?{' '}
          <Link to="/contact" onClick={midPrimary('destrat_objections')} className="font-medium text-[var(--secondary-700)] hover:underline">
            Un échange technique
          </Link>{' '}
          suffit souvent à trancher.
        </p>
        <dl className="space-y-4 text-sm text-gray-800 md:space-y-5 md:text-base">
          <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="font-semibold text-gray-900">Coût vs économies</dt>
            <dd className="mt-1.5 leading-relaxed">
              Le capex se compare aux MWh gaspillés sur 3–5 ans — pas au slogan « économies d’énergie ». Nous chiffrons avec
              des hypothèses explicites.
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="font-semibold text-gray-900">Perturbation à l’installation</dt>
            <dd className="mt-1.5 leading-relaxed">
              Phasage, créneaux, nacelle : cadrés avec l’exploitant. Le coût d’un arrêt mal anticipé dépasse souvent celui
              d’une semaine de coordination.
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <dt className="font-semibold text-gray-900">Doutes sur l’efficacité</dt>
            <dd className="mt-1.5 leading-relaxed">
              La physique est la même ; le résultat dépend du dimensionnement. Si le site n’est pas éligible, nous le disons
              avant commande.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Compatibilité avec l’existant</dt>
            <dd className="mt-1.5 leading-relaxed">
              Les déstratificateurs complètent chauffage et souvent une{' '}
              <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
                PAC
              </Link>
              . Incompatibilités rares si l’étude intègre élec, points d’accroche et régulation — pas le catalogue seul.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Incertitude CEE</dt>
            <dd className="mt-1.5 leading-relaxed">
              On budgétise le projet sans CEE ; le financement se valide quand la fiche et les preuves sont alignées —{' '}
              <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
                page CEE
              </Link>
              .
            </dd>
          </div>
        </dl>
      </section>

      <section id="destrat-par-ou-commencer" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Par où commencer ?</h2>
        <p className="mb-5 max-w-3xl text-sm text-gray-600 md:text-base">
          Trois étapes — du constat à une mise en œuvre cadrée.
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
              <p className="font-semibold text-gray-900">Analyse rapide</p>
              <p className="mt-1 text-gray-700">
                Hauteur sous plafond, occupation, symptômes (écarts, plaintes), conso si disponible.
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
              <p className="font-semibold text-gray-900">Pré-estimation & levier</p>
              <p className="mt-1 text-gray-700">
                Ordre de grandeur, risques, complémentarité avec{' '}
                <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
                  hydraulique
                </Link>{' '}
                ou générateur.
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
              <p className="font-semibold text-gray-900">Mise en œuvre</p>
              <p className="mt-1 text-gray-700">
                Dimensionnement détaillé, planning, installation — puis suivi si{' '}
                <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">CEE</Link>.
              </p>
            </div>
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/contact"
            onClick={midPrimary('destrat_par_ou_commencer')}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--secondary-500)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--secondary-600)]"
          >
            Demander une étude gratuite
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            onClick={midSecondary('destrat_par_ou_commencer')}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-slate-50"
          >
            Être rappelé
          </Link>
        </div>
      </section>

      <OfferMidCta
        title="Un volume à forte hauteur qui coûte trop cher au sol ?"
        subtitle="Étude personnalisée · Réponse rapide · Sans engagement"
        onPrimary={midPrimary('destrat_mid_final_pillar')}
        onSecondary={midSecondary('destrat_mid_final_pillar')}
      />
    </div>
  );
};

const DestratHub = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <OfferPageLayout
      seo={{
        title:
          'Déstratification air B2B : entrepôt, industrie, gymnase, grand tertiaire — moins de MWh au sol | Effinor',
        description:
          'Chaleur piégée en plafond : déstratification entrepôt logistique, industriel, gymnase, ERP, hangar. Économies réalistes, étude gratuite. CEE si éligible. Liens PAC, hydraulique.',
        keywords:
          'déstratification entrepôt logistique, déstratification industrielle, déstratification gymnase, déstratification ERP, déstratification tertiaire grande hauteur, déstratification hangar, stratification thermique, déstratificateur air, chauffage grand volume, CEE déstratification, effinor',
      }}
      serviceSchema={{
        name: 'Déstratification d’air pour bâtiments à grands volumes (industriel, logistique, tertiaire)',
        description:
          'Étude, dimensionnement et mise en œuvre de déstratificateurs pour homogénéiser la température et réduire la surconsommation de chauffage — Effinor.',
      }}
      breadcrumbs={[
        { to: '/', label: 'Accueil' },
        { to: '/destratification', label: 'Déstratification' },
      ]}
      h1="Vous chauffez le plafond : la chaleur utile est déjà dans le bâtiment"
      heroBgImage={IMAGES.hero.destrat}
      heroBgImageAlt="Entrepôt grand volume — déstratification de l’air"
      eyebrow="Déstratification — grands volumes B2B"
      heroLead="Au-delà d’environ 4–5 m de hauteur, l’air chaud monte : vous payez des MWh qui ne réchauffent pas le bon niveau. Les déstratificateurs mélangent l’air pour rabattre la chaleur vers les zones occupées — sans inventer une production supplémentaire. Souvent un levier à ROI court quand la stratification est le goulot."
      heroBullets={[
        'Problème clair : chaleur gaspillée en hauteur, pas « optimisation » vague',
        'Dimensionnement : volume, flux d’air, occupation — pas un nombre magique au catalogue',
        'Étude gratuite : chiffrage prudent avant engagement matériel',
      ]}
      heroFootnote="Sans engagement · Pas de % garanti sans hypothèses site · CEE si dossier cohérent"
      heroCtas={[
        {
          label: 'Demander une étude gratuite',
          to: '/contact',
          kind: 'primary',
          onClick: () => trackCtaStudy({ effinor_source: src, effinor_cta_location: 'hero' }),
        },
        {
          label: 'Être rappelé',
          to: '/contact',
          kind: 'secondary',
          onClick: () => trackCtaCallback({ effinor_source: src, effinor_cta_location: 'hero' }),
        },
      ]}
      afterHero={
        <div className="space-y-4 md:space-y-5">
          <SegmentationCards />
          <DestratHook />
          <DestratProofStrip />
        </div>
      }
      pillarContent={<DestratPillarBlocks src={src} />}
      pourQui={{
        title: 'Pour qui ?',
        intro:
          'Dès qu’un volume chauffé dépasse quelques mètres de hauteur, la stratification peut faire perdre du cash chaque mois. Cette page s’adresse aux décideurs qui achètent du chauffage au MWh et doivent justifier un investissement.',
        items: [
          { label: 'Logistique & entrepôts', text: 'Quais, stockage, nefs : écart haut/bas et surconso pour tenir au sol.' },
          { label: 'Industrie & ateliers', text: 'Lignes basses, toiture haute : confort et conso à aligner.' },
          { label: 'Tertiaire & retail', text: 'Halls, open space : image et plaintes au poste.' },
          { label: 'Sport & ERP', text: 'Gymnases, salles : occupation basse, plafond élevé.' },
          { label: 'Exploitants & facility', text: 'Parc de sites : priorisation et preuves par bâtiment.' },
          { label: 'Directions techniques / énergie', text: 'ROI et risques nommés pour le comité.' },
        ],
      }}
      problem={{
        title: 'Le problème : vous payez pour chauffer l’air qui ne sert pas au sol',
        intro: (
          <>
            Tant que la chaleur reste en strates, <strong>vous gaspillez de la chaleur à chaque heure de chauffage</strong> :
            le thermostat au sol ne « voit » pas le surplus en plafond. Ce n’est pas qu’une question de confort — c’est de la
            conso facturée pour compenser un défaut de mélange. À côté, d’autres sujets peuvent s’ajouter (
            <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
              générateur
            </Link>
            ,{' '}
            <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
              hydraulique
            </Link>
            ) — l’ordre des leviers compte.
          </>
        ),
        items: [
          'Air chaud piégé sous plafond pendant que le sol reste frais ou inégal',
          'Surconsommation pour « tenir » une consigne qui ne reflète pas le haut du volume',
          'Plaintes au poste alors que la facture grimpe — symptôme typique des grands volumes',
          'Régulation qui masque le problème : plus de MWh sans meilleur ressenti',
          'Dossiers CEE fragiles si on promet des % sans mesure ni contexte réel',
        ],
        img: IMAGES.inline.destratSchema,
        imgAlt: 'Schéma stratification thermique sans et avec déstratificateur',
        imgCaption: 'Sans mélange : la chaleur reste en hauteur. Avec déstratification : température plus homogène au niveau occupé.',
      }}
      solution={{
        title: 'La solution : mélanger l’air pour utiliser la chaleur déjà payée',
        paragraphs: [
          <>
            Les déstratificateurs créent un <strong>mouvement d’air contrôlé</strong> qui rabat la chaleur vers les zones
            occupées. Vous ne « créez » pas d’énergie : vous récupérez ce que le chauffage a déjà mis dans le volume.
          </>,
          <>
            Le dimensionnement dépend du volume, de la hauteur, des flux (portes, quais,{' '}
            <Link to="/blog" className="font-medium text-[var(--secondary-700)] hover:underline">
              ventilation
            </Link>
            ) et du mode de chauffage — raison pour laquelle nous partons de données et de terrain, pas d’un tableau
            fournisseur.
          </>,
        ],
        tagline: 'Moins de MWh pour le même ressenti au sol — lorsque la stratification était le levier dominant.',
        img: IMAGES.inline.destratInstallation,
        imgAlt: 'Technicien installant un déstratificateur en hauteur',
        imgCaption: 'Pose en hauteur — intégration selon contraintes de site',
      }}
      buildings={{
        title: 'Typologies fréquentes',
        items: [
          {
            label: 'Entrepôts logistiques',
            text: 'Stratification marquée, quais ouverts, grandes nefs',
            img: IMAGES.inline.entrepotLogistique,
            imgAlt: 'Entrepôt logistique haute charpente',
          },
          {
            label: 'Ateliers & production',
            text: 'Zones occupées basses, toiture élevée',
            img: IMAGES.inline.atelierProductionIndustriel,
            imgAlt: 'Atelier industriel grand volume',
          },
          {
            label: 'Gymnases & halls',
            text: 'Occupation basse, besoin de confort homogène',
            img: IMAGES.inline.gymnaseSalleSport,
            imgAlt: 'Gymnase grand volume',
          },
          {
            label: 'Bâtiments mixtes',
            text: 'Plusieurs usages, contraintes d’exploitation variables',
            img: IMAGES.inline.batimentIndustrielMixte,
            imgAlt: 'Bâtiment industriel mixte',
          },
        ],
      }}
      benefits={{
        title: 'Bénéfices concrets (ce que le comité peut entendre)',
        items: [
          'Moins de MWh pour un ressenti équivalent au sol lorsque la stratification était le goulot',
          'Homogénéité thermique : moins de plaintes « trop froid en bas »',
          'Projet lisible : nombre d’unités, implantation, phasage — pas une ligne floue',
          'Souvent compatible avec une activité en continu (créneaux, nacelle)',
          'CEE lorsque l’opération et les preuves sont dans le cadre — voir financement ci-dessous',
        ],
      }}
      process={{
        title: 'Comment ça se passe',
        steps: [
          {
            title: 'Qualification & données',
            text: 'Hauteur, occupation, symptômes, conso si dispo — pour cadrer si le levier « air » est prioritaire.',
          },
          {
            title: 'Étude & dimensionnement',
            text: 'Unités, emplacements, intégration aux flux existants ; scénarios prudents.',
          },
          {
            title: 'Installation & suivi',
            text: 'Intervention coordonnée ; clôture dossier CEE si le projet est engagé et éligible.',
          },
        ],
      }}
      infoBlock={{
        title: 'CEE : aide possible si le projet est proprement cadré',
        text: (
          <>
            <p>
              La déstratification peut entrer dans des opérations standardisées selon le contexte. Nous vérifions la
              cohérence avec la fiche en vigueur et la traçabilité chantier avant d’avancer sur un montant — détail sur la{' '}
              <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
                page CEE
              </Link>
              .
            </p>
            <p className="mt-3">
              Enchaînements fréquents : générateur (
              <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
                PAC
              </Link>
              ),{' '}
              <Link to="/equilibrage-hydraulique" className="font-medium text-[var(--secondary-700)] hover:underline">
                équilibrage hydraulique
              </Link>
              , preuves sur nos{' '}
              <Link to="/realisations" className="font-medium text-[var(--secondary-700)] hover:underline">
                réalisations
              </Link>
              .
            </p>
          </>
        ),
      }}
      reassurance={{
        title: 'Transparence',
        items: [
          'Pas de promesse de pourcentage « garanti » sans hypothèses et lecture site',
          'Si le levier n’est pas la stratification, nous le disons avant devis',
          'Interlocuteur unique du premier échange au suivi',
        ],
      }}
      faq={{
        title: 'Questions fréquentes — déstratification grands volumes',
        items: [
          {
            q: 'La déstratification est-elle vraiment efficace ?',
            a: 'Oui lorsque la stratification thermique est un goulot : écart vertical important et occupation basse. Sinon, d’autres leviers (régulation, hydraulique, générateur) peuvent primer — nous le signalons.',
          },
          {
            q: 'Quelles économies peut-on attendre ?',
            a: 'Sur des sites où la stratification dominait, des baisses de l’ordre de 8 à 25 % de MWh chauffage sont fréquentes — à confirmer par votre conso et le contexte. Pas de garantie sans données.',
          },
          {
            q: 'Combien de temps pour installer ?',
            a: 'Selon accès, hauteur et phasage : de quelques jours à des interventions étalées sur plusieurs créneaux. Les contraintes nacelle / sécurité sont cadrées dès l’étude.',
          },
          {
            q: 'Quel entretien pour les déstratificateurs ?',
            a: 'Contrôles périodiques, propreté des pales / filtres selon modèle, écoute bruit et vibrations. Prévu dès la préconisation pour budgétiser l’opex.',
          },
          {
            q: 'Quels types de bâtiments sont concernés ?',
            a: 'Entrepôts, industriels, gymnases, halls tertiaires, hangars — dès que la hauteur et l’occupation créent une stratification significative (souvent au-delà de ~4–5 m).',
          },
          {
            q: 'Y a-t-il une limite de hauteur ?',
            a: 'Pas une limite fixe : au-delà de quelques mètres le phénomène devient généralement pertinent à étudier. Très bas plafond : autres leviers peuvent être prioritaires.',
          },
          {
            q: 'Quel ROI ou délai de retour ?',
            a: 'Souvent parmi les plus courts des investissements « grand volume » — typiquement des ordres de grandeur 12–36 mois sur sites à forte conso et stratification marquée, selon prix de l’énergie et hypothèse de baisse.',
          },
          {
            q: 'Compatibilité avec pompe à chaleur ou chaudière ?',
            a: 'Oui : la déstratification agit sur la distribution de la chaleur dans l’air. Le générateur doit être dimensionné correctement en amont ; les deux sujets se traitent dans l’ordre logique.',
          },
          {
            q: 'Et la ventilation / extracteurs ?',
            a: 'Ils font partie du dimensionnement : il faut intégrer les flux pour ne pas travailler contre un système existant.',
          },
          {
            q: 'Comment se passe le dossier CEE ?',
            a: 'Selon votre situation, des preuves sont attendues (caractéristiques, photos, factures). Nous alignons promesse et fiche avant d’engager un chiffrage financement.',
          },
        ],
      }}
      afterFaqContent={
        <OfferMidCta
          title="Il vous reste un volume à qualifier ou une question bloquante ?"
          subtitle="Étude gratuite · Réponse rapide · Sans engagement"
          onPrimary={() =>
            trackCtaStudy({ effinor_source: src, effinor_cta_location: 'destrat_after_faq' })
          }
          onSecondary={() =>
            trackCtaCallback({ effinor_source: src, effinor_cta_location: 'destrat_after_faq' })
          }
        />
      }
      realisationsStrip={{
        tokens: ['déstrat', 'destrat', 'stratif'],
        title: 'Réalisations terrain — déstratification',
        limit: 3,
      }}
      urgence={{
        title: 'Coût de l’inaction',
        items: [
          'Chaque saison, des MWh partent en hauteur — budget non récupérable sans levier air',
          'Les plaintes et l’image se dégradent avant que la courbe de conso soit analysée en détail',
          'Plus le projet attend, plus les arbitrages se font sous pression (panne, budget, image)',
        ],
      }}
      internalLinks={{
        title: 'Maillage utile',
        links: [
          { to: '/destratification#destrat-preuve-rapide', label: 'Indicateurs (preuve rapide)' },
          { to: '/destratification#destrat-ce-qui-se-passe', label: 'Ce qui se passe dans le bâtiment' },
          { to: '/destratification#destrat-pac-combo', label: 'Déstratification + PAC' },
          { to: '/destratification#destrat-perte-chaleur', label: 'Perte de chaleur' },
          { to: '/destratification#destrat-par-ou-commencer', label: 'Par où commencer' },
          { to: '/pompe-a-chaleur', label: 'Pompe à chaleur' },
          { to: '/equilibrage-hydraulique', label: 'Équilibrage hydraulique' },
          { to: '/cee', label: 'CEE & financement' },
          { to: '/blog', label: 'Blog — guides & analyses' },
          { to: '/realisations', label: 'Réalisations' },
          { to: '/contact', label: 'Contact / étude gratuite' },
        ],
      }}
      ctaLabel="Demander une étude gratuite"
      phoneCta={{ href: 'tel:+33978455063', label: '09 78 45 50 63' }}
      ctaBlock={{
        title: 'Votre grand volume chauffe le vide avant le sol ?',
        description:
          'Décrivez le site (hauteur, usage, symptômes). Nous revenons avec une suite d’étapes claire — étude gratuite, sans engagement, réponse rapide après qualification.',
      }}
    />
  );
};

export default DestratHub;
