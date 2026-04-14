import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import OfferPageLayout from '@/components/leadgen/OfferPageLayout';
import OfferMidCta from '@/components/leadgen/OfferMidCta';
import { inferEffinorSourceFromPath, trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { IMAGES } from '@/config/images';

const EquilibrageHook = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-md md:p-5">
      <p className="text-lg font-bold leading-snug text-gray-900 md:text-xl lg:text-2xl">
        Votre bâtiment est chauffé — mais le réseau ne distribue pas la chaleur comme il devrait.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">
        Des pièces trop chaudes, d’autres trop froides : ce n’est pas une fatalité. C’est souvent un{' '}
        <strong>déséquilibre hydraulique</strong> invisible sur la facture, visible chez les occupants.
      </p>
      <p className="mt-4 rounded-lg border-l-4 border-[var(--secondary-500)] bg-slate-50 py-3 pl-4 pr-3 text-sm font-semibold leading-snug text-gray-900 md:text-base">
        Dans beaucoup de bâtiments, le problème n’est pas le système de chauffage — c’est la façon dont la chaleur est
        distribuée dans le réseau.
      </p>
      <Link
        to="/contact"
        onClick={() => trackCtaStudy({ effinor_source: src, effinor_cta_location: 'eq_micro_hook' })}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--secondary-600)] hover:underline"
      >
        Faire vérifier mon réseau
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

const EquilibrageProofStrip = () => (
  <section
    id="eq-preuve-rapide"
    className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm md:p-5"
    aria-label="Indicateurs typiques après équilibrage"
  >
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
      Quand le déséquilibre était le goulot — ordres de grandeur observés
    </p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">Confort</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Moins d’écarts entre zones : les occupants ne devraient pas subir des températures « aléatoires ».
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold tabular-nums text-[var(--secondary-800)] md:text-xl">5–15 %</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          MWh chauffage — fourchette fréquente si la surconsommation venait surtout de compensations de réseau.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">Stabilité</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Réseau plus prévisible : moins de réglages « à l’oreille » et d’interventions répétées.
        </p>
      </div>
      <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
        <p className="text-lg font-bold text-gray-900 md:text-xl">Traçabilité</p>
        <p className="mt-1 text-xs leading-snug text-gray-700">
          Rapport avant / après — utile syndic, exploitant,{' '}
          <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">CEE</Link> si éligible.
        </p>
      </div>
    </div>
    <p className="mt-3 text-xs text-slate-600">
      <a href="#eq-resultats-observes" className="font-medium text-[var(--secondary-700)] hover:underline">
        Détail et limites
      </a>
      {' '}
      — pas de % garanti sans diagnostic.
    </p>
  </section>
);

