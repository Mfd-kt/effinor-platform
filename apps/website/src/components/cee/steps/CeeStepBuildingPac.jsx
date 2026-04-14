import React from 'react';
import { Building2, MapPin } from 'lucide-react';

const BUILDING_TYPES = [
  { value: 'maison', label: 'Maison' },
  { value: 'copro', label: 'Copropriété / résidentiel collectif' },
  { value: 'tertiaire', label: 'Tertiaire' },
  { value: 'autre', label: 'Autre' },
];

const CeeStepBuildingPac = ({ data, onChange, errors }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <Building2 className="h-10 w-10 mx-auto text-[var(--secondary-600)] mb-3" />
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Votre bâtiment</h2>
      <p className="text-gray-600 mt-2 text-sm md:text-base">Informations nécessaires pour orienter votre étude PAC.</p>
    </div>
    <div className={`form-field ${errors?.buildingType ? 'error' : ''}`}>
      <label>Type de bâtiment *</label>
      <select
        value={data.buildingType || ''}
        onChange={(e) => onChange('buildingType', e.target.value)}
        required
      >
        <option value="" disabled>
          Sélectionner…
        </option>
        {BUILDING_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      {errors?.buildingType && <p className="error-message">{errors.buildingType}</p>}
    </div>
    <div className={`form-field ${errors?.surfaceM2 ? 'error' : ''}`}>
      <label>Surface approximative (m²) *</label>
      <input
        type="number"
        min="30"
        step="1"
        value={data.surfaceM2 || ''}
        onChange={(e) => onChange('surfaceM2', e.target.value)}
        placeholder="Ex. 120"
      />
      {errors?.surfaceM2 && <p className="error-message">{errors.surfaceM2}</p>}
    </div>
    <div className="grid sm:grid-cols-2 gap-4">
      <div className={`form-field ${errors?.postalCode ? 'error' : ''}`}>
        <label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Code postal *
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          value={data.postalCode || ''}
          onChange={(e) => onChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="75001"
        />
        {errors?.postalCode && <p className="error-message">{errors.postalCode}</p>}
      </div>
      <div className={`form-field ${errors?.city ? 'error' : ''}`}>
        <label>Ville *</label>
        <input
          type="text"
          value={data.city || ''}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder="Paris"
        />
        {errors?.city && <p className="error-message">{errors.city}</p>}
      </div>
    </div>
  </div>
);

export default CeeStepBuildingPac;
