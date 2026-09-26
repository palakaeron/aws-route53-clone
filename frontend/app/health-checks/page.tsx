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
import { HeartPulse, Plus, Trash2, Edit3, Search, RefreshCw, Activity } from 'lucide-react';
import type { HealthCheck } from '@/lib/types';

export default function HealthChecksPage() {
  const [items, setItems] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<HealthCheck | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEndpoint, setFormEndpoint] = useState('');
  const [formProtocol, setFormProtocol] = useState('HTTPS');
  const [formPort, setFormPort] = useState('443');
  const [formPath, setFormPath] = useState('/');
  const [formStatus, setFormStatus] = useState('Healthy');
  const [formThreshold, setFormThreshold] = useState('3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.healthChecks.list({ search, status: statusFilter });
      setItems(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load health checks.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setFormName('');
    setFormEndpoint('');
    setFormProtocol('HTTPS');
    setFormPort('443');
    setFormPath('/');
    setFormStatus('Healthy');
    setFormThreshold('3');
    setCreateOpen(true);
  };

  const openEdit = (item: HealthCheck) => {
    setEditItem(item);
    setFormName(item.name);
    setFormEndpoint(item.endpoint);
    setFormProtocol(item.protocol);
    setFormPort(String(item.port));
    setFormPath(item.path);
    setFormStatus(item.status);
    setFormThreshold(String(item.failure_threshold));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEndpoint.trim()) return;
    setIsSubmitting(true);
    try {
      await api.healthChecks.create({
        name: formName.trim(),
        endpoint: formEndpoint.trim(),
        protocol: formProtocol,
        port: parseInt(formPort, 10) || 443,
        path: formPath.trim() || '/',
        status: formStatus,
        failure_threshold: parseInt(formThreshold, 10) || 3,
      });
      toast('Health check created successfully.', 'success');
      setCreateOpen(false);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create health check.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !formName.trim() || !formEndpoint.trim()) return;
    setIsSubmitting(true);
    try {
      await api.healthChecks.update(editItem.id, {
        name: formName.trim(),
        endpoint: formEndpoint.trim(),
        protocol: formProtocol,
        port: parseInt(formPort, 10) || 443,
        path: formPath.trim() || '/',
        status: formStatus,
        failure_threshold: parseInt(formThreshold, 10) || 3,
      });
      toast('Health check updated successfully.', 'success');
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update health check.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await api.healthChecks.delete(deleteId);
      toast('Health check deleted.', 'info');
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete health check.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items;

  const columns: Column<HealthCheck>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (item) => (
        <div>
          <strong style={{ color: 'var(--aws-text-dark)', display: 'block' }}>{item.name}</strong>
          <span style={{ fontSize: 12, color: 'var(--aws-text-muted)', fontFamily: 'monospace' }}>
            {item.protocol.toLowerCase()}://{item.endpoint}:{item.port}{item.path}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Health Status',
      cell: (item) => {
        let variant: 'green' | 'red' | 'gray' = 'gray';
        if (item.status === 'Healthy') variant = 'green';
        if (item.status === 'Unhealthy') variant = 'red';
        return <Badge variant={variant}>{item.status}</Badge>;
      },
    },
    {
      key: 'protocol',
      header: 'Protocol & Port',
      cell: (item) => (
        <span>
          {item.protocol} ({item.port})
        </span>
      ),
    },
    {
      key: 'failure_threshold',
      header: 'Threshold',
      cell: (item) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {item.failure_threshold} consecutive failures
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
        { label: 'Health Checks' },
      ]}
    >
      <PageHeader
        title="Health Checks"
        description="Monitor web application endpoints, cloud resources, and DNS target readiness for automated failover."
        badge={<Badge variant="green">Monitoring</Badge>}
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Create health check
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <Input
            placeholder="Search endpoints or names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div style={{ width: 180 }}>
          <Select
            aria-label="Filter health checks by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'Healthy', label: 'Healthy' },
              { value: 'Unhealthy', label: 'Unhealthy' },
              { value: 'Unknown', label: 'Unknown' },
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
        emptyTitle="No health checks configured"
        emptyDescription="Create a health check to monitor web servers, IP addresses, or domain endpoints."
        emptyActionLabel="Create health check"
        onEmptyAction={openCreate}
      />

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Health Check">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Name"
            placeholder="e.g. Primary Web Server Status"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Domain / Endpoint Hostname"
            placeholder="e.g. app.example.com or 192.0.2.1"
            value={formEndpoint}
            onChange={(e) => setFormEndpoint(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Protocol"
              value={formProtocol}
              onChange={(e) => setFormProtocol(e.target.value)}
              options={[
                { value: 'HTTPS', label: 'HTTPS' },
                { value: 'HTTP', label: 'HTTP' },
                { value: 'TCP', label: 'TCP' },
              ]}
            />
            <Input
              label="Port"
              type="number"
              value={formPort}
              onChange={(e) => setFormPort(e.target.value)}
              required
            />
          </div>
          <Input
            label="Path"
            placeholder="e.g. /healthz or /status"
            value={formPath}
            onChange={(e) => setFormPath(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Simulated Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              options={[
                { value: 'Healthy', label: 'Healthy' },
                { value: 'Unhealthy', label: 'Unhealthy' },
                { value: 'Unknown', label: 'Unknown' },
              ]}
            />
            <Input
              label="Failure Threshold"
              type="number"
              value={formThreshold}
              onChange={(e) => setFormThreshold(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Health Check
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Health Check">
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Domain / Endpoint Hostname"
            value={formEndpoint}
            onChange={(e) => setFormEndpoint(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Protocol"
              value={formProtocol}
              onChange={(e) => setFormProtocol(e.target.value)}
              options={[
                { value: 'HTTPS', label: 'HTTPS' },
                { value: 'HTTP', label: 'HTTP' },
                { value: 'TCP', label: 'TCP' },
              ]}
            />
            <Input
              label="Port"
              type="number"
              value={formPort}
              onChange={(e) => setFormPort(e.target.value)}
              required
            />
          </div>
          <Input
            label="Path"
            value={formPath}
            onChange={(e) => setFormPath(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              options={[
                { value: 'Healthy', label: 'Healthy' },
                { value: 'Unhealthy', label: 'Unhealthy' },
                { value: 'Unknown', label: 'Unknown' },
              ]}
            />
            <Input
              label="Failure Threshold"
              type="number"
              value={formThreshold}
              onChange={(e) => setFormThreshold(e.target.value)}
            />
          </div>

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
        title="Delete Health Check"
        message="Are you sure you want to delete this health check? Any health-checked DNS record routing will revert to default."
        confirmLabel="Delete Health Check"
        danger
        isLoading={isSubmitting}
      />

    </Shell>
  );
}
