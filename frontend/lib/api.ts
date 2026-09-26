/**
 * Centralized, typed REST API client for the Route 53 clone.
 * Enforces credentials: 'include' for HTTP-only SQLite sessions.
 */

import type {
  ApiErrorDetail,
  ApiListResponse,
  ApiResponse,
  DNSRecord,
  HealthCheck,
  HostedZone,
  ListQueryParams,
  Profile,
  RecordPatchPayload,
  RecordPayload,
  ResolverEndpoint,
  TrafficPolicy,
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
      notifyUnauthorized();
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
      'Unable to connect to the Route 53 API.'
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

  trafficPolicies: {
    list: async (params: ListQueryParams = {}): Promise<TrafficPolicy[]> => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', String(params.page));
      if (params.page_size) query.set('page_size', String(params.page_size));
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const res = await request<ApiListResponse<TrafficPolicy>>(`/traffic-policies${suffix}`);
      return res.data;
    },
    create: async (payload: Partial<TrafficPolicy>): Promise<TrafficPolicy> => {
      const res = await request<ApiResponse<TrafficPolicy>>('/traffic-policies', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    update: async (id: number, payload: Partial<TrafficPolicy>): Promise<TrafficPolicy> => {
      const res = await request<ApiResponse<TrafficPolicy>>(`/traffic-policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      return request<void>(`/traffic-policies/${id}`, { method: 'DELETE' });
    },
  },

  healthChecks: {
    list: async (params: ListQueryParams = {}): Promise<HealthCheck[]> => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.status) query.set('status', params.status);
      if (params.page) query.set('page', String(params.page));
      if (params.page_size) query.set('page_size', String(params.page_size));
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const res = await request<ApiListResponse<HealthCheck>>(`/health-checks${suffix}`);
      return res.data;
    },
    create: async (payload: Partial<HealthCheck>): Promise<HealthCheck> => {
      const res = await request<ApiResponse<HealthCheck>>('/health-checks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    update: async (id: number, payload: Partial<HealthCheck>): Promise<HealthCheck> => {
      const res = await request<ApiResponse<HealthCheck>>(`/health-checks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      return request<void>(`/health-checks/${id}`, { method: 'DELETE' });
    },
  },

  resolverEndpoints: {
    list: async (params: ListQueryParams = {}): Promise<ResolverEndpoint[]> => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.direction) query.set('direction', params.direction);
      if (params.page) query.set('page', String(params.page));
      if (params.page_size) query.set('page_size', String(params.page_size));
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const res = await request<ApiListResponse<ResolverEndpoint>>(`/resolver-endpoints${suffix}`);
      return res.data;
    },
    create: async (payload: Partial<ResolverEndpoint>): Promise<ResolverEndpoint> => {
      const res = await request<ApiResponse<ResolverEndpoint>>('/resolver-endpoints', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    update: async (id: number, payload: Partial<ResolverEndpoint>): Promise<ResolverEndpoint> => {
      const res = await request<ApiResponse<ResolverEndpoint>>(`/resolver-endpoints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      return request<void>(`/resolver-endpoints/${id}`, { method: 'DELETE' });
    },
  },

  profiles: {
    list: async (params: ListQueryParams = {}): Promise<Profile[]> => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.status) query.set('status', params.status);
      if (params.page) query.set('page', String(params.page));
      if (params.page_size) query.set('page_size', String(params.page_size));
      const suffix = query.toString() ? `?${query.toString()}` : '';
      const res = await request<ApiListResponse<Profile>>(`/profiles${suffix}`);
      return res.data;
    },
    create: async (payload: Partial<Profile>): Promise<Profile> => {
      const res = await request<ApiResponse<Profile>>('/profiles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    update: async (id: number, payload: Partial<Profile>): Promise<Profile> => {
      const res = await request<ApiResponse<Profile>>(`/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      return request<void>(`/profiles/${id}`, { method: 'DELETE' });
    },
  },
};
