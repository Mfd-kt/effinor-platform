import React from 'react';

/**
 * Lien d’évitement (accessibilité) : affiché au focus clavier, invisible au pointeur.
 */
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
    >
      Aller au contenu principal
    </a>
  );
}

export default SkipToMain;
