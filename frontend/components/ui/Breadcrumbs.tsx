'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`aws-breadcrumbs ${className}`} aria-label="Breadcrumb">
      <ol className="aws-breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="aws-breadcrumbs-item">
              {index > 0 && <ChevronRight size={14} className="aws-breadcrumbs-separator" />}
              {isLast || !item.href ? (
                <span className="aws-breadcrumbs-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="aws-breadcrumbs-link">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
