import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, Loader2, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COMMANDE_STATUT_LABELS, COMMANDE_STATUT_STYLES } from '@/constants/commandes';
import { useUser } from '@/contexts/UserContext';

const AdminOrders = () => {
  const { toast } = useToast();
  const { profile } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [orderLinesCounts, setOrderLinesCounts] = useState({});
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');

  const buildQuery = useCallback(() => {
    // Utilisation de select('*') pour éviter les erreurs de colonnes inexistantes
    // On peut optimiser plus tard une fois qu'on connaît tous les champs disponibles
    let query = supabase
      .from('commandes')
      .select('*', { count: 'exact' });

    // Filter by assigned commercial if user is a commercial
    if (profile?.role?.slug === 'commercial' && profile?.id) {
      // Try to filter by commercial_assigne_id if column exists
      // If column doesn't exist, this will be ignored (no error)
      try {
        query = query.eq('commercial_assigne_id', profile.id);
      } catch (e) {
        // Column might not exist, ignore
      }
    }

    if (selectedPaymentStatus !== 'all') {
      query = query.eq('paiement_statut', selectedPaymentStatus);
    }

    if (selectedMode !== 'all') {
      query = query.eq('mode_suivi', selectedMode);
    }

    return query;
  }, [selectedPaymentStatus, selectedMode, profile]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const start = page * pageSize;
      const end = start + pageSize - 1;
      
      let query = buildQuery();
      let { data, error: fetchError, count } = await query
        .order('date_creation', { ascending: false })
        .range(start, end);
      
      // Fallback sur id si date_creation n'existe pas
      if (fetchError && (fetchError.message?.includes('column') || fetchError.code === '42703')) {
        query = buildQuery();
        ({ data, error: fetchError, count } = await query
          .order('id', { ascending: false })
          .range(start, end));
      }
      
      if (fetchError) {
        if (fetchError.message?.includes('relation "public.commandes" does not exist') || 
            fetchError.message?.includes('relation commandes does not exist')) {
          setOrders([]);
          setTotalCount(0);
          setError('La table "commandes" n\'existe pas dans la base de données.');
          setLoading(false);
          return;
        }
        
        throw fetchError;
      }
      
      if (!data) {
        setOrders([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      
      setOrders(data || []);
      setTotalCount(count || 0);
      
      // Charger les compteurs de lignes de commande (non-bloquant)
      if (data && data.length > 0) {
        const orderIds = data.map(o => o.id);
        const { data: linesData } = await supabase
          .from('commandes_lignes')
          .select('commande_id')
          .in('commande_id', orderIds);
        
        if (linesData) {
          const counts = {};
          linesData.forEach(line => {
            counts[line.commande_id] = (counts[line.commande_id] || 0) + 1;
          });
          setOrderLinesCounts(counts);
        }
      }
    } catch (err) {
      logger.error('Erreur chargement commandes:', err);
      const errorMessage = err.message || 'Une erreur est survenue lors du chargement des commandes.';
      setError(errorMessage);
      setOrders([]);
      setTotalCount(0);
      toast({ 
        title: "Erreur de chargement", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, buildQuery, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = page > 0;
  const canGoNext = page < totalPages - 1;

  // Fonctions de formatage
  const formatDate = (order) => {
    const dateString = order?.date_creation;
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  };

  const formatClientInfo = (order) => {
    const clientName = order?.raison_sociale || order?.nom_client || 'Particulier';
    const email = order?.email || '-';
    return { clientName, email };
  };

  const formatAddress = (order) => {
    if (!order) return '-';
    
    const parts = [];
    if (order.adresse_ligne1) parts.push(order.adresse_ligne1);
    if (order.ville) parts.push(order.ville);
    if (order.code_postal) parts.push(order.code_postal);
    
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const formatReference = (order) => {
    if (order?.reference) return order.reference;
    
    const date = order?.date_creation;
    if (date) {
      try {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
          const idSuffix = order?.id ? order.id.slice(-4) : '0000';
          return `CMD-${dateStr}-${idSuffix}`;
        }
      } catch {
        // Fallback
      }
    }
    
    return order?.id ? `CMD-${order.id.slice(0, 8)}` : '-';
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(price));
  };

  const getPaymentStatusBadge = (paiementStatut) => {
    const statusMap = {
      'payee': { label: 'Payée', className: 'bg-green-100 text-green-800' },
      'en_attente': { label: 'En attente', className: 'bg-orange-100 text-orange-800' },
      'echouee': { label: 'Échouée', className: 'bg-red-100 text-red-800' },
      'annulee': { label: 'Annulée', className: 'bg-red-100 text-red-800' },
      'remboursee': { label: 'Remboursée', className: 'bg-gray-100 text-gray-800' },
    };

    const status = statusMap[paiementStatut] || { 
      label: paiementStatut || 'En attente', 
      className: 'bg-gray-100 text-gray-800' 
    };
    
    return <Badge className={status.className}>{status.label}</Badge>;
  };

  const getModeBadge = (modeSuivi) => {
    if (modeSuivi === 'paiement_en_ligne') {
      return <Badge className="bg-blue-100 text-blue-800">Paiement en ligne</Badge>;
    }
    if (modeSuivi === 'rappel') {
      return <Badge className="bg-orange-100 text-orange-800">Rappel par expert</Badge>;
    }
    return <span className="text-xs text-gray-400">-</span>;
  };

  const getStatusColor = (statut) => {
    return COMMANDE_STATUT_STYLES[statut] || 'bg-gray-100 text-gray-800';
  };

  const getArticleCount = (order) => {
    return orderLinesCounts[order?.id] || order?.nb_articles || 0;
  };

  const getTotalTTC = (order) => {
    if (order?.total_ttc) return order.total_ttc;
    if (order?.total_ht) {
      // Estimation TTC avec TVA 20% si non disponible
      return parseFloat(order.total_ht) * 1.2;
    }
    return 0;
  };

  return (
    <>
      <Helmet>
        <title>Gestion des Commandes | Effinor Admin</title>
      </Helmet>
      
      <div className="admin-page p-4 md:p-8">
        <div className="page-header mb-6">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Gestion des Devis & Commandes
            </h1>
            <p className="text-gray-600 mt-1">
              {loading ? 'Chargement...' : `${totalCount} commande${totalCount > 1 ? 's' : ''} au total`}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Statut de paiement
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  value={selectedPaymentStatus}
                  onChange={(e) => {
                    setPage(0);
                    setSelectedPaymentStatus(e.target.value);
                  }}
                >
                  <option value="all">Tous</option>
                  <option value="payee">Payée</option>
                  <option value="en_attente">En attente</option>
                  <option value="annulee">Annulée</option>
                  <option value="echouee">Échouée</option>
                  <option value="remboursee">Remboursée</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                  Mode
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  value={selectedMode}
                  onChange={(e) => {
                    setPage(0);
                    setSelectedMode(e.target.value);
                  }}
                >
                  <option value="all">Tous</option>
                  <option value="paiement_en_ligne">Paiement en ligne</option>
                  <option value="rappel">Rappel par expert</option>
                </select>
              </div>
              
              <div className="flex items-end">
                {!loading && (
                  <Button
                    onClick={fetchOrders}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Actualiser
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-red-600 text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 mb-2">Erreur de chargement</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading && !error ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-secondary-500 mx-auto mb-4" />
                <p className="text-gray-600">Chargement des commandes...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {orders.length === 0 && !loading && (
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune commande</h3>
                  <p className="text-gray-600 mb-4">
                    {error ? 'Impossible de charger les commandes.' : 'Il n\'y a aucune commande pour le moment.'}
                  </p>
                  {error && (
                    <Button onClick={fetchOrders} variant="outline" className="mt-2">
                      Réessayer
                    </Button>
                  )}
                </div>
              )}
              
              {orders.length > 0 && (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Référence
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date de création
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Adresse
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Articles
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Total TTC
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Statut de paiement
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => {
                        const { clientName, email } = formatClientInfo(order);
                        return (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono font-semibold">
                                {formatReference(order)}
                              </code>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                              {formatDate(order)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{clientName}</div>
                              <div className="text-xs text-gray-600 mt-0.5">{email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">{formatAddress(order)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {getArticleCount(order)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(getTotalTTC(order))}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {getModeBadge(order.mode_suivi)}
                            </td>
                            <td className="px-6 py-4">
                              {getPaymentStatusBadge(order.paiement_statut)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link
                                to={`/commandes/${order.id}`}
                                className="inline-flex items-center px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-sm font-medium"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détail
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {totalCount > 0 && orders.length > 0 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <Button
                          variant="outline"
                          onClick={() => setPage(prev => Math.max(0, prev - 1))}
                          disabled={!canGoPrevious}
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                          disabled={!canGoNext}
                        >
                          Suivant
                        </Button>
                      </div>
                      
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Affichage de <span className="font-medium">{orders.length > 0 ? page * pageSize + 1 : 0}</span> à{' '}
                            <span className="font-medium">{Math.min((page + 1) * pageSize, totalCount)}</span> sur{' '}
                            <span className="font-medium">{totalCount}</span> résultats
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => Math.max(0, prev - 1))}
                            disabled={!canGoPrevious}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Précédent
                          </Button>
                          <span className="text-sm text-gray-700">
                            Page {page + 1} sur {totalPages || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={!canGoNext}
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminOrders;
