import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, Phone, Mail, MoreVertical,
  Eye, Edit, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Skeleton from '@/components/ui/Skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserAvatar from '@/components/ui/UserAvatar';
import { getAllLeads } from '@/lib/api/leads';
import { LEAD_STATUSES, PRIORITIES } from '@/lib/api/leads';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Composant tableau pour afficher les leads
 * Design épuré avec tri, pagination et actions
 */
const LeadsTable = ({ filters = {}, searchQuery = '' }) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pageSize: 50, totalPages: 1 });
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Map des colonnes aux champs de la DB
  const sortFieldMap = {
    'nom': 'nom',
    'entreprise': 'societe',
    'email': 'email',
    'statut': 'statut',
    'priorite': 'priorite',
    'score': 'qualification_score',
    'created_at': 'created_at',
    'updated_at': 'updated_at'
  };

  // Load leads
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const dbSortField = sortFieldMap[sortBy] || 'updated_at';
      const result = await getAllLeads({
        filters,
        page,
        pageSize: pagination.pageSize,
        sortBy: dbSortField,
        sortOrder,
        searchQuery
      });

      if (result.success) {
        setLeads(result.data || []);
        setPagination(result.pagination || pagination);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, page, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1); // Reset to page 1 when filters change
    loadLeads();
  }, [filters, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    if (page > 1) {
      loadLeads();
    }
  }, [page]);

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-gray-900" />
      : <ArrowDown className="h-4 w-4 text-gray-900" />;
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch (e) {
      return '-';
    }
  };

  // Status badge config
  const getStatusBadge = (statut) => {
    const statusConfig = LEAD_STATUSES[statut || 'nouveau'] || LEAD_STATUSES.nouveau;
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
    return (
      <Badge 
        variant="outline" 
        className={cn('text-xs font-medium', statusColorMap[statusConfig.color] || statusColorMap.gray)}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  // Priority badge
  const getPriorityBadge = (priorite) => {
    const priorityConfig = PRIORITIES[priorite || 'normale'] || PRIORITIES.normale;
    const priorityColorMap = {
      red: 'bg-red-100 text-red-800 border-red-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return (
      <Badge 
        variant="outline" 
        className={cn('text-xs font-medium', priorityColorMap[priorityConfig.color] || priorityColorMap.gray)}
      >
        {priorityConfig.label}
      </Badge>
    );
  };

  // Handle row click
  const handleRowClick = (leadId) => {
    navigate(`/admin/leads/${leadId}`);
  };

  // Format name
  const getFullName = (lead) => {
    return `${lead.prenom || ''} ${lead.nom || ''}`.trim() || lead.email || 'Sans nom';
  };

  if (loading && leads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b bg-gray-50">
            <tr className="border-b">
              {Array.from({ length: 11 }).map((_, i) => (
                <th key={i} className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b">
                {Array.from({ length: 11 }).map((_, j) => (
                  <td key={j} className="p-4 align-middle">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b bg-gray-50">
            <tr className="border-b bg-gray-50 hover:bg-gray-50">
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 w-12"></th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-2 font-medium"
                  onClick={() => handleSort('nom')}
                >
                  Nom complet
                  {getSortIcon('nom')}
                </Button>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[180px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-2 font-medium"
                  onClick={() => handleSort('entreprise')}
                >
                  Entreprise
                  {getSortIcon('entreprise')}
                </Button>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[180px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-2 font-medium"
                  onClick={() => handleSort('email')}
                >
                  Email
                  {getSortIcon('email')}
                </Button>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[140px]">Téléphone</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-2 font-medium"
                  onClick={() => handleSort('statut')}
                >
                  Statut
                  {getSortIcon('statut')}
                </Button>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[110px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-2 font-medium"
                  onClick={() => handleSort('priorite')}
                >
                  Priorité
                  {getSortIcon('priorite')}
                </Button>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-2 font-medium"
                  onClick={() => handleSort('score')}
                >
                  Score
                  {getSortIcon('score')}
                </Button>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[180px]">Commercial</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 min-w-[150px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 -ml-2 font-medium"
                  onClick={() => handleSort('updated_at')}
                >
                  Dernière activité
                  {getSortIcon('updated_at')}
                </Button>
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-500 w-12"></th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-gray-500 p-4">
                  <p className="font-medium mb-1">Aucun lead trouvé</p>
                  <p className="text-sm text-gray-400">Essayez de modifier vos filtres</p>
                </td>
              </tr>
            ) : (
              leads.map((lead, index) => (
                <tr
                  key={lead.id}
                  className={cn(
                    'border-b transition-colors cursor-pointer hover:bg-gray-50',
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  )}
                  onClick={() => handleRowClick(lead.id)}
                >
                  <td className="p-4 align-middle">
                    <UserAvatar
                      user={{
                        full_name: getFullName(lead),
                        email: lead.email,
                        prenom: lead.prenom,
                        nom: lead.nom
                      }}
                      size="sm"
                    />
                  </td>
                  <td className="p-4 align-middle font-medium text-gray-900">
                    {getFullName(lead)}
                  </td>
                  <td className="p-4 align-middle text-gray-700">
                    {lead.societe || '-'}
                  </td>
                  <td className="p-4 align-middle text-gray-700">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-4 align-middle text-gray-700">
                    {lead.telephone ? (
                      <a
                        href={`tel:${lead.telephone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {lead.telephone}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="p-4 align-middle">
                    {getStatusBadge(lead.statut)}
                  </td>
                  <td className="p-4 align-middle">
                    {getPriorityBadge(lead.priorite)}
                  </td>
                  <td className="p-4 align-middle">
                    {lead.qualification_score !== null && lead.qualification_score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-semibold',
                          lead.qualification_score >= 70 ? 'text-green-600' :
                          lead.qualification_score >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        )}>
                          {lead.qualification_score}/100
                        </span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 align-middle text-gray-700 text-sm">
                    {lead.commercial_assigne ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          user={lead.commercial_assigne}
                          size="sm"
                        />
                        <span className="truncate max-w-[120px]">
                          {lead.commercial_assigne.prenom} {lead.commercial_assigne.nom}
                        </span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 align-middle text-gray-500 text-sm">
                    {formatRelativeTime(lead.updated_at || lead.created_at)}
                  </td>
                  <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRowClick(lead.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        {lead.email && (
                          <DropdownMenuItem
                            onClick={() => window.location.href = `mailto:${lead.email}`}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer email
                          </DropdownMenuItem>
                        )}
                        {lead.telephone && (
                          <DropdownMenuItem
                            onClick={() => window.location.href = `tel:${lead.telephone}`}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Appeler
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-700">
            Affichage de {(page - 1) * pagination.pageSize + 1} à {Math.min(page * pagination.pageSize, pagination.total)} sur {pagination.total} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <div className="text-sm text-gray-700">
              Page {page} sur {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;

