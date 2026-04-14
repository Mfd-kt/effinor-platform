import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, FileText, CheckCircle2, XCircle, User, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import UserAvatar from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';

/**
 * Item d'activité avec icône, avatar, timestamp relatif, contenu formaté
 */
const ActivityItem = ({ activity, index = 0 }) => {
  // Get icon by activity type
  const getActivityIcon = (type) => {
    const iconMap = {
      appel: Phone,
      email: Mail,
      note: FileText,
      document: FileText,
      statut: CheckCircle2,
      assignation: User,
      default: Clock
    };
    return iconMap[type] || iconMap.default;
  };

  // Get icon color
  const getIconColor = (type) => {
    const colorMap = {
      appel: 'text-green-500 bg-green-50',
      email: 'text-blue-500 bg-blue-50',
      note: 'text-purple-500 bg-purple-50',
      document: 'text-gray-500 bg-gray-50',
      statut: 'text-yellow-500 bg-yellow-50',
      assignation: 'text-sky-500 bg-sky-50',
      default: 'text-gray-500 bg-gray-50'
    };
    return colorMap[type] || colorMap.default;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
      } else if (days === 1) {
        return 'Hier';
      } else if (days < 7) {
        return format(date, 'EEEE', { locale: fr });
      } else {
        return format(date, 'dd/MM/yyyy', { locale: fr });
      }
    } catch (e) {
      return '';
    }
  };

  const Icon = getActivityIcon(activity.type || 'default');
  const iconColorClass = getIconColor(activity.type || 'default');
  const user = activity.user || activity.utilisateur || {};

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        iconColorClass
      )}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          {user && (
            <UserAvatar
              user={user}
              size="sm"
            />
          )}
          <span className="text-sm font-medium text-gray-900">
            {user.prenom && user.nom
              ? `${user.prenom} ${user.nom}`
              : user.email || 'Utilisateur'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(activity.timestamp || activity.created_at)}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {activity.description || activity.note || activity.message || 'Activité'}
        </p>

        {/* Metadata */}
        {activity.metadata && (
          <div className="mt-2 text-xs text-gray-500">
            {activity.metadata.duration && `Durée: ${activity.metadata.duration}`}
            {activity.metadata.status && ` • Statut: ${activity.metadata.status}`}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityItem;



























