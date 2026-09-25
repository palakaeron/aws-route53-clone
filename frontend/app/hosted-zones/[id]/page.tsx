'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import RecordForm from '@/components/records/RecordForm';
import RecordTable from '@/components/records/RecordTable';
import { useRecords } from '@/lib/hooks/useRecords';
import { usePagination } from '@/lib/hooks/usePagination';
import { api } from '@/lib/api';
import type { DNSRecord, HostedZone, RecordType } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Plus, RefreshCw } from 'lucide-react';

const RECORD_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All record types' },
  { value: 'A', label: 'A (IPv4)' },
  { value: 'AAAA', label: 'AAAA (IPv6)' },
  { value: 'CNAME', label: 'CNAME (Canonical Name)' },
  { value: 'TXT', label: 'TXT (Text)' },
  { value: 'MX', label: 'MX (Mail Exchange)' },
  { value: 'NS', label: 'NS (Name Server)' },
  { value: 'PTR', label: 'PTR (Pointer)' },
  { value: 'SRV', label: 'SRV (Service Locator)' },
  { value: 'CAA', label: 'CAA (Certification Authority)' },
];

interface PendingDeleteRecord {
  id: number;
  name: string;
  type: string;
}

export default function HostedZoneDetailsPage() {
  const params = useParams();
  const router = useRouter();
  // The URL param is the PUBLIC zone ID (e.g. Z1ABCDEFGHIJKL), not the internal integer PK.
  const zoneId = String(params.id);

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [zoneError, setZoneError] = useState<string | null>(null);

  const {
    page,
    pageSize,
    search,
    debouncedSearch,
    typeFilter,
    setPage,
    setPageSize,
    setSearch,
    setTypeFilter,
  } = usePagination({ initialPageSize: 25 });

  const {
    records,
    meta,
    isLoading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useRecords({
    zoneId: zone?.id ?? zoneId,
    search: debouncedSearch,
    type: typeFilter,
    page,
    pageSize,
  });

  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Load zone metadata by public zone ID ───────────────────────────────────
  const fetchZoneDetails = useCallback(async () => {
    setZoneLoading(true);
    setZoneError(null);
    try {
      const fetchedZone = await api.zones.get(zoneId);
      setZone(fetchedZone);
    } catch (err) {
      setZoneError(err instanceof Error ? err.message : 'Unable to load hosted zone details');
    } finally {
      setZoneLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    if (zoneId) {
      void fetchZoneDetails();
    }
  }, [zoneId, fetchZoneDetails]);

  // ── Record CRUD ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const openEdit = (record: DNSRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleSave = async (payload: {
    name: string;
    type: RecordType;
    value: Record<string, any> | string;
    ttl: number;
    priority: number | null;
  }) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, payload);
    } else {
      await createRecord(payload);
    }
    setFormOpen(false);
    void fetchZoneDetails();
  };

  /**
   * Requests record deletion — opens the ConfirmModal instead of window.confirm().
   */
  const handleDeleteRequest = (record: DNSRecord) => {
    setPendingDelete({ id: record.id, name: record.name, type: record.type });
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteRecord(pendingDelete.id, pendingDelete.name);
      setPendingDelete(null);
      void fetchZoneDetails();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) setPendingDelete(null);
  };

  const handleRefresh = async () => {
    await Promise.all([fetchZoneDetails(), refetchRecords()]);
  };

  // ── Breadcrumbs & metadata ──────────────────────────────────────────────────
  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/hosted-zones' },
    { label: 'Hosted zones', href: '/hosted-zones' },
    { label: zone ? zone.name : zoneId },
  ];

  const hasActiveFilter = Boolean(search || typeFilter);

  return (
    <Shell breadcrumbs={breadcrumbs}>
      {/* ── Zone header ─────────────────────────────────────────────────────── */}
      <PageHeader
        title={zone ? zone.name : 'Hosted zone details'}
        description={
          zone
            ? `Zone ID: ${zone.zone_id}  ·  ${zone.type} hosted zone  ·  ${zone.record_count} record${zone.record_count === 1 ? '' : 's'}`
            : zoneLoading
            ? 'Loading zone details…'
            : zoneError ?? 'Details and DNS records for this hosted zone.'
        }
        badge={
          zone && (
            <Badge variant={zone.type === 'Public' ? 'blue' : 'gray'}>
              {zone.type}
            </Badge>
          )
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon={<RefreshCw size={15} />}
              onClick={() => void handleRefresh()}
              aria-label="Refresh zone and records"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={openCreate}
              disabled={!zone}
            >
              Create record
            </Button>
          </>
        }
      />

      {/* ── Zone metadata card ────────────────────────────────────────────── */}
      {zone && (
        <div className="aws-card" style={{ padding: '14px 20px', marginBottom: 20, fontSize: 13 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px 32px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--aws-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                Hosted zone name
              </div>
              <div style={{ fontWeight: 600 }}>{zone.name}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--aws-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                Hosted zone ID
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{zone.zone_id}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--aws-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                Type
              </div>
              <div>
                <Badge variant={zone.type === 'Public' ? 'blue' : 'gray'}>{zone.type}</Badge>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--aws-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                Record count
              </div>
              <div style={{ fontVariantNumeric: 'tabular-nums' }}>{zone.record_count}</div>
            </div>
            {zone.description && (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--aws-text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  Description
                </div>
                <div style={{ color: 'var(--aws-text-dark)' }}>{zone.description}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search records by name, type, or value"
          />
        </div>

        <div style={{ width: 240 }}>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={RECORD_TYPES}
            aria-label="Filter by record type"
          />
        </div>
      </div>

      {/* ── Records table ─────────────────────────────────────────────────── */}
      <RecordTable
        records={records}
        isLoading={zoneLoading || recordsLoading}
        error={zoneError || recordsError}
        onRetry={() => void handleRefresh()}
        onEdit={openEdit}
        onDelete={handleDeleteRequest}
        meta={meta}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onCreateClick={openCreate}
        hasActiveFilter={hasActiveFilter}
      />

      {/* ── Record form modal ─────────────────────────────────────────────── */}
      <RecordForm
        record={editingRecord}
        defaultName={zone?.name || ''}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      {/* ── Delete confirmation modal — no window.confirm() ──────────────── */}
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete DNS record"
        message={
          <>
            Are you sure you want to delete the{' '}
            <strong>{pendingDelete?.type}</strong> record{' '}
            <strong>{pendingDelete?.name}</strong>?
          </>
        }
        warning="This action cannot be undone and DNS resolvers will cease routing requests to this target."
        confirmLabel="Delete record"
        cancelLabel="Cancel"
        danger
        isLoading={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={handleDeleteCancel}
      />
    </Shell>
  );
}
