import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, Mail, Calendar, Trash2, Edit, X,
  Tag, Target, Info
} from 'lucide-react';
import QualificationScoreModal from './QualificationScoreModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserAvatar from '@/components/ui/UserAvatar';
import { PRIORITIES } from '@/lib/api/leads';
import { getAllUsers } from '@/lib/api/utilisateurs';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Composant QualificationScoreRing - Ring animé pour le score
 */
const QualificationScoreRing = ({ score }) => {
  const circumference = 2 * Math.PI * 50; // radius = 50
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';
  const strokeColor = score >= 70 ? 'stroke-green-500' : score >= 40 ? 'stroke-yellow-500' : 'stroke-red-500';

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="transform -rotate-90 w-32 h-32">
        <circle
          cx="64"
          cy="64"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        <motion.circle
          cx="64"
          cy="64"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${strokeColor}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-3xl font-bold ${color}`}>{score}</div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sidebar simplifiée pour DetailLead
 * Colonne gauche avec informations contextuelles
 */
const LeadSidebar = ({ 
  lead, 
  qualificationScore,
  qualificationBreakdown = null, // Receive breakdown from parent
  timeline = [],
  onUpdate,
  onStatusChange,
  onAssign,
  onDelete,
  onCall,
  onEmail,
  onSchedule,
  formatAmount,
  formatRelativeTime,
  leadStatuses = [], // Receive statuses from parent
  users: usersProp = [], // Receive users from parent to avoid duplicate loading
  isCommercial = false // Hide assign/delete for commercial users
}) => {
  const [localUsers, setLocalUsers] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  // Use users from props if provided, otherwise load locally
  const displayUsers = usersProp.length > 0 ? usersProp : localUsers;

  // Load users for commercial dropdown only if not provided by parent
  useEffect(() => {
    if (usersProp.length === 0) {
      const loadUsers = async () => {
        try {
          const result = await getAllUsers();
          if (result.success && result.data) {
            setLocalUsers(result.data);
          }
        } catch (error) {
          console.error('Error loading users:', error);
        }
      };
      loadUsers();
    }
  }, [usersProp]);

  // Note: leadStatuses are now passed from parent component

  // Get current status from dynamic statuses or fallback
  // Priority: status_id > status.code > statut (text) matching
  const currentStatus = useMemo(() => {
    if (leadStatuses.length === 0) {
      return { label: lead.statut || 'Nouveau', color: 'gray', id: null };
    }
    
    // First try: match by status_id (UUID) - most reliable
    if (lead.status_id) {
      const found = leadStatuses.find(s => s.id === lead.status_id);
      if (found) {
        console.log('[LeadSidebar] ✅ Found status by status_id:', found.label);
        return found;
      }
    }
    
    // Second try: match by status.code (if lead has status object from join)
    if (lead.status?.code) {
      const found = leadStatuses.find(s => s.code === lead.status.code);
      if (found) {
        console.log('[LeadSidebar] ✅ Found status by status.code:', found.label);
        return found;
      }
    }
    
    // Third try: match by code from statut text field
    if (lead.statut) {
      const statutUpper = lead.statut.toUpperCase().trim();
      const found = leadStatuses.find(s => 
        s.code === statutUpper || 
        s.code === statutUpper.replace(/\s+/g, '_') ||
        s.code === statutUpper.replace(/[^A-Z0-9_]/g, '_')
      );
      if (found) {
        console.log('[LeadSidebar] ✅ Found status by statut text (code match):', found.label);
        return found;
      }
    }
    
    // Fourth try: match by label (exact or case-insensitive)
    if (lead.statut) {
      const found = leadStatuses.find(s => 
        s.label === lead.statut || 
        s.label === lead.status?.label ||
        s.label.toLowerCase() === lead.statut.toLowerCase()
      );
      if (found) {
        console.log('[LeadSidebar] ✅ Found status by label:', found.label);
        return found;
      }
    }
    
    // Fallback: default status or first status
    const fallback = leadStatuses.find(s => s.is_default) || leadStatuses[0];
    console.log('[LeadSidebar] ⚠️ Using fallback status:', fallback?.label);
    return fallback || { label: lead.statut || 'Nouveau', color: 'gray', id: null };
  }, [lead.status_id, lead.statut, lead.status, leadStatuses]);
  
  // Determine the value for the Select - must be a valid UUID from leadStatuses
  const selectValue = useMemo(() => {
    const value = currentStatus?.id || lead.status_id || undefined;
    // Verify the value exists in leadStatuses
    if (value && leadStatuses.length > 0) {
      const exists = leadStatuses.some(s => s.id === value);
      if (!exists) {
        console.warn('[LeadSidebar] ⚠️ Select value', value, 'not found in leadStatuses, using currentStatus.id:', currentStatus?.id);
        return currentStatus?.id || undefined;
      }
    }
    return value;
  }, [currentStatus?.id, lead.status_id, leadStatuses]);
  
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

  // Handle edit field
  const handleEditField = (field, value) => {
    setEditingField(field);
    setEditingValue(value || '');
  };

  const handleSaveField = () => {
    if (onUpdate) {
      onUpdate({ [editingField]: editingValue });
    }
    setEditingField(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
  };

  return (
    <div className="space-y-4">
      {/* Qualification Score & Info Card */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          
          {/* Qualification Score */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center gap-2">
              Score de Qualification
              {qualificationBreakdown && (
                <button
                  onClick={() => setScoreModalOpen(true)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Voir le détail du score"
                >
                  <Info className="h-4 w-4" />
                </button>
              )}
            </h3>
            <button
              onClick={() => qualificationBreakdown && setScoreModalOpen(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              disabled={!qualificationBreakdown}
            >
              <QualificationScoreRing score={qualificationScore || 0} />
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {qualificationScore >= 70 ? 'Lead très qualifié' : 
               qualificationScore >= 40 ? 'Lead moyennement qualifié' : 
               'Lead peu qualifié'}
            </p>
            {qualificationBreakdown && (
              <button
                onClick={() => setScoreModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-700 underline mt-1"
              >
                Voir le détail
              </button>
            )}
          </div>
          
          {/* Qualification Score Modal */}
          {qualificationBreakdown && (
            <QualificationScoreModal
              open={scoreModalOpen}
              onOpenChange={setScoreModalOpen}
              breakdown={qualificationBreakdown}
              score={qualificationScore}
            />
          )}

          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Statut</label>
            {leadStatuses.length > 0 ? (
              <Select 
                value={selectValue} 
                onValueChange={(statusId) => {
                  if (statusId) {
                    console.log('[LeadSidebar] Changing status from', selectValue, 'to', statusId);
                    onStatusChange(statusId);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {currentStatus ? (
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusColorMap[currentStatus.color]?.split(' ')[0] || 'bg-gray-300'}`}></span>
                        {currentStatus.label}
                      </div>
                    ) : 'Sélectionner un statut'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {leadStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusColorMap[status.color]?.split(' ')[0] || 'bg-gray-300'}`}></span>
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 border rounded-md bg-gray-50">
                Chargement des statuts...
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Priorité</label>
            <Select 
              value={lead.priorite || 'normale'} 
              onValueChange={(v) => {
                if (onUpdate) {
                  onUpdate({ priorite: v });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {lead.priorite && PRIORITIES[lead.priorite] ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{
                        backgroundColor: lead.priorite === 'haute' ? '#ef4444' : 
                                       lead.priorite === 'normale' ? '#fcd34d' : '#9ca3af'
                      }}></span>
                      {PRIORITIES[lead.priorite].label}
                    </div>
                  ) : (
                    PRIORITIES['normale'].label
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITIES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{
                        backgroundColor: key === 'haute' ? '#ef4444' : 
                                       key === 'normale' ? '#fcd34d' : '#9ca3af'
                      }}></span>
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CEE Amount */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Montant CEE Estimé</label>
            <div className="relative">
              {editingField === 'montant_cee_estime' ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="pr-12"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveField();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button size="sm" onClick={handleSaveField}>
                    ✓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100"
                  onDoubleClick={() => handleEditField('montant_cee_estime', lead.montant_cee_estime)}
                >
                  <span className="text-lg font-bold text-green-600">
                    {formatAmount(lead.montant_cee_estime)}
                  </span>
                  <Edit className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Assigned Commercial - Only show if not commercial user */}
          {!isCommercial && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Commercial Assigné</label>
              <Select 
                value={lead.commercial_assigne_id || 'none'} 
                onValueChange={(v) => {
                  if (onAssign) {
                    onAssign(v === 'none' ? null : v);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {lead.commercial_assigne_id && lead.commercial_assigne ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar user={lead.commercial_assigne} size="sm" />
                        <span>{lead.commercial_assigne.prenom || ''} {lead.commercial_assigne.nom || ''}</span>
                      </div>
                    ) : (
                      lead.commercial_assigne_id && displayUsers && displayUsers.length > 0 ? (
                        (() => {
                          const foundUser = displayUsers.find(u => u.id === lead.commercial_assigne_id);
                          return foundUser ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar user={foundUser} size="sm" />
                              <span>{foundUser.prenom || ''} {foundUser.nom || ''}</span>
                            </div>
                          ) : 'Non assigné';
                        })()
                      ) : 'Non assigné'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {displayUsers && displayUsers.length > 0 ? (
                    displayUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={user} size="sm" />
                          <span>{user.prenom || ''} {user.nom || ''}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Chargement des commerciaux...</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Assigned Commercial - Read-only display for commercial users */}
          {isCommercial && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Commercial Assigné</label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                {lead.commercial_assigne_id && lead.commercial_assigne ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar user={lead.commercial_assigne} size="sm" />
                    <span className="text-sm font-medium text-gray-900">
                      {lead.commercial_assigne.prenom || ''} {lead.commercial_assigne.nom || ''}
                    </span>
                  </div>
                ) : (
                  lead.commercial_assigne_id && displayUsers && displayUsers.length > 0 ? (
                    (() => {
                      const foundUser = displayUsers.find(u => u.id === lead.commercial_assigne_id);
                      return foundUser ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar user={foundUser} size="sm" />
                          <span className="text-sm font-medium text-gray-900">
                            {foundUser.prenom || ''} {foundUser.nom || ''}
                          </span>
                        </div>
                      ) : <span className="text-sm text-gray-500">Non assigné</span>;
                    })()
                  ) : <span className="text-sm text-gray-500">Non assigné</span>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Actions Rapides</h3>
            {lead.telephone && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onCall?.(lead.telephone)}
              >
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                Appeler
              </Button>
            )}
            {lead.email && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onEmail?.(lead.email)}
              >
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                Envoyer Email
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onSchedule?.()}
            >
              <Calendar className="h-4 w-4 mr-2 text-purple-600" />
              Planifier RDV
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-green-500 hover:bg-green-600 text-white border-green-600"
              onClick={() => {
                if (window.confirm('Êtes-vous sûr de vouloir convertir ce lead en commande ?')) {
                  // TODO: Implémenter la conversion
                  alert('Fonctionnalité de conversion à venir');
                }
              }}
            >
              <Target className="h-4 w-4 mr-2" />
              Convertir
            </Button>
            {/* Hide delete button for commercial users */}
            {!isCommercial && onDelete && (
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete?.()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {(lead.tags || []).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const newTags = (lead.tags || []).filter((_, i) => i !== idx);
                      onUpdate?.({ tags: newTags });
                    }}
                  />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Ajouter un tag..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newTags = [...(lead.tags || []), e.target.value.trim()];
                  onUpdate?.({ tags: newTags });
                  e.target.value = '';
                }
              }}
            />
          </div>

          {/* Activity Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Dernières Activités
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {timeline.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-secondary-500 mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate">{item.description || item.note}</p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(item.timestamp || item.created_at)}</p>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucune activité récente</p>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default LeadSidebar;

