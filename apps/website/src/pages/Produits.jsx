import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShoppingCart, Search, Filter } from 'lucide-react';
import { logger } from '@/utils/logger';

const Produits = () => {
  const seo = usePageSEO('/produits');
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    usage: '',
    flux: '',
    ip: '',
    ik: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      // Appliquer les filtres
      if (filters.search) {
        query = query.or(`nom.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrer côté client pour les filtres complexes
      let filtered = data || [];
      
      if (filters.type) {
        filtered = filtered.filter(p => p.categorie === filters.type);
      }

      setProducts(filtered);
    } catch (err) {
      logger.error('[Produits] Error fetching products:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast({
      title: 'Produit ajouté',
      description: `${product.nom} a été ajouté au panier.`
    });
  };

  return (
    <>
      <SEOHead
        metaTitle={seo.metaTitle}
        metaDescription={seo.metaDescription}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable}
        h1={seo.h1 || 'Catalogue produits LED professionnel'}
        intro={seo.intro}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {seo.h1 || 'Catalogue produits LED professionnel'}
          </h1>
          {seo.intro && (
            <p className="text-xl text-gray-600">
              {seo.intro}
            </p>
          )}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="highbay">Highbay</SelectItem>
                <SelectItem value="reglette">Réglette</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
                <SelectItem value="projecteur">Projecteur</SelectItem>
                <SelectItem value="panneau">Panneau</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.usage} onValueChange={(value) => setFilters({ ...filters, usage: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="interieur">Intérieur</SelectItem>
                <SelectItem value="exterieur">Extérieur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.flux} onValueChange={(value) => setFilters({ ...filters, flux: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Flux lumineux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="0-5000">0-5000 lm</SelectItem>
                <SelectItem value="5000-10000">5000-10000 lm</SelectItem>
                <SelectItem value="10000+">10000+ lm</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.ip} onValueChange={(value) => setFilters({ ...filters, ip: value })}>
              <SelectTrigger>
                <SelectValue placeholder="IP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="IP20">IP20</SelectItem>
                <SelectItem value="IP44">IP44</SelectItem>
                <SelectItem value="IP65">IP65</SelectItem>
                <SelectItem value="IP66">IP66</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.ik} onValueChange={(value) => setFilters({ ...filters, ik: value })}>
              <SelectTrigger>
                <SelectValue placeholder="IK" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                <SelectItem value="IK06">IK06</SelectItem>
                <SelectItem value="IK08">IK08</SelectItem>
                <SelectItem value="IK10">IK10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste produits */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--secondary-500)]" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">Aucun produit trouvé.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <Link to={`/produit/${product.slug}`}>
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">Pas d'image</div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/produit/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-[var(--secondary-500)] transition-colors">
                      {product.nom}
                    </h3>
                  </Link>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    {product.prix && (
                      <span className="text-lg font-bold text-[var(--secondary-500)]">
                        {product.prix.toFixed(2)} €
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    variant="default"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ajouter au devis
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Produits;














