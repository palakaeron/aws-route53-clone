'use client';

import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = 'aws-btn';
  const variantClass = `aws-btn-${variant}`;
  const sizeClass = `aws-btn-${size}`;

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="aws-btn-spinner-wrap">
          <Spinner size={size === 'sm' ? 14 : 16} />
          {children && <span>{children}</span>}
        </span>
      ) : (
        <>
          {icon && <span className="aws-btn-icon">{icon}</span>}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
}
