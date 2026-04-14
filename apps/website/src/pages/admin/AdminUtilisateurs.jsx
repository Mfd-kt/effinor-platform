import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { Loader2, Users, Plus, Search, Edit, Trash2, Eye, Filter, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserAvatar from '@/components/ui/UserAvatar';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getAllUsers, deleteUser } from '@/lib/api/utilisateurs';
import { getAllRoles } from '@/lib/api/roles';
import ModalAjoutUtilisateur from '@/components/admin/ModalAjoutUtilisateur';
import ModalEditionUtilisateur from '@/components/admin/ModalEditionUtilisateur';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
const AdminUtilisateurs = () => {
  // Note: La vérification des permissions est gérée par RequireRole dans App.jsx
  // Pas besoin de double vérification ici
  
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);

  // Load profile from utilisateurs table
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('utilisateurs')
          .select(`
            *,
            role:roles!utilisateurs_role_id_fkey(slug, label, nom)
          `)
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user?.id]);
  const navigate = useNavigate();

  const loadUsers = useCallback(async () => {
    logger.log("Chargement des utilisateurs...");
    setLoading(true);
    setError(null);
    try {
      const result = await getAllUsers();
      if (result.success) {
        logger.log(`Utilisateurs chargés: ${result.data.length}`);
        setAllUsers(result.data || []);
      } else {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      logger.error("Erreur lors du chargement des utilisateurs:", err);
      setError("Impossible de charger la liste des utilisateurs. Veuillez réessayer.");
      toast({ 
        title: "Erreur", 
        description: err.message || "Erreur lors du chargement", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Note: La vérification des permissions est gérée par RequireRole dans App.jsx
    // Charger les données si le profil est disponible
    if (userProfile) {
      loadUsers();
      loadRoles();
    }
  }, [loadUsers, userProfile]);

  const loadRoles = async () => {
    try {
      const result = await getAllRoles();
      if (result.success) {
        setAllRoles(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
      // Ne pas bloquer si les rôles ne peuvent pas être chargés
    }
  };

  const handleDeleteRequest = (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      toast({
        title: "Utilisateur supprimé",
        description: `L'utilisateur ${userToDelete.name} a été supprimé avec succès.`,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: "Échec de la suppression",
        description: error.message || `L'utilisateur ${userToDelete.name} n'a pas pu être supprimé.`,
        variant: "destructive",
      });
      logger.error("Erreur de suppression:", error);
    } finally {
      setUserToDelete(null);
    }
  };

  const handleEdit = (userId) => {
    setSelectedUserId(userId);
    setEditModalOpen(true);
  };

  const handleAddSuccess = () => {
    loadUsers();
  };

  const handleEditSuccess = () => {
    loadUsers();
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const roleMatch = roleFilter === 'all' || user.role?.slug === roleFilter;
      const statusMatch = statusFilter === 'all' || user.statut === statusFilter;
      const term = searchTerm.toLowerCase();
      const searchMatch = !term ||
        (user.full_name?.toLowerCase().includes(term)) ||
        (user.email?.toLowerCase().includes(term)) ||
        (user.prenom?.toLowerCase().includes(term)) ||
        (user.nom?.toLowerCase().includes(term)) ||
        (user.telephone?.toLowerCase().includes(term)) ||
        (user.poste?.toLowerCase().includes(term)) ||
        (user.departement?.toLowerCase().includes(term)) ||
        (user.equipe?.toLowerCase().includes(term));

      return roleMatch && statusMatch && searchMatch;
    });
  }, [allUsers, searchTerm, roleFilter, statusFilter]);

  // Check if we should show department/equipe columns (if at least one user has them)
  const showDepartmentColumn = useMemo(() => {
    return allUsers.some(user => user.departement);
  }, [allUsers]);

  const showEquipeColumn = useMemo(() => {
    return allUsers.some(user => user.equipe);
  }, [allUsers]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (searchTerm.trim()) count++;
    return count;
  }, [roleFilter, statusFilter, searchTerm]);

  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-blue-100 text-blue-800',
      super_admin: 'bg-purple-100 text-purple-800',
      commercial: 'bg-green-100 text-green-800',
      technicien: 'bg-orange-100 text-orange-800',
      comptable: 'bg-yellow-100 text-yellow-800',
      lecture: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (statut) => {
    const colors = {
      actif: 'bg-green-100 text-green-800',
      suspendu: 'bg-red-100 text-red-800',
      parti: 'bg-gray-100 text-gray-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };


  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Note: La vérification des permissions est gérée par RequireRole dans App.jsx
  // Cette vérification redondante a été supprimée

  return (
    <>
      <Helmet><title>Gestion des Utilisateurs | Effinor Admin</title></Helmet>
      <div className="admin-page pl-0 pr-4 pt-4 pb-4 md:pr-8 md:pt-8 md:pb-8">
        <div className="page-header mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-secondary-500" />
              Utilisateurs
            </h1>
            <p className="text-gray-600 mt-1">
              {loading ? 'Chargement...' : `${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? 's' : ''} trouvé${filteredUsers.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/utilisateurs/new')}
              variant="outline"
              className="border-secondary-500 text-secondary-600 hover:bg-secondary-50"
            >
              <Plus className="mr-2 h-5 w-5" />
              Inviter un utilisateur
            </Button>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="bg-secondary-500 hover:bg-secondary-600 text-white"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter Utilisateur
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="filters-bar mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Rechercher par nom, email, téléphone, poste, département..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {allRoles.map((role) => (
                    <SelectItem key={role.nom} value={role.nom}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="parti">Parti</SelectItem>
                </SelectContent>
              </Select>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="text-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {roleFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Rôle: {allRoles.find(r => r.nom === roleFilter)?.label || roleFilter}
                  <button
                    onClick={() => setRoleFilter('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Statut: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {searchTerm.trim() && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Recherche: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  {showDepartmentColumn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                  )}
                  {showEquipeColumn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipe</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière connexion</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6 + (showDepartmentColumn ? 1 : 0) + (showEquipeColumn ? 1 : 0)} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-secondary-500" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6 + (showDepartmentColumn ? 1 : 0) + (showEquipeColumn ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-gray-400" />
                        <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
                        {activeFiltersCount > 0 && (
                          <p className="text-sm text-gray-500">Essayez de modifier vos filtres</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/utilisateurs/${user.id}`)}
                          title="Cliquer pour voir les détails"
                        >
                          <UserAvatar user={user} size="md" className="mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email}
                            </div>
                            {user.poste && (
                              <div className="text-xs text-gray-600 font-medium">{user.poste}</div>
                            )}
                            {user.telephone && (
                              <div className="text-xs text-gray-500">{user.telephone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getRoleBadgeColor(user.role?.slug || '')}>
                          {user.role?.label || user.role?.nom || user.role?.slug || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadgeColor(user.statut)}>
                          {user.statut || 'actif'}
                        </Badge>
                      </td>
                      {showDepartmentColumn && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.departement || '-'}
                        </td>
                      )}
                      {showEquipeColumn && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.equipe || '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.derniere_connexion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/utilisateurs/${user.id}`);
                            }}
                            className="text-secondary-600 hover:text-secondary-700"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(user.id);
                            }}
                            className="text-secondary-600 hover:text-secondary-700"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.role?.slug !== 'super_admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRequest(user.id, user.full_name || user.email);
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      <ModalAjoutUtilisateur
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={handleAddSuccess}
      />

      <ModalEditionUtilisateur
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        userId={selectedUserId}
        onSuccess={handleEditSuccess}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur <strong>{userToDelete?.name}</strong> ? Cette action est irréversible et supprimera également le compte d'authentification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUtilisateurs;

