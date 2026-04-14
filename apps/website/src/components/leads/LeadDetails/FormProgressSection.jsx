import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle, FileText, Building2, User, Euro, Calendar, MessageSquare } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

/**
 * Section affichant le parcours du formulaire et les données collectées étape par étape
 */
const FormProgressSection = ({ lead, onComplete }) => {
  const { toast } = useToast();
  // Parser formulaire_data JSONB si disponible
  const formData = React.useMemo(() => {
    if (!lead.formulaire_data) {
      // Essayer de parser depuis products si formulaire_data n'existe pas
      try {
        if (typeof lead.products === 'string') {
          return JSON.parse(lead.products);
        }
        if (typeof lead.products === 'object') {
          return lead.products;
        }
      } catch (e) {
        return null;
      }
      return null;
    }
    
    try {
      if (typeof lead.formulaire_data === 'string') {
        return JSON.parse(lead.formulaire_data);
      }
      return lead.formulaire_data;
    } catch (e) {
      return null;
    }
  }, [lead.formulaire_data, lead.products]);

  // Déterminer l'étape actuelle
  const currentStep = React.useMemo(() => {
    if (lead.formulaire_complet) return 6;
    if (!lead.etape_formulaire) {
      // Si pas d'étape mais qu'il y a des données mini-form
      if (lead.nom || lead.email || lead.telephone) return 0; // Mini-form complété
      return 0;
    }
    if (lead.etape_formulaire.includes('step')) {
      const stepNum = parseInt(lead.etape_formulaire.replace('step', ''));
      return isNaN(stepNum) ? 0 : stepNum;
    }
    if (lead.etape_formulaire === 'mini_form_completed') return 0;
    if (lead.etape_formulaire === 'complet') return 6;
    return 0;
  }, [lead.etape_formulaire, lead.formulaire_complet]);

  // Étapes du formulaire
  const steps = [
    { num: 0, label: 'Mini-formulaire', icon: FileText, key: 'mini' },
    { num: 1, label: 'Informations entreprise', icon: Building2, key: 'step1' },
    { num: 2, label: 'Contact principal', icon: User, key: 'step2' },
    { num: 3, label: 'Dépenses énergétiques', icon: Euro, key: 'step3' },
    { num: 4, label: 'Configuration bâtiments', icon: Calendar, key: 'step4' },
    { num: 5, label: 'Détails techniques', icon: Building2, key: 'step5' },
    { num: 6, label: 'Commentaires', icon: MessageSquare, key: 'step6' },
  ];

  // Vérifier si une étape est complétée
  const isStepCompleted = (stepNum) => {
    if (stepNum === 0) {
      // Mini-form: vérifier si nom, email, téléphone existent
      return !!(lead.nom || lead.email || lead.telephone);
    }
    if (!formData) return false;
    
    switch (stepNum) {
      case 1:
        return !!(formData.step1?.companyName || lead.societe);
      case 2:
        return !!(formData.step2?.firstName || formData.step2?.email || lead.email);
      case 3:
        return !!formData.step3?.energyExpenses || !!lead.consommation_annuelle;
      case 4:
        return !!formData.step4?.buildingCount || (formData.buildings && formData.buildings.length > 0);
      case 5:
        return !!(formData.buildings && formData.buildings.length > 0 && formData.buildings[0]?.type);
      case 6:
        return !!formData.step6?.remarks || !!lead.message;
      default:
        return false;
    }
  };

  // Fonction pour marquer le formulaire comme complété
  const handleComplete = async () => {
    if (onComplete) {
      const result = await onComplete();
      if (result?.success) {
        toast({
          title: 'Formulaire complété',
          description: 'Le formulaire a été marqué comme complété.',
        });
      }
    }
  };

  // Afficher les données d'une étape
  const renderStepData = (stepNum) => {
    if (stepNum === 0) {
      // Mini-form data
      return (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Nom:</span>
            <span className="ml-2 font-medium">{lead.nom || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>
            <span className="ml-2 font-medium">{lead.email || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Téléphone:</span>
            <span className="ml-2 font-medium">{lead.telephone || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Type bâtiment:</span>
            <span className="ml-2 font-medium">{lead.type_batiment || '-'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Surface:</span>
            <span className="ml-2 font-medium">{lead.surface_m2 ? `${lead.surface_m2} m²` : '-'}</span>
          </div>
        </div>
      );
    }

    if (!formData) return <p className="text-sm text-gray-500">Aucune donnée collectée</p>;

    switch (stepNum) {
      case 1:
        const step1 = formData.step1 || {};
        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Nom entreprise:</span>
              <span className="ml-2 font-medium">{step1.companyName || lead.societe || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">SIRET:</span>
              <span className="ml-2 font-medium">{step1.siret || lead.siret || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Adresse:</span>
              <span className="ml-2 font-medium">{step1.address || lead.adresse?.split(',')[0] || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Code postal:</span>
              <span className="ml-2 font-medium">{step1.postalCode || lead.code_postal || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Ville:</span>
              <span className="ml-2 font-medium">{step1.city || lead.ville || '-'}</span>
            </div>
          </div>
        );
      
      case 2:
        const step2 = formData.step2 || {};
        const fullName = lead.nom ? lead.nom.split(' ') : [];
        const firstName = step2.firstName || (fullName.length > 1 ? fullName.slice(0, -1).join(' ') : '');
        const lastName = step2.lastName || (fullName.length > 0 ? fullName[fullName.length - 1] : '');
        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Civilité:</span>
              <span className="ml-2 font-medium">{step2.civility || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Prénom:</span>
              <span className="ml-2 font-medium">{firstName || lead.prenom || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Nom:</span>
              <span className="ml-2 font-medium">{lastName || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Poste:</span>
              <span className="ml-2 font-medium">{step2.position || lead.poste || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Téléphone:</span>
              <span className="ml-2 font-medium">{step2.phone || lead.telephone || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium">{step2.email || lead.email || '-'}</span>
            </div>
          </div>
        );
      
      case 3:
        const step3 = formData.step3 || {};
        const expenseLabels = {
          'less-10k': 'Moins de 10 000 €',
          '10k-50k': '10 000 € à 50 000 €',
          '50k-100k': '50 000 € à 100 000 €',
          '100k-500k': '100 000 € à 500 000 €',
          'more-500k': 'Plus de 500 000 €'
        };
        return (
          <div className="text-sm">
            <span className="text-gray-500">Tranche de dépenses:</span>
            <span className="ml-2 font-medium">
              {expenseLabels[step3.energyExpenses] || lead.consommation_annuelle || '-'}
            </span>
          </div>
        );
      
      case 4:
        const step4 = formData.step4 || {};
        const buildingCount = step4.buildingCount || (formData.buildings?.length || 0);
        return (
          <div className="text-sm">
            <span className="text-gray-500">Nombre de bâtiments:</span>
            <span className="ml-2 font-medium">{buildingCount > 0 ? `${buildingCount} bâtiment(s)` : '-'}</span>
          </div>
        );
      
      case 5:
        const buildings = formData.buildings || [];
        if (buildings.length === 0) {
          return <p className="text-sm text-gray-500">Aucun bâtiment renseigné</p>;
        }
        return (
          <div className="space-y-3">
            {buildings.map((building, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded border text-sm">
                <div className="font-medium mb-2">Bâtiment {idx + 1}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Type:</span> <span className="ml-1 font-medium">{building.type || '-'}</span></div>
                  <div><span className="text-gray-500">Surface:</span> <span className="ml-1 font-medium">{building.surface ? `${building.surface} m²` : '-'}</span></div>
                  <div><span className="text-gray-500">Hauteur:</span> <span className="ml-1 font-medium">{building.ceilingHeight ? `${building.ceilingHeight} m` : '-'}</span></div>
                  <div><span className="text-gray-500">Chauffé:</span> <span className="ml-1 font-medium">{building.heating ? 'Oui' : 'Non'}</span></div>
                  {building.heating && (
                    <>
                      <div><span className="text-gray-500">Mode:</span> <span className="ml-1 font-medium">{building.heatingMode || '-'}</span></div>
                      <div><span className="text-gray-500">Puissance:</span> <span className="ml-1 font-medium">{building.heatingPower ? `${building.heatingPower} kW` : '-'}</span></div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      
      case 6:
        const step6 = formData.step6 || {};
        return (
          <div className="text-sm">
            <span className="text-gray-500">Remarques:</span>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap">{step6.remarks || lead.message || '-'}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Accordion type="single" collapsible defaultValue="form-progress" className="w-full">
        <AccordionItem value="form-progress">
          <AccordionTrigger className="text-lg font-semibold text-gray-900">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <span>Parcours Formulaire</span>
              {lead.formulaire_complet ? (
                <Badge className="bg-green-100 text-green-800 border-green-300">Complet</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Incomplet - Étape {currentStep}/6
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progression</span>
                    <span className="text-sm text-gray-500">{Math.round((currentStep / 6) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-secondary-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentStep / 6) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Bouton Marquer comme complété */}
                {!lead.formulaire_complet && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleComplete}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marquer comme complété
                    </Button>
                  </div>
                )}

                {/* Steps List */}
                <div className="space-y-4">
                  {steps.map((step) => {
                    const completed = isStepCompleted(step.num);
                    const isCurrent = currentStep === step.num;
                    const Icon = step.icon;
                    
                    return (
                      <div
                        key={step.num}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all",
                          completed ? "bg-green-50 border-green-200" :
                          isCurrent ? "bg-yellow-50 border-yellow-200" :
                          "bg-gray-50 border-gray-200"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : isCurrent ? (
                            <Circle className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{step.label}</span>
                            {completed && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                Complété
                              </Badge>
                            )}
                            {isCurrent && !completed && (
                              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                En cours
                              </Badge>
                            )}
                          </div>
                          {completed && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              {renderStepData(step.num)}
                            </div>
                          )}
                          {isCurrent && !completed && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-2 text-sm text-yellow-700">
                                <AlertCircle className="h-4 w-4" />
                                <span>Étape en cours - Données partielles</span>
                              </div>
                              {renderStepData(step.num)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CEE Potential if available */}
                {formData?.ceePotential && (
                  <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Potentiel CEE Estimé</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 font-bold text-secondary-600">
                          {formData.ceePotential.totalPotential?.toLocaleString('fr-FR') || 0} €
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Classification:</span>
                        <span className="ml-2 font-medium">
                          {formData.ceePotential.classification === 'high' && '🔥 Élevé'}
                          {formData.ceePotential.classification === 'medium' && '⚡ Moyen'}
                          {formData.ceePotential.classification === 'low' && '💡 Faible'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default FormProgressSection;

