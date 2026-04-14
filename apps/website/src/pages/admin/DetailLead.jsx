import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { 
  getLeadById, 
  updateLead, 
  deleteLead, 
  changeLeadStatus,
  assignLead,
  getLeadTimeline
} from '@/lib/api/leads';
import { getStatuses } from '@/lib/api/statuses';
import { getAllUsers } from '@/lib/api/utilisateurs';
import { useUser } from '@/contexts/UserContext';
import LeadHeader from '@/components/leads/LeadDetails/LeadHeader';
import LeadSidebar from '@/components/leads/LeadDetails/LeadSidebar';
import LeadTabsHeader from '@/components/leads/LeadDetails/LeadTabsHeader';
import TabInformations from '@/components/leads/LeadDetails/TabInformations';
import TabNotes from '@/components/leads/LeadDetails/TabNotes';
import TabActivites from '@/components/leads/LeadDetails/TabActivites';
import TabDocuments from '@/components/leads/LeadDetails/TabDocuments';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { emitCrmBusinessEventsForStatusChange, emitCrmProjectValue } from '@/lib/effinorCrmAnalytics';

function maybeEmitCrmProjectValueOnSave(prevLead, updates, savedLead) {
  if (!savedLead?.id || !updates || typeof updates !== 'object') return;
  const keys = [
    ['montant_cee_estime', 'montant_cee_estime'],
    ['budget_estime', 'budget_estime'],
  ];
  for (const [key, sourceField] of keys) {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;
    const raw = updates[key];
    if (raw == null || raw === '') continue;
    const n = typeof raw === 'number' ? raw : parseFloat(raw);
    if (!Number.isFinite(n)) continue;
    const prevRaw = prevLead?.[key];
    const prevN = prevRaw != null && prevRaw !== '' ? parseFloat(prevRaw) : NaN;
    if (Number.isFinite(prevN) && prevN === n) continue;
    emitCrmProjectValue(savedLead, n, sourceField);
  }
}

/**
 * Page détail d'un lead - Layout 2 colonnes
 * Colonne gauche (25%) : Sidebar avec statut, score, commercial, etc.
 * Colonne droite (75%) : Header + Onglets avec contenu principal
 */
