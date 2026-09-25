'use client';

import React, { useState } from 'react';
import Shell from '@/components/Shell';
import HostedZoneForm from '@/components/hosted-zones/HostedZoneForm';
import HostedZoneTable from '@/components/hosted-zones/HostedZoneTable';
import { useHostedZones } from '@/lib/hooks/useHostedZones';
import { usePagination } from '@/lib/hooks/usePagination';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Plus, RefreshCw } from 'lucide-react';
import type { HostedZone, ZoneType } from '@/lib/types';

interface PendingDelete {
  id: number;
  name: string;
  zone_id: string;
  record_count: number;
}

export default function HostedZonesPage() {
  const { page, pageSize, search, debouncedSearch, setPage, setPageSize, setSearch } =
    usePagination({ initialPageSize: 25 });

  const {
    zones,
    meta,
    isLoading,
    error,
    refetch,
    createZone,
    updateZone,
    deleteZone,
  } = useHostedZones({
    search: debouncedSearch,
    page,
    pageSize,
  });

  const [editingZone, setEditingZone] = useState<HostedZone | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditingZone(null);
    setFormOpen(true);
  };

  const openEdit = (zone: HostedZone) => {
    setEditingZone(zone);
    setFormOpen(true);
  };

  const handleSave = async (payload: { name: string; type: ZoneType; description: string }) => {
    if (editingZone) {
      await updateZone(editingZone.id, payload);
    } else {
      await createZone(payload);
    }
    setFormOpen(false);
  };

  /**
   * Opens the Modal-based delete confirmation instead of window.confirm().
   */
  const handleDeleteRequest = (zone: HostedZone) => {
    setPendingDelete({
      id: zone.id,
      name: zone.name,
      zone_id: zone.zone_id,
      record_count: zone.record_count ?? 0,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteZone(pendingDelete.id, pendingDelete.name);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) setPendingDelete(null);
  };

  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/hosted-zones' },
    { label: 'Hosted zones' },
  ];

  const deleteWarning =
    pendingDelete && pendingDelete.record_count > 0
      ? `This hosted zone contains ${pendingDelete.record_count} DNS record${pendingDelete.record_count === 1 ? '' : 's'}. All associated records will be permanently deleted.`
      : 'This action cannot be undone.';

  return (
    <Shell breadcrumbs={breadcrumbs}>
      <PageHeader
        title="Hosted zones"
        description="A hosted zone is a container for records that define how you want to route traffic for a domain and its subdomains."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<RefreshCw size={15} />}
              onClick={() => void refetch()}
              aria-label="Refresh hosted zones"
            >
              Refresh
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Create hosted zone
            </Button>
          </>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search hosted zones by domain name"
        />
      </div>

      <HostedZoneTable
        zones={zones}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        onEdit={openEdit}
        onDelete={handleDeleteRequest}
        meta={meta}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onCreateClick={openCreate}
      />

      <HostedZoneForm
        zone={editingZone}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirmation — uses Modal, not window.confirm() */}
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete hosted zone"
        message={
          <>
            Are you sure you want to delete the hosted zone{' '}
            <strong>{pendingDelete?.name}</strong> (
            <code style={{ fontSize: 12 }}>{pendingDelete?.zone_id}</code>)?
          </>
        }
        warning={deleteWarning}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        isLoading={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={handleDeleteCancel}
      />
    </Shell>
  );
}
