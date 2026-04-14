import React from 'react';
import { Building, Layers } from 'lucide-react';

const Step4BuildingCount = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building className="h-12 w-12 mx-auto mb-4 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Configuration des bâtiments</h2>
        <p className="text-gray-600 mt-2">Combien de bâtiments souhaitez-vous analyser ?</p>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <Layers className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <p className="text-yellow-900 font-semibold mb-2">Analyse détaillée par bâtiment</p>
            <p className="text-yellow-800 text-sm">
              Nous allons analyser chaque bâtiment individuellement pour calculer précisément 
              votre potentiel d'économies d'énergie et les solutions adaptées à vos besoins.
            </p>
          </div>
        </div>
      </div>

      <div className={`form-field ${errors.buildingCount ? 'error' : ''}`}>
        <label htmlFor="buildingCount">Nombre de bâtiments à analyser *</label>
        <select id="buildingCount" value={data.buildingCount ? String(data.buildingCount) : ''} onChange={(e) => onChange('buildingCount', parseInt(e.target.value))}>
            <option value="" disabled>Sélectionnez le nombre</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={String(num)}>
                {num} {num === 1 ? 'bâtiment' : 'bâtiments'}
              </option>
            ))}
        </select>
        {errors.buildingCount && <span className="error-message">{errors.buildingCount}</span>}
      </div>
    </div>
  );
};

export default Step4BuildingCount;