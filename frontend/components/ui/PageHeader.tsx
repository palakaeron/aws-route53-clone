'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`aws-page-header ${className}`}>
      <div className="aws-page-header-left">
        <div className="aws-page-header-title-row">
          <h1 className="aws-page-header-title">{title}</h1>
          {badge && <div className="aws-page-header-badge">{badge}</div>}
        </div>
        {description && <p className="aws-page-header-description">{description}</p>}
      </div>

      {actions && <div className="aws-page-header-actions">{actions}</div>}
    </div>
  );
}
