/**
 * Domain types and API response contracts matching the backend FastAPI models.
 */

export type ZoneType = 'Public' | 'Private';

export type RecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'TXT'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'SRV'
  | 'CAA';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface HostedZone {
  id: number;
  zone_id: string;
  name: string;
  type: ZoneType;
  description: string;
  created_at: string;
  updated_at: string;
  record_count: number;
}

export interface DNSRecord {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: RecordType;
  value: string;
  data: Record<string, any>;
  ttl: number;
  priority: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export interface ZonePayload {
  name: string;
  type: ZoneType;
  description: string;
}

export interface ZonePatchPayload {
  name?: string;
  type?: ZoneType;
  description?: string;
}

export interface RecordPayload {
  name: string;
  type: RecordType;
  value: string | Record<string, any>;
  ttl: number;
  priority: number | null;
}

export interface RecordPatchPayload {
  name?: string;
  type?: RecordType;
  value?: string | Record<string, any>;
  ttl?: number;
  priority?: number | null;
}

export interface ListQueryParams {
  search?: string;
  type?: string;
  page?: number;
  page_size?: number;
}
