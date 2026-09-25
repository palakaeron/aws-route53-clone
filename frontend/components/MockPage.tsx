'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useToast } from '@/lib/hooks/useToast';
import { ApiError } from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
}

export interface ColumnDef<T> {
  key: keyof T | 'actions';
  label: string;
  render?: (item: T) => React.ReactNode;
}

export interface MockPageProps<T extends { id: number; name: string; status?: string; created_at?: string }> {
  title: string;
  description: string;
  resource: string; // singular label e.g. "traffic policy"
  breadcrumbs: { label: string; href?: string }[];
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  api: {
    list: (params: { search: string; page: number; page_size: number }) => Promise<{ data: T[]; meta: { total: number; page: number; page_size: number; total_pages: number } }>;
    create: (body: Record<string, unknown>) => Promise<{ data: T }>;
    patch: (id: number, body: Record<string, unknown>) => Promise<{ data: T }>;
    delete: (id: number) => Promise<void>;
  };
}

/* ─── Helper components ──────────────────────────────────────────────────── */

function Spinner() {
  return (
    <svg className="aws-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#d5dbdb" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#ec7211" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const classMap: Record<string, string> = {
    green: 'aws-badge-green',
    red: 'aws-badge-red',
    orange: 'aws-badge-orange',
    gray: 'aws-badge-gray',
    blue: 'aws-badge-blue',
  };
  return <span className={`aws-badge ${classMap[color] || 'aws-badge-gray'}`}>{text}</span>;
}

export function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'healthy' || s === 'operational') return <Badge text={status} color="green" />;
  if (s === 'unhealthy' || s === 'error' || s === 'failed') return <Badge text={status} color="red" />;
  if (s === 'unknown' || s === 'pending') return <Badge text={status} color="orange" />;
  if (s === 'inactive' || s === 'disabled') return <Badge text={status} color="gray" />;
  return <Badge text={status} color="blue" />;
}

/* ─── Form Modal ─────────────────────────────────────────────────────────── */

