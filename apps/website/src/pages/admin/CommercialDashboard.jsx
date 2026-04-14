import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Users, ShoppingCart, FileText, 
  CheckCircle2, Clock, DollarSign, Target, 
  RefreshCw, ArrowUpRight, ArrowDownRight, Eye,
  Calendar, Mail, Phone, Building
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, 
  Pie, Cell, Area, AreaChart
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// ============================================
// CONSTANTS
// ============================================

const STATUS_COLORS = {
  'nouveau': '#3B82F6',
  'devis_a_preparer': '#F59E0B',
  'devis_envoye': '#8B5CF6',
  'en_negociation': '#EC4899',
  'gagne': '#10B981',
  'perdu': '#EF4444',
};

const QUALIFIED_STATUSES = ['devis_a_preparer', 'devis_envoye', 'en_negociation', 'gagne'];

const COMMANDE_STATUS_COLORS = {
  'payee': '#10B981',
  'en_attente': '#F59E0B',
  'refusee': '#EF4444',
  'annulee': '#6B7280',
};

// ============================================
// COMPONENTS
// ============================================

const KPICard = ({ title, value, trend, trendValue, icon: Icon, iconColor = 'bg-[#10B981]', loading = false, subtitle }) => {
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
              <div className={`flex items-center gap-1 text-xs mt-2 ${isPositive ? 'text-[#10B981]' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span className="font-medium">{Math.abs(trendValue).toFixed(1)}%</span>
                <span className="text-slate-400">vs période précédente</span>
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

const StatusBadge = ({ status, type = 'lead' }) => {
  if (type === 'lead') {
    const color = STATUS_COLORS[status] || '#6B7280';
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        style={{ borderColor: color, color: color, backgroundColor: `${color}10` }}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  } else {
    const color = COMMANDE_STATUS_COLORS[status] || '#6B7280';
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        style={{ borderColor: color, color: color, backgroundColor: `${color}10` }}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

const CommercialDashboard = () => {
  const { toast } = useToast();
  const { profile } = useUser();
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Filters
  const [period, setPeriod] = useState('30d');
  
  // Data
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [leadsStatusBreakdown, setLeadsStatusBreakdown] = useState([]);
  
  // KPIs
  const [totalLeads, setTotalLeads] = useState(0);
  const [leadsTrend, setLeadsTrend] = useState(0);
  const [qualifiedLeads, setQualifiedLeads] = useState(0);
  const [qualifiedPercentage, setQualifiedPercentage] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersTrend, setOrdersTrend] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgBasket, setAvgBasket] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [caPotentiel, setCaPotentiel] = useState(0);

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '12m') {
      startDate.setMonth(startDate.getMonth() - 12);
      startDate.setHours(0, 0, 0, 0);
    }
    
    return { startDate, endDate };
  };

  // Get previous period for comparison
  const getPreviousPeriod = () => {
    const { startDate, endDate } = getDateRange();
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate);
    prevEndDate.setTime(prevEndDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setTime(prevStartDate.getTime() - periodLength);
    return { prevStartDate, prevEndDate };
  };

  // Fetch all data - FILTERED BY COMMERCIAL
  const fetchData = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Fetch leads assigned to this commercial
      const { data: allLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, created_at, nom, prenom, societe, email, telephone, statut, source, montant_cee_estime, commercial_assigne_id')
        .eq('commercial_assigne_id', profile.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at', { ascending: false });

      if (leadsError) {
        logger.error('Error fetching leads:', leadsError);
        throw leadsError;
      }

      // Fetch orders assigned to this commercial
      let ordersQuery = supabase
        .from('commandes')
        .select('id, date_creation, reference, nom_client, email, total_ttc, total_ht, paiement_statut, mode_suivi, source, commercial_assigne_id')
        .gte('date_creation', startISO)
        .lte('date_creation', endISO)
        .order('date_creation', { ascending: false });

      // Try to filter by commercial_assigne_id if column exists
      try {
        ordersQuery = ordersQuery.eq('commercial_assigne_id', profile.id);
      } catch (e) {
        // Column might not exist, ignore
        logger.warn('commercial_assigne_id column might not exist in commandes table');
      }

      const { data: allOrders, error: ordersError } = await ordersQuery;
      if (ordersError) {
        logger.warn('Error fetching orders:', ordersError);
        setOrders([]);
      } else {
        setOrders(allOrders || []);
      }

      setLeads(allLeads || []);

      // Calculate KPIs
      const filteredLeads = allLeads || [];
      const filteredOrders = allOrders || [];

      setTotalLeads(filteredLeads.length);
      
      // Qualified leads
      const qualified = filteredLeads.filter(l => QUALIFIED_STATUSES.includes(l.statut));
      setQualifiedLeads(qualified.length);
      setQualifiedPercentage(filteredLeads.length > 0 ? (qualified.length / filteredLeads.length * 100) : 0);
      
      // CA potentiel (somme des montants CEE estimés)
      const caPot = filteredLeads.reduce((sum, l) => sum + (parseFloat(l.montant_cee_estime) || 0), 0);
      setCaPotentiel(caPot);
      
      // Orders
      setTotalOrders(filteredOrders.length);
      
      // Revenue
      const revenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total_ttc) || parseFloat(o.total_ht) || 0), 0);
      setTotalRevenue(revenue);
      setAvgBasket(filteredOrders.length > 0 ? revenue / filteredOrders.length : 0);
      
      // Conversion rate
      const conversion = filteredLeads.length > 0 ? (filteredOrders.length / filteredLeads.length * 100) : 0;
      setConversionRate(conversion);
      
      // Pending orders
      const pending = filteredOrders.filter(o => 
        o.paiement_statut === 'en_attente' || o.paiement_statut === 'en_cours'
      ).length;
      setPendingOrders(pending);

      // Trends (compare with previous period)
      const { prevStartDate, prevEndDate } = getPreviousPeriod();
      
      // Previous period leads (assigned to this commercial)
      const { count: prevLeadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('commercial_assigne_id', profile.id)
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());
      
      // Previous period orders
      let prevOrdersQuery = supabase
        .from('commandes')
        .select('*', { count: 'exact', head: true })
        .gte('date_creation', prevStartDate.toISOString())
        .lte('date_creation', prevEndDate.toISOString());
      
      try {
        prevOrdersQuery = prevOrdersQuery.eq('commercial_assigne_id', profile.id);
      } catch (e) {
        // Ignore if column doesn't exist
      }
      
      const { count: prevOrdersCount } = await prevOrdersQuery;

      const leadsTrendValue = (prevLeadsCount || 0) > 0 
        ? ((filteredLeads.length - (prevLeadsCount || 0)) / (prevLeadsCount || 0) * 100)
        : (filteredLeads.length > 0 ? 100 : 0);
      setLeadsTrend(leadsTrendValue);

      const ordersTrendValue = (prevOrdersCount || 0) > 0
        ? ((filteredOrders.length - (prevOrdersCount || 0)) / (prevOrdersCount || 0) * 100)
        : (filteredOrders.length > 0 ? 100 : 0);
      setOrdersTrend(ordersTrendValue);

      // Chart data (daily view for last 30 days)
      const daysDiff = Math.min(30, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const periodMap = new Map();
      
      for (let i = 0; i < daysDiff; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        periodMap.set(key, { name: key, leads: 0, commandes: 0, date: d });
      }

      // Populate chart data
      filteredLeads.forEach(lead => {
        const date = new Date(lead.created_at);
        const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        if (periodMap.has(key)) {
          periodMap.get(key).leads++;
        }
      });

      filteredOrders.forEach(order => {
        const date = new Date(order.date_creation);
        const key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        if (periodMap.has(key)) {
          periodMap.get(key).commandes++;
        }
      });

      setChartData(Array.from(periodMap.values()));

      // Status breakdown
      const leadsStatusCount = {};
      filteredLeads.forEach(lead => {
        const status = lead.statut || 'nouveau';
        leadsStatusCount[status] = (leadsStatusCount[status] || 0) + 1;
      });
      setLeadsStatusBreakdown(Object.entries(leadsStatusCount).map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#6B7280'
      })));

      setLastUpdate(new Date());
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [period, profile?.id]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Recent leads (last 5)
  const recentLeads = useMemo(() => {
    return leads.slice(0, 5);
  }, [leads]);

  // Recent orders (last 5)
  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  return (
    <>
      <Helmet>
        <title>Dashboard Commercial | Effinor Admin</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard Commercial</h1>
              <p className="text-slate-600 mt-1">
                Bienvenue, {profile?.prenom || ''} {profile?.nom || ''} • Vos performances en un coup d'œil
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="12m">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <KPICard
              title="Mes Leads"
              value={totalLeads.toLocaleString()}
              subtitle="Leads assignés"
              icon={Users}
              iconColor="bg-blue-500"
              trend={leadsTrend}
              trendValue={leadsTrend}
              loading={loading}
            />
            <KPICard
              title="Qualifiés"
              value={qualifiedLeads.toLocaleString()}
              subtitle={`${qualifiedPercentage.toFixed(1)}% du total`}
              icon={Target}
              iconColor="bg-yellow-500"
              loading={loading}
            />
            <KPICard
              title="CA Potentiel"
              value={formatCurrency(caPotentiel)}
              subtitle="Valeur estimée"
              icon={DollarSign}
              iconColor="bg-emerald-500"
              loading={loading}
            />
            <KPICard
              title="Commandes"
              value={totalOrders.toLocaleString()}
              subtitle={formatCurrency(totalRevenue)}
              icon={ShoppingCart}
              iconColor="bg-purple-500"
              trend={ordersTrend}
              trendValue={ordersTrend}
              loading={loading}
            />
            <KPICard
              title="Taux conversion"
              value={`${conversionRate.toFixed(1)}%`}
              subtitle="Leads → Commandes"
              icon={TrendingUp}
              iconColor="bg-green-500"
              loading={loading}
            />
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Activité</CardTitle>
              <CardDescription>Leads et commandes sur la période</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="leads" fill="#3B82F6" name="Leads" />
                    <Line yAxisId="right" type="monotone" dataKey="commandes" stroke="#10B981" strokeWidth={2} name="Commandes" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  Aucune donnée sur cette période
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>Vos leads par statut</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : leadsStatusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={leadsStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadsStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  Aucun lead sur cette période
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads and Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Leads récents</CardTitle>
                  <CardDescription>Vos 5 derniers leads assignés</CardDescription>
                </div>
                <Link to="/leads">
                  <Button variant="ghost" size="sm">
                    Voir tout <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                </div>
              ) : recentLeads.length > 0 ? (
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      to={`/leads/${lead.id}`}
                      className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {lead.nom || lead.prenom || 'Sans nom'}
                            </p>
                            <StatusBadge status={lead.statut || 'nouveau'} />
                          </div>
                          {lead.societe && (
                            <p className="text-xs text-slate-500 truncate mb-1">
                              <Building className="h-3 w-3 inline mr-1" />
                              {lead.societe}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {lead.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </span>
                            )}
                            {lead.telephone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.telephone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-slate-400 mb-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDate(lead.created_at)}
                          </p>
                          {lead.montant_cee_estime && (
                            <p className="text-xs font-semibold text-emerald-600">
                              {formatCurrency(lead.montant_cee_estime)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun lead récent</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique commandes (lecture seule — module e-commerce retiré du back-office) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commandes récentes</CardTitle>
                  <CardDescription>Données historiques — le suivi e-commerce n&apos;est plus disponible dans l&apos;interface. Priorité aux leads.</CardDescription>
                </div>
                <Link to="/leads">
                  <Button variant="ghost" size="sm">
                    Voir les leads <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="block p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {order.reference || `CMD-${order.id.slice(0, 8)}`}
                            </p>
                            <StatusBadge status={order.paiement_statut || 'en_attente'} type="commande" />
                          </div>
                          <p className="text-xs text-slate-500 truncate mb-1">
                            {order.nom_client || order.email || 'Client'}
                          </p>
                          <p className="text-xs text-slate-400">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDate(order.date_creation)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-bold text-slate-900">
                            {formatCurrency(order.total_ttc || order.total_ht || 0)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {order.mode_suivi === 'paiement_en_ligne' ? 'En ligne' : 'Rappel'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune commande récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Last Update */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
        </div>
      </div>
    </>
  );
};

export default CommercialDashboard;
