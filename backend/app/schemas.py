from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str

# ---------------------------------------------------------------------------
# Hosted Zone schemas
# ---------------------------------------------------------------------------

class ZoneBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = 'Public'
    description: str = ''

class ZoneCreate(ZoneBase): pass
class ZoneUpdate(ZoneBase): pass

class ZonePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = None
    description: str | None = None

class ZoneOut(ZoneBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    zone_id: str
    created_at: datetime
    updated_at: datetime
    record_count: int = 0

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int

class ZoneDataResponse(BaseModel):
    data: ZoneOut

class ZoneListResponse(BaseModel):
    data: list[ZoneOut]
    meta: PaginationMeta

# ---------------------------------------------------------------------------
# DNS Record schemas
# ---------------------------------------------------------------------------

class RecordBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str
    value: str | dict[str, Any]
    ttl: int = Field(default=300, gt=0, le=2147483647)
    priority: Optional[int] = Field(default=None, ge=0)

class RecordCreate(RecordBase): pass

class RecordUpdate(RecordBase): pass

class RecordPatch(BaseModel):
    """PATCH — every field is optional; only supplied fields are changed."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[str] = None
    value: Optional[str | dict[str, Any]] = None
    ttl: Optional[int] = Field(default=None, gt=0, le=2147483647)
    priority: Optional[int] = Field(default=None, ge=0)

class RecordOut(BaseModel):
    """Canonical record representation returned by every record endpoint."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    hosted_zone_id: int
    name: str
    type: str
    # Human-readable summary (e.g. "192.0.2.1" for A records)
    value: str
    # Canonical JSON payload for type-specific consumers
    data: dict[str, Any]
    ttl: int
    priority: Optional[int]
    created_at: datetime
    updated_at: datetime

class RecordDataResponse(BaseModel):
    data: RecordOut

class RecordListResponse(BaseModel):
    data: list[RecordOut]
    meta: PaginationMeta
