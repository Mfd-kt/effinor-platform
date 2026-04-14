import React from 'react';
import { Building2, MapPin, Hash } from 'lucide-react';

const Step1CompanyInfo = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Informations sur votre entreprise</h2>
        <p className="text-gray-600 mt-2">Commençons par les informations de base</p>
      </div>

      <div className="space-y-4">
        <div className={`form-field ${errors.companyName ? 'error' : ''}`}>
          <label htmlFor="companyName">Nom de l'entreprise *</label>
          <input
            id="companyName"
            value={data.companyName || ''}
            onChange={(e) => onChange('companyName', e.target.value)}
            placeholder="Ex: Effinor Lighting"
          />
          {errors.companyName && <span className="error-message">{errors.companyName}</span>}
        </div>

        <div className={`form-field ${errors.siret ? 'error' : ''}`}>
          <label htmlFor="siret"><Hash className="inline h-4 w-4 mr-1" />SIRET (14 chiffres) *</label>
          <input
            id="siret"
            value={data.siret || ''}
            onChange={(e) => { const value = e.target.value.replace(/\D/g, '').slice(0, 14); onChange('siret', value); }}
            placeholder="12345678901234"
            maxLength={14}
          />
          {errors.siret && <span className="error-message">{errors.siret}</span>}
        </div>

        <div className={`form-field ${errors.address ? 'error' : ''}`}>
          <label htmlFor="address"><MapPin className="inline h-4 w-4 mr-1" />Adresse *</label>
          <input
            id="address"
            value={data.address || ''}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="123 Rue de la République"
          />
           {errors.address && <span className="error-message">{errors.address}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`form-field ${errors.postalCode ? 'error' : ''}`}>
            <label htmlFor="postalCode">Code postal *</label>
            <input
              id="postalCode"
              value={data.postalCode || ''}
              onChange={(e) => { const value = e.target.value.replace(/\D/g, '').slice(0, 5); onChange('postalCode', value); }}
              placeholder="75001"
              maxLength={5}
            />
             {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
          </div>

          <div className={`form-field ${errors.city ? 'error' : ''}`}>
            <label htmlFor="city">Ville *</label>
            <input
              id="city"
              value={data.city || ''}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="Paris"
            />
             {errors.city && <span className="error-message">{errors.city}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1CompanyInfo;