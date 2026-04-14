import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/Skeleton';
import { 
  Plus, Search, Edit, Trash2, Loader2, AlertCircle, CheckCircle2
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
import { getStatuses, createStatus, updateStatus, deleteStatus, setDefaultStatus } from '@/lib/api/statuses';
import StatusModal from './StatusModal';

/**
 * Generic Status Settings Page Component
 * Used for managing statuses for leads, operations, and orders
 */
const StatusSettingsPage = ({ table, title, subtitle }) => {
  const { toast } = useToast();
  
  // State
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);

  // Debug: log statuses when they change
  useEffect(() => {
    if (statuses.length > 0) {
      console.log(`[StatusSettingsPage] Statuses updated for table ${table}:`, statuses);
      console.log(`[StatusSettingsPage] Total statuses: ${statuses.length}`);
      console.log(`[StatusSettingsPage] Filtered statuses count: ${filteredStatuses.length}`);
    }
  }, [statuses, table]);

  // Load statuses
  const loadStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[StatusSettingsPage] Loading statuses from table: ${table}`);
      const result = await getStatuses(table);
      console.log(`[StatusSettingsPage] Result:`, result);
      if (result.success) {
        const statusesData = result.data || [];
        console.log(`[StatusSettingsPage] Loaded ${statusesData.length} statuses:`, statusesData);
        setStatuses(statusesData);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des statuts');
      }
    } catch (err) {
      console.error('[StatusSettingsPage] Error loading statuses:', err);
      setError(err.message || 'Impossible de charger la liste des statuts.');
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Erreur lors du chargement des statuts.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, [table]);

  // Filter statuses by search query
  const filteredStatuses = statuses.filter(status => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      status.label?.toLowerCase().includes(query) ||
      status.slug?.toLowerCase().includes(query) ||
      status.code?.toLowerCase().includes(query) ||
      (status.description && status.description.toLowerCase().includes(query))
    );
  });

  const handleEdit = (status) => {
    setEditingStatus(status);
    setModalOpen(true);
  };

  const handleDeleteRequest = (status) => {
    setStatusToDelete(status);
  };

  const confirmDelete = async () => {
    if (!statusToDelete) return;

    try {
      const result = await deleteStatus(table, statusToDelete.id);
      if (result.success) {
        toast({
          title: 'Statut supprimé',
          description: `Le statut "${statusToDelete.label}" a été supprimé avec succès.`
        });
        loadStatuses();
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le statut.'
      });
    } finally {
      setStatusToDelete(null);
    }
  };

  const handleSetDefault = async (status) => {
    try {
      const result = await setDefaultStatus(table, status.id);
      if (result.success) {
        toast({
          title: 'Statut par défaut défini',
          description: `Le statut "${status.label}" est maintenant le statut par défaut.`
        });
        loadStatuses();
      } else {
        throw new Error(result.error || 'Erreur lors de la définition du statut par défaut');
      }
    } catch (error) {
      console.error('Error setting default status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de définir le statut par défaut.'
      });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingStatus(null);
  };

  const handleSuccess = () => {
    loadStatuses();
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

  return (
    <>
      <Helmet>
        <title>{title} | Réglages | Effinor Admin</title>
      </Helmet>

      <div className="admin-page p-4 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>
            </div>
            <Button
              onClick={() => {
                setEditingStatus(null);
                setModalOpen(true);
              }}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau statut
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un statut..."
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
        ) : statuses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun statut trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {error 
                ? `Erreur: ${error}`
                : 'Aucun statut n\'a été trouvé dans la base de données.'}
            </p>
            {!error && (
              <Button
                onClick={() => {
                  setEditingStatus(null);
                  setModalOpen(true);
                }}
                className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un statut
              </Button>
            )}
          </div>
        ) : statuses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun statut trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {error 
                ? `Erreur: ${error}`
                : 'Aucun statut n\'a été trouvé dans la base de données.'}
            </p>
            {!error && (
              <Button
                onClick={() => {
                  setEditingStatus(null);
                  setModalOpen(true);
                }}
                className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un statut
              </Button>
            )}
          </div>
        ) : filteredStatuses.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun statut trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Essayez avec d\'autres termes de recherche.'
                : 'Commencez par créer votre premier statut personnalisé.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setEditingStatus(null);
                  setModalOpen(true);
                }}
                className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer un statut
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
                      {table === 'lead_statuses' ? 'Code' : 'Slug'}
                    </th>
                    {table !== 'lead_statuses' && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Couleur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Par défaut
                    </th>
                    {table !== 'lead_statuses' && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actif
                      </th>
                    )}
                    {table !== 'lead_statuses' && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Système
                      </th>
                    )}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStatuses.map((status) => (
                    <tr key={status.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{status.label}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {status.code || status.slug || '-'}
                        </code>
                      </td>
                      {table !== 'lead_statuses' && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-md truncate">
                            {status.description || '-'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${getColorBadge(status.color)} border`}>
                          {status.color}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status.is_default ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Par défaut
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(status)}
                            className="text-xs h-7"
                          >
                            Définir
                          </Button>
                        )}
                      </td>
                      {table !== 'lead_statuses' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {status.is_active !== false ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                              Inactif
                            </Badge>
                          )}
                        </td>
                      )}
                      {table !== 'lead_statuses' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {status.is_system ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              Système
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(status)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {table === 'lead_statuses' || !status.is_system ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(status)}
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
                              title="Statut système non supprimable"
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
        <StatusModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          status={editingStatus}
          table={table}
          onSuccess={handleSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!statusToDelete} onOpenChange={() => setStatusToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le statut <strong>{statusToDelete?.label}</strong> ?
                Cette action est irréversible.
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

export default StatusSettingsPage;

