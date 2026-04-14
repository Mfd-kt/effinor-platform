import React from 'react';
import { cn } from '@/lib/utils';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('enterprise-skeleton animate-pulse bg-gray-200', className)}
      {...props}
    />
  );
};

export default Skeleton;


