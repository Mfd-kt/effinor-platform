import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * Composant Avatar amélioré pour afficher les utilisateurs
 * @param {Object} user - Objet utilisateur avec photo_profil_url, full_name, prenom, nom, email
 * @param {string} size - Taille: 'sm' (32px), 'md' (40px), 'lg' (64px), 'xl' (96px)
 * @param {string} className - Classes CSS additionnelles
 */
const UserAvatar = ({ user, size = 'md', className, onClick }) => {
  if (!user) return null;

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl'
  };

  const getAvatarUrl = () => {
    if (user.photo_profil_url || user.avatar_url || user.photo_profil) {
      return user.photo_profil_url || user.avatar_url || user.photo_profil;
    }
    // Générer un avatar avec les initiales
    const name = user.full_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${getBackgroundColor(user)}&color=fff&size=200&bold=true`;
  };

  const getInitials = () => {
    if (user.full_name) {
      const names = user.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      }
      return user.full_name.substring(0, 2).toUpperCase();
    }
    if (user.prenom && user.nom) {
      return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getBackgroundColor = (user) => {
    // Générer une couleur basée sur l'email ou le nom pour la cohérence
    const seed = user.email || user.full_name || user.id || 'default';
    const colors = ['6366f1', '8b5cf6', 'ec4899', 'f43f5e', 'ef4444', 'f97316', 'f59e0b', '10b981', '14b8a6', '06b6d4', '3b82f6', '6366f1'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <Avatar 
      className={cn(sizeClasses[size], className, onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <AvatarImage 
        src={getAvatarUrl()} 
        alt={user.full_name || user.email || 'Avatar'} 
      />
      <AvatarFallback className={cn(
        'bg-secondary-500 text-white font-semibold',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
        size === 'xl' && 'text-xl'
      )}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;




























