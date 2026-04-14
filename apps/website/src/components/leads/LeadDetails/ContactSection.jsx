import React, { useState } from 'react';
import { User, Mail, Phone, Briefcase, Globe, Edit, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMissingFields } from '@/lib/utils/formDataParser';
import { cn } from '@/lib/utils';

/**
 * Section Contact & Entreprise - Design épuré et organisé
 */
const ContactSection = ({ lead, onUpdate, autoSave }) => {
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Détecter les champs manquants
  const missingContactFields = React.useMemo(() => {
    return getMissingFields(lead, 2); // Step 2 = Contact
  }, [lead]);

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

  // Validate email
  const isValidEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate phone (French format)
  const isValidPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\s/g, '');
    return /^(\+33|0)[1-9](\d{2}){4}$/.test(cleaned);
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

  const EditableField = ({ field, label, value, icon: Icon, validator, transform, type = 'text', options }) => {
    const isEditing = editingField === field;
    const isValid = validator ? validator(value) : true;
    // Check if field is missing - check if value is actually empty/null/undefined
    const isEmpty = !value || value === '-' || (typeof value === 'string' && value.trim() === '');
    const isMissing = missingContactFields.includes(field) || isEmpty;

    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          {label}
          {isMissing && (
            <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-normal">
              À compléter
            </Badge>
          )}
        </label>
        {isEditing ? (
          <div className="space-y-2">
            {type === 'select' && options ? (
              <Select
                value={editingValue || ''}
                onValueChange={(val) => setEditingValue(val)}
              >
                <SelectTrigger className={cn(
                  'h-10',
                  !isValid && 'border-red-300 focus:ring-red-500'
                )}>
                  <SelectValue placeholder={`Sélectionner ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={type}
                value={editingValue}
                onChange={(e) => setEditingValue(transform ? transform(e.target.value) : e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                className={cn(
                  'h-10',
                  !isValid && 'border-red-300 focus:ring-red-500'
                )}
                autoFocus
              />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!isValid} className="h-8">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "h-10 px-3 flex items-center justify-between rounded-md border bg-white cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all group",
              !value && 'text-gray-400 border-dashed'
            )}
            onDoubleClick={() => handleStartEdit(field, value)}
            title="Double-clic pour éditer"
          >
            <span className="text-sm font-medium text-gray-900 truncate flex-1">
              {field === 'civilite' && value 
                ? (value === 'Mr' ? 'Monsieur' : value === 'Mme' ? 'Madame' : value)
                : value || 'Non renseigné'}
            </span>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              {validator && value && (
                validator(value) ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )
              )}
              {field === 'site_web' && value && isValidURL(value) && (
                <a
                  href={value.startsWith('http') ? value : `https://${value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sky-500 hover:text-sky-600"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              <Edit className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditableField
          field="civilite"
          label="Civilité"
          value={lead.civilite || ''}
          icon={User}
          type="select"
          options={[
            { value: 'Mr', label: 'Monsieur' },
            { value: 'Mme', label: 'Madame' }
          ]}
        />
        <EditableField
          field="prenom"
          label="Prénom"
          value={lead.prenom}
          icon={User}
        />
        <EditableField
          field="nom"
          label="Nom"
          value={lead.nom}
          icon={User}
        />
        <EditableField
          field="email"
          label="Email"
          value={lead.email}
          icon={Mail}
          validator={isValidEmail}
        />
        <EditableField
          field="telephone"
          label="Téléphone"
          value={lead.telephone}
          icon={Phone}
          validator={isValidPhone}
          transform={(val) => val.replace(/\D/g, '')}
        />
        <div className="md:col-span-2">
          <EditableField
            field="poste"
            label="Poste"
            value={lead.poste}
            icon={Briefcase}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
