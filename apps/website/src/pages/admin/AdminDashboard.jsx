import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/utils/logger';
import { DashboardFilters } from '@/components/admin/dashboard/DashboardFilters';
import { DashboardKPIs } from '@/components/admin/dashboard/DashboardKPIs';
import { DashboardCharts } from '@/components/admin/dashboard/DashboardCharts';
import { DashboardRecentActivity } from '@/components/admin/dashboard/DashboardRecentActivity';
import { DashboardTopPerformers } from '@/components/admin/dashboard/DashboardTopPerformers';

// ============================================
// TYPES & INTERFACES (JSDoc comments)
// ============================================

/**
 * @typedef {Object} Lead
 * @property {string} id
 * @property {string} created_at
 * @property {string} [nom]
 * @property {string} [societe]
 * @property {string} [email]
 * @property {string} [telephone]
 * @property {string} statut
 * @property {string} [source]
 * @property {number} [montant_cee_estime]
 * @property {string} [responsable_id]
 */

/**
 * @typedef {Object} Commande
 * @property {string} id
 * @property {string} date_creation
 * @property {string} [reference]
 * @property {string} [nom_client]
 * @property {string} [email]
 * @property {number} [total_ttc]
 * @property {number} [total_ht]
 * @property {string} [paiement_statut]
 * @property {string} [mode_suivi]
 * @property {string} [source]
 */

/**
 * @typedef {Object} SourceStats
 * @property {string} source
 * @property {number} leads
 * @property {number} orders
 * @property {number} conversion
 * @property {number} revenue
 */

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

// ============================================
// MAIN COMPONENT
// ============================================

const AdminDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUser();
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Filters
  const [period, setPeriod] = useState('30d');
  const [dataType, setDataType] = useState('all'); // 'all', 'leads', 'commandes'
  const [source, setSource] = useState('all');
  const [chartView, setChartView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  
  // Data
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [leadsStatusBreakdown, setLeadsStatusBreakdown] = useState([]);
  const [ordersStatusBreakdown, setOrdersStatusBreakdown] = useState([]);
  const [topSources, setTopSources] = useState([]);
  const [topClients, setTopClients] = useState([]);
  
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

  // Helper to safely convert Supabase numeric values (DECIMAL can be strings)
  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Fetch leads - ordered by most recent first
      let leadsQuery = supabase
        .from('leads')
        .select('id, created_at, nom, societe, email, telephone, statut, source, montant_cee_estime, responsable_id, commercial_assigne_id')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at', { ascending: false });
      
      // Filter by assigned commercial if user is a commercial
      if (profile?.role?.slug === 'commercial' && profile?.id) {
        leadsQuery = leadsQuery.eq('commercial_assigne_id', profile.id);
      }
      
      if (source !== 'all') {
        leadsQuery = leadsQuery.eq('source', source);
      }
      
      let { data: allLeads, error: leadsError } = await leadsQuery;
      
      // Fallback if columns don't exist
      if (leadsError && (leadsError.message?.includes('column') || leadsError.code === '42703')) {
        logger.warn('Error fetching leads with full columns, trying fallback');
        let fallbackLeadsQuery = supabase
          .from('leads')
          .select('id, created_at, nom, societe, email, telephone, statut, source')
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false });
        
        if (profile?.role?.slug === 'commercial' && profile?.id) {
          try {
            fallbackLeadsQuery = fallbackLeadsQuery.eq('commercial_assigne_id', profile.id);
          } catch (e) {
            // Column might not exist, ignore
          }
        }
        
        if (source !== 'all') {
          fallbackLeadsQuery = fallbackLeadsQuery.eq('source', source);
        }
        
        const { data: fallbackLeads, error: fallbackError } = await fallbackLeadsQuery;
        if (fallbackError) {
          throw fallbackError;
        }
        // Map fallback data with default values
        allLeads = (fallbackLeads || []).map(l => ({
          ...l,
          montant_cee_estime: 0,
          responsable_id: null,
          commercial_assigne_id: null
        }));
        leadsError = null;
      } else if (leadsError) {
        throw leadsError;
      }

      // Fetch orders - ordered by most recent first
      let ordersQuery = supabase
        .from('commandes')
        .select('id, date_creation, reference, nom_client, email, total_ttc, total_ht, paiement_statut, mode_suivi, source, commercial_assigne_id')
        .gte('date_creation', startISO)
        .lte('date_creation', endISO)
        .order('date_creation', { ascending: false });
      
      // Filter by assigned commercial if user is a commercial
      // Note: commandes table might not have commercial_assigne_id yet, so we check if it exists
      if (profile?.role?.slug === 'commercial' && profile?.id) {
        // Try to filter by commercial_assigne_id if column exists
        // If column doesn't exist, this will be ignored (no error)
        try {
          ordersQuery = ordersQuery.eq('commercial_assigne_id', profile.id);
        } catch (e) {
          // Column might not exist, ignore
        }
      }
      
      if (source !== 'all') {
        ordersQuery = ordersQuery.eq('source', source);
      }
      
      let { data: allOrders, error: ordersError } = await ordersQuery;
      
      // Fallback if columns don't exist (similar to AdminOrders.jsx pattern)
      if (ordersError && (ordersError.message?.includes('column') || ordersError.code === '42703' || ordersError.message?.includes('date_creation'))) {
        logger.warn('Error fetching orders with full columns, trying fallback');
        let fallbackOrdersQuery = supabase
          .from('commandes')
          .select('id, date_creation, reference, nom_client, email')
          .gte('date_creation', startISO)
          .lte('date_creation', endISO);
        
        // Try ordering by date_creation, fallback to id if it doesn't exist
        try {
          fallbackOrdersQuery = fallbackOrdersQuery.order('date_creation', { ascending: false });
        } catch (e) {
          fallbackOrdersQuery = fallbackOrdersQuery.order('id', { ascending: false });
        }
        
        if (source !== 'all') {
          try {
            fallbackOrdersQuery = fallbackOrdersQuery.eq('source', source);
          } catch (e) {
            // Column might not exist, ignore
          }
        }
        
        const { data: fallbackOrders, error: fallbackError } = await fallbackOrdersQuery;
        if (fallbackError) {
          // If even fallback fails, set empty array
          logger.error('Fallback query also failed:', fallbackError);
          allOrders = [];
        } else {
          // Map fallback data with default values
          allOrders = (fallbackOrders || []).map(o => ({
            ...o,
            total_ttc: 0,
            total_ht: 0,
            paiement_statut: 'en_attente',
            mode_suivi: null,
            source: o.source || 'Autre',
            commercial_assigne_id: null
          }));
        }
        ordersError = null;
      } else if (ordersError) {
        // For other errors, log and set empty array
        logger.error('Error fetching orders:', ordersError);
        allOrders = [];
      }

      // Filter by data type
      const filteredLeads = dataType === 'commandes' ? [] : (allLeads || []);
      const filteredOrders = dataType === 'leads' ? [] : (allOrders || []);

      setLeads(filteredLeads);
      setOrders(filteredOrders);

      // Calculate KPIs
      setTotalLeads(filteredLeads.length);
      
      // Qualified leads
      const qualified = filteredLeads.filter(l => QUALIFIED_STATUSES.includes(l.statut));
      setQualifiedLeads(qualified.length);
      setQualifiedPercentage(filteredLeads.length > 0 ? (qualified.length / filteredLeads.length * 100) : 0);
      
      // Orders
      setTotalOrders(filteredOrders.length);
      
      // Revenue - safely parse numeric values (Supabase DECIMAL can be strings)
      const revenue = (filteredOrders || []).reduce((sum, o) => {
        const amount = toNumber(o.total_ttc) || toNumber(o.total_ht) || 0;
        return sum + amount;
      }, 0);
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

      // Trends (compare with previous period) - apply same filters as current view
      const { prevStartDate, prevEndDate } = getPreviousPeriod();
      const prevStartISO = prevStartDate.toISOString();
      const prevEndISO = prevEndDate.toISOString();

      // Only calculate trends if relevant data type is shown
      let prevLeadsCount = 0;
      let prevOrdersCount = 0;

      if (dataType === 'all' || dataType === 'leads') {
        // Apply same filters as main query
        let prevLeadsQuery = supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevStartISO)
          .lte('created_at', prevEndISO);
        
        // Filter by assigned commercial if user is a commercial
        if (profile?.role?.slug === 'commercial' && profile?.id) {
          try {
            prevLeadsQuery = prevLeadsQuery.eq('commercial_assigne_id', profile.id);
          } catch (e) {
            // Column might not exist, ignore
          }
        }
        
        // Filter by source if specified
        if (source !== 'all') {
          try {
            prevLeadsQuery = prevLeadsQuery.eq('source', source);
          } catch (e) {
            // Column might not exist, ignore
          }
        }
        
        const { count, error: prevLeadsError } = await prevLeadsQuery;
        if (prevLeadsError && (prevLeadsError.message?.includes('column') || prevLeadsError.code === '42703')) {
          // Fallback: try without filters if columns don't exist
          const { count: fallbackCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', prevStartISO)
            .lte('created_at', prevEndISO);
          prevLeadsCount = fallbackCount || 0;
        } else {
          prevLeadsCount = count || 0;
        }
      }

      if (dataType === 'all' || dataType === 'commandes') {
        // Apply same filters as main query
        let prevOrdersQuery = supabase
          .from('commandes')
          .select('*', { count: 'exact', head: true })
          .gte('date_creation', prevStartISO)
          .lte('date_creation', prevEndISO);
        
        // Filter by assigned commercial if user is a commercial
        if (profile?.role?.slug === 'commercial' && profile?.id) {
          try {
            prevOrdersQuery = prevOrdersQuery.eq('commercial_assigne_id', profile.id);
          } catch (e) {
            // Column might not exist, ignore
          }
        }
        
        // Filter by source if specified
        if (source !== 'all') {
          try {
            prevOrdersQuery = prevOrdersQuery.eq('source', source);
          } catch (e) {
            // Column might not exist, ignore
          }
        }
        
        const { count, error: prevOrdersError } = await prevOrdersQuery;
        if (prevOrdersError && (prevOrdersError.message?.includes('column') || prevOrdersError.code === '42703' || prevOrdersError.message?.includes('date_creation'))) {
          // Fallback: try without filters if columns don't exist
          const { count: fallbackCount } = await supabase
            .from('commandes')
            .select('*', { count: 'exact', head: true })
            .gte('date_creation', prevStartISO)
            .lte('date_creation', prevEndISO);
          prevOrdersCount = fallbackCount || 0;
        } else {
          prevOrdersCount = count || 0;
        }
      }

      const leadsTrendValue = (prevLeadsCount || 0) > 0 
        ? ((filteredLeads.length - prevLeadsCount) / prevLeadsCount * 100)
        : (filteredLeads.length > 0 ? 100 : 0); // If no previous data but current has data, show 100% increase
      setLeadsTrend(leadsTrendValue);

      const ordersTrendValue = (prevOrdersCount || 0) > 0
        ? ((filteredOrders.length - prevOrdersCount) / prevOrdersCount * 100)
        : (filteredOrders.length > 0 ? 100 : 0); // If no previous data but current has data, show 100% increase
      setOrdersTrend(ordersTrendValue);

      // Chart data - inclusive range (startDate to endDate)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include endDate
      const periodMap = new Map();
      
      if (chartView === 'daily' && daysDiff <= 90) {
        // Include all days from startDate to endDate (inclusive)
        for (let i = 0; i < daysDiff; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          // Only include if date is <= endDate
          if (d <= endDate) {
            const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            periodMap.set(key, { name: key, leads: 0, commandes: 0, date: d });
          }
        }
      } else if (chartView === 'weekly') {
        // Calculate weeks inclusively from startDate to endDate
        const weeks = Math.ceil(daysDiff / 7);
        for (let i = 0; i < weeks; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + (i * 7));
          // Only include if week start is <= endDate
          if (d <= endDate) {
            const weekNum = i + 1; // Start at 1, not 0
            const key = `Sem. ${weekNum}`;
            periodMap.set(key, { name: key, leads: 0, commandes: 0, date: d });
          }
        }
      } else {
        // Monthly view - include all months from startDate to endDate
        const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        let currentMonth = new Date(startMonth);
        let monthIndex = 0;
        
        while (currentMonth <= endMonth) {
          const key = currentMonth.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
          periodMap.set(key, { name: key, leads: 0, commandes: 0, date: new Date(currentMonth) });
          // Move to next month
          currentMonth.setMonth(currentMonth.getMonth() + 1);
          monthIndex++;
        }
      }

      // Populate chart data
      filteredLeads.forEach(lead => {
        const date = new Date(lead.created_at);
        let key = '';
        if (chartView === 'daily') {
          key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        } else if (chartView === 'weekly') {
          // Calculate which week (1-based) this date falls into
          const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekNum = Math.floor(daysSinceStart / 7) + 1; // Start at 1, not 0
          key = `Sem. ${weekNum}`;
        } else {
          key = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        }
        if (periodMap.has(key)) {
          periodMap.get(key).leads++;
        }
      });

      filteredOrders.forEach(order => {
        const date = new Date(order.date_creation);
        let key = '';
        if (chartView === 'daily') {
          key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        } else if (chartView === 'weekly') {
          // Calculate which week (1-based) this date falls into
          const daysSinceStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekNum = Math.floor(daysSinceStart / 7) + 1; // Start at 1, not 0
          key = `Sem. ${weekNum}`;
        } else {
          key = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        }
        if (periodMap.has(key)) {
          periodMap.get(key).commandes++;
        }
      });

      setChartData(Array.from(periodMap.values()));

      // Status breakdowns
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

      const ordersStatusCount = {};
      filteredOrders.forEach(order => {
        const status = order.paiement_statut || 'en_attente';
        ordersStatusCount[status] = (ordersStatusCount[status] || 0) + 1;
      });
      setOrdersStatusBreakdown(Object.entries(ordersStatusCount).map(([name, value]) => ({
        name,
        value,
        color: COMMANDE_STATUS_COLORS[name] || '#6B7280'
      })));

      // Top sources
      const sourceMap = new Map();
      filteredLeads.forEach(lead => {
        const src = lead.source || 'Autre';
        if (!sourceMap.has(src)) {
          sourceMap.set(src, { source: src, leads: 0, orders: 0, conversion: 0, revenue: 0 });
        }
        const leadStats = sourceMap.get(src);
        if (leadStats) {
          leadStats.leads++;
        }
      });
      filteredOrders.forEach(order => {
        const src = order.source || 'Autre';
        if (!sourceMap.has(src)) {
          sourceMap.set(src, { source: src, leads: 0, orders: 0, conversion: 0, revenue: 0 });
        }
        const stats = sourceMap.get(src);
        if (stats) {
          stats.orders++;
          const amount = toNumber(order.total_ttc) || toNumber(order.total_ht) || 0;
          stats.revenue += amount;
        }
      });
      sourceMap.forEach((stats, src) => {
        stats.conversion = stats.leads > 0 ? (stats.orders / stats.leads * 100) : 0;
      });
      setTopSources(Array.from(sourceMap.values()).sort((a, b) => b.leads - a.leads).slice(0, 5));

      // Top clients
      const clientMap = new Map();
      filteredOrders.forEach(order => {
        const clientName = order.nom_client || order.email || 'Client inconnu';
        if (!clientMap.has(clientName)) {
          clientMap.set(clientName, { name: clientName, orders: 0, revenue: 0 });
        }
        const client = clientMap.get(clientName);
        if (client) {
          client.orders++;
          const amount = toNumber(order.total_ttc) || toNumber(order.total_ht) || 0;
          client.revenue += amount;
        }
      });
      setTopClients(Array.from(clientMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

      setLastUpdate(new Date());
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
      toast({
        title: "Erreur de chargement",
        description: error.message?.includes('column') 
          ? "Certaines colonnes sont manquantes dans la base de données."
          : "Impossible de charger les données. Vérifiez votre connexion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, dataType, source, chartView]);

  const resetFilters = () => {
    setPeriod('30d');
    setDataType('all');
    setSource('all');
    setChartView('daily');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const periodLabel = useMemo(() => {
    const labels = {
      'today': 'Aujourd\'hui',
      '7d': '7 derniers jours',
      '30d': '30 derniers jours',
      'month': 'Mois en cours',
      '12m': '12 derniers mois'
    };
    return labels[period] || period;
  }, [period]);

  const activeFiltersCount = [
    period !== '30d',
    dataType !== 'all',
    source !== 'all',
    chartView !== 'daily',
  ].filter(Boolean).length;

  return (
    <>
      <Helmet>
        <title>Tableau de bord | Effinor Admin</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pl-0 pr-4 pt-4 pb-4 sm:pr-5 sm:pt-5 sm:pb-5 lg:pr-6 lg:pt-6 lg:pb-6 xl:pr-8 xl:pt-8 xl:pb-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 lg:pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-sm lg:text-base text-gray-600 mt-2 font-medium">
                Vue d'ensemble Leads & Commandes
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <DashboardFilters
            period={period}
            onPeriodChange={setPeriod}
            dataType={dataType}
            onDataTypeChange={setDataType}
            source={source}
            onSourceChange={setSource}
            chartView={chartView}
            onChartViewChange={setChartView}
            onResetFilters={resetFilters}
            periodLabel={periodLabel}
            lastUpdate={lastUpdate}
            activeFiltersCount={activeFiltersCount}
          />
        </div>

        {/* KPI Cards */}
        <DashboardKPIs
          loading={loading}
          totalLeads={totalLeads}
          leadsTrend={leadsTrend}
          qualifiedLeads={qualifiedLeads}
          qualifiedPercentage={qualifiedPercentage}
          totalOrders={totalOrders}
          ordersTrend={ordersTrend}
          totalRevenue={totalRevenue}
          avgBasket={avgBasket}
          conversionRate={conversionRate}
          pendingOrders={pendingOrders}
          formatCurrency={formatCurrency}
        />

        {/* Charts Row */}
        <DashboardCharts
          loading={loading}
          chartData={chartData}
          chartView={chartView}
          setChartView={setChartView}
          leadsStatusBreakdown={leadsStatusBreakdown}
          ordersStatusBreakdown={ordersStatusBreakdown}
        />

        {/* Recent Leads & Orders Tables */}
        <DashboardRecentActivity
          loading={loading}
          leads={leads}
          orders={orders}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />

        {/* Top Sources & Top Clients */}
        <DashboardTopPerformers
          loading={loading}
          topSources={topSources}
          topClients={topClients}
          formatCurrency={formatCurrency}
        />
      </div>
    </>
  );
};

export default AdminDashboard;
