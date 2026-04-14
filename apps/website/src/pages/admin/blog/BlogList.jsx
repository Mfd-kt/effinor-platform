import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PlusCircle, Edit, Trash2, Loader2, Search, 
  ChevronLeft, ChevronRight, Eye, EyeOff, Calendar, User
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAdminPosts, deletePost } from '@/lib/api/posts';
import { logger } from '@/utils/logger';
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
import { useUser } from '@/contexts/UserContext';

const formatDate = (dateString) => {
  if (!dateString) return 'Non publié';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Non publié';
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const BlogList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useUser();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    status: 'all',
    searchQuery: ''
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Vérifier si l'utilisateur peut éditer (super_admin, admin, manager, backoffice)
  const canEdit = profile?.role?.slug && ['super_admin', 'admin', 'manager', 'backoffice'].includes(profile.role.slug);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAdminPosts({
        page,
        limit: pageSize,
        status: filters.status === 'all' ? undefined : filters.status,
        searchQuery: filters.searchQuery || undefined
      });

      if (result.success) {
        setPosts(result.data || []);
        setPagination(result.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 0 });
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des articles');
      }
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du chargement des articles';
      setError(errorMessage);
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive"
      });
      logger.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters.status, filters.searchQuery, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.searchQuery]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleEdit = (postId) => {
    navigate(`/admin/blog/${postId}`);
  };

  const handleDelete = async (postId) => {
    try {
      const result = await deletePost(postId);
      if (result.success) {
        toast({
          title: "Article supprimé",
          description: "L'article a été supprimé avec succès."
        });
        fetchPosts();
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      toast({
        title: "Erreur de suppression",
        description: err.message || 'La suppression a échoué',
        variant: "destructive"
      });
      logger.error('Error deleting post:', err);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
          <p className="text-gray-600">Chargement des articles...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20">
          <span className="text-4xl" role="img" aria-label="error">❌</span>
          <h3 className="text-xl font-semibold mt-4">Erreur de chargement</h3>
          <p className="text-gray-600 my-2">{error}</p>
          <Button onClick={fetchPosts}>Réessayer</Button>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-20">
          <span className="text-6xl" role="img" aria-label="document">📝</span>
          <h3 className="text-2xl font-semibold mt-4">Aucun article</h3>
          <p className="text-gray-600 my-2">
            {filters.status !== 'all' || filters.searchQuery
              ? "Aucun article ne correspond à vos filtres."
              : "Cliquez sur 'Nouvel article' pour commencer."}
          </p>
          {canEdit && (filters.status === 'all' && !filters.searchQuery) && (
            <Link to="/admin/blog/new">
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Nouvel article
              </Button>
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {post.title}
                    </h3>
                    <Badge 
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                      className={post.status === 'published' ? 'bg-green-500' : ''}
                    >
                      {post.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>
                  
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {post.status === 'published' && post.published_at
                          ? `Publié le ${formatDate(post.published_at)}`
                          : `Créé le ${formatDate(post.created_at)}`}
                      </span>
                    </div>
                    {post.author && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {post.author.full_name || 
                           `${post.author.prenom || ''} ${post.author.nom || ''}`.trim() || 
                           'Auteur inconnu'}
                        </span>
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-gray-400">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(post.id)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet article ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. L'article "{post.title}" sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(post.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Gestion du Blog | Effinor Admin</title>
      </Helmet>
      <div className="admin-page pl-0 pr-4 pt-4 pb-4 md:pr-8 md:pt-8 md:pb-8">
        <div className="page-header mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📝 Gestion du Blog</h1>
            <p className="text-gray-600 mt-1">
              {pagination.total} article{pagination.total !== 1 ? 's' : ''} au total
              {(filters.status !== 'all' || filters.searchQuery) && ' (filtrés)'}
            </p>
          </div>
          {canEdit && (
            <Link to="/admin/blog/new">
              <Button className="btn-primary">
                <PlusCircle className="mr-2 h-4 w-4" /> Nouvel article
              </Button>
            </Link>
          )}
        </div>

        <div className="filters-bar mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher dans les articles..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            onValueChange={(value) => handleFilterChange('status', value)}
            value={filters.status}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="published">Publiés</SelectItem>
              <SelectItem value="draft">Brouillons</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderContent()}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={page === pagination.totalPages}
              >
                Suivant
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">
                    {posts.length > 0 ? (page - 1) * pageSize + 1 : 0}
                  </span> à{' '}
                  <span className="font-medium">
                    {Math.min(page * pageSize, pagination.total)}
                  </span> sur{' '}
                  <span className="font-medium">{pagination.total}</span> résultats
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <span className="text-sm text-gray-700">
                  Page {page} sur {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={page === pagination.totalPages}
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

export default BlogList;





