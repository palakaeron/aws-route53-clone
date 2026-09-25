'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('demo@aws.local');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already-authenticated visitors → Dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password.trim());
      router.push('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show nothing while checking auth status to avoid flash
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f2f3f3' }}>
        <div style={{ color: '#545b64', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="login-page-root">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-row">
          <div className="login-brand">
            <span className="login-brand-aws">AWS</span>
            <span className="login-brand-product"> Route 53</span>
          </div>
        </div>

        <h1 className="login-title">Sign in to AWS Console</h1>
        <p className="login-subtitle">
          Enter demo credentials to access your Route&nbsp;53 resources.
        </p>

        {error && (
          <div className="login-alert" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo credentials card */}
        <div className="login-demo-card">
          <div className="login-demo-label">Demo credentials</div>
          <div className="login-demo-row">
            <span className="login-demo-key">Email:</span>
            <code className="login-demo-val">demo@aws.local</code>
          </div>
          <div className="login-demo-row">
            <span className="login-demo-key">Password:</span>
            <code className="login-demo-val">demo123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
