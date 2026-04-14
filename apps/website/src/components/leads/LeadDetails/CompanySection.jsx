import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building, MapPin, Globe, Edit, Save, X, ExternalLink, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getMissingFields } from '@/lib/utils/formDataParser';
import { cn } from '@/lib/utils';
import { fetchCompanyBySiren, mapSireneToLead } from '@/lib/api/sirene';

/**
 * Section Société avec accordéon, validation SIRET et lien site web
 */
const CompanySection = ({ lead, onUpdate, autoSave }) => {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  // State local pour adresse_siege avec mode édition
  const [isEditingAdresseSiege, setIsEditingAdresseSiege] = useState(false);
  const [adresseSiegeValue, setAdresseSiegeValue] = useState('');
  // State pour le chargement des données Sirene
  const [loadingSirene, setLoadingSirene] = useState(false);

  // Détecter les champs manquants
  const missingCompanyFields = React.useMemo(() => {
    return getMissingFields(lead, 1); // Step 1 = Company
  }, [lead]);

  // Synchroniser adresseSiegeValue avec lead.adresse_siege quand le lead change (seulement si pas en édition)
  React.useEffect(() => {
    if (!isEditingAdresseSiege && lead?.adresse_siege !== undefined) {
      setAdresseSiegeValue(lead.adresse_siege || lead.adresse || '');
    }
  }, [lead?.adresse_siege, lead?.adresse, isEditingAdresseSiege]);

  // Handler pour démarrer l'édition de adresse_siege
  const handleStartEditAdresseSiege = () => {
    setAdresseSiegeValue(lead?.adresse_siege || lead?.adresse || '');
    setIsEditingAdresseSiege(true);
  };

  // Handler pour sauvegarder adresse_siege
  const handleSaveAdresseSiege = () => {
    autoSave?.('adresse_siege', adresseSiegeValue);
    setIsEditingAdresseSiege(false);
  };

  // Handler pour annuler l'édition de adresse_siege
  const handleCancelAdresseSiege = () => {
    setAdresseSiegeValue(lead?.adresse_siege || lead?.adresse || '');
    setIsEditingAdresseSiege(false);
  };

  const handleStartEdit = (field, value) => {
    setEditingField(field);
    setEditingValue(value || '');
  };

  const handleSave = () => {
    if (editingField) {
      autoSave?.(editingField, editingValue);
      setEditingField(null);
      setEditingValue('');
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditingValue('');
  };

  // Validate SIRET (14 digits)
  const isValidSIRET = (siret) => {
    if (!siret) return false;
    const cleaned = siret.replace(/\s/g, '');
    if (cleaned.length !== 14) return false;
    return /^\d{14}$/.test(cleaned);
  };

  // Format SIRET
  const formatSIRET = (siret) => {
    if (!siret) return '';
    const cleaned = siret.replace(/\s/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 14)}`;
    }
    return cleaned;
  };

  // Validate URL
  const isValidURL = (url) => {
    if (!url) return false;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  // Format URL
  const formatURL = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Handler pour récupérer les données depuis l'API Sirene
  const handleFetchFromSirene = async () => {
    // Récupérer le SIREN depuis le lead (priorité au champ siren, sinon extraire du siret)
    const sirenValue = lead?.siren || (lead?.siret && lead.siret.replace(/\s/g, '').length >= 9 ? lead.siret.replace(/\s/g, '').slice(0, 9) : '');
    
    // Valider le SIREN
    if (!sirenValue || sirenValue.replace(/\s/g, '').length !== 9) {
      toast({ 
        variant: 'destructive',
        title: 'SIREN invalide',
        description: 'Veuillez saisir un SIREN valide (9 chiffres) avant de récupérer les données.'
      });
      return;
    }

    setLoadingSirene(true);
    try {
      const cleanSiren = sirenValue.replace(/\s/g, '');
      const result = await fetchCompanyBySiren(cleanSiren);
      
      if (result.success && result.data) {
        // Mapper les données Sirene vers les champs du lead
        // result.data contient { siren, denomination, denominationUsuelle, uniteLegale, etablissementSiege }
        const updates = mapSireneToLead(result.data);
        
        // Sauvegarder toutes les mises à jour en une seule fois
        autoSave?.(updates);
        
        const companyName = result.data.denomination || result.data.denominationUsuelle || 'l\'entreprise';
        toast({
          title: 'Données récupérées avec succès',
          description: `Les informations de ${companyName} ont été récupérées et préremplies depuis le répertoire Sirene (INSEE).`
        });
      } else {
        throw new Error(result.error || 'Entreprise non trouvée');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de récupérer les données depuis l\'API Sirene. Veuillez réessayer.'
      });
    } finally {
      setLoadingSirene(false);
    }
  };

  const EditableField = ({ field, label, value, icon: Icon, validator, formatter, type = 'text', rows, realValue, className = '' }) => {
    const isEditing = editingField === field;
    const isValid = validator ? validator(value) : true;
    const displayValue = formatter ? formatter(value) : value;
    const textareaRef = useRef(null);
    
    // No special CSS manipulation - let the browser handle it naturally
    
    // Check the REAL field value (not fallback) to determine if it's missing
    // realValue is the actual field value, value might be a fallback
    const actualFieldValue = realValue !== undefined ? realValue : lead[field];
    
    // Check if field is missing - check if REAL value is actually empty/null/undefined/'-'
    let isEmpty = !actualFieldValue || actualFieldValue === '-' || (typeof actualFieldValue === 'string' && actualFieldValue.trim() === '');
    
    // Special handling: SIREN - check if it can be derived from SIRET
    if (field === 'siren') {
      const hasDirectSiren = lead.siren && lead.siren.trim() !== '';
      const canDeriveFromSiret = lead.siret && lead.siret.replace(/\s/g, '').length >= 9;
      isEmpty = !hasDirectSiren && !canDeriveFromSiret;
    }
    
    // Check if field is in missing list OR if it's empty
    const isMissing = missingCompanyFields.includes(field) || isEmpty;

    return (
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
          {isMissing && (
            <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
              À compléter
            </Badge>
          )}
        </label>
        {isEditing ? (
          <div className="flex gap-2">
            {type === 'textarea' ? (
              <div>
                <Textarea
                  ref={(el) => {
                    textareaRef.current = el;
                  }}
                  value={editingValue}
                  onChange={(e) => {
                    setEditingValue(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancel();
                  }}
                  rows={rows || 2}
                  dir="ltr"
                  lang="fr"
                  data-field={field}
                  className={cn(
                    'w-full',
                    !isValid && 'border-red-300 focus:ring-red-500',
                    className
                  )}
                  autoFocus
                />
                <div className="flex gap-1 mt-2">
                  <Button size="sm" onClick={handleSave} disabled={validator && !validator(editingValue)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Input
                  type={type}
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className={cn(
                    !isValid && 'border-red-300 focus:ring-red-500'
                  )}
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSave} disabled={validator && !validator(editingValue)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors group flex items-center justify-between",
              !value && 'text-gray-400'
            )}
            onDoubleClick={() => handleStartEdit(field, value)}
            title="Double-clic pour éditer"
          >
            <span 
              dir="ltr"
              lang="fr"
              className={cn(
                'text-left whitespace-pre-wrap block',
                className
              )}
            >
              {displayValue || '-'}
            </span>
            <div className="flex items-center gap-2">
              {validator && value && (
                validator(value) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )
              )}
              {field === 'site_web' && value && isValidURL(value) && (
                <a
                  href={formatURL(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-500 hover:text-sky-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Accordion type="single" collapsible defaultValue="company" className="w-full">
        <AccordionItem value="company">
          <AccordionTrigger className="text-lg font-semibold text-gray-900">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Société
              {missingCompanyFields.length > 0 && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {missingCompanyFields.length} champ(s) à compléter
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Section Entreprise */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Building className="h-5 w-5 text-gray-600" />
                      <h3 className="text-base font-semibold text-gray-900">Entreprise</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <EditableField
                          field="societe"
                          label="Raison sociale"
                          value={lead.societe}
                          icon={Building}
                        />
                      </div>
                      <EditableField
                        field="siret"
                        label="SIRET"
                        value={lead.siret}
                        icon={Building}
                        validator={isValidSIRET}
                        formatter={formatSIRET}
                      />
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <EditableField
                            field="siren"
                            label="SIREN"
                            value={lead.siren || (lead.siret && lead.siret.length >= 9 ? lead.siret.slice(0, 9) : '')}
                            icon={Building}
                            validator={(val) => !val || /^\d{9}$/.test(val.replace(/\s/g, ''))}
                            formatter={(val) => {
                              if (!val) return '';
                              const cleaned = val.replace(/\s/g, '');
                              if (cleaned.length === 9) {
                                return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
                              }
                              return cleaned;
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFetchFromSirene}
                          disabled={loadingSirene || (!lead?.siren && (!lead?.siret || lead.siret.replace(/\s/g, '').length < 9))}
                          className="mt-7"
                          title="Récupérer les données de l'entreprise depuis le répertoire Sirene (INSEE)"
                        >
                          {loadingSirene ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Récupérer
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="md:col-span-2">
                        <EditableField
                          field="site_web"
                          label="Site web"
                          value={lead.site_web}
                          icon={Globe}
                          validator={isValidURL}
                          formatter={(val) => {
                            if (!val) return '';
                            if (val.startsWith('http://') || val.startsWith('https://')) {
                              return val;
                            }
                            return `https://${val}`;
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200" />

                  {/* Section Adresse du siège */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      <h3 className="text-base font-semibold text-gray-900">Adresse du siège</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Adresse du siège
                          {(!lead.adresse_siege || lead.adresse_siege.trim() === '') && (
                            <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                              À compléter
                            </Badge>
                          )}
                        </label>
                        {isEditingAdresseSiege ? (
                          <div>
                            <Textarea
                              value={adresseSiegeValue}
                              onChange={(e) => {
                                setAdresseSiegeValue(e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') handleCancelAdresseSiege();
                              }}
                              rows={2}
                              dir="ltr"
                              lang="fr"
                              className="w-full"
                              placeholder="Ex: 123 Avenue de Paris"
                              autoFocus
                            />
                            <div className="flex gap-1 mt-2">
                              <Button size="sm" onClick={handleSaveAdresseSiege}>
                                <Save className="h-4 w-4 mr-1" />
                                Enregistrer
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelAdresseSiege}>
                                <X className="h-4 w-4 mr-1" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors group flex items-center justify-between"
                            onDoubleClick={handleStartEditAdresseSiege}
                            title="Double-clic pour éditer"
                          >
                            <span
                              dir="ltr"
                              lang="fr"
                              className="text-left whitespace-pre-wrap block"
                            >
                              {lead?.adresse_siege || lead?.adresse || '-'}
                            </span>
                            <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <EditableField
                        field="ville_siege"
                        label="Ville siège"
                        value={lead.ville_siege || lead.ville || ''}
                        realValue={lead.ville_siege}
                        icon={MapPin}
                      />
                      <EditableField
                        field="code_postal_siege"
                        label="Code Postal Siège"
                        value={lead.code_postal_siege || lead.code_postal || ''}
                        realValue={lead.code_postal_siege}
                        icon={MapPin}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default CompanySection;

