import React from 'react';
import { MessageSquare, ClipboardCheck, FileText, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_STEPS = [
  {
    icon: MessageSquare,
    title: 'Votre demande',
    text: 'Formulaire ou échange téléphonique : nous qualifions surface, usage et objectifs.',
  },
  {
    icon: ClipboardCheck,
    title: 'Cohérence technique',
    text: 'Vérification de la faisabilité et alignement avec les opérations / fiches applicables.',
  },
  {
    icon: FileText,
    title: 'Retour structuré',
    text: 'Analyse ou proposition claire : hypothèses, limites, prochaines étapes possibles.',
  },
  {
    icon: Rocket,
    title: 'Suite de dossier',
    text: 'Étude terrain, devis ou montage CEE selon éligibilité — avec le même interlocuteur projet.',
  },
];

/**
 * Parcours type « ce qui se passe après votre message » — crédibilité B2B.
 */
const STEP_GRID = {
  3: 'sm:grid-cols-1 md:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function ServiceProcessSteps({
  title = 'Comment se passe la suite, concrètement',
  subtitle = 'Un processus lisible pour les équipes facility, immobilier ou direction générale.',
  steps = DEFAULT_STEPS,
  className = '',
  /** Nombre de colonnes sur grand écran (3 ou 4). */
  columns = 4,
}) {
  const gridClass = STEP_GRID[columns] || STEP_GRID[4];

  return (
    <section
      className={cn('rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8', className)}
      aria-labelledby="service-process-heading"
    >
      <div className="mb-6 text-center md:text-left">
        <h2 id="service-process-heading" className="heading-section text-gray-900">
          {title}
        </h2>
        {subtitle ? <p className="mt-2 text-sm text-gray-600 md:max-w-2xl">{subtitle}</p> : null}
      </div>
      <ol className={cn('grid gap-4', gridClass)}>
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="relative flex flex-col rounded-xl border border-gray-100 bg-slate-50/80 p-4 text-left"
            >
              <span className="absolute right-3 top-3 text-[10px] font-bold tabular-nums text-gray-300">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-500/15 text-secondary-700">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{step.text}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default ServiceProcessSteps;
