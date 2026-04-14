import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { createOperationCee, getOperationsByLeadId, STATUSES } from '@/lib/api/operations';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Lead Operations Section
 * Displays and manages CEE operations for a specific lead
 */
const LeadOperationsSection = ({ leadId }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [fiches, setFiches] = useState([]);
  const [operations, setOperations] = useState([]);
  const [selectedFicheId, setSelectedFicheId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOperations, setLoadingOperations] = useState(true);
  const [error, setError] = useState(null);

  // Load active CEE sheets
  useEffect(() => {
    const loadFiches = async () => {
      try {
        const { data, error } = await supabase
          .from('fiches_cee')
          .select('id, numero, slug, titre')
          .eq('actif', true)
          .order('numero', { ascending: true });

        if (error) throw error;

        setFiches(data || []);
      } catch (err) {
        console.error('Error loading fiches CEE:', err);
        setError('Impossible de charger les fiches CEE');
      }
    };

    loadFiches();
  }, []);

  // Load operations for this lead
  useEffect(() => {
    if (!leadId) return;

    const loadOperations = async () => {
      setLoadingOperations(true);
      try {
        const result = await getOperationsByLeadId(leadId);
        
        if (result.success) {
          setOperations(result.data || []);
        } else {
          setError(result.error || 'Impossible de charger les opérations');
        }
      } catch (err) {
        console.error('Error loading operations:', err);
        setError('Impossible de charger les opérations CEE');
      } finally {
        setLoadingOperations(false);
      }
    };

    loadOperations();
  }, [leadId]);

  const handleCreate = async () => {
    if (!selectedFicheId) {
      toast({
        title: 'Sélection requise',
        description: 'Veuillez choisir une fiche CEE',
        variant: 'destructive'
      });
      return;
    }

    if (!leadId) {
      toast({
        title: 'Erreur',
        description: 'Lead ID manquant',
        variant: 'destructive'
      });
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const result = await createOperationCee({
        leadId,
        ficheCeeId: selectedFicheId,
        statut: 'brouillon'
      });

      if (result.success) {
        toast({
          title: 'Opération créée',
          description: 'L\'opération CEE a été créée avec succès',
        });

        // Reset selection
        setSelectedFicheId(null);

        // Reload operations
        const reloadResult = await getOperationsByLeadId(leadId);
        if (reloadResult.success) {
          setOperations(reloadResult.data || []);
        }

        // Navigate to the new operation detail page
        if (result.data?.id) {
          navigate(`/admin/operations/${result.data.id}`);
        }
      } else {
        throw new Error(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      console.error('Error creating operation:', err);
      setError(err.message || "Erreur lors de la création de l'opération");
      toast({
        title: 'Erreur',
        description: err.message || "Impossible de créer l'opération CEE",
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      return '-';
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (statut) => {
    const statusConfig = STATUSES[statut] || { label: statut, color: 'gray' };
    
    // Map color names to Tailwind classes (use full class names for Tailwind JIT)
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-700 border-gray-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      red: 'bg-red-100 text-red-700 border-red-300',
      slate: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    
    const colorClass = colorClasses[statusConfig.color] || colorClasses.gray;
    
    return (
      <Badge 
        variant="outline" 
        className={colorClass}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Opérations CEE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Create new operation form */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            {fiches.length === 0 ? (
              <div className="flex-1 p-3 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-500 text-center">
                Aucune fiche CEE disponible
              </div>
            ) : (
              <Select value={selectedFicheId || undefined} onValueChange={setSelectedFicheId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choisir une fiche CEE..." />
                </SelectTrigger>
                <SelectContent>
                  {fiches.map((fiche) => (
                    <SelectItem key={fiche.id} value={fiche.id}>
                      {fiche.numero} — {fiche.titre || fiche.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button
              onClick={handleCreate}
              disabled={loading || !selectedFicheId || loadingOperations}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une opération CEE
                </>
              )}
            </Button>
          </div>

          {/* Operations list */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Opérations associées à ce lead
            </h3>

            {loadingOperations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : operations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                Aucune opération CEE pour l'instant.
                <br />
                <span className="text-xs text-gray-400 mt-1 block">
                  Créez une nouvelle opération en sélectionnant une fiche CEE ci-dessus.
                </span>
              </p>
            ) : (
              <div className="space-y-2">
                {operations.map((operation) => (
                  <motion.div
                    key={operation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:border-[#0EA5E9] hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => navigate(`/admin/operations/${operation.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="font-semibold text-gray-900">
                          {operation.reference || operation.id.slice(0, 8)}
                        </div>
                        {getStatusBadge(operation.statut)}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          Fiche : <span className="font-medium">{operation.fiche?.numero || '-'}</span>
                          {operation.fiche?.titre && (
                            <span className="ml-1">— {operation.fiche.titre}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span>Créé le {formatDate(operation.date_creation)}</span>
                          {operation.prime_estimee && (
                            <span className="font-medium text-gray-700">
                              Prime estimée : {formatAmount(operation.prime_estimee)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LeadOperationsSection;

