"""DNS-record business rules."""

import json
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..constants import ALLOWED_RECORD_TYPES
from ..models import DNSRecord, User
from ..repositories.record_repository import RecordRepository
from ..schemas import RecordCreate, RecordOut, RecordPatch, RecordUpdate
from ..validators.record_validators import (
    decode_record_data,
    format_record_value,
    normalize_record_data,
    validate_record_name,
)
from .hosted_zone_service import HostedZoneService


class RecordService:
    def __init__(
        self,
        records: RecordRepository | None = None,
        zones: HostedZoneService | None = None,
    ) -> None:
        self.records = records or RecordRepository()
        self.zones = zones or HostedZoneService()

    def list(
        self,
        db: Session,
        user: User,
        zone_id: str | int,
        search: str = "",
        record_type: str = "",
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[DNSRecord], int]:
        zone = self.zones.get_by_identifier(db, user, str(zone_id))
        return self.records.list_page(
            db,
            zone.id,
            search=search,
            record_type=record_type,
            page=page,
            page_size=page_size,
        )

    def get(self, db: Session, user: User, zone_id: str | int, record_id: int) -> DNSRecord:
        zone = self.zones.get_by_identifier(db, user, str(zone_id))
        return self._get_in_zone(db, zone.id, record_id)

    @staticmethod
    def serialize(record: DNSRecord) -> RecordOut:
        data = decode_record_data(record.type, record.value)
        return RecordOut(
            id=record.id,
            hosted_zone_id=record.hosted_zone_id,
            name=record.name,
            type=record.type,
            value=format_record_value(record.type, data),
            data=data,
            ttl=record.ttl,
            priority=record.priority,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    def create(self, db: Session, user: User, zone_id: str | int, payload: RecordCreate) -> DNSRecord:
        zone = self.zones.get_by_identifier(db, user, str(zone_id))
        self._validate_type(payload.type)
        name = validate_record_name(payload.name, zone.name)
        data = normalize_record_data(payload.type, payload.value)
        if self.records.check_conflict(db, zone.id, name, payload.type):
            raise HTTPException(
                status_code=409,
                detail={"code": "RECORD_CONFLICT", "message": "A record with this name and type already exists in this hosted zone."},
            )
        return self.records.create(
            db,
            DNSRecord(
                hosted_zone_id=zone.id,
                name=name,
                type=payload.type,
                value=json.dumps(data, separators=(",", ":"), sort_keys=True),
                ttl=payload.ttl,
                priority=data.get("priority"),
            ),
        )

    def update(
        self,
        db: Session,
        user: User,
        zone_id: str | int,
        record_id: int,
        payload: RecordUpdate,
    ) -> DNSRecord:
        zone = self.zones.get_by_identifier(db, user, str(zone_id))
        record = self._get_in_zone(db, zone.id, record_id)
        self._validate_type(payload.type)
        name = validate_record_name(payload.name, zone.name)
        data = normalize_record_data(payload.type, payload.value)
        if self.records.check_conflict(db, zone.id, name, payload.type, excluding_id=record.id):
            raise HTTPException(
                status_code=409,
                detail={"code": "RECORD_CONFLICT", "message": "A record with this name and type already exists in this hosted zone."},
            )
        record.name = name
        record.type = payload.type
        record.value = json.dumps(data, separators=(",", ":"), sort_keys=True)
        record.ttl = payload.ttl
        record.priority = data.get("priority")
        db.commit()
        db.refresh(record)
        return record

    def patch(
        self,
        db: Session,
        user: User,
        zone_id: str | int,
        record_id: int,
        payload: RecordPatch,
    ) -> DNSRecord:
        zone = self.zones.get_by_identifier(db, user, str(zone_id))
        record = self._get_in_zone(db, zone.id, record_id)

        new_type = payload.type if payload.type is not None else record.type
        self._validate_type(new_type)

        new_name = validate_record_name(payload.name, zone.name) if payload.name is not None else record.name
        new_ttl = payload.ttl if payload.ttl is not None else record.ttl

        if payload.value is not None:
            raw_value = payload.value
        else:
            raw_value = decode_record_data(record.type, record.value)

        data = normalize_record_data(new_type, raw_value)
        new_priority = payload.priority if payload.priority is not None else data.get("priority")

        if self.records.check_conflict(db, zone.id, new_name, new_type, excluding_id=record.id):
            raise HTTPException(
                status_code=409,
                detail={"code": "RECORD_CONFLICT", "message": "A record with this name and type already exists in this hosted zone."},
            )

        record.name = new_name
        record.type = new_type
        record.value = json.dumps(data, separators=(",", ":"), sort_keys=True)
        record.ttl = new_ttl
        record.priority = new_priority
        db.commit()
        db.refresh(record)
        return record

    def delete(self, db: Session, user: User, zone_id: str | int, record_id: int) -> None:
        zone = self.zones.get_by_identifier(db, user, str(zone_id))
        record = self._get_in_zone(db, zone.id, record_id)
        self.records.delete(db, record)

    def _get_in_zone(self, db: Session, zone_pk: int, record_id: int) -> DNSRecord:
        record = self.records.get_in_zone(db, zone_pk, record_id)
        if not record:
            raise HTTPException(
                status_code=404,
                detail={"code": "RECORD_NOT_FOUND", "message": "Record not found."},
            )
        return record

    @staticmethod
    def _validate_type(record_type: str) -> None:
        if record_type not in ALLOWED_RECORD_TYPES:
            raise HTTPException(
                status_code=422,
                detail={"code": "INVALID_RECORD_TYPE", "message": "Unsupported record type."},
            )
