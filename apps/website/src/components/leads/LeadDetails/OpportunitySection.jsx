import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Euro, TrendingUp, Calculator, Edit, Save, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Section Opportunité CEE avec montant estimé et calculateur
 */
const OpportunitySection = ({ lead, onUpdate, autoSave }) => {
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountValue, setAmountValue] = useState(lead.montant_cee_estime || 0);

  const formatAmount = (amount) => {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSaveAmount = () => {
    autoSave?.('montant_cee_estime', parseFloat(amountValue) || 0);
    setEditingAmount(false);
  };

  const handleCancelEdit = () => {
    setAmountValue(lead.montant_cee_estime || 0);
    setEditingAmount(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Accordion type="single" collapsible defaultValue="opportunity" className="w-full">
        <AccordionItem value="opportunity">
          <AccordionTrigger className="text-lg font-semibold text-gray-900">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Opportunité CEE
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                {/* Montant CEE Estimé en grand */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Montant CEE Estimé
                  </label>
                  {editingAmount ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={amountValue}
                          onChange={(e) => setAmountValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveAmount();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="text-3xl font-bold text-green-600"
                          autoFocus
                        />
                      </div>
                      <Button size="sm" onClick={handleSaveAmount}>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 cursor-pointer hover:border-green-300 transition-colors group"
                      onDoubleClick={() => setEditingAmount(true)}
                      title="Double-clic pour éditer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-4xl font-bold text-green-600 mb-2">
                            {formatAmount(lead.montant_cee_estime)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingUp className="h-4 w-4" />
                            Potentiel d'économie
                          </div>
                        </div>
                        <Edit className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculateur CEE - Placeholder */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Calculateur CEE</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p>Le calculateur CEE sera intégré ici.</p>
                    <p className="mt-2 text-xs">
                      Basé sur: Surface {lead.surface_m2 || '-'} m², Type: {lead.type_batiment || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default OpportunitySection;



























