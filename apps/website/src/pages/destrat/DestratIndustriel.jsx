import React from 'react';
import { useLocation } from 'react-router-dom';
import OfferPageLayout from '@/components/leadgen/OfferPageLayout';
import { inferEffinorSourceFromPath, trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { IMAGES } from '@/config/images';

const DestratIndustriel = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <OfferPageLayout
      seo={{
        title:
          "Déstratification industrielle : entrepôts et ateliers | Effinor",
        description:
          "Réduisez vos coûts de chauffage dans vos entrepôts et bâtiments industriels. La déstratification redistribue la chaleur au sol là où se trouvent vos équipes.",
        keywords:
          "déstratificateur entrepôt, atelier, chauffage industriel, logistique, CEE, effinor",
      }}
      breadcrumbs={[
        { to: '/', label: 'Accueil' },
        { to: '/destratification', label: 'Déstratification' },
        { to: '/destratification/industriel', label: 'Industriel' },
      ]}
      h1="Déstratification industrielle"
      heroBgImage={IMAGES.hero.destratIndustriel}
      heroBgImageAlt="Entrepôt industriel grande hauteur — déstratification"
      eyebrow="Entrepôts & ateliers"
      heroLead="Dans votre entrepôt, vous chauffez… le plafond. La déstratification permet de récupérer la chaleur accumulée en hauteur et de la redistribuer au sol, là où se trouvent vos équipes."
      heroCtas={[
        {
          label: "Demander une étude de votre entrepôt",
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
        title: 'Le problème concret dans votre bâtiment',
        intro:
          "Plus votre bâtiment est haut, plus l’écart de température entre le sol et le plafond est important. Vos équipes travaillent au froid pendant que la chaleur reste bloquée en hauteur.",
        items: [
          'Hauteur importante : la chaleur monte et ne redescend pas',
          'Équipes au froid malgré un chauffage en fonctionnement',
          'Consommation de chauffage élevée sans confort suffisant',
          'Thermostat qui demande toujours plus sans résultat au sol',
          'Gaspillage énergétique invisible mais coûteux',
        ],
      }}
      solution={{
        title: 'La solution : redistribuer la chaleur là où elle est utile',
        paragraphs: [
          "Les déstratificateurs d’air brassent l’air du bâtiment pour ramener la chaleur accumulée sous le plafond vers le sol. Vous n’avez pas besoin de produire plus de chaleur : vous utilisez mieux celle que vous produisez déjà.",
          "Résultat : une température plus homogène, un confort amélioré pour vos équipes, et une baisse de la consommation de chauffage.",
        ],
        tagline: 'Vous récupérez la chaleur que vous perdez.',
        img: IMAGES.inline.destratInstallation,
        imgAlt: "Technicien sur nacelle CMG installant un déstratificateur d’air au plafond d’un bâtiment industriel",
        imgCaption: "Installation réelle — pose d’un déstratificateur en hauteur sur nacelle",
      }}
      buildings={{
        title: 'Les sites les plus concernés',
        items: [
          {
            label: 'Entrepôts logistiques et plateformes',
            text: 'Grands volumes, forte stratification thermique',
            img: IMAGES.inline.entrepotLogistique,
            imgAlt: 'Entrepôt logistique avec racks de stockage hauts — problématique de stratification thermique',
          },
          {
            label: 'Ateliers et zones de production',
            text: 'Confort des équipes directement au poste de travail',
            img: IMAGES.inline.atelierProductionIndustriel,
            imgAlt: 'Atelier de production industrielle avec charpente métallique — grand volume',
          },
          {
            label: 'Bâtiments industriels mixtes',
            text: 'Volume dominant qui tire la facture énergétique',
            img: IMAGES.inline.batimentIndustrielMixte,
            imgAlt: 'Bâtiment industriel mixte avec ponts roulants et machines — grand volume',
          },
          {
            label: 'Sites de stockage chauffés',
            text: 'Maintien de température à moindre coût',
            img: IMAGES.inline.destratSchema,
            imgAlt: 'Schéma déstratification : bâtiment sans et avec déstratificateur — redistribution de la chaleur',
            imgPosition: 'center center',
            schemaCard: true,
          },
        ],
      }}
      benefits={{
        title: 'Des gains concrets pour votre exploitation',
        items: [
          'Réduction des coûts de chauffage',
          'Confort amélioré pour vos équipes',
          'Retour sur investissement rapide',
          'Installation simple, sans arrêt d’activité prolongé',
          'Accompagnement complet du projet',
        ],
      }}
      process={{
        title: 'Une mise en place sans complication',
        steps: [
          {
            title: 'Analyse de votre bâtiment',
            text: "Surface, hauteur, usage, équipements de chauffage existants : on recueille l’essentiel pour évaluer le potentiel.",
          },
          {
            title: 'Étude des volumes et de la stratification',
            text: "Nous évaluons l’écart de température réel et le gain attendu en fonction de la configuration de votre site.",
          },
          {
            title: 'Préconisation des équipements',
            text: "Nombre d’unités, implantation, modèles adaptés à votre activité et à vos contraintes.",
          },
          {
            title: 'Installation',
            text: "Mise en œuvre rapide par des professionnels qualifiés, sans perturber votre exploitation.",
          },
          {
            title: 'Suivi',
            text: "Vérification des résultats et gestion des démarches CEE si votre projet est éligible.",
          },
        ],
      }}
      infoBlock={{
        title: 'Un projet pouvant être financé en partie',
        text: "Selon votre situation, votre projet de déstratification peut bénéficier des dispositifs CEE (Certificats d’Économies d’Énergie). Effinor vérifie avec vous les conditions d’éligibilité et vous accompagne dans les démarches.",
      }}
      reassurance={{
        title: 'Un interlocuteur unique pour votre projet',
        items: [
          'Étude adaptée à votre site',
          'Solution dimensionnée selon votre bâtiment',
          'Accompagnement administratif (CEE)',
          'Suivi du projet de bout en bout',
          'Expertise entrepôts et bâtiments industriels',
        ],
      }}
      faq={{
      title: 'Questions fréquentes',
      items: [
        {
          q: "Qu'est-ce que la déstratification dans un entrepôt ou un atelier ?",
          a: "Dans les grands volumes chauffés, l'air chaud monte et s'accumule sous le plafond : vous chauffez le haut du bâtiment pendant que la zone de travail reste froide. La déstratification mélange l'air pour ramener la chaleur au sol, là où elle est utile.",
        },
        {
          q: "Pourquoi notre chauffage tourne en permanence sans confort au sol ?",
          a: "Sans brassage adapté, les thermostats donnent une image incomplète de la répartition de la chaleur. Les équipes ressentent encore le froid en zone occupée alors que l'énergie part en hauteur. Un bon dimensionnement permet d'aligner confort et consommation.",
        },
        {
          q: "Quels types de bâtiments industriels en bénéficient le plus ?",
          a: "Les sites à forte hauteur sous plafond — entrepôts, ateliers, zones de stockage avec activité humaine — sont les plus concernés. Chaque cas est différent selon la hauteur, les flux et les usages. La faisabilité se confirme lors d'une visite.",
        },
        {
          q: "L'installation est-elle lourde pour l'exploitation ?",
          a: "Non. Les équipements se pilotent avec des réglages simples adaptés aux plages d'activité. L'objectif est de l'intégrer dans vos habitudes d'exploitation sans complexité supplémentaire.",
        },
        {
          q: "Existe-t-il des aides financières pour ce type de projet ?",
          a: "Selon votre situation et la configuration du bâtiment, des dispositifs CEE peuvent s'appliquer. L'éligibilité se vérifie fiche par fiche — nous vous accompagnons dans les démarches si les conditions sont réunies.",
        },
      ],
    }}
      ctaLabel="Demander une étude de votre entrepôt"
      ctaBlock={{
        title: "Analysez le potentiel de votre site",
        description:
          "Recevez une étude gratuite adaptée à votre bâtiment et identifiez les économies possibles.",
      }}
    />
  );
};

export default DestratIndustriel;
