'use client';

import React, { useEffect, useState } from 'react';
import type { HostedZone, ZoneType } from '@/lib/types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export interface HostedZoneFormProps {
  zone?: HostedZone | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; type: ZoneType; description: string }) => Promise<void>;
}

export default function HostedZoneForm({ zone, open, onClose, onSave }: HostedZoneFormProps) {
  const isEdit = Boolean(zone);

  const [name, setName] = useState('');
  const [type, setType] = useState<ZoneType>('Public');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Client-side field validation error */
  const [nameError, setNameError] = useState('');
  /** Server-side / API error displayed as a banner */
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    setName(zone?.name || '');
    setType(zone?.type || 'Public');
    setDescription(zone?.description || '');
    setNameError('');
    setApiError('');
    setIsSubmitting(false);
  }, [zone, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError('Domain name is required.');
      return;
    }
    setNameError('');
    setApiError('');
    setIsSubmitting(true);

    try {
      await onSave({ name: name.trim(), type, description: description.trim() });
    } catch (err) {
      // Surface API / network error directly in the form so the user
      // does not have to open it again after a failure.
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit hosted zone' : 'Create hosted zone'}
      subtitle="A hosted zone contains DNS records for your domain name."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Create hosted zone'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* API-level error banner */}
        {apiError && (
          <Alert type="error" onDismiss={() => setApiError('')}>
            {apiError}
          </Alert>
        )}

        {/* Domain name — read-only when editing because the zone name is
            an immutable routing identifier after creation. */}
        <Input
          label="Domain name"
          placeholder="example.com"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError('');
          }}
          error={nameError}
          helperText={
            isEdit
              ? 'The domain name cannot be changed after the hosted zone is created.'
              : 'Enter the domain name (e.g., example.com) for which you want to route traffic.'
          }
          required={!isEdit}
          readOnly={isEdit}
          disabled={isEdit}
          autoFocus={!isEdit}
        />

        {/* Zone type */}
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ZoneType)}
          options={[
            { value: 'Public', label: 'Public hosted zone — Routes traffic on the Internet' },
            { value: 'Private', label: 'Private hosted zone — Routes traffic within an Amazon VPC' },
          ]}
          helperText="A public hosted zone is accessible from the Internet. A private hosted zone is only accessible from within an associated VPC."
        />

        {/* Description */}
        <Input
          label="Description"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          helperText="A short, human-readable note to help identify this hosted zone."
          autoFocus={isEdit}
        />
      </form>
    </Modal>
  );
}
