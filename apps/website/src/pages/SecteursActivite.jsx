import React from 'react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import {
  Factory, Building2, ShoppingBag, Building, Heart, ArrowRight
} from 'lucide-react';

const SecteursActivite = () => {
  const seo = usePageSEO('/secteurs-activite');

  const secteurs = [
    {
      slug: 'industrie-logistique',
      title: 'Industrie & logistique',
      icon: Factory,
      description: 'Entrepôts et halls : déstratification, chauffage et projets CEE pour réduire la facture énergétique.',
      features: ['Déstratification industrielle', 'PAC & chauffage', 'Dossier CEE']
    },
    {
      slug: 'tertiaire-bureaux',
      title: 'Tertiaire / bureaux',
      icon: Building2,
      description: 'Bureaux et ERP : pompe à chaleur, confort thermique et homogénéisation des grands volumes.',
      features: ['PAC tertiaire', 'Déstratification', 'Pilotage énergie']
    },
    {
      slug: 'retail-grande-distribution',
      title: 'Retail & grande distribution',
      icon: ShoppingBag,
      description: 'Magasins et surfaces de vente : maîtrise du chauffage, des halls et des projets financés par les CEE.',
      features: ['Confort client', 'Chauffage & climatisation', 'Structuration CEE']
    },
    {
      slug: 'collectivites-ecoles-gymnases',
      title: 'Collectivités / écoles / gymnases',
      icon: Building,
      description: 'Bâtiments publics et gymnases : grands volumes, chauffage et accompagnement pour les financements.',
      features: ['Gymnases & halls', 'Chauffage performant', 'Projets publics']
    },
    {
      slug: 'sante-etablissements-sensibles',
      title: 'Santé / établissements sensibles',
      icon: Heart,
      description: 'Hôpitaux et cliniques : exigence sanitaire, confort et performance énergétique (chauffage, volumes).',
      features: ['Contraintes fortes', 'Chauffage & climatisation', 'Suivi projet']
    }
  ];

  return (
    <>
      <SEOHead
        metaTitle={seo.metaTitle}
        metaDescription={seo.metaDescription}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable}
        h1={seo.h1 || 'Secteurs d\'activité'}
        intro={seo.intro}
      />

      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {seo.h1 || 'Secteurs d\'activité'}
            </h1>
            {seo.intro && (
              <p className="text-xl text-gray-600">
                {seo.intro}
              </p>
            )}
            {!seo.intro && (
              <p className="text-xl text-gray-600">
                Pompe à chaleur, déstratification d&apos;air et financement CEE : des réponses adaptées à votre secteur.
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 max-w-7xl mx-auto">
          {secteurs.map((secteur) => {
            const Icon = secteur.icon;
            return (
              <Link
                key={secteur.slug}
                to={`/secteurs-activite/${secteur.slug}`}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-[var(--secondary-500)]/30"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-[var(--secondary-500)]/10 rounded-xl group-hover:bg-[var(--secondary-500)]/20 transition-colors">
                    <Icon className="h-10 w-10 text-[var(--secondary-500)]" />
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-[var(--secondary-500)] transition-colors flex-shrink-0" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[var(--secondary-500)] transition-colors">
                  {secteur.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {secteur.description}
                </p>
                <ul className="space-y-2">
                  {secteur.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center">
                      <span className="text-[var(--secondary-500)] mr-2 font-bold">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>

          <div className="bg-gray-50 rounded-2xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Votre secteur n&apos;est pas listé ?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Contactez-nous pour une étude adaptée à votre bâtiment et à vos objectifs CEE.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Nous contacter
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecteursActivite;
