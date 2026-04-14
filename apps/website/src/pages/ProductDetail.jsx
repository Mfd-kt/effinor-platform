import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import {
  Loader2, Award, ShieldCheck, Phone, ArrowLeft, ShoppingCart,
  Download, FileText, CheckCircle2, TrendingUp, Star, Heart,
  Clock, Maximize2, ChevronLeft, ChevronRight, Package, Truck,
  RotateCcw, ArrowRight, Mail, Zap, Award as AwardIcon
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDisplaySpecsForProduct } from '@/utils/productSpecs';
import { getAccessoriesForProduct } from '@/lib/api/products';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [imageZoom, setImageZoom] = useState(false);
  const [accessories, setAccessories] = useState([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [accessoriesError, setAccessoriesError] = useState(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const formatCategory = useCallback((categorySlug) => {
    if (!categorySlug) return '';
    const names = {
      'luminaires_industriels': 'Luminaires Industriels',
      'eclairage_exterieur': 'Éclairage Extérieur',
      'eclairage_etanche': 'Éclairage Étanche',
      'accessoires': 'Accessoires',
    };
    return names[categorySlug] || categorySlug.replace(/_/g, ' ').toUpperCase();
  }, []);

  // Construct image URL helper
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return imagePath;
    if (supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/effinor-assets/${imagePath}`;
    }
    return imagePath;
  }, [supabaseUrl]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) {
        setError("Aucun produit spécifié.");
        setLoading(false);
        return;
      }

      logger.log(`Fetching product with slug: ${slug}`);
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('products')
          .select('id, nom, description, prix, categorie, slug, actif, image_1, image_2, image_3, image_4, image_url, caracteristiques, fiche_technique, puissance, luminosite, sur_devis, ordre, marque, reference, materiaux, temperature_couleur, indice_rendu_couleurs, commande_controle, tension_entree, angle_faisceau, protection, installation, dimensions, poids_net')
          .eq('slug', slug)
          .eq('actif', true)
          .single();

        if (supabaseError) {
          if (supabaseError.code === 'PGRST116') {
            throw new Error("Produit non trouvé ou non disponible.");
          }
          throw supabaseError;
        }
        
        logger.log("Product loaded successfully:", data);
        
        // Vérifier que le produit a au moins une image
        if (!data.image_1 && !data.image_url) {
          throw new Error("Ce produit n'est pas disponible car il n'a pas de photo. Veuillez contacter l'administrateur.");
        }
        
        const mainImageUrl = getImageUrl(data.image_1 || data.image_url);
        setProduct(data);
        setMainImage(mainImageUrl);
      } catch (err) {
        logger.error("Error loading product:", err);
        setError(err.message || "Une erreur est survenue lors du chargement du produit.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug, getImageUrl]);

  // Charger les accessoires du produit une fois le produit disponible
  useEffect(() => {
    const loadAccessories = async () => {
      if (!product?.id) return;

      setLoadingAccessories(true);
      setAccessoriesError(null);

      try {
        const result = await getAccessoriesForProduct(product.id);

        if (!result.success) {
          setAccessoriesError(result.error || "Erreur lors du chargement des accessoires.");
          setAccessories([]);
          return;
        }

        setAccessories(result.data || []);
      } catch (err) {
        logger.error('[ProductDetail] Error loading accessories:', err);
        setAccessoriesError(err.message || "Erreur lors du chargement des accessoires.");
        setAccessories([]);
      } finally {
        setLoadingAccessories(false);
      }
    };

    loadAccessories();
  }, [product?.id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    toast({
      title: "✅ Produit ajouté au panier !",
      description: `${product.nom} a été ajouté. Vous pouvez continuer vos achats ou finaliser votre demande de devis.`,
    });
  };

  const handleRequestQuote = () => {
    if (!product) return;
    // Store product info for quote form
    localStorage.setItem('devis_product', JSON.stringify(product));
    localStorage.setItem('devis_product_id', product.id);
    // Navigate to contact page with product info
    navigate(`/contact?product=${product.slug}&type=devis`);
  };

  // Get all gallery images
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = [
      product.image_1,
      product.image_2,
      product.image_3,
      product.image_4
    ].filter(Boolean);
    
    return images.map(img => getImageUrl(img));
  }, [product, getImageUrl]);

  // Update main image when thumbnail is clicked
  useEffect(() => {
    if (galleryImages.length > 0 && galleryImages[selectedImageIndex]) {
      setMainImage(galleryImages[selectedImageIndex]);
    }
  }, [selectedImageIndex, galleryImages]);

  // Navigate images with keyboard
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (imageZoom && galleryImages.length > 1) {
        if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
          setSelectedImageIndex(selectedImageIndex - 1);
        } else if (e.key === 'ArrowRight' && selectedImageIndex < galleryImages.length - 1) {
          setSelectedImageIndex(selectedImageIndex + 1);
        } else if (e.key === 'Escape') {
          setImageZoom(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [imageZoom, selectedImageIndex, galleryImages.length]);

  // Specs display helper
  // Get PDF URL
  const pdfUrl = useMemo(() => {
    if (!product?.fiche_technique) return null;
    return getImageUrl(product.fiche_technique);
  }, [product?.fiche_technique, getImageUrl]);

  const { schema: specSchema, heroSpecs, allSpecs } = useMemo(
    () => getDisplaySpecsForProduct(product || {}),
    [product]
  );

  // Calculate categoryName early, even if product might be null
  const categoryName = product ? formatCategory(product.categorie) : '';

  // Schema.org JSON-LD pour le produit (défini avant les early returns)
  const productSchema = useMemo(() => {
    if (!product) return null;

    const mainImageUrl = getImageUrl(product.image_1 || product.image_url);
    const allImages = [
      product.image_1,
      product.image_2,
      product.image_3,
      product.image_4,
      product.image_url
    ]
      .filter(Boolean)
      .map(img => getImageUrl(img))
      .filter(Boolean);

    const currentUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '';
    const price = product.prix ? parseFloat(product.prix) : null;
    const availability = product.actif ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    const priceCurrency = 'EUR';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.nom,
      description: product.description || `Découvrez ${product.nom} sur Effinor. Solutions LED professionnelles haute performance.`,
      image: allImages.length > 0 ? allImages : (mainImageUrl ? [mainImageUrl] : []),
      brand: {
        '@type': 'Brand',
        name: product.marque || 'Effinor'
      },
      sku: product.reference || product.slug || product.id,
      mpn: product.reference || undefined,
      category: categoryName,
      url: currentUrl,
      ...(price && !product.sur_devis ? {
        offers: {
          '@type': 'Offer',
          price: price,
          priceCurrency: priceCurrency,
          availability: availability,
          priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 an
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Effinor',
            url: typeof window !== 'undefined' ? window.location.origin : ''
          }
        }
      } : {
        offers: {
          '@type': 'Offer',
          availability: availability,
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            priceCurrency: priceCurrency,
            valueAddedTaxIncluded: false
          }
        }
      })
    };

    // Ajouter les propriétés additionnelles si disponibles
    if (product.puissance) {
      schema.additionalProperty = schema.additionalProperty || [];
      schema.additionalProperty.push({
        '@type': 'PropertyValue',
        name: 'Puissance',
        value: `${product.puissance}W`
      });
    }

    if (product.luminosite) {
      schema.additionalProperty = schema.additionalProperty || [];
      schema.additionalProperty.push({
        '@type': 'PropertyValue',
        name: 'Flux lumineux',
        value: `${product.luminosite}lm`
      });
    }

    if (product.caracteristiques) {
      try {
        const specs = typeof product.caracteristiques === 'string' 
          ? JSON.parse(product.caracteristiques) 
          : product.caracteristiques;
        
        if (specs && typeof specs === 'object') {
          schema.additionalProperty = schema.additionalProperty || [];
          Object.entries(specs).forEach(([key, value]) => {
            if (value && (typeof value === 'string' || typeof value === 'number')) {
              schema.additionalProperty.push({
                '@type': 'PropertyValue',
                name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: String(value)
              });
            }
          });
        }
      } catch (e) {
        logger.warn('Error parsing caracteristiques for schema:', e);
      }
    }

    return schema;
  }, [product, categoryName, getImageUrl]);

  // Breadcrumb Schema.org (défini avant les early returns)
  const breadcrumbSchema = useMemo(() => {
    if (!product) return null;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Accueil',
          item: `${baseUrl}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Produits & Solutions',
          item: `${baseUrl}/produits-solutions`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: categoryName,
          item: `${baseUrl}/produits-solutions/${product.categorie}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: product.nom,
          item: typeof window !== 'undefined' ? window.location.href : ''
        }
      ]
    };
  }, [product, categoryName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-16 w-16 animate-spin text-secondary-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement du produit...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center bg-white p-8 rounded-2xl shadow-xl"
          >
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Produit non trouvé</h1>
            <p className="text-gray-600 mb-6">{error || "Le produit demandé n'existe pas ou n'est plus disponible."}</p>
            <Link to="/produits-solutions">
              <Button className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux produits
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const schemaType = specSchema?.type || null;
  const schemaLabel = specSchema?.label || categoryName;
  const fallbackKpiSpecs = [
    product?.puissance && {
      key: 'fallback_puissance',
      label: 'Puissance électrique (max.)',
      value: product.puissance,
      unit: 'W',
    },
    product?.luminosite && {
      key: 'fallback_flux',
      label: 'Flux lumineux',
      value: product.luminosite,
      unit: 'lm',
    },
  ].filter(Boolean);
  const kpiSpecs = heroSpecs.length ? heroSpecs : fallbackKpiSpecs;
  const hasSpecs = allSpecs.length > 0;

  return (
    <>
      <Helmet>
        {/* Langue du site */}
        <html lang="fr" />
        <meta httpEquiv="content-language" content="fr" />
        
        <title>{`${product.nom} | Effinor - Luminaires LED Professionnels`}</title>
        <meta name="description" content={product.description || `Découvrez ${product.nom} sur Effinor. Solutions LED professionnelles haute performance pour l'industrie et le tertiaire.`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${product.nom} | Effinor`} />
        <meta property="og:description" content={product.description || `Découvrez ${product.nom} sur Effinor.`} />
        {product.image_1 || product.image_url ? (
          <meta property="og:image" content={getImageUrl(product.image_1 || product.image_url)} />
        ) : null}
        <meta
          property="og:url"
          content={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''}
        />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Effinor" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.nom} | Effinor`} />
        <meta name="twitter:description" content={product.description || `Découvrez ${product.nom} sur Effinor.`} />
        {product.image_1 || product.image_url ? (
          <meta name="twitter:image" content={getImageUrl(product.image_1 || product.image_url)} />
        ) : null}
        
        {/* Schema.org JSON-LD - Product */}
        {productSchema && (
          <script type="application/ld+json">
            {JSON.stringify(productSchema, null, 2)}
          </script>
        )}
        
        {/* Schema.org JSON-LD - Breadcrumb */}
        {breadcrumbSchema && (
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema, null, 2)}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link to="/" className="hover:text-secondary-600 transition-colors font-medium">Accueil</Link>
                </li>
                <li className="text-gray-400">/</li>
                <li>
                  <Link to="/produits-solutions" className="hover:text-secondary-600 transition-colors font-medium">Produits & Solutions</Link>
                </li>
                <li className="text-gray-400">/</li>
                <li>
                  <Link to={`/produits-solutions/${product.categorie}`} className="hover:text-secondary-600 transition-colors font-medium">{categoryName}</Link>
                </li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 font-semibold truncate max-w-xs">{product.nom}</li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8 xl:py-12 max-w-7xl overflow-x-hidden">
          <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 xl:gap-12 mb-6 md:mb-8 lg:mb-12">
            {/* Image Gallery Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Main Image with Zoom */}
              <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden group">
                <div className="aspect-square relative">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={mainImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      src={mainImage || 'https://via.placeholder.com/800x800?text=Image+non+disponible'}
                      alt={product.nom}
                      className="w-full h-full object-contain p-4 md:p-6 lg:p-8 max-w-[85%] max-h-[85%] mx-auto cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
                      onClick={() => galleryImages.length > 0 && setImageZoom(true)}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/800x800?text=Image+non+disponible';
                      }}
                    />
                  </AnimatePresence>
                  
                  {/* Zoom Icon */}
                  {galleryImages.length > 0 && (
                    <button
                      onClick={() => setImageZoom(true)}
                      className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Maximize2 className="w-5 h-5 text-gray-700" />
                    </button>
                  )}


                  {/* Image Navigation Arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      {selectedImageIndex > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex(selectedImageIndex - 1);
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                      )}
                      {selectedImageIndex < galleryImages.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex(selectedImageIndex + 1);
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {galleryImages.map((img, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        setSelectedImageIndex(index);
                        setMainImage(img);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-secondary-500 ring-4 ring-secondary-500/20 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-secondary-300 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={img || 'https://via.placeholder.com/200x200'}
                        alt={`Aperçu ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/200x200';
                        }}
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 bg-secondary-500/10 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-secondary-500" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <Package className="w-4 h-4 text-secondary-500" />
                  <span>En stock</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <Truck className="w-4 h-4 text-secondary-500" />
                  <span>Livraison rapide</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <RotateCcw className="w-4 h-4 text-secondary-500" />
                  <span>Retour facile</span>
                </div>
              </div>
            </motion.div>

            {/* Product Info Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Category Badge */}
              <div>
                <Badge variant="outline" className="text-sm px-4 py-2 border-secondary-500 text-secondary-600 font-semibold">
                  {categoryName}
                </Badge>
              </div>

              {/* Product Name */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">{product.nom}</h1>
              {(product.marque || product.reference) && (
                <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                  {product.marque && (
                    <span>
                      <span className="font-semibold text-gray-800">Marque :</span> {product.marque}
                    </span>
                  )}
                  {product.reference && (
                    <span>
                      <span className="font-semibold text-gray-800">Référence :</span> {product.reference}
                    </span>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              {kpiSpecs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-gray-200">
                  {kpiSpecs.map((spec) => (
                    <div
                      key={spec.key}
                      className="rounded-2xl bg-white shadow-sm border border-gray-100 px-4 py-3"
                    >
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        {spec.label}
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {spec.value}
                        {spec.unit && (
                          <span className="text-sm text-gray-500 ml-1">{spec.unit}</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Section */}
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl p-6 border-2 border-secondary-200">
                {product.sur_devis || !product.prix ? (
                  <div>
                    <p className="text-sm text-secondary-700 font-medium mb-2">Prix sur devis</p>
                    <p className="text-3xl font-bold text-secondary-900">Sur devis</p>
                    <p className="text-sm text-secondary-600 mt-2">Contactez-nous pour un devis personnalisé</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl font-bold text-secondary-900 mb-1">{parseFloat(product.prix).toFixed(2)} € HT</p>
                    <p className="text-sm text-secondary-600">soit {(parseFloat(product.prix) * 1.20).toFixed(2)} € TTC</p>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleRequestQuote}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-6 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex-1 group"
                    size="lg"
                  >
                    <Mail className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> 
                    Demander un devis
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-6 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex-1 group"
                    size="lg"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> 
                    Ajouter au panier
                  </Button>
                </div>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-gray-50 rounded-xl font-semibold transition-all border-2 border-gray-300 hover:border-secondary-500 text-gray-700 hover:text-secondary-600 shadow-md hover:shadow-lg"
                  >
                    <FileText className="w-5 h-5" /> Télécharger la fiche technique (PDF)
                  </a>
                )}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-secondary-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Garantie 5 ans</p>
                      <p className="text-xs text-gray-600">Matériel & Installation</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <Truck className="w-8 h-8 text-secondary-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Livraison rapide</p>
                      <p className="text-xs text-gray-600">24-48h en stock</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Quick */}
              <div className="bg-gradient-to-r from-primary-900 to-primary-800 bg-dark-section rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm opacity-90 mb-1">Une question sur ce produit ?</p>
                    <a 
                      href="tel:0978455063" 
                      className="text-2xl font-bold hover:text-secondary-400 transition-colors flex items-center gap-2"
                    >
                      09 78 45 50 63
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          </div>

          {/* Tabs Section */}
          <div className="mb-12">
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {['description', 'caracteristiques', 'garantie'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-2 font-semibold text-sm border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-secondary-500 text-secondary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'description' && 'Description'}
                    {tab === 'caracteristiques' && 'Caractéristiques'}
                    {tab === 'garantie' && 'Garantie & Éligibilité'}
                  </button>
                ))}
              </nav>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                {activeTab === 'description' && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                      {product.description || 'Aucune description disponible pour ce produit.'}
                    </p>
                  </div>
                )}

                {activeTab === 'caracteristiques' && (
                  <div>
                    {schemaType && (
                      <p className="text-xs uppercase tracking-wide text-secondary-600 font-semibold mb-4">
                        {schemaType === 'luminaire' && 'Profil Luminaire'}
                        {schemaType === 'destratificateur' && "Profil Déstratificateur d'air"}
                        {schemaType !== 'luminaire' &&
                          schemaType !== 'destratificateur' &&
                          `Profil ${schemaType}`}
                      </p>
                    )}
                    {allSpecs.length > 0 ? (
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {allSpecs.map((spec) => (
                          <div key={spec.key} className="flex flex-col">
                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {spec.label}
                            </dt>
                            <dd className="text-base text-gray-900">
                              {spec.value}
                              {spec.unit && <span className="ml-1 text-gray-500">{spec.unit}</span>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Les caractéristiques détaillées seront bientôt disponibles pour ce produit.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'garantie' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <ShieldCheck className="w-7 h-7 text-secondary-500" />
                        Garantie
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-secondary-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">Garantie constructeur</p>
                            <p className="text-gray-600">5 ans sur le matériel</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-secondary-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">Garantie installation</p>
                            <p className="text-gray-600">5 ans sur l'installation</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-secondary-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">Support technique</p>
                            <p className="text-gray-600">Assistance continue disponible</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <AwardIcon className="w-7 h-7 text-accent-500" />
                        Avantages & Certifications
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-accent-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">Certifications</p>
                            <p className="text-gray-600">Normes CE, IP65/IK08, RoHS, conforme aux réglementations européennes</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-accent-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">Performance énergétique</p>
                            <p className="text-gray-600">Technologie LED haute efficacité, jusqu'à 80% d'économie d'énergie vs éclairage traditionnel</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-accent-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">Durabilité</p>
                            <p className="text-gray-600">Durée de vie jusqu'à 50 000h, réduction des coûts de maintenance</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-accent-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-900">Qualité professionnelle</p>
                            <p className="text-gray-600">Fabrication européenne, testé et certifié selon les standards industriels</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {hasSpecs && (
            <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Caractéristiques techniques</h3>
                <Badge className="bg-secondary-100 text-secondary-700 text-xs uppercase tracking-wide">
                  {schemaLabel}
                </Badge>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allSpecs.map((spec) => (
                  <div key={spec.key} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {spec.label}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 mt-1">
                      {spec.value}
                      {spec.unit && <span className="ml-1 text-gray-500">{spec.unit}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Accessoires compatibles */}
          {(!loadingAccessories && accessoriesError && !accessories.length) && (
            <section className="bg-white rounded-2xl border border-gray-200 p-4 mb-8">
              <p className="text-xs md:text-sm text-gray-500">
                Les accessoires compatibles seront bientôt disponibles pour ce produit.
              </p>
            </section>
          )}

          {accessories.length > 0 && (
            <section className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 md:mb-4">
                <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">
                  Accessoires compatibles
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Accessoires recommandés pour compléter parfaitement ce produit.
                </p>
              </div>

              {loadingAccessories ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-secondary-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {accessories.map((accessory) => {
                    const accImageUrl = getImageUrl(accessory.image_1 || accessory.image_url);

                    return (
                      <div
                        key={accessory.id}
                        className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 hover:border-secondary-500/30"
                      >
                        <Link to={`/produit/${accessory.slug}`}>
                          <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                            {accImageUrl ? (
                              <img
                                src={accImageUrl}
                                alt={accessory.nom}
                                className="w-full h-full object-contain p-3 md:p-4 max-w-[80%] max-h-[80%] mx-auto group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.src = 'https://placehold.co/400x400/e2e8f0/e2e8f0?text=Image';
                                }}
                              />
                            ) : (
                              <div className="text-gray-400 text-xs">Pas d'image</div>
                            )}
                          </div>
                        </Link>
                        <div className="p-2 md:p-3">
                          <Link to={`/produit/${accessory.slug}`}>
                            <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-secondary-500 transition-colors">
                              {accessory.nom}
                            </h3>
                          </Link>
                          {accessory.description && (
                            <p className="text-[10px] md:text-xs text-gray-600 mb-1.5 line-clamp-2">
                              {accessory.description}
                            </p>
                          )}
                          {accessory.prix && !accessory.sur_devis && (
                            <div className="mb-1.5">
                              <p className="text-xs md:text-sm font-semibold text-secondary-500">
                                {typeof accessory.prix === 'number'
                                  ? `${accessory.prix.toFixed(2)} € HT`
                                  : accessory.prix}
                              </p>
                              <p className="text-[10px] md:text-xs text-gray-500">
                                {typeof accessory.prix === 'number'
                                  ? `soit ${(accessory.prix * 1.20).toFixed(2)} € TTC`
                                  : ''}
                              </p>
                            </div>
                          )}
                          {accessory.sur_devis && (
                            <p className="text-[10px] md:text-xs text-gray-500 mb-1.5">
                              Prix sur devis
                            </p>
                          )}
                        </div>
                        <div className="px-2 md:px-3 pb-2 md:pb-3">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(accessory);
                            }}
                            className="w-full bg-secondary-500 hover:bg-secondary-600 text-[10px] md:text-xs py-1.5 md:py-2 h-auto"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Ajouter au panier
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}


          {/* Why Choose Effinor Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-primary-900 bg-dark-section rounded-3xl shadow-2xl p-8 lg:p-12 mb-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Pourquoi choisir Effinor ?</h2>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Des solutions LED professionnelles pour optimiser votre efficacité énergétique
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: TrendingUp, title: "Livraison rapide", desc: "Expédition sous 24-48h pour tous nos produits en stock" },
                { icon: Clock, title: "Installation Rapide", desc: "Intervention en 7 jours sans interruption d'activité" },
                { icon: ShieldCheck, title: "Garantie 5 ans", desc: "Matériel et installation garantis par nos experts" },
                { icon: Star, title: "Accompagnement", desc: "Suivi personnalisé de A à Z par nos spécialistes" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all shadow-lg backdrop-blur-sm"
                >
                  <div className="bg-secondary-500/30 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Image Zoom Modal */}
        <AnimatePresence>
          {imageZoom && galleryImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setImageZoom(false)}
            >
              <motion.button
                onClick={() => setImageZoom(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all"
              >
                <span className="text-2xl">×</span>
              </motion.button>

              {galleryImages.length > 1 && (
                <>
                  {selectedImageIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(selectedImageIndex - 1);
                      }}
                      className="absolute left-4 bg-white/10 hover:bg-white/20 rounded-full p-4 text-white transition-all"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                  )}
                  {selectedImageIndex < galleryImages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(selectedImageIndex + 1);
                      }}
                      className="absolute right-4 bg-white/10 hover:bg-white/20 rounded-full p-4 text-white transition-all"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  )}
                </>
              )}

              <motion.img
                key={selectedImageIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={galleryImages[selectedImageIndex]}
                alt={product.nom}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />

              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {galleryImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        selectedImageIndex === index ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ProductDetail;
