import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Logo Effinor réutilisable
 *
 * Props:
 * - to: route de redirection (optionnel)
 * - showText: affiche ou non le texte "EFFINOR"
 * - text: texte à afficher (par défaut "EFFINOR")
 * - className: classes supplémentaires pour le conteneur
 * - size: "sm" | "md" | "lg" (taille du bloc logo)
 * - textColor: classes Tailwind pour la couleur du texte
 */
const Logo = ({
  to = '/',
  showText = true,
  text = 'EFFINOR',
  className = '',
  size = 'md',
  textColor = 'text-white'
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7 text-xs'
      : size === 'lg'
        ? 'w-10 h-10 text-lg'
        : 'w-8 h-8 text-sm';

  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`flex items-center space-x-2 md:space-x-3 flex-shrink-0 ${className}`}
    >
      <div
        className={`${sizeClasses} bg-[var(--secondary-500)] rounded-lg flex items-center justify-center`}
      >
        <span className="text-white font-bold leading-none">E</span>
      </div>
      {showText && (
        <div className="hidden sm:block">
          <span className={`font-bold ${textColor}`}>{text}</span>
        </div>
      )}
    </Wrapper>
  );
};

export default Logo;















