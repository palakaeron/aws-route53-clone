'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  type = 'info',
  title,
  children,
  onDismiss,
  className = '',
}: AlertProps) {
  const icons = {
    success: <CheckCircle2 size={18} className="aws-alert-icon-success" />,
    error: <AlertCircle size={18} className="aws-alert-icon-error" />,
    info: <Info size={18} className="aws-alert-icon-info" />,
    warning: <AlertTriangle size={18} className="aws-alert-icon-warning" />,
  };

  return (
    <div className={`aws-alert aws-alert-${type} ${className}`} role="alert">
      <div className="aws-alert-icon-wrap">{icons[type]}</div>
      <div className="aws-alert-content">
        {title && <div className="aws-alert-title">{title}</div>}
        <div className="aws-alert-message">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="aws-alert-close"
          onClick={onDismiss}
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
