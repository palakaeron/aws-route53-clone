'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { DNSRecord, PaginationMeta, RecordPayload, RecordPatchPayload } from '../types';
import { useToast } from './useToast';

interface UseRecordsOptions {
  zoneId: string | number;
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

export function useRecords(options: UseRecordsOptions) {
  const { zoneId, search = '', type = '', page = 1, pageSize = 50, autoFetch = true } = options;

  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    page_size: 50,
    total: 0,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  const fetchRecords = useCallback(async () => {
    if (!zoneId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.records.list(zoneId, {
        search,
        type,
        page,
        page_size: pageSize,
      });
      setRecords(res.data);
      setMeta(res.meta);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch DNS records';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, search, type, page, pageSize]);

  useEffect(() => {
    if (autoFetch && zoneId) {
      void fetchRecords();
    }
  }, [fetchRecords, autoFetch, zoneId]);

  const createRecord = async (payload: RecordPayload): Promise<DNSRecord> => {
    try {
      const newRecord = await api.records.create(zoneId, payload);
      toast.success(`DNS record '${newRecord.name}' (${newRecord.type}) created.`);
      await fetchRecords();
      return newRecord;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create DNS record';
      toast.error(msg);
      throw err;
    }
  };

  const updateRecord = async (
    recordId: number,
    payload: RecordPayload
  ): Promise<DNSRecord> => {
    try {
      const updated = await api.records.update(zoneId, recordId, payload);
      toast.success(`DNS record '${updated.name}' updated.`);
      await fetchRecords();
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update DNS record';
      toast.error(msg);
      throw err;
    }
  };

  const patchRecord = async (
    recordId: number,
    payload: RecordPatchPayload
  ): Promise<DNSRecord> => {
    try {
      const patched = await api.records.patch(zoneId, recordId, payload);
      toast.success(`DNS record '${patched.name}' updated.`);
      await fetchRecords();
      return patched;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to patch DNS record';
      toast.error(msg);
      throw err;
    }
  };

  const deleteRecord = async (recordId: number, name?: string): Promise<void> => {
    try {
      await api.records.delete(zoneId, recordId);
      toast.success(name ? `DNS record '${name}' deleted.` : 'DNS record deleted.');
      await fetchRecords();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete DNS record';
      toast.error(msg);
      throw err;
    }
  };

  return {
    records,
    meta,
    isLoading,
    error,
    refetch: fetchRecords,
    createRecord,
    updateRecord,
    patchRecord,
    deleteRecord,
  };
}
