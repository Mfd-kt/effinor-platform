import React, { useState, useMemo } from 'react';
import { Wrench, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

/**
 * Section Projet & Technique - Type de projet avec sélection multiple
 */
const ProjectSection = ({ lead, onUpdate, autoSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(() => {
    // Parse type_projet - peut être un array, une string, ou une string séparée par des virgules
    if (!lead?.type_projet) return [];
    
    if (Array.isArray(lead.type_projet)) {
      return lead.type_projet;
    }
    
    if (typeof lead.type_projet === 'string') {
      // Si c'est une string avec des virgules, split
      if (lead.type_projet.includes(',')) {
        return lead.type_projet.split(',').map(t => t.trim()).filter(Boolean);
      }
      // Sinon, c'est une seule valeur
      return [lead.type_projet].filter(Boolean);
    }
    
    return [];
  });

  const projectTypes = [
    'LED Éclairage',
    'Destratification',
    'Déshumidificateur',
    'Pompe à Chaleur',
    'Climatisation',
    'Isolation',
    'Autre'
  ];

  const handleToggle = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSave = () => {
    // Sauvegarder comme array JSON ou string séparée par virgules
    const valueToSave = selectedTypes.length > 0 
      ? (Array.isArray(selectedTypes) ? selectedTypes : selectedTypes) 
      : null;
    
    // Convertir en string pour compatibilité si la colonne DB est TEXT
    // Ou garder comme array si c'est JSONB
    autoSave?.('type_projet', selectedTypes.length > 0 ? selectedTypes.join(', ') : null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Restaurer les valeurs initiales
    const initialValue = lead?.type_projet;
    if (Array.isArray(initialValue)) {
      setSelectedTypes(initialValue);
    } else if (typeof initialValue === 'string') {
      setSelectedTypes(initialValue.includes(',') 
        ? initialValue.split(',').map(t => t.trim()).filter(Boolean)
        : [initialValue].filter(Boolean)
      );
    } else {
      setSelectedTypes([]);
    }
    setIsEditing(false);
  };

  const displayValue = useMemo(() => {
    if (selectedTypes.length === 0) return null;
    return selectedTypes.join(', ');
  }, [selectedTypes]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Type de projet
          {!displayValue && (
            <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700 border-yellow-200 text-xs font-normal">
              À compléter
            </Badge>
          )}
        </Label>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border">
              {projectTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200 hover:border-secondary-300 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => handleToggle(type)}
                  />
                  <span className="text-sm font-medium text-gray-900">{type}</span>
                </label>
              ))}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-sm text-gray-500 italic text-center py-2">
                Aucun type de projet sélectionné
              </p>
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
            className="flex items-center justify-between p-3 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 group"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-clic pour éditer"
          >
            {displayValue ? (
              <div className="flex flex-wrap gap-2 flex-1">
                {selectedTypes.map((type) => (
                  <Badge key={type} variant="outline" className="bg-white">
                    {type}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">Non renseigné</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Modifier
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSection;
