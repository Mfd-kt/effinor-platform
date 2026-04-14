import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, Copy, Eye, EyeOff, ChevronLeft, ChevronRight, PlugZap, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import { getSpecSummary } from '@/utils/productSpecs';
import { ProductsFilters } from '@/components/admin/products/ProductsFilters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatCategory = (category, categoriesList = []) => {
  if (!category) return 'Non catégorisé';
  const found = categoriesList.find(c => c.slug === category || c.id === category);
  return found ? found.nom : category;
};

const AdminProductCard = ({ product, onDuplicate, onDelete, onToggleStatus, onEdit, onManageAccessories, categoriesList = [] }) => {
  const specSummary = getSpecSummary(product);

  // Toute la carte ouvre la page d'édition admin
  const handleCardClick = () => {
    onEdit(product.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border-0 shadow-lg shadow-gray-500/10 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 overflow-hidden cursor-pointer block bg-gradient-to-br from-white to-gray-50/50"
      data-product-id={product.id}
    >
      {/* Image Section */}
      <div className="relative bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 h-52 overflow-hidden">
        <img 
          src={product.image_url || product.image_1 || '/images/product-placeholder.svg'} 
          alt={product.nom}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            if (e.target.dataset.fallbackApplied === 'true') {
              return;
            }
            e.target.dataset.fallbackApplied = 'true';
            e.target.src = '/images/product-placeholder.svg';
          }}
        />
        {/* Badges overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {product.prime_cee && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30 border-0">
              CEE
            </span>
          )}
          {product.actif ? (
            <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-green-300 shadow-sm">
              ✓ Actif
            </span>
          ) : (
            <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-gray-300 shadow-sm">
              ⊘ Inactif
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-green-600 uppercase tracking-wider bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-lg border border-green-200">
            {formatCategory(product.categorie, categoriesList)}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-green-600 transition-colors">
          {product.nom}
        </h3>

        {/* Brand & Reference */}
        {(product.marque || product.reference) && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {product.marque && (
              <span className="font-bold text-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                {product.marque}
              </span>
            )}
            {product.reference && (
              <span className="text-gray-600 font-medium font-mono">
                Réf. {product.reference}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed font-medium">
          {product.description}
        </p>
        
        {/* Specifications */}
        <div className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 shadow-sm">
          {specSummary ? (
            <p className="text-xs font-semibold text-gray-700 leading-relaxed">
              {specSummary}
            </p>
          ) : (
            <p className="text-xs italic text-gray-400 font-medium">
              Caractéristiques non renseignées
            </p>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
          <div className="flex flex-col">
            {product.sur_devis || !product.prix || product.prix === '' || product.prix === null ? (
              <span className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">Sur devis</span>
            ) : (
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {product.prix ? `${parseFloat(product.prix).toFixed(2)}€` : 'N/A'}
              </span>
            )}
          </div>
          
          {/* Les actions ne doivent PAS déclencher la navigation vers la page d'édition */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleStatus(product.id, product.actif);
              }} 
              title={product.actif ? "Désactiver" : "Activer"}
              className="h-9 w-9 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all hover:shadow-sm"
            >
              {product.actif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(product.id);
              }} 
              title="Modifier"
              className="h-9 w-9 rounded-lg hover:bg-green-50 hover:text-green-600 transition-all hover:shadow-sm"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onManageAccessories(product.id);
              }}
              title="Gérer les accessoires"
              className="h-9 w-9 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all hover:shadow-sm"
            >
              <PlugZap className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDuplicate(product.id);
              }} 
              title="Dupliquer"
              className="h-9 w-9 rounded-lg hover:bg-yellow-50 hover:text-yellow-600 transition-all hover:shadow-sm"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all" 
                  title="Supprimer ce produit"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">⚠️ Supprimer le produit</AlertDialogTitle>
                  <AlertDialogDescription className="pt-2">
                    Êtes-vous sûr de vouloir supprimer définitivement le produit <strong>"{product.nom}"</strong> ?
                    <br />
                    <span className="text-red-600 font-medium">Cette action est irréversible.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(product.id)} 
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  // Note: La vérification des permissions est gérée par RequireRole dans App.jsx
  // Pas besoin de double vérification ici
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    search: '', 
    category: 'all', 
    status: 'all',
    priceRange: 'all',
    surDevis: 'all'
  });
  const [searchDebounced, setSearchDebounced] = useState(''); // Recherche avec debounce pour requêtes serveur
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Charger les catégories depuis Supabase
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data, error: categoriesError } = await supabase
        .from('categories')
        .select('id, nom, slug, ordre')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (categoriesError) {
        // Si la table n'existe pas, utiliser un fallback
        if (categoriesError.message?.includes('relation') || categoriesError.message?.includes('does not exist')) {
          setCategories([
            { id: 'luminaires_industriels', nom: 'Luminaires Industriels', slug: 'luminaires_industriels', ordre: 0 },
            { id: 'eclairage_exterieur', nom: 'Éclairage Extérieur', slug: 'eclairage_exterieur', ordre: 1 },
            { id: 'eclairage_etanche', nom: 'Éclairage Étanche', slug: 'eclairage_etanche', ordre: 2 },
            { id: 'accessoires', nom: 'Accessoires', slug: 'accessoires', ordre: 3 },
          ]);
        } else {
          throw categoriesError;
        }
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      logger.error('Erreur chargement catégories:', err);
      // Fallback en cas d'erreur
      setCategories([
        { id: 'luminaires_industriels', nom: 'Luminaires Industriels', slug: 'luminaires_industriels', ordre: 0 },
        { id: 'eclairage_exterieur', nom: 'Éclairage Extérieur', slug: 'eclairage_exterieur', ordre: 1 },
        { id: 'eclairage_etanche', nom: 'Éclairage Étanche', slug: 'eclairage_etanche', ordre: 2 },
        { id: 'accessoires', nom: 'Accessoires', slug: 'accessoires', ordre: 3 },
      ]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query with server-side filters
      let query = supabase
        .from('products')
        .select('id, nom, description, prix, actif, categorie, slug, image_1, image_url, ordre, marque, reference, caracteristiques, prime_cee, sur_devis', { count: 'exact' });
      
      // Apply search filter (server-side) - recherche multi-colonnes avec ilike
      if (searchDebounced && searchDebounced.trim() !== '') {
        const searchTerm = `%${searchDebounced.trim()}%`;
        // Recherche dans nom, description, marque, reference, slug, categorie
        // Supabase OR syntax: column.ilike.value,column2.ilike.value (sans guillemets autour des valeurs)
        query = query.or(`nom.ilike.${searchTerm},description.ilike.${searchTerm},marque.ilike.${searchTerm},reference.ilike.${searchTerm},slug.ilike.${searchTerm},categorie.ilike.${searchTerm}`);
      }
      
      // Apply category filter (server-side)
      if (filters.category && filters.category !== 'all') {
        query = query.eq('categorie', filters.category);
      }
      
      // Apply status filter (server-side)
      if (filters.status && filters.status !== 'all') {
        const isActif = filters.status === 'actif';
        query = query.eq('actif', isActif);
      }

      // Apply sur_devis filter (server-side)
      if (filters.surDevis && filters.surDevis !== 'all') {
        const isSurDevis = filters.surDevis === 'oui';
        query = query.eq('sur_devis', isSurDevis);
      }

      // Apply price range filter (server-side)
      if (filters.priceRange && filters.priceRange !== 'all') {
        // Exclure les produits sur devis pour le filtre prix
        query = query.eq('sur_devis', false);
        // Appliquer le filtre prix selon la plage
        switch (filters.priceRange) {
          case '<50':
            query = query.lt('prix', 50);
            break;
          case '50-100':
            query = query.gte('prix', 50).lt('prix', 100);
            break;
          case '100-200':
            query = query.gte('prix', 100).lt('prix', 200);
            break;
          case '200-500':
            query = query.gte('prix', 200).lt('prix', 500);
            break;
          case '>500':
            query = query.gte('prix', 500);
            break;
        }
      }
      
      // Apply ordering and pagination
      const { data, error: dbError, count } = await query
        .order('ordre', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (dbError) {
        
        // Afficher un toast si c'est une erreur RLS
        if (dbError.code === '42501' || dbError.message?.includes('row-level security') || dbError.message?.includes('permission denied')) {
          toast({
            variant: 'destructive',
            title: 'Erreur de permissions',
            description: 'Vous n\'avez pas les permissions nécessaires pour voir les produits. Vérifiez les politiques RLS dans Supabase.',
          });
        }
        
        throw dbError;
      }

      setAllProducts(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      const errorMessage = `Chargement des produits échoué: ${err.message}`;
      setError(errorMessage);
      toast({ 
        title: "Erreur de chargement", 
        description: "Impossible de charger les produits. Vérifiez votre connexion internet et réessayez. Si le problème persiste, contactez le support technique.",
        variant: "destructive" 
      });
      logger.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [toast, page, pageSize, filters.category, filters.status, filters.surDevis, filters.priceRange, searchDebounced]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);
  
  // Debounce pour la recherche (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);
  
  // Reset to page 0 when server-side filters change (including search and price)
  useEffect(() => {
    setPage(0);
  }, [filters.category, filters.status, filters.surDevis, filters.priceRange, searchDebounced]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = page > 0;
  const canGoNext = page < totalPages - 1;

  // Les produits sont déjà filtrés côté serveur, pas besoin de filtrage client supplémentaire
  const filteredProducts = useMemo(() => {
    return allProducts;
  }, [allProducts]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({ 
      search: '', 
      category: 'all', 
      status: 'all',
      priceRange: 'all',
      surDevis: 'all'
    });
    setPage(0);
  };

  const hasActiveFilters = filters.category !== 'all' || 
    filters.status !== 'all' || 
    filters.priceRange !== 'all' || 
    filters.surDevis !== 'all' || 
    (searchDebounced && searchDebounced.trim() !== '');

  const handleEdit = (productId) => {
    navigate(`/produits/${productId}/edit`);
  };

  const handleManageAccessories = (productId) => {
    navigate(`/produits/${productId}/accessoires`);
  };
  
  const handleDuplicateProduct = async (productId) => {
    const productToDuplicate = allProducts.find(p => p.id === productId);
    if (!productToDuplicate) return;

    const { id, created_at, updated_at, ...newProductData } = productToDuplicate;
    
    newProductData.nom = `${productToDuplicate.nom} (Copie)`;
    newProductData.slug = `${productToDuplicate.slug}-${Date.now()}`;
    newProductData.actif = false;
    newProductData.ordre = null;

    try {
      // Sanitize data before insertion
      const sanitizedProductData = sanitizeFormData(newProductData);
      const { error } = await supabase.from('products').insert([sanitizedProductData]);
      if (error) throw error;
      toast({ title: "Produit dupliqué", description: `Le produit "${newProductData.nom}" a été créé.` });
      fetchProducts();
    } catch (error) {
      toast({ title: "Erreur de duplication", description: `La duplication a échoué: ${error.message}`, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const { error } = await supabase.from('products').update({ actif: !currentStatus }).eq('id', productId);
      if (error) throw error;
      toast({ title: "Statut mis à jour", description: "Le statut du produit a été modifié avec succès." });
      fetchProducts();
    } catch (error) {
      toast({ title: "Erreur de mise à jour", description: `La mise à jour du statut a échoué: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDelete = async (productId) => {
    try {
      // Step 1: Supprimer tous les liens product_accessories où ce produit est impliqué
      // (soit comme produit principal, soit comme accessoire)
      const { error: linksError } = await supabase
        .from('product_accessories')
        .delete()
        .or(`product_id.eq.${productId},accessory_id.eq.${productId}`);
      
      if (linksError) {
        // Si la table n'existe pas ou autre erreur non-critique, on continue quand même
        // (la table pourrait ne pas exister dans certains environnements)
        if (linksError.code !== '42P01' && !linksError.message?.includes('does not exist')) {
          logger.warn('Erreur lors de la suppression des liens accessoires:', linksError);
          // On continue quand même, peut-être que les liens n'existent pas
        }
      }

      // Step 2: Supprimer le produit lui-même
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (deleteError) {
        // Vérifier si c'est une erreur de contrainte FK
        if (deleteError.code === '23503' || deleteError.message?.includes('foreign key constraint')) {
          const errorMsg = deleteError.message || 'Erreur de contrainte';
          // Extraire le nom de la table référencée si possible
          let detailMsg = 'Ce produit est encore référencé dans d\'autres tables.';
          if (errorMsg.includes('product_accessories')) {
            detailMsg = 'Ce produit est encore utilisé comme accessoire d\'un autre produit. Supprimez d\'abord les liens dans la gestion des accessoires.';
          } else if (errorMsg.includes('commandes_lignes')) {
            detailMsg = 'Ce produit est encore présent dans des commandes. Vous ne pouvez pas le supprimer.';
          }
          toast({ 
            title: "Erreur de suppression", 
            description: detailMsg,
            variant: "destructive" 
          });
        } else {
          throw deleteError;
        }
        return;
      }

      toast({ 
        title: "Produit supprimé", 
        description: "Le produit et ses liens d'accessoires ont été supprimés avec succès." 
      });
      fetchProducts();
    } catch (error) {
      logger.error('Erreur lors de la suppression du produit:', error);
      toast({ 
        title: "Erreur de suppression", 
        description: `La suppression a échoué: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive" 
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-state flex flex-col items-center justify-center py-20 col-span-full text-center">
            <Loader2 className="h-12 w-12 animate-spin text-secondary-600 mb-4" />
            <p className="text-gray-600">Chargement des produits...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-state col-span-full text-center py-20">
          <span className="text-4xl" role="img" aria-label="error">❌</span>
          <h3 className="text-xl font-semibold mt-4">Erreur de chargement</h3>
          <p className="text-gray-600 my-2">{error}</p>
          <Button onClick={fetchProducts}>Réessayer</Button>
        </div>
      );
    }
    // Vérifier si on a des filtres actifs pour déterminer le message approprié
    const hasActiveFilters = filters.category !== 'all' || 
      filters.status !== 'all' || 
      filters.priceRange !== 'all' || 
      filters.surDevis !== 'all' || 
      (searchDebounced && searchDebounced.trim() !== '');

    if (allProducts.length === 0 && !hasActiveFilters && totalCount === 0) {
        // Aucun produit du tout dans la base (sans filtres)
        return (
            <div className="empty-state col-span-full text-center py-20">
                <span className="text-6xl" role="img" aria-label="box">📦</span>
                <h3 className="text-2xl font-semibold mt-4">Aucun produit</h3>
                <p className="text-gray-600 my-2">Cliquez sur 'Ajouter un produit' pour commencer.</p>
                 <Link to="/produits/new">
                    <Button className="mt-4">Ajouter un produit</Button>
                </Link>
            </div>
        );
    }
    if (allProducts.length === 0 && hasActiveFilters) {
      // Aucun produit trouvé avec les filtres actifs
      return (
        <div className="empty-state col-span-full text-center py-20">
          <span className="text-6xl" role="img" aria-label="search">🕵️</span>
          <h3 className="text-2xl font-semibold mt-4">Aucun produit trouvé</h3>
          <p className="text-gray-600 my-2">
            {searchDebounced && searchDebounced.trim() !== '' 
              ? `Aucun produit ne correspond à "${searchDebounced}".`
              : 'Aucun produit ne correspond à vos critères de filtrage.'}
          </p>
          <p className="text-sm text-gray-500 my-2">Ajustez vos filtres ou créez un nouveau produit.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={resetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      );
    }
    return filteredProducts.map(product => (
      <AdminProductCard 
        key={product.id} 
        product={product} 
        onDuplicate={handleDuplicateProduct}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        onManageAccessories={handleManageAccessories}
        categoriesList={categories}
      />
    ));
  };

  const activeFiltersCount = [
    searchDebounced && searchDebounced.trim() !== '',
    filters.category !== 'all',
    filters.status !== 'all',
    filters.priceRange !== 'all',
    filters.surDevis !== 'all',
  ].filter(Boolean).length;

  return (
    <>
      <Helmet><title>Gestion des Produits | Effinor Admin</title></Helmet>
      <div className="admin-page pl-0 pr-4 pt-4 pb-4 md:pr-6 md:pt-6 md:pb-6 lg:pr-8 lg:pt-8 lg:pb-8 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 min-h-screen">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Gestion des Produits
                </h1>
              </div>
              <p className="text-sm text-gray-600 ml-16 font-medium">
                <span className="font-bold text-green-600" id="product-count">{totalCount}</span> produits au catalogue
                {activeFiltersCount > 0 && (
                  <span className="ml-2 text-orange-600 font-semibold">({activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''})</span>
                )}
              </p>
            </div>
            <Link to="/produits/new">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 h-12 px-6 rounded-xl font-bold">
                <PlusCircle className="mr-2 h-5 w-5" /> Ajouter un produit
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Filtres */}
        <ProductsFilters
          searchQuery={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          categoryFilter={filters.category}
          onCategoryFilterChange={(value) => handleFilterChange('category', value)}
          statusFilter={filters.status}
          onStatusFilterChange={(value) => handleFilterChange('status', value)}
          priceRangeFilter={filters.priceRange}
          onPriceRangeFilterChange={(value) => handleFilterChange('priceRange', value)}
          surDevisFilter={filters.surDevis}
          onSurDevisFilterChange={(value) => handleFilterChange('surDevis', value)}
          onResetFilters={resetFilters}
          categories={categories}
          activeFiltersCount={activeFiltersCount}
        />
        
        <div id="products-container" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {renderContent()}
        </div>
        
        {/* Pagination */}
        {totalCount > 0 && filteredProducts.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t-2 border-gray-200 bg-white rounded-xl shadow-sm px-6 py-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={!canGoPrevious}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={!canGoNext}
              >
                Suivant
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{allProducts.length > 0 ? page * pageSize + 1 : 0}</span> à{' '}
                  <span className="font-medium">{Math.min((page + 1) * pageSize, totalCount)}</span> sur{' '}
                  <span className="font-medium">{totalCount}</span> résultats
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <span className="text-sm text-gray-700">
                  Page {page + 1} sur {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={!canGoNext}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminProducts;