import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import ImageGallery from '@/components/ImageGallery';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { ArrowRight, Loader2, ShoppingCart, Flame, Snowflake, Lightbulb, Wind, Zap, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { megaCategories } from '@/data/megaCategories';
import { motion } from 'framer-motion';

const iconMap = {
  Flame,
  Snowflake,
  Lightbulb,
  Wind,
  Zap
};

const ProduitsSolutions = () => {
  const seo = usePageSEO('/produits-solutions');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMegaCategory = searchParams.get('mega') || 'all';
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories with mega_categorie
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, nom, slug, mega_categorie')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (categoriesError && categoriesError.code !== '42P01') {
        logger.error('[ProduitsSolutions] Error fetching categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

      // Fetch products with category info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id, nom, description, prix, image_1, image_2, image_3, image_4, image_url, 
          slug, actif, categorie, categorie_id, marque, reference, caracteristiques, puissance, sur_devis
        `)
        .eq('actif', true)
        .or('image_1.not.is.null,image_url.not.is.null')
        .order('ordre', { ascending: true });

      if (productsError) {
        if (productsError.code === '42P01' || productsError.message?.includes('does not exist')) {
          logger.warn('[ProduitsSolutions] Table products does not exist yet');
          setProducts([]);
          return;
        }
        throw productsError;
      }
      
      setProducts(productsData || []);
    } catch (err) {
      logger.error('[ProduitsSolutions] Error fetching data:', err);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Organize products by mega category
  const productsByMegaCategory = useMemo(() => {
    const organized = {};
    
    // Initialize all mega categories
    megaCategories.forEach(megaCat => {
      organized[megaCat.id] = {
        ...megaCat,
        products: [],
        categories: []
      };
    });

    // Add an "unassigned" category for products without a mega category
    organized['unassigned'] = {
      id: 'unassigned',
      label: 'Autres produits',
      slug: 'autres',
      icon: 'Lightbulb',
      color: 'gray',
      description: 'Produits non catégorisés',
      products: [],
      categories: []
    };

    // Organize categories by mega category
    categories.forEach(category => {
      const megaCatId = category.mega_categorie || 'unassigned';
      if (organized[megaCatId]) {
        organized[megaCatId].categories.push(category);
      }
    });

    // Organize products by mega category
    products.forEach(product => {
      // Find the category for this product
      const category = categories.find(cat => 
        cat.id === product.categorie_id || cat.slug === product.categorie
      );
      
      if (category && category.mega_categorie) {
        const megaCatId = category.mega_categorie;
        if (organized[megaCatId]) {
          organized[megaCatId].products.push(product);
        }
      } else {
        // Product without a category or category without mega_categorie
        organized['unassigned'].products.push(product);
      }
    });

    // Keep all mega categories, even if empty (so users can see all available categories)
    return organized;
  }, [products, categories]);

  // Filter products based on selected mega category
  const filteredProductsByMegaCategory = useMemo(() => {
    if (selectedMegaCategory === 'all') {
      return productsByMegaCategory;
    }
    
    // Find the mega category by slug
    const megaCat = megaCategories.find(mc => mc.slug === selectedMegaCategory);
    if (!megaCat) {
      return {};
    }
    
    // Get the organized data for this mega category (even if empty)
    const megaCatData = productsByMegaCategory[megaCat.id] || {
      ...megaCat,
      products: [],
      categories: []
    };
    
    return {
      [megaCat.id]: megaCatData
    };
  }, [productsByMegaCategory, selectedMegaCategory]);

  const handleMegaCategoryFilter = (megaCategorySlug) => {
    if (megaCategorySlug === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ mega: megaCategorySlug });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl && imagePath) {
      return `${supabaseUrl}/storage/v1/object/public/effinor-assets/${imagePath}`;
    }
    return null;
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast({
      title: "✅ Produit ajouté au panier !",
      description: `${product.nom} a été ajouté au panier.`,
    });
  };

  const totalProducts = Object.values(productsByMegaCategory).reduce(
    (sum, megaCat) => sum + megaCat.products.length,
    0
  );

  return (
    <>
      <SEOHead
        metaTitle={seo.metaTitle}
        metaDescription={seo.metaDescription}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable}
        h1={seo.h1 || 'Produits & Solutions d\'efficacité énergétique'}
        intro={seo.intro}
      />

      <div className="min-h-screen bg-white overflow-x-hidden">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8 max-w-7xl overflow-x-hidden">
          <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                {seo.h1 || 'Produits & Solutions d\'efficacité énergétique'}
              </h1>
              {seo.intro ? (
                <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
                  {seo.intro}
                </p>
              ) : (
                <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
                  Découvrez notre gamme complète de solutions d'efficacité énergétique : éclairage LED, ventilation, chauffage, refroidissement et bornes de recharge. Réduisez vos coûts énergétiques jusqu'à 80% avec un retour sur investissement rapide.
                </p>
              )}
              {totalProducts > 0 && (
                <p className="text-xs md:text-sm text-gray-500 mt-2">
                  {totalProducts} {totalProducts === 1 ? 'produit disponible' : 'produits disponibles'}
                </p>
              )}
            </div>

            {/* Mega Category Filter */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Filter className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />
                <h2 className="text-sm md:text-base font-semibold text-gray-900">
                  Filtrer par grande catégorie
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <button
                  onClick={() => handleMegaCategoryFilter('all')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    selectedMegaCategory === 'all'
                      ? 'bg-[var(--secondary-500)] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes les solutions ({totalProducts})
                </button>
                {megaCategories.map((megaCat) => {
                  // Get the organized data for this mega category
                  const megaCatData = productsByMegaCategory[megaCat.id] || {
                    ...megaCat,
                    products: [],
                    categories: []
                  };
                  const IconComponent = iconMap[megaCat.icon] || Lightbulb;
                  const colorClasses = {
                    orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
                    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
                    teal: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
                    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
                    gray: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  };
                  
                  return (
                    <button
                      key={megaCat.id}
                      onClick={() => handleMegaCategoryFilter(megaCat.slug)}
                      className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all border flex items-center gap-1.5 md:gap-2 ${
                        selectedMegaCategory === megaCat.slug
                          ? `${colorClasses[megaCat.color] || colorClasses.gray} border-2 shadow-md`
                          : `${colorClasses[megaCat.color] || colorClasses.gray} border`
                      }`}
                    >
                      <IconComponent className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {megaCat.label} ({megaCatData.products.length})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products by Mega Category */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--secondary-500)]" />
              </div>
            ) : Object.keys(filteredProductsByMegaCategory).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-base mb-2">Aucun produit disponible.</p>
                <p className="text-gray-500 text-sm">
                  Les produits seront disponibles une fois la base de données configurée.
                </p>
              </div>
            ) : (
              <div className="space-y-8 md:space-y-12">
                {Object.values(filteredProductsByMegaCategory).length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-base mb-2">Aucun produit dans cette catégorie pour le moment.</p>
                    <p className="text-gray-500 text-sm">
                      Les produits seront ajoutés prochainement.
                    </p>
                  </div>
                ) : (
                  Object.values(filteredProductsByMegaCategory).map((megaCat) => {
                    const IconComponent = iconMap[megaCat.icon] || Lightbulb;
                  const colorClasses = {
                    orange: 'bg-orange-50 border-orange-200',
                    blue: 'bg-blue-50 border-blue-200',
                    yellow: 'bg-yellow-50 border-yellow-200',
                    teal: 'bg-teal-50 border-teal-200',
                    purple: 'bg-purple-50 border-purple-200',
                    gray: 'bg-gray-50 border-gray-200'
                  };
                  
                  return (
                    <motion.section
                      key={megaCat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`rounded-xl border-2 p-4 md:p-6 ${colorClasses[megaCat.color] || colorClasses.gray}`}
                    >
                      {/* Mega Category Header */}
                      <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                        <div className={`p-2 md:p-3 rounded-lg ${
                          megaCat.color === 'orange' ? 'bg-orange-100' :
                          megaCat.color === 'blue' ? 'bg-blue-100' :
                          megaCat.color === 'yellow' ? 'bg-yellow-100' :
                          megaCat.color === 'teal' ? 'bg-teal-100' :
                          megaCat.color === 'purple' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          <IconComponent className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                            {megaCat.label}
                          </h2>
                          <p className="text-xs md:text-sm text-gray-600">
                            {megaCat.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs md:text-sm text-gray-500">
                            {megaCat.products.length} {megaCat.products.length === 1 ? 'produit' : 'produits'}
                          </p>
                        </div>
                      </div>

                      {/* Products Grid */}
                      {megaCat.products.length === 0 ? (
                        <div className="text-center py-8 md:py-12 bg-white/50 rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-sm md:text-base text-gray-600 mb-2 font-medium">
                            Aucun produit disponible pour le moment
                          </p>
                          <p className="text-xs md:text-sm text-gray-500 mb-4">
                            Les produits de cette catégorie seront ajoutés prochainement.
                          </p>
                          <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-all text-xs md:text-sm font-medium"
                          >
                            Nous contacter
                            <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                          {megaCat.products.map((product) => {
                            const imageUrl = getImageUrl(product.image_1 || product.image_url);
                            return (
                              <div
                                key={product.id}
                                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[var(--secondary-500)]/30"
                              >
                                <div className="relative">
                                  <div 
                                    className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer relative z-10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (imageUrl) {
                                        const allImages = [
                                          product.image_1 || product.image_url,
                                          product.image_2,
                                          product.image_3,
                                          product.image_4
                                        ].filter(Boolean).map(img => getImageUrl(img));
                                        if (allImages.length > 0) {
                                          setGalleryImages(allImages);
                                          setGalleryIndex(0);
                                          setGalleryOpen(true);
                                        }
                                      }
                                    }}
                                  >
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt={product.nom}
                                        className="w-full h-full object-contain p-3 md:p-4 lg:p-2 max-w-[80%] max-h-[80%] mx-auto group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                          e.target.src = '/images/product-placeholder.svg';
                                        }}
                                      />
                                    ) : (
                                      <div className="text-gray-400 text-xs">Pas d'image</div>
                                    )}
                                  </div>
                                </div>
                                <Link to={`/produit/${product.slug}`}>
                                  <div className="p-2 md:p-3">
                                    {product.marque && (
                                      <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 md:mb-1 uppercase tracking-wide">
                                        {product.marque}
                                      </p>
                                    )}
                                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0.5 md:mb-1 group-hover:text-[var(--secondary-500)] transition-colors line-clamp-2">
                                      {product.nom}
                                    </h3>
                                    {product.reference && (
                                      <p className="text-[10px] md:text-xs text-gray-500 mb-1 md:mb-1.5">
                                        Réf: {product.reference}
                                      </p>
                                    )}
                                    {product.description && (
                                      <p className="text-gray-600 mb-1.5 md:mb-2 line-clamp-2 text-[10px] md:text-xs leading-relaxed">
                                        {product.description}
                                      </p>
                                    )}
                                    {product.puissance && (
                                      <p className="text-[10px] md:text-xs text-gray-700 mb-1 md:mb-1.5">
                                        <strong>Puissance:</strong> {product.puissance}W
                                      </p>
                                    )}
                                    {product.sur_devis || !product.prix ? (
                                      <p className="text-xs md:text-sm font-semibold text-gray-600 mb-1.5 md:mb-2">
                                        Sur devis
                                      </p>
                                    ) : (
                                      <div className="mb-1.5 md:mb-2">
                                        <p className="text-sm md:text-base lg:text-lg font-bold text-[var(--secondary-500)]">
                                          {typeof product.prix === 'number' 
                                            ? `${product.prix.toFixed(2)} € HT` 
                                            : product.prix}
                                        </p>
                                        <p className="text-[10px] md:text-xs text-gray-500">
                                          soit {(parseFloat(product.prix) * 1.2).toFixed(2)} € TTC
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="px-2 md:px-3 pb-2 md:pb-3 flex flex-col sm:flex-row gap-1.5 md:gap-2">
                                  <Link
                                    to={`/produit/${product.slug}`}
                                    className="flex-1"
                                  >
                                    <Button variant="outline" className="w-full text-[10px] md:text-xs py-1.5 md:py-2 h-auto">
                                      Voir détails
                                      <ArrowRight className="ml-1 h-2.5 w-2.5 md:h-3 md:w-3" />
                                    </Button>
                                  </Link>
                                  <Button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleAddToCart(product);
                                    }}
                                    className="bg-[var(--secondary-500)] hover:bg-[var(--secondary-600)] text-[10px] md:text-xs py-1.5 md:py-2 h-auto px-2 md:px-3 w-full sm:w-auto"
                                  >
                                    <ShoppingCart className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.section>
                  );
                  })
                )}
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-8 md:mt-12 bg-gray-50 rounded-lg p-4 md:p-6 lg:p-8 text-center">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                Besoin d'un conseil personnalisé ?
              </h2>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-4 md:mb-6">
                Notre équipe d'experts est à votre disposition pour vous guider dans le choix de vos solutions d'efficacité énergétique.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-all font-semibold text-sm md:text-base shadow-sm hover:shadow-md"
              >
                Demander un devis gratuit
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <ImageGallery
        images={galleryImages}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialIndex={galleryIndex}
      />
    </>
  );
};

export default ProduitsSolutions;
