import React from 'react';

/**
 * Section rhythm wrapper for Trust-First landing.
 * Variants: page (#FFF) | soft (#F6F8FB) | panel (#EEF2F6) | hero (subtle gradient).
 * Use alternating variants to avoid flat white and create visual hierarchy.
 *
 * Quick checklist (CRO / visuel):
 * - Contraste: texte gris foncé sur fond clair (section-*); pas de texte clair sur fond clair.
 * - Profondeur: cartes avec shadow-section-card + border border-gray-200.
 * - CTA dominance: boutons principaux restent bg-orange-500 (une seule couleur forte).
 * - Rythme: pas plus de 3 sections consécutives avec le même variant.
 */
const VARIANT_CLASSES = {
  page: 'bg-section-page',
  soft: 'bg-section-soft',
  panel: 'bg-section-panel',
  hero: 'bg-section-hero bg-[length:100%_auto] bg-no-repeat',
};

const PADDING_CLASSES = {
  default: 'py-12 md:py-16',
  tight: 'py-6',
};

const Section = ({ variant = 'page', id, tight, className = '', children, ...rest }) => {
  const bgClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.page;
  const paddingClass = tight ? PADDING_CLASSES.tight : PADDING_CLASSES.default;
  const combined = [bgClass, paddingClass, className].filter(Boolean).join(' ');

  return (
    <section id={id} className={combined} {...rest}>
      {children}
    </section>
  );
};

export default Section;
