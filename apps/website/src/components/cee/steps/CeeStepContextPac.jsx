import React from 'react';
import { ThermometerSun } from 'lucide-react';

const HEATING = [
  { value: 'gaz', label: 'Gaz' },
  { value: 'fioul', label: 'Fioul' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'pac_existante', label: 'Pompe à chaleur existante' },
  { value: 'autre', label: 'Autre' },
];

const GOALS = [
  { value: 'remplacer', label: 'Remplacer le chauffage existant' },
  { value: 'renover', label: 'Rénover un bâtiment' },
  { value: 'neuf', label: 'Étudier une installation neuve' },
  { value: 'facture', label: 'Réduire la facture énergétique' },
];

const TIMELINES = [
  { value: 'urgent', label: 'Urgent' },
  { value: '3mois', label: 'Sous 3 mois' },
  { value: '6mois', label: 'Sous 6 mois' },
  { value: 'reflexion', label: 'En réflexion' },
];

const CeeStepContextPac = ({ data, onChange, errors }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <ThermometerSun className="h-10 w-10 mx-auto text-[var(--secondary-600)] mb-3" />
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Contexte chauffage & projet</h2>
      <p className="text-gray-600 mt-2 text-sm md:text-base">
        Ces éléments nous aident à qualifier votre demande et à préparer un échange pertinent.
      </p>
    </div>
    <div className={`form-field ${errors?.currentHeating ? 'error' : ''}`}>
      <label>Système de chauffage actuel *</label>
      <select
        value={data.currentHeating || ''}
        onChange={(e) => onChange('currentHeating', e.target.value)}
        required
      >
        <option value="" disabled>
          Sélectionner…
        </option>
        {HEATING.map((h) => (
          <option key={h.value} value={h.value}>
            {h.label}
          </option>
        ))}
      </select>
      {errors?.currentHeating && <p className="error-message">{errors.currentHeating}</p>}
    </div>
    <div className={`form-field ${errors?.projectGoal ? 'error' : ''}`}>
      <label>Objectif du projet *</label>
      <select
        value={data.projectGoal || ''}
        onChange={(e) => onChange('projectGoal', e.target.value)}
        required
      >
        <option value="" disabled>
          Sélectionner…
        </option>
        {GOALS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
      {errors?.projectGoal && <p className="error-message">{errors.projectGoal}</p>}
    </div>
    <div className={`form-field ${errors?.timeline ? 'error' : ''}`}>
      <label>Échéance du projet *</label>
      <select value={data.timeline || ''} onChange={(e) => onChange('timeline', e.target.value)} required>
        <option value="" disabled>
          Sélectionner…
        </option>
        {TIMELINES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      {errors?.timeline && <p className="error-message">{errors.timeline}</p>}
    </div>
  </div>
);

export default CeeStepContextPac;
