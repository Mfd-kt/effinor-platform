import React from 'react';
import { Wind } from 'lucide-react';

const HEATING = [
  { value: 'gaz', label: 'Gaz' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'aerotherme', label: 'Aérotherme' },
  { value: 'air_pulse', label: 'Air pulsé' },
  { value: 'autre', label: 'Autre' },
];

const PROBLEMS = [
  { value: 'chaleur_haut', label: 'Chaleur bloquée en hauteur' },
  { value: 'froid_sol', label: 'Froid au sol' },
  { value: 'facture', label: 'Facture chauffage élevée' },
  { value: 'inhomogene', label: 'Température non homogène' },
  { value: 'inconfort', label: 'Inconfort des équipes' },
];

const TIMELINES = [
  { value: 'urgent', label: 'Urgent' },
  { value: '3mois', label: 'Sous 3 mois' },
  { value: '6mois', label: 'Sous 6 mois' },
  { value: 'reflexion', label: 'En réflexion' },
];

const CeeStepContextDestrat = ({ data, onChange, errors }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <Wind className="h-10 w-10 mx-auto text-[var(--secondary-600)] mb-3" />
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Chauffage & symptômes</h2>
      <p className="text-gray-600 mt-2 text-sm md:text-base">
        Décrivez le générateur et le problème principal : nous préparons l’étude en conséquence.
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
    <div className={`form-field ${errors?.mainProblem ? 'error' : ''}`}>
      <label>Problème principal *</label>
      <select value={data.mainProblem || ''} onChange={(e) => onChange('mainProblem', e.target.value)} required>
        <option value="" disabled>
          Sélectionner…
        </option>
        {PROBLEMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      {errors?.mainProblem && <p className="error-message">{errors.mainProblem}</p>}
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

export default CeeStepContextDestrat;
