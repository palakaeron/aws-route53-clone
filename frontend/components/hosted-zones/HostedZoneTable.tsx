'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  /** Receive the full zone object so the page can display detailed context in
   * the ConfirmModal (record count, zone_id, etc.). */
  onDelete: (zone: HostedZone) => void;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onCreateClick?: () => void;
}

/**
 * Formats an ISO date string into a short, localised date.
 * Falls back to a dash when no date is provided.
 */
function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
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
  const router = useRouter();

  const columns: Column<HostedZone>[] = [
    {
      key: 'name',
      header: 'Domain name',
      cell: (zone) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Use the public zone_id for navigation — not the internal integer id */}
          <Link
            href={`/hosted-zones/${zone.zone_id}`}
            className="aws-breadcrumbs-link"
            style={{ fontWeight: 600 }}
          >
            {zone.name}
          </Link>
          <span style={{ fontSize: 11, color: 'var(--aws-text-muted)', fontFamily: 'monospace' }}>
            {zone.zone_id}
          </span>
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
      header: 'Record count',
      cell: (zone) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {zone.record_count ?? 0}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (zone) => (
        <span style={{ color: zone.description ? 'var(--aws-text-dark)' : 'var(--aws-text-muted)' }}>
          {zone.description || '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (zone) => (
        <span style={{ whiteSpace: 'nowrap', color: 'var(--aws-text-muted)', fontSize: 12 }}>
          {formatDate(zone.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'aws-text-right',
      cell: (zone) => (
        <ActionMenu
          ariaLabel={`Actions for ${zone.name}`}
          items={[
            {
              label: 'View records',
              icon: <ExternalLink size={14} />,
              onClick: () => router.push(`/hosted-zones/${zone.zone_id}`),
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
              onClick: () => onDelete(zone),
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
      emptyDescription={
        'Create a hosted zone to start routing traffic for your domain.'
      }
      emptyActionLabel="Create hosted zone"
      onEmptyAction={onCreateClick}
      meta={meta}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
