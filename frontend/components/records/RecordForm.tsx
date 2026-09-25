'use client';

import React, { useEffect, useState } from 'react';
import type { DNSRecord, RecordType } from '@/lib/types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

const RECORD_TYPES: RecordType[] = [
  'A',
  'AAAA',
  'CNAME',
  'TXT',
  'MX',
  'NS',
  'PTR',
  'SRV',
  'CAA',
];

export interface RecordFormProps {
  record?: DNSRecord | null;
  defaultName: string;
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    type: RecordType;
    value: string;
    ttl: number;
    priority: number | null;
  }) => Promise<void>;
}

export default function RecordForm({
  record,
  defaultName,
  open,
  onClose,
  onSave,
}: RecordFormProps) {
  const [name, setName] = useState(defaultName);
  const [type, setType] = useState<RecordType>('A');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState(300);
  const [priority, setPriority] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [valueError, setValueError] = useState('');

  useEffect(() => {
    setName(record?.name || defaultName);
    setType(record?.type || 'A');
    setValue(record?.value || '');
    setTtl(record?.ttl || 300);
    setPriority(record?.priority == null ? '' : String(record.priority));
    setNameError('');
    setValueError('');
    setIsSubmitting(false);
  }, [record, defaultName, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    if (!name.trim()) {
      setNameError('Record name is required.');
      valid = false;
    } else {
      setNameError('');
    }

    if (!value.trim()) {
      setValueError('Record value is required.');
      valid = false;
    } else {
      setValueError('');
    }

    if (!valid) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        value: value.trim(),
        ttl: Number(ttl) || 300,
        priority: priority === '' ? null : Number(priority),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={record ? 'Edit record' : 'Create record'}
      subtitle="Define routing details for this DNS record."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            {record ? 'Save changes' : 'Create record'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Record name"
          placeholder="e.g. www or @"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError('');
          }}
          error={nameError}
          helperText="Enter a subdomain prefix (e.g., 'www') or '@' for the zone apex."
          required
        />

        <Select
          label="Record type"
          value={type}
          onChange={(e) => setType(e.target.value as RecordType)}
          options={RECORD_TYPES}
        />

        <div className="aws-field">
          <label htmlFor="record-value" className="aws-label">
            Value / Target <span className="aws-required">*</span>
          </label>
          <textarea
            id="record-value"
            className={`aws-input ${valueError ? 'aws-input-error' : ''}`}
            rows={3}
            value={value}
            placeholder={
              type === 'A'
                ? '192.0.2.1'
                : type === 'AAAA'
                ? '2001:db8::1'
                : type === 'CNAME'
                ? 'target.example.com'
                : 'Enter record value'
            }
            onChange={(e) => {
              setValue(e.target.value);
              if (valueError) setValueError('');
            }}
          />
          {valueError && <span className="aws-field-error-text">{valueError}</span>}
          {!valueError && (
            <span className="aws-field-helper-text">
              Type-specific value (e.g. IPv4 address for A, hostname for CNAME).
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Input
            label="TTL (seconds)"
            type="number"
            min={1}
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            helperText="Time To Live in seconds."
          />

          <Input
            label="Priority (MX/SRV)"
            type="number"
            min={0}
            placeholder="e.g. 10"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            helperText="Lower value = higher priority."
            disabled={type !== 'MX' && type !== 'SRV'}
          />
        </div>
      </form>
    </Modal>
  );
}
