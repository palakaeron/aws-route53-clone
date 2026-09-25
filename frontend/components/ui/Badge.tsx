'use client';

import React from 'react';

export interface BadgeProps {
  variant?: 'blue' | 'green' | 'orange' | 'gray' | 'red' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'blue', children, className = '' }: BadgeProps) {
  return (
    <span className={`aws-badge aws-badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
