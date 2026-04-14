import React from 'react';
import OfferPageLayout from '@/components/leadgen/OfferPageLayout';
import { IMAGES } from '@/config/images';
import { trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';

const src = 'Déstratification — Tertiaire';

const DestratTertiaire = () => (
  <OfferPageLayout
    seo={{
      title: 'Déstratification tertiaire : réduire la stratification thermique | Effinor',
      description:
        'Améliorez le confort et réduisez vos coûts de chauffage dans vos bâtiments tertiaires grâce à la déstratification. Salles de sport, commerces, bureaux, ERP. Accompagnement CEE si éligible.',
      keywords: 'déstratificateur tertiaire, bureaux, salle de sport, retail, stratification, CEE, effinor',
    }}
    breadcrumbs={[
      { to: '/', label: 'Accueil' },
      { to: '/destratification', label: 'Déstratification' },
      { to: '/destratification/tertiaire', label: 'Tertiaire' },
    ]}
    h1="Déstratification tertiaire"
    eyebrow="Confort client & employés"
    heroLead="Dans vos bâtiments tertiaires à grande hauteur, la chaleur monte et reste bloquée. Vos occupants ont froid au sol pendant que vous surchauffez inutilement. La déstratification redistribue cette chaleur là où elle est utile."
    heroBgImage={IMAGES.hero.destratTertiaire}
    heroBgImageAlt="Déstratificateur installé dans un bâtiment tertiaire — vue intérieure"
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
      title: 'Vous chauffez… mais vos occupants ont froid',
      paragraphs: [
        "Dans les bâtiments tertiaires à grande hauteur, l'air chaud monte naturellement. La chaleur reste bloquée sous le plafond pendant que vos équipes ou clients restent au froid — malgré un chauffage en fonctionnement.",
      ],
      items: [
        'Chaleur bloquée sous le plafond',
        'Inconfort au sol pour les équipes et les clients',
        'Consommation de chauffage excessive',
        'Mauvaise répartition de la température',
        'Thermostat poussé au maximum sans résultat',
      ],
    }}
    solution={{
      title: 'La solution : redistribuer la chaleur au niveau utile',
      paragraphs: [
        "Les déstratificateurs brassent l'air du bâtiment pour ramener la chaleur accumulée en hauteur vers les zones occupées. Vous utilisez mieux l'énergie déjà produite.",
        "Résultat : une température homogène, un confort amélioré pour vos occupants, et une réduction des dépenses de chauffage.",
      ],
      tagline: "Vous récupérez la chaleur que vous perdez.",
      img: IMAGES.inline.destratTertiaire,
      imgAlt: "Déstratificateur d'air installé dans un grand bâtiment tertiaire — vue intérieure haute",
      imgCaption: "Installation réelle — déstratificateur en bâtiment tertiaire",
    }}
    buildings={{
      title: 'Les bâtiments les plus concernés',
      items: [
        {
          label: 'Salles de sport & gymnases',
          text: 'Grandes hauteurs, forte densité ponctuelle, confort des pratiquants',
          img: IMAGES.inline.gymnaseSalleSport,
          imgAlt: 'Gymnase omnisports avec charpente bois — grand volume idéal pour déstratification',
        },
        {
          label: 'Commerces & retail',
          text: 'Doubles hauteurs, vitrages importants, confort client essentiel',
          img: IMAGES.inline.centreCommercialRetail,
          imgAlt: 'Centre commercial multi-niveaux — espace retail avec galerie marchande',
        },
        {
          label: 'Bureaux & espaces mixtes',
          text: 'Zones hautes mal exploitées, inconfort des équipes en hiver',
          img: IMAGES.inline.bureauxOpenSpace,
          imgAlt: 'Open space tertiaire moderne avec hauteur sous plafond et grandes baies vitrées',
        },
        {
          label: 'Établissements & ERP',
          text: 'Écoles, établissements de santé, accueil du public — confort et économies',
          img: IMAGES.inline.etablissementERP,
          imgAlt: 'Établissement recevant du public — grande surface avec plafond apparent et fort passage',
        },
      ],
    }}
    benefits={{
      title: 'Des gains concrets pour votre activité',
      items: [
        'Réduction des coûts de chauffage',
        'Confort homogène pour les occupants et les clients',
        "Amélioration de l'image de votre établissement",
        'Projet simple à défendre en interne',
        'Accompagnement CEE si éligible selon votre situation',
      ],
    }}
    process={{
      title: 'Une mise en place simple et structurée',
      steps: [
        {
          title: 'Analyse de votre bâtiment',
          text: "Surface, hauteur, usage, irritants thermiques : on recueille l'essentiel.",
        },
        {
          title: 'Étude de la stratification',
          text: "Nous évaluons l'écart de température et le gain attendu selon votre configuration.",
        },
        {
          title: 'Préconisation des équipements',
          text: "Nombre d'unités, implantation, contraintes sonores et esthétiques.",
        },
        {
          title: 'Installation',
          text: "Intervention planifiée pour limiter les perturbations de votre activité.",
        },
        {
          title: 'Suivi',
          text: "Accompagnement après installation et optimisation des réglages.",
        },
      ],
    }}
    faq={{
      title: 'Questions fréquentes',
      items: [
        {
          q: "La déstratification concerne-t-elle aussi les gymnases, magasins ou halls à grande hauteur ?",
          a: "Oui : dès qu'un local présente un volume important et un plafond haut, la stratification de l'air crée des écarts de température. Les gymnases, certains commerces et halls d'accueil sont des cas fréquents — une étude confirme si c'est prioritaire pour votre site.",
        },
        {
          q: "Faut-il fermer l'établissement pour l'installation ?",
          a: "Pas nécessairement. Les interventions peuvent souvent être planifiées hors heures d'ouverture ou par secteurs. Nous intégrons vos contraintes d'activité dès l'étude pour limiter la gêne.",
        },
        {
          q: "Est-ce compatible avec ma climatisation ou ma ventilation existante ?",
          a: "Il faut analyser comment votre système distribue l'air et à quelles hauteurs. La déstratification peut compléter une installation existante, mais l'articulation doit être étudiée pour éviter les effets contraires — c'est un point clé de la visite technique.",
        },
        {
          q: "Existe-t-il des aides pour ce type de projet ?",
          a: "Selon votre situation et l'éligibilité de votre bâtiment, des dispositifs CEE peuvent s'appliquer. L'éligibilité n'est pas automatique : nous vérifions les conditions avec vous avant tout engagement.",
        },
        {
          q: "La déstratification est-elle complémentaire à une pompe à chaleur ?",
          a: "Oui, souvent. La PAC produit la chaleur, la déstratification la répartit mieux dans le volume. Les deux se complètent naturellement pour optimiser le confort et les coûts.",
        },
      ],
    }}
    ctaBlock={{
      title: 'Identifiez les économies possibles dans votre bâtiment',
      text: 'Recevez une étude personnalisée adaptée à votre configuration et vos usages.',
      primary: { label: 'Demander une étude gratuite', to: '/contact' },
      secondary: { label: 'Être rappelé', to: '/contact' },
    }}
  />
);

export default DestratTertiaire;
