import React from 'react';
import StatusSettingsPage from '@/components/settings/statuses/StatusSettingsPage';
/**
 * Settings Order Statuses Page
 * Gestion des statuts des commandes
 * Note: La vérification des permissions est gérée par RequireRole dans App.jsx
 */
const SettingsOrderStatusesPage = () => {
  return (
    <StatusSettingsPage
      table="commande_statuses"
      title="Statuts des commandes"
      subtitle="Gérez les étapes de validation de vos devis et commandes."
    />
  );
};

export default SettingsOrderStatusesPage;








