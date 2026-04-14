import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Plus, File, Download, Trash2 } from 'lucide-react';
import DocumentsSection from './DocumentsSection';

/**
 * Onglet Documents
 * Gestion des documents avec upload drag & drop
 */
const TabDocuments = ({ lead, onUpload, onDelete }) => {
  if (!lead) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <DocumentsSection
        lead={lead}
        onUpload={onUpload}
        onDelete={onDelete}
      />
    </motion.div>
  );
};

export default TabDocuments;




















