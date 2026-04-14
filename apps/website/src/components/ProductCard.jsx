import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logger } from '@/utils/logger';
import { getSpecSummary } from '@/utils/productSpecs';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const specSummary = getSpecSummary(product);

  const formatCategory = (categorySlug) => {
    if (!categorySlug) return '';
    return categorySlug.replace(/_/g, ' ').toUpperCase();
  };

  const handleRequestQuote = (e) => {
    e.preventDefault();
    e.stopPropagation();
    logger.log(`Requesting quote for product ID: ${product.id}`);
    localStorage.setItem('devis_product', JSON.stringify(product));
    localStorage.setItem('devis_product_id', product.id);
    navigate('/contact');
  };

  const handleCardClick = () => {
    navigate(`/produit/${product.slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="product-card"
      data-product-id={product.id}
      onClick={handleCardClick}
    >
      <div className="product-image">
        <img 
          src={(() => {
            // Try multiple image sources
            let imageUrl = product.image_url || product.image_1;
            
            // If image_1 is just a filename, construct full URL
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              if (supabaseUrl) {
                imageUrl = `${supabaseUrl}/storage/v1/object/public/effinor-assets/${imageUrl}`;
              }
            }
            
            // Log for debugging
            if (process.env.NODE_ENV === 'development') {
              logger.log(`Product ${product.id} (${product.nom}) image URL:`, imageUrl || 'NO IMAGE');
            }
            
            return imageUrl || "/images/product-placeholder.svg";
          })()} 
          alt={`Image pour ${product.nom}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            logger.warn(`Failed to load image for product ${product.id}:`, product.image_url || product.image_1);
            e.target.src = "/images/product-placeholder.svg";
          }}
        />
      </div>
      <div className="product-content">
        <div className="category">{formatCategory(product.categorie)}</div>
        <h3>{product.nom}</h3>
        {(product.marque || product.reference) && (
          <p className="text-xs text-gray-600 mb-1">
            {product.marque && <span className="font-medium">{product.marque}</span>}
            {product.marque && product.reference && <span className="mx-1 text-gray-400">•</span>}
            {product.reference && <span className="text-gray-500">Réf. {product.reference}</span>}
          </p>
        )}
        {specSummary && (
          <p className="text-xs text-gray-600 mb-1">{specSummary}</p>
        )}
        <p className="description">{product.description}</p>
        
        <div className="mt-auto pt-2">
          {product.sur_devis || !product.prix ? (
            <p className="price-label">Sur devis</p>
          ) : (
            <div>
              <p className="price">{parseFloat(product.prix).toFixed(2)} € HT</p>
              <p className="text-xs text-gray-500 mt-0.5">soit {(parseFloat(product.prix) * 1.20).toFixed(2)} € TTC</p>
            </div>
          )}

          <button onClick={handleRequestQuote} className="btn-devis">
            Demander un devis
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;