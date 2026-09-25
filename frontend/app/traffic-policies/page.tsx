'use client';
import { MockPage, statusBadge } from '@/components/MockPage';
import { mockApi } from '@/lib/mockApi';

const STRATEGIES = ['Simple', 'Weighted', 'Latency', 'Geolocation', 'Failover', 'Multi-value'];
const STATUSES = ['Active', 'Inactive'];

export default function TrafficPoliciesPage() {
  return (
    <MockPage
      title="Traffic Policies"
      description="Mock Route 53 Traffic Policies. Manage DNS routing strategies for your resources."
      resource="traffic policy"
      breadcrumbs={[
        { label: 'Route 53', href: '/' },
        { label: 'Traffic policies' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'routing_strategy', label: 'Routing strategy' },
        { key: 'status', label: 'Status', render: (item) => statusBadge(item.status ?? '') },
        { key: 'description', label: 'Description' },
        { key: 'created_at', label: 'Created', render: (item) => new Date((item as Record<string, unknown>)['created_at'] as string).toLocaleDateString() },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true, placeholder: 'e.g. my-traffic-policy' },
        { key: 'routing_strategy', label: 'Routing strategy', type: 'select', options: STRATEGIES, defaultValue: 'Simple' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES, defaultValue: 'Active' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      ]}
      api={mockApi.trafficPolicies as Parameters<typeof MockPage>[0]['api']}
    />
  );
}
