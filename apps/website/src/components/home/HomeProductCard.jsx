import React from 'react';
import { Link } from 'react-router-dom';

const HomeProductCard = ({ product }) => {
  if (!product) return null;

  const image =
    product.image_1 || product.image_url || '/images/product-placeholder.svg';

  // Route publique de détail produit : /produit/:slug
  const productUrl = product.slug ? `/produit/${product.slug}` : `/produit/${product.id}`;

  return (
    <Link
      to={productUrl}
      className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-secondary-500 hover:shadow-md transition-all flex flex-col"
    >
      <div className="bg-gray-50 flex items-center justify-center aspect-square">
        <img
          src={image}
          alt={product.nom}
          className="w-4/5 h-4/5 object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3 md:p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
          {product.nom}
        </h3>
        {product.categorie_label && (
          <p className="text-[11px] md:text-xs text-secondary-700 font-medium">
            {product.categorie_label}
          </p>
        )}
        {product.description && (
          <p className="text-[11px] md:text-xs text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-1.5 flex items-center justify-between">
          <div>
            {product.sur_devis || !product.prix ? (
              <div className="text-sm md:text-base font-semibold text-secondary-600">Sur devis</div>
            ) : (
              <div>
                <div className="text-sm md:text-base font-semibold text-secondary-600">
                  {parseFloat(product.prix).toFixed(2)} € HT
                </div>
                <div className="text-[10px] md:text-xs text-gray-500">
                  soit {(parseFloat(product.prix) * 1.20).toFixed(2)} € TTC
                </div>
              </div>
            )}
          </div>
          <span className="text-[11px] md:text-xs text-secondary-700 font-medium group-hover:underline">
            Voir le produit
          </span>
        </div>
      </div>
    </Link>
  );
};

export default HomeProductCard;


