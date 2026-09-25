'use client';

import React, { useEffect, useState } from 'react';
import type { HostedZone, ZoneType } from '@/lib/types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface HostedZoneFormProps {
  zone?: HostedZone | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; type: ZoneType; description: string }) => Promise<void>;
}

export default function HostedZoneForm({ zone, open, onClose, onSave }: HostedZoneFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ZoneType>('Public');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    setName(zone?.name || '');
    setType(zone?.type || 'Public');
    setDescription(zone?.description || '');
    setNameError('');
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
    setIsSubmitting(true);
    try {
      await onSave({ name: name.trim(), type, description: description.trim() });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={zone ? 'Edit hosted zone' : 'Create hosted zone'}
      subtitle="A hosted zone contains DNS records for your domain name."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            {zone ? 'Save changes' : 'Create hosted zone'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Domain name"
          placeholder="example.com"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError('');
          }}
          error={nameError}
          helperText="Specify the domain name (e.g., example.com) to route Internet traffic."
          required
          autoFocus
        />

        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ZoneType)}
          options={[
            { value: 'Public', label: 'Public Hosted Zone (Routes traffic on the Internet)' },
            { value: 'Private', label: 'Private Hosted Zone (Routes traffic within Amazon VPC)' },
          ]}
        />

        <Input
          label="Description"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          helperText="Brief note to identify this hosted zone."
        />
      </form>
    </Modal>
  );
}
