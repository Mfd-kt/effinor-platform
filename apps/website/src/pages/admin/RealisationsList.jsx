import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PlusCircle, Edit, Trash2, Loader2, Search, Eye, EyeOff 
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { logger } from '@/utils/logger';

const RealisationsList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [realisations, setRealisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    secteur: '',
    search: ''
  });

  useEffect(() => {
    fetchRealisations();
  }, [filters]);

  const fetchRealisations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('realisations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.secteur) {
        query = query.eq('secteur', filters.secteur);
      }

      if (filters.search) {
        query = query.or(`titre.ilike.%${filters.search}%,client.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRealisations(data || []);
    } catch (err) {
      logger.error('[RealisationsList] Error fetching realisations:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réalisations.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('realisations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Réalisation supprimée avec succès.'
      });

      fetchRealisations();
    } catch (err) {
      logger.error('[RealisationsList] Error deleting realisation:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la réalisation.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (realisation) => {
    try {
      const newStatus = realisation.status === 'published' ? 'draft' : 'published';
      const updateData = {
        status: newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('realisations')
        .update(updateData)
        .eq('id', realisation.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Réalisation ${newStatus === 'published' ? 'publiée' : 'dépubliée'} avec succès.`
      });

      fetchRealisations();
    } catch (err) {
      logger.error('[RealisationsList] Error toggling status:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive'
      });
    }
  };

  const secteurs = Array.from(new Set(realisations.map(r => r.secteur).filter(Boolean)));

  return (
    <>
      <Helmet>
        <title>Réalisations | Effinor Admin</title>
      </Helmet>

      <div className="admin-page pl-0 pr-4 pt-4 pb-4 md:pr-8 md:pt-8 md:pb-8">
        <div className="page-header mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏗️ Réalisations</h1>
            <p className="text-gray-600 mt-1">
              Gérez les réalisations (case studies / chantiers)
            </p>
          </div>
          <Link to="/admin/realisations/new">
            <Button className="btn-primary">
              <PlusCircle className="mr-2 h-4 w-4" /> Nouvelle réalisation
            </Button>
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="published">Publiées</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.secteur}
              onValueChange={(value) => setFilters({ ...filters, secteur: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les secteurs</SelectItem>
                {secteurs.map((secteur) => (
                  <SelectItem key={secteur} value={secteur}>
                    {secteur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          </div>
        ) : realisations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">Aucune réalisation trouvée.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {realisations.map((realisation) => {
              const mainImage = realisation.images && realisation.images[0]?.url;
              return (
                <Card key={realisation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {mainImage && (
                        <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={mainImage}
                            alt={realisation.titre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {realisation.titre}
                            </h3>
                            {realisation.client && (
                              <p className="text-sm text-gray-600">Client: {realisation.client}</p>
                            )}
                            {realisation.secteur && (
                              <p className="text-sm text-gray-600">Secteur: {realisation.secteur}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={realisation.status === 'published' ? 'default' : 'secondary'}
                              className={realisation.status === 'published' ? 'bg-green-500' : ''}
                            >
                              {realisation.status === 'published' ? 'Publiée' : 'Brouillon'}
                            </Badge>
                          </div>
                        </div>
                        {realisation.description_courte && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {realisation.description_courte}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/realisations/${realisation.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Éditer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(realisation)}
                          >
                            {realisation.status === 'published' ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" /> Dépublier
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" /> Publier
                              </>
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. La réalisation "{realisation.titre}" sera définitivement supprimée.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(realisation.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default RealisationsList;




