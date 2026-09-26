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
import { Users, Plus, Trash2, Edit3, Search, RefreshCw } from 'lucide-react';
import type { Profile } from '@/lib/types';

export default function ProfilesPage() {
  const [items, setItems] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Profile | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formVpcs, setFormVpcs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.profiles.list({ search, status: statusFilter });
      setItems(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load profiles.';
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
    setFormDescription('');
    setFormStatus('Active');
    setFormVpcs('vpc-0a1b2c3d4e (us-east-1)');
    setCreateOpen(true);
  };

  const openEdit = (item: Profile) => {
    setEditItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormStatus(item.status);
    setFormVpcs(Array.isArray(item.associated_vpcs) ? item.associated_vpcs.join(', ') : '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsSubmitting(true);
    const vpcList = formVpcs.split(',').map((v) => v.trim()).filter(Boolean);
    try {
      await api.profiles.create({
        name: formName.trim(),
        description: formDescription,
        status: formStatus,
        associated_vpcs: vpcList,
      });
      toast('Profile created successfully.', 'success');
      setCreateOpen(false);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !formName.trim()) return;
    setIsSubmitting(true);
    const vpcList = formVpcs.split(',').map((v) => v.trim()).filter(Boolean);
    try {
      await api.profiles.update(editItem.id, {
        name: formName.trim(),
        description: formDescription,
        status: formStatus,
        associated_vpcs: vpcList,
      });
      toast('Profile updated successfully.', 'success');
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await api.profiles.delete(deleteId);
      toast('Profile deleted.', 'info');
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items;

  const columns: Column<Profile>[] = [
    {
      key: 'name',
      header: 'Profile Name',
      cell: (item) => (
        <div>
          <strong style={{ color: 'var(--aws-text-dark)', display: 'block' }}>{item.name}</strong>
          <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{item.description || 'No description'}</span>
        </div>
      ),
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
      key: 'associated_vpcs',
      header: 'Associated VPCs',
      cell: (item) => (
        <div style={{ fontSize: 12 }}>
          {Array.isArray(item.associated_vpcs) && item.associated_vpcs.length > 0 ? (
            item.associated_vpcs.map((vpc) => (
              <span
                key={vpc}
                style={{
                  display: 'inline-block',
                  background: 'var(--aws-bg-subtle)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  marginRight: 4,
                  marginBottom: 4,
                  fontFamily: 'monospace',
                }}
              >
                {vpc}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--aws-text-muted)' }}>None associated</span>
          )}
        </div>
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
        { label: 'Profiles' },
      ]}
    >
      <PageHeader
        title="Route 53 Profiles"
        description="Share DNS configurations, DNS Firewall rule groups, and private hosted zone associations across multiple VPCs."
        badge={<Badge variant="orange">VPC Management</Badge>}
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Create profile
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, maxWidth: 360 }}>
          <Input
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div style={{ width: 180 }}>
          <Select
            aria-label="Filter profiles by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Pending', label: 'Pending' },
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
        emptyTitle="No profiles created"
        emptyDescription="Create a profile to easily apply standardized DNS settings and private zones across your VPCs."
        emptyActionLabel="Create profile"
        onEmptyAction={openCreate}
      />

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Profile">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Profile Name"
            placeholder="e.g. Enterprise Production Profile"
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
          <Input
            label="Associated VPC IDs (comma-separated)"
            placeholder="e.g. vpc-0a1b2c3d4e (us-east-1), vpc-0f9e8d7c6b"
            value={formVpcs}
            onChange={(e) => setFormVpcs(e.target.value)}
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
              Create Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Profile">
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Profile Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
          <Input
            label="Associated VPC IDs (comma-separated)"
            value={formVpcs}
            onChange={(e) => setFormVpcs(e.target.value)}
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
        title="Delete Profile"
        message="Are you sure you want to delete this Route 53 Profile? VPC associations will be unlinked."
        confirmLabel="Delete Profile"
        danger
        isLoading={isSubmitting}
      />

    </Shell>
  );
}
