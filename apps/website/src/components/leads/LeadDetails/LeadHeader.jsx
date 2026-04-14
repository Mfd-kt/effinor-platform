import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Save, X, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Header simplifié du lead - Nom, entreprise, statut uniquement
 * Les actions et le score sont dans la sidebar
 */
const LeadHeader = ({ lead, onUpdate, leadStatuses = [] }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  
  const fullName = `${lead.prenom || ''} ${lead.nom || ''}`.trim() || lead.email || 'Sans nom';
  const companyName = lead.societe || 'Sans entreprise';

  // Get current status from dynamic statuses or fallback
  const currentStatus = leadStatuses.find(s => 
    s.id === lead.status_id || 
    s.code === lead.statut?.toUpperCase() || 
    s.code === lead.status?.code ||
    s.label === lead.statut ||
    s.label === lead.status?.label
  ) || 
  leadStatuses.find(s => s.is_default) || 
  leadStatuses[0] ||
  { label: lead.statut || 'Nouveau', color: 'gray' };
  
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
  const statusBadgeClass = statusColorMap[currentStatus.color] || statusColorMap.gray;

  // Start editing name
  const handleStartEditName = () => {
    setEditingName(fullName);
    setIsEditingName(true);
  };

  // Save name
  const handleSaveName = () => {
    const names = editingName.trim().split(' ');
    const prenom = names.slice(0, -1).join(' ') || '';
    const nom = names[names.length - 1] || '';
    onUpdate?.({ prenom, nom });
    setIsEditingName(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  // Format date with time helper
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy à HH:mm', { locale: fr });
    } catch (e) {
      return '-';
    }
  };

  // Format date only helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      return '-';
    }
  };

  // Format relative time helper
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const { formatDistanceToNow } = require('date-fns');
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch (e) {
      return '-';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-6">
        {/* Info - Gauche */}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          {/* Name - Inline editable */}
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="text-2xl font-bold"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveName}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-sky-600 transition-colors flex items-center gap-2 group min-w-0"
              onDoubleClick={handleStartEditName}
              title="Double-clic pour éditer"
            >
              <span className="truncate">{fullName}</span>
              <Edit className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </h1>
          )}

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>

          {/* Company */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Building className="h-4 w-4 text-gray-400" />
            <span className="text-base text-gray-600 whitespace-nowrap">{companyName}</span>
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>

          {/* Status Badge */}
          <Badge className={cn('text-sm px-3 py-1 flex-shrink-0', statusBadgeClass)}>
            {currentStatus.label}
          </Badge>
        </div>

        {/* Source & Tracking - Droite */}
        <div className="flex-shrink-0 pl-6 border-l border-gray-200">
          <div className="flex items-center gap-6">
            {/* Source & Campagne - Compact */}
            <div className="flex items-center gap-4">
              <div className="space-y-0.5 min-w-0">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Source</label>
                {lead.source ? (
                  <Badge variant="outline" className="text-xs font-medium bg-gray-50 border-gray-200 whitespace-nowrap">
                    {lead.source}
                  </Badge>
                ) : (
                  <p className="text-xs text-gray-400">-</p>
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Campagne</label>
                <p className="text-xs text-gray-900 font-medium whitespace-nowrap">{lead.campagne || '-'}</p>
              </div>
            </div>

            {/* Dates - Compact */}
            <div className="flex items-center gap-4">
              <div className="space-y-0.5 min-w-0">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Créé</label>
                <p className="text-xs text-gray-900 font-semibold whitespace-nowrap">
                  {formatDateTime(lead.created_at)}
                </p>
              </div>
              {lead.updated_at && lead.updated_at !== lead.created_at && (
                <div className="space-y-0.5 min-w-0">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Modifié</label>
                  <p className="text-xs text-gray-900 font-semibold whitespace-nowrap">
                    {formatDateTime(lead.updated_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LeadHeader;

