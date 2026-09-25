/**
 * Centralized, typed REST API client for the Route 53 clone.
 * Enforces credentials: 'include' for HTTP-only SQLite sessions.
 */

import type {
  ApiErrorDetail,
  ApiListResponse,
  ApiResponse,
  DNSRecord,
  HostedZone,
  ListQueryParams,
  RecordPatchPayload,
  RecordPayload,
  User,
  ZonePatchPayload,
  ZonePayload,
} from './types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;
const unauthorizedListeners: Set<UnauthorizedHandler> = new Set();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedListeners.add(handler);
  return () => {
    unauthorizedListeners.delete(handler);
  };
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener());
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
      credentials: 'include',
    });

    if (response.status === 401) {
      if (endpoint !== '/auth/me' && endpoint !== '/auth/login') {
        notifyUnauthorized();
      }
      const body = await response.json().catch(() => ({}));
      const errorDetail: ApiErrorDetail = body.error || {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required. Please sign in.',
      };
      throw new ApiError(errorDetail.code, errorDetail.message, errorDetail.details);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const errorDetail: ApiErrorDetail = body.error || {
        code: 'REQUEST_FAILED',
        message: `HTTP request failed with status ${response.status}`,
      };
      throw new ApiError(errorDetail.code, errorDetail.message, errorDetail.details);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const json = await response.json();
    return json as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      'NETWORK_ERROR',
      err instanceof Error ? err.message : 'Network request failed. Please check backend status.'
    );
  }
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const res = await request<ApiResponse<User>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return res.data;
    },

    logout: async (): Promise<void> => {
      return request<void>('/auth/logout', { method: 'POST' });
    },

    me: async (): Promise<User> => {
      const res = await request<ApiResponse<User>>('/auth/me');
      return res.data;
    },
  },

  zones: {
    list: async (params: ListQueryParams = {}): Promise<ApiListResponse<HostedZone>> => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', String(params.page));
      if (params.page_size) query.set('page_size', String(params.page_size));

      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request<ApiListResponse<HostedZone>>(`/hosted-zones${queryString}`);
    },

    get: async (id: string | number): Promise<HostedZone> => {
      const res = await request<ApiResponse<HostedZone>>(`/hosted-zones/${id}`);
      return res.data;
    },

    create: async (payload: ZonePayload): Promise<HostedZone> => {
      const res = await request<ApiResponse<HostedZone>>('/hosted-zones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },

    update: async (id: string | number, payload: ZonePayload): Promise<HostedZone> => {
      const res = await request<ApiResponse<HostedZone>>(`/hosted-zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data;
    },

    patch: async (id: string | number, payload: ZonePatchPayload): Promise<HostedZone> => {
      const res = await request<ApiResponse<HostedZone>>(`/hosted-zones/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return res.data;
    },

    delete: async (id: string | number): Promise<void> => {
      return request<void>(`/hosted-zones/${id}`, { method: 'DELETE' });
    },
  },

  records: {
    list: async (
      zoneId: string | number,
      params: ListQueryParams = {}
    ): Promise<ApiListResponse<DNSRecord>> => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.type) query.set('type', params.type);
      if (params.page) query.set('page', String(params.page));
      if (params.page_size) query.set('page_size', String(params.page_size));

      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request<ApiListResponse<DNSRecord>>(`/hosted-zones/${zoneId}/records${queryString}`);
    },

    get: async (zoneId: string | number, recordId: number): Promise<DNSRecord> => {
      const res = await request<ApiResponse<DNSRecord>>(`/hosted-zones/${zoneId}/records/${recordId}`);
      return res.data;
    },

    create: async (zoneId: string | number, payload: RecordPayload): Promise<DNSRecord> => {
      const res = await request<ApiResponse<DNSRecord>>(`/hosted-zones/${zoneId}/records`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },

    update: async (
      zoneId: string | number,
      recordId: number,
      payload: RecordPayload
    ): Promise<DNSRecord> => {
      const res = await request<ApiResponse<DNSRecord>>(`/hosted-zones/${zoneId}/records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data;
    },

    patch: async (
      zoneId: string | number,
      recordId: number,
      payload: RecordPatchPayload
    ): Promise<DNSRecord> => {
      const res = await request<ApiResponse<DNSRecord>>(`/hosted-zones/${zoneId}/records/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return res.data;
    },

    delete: async (zoneId: string | number, recordId: number): Promise<void> => {
      return request<void>(`/hosted-zones/${zoneId}/records/${recordId}`, {
        method: 'DELETE',
      });
    },
  },
};
