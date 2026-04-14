import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, X, Trash2, ImagePlus, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getPostById, createPost, updatePost, generateSlugFromTitle } from '@/lib/api/posts';
import { logger } from '@/utils/logger';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabaseClient';

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

const ImageUpload = ({ label, currentUrl, onUrlChange, onFileUpload, disabled }) => {
  const [preview, setPreview] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(!!currentUrl && !currentUrl.includes('supabase.co'));

  useEffect(() => {
    if (currentUrl) {
      setPreview(currentUrl);
    } else {
      setPreview(null);
    }
  }, [currentUrl]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      e.target.value = '';
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop grande. Maximum 5MB');
      e.target.value = '';
      return;
    }

    // Show preview
    const newPreviewUrl = URL.createObjectURL(file);
    setPreview(newPreviewUrl);
    setUseUrl(false);

    // Upload file
    setUploading(true);
    try {
      await onFileUpload(file);
    } catch (error) {
      logger.error('Error uploading image:', error);
      setPreview(currentUrl);
    } finally {
      setUploading(false);
      setFileInputKey(prev => prev + 1);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFileInputKey(prev => prev + 1);
    onUrlChange('');
  };

  const imageUrl = preview || currentUrl;

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 space-y-3">
        {/* Toggle between URL and Upload */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={useUrl ? "default" : "outline"}
            size="sm"
            onClick={() => setUseUrl(true)}
            disabled={disabled}
          >
            URL
          </Button>
          <Button
            type="button"
            variant={!useUrl ? "default" : "outline"}
            size="sm"
            onClick={() => setUseUrl(false)}
            disabled={disabled}
          >
            <Upload className="mr-2 h-4 w-4" />
            Uploader
          </Button>
        </div>

        {useUrl ? (
          <Input
            value={currentUrl || ''}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
          />
        ) : (
          <div>
            <div className="w-full h-48 border-2 border-dashed rounded-lg flex justify-center items-center relative bg-gray-50 overflow-hidden">
              {imageUrl ? (
                <>
                  <img 
                    src={imageUrl} 
                    alt="Aperçu" 
                    className="max-h-full max-w-full object-contain rounded-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 z-10"
                    onClick={handleRemove}
                    disabled={disabled || uploading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <ImagePlus className="mx-auto h-12 w-12 mb-2" />
                  <span className="text-sm">Aucune image</span>
                </div>
              )}
            </div>
            <Input
              key={fileInputKey}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2"
              disabled={disabled || uploading}
            />
            {uploading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Upload en cours...</span>
              </div>
            )}
          </div>
        )}

        {imageUrl && useUrl && (
          <div className="mt-2">
            <img
              src={imageUrl}
              alt="Aperçu"
              className="max-w-full h-48 object-cover rounded-md border"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const BlogEdit = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUser();
  
  const isEditing = !!postId;
  const canEdit = profile?.role?.slug && ['super_admin', 'admin', 'manager', 'backoffice'].includes(profile.role.slug);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image_url: '',
    status: 'draft',
    tags: [],
    seo_title: '',
    seo_description: ''
  });
  
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Charger le post si on est en mode édition
  const fetchPost = useCallback(async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const result = await getPostById(postId);
      if (result.success && result.data) {
        const post = result.data;
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          cover_image_url: post.cover_image_url || '',
          status: post.status || 'draft',
          tags: post.tags || [],
          seo_title: post.seo_title || '',
          seo_description: post.seo_description || ''
        });
        setTagsInput((post.tags || []).join(', '));
      } else {
        throw new Error(result.error || 'Article non trouvé');
      }
    } catch (err) {
      toast({
        title: "Erreur de chargement",
        description: err.message || 'Impossible de charger l\'article',
        variant: "destructive"
      });
      logger.error('Error fetching post:', err);
      navigate('/admin/blog');
    } finally {
      setLoading(false);
    }
  }, [postId, toast, navigate]);

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
  }, [isEditing, fetchPost]);

  // Générer le slug automatiquement à partir du titre
  useEffect(() => {
    if (!isSlugManuallyEdited && formData.title && !isEditing) {
      const generatedSlug = generateSlugFromTitle(formData.title);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, isSlugManuallyEdited, isEditing]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si on modifie le slug manuellement, marquer comme édité
    if (field === 'slug') {
      setIsSlugManuallyEdited(true);
    }
  };

  const handleTagsInputChange = (value) => {
    setTagsInput(value);
    // Convertir la chaîne en tableau de tags (séparés par virgules)
    const tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  const uploadImage = async (file) => {
    const fileName = `${Date.now()}-${slugify(file.name)}`;
    const filePath = `blog/${fileName}`;
    const bucket = 'effinor-assets';

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
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Update form data with the new URL
      setFormData(prev => ({ ...prev, cover_image_url: urlData.publicUrl }));
      
      toast({
        title: "Image uploadée",
        description: "L'image a été uploadée avec succès.",
      });

      return urlData.publicUrl;
    } catch (error) {
      logger.error('Error uploading image:', error);
      toast({
        title: "Erreur d'upload",
        description: `Impossible d'uploader l'image: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "Permission refusée",
        description: "Vous n'avez pas les permissions nécessaires pour modifier les articles.",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le titre est requis",
        variant: "destructive"
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le slug est requis",
        variant: "destructive"
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le contenu est requis",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Erreur",
        description: "Impossible de déterminer l'auteur de l'article",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const postData = {
        ...formData,
        author_id: profile.id
      };

      let result;
      if (isEditing) {
        result = await updatePost(postId, postData);
      } else {
        result = await createPost(postData);
      }

      if (result.success) {
        toast({
          title: isEditing ? "Article mis à jour" : "Article créé",
          description: `L'article "${formData.title}" a été ${isEditing ? 'mis à jour' : 'créé'} avec succès.`
        });
        navigate('/admin/blog');
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      toast({
        title: "Erreur de sauvegarde",
        description: err.message || 'La sauvegarde a échoué',
        variant: "destructive"
      });
      logger.error('Error saving post:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-600">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Modifier l\'article' : 'Nouvel article'} | Effinor Admin</title>
      </Helmet>
      <div className="admin-page p-4 md:p-8">
        <div className="mb-6">
          <Link to="/admin/blog">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? '✏️ Modifier l\'article' : '📝 Nouvel article'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Titre */}
              <Card>
                <CardHeader>
                  <CardTitle>Contenu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Titre de l'article"
                      disabled={!canEdit}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="titre-de-l-article"
                      disabled={!canEdit}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL-friendly identifier. Généré automatiquement à partir du titre.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Extrait</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      placeholder="Résumé court de l'article (affiché dans la liste)"
                      rows={3}
                      disabled={!canEdit}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Résumé court affiché dans la liste des articles (optionnel).
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="content">Contenu *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Contenu de l'article (markdown ou texte)"
                      rows={15}
                      disabled={!canEdit}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Contenu complet de l'article. Support markdown.
                    </p>
                  </div>

                  <div>
                    <ImageUpload
                      label="Image de couverture"
                      currentUrl={formData.cover_image_url}
                      onUrlChange={(url) => handleInputChange('cover_image_url', url)}
                      onFileUpload={uploadImage}
                      disabled={!canEdit}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="seo_title">Titre SEO</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => handleInputChange('seo_title', e.target.value)}
                      placeholder="Titre pour les moteurs de recherche"
                      disabled={!canEdit}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Titre personnalisé pour les moteurs de recherche (optionnel, utilise le titre par défaut si vide).
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">Description SEO</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => handleInputChange('seo_description', e.target.value)}
                      placeholder="Description pour les moteurs de recherche"
                      rows={3}
                      disabled={!canEdit}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Description pour les moteurs de recherche (optionnel, utilise l'extrait si vide).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Publication */}
              <Card>
                <CardHeader>
                  <CardTitle>Publication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.status === 'published'
                        ? 'L\'article sera visible sur le site public.'
                        : 'L\'article est en brouillon et n\'est pas visible publiquement.'}
                    </p>
                  </div>

                  {!canEdit && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-xs text-yellow-800">
                        Vous n'avez pas les permissions nécessaires pour modifier cet article.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                    <Input
                      id="tags"
                      value={tagsInput}
                      onChange={(e) => handleTagsInputChange(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      disabled={!canEdit}
                    />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {canEdit && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {isEditing ? 'Mettre à jour' : 'Créer l\'article'}
                          </>
                        )}
                      </Button>
                      <Link to="/admin/blog">
                        <Button variant="outline" className="w-full">
                          Annuler
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default BlogEdit;





