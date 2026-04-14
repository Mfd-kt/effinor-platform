import React from 'react';
import { User, Mail, Phone, Briefcase } from 'lucide-react';

const Step2MainContact = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="h-12 w-12 mx-auto mb-4 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Contact principal</h2>
        <p className="text-gray-600 mt-2">Qui sera notre interlocuteur privilégié ?</p>
      </div>

      <div className="space-y-4">
        <div className={`form-field ${errors.civility ? 'error' : ''}`}>
          <label htmlFor="civility">Civilité *</label>
          <select id="civility" value={data.civility || ''} onChange={(e) => onChange('civility', e.target.value)}>
            <option value="" disabled>Sélectionnez</option>
            <option value="M.">M.</option>
            <option value="Mme">Mme</option>
            <option value="Autre">Autre</option>
          </select>
          {errors.civility && <span className="error-message">{errors.civility}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`form-field ${errors.lastName ? 'error' : ''}`}>
            <label htmlFor="lastName">Nom *</label>
            <input id="lastName" value={data.lastName || ''} onChange={(e) => onChange('lastName', e.target.value)} placeholder="Dupont"/>
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>
          <div className={`form-field ${errors.firstName ? 'error' : ''}`}>
            <label htmlFor="firstName">Prénom *</label>
            <input id="firstName" value={data.firstName || ''} onChange={(e) => onChange('firstName', e.target.value)} placeholder="Jean"/>
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>
        </div>

        <div className={`form-field ${errors.position ? 'error' : ''}`}>
          <label htmlFor="position"><Briefcase className="inline h-4 w-4 mr-1" />Fonction *</label>
          <input id="position" value={data.position || ''} onChange={(e) => onChange('position', e.target.value)} placeholder="Directeur des opérations"/>
          {errors.position && <span className="error-message">{errors.position}</span>}
        </div>

        <div className={`form-field ${errors.phone ? 'error' : ''}`}>
          <label htmlFor="phone"><Phone className="inline h-4 w-4 mr-1" />Téléphone *</label>
          <input id="phone" type="tel" value={data.phone || ''} onChange={(e) => onChange('phone', e.target.value)} placeholder="+33 6 12 34 56 78"/>
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className={`form-field ${errors.email ? 'error' : ''}`}>
          <label htmlFor="email"><Mail className="inline h-4 w-4 mr-1" />Email *</label>
          <input id="email" type="email" value={data.email || ''} onChange={(e) => onChange('email', e.target.value)} placeholder="jean.dupont@entreprise.fr"/>
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>
      </div>
    </div>
  );
};

export default Step2MainContact;