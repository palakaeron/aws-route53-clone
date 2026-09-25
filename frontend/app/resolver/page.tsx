'use client';
import { MockPage, statusBadge } from '@/components/MockPage';
import { mockApi } from '@/lib/mockApi';

const DIRECTIONS = ['Inbound', 'Outbound'];
const STATUSES = ['Operational', 'Pending', 'Failed'];

export default function ResolverPage() {
  return (
    <MockPage
      title="Resolver"
      description="Mock Route 53 Resolver endpoints. Configure inbound and outbound DNS query forwarding."
      resource="resolver endpoint"
      breadcrumbs={[
        { label: 'Route 53', href: '/' },
        { label: 'Resolver' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'direction', label: 'Direction' },
        { key: 'status', label: 'Status', render: (item) => statusBadge(item.status ?? '') },
        { key: 'ip_addresses', label: 'IP Addresses' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true, placeholder: 'e.g. my-inbound-endpoint' },
        { key: 'direction', label: 'Direction', type: 'select', options: DIRECTIONS, defaultValue: 'Inbound' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES, defaultValue: 'Operational' },
        { key: 'ip_addresses', label: 'IP Addresses', placeholder: 'e.g. 10.0.0.1, 10.0.0.2' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      ]}
      api={mockApi.resolver as Parameters<typeof MockPage>[0]['api']}
    />
  );
}
