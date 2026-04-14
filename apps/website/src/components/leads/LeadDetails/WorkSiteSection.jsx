import React, { useState } from 'react';
import { MapPin, Edit, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Section Site des travaux - Adresse du lieu de réalisation des travaux
 */
const WorkSiteSection = ({ lead, onUpdate, autoSave }) => {
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const handleStartEdit = (field, value) => {
    setEditingField(field);
    setEditingValue(value || '');
  };

  const handleSave = () => {
    if (editingField) {
      // Le calcul de la région et zone climatique est fait automatiquement par un trigger SQL
      // On envoie uniquement le code postal, la base de données calcule le reste
      autoSave?.(editingField, editingValue);
      setEditingField(null);
      setEditingValue('');
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditingValue('');
  };

  // Structure exacte selon les images fournies
  const fields = [
    {
      key: 'raison_sociale_travaux',
      label: 'Raison social',
      value: lead.raison_sociale_travaux || lead.societe || '',
      type: 'text',
      placeholder: 'Ex: LA BARDO'
    },
    {
      key: 'adresse_travaux',
      label: 'Adresse des travaux',
      value: lead.adresse_travaux || lead.adresse || '',
      type: 'textarea',
      placeholder: 'Ex: 64 impasse du hibou'
    },
    {
      key: 'ville_travaux',
      label: 'Ville travaux',
      value: lead.ville_travaux || lead.ville || '',
      type: 'text',
      placeholder: 'Ex: SAINT-MARD'
    },
    {
      key: 'code_postal_travaux',
      label: 'Code postale travaux',
      value: lead.code_postal_travaux || lead.code_postal || '',
      type: 'text',
      placeholder: 'Ex: 17700'
    },
    {
      key: 'siret_site_travaux',
      label: 'SIRET DU SITE DES TRAVAUX',
      value: lead.siret_site_travaux || lead.siret || '',
      type: 'text',
      placeholder: 'Ex: 83944432000023'
    },
    {
      key: 'region',
      label: 'Region',
      value: lead.region || '',
      type: 'text',
      placeholder: 'Ex: Nouvelle-Aquitaine',
      readonly: true // Calculé automatiquement à partir du code postal
    },
    {
      key: 'zone_climatique',
      label: 'Zone climatique',
      value: lead.zone_climatique || '',
      type: 'text',
      placeholder: 'Ex: H2',
      readonly: true // Calculé automatiquement
    },
    {
      key: 'parcelle_cadastrale_travaux',
      label: 'Parcelle cadastrale travaux',
      value: lead.parcelle_cadastrale_travaux || '',
      type: 'text',
      placeholder: 'Ex: 12345678901234A'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div 
            key={field.key} 
            className={field.type === 'textarea' || field.label === 'SIRET DU SITE DES TRAVAUX' ? 'md:col-span-2' : ''}
          >
            <Label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-2">
              {field.label}
              {!field.readonly && !field.value && (
                <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-normal">
                  À compléter
                </Badge>
              )}
            </Label>
            {field.readonly ? (
              // Champs en lecture seule (région, zone climatique - calculés automatiquement)
              <div className="p-2 bg-gray-50 rounded border text-sm text-gray-900">
                {field.value || (
                  <span className="text-gray-400 italic">Non renseigné</span>
                )}
              </div>
            ) : editingField === field.key ? (
              <div className="space-y-2">
                {field.type === 'textarea' ? (
                  <Textarea
                    ref={(el) => {
                      // Force LTR immediately on ref assignment
                      if (el) {
                        el.setAttribute('dir', 'ltr');
                        el.setAttribute('lang', 'fr');
                        el.setAttribute('data-field', field.key);
                      // Use plaintext for unicode-bidi to prevent any bidirectional text interpretation
                      el.style.setProperty('direction', 'ltr', 'important');
                      el.style.setProperty('text-align', 'left', 'important');
                      el.style.setProperty('unicode-bidi', 'plaintext', 'important');
                      el.style.setProperty('writing-mode', 'horizontal-tb', 'important');
                      el.style.setProperty('text-orientation', 'mixed', 'important');
                      }
                    }}
                    value={editingValue}
                    onChange={(e) => {
                      setEditingValue(e.target.value);
                      // Force direction after change
                      const textarea = e.target;
                      textarea.setAttribute('dir', 'ltr');
                      textarea.style.setProperty('direction', 'ltr', 'important');
                      textarea.style.setProperty('text-align', 'left', 'important');
                      // Pour adresse_travaux, utiliser bidi-override pour forcer l'ordre des caractères
                      if (field.key === 'adresse_travaux' || field.key === 'adresse_siege') {
                        textarea.style.setProperty('unicode-bidi', 'bidi-override', 'important');
                      } else {
                        textarea.style.setProperty('unicode-bidi', 'plaintext', 'important');
                      }
                    }}
                    onFocus={(e) => {
                      // Force direction on focus
                      const textarea = e.target;
                      textarea.setAttribute('dir', 'ltr');
                      textarea.style.setProperty('direction', 'ltr', 'important');
                      textarea.style.setProperty('text-align', 'left', 'important');
                      if (field.key === 'adresse_travaux' || field.key === 'adresse_siege') {
                        textarea.style.setProperty('unicode-bidi', 'bidi-override', 'important');
                      } else {
                        textarea.style.setProperty('unicode-bidi', 'plaintext', 'important');
                      }
                    }}
                    placeholder={field.placeholder}
                    rows={3}
                    dir="ltr"
                    lang="fr"
                    data-field={field.key}
                    className="w-full force-ltr text-left"
                    style={{ 
                      direction: 'ltr', 
                      textAlign: 'left', 
                      unicodeBidi: (field.key === 'adresse_travaux' || field.key === 'adresse_siege') ? 'bidi-override' : 'plaintext',
                      textOrientation: 'mixed' 
                    }}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && field.type !== 'textarea') {
                        handleSave();
                      }
                      if (e.key === 'Escape') {
                        handleCancel();
                      }
                    }}
                  />
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center justify-between p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 group"
                onDoubleClick={() => !field.readonly && handleStartEdit(field.key, field.value)}
                title={field.readonly ? 'Calculé automatiquement' : 'Double-clic pour éditer'}
              >
                <span 
                  dir="ltr"
                  lang="fr"
                  className={cn(
                    "text-sm text-gray-900 flex-1 font-semibold force-ltr",
                    field.type === 'textarea' && 'text-left whitespace-pre-wrap'
                  )}
                  style={field.type === 'textarea' ? { 
                    direction: 'ltr', 
                    textAlign: 'left',
                    unicodeBidi: (field.key === 'adresse_travaux' || field.key === 'adresse_siege') ? 'bidi-override' : 'plaintext',
                    writingMode: 'horizontal-tb',
                    textOrientation: 'mixed'
                  } : {}}
                >
                  {field.value || (
                    <span className="text-gray-400 italic font-normal">Non renseigné</span>
                  )}
                </span>
                {!field.readonly && (
                  <Edit className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkSiteSection;

