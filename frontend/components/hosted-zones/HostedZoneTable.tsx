'use client';

import React from 'react';
import Link from 'next/link';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import type { HostedZone, PaginationMeta } from '@/lib/types';
import { DataTable, Column } from '../ui/DataTable';
import { Badge } from '../ui/Badge';
import { ActionMenu } from '../ui/ActionMenu';

export interface HostedZoneTableProps {
  zones: HostedZone[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit: (zone: HostedZone) => void;
  onDelete: (id: number, name: string) => void;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onCreateClick?: () => void;
}

export default function HostedZoneTable({
  zones,
  isLoading = false,
  error = null,
  onRetry,
  onEdit,
  onDelete,
  meta,
  onPageChange,
  onPageSizeChange,
  onCreateClick,
}: HostedZoneTableProps) {
  const columns: Column<HostedZone>[] = [
    {
      key: 'name',
      header: 'Domain name',
      cell: (zone) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link href={`/hosted-zones/${zone.zone_id}`} className="aws-breadcrumbs-link" style={{ fontWeight: 600 }}>
            {zone.name}
          </Link>
          <span style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>ID: {zone.zone_id}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (zone) => (
        <Badge variant={zone.type === 'Public' ? 'blue' : 'gray'}>
          {zone.type}
        </Badge>
      ),
    },
    {
      key: 'record_count',
      header: 'Records',
      cell: (zone) => zone.record_count || 0,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (zone) => zone.description || '—',
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (zone) =>
        zone.created_at ? new Date(zone.created_at).toLocaleDateString() : '—',
    },
    {
      key: 'actions',
      header: '',
      className: 'aws-text-right',
      cell: (zone) => (
        <ActionMenu
          items={[
            {
              label: 'View records',
              icon: <ExternalLink size={14} />,
              onClick: () => {
                window.location.href = `/hosted-zones/${zone.zone_id}`;
              },
            },
            {
              label: 'Edit details',
              icon: <Edit2 size={14} />,
              onClick: () => onEdit(zone),
            },
            {
              label: 'Delete zone',
              icon: <Trash2 size={14} />,
              danger: true,
              onClick: () => onDelete(zone.id, zone.name),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={zones}
      keyExtractor={(zone) => zone.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No hosted zones found"
      emptyDescription="Create a hosted zone to start routing traffic for your domain."
      emptyActionLabel="Create hosted zone"
      onEmptyAction={onCreateClick}
      meta={meta}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
