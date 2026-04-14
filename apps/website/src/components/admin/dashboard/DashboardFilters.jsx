// src/components/admin/dashboard/DashboardFilters.jsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Filter, RefreshCw, Calendar, BarChart3, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DashboardFilters = ({
  period,
  onPeriodChange,
  dataType,
  onDataTypeChange,
  source,
  onSourceChange,
  chartView,
  onChartViewChange,
  onResetFilters,
  periodLabel,
  lastUpdate,
  activeFiltersCount = 0,
}) => {
  return (
    <div className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-500/10 overflow-hidden mb-6 lg:mb-8">
      {/* Header */}
      <div className="p-4 lg:p-5 border-b border-gray-200 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block">Filtres et périodes</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs mt-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 font-semibold">
                  {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 font-medium">
              Période : <span className="font-bold text-gray-900">{periodLabel}</span>
            </p>
            <p className="text-xs text-gray-500">
              Dernière mise à jour : <span className="font-semibold text-gray-700">
                {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5 bg-gradient-to-b from-white to-gray-50/30">
        {/* Première ligne */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 xl:gap-6">
          {/* Période */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              Période
            </Label>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="month">Mois en cours</SelectItem>
                <SelectItem value="12m">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type de données */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
              Type de données
            </Label>
            <Select value={dataType} onValueChange={onDataTypeChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout</SelectItem>
                <SelectItem value="leads">Leads uniquement</SelectItem>
                <SelectItem value="commandes">Commandes uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              Source
            </Label>
            <Select value={source} onValueChange={onSourceChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="Formulaire site">Formulaire site</SelectItem>
                <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                <SelectItem value="Téléphone">Téléphone</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vue graphique */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Vue graphique
            </Label>
            <Select value={chartView} onValueChange={onChartViewChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bouton réinitialiser */}
        <div className="pt-4 border-t-2 border-gray-100">
          <Button
            variant="outline"
            onClick={onResetFilters}
            className="h-11 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 font-semibold text-gray-700 transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </Button>
        </div>
      </div>
    </div>
  );
};

