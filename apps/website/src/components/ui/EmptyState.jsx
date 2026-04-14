import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel,
  className 
}) => {
  return (
    <div className={cn('enterprise-empty-state', className)}>
      {Icon && (
        <div className="enterprise-empty-state-icon">
          <Icon className="w-full h-full text-gray-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="enterprise-empty-state-title">{title}</h3>
      {description && (
        <p className="enterprise-empty-state-description">{description}</p>
      )}
      {action && actionLabel && (
        <Button
          onClick={action}
          className="mt-6 bg-secondary-500 hover:bg-secondary-600 shadow-lg hover:shadow-xl transition-all"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;




























