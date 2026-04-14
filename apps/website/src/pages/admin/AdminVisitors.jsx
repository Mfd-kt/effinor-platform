// src/pages/admin/AdminVisitors.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { VisitorsHeaderStats } from '@/components/admin/visitors/VisitorsHeaderStats';
import { VisitorsFilters } from '@/components/admin/visitors/VisitorsFilters';
import { VisitorCard } from '@/components/admin/visitors/VisitorCard';
import { getSourceLabel, parseUserAgent } from '@/utils/visitorUtils';

// Données mock pour le développement (à supprimer en production)
const mockVisitors = [
  {
    id: '1',
    ip_address: '109.197.247.157',
    session_id: 'session-1',
    page_actuelle: '/',
    utm_source: 'google',
    referrer_url: null,
    navigateur: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    last_seen: new Date(Date.now() - 30000).toISOString(),
    statut: 'active',
    created_at: new Date(Date.now() - 600000).toISOString(),
    parcours: JSON.stringify(['/', '/produits-solutions', '/contact']),
  },
  {
    id: '2',
    ip_address: '192.168.1.100',
    session_id: 'session-2',
    page_actuelle: '/dashboard',
    utm_source: null,
    referrer_url: 'https://www.google.com',
    navigateur: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    last_seen: new Date(Date.now() - 120000).toISOString(),
    statut: 'active',
    created_at: new Date(Date.now() - 900000).toISOString(),
    parcours: JSON.stringify(['/dashboard']),
  },
  {
    id: '3',
    ip_address: '10.0.0.50',
    session_id: 'session-3',
    page_actuelle: '/realisations',
    utm_source: 'meta',
    referrer_url: null,
    navigateur: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    last_seen: new Date(Date.now() - 3600000).toISOString(),
    statut: 'left',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    parcours: JSON.stringify(['/', '/realisations']),
  },
];

const AdminVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [browserFilter, setBrowserFilter] = useState('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [sortBy, setSortBy] = useState('last_seen');
  const [useMockData, setUseMockData] = useState(false); // Pour tester avec mock
  const { toast } = useToast();

  const fetchVisitors = async () => {
    if (useMockData) {
      setVisitors(mockVisitors);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('visiteurs')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      logger.error('Error fetching visitors:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les visiteurs: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVisitors();

    if (!useMockData) {
      const channel = supabase
        .channel('realtime-visitors-admin')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'visiteurs' },
          (payload) => {
            fetchVisitors(); // Refetch the list on any change
          }
        )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            logger.error('Failed to subscribe to visitors channel');
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [useMockData]);

  // Filtrage et tri des visiteurs
  const filteredAndSortedVisitors = useMemo(() => {
    let filtered = [...visitors];

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => {
        const ip = (v.ip_address || v.ip || '').toLowerCase();
        const page = (v.page_actuelle || v.page || '').toLowerCase();
        const source = getSourceLabel(v).toLowerCase();
        return ip.includes(query) || page.includes(query) || source.includes(query);
      });
    }

    // Filtre par source
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(v => getSourceLabel(v) === sourceFilter);
    }

    // Filtre par device
    if (deviceFilter !== 'all') {
      filtered = filtered.filter(v => {
        const uaInfo = parseUserAgent(v.navigateur || v.user_agent);
        return uaInfo.device === deviceFilter;
      });
    }

    // Filtre par navigateur
    if (browserFilter !== 'all') {
      filtered = filtered.filter(v => {
        const uaInfo = parseUserAgent(v.navigateur || v.user_agent);
        return uaInfo.browser === browserFilter;
      });
    }

    // Filtre actifs uniquement
    if (showOnlyActive) {
      filtered = filtered.filter(v => v.statut === 'active' || v.is_online);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'last_seen':
          const aTime = new Date(a.last_seen || a.derniere_activite || 0);
          const bTime = new Date(b.last_seen || b.derniere_activite || 0);
          return bTime - aTime;
        case 'last_seen_asc':
          const aTimeAsc = new Date(a.last_seen || a.derniere_activite || 0);
          const bTimeAsc = new Date(b.last_seen || b.derniere_activite || 0);
          return aTimeAsc - bTimeAsc;
        case 'duration':
          const aDuration = a.created_at ? new Date() - new Date(a.created_at) : 0;
          const bDuration = b.created_at ? new Date() - new Date(b.created_at) : 0;
          return bDuration - aDuration;
        case 'duration_asc':
          const aDurationAsc = a.created_at ? new Date() - new Date(a.created_at) : 0;
          const bDurationAsc = b.created_at ? new Date() - new Date(b.created_at) : 0;
          return aDurationAsc - bDurationAsc;
        case 'pages_views':
          const aPages = a.nombre_pages_vues || 0;
          const bPages = b.nombre_pages_vues || 0;
          return bPages - aPages;
        case 'pages_views_asc':
          const aPagesAsc = a.nombre_pages_vues || 0;
          const bPagesAsc = b.nombre_pages_vues || 0;
          return aPagesAsc - bPagesAsc;
        case 'created_at':
          const aCreated = new Date(a.created_at || 0);
          const bCreated = new Date(b.created_at || 0);
          return bCreated - aCreated;
        case 'created_at_asc':
          const aCreatedAsc = new Date(a.created_at || 0);
          const bCreatedAsc = new Date(b.created_at || 0);
          return aCreatedAsc - bCreatedAsc;
        case 'ip':
          return (a.ip_address || a.ip || '').localeCompare(b.ip_address || b.ip || '');
        case 'ip_desc':
          return (b.ip_address || b.ip || '').localeCompare(a.ip_address || a.ip || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [visitors, searchQuery, sourceFilter, deviceFilter, browserFilter, showOnlyActive, sortBy]);

  return (
    <>
      <Helmet>
        <title>Suivi des Visiteurs | Effinor Admin</title>
      </Helmet>
      
      <div className="space-y-8">
        {/* Header avec KPI */}
        <VisitorsHeaderStats visitors={visitors} />

        {/* Section Filtres et Liste */}
        <div className="space-y-6">
          {/* Filtres */}
          <VisitorsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          deviceFilter={deviceFilter}
          onDeviceFilterChange={setDeviceFilter}
          browserFilter={browserFilter}
          onBrowserFilterChange={setBrowserFilter}
          showOnlyActive={showOnlyActive}
          onShowOnlyActiveChange={setShowOnlyActive}
          sortBy={sortBy}
          onSortChange={setSortBy}
          visitors={visitors}
          onResetFilters={() => {
            setSearchQuery('');
            setSourceFilter('all');
            setDeviceFilter('all');
            setBrowserFilter('all');
            setShowOnlyActive(false);
            setSortBy('last_seen');
          }}
          />

          {/* Liste des visiteurs */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
                Visiteurs
              </h2>
              <span className="text-sm text-gray-600 font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg border border-indigo-200/50">
                {filteredAndSortedVisitors.length} visiteur{filteredAndSortedVisitors.length > 1 ? 's' : ''}
                {filteredAndSortedVisitors.length !== visitors.length && ` sur ${visitors.length}`}
              </span>
            </div>

            {loading ? (
          <div className="text-center p-12 text-gray-600">
            Chargement des visiteurs...
          </div>
        ) : filteredAndSortedVisitors.length === 0 ? (
          <div className="text-center p-12 text-gray-600 bg-white rounded-lg border border-gray-200">
            {visitors.length === 0 
              ? 'Aucun visiteur pour le moment.'
              : 'Aucun visiteur ne correspond aux filtres sélectionnés.'}
          </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedVisitors.map((visitor) => (
                  <VisitorCard
                    key={visitor.id}
                    visitor={visitor}
                    anonymizeIPs={false} // Changer à true pour anonymiser les IPs
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toggle mock data pour développement (à supprimer en production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4">
            <label className="flex items-center gap-2 text-xs text-gray-500 bg-white p-2 rounded border">
              <input
                type="checkbox"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
                className="rounded"
              />
              Utiliser données mock
            </label>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminVisitors;
