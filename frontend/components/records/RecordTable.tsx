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
  /**
   * Receives the full DNSRecord so the caller can build a rich
   * confirmation dialog (type, name, etc.) without window.confirm().
   */
  onDelete: (record: DNSRecord) => void;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onCreateClick?: () => void;
}

const typeBadgeMap: Record<string, 'blue' | 'green' | 'orange' | 'purple' | 'gray' | 'red'> = {
  A: 'blue',
  AAAA: 'purple',
  CNAME: 'green',
  TXT: 'gray',
  MX: 'orange',
  NS: 'blue',
  PTR: 'gray',
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
}: RecordTableProps) {
  const columns: Column<DNSRecord>[] = [
    {
      key: 'name',
      header: 'Record name',
      cell: (rec) => <span style={{ fontWeight: 600 }}>{rec.name}</span>,
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
      header: 'Value / Target',
      cell: (rec) => (
        <span
          style={{
            maxWidth: 380,
            wordBreak: 'break-all',
            display: 'inline-block',
            fontSize: 12,
            fontFamily: rec.type === 'A' || rec.type === 'AAAA' ? 'monospace' : 'inherit',
          }}
        >
          {rec.value}
        </span>
      ),
    },
    {
      key: 'ttl',
      header: 'TTL (s)',
      cell: (rec) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{rec.ttl}</span>
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
      emptyTitle="No DNS records found"
      emptyDescription="Create a record to define how you want to route traffic for this domain."
      emptyActionLabel="Create record"
      onEmptyAction={onCreateClick}
      meta={meta}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
