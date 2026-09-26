"""Pydantic schemas for simulated Route 53 features."""

import json
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------------------------------------------------------------------------
# Traffic Policies
# ---------------------------------------------------------------------------

class TrafficPolicyBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ''
    routing_strategy: str = 'Simple'
    status: str = 'Active'

class TrafficPolicyCreate(TrafficPolicyBase): pass

class TrafficPolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    routing_strategy: Optional[str] = None
    status: Optional[str] = None

class TrafficPolicyOut(TrafficPolicyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Health Checks
# ---------------------------------------------------------------------------

class HealthCheckBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    endpoint: str = Field(min_length=1, max_length=500)
    protocol: str = 'HTTPS'
    port: int = Field(default=443, ge=1, le=65535)
    path: str = '/'
    status: str = 'Unknown'
    failure_threshold: int = Field(default=3, ge=1, le=10)

class HealthCheckCreate(HealthCheckBase): pass

class HealthCheckUpdate(BaseModel):
    name: Optional[str] = None
    endpoint: Optional[str] = None
    protocol: Optional[str] = None
    port: Optional[int] = None
    path: Optional[str] = None
    status: Optional[str] = None
    failure_threshold: Optional[int] = None

class HealthCheckOut(HealthCheckBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Resolver Endpoints
# ---------------------------------------------------------------------------

class ResolverEndpointBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    direction: str = 'Inbound'
    status: str = 'Operational'
    ip_addresses: list[str] = []
    description: str = ''

class ResolverEndpointCreate(ResolverEndpointBase): pass

class ResolverEndpointUpdate(BaseModel):
    name: Optional[str] = None
    direction: Optional[str] = None
    status: Optional[str] = None
    ip_addresses: Optional[list[str]] = None
    description: Optional[str] = None

class ResolverEndpointOut(ResolverEndpointBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime

    @field_validator('ip_addresses', mode='before')
    @classmethod
    def parse_ip_addresses(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except Exception:
                return []
        return v if isinstance(v, list) else []


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

class ProfileBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = ''
    status: str = 'Active'
    associated_vpcs: list[str] = []

class ProfileCreate(ProfileBase): pass

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    associated_vpcs: Optional[list[str]] = None

class ProfileOut(ProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime

    @field_validator('associated_vpcs', mode='before')
    @classmethod
    def parse_associated_vpcs(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except Exception:
                return []
        return v if isinstance(v, list) else []
