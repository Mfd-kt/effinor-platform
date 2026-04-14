import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { LEAD_STATUSES, PRIORITIES, PROJECT_TYPES } from '@/lib/api/leads';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Barre de filtres intelligents pour les leads
 */
const LeadFilters = ({ filters, onUpdateFilter, onResetFilters, activeFiltersCount, className = "" }) => {
  const [isOpen, setIsOpen] = useState(activeFiltersCount > 0);

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
      // Start with just this status
      onUpdateFilter('statut', [statusKey]);
    } else if (Array.isArray(currentStatuses)) {
      if (currentStatuses.includes(statusKey)) {
        // Remove status
        const newStatuses = currentStatuses.filter(s => s !== statusKey);
        onUpdateFilter('statut', newStatuses.length > 0 ? newStatuses : 'all');
      } else {
        // Add status
        onUpdateFilter('statut', [...currentStatuses, statusKey]);
      }
    } else {
      // Single status selected, convert to array
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

  // Handle priority toggle (multi-select)
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

  // Format date for input
  const formatDateInput = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'yyyy-MM-dd');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={cn("bg-white border-b border-gray-200", className)}>
      {/* Filter Toggle Button */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
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
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
              {/* Status Tags */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Statuts
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(LEAD_STATUSES).map(([key, config]) => {
                    const isSelected = isStatusSelected(key);
                    const badgeClass = statusColorMap[config.color] || statusColorMap.gray;
                    return (
                      <button
                        key={key}
                        onClick={() => handleStatusToggle(key)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200',
                          isSelected
                            ? `${badgeClass} ring-2 ring-offset-2 ring-sky-500`
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Multi-Select */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Priorités
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRIORITIES).map(([key, config]) => {
                    const isSelected = isPrioritySelected(key);
                    return (
                      <button
                        key={key}
                        onClick={() => handlePriorityToggle(key)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 flex items-center gap-2',
                          isSelected
                            ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-offset-2 ring-sky-500'
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

              {/* Qualification Score Slider */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Score de Qualification: {filters.score_min || 0} - {filters.score_max || 100}
                </label>
                <div className="px-2">
                  <Slider
                    value={[filters.score_min || 0, filters.score_max || 100]}
                    onValueChange={(values) => {
                      onUpdateFilter('score_min', values[0]);
                      onUpdateFilter('score_max', values[1]);
                    }}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={formatDateInput(filters.date_from)}
                    onChange={(e) => onUpdateFilter('date_from', e.target.value || null)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de fin
                  </label>
                  <Input
                    type="date"
                    value={formatDateInput(filters.date_to)}
                    onChange={(e) => onUpdateFilter('date_to', e.target.value || null)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Source Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Source
                </label>
                <Select
                  value={filters.source || 'all'}
                  onValueChange={(value) => onUpdateFilter('source', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes sources</SelectItem>
                    <SelectItem value="hero_formulaire_accueil">Formulaire Accueil</SelectItem>
                    <SelectItem value="Landing Déshumidificateur">Landing Déshumidif</SelectItem>
                    <SelectItem value="Formulaire de Contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Type de Projet
                </label>
                <Select
                  value={filters.type_projet || 'all'}
                  onValueChange={(value) => onUpdateFilter('type_projet', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    {PROJECT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadFilters;




















