import React from 'react';
import { useLocation } from 'react-router-dom';
import OfferPageLayout from '@/components/leadgen/OfferPageLayout';
import { inferEffinorSourceFromPath, trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { IMAGES } from '@/config/images';

const PacTertiaire = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <OfferPageLayout
      seo={{
        title: 'Pompe à chaleur tertiaire : réduire les coûts énergétiques | Effinor',
        description:
          'Réduisez vos coûts de chauffage dans vos bâtiments tertiaires grâce à une pompe à chaleur adaptée. Étude gratuite et accompagnement complet.',
        keywords: 'PAC tertiaire, pompe à chaleur bureaux, chauffage bâtiment professionnel, CEE entreprise, effinor',
      }}
      breadcrumbs={[
        { to: '/', label: 'Accueil' },
        { to: '/pompe-a-chaleur', label: 'Pompe à chaleur' },
        { to: '/pompe-a-chaleur/tertiaire', label: 'Tertiaire' },
      ]}
      h1="Pompe à chaleur tertiaire"
      heroBgImage={IMAGES.hero.pacTertiaire}
      heroBgImageAlt="Immeuble de bureaux tertiaire — pompe à chaleur"
      eyebrow="Bâtiments professionnels"
      heroLead="Réduisez les coûts de chauffage de vos bâtiments tertiaires. La pompe à chaleur permet de remplacer un système énergivore par une solution plus performante, adaptée aux bâtiments professionnels. Étude gratuite et accompagnement complet, avec financement CEE selon éligibilité."
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
      problem={{
        title: 'Des charges énergétiques de plus en plus difficiles à maîtriser ?',
        intro: 'Dans les bâtiments tertiaires, le chauffage représente un poste de dépense majeur.',
        items: [
          'Factures de chauffage en hausse',
          'Équipements vieillissants (chaudière gaz, fioul)',
          'Pression sur les coûts d’exploitation',
          'Inconfort thermique pour les occupants',
          'Difficulté à anticiper les dépenses énergétiques',
        ],
      }}
      solution={{
        title: 'Une alternative plus performante : la pompe à chaleur',
        paragraphs: [
          "La pompe à chaleur permet de produire de la chaleur en consommant moins d’énergie que les systèmes traditionnels. Elle s’adapte à de nombreux bâtiments tertiaires : bureaux, commerces, établissements recevant du public.",
        ],
        tagline: 'Vous réduisez vos charges tout en améliorant le confort.',
        img: IMAGES.inline.pacChaufferie,
        imgAlt: "Installation pompe à chaleur en bâtiment tertiaire — chaufferie avec ballon tampon et distribution hydraulique",
        imgCaption: "Installation réelle — chaufferie PAC pour bâtiment professionnel",
      }}
      buildings={{
        title: 'Pour quels types de bâtiments ?',
        items: [
          {
            label: 'Bureaux',
            text: 'Optimisation des charges et confort des équipes',
            img: IMAGES.inline.bureauxOpenSpace,
            imgAlt: 'Open-space bureaux tertiaires',
          },
          {
            label: 'Commerces',
            text: 'Confort client et réduction des coûts opérationnels',
            img: IMAGES.buildings.commercial,
            imgAlt: 'Commerce grande surface',
          },
          {
            label: 'Établissements (écoles, santé…)',
            text: 'Stabilité thermique adaptée aux usages spécifiques',
            img: IMAGES.inline.etablissementERP,
            imgAlt: 'Établissement recevant du public — grande surface avec plafond apparent et fort passage',
          },
          {
            label: 'Bâtiments d’activité',
            text: 'Efficacité énergétique et maîtrise des charges',
            img: IMAGES.buildings.industrial,
            imgAlt: 'Bâtiment d’activité industriel',
          },
        ],
      }}
      benefits={{
        title: 'Des gains concrets pour votre activité',
        items: [
          'Réduction des coûts d’exploitation',
          'Amélioration du confort des occupants',
          'Valorisation du bâtiment',
          'Solution durable',
          'Accompagnement complet du projet',
        ],
      }}
      process={{
        title: 'Un projet maîtrisé de A à Z',
        steps: [
          {
            title: 'Analyse de votre bâtiment',
            text: 'Nous recueillons les informations clés sur votre site : surface, usage, équipements actuels, contraintes spécifiques.',
          },
          {
            title: 'Étude personnalisée',
            text: 'Un bilan adapté à votre situation, avec une estimation des économies potentielles.',
          },
          {
            title: 'Dimensionnement de la solution',
            text: 'Nous définissons la solution technique adaptée à votre bâtiment et à vos objectifs.',
          },
          {
            title: 'Installation',
            text: 'Mise en œuvre par des professionnels qualifiés, dans le respect des délais convenus.',
          },
          {
            title: 'Suivi',
            text: 'Un accompagnement jusqu’à la clôture du projet, y compris les démarches administratives.',
          },
        ],
      }}
      infoBlock={{
        title: 'Un projet pouvant être financé en partie',
        text: 'Selon votre situation, votre projet peut bénéficier des dispositifs CEE (Certificats d’Économies d’Énergie). Effinor vous accompagne dans les démarches pour optimiser votre financement selon les conditions d’éligibilité applicables.',
      }}
      reassurance={{
        title: 'Un interlocuteur unique pour votre projet',
        items: [
          'Étude adaptée à votre bâtiment',
          'Solution dimensionnée selon vos besoins',
          'Accompagnement administratif (CEE)',
          'Suivi du projet de bout en bout',
          'Expertise bâtiments tertiaires',
        ],
      }}
      faq={{
      title: 'Questions fréquentes',
      items: [
        {
          q: "Une PAC est-elle adaptée à mon bâtiment tertiaire ?",
          a: "Le tertiaire regroupe des usages très différents : horaires variables, zones multiples, besoins de confort et parfois de froid en été. La PAC peut convenir lorsqu'elle est adaptée au bâtiment et au système de distribution existant. Une étude technique permet de trancher sans généraliser.",
        },
        {
          q: "Quels types de bâtiments peuvent être équipés ?",
          a: "Bureaux, commerces, établissements recevant du public, bâtiments d'activité : la pompe à chaleur s'adapte à de nombreux profils. Nous analysons votre situation pour confirmer la pertinence du projet et vous orienter vers la solution la plus adaptée.",
        },
        {
          q: "Le projet est-il long à mettre en place ?",
          a: "Les délais varient selon la taille et la complexité du projet. Comptez généralement plusieurs semaines entre l'étude et la mise en service, en tenant compte des délais de fabrication et de la coordination des travaux. Nous vous donnons un calendrier réaliste dès le départ.",
        },
        {
          q: "Comment cela s'inscrit-il dans nos obligations réglementaires ?",
          a: "Les trajectoires de réduction des consommations du secteur tertiaire incitent à moderniser le chauffage. La PAC est souvent un levier pertinent dans ce cadre. Nous pouvons vous aider à prioriser les mesures en tenant compte de vos obligations et de votre bâtiment.",
        },
        {
          q: "Existe-t-il des aides pour financer ce type de projet ?",
          a: "Selon votre situation et les fiches en vigueur, des dispositifs CEE peuvent s'appliquer. L'éligibilité n'est pas automatique : nous vérifions les conditions avec vous et vous accompagnons dans les démarches si elles sont réunies.",
        },
      ],
    }}
      ctaLabel="Demander une étude gratuite"
      ctaBlock={{
        title: 'Évaluez votre projet',
        description: 'Recevez une étude personnalisée pour votre bâtiment et identifiez les économies possibles.',
      }}
    />
  );
};

export default PacTertiaire;
