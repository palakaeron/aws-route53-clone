'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'An error occurred',
  message = 'Unable to load data from the backend. Please verify your connection or sign in again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="aws-error-state">
      <div className="aws-error-icon">
        <AlertTriangle size={36} />
      </div>
      <h3 className="aws-error-title">{title}</h3>
      <p className="aws-error-desc">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
