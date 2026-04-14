import React from 'react';
import { Flame, Wind } from 'lucide-react';

const OPTIONS = [
  {
    value: 'pac',
    label: 'Pompe à chaleur',
    description: 'Remplacement ou installation pour le chauffage et l’eau chaude selon contexte.',
    icon: Flame,
  },
  {
    value: 'destrat',
    label: 'Déstratification d’air',
    description: 'Homogénéiser la température dans les grands volumes tertiaires ou industriels.',
    icon: Wind,
  },
];

const CeeStepProjectType = ({ value, onChange, errors }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Quel est votre projet ?</h2>
      <p className="text-gray-600 mt-2 max-w-xl mx-auto text-sm md:text-base">
        Nous adaptons les questions à votre besoin. Une minute pour choisir, puis un parcours court et ciblé.
      </p>
    </div>
    <div className="grid sm:grid-cols-2 gap-4">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left rounded-xl border-2 p-5 md:p-6 transition-all ${
              selected
                ? 'border-[var(--secondary-500)] bg-[var(--secondary-500)]/5 shadow-md ring-2 ring-[var(--secondary-500)]/20'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`rounded-lg p-3 ${selected ? 'bg-[var(--secondary-500)] text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Icon className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{opt.label}</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{opt.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
    {errors?.projectType && <p className="error-message text-center">{errors.projectType}</p>}
    <p className="text-xs text-gray-500 text-center">
      Vos données sont traitées de façon confidentielle — nous ne demandons que l’essentiel pour vous recontacter.
    </p>
  </div>
);

export default CeeStepProjectType;
