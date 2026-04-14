import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import LeadCard from './LeadCard';
import Skeleton from '@/components/ui/Skeleton';
import { getAllLeads } from '@/lib/api/leads';
import { cn } from '@/lib/utils';

/**
 * Colonne gauche - Liste des leads avec scroll et sélection
 */
const LeadsList = ({ selectedLeadId, onSelectLead, filters = {}, searchQuery = '' }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50;

  // Load leads
  const loadLeads = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const result = await getAllLeads({
        filters,
        page: pageNum,
        pageSize,
        sortBy: 'updated_at',
        sortOrder: 'desc',
        searchQuery
      });

      if (result.success) {
        if (append) {
          setLeads(prev => [...prev, ...(result.data || [])]);
        } else {
          setLeads(result.data || []);
        }
        setHasMore((result.pagination?.total || 0) > pageNum * pageSize);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  // Load initial leads
  useEffect(() => {
    setPage(1);
    loadLeads(1, false);
  }, [filters, searchQuery]);

  // Handle scroll for infinite scroll
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLeads(nextPage, true);
    }
  }, [hasMore, loading, page, loadLeads]);

  // Filtered leads (client-side filtering if needed)
  const filteredLeads = useMemo(() => {
    return leads;
  }, [leads]);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
        {!loading && (
          <p className="text-xs text-gray-500 mt-1">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        onScroll={handleScroll}
        role="list"
        aria-label="Liste des leads"
      >
        {loading && page === 1 ? (
          // Skeleton loaders
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-2 w-full mb-2 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">Aucun lead trouvé</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isSelected={selectedLeadId === lead.id}
                onClick={() => onSelectLead(lead.id)}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Loading more indicator */}
        {loading && page > 1 && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsList;




















