import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Section Qualification avec checklist interactive et score temps réel
 */
const QualificationSection = ({ lead, onUpdate, autoSave }) => {
  const [checklist, setChecklist] = useState({
    telephone_verifie: !!lead.telephone,
    email_verifie: !!lead.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email),
    siret_verifie: !!lead.siret && lead.siret.replace(/\s/g, '').length === 14,
    besoin_qualifie: !!lead.type_projet,
    budget_confirme: !!lead.budget_estime,
    decideur_identifie: !!lead.poste,
    visite_planifiee: !!lead.date_installation_souhaitee
  });

  // Calculate score
  const score = useMemo(() => {
    const checks = Object.values(checklist);
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [checklist]);

  // Auto-save checklist changes - only when checklist actually changes, not when lead changes
  const previousChecklistRef = React.useRef(JSON.stringify(checklist));
  
  useEffect(() => {
    // Only save if checklist actually changed (not just because lead was updated)
    const currentChecklistStr = JSON.stringify(checklist);
    if (previousChecklistRef.current !== currentChecklistStr && autoSave && lead) {
      previousChecklistRef.current = currentChecklistStr;
      const currentCustomFields = lead.custom_fields || {};
      autoSave('custom_fields', {
        ...currentCustomFields,
        qualification_checklist: checklist
      });
    }
  }, [checklist, autoSave]); // Remove lead from dependencies to avoid infinite loop

  const handleToggle = (key) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const qualificationItems = [
    { key: 'telephone_verifie', label: 'Téléphone vérifié', icon: CheckCircle2 },
    { key: 'email_verifie', label: 'Email vérifié', icon: CheckCircle2 },
    { key: 'siret_verifie', label: 'SIRET vérifié', icon: CheckCircle2 },
    { key: 'besoin_qualifie', label: 'Besoin qualifié', icon: CheckCircle2 },
    { key: 'budget_confirme', label: 'Budget confirmé', icon: CheckCircle2 },
    { key: 'decideur_identifie', label: 'Décideur identifié', icon: CheckCircle2 },
    { key: 'visite_planifiee', label: 'Visite technique planifiée', icon: CheckCircle2 }
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = qualificationItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Accordion type="single" collapsible defaultValue="qualification" className="w-full">
        <AccordionItem value="qualification">
          <AccordionTrigger className="text-lg font-semibold text-gray-900">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Qualification
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({completedCount}/{totalCount})
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                {/* Score Display */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Score de Qualification</span>
                    <span className={cn(
                      'text-2xl font-bold',
                      score >= 70 ? 'text-green-600' :
                      score >= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    )}>
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      className={cn(
                        'h-3 rounded-full transition-colors duration-300',
                        score >= 70 ? 'bg-green-500' :
                        score >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                  {qualificationItems.map((item, index) => {
                    const isChecked = checklist[item.key];
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
                          isChecked
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        )}
                        onClick={() => handleToggle(item.key)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggle(item.key)}
                          className="h-5 w-5"
                        />
                        <Icon className={cn(
                          'h-5 w-5',
                          isChecked ? 'text-green-600' : 'text-gray-400'
                        )} />
                        <span className={cn(
                          'flex-1 font-medium',
                          isChecked ? 'text-green-900' : 'text-gray-700'
                        )}>
                          {item.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress Text */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    {completedCount === totalCount
                      ? '✅ Qualification complète !'
                      : `${totalCount - completedCount} critère(s) restant(s) pour compléter la qualification.`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default QualificationSection;

