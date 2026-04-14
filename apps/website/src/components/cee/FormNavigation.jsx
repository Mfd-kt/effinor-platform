import React from 'react';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { EffinorButton } from '@/components/ds/EffinorButton';

const FormNavigation = ({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  onSubmit, 
  isValid,
  isSubmitting 
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
      <div>
        {!isFirstStep && (
          <EffinorButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onPrevious}
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </EffinorButton>
        )}
      </div>
      <div>
        {isLastStep ? (
          <EffinorButton
            type="button"
            variant="primary"
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
          </EffinorButton>
        ) : (
          <EffinorButton type="button" variant="primary" onClick={onNext} disabled={!isValid}>
            Suivant
            <ChevronRight className="h-4 w-4" />
          </EffinorButton>
        )}
      </div>
    </div>
  );
};

export default FormNavigation;