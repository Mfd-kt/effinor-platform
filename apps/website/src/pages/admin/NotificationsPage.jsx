/**
 * Page de gestion des notifications
 * 
 * Affiche toutes les notifications avec filtres et actions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, UserPlus, ShoppingBag, Settings, Check, X, 
  Filter, RefreshCw, Loader2, ArrowLeft, CheckCircle2, Circle
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useUser } from '@/contexts/UserContext';
import { markNotificationAsUnread } from '@/services/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

/**
 * Formatage de la date en français
 */
const formatDateTime = (dateString) => {
  if (!dateString) return 'Date inconnue';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Date invalide';
  }
};

/**
 * Icône selon le type de notification
 */
const getNotificationIcon = (type) => {
  const iconClass = 'h-5 w-5';
  switch (type) {
    case 'lead_created':
    case 'lead_assigned':
      return <UserPlus className={`${iconClass} text-emerald-500`} />;
    case 'order_created':
      return <ShoppingBag className={`${iconClass} text-blue-500`} />;
    case 'system':
      return <Settings className={`${iconClass} text-purple-500`} />;
    default:
      return <Bell className={`${iconClass} text-gray-500`} />;
  }
};

/**
 * Label du type en français
 */
const getTypeLabel = (type) => {
  switch (type) {
    case 'lead_created':
      return 'Nouveau lead';
    case 'lead_assigned':
      return 'Lead assigné';
    case 'order_created':
      return 'Nouvelle commande';
    case 'system':
      return 'Système';
    default:
      return 'Notification';
  }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead } = useNotifications();
  const { profile } = useUser();
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'lead', 'commande', 'system'
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all', '24h', '7d', '30d'

  /**
   * Filtrer les notifications selon les critères
   */
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((n) => n.status === statusFilter);
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    // Filtre par période
    if (periodFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (periodFilter) {
        case '24h':
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        default:
          break;
      }
      
      if (periodFilter !== 'all') {
        filtered = filtered.filter((n) => {
          const notificationDate = new Date(n.created_at);
          return notificationDate >= cutoffDate;
        });
      }
    }

    return filtered;
  }, [notifications, statusFilter, typeFilter, periodFilter]);

  /**
   * Gérer le clic sur une notification
   */
  const handleNotificationClick = async (notification) => {
    // Marquer comme lue si non lue
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    // Navigation vers la ressource
    if ((notification.type === 'lead_created' || notification.type === 'lead_assigned') && notification.entity_id) {
      // Navigation selon le rôle
      const roleSlug = profile?.role?.slug || '';
      const isCommercial = roleSlug === 'commercial';
      navigate(`/leads/${notification.entity_id}`);
    } else if (notification.type === 'order_created' && notification.entity_id) {
      // Navigation selon le rôle
      const roleSlug = profile?.role?.slug || '';
      const isCommercial = roleSlug === 'commercial';
      navigate('/dashboard');
    }
  };

  /**
   * Marquer comme non lu
   */
  const handleMarkAsUnread = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsUnread(id);
      toast({
        title: "Notification marquée comme non lue",
        description: "La notification a été marquée comme non lue.",
      });
      await refresh();
    } catch (error) {
      logger.error('[NotificationsPage] Erreur markAsUnread:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme non lue.",
        variant: "destructive",
      });
    }
  };

  /**
   * Réinitialiser les filtres
   */
  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setPeriodFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || periodFilter !== 'all';

  return (
    <>
      <Helmet>
        <title>Notifications | Effinor Admin</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                <p className="text-slate-600 mt-1.5 text-sm md:text-base">
                  Suivez tous les nouveaux leads et toutes les nouvelles commandes en temps réel.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Statut */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="unread">Non lues</SelectItem>
                      <SelectItem value="read">Lues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="lead_created">Nouveaux leads</SelectItem>
                      <SelectItem value="lead_assigned">Leads assignés</SelectItem>
                      <SelectItem value="order_created">Nouvelles commandes</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Période */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Période</label>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toute la période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tout</SelectItem>
                      <SelectItem value="24h">24 heures</SelectItem>
                      <SelectItem value="7d">7 jours</SelectItem>
                      <SelectItem value="30d">30 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Réinitialiser */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 opacity-0">Réinitialiser</label>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des notifications */}
          <Card className="rounded-xl border border-slate-200 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Notifications ({filteredNotifications.length})
              </CardTitle>
              {unreadCount > 0 && (
                <CardDescription>
                  {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Aucune notification</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasActiveFilters
                      ? 'Aucune notification ne correspond à vos filtres.'
                      : 'Vous n\'avez pas encore de notifications.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                        notification.status === 'unread'
                          ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {/* Icône */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm ${notification.status === 'unread' ? 'font-semibold' : 'font-medium'} text-slate-900`}>
                                {notification.title}
                              </p>
                              {notification.status === 'unread' && (
                                <Badge variant="outline" className="bg-emerald-500 text-white border-emerald-500 text-[10px] px-1.5 py-0">
                                  Non lu
                                </Badge>
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-sm text-slate-600 mt-1">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {formatDateTime(notification.created_at)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.status === 'read' ? (
                              <button
                                onClick={(e) => handleMarkAsUnread(notification.id, e)}
                                className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                                title="Marquer comme non lu"
                              >
                                <Circle className="h-4 w-4 text-slate-400" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1.5 rounded hover:bg-slate-100 transition-colors"
                                title="Marquer comme lu"
                              >
                                <Check className="h-4 w-4 text-emerald-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;

