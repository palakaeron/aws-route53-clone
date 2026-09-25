'use client';

import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { DNSRecord, PaginationMeta } from '@/lib/types';
import { DataTable, Column } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { ActionMenu } from '../ui/ActionMenu';

export interface RecordTableProps {
  records: DNSRecord[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit: (record: DNSRecord) => void;
  onDelete: (record: DNSRecord) => void;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onCreateClick?: () => void;
  hasActiveFilter?: boolean;
}

const typeBadgeMap: Record<string, 'blue' | 'purple' | 'gray' | 'orange' | 'green' | 'red'> = {
  A: 'blue',
  AAAA: 'purple',
  CNAME: 'green',
  TXT: 'gray',
  MX: 'orange',
  NS: 'blue',
  PTR: 'green',
  SRV: 'orange',
  CAA: 'gray',
};

export default function RecordTable({
  records,
  isLoading = false,
  error = null,
  onRetry,
  onEdit,
  onDelete,
  meta,
  onPageChange,
  onPageSizeChange,
  onCreateClick,
  hasActiveFilter = false,
}: RecordTableProps) {
  const columns: Column<DNSRecord>[] = [
    {
      key: 'name',
      header: 'Record name',
      cell: (rec) => (
        <span style={{ fontWeight: 600, color: 'var(--aws-text-dark)' }}>
          {rec.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (rec) => (
        <Badge variant={typeBadgeMap[rec.type] || 'gray'}>
          {rec.type}
        </Badge>
      ),
    },
    {
      key: 'value',
      header: 'Value / Routing data',
      cell: (rec) => (
        <span
          style={{
            maxWidth: 420,
            wordBreak: 'break-all',
            display: 'inline-block',
            fontSize: 12,
            fontFamily:
              rec.type === 'A' || rec.type === 'AAAA' ? 'monospace' : 'inherit',
          }}
        >
          {rec.value}
        </span>
      ),
    },
    {
      key: 'ttl',
      header: 'TTL (seconds)',
      cell: (rec) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{rec.ttl}s</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      cell: (rec) =>
        rec.priority != null ? (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{rec.priority}</span>
        ) : (
          <span style={{ color: 'var(--aws-text-muted)' }}>—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'aws-text-right',
      cell: (rec) => (
        <ActionMenu
          ariaLabel={`Actions for ${rec.name} (${rec.type})`}
          items={[
            {
              label: 'Edit record',
              icon: <Edit2 size={14} />,
              onClick: () => onEdit(rec),
            },
            {
              label: 'Delete record',
              icon: <Trash2 size={14} />,
              danger: true,
              onClick: () => onDelete(rec),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      keyExtractor={(rec) => rec.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle={hasActiveFilter ? 'No matching records found' : 'No DNS records in this zone'}
      emptyDescription={
        hasActiveFilter
          ? 'No records matched your search query or filter. Try clearing the search or record type filter.'
          : 'Create a record to define how you want to route traffic for your domain.'
      }
      emptyActionLabel={hasActiveFilter ? undefined : 'Create record'}
      onEmptyAction={hasActiveFilter ? undefined : onCreateClick}
      meta={meta}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
