import React from 'react';
import { Building2 } from 'lucide-react';

const BUILDING_TYPES = [
  { value: 'entrepot', label: 'Entrepôt' },
  { value: 'industriel', label: 'Bâtiment industriel' },
  { value: 'tertiaire', label: 'Local tertiaire' },
  { value: 'gymnase', label: 'Gymnase / grand volume' },
  { value: 'autre', label: 'Autre' },
];

const CeeStepBuildingDestrat = ({ data, onChange, errors }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <Building2 className="h-10 w-10 mx-auto text-[var(--secondary-600)] mb-3" />
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Votre volume à traiter</h2>
      <p className="text-gray-600 mt-2 text-sm md:text-base">
        La déstratification concerne surtout les espaces à hauteur sous plafond importante.
      </p>
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
        min="100"
        step="1"
        value={data.surfaceM2 || ''}
        onChange={(e) => onChange('surfaceM2', e.target.value)}
        placeholder="Ex. 2000"
      />
      {errors?.surfaceM2 && <p className="error-message">{errors.surfaceM2}</p>}
    </div>
    <div className={`form-field ${errors?.ceilingHeightM ? 'error' : ''}`}>
      <label>Hauteur sous plafond (m) *</label>
      <input
        type="number"
        min="3"
        step="0.1"
        value={data.ceilingHeightM || ''}
        onChange={(e) => onChange('ceilingHeightM', e.target.value)}
        placeholder="Ex. 8 ou 12"
      />
      <p className="text-xs text-gray-500 mt-1">Indicatif : plus la hauteur est grande, plus la stratification d’air est marquée.</p>
      {errors?.ceilingHeightM && <p className="error-message">{errors.ceilingHeightM}</p>}
    </div>
    <div className={`form-field ${errors?.postalCode ? 'error' : ''}`}>
      <label>Code postal (optionnel mais recommandé)</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={5}
        value={data.postalCode || ''}
        onChange={(e) => onChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
        placeholder="Pour affiner le dossier et le climat"
      />
      {errors?.postalCode && <p className="error-message">{errors.postalCode}</p>}
    </div>
  </div>
);

export default CeeStepBuildingDestrat;
