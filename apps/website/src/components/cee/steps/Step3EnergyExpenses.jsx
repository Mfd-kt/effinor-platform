import React from 'react';
import { Euro, TrendingUp } from 'lucide-react';

const Step3EnergyExpenses = ({ data, onChange, errors }) => {
  const expenseBrackets = [
    { value: 'less-10k', label: 'Moins de 10 000 €' },
    { value: '10k-50k', label: '10 000 € à 50 000 €' },
    { value: '50k-100k', label: '50 000 € à 100 000 €' },
    { value: '100k-500k', label: '100 000 € à 500 000 €' },
    { value: 'more-500k', label: 'Plus de 500 000 €' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Euro className="h-12 w-12 mx-auto mb-4 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Dépenses énergétiques</h2>
        <p className="text-gray-600 mt-2">Quel est le montant annuel de vos dépenses énergétiques ?</p>
      </div>

      <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
          <div>
            <p className="text-primary-900 font-semibold mb-2">Pourquoi cette information ?</p>
            <p className="text-primary-800 text-sm">
              Le montant de vos dépenses énergétiques nous permet d'estimer le potentiel d'économies 
              et de vous proposer les solutions les plus adaptées à votre projet.
            </p>
          </div>
        </div>
      </div>

      <div className={`form-field ${errors.energyExpenses ? 'error' : ''}`}>
        <label htmlFor="energyExpenses">Tranche de dépenses annuelles *</label>
        <select id="energyExpenses" value={data.energyExpenses || ''} onChange={(e) => onChange('energyExpenses', e.target.value)}>
            <option value="" disabled>Sélectionnez une tranche</option>
            {expenseBrackets.map((bracket) => (
              <option key={bracket.value} value={bracket.value}>
                {bracket.label}
              </option>
            ))}
        </select>
        {errors.energyExpenses && <span className="error-message">{errors.energyExpenses}</span>}
      </div>
    </div>
  );
};

export default Step3EnergyExpenses;