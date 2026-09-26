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
import { ShieldCheck, Plus, Trash2, Edit3, Search, RefreshCw } from 'lucide-react';
import type { TrafficPolicy } from '@/lib/types';

export default function TrafficPoliciesPage() {
  const [items, setItems] = useState<TrafficPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<TrafficPolicy | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStrategy, setFormStrategy] = useState('Simple');
  const [formStatus, setFormStatus] = useState('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.trafficPolicies.list();
      setItems(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load traffic policies.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setFormName('');
    setFormDescription('');
    setFormStrategy('Simple');
    setFormStatus('Active');
    setCreateOpen(true);
  };

  const openEdit = (item: TrafficPolicy) => {
    setEditItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormStrategy(item.routing_strategy);
    setFormStatus(item.status);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.trafficPolicies.create({
        name: formName.trim(),
        description: formDescription,
        routing_strategy: formStrategy,
        status: formStatus,
      });
      toast('Traffic policy created successfully.', 'success');
      setCreateOpen(false);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create traffic policy.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !formName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.trafficPolicies.update(editItem.id, {
        name: formName.trim(),
        description: formDescription,
        routing_strategy: formStrategy,
        status: formStatus,
      });
      toast('Traffic policy updated successfully.', 'success');
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update traffic policy.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await api.trafficPolicies.delete(deleteId);
      toast('Traffic policy deleted.', 'info');
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete traffic policy.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.routing_strategy.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<TrafficPolicy>[] = [
    {
      key: 'name',
      header: 'Policy name',
      cell: (item) => (
        <div>
          <strong style={{ color: 'var(--aws-text-dark)', display: 'block' }}>{item.name}</strong>
          <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{item.description || 'No description'}</span>
        </div>
      ),
    },
    {
      key: 'routing_strategy',
      header: 'Routing Strategy',
      cell: (item) => <Badge variant="blue">{item.routing_strategy}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={item.status === 'Active' ? 'green' : 'gray'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (item) => (
        <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>
          {new Date(item.created_at).toLocaleDateString()}
        </span>
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
        { label: 'Traffic Policies' },
      ]}
    >
      <PageHeader
        title="Traffic Policies"
        description="Configure multi-region traffic routing algorithms, failover configurations, and proximity routing rules."
        badge={<Badge variant="blue">Traffic Flow</Badge>}
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Create traffic policy
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <Input
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
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
        emptyTitle="No traffic policies found"
        emptyDescription="Traffic policies help you define visual routing graphs for geo, weighted, or failover routing."
        emptyActionLabel="Create traffic policy"
        onEmptyAction={openCreate}
      />

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Traffic Policy">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Policy Name"
            placeholder="e.g. Latency Failover Policy"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Description"
            placeholder="Optional description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
          <Select
            label="Routing Strategy"
            value={formStrategy}
            onChange={(e) => setFormStrategy(e.target.value)}
            options={[
              { value: 'Simple', label: 'Simple Routing' },
              { value: 'Weighted', label: 'Weighted Round-Robin' },
              { value: 'Latency', label: 'Latency-Based Routing' },
              { value: 'Geolocation', label: 'Geolocation Routing' },
              { value: 'Geoproximity', label: 'Geoproximity Routing' },
              { value: 'Failover', label: 'Primary/Secondary Failover' },
              { value: 'Multi-value', label: 'Multi-value Answer' },
            ]}
          />
          <Select
            label="Status"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Policy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Traffic Policy">
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Policy Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
          <Select
            label="Routing Strategy"
            value={formStrategy}
            onChange={(e) => setFormStrategy(e.target.value)}
            options={[
              { value: 'Simple', label: 'Simple Routing' },
              { value: 'Weighted', label: 'Weighted Round-Robin' },
              { value: 'Latency', label: 'Latency-Based Routing' },
              { value: 'Geolocation', label: 'Geolocation Routing' },
              { value: 'Geoproximity', label: 'Geoproximity Routing' },
              { value: 'Failover', label: 'Primary/Secondary Failover' },
              { value: 'Multi-value', label: 'Multi-value Answer' },
            ]}
          />
          <Select
            label="Status"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
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
        title="Delete Traffic Policy"
        message="Are you sure you want to delete this traffic policy? Any associated record sets will lose active policy routing."
        confirmLabel="Delete Policy"
        danger
        isLoading={isSubmitting}
      />

    </Shell>
  );
}
