/**
 * Composant Avatar réutilisable pour afficher les avatars utilisateur
 * 
 * Affiche l'image de profil si disponible, sinon affiche les initiales avec un fond coloré.
 * Compatible avec les données utilisateur de la table `utilisateurs`.
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * @param {Object} props
 * @param {Object} props.user - Objet utilisateur avec photo_profil_url, prenom, nom, full_name, email
 * @param {string} props.size - Taille de l'avatar ('sm' | 'md' | 'lg' | 'xl' | number)
 * @param {string} props.className - Classes CSS supplémentaires
 * @param {string} props.alt - Texte alternatif pour l'image
 */
const UserAvatar = ({ 
  user, 
  size = 'md', 
  className,
  alt 
}) => {
  if (!user) {
    return (
      <Avatar className={cn(getSizeClass(size), className)}>
        <AvatarFallback className="bg-slate-300 text-slate-600">?</AvatarFallback>
      </Avatar>
    );
  }

  // Récupérer l'URL de l'avatar (plusieurs champs possibles)
  const avatarUrl = user.photo_profil_url || user.avatar_url || user.photo_profil || null;

  // Générer les initiales
  const getInitials = () => {
    if (user.full_name) {
      const parts = user.full_name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0]?.toUpperCase() || '?';
    }
    if (user.prenom && user.nom) {
      return ((user.prenom[0] || '') + (user.nom[0] || '')).toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  const initials = getInitials();
  const displayName = user.full_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'Utilisateur';
  const imageAlt = alt || displayName;

  // Générer une couleur de fond basée sur le nom (pour cohérence)
  const getBackgroundColor = () => {
    const name = user.full_name || user.email || 'user';
    const colors = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Avatar className={cn(getSizeClass(size), className)}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={imageAlt}
          className="object-cover"
        />
      )}
      <AvatarFallback className={cn(getBackgroundColor(), 'text-white font-semibold')}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

/**
 * Convertit la taille en classes Tailwind
 */
const getSizeClass = (size) => {
  const sizeMap = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl',
  };

  if (typeof size === 'number') {
    return `h-${size} w-${size}`;
  }

  return sizeMap[size] || sizeMap.md;
};

export default UserAvatar;



















