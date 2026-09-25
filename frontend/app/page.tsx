'use client';

import React from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { useHostedZones } from '@/lib/hooks/useHostedZones';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Globe2, ShieldCheck, HeartPulse, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { zones, meta, isLoading, error } = useHostedZones({ pageSize: 100 });

  const totalRecords = zones.reduce((sum, z) => sum + (z.record_count || 0), 0);

  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/' },
    { label: 'Dashboard' },
  ];

  return (
    <Shell breadcrumbs={breadcrumbs}>
      <PageHeader
        title="Route 53 Dashboard"
        description="A highly available and scalable cloud Domain Name System (DNS) web service."
        badge={<Badge variant="orange">Global Service</Badge>}
        actions={
          <Link href="/hosted-zones">
            <Button variant="primary" icon={<Globe2 size={16} />}>
              Create hosted zone
            </Button>
          </Link>
        }
      />

      {/* Metrics Row */}
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
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--aws-text-muted)', textTransform: 'uppercase' }}>
              Hosted zones
            </span>
            <Globe2 size={20} color="var(--aws-blue)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: 'var(--aws-text-dark)' }}>
            {isLoading ? <Skeleton width={60} height={32} /> : meta.total || zones.length}
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            <Link href="/hosted-zones" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              View all hosted zones <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div className="aws-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--aws-text-muted)', textTransform: 'uppercase' }}>
              DNS records
            </span>
            <ShieldCheck size={20} color="var(--aws-orange)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: 'var(--aws-text-dark)' }}>
            {isLoading ? <Skeleton width={60} height={32} /> : totalRecords}
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: 'var(--aws-text-muted)' }}>
            Across all hosted zones
          </div>
        </div>

        <div className="aws-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--aws-text-muted)', textTransform: 'uppercase' }}>
              Service status
            </span>
            <HeartPulse size={20} color="var(--aws-success)" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 12, color: 'var(--aws-success)' }}>
            Operational
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: 'var(--aws-text-muted)' }}>
            Route 53 Global Network
          </div>
        </div>
      </div>

      {/* Getting Started & Quick Links */}
      <div className="aws-card" style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
          DNS Domain Management
        </h2>
        <p style={{ margin: '0 0 16px', color: 'var(--aws-text-muted)', fontSize: 13 }}>
          Use Amazon Route 53 to manage public and private hosted zones, configure DNS record routing, and handle domain records.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/hosted-zones">
            <Button variant="primary">Manage Hosted Zones</Button>
          </Link>
          <Link href="/coming-soon?section=traffic">
            <Button variant="secondary">View Traffic Policies</Button>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
