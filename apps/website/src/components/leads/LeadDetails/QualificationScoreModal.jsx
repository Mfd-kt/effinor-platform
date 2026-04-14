import React from 'react';
import { X, TrendingUp, Database, Target, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * Modal to display detailed qualification score breakdown
 */
const QualificationScoreModal = ({ open, onOpenChange, breakdown, score }) => {
  if (!breakdown) return null;

  const { total, level, pillars, reasons } = breakdown || {};

  const levelConfig = {
    non_qualifie: { label: 'Non qualifié', color: 'bg-red-100 text-red-700 border-red-300', description: 'Lead à compléter ou hors cible' },
    a_explorer: { label: 'À explorer', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', description: 'Lead prometteur nécessitant un suivi' },
    qualifie: { label: 'Qualifié', color: 'bg-blue-100 text-blue-700 border-blue-300', description: 'Lead bien qualifié, prêt pour proposition' },
    tres_qualifie: { label: 'Très qualifié', color: 'bg-green-100 text-green-700 border-green-300', description: 'Lead très qualifié, priorité haute' }
  };

  const pillarConfig = {
    data_quality: { 
      label: 'Données & Contactabilité', 
      icon: Database, 
      color: 'bg-blue-500',
      max: 25,
      description: 'Qualité des informations de contact et de l\'entreprise'
    },
    project_potential: { 
      label: 'Projet & Potentiel CEE', 
      icon: Target, 
      color: 'bg-green-500',
      max: 35,
      description: 'Potentiel du projet et montant CEE estimé'
    },
    engagement: { 
      label: 'Engagement & Timing', 
      icon: Clock, 
      color: 'bg-yellow-500',
      max: 25,
      description: 'Activité récente et avancement dans le pipeline'
    },
    strategic_fit: { 
      label: 'Fit Stratégique & Risques', 
      icon: TrendingUp, 
      color: 'bg-purple-500',
      max: 15,
      description: 'Adéquation avec la cible et détection de risques'
    }
  };

  const currentLevel = levelConfig[level] || levelConfig.non_qualifie;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white",
                currentLevel.color.replace('bg-', 'bg-').split(' ')[0]
              )}>
                {total || score || 0}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <Badge variant="outline" className={cn("border-2", currentLevel.color)}>
                  {currentLevel.label}
                </Badge>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Score de Qualification</h2>
              <p className="text-sm text-gray-500 mt-1">{currentLevel.description}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Détail du calcul du score de qualification basé sur 4 piliers principaux
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Total Score */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-900">Score Total</span>
              <span className="text-3xl font-bold text-gray-900">{total || score || 0}/100</span>
            </div>
            <Progress value={total || score || 0} className="h-3" />
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(pillars || {}).map(([key, value]) => {
              const config = pillarConfig[key];
              if (!config) return null;
              
              const Icon = config.icon;
              const percentage = (value / config.max) * 100;
              
              return (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", config.color)}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{config.label}</h3>
                        <p className="text-xs text-gray-500">{config.description}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {value}/{config.max}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {percentage.toFixed(0)}% de complétion
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reasons */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Détails du score</h3>
            </div>
            <div className="space-y-2">
              {(reasons || []).length > 0 ? (
                reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {reason.includes('valide') || reason.includes('complète') || 
                     reason.includes('CEE') || reason.includes('opération') ||
                     reason.includes('récente') ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-gray-700">{reason}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Aucun détail disponible</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QualificationScoreModal;



























