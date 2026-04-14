import React from 'react';
import HomeProductCard from './HomeProductCard';

const HomeBestSellers = ({ title, subtitle, products = [], loading = false }) => {
  const hasProducts = products && products.length > 0;

  return (
    <section className="py-6 md:py-8 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-3 md:px-4">
        <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          <header className="text-center mb-4 md:mb-5">
            <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
              {title || 'Nos best-sellers LED professionnels'}
            </h2>
            <p className="mt-1 text-[11px] md:text-xs lg:text-sm text-gray-600">
              {subtitle ||
                "Découvrez les luminaires LED les plus plébiscités par nos clients industriels, logisticiens et tertiaires. Des solutions d'éclairage performantes, testées et approuvées sur le terrain."}
            </p>
          </header>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center text-[11px] md:text-xs text-gray-500">
              Chargement des produits best-sellers...
            </div>
          ) : hasProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-lg p-4 text-center text-[11px] md:text-xs text-gray-500">
              Aucun produit best-seller disponible pour le moment. Les produits seront automatiquement sélectionnés selon leur popularité.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeBestSellers;


