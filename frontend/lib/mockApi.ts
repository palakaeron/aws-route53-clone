/**
 * API client extensions for mock features:
 * Traffic Policies, Health Checks, Resolver, Profiles
 */
import { API_BASE_URL, ApiError } from './api';

export type RoutingStrategy = 'Simple' | 'Weighted' | 'Latency' | 'Geolocation' | 'Failover' | 'Multi-value';
export type HealthStatus = 'Healthy' | 'Unhealthy' | 'Unknown';
export type Direction = 'Inbound' | 'Outbound';

export interface TrafficPolicy {
  id: number;
  name: string;
  description: string;
  routing_strategy: RoutingStrategy;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface HealthCheck {
  id: number;
  name: string;
  endpoint: string;
  protocol: string;
  port: number;
  path: string;
  status: HealthStatus;
  failure_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ResolverEndpoint {
  id: number;
  name: string;
  direction: Direction;
  status: string;
  ip_addresses: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: number;
  name: string;
  description: string;
  status: string;
  associated_vpcs: string;
  created_at: string;
  updated_at: string;
}

interface ListMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

interface DataResponse<T> {
  data: T;
}

async function mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  try {
    const response = await fetch(url, { ...options, headers, cache: 'no-store', credentials: 'include' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const detail = body.error || { code: 'REQUEST_FAILED', message: `Request failed: ${response.status}` };
      throw new ApiError(detail.code, detail.message);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error');
  }
}

const qs = (p: Record<string, string | number | undefined>) =>
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

export const mockApi = {
  trafficPolicies: {
    list: (params: { search?: string; page?: number; page_size?: number } = {}) =>
      mockRequest<ListResponse<TrafficPolicy>>(`/traffic-policies?${qs(params)}`),
    get: (id: number) => mockRequest<DataResponse<TrafficPolicy>>(`/traffic-policies/${id}`),
    create: (body: Partial<TrafficPolicy>) =>
      mockRequest<DataResponse<TrafficPolicy>>('/traffic-policies', { method: 'POST', body: JSON.stringify(body) }),
    patch: (id: number, body: Partial<TrafficPolicy>) =>
      mockRequest<DataResponse<TrafficPolicy>>(`/traffic-policies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: number) => mockRequest<void>(`/traffic-policies/${id}`, { method: 'DELETE' }),
  },
  healthChecks: {
    list: (params: { search?: string; status?: string; page?: number; page_size?: number } = {}) =>
      mockRequest<ListResponse<HealthCheck>>(`/health-checks?${qs(params)}`),
    get: (id: number) => mockRequest<DataResponse<HealthCheck>>(`/health-checks/${id}`),
    create: (body: Partial<HealthCheck>) =>
      mockRequest<DataResponse<HealthCheck>>('/health-checks', { method: 'POST', body: JSON.stringify(body) }),
    patch: (id: number, body: Partial<HealthCheck>) =>
      mockRequest<DataResponse<HealthCheck>>(`/health-checks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: number) => mockRequest<void>(`/health-checks/${id}`, { method: 'DELETE' }),
  },
  resolver: {
    list: (params: { search?: string; page?: number; page_size?: number } = {}) =>
      mockRequest<ListResponse<ResolverEndpoint>>(`/resolver?${qs(params)}`),
    get: (id: number) => mockRequest<DataResponse<ResolverEndpoint>>(`/resolver/${id}`),
    create: (body: Partial<ResolverEndpoint>) =>
      mockRequest<DataResponse<ResolverEndpoint>>('/resolver', { method: 'POST', body: JSON.stringify(body) }),
    patch: (id: number, body: Partial<ResolverEndpoint>) =>
      mockRequest<DataResponse<ResolverEndpoint>>(`/resolver/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: number) => mockRequest<void>(`/resolver/${id}`, { method: 'DELETE' }),
  },
  profiles: {
    list: (params: { search?: string; page?: number; page_size?: number } = {}) =>
      mockRequest<ListResponse<Profile>>(`/profiles?${qs(params)}`),
    get: (id: number) => mockRequest<DataResponse<Profile>>(`/profiles/${id}`),
    create: (body: Partial<Profile>) =>
      mockRequest<DataResponse<Profile>>('/profiles', { method: 'POST', body: JSON.stringify(body) }),
    patch: (id: number, body: Partial<Profile>) =>
      mockRequest<DataResponse<Profile>>(`/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: number) => mockRequest<void>(`/profiles/${id}`, { method: 'DELETE' }),
  },
};
