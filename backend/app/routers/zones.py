"""Hosted Zone REST API.

All Hosted Zone persistence is handled through SQLAlchemy and SQLite.
"""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from ..core.config import API_PREFIX
from ..core.dependencies import get_current_user
from ..core.responses import data_response, list_response
from ..database import get_db
from ..models import User
from ..schemas import ZoneCreate, ZoneDataResponse, ZoneListResponse, ZonePatch, ZoneUpdate
from ..services.hosted_zone_service import HostedZoneService

router = APIRouter(prefix=f"{API_PREFIX}/hosted-zones", tags=["Hosted Zones"])
service = HostedZoneService()


@router.get("", response_model=ZoneListResponse)
def list_zones(
    search: str = Query("", max_length=255),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return hosted zones using the Phase 1 versioned API contract."""
    zones, total = service.list(db, current_user, search, page, page_size)
    return list_response([zone.model_dump(mode="json") for zone in zones], page=page, page_size=page_size, total=total)


@router.post("", status_code=201, response_model=ZoneDataResponse)
def create_zone(payload: ZoneCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return data_response(service.serialize(service.create(db, current_user, payload)).model_dump(mode="json"))


@router.get("/{zone_id}", response_model=ZoneDataResponse)
def get_zone(zone_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return data_response(service.serialize(service.get_by_identifier(db, current_user, zone_id)).model_dump(mode="json"))


@router.put("/{zone_id}", response_model=ZoneDataResponse)
def update_zone(zone_id: str, payload: ZoneUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return data_response(service.serialize(service.update(db, current_user, zone_id, payload)).model_dump(mode="json"))


@router.patch("/{zone_id}", response_model=ZoneDataResponse)
def patch_zone(zone_id: str, payload: ZonePatch, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return data_response(service.serialize(service.patch(db, current_user, zone_id, payload)).model_dump(mode="json"))


@router.delete("/{zone_id}", status_code=204)
def delete_zone(zone_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    service.delete(db, current_user, zone_id)
    return Response(status_code=204)
