import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Shield, Plus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import { getAllRoles, deleteRole } from '@/lib/api/roles';
import ModalRole from '@/components/admin/ModalRole';
import { useAuth } from '@/contexts/AuthContext';

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const { toast } = useToast();
  const { profile } = useAuth();

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

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllRoles();
      if (result.success) {
        setRoles(result.data || []);
      } else {
        throw new Error('Erreur lors du chargement des rôles');
      }
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
      setError('Impossible de charger la liste des rôles.');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Erreur lors du chargement des rôles.'
      });
    } finally {
      setLoading(false);
    }
  };

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
      await deleteRole(roleToDelete.id);
      toast({
        title: '✅ Rôle supprimé',
        description: `Le rôle "${roleToDelete.label}" a été supprimé avec succès.`
      });
      loadRoles();
    } catch (error) {
      console.error('Erreur suppression:', error);
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
      red: 'bg-red-100 text-red-800 border-red-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colorClasses[color] || colorClasses.gray;
  };

  const formatPermissions = (permissions) => {
    if (!permissions || !Array.isArray(permissions)) return [];
    if (permissions.includes('all')) return ['Toutes les permissions'];
    return permissions.slice(0, 5); // Afficher les 5 premières
  };

  if (profile && !['admin', 'super_admin'].includes(profile.role)) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
        <p className="text-gray-600">Seuls les administrateurs peuvent accéder à cette page.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestion des Rôles & Permissions | Effinor Admin</title>
      </Helmet>

      <div className="admin-page p-4 md:p-8">
        <div className="page-header mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-secondary-500" />
              Rôles & Permissions
            </h1>
            <p className="text-gray-600 mt-1">
              {loading ? 'Chargement...' : `${roles.length} rôle${roles.length > 1 ? 's' : ''} au total`}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingRole(null);
              setModalOpen(true);
            }}
            className="bg-secondary-500 hover:bg-secondary-600 text-white"
          >
            <Plus className="mr-2 h-5 w-5" />
            Créer un Rôle
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-secondary-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        <Badge className={`${getColorBadge(role.color)} border`}>
                          {role.label}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {role.description || 'Aucune description'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UsersIcon className="h-4 w-4" />
                    <span>
                      {role.userCount || 0} utilisateur{(role.userCount || 0) > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Permissions:</h4>
                    <div className="space-y-1">
                      {formatPermissions(role.permissions).map((perm, index) => (
                        <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                          {perm}
                        </Badge>
                      ))}
                      {role.permissions && role.permissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 5} autres
                        </Badge>
                      )}
                    </div>
                  </div>

                  {role.is_system && (
                    <Badge variant="outline" className="text-xs">
                      Rôle système
                    </Badge>
                  )}

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(role)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    {!role.is_system && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRequest(role)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {roles.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun rôle trouvé</h3>
            <p className="text-gray-600 mb-4">Commencez par créer votre premier rôle personnalisé.</p>
            <Button
              onClick={() => {
                setEditingRole(null);
                setModalOpen(true);
              }}
              className="bg-secondary-500 hover:bg-secondary-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un Rôle
            </Button>
          </Card>
        )}
      </div>

      <ModalRole
        open={modalOpen}
        onOpenChange={handleModalClose}
        role={editingRole}
        onSuccess={handleSuccess}
      />

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
    </>
  );
};

export default AdminRoles;


