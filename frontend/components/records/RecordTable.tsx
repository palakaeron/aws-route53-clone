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
  onDelete: (id: number, name: string) => void;
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
        <span style={{ maxWidth: 420, wordBreak: 'break-all', display: 'inline-block' }}>
          {rec.value}
        </span>
      ),
    },
    {
      key: 'ttl',
      header: 'TTL (seconds)',
      cell: (rec) => rec.ttl,
    },
    {
      key: 'priority',
      header: 'Priority',
      cell: (rec) => (rec.priority != null ? rec.priority : '—'),
    },
    {
      key: 'actions',
      header: '',
      className: 'aws-text-right',
      cell: (rec) => (
        <ActionMenu
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
              onClick: () => onDelete(rec.id, rec.name),
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
