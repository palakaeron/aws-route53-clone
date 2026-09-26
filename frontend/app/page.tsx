'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { useHostedZones } from '@/lib/hooks/useHostedZones';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { Globe2, ShieldCheck, HeartPulse, Plus, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { HostedZone } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { zones, meta, isLoading, error, refetch } = useHostedZones({ pageSize: 10 });

  const totalRecords = zones.reduce((sum, z) => sum + (z.record_count || 0), 0);

  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/' },
    { label: 'Dashboard' },
  ];

  const columns: Column<HostedZone>[] = [
    {
      key: 'name',
      header: 'Domain name',
      cell: (zone) => (
        <Link
          href={`/hosted-zones/${zone.zone_id}`}
          className="aws-breadcrumbs-link"
          style={{ fontWeight: 600 }}
        >
          {zone.name}
        </Link>
      ),
    },
    {
      key: 'zone_id',
      header: 'Hosted zone ID',
      cell: (zone) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--aws-text-muted)' }}>
          {zone.zone_id}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (zone) => (
        <Badge variant={zone.type === 'Public' ? 'blue' : 'gray'}>
          {zone.type}
        </Badge>
      ),
    },
    {
      key: 'record_count',
      header: 'Records',
      cell: (zone) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {zone.record_count ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'aws-text-right',
      cell: (zone) => (
        <Button
          variant="secondary"
          size="sm"
          icon={<ExternalLink size={12} />}
          onClick={() => router.push(`/hosted-zones/${zone.zone_id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Shell breadcrumbs={breadcrumbs}>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Route 53 Dashboard"
        description="Amazon Route 53 domain name service (DNS) overview, hosted zone status, and quick configuration."
        badge={<Badge variant="orange">Global Service</Badge>}
        actions={
          <Link href="/hosted-zones">
            <Button variant="primary" icon={<Plus size={16} />}>
              Create hosted zone
            </Button>
          </Link>
        }
      />

      {/* ── Service Status Banner ────────────────────────────────────────────── */}
      <div
        className="aws-card"
        style={{
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderLeft: '4px solid var(--aws-success)',
        }}
      >
        <CheckCircle2 size={20} color="var(--aws-success)" />
        <div style={{ flex: 1, fontSize: 13 }}>
          <strong style={{ color: 'var(--aws-text-dark)' }}>Route 53 DNS Service Status:</strong>{' '}
          <span style={{ color: 'var(--aws-text-muted)' }}>
            Service is operating normally across all global Edge locations.
          </span>
        </div>
      </div>

      {/* ── Metrics Cards Grid ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="aws-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--aws-text-muted)', textTransform: 'uppercase' }}>
              Hosted zones
            </span>
            <Globe2 size={20} color="var(--aws-blue)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: 'var(--aws-text-dark)' }}>
            {isLoading ? <Skeleton width={60} height={32} /> : meta.total || zones.length}
          </div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            <Link href="/hosted-zones" className="aws-breadcrumbs-link">
              View all hosted zones &rarr;
            </Link>
          </div>
        </div>

        <div className="aws-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--aws-text-muted)', textTransform: 'uppercase' }}>
              DNS records
            </span>
            <ShieldCheck size={20} color="var(--aws-orange)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: 'var(--aws-text-dark)' }}>
            {isLoading ? <Skeleton width={60} height={32} /> : totalRecords}
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: 'var(--aws-text-muted)' }}>
            Total active DNS records in account
          </div>
        </div>

        <div className="aws-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--aws-text-muted)', textTransform: 'uppercase' }}>
              DNS SLA Uptime
            </span>
            <HeartPulse size={20} color="var(--aws-success)" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12, color: 'var(--aws-success)' }}>
            100.0%
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: 'var(--aws-text-muted)' }}>
            100% Availability SLA target
          </div>
        </div>
      </div>

      {/* ── Hosted Zones Summary Table ───────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Hosted Zones Summary</h2>
          <Link href="/hosted-zones" className="aws-breadcrumbs-link" style={{ fontSize: 13, fontWeight: 600 }}>
            View all ({meta.total || zones.length})
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={zones}
          keyExtractor={(z) => z.id}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          emptyTitle="No hosted zones created yet"
          emptyDescription="Create a hosted zone to configure DNS records and route domain traffic."
          emptyActionLabel="Create hosted zone"
          onEmptyAction={() => router.push('/hosted-zones')}
        />
      </div>

      {/* ── Quick Overview Cards ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        <div className="aws-card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>DNS Management</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--aws-text-muted)', lineHeight: 1.5 }}>
            Create public or private hosted zones to route Internet or VPC traffic to your domains and subdomains.
          </p>
          <Link href="/hosted-zones">
            <Button variant="secondary" size="sm">Go to Hosted Zones</Button>
          </Link>
        </div>

        <div className="aws-card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>Advanced Routing & Policies</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--aws-text-muted)', lineHeight: 1.5 }}>
            Configure visual traffic routing policies, health checks, and global failover options.
          </p>
          <Link href="/traffic-policies">
            <Button variant="secondary" size="sm">Explore Traffic Policies</Button>
          </Link>
        </div>

        <div className="aws-card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>Health & Resolver</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--aws-text-muted)', lineHeight: 1.5 }}>
            Monitor endpoint health and configure hybrid cloud DNS resolution with Route 53 Resolver.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/health-checks">
              <Button variant="secondary" size="sm">Health Checks</Button>
            </Link>
            <Link href="/resolver">
              <Button variant="secondary" size="sm">Resolver</Button>
            </Link>
          </div>
        </div>
      </div>

    </Shell>
  );
}
