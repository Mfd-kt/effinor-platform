// src/components/admin/visitors/VisitorsFilters.jsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSourceLabel, parseUserAgent } from '@/utils/visitorUtils';

export const VisitorsFilters = ({
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  deviceFilter,
  onDeviceFilterChange,
  browserFilter,
  onBrowserFilterChange,
  showOnlyActive,
  onShowOnlyActiveChange,
  sortBy,
  onSortChange,
  visitors,
  onResetFilters,
}) => {
  // Extraire les sources uniques pour le filtre
  const uniqueSources = React.useMemo(() => {
    const sources = new Set();
    visitors.forEach(v => {
      const source = getSourceLabel(v);
      sources.add(source);
    });
    return Array.from(sources).sort();
  }, [visitors]);

  // Extraire les devices uniques
  const uniqueDevices = React.useMemo(() => {
    const devices = new Set();
    visitors.forEach(v => {
      const uaInfo = parseUserAgent(v.navigateur || v.user_agent);
      devices.add(uaInfo.device);
    });
    return Array.from(devices).sort();
  }, [visitors]);

  // Extraire les navigateurs uniques
  const uniqueBrowsers = React.useMemo(() => {
    const browsers = new Set();
    visitors.forEach(v => {
      const uaInfo = parseUserAgent(v.navigateur || v.user_agent);
      if (uaInfo.browser !== 'Unknown' && uaInfo.browser !== 'N/A') {
        browsers.add(uaInfo.browser);
      }
    });
    return Array.from(browsers).sort();
  }, [visitors]);

  // Compter les filtres actifs
  const activeFiltersCount = [
    searchQuery,
    sourceFilter !== 'all',
    deviceFilter !== 'all',
    browserFilter !== 'all',
    showOnlyActive,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-500/10 overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block">Filtres et recherche</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs mt-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 font-semibold">
                  {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all font-semibold hover:shadow-sm"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-6 bg-gradient-to-b from-white to-gray-50/30">

      {/* Première ligne de filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Recherche */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-indigo-500" />
            Recherche
          </Label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors z-10" />
            <Input
              placeholder="IP, page, source..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700"
            />
          </div>
        </div>

        {/* Filtre par source */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Source
          </Label>
          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
              <SelectValue placeholder="Toutes les sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              <SelectItem value="Accès direct">Accès direct</SelectItem>
              {uniqueSources
                .filter(s => s !== 'Accès direct')
                .map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par device */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Appareil
          </Label>
          <Select value={deviceFilter} onValueChange={onDeviceFilterChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
              <SelectValue placeholder="Tous les devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les devices</SelectItem>
              {uniqueDevices.map((device) => (
                <SelectItem key={device} value={device}>
                  {device === 'mobile' ? '📱 Mobile' : device === 'tablet' ? '📱 Tablet' : '💻 Desktop'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par navigateur */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Navigateur
          </Label>
          <Select value={browserFilter} onValueChange={onBrowserFilterChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
              <SelectValue placeholder="Tous les navigateurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les navigateurs</SelectItem>
              {uniqueBrowsers.map((browser) => (
                <SelectItem key={browser} value={browser}>
                  {browser}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deuxième ligne : Tri et Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t-2 border-gray-100">
        {/* Tri */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Trier par
          </Label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_seen">Dernière vue (récent)</SelectItem>
              <SelectItem value="last_seen_asc">Dernière vue (ancien)</SelectItem>
              <SelectItem value="duration">Durée session (long)</SelectItem>
              <SelectItem value="duration_asc">Durée session (court)</SelectItem>
              <SelectItem value="pages_views">Pages vues (plus)</SelectItem>
              <SelectItem value="pages_views_asc">Pages vues (moins)</SelectItem>
              <SelectItem value="created_at">Date arrivée (récent)</SelectItem>
              <SelectItem value="created_at_asc">Date arrivée (ancien)</SelectItem>
              <SelectItem value="ip">IP (A-Z)</SelectItem>
              <SelectItem value="ip_desc">IP (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toggle actifs uniquement */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
            Options
          </Label>
          <div className="flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 transition-all">
            <Switch
              id="active-only"
              checked={showOnlyActive}
              onCheckedChange={onShowOnlyActiveChange}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-600"
            />
            <Label htmlFor="active-only" className="cursor-pointer text-sm font-semibold text-gray-700 flex-1">
              Visiteurs actifs uniquement
            </Label>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

