import React from 'react';
import { ShieldCheck, Award, Truck, CheckCircle2 } from 'lucide-react';

const itemsDefault = [
  {
    icon: ShieldCheck,
    title: 'Conformité et exigence projet',
    text: 'Nous travaillons sur des solutions et des opérations adaptées aux usages réels du bâtiment : exigences techniques, contexte tertiaire ou industriel, et cohérence avec les dispositifs CEE.',
  },
  {
    icon: Award,
    title: 'Expertise efficacité énergétique',
    text: 'De la première saisie web au suivi commercial, nous structurons l’information pour faciliter la décision et le dimensionnement (PAC, déstratification, volumes).',
  },
  {
    icon: Truck,
    title: 'Pilotage et réactivité',
    text: 'Des parcours courts côté site, un suivi des leads et des relances possibles pour ne pas laisser un projet technique en suspens.',
  },
  {
    icon: CheckCircle2,
    title: 'Pérennité et clarté',
    text: 'Un positionnement assumé sur le chauffage et le confort thermique — sans dispersion sur des gammes hors périmètre — pour des échanges plus simples avec vos équipes.',
  },
];

const HomeTrustSection = ({ title, subtitle, items = itemsDefault }) => {
  return (
    <section className="py-6 md:py-8 bg-gray-900 text-white">
      <div className="container mx-auto max-w-7xl px-3 md:px-4">
        <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          <header className="text-center mb-4 md:mb-6">
            <h2 className="text-base md:text-lg lg:text-xl font-semibold text-white">
              {title || 'Pourquoi choisir Effinor ?'}
            </h2>
            <p className="mt-1 text-[11px] md:text-xs lg:text-sm text-gray-200">
              {subtitle ||
                'Un partenaire pour vos projets pompe à chaleur et déstratification, avec une approche CEE structurée et un accompagnement transparent.'}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex gap-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3 md:p-4"
                >
                  <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-secondary-600/10 flex items-center justify-center">
                    {Icon ? (
                      <Icon className="w-5 h-5 text-secondary-400" />
                    ) : (
                      <span className="text-secondary-400 text-sm font-semibold">✓</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-semibold mb-0.5 text-white">{item.title}</h3>
                    <div className="text-[11px] md:text-xs text-gray-200 leading-relaxed">{item.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTrustSection;
