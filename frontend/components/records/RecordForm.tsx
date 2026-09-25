'use client';

import React, { useEffect, useState } from 'react';
import type { DNSRecord, RecordType } from '@/lib/types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

const RECORD_TYPES: { value: RecordType; label: string }[] = [
  { value: 'A', label: 'A — IPv4 address' },
  { value: 'AAAA', label: 'AAAA — IPv6 address' },
  { value: 'CNAME', label: 'CNAME — Canonical name (alias)' },
  { value: 'TXT', label: 'TXT — Text records (SPF, verification)' },
  { value: 'MX', label: 'MX — Mail exchange' },
  { value: 'NS', label: 'NS — Name server' },
  { value: 'PTR', label: 'PTR — Pointer record' },
  { value: 'SRV', label: 'SRV — Service locator' },
  { value: 'CAA', label: 'CAA — Certificate authority authorization' },
];

const TTL_PRESETS = [
  { label: '60s (1 min)', value: 60 },
  { label: '300s (5 mins)', value: 300 },
  { label: '3600s (1 hr)', value: 3600 },
  { label: '86400s (1 day)', value: 86400 },
];

export interface RecordFormProps {
  record?: DNSRecord | null;
  defaultName: string;
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    type: RecordType;
    value: Record<string, any> | string;
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
  const isEdit = Boolean(record);

  // Common fields
  const [name, setName] = useState('');
  const [type, setType] = useState<RecordType>('A');
  const [ttl, setTtl] = useState<number>(300);

  // Type-specific field states
  const [ipAddress, setIpAddress] = useState('');
  const [ipv6Address, setIpv6Address] = useState('');
  const [cnameTarget, setCnameTarget] = useState('');
  const [txtValue, setTxtValue] = useState('');
  const [mxPriority, setMxPriority] = useState('10');
  const [mxExchange, setMxExchange] = useState('');
  const [nsNameserver, setNsNameserver] = useState('');
  const [ptrTarget, setPtrTarget] = useState('');
  const [srvPriority, setSrvPriority] = useState('10');
  const [srvWeight, setSrvWeight] = useState('60');
  const [srvPort, setSrvPort] = useState('5060');
  const [srvTarget, setSrvTarget] = useState('');
  const [caaFlags, setCaaFlags] = useState('0');
  const [caaTag, setCaaTag] = useState('issue');
  const [caaValue, setCaaValue] = useState('');

  // UI / Error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  // Populate form state on open / record change
  useEffect(() => {
    if (!open) return;

    setApiError('');
    setFieldErrors({});
    setIsSubmitting(false);

    if (record) {
      // Editing existing record
      setName(record.name || defaultName);
      setType(record.type || 'A');
      setTtl(record.ttl || 300);

      const data = record.data || {};
      const valStr = record.value || '';

      // Populate type-specific values
      setIpAddress(data.addresses?.[0] || valStr || '');
      setIpv6Address(data.addresses?.[0] || valStr || '');
      setCnameTarget(data.target || valStr || '');
      setTxtValue(data.texts?.[0] || valStr || '');
      setMxPriority(String(data.priority ?? record.priority ?? 10));
      setMxExchange(data.exchange || valStr || '');
      setNsNameserver(data.nameservers?.[0] || valStr || '');
      setPtrTarget(data.target || valStr || '');
      setSrvPriority(String(data.priority ?? 10));
      setSrvWeight(String(data.weight ?? 60));
      setSrvPort(String(data.port ?? 5060));
      setSrvTarget(data.target || valStr || '');
      setCaaFlags(String(data.flags ?? 0));
      setCaaTag(data.tag || 'issue');
      setCaaValue(data.value || valStr || '');
    } else {
      // Creating new record
      setName('');
      setType('A');
      setTtl(300);
      setIpAddress('');
      setIpv6Address('');
      setCnameTarget('');
      setTxtValue('');
      setMxPriority('10');
      setMxExchange('');
      setNsNameserver('');
      setPtrTarget('');
      setSrvPriority('10');
      setSrvWeight('60');
      setSrvPort('5060');
      setSrvTarget('');
      setCaaFlags('0');
      setCaaTag('issue');
      setCaaValue('');
    }
  }, [record, defaultName, open]);

  if (!open) return null;

  // Compute canonical domain preview for Zone Apex
  const computeCanonicalName = (): { display: string; isApex: boolean } => {
    const raw = name.trim();
    const zoneClean = defaultName.trim().toLowerCase().replace(/\.$/, '');
    if (!raw || raw === '@') {
      return { display: zoneClean || 'example.com', isApex: true };
    }
    const valClean = raw.toLowerCase().replace(/\.$/, '');
    if (valClean === zoneClean || valClean === `@.${zoneClean}`) {
      return { display: zoneClean, isApex: true };
    }
    if (valClean.endsWith('.' + zoneClean)) {
      return { display: valClean, isApex: false };
    }
    return { display: `${valClean}.${zoneClean}`, isApex: false };
  };

