// src/components/admin/products/ProductsFilters.jsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, RefreshCw, Tag, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ProductsFilters = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  priceRangeFilter,
  onPriceRangeFilterChange,
  surDevisFilter,
  onSurDevisFilterChange,
  onResetFilters,
  categories = [],
  activeFiltersCount = 0,
}) => {
  return (
    <div className="bg-white rounded-2xl border-0 shadow-xl shadow-gray-500/10 overflow-hidden mb-6">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900 block">Filtres et recherche</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs mt-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 font-semibold">
                  {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={onResetFilters}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all font-semibold hover:shadow-sm h-auto"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="p-6 space-y-5 bg-gradient-to-b from-white to-gray-50/30">
        {/* Première ligne : Recherche */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-green-500" />
            Recherche
          </Label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors z-10" />
            <Input
              placeholder="Nom, marque, référence, catégorie..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-gray-700"
            />
          </div>
        </div>

        {/* Deuxième ligne : Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Catégorie */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-green-500" />
              Catégorie
            </Label>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-gray-700">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id || cat.slug} value={cat.slug || cat.id}>
                    {cat.nom || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-green-500" />
              Statut
            </Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-gray-700">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actifs uniquement</SelectItem>
                <SelectItem value="inactif">Inactifs uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prix */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-green-500" />
              Prix
            </Label>
            <Select value={priceRangeFilter} onValueChange={onPriceRangeFilterChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-gray-700">
                <SelectValue placeholder="Tous les prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les prix</SelectItem>
                <SelectItem value="<50">Moins de 50€</SelectItem>
                <SelectItem value="50-100">50€ - 100€</SelectItem>
                <SelectItem value="100-200">100€ - 200€</SelectItem>
                <SelectItem value="200-500">200€ - 500€</SelectItem>
                <SelectItem value=">500">Plus de 500€</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sur devis */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Sur devis
            </Label>
            <Select value={surDevisFilter} onValueChange={onSurDevisFilterChange}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-medium text-gray-700">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="oui">Sur devis uniquement</SelectItem>
                <SelectItem value="non">Prix affichés uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};











