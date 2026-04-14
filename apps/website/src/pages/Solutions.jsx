import React from 'react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import { 
  Factory, Warehouse, Building2, ShoppingBag, 
  Building, Car, ArrowRight 
} from 'lucide-react';

const Solutions = () => {
  const seo = usePageSEO('/solutions');

  const solutions = [
    {
      slug: 'industrie',
      title: 'Industrie',
      icon: Factory,
      description: 'Solutions d\'éclairage LED haute performance pour les sites industriels, ateliers et usines.',
      features: ['Highbay LED', 'Éclairage IP65+', 'Pilotage intelligent']
    },
    {
      slug: 'logistique-entrepots',
      title: 'Logistique & Entrepôts',
      icon: Warehouse,
      description: 'Éclairage LED pour entrepôts, centres de distribution et plateformes logistiques.',
      features: ['Hauteur sous plafond élevée', 'Économies d\'énergie', 'Confort visuel optimal']
    },
    {
      slug: 'bureaux-tertiaire',
      title: 'Bureaux & Tertiaire',
      icon: Building2,
      description: 'Solutions d\'éclairage LED pour bureaux, espaces de travail et bâtiments tertiaires.',
      features: ['Réglettes LED', 'Confort visuel', 'Design moderne']
    },
    {
      slug: 'retail',
      title: 'Retail & Commerce',
      icon: ShoppingBag,
      description: 'Éclairage LED pour magasins, showrooms et espaces commerciaux.',
      features: ['Mise en valeur produits', 'Ambiance chaleureuse', 'Économies d\'énergie']
    },
    {
      slug: 'collectivites',
      title: 'Collectivités',
      icon: Building,
      description: 'Solutions d\'éclairage LED pour les collectivités, écoles, hôpitaux et bâtiments publics.',
      features: ['Conformité normes', 'Durabilité', 'Maintenance réduite']
    },
    {
      slug: 'parkings',
      title: 'Parkings',
      icon: Car,
      description: 'Éclairage LED pour parkings souterrains, extérieurs et aires de stationnement.',
      features: ['IP65+', 'Détection de présence', 'Sécurité renforcée']
    }
  ];

  return (
    <>
      <SEOHead
        metaTitle={seo.metaTitle}
        metaDescription={seo.metaDescription}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable}
        h1={seo.h1}
        intro={seo.intro}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {seo.h1 || 'Nos solutions d\'éclairage LED pour les professionnels'}
          </h1>
          {seo.intro && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {seo.intro}
            </p>
          )}
          {!seo.intro && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez nos solutions d'éclairage LED adaptées à chaque secteur d'activité.
              Performance, économies d'énergie et confort visuel garantis.
            </p>
          )}
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <Link
                key={solution.slug}
                to={`/solutions/${solution.slug}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-[var(--secondary-500)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[var(--secondary-500)]/10 rounded-lg group-hover:bg-[var(--secondary-500)]/20 transition-colors">
                    <Icon className="h-8 w-8 text-[var(--secondary-500)]" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[var(--secondary-500)] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[var(--secondary-500)] transition-colors">
                  {solution.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {solution.description}
                </p>
                <ul className="space-y-1">
                  {solution.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-500 flex items-center">
                      <span className="text-[var(--secondary-500)] mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Besoin d'une solution sur mesure ?
          </h2>
          <p className="text-gray-600 mb-6">
            Notre équipe d'experts est à votre disposition pour vous conseiller.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors font-semibold"
          >
            Demander un devis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Solutions;














