import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/ui/UserAvatar';
import { LEAD_STATUSES, PRIORITIES } from '@/lib/api/leads';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Card compacte pour chaque lead dans la liste
 */
const LeadCard = ({ lead, isSelected, onClick }) => {
  const fullName = `${lead.prenom || ''} ${lead.nom || ''}`.trim() || lead.email || 'Sans nom';
  const companyName = lead.societe || 'Sans entreprise';
  const qualificationScore = lead.qualification_score || 0;

  // Status badge color
  const statusConfig = LEAD_STATUSES[lead.statut || 'nouveau'] || LEAD_STATUSES.nouveau;
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
  const statusBadgeClass = statusColorMap[statusConfig.color] || statusColorMap.gray;

  // Priority badge
  const priorityConfig = PRIORITIES[lead.priorite || 'normale'] || PRIORITIES.normale;

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch (e) {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200',
        isSelected 
          ? 'border-sky-500 shadow-md ring-2 ring-sky-500/20' 
          : 'hover:border-gray-300 hover:shadow-sm'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Voir les détails de ${fullName} de ${companyName}`}
    >
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <UserAvatar
          user={{
            full_name: fullName,
            email: lead.email,
            prenom: lead.prenom,
            nom: lead.nom
          }}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">
            {fullName}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {companyName}
          </div>
        </div>
      </div>

      {/* Score de qualification */}
      {qualificationScore > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Score</span>
            <span className={cn(
              'text-xs font-semibold',
              qualificationScore >= 70 ? 'text-green-600' :
              qualificationScore >= 40 ? 'text-yellow-600' :
              'text-red-600'
            )}>
              {qualificationScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                qualificationScore >= 70 ? 'bg-green-500' :
                qualificationScore >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              )}
              style={{ width: `${qualificationScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Contact info */}
      <div className="space-y-1.5 mb-3">
        {lead.telephone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="h-3.5 w-3.5" />
            <span className="truncate">{lead.telephone}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {/* Status and Priority badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge className={cn('text-xs border', statusBadgeClass)}>
          {statusConfig.label}
        </Badge>
        <span className="text-xs font-medium text-gray-600">
          {priorityConfig.icon}
        </span>
      </div>

      {/* Dernière activité */}
      {(lead.updated_at || lead.created_at) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatRelativeTime(lead.updated_at || lead.created_at)}</span>
        </div>
      )}

      {/* Montant CEE estimé (si disponible) */}
      {lead.montant_cee_estime && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">Montant CEE</div>
          <div className="text-sm font-semibold text-green-600">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0
            }).format(lead.montant_cee_estime)}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LeadCard;




















