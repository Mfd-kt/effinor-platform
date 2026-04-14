export const COMMANDE_STATUTS = {
  NOUVELLE: 'nouvelle',
  EN_COURS: 'en_cours',
  DEVIS_ENVOYE: 'devis_envoye',
  EN_ATTENTE_CLIENT: 'en_attente_client',
  ACCEPTEE: 'acceptee',
  REFUSEE: 'refusee',
  ARCHIVEE: 'archivee',
};

export const COMMANDE_STATUT_LABELS = {
  [COMMANDE_STATUTS.NOUVELLE]: 'Nouvelle',
  [COMMANDE_STATUTS.EN_COURS]: 'En cours de traitement',
  [COMMANDE_STATUTS.DEVIS_ENVOYE]: 'Devis envoyé',
  [COMMANDE_STATUTS.EN_ATTENTE_CLIENT]: 'En attente client',
  [COMMANDE_STATUTS.ACCEPTEE]: 'Acceptée',
  [COMMANDE_STATUTS.REFUSEE]: 'Refusée',
  [COMMANDE_STATUTS.ARCHIVEE]: 'Archivée',
};

export const COMMANDE_STATUT_STYLES = {
  [COMMANDE_STATUTS.NOUVELLE]: 'bg-blue-100 text-blue-800',
  [COMMANDE_STATUTS.EN_COURS]: 'bg-indigo-100 text-indigo-800',
  [COMMANDE_STATUTS.DEVIS_ENVOYE]: 'bg-amber-100 text-amber-800',
  [COMMANDE_STATUTS.EN_ATTENTE_CLIENT]: 'bg-gray-100 text-gray-800',
  [COMMANDE_STATUTS.ACCEPTEE]: 'bg-emerald-100 text-emerald-800',
  [COMMANDE_STATUTS.REFUSEE]: 'bg-red-100 text-red-800',
  [COMMANDE_STATUTS.ARCHIVEE]: 'bg-slate-100 text-slate-800',
};




























