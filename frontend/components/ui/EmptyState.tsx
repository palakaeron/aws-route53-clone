'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No resources found',
  description = 'There are no items matching your criteria.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="aws-empty-state">
      <div className="aws-empty-icon">{icon || <Inbox size={36} />}</div>
      <h3 className="aws-empty-title">{title}</h3>
      {description && <p className="aws-empty-desc">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="aws-empty-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
