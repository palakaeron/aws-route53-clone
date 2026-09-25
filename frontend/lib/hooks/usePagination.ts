'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  initialType?: string;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const [page, setPage] = useState(options.initialPage || 1);
  const [pageSize, setPageSize] = useState(options.initialPageSize || 10);
  const [search, setSearchInput] = useState(options.initialSearch || '');
  const [typeFilter, setTypeFilterState] = useState(options.initialType || '');

  const debouncedSearch = useDebounce(search, 300);

  const setSearch = useCallback((val: string) => {
    setSearchInput(val);
    setPage(1); // Reset to page 1 on new search
  }, []);

  const setTypeFilter = useCallback((val: string) => {
    setTypeFilterState(val);
    setPage(1); // Reset to page 1 on new type filter
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    search,
    debouncedSearch,
    typeFilter,
    setPage,
    setPageSize: handlePageSizeChange,
    setSearch,
    setTypeFilter,
  };
}
