import React from 'react';
import { motion } from 'framer-motion';
import NotesTimeline from '@/components/NotesTimeline';
import { useUser } from '@/contexts/UserContext';

/**
 * Onglet Notes & Historique
 * Affiche les notes et l'historique complet du lead
 */
const TabNotes = ({ lead }) => {
  const { profile } = useUser();
  
  if (!lead) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <NotesTimeline 
        leadId={lead.id}
        currentUser={profile?.full_name || profile?.email || 'Admin'}
        title="Notes & Historique"
      />
    </motion.div>
  );
};

export default TabNotes;








