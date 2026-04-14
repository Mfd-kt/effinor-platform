import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Thermometer, Lightbulb, Edit, Save, X, Plus, Trash2, Sun, Zap, FileText } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Section affichant les détails techniques des bâtiments depuis JSONB
 */
const BuildingsSection = ({ lead, onUpdate, autoSave, saveImmediately }) => {
  // Fonction helper pour parser les bâtiments depuis lead
  const parseBuildingsFromLead = (leadData) => {
    try {
      // Essayer formulaire_data d'abord
      if (leadData.formulaire_data) {
        const formData = typeof leadData.formulaire_data === 'string' 
          ? JSON.parse(leadData.formulaire_data) 
          : leadData.formulaire_data;
        if (formData.buildings && Array.isArray(formData.buildings) && formData.buildings.length > 0) {
          return formData.buildings;
        }
      }
      
      // Sinon essayer products
      if (leadData.products) {
        const products = typeof leadData.products === 'string' 
          ? JSON.parse(leadData.products) 
          : leadData.products;
        if (products.buildings && Array.isArray(products.buildings) && products.buildings.length > 0) {
          return products.buildings;
        }
      }
      
      // Si pas de données mais qu'il y a type_batiment et surface, créer un bâtiment
      // Mapper le type de bâtiment vers le format interne
      if (leadData.type_batiment || leadData.surface_m2) {
        const buildingTypeMap = {
          'Bureau': 'offices',
          'Commerce': 'retail',
          'Industrie': 'factory',
          'Entrepôt': 'warehouse',
          'Autre': 'other'
        };
        const typeText = leadData.type_batiment || '';
        const mappedType = buildingTypeMap[typeText] || 'warehouse';
        
        return [{
          type: mappedType,
          surface: leadData.surface_m2 || '',
          ceilingHeight: leadData.hauteur_plafond || '',
          heating: false,
          heatingMode: leadData.mode_chauffage || '',
          heatingPower: leadData.puissance_electrique || '',
          interiorLighting: {},
          exteriorLighting: {
            changedByCEE: false,
            type: '',
            quantity: ''
          }
        }];
      }
      
      return [];
    } catch (e) {
      console.error('Error parsing buildings data:', e);
      return [];
    }
  };

  // Parser formulaire_data ou products pour extraire les bâtiments
  const [buildings, setBuildings] = useState(() => parseBuildingsFromLead(lead));

  // Synchroniser buildings avec lead.formulaire_data quand le lead change
  React.useEffect(() => {
    const parsedBuildings = parseBuildingsFromLead(lead);
    // Ne mettre à jour que si les bâtiments ont réellement changé (pour éviter les boucles)
    const currentBuildingsStr = JSON.stringify(buildings);
    const parsedBuildingsStr = JSON.stringify(parsedBuildings);
    if (currentBuildingsStr !== parsedBuildingsStr) {
      setBuildings(parsedBuildings);
      // Réinitialiser l'édition si le building en cours d'édition n'existe plus
      if (editingIndex !== null && editingIndex >= parsedBuildings.length) {
        setEditingIndex(null);
        setEditingBuilding(null);
      }
    }
  }, [lead?.formulaire_data, lead?.products, lead?.type_batiment, lead?.surface_m2]);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(null);
  
  // State pour Notes techniques et Consommation annuelle
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesTechniques, setNotesTechniques] = useState(lead?.notes_techniques || '');
  const [isEditingConsommation, setIsEditingConsommation] = useState(false);
  const [consommationAnnuelle, setConsommationAnnuelle] = useState(lead?.consommation_annuelle || '');

  // Synchroniser notes et consommation avec lead
  React.useEffect(() => {
    if (!isEditingNotes) {
      setNotesTechniques(lead?.notes_techniques || '');
    }
    if (!isEditingConsommation) {
      setConsommationAnnuelle(lead?.consommation_annuelle || '');
    }
  }, [lead?.notes_techniques, lead?.consommation_annuelle, isEditingNotes, isEditingConsommation]);

  const buildingTypes = [
    { value: 'warehouse', label: 'Entrepôt' },
    { value: 'factory', label: 'Usine' },
    { value: 'offices', label: 'Bureaux' },
    { value: 'retail', label: 'Commerce' },
    { value: 'other', label: 'Autre' }
  ];

  const heatingModes = [
    { value: 'gas', label: 'Gaz' },
    { value: 'electric', label: 'Électrique' },
    { value: 'fuel', label: 'Fioul' },
    { value: 'other', label: 'Autre' }
  ];

  const lightingTypes = [
    { id: 'neon', label: 'Néon' },
    { id: 'doubleNeon', label: 'Double néon' },
    { id: 'halogen', label: 'Halogène' },
  ];

  const handleEdit = (index) => {
    const buildingToEdit = {
      ...buildings[index],
      // S'assurer que exteriorLighting existe
      exteriorLighting: buildings[index].exteriorLighting || {
        changedByCEE: false,
        type: '',
        quantity: ''
      },
      // S'assurer que interiorLighting existe
      interiorLighting: buildings[index].interiorLighting || {}
    };
    setEditingIndex(index);
    setEditingBuilding(buildingToEdit);
  };

  const handleSave = async (index) => {
    const updatedBuildings = [...buildings];
    updatedBuildings[index] = { ...editingBuilding };
    setBuildings(updatedBuildings);
    
    // Sauvegarder dans formulaire_data
    try {
      const currentFormData = lead.formulaire_data 
        ? (typeof lead.formulaire_data === 'string' ? JSON.parse(lead.formulaire_data) : lead.formulaire_data)
        : {};
      
      const updatedFormData = {
        ...currentFormData,
        buildings: updatedBuildings,
        step4: { ...currentFormData.step4, buildingCount: updatedBuildings.length }
      };
      
      // Mapper aussi vers les colonnes principales
      const totalSurface = updatedBuildings.reduce((sum, b) => sum + (parseFloat(b.surface) || 0), 0);
      const buildingTypesStr = updatedBuildings.map(b => b.type).filter(Boolean).join(', ');
      
      // Supabase accepte directement les objets JavaScript pour les colonnes JSONB
      // Pas besoin de JSON.stringify() - Supabase le convertira automatiquement
      const updates = {
        formulaire_data: updatedFormData, // Passer l'objet directement
      };
      
      if (totalSurface > 0) {
        updates.surface_m2 = totalSurface;
      }
      if (buildingTypesStr) {
        updates.type_batiment = buildingTypesStr;
      }
      
      // Utiliser saveImmediately pour sauvegarder immédiatement (sans debounce)
      if (saveImmediately) {
        await saveImmediately(updates);
      } else if (autoSave) {
        // Si pas de saveImmediately, utiliser autoSave avec l'objet complet
        await autoSave(updates);
      }
      
      setEditingIndex(null);
      setEditingBuilding(null);
      
      // Afficher un message de succès et mettre à jour le lead
      if (onUpdate) {
        onUpdate({ ...lead, formulaire_data: updatedFormData });
      }
      
      console.log('✅ Bâtiment sauvegardé avec succès:', {
        buildingIndex: index,
        building: updatedBuildings[index],
        totalBuildings: updatedBuildings.length
      });
    } catch (error) {
      console.error('Error saving building:', error);
      // Afficher une erreur à l'utilisateur
      alert('Erreur lors de la sauvegarde du bâtiment. Veuillez réessayer.');
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditingBuilding(null);
  };

  const handleAddBuilding = async () => {
    const newBuilding = {
      type: 'warehouse',
      surface: '',
      ceilingHeight: '',
      heating: false,
      heatingMode: '',
      heatingPower: '',
      heatingSetpoint: '',
      interiorLighting: {},
      exteriorLighting: {
        changedByCEE: false,
        type: '',
        quantity: ''
      }
    };
    
    const updatedBuildings = [...buildings, newBuilding];
    setBuildings(updatedBuildings);
    setEditingIndex(updatedBuildings.length - 1);
    setEditingBuilding(newBuilding);
    
    // Sauvegarder immédiatement dans formulaire_data
    try {
      const currentFormData = lead?.formulaire_data 
        ? (typeof lead.formulaire_data === 'string' ? JSON.parse(lead.formulaire_data) : lead.formulaire_data)
        : {};
      
      const updatedFormData = {
        ...currentFormData,
        buildings: updatedBuildings,
        step4: { ...currentFormData.step4, buildingCount: updatedBuildings.length }
      };
      
      // Sauvegarder immédiatement (sans debounce pour l'ajout)
      // Supabase accepte directement les objets JavaScript pour les colonnes JSONB
      if (saveImmediately) {
        await saveImmediately({ formulaire_data: updatedFormData }); // Passer l'objet directement
      } else if (autoSave) {
        await autoSave({ formulaire_data: updatedFormData }); // Passer l'objet directement
      }
    } catch (error) {
      console.error('Error saving new building:', error);
      // Restaurer le state en cas d'erreur
      setBuildings(buildings);
    }
  };

  const handleDeleteBuilding = async (index) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le bâtiment ${index + 1} ? Cette action est irréversible.`)) {
      return;
    }

    const updatedBuildings = buildings.filter((_, i) => i !== index);
    setBuildings(updatedBuildings);
    
    // Si on supprimait le bâtiment en cours d'édition, annuler l'édition
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingBuilding(null);
    } else if (editingIndex > index) {
      // Ajuster l'index d'édition si nécessaire
      setEditingIndex(editingIndex - 1);
    }
    
    // Sauvegarder immédiatement dans formulaire_data
    try {
      const currentFormData = lead?.formulaire_data 
        ? (typeof lead.formulaire_data === 'string' ? JSON.parse(lead.formulaire_data) : lead.formulaire_data)
        : {};
      
      const updatedFormData = {
        ...currentFormData,
        buildings: updatedBuildings,
        step4: { ...currentFormData.step4, buildingCount: updatedBuildings.length }
      };
      
      // Mapper aussi vers les colonnes principales
      const totalSurface = updatedBuildings.reduce((sum, b) => sum + (parseFloat(b.surface) || 0), 0);
      const buildingTypesStr = updatedBuildings.map(b => b.type).filter(Boolean).join(', ');
      
      // Sauvegarder immédiatement (sans debounce pour la suppression)
      // Supabase accepte directement les objets JavaScript pour les colonnes JSONB
      const updatesToSave = {
        formulaire_data: updatedFormData, // Passer l'objet directement
        surface_m2: totalSurface > 0 ? totalSurface : 0,
        type_batiment: buildingTypesStr || null
      };
      
      if (saveImmediately) {
        await saveImmediately(updatesToSave);
      } else if (autoSave) {
        await autoSave(updatesToSave); // Passer l'objet complet directement
      }
    } catch (error) {
      console.error('Error deleting building:', error);
      // En cas d'erreur, restaurer le state
      setBuildings(buildings);
    }
  };

  if (buildings.length === 0 && !lead.type_batiment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="buildings">
            <AccordionTrigger className="text-lg font-semibold text-gray-900">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bâtiments
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  À compléter
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aucun bâtiment renseigné</p>
                    <Button onClick={handleAddBuilding} className="bg-secondary-500 hover:bg-secondary-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un bâtiment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Accordion type="single" collapsible defaultValue="buildings" className="w-full">
        <AccordionItem value="buildings">
          <AccordionTrigger className="text-lg font-semibold text-gray-900">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bâtiments
                <Badge variant="outline">
                  {buildings.length} bâtiment{buildings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-4">
                {buildings.map((building, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border",
                      editingIndex === index 
                        ? "border-secondary-500 bg-secondary-50" 
                        : "border-gray-200 bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Bâtiment {index + 1}</h4>
                      <div className="flex gap-2">
                        {editingIndex === index ? (
                          <>
                            <Button size="sm" onClick={() => handleSave(index)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(index)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Éditer
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteBuilding(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingIndex === index ? (
                      <div className="space-y-4">
                        {/* Type de bâtiment */}
                        <div>
                          <Label>Type de bâtiment *</Label>
                          <Select
                            value={editingBuilding.type || 'warehouse'}
                            onValueChange={(value) => setEditingBuilding({ ...editingBuilding, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {buildingTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Surface et Hauteur */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Surface (m²) *</Label>
                            <Input
                              type="number"
                              min="100"
                              value={editingBuilding.surface || ''}
                              onChange={(e) => setEditingBuilding({ ...editingBuilding, surface: e.target.value })}
                              placeholder="1000"
                            />
                          </div>
                          <div>
                            <Label>Hauteur plafond (m)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={editingBuilding.ceilingHeight || ''}
                              onChange={(e) => setEditingBuilding({ ...editingBuilding, ceilingHeight: e.target.value })}
                              placeholder="4.5"
                            />
                          </div>
                        </div>

                        {/* Chauffage */}
                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center space-x-2 mb-3">
                            <Checkbox
                              id={`heating-${index}`}
                              checked={editingBuilding.heating || false}
                              onCheckedChange={(checked) => setEditingBuilding({ ...editingBuilding, heating: checked })}
                            />
                            <Label htmlFor={`heating-${index}`}>Ce bâtiment est chauffé</Label>
                          </div>
                          {editingBuilding.heating && (
                            <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                              <div>
                                <Label>Mode de chauffage</Label>
                                <Select
                                  value={editingBuilding.heatingMode || ''}
                                  onValueChange={(value) => setEditingBuilding({ ...editingBuilding, heatingMode: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {heatingModes.map(mode => (
                                      <SelectItem key={mode.value} value={mode.value}>
                                        {mode.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Puissance (kW)</Label>
                                  <Input
                                    type="number"
                                    value={editingBuilding.heatingPower || ''}
                                    onChange={(e) => setEditingBuilding({ ...editingBuilding, heatingPower: e.target.value })}
                                    placeholder="100"
                                  />
                                </div>
                                <div>
                                  <Label>Consigne (°C)</Label>
                                  <Input
                                    type="number"
                                    value={editingBuilding.heatingSetpoint || ''}
                                    onChange={(e) => setEditingBuilding({ ...editingBuilding, heatingSetpoint: e.target.value })}
                                    placeholder="19"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Éclairage intérieur */}
                        <div className="p-3 bg-white rounded border">
                          <Label className="mb-3 block">Éclairage intérieur</Label>
                          <div className="space-y-3">
                            {lightingTypes.map(lightType => {
                              const lightData = editingBuilding.interiorLighting?.[lightType.id] || {};
                              return (
                                <div key={lightType.id} className="border-b pb-3 last:border-b-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox
                                      id={`light-${index}-${lightType.id}`}
                                      checked={lightData.enabled || false}
                                      onCheckedChange={(checked) => {
                                        const lighting = { ...editingBuilding.interiorLighting };
                                        lighting[lightType.id] = { ...lightData, enabled: checked };
                                        setEditingBuilding({ ...editingBuilding, interiorLighting: lighting });
                                      }}
                                    />
                                    <Label htmlFor={`light-${index}-${lightType.id}`}>{lightType.label}</Label>
                                  </div>
                                  {lightData.enabled && (
                                    <div className="ml-6 grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-xs">Nombre</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={lightData.quantity || ''}
                                          onChange={(e) => {
                                            const lighting = { ...editingBuilding.interiorLighting };
                                            lighting[lightType.id] = { ...lightData, quantity: e.target.value };
                                            setEditingBuilding({ ...editingBuilding, interiorLighting: lighting });
                                          }}
                                          placeholder="10"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Puissance (W)</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={lightData.powerPerUnit || ''}
                                          onChange={(e) => {
                                            const lighting = { ...editingBuilding.interiorLighting };
                                            lighting[lightType.id] = { ...lightData, powerPerUnit: e.target.value };
                                            setEditingBuilding({ ...editingBuilding, interiorLighting: lighting });
                                          }}
                                          placeholder="58"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Éclairage extérieur */}
                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center gap-2 mb-3">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            <Label>Éclairage / équipements extérieurs (si concerné)</Label>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`ext-light-cee-${index}`}
                                checked={editingBuilding.exteriorLighting?.changedByCEE || false}
                                onCheckedChange={(checked) => {
                                  const extLight = editingBuilding.exteriorLighting || {};
                                  extLight.changedByCEE = checked;
                                  // Si changé par CEE, réinitialiser type et quantité
                                  if (checked) {
                                    extLight.type = '';
                                    extLight.quantity = '';
                                  }
                                  setEditingBuilding({ ...editingBuilding, exteriorLighting: extLight });
                                }}
                              />
                              <Label htmlFor={`ext-light-cee-${index}`}>
                                Renouvellement des équipements extérieurs pris en charge dans le cadre CEE
                              </Label>
                            </div>
                            
                            {!editingBuilding.exteriorLighting?.changedByCEE && (
                              <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                                <div>
                                  <Label className="text-sm">Type d&apos;équipements actuels</Label>
                                  <Input
                                    type="text"
                                    value={editingBuilding.exteriorLighting?.type || ''}
                                    onChange={(e) => {
                                      const extLight = editingBuilding.exteriorLighting || {};
                                      extLight.type = e.target.value;
                                      setEditingBuilding({ ...editingBuilding, exteriorLighting: extLight });
                                    }}
                                    placeholder="Ex : projecteurs, bornes, ligne existante..."
                                  />
                                </div>
                                <div>
                                  <Label className="text-sm">Quantité</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={editingBuilding.exteriorLighting?.quantity || ''}
                                    onChange={(e) => {
                                      const extLight = editingBuilding.exteriorLighting || {};
                                      extLight.quantity = e.target.value;
                                      setEditingBuilding({ ...editingBuilding, exteriorLighting: extLight });
                                    }}
                                    placeholder="Nombre d&apos;équipements"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {editingBuilding.exteriorLighting?.changedByCEE && (
                              <div className="ml-6 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                ✓ Équipements extérieurs déjà renouvelés (CEE)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-medium">
                            {buildingTypes.find(t => t.value === building.type)?.label || building.type || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Surface:</span>
                          <span className="ml-2 font-medium">{building.surface ? `${building.surface} m²` : '-'}</span>
                        </div>
                        {building.ceilingHeight && (
                          <div>
                            <span className="text-gray-500">Hauteur:</span>
                            <span className="ml-2 font-medium">{building.ceilingHeight} m</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Chauffé:</span>
                          <span className="ml-2 font-medium">{building.heating ? 'Oui' : 'Non'}</span>
                        </div>
                        {building.heating && building.heatingMode && (
                          <>
                            <div>
                              <span className="text-gray-500">Mode:</span>
                              <span className="ml-2 font-medium">
                                {heatingModes.find(m => m.value === building.heatingMode)?.label || building.heatingMode}
                              </span>
                            </div>
                            {building.heatingPower && (
                              <div>
                                <span className="text-gray-500">Puissance:</span>
                                <span className="ml-2 font-medium">{building.heatingPower} kW</span>
                              </div>
                            )}
                          </>
                        )}
                        {building.interiorLighting && Object.keys(building.interiorLighting).length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Éclairage intérieur:</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {Object.entries(building.interiorLighting).map(([key, light]) => {
                                if (!light.enabled) return null;
                                const lightLabel = lightingTypes.find(l => l.id === key)?.label || key;
                                return (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {lightLabel}: {light.quantity || 0} × {light.powerPerUnit || 0}W
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {building.exteriorLighting && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Éclairage extérieur:</span>
                            <div className="mt-1">
                              {building.exteriorLighting.changedByCEE ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  <Sun className="h-3 w-3 mr-1" />
                                  Déjà remplacé par CEE
                                </Badge>
                              ) : (
                                building.exteriorLighting.type && (
                                  <Badge variant="outline" className="text-xs">
                                    {building.exteriorLighting.type}
                                    {building.exteriorLighting.quantity && ` (${building.exteriorLighting.quantity} unités)`}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={handleAddBuilding}
                  className="w-full mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un bâtiment
                </Button>

                {/* Séparateur */}
                <div className="h-px bg-gray-200 my-6" />

                {/* Consommation annuelle */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Consommation annuelle (kWh)
                    {(!lead?.consommation_annuelle || lead.consommation_annuelle === '') && (
                      <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                        À compléter
                      </Badge>
                    )}
                  </label>
                  {isEditingConsommation ? (
                    <div>
                      <Input
                        type="number"
                        value={consommationAnnuelle}
                        onChange={(e) => setConsommationAnnuelle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            autoSave?.('consommation_annuelle', consommationAnnuelle);
                            setIsEditingConsommation(false);
                          }
                          if (e.key === 'Escape') {
                            setConsommationAnnuelle(lead?.consommation_annuelle || '');
                            setIsEditingConsommation(false);
                          }
                        }}
                        placeholder="Ex: 50000"
                        className="w-full"
                        autoFocus
                      />
                      <div className="flex gap-1 mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            autoSave?.('consommation_annuelle', consommationAnnuelle);
                            setIsEditingConsommation(false);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Enregistrer
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setConsommationAnnuelle(lead?.consommation_annuelle || '');
                            setIsEditingConsommation(false);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors group flex items-center justify-between"
                      onDoubleClick={() => setIsEditingConsommation(true)}
                      title="Double-clic pour éditer"
                    >
                      <span className="text-sm text-gray-900">
                        {lead?.consommation_annuelle || '-'} {lead?.consommation_annuelle ? 'kWh' : ''}
                      </span>
                      <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Notes techniques */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes techniques
                    {(!lead?.notes_techniques || lead.notes_techniques.trim() === '') && (
                      <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                        À compléter
                      </Badge>
                    )}
                  </label>
                  {isEditingNotes ? (
                    <div>
                      <Textarea
                        value={notesTechniques}
                        onChange={(e) => setNotesTechniques(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setNotesTechniques(lead?.notes_techniques || '');
                            setIsEditingNotes(false);
                          }
                        }}
                        rows={4}
                        dir="ltr"
                        lang="fr"
                        className="w-full"
                        placeholder="Ex: Remarques sur l'installation, spécificités techniques..."
                        autoFocus
                      />
                      <div className="flex gap-1 mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            autoSave?.('notes_techniques', notesTechniques);
                            setIsEditingNotes(false);
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Enregistrer
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setNotesTechniques(lead?.notes_techniques || '');
                            setIsEditingNotes(false);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition-colors group flex items-center justify-between min-h-[60px]"
                      onDoubleClick={() => setIsEditingNotes(true)}
                      title="Double-clic pour éditer"
                    >
                      <span 
                        dir="ltr"
                        lang="fr"
                        className="text-sm text-gray-900 whitespace-pre-wrap block flex-1"
                      >
                        {lead?.notes_techniques || '-'}
                      </span>
                      <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default BuildingsSection;

