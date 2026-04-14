import React, { useState, useEffect } from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Label } from '@/components/ui/label';
    import { Slider } from '@/components/ui/slider';
    import { Package, Wallet } from 'lucide-react';

    const CEEEstimator = () => {
      const [surface, setSurface] = useState(100);
      const [estimatedAmount, setEstimatedAmount] = useState(0);
      const [unitsNeeded, setUnitsNeeded] = useState(0);
      const [remainingCost, setRemainingCost] = useState(0);
      
      const CEE_PER_SQM = 3.479;
      const COVERAGE_PER_UNIT = 1550;
      const UNIT_PRICE = 3500;

      useEffect(() => {
        const prime = surface * CEE_PER_SQM;
        const needed = Math.ceil(surface / COVERAGE_PER_UNIT);
        const totalCost = needed * UNIT_PRICE;
        const calculatedRemainingCost = Math.max(0, totalCost - prime);

        setEstimatedAmount(prime);
        setUnitsNeeded(needed);
        setRemainingCost(calculatedRemainingCost);
      }, [surface]);

      return (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-primary dark:text-emerald-400">Estimez votre aide CEE</CardTitle>
            <CardDescription>Entrez la surface de votre serre pour obtenir une estimation du montant de la prime et du reste à charge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="surface-estimator" className="text-slate-700 dark:text-slate-300">Surface de la serre (m²): {surface} m²</Label>
              <Slider
                id="surface-estimator"
                min={50}
                max={5000}
                step={50}
                value={[surface]}
                onValueChange={(value) => setSurface(value[0])}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Montant estimé de l'aide :</p>
                <p className="text-4xl font-bold gradient-text">
                  {estimatedAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">(Estimation indicative)</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4">
                 <p className="text-slate-600 dark:text-slate-400 mb-2">Unités nécessaires :</p>
                 <div className="flex items-center gap-2">
                    <Package className="h-8 w-8 text-primary dark:text-emerald-400" />
                    <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{unitsNeeded}</p>
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">1 unité couvre {COVERAGE_PER_UNIT} m²</p>
              </div>
            </div>
             <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-center">
                <p className="text-slate-600 dark:text-slate-400">Reste à charge estimé :</p>
                <div className="flex items-center justify-center gap-3">
                   <Wallet className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                   <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                     {remainingCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                   </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">(Coût équipement - Aide CEE)</p>
            </div>
          </CardContent>
        </Card>
      );
    };

    export default CEEEstimator;