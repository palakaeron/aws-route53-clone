'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('demo@aws.local');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
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
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="login-logo" aria-label="AWS Route 53">
          <span className="login-logo-aws">aws</span>
          <span className="login-logo-service">Route 53</span>
        </div>

        <section className="login-panel" aria-labelledby="login-title">
          <h1 id="login-title" className="login-title">Sign in</h1>
          <p className="login-subtitle">Route 53 Console</p>

          {error && (
            <Alert type="error" onDismiss={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="Email address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button variant="primary" size="lg" isLoading={isSubmitting} className="login-submit">
              Sign in
            </Button>
          </form>

          <div className="login-demo" aria-label="Demo credentials">
            <strong>Demo account</strong>
            <span><b>Email</b> <code>demo@aws.local</code></span>
            <span><b>Password</b> <code>demo123</code></span>
          </div>

          <div className="login-help-links">
            <span>Need help signing in?</span>
            <span aria-hidden="true">|</span>
            <span>Privacy</span>
          </div>
        </section>
      </div>

      <footer className="login-footer">
        <span>© 2026 Route 53 Console</span>
        <span>Simulated AWS experience</span>
      </footer>
    </main>
  );
}
