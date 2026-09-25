'use client';
import { MockPage, statusBadge } from '@/components/MockPage';
import { mockApi } from '@/lib/mockApi';

const STATUSES = ['Active', 'Inactive', 'Pending'];

export default function ProfilesPage() {
  return (
    <MockPage
      title="Profiles"
      description="Mock Route 53 Profiles. Manage shared DNS configurations across VPCs."
      resource="profile"
      breadcrumbs={[
        { label: 'Route 53', href: '/' },
        { label: 'Profiles' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', render: (item) => statusBadge(item.status ?? '') },
        { key: 'associated_vpcs', label: 'Associated VPCs' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true, placeholder: 'e.g. my-profile' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES, defaultValue: 'Active' },
        { key: 'associated_vpcs', label: 'Associated VPCs', placeholder: 'e.g. vpc-abc123, vpc-def456' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      ]}
      api={mockApi.profiles as Parameters<typeof MockPage>[0]['api']}
    />
  );
}
