import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, RefreshCw, Eye, MoreVertical,
  Users, TrendingUp, Target, Euro, Flame, ArrowUpRight, ArrowDownRight,
  Mail, Phone, Building, Calendar, User, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAllLeads, getLeadStats, LEAD_STATUSES, PRIORITIES } from '@/lib/api/leads';
import { getAllUsers } from '@/lib/api/utilisateurs';
import { logger } from '@/utils/logger';
import { useUser } from '@/contexts/UserContext';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '—';
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} M€`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)} k€`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Aucune activité';
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPhone = (phone) => {
  if (!phone) return '—';
  // Format français
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+33/, '0');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
};

const getInitials = (nom, prenom) => {
  const first = (prenom || nom || '').charAt(0).toUpperCase();
  const last = (nom || '').charAt(0).toUpperCase();
  return (first + last) || '?';
};

// ============================================
// COMPONENTS
// ============================================

const KPICard = ({ title, value, subtitle, icon: Icon, iconColor, trend, trendValue, loading }) => {
  const isPositive = trendValue >= 0;
  
  if (loading) {
    return (
      <Card className="rounded-lg border border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-600 mb-1 truncate">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
            {trend !== null && trend !== undefined && !isNaN(trendValue) && trendValue !== 0 && (
              <div className={`flex items-center gap-1 text-xs mt-2 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span className="font-medium">{Math.abs(trendValue).toFixed(1)}%</span>
                <span className="text-slate-400">vs mois dernier</span>
              </div>
            )}
          </div>
          <div className={`${iconColor}/10 p-2 rounded-lg flex-shrink-0 ml-2`}>
            <Icon className={`h-5 w-5 ${iconColor.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }) => {
  const statusConfig = LEAD_STATUSES[status] || LEAD_STATUSES.nouveau;
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    slate: 'bg-slate-100 text-slate-800 border-slate-300'
  };
  
  return (
    <Badge variant="outline" className={`text-xs ${colorMap[statusConfig.color] || colorMap.gray}`}>
      {statusConfig.label}
    </Badge>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = PRIORITIES[priority] || PRIORITIES.normale;
  const colorMap = {
    haute: 'bg-red-100 text-red-800 border-red-300',
    normale: 'bg-blue-100 text-blue-800 border-blue-300',
    basse: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  
  return (
    <Badge variant="outline" className={`text-xs ${colorMap[priority] || colorMap.normale}`}>
      {priorityConfig.icon} {priorityConfig.label}
    </Badge>
  );
};

const ScoreBadge = ({ score }) => {
  if (!score && score !== 0) return <span className="text-slate-400 text-sm">—</span>;
  
  let colorClass = 'text-red-600';
  if (score >= 70) colorClass = 'text-green-600';
  else if (score >= 30) colorClass = 'text-orange-600';
  
  return (
    <span className={`font-semibold text-sm ${colorClass}`}>
      {score} / 100
    </span>
  );
};

const SourceBadge = ({ source }) => {
  if (!source) return <span className="text-slate-400 text-xs">—</span>;
  
  const colorMap = {
    'Formulaire site': 'bg-blue-100 text-blue-800 border-blue-300',
    'Google Ads': 'bg-red-100 text-red-800 border-red-300',
    'Facebook Ads': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Appel entrant': 'bg-green-100 text-green-800 border-green-300',
    'Import': 'bg-purple-100 text-purple-800 border-purple-300',
  };
  
  const color = colorMap[source] || 'bg-slate-100 text-slate-800 border-slate-300';
  
  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      {source}
    </Badge>
  );
};

const UserAvatar = ({ user, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';
  const initials = user ? getInitials(user.nom, user.prenom) : '?';
  const name = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Non assigné';
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClass} rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold flex-shrink-0`}>
        {initials}
      </div>
      <span className="text-sm text-slate-700 truncate">{name}</span>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const AdminLeads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUser();
  
  // State
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCommercial, setSelectedCommercial] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('date_creation');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await getAllUsers();
        if (result.success && result.data) {
          setUsers(result.data);
        }
      } catch (error) {
        logger.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  // Load stats - filtered by commercial if user is a commercial
  useEffect(() => {
    const loadStats = async () => {
      try {
        const filters = {};
        if (profile?.role?.slug === 'commercial' && profile?.id) {
          filters.commercial_assigne_id = profile.id;
        }
        const result = await getLeadStats(filters);
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        logger.error('Error loading stats:', error);
      }
    };
    if (profile) {
      loadStats();
    }
  }, [profile]);

  // Load leads
  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true);
      try {
        const filters = {};
        if (selectedStatus !== 'all') {
          filters.statut = selectedStatus;
        }
        if (selectedSource !== 'all') {
          filters.source = selectedSource;
        }
        if (selectedCommercial !== 'all') {
          filters.commercial_assigne_id = selectedCommercial;
        } else if (profile?.role?.slug === 'commercial' && profile?.id) {
          // Auto-filter by assigned commercial if user is a commercial and no specific commercial is selected
          filters.commercial_assigne_id = profile.id;
          if (import.meta.env.DEV) {
            console.log('[AdminLeads] Filtering leads for commercial user:', {
              profileId: profile.id,
              role: profile.role?.slug,
              filters
            });
          }
        }
        if (dateFrom) {
          filters.date_from = dateFrom;
        }
        if (dateTo) {
          filters.date_to = dateTo;
        }

        // Map UI sort column to database field
        const dbSortField = sortFieldMap[sortBy] || sortBy;
        
        const result = await getAllLeads({
          filters,
          page,
          pageSize,
          sortBy: dbSortField,
          sortOrder,
          searchQuery
        });

        if (result.success) {
          setLeads(result.data || []);
          setTotalCount(result.pagination?.total || 0);
          if (import.meta.env.DEV) {
            console.log('[AdminLeads] Loaded leads:', {
              count: result.data?.length || 0,
              total: result.pagination?.total || 0,
              filters
            });
          }
        } else {
          logger.error('[AdminLeads] Error loading leads:', result.error);
          toast({
            title: "Erreur",
            description: result.error || "Impossible de charger les leads",
            variant: "destructive"
          });
        }
      } catch (error) {
        logger.error('Error loading leads:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger les leads",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      loadLeads();
    }
  }, [searchQuery, selectedStatus, selectedSource, selectedCommercial, dateFrom, dateTo, page, sortBy, sortOrder, profile]);

  // Filtered leads for display
  const filteredLeads = useMemo(() => {
    return leads;
  }, [leads]);

  // Calculate KPIs from stats
  const kpis = useMemo(() => {
    if (!stats) return null;
    
    // Ensure conversionRate is a number
    const conversionRate = typeof stats.conversion_rate === 'string' 
      ? parseFloat(stats.conversion_rate) 
      : (stats.conversion_rate || 0);
    
    return {
      totalLeads: stats.total || 0,
      newThisMonth: stats.nouveaux_ce_mois || 0,
      qualifiedLeads: stats.qualifies || 0,
      conversionRate: conversionRate,
      caPotentiel: stats.ca_potentiel || 0,
      hotLeads: stats.leads_chauds || 0,
      leadsTrend: stats.leads_trend || 0
    };
  }, [stats]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedCommercial('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page when sorting
  };

  // Map column names to database fields
  const sortFieldMap = {
    'nom': 'nom',
    'date_creation': 'created_at',
    'email': 'email',
    'telephone': 'telephone',
    'source': 'source',
    'statut': 'statut',
    'priorite': 'priorite',
    'score': 'qualification_score',
    'ca_potentiel': 'montant_cee_estime',
    'commercial': 'commercial_assigne_id',
    'derniere_activite': 'updated_at'
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-emerald-600" />
      : <ArrowDown className="h-4 w-4 text-emerald-600" />;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Helmet>
        <title>Leads | Effinor Admin</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 pl-0 pr-4 pt-4 pb-4 md:pr-6 md:pt-6 md:pb-6 lg:pr-8 lg:pt-8 lg:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
              <p className="text-slate-600 mt-1">Gérez vos prospects et convertissez-les en clients.</p>
            </div>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => navigate('/leads/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau lead
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <KPICard
              title="Total Leads"
              value={kpis?.totalLeads.toLocaleString() || '0'}
              subtitle={kpis?.leadsTrend ? undefined : "Tous les leads"}
              icon={Users}
              iconColor="bg-blue-500"
              trend={kpis?.leadsTrend}
              trendValue={kpis?.leadsTrend}
              loading={!stats}
            />
            <KPICard
              title="Nouveaux ce mois"
              value={kpis?.newThisMonth.toLocaleString() || '0'}
              subtitle="Créés ce mois-ci"
              icon={TrendingUp}
              iconColor="bg-blue-500"
              loading={!stats}
            />
            <KPICard
              title="Qualifiés"
              value={kpis?.qualifiedLeads.toLocaleString() || '0'}
              subtitle="Leads en statut QUALIFIÉ / RDV / Proposition"
              icon={Target}
              iconColor="bg-yellow-500"
              loading={!stats}
            />
            <KPICard
              title="Taux de conversion"
              value={kpis?.conversionRate !== undefined && kpis.conversionRate !== null ? `${Number(kpis.conversionRate).toFixed(1)}%` : '0%'}
              subtitle="Leads convertis en commandes"
              icon={TrendingUp}
              iconColor="bg-green-500"
              loading={!stats}
            />
            <KPICard
              title="CA potentiel"
              value={formatCurrency(kpis?.caPotentiel || 0)}
              subtitle="Valeur estimée des leads ouverts"
              icon={Euro}
              iconColor="bg-emerald-500"
              loading={!stats}
            />
            <KPICard
              title="Leads chauds"
              value={kpis?.hotLeads.toLocaleString() || '0'}
              subtitle="Priorité Haute ou Score > seuil"
              icon={Flame}
              iconColor="bg-red-500"
              loading={!stats}
            />
          </div>

          {/* Filters Bar */}
          <Card className="rounded-lg border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher (nom, entreprise, email, téléphone…)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={(value) => {
                  setSelectedStatus(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(LEAD_STATUSES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Source Filter */}
                <Select value={selectedSource} onValueChange={(value) => {
                  setSelectedSource(value);
                  setPage(1);
                }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sources</SelectItem>
                    <SelectItem value="Formulaire site">Formulaire site</SelectItem>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
                    <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                    <SelectItem value="Appel entrant">Appel entrant</SelectItem>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>

                {/* Commercial Filter - Hidden for commercial users */}
                {profile?.role?.slug !== 'commercial' && (
                  <Select value={selectedCommercial} onValueChange={(value) => {
                    setSelectedCommercial(value);
                    setPage(1);
                  }}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Commercial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les commerciaux</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.prenom} {user.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Date Filters */}
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Date début"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="w-full md:w-[150px]"
                  />
                  <Input
                    type="date"
                    placeholder="Date fin"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="w-full md:w-[150px]"
                  />
                </div>

                {/* Reset Button */}
                {(selectedStatus !== 'all' || selectedSource !== 'all' || (profile?.role?.slug !== 'commercial' && selectedCommercial !== 'all') || searchQuery || dateFrom || dateTo) && (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('nom')}
                  >
                    <div className="flex items-center gap-2">
                      Nom complet
                      {getSortIcon('nom')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('date_creation')}
                  >
                    <div className="flex items-center gap-2">
                      Date de création
                      {getSortIcon('date_creation')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('telephone')}
                  >
                    <div className="flex items-center gap-2">
                      Téléphone
                      {getSortIcon('telephone')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('source')}
                  >
                    <div className="flex items-center gap-2">
                      Source
                      {getSortIcon('source')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('statut')}
                  >
                    <div className="flex items-center gap-2">
                      Statut
                      {getSortIcon('statut')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('priorite')}
                  >
                    <div className="flex items-center gap-2">
                      Priorité
                      {getSortIcon('priorite')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center gap-2">
                      Score
                      {getSortIcon('score')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('ca_potentiel')}
                  >
                    <div className="flex items-center gap-2">
                      CA potentiel
                      {getSortIcon('ca_potentiel')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('commercial')}
                  >
                    <div className="flex items-center gap-2">
                      Commercial
                      {getSortIcon('commercial')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('derniere_activite')}
                  >
                    <div className="flex items-center gap-2">
                      Dernière activité
                      {getSortIcon('derniere_activite')}
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                        <span className="ml-2">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-slate-500">Aucun lead trouvé</p>
                        {profile?.role?.slug === 'commercial' && (
                          <p className="text-xs text-slate-400">
                            Aucun lead ne vous est actuellement assigné. 
                            <br />
                            Contactez un administrateur pour vous assigner des leads.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const commercial = users.find(u => u.id === lead.commercial_assigne_id || u.id === lead.responsable_id);
                    const nom = lead.nom || '';
                    const societe = lead.societe || '';
                    const initials = getInitials(nom, lead.prenom);
                    
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link 
                                to={`/leads/${lead.id}`}
                                className="block"
                              >
                                <p className="text-sm font-medium text-slate-900 truncate hover:text-emerald-600 transition-colors cursor-pointer">
                                  {nom}
                                </p>
                              </Link>
                              {societe && (
                                <p className="text-xs text-slate-500 truncate">{societe}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600">
                            {formatDateTime(lead.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {lead.email ? (
                            <a 
                              href={`mailto:${lead.email}`}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                            >
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {lead.telephone ? (
                            <a 
                              href={`tel:${lead.telephone}`}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {formatPhone(lead.telephone)}
                            </a>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <SourceBadge source={lead.source} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={lead.statut || 'nouveau'} />
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={lead.priorite || 'normale'} />
                        </td>
                        <td className="py-3 px-4">
                          <ScoreBadge score={lead.qualification_score || lead.score} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(lead.montant_cee_estime || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {commercial ? (
                            <UserAvatar user={commercial} size="sm" />
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-600">
                            {formatDateTime(lead.updated_at || lead.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/leads/${lead.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir fiche
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = `mailto:${lead.email}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Envoyer un email
                                </DropdownMenuItem>
                                {lead.telephone && (
                                  <DropdownMenuItem onClick={() => window.location.href = `tel:${lead.telephone}`}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Appeler
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Page {page} sur {totalPages} • {totalCount} lead{totalCount > 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default AdminLeads;