const EquilibragePillarBlocks = ({ src }) => {
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
      id: 'eq-segment-collectif',
      h: 'Équilibrage chauffage collectif',
      p: 'Réseau à plusieurs départs et colonnes : les débits ne se répartissent pas seuls « équitablement ». Sans réglage des organes d’équilibrage, certains circuits tirent trop, d’autres manquent de puissance.',
      b: 'Distribution alignée sur le besoin réel par branche — pas sur le hasard des vannes.',
      link: { to: '/contact', label: 'Diagnostic collectif' },
    },
    {
      id: 'eq-segment-copro',
      h: 'Équilibrage immeuble et copropriété',
      p: 'Plaintes inégales entre logements et étages : le syndic entend « trop chaud / trop froid » alors que la chaufferie tourne. L’équilibrage vise des retours homogènes et des réglages documentés pour l’AG.',
      b: 'Arguments factuels pour le comité : mesures, logique, rapport — pas du bricolage.',
      link: { to: '/contact', label: 'Cadrer un dossier copro' },
    },
    {
      id: 'eq-segment-tertiaire',
      h: 'Équilibrage réseau tertiaire',
      p: 'Bureaux, ERP, sites mixtes : zones avec besoins différents sur un même primaire. Le réseau doit livrer le bon débit là où l’occupation l’exige — sinon on compense par la consigne globale.',
      b: 'Moins de zones « en sur-régime » pour rattraper les autres.',
      link: { to: '/blog', label: 'Lire analyses sur le blog' },
    },
    {
      id: 'eq-segment-radiateurs',
      h: 'Équilibrage circuit radiateurs',
      p: 'Radiateurs en série ou dérivations : si les vannes d’équilibrage ne sont pas coordonnées, le premier sur-alimenté vide le suivant. On intervient sur les organes existants avec mesures de départ / retour.',
      b: 'Un réseau qui se comporte enfin comme un système, pas comme une suite de rustines.',
      link: { to: '/contact', label: 'Demander une étude' },
    },
    {
      id: 'eq-segment-apres-travaux-pac',
      h: 'Équilibrage après travaux ou installation PAC',
      p: (
        <>
          Chaque modification (extension, nouvelle pompe, remplacement de générateur) change les pertes de charge vues
          par les circuits. Une{' '}
          <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
            PAC
          </Link>{' '}
          neuve sur un réseau menteur ne tient pas ses promesses — l’équilibrage est souvent l’étape manquante.
        </>
      ),
      b: 'Cohérence entre générateur et distribution avant de juger le « mauvais rendement ».',
      link: { to: '/pompe-a-chaleur', label: 'PAC puis réseau : lire la page' },
    },
  ];

  return (
    <div className="space-y-12 md:space-y-14">
      <section id="eq-ce-qui-se-passe" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-3 text-gray-900">Ce qui se passe vraiment dans votre réseau</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base">
          L’eau chaude ne se répartit pas « toute seule » équitablement : les circuits les plus courts ou les moins
          résistifs <strong>aspirent</strong> une part disproportionnée du débit. Les autres restent sous-alimentés. Le
          système « compense » en montant les débits ou les températures en tête —{' '}
          <strong>votre installation ne fonctionne pas comme prévu au niveau distribution</strong>, même si la chaufferie
          tourne.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-gray-700 md:text-base">
          <strong>Analogie simple :</strong> plusieurs robinets sur la même canalisation — si l’un est trop ouvert, les
          autres manquent de pression. L’équilibrage hydraulique consiste à <strong>répartir le débit</strong> pour que
          chaque branche reçoive ce qu’elle doit, selon le besoin thermique.
        </p>
        <p className="mt-4">
          <MicroCta label="Poser le diagnostic sur votre site" ctaLocation="eq_micro_apres_physique" />
        </p>
      </section>

      <section id="eq-symptomes" className="scroll-mt-24">
        <h2 className="heading-section mb-4 text-gray-900">Signes que votre chauffage est déséquilibré</h2>
        <p className="mb-5 max-w-3xl text-sm text-gray-600 md:text-base">
          Le problème est souvent <strong>invisible sur un tableau de bord agrégé</strong> — il apparaît en plaintes, en
          facture et en réglages répétés.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              t: 'Pièces trop chaudes ou trop froides',
              d: 'Écarts inexpliqués entre zones pourtant « sur le même réseau ».',
            },
            {
              t: 'Plaintes occupants / locataires',
              d: 'Réclamations qui reviennent sans que le remplacement ponctuel d’un radiateur suffise.',
            },
            {
              t: 'Facture énergétique élevée',
              d: 'MWh qui montent alors qu’on « monte la consigne » pour rattraper les zones froides.',
            },
            {
              t: 'Ajustements constants',
              d: 'Vannes tripotées au fil des années — plus personne ne connaît l’état de référence du réseau.',
            },
            {
              t: 'Après travaux sans rééquilibrage',
              d: 'Extension, nouveaux corps, changement de pompe : l’équilibre initial est rompu.',
            },
            {
              t: 'Après nouvelle PAC ou chaudière',
              d: 'Le générateur est neuf, le confort reste inégal : soupçonner la distribution avant le matériel.',
            },
          ].map((s) => (
            <li
              key={s.t}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-gray-900 text-sm">{s.t}</p>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed md:text-sm">{s.d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5">
          <MicroCta label="Confirmer si ces signes matchent votre site" ctaLocation="eq_micro_symptomes" />
        </p>
      </section>

      <section id="eq-si-vous-etes" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50/90 p-6 shadow-sm ring-1 ring-[var(--secondary-500)]/15 md:p-8">
        <h2 className="heading-section mb-3 text-gray-900">Si vous êtes dans cette situation</h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-700 md:text-base">
          Plusieurs de ces constats à la fois ? Ce n’est pas de la « malchance » thermique : c’est le profil typique d’un{' '}
          <strong>réseau qui ne répartit pas correctement le débit</strong>.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-800 md:text-base">
          <li>Écarts marqués entre pièces, logements ou étages alors que la chaufferie tourne.</li>
          <li>Plaintes qui reviennent après des réglages ponctuels ou des interventions « au cas par cas ».</li>
          <li>Facture ou MWh en hausse sans changement d’usage clair — compensation par la consigne générale.</li>
          <li>Travaux récents (extension, nouveaux corps, nouvelle pompe ou PAC) sans passage sur l’équilibrage global.</li>
          <li>Vannes manipulées depuis des années : plus de référence technique partagée.</li>
        </ul>
        <p className="mt-5 rounded-lg border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-900 md:text-base">
          Conclusion : si au moins trois points vous parlent,{' '}
          <strong>il est raisonnable de soupçonner un déséquilibre hydraulique</strong> — à confirmer par diagnostic et
          mesures, avant de changer de générateur ou d’empiler d’autres rustines.
        </p>
        <p className="mt-4">
          <MicroCta label="Faire valider ce profil sur votre site" ctaLocation="eq_micro_situation" />
        </p>
      </section>

      <section id="eq-avant-apres" className="scroll-mt-24">
        <h2 className="heading-section mb-4 text-gray-900">Avant / après équilibrage (lecture opérationnelle)</h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-600 md:text-base">
          Pas une promesse chiffrée universelle : un <strong>contraste</strong> entre ce qu’on observe trop souvent avant
          intervention et ce que vise un réseau correctement rééquilibré.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50">
                <th className="p-3 font-semibold text-gray-900 md:p-4">Thème</th>
                <th className="p-3 font-semibold text-gray-900 md:p-4">Avant — réseau déséquilibré</th>
                <th className="p-3 font-semibold text-gray-900 md:p-4">Après — équilibrage mené correctement</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="p-3 font-medium text-gray-900 md:p-4">Débits</td>
                <td className="p-3 md:p-4">Certains circuits sur-alimentés, d’autres à la peine.</td>
                <td className="p-3 md:p-4">Répartition alignée sur le besoin par branche — moins de compensation « aveugle ».</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 font-medium text-gray-900 md:p-4">Confort</td>
                <td className="p-3 md:p-4">Écarts forts entre zones ; plaintes difficiles à éteindre.</td>
                <td className="p-3 md:p-4">Les occupants ne devraient pas subir des écarts inexpliqués pour un même réglage d’ambiance.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3 font-medium text-gray-900 md:p-4">Exploitation</td>
                <td className="p-3 md:p-4">Réglages répétés, consigne générale montée pour rattraper le réseau.</td>
                <td className="p-3 md:p-4">Comportement plus stable ; réglages documentés (rapport avant / après).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-gray-900 md:p-4">Énergie</td>
                <td className="p-3 md:p-4">Surconsommation pour compenser la mauvaise distribution.</td>
                <td className="p-3 md:p-4">Piste de baisse de MWh lorsque le déséquilibre était le goulot — fourchettes réalistes après mesure.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          <MicroCta label="Passer ce tableau en revue avec un technicien" ctaLocation="eq_micro_avant_apres" />
        </p>
      </section>

      <section id="eq-pourquoi-ignore" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-3 text-gray-900">Pourquoi ce problème est souvent ignoré</h2>
        <ul className="space-y-3 text-sm text-gray-700 md:text-base">
          <li>
            <strong className="text-gray-900">Invisible sur une facture agrégée</strong> — la chaufferie « fonctionne » ; ce
            sont les débits par branche qui sont en cause. Tant qu’on ne mesure pas, on ne voit qu’un total MWh.
          </li>
          <li>
            <strong className="text-gray-900">Confusion avec le générateur</strong> — on accuse la chaudière ou la{' '}
            <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">PAC</Link> alors
            que la distribution eau est le maillon faible. Risque : remplacer du matériel sans résoudre la cause.
          </li>
          <li>
            <strong className="text-gray-900">Diagnostic partiel</strong> — radiateur changé, vanne serrée sur un palier,
            sans vision globale du réseau. Les symptômes reviennent.
          </li>
          <li>
            <strong className="text-gray-900">Pas le même levier que l’air en grand volume</strong> — en nef, on pense
            parfois à la{' '}
            <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
              déstratification
            </Link>
            ; en collectif hydraulique, le premier réflexe doit être la cohérence des circuits — les deux sujets sont
            distincts.
          </li>
        </ul>
        <p className="mt-4">
          <MicroCta label="Sortir du diagnostic à l’aveugle" ctaLocation="eq_micro_pourquoi_ignore" />
        </p>
      </section>

      <section id="eq-micro-longue-traine" className="scroll-mt-24">
        <h2 className="heading-section mb-2 md:mb-4">Équilibrage hydraulique : intentions de recherche</h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-600 md:text-base">
          À combiner avec les autres leviers quand c’est pertinent :{' '}
          <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
            pompe à chaleur
          </Link>
          ,{' '}
          <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
            déstratification
          </Link>
          ,{' '}
          <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
            CEE
          </Link>
          .
        </p>
        <nav
          aria-label="Accès rapide par thématique"
          className="mb-6 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:p-4"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Aller au détail</p>
          <ul className="flex flex-wrap gap-2">
            {microBlocks.map((bl) => (
              <li key={bl.id}>
                <a
                  href={`#${bl.id}`}
                  className="inline-flex rounded-lg border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-[var(--secondary-400)] hover:bg-white md:text-sm"
                >
                  {bl.h.replace('Équilibrage ', '')}
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
                onClick={midPrimary(`eq_micro_${bl.id}`)}
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
        id="eq-resultats-observes"
        className="scroll-mt-24 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-6 md:p-8"
      >
        <h2 className="heading-section mb-2 text-gray-900">Améliorations observées sur nos interventions</h2>
        <p className="mb-4 max-w-3xl text-sm text-gray-700 md:text-base">
          Fourchettes issues de sites où le <strong>déséquilibre hydraulique</strong> était un levier majeur — pas une
          garantie universelle. Si le générateur est sous-dimensionné ou si un autre problème domine, les ordres de
          grandeur changent.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Confort</span>
            <p className="mt-1.5 leading-relaxed">
              Réduction des écarts de température entre zones — les occupants ne devraient pas vivre des écarts « aléatoires »
              selon l’étage ou le logement.
            </p>
          </li>
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Consommation</span>
            <p className="mt-1.5 leading-relaxed">
              <strong>5–15 %</strong> de MWh chauffage fréquents lorsque la surconsommation venait surtout de compensations
              (consigne, débit) — à confirmer par données site.
            </p>
          </li>
          <li className="rounded-xl border border-white/80 bg-white/90 p-4 text-sm text-gray-800 shadow-sm">
            <span className="font-semibold text-gray-900">Stabilité</span>
            <p className="mt-1.5 leading-relaxed">
              Moins d’aller-retour sur les réglages ; exploitation plus lisible pour la maintenance.
            </p>
          </li>
        </ul>
        <p className="mt-4 text-xs text-gray-600">
          Exemples :{' '}
          <Link to="/realisations" className="font-medium text-[var(--secondary-700)] hover:underline">
            réalisations
          </Link>
          .
        </p>
      </section>

      <OfferMidCta
        title="Valider le levier hydraulique avant de changer de générateur"
        subtitle="Étude gratuite · Sans engagement · Réponse rapide après qualification"
        onPrimary={midPrimary('eq_mid_after_resultats')}
        onSecondary={midSecondary('eq_mid_after_resultats')}
      />

      <section id="eq-erreurs" className="scroll-mt-24 rounded-2xl border border-red-100 bg-red-50/40 p-6 md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Erreurs fréquentes</h2>
        <ul className="space-y-2 text-sm text-gray-800 md:text-base">
          <li>
            <strong>Ignorer l’équilibrage</strong> et compenser par la consigne — facture et plaintes qui persistent.
          </li>
          <li>
            <strong>Installer une PAC ou une chaudière neuve</strong> sans rééquilibrage : on juge le mauvais coupable.
          </li>
          <li>
            <strong>Diagnostic superficiel</strong> — pas de mesures de départ / retour par branche, pas de logique de
            réglage.
          </li>
        </ul>
        <p className="mt-5 text-sm font-semibold text-gray-900">Risques réels</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-gray-800 md:text-base">
          <li>Capex engagé sur le générateur sans gain confort : crédibilité du projet entamée.</li>
          <li>Interventions répétées « au cas par cas » sans traiter la cause systémique.</li>
          <li>Dossiers CEE fragiles si les promesses d’économies ne tiennent pas la route technique.</li>
        </ul>
      </section>

      <section id="eq-quand-faire" className="scroll-mt-24 rounded-2xl border border-amber-200/90 bg-amber-50/60 p-6 md:p-8">
        <h2 className="heading-section mb-3 text-gray-900">Quand faire intervenir l’équilibrage ?</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-800 md:text-base">
          <li>
            <strong>Après installation d’une PAC</strong> ou changement de pompe / générateur : les caractéristiques du
            primaire changent — le réseau doit être re-lu.
          </li>
          <li>
            <strong>Après rénovation ou extension</strong> de réseau, ajout de corps de chauffe ou dérivations.
          </li>
          <li>
            <strong>Quand les plaintes augmentent</strong> sans cause évidente côté occupant.
          </li>
          <li>
            <strong>Quand la facture grimpe</strong> et que l’on monte la consigne pour rattraper des zones froides.
          </li>
        </ul>
        <p className="mt-4">
          <MicroCta label="Planifier un diagnostic" ctaLocation="eq_micro_quand_faire" />
        </p>
      </section>

      <section id="eq-combinaisons" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-3 text-gray-900">Comment ça s’articule avec PAC et déstratification ?</h2>
        <p className="text-sm leading-relaxed text-gray-700 md:text-base">
          <strong>Équilibrage hydraulique</strong> : répartition du <strong>débit d’eau</strong> dans les circuits.
          <strong> Déstratification</strong> : mélange de l’<strong>air</strong> dans les grands volumes (
          <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
            voir déstratification
          </Link>
          ). <strong>PAC</strong> : production de chaleur (
          <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
            page PAC
          </Link>
          ). Ce sont des couches différentes : une PAC performante sur un réseau déséquilibré ou un volume stratifié peut
          encore donner un mauvais résultat — d’où l’ordre des priorités à trancher sur diagnostic.
        </p>
        <p className="mt-3 text-sm text-gray-700 md:text-base">
          Règle pratique : <strong>ne pas conclure sur le générateur</strong> tant que la distribution eau (et éventuellement
          air) n’a pas été cadrée honnêtement.
        </p>
        <p className="mt-4">
          <MicroCta label="Demander un ordre de priorité" ctaLocation="eq_micro_combinaisons" />
        </p>
      </section>

      <section id="eq-objections" className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Objections fréquentes — décideurs</h2>
        <dl className="space-y-4 text-sm text-gray-800 md:text-base">
          <div className="border-b border-gray-100 pb-4">
            <dt className="font-semibold text-gray-900">Coût vs bénéfice</dt>
            <dd className="mt-1.5">
              On compare le coût d’intervention aux MWh et au temps passé en plaintes / reprises — pas à un slogan «
              optimisation ».
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-4">
            <dt className="font-semibold text-gray-900">Est-ce vraiment nécessaire ?</dt>
            <dd className="mt-1.5">
              Si le réseau n’a jamais été équilibré depuis des travaux majeurs, ou si les symptômes ci-dessus sont là, le
              diagnostic coûte moins qu’une erreur d’arbitrage sur le générateur.
            </dd>
          </div>
          <div className="border-b border-gray-100 pb-4">
            <dt className="font-semibold text-gray-900">Perturbation pour les occupants</dt>
            <dd className="mt-1.5">
              L’intervention se planifie (créneaux, phasage). Le coût d’un mauvais équilibre, lui, est continu toute la
              saison.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-900">Complexité technique</dt>
            <dd className="mt-1.5">
              C’est notre métier de traduire en rapport lisible : mesures, réglages, état avant / après — pour le syndic,
              le facility ou le comité.
            </dd>
          </div>
        </dl>
      </section>

      <section id="eq-par-ou-commencer" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="heading-section mb-2 text-gray-900">Par où commencer ?</h2>
        <ol className="space-y-4 text-sm text-gray-800 md:text-base">
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[var(--secondary-800)]" aria-hidden>1</span>
            <div>
              <p className="font-semibold text-gray-900">Diagnostic terrain</p>
              <p className="mt-1 text-gray-700">Mesures, lecture du réseau réel, identification des branches en sur/sous-débit.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[var(--secondary-800)]" aria-hidden>2</span>
            <div>
              <p className="font-semibold text-gray-900">Réglages d’équilibrage</p>
              <p className="mt-1 text-gray-700">Intervention progressive sur les organes — objectif : retours homogènes par branche.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[var(--secondary-800)]" aria-hidden>3</span>
            <div>
              <p className="font-semibold text-gray-900">Vérification & rapport</p>
              <p className="mt-1 text-gray-700">Contrôle après réglage, documentation pour exploitation et éventuelle démarche{' '}
                <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">CEE</Link>.
              </p>
            </div>
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/contact"
            onClick={midPrimary('eq_par_ou_commencer')}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--secondary-500)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--secondary-600)]"
          >
            Demander un diagnostic
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            onClick={midSecondary('eq_par_ou_commencer')}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-slate-50"
          >
            Être rappelé
          </Link>
        </div>
      </section>

      <OfferMidCta
        title="Réseau qui tire mal la chaleur ? Parlons-en avant le prochain gros investissement"
        subtitle="Étude gratuite · Sans engagement"
        onPrimary={midPrimary('eq_mid_final_pillar')}
        onSecondary={midSecondary('eq_mid_final_pillar')}
      />
    </div>
  );
};

const EquilibrageHydraulique = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <OfferPageLayout
      seo={{
        title:
          'Équilibrage hydraulique chauffage collectif & tertiaire : réseau équilibré, moins de plaintes | Effinor',
        description:
          'Équilibrage réseau chauffage copropriété, collectif, tertiaire : débits, circuits, après PAC ou travaux. Diagnostic terrain, résultats observés, CEE si éligible. Étude gratuite.',
        keywords:
          'équilibrage hydraulique, équilibrage chauffage collectif, équilibrage copropriété, équilibrage réseau tertiaire, équilibrage circuit radiateur, rééquilibrage après PAC, équilibrage après travaux, réseau chauffage déséquilibré, effinor',
      }}
      serviceSchema={{
        name: 'Équilibrage hydraulique des réseaux de chauffage (collectif, copropriété, tertiaire)',
        description:
          'Diagnostic terrain, réglage des organes d’équilibrage, rapport avant/après — Effinor.',
      }}
      breadcrumbs={[
        { to: '/', label: 'Accueil' },
        { to: '/equilibrage-hydraulique', label: 'Équilibrage hydraulique' },
      ]}
      h1="Le chauffage tourne — la chaleur ne va pas où il faut : équilibrez le réseau"
      heroBgImage={IMAGES.hero.equilibrage}
      heroBgImageAlt="Réseau de chauffage et distribution hydraulique — équilibrage"
      eyebrow="Équilibrage hydraulique — collectif & tertiaire"
      heroLead="Un réseau déséquilibré fait travailler la chaufferie pour compenser des débits mal répartis : certaines zones surchauffent, d’autres manquent de puissance — et la facture monte sans que le confort suive. Nous mesurons le comportement réel du réseau et réglons les organes d’équilibrage pour des retours homogènes et une exploitation plus stable."
      heroBullets={[
        'Problème clair : le système ne distribue pas comme prévu — pas une « optimisation » vague',
        'Méthode terrain : mesures, réglages tracés, rapport exploitable',
        'Décideurs : base factuelle pour syndic, facility ou comité',
      ]}
      heroFootnote="Souvent, le chauffage produit — mais le réseau ne répartit pas la chaleur comme prévu. Diagnostic sérieux avant promesse."
      heroCtas={[
        {
          label: 'Demander un diagnostic',
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
          <EquilibrageHook />
          <EquilibrageProofStrip />
        </div>
      }
      pillarContent={<EquilibragePillarBlocks src={src} />}
      pourQui={{
        title: 'Pour qui ?',
        intro:
          'Tout bâtiment avec réseau hydraulique de chauffage collectif ou centralisé peut être concerné lorsque la distribution ne suit plus le projet initial — bailleurs, copropriétés, tertiaire, exploitants.',
        items: [
          { label: 'Bailleurs & patrimoine', text: 'Charges, confort locataire, image — besoin de preuves.' },
          { label: 'Copropriétés & syndics', text: 'Plaintes inégales, AG, justification technique.' },
          { label: 'Exploitants & maintenance', text: 'Moins d’appels récurrents si le réseau est stabilisé et tracé.' },
          { label: 'Tertiaire & ERP', text: 'Zones et étages à besoins différents sur un même primaire.' },
          { label: 'Gestionnaires facility', text: 'Priorisation et comparables sur plusieurs sites.' },
          { label: 'Directions techniques / énergie', text: 'Arbitrage investissement avec risques nommés.' },
        ],
      }}
      problem={{
        title: 'Le problème : un réseau qui ment sur la distribution',
        intro: (
          <>
            Tant que les débits ne sont pas alignés sur les besoins réels,{' '}
            <strong>votre installation ne fonctionne pas comme prévu</strong> : le générateur produit, mais l’eau ne se
            répartit pas équitablement. Résultat : surconsommation pour rattraper les zones froides, surchauffe ailleurs,
            plaintes — le tout sans afficher un « défaut » visible sur un seul indicateur agrégé. En parallèle, d’autres
            sujets peuvent coexister (
            <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
              générateur
            </Link>
            ,{' '}
            <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
              air en grand volume
            </Link>
            ) — l’ordre des leviers se décide au diagnostic.
          </>
        ),
        items: [
          'Circuits sur-alimentés ou sous-alimentés : confort inégal entre pièces ou logements',
          'Compensation par la consigne générale : facture qui grimpe sans homogénéiser le confort',
          'Plaintes qui reviennent : les occupants ne devraient pas subir des écarts de température inexpliqués',
          'Réseau modifié au fil du temps sans rééquilibrage : l’état « papier » ne reflète plus le réel',
          'Réglages empiriques sans traçabilité : personne ne sait où le réseau « devrait » être',
        ],
        img: IMAGES.inline.pacChaufferie,
        imgAlt: 'Chaufferie et réseau de distribution hydraulique',
        imgCaption: 'Distribution hydraulique — l’équilibrage se lit aussi dans les températures de retour par branche.',
      }}
      solution={{
        title: 'La solution : équilibrer sur le comportement réel du réseau',
        paragraphs: [
          <>
            Nous intervenons sur les <strong>organes d’équilibrage existants</strong> (vannes, régulateurs) pour répartir les
            débits selon le besoin. Indicateur objectif : <strong>uniformiser les températures de retour</strong> par
            branche lorsque le contexte s’y prête — pas un discours théorique déconnecté du terrain.
          </>,
          <>
            L’équilibrage ne remplace pas un{' '}
            <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
              remplacement de générateur
            </Link>{' '}
            ni la{' '}
            <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
              déstratification
            </Link>{' '}
            en grand volume : il traite la <strong>répartition de l’eau</strong>. Nous vous disons si c’est le levier
            prioritaire — avec des mesures, pas une intuition.
          </>,
        ],
        tagline: 'Un réseau qui distribue enfin la chaleur là où le besoin est réel.',
        img: IMAGES.inline.pacChaufferie,
        imgAlt: 'Réglage et analyse du réseau hydraulique de chauffage',
        imgCaption: 'Intervention sur réseau existant — réglages mesurés et documentés',
      }}
      buildings={{
        title: 'Contextes fréquents',
        items: [
          {
            label: 'Copropriétés & collectif',
            text: 'Colonne montante, plusieurs logements : écarts d’étage',
            img: IMAGES.inline.coproprieteImmeuble,
            imgAlt: 'Immeuble collectif chauffage central',
          },
          {
            label: 'Chaufferie & réseau primaire',
            text: 'Plusieurs départs, besoins de répartition',
            img: IMAGES.inline.pacChaufferie,
            imgAlt: 'Chaufferie réseau hydraulique',
          },
        ],
      }}
      benefits={{
        title: 'Bénéfices concrets (ce que le comité ou l’AG peut entendre)',
        items: [
          'Moins d’écarts de température entre zones : les occupants ne devraient pas se plaindre de tirages « aléatoires »',
          'Piste de baisse de la surconsommation liée aux compensations de réseau',
          'Exploitation plus stable : moins de réglages « au feeling »',
          'Rapport avant / après — base pour syndic, maintenance ou démarche CEE si éligible',
          'Traçabilité des réglages pour la suite de l’exploitation',
        ],
      }}
      reassurance={{
        title: 'Transparence',
        items: [
          'Pas de promesse de % « garanti » sans diagnostic et hypothèses',
          'Si le levier n’est pas hydraulique, nous le disons avant engagement',
          'Un interlocuteur du premier échange au rapport',
        ],
      }}
      process={{
        title: 'Comment ça se passe',
        steps: [
          {
            title: 'Collecte & qualification',
            text: 'Plans, historique, symptômes — pour cadrer la visite et le périmètre.',
          },
          {
            title: 'Diagnostic terrain',
            text: 'Mesures départ / retour, identification des branches en déséquilibre.',
          },
          {
            title: 'Réglages & équilibrage',
            text: 'Intervention progressive sur les organes ; uniformisation des retours selon méthode.',
          },
          {
            title: 'Rapport & suite',
            text: 'Livrable pour exploitation ; orientation CEE si le dossier est cohérent.',
          },
        ],
      }}
      infoBlock={{
        title: 'CEE : si l’opération et les preuves sont dans le cadre',
        text: (
          <>
            <p>
              Selon votre situation, une opération peut s’inscrire dans une démarche CEE — nous vérifions la cohérence
              avant tout chiffrage optimiste. Détail :{' '}
              <Link to="/cee" className="font-medium text-[var(--secondary-700)] hover:underline">
                page CEE
              </Link>
              .
            </p>
            <p className="mt-3">
              Enchaînements fréquents avec{' '}
              <Link to="/pompe-a-chaleur" className="font-medium text-[var(--secondary-700)] hover:underline">
                PAC
              </Link>
              ,{' '}
              <Link to="/destratification" className="font-medium text-[var(--secondary-700)] hover:underline">
                déstratification
              </Link>
              , et exemples sur le{' '}
              <Link to="/blog" className="font-medium text-[var(--secondary-700)] hover:underline">
                blog
              </Link>{' '}
              et les{' '}
              <Link to="/realisations" className="font-medium text-[var(--secondary-700)] hover:underline">
                réalisations
              </Link>
              .
            </p>
          </>
        ),
      }}
      faq={{
        title: 'Questions fréquentes — équilibrage hydraulique',
        items: [
          {
            q: 'Qu’est-ce que l’équilibrage hydraulique ?',
            a: 'C’est l’ajustement des débits sur le réseau pour que chaque zone reçoive la puissance hydraulique adaptée au besoin — en s’appuyant sur des mesures terrain, pas seulement sur un calcul figé.',
          },
          {
            q: 'Combien ça coûte ?',
            a: 'Cela dépend de la taille du réseau, de l’accessibilité des organes et du temps de diagnostic. Nous proposons un cadrage après qualification — pas un prix « marketing » sans visite des hypothèses.',
          },
          {
            q: 'Combien de temps dure une intervention ?',
            a: 'De quelques heures à plusieurs jours selon immeuble ou site. Un diagnostic préalable permet d’annoncer un ordre de grandeur réaliste.',
          },
          {
            q: 'Est-ce vraiment nécessaire si la chaufferie est récente ?',
            a: 'Un générateur neuf ne corrige pas des débits mal répartis. Après installation de PAC ou changement de pompe, un rééquilibrage est souvent pertinent — à confirmer par mesures.',
          },
          {
            q: 'Compatibilité avec ma PAC ou ma chaudière ?',
            a: 'L’équilibrage agit en aval sur la distribution. Il est compatible avec tout générateur correctement dimensionné ; il vise à aligner le réseau sur le comportement réel.',
          },
          {
            q: 'Quels types de bâtiments ?',
            a: 'Copropriétés, chauffage collectif, tertiaire en réseau centralisé, certains industriels avec boucles longues — dès qu’il y a plusieurs branches et des plaintes de distribution.',
          },
          {
            q: 'Quelles contraintes techniques peuvent bloquer ?',
            a: 'Organes inaccessibles, réseau vétuste à remplacer, ou problème dominant autre (ex. grand volume d’air mal mélangé). Nous le signalons après diagnostic.',
          },
          {
            q: 'Cela remplace-t-il la déstratification ou une PAC ?',
            a: 'Non. Eau ≠ air ≠ générateur. Nous aidons à prioriser : souvent équilibrage et/ou déstrat avant de conclure sur un remplacement de production.',
          },
          {
            q: 'Y a-t-il un lien avec les CEE ?',
            a: 'Possible selon fiches et preuves. Nous ne promettons pas un montant sans cohérence technique et dossier.',
          },
          {
            q: 'Que reçoit-on en fin d’intervention ?',
            a: 'Un rapport détaillant constats, réglages et recommandations — utilisable par le syndic, l’exploitant ou une traçabilité énergétique.',
          },
        ],
      }}
      afterFaqContent={
        <OfferMidCta
          title="Encore une question ou un réseau à diagnostiquer ?"
          subtitle="Réponse rapide · Sans engagement"
          onPrimary={() =>
            trackCtaStudy({ effinor_source: src, effinor_cta_location: 'eq_after_faq' })
          }
          onSecondary={() =>
            trackCtaCallback({ effinor_source: src, effinor_cta_location: 'eq_after_faq' })
          }
        />
      }
      realisationsStrip={{
        tokens: ['équilibrage', 'equilibrage', 'hydraulique'],
        title: 'Réalisations terrain — équilibrage & réseaux',
        limit: 3,
      }}
      urgence={{
        title: 'Pourquoi agir avant la prochaine saison',
        items: [
          'Chaque hiver sans équilibrage : MWh et plaintes qui se répètent — coût récurrent',
          'Sans diagnostic, on risque de blâmer le générateur ou de surinvestir au mauvais endroit',
          'Plus tôt le réseau est lu et réglé, plus les arbitrages techniques et financiers restent clairs',
        ],
      }}
      internalLinks={{
        title: 'Maillage utile',
        links: [
          { to: '/equilibrage-hydraulique#eq-preuve-rapide', label: 'Indicateurs rapides' },
          { to: '/equilibrage-hydraulique#eq-ce-qui-se-passe', label: 'Ce qui se passe dans le réseau' },
          { to: '/equilibrage-hydraulique#eq-si-vous-etes', label: 'Si vous êtes dans cette situation' },
          { to: '/equilibrage-hydraulique#eq-avant-apres', label: 'Avant / après équilibrage' },
          { to: '/equilibrage-hydraulique#eq-pourquoi-ignore', label: 'Pourquoi c’est ignoré' },
          { to: '/equilibrage-hydraulique#eq-quand-faire', label: 'Quand intervenir' },
          { to: '/equilibrage-hydraulique#eq-combinaisons', label: 'PAC & déstratification' },
          { to: '/pompe-a-chaleur', label: 'Pompe à chaleur' },
          { to: '/destratification', label: 'Déstratification' },
          { to: '/cee', label: 'CEE' },
          { to: '/blog', label: 'Blog' },
          { to: '/realisations', label: 'Réalisations' },
          { to: '/contact', label: 'Contact' },
        ],
      }}
      ctaLabel="Demander un diagnostic"
      phoneCta={{ href: 'tel:+33978455063', label: '09 78 45 50 63' }}
      ctaBlock={{
        title: 'Réseau qui distribue mal la chaleur ?',
        description:
          'Décrivez votre bâtiment et les symptômes (plaintes, étages, travaux récents). Nous revenons avec une suite d’étapes claire — diagnostic, sans engagement.',
      }}
    />
  );
};

export default EquilibrageHydraulique;
