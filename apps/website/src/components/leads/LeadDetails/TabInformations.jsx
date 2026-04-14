import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ContactSection from './ContactSection';
import CompanySection from './CompanySection';
import WorkSiteSection from './WorkSiteSection';
import BuildingsSection from './BuildingsSection';
import ProjectSection from './ProjectSection';
import QualificationSection from './QualificationSection';
import MessageSection from './MessageSection';
import { Building as BuildingIcon, MapPin, Wrench, User, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Onglet Informations - Organise toutes les sections d'information
 * Utilise des accordéons pour sous-sections
 */
const TabInformations = ({ 
  lead, 
  onCompleteForm,
  autoSave,
  saveImmediately,
  onUpdate 
}) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Section Qualification - Cachée mais fonctionnelle en arrière-plan */}
      <div className="hidden">
        <QualificationSection
          lead={lead}
          onUpdate={onUpdate}
          autoSave={autoSave}
        />
      </div>

      <Accordion type="multiple" defaultValue={['contact', 'message', 'siege', 'site-travaux', 'projet', 'batiments']} className="w-full space-y-4">
        
        {/* Section Contact */}
        <AccordionItem value="contact" className="border border-gray-200 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="text-lg font-semibold text-gray-900">Contact</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ContactSection
              lead={lead}
              onUpdate={onUpdate}
              autoSave={autoSave}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Section Message */}
        <AccordionItem value="message" className="border border-gray-200 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="text-lg font-semibold text-gray-900">Message du client</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <MessageSection
              lead={lead}
              onUpdate={onUpdate}
              autoSave={autoSave}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Section Siège social */}
        <AccordionItem value="siege" className="border border-gray-200 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <BuildingIcon className="h-5 w-5" />
              <span className="text-lg font-semibold text-gray-900">Siège social</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <CompanySection
              lead={lead}
              onUpdate={onUpdate}
              autoSave={autoSave}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Section Site des travaux */}
        <AccordionItem value="site-travaux" className="border border-gray-200 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="text-lg font-semibold text-gray-900">Site des travaux</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <WorkSiteSection
              lead={lead}
              onUpdate={onUpdate}
              autoSave={autoSave}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Section Projet & Technique */}
        <AccordionItem value="projet" className="border border-gray-200 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              <span className="text-lg font-semibold text-gray-900">Projet & Technique</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ProjectSection
              lead={lead}
              onUpdate={onUpdate}
              autoSave={autoSave}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Section Bâtiment */}
        <AccordionItem value="batiments" className="border border-gray-200 rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <span className="text-lg font-semibold text-gray-900">Bâtiment</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <BuildingsSection
              lead={lead}
              onUpdate={onUpdate}
              autoSave={autoSave}
              saveImmediately={saveImmediately}
            />
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </motion.div>
  );
};

export default TabInformations;

