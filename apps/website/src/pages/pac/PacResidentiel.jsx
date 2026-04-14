import React from 'react';
import { useLocation } from 'react-router-dom';
import OfferPageLayout from '@/components/leadgen/OfferPageLayout';
import { inferEffinorSourceFromPath, trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { IMAGES } from '@/config/images';

const PacResidentiel = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <OfferPageLayout
      seo={{
        title: 'Pompe à chaleur résidentielle & collective — Effinor',
        description:
          'Pompe à chaleur pour copropriétés, immeubles collectifs et maisons : réduire les charges de chauffage, améliorer le confort et préparer le financement CEE selon éligibilité. Étude gratuite.',
        keywords: 'PAC résidentiel, pompe à chaleur copropriété, chauffage collectif, immeuble, CEE, effinor',
      }}
      breadcrumbs={[
        { to: '/', label: 'Accueil' },
        { to: '/pompe-a-chaleur', label: 'Pompe à chaleur' },
        { to: '/pompe-a-chaleur/residentiel', label: 'Résidentiel' },
      ]}
      heroBgImage={IMAGES.inline.pacCollectif}
      heroBgImageAlt="Salle technique pompe à chaleur — immeuble collectif résidentiel"
      h1="Pompe à chaleur résidentielle & habitat collectif"
      eyebrow="Copropriétés & logements collectifs"
      heroLead="Réduisez les charges de chauffage de votre immeuble ou copropriété. La pompe à chaleur remplace un système énergivore par une solution plus efficace — avec un accompagnement complet et un financement CEE selon éligibilité."
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
        title: 'Des charges de chauffage difficiles à maîtriser ?',
        intro: 'Dans les immeubles collectifs et copropriétés, le poste chauffage représente souvent la dépense la plus lourde.',
        items: [
          'Chaudière collective gaz ou fioul à remplacer',
          'Charges en hausse constante pour les occupants',
          'Confort thermique inégal selon les logements',
          'Pression du syndic pour trouver des solutions durables',
          'Aides et financements CEE difficiles à sécuriser sans accompagnement',
        ],
      }}
      solution={{
        title: 'Une solution adaptée aux bâtiments collectifs',
        paragraphs: [
          "La pompe à chaleur collective remplace la chaudière centrale par un système plus efficace. Elle produit de la chaleur en consommant moins d'énergie, avec une salle technique propre et compacte.",
          "Nous prenons en charge l'étude, le dimensionnement et les démarches CEE — un seul interlocuteur pour le syndic, le gestionnaire et les copropriétaires.",
        ],
        tagline: "Un projet plus simple qu’il n’y paraît, avec un accompagnement structuré.",
        img: IMAGES.inline.pacCollectif,
        imgAlt: "Installation pompe à chaleur pour immeuble collectif — salle technique avec trois unités PAC, réseau de distribution et ballon tampon",
        imgCaption: "Installation réelle — salle technique PAC pour immeuble résidentiel collectif",
      }}
      buildings={{
        title: 'Pour quels types de bâtiments ?',
        items: [
          {
            label: 'Copropriétés',
            text: 'Remplacement de la chaudière collective, maîtrise des charges, accompagnement syndic',
            img: IMAGES.inline.coproprieteImmeuble,
            imgAlt: 'Immeuble résidentiel collectif — copropriété',
          },
          {
            label: 'Immeubles collectifs',
            text: 'Chauffage collectif modernisé, confort homogène dans tous les logements',
            img: IMAGES.inline.immeubleCollectifResidence,
            imgAlt: "Résidence collective moderne — tour d'habitation avec espaces communs",
          },
          {
            label: 'Résidences services',
            text: 'Solution durable et performante adaptée aux usages spécifiques',
            img: IMAGES.inline.residenceServices,
            imgAlt: 'Résidence services moderne — bâtiment avec façade bois et rez-de-chaussée commercial',
          },
          {
            label: 'Petits collectifs en rénovation',
            text: 'Remplacement du fioul ou gaz par une PAC lors de travaux de rénovation',
            img: IMAGES.inline.petitCollectifRenovation,
            imgAlt: 'Petit immeuble collectif moderne — rénovation énergétique avec pompe à chaleur',
          },
        ],
      }}
      benefits={{
        title: 'Ce que vous gagnez concrètement',
        items: [
          'Réduction des charges de chauffage pour les occupants',
          'Salle technique propre et moderne — plus facile à maintenir',
          'Confort thermique amélioré et homogène',
          'Accompagnement complet : étude, installation, démarches CEE',
          'Interlocuteur unique pour le syndic et les copropriétaires',
        ],
      }}
      reassurance={{
        title: 'Un projet encadré de A à Z',
        items: [
          'Étude adaptée à la configuration de votre bâtiment',
          'Dimensionnement rigoureux — pas de sous-estimation',
          'Accompagnement des démarches CEE selon éligibilité',
          'Un seul interlocuteur du formulaire au suivi',
          'Transparence sur ce qui est solide et ce qui reste à valider',
        ],
      }}
      process={{
        title: 'Un accompagnement simple et structuré',
        steps: [
          {
            title: 'Analyse de votre bâtiment',
            text: 'Surface, nombre de logements, chauffage actuel, contraintes techniques et calendrier.',
          },
          {
            title: 'Étude personnalisée',
            text: 'Scénario PAC adapté à votre immeuble, estimation des économies et lisibilité CEE.',
          },
          {
            title: 'Préconisation technique',
            text: 'Solution dimensionnée, marque et configuration adaptées à la salle technique existante.',
          },
          {
            title: 'Installation',
            text: 'Mise en œuvre par des professionnels qualifiés, avec coordination syndic / gestionnaire.',
          },
          {
            title: 'Suivi du projet',
            text: 'Accompagnement jusqu\'à la clôture, démarches CEE incluses si éligibilité confirmée.',
          },
        ],
      }}
      infoBlock={{
        title: 'Financement CEE : ce qu’il faut savoir',
        text: 'Les Certificats d’Économies d’Énergie peuvent cofinancer votre projet PAC selon les conditions d’éligibilité applicables. Effinor vérifie avec vous la faisabilité et prépare les éléments nécessaires — sans promesse hors cadre réglementaire.',
      }}
      faq={{
      title: 'Questions fréquentes',
      items: [
        {
          q: "Une pompe à chaleur collective peut-elle remplacer notre chauffage en copropriété ?",
          a: "Oui, dans de nombreux cas. Cela dépend de la puissance nécessaire, des réseaux existants et des contraintes du bâtiment. Une étude sur site permet de valider la faisabilité et de proposer un planning réaliste, sans engagement sur une solution avant diagnostic.",
        },
        {
          q: "Qui décide d'un tel projet en copropriété ?",
          a: "Les décisions de travaux importants relèvent de l'assemblée générale selon le règlement de copropriété. Effinor peut vous aider à préparer les éléments utiles à la décision : chiffrage des scénarios, présentation des bénéfices, éléments pour le vote.",
        },
        {
          q: "Les occupants vont-ils vraiment payer moins de chauffage ?",
          a: "Une installation bien dimensionnée tend à réduire la facture énergétique par rapport à un vieux système. Le gain exact dépend du bâtiment, de l'isolation et de l'usage. Nous présentons des ordres de grandeur prudents après analyse — pas des promesses figées.",
        },
        {
          q: "Y a-t-il des contraintes de bruit ou d'implantation ?",
          a: "Les unités extérieures doivent respecter la réglementation acoustique et les règles de copropriété. L'emplacement et les protections font partie intégrante de l'étude. Une visite permet d'identifier les emplacements réalistes et d'anticiper les démarches.",
        },
        {
          q: "Existe-t-il des aides pour financer ce projet ?",
          a: "Selon la situation de la copropriété, des dispositifs CEE peuvent s'appliquer. L'éligibilité dépend du type de bâtiment, de l'équipement et des conditions en vigueur. Nous analysons avec vous ce qui est réellement applicable.",
        },
      ],
    }}
      ctaLabel="Demander une étude gratuite"
      ctaBlock={{
        title: 'Parlons de votre immeuble',
        description: 'Recevez une étude personnalisée pour votre copropriété ou immeuble collectif et identifiez les économies possibles.',
      }}
    />
  );
};

export default PacResidentiel;
