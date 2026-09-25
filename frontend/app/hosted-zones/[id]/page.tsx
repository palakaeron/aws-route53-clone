'use client';

import React, { useState, useEffect } from 'react';
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
import { Plus } from 'lucide-react';

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
  { value: 'CAA', label: 'CAA (Certification Authority Authorization)' },
];

export default function HostedZoneDetailsPage() {
  const params = useParams();
  const router = useRouter();
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
    zoneId: zone?.id || zoneId,
    search: debouncedSearch,
    type: typeFilter,
    page,
    pageSize,
  });

  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    async function loadZone() {
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
    }
    if (zoneId) {
      void loadZone();
    }
  }, [zoneId]);

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
    value: string;
    ttl: number;
    priority: number | null;
  }) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, payload);
    } else {
      await createRecord(payload);
    }
    setFormOpen(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete DNS record '${name}'?`)) {
      return;
    }
    await deleteRecord(id, name);
  };

  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/hosted-zones' },
    { label: 'Hosted zones', href: '/hosted-zones' },
    { label: zone ? zone.name : zoneId },
  ];

  return (
    <Shell breadcrumbs={breadcrumbs}>
      <PageHeader
        title={zone ? zone.name : 'Hosted zone details'}
        description={
          zone
            ? `Hosted zone ID: ${zone.zone_id} · ${zone.type} zone · ${zone.record_count} total records`
            : 'Details and DNS records for this hosted zone.'
        }
        badge={zone && <Badge variant={zone.type === 'Public' ? 'blue' : 'gray'}>{zone.type}</Badge>}
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate} disabled={!zone}>
            Create record
          </Button>
        }
      />

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

        <div style={{ width: 220 }}>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={RECORD_TYPES}
          />
        </div>
      </div>

      <RecordTable
        records={records}
        isLoading={zoneLoading || recordsLoading}
        error={zoneError || recordsError}
        onRetry={() => {
          refetchRecords();
        }}
        onEdit={openEdit}
        onDelete={handleDelete}
        meta={meta}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onCreateClick={openCreate}
      />

      <RecordForm
        record={editingRecord}
        defaultName={zone?.name || ''}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </Shell>
  );
}
