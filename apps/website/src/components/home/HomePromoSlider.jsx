import React from 'react';
import { ArrowRight } from 'lucide-react';
import HomeProductCard from './HomeProductCard';

const HomePromoSlider = ({ title, subtitle, promos = [] }) => {
  const hasPromos = promos && promos.length > 0;

  return (
    <section className="py-6 md:py-8 bg-white">
      <div className="container mx-auto max-w-7xl px-3 md:px-4">
        <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-4 md:mb-5">
            <div>
              <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
                {title || 'Promotions du moment'}
              </h2>
              <p className="mt-1 text-[11px] md:text-xs lg:text-sm text-gray-600">
                {subtitle ||
                  'Bénéficiez de remises exceptionnelles sur une sélection de luminaires LED professionnels en stock. Économisez sur vos projets d\'éclairage industriel et tertiaire avec des produits certifiés et garantis.'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] md:text-xs text-secondary-700 font-medium">
              <span>Offres réservées aux professionnels</span>
            </div>
          </header>

          <div className="relative">
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-1 hide-scrollbar">
              {hasPromos ? (
                promos.map((product) => (
                  <div
                    key={product.id}
                    className="min-w-[200px] max-w-[220px] md:min-w-[230px] md:max-w-[250px] flex-shrink-0"
                  >
                    <div className="relative">
                      <HomeProductCard product={product} />
                      {product.remise_pct && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                          -{product.remise_pct}%
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center text-[11px] md:text-xs text-gray-500">
                  Les promotions seront bientôt disponibles. Vous pourrez gérer
                  ce bloc depuis le dashboard admin.
                </div>
              )}
            </div>
          </div>

          {hasPromos && (
            <div className="mt-3 md:mt-4 text-right">
              <a
                href="/produits-solutions"
                className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-secondary-700 hover:text-secondary-800"
              >
                Découvrir toutes nos promotions LED
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomePromoSlider;


