import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/Skeleton';
import { 
  Plus, Search, Edit, Trash2, Shield, Loader2,
  AlertCircle
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
} from "@/components/ui/alert-dialog";
import { getAllRoles, deleteRole } from '@/lib/api/roles';
import ModalRole from '@/components/admin/ModalRole';
import { useAuth } from '@/contexts/AuthContext';
/**
 * Settings Roles Page
 * Gestion des rôles et permissions
 * Note: La vérification des permissions est gérée par RequireRole dans App.jsx
 */
const SettingsRolesPage = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // State
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  // Load roles
  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllRoles();
      if (result.success) {
        setRoles(result.data || []);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des rôles');
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      setError(err.message || 'Impossible de charger la liste des rôles.');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Erreur lors du chargement des rôles.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && !['admin', 'super_admin'].includes(profile.role)) {
      toast({
        variant: 'destructive',
        title: 'Accès refusé',
        description: 'Seuls les administrateurs peuvent accéder à cette page.'
      });
      return;
    }
    loadRoles();
  }, [profile, toast]);

  // Filter roles by search query
  const filteredRoles = roles.filter(role => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      role.label?.toLowerCase().includes(query) ||
      role.nom?.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
    );
  });

  const handleEdit = (role) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  const handleDeleteRequest = (role) => {
    setRoleToDelete(role);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      const result = await deleteRole(roleToDelete.id);
      if (result.success) {
        toast({
          title: 'Rôle supprimé',
          description: `Le rôle "${roleToDelete.label}" a été supprimé avec succès.`
        });
        loadRoles();
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le rôle.'
      });
    } finally {
      setRoleToDelete(null);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingRole(null);
  };

  const handleSuccess = () => {
    loadRoles();
    handleModalClose();
  };

  const getColorBadge = (color) => {
    const colorClasses = {
      red: 'bg-red-100 text-red-700 border-red-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      gray: 'bg-gray-100 text-gray-700 border-gray-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      slate: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    return colorClasses[color] || colorClasses.gray;
  };

  if (profile && !['admin', 'super_admin'].includes(profile.role)) {
    return (
      <div className="admin-page pl-0 pr-4 pt-4 pb-4 md:pr-8 md:pt-8 md:pb-8">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600">Seuls les administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Rôles & Permissions | Réglages | Effinor Admin</title>
      </Helmet>

      <div className="admin-page pl-0 pr-4 pt-4 pb-4 md:pr-8 md:pt-8 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rôles & Permissions</h1>
              <p className="text-gray-600 mt-1 text-sm">Gérez les rôles de l'équipe et leurs niveaux d'accès.</p>
            </div>
            <Button
              onClick={() => {
                setEditingRole(null);
                setModalOpen(true);
              }}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rôle
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un rôle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Aucun rôle trouvé' : 'Aucun rôle'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Essayez avec d\'autres termes de recherche.'
                : 'Commencez par créer votre premier rôle personnalisé.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setEditingRole(null);
                  setModalOpen(true);
                }}
                className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un rôle
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Nom technique
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Couleur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{role.label}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {role.nom}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {role.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${getColorBadge(role.color)} border`}>
                          {role.color}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {role.is_system ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            Rôle système
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                            Rôle personnalisé
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.is_system ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(role)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                              title="Rôle système non supprimable"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        <ModalRole
          open={modalOpen}
          onOpenChange={handleModalClose}
          role={editingRole}
          onSuccess={handleSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le rôle <strong>{roleToDelete?.label}</strong> ?
                {roleToDelete?.userCount > 0 && (
                  <span className="block mt-2 text-red-600">
                    ⚠️ Attention : {roleToDelete.userCount} utilisateur{roleToDelete.userCount > 1 ? 's' : ''} utilise{roleToDelete.userCount > 1 ? 'nt' : ''} ce rôle.
                  </span>
                )}
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
      </div>
    </>
  );
};

export default SettingsRolesPage;

