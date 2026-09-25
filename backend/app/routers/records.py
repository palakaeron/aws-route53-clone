"""DNS record REST API for records belonging to a Hosted Zone."""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from ..core.config import API_PREFIX
from ..core.dependencies import get_current_user
from ..core.responses import data_response, list_response
from ..database import get_db
from ..models import User
from ..schemas import RecordCreate, RecordDataResponse, RecordListResponse, RecordPatch, RecordUpdate
from ..services.record_service import RecordService

router = APIRouter(prefix=API_PREFIX, tags=["DNS Records"])
service = RecordService()


@router.get("/hosted-zones/{zone_id}/records", response_model=RecordListResponse)
def list_records(
    zone_id: str,
    search: str = Query("", max_length=255),
    type: str = Query("", alias="type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=300),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records, total = service.list(
        db,
        current_user,
        zone_id,
        search=search,
        record_type=type,
        page=page,
        page_size=page_size,
    )
    serialized = [service.serialize(record).model_dump(mode="json") for record in records]
    return list_response(serialized, page=page, page_size=page_size, total=total)


@router.post("/hosted-zones/{zone_id}/records", status_code=201, response_model=RecordDataResponse)
def create_record(
    zone_id: str,
    payload: RecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = service.create(db, current_user, zone_id, payload)
    return data_response(service.serialize(record).model_dump(mode="json"))


@router.get("/hosted-zones/{zone_id}/records/{record_id}", response_model=RecordDataResponse)
def get_record(
    zone_id: str,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = service.get(db, current_user, zone_id, record_id)
    return data_response(service.serialize(record).model_dump(mode="json"))


@router.put("/hosted-zones/{zone_id}/records/{record_id}", response_model=RecordDataResponse)
def update_record(
    zone_id: str,
    record_id: int,
    payload: RecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = service.update(db, current_user, zone_id, record_id, payload)
    return data_response(service.serialize(record).model_dump(mode="json"))


@router.patch("/hosted-zones/{zone_id}/records/{record_id}", response_model=RecordDataResponse)
def patch_record(
    zone_id: str,
    record_id: int,
    payload: RecordPatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = service.patch(db, current_user, zone_id, record_id, payload)
    return data_response(service.serialize(record).model_dump(mode="json"))


@router.delete("/hosted-zones/{zone_id}/records/{record_id}", status_code=204)
def delete_record(
    zone_id: str,
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    service.delete(db, current_user, zone_id, record_id)
    return Response(status_code=204)
