import React, { useState, useEffect } from 'react';
import { X, Filter, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LEAD_STATUSES, PRIORITIES } from '@/lib/api/leads';
import { getAllUsers } from '@/lib/api/utilisateurs';
import { cn } from '@/lib/utils';

/**
 * Barre de filtres compacte horizontale pour le tableau des leads
 */
const LeadsTableFilters = ({ 
  filters, 
  onUpdateFilter, 
  onResetFilters, 
  activeFiltersCount,
  searchQuery,
  onSearchChange 
}) => {
  const [users, setUsers] = useState([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(activeFiltersCount > 0);

  // Load users for commercial filter
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await getAllUsers();
        if (result.success && result.data) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  // Status badge colors
  const statusColorMap = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    slate: 'bg-slate-100 text-slate-800 border-slate-300'
  };

  // Handle status toggle (multi-select)
  const handleStatusToggle = (statusKey) => {
    const currentStatuses = filters.statut || 'all';
    if (currentStatuses === 'all') {
      onUpdateFilter('statut', [statusKey]);
    } else if (Array.isArray(currentStatuses)) {
      if (currentStatuses.includes(statusKey)) {
        const newStatuses = currentStatuses.filter(s => s !== statusKey);
        onUpdateFilter('statut', newStatuses.length > 0 ? newStatuses : 'all');
      } else {
        onUpdateFilter('statut', [...currentStatuses, statusKey]);
      }
    } else {
      onUpdateFilter('statut', [currentStatuses, statusKey].filter((v, i, a) => a.indexOf(v) === i));
    }
  };

  // Check if status is selected
  const isStatusSelected = (statusKey) => {
    if (filters.statut === 'all') return false;
    if (Array.isArray(filters.statut)) {
      return filters.statut.includes(statusKey);
    }
    return filters.statut === statusKey;
  };

  // Handle priority toggle
  const handlePriorityToggle = (priority) => {
    const currentPriorities = filters.priorite || 'all';
    if (currentPriorities === 'all') {
      onUpdateFilter('priorite', [priority]);
    } else if (Array.isArray(currentPriorities)) {
      if (currentPriorities.includes(priority)) {
        const newPriorities = currentPriorities.filter(p => p !== priority);
        onUpdateFilter('priorite', newPriorities.length > 0 ? newPriorities : 'all');
      } else {
        onUpdateFilter('priorite', [...currentPriorities, priority]);
      }
    } else {
      onUpdateFilter('priorite', [currentPriorities, priority].filter((v, i, a) => a.indexOf(v) === i));
    }
  };

  // Check if priority is selected
  const isPrioritySelected = (priority) => {
    if (filters.priorite === 'all') return false;
    if (Array.isArray(filters.priorite)) {
      return filters.priorite.includes(priority);
    }
    return filters.priorite === priority;
  };

  // Get active filter badges
  const getActiveFilterBadges = () => {
    const badges = [];
    
    // Status badges
    if (filters.statut && filters.statut !== 'all') {
      const statuses = Array.isArray(filters.statut) ? filters.statut : [filters.statut];
      statuses.forEach(status => {
        const config = LEAD_STATUSES[status];
        if (config) {
          badges.push({
            key: `status-${status}`,
            label: config.label,
            color: statusColorMap[config.color] || statusColorMap.gray,
            onRemove: () => handleStatusToggle(status)
          });
        }
      });
    }

    // Priority badges
    if (filters.priorite && filters.priorite !== 'all') {
      const priorities = Array.isArray(filters.priorite) ? filters.priorite : [filters.priorite];
      priorities.forEach(priority => {
        const config = PRIORITIES[priority];
        if (config) {
          badges.push({
            key: `priority-${priority}`,
            label: config.label,
            color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            onRemove: () => handlePriorityToggle(priority)
          });
        }
      });
    }

    // Commercial badge
    if (filters.commercial_assigne_id && filters.commercial_assigne_id !== 'all') {
      const user = users.find(u => u.id === filters.commercial_assigne_id);
      if (user) {
        badges.push({
          key: 'commercial',
          label: `${user.prenom} ${user.nom}`,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          onRemove: () => onUpdateFilter('commercial_assigne_id', 'all')
        });
      }
    }

    // Source badge
    if (filters.source && filters.source !== 'all') {
      badges.push({
        key: 'source',
        label: filters.source,
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        onRemove: () => onUpdateFilter('source', 'all')
      });
    }

    // Date range badge
    if (filters.date_from || filters.date_to) {
      badges.push({
        key: 'date',
        label: 'Période sélectionnée',
        color: 'bg-green-100 text-green-800 border-green-300',
        onRemove: () => {
          onUpdateFilter('date_from', null);
          onUpdateFilter('date_to', null);
        }
      });
    }

    return badges;
  };

  const activeBadges = getActiveFilterBadges();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="p-4 space-y-3">
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Rechercher (nom, entreprise, email, téléphone)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10"
            />
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Active Filter Badges */}
        {activeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeBadges.map(badge => (
              <Badge
                key={badge.key}
                variant="outline"
                className={cn('text-xs font-medium flex items-center gap-1', badge.color)}
              >
                {badge.label}
                <button
                  onClick={badge.onRemove}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Expanded Filters */}
        {isFiltersExpanded && (
          <div className="pt-3 border-t border-gray-200 space-y-3">
            {/* Quick Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Statut - Quick select */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Statut
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(LEAD_STATUSES).slice(0, 4).map(([key, config]) => {
                    const isSelected = isStatusSelected(key);
                    return (
                      <button
                        key={key}
                        onClick={() => handleStatusToggle(key)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium border transition-all',
                          isSelected
                            ? `${statusColorMap[config.color]} ring-1 ring-sky-500`
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priorité */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Priorité
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(PRIORITIES).map(([key, config]) => {
                    const isSelected = isPrioritySelected(key);
                    return (
                      <button
                        key={key}
                        onClick={() => handlePriorityToggle(key)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium border transition-all flex items-center gap-1',
                          isSelected
                            ? 'bg-sky-50 text-sky-700 border-sky-300 ring-1 ring-sky-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <span>{config.icon}</span>
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commercial */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Commercial
                </label>
                <Select
                  value={filters.commercial_assigne_id || 'all'}
                  onValueChange={(value) => onUpdateFilter('commercial_assigne_id', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Tous" />
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
              </div>

              {/* Date Range */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Date
                </label>
                <div className="flex gap-1.5">
                  <Input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => onUpdateFilter('date_from', e.target.value || null)}
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => onUpdateFilter('date_to', e.target.value || null)}
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsTableFilters;



























