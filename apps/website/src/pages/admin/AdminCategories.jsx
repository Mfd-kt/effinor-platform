import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  PlusCircle, Edit, Trash2, Loader2, Eye, EyeOff, 
  ArrowUp, ArrowDown, FolderOpen, Image as ImageIcon, X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { megaCategories } from '@/data/megaCategories';
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
import { Badge } from '@/components/ui/badge';

// Generate slug from name
const generateSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Construct image URL helper
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/')) return imagePath;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/effinor-assets/${imagePath}`;
  }
  return imagePath;
};

const AdminCategories = () => {
  // Note: La vérification des permissions est gérée par RequireRole dans App.jsx
  // Pas besoin de double vérification ici
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [productCounts, setProductCounts] = useState({});

  const [formData, setFormData] = useState({
    nom: '',
    slug: '',
    description: '',
    description_longue: '',
    image: null,
    images: [],
    ordre: 0,
    actif: true,
    mega_categorie: '',
  });

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categoryImages, setCategoryImages] = useState([]);
  const [saving, setSaving] = useState(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      logger.log('📦 Chargement des catégories...');
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('ordre', { ascending: true });

      if (fetchError) {
        if (import.meta.env.DEV) {
          console.error('[AdminCategories] Erreur Supabase:', fetchError);
          console.error('[AdminCategories] Code erreur:', fetchError.code);
          console.error('[AdminCategories] Message:', fetchError.message);
          console.error('[AdminCategories] Détails:', fetchError.details);
          console.error('[AdminCategories] Hint:', fetchError.hint);
        }
        
        // Check if table doesn't exist
        if (fetchError.message?.includes('relation') && fetchError.message?.includes('does not exist')) {
          throw new Error('La table "categories" n\'existe pas dans Supabase. Veuillez créer la table dans Supabase Dashboard > SQL Editor.');
        }
        
        // Afficher un toast si c'est une erreur RLS
        if (fetchError.code === '42501' || fetchError.message?.includes('row-level security') || fetchError.message?.includes('permission denied')) {
          toast({
            variant: 'destructive',
            title: 'Erreur de permissions',
            description: 'Vous n\'avez pas les permissions nécessaires pour voir les catégories. Vérifiez les politiques RLS dans Supabase.',
          });
        }
        
        throw fetchError;
      }

      logger.log(`✅ ${data?.length || 0} catégories chargées`);
      setCategories(data || []);

      // Fetch product counts for each category (only if categories exist)
      if (data && data.length > 0) {
        const counts = {};
        for (const category of data) {
          try {
            const { count, error: countError } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('categorie_id', category.id);
            
            if (!countError && count !== null) {
              counts[category.id] = count || 0;
            }
          } catch (e) {
            // Ignore count errors, just set to 0
            counts[category.id] = 0;
          }
        }
        setProductCounts(counts);
      }

    } catch (err) {
      logger.error('❌ Erreur chargement catégories:', err);
      const errorMessage = err.message || 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Auto-generate slug from nom
    if (name === 'nom' && !isSlugManuallyEdited) {
      setFormData(prev => ({ ...prev, slug: generateSlug(newValue) }));
    }
    
    if (name === 'slug') {
      setIsSlugManuallyEdited(true);
    }
  };

  // Handle image file selection (image principale)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle multiple images for category gallery
  const handleCategoryImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadedImages = [];
      for (const file of files) {
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
          uploadedImages.push({
            url: imageUrl,
            legend: '',
            alt_text: file.name.replace(/\.[^/.]+$/, '')
          });
        }
      }
      setCategoryImages([...categoryImages, ...uploadedImages]);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages]
      }));
    } catch (error) {
      logger.error('Erreur upload images:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload des images",
        variant: "destructive"
      });
    }
  };

  // Remove category image
  const handleRemoveCategoryImage = (index) => {
    const newImages = categoryImages.filter((_, i) => i !== index);
    setCategoryImages(newImages);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Update image legend/alt_text
  const handleUpdateImageInfo = (index, field, value) => {
    const newImages = [...categoryImages];
    newImages[index] = { ...newImages[index], [field]: value };
    setCategoryImages(newImages);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  // Remove image principale
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: null }));
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file) => {
    if (!file) return null;

    const fileName = `${Date.now()}-${generateSlug(file.name)}`;
    const filePath = `categories/${fileName}`;
    const bucket = 'effinor-assets';

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Retourner le chemin relatif pour stockage dans JSONB, ou l'URL complète
      // On retourne le chemin relatif pour être cohérent avec les autres images
      return filePath;
    } catch (error) {
      logger.error('❌ Erreur upload image:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.nom || !formData.slug) {
        toast({
          title: "Champs requis manquants",
          description: "Le nom et le slug sont obligatoires.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      let dataToSave = { ...formData };

      // Upload image principale if new file selected
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile);
        dataToSave.image = imageUrl;
      }

      // S'assurer que images est bien un tableau JSONB
      if (dataToSave.images && !Array.isArray(dataToSave.images)) {
        dataToSave.images = [];
      }

      // Sanitize data
      const sanitizedData = sanitizeFormData(dataToSave);
      
      // Remove id from data if editing
      const { id, ...dataWithoutId } = sanitizedData;

      let savedData, error;
      if (editingCategory) {
        // Update
        logger.log('💾 Mise à jour catégorie:', editingCategory.id);
        ({ data: savedData, error } = await supabase
          .from('categories')
          .update(dataWithoutId)
          .eq('id', editingCategory.id)
          .select()
          .single());
      } else {
        // Insert
        logger.log('✨ Création nouvelle catégorie');
        ({ data: savedData, error } = await supabase
          .from('categories')
          .insert([dataWithoutId])
          .select()
          .single());
      }

      if (error) throw error;

      toast({
        title: "Succès !",
        description: `Catégorie ${editingCategory ? 'mise à jour' : 'créée'} avec succès !`
      });

      // Reset form
      resetForm();
      fetchCategories();

    } catch (err) {
      logger.error('❌ Erreur sauvegarde catégorie:', err);
      toast({
        title: "Erreur de sauvegarde",
        description: `La sauvegarde a échoué: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nom: '',
      slug: '',
      description: '',
      description_longue: '',
      image: null,
      images: [],
      ordre: 0,
      actif: true,
      mega_categorie: '',
    });
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview(null);
    setCategoryImages([]);
    setIsSlugManuallyEdited(false);
    setShowForm(false);
  };

  // Edit category
  const handleEdit = (category) => {
    setEditingCategory(category);
    const images = category.images && Array.isArray(category.images) ? category.images : [];
    setFormData({
      nom: category.nom || '',
      slug: category.slug || '',
      description: category.description || '',
      description_longue: category.description_longue || '',
      image: category.image || null,
      images: images,
      ordre: category.ordre || 0,
      actif: category.actif !== undefined ? category.actif : true,
      mega_categorie: category.mega_categorie || '',
    });
    setImagePreview(category.image ? getImageUrl(category.image) : null);
    setCategoryImages(images);
    setIsSlugManuallyEdited(true);
    setShowForm(true);
  };

  // Delete category
  const handleDelete = async (categoryId) => {
    try {
      // Check if category has products
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('categorie_id', categoryId);

      if (count > 0) {
        toast({
          title: "Impossible de supprimer",
          description: `Cette catégorie contient ${count} produit(s). Supprimez d'abord les produits ou réattribuez-les à une autre catégorie.`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès."
      });

      fetchCategories();
    } catch (err) {
      logger.error('❌ Erreur suppression catégorie:', err);
      toast({
        title: "Erreur de suppression",
        description: `La suppression a échoué: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  // Toggle active status
  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ actif: !currentStatus })
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `La catégorie est maintenant ${!currentStatus ? 'active' : 'inactive'}.`
      });

      fetchCategories();
    } catch (err) {
      logger.error('❌ Erreur changement statut:', err);
      toast({
        title: "Erreur",
        description: `Impossible de changer le statut: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  // Move category order
  const handleMoveOrder = async (categoryId, direction) => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;

    const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const category = categories[categoryIndex];
    const swapCategory = categories[newIndex];

    try {
      // Swap orders
      const tempOrder = category.ordre;
      await supabase
        .from('categories')
        .update({ ordre: swapCategory.ordre })
        .eq('id', category.id);
      
      await supabase
        .from('categories')
        .update({ ordre: tempOrder })
        .eq('id', swapCategory.id);

      fetchCategories();
    } catch (err) {
      logger.error('❌ Erreur changement ordre:', err);
      toast({
        title: "Erreur",
        description: `Impossible de changer l'ordre: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-secondary-500 mx-auto mb-4" />
            <p className="text-gray-600">Chargement des catégories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestion des Catégories | Effinor Admin</title>
      </Helmet>

      <div className="admin-page p-4 md:p-8">
        <div className="page-header">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestion des Catégories</h1>
            <p className="text-gray-600 mt-1">
              {categories.length} catégorie{categories.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-secondary-500 hover:bg-secondary-600 text-white"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Ajouter une catégorie
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-red-600 text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-red-900 font-bold text-lg mb-2">Erreur de chargement</h3>
                <p className="text-red-800 mb-4">{error}</p>
                {error.includes('table') || error.includes('relation') || error.includes('does not exist') ? (
                  <div className="bg-red-100 rounded-lg p-4 mt-4">
                    <p className="text-red-900 font-semibold mb-2">💡 Solution :</p>
                    <ol className="list-decimal list-inside text-red-800 space-y-1 text-sm">
                      <li>Ouvrez Supabase Dashboard</li>
                      <li>Allez dans SQL Editor</li>
                      <li>Créez la table avec cette requête :</li>
                    </ol>
                    <pre className="bg-white rounded p-3 mt-3 text-xs overflow-x-auto text-red-900 border border-red-200">
{`CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  ordre INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => {
              if (e.target === e.currentTarget) resetForm();
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la catégorie *
                  </label>
                  <Input
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: Luminaires Industriels"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <Input
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: luminaires-industriels"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Généré automatiquement depuis le nom. Modifiez-le pour personnaliser.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grande catégorie
                  </label>
                  <Select
                    value={formData.mega_categorie || 'none'}
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        mega_categorie: value === 'none' ? '' : value 
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une grande catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {megaCategories && megaCategories.length > 0 ? (
                        megaCategories.map((megaCat) => (
                          <SelectItem key={megaCat.id} value={megaCat.id}>
                            {megaCat.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Aucune grande catégorie disponible</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Sélectionnez la grande catégorie parente pour organiser la navigation.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description courte
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Description courte de la catégorie (affichée sous le titre)..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description longue
                  </label>
                  <Textarea
                    name="description_longue"
                    value={formData.description_longue}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Description détaillée expliquant pourquoi choisir cette catégorie. Cette description sera affichée dans une section dédiée sur la page de la catégorie..."
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisez cette section pour expliquer les avantages et les raisons de choisir cette catégorie.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image principale
                  </label>
                  {imagePreview && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Image principale de la catégorie (utilisée dans les listes)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Galerie d'images de la catégorie
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Ajoutez plusieurs photos pour montrer visuellement à quoi ressemble cette catégorie et pourquoi la choisir.
                  </p>
                  
                  {categoryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {categoryImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={getImageUrl(img.url)}
                            alt={img.alt_text || `Image ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/300x200/e2e8f0/e2e8f0?text=Image';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCategoryImage(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="mt-2 space-y-1">
                            <Input
                              placeholder="Légende (optionnel)"
                              value={img.legend || ''}
                              onChange={(e) => handleUpdateImageInfo(idx, 'legend', e.target.value)}
                              className="text-xs"
                            />
                            <Input
                              placeholder="Texte alternatif"
                              value={img.alt_text || ''}
                              onChange={(e) => handleUpdateImageInfo(idx, 'alt_text', e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCategoryImagesChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Vous pouvez sélectionner plusieurs images à la fois. Ajoutez une légende et un texte alternatif pour chaque image.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordre d'affichage
                    </label>
                    <Input
                      type="number"
                      name="ordre"
                      value={formData.ordre}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center pt-8">
                    <Checkbox
                      id="actif"
                      name="actif"
                      checked={formData.actif}
                      onCheckedChange={(checked) => 
                        handleInputChange({ target: { name: 'actif', checked, type: 'checkbox' } })
                      }
                    />
                    <label htmlFor="actif" className="ml-2 text-sm font-medium text-gray-700">
                      Catégorie active
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        {editingCategory ? 'Mettre à jour' : 'Créer la catégorie'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Grande catégorie</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ordre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nb Produits</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune catégorie créée pour le moment.</p>
                      <p className="text-sm mt-2">Cliquez sur "Ajouter une catégorie" pour commencer.</p>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {category.image ? (
                          <img
                            src={getImageUrl(category.image)}
                            alt={category.nom}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{category.nom}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{category.slug}</code>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {category.description || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {category.mega_categorie ? (
                          <Badge 
                            variant="outline"
                            className="text-xs"
                          >
                            {megaCategories.find(mc => mc.id === category.mega_categorie)?.label || category.mega_categorie}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-medium">{category.ordre}</span>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveOrder(category.id, 'up')}
                              className="text-gray-400 hover:text-secondary-600 transition-colors"
                              disabled={categories.findIndex(c => c.id === category.id) === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(category.id, 'down')}
                              className="text-gray-400 hover:text-secondary-600 transition-colors"
                              disabled={categories.findIndex(c => c.id === category.id) === categories.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={category.actif ? "default" : "secondary"}
                          className={category.actif ? "bg-secondary-500" : "bg-gray-400"}
                        >
                          {category.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-semibold">
                          {productCounts[category.id] || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(category.id, category.actif)}
                            title={category.actif ? "Désactiver" : "Activer"}
                          >
                            {category.actif ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette catégorie ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. 
                                  {productCounts[category.id] > 0 && (
                                    <span className="block mt-2 text-red-600 font-semibold">
                                      ⚠️ Cette catégorie contient {productCounts[category.id]} produit(s).
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminCategories;

