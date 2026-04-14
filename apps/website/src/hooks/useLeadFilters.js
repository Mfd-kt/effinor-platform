import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'leadFilters';

/**
 * Hook pour gérer les filtres de leads avec persistance localStorage
 */
export function useLeadFilters() {
  // Charger les filtres depuis localStorage au montage
  const getInitialFilters = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
    // Filtres par défaut
    return {
      statut: 'all',
      priorite: 'all',
      source: 'all',
      type_projet: 'all',
      commercial_assigne_id: 'all',
      score_min: 0,
      score_max: 100,
      date_from: null,
      date_to: null
    };
  };

  const [filters, setFilters] = useState(getInitialFilters);

  // Sauvegarder les filtres dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [filters]);

  // Mettre à jour un filtre spécifique
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Mettre à jour plusieurs filtres à la fois
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Réinitialiser tous les filtres
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      statut: 'all',
      priorite: 'all',
      source: 'all',
      type_projet: 'all',
      commercial_assigne_id: 'all',
      score_min: 0,
      score_max: 100,
      date_from: null,
      date_to: null
    };
    setFilters(defaultFilters);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFilters));
    } catch (error) {
      console.error('Error resetting filters in localStorage:', error);
    }
  }, []);

  // Obtenir les filtres actifs (hors "all")
  const getActiveFilters = useCallback(() => {
    const active = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== 'all' && value !== null && value !== undefined && value !== '' && value !== 0 && value !== 100) {
        active[key] = value;
      }
    });
    return active;
  }, [filters]);

  // Compter le nombre de filtres actifs
  const activeFiltersCount = useCallback(() => {
    return Object.keys(getActiveFilters()).length;
  }, [getActiveFilters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    getActiveFilters,
    activeFiltersCount: activeFiltersCount()
  };
}

export default useLeadFilters;



























