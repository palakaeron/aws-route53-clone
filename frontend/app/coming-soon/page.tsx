'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SectionDetail {
  title: string;
  description: string;
  longDescription: string;
  docsUrl: string;
}

const SECTION_DETAILS: Record<string, SectionDetail> = {
  traffic: {
    title: 'Traffic policies',
    description: 'Manage complex routing algorithms using visual traffic policy flow charts.',
    longDescription:
      'Traffic Flow allows you to create complex routing configurations for your domain names using visual traffic policy flows. You can configure latency-based routing, endpoint health checks, geolocation routing, and multi-value answer policies.',
    docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/traffic-flow.html',
  },
  health: {
    title: 'Health checks',
    description: 'Monitor web server and endpoint health to enable automated DNS failover.',
    longDescription:
      'Amazon Route 53 health checks monitor the health and performance of your web applications, web servers, and other resources. When an endpoint is unhealthy, Route 53 can automatically route traffic away from the degraded endpoint to healthy backup resources.',
    docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html',
  },
  resolver: {
    title: 'Route 53 Resolver',
    description: 'Recursive DNS service for hybrid cloud environments and VPC name resolution.',
    longDescription:
      'Route 53 Resolver provides recursive DNS lookups for your Amazon VPCs and hybrid cloud networks. Outbound and inbound endpoints allow seamless resolution between AWS resources and on-premises DNS infrastructure.',
    docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-getting-started.html',
  },
  profiles: {
    title: 'Profiles',
    description: 'Share Route 53 DNS configurations across multiple AWS accounts and VPCs.',
    longDescription:
      'Route 53 Profiles allow you to bundle DNS settings—such as private hosted zones, Resolver rules, and DNS Firewall rule groups—and apply them consistently across multiple Amazon VPCs and AWS accounts in AWS Organizations.',
    docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/profiles.html',
  },
};

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionKey = searchParams.get('section') || 'traffic';
  const detail = SECTION_DETAILS[sectionKey] || {
    title: 'Route 53 Feature',
    description: 'Additional Amazon Route 53 capability.',
    longDescription: 'This feature is part of the broader Amazon Route 53 cloud infrastructure platform.',
    docsUrl: 'https://aws.amazon.com/route53/',
  };

  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/hosted-zones' },
    { label: detail.title },
  ];

  return (
    <Shell breadcrumbs={breadcrumbs}>
      <PageHeader
        title={detail.title}
        description={detail.description}
        badge={<Badge variant="orange">Feature Placeholder</Badge>}
        actions={
          <Button
            variant="secondary"
            onClick={() => router.push('/hosted-zones')}
          >
            Back to Hosted zones
          </Button>
        }
      />

      <div className="aws-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div
            style={{
              padding: 12,
              backgroundColor: 'var(--aws-blue-light)',
              borderRadius: 6,
              color: 'var(--aws-blue)',
            }}
          >
            <Clock size={28} />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--aws-text-dark)' }}>
              {detail.title} is not enabled in this clone deployment
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--aws-text-muted)', lineHeight: 1.5 }}>
              {detail.longDescription}
            </p>

            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--aws-bg-light)',
                borderRadius: 4,
                border: '1px solid var(--aws-border-subtle)',
                fontSize: 12,
                color: 'var(--aws-text-dark)',
                marginBottom: 16,
              }}
            >
              <strong>Scope Notice:</strong> Hosted Zones and DNS Records API functionality are fully operational and tested in this deployment. Advanced enterprise features (such as {detail.title.toLowerCase()}) are represented as placeholders to maintain standard AWS Console layout parity.
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link href="/hosted-zones">
                <Button variant="primary">Manage Hosted Zones</Button>
              </Link>
              <a
                href={detail.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--aws-blue)',
                  textDecoration: 'none',
                }}
              >
                AWS Documentation <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading feature details…</div>}>
      <ComingSoonContent />
    </Suspense>
  );
}
