'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Shell from '@/components/Shell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock } from 'lucide-react';

const sectionTitles: Record<string, string> = {
  traffic: 'Traffic policies',
  health: 'Health checks',
  resolver: 'Route 53 Resolver',
  profiles: 'Profiles',
};

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'traffic';
  const title = sectionTitles[section] || 'Route 53 Feature';

  const breadcrumbs = [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/hosted-zones' },
    { label: title },
  ];

  return (
    <Shell breadcrumbs={breadcrumbs}>
      <PageHeader
        title={title}
        description={`Manage and configure ${title.toLowerCase()} in Amazon Route 53.`}
        badge={<Badge variant="orange">Coming Soon</Badge>}
      />

      <div className="aws-card">
        <EmptyState
          icon={<Clock size={40} color="var(--aws-orange)" />}
          title={`${title} feature coming soon`}
          description="This section is currently mocked for the assignment. Hosted Zones and DNS Records API functionality are fully operational."
          actionLabel="Go to Hosted Zones"
          onAction={() => {
            window.location.href = '/hosted-zones';
          }}
        />
      </div>
    </Shell>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<div className="empty">Loading feature...</div>}>
      <ComingSoonContent />
    </Suspense>
  );
}
