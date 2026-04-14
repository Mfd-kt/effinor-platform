import React from 'react';
import StatusSettingsPage from '@/components/settings/statuses/StatusSettingsPage';
/**
 * Settings Lead Statuses Page
 * Gestion des statuts des leads
 * Note: La vérification des permissions est gérée par RequireRole dans App.jsx
 */
const SettingsLeadStatusesPage = () => {
  return (
    <StatusSettingsPage
      table="lead_statuses"
      title="Statuts des leads"
      subtitle="Personnalisez le pipeline de suivi des leads."
    />
  );
};

export default SettingsLeadStatusesPage;

