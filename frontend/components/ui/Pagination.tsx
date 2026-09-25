'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/lib/types';
import { Button } from './Button';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}: PaginationProps) {
  const { page, page_size, total, total_pages } = meta;

  const start = total > 0 ? (page - 1) * page_size + 1 : 0;
  const end = Math.min(page * page_size, total);

  return (
    <div className={`aws-pagination-bar ${className}`}>
      <div className="aws-pagination-info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong> items
      </div>

      <div className="aws-pagination-controls">
        {onPageSizeChange && (
          <div className="aws-pagination-size-select">
            <span>Per page:</span>
            <select
              value={page_size}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Select items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="aws-pagination-buttons">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            icon={<ChevronLeft size={16} />}
          />
          <span className="aws-pagination-page-label">
            Page {page} of {total_pages || 1}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= total_pages || total_pages === 0}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            icon={<ChevronRight size={16} />}
          />
        </div>
      </div>
    </div>
  );
}
