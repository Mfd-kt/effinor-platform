import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, ArrowLeft, PlugZap, Trash2, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const AdminProductAccessories = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('');

  const loadData = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Charger le produit principal
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, nom, categorie, slug, actif')
        .eq('id', productId)
        .single();

      if (productError) {
        throw productError;
      }

      setProduct(productData);

      // 2) Charger tous les produits utilisables comme accessoires
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, nom, categorie, slug, actif')
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (productsError) {
        throw productsError;
      }

      setAllProducts(productsData || []);

      // 3) Charger les liens existants pour ce produit
      const { data: linksData, error: linksError } = await supabase
        .from('product_accessories')
        .select('id, accessory_id, priorite')
        .eq('product_id', productId)
        .order('priorite', { ascending: true });

      if (linksError) {
        // Si la table n'existe pas encore, ne pas casser l'interface
        if (linksError.code === '42P01' || linksError.message?.includes('does not exist')) {
          logger.warn('[AdminProductAccessories] Table product_accessories manquante');
          setLinks([]);
        } else {
          throw linksError;
        }
      } else {
        setLinks(linksData || []);
      }
    } catch (err) {
      logger.error('[AdminProductAccessories] Error loading data:', err);
      setError(err.message || 'Erreur lors du chargement des accessoires.');
      toast({
        variant: 'destructive',
        title: 'Erreur de chargement',
        description: "Impossible de charger les accessoires pour ce produit.",
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const accessoriesWithDetails = useMemo(() => {
    if (!links.length || !allProducts.length) return [];

    const productsById = new Map(allProducts.map((p) => [p.id, p]));

    return links
      .map((link) => {
        const productData = productsById.get(link.accessory_id);
        if (!productData) return null;
        return {
          ...productData,
          linkId: link.id,
          priorite: link.priorite ?? 0,
        };
      })
      .filter(Boolean);
  }, [links, allProducts]);

  const availableAccessories = useMemo(() => {
    if (!allProducts.length) return [];
    const usedIds = new Set(links.map((l) => l.accessory_id));

    return allProducts.filter(
      (p) => p.id !== productId && !usedIds.has(p.id)
    );
  }, [allProducts, links, productId]);

  const handleAddAccessory = async () => {
    if (!selectedAccessoryId) return;
    if (!productId) return;

    setSaving(true);
    try {
      const nextPriorite =
        links.length > 0
          ? Math.max(...links.map((l) => l.priorite ?? 0)) + 1
          : 0;

      const { error: insertError } = await supabase
        .from('product_accessories')
        .insert([
          {
            product_id: productId,
            accessory_id: selectedAccessoryId,
            priorite: nextPriorite,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Accessoire ajouté',
        description: "L'accessoire a été lié à ce produit.",
      });

      setSelectedAccessoryId('');
      await loadData();
    } catch (err) {
      logger.error('[AdminProductAccessories] Error adding accessory:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'ajouter cet accessoire.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAccessory = async (linkId) => {
    if (!linkId) return;

    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('product_accessories')
        .delete()
        .eq('id', linkId);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: 'Accessoire supprimé',
        description: "L'accessoire a été retiré de ce produit.",
      });

      await loadData();
    } catch (err) {
      logger.error('[AdminProductAccessories] Error removing accessory:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de supprimer cet accessoire.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-secondary-600" />
          <p className="text-gray-600 text-sm">Chargement des accessoires du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-page p-8">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate('/produits')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste des produits
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-red-700 mb-2">
            Produit introuvable
          </h1>
          <p className="text-sm text-red-600">
            Impossible de charger les informations du produit demandé.
          </p>
          {error && (
            <p className="mt-2 text-xs text-red-500">
              Détail : {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Accessoires du produit | Effinor Admin</title>
      </Helmet>
      <div className="admin-page p-4 md:p-8">
        <div className="page-header">
          <div>
            <h1>🔌 Accessoires du produit</h1>
            <p className="text-gray-600 text-sm">
              Gérez les accessoires compatibles pour{' '}
              <span className="font-semibold text-gray-900">
                {product.nom}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/produits')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>

        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">
              Produit principal :
            </p>
            <p className="text-base font-semibold text-gray-900">
              {product.nom}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Catégorie : {product.categorie || 'N.C.'} — Slug :{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">
                {product.slug}
              </code>
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="w-full md:w-64">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ajouter un accessoire
              </label>
              <Select
                value={selectedAccessoryId}
                onValueChange={setSelectedAccessoryId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un produit accessoire" />
                </SelectTrigger>
                <SelectContent>
                  {availableAccessories.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Aucun produit disponible
                    </SelectItem>
                  ) : (
                    availableAccessories.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddAccessory}
              disabled={!selectedAccessoryId || saving}
              className="flex-shrink-0"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Ajouter
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PlugZap className="h-5 w-5 text-secondary-600" />
            Accessoires liés
          </h2>

          {accessoriesWithDetails.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun accessoire n&apos;est encore lié à ce produit. Ajoutez un
              premier accessoire via le sélecteur ci-dessus.
            </p>
          ) : (
            <div className="space-y-2">
              {accessoriesWithDetails.map((acc) => (
                <div
                  key={acc.linkId}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {acc.nom}
                    </span>
                    <span className="text-xs text-gray-500">
                      Slug :{' '}
                      <code className="bg-gray-100 px-1 py-0.5 rounded">
                        {acc.slug}
                      </code>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/produit/${acc.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary-600 hover:text-secondary-700 underline"
                    >
                      Voir la fiche
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAccessory(acc.linkId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminProductAccessories;















