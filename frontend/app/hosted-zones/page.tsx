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
import { Plus } from 'lucide-react';
import type { HostedZone, ZoneType } from '@/lib/types';

export default function HostedZonesPage() {
  const { page, pageSize, search, debouncedSearch, setPage, setPageSize, setSearch } =
    usePagination({ initialPageSize: 10 });

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

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete hosted zone '${name}'? This action cannot be undone.`)) {
      return;
    }
    await deleteZone(id, name);
  };

  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/hosted-zones' },
    { label: 'Hosted zones' },
  ];

  return (
    <Shell breadcrumbs={breadcrumbs}>
      <PageHeader
        title="Hosted zones"
        description="A hosted zone is a container for records that define how you want to route traffic for a domain and its subdomains."
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Create hosted zone
          </Button>
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
        onDelete={handleDelete}
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
    </Shell>
  );
}
