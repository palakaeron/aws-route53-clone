'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { HostedZone, PaginationMeta, ZonePayload } from '../types';
import { useToast } from './useToast';

interface UseHostedZonesOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

export function useHostedZones(options: UseHostedZonesOptions = {}) {
  const { search = '', page = 1, pageSize = 25, autoFetch = true } = options;

  const [zones, setZones] = useState<HostedZone[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    page_size: 25,
    total: 0,
    total_pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.zones.list({
        search,
        page,
        page_size: pageSize,
      });
      setZones(res.data);
      setMeta(res.meta);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch hosted zones';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    if (autoFetch) {
      void fetchZones();
    }
  }, [fetchZones, autoFetch]);

  const createZone = async (payload: ZonePayload): Promise<HostedZone> => {
    try {
      const newZone = await api.zones.create(payload);
      toast.success(`Hosted zone '${newZone.name}' created successfully.`);
      await fetchZones();
      return newZone;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create hosted zone';
      toast.error(msg);
      throw err;
    }
  };

  /**
   * Updates a hosted zone via PATCH.
   * Only the fields the form sends are forwarded; immutable fields (like
   * the public zone ID) are never included.
   */
  const updateZone = async (
    id: number | string,
    payload: ZonePayload
  ): Promise<HostedZone> => {
    try {
      const updated = await api.zones.patch(id, {
        name: payload.name,
        type: payload.type,
        description: payload.description,
      });
      toast.success(`Hosted zone '${updated.name}' updated successfully.`);
      await fetchZones();
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update hosted zone';
      toast.error(msg);
      throw err;
    }
  };

  const deleteZone = async (id: number | string, name?: string): Promise<void> => {
    try {
      await api.zones.delete(id);
      toast.success(name ? `Hosted zone '${name}' deleted.` : 'Hosted zone deleted.');
      await fetchZones();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete hosted zone';
      toast.error(msg);
      throw err;
    }
  };

  return {
    zones,
    meta,
    isLoading,
    error,
    refetch: fetchZones,
    createZone,
    updateZone,
    deleteZone,
  };
}
