import React from 'react';
import { User, Mail, Phone, MessageSquare, Building } from 'lucide-react';
const CeeStepContactRemarks = ({ data, onChange, errors, ceePotential, projectType }) => (
  <div className="space-y-6">
    <div className="text-center mb-6">
      <User className="h-10 w-10 mx-auto text-[var(--secondary-600)] mb-3" />
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Vos coordonnées</h2>
      <p className="text-gray-600 mt-2 text-sm md:text-base">
        Dernière étape : nous vous recontactons pour affiner votre dossier et les pistes CEE.
      </p>
    </div>
    {ceePotential && ceePotential.totalPotential > 0 && (
      <div className="rounded-xl border border-[var(--secondary-200)] bg-[var(--secondary-50)]/80 p-4 text-center">
        <p className="text-sm font-medium text-gray-800">Estimation indicative (à valider avec nos équipes)</p>
        <p className="text-2xl font-bold text-[var(--secondary-700)] mt-1">
          {ceePotential.totalPotential.toLocaleString('fr-FR')} € / an
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Ordre de grandeur basé sur votre surface
          {projectType === 'destrat' ? ' et la hauteur sous plafond' : ''} — sans engagement.
        </p>
      </div>
    )}
    <div className="grid sm:grid-cols-2 gap-4">
      <div className={`form-field ${errors?.firstName ? 'error' : ''}`}>
        <label>Prénom *</label>
        <input
          type="text"
          value={data.firstName || ''}
          onChange={(e) => onChange('firstName', e.target.value)}
          autoComplete="given-name"
        />
        {errors?.firstName && <p className="error-message">{errors.firstName}</p>}
      </div>
      <div className={`form-field ${errors?.lastName ? 'error' : ''}`}>
        <label>Nom *</label>
        <input
          type="text"
          value={data.lastName || ''}
          onChange={(e) => onChange('lastName', e.target.value)}
          autoComplete="family-name"
        />
        {errors?.lastName && <p className="error-message">{errors.lastName}</p>}
      </div>
    </div>
    <div className={`form-field ${errors?.phone ? 'error' : ''}`}>
      <label className="flex items-center gap-2">
        <Phone className="h-4 w-4" />
        Téléphone *
      </label>
      <input
        type="tel"
        value={data.phone || ''}
        onChange={(e) => onChange('phone', e.target.value)}
        autoComplete="tel"
        placeholder="+33 6 …"
      />
      {errors?.phone && <p className="error-message">{errors.phone}</p>}
    </div>
    <div className={`form-field ${errors?.email ? 'error' : ''}`}>
      <label className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Email *
      </label>
      <input
        type="email"
        value={data.email || ''}
        onChange={(e) => onChange('email', e.target.value)}
        autoComplete="email"
      />
      {errors?.email && <p className="error-message">{errors.email}</p>}
    </div>
    <div className="form-field">
      <label className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        Société ou copropriété (optionnel)
      </label>
      <input
        type="text"
        value={data.companyName || ''}
        onChange={(e) => onChange('companyName', e.target.value)}
        autoComplete="organization"
      />
    </div>
    <div className="form-field">
      <label className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Commentaires (optionnel)
      </label>
      <textarea
        rows={4}
        value={data.remarks || ''}
        onChange={(e) => onChange('remarks', e.target.value)}
        placeholder="Contraintes de planning, accès, informations complémentaires…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  </div>
);

export default CeeStepContactRemarks;