function FormModal<T extends { id: number; name: string }>({
  title,
  fields,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  fields: FieldDef[];
  initial?: Partial<T>;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    fields.forEach((f) => {
      defaults[f.key] = initial ? (initial as Record<string, unknown>)[f.key] ?? f.defaultValue ?? '' : f.defaultValue ?? '';
    });
    return defaults;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="aws-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aws-modal-content" style={{ maxWidth: 520 }}>
        <div className="aws-modal-header">
          <h2 className="aws-modal-title">{title}</h2>
          <button type="button" className="aws-modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="aws-modal-body">
            {error && (
              <div className="aws-alert aws-alert-error" style={{ marginBottom: 14 }}>
                <span>{error}</span>
              </div>
            )}
            {fields.map((f) => (
              <div className="aws-field" key={f.key}>
                <label className="aws-label" htmlFor={`field-${f.key}`}>
                  {f.label}{f.required && <span className="aws-required">*</span>}
                </label>
                {f.type === 'select' ? (
                  <select
                    id={`field-${f.key}`}
                    className="aws-select"
                    value={String(values[f.key] ?? '')}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required={f.required}
                  >
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    id={`field-${f.key}`}
                    className="aws-input"
                    rows={3}
                    value={String(values[f.key] ?? '')}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    id={`field-${f.key}`}
                    className="aws-input"
                    type={f.type || 'text'}
                    value={String(values[f.key] ?? '')}
                    onChange={(e) =>
                      setValues({ ...values, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })
                    }
                    required={f.required}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="aws-modal-footer">
            <button type="button" className="aws-btn aws-btn-secondary aws-btn-md" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="aws-btn aws-btn-primary aws-btn-md" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */

function ConfirmModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try { await onConfirm(); onClose(); }
    finally { setDeleting(false); }
  }

  return (
    <div className="aws-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aws-modal-content" style={{ maxWidth: 400 }}>
        <div className="aws-modal-header">
          <h2 className="aws-modal-title">Delete item</h2>
          <button type="button" className="aws-modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="aws-modal-body">
          <div className="aws-confirm-modal-body">
            <p className="aws-confirm-modal-message">Are you sure you want to delete <strong>{name}</strong>?</p>
            <div className="aws-confirm-modal-warning">
              ⚠ This action cannot be undone.
            </div>
          </div>
        </div>
        <div className="aws-modal-footer">
          <button type="button" className="aws-btn aws-btn-secondary aws-btn-md" onClick={onClose} disabled={deleting}>Cancel</button>
          <button type="button" className="aws-btn aws-btn-danger aws-btn-md" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main MockPage ──────────────────────────────────────────────────────── */

export function MockPage<T extends { id: number; name: string; status?: string }>({
  title,
  description,
  resource,
  breadcrumbs,
  columns,
  fields,
  api,
}: MockPageProps<T>) {
  const toast = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState({ page: 1, page_size: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [page, setPage] = useState(1);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, pg: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.list({ search: q, page: pg, page_size: 10 });
      setItems(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(search, page); }, [load, search, page]);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
    if (searchRef.current) clearTimeout(searchRef.current);
  }

  async function handleCreate(data: Record<string, unknown>) {
    await api.create(data);
    toast.success(`${resource} created successfully.`);
    await load(search, page);
  }

  async function handleEdit(data: Record<string, unknown>) {
    if (!editItem) return;
    await api.patch(editItem.id, data);
    toast.success(`${resource} updated successfully.`);
    setEditItem(null);
    await load(search, page);
  }

  async function handleDelete() {
    if (!deleteItem) return;
    await api.delete(deleteItem.id);
    toast.success(`${resource} deleted.`);
    setDeleteItem(null);
    await load(search, page);
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Shell breadcrumbs={breadcrumbs.map(b => ({ label: b.label, href: b.href || '#' }))}>
      {/* Mock banner */}
      <div className="mock-banner">
        <svg className="mock-banner-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span><strong>Mock Route 53 functionality</strong> — This section simulates AWS Route 53 behavior using local SQLite storage. No real AWS resources are created.</span>
      </div>

      {/* Page header */}
      <div className="aws-page-header">
        <div>
          <div className="aws-page-header-title-row">
            <h1 className="aws-page-header-title">{title}</h1>
          </div>
          <p className="aws-page-header-description">{description}</p>
        </div>
        <div className="aws-page-header-actions">
          <button type="button" className="aws-btn aws-btn-secondary aws-btn-md" onClick={() => load(search, page)}>
            Refresh
          </button>
          <button type="button" className="aws-btn aws-btn-primary aws-btn-md" onClick={() => setCreateOpen(true)}>
            Create {resource}
          </button>
        </div>
      </div>

      <div className="aws-table-card">
        {/* Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eaedd1', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="aws-search-bar">
            <svg className="aws-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="aws-search-input"
              placeholder={`Search by name…`}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="aws-search-clear" onClick={() => handleSearch('')}>✕</button>
            )}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#545b64' }}>
            {meta.total} item{meta.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Spinner /></div>
        ) : error ? (
          <div className="aws-error-state">
            <div className="aws-error-title">Failed to load</div>
            <div className="aws-error-desc">{error}</div>
            <button type="button" className="aws-btn aws-btn-secondary aws-btn-sm" onClick={() => load(search, page)}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="aws-empty-state">
            <div className="aws-empty-title">No {resource}s found</div>
            <div className="aws-empty-desc">{search ? 'Try a different search.' : `Create your first ${resource}.`}</div>
            {!search && (
              <button type="button" className="aws-btn aws-btn-primary aws-btn-sm" onClick={() => setCreateOpen(true)}>
                Create {resource}
              </button>
            )}
          </div>
        ) : (
          <div className="aws-table-scroll-container">
            <table className="aws-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={String(col.key)}>{col.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="aws-table-row">
                    {columns.map((col) => (
                      <td key={String(col.key)}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[String(col.key)] ?? '')}
                      </td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="aws-btn aws-btn-secondary aws-btn-sm"
                          onClick={() => setEditItem(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="aws-btn aws-btn-danger aws-btn-sm"
                          onClick={() => setDeleteItem(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="aws-pagination-bar">
            <span>Page {meta.page} of {meta.total_pages} ({meta.total} total)</span>
            <div className="aws-pagination-buttons">
              <button
                type="button"
                className="aws-btn aws-btn-secondary aws-btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="aws-btn aws-btn-secondary aws-btn-sm"
                onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))}
                disabled={page >= meta.total_pages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <FormModal
          title={`Create ${capitalize(resource)}`}
          fields={fields}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
      {editItem && (
        <FormModal<T>
          title={`Edit ${capitalize(resource)}`}
          fields={fields}
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSubmit={handleEdit}
        />
      )}
      {deleteItem && (
        <ConfirmModal
          name={deleteItem.name}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
        />
      )}
    </Shell>
  );
}
