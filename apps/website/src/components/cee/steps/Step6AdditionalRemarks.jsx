import React from 'react';
import { MessageSquare, CheckCircle, Zap } from 'lucide-react';

const Step6AdditionalRemarks = ({ data, onChange, ceePotential }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Informations complémentaires</h2>
        <p className="text-gray-600 mt-2">Dernières précisions avant l'envoi</p>
      </div>

      {ceePotential && (
        <div className="card p-6 bg-secondary-50">
          <div className="flex items-start gap-3">
            <Zap className="h-8 w-8 text-success flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Estimation de votre projet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Potentiel Total</p>
                  <p className="text-2xl font-bold text-success">
                    {ceePotential.totalPotential.toLocaleString('fr-FR')} €
                  </p>
                </div>
                 <div className="badge badge-success text-base p-3">
                    <strong>Classification :</strong>{' '}
                    {ceePotential.classification === 'high' && '🔥 Potentiel élevé'}
                    {ceePotential.classification === 'medium' && '⚡ Potentiel moyen'}
                    {ceePotential.classification === 'low' && '💡 Potentiel faible'}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="form-field">
        <label htmlFor="remarks">Remarques ou informations complémentaires</label>
        <textarea
          id="remarks"
          value={data.remarks || ''}
          onChange={(e) => onChange('remarks', e.target.value)}
          placeholder="Précisez ici toute information qui pourrait nous aider à mieux comprendre votre projet..."
        />
        <p className="text-sm text-gray-500 mt-2">
          Exemples : contraintes spécifiques, délais souhaités, etc.
        </p>
      </div>

      <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
        <h4 className="font-semibold text-primary-900 mb-2">Prochaines étapes</h4>
        <ul className="space-y-2 text-sm text-primary-800">
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Notre équipe analysera votre demande sous 24h</span></li>
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Vous recevrez une étude personnalisée par email</span></li>
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Un expert vous contactera pour affiner le projet</span></li>
        </ul>
      </div>
    </div>
  );
};

export default Step6AdditionalRemarks;