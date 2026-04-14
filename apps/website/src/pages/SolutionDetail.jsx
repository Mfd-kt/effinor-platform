import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ArrowRight, CheckCircle2, Lightbulb, Zap, ShieldCheck } from 'lucide-react';

const SolutionDetail = () => {
  const { slug } = useParams();
  const seo = usePageSEO(`/solutions/${slug}`);

  // Mapping des solutions avec leurs contenus
  const solutionData = {
    'industrie': {
      title: 'Éclairage LED Industriel',
      heroTitle: 'Solutions d\'éclairage LED haute performance pour l\'industrie',
      benefits: [
        'Réduction jusqu\'à 80% de la consommation énergétique',
        'Haute performance lumineuse (jusqu\'à 200 lm/W)',
        'Résistance aux environnements difficiles (IP65+)',
        'Maintenance réduite (durée de vie 50 000h+)'
      ],
      problems: [
        'Consommation énergétique élevée',
        'Maintenance fréquente et coûteuse',
        'Éclairage insuffisant dans certains espaces',
        'Chaleur dégagée par les anciennes technologies'
      ],
      solutions: [
        'Installation de Highbay LED haute performance',
        'Système de pilotage intelligent',
        'Optimisation de l\'éclairage selon les zones',
        'Maintenance préventive programmée'
      ]
    },
    'logistique-entrepots': {
      title: 'Éclairage LED pour Entrepôts',
      heroTitle: 'Solutions d\'éclairage LED pour entrepôts et centres logistiques',
      benefits: [
        'Éclairage uniforme sur toute la hauteur',
        'Détection de présence pour économies supplémentaires',
        'Conformité aux normes de sécurité',
        'ROI en moins de 2 ans'
      ],
      problems: [
        'Hauteur sous plafond importante',
        'Besoin d\'éclairage constant',
        'Coûts énergétiques élevés',
        'Maintenance difficile en hauteur'
      ],
      solutions: [
        'Highbay LED adaptés aux grandes hauteurs',
        'Système de détection de présence',
        'Pilotage centralisé',
        'Maintenance facilitée'
      ]
    },
    'bureaux-tertiaire': {
      title: 'Éclairage LED Bureaux & Tertiaire',
      heroTitle: 'Solutions d\'éclairage LED pour bureaux et espaces tertiaires',
      benefits: [
        'Confort visuel optimal pour le travail',
        'Réglage de l\'intensité lumineuse',
        'Design moderne et discret',
        'Réduction de la fatigue visuelle'
      ],
      problems: [
        'Éblouissement et fatigue visuelle',
        'Consommation énergétique élevée',
        'Design obsolète',
        'Manque de flexibilité'
      ],
      solutions: [
        'Réglettes LED avec diffuseur',
        'Système de gradation',
        'Design moderne et épuré',
        'Installation flexible'
      ]
    },
    'retail': {
      title: 'Éclairage LED Retail & Commerce',
      heroTitle: 'Solutions d\'éclairage LED pour magasins et espaces commerciaux',
      benefits: [
        'Mise en valeur des produits',
        'Ambiance chaleureuse et accueillante',
        'Économies d\'énergie significatives',
        'Flexibilité d\'éclairage par zone'
      ],
      problems: [
        'Éclairage inadapté aux produits',
        'Coûts énergétiques élevés',
        'Chaleur dégagée',
        'Manque d\'ambiance'
      ],
      solutions: [
        'Spots LED directionnels',
        'Réglettes LED pour éclairage général',
        'Système de gradation',
        'Éclairage d\'ambiance'
      ]
    },
    'collectivites': {
      title: 'Éclairage LED Collectivités',
      heroTitle: 'Solutions d\'éclairage LED pour collectivités et bâtiments publics',
      benefits: [
        'Conformité aux normes en vigueur',
        'Durabilité et fiabilité',
        'Maintenance réduite',
        'Économies budgétaires'
      ],
      problems: [
        'Normes strictes à respecter',
        'Budget limité',
        'Maintenance coûteuse',
        'Besoin de durabilité'
      ],
      solutions: [
        'Produits certifiés et conformes',
        'Solutions économiques',
        'Maintenance facilitée',
        'Garanties étendues'
      ]
    },
    'parkings': {
      title: 'Éclairage LED Parkings',
      heroTitle: 'Solutions d\'éclairage LED pour parkings et aires de stationnement',
      benefits: [
        'Sécurité renforcée',
        'Détection de présence',
        'Résistance aux intempéries (IP65+)',
        'Économies d\'énergie jusqu\'à 70%'
      ],
      problems: [
        'Sécurité insuffisante',
        'Consommation énergétique élevée',
        'Résistance aux intempéries',
        'Maintenance difficile'
      ],
      solutions: [
        'Projecteurs LED haute performance',
        'Détection de présence',
        'IP65+ pour extérieur',
        'Maintenance réduite'
      ]
    }
  };

  const data = solutionData[slug] || solutionData['industrie'];

  return (
    <>
      <SEOHead
        metaTitle={seo.metaTitle}
        metaDescription={seo.metaDescription}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable}
        h1={seo.h1 || data.heroTitle}
        intro={seo.intro}
      />

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Solutions', to: '/solutions' },
            { label: data.title }
          ]}
        />

        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {seo.h1 || data.heroTitle}
          </h1>
          {seo.intro && (
            <p className="text-xl text-gray-600">
              {seo.intro}
            </p>
          )}
        </div>

        {/* Bénéfices clés */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bénéfices clés</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {data.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-[var(--secondary-500)] flex-shrink-0 mt-1" />
                <p className="text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Problèmes fréquents / Notre réponse */}
        <section className="mb-12 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Problèmes fréquents</h2>
            <ul className="space-y-3">
              {data.problems.map((problem, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <span className="text-red-500 mt-1">•</span>
                  <p className="text-gray-700">{problem}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notre réponse</h2>
            <ul className="space-y-3">
              {data.solutions.map((solution, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-[var(--secondary-500)] flex-shrink-0 mt-1" />
                  <p className="text-gray-700">{solution}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Réalisations liées (placeholder - à remplir avec vraies données) */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Réalisations dans ce secteur</h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              Découvrez nos réalisations dans le secteur {data.title.toLowerCase()}.
            </p>
            <Link
              to="/realisations"
              className="inline-flex items-center text-[var(--secondary-500)] hover:text-[var(--secondary-600)] font-semibold"
            >
              Voir toutes les réalisations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--secondary-500)] text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à passer à l'éclairage LED ?</h2>
          <p className="text-lg mb-6 opacity-90">
            Demandez un devis gratuit et personnalisé pour votre projet.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-white text-[var(--secondary-500)] rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Demander un devis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>
      </div>
    </>
  );
};

export default SolutionDetail;














