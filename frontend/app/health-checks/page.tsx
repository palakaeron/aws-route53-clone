'use client';
import { MockPage, statusBadge } from '@/components/MockPage';
import { mockApi } from '@/lib/mockApi';

const PROTOCOLS = ['HTTP', 'HTTPS', 'TCP'];
const STATUSES = ['Healthy', 'Unhealthy', 'Unknown'];

export default function HealthChecksPage() {
  return (
    <MockPage
      title="Health Checks"
      description="Mock Route 53 Health Checks. Monitor endpoint availability and configure failover."
      resource="health check"
      breadcrumbs={[
        { label: 'Route 53', href: '/' },
        { label: 'Health checks' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'endpoint', label: 'Endpoint' },
        { key: 'protocol', label: 'Protocol' },
        { key: 'port', label: 'Port' },
        { key: 'status', label: 'Status', render: (item) => statusBadge(item.status ?? '') },
        { key: 'failure_threshold', label: 'Failure threshold' },
      ]}
      fields={[
        { key: 'name', label: 'Name', required: true, placeholder: 'e.g. my-health-check' },
        { key: 'endpoint', label: 'Endpoint', placeholder: 'e.g. api.example.com' },
        { key: 'protocol', label: 'Protocol', type: 'select', options: PROTOCOLS, defaultValue: 'HTTPS' },
        { key: 'port', label: 'Port', type: 'number', defaultValue: 443, placeholder: '443' },
        { key: 'path', label: 'Path', placeholder: '/' },
        { key: 'status', label: 'Status', type: 'select', options: STATUSES, defaultValue: 'Unknown' },
        { key: 'failure_threshold', label: 'Failure threshold', type: 'number', defaultValue: 3 },
      ]}
      api={mockApi.healthChecks as Parameters<typeof MockPage>[0]['api']}
    />
  );
}