const DetailLead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUser();
  
  // Check if user is a commercial
  const isCommercial = profile?.role?.slug === 'commercial';
  
  // Helper function to navigate to leads list (unified route)
  const navigateToLeadsList = () => {
    navigate('/leads');
  };

  // State
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('informations');
  const [timeline, setTimeline] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [qualificationScore, setQualificationScore] = useState(0);
  const [qualificationBreakdown, setQualificationBreakdown] = useState(null);
  
  // Use ref to avoid dependency issues in callbacks
  const leadRef = React.useRef(null);
  
  // Keep leadRef in sync with lead state
  useEffect(() => {
    leadRef.current = lead;
  }, [lead]);

  // Load lead
  const loadLead = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const result = await getLeadById(id);

      if (result.success && result.data) {
        // Check if commercial user can access this lead
        if (isCommercial && profile?.id) {
          const leadCommercialId = result.data.commercial_assigne_id || result.data.responsable_id;
          if (leadCommercialId !== profile.id) {
            toast({
              variant: 'destructive',
              title: 'Accès refusé',
              description: 'Ce lead ne vous est pas assigné'
            });
            navigateToLeadsList();
            return;
          }
        }
        
        // Use qualification score and breakdown from API
        // The API automatically calculates and updates the score in the database
        let finalScore = result.data.qualification_score || 0;
        
        if (result.qualificationBreakdown) {
          setQualificationBreakdown(result.qualificationBreakdown);
          // Use the calculated score from breakdown
          finalScore = result.qualificationBreakdown.total || 0;
          setQualificationScore(finalScore);
          // Ensure lead object has the updated score
          setLead({ ...result.data, qualification_score: finalScore });
        } else {
          // Use score from database (should be up-to-date after API calculation)
          setQualificationScore(finalScore);
          setLead(result.data);
        }
        
        // Update leadRef to keep it in sync (if it exists)
        if (leadRef.current) {
          leadRef.current = result.data;
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.error || 'Lead non trouvé'
        });
        navigateToLeadsList();
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger le lead'
      });
      navigateToLeadsList();
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast, isCommercial, profile?.id, navigateToLeadsList]);

  // Load statuses
  const loadStatuses = async () => {
    try {
      const result = await getStatuses('lead_statuses');
      if (result.success && result.data) {
        setLeadStatuses(result.data);
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  // Load users for commercial assignment
  const loadUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Load timeline
  const loadTimeline = async () => {
    if (!id) return;
    try {
      const result = await getLeadTimeline(id);
      if (result.success && result.data) {
        setTimeline(result.data || []);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    }
  };

  // Note: Qualification score is now calculated automatically by the API (getLeadById)
  // No need for manual calculation here - the API handles it via qualificationScore.js

  // Auto-save with debounce
  const autoSaveRef = React.useRef(null);

  // Save immediately without debounce (for critical operations like building add/delete)
  const saveImmediately = useCallback(async (updates) => {
    if (!leadRef.current || !id) return;
    
    try {
      setSaving(true);
      const prevMoney = {
        montant_cee_estime: leadRef.current?.montant_cee_estime,
        budget_estime: leadRef.current?.budget_estime,
      };
      const result = await updateLead(id, updates);
      
      if (result.success && result.data) {
        if (result.qualificationScore !== undefined) {
          setQualificationScore(result.qualificationScore);
        } else if (result.data.qualification_score !== undefined) {
          setQualificationScore(result.data.qualification_score);
        }
        
        if (result.qualificationBreakdown) {
          setQualificationBreakdown(result.qualificationBreakdown);
        }
        
        maybeEmitCrmProjectValueOnSave(prevMoney, updates, result.data);

        setLead(result.data);
        leadRef.current = result.data;
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving immediately:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [id]);

  const autoSave = useCallback((field, value) => {
    if (!leadRef.current || !id) return;

    // Clear existing timeout
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    // Calculate score IMMEDIATELY on client for instant feedback (before debounce)
    const updates = typeof field === 'object' ? field : { [field]: value };
    const prevMoney = {
      montant_cee_estime: leadRef.current?.montant_cee_estime,
      budget_estime: leadRef.current?.budget_estime,
    };

    if (leadRef.current) {
      // Use dynamic import with then() to avoid async/await
      import('@/lib/leads/qualificationScore').then(({ computeQualificationScore }) => {
        try {
          const relations = {
            activities: [],
            notes: timeline,
            operationsCee: [],
            leadStatuses: leadStatuses
          };
          
          // Merge updates with current lead for score calculation
          const updatedLead = { ...leadRef.current, ...updates };
          const breakdown = computeQualificationScore(updatedLead, relations);
          
          // Update score state IMMEDIATELY (optimistic update)
          setQualificationScore(breakdown.total);
          setQualificationBreakdown(breakdown);
          
          // Optimistically update lead state with new score
          setLead({ ...leadRef.current, ...updates, qualification_score: breakdown.total });
        } catch (calcError) {
          console.warn('Error calculating score client-side:', calcError);
        }
      }).catch(err => {
        console.warn('Error importing qualification score module:', err);
      });
    }

    // Set new timeout for server sync
    autoSaveRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        const result = await updateLead(id, updates);

        if (result.success && result.data) {
          // Update qualification score from server response (more accurate, replaces optimistic update)
          if (result.qualificationScore !== undefined) {
            setQualificationScore(result.qualificationScore);
          } else if (result.data.qualification_score !== undefined) {
            setQualificationScore(result.data.qualification_score);
          }
          
          if (result.qualificationBreakdown) {
            setQualificationBreakdown(result.qualificationBreakdown);
          }

          maybeEmitCrmProjectValueOnSave(prevMoney, updates, result.data);
          
          // Update lead state with server response (includes calculated score)
          setLead(result.data);
          // Silent success - no toast to avoid spam
        }
      } catch (error) {
        console.error('Error auto-saving:', error);
        // Revert optimistic score update on error
        // The lead state will be reverted by leadRef.current in the error handler
      } finally {
        setSaving(false);
      }
    }, 1000); // 1 second debounce
  }, [id]); // Only depend on id, not lead

  // Handle status change
  const handleStatusChange = async (newStatusId) => {
    if (!lead || !id) return;

    try {
      // Optimistic update
      const oldStatus = lead.status_id;
      const newStatus = leadStatuses.find(s => s.id === newStatusId);
      setLead({ ...lead, status_id: newStatusId, statut: newStatus?.label || lead.statut });

      const result = await changeLeadStatus(id, newStatusId);

      if (result.success) {
        // Recalculate score immediately after status change
        try {
          const { computeQualificationScore } = await import('@/lib/leads/qualificationScore');
          const relations = {
            activities: [],
            notes: timeline,
            operationsCee: [],
            leadStatuses: leadStatuses
          };
          
          const updatedLead = { ...result.data };
          const breakdown = computeQualificationScore(updatedLead, relations);
          
          setQualificationScore(breakdown.total);
          setQualificationBreakdown(breakdown);
          result.data.qualification_score = breakdown.total;
        } catch (calcError) {
          console.warn('Error calculating score after status change:', calcError);
        }
        
        setLead(result.data);
        if (result.data?.status) {
          emitCrmBusinessEventsForStatusChange(result.data, result.data.status);
        }
        toast({
          title: 'Statut mis à jour',
          description: `Statut changé vers "${newStatus?.label || 'Nouveau statut'}"`
        });
      } else {
        // Revert on error
        setLead({ ...lead, status_id: oldStatus });
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de changer le statut'
      });
    }
  };

  // Handle assign
  const handleAssign = async (commercialId) => {
    if (!lead || !id) return;

    try {
      const commercial = users.find(u => u.id === commercialId);
      
      // Optimistic update
      setLead({ 
        ...lead, 
        commercial_assigne_id: commercialId || null,
        commercial_assigne: commercial || null
      });

      const result = await assignLead(id, commercialId);

      if (result.success) {
        // Update score if it changed (from server response)
        if (result.data.qualification_score !== undefined) {
          setQualificationScore(result.data.qualification_score);
        }
        
        setLead(result.data);
        toast({
          title: commercial ? 'Commercial assigné' : 'Assignation supprimée',
          description: commercial 
            ? `Assigné à ${commercial.prenom} ${commercial.nom}`
            : 'Aucun commercial assigné'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'assigner le commercial'
      });
      // Revert optimistic update by reloading
      const currentLead = leadRef.current;
      if (currentLead) {
        setLead(currentLead);
      }
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) return;

    try {
      const result = await deleteLead(id);
      if (result.success) {
        toast({
          title: 'Lead supprimé',
          description: 'Le lead a été supprimé avec succès'
        });
        navigateToLeadsList();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le lead'
      });
    }
  };

  // Format helpers
  const formatAmount = (amount) => {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch {
      return '-';
    }
  };

  // Effects - Only depend on id to avoid infinite loops
  useEffect(() => {
    if (id) {
      loadLead();
      loadStatuses();
      loadUsers();
      loadTimeline();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Score is automatically calculated by the API when loading or updating the lead
  // No need for manual calculation here

  // Tab counts
  const tabCounts = useMemo(() => ({
    notes: timeline.filter(item => item.type === 'note').length,
    activities: timeline.length,
    documents: lead?.documents_urls?.length || 0
  }), [timeline, lead]);

  if (loading) {
    return (
      <div className="admin-page p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="admin-page p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Lead non trouvé</p>
          <Button onClick={navigateToLeadsList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{lead.societe || lead.nom || 'Lead'} | CRM Effinor</title>
      </Helmet>

      <div className="admin-page min-h-screen bg-gray-50">
        {/* Breadcrumb & Back Button */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToLeadsList}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-sm text-gray-600">
              <Link to="/admin/leads" className="hover:text-gray-900">
                Leads
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">
                {lead.societe || `${lead.prenom || ''} ${lead.nom || ''}`.trim() || 'Sans nom'}
              </span>
            </nav>
            {saving && (
              <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </div>
            )}
          </div>
        </div>

        {/* Main Content - 2 Columns */}
        <div className="flex gap-6 p-6">
          {/* Left Column - Sidebar (25%) */}
          <aside className="w-full lg:w-1/4 flex-shrink-0">
            <LeadSidebar
              lead={lead}
              qualificationScore={qualificationScore}
              qualificationBreakdown={qualificationBreakdown}
              timeline={timeline}
              onUpdate={autoSave}
              onStatusChange={handleStatusChange}
              onAssign={isCommercial ? undefined : handleAssign}
              onDelete={isCommercial ? undefined : handleDelete}
              onCall={(phone) => window.open(`tel:${phone}`, '_self')}
              onEmail={(email) => window.open(`mailto:${email}`, '_self')}
              onSchedule={() => toast({ title: 'Fonctionnalité à venir', description: 'Bientôt disponible' })}
              formatAmount={formatAmount}
              formatRelativeTime={formatRelativeTime}
              leadStatuses={leadStatuses}
              users={users}
              isCommercial={isCommercial}
            />
          </aside>

          {/* Right Column - Main Content (75%) */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <LeadHeader
              lead={lead}
              onUpdate={autoSave}
              leadStatuses={leadStatuses}
            />

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <LeadTabsHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={tabCounts}
              />

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'informations' && (
                  <TabInformations
                    lead={lead}
                    onCompleteForm={async () => {
                      const result = await updateLead(id, { formulaire_complet: true });
                      if (result.success) {
                        setLead(result.data);
                        toast({ title: 'Formulaire marqué comme complété' });
                      }
                    }}
                    autoSave={autoSave}
                    saveImmediately={saveImmediately}
                    onUpdate={autoSave}
                  />
                )}

                {activeTab === 'notes' && (
                  <TabNotes
                    lead={lead}
                    timeline={timeline}
                    onRefresh={loadTimeline}
                  />
                )}

                {activeTab === 'activites' && (
                  <TabActivites
                    lead={lead}
                    timeline={timeline}
                    onRefresh={loadTimeline}
                  />
                )}

                {activeTab === 'documents' && (
                  <TabDocuments
                    lead={lead}
                    onUpdate={autoSave}
                  />
                )}

                {activeTab === 'historique' && (
                  <div className="text-center py-12 text-gray-500">
                    <p>Fonctionnalité à venir</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DetailLead;
