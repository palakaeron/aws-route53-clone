"""Pydantic schemas for the four mock CRUD features."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Traffic Policies
# ---------------------------------------------------------------------------

ROUTING_STRATEGIES = ['Simple', 'Weighted', 'Latency', 'Geolocation', 'Failover', 'Multi-value']


class TrafficPolicyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ''
    routing_strategy: str = 'Simple'
    status: str = 'Active'


class TrafficPolicyPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    routing_strategy: Optional[str] = None
    status: Optional[str] = None


class TrafficPolicyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    routing_strategy: str
    status: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Health Checks
# ---------------------------------------------------------------------------

HEALTH_STATUSES = ['Healthy', 'Unhealthy', 'Unknown']
PROTOCOLS = ['HTTP', 'HTTPS', 'TCP']


class HealthCheckCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    endpoint: str = Field(default='', max_length=512)
    protocol: str = 'HTTPS'
    port: int = Field(default=443, ge=1, le=65535)
    path: str = Field(default='/', max_length=512)
    status: str = 'Unknown'
    failure_threshold: int = Field(default=3, ge=1, le=10)


class HealthCheckPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    endpoint: Optional[str] = None
    protocol: Optional[str] = None
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    path: Optional[str] = None
    status: Optional[str] = None
    failure_threshold: Optional[int] = Field(default=None, ge=1, le=10)


class HealthCheckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    endpoint: str
    protocol: str
    port: int
    path: str
    status: str
    failure_threshold: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Resolver Endpoints
# ---------------------------------------------------------------------------

DIRECTIONS = ['Inbound', 'Outbound']


class ResolverEndpointCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    direction: str = 'Inbound'
    status: str = 'Operational'
    ip_addresses: str = ''
    description: str = ''


class ResolverEndpointPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    direction: Optional[str] = None
    status: Optional[str] = None
    ip_addresses: Optional[str] = None
    description: Optional[str] = None


class ResolverEndpointOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    direction: str
    status: str
    ip_addresses: str
    description: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

class ProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ''
    status: str = 'Active'
    associated_vpcs: str = ''


class ProfilePatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None
    associated_vpcs: Optional[str] = None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    status: str
    associated_vpcs: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Shared list response wrapper
# ---------------------------------------------------------------------------

from .schemas import PaginationMeta


class TrafficPolicyListResponse(BaseModel):
    data: list[TrafficPolicyOut]
    meta: PaginationMeta

class TrafficPolicyDataResponse(BaseModel):
    data: TrafficPolicyOut

class HealthCheckListResponse(BaseModel):
    data: list[HealthCheckOut]
    meta: PaginationMeta

class HealthCheckDataResponse(BaseModel):
    data: HealthCheckOut

class ResolverEndpointListResponse(BaseModel):
    data: list[ResolverEndpointOut]
    meta: PaginationMeta

class ResolverEndpointDataResponse(BaseModel):
    data: ResolverEndpointOut

class ProfileListResponse(BaseModel):
    data: list[ProfileOut]
    meta: PaginationMeta

class ProfileDataResponse(BaseModel):
    data: ProfileOut
