import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast.js';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Loader2, Upload, Trash2, ImagePlus } from 'lucide-react';
import { getCategorySpecSchema, buildCaracteristiquesPayload } from '@/utils/productSpecs';

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const ImageUploadPreview = ({ label, currentUrl, onFileChange, onRemove, fieldName }) => {
  const [preview, setPreview] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (currentUrl) {
      // If it's a blob URL, keep it, otherwise use the provided URL
      if (currentUrl.startsWith('blob:')) {
        setPreview(currentUrl);
      } else {
        // Ensure we construct the full URL if needed
      setPreview(currentUrl);
      }
    } else {
      setPreview(null);
    }
  }, [currentUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image est trop grande. Maximum 5MB');
        e.target.value = ''; // Reset input
        return;
      }

      const newPreviewUrl = URL.createObjectURL(file);
      setPreview(newPreviewUrl);
      onFileChange(e);
    } else {
      // Reset preview if no file selected
      if (!currentUrl) {
        setPreview(null);
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileInputKey(prev => prev + 1); // Reset file input
    onRemove(fieldName, currentUrl);
  };

  // Construct proper image URL for display
  const imageUrl = preview || currentUrl;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="w-full h-40 border-2 border-dashed rounded-lg flex justify-center items-center relative bg-gray-50 overflow-hidden">
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt="Aperçu" 
              className="max-h-full max-w-full object-contain rounded-md"
              onError={(e) => {
                logger.error(`Erreur de chargement d'image pour ${fieldName}:`, imageUrl);
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="text-center text-gray-400"><span class="text-sm">Erreur de chargement</span></div>';
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7 z-10"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="text-center text-gray-400">
            <ImagePlus className="mx-auto h-10 w-10 mb-2" />
            <span className="text-sm">Aucune image</span>
          </div>
        )}
      </div>
      <Input
        key={fileInputKey}
        type="file"
        name={fieldName}
        accept="image/*"
        onChange={handleFileChange}
        className="mt-2"
        disabled={uploading}
      />
      {fileInputKey === 0 && currentUrl && (
        <p className="text-xs text-gray-500 mt-1">Cliquez sur "Choisir un fichier" pour remplacer l'image</p>
      )}
    </div>
  );
};

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nom: '',
    slug: '',
    categorie: '',
    categorie_id: null,
    sous_categorie: '',
    description: '',
    marque: '',
    reference: '',
    puissance: '',
    luminosite: '',
    prix: '',
    sur_devis: false,
    stock: 0,
    prime_cee: true,
    is_best_seller: false,
    actif: true,
    image_1: null,
    image_2: null,
    image_3: null,
    image_4: null,
    image_url: null,
    fiche_technique: null,
  });
  const [specsValues, setSpecsValues] = useState({});

  const [categories, setCategories] = useState([]);
  const [fichesCEE, setFichesCEE] = useState([]);
  const [selectedFiches, setSelectedFiches] = useState([]);
  const [fileUploads, setFileUploads] = useState({});
  const [filesToRemove, setFilesToRemove] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [allProductsForAccessories, setAllProductsForAccessories] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [savingAccessories, setSavingAccessories] = useState(false);


  // Fetch categories from database
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, nom, slug')
        .eq('actif', true)
        .order('ordre', { ascending: true });
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      logger.error('Erreur chargement catégories:', error);
      toast({
        title: "Avertissement",
        description: `Impossible de charger les catégories: ${error.message}. Vous pouvez toujours saisir la catégorie manuellement.`,
        variant: "default"
      });
    }
  }, [toast]);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setFormData(prev => ({ ...prev, ...data }));
      let initialSpecs = data?.caracteristiques || {};
      if (typeof initialSpecs === 'string') {
        try {
          initialSpecs = JSON.parse(initialSpecs);
        } catch (error) {
          initialSpecs = {};
        }
      }
      
      // Récupérer aussi les valeurs depuis les colonnes directes si elles existent
      const directFields = {
        materiaux: data.materiaux,
        temperature_couleur: data.temperature_couleur,
        indice_rendu_couleurs: data.indice_rendu_couleurs,
        commande_controle: data.commande_controle,
        tension_entree: data.tension_entree,
        angle_faisceau: data.angle_faisceau,
        protection: data.protection,
        installation: data.installation,
        dimensions: data.dimensions,
        poids_net: data.poids_net,
      };
      
      // Fusionner : les colonnes directes ont priorité sur le JSON
      setSpecsValues({ ...initialSpecs, ...directFields });
      
      if (data.slug) {
        setIsSlugManuallyEdited(true);
      }
    } catch (error) {
      logger.error('Erreur chargement produit:', error);
      toast({ 
        title: "Erreur", 
        description: `Impossible de charger le produit: ${error.message}`, 
        variant: "destructive" 
      });
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  // Charger la liste des produits potentiels + les liens accessoires existants
  const fetchAccessoriesData = useCallback(async () => {
    if (!isEditing || !id) return;

    try {
      setLoadingAccessories(true);

      // 1) Tous les produits potentiels (sauf le produit courant)
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nom, slug, categorie, actif')
        .neq('id', id)
        .order('nom', { ascending: true });

      if (productsError) {
        if (productsError.code === '42P01' || productsError.message?.includes('does not exist')) {
          // Table products manquante - continuer sans accessoires
        } else {
          throw productsError;
        }
      }

      setAllProductsForAccessories(products || []);

      // 2) Liens existants product_accessories
      const { data: links, error: linksError } = await supabase
        .from('product_accessories')
        .select('accessory_id')
        .eq('product_id', id);

      if (linksError) {
        if (linksError.code === '42P01' || linksError.message?.includes('does not exist')) {
          setSelectedAccessories([]);
        } else {
          throw linksError;
        }
      } else {
        setSelectedAccessories((links || []).map((l) => l.accessory_id));
      }
    } catch (error) {
      logger.error('Erreur chargement accessoires:', error);
      toast({
        title: 'Erreur accessoires',
        description: `Impossible de charger les accessoires du produit: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoadingAccessories(false);
    }
  }, [id, isEditing, toast]);

  // Fetch available fiches CEE
  const fetchFichesCEE = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('fiches_cee')
        .select('id, numero, titre')
        .eq('actif', true)
        .order('ordre', { ascending: true });
      
      if (error) {
        setFichesCEE([]);
        return;
      }
      
      setFichesCEE(data || []);
    } catch (error) {
      logger.error('Erreur chargement fiches CEE:', error);
      setFichesCEE([]);
    }
  }, []);

  // Load existing links when editing
  const fetchExistingFichesLinks = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('produits_fiches_cee')
        .select('fiche_cee_id')
        .eq('produit_id', id);
      
      if (error) {
        setSelectedFiches([]);
        return;
      }
      
      setSelectedFiches(data?.map(d => d.fiche_cee_id) || []);
    } catch (error) {
      logger.error('Erreur chargement liens fiches CEE:', error);
      setSelectedFiches([]);
    }
  }, [id]);

  // Save fiches links function
  const saveFichesLinks = async (productId) => {
    try {
      // Delete existing links
      await supabase
        .from('produits_fiches_cee')
        .delete()
        .eq('produit_id', productId);
      
      // Insert new links
      if (selectedFiches.length > 0) {
        const links = selectedFiches.map(ficheId => ({
          produit_id: productId,
          fiche_cee_id: ficheId
        }));
        
        const { error: insertError } = await supabase
          .from('produits_fiches_cee')
          .insert(links);
        
        if (insertError) {
          // Table peut ne pas exister - fonctionnalité optionnelle
        }
      }
    } catch (error) {
      // Erreur sauvegarde liens fiches CEE - fonctionnalité optionnelle
      // Don't throw error, just log it - this is optional functionality
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFichesCEE();
    if (isEditing) {
      fetchProduct();
      fetchExistingFichesLinks();
      fetchAccessoriesData();
    }
  }, [isEditing, fetchProduct, fetchCategories, fetchFichesCEE, fetchExistingFichesLinks, fetchAccessoriesData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name === 'nom' && !isSlugManuallyEdited) {
      setFormData(prev => ({ ...prev, slug: slugify(newValue) }));
    }
    
    if (name === 'slug') {
      setIsSlugManuallyEdited(true);
    }
    
    if (name === 'prix') {
      setFormData(prev => ({ ...prev, sur_devis: !value }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFileUploads(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleRemoveFile = useCallback((fieldName, fileUrl) => {
    setFormData(prev => ({ ...prev, [fieldName]: null }));
    
    if (fileUrl && typeof fileUrl === 'string' && fileUrl.includes('supabase.co')) {
        try {
            const url = new URL(fileUrl);
            const path = url.pathname.split('/effinor-assets/')[1] || url.pathname.split('/products/')[1];
            if (path) {
                setFilesToRemove(prev => [...prev, { path: path, url: fileUrl }]);
            }
        } catch (e) {
            // URL de fichier invalide - ignorer
        }
    }
    
    setFileUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[fieldName];
      return newUploads;
    });
  }, []);

  const uploadFile = async (file, path) => {
    if (!file) return null;
    
    const fileName = `${Date.now()}-${slugify(file.name)}`;
    const filePath = `${path}/${fileName}`;
    const bucketsToTry = ['effinor-assets'];
    
    let lastError = null;
    
    for (const bucket of bucketsToTry) {
      try {
        
        // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
          .upload(filePath, file, { 
            upsert: true,
            contentType: file.type,
            cacheControl: '3600'
          });
      
      if (uploadError) {
          logger.error(`❌ Erreur upload avec bucket "${bucket}":`, uploadError);
          lastError = uploadError;
          continue; // Try next bucket
      }
      
        // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
      
    } catch (error) {
        logger.error(`❌ Erreur avec bucket "${bucket}":`, error);
        lastError = error;
        continue; // Try next bucket
      }
    }
    
    // If we get here, all buckets failed
    logger.error('❌ Tous les buckets ont échoué. Dernière erreur:', lastError);
    throw new Error(`Impossible d'uploader le fichier. ${lastError?.message || 'Vérifiez que le bucket "effinor-assets" existe et est public dans Supabase Dashboard > Storage.'}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.categorie || !formData.slug) {
      toast({ 
        title: "Champs requis manquants", 
        description: "Veuillez remplir le nom, le slug et la catégorie.", 
        variant: "destructive" 
      });
      return;
    }
    
    // Validation : au moins une image requise
    const hasImage = formData.image_1 || formData.image_url || fileUploads.image_1;
    if (!hasImage) {
      toast({ 
        title: "Image requise", 
        description: "Veuillez ajouter au moins une photo du produit (image principale). Les produits sans photo ne peuvent pas être publiés sur le site.", 
        variant: "destructive" 
      });
      return;
    }
    
    setSaving(true);
    let updatedData = { ...formData };
    
    try {
      if (filesToRemove.length > 0) {
        const pathsToDelete = filesToRemove.map(f => f.path);
        await supabase.storage.from('effinor-assets').remove(pathsToDelete);
        setFilesToRemove([]);
      }

      const uploadPath = `produits/${slugify(formData.slug || 'new-product')}`;
      
      const uploadPromises = Object.keys(fileUploads).map(async key => {
        const file = fileUploads[key];
        if (file) {
          try {
            const url = await uploadFile(file, uploadPath);
            updatedData[key] = url;
            
            if (key === 'image_1') {
              updatedData.image_url = url;
            }
          } catch (error) {
            logger.error(`Erreur upload ${key}:`, error);
            throw error;
          }
        }
      });
      
      await Promise.all(uploadPromises);
      setFileUploads({});
      
      const { id: formId, ...dataToSave } = updatedData;
      dataToSave.prix = dataToSave.prix ? parseFloat(dataToSave.prix) : null;
      dataToSave.stock = dataToSave.stock ? parseInt(dataToSave.stock, 10) : 0;
      dataToSave.sur_devis = !dataToSave.prix;
      
      if (!dataToSave.image_url && dataToSave.image_1) {
        dataToSave.image_url = dataToSave.image_1;
      }

      if (!dataToSave.categorie_id || dataToSave.categorie_id === null || dataToSave.categorie_id === '') {
        delete dataToSave.categorie_id;
      }

      // Build structured caracteristiques payload (category-specific specs)
      dataToSave.caracteristiques = buildCaracteristiquesPayload(
        formData.categorie,
        specsValues
      );

      // Sauvegarder aussi les nouveaux champs dans les colonnes directes (pour faciliter les requêtes)
      // Extraction des nouveaux champs depuis specsValues (tous en texte pour accepter lettres et chiffres)
      // Note: Ces colonnes peuvent ne pas exister encore si la migration n'a pas été exécutée
      const newFields = {
        materiaux: specsValues.materiaux || null,
        temperature_couleur: specsValues.temperature_couleur || null, // Texte (ex: "3000K", "4000-5000K")
        indice_rendu_couleurs: specsValues.indice_rendu_couleurs || null, // Texte (ex: "80", "80+", "CRI 90")
        commande_controle: specsValues.commande_controle || null,
        tension_entree: specsValues.tension_entree || null,
        angle_faisceau: specsValues.angle_faisceau || null, // Texte (ex: "60°", "90-120°")
        protection: specsValues.protection || null,
        installation: specsValues.installation || null,
        dimensions: specsValues.dimensions || null,
        poids_net: specsValues.poids_net || null, // Texte (ex: "2.5kg", "5.0 kg")
      };
      
      // Fusionner avec dataToSave (les colonnes directes ont priorité si elles existent déjà)
      // On garde ces champs dans dataToSave, mais on les supprimera si l'erreur indique qu'elles n'existent pas
      Object.assign(dataToSave, newFields);

      // Sanitize data before save to prevent XSS attacks
      const sanitizedDataToSave = sanitizeFormData(dataToSave);

      let savedData, error;

      if (isEditing) {
        ({ data: savedData, error } = await supabase
          .from('products')
          .update(sanitizedDataToSave)
          .eq('id', id)
          .select()
          .single());
      } else {
        ({ data: savedData, error } = await supabase
          .from('products')
          .insert([sanitizedDataToSave])
          .select()
          .single());
      }

      if (error) {
        // Si l'erreur indique qu'une colonne n'existe pas, on retire les nouveaux champs et on réessaie
        if (error.message?.includes('Could not find') && error.message?.includes('column')) {
          // Supprimer les nouveaux champs de sanitizedDataToSave
          const newFieldsKeys = ['materiaux', 'temperature_couleur', 'indice_rendu_couleurs', 'commande_controle', 
                                  'tension_entree', 'angle_faisceau', 'protection', 'installation', 'dimensions', 'poids_net'];
          newFieldsKeys.forEach(key => delete sanitizedDataToSave[key]);
          
          // Réessayer la sauvegarde sans les nouveaux champs
          if (isEditing) {
            ({ data: savedData, error } = await supabase
              .from('products')
              .update(sanitizedDataToSave)
              .eq('id', id)
              .select()
              .single());
          } else {
            ({ data: savedData, error } = await supabase
              .from('products')
              .insert([sanitizedDataToSave])
              .select()
              .single());
          }
          
          // Si ça fonctionne maintenant, afficher un avertissement
          if (!error && savedData) {
            // Save fiches CEE links
            if (savedData?.id) {
              await saveFichesLinks(savedData.id);
            }
            
            toast({ 
              title: "Produit sauvegardé", 
              description: "Le produit a été sauvegardé, mais les nouveaux champs de détails n'ont pas été enregistrés. Veuillez exécuter la migration SQL pour activer ces champs.",
              variant: "default"
            });
            
            if (!isEditing) {
              navigate('/admin/products');
            } else {
              fetchProduct();
              fetchExistingFichesLinks();
            }
            return; // Sortir de la fonction ici
          } else {
            // Si ça échoue encore, lancer l'erreur originale
            throw error;
          }
        } else {
          throw error;
        }
      }
      
      // Save fiches CEE links
      if (savedData?.id) {
        await saveFichesLinks(savedData.id);
      }
      
      toast({ 
        title: "Succès !", 
        description: `Produit ${isEditing ? 'mis à jour' : 'créé'} avec succès !` 
      });

      if (!isEditing) {
        navigate('/admin/products');
      } else {
        // Refetch data to get the latest state after save
        fetchProduct();
        fetchExistingFichesLinks();
      }

    } catch (error) {
      logger.error("Erreur de sauvegarde:", error);
      
      // Check if error is about missing columns (new product detail fields)
      if (error.message?.includes('Could not find') && error.message?.includes('column') && 
          (error.message?.includes('angle_faisceau') || error.message?.includes('materiaux') || 
           error.message?.includes('temperature_couleur') || error.message?.includes('poids_net'))) {
        toast({ 
          title: "Colonnes manquantes", 
          description: "Les nouveaux champs de détails produits n'existent pas encore dans la base de données. Veuillez exécuter la migration SQL : migrations/20251128_add_product_details_fields.sql",
          variant: "destructive"
        });
        return;
      }
      
      // Check if error is about categorie_id column not existing
      if (error.message?.includes('categorie_id') || (error.message?.includes('column') && error.message?.includes('not found'))) {
        // Try again without categorie_id
        delete sanitizedDataToSave.categorie_id;
        
        try {
          if (isEditing) {
            ({ data: savedData, error } = await supabase
              .from('products')
              .update(sanitizedDataToSave)
              .eq('id', id)
              .select()
              .single());
          } else {
            ({ data: savedData, error } = await supabase
              .from('products')
              .insert([sanitizedDataToSave])
              .select()
              .single());
          }
          
          if (!error) {
            toast({ 
              title: "Produit sauvegardé (sans categorie_id)", 
              description: "Le produit a été sauvegardé avec succès. La colonne categorie_id n'existe pas encore dans la base de données. Créez-la avec le script SQL fourni pour activer la relation entre produits et catégories.",
              variant: "default"
            });
            
            if (!isEditing) {
              navigate('/admin/products');
            } else {
              fetchProduct();
            }
            setSaving(false);
            return;
          }
        } catch (retryError) {
          logger.error("Erreur lors de la tentative de sauvegarde sans categorie_id:", retryError);
        }
      }
      
      toast({ 
        title: "Erreur de sauvegarde", 
        description: `La sauvegarde a échoué: ${error.message}${error.message?.includes('categorie_id') ? '. La colonne categorie_id n\'existe pas encore. Exécutez le script SQL ADD_CATEGORIE_ID_COLUMN.sql dans Supabase Dashboard.' : ''}`, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccessory = (accessoryId) => {
    setSelectedAccessories((prev) =>
      prev.includes(accessoryId)
        ? prev.filter((id) => id !== accessoryId)
        : [...prev, accessoryId]
    );
  };

  const handleSaveAccessories = async () => {
    if (!isEditing || !id) return;

    try {
      setSavingAccessories(true);

      // Supprimer les anciens liens
      const { error: deleteError } = await supabase
        .from('product_accessories')
        .delete()
        .eq('product_id', id);

      if (deleteError) {
        if (deleteError.code !== '42P01' && !deleteError.message?.includes('does not exist')) {
          throw deleteError;
        }
      }

      // Insérer les nouveaux liens
      if (selectedAccessories.length > 0) {
        const rows = selectedAccessories.map((accessoryId, index) => ({
          product_id: id,
          accessory_id: accessoryId,
          priorite: index + 1,
        }));

        const { error: insertError } = await supabase
          .from('product_accessories')
          .insert(rows);

        if (insertError) {
          throw insertError;
        }
      }

      toast({
        title: 'Accessoires mis à jour',
        description: 'Les accessoires compatibles pour ce produit ont été mis à jour avec succès.',
      });
    } catch (error) {
      logger.error('Erreur sauvegarde accessoires:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de sauvegarder les accessoires: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSavingAccessories(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const specSchema = getCategorySpecSchema(formData.categorie);

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Modifier' : 'Nouveau'} Produit | Effinor Admin</title>
      </Helmet>
      <div className="admin-page">
        <div className="page-header">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isEditing ? 'Modifier le Produit' : '➕ Ajouter un nouveau Produit'}
          </h1>
          <Link to="/admin/products">
            <Button variant="outline">← Retour</Button>
          </Link>
        </div>

        <form id="product-form" onSubmit={handleSubmit} className="product-form">
          {/* Basic Info */}
          <div className="form-section">
            <h2>📋 Informations de base</h2>
            <div className="form-group">
              <label htmlFor="nom">Nom du produit *</label>
              <Input 
                id="nom" 
                name="nom" 
                value={formData.nom || ''} 
                onChange={handleInputChange} 
                required 
                placeholder="Ex: Projecteur LED UFO" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="slug">Slug (URL) *</label>
              <Input 
                id="slug" 
                name="slug" 
                value={formData.slug || ''} 
                onChange={handleInputChange} 
                required 
                placeholder="Ex: projecteur-led-ufo" 
              />
              <small>Généré automatiquement depuis le nom. Modifiez-le pour personnaliser.</small>
            </div>
            <div className="form-group">
              <label htmlFor="categorie">Catégorie *</label>
              {categories.length > 0 ? (
              <Select 
                name="categorie" 
                  onValueChange={(value) => {
                    const selectedCategory = categories.find(c => c.id === value);
                    setFormData(prev => ({
                      ...prev,
                      categorie_id: value || null,
                      categorie: selectedCategory?.slug || selectedCategory?.nom || ''
                    }));
                  }}
                  value={formData.categorie_id || formData.categorie || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              ) : (
                <Input
                  name="categorie"
                  value={formData.categorie || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: luminaires_industriels"
                  required
                />
              )}
              <small className="text-gray-500">
                {categories.length === 0 && 'Chargement des catégories...'}
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description || ''} 
                onChange={handleInputChange} 
                rows={4} 
                placeholder="Description détaillée du produit." 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="marque">Marque</label>
                <Input 
                  id="marque"
                  name="marque"
                  value={formData.marque || ''}
                  onChange={handleInputChange} 
                  placeholder="Ex: Philips"
                />
              </div>
              <div className="form-group">
                <label htmlFor="reference">Référence</label>
                <Input 
                  id="reference"
                  name="reference"
                  value={formData.reference || ''}
                  onChange={handleInputChange} 
                  placeholder="Ex: BY218P"
                />
              </div>
            </div>
          </div>

          {/* Specifications & Price */}
          <div className="form-section">
            <h2>⚙️ Spécifications & Prix</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prix">Prix vente HT (€)</label>
                <Input 
                  id="prix" 
                  name="prix" 
                  type="number" 
                  step="0.01" 
                  value={formData.prix || ''} 
                  onChange={handleInputChange} 
                  placeholder="Laisser vide si le produit est sur devis" 
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="stock">Stock</label>
                <Input 
                  id="stock" 
                  name="stock" 
                  type="number" 
                  value={formData.stock ?? ''} 
                  onChange={handleInputChange} 
                  placeholder="0"
                  min="0" 
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="checkbox-label">
                <Checkbox 
                  id="prime_cee" 
                  name="prime_cee" 
                  checked={!!formData.prime_cee} 
                  onCheckedChange={(checked) => handleInputChange({ target: { name: 'prime_cee', checked, type: 'checkbox' }})} 
                />
                <label htmlFor="prime_cee">Éligible CEE</label>
              </div>
              <div className="checkbox-label">
                <Checkbox 
                  id="sur_devis" 
                  name="sur_devis" 
                  checked={!!formData.sur_devis} 
                  onCheckedChange={(checked) => handleInputChange({ target: { name: 'sur_devis', checked, type: 'checkbox' }})}
                />
                <label htmlFor="sur_devis">Sur devis</label>
              </div>
              <div className="checkbox-label">
                <Checkbox 
                  id="actif" 
                  name="actif" 
                  checked={!!formData.actif} 
                  onCheckedChange={(checked) => handleInputChange({ target: { name: 'actif', checked, type: 'checkbox' }})} 
                />
                <label htmlFor="actif">Produit actif</label>
              </div>
              <div className="checkbox-label">
                <Checkbox 
                  id="is_best_seller" 
                  name="is_best_seller" 
                  checked={!!formData.is_best_seller} 
                  onCheckedChange={(checked) => handleInputChange({ target: { name: 'is_best_seller', checked, type: 'checkbox' }})} 
                />
                <label htmlFor="is_best_seller">Afficher comme best-seller (home)</label>
              </div>
            </div>
            {/* Caractéristiques spécifiques */}
            {specSchema?.fields?.length > 0 && (
              <div className="bg-white border rounded-lg p-5 mt-8">
                <h3 className="text-lg font-semibold mb-3">
                  Caractéristiques spécifiques — {specSchema.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specSchema.fields.map((f) => (
                    <div key={f.key} className="flex flex-col">
                      <label className="text-sm font-medium mb-1">{f.label}</label>
                      <input
                        type={f.inputType ?? 'text'}
                        className="border rounded px-3 py-2"
                        placeholder={f.placeholder}
                        value={specsValues[f.key] ?? ''}
                        onChange={(e) =>
                          setSpecsValues((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Fiches CEE */}
          {fichesCEE.length > 0 && (
            <div className="form-section">
              <h2>🎯 Fiches CEE Applicables</h2>
              <p className="section-description">
                Sélectionnez les fiches CEE qui s'appliquent à ce produit
              </p>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {fichesCEE.map(fiche => (
                  <label key={fiche.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-secondary-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFiches.includes(fiche.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiches([...selectedFiches, fiche.id]);
                        } else {
                          setSelectedFiches(selectedFiches.filter(id => id !== fiche.id));
                        }
                      }}
                      className="w-4 h-4 text-secondary-500 border-gray-300 rounded focus:ring-secondary-500"
                    />
                    <div className="flex-1">
                      <span className="font-mono text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded mr-2">
                        {fiche.numero}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{fiche.titre}</span>
                    </div>
                  </label>
                ))}
                {selectedFiches.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-2">
                    Aucune fiche CEE sélectionnée
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Images & Documents */}
          <div className="form-section">
            <h2>🖼️ Images & Documents</h2>
            <p className="section-description">La première image sera utilisée comme image principale</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <ImageUploadPreview 
                label="Image 1 (Principale) *" 
                currentUrl={formData.image_1} 
                onFileChange={handleFileChange} 
                onRemove={handleRemoveFile} 
                fieldName="image_1" 
              />
              <ImageUploadPreview 
                label="Image 2" 
                currentUrl={formData.image_2} 
                onFileChange={handleFileChange} 
                onRemove={handleRemoveFile} 
                fieldName="image_2" 
              />
              <ImageUploadPreview 
                label="Image 3" 
                currentUrl={formData.image_3} 
                onFileChange={handleFileChange} 
                onRemove={handleRemoveFile} 
                fieldName="image_3" 
              />
              <ImageUploadPreview 
                label="Image 4" 
                currentUrl={formData.image_4} 
                onFileChange={handleFileChange} 
                onRemove={handleRemoveFile} 
                fieldName="image_4" 
              />
            </div>
            <div className="form-group">
              <label>📄 Fiche technique (PDF)</label>
              {formData.fiche_technique && (
                <div className="my-2 flex items-center gap-2">
                  <a 
                    href={formData.fiche_technique} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-secondary-600 hover:underline"
                  >
                    ✅ Voir le fichier actuel
                  </a>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveFile('fiche_technique', formData.fiche_technique)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                  </Button>
                </div>
              )}
              <Input 
                type="file" 
                name="fiche_technique" 
                accept=".pdf" 
                onChange={handleFileChange} 
              />
            </div>
          </div>

          {/* Accessoires liés au produit */}
          {isEditing && (
            <div className="form-section">
              <h2>🔗 Accessoires compatibles</h2>
              <p className="section-description">
                Sélectionnez les autres produits à proposer comme accessoires pour ce produit.
              </p>

              {loadingAccessories ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Chargement des accessoires...</span>
                </div>
              ) : allProductsForAccessories.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucun autre produit n&apos;est disponible pour être utilisé comme accessoire pour le moment.
                </p>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 px-3 py-2 space-y-1">
                    {allProductsForAccessories.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer hover:bg-white rounded px-1 py-0.5"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-secondary-500 border-gray-300 rounded focus:ring-secondary-500"
                          checked={selectedAccessories.includes(p.id)}
                          onChange={() => handleToggleAccessory(p.id)}
                        />
                        <span className="font-medium flex-1 truncate">{p.nom}</span>
                        {p.categorie && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">
                            {p.categorie}
                          </span>
                        )}
                        {!p.actif && (
                          <span className="ml-1 text-[10px] text-red-500 uppercase">
                            Inactif
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveAccessories}
                      disabled={savingAccessories || loadingAccessories}
                    >
                      {savingAccessories ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Enregistrer les accessoires'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="form-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate('/admin/products')}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {isEditing ? 'Mettre à jour' : 'Enregistrer le produit'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminProductForm;