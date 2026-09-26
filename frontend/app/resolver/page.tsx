'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Shell from '@/components/Shell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/lib/hooks/useToast';
import { api, ApiError } from '@/lib/api';
import { Network, Plus, Trash2, Edit3, Search, RefreshCw } from 'lucide-react';
import type { ResolverEndpoint } from '@/lib/types';

export default function ResolverPage() {
  const [items, setItems] = useState<ResolverEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ResolverEndpoint | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDirection, setFormDirection] = useState('Inbound');
  const [formStatus, setFormStatus] = useState('Operational');
  const [formIps, setFormIps] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.resolverEndpoints.list({ search, direction: directionFilter });
      setItems(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load resolver endpoints.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [directionFilter, search, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setFormName('');
    setFormDirection('Inbound');
    setFormStatus('Operational');
    setFormIps('10.0.1.10, 10.0.2.10');
    setFormDescription('');
    setCreateOpen(true);
  };

  const openEdit = (item: ResolverEndpoint) => {
    setEditItem(item);
    setFormName(item.name);
    setFormDirection(item.direction);
    setFormStatus(item.status);
    setFormIps(Array.isArray(item.ip_addresses) ? item.ip_addresses.join(', ') : '');
    setFormDescription(item.description);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);
    const ipList = formIps.split(',').map((ip) => ip.trim()).filter(Boolean);
    try {
      await api.resolverEndpoints.create({
        name: formName.trim(),
        direction: formDirection,
        status: formStatus,
        ip_addresses: ipList,
        description: formDescription,
      });
      toast('Resolver endpoint created successfully.', 'success');
      setCreateOpen(false);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create resolver endpoint.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !formName.trim()) return;
    setIsSubmitting(true);
    const ipList = formIps.split(',').map((ip) => ip.trim()).filter(Boolean);
    try {
      await api.resolverEndpoints.update(editItem.id, {
        name: formName.trim(),
        direction: formDirection,
        status: formStatus,
        ip_addresses: ipList,
        description: formDescription,
      });
      toast('Resolver endpoint updated successfully.', 'success');
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update resolver endpoint.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await api.resolverEndpoints.delete(deleteId);
      toast('Resolver endpoint deleted.', 'info');
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete resolver endpoint.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items;

  const columns: Column<ResolverEndpoint>[] = [
    {
      key: 'name',
      header: 'Endpoint Name',
      cell: (item) => (
        <div>
          <strong style={{ color: 'var(--aws-text-dark)', display: 'block' }}>{item.name}</strong>
          <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{item.description || 'No description'}</span>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      cell: (item) => (
        <Badge variant={item.direction === 'Inbound' ? 'purple' : 'blue'}>
          {item.direction}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={item.status === 'Operational' ? 'green' : 'orange'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'ip_addresses',
      header: 'Assigned IP Addresses',
      cell: (item) => (
        <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {Array.isArray(item.ip_addresses) && item.ip_addresses.length > 0 ? (
            item.ip_addresses.map((ip) => (
              <span
                key={ip}
                style={{
                  display: 'inline-block',
                  background: 'var(--aws-bg-subtle)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  marginRight: 4,
                }}
              >
                {ip}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--aws-text-muted)' }}>None assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'aws-text-right',
      cell: (item) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" icon={<Edit3 size={12} />} onClick={() => openEdit(item)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => setDeleteId(item.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Shell
      breadcrumbs={[
        { label: 'AWS Console', href: '/' },
        { label: 'Route 53', href: '/' },
        { label: 'Resolver' },
      ]}
    >
      <PageHeader
        title="Route 53 Resolver Endpoints"
        description="Configure inbound and outbound DNS resolution endpoints between AWS VPCs and on-premises networks."
        badge={<Badge variant="purple">Hybrid DNS</Badge>}
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Create resolver endpoint
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <Input
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div style={{ width: 180 }}>
          <Select
            aria-label="Filter resolver endpoints by direction"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            options={[
              { value: '', label: 'All directions' },
              { value: 'Inbound', label: 'Inbound' },
              { value: 'Outbound', label: 'Outbound' },
            ]}
          />
        </div>
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={fetchItems}>
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={error}
        onRetry={fetchItems}
        emptyTitle="No resolver endpoints created"
        emptyDescription="Create inbound or outbound endpoints to bridge hybrid cloud DNS queries with Route 53."
        emptyActionLabel="Create resolver endpoint"
        onEmptyAction={openCreate}
      />

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Resolver Endpoint">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Endpoint Name"
            placeholder="e.g. Inbound Corporate Resolver"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Select
            label="Direction"
            value={formDirection}
            onChange={(e) => setFormDirection(e.target.value)}
            options={[
              { value: 'Inbound', label: 'Inbound (DNS queries into VPC from network)' },
              { value: 'Outbound', label: 'Outbound (DNS queries from VPC to network)' },
            ]}
          />
          <Input
            label="IP Addresses (comma-separated)"
            placeholder="e.g. 10.0.1.15, 10.0.2.15"
            value={formIps}
            onChange={(e) => setFormIps(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Optional description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
          <Select
            label="Status"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            options={[
              { value: 'Operational', label: 'Operational' },
              { value: 'Creating', label: 'Creating' },
              { value: 'Updating', label: 'Updating' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Endpoint
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Resolver Endpoint">
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Endpoint Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Select
            label="Direction"
            value={formDirection}
            onChange={(e) => setFormDirection(e.target.value)}
            options={[
              { value: 'Inbound', label: 'Inbound' },
              { value: 'Outbound', label: 'Outbound' },
            ]}
          />
          <Input
            label="IP Addresses (comma-separated)"
            value={formIps}
            onChange={(e) => setFormIps(e.target.value)}
          />
          <Input
            label="Description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
          <Select
            label="Status"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            options={[
              { value: 'Operational', label: 'Operational' },
              { value: 'Creating', label: 'Creating' },
              { value: 'Updating', label: 'Updating' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Resolver Endpoint"
        message="Are you sure you want to delete this resolver endpoint? Cross-network DNS forwarding rules will stop resolving."
        confirmLabel="Delete Endpoint"
        danger
        isLoading={isSubmitting}
      />

    </Shell>
  );
}
