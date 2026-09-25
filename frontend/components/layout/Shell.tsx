'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe2,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
  Search,
  LucideProps,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { ToastContainer } from '../ui/Toast';
import { Breadcrumbs, BreadcrumbItem } from '../ui/Breadcrumbs';

export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  isComingSoon?: boolean;
}

const navItems: NavigationItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/hosted-zones', label: 'Hosted zones', icon: Globe2 },
  { href: '/traffic-policies', label: 'Traffic policies', icon: ShieldCheck },
  { href: '/health-checks', label: 'Health checks', icon: HeartPulse },
  { href: '/resolver', label: 'Resolver', icon: Network },
  { href: '/profiles', label: 'Profiles', icon: Users },
];

function SidebarNav({ onNavClick }: { onNavClick: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="aws-nav-group" aria-label="DNS Management Navigation">
      <div className="aws-nav-section-title">DNS Management</div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`aws-nav-link ${isActive ? 'active' : ''}`}
            onClick={onNavClick}
          >
            <Icon size={18} className="aws-nav-link-icon" />
            <span className="aws-nav-link-text">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export interface ShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function Shell({ children, breadcrumbs }: ShellProps) {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Keyboard accessibility — close dropdowns/drawers on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate default breadcrumbs if not explicitly provided
  const defaultBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    { label: 'AWS Console', href: '/' },
    { label: 'Route 53', href: '/hosted-zones' },
  ];

  return (
    <div className="aws-shell">
      {/* AWS Dark Top Navigation Bar */}
      <header className="aws-topbar">
        <div className="aws-topbar-left">
          <button
            type="button"
            className="aws-mobile-nav-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="aws-brand-link">
            <div className="aws-brand-logo">
              <span className="aws-brand-orange">AWS</span> Route 53
            </div>
          </Link>
        </div>

        <div className="aws-topbar-center">
          <div className="aws-topbar-search">
            <Search size={14} className="aws-topbar-search-icon" />
            <input
              type="text"
              placeholder="Search services, features, docs"
              className="aws-topbar-search-input"
              readOnly
              aria-label="Global search"
            />
          </div>
        </div>

        <div className="aws-topbar-right">
          <div className="aws-user-menu-wrap">
            <button
              type="button"
              className="aws-user-menu-btn"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-expanded={userDropdownOpen}
              aria-label="User account menu"
            >
              <div className="aws-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
              </div>
              <span className="aws-user-name">{user?.name || 'Console User'}</span>
            </button>

            {userDropdownOpen && (
              <div className="aws-user-dropdown">
                <div className="aws-user-dropdown-header">
                  <div className="aws-user-dropdown-name">{user?.name || 'Console User'}</div>
                  <div className="aws-user-dropdown-email">{user?.email || 'demo@aws.local'}</div>
                </div>
                <div className="aws-user-dropdown-divider" />
                <button
                  type="button"
                  className="aws-user-dropdown-item"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    void logout();
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="aws-layout-body">
        {/* Sidebar Navigation */}
        <aside className={`aws-sidebar ${mobileNavOpen ? 'aws-sidebar-mobile-open' : ''}`}>
          <div className="aws-sidebar-inner">
            <div className="aws-sidebar-header">Route 53 Dashboard</div>

            <Suspense fallback={<div className="aws-nav-group" />}>
              <SidebarNav onNavClick={() => setMobileNavOpen(false)} />
            </Suspense>

            <div className="aws-sidebar-footer">
              <div className="aws-sidebar-account-info">
                <div className="aws-account-label">Account ID</div>
                <div className="aws-account-value">1234-5678-9012 (Demo)</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {mobileNavOpen && (
          <div
            className="aws-sidebar-backdrop"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        {/* Main Content Workspace */}
        <main className="aws-main-content">
          <div className="aws-breadcrumbs-bar">
            <Breadcrumbs items={defaultBreadcrumbs} />
          </div>

          <div className="aws-content-container">{children}</div>
        </main>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
