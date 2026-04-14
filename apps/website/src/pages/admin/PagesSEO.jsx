import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlusCircle, Edit, Loader2, Save, X 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logger } from '@/utils/logger';

const PagesSEO = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    meta_title: '',
    meta_description: '',
    h1: '',
    intro: '',
    og_image_url: '',
    is_indexable: true
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages_seo')
        .select('*')
        .order('slug', { ascending: true });

      if (error) throw error;
      setPages(data || []);
    } catch (err) {
      logger.error('[PagesSEO] Error fetching pages:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les pages.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      h1: page.h1 || '',
      intro: page.intro || '',
      og_image_url: page.og_image_url || '',
      is_indexable: page.is_indexable !== false
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      meta_title: '',
      meta_description: '',
      h1: '',
      intro: '',
      og_image_url: '',
      is_indexable: true
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPage) {
        // Update
        const { error } = await supabase
          .from('pages_seo')
          .update(formData)
          .eq('id', editingPage.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Page mise à jour avec succès.'
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('pages_seo')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Page créée avec succès.'
        });
      }

      setIsDialogOpen(false);
      fetchPages();
    } catch (err) {
      logger.error('[PagesSEO] Error saving page:', err);
      toast({
        title: 'Erreur',
        description: err.message || 'Impossible de sauvegarder la page.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Pages & SEO | Effinor Admin</title>
      </Helmet>

      <div className="admin-page p-4 md:p-8">
        <div className="page-header mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📄 Pages & SEO</h1>
            <p className="text-gray-600 mt-1">
              Gérez les meta tags SEO de toutes les pages du site
            </p>
          </div>
          <Button onClick={handleNew} className="btn-primary">
            <PlusCircle className="mr-2 h-4 w-4" /> Nouvelle page
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meta Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">H1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indexable</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {page.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {page.meta_title || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {page.h1 || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {page.is_indexable ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Oui
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Non
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(page)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dialog d'édition */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Éditer la page' : 'Nouvelle page'}
              </DialogTitle>
              <DialogDescription>
                Configurez les meta tags SEO et le contenu de la page.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="content" className="w-full">
              <TabsList>
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="/a-propos"
                    disabled={!!editingPage}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingPage ? 'Le slug ne peut pas être modifié' : 'Ex: /, /a-propos, /solutions/industrie'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="h1">H1</Label>
                  <Input
                    id="h1"
                    value={formData.h1}
                    onChange={(e) => setFormData({ ...formData, h1: e.target.value })}
                    placeholder="Titre principal de la page"
                  />
                </div>

                <div>
                  <Label htmlFor="intro">Introduction / Chapeau</Label>
                  <Textarea
                    id="intro"
                    value={formData.intro}
                    onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                    placeholder="Texte d'introduction de la page"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Titre SEO (50-60 caractères recommandés)"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.meta_title.length}/60 caractères
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Description SEO (150-160 caractères recommandés)"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.meta_description.length}/160 caractères
                  </p>
                </div>

                <div>
                  <Label htmlFor="og_image_url">Image Open Graph</Label>
                  <Input
                    id="og_image_url"
                    value={formData.og_image_url}
                    onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })}
                    placeholder="URL de l'image Open Graph"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_indexable"
                    checked={formData.is_indexable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_indexable: checked })}
                  />
                  <Label htmlFor="is_indexable">Indexable par les moteurs de recherche</Label>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" /> Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default PagesSEO;