  const canonical = computeCanonicalName();

  // Validate form fields based on selected type
  const validateForm = (): { isValid: boolean; payloadValue: Record<string, any> | null; priority: number | null } => {
    const errors: Record<string, string> = {};

    // Validate Name
    if (name.trim() !== '' && name.trim() !== '@') {
      if (name.includes(' ') || name.startsWith('-') || name.endsWith('-')) {
        errors.name = 'Invalid DNS record name.';
      }
    }

    // Validate TTL
    if (!ttl || ttl < 1) {
      errors.ttl = 'TTL must be a positive number of seconds.';
    }

    let payloadValue: Record<string, any> | null = null;
    let priorityVal: number | null = null;

    if (type === 'A') {
      if (!ipAddress.trim()) {
        errors.ipAddress = 'IPv4 address is required.';
      } else {
        const addresses = ipAddress.split(',').map((s) => s.trim()).filter(Boolean);
        payloadValue = { addresses };
      }
    } else if (type === 'AAAA') {
      if (!ipv6Address.trim()) {
        errors.ipv6Address = 'IPv6 address is required.';
      } else {
        const addresses = ipv6Address.split(',').map((s) => s.trim()).filter(Boolean);
        payloadValue = { addresses };
      }
    } else if (type === 'CNAME') {
      if (!cnameTarget.trim()) {
        errors.cnameTarget = 'Target domain is required for CNAME records.';
      } else {
        payloadValue = { target: cnameTarget.trim() };
      }
    } else if (type === 'TXT') {
      if (!txtValue.trim()) {
        errors.txtValue = 'Text value is required for TXT records.';
      } else if (txtValue.length > 255) {
        errors.txtValue = 'TXT value must be 255 characters or fewer.';
      } else {
        payloadValue = { texts: [txtValue.trim()] };
      }
    } else if (type === 'MX') {
      const pri = Number(mxPriority);
      if (isNaN(pri) || pri < 0 || pri > 65535) {
        errors.mxPriority = 'Priority must be between 0 and 65535.';
      }
      if (!mxExchange.trim()) {
        errors.mxExchange = 'Mail server domain is required.';
      }
      if (!errors.mxPriority && !errors.mxExchange) {
        priorityVal = pri;
        payloadValue = { priority: pri, exchange: mxExchange.trim() };
      }
    } else if (type === 'NS') {
      if (!nsNameserver.trim()) {
        errors.nsNameserver = 'Nameserver domain is required.';
      } else {
        payloadValue = { nameservers: [nsNameserver.trim()] };
      }
    } else if (type === 'PTR') {
      if (!ptrTarget.trim()) {
        errors.ptrTarget = 'Pointer target domain is required.';
      } else {
        payloadValue = { target: ptrTarget.trim() };
      }
    } else if (type === 'SRV') {
      const pri = Number(srvPriority);
      const wt = Number(srvWeight);
      const pt = Number(srvPort);
      if (isNaN(pri) || pri < 0 || pri > 65535) errors.srvPriority = 'Priority must be 0-65535.';
      if (isNaN(wt) || wt < 0 || wt > 65535) errors.srvWeight = 'Weight must be 0-65535.';
      if (isNaN(pt) || pt < 1 || pt > 65535) errors.srvPort = 'Port must be 1-65535.';
      if (!srvTarget.trim()) errors.srvTarget = 'Target domain is required.';
      if (!errors.srvPriority && !errors.srvWeight && !errors.srvPort && !errors.srvTarget) {
        priorityVal = pri;
        payloadValue = { priority: pri, weight: wt, port: pt, target: srvTarget.trim() };
      }
    } else if (type === 'CAA') {
      const flg = Number(caaFlags);
      if (isNaN(flg) || flg < 0 || flg > 255) errors.caaFlags = 'Flags must be 0-255.';
      if (!caaValue.trim()) errors.caaValue = 'CAA value is required.';
      if (!errors.caaFlags && !errors.caaValue) {
        payloadValue = { flags: flg, tag: caaTag, value: caaValue.trim() };
      }
    }

    setFieldErrors(errors);
    return { isValid: Object.keys(errors).length === 0, payloadValue, priority: priorityVal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    const { isValid, payloadValue, priority } = validateForm();
    if (!isValid || !payloadValue) return;

    setIsSubmitting(true);
    try {
      const finalRecordName = name.trim() === '' ? '@' : name.trim();
      await onSave({
        name: finalRecordName,
        type,
        value: payloadValue,
        ttl: Number(ttl) || 300,
        priority,
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred while saving the record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit record' : 'Create record'}
      subtitle="Define routing details and TTL for this DNS record."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
            {isEdit ? 'Save changes' : 'Create record'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {apiError && (
          <Alert type="error" onDismiss={() => setApiError('')}>
            {apiError}
          </Alert>
        )}

        {/* Record Type Select */}
        <Select
          label="Record type"
          value={type}
          onChange={(e) => setType(e.target.value as RecordType)}
          options={RECORD_TYPES}
          helperText="Select the record type to automatically configure type-specific routing fields."
        />

        {/* Record Name with Zone Apex Explanation */}
        <div style={{ marginBottom: 16 }}>
          <Input
            label="Record name"
            placeholder="e.g. www or leave blank / @ for apex"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
            }}
            error={fieldErrors.name}
            helperText="Enter a subdomain prefix (e.g., 'www') or '@' / blank for the hosted zone root."
            autoFocus
          />

          <div
            style={{
              marginTop: -8,
              padding: '6px 10px',
              backgroundColor: 'var(--aws-bg-light)',
              borderRadius: 4,
              border: '1px solid var(--aws-border-subtle)',
              fontSize: 12,
              color: 'var(--aws-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Fully qualified name:</span>
            <code style={{ fontWeight: 600, color: 'var(--aws-text-dark)', fontSize: 12 }}>
              {canonical.display}
            </code>
            {canonical.isApex && (
              <span
                style={{
                  backgroundColor: 'var(--aws-blue-light)',
                  color: 'var(--aws-blue)',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 3,
                }}
              >
                Zone Apex
              </span>
            )}
          </div>
        </div>

        {/* Type-Specific Dynamic Fields */}

        {/* A Record */}
        {type === 'A' && (
          <Input
            label="IPv4 address"
            placeholder="e.g. 192.0.2.1"
            value={ipAddress}
            onChange={(e) => {
              setIpAddress(e.target.value);
              if (fieldErrors.ipAddress) setFieldErrors({ ...fieldErrors, ipAddress: '' });
            }}
            error={fieldErrors.ipAddress}
            helperText="Must be a valid IPv4 address (e.g., 192.0.2.1)."
            required
          />
        )}

        {/* AAAA Record */}
        {type === 'AAAA' && (
          <Input
            label="IPv6 address"
            placeholder="e.g. 2001:db8::1"
            value={ipv6Address}
            onChange={(e) => {
              setIpv6Address(e.target.value);
              if (fieldErrors.ipv6Address) setFieldErrors({ ...fieldErrors, ipv6Address: '' });
            }}
            error={fieldErrors.ipv6Address}
            helperText="Must be a valid IPv6 address (e.g., 2001:db8::1)."
            required
          />
        )}

        {/* CNAME Record */}
        {type === 'CNAME' && (
          <Input
            label="Target domain"
            placeholder="e.g. web.example.com"
            value={cnameTarget}
            onChange={(e) => {
              setCnameTarget(e.target.value);
              if (fieldErrors.cnameTarget) setFieldErrors({ ...fieldErrors, cnameTarget: '' });
            }}
            error={fieldErrors.cnameTarget}
            helperText="The canonical domain name to route traffic to."
            required
          />
        )}

        {/* TXT Record */}
        {type === 'TXT' && (
          <div className="aws-field">
            <label htmlFor="txt-value-input" className="aws-label">
              Text value <span className="aws-required">*</span>
            </label>
            <textarea
              id="txt-value-input"
              className={`aws-input ${fieldErrors.txtValue ? 'aws-input-error' : ''}`}
              rows={3}
              placeholder="e.g. v=spf1 include:_spf.google.com ~all"
              value={txtValue}
              onChange={(e) => {
                setTxtValue(e.target.value);
                if (fieldErrors.txtValue) setFieldErrors({ ...fieldErrors, txtValue: '' });
              }}
            />
            {fieldErrors.txtValue ? (
              <span className="aws-field-error-text">{fieldErrors.txtValue}</span>
            ) : (
              <span className="aws-field-helper-text">
                Text value up to 255 characters (e.g., SPF string or verification token).
              </span>
            )}
          </div>
        )}

        {/* MX Record */}
        {type === 'MX' && (
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <Input
              label="Priority"
              type="number"
              min={0}
              max={65535}
              placeholder="10"
              value={mxPriority}
              onChange={(e) => {
                setMxPriority(e.target.value);
                if (fieldErrors.mxPriority) setFieldErrors({ ...fieldErrors, mxPriority: '' });
              }}
              error={fieldErrors.mxPriority}
              required
            />
            <Input
              label="Mail server (Exchange)"
              placeholder="e.g. mail.example.com"
              value={mxExchange}
              onChange={(e) => {
                setMxExchange(e.target.value);
                if (fieldErrors.mxExchange) setFieldErrors({ ...fieldErrors, mxExchange: '' });
              }}
              error={fieldErrors.mxExchange}
              helperText="Fully qualified domain name of mail server."
              required
            />
          </div>
        )}

        {/* NS Record */}
        {type === 'NS' && (
          <Input
            label="Name server"
            placeholder="e.g. ns1.example.com"
            value={nsNameserver}
            onChange={(e) => {
              setNsNameserver(e.target.value);
              if (fieldErrors.nsNameserver) setFieldErrors({ ...fieldErrors, nsNameserver: '' });
            }}
            error={fieldErrors.nsNameserver}
            helperText="Enter the domain name of the authoritative name server."
            required
          />
        )}

        {/* PTR Record */}
        {type === 'PTR' && (
          <Input
            label="Pointer target"
            placeholder="e.g. host.example.com"
            value={ptrTarget}
            onChange={(e) => {
              setPtrTarget(e.target.value);
              if (fieldErrors.ptrTarget) setFieldErrors({ ...fieldErrors, ptrTarget: '' });
            }}
            error={fieldErrors.ptrTarget}
            helperText="The domain name that this IP address maps to."
            required
          />
        )}

        {/* SRV Record */}
        {type === 'SRV' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 10 }}>
            <Input
              label="Priority"
              type="number"
              min={0}
              placeholder="10"
              value={srvPriority}
              onChange={(e) => setSrvPriority(e.target.value)}
              error={fieldErrors.srvPriority}
              required
            />
            <Input
              label="Weight"
              type="number"
              min={0}
              placeholder="60"
              value={srvWeight}
              onChange={(e) => setSrvWeight(e.target.value)}
              error={fieldErrors.srvWeight}
              required
            />
            <Input
              label="Port"
              type="number"
              min={1}
              max={65535}
              placeholder="5060"
              value={srvPort}
              onChange={(e) => setSrvPort(e.target.value)}
              error={fieldErrors.srvPort}
              required
            />
            <Input
              label="Target"
              placeholder="bigbox.example.com"
              value={srvTarget}
              onChange={(e) => setSrvTarget(e.target.value)}
              error={fieldErrors.srvTarget}
              required
            />
          </div>
        )}

        {/* CAA Record */}
        {type === 'CAA' && (
          <div style={{ display: 'grid', gridTemplateColumns: '140px 140px 1fr', gap: 10 }}>
            <Select
              label="Flags"
              value={caaFlags}
              onChange={(e) => setCaaFlags(e.target.value)}
              options={[
                { value: '0', label: '0 (Non-critical)' },
                { value: '128', label: '128 (Critical)' },
              ]}
            />
            <Select
              label="Tag"
              value={caaTag}
              onChange={(e) => setCaaTag(e.target.value)}
              options={[
                { value: 'issue', label: 'issue — Certs' },
                { value: 'issuewild', label: 'issuewild — Wildcards' },
                { value: 'iodef', label: 'iodef — Violation URL' },
              ]}
            />
            <Input
              label="Value"
              placeholder="e.g. letsencrypt.org"
              value={caaValue}
              onChange={(e) => {
                setCaaValue(e.target.value);
                if (fieldErrors.caaValue) setFieldErrors({ ...fieldErrors, caaValue: '' });
              }}
              error={fieldErrors.caaValue}
              required
            />
          </div>
        )}

        {/* TTL Field with Preset Quick-Select */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="record-ttl" className="aws-label" style={{ marginBottom: 4 }}>
              TTL (seconds) <span className="aws-required">*</span>
            </label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {TTL_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setTtl(p.value)}
                  style={{
                    border: 'none',
                    background: ttl === p.value ? 'var(--aws-blue-light)' : 'transparent',
                    color: ttl === p.value ? 'var(--aws-blue)' : 'var(--aws-text-muted)',
                    fontSize: 11,
                    fontWeight: ttl === p.value ? 600 : 400,
                    padding: '2px 6px',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="record-ttl"
            type="number"
            min={1}
            value={ttl}
            onChange={(e) => {
              setTtl(Number(e.target.value));
              if (fieldErrors.ttl) setFieldErrors({ ...fieldErrors, ttl: '' });
            }}
            error={fieldErrors.ttl}
            helperText="Time To Live — length of time in seconds that DNS resolvers should cache this record."
          />
        </div>
      </form>
    </Modal>
  );
}
