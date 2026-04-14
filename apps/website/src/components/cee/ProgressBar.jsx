import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const ProgressBar = ({ currentStep, totalSteps, stepLabels = [] }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2 gap-2">
        <span className="text-sm font-medium text-gray-700">
          Étape {currentStep} sur {totalSteps}
          {stepLabels[currentStep - 1] ? ` — ${stepLabels[currentStep - 1]}` : ''}
        </span>
        <span className="text-sm font-medium text-[var(--secondary-600)] flex-shrink-0">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3 overflow-hidden">
        <motion.div
          className="bg-[var(--secondary-500)] h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      </div>
      {stepLabels.length > 0 && (
        <div className="hidden sm:flex justify-between mt-3 gap-1">
          {stepLabels.map((label, i) => {
            const step = i + 1;
            return (
              <div key={step} className="flex-1 min-w-0 text-center px-0.5">
                <div
                  className={`text-[10px] md:text-xs font-medium leading-tight ${
                    step <= currentStep ? 'text-[var(--secondary-700)]' : 'text-gray-400'
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex justify-between mt-4 sm:hidden">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                step < currentStep
                  ? 'bg-green-600 text-white'
                  : step === currentStep
                    ? 'bg-[var(--secondary-500)] text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}
            >
              {step < currentStep ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-semibold">{step}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
