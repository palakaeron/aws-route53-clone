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
      router.replace('/hosted-zones');
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
      router.push('/hosted-zones');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-wrap" style={{ background: '#f2f3f3' }}>
      <div className="login-card">
        <div className="login-logo" style={{ color: '#161e2e' }}>
          <span style={{ color: '#ff9900', fontWeight: 800 }}>AWS</span> Route 53
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#16191f' }}>
          Sign in to AWS Console
        </h1>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
          Enter demo credentials to access your Route 53 clone resources.
        </p>

        {error && (
          <Alert type="error" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="stack">
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

          <Button variant="primary" size="lg" isLoading={isSubmitting} style={{ width: '100%', marginTop: 8 }}>
            Sign in
          </Button>
        </form>

        <div style={{ marginTop: 24, padding: 12, background: '#fafafa', borderRadius: 4, border: '1px solid #e1e5ea', fontSize: 12, color: '#545b64' }}>
          <strong>Demo credentials:</strong><br />
          Email: <code>demo@aws.local</code><br />
          Password: <code>demo123</code>
        </div>
      </div>
    </div>
  );
}
