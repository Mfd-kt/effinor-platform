import React from 'react';
import { Zap, Flame, Wind, Building2 } from 'lucide-react';
import HomeCategoryCard from './HomeCategoryCard';

const defaultCategories = [
  {
    key: 'pac',
    title: 'Pompe à chaleur',
    description: 'Résidentiel et tertiaire : chauffage performant et financement CEE.',
    icon: Flame,
    to: '/pompe-a-chaleur',
  },
  {
    key: 'destrat',
    title: 'Déstratification',
    description: 'Tertiaire et industriel : homogénéiser la température et réduire le chauffage.',
    icon: Wind,
    to: '/destratification',
  },
  {
    key: 'cee',
    title: 'Certificats CEE',
    description: 'Comprendre les aides et lancer votre dossier d’éligibilité.',
    icon: Zap,
    to: '/cee',
  },
  {
    key: 'secteurs',
    title: 'Solutions par secteur',
    description: 'Industrie, tertiaire, retail, collectivités, santé.',
    icon: Building2,
    to: '/secteurs-activite',
  },
];

const HomeCategoryNav = ({ title, subtitle, categories = defaultCategories }) => {
  return (
    <section className="py-6 md:py-8 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-3 md:px-4">
        <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          <header className="text-center mb-4 md:mb-6">
            <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
              {title || 'Accédez directement à nos expertises CEE'}
            </h2>
            <p className="mt-1 text-[11px] md:text-xs lg:text-sm text-gray-600">
              {subtitle ||
                'Pompe à chaleur, déstratification, aides CEE : choisissez votre entrée et lancez votre étude d’éligibilité.'}
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {categories.map((cat) => (
              <HomeCategoryCard
                key={cat.key || cat.to}
                icon={cat.icon}
                title={cat.title}
                description={cat.description}
                to={cat.to}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeCategoryNav;
