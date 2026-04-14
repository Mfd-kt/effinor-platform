import React from 'react';
import { Building2, Thermometer, Lightbulb, Sun } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const Step5BuildingDetails = ({ buildingIndex, totalBuildings, data, onChange, errors }) => {
  const buildingTypes = [
    { value: 'warehouse', label: 'Entrepôt' },
    { value: 'factory', label: 'Usine' },
    { value: 'offices', label: 'Bureaux' },
    { value: 'retail', label: 'Commerce' },
    { value: 'other', label: 'Autre' }
  ];

  const lightingTypes = [
    { id: 'neon', label: 'Néon' },
    { id: 'doubleNeon', label: 'Double néon' },
    { id: 'halogen', label: 'Halogène' },
  ];

  const operatingHours = [
    { value: '2000', label: '8h/jour, 250j' },
    { value: '4000', label: '16h/jour, 250j' },
    { value: '8760', label: '24h/jour, 365j' }
  ];

  const handleLightingChange = (lightId, field, value) => {
    const currentLighting = data.interiorLighting || {};
    const updatedLighting = { ...currentLighting, [lightId]: { ...currentLighting[lightId], [field]: value } };
    onChange('interiorLighting', updatedLighting);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Bâtiment {buildingIndex + 1} sur {totalBuildings}</h2>
        <p className="text-gray-600 mt-2">Détails du bâtiment</p>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary-600" />Informations générales</h3>
          <div className="space-y-4">
            <div className={`form-field ${errors.type ? 'error' : ''}`}>
              <label>Type de bâtiment *</label>
              <select value={data.type || ''} onChange={(e) => onChange('type', e.target.value)}>
                <option value="" disabled>Sélectionnez</option>
                {buildingTypes.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
              </select>
              {errors.type && <p className="error-message">{errors.type}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`form-field ${errors.surface ? 'error' : ''}`}>
                <label>Surface (m²) *</label>
                <input type="number" min="100" value={data.surface || ''} onChange={(e) => onChange('surface', e.target.value)} placeholder="1000"/>
                {errors.surface && <p className="error-message">{errors.surface}</p>}
              </div>
              <div className="form-field"><label>Hauteur (m)</label><input type="number" step="0.1" value={data.ceilingHeight || ''} onChange={(e) => onChange('ceilingHeight', e.target.value)} placeholder="4.5"/></div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Thermometer className="h-5 w-5 text-primary-600" />Chauffage</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2"><Checkbox id={`heating-${buildingIndex}`} checked={data.heating || false} onCheckedChange={(checked) => onChange('heating', checked)}/><label htmlFor={`heating-${buildingIndex}`}>Ce bâtiment est chauffé</label></div>
            {data.heating && (
              <div className="ml-6 space-y-4 border-l-2 border-primary-200 pl-4">
                <div className="form-field"><label>Mode de chauffage</label><select value={data.heatingMode || ''} onChange={(e) => onChange('heatingMode', e.target.value)}><option value="" disabled>Sélectionnez</option><option value="gas">Gaz</option><option value="electric">Électrique</option><option value="fuel">Fioul</option><option value="other">Autre</option></select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-field"><label>Puissance (kW)</label><input type="number" value={data.heatingPower || ''} onChange={(e) => onChange('heatingPower', e.target.value)} placeholder="100"/></div>
                  <div className="form-field"><label>Consigne (°C)</label><input type="number" value={data.heatingSetpoint || ''} onChange={(e) => onChange('heatingSetpoint', e.target.value)} placeholder="19"/></div>
                </div>
              </div>
            )}
          </div>
        </div>

         <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary-600" />Éclairage intérieur</h3>
            <div className="space-y-4">
                {lightingTypes.map((lightType) => {
                    const lightData = data.interiorLighting?.[lightType.id] || {};
                    return (
                        <div key={lightType.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-center space-x-2 mb-3"><Checkbox id={`light-${buildingIndex}-${lightType.id}`} checked={lightData.enabled || false} onCheckedChange={(checked) => handleLightingChange(lightType.id, 'enabled', checked)}/><label htmlFor={`light-${buildingIndex}-${lightType.id}`} className="font-medium">{lightType.label}</label></div>
                            {lightData.enabled && (
                                <div className="ml-6 grid grid-cols-2 gap-3">
                                    <div className="form-field"><label className="text-sm">Nombre</label><input type="number" min="1" value={lightData.quantity || ''} onChange={(e) => handleLightingChange(lightType.id, 'quantity', e.target.value)} placeholder="10"/></div>
                                    <div className="form-field"><label className="text-sm">Puissance (W)</label><input type="number" min="1" value={lightData.powerPerUnit || ''} onChange={(e) => handleLightingChange(lightType.id, 'powerPerUnit', e.target.value)} placeholder="58"/></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Step5BuildingDetails;