"""Hosted-zone business rules."""

from fastapi import HTTPException
import secrets
from sqlalchemy.orm import Session

from ..constants import ALLOWED_ZONE_TYPES
from ..models import HostedZone, User
from ..repositories.hosted_zone_repository import HostedZoneRepository
from ..schemas import ZoneCreate, ZoneOut, ZonePatch, ZoneUpdate
from ..validators.zone_validators import normalize_zone_name


class HostedZoneService:
    def __init__(self, zones: HostedZoneRepository | None = None) -> None:
        self.zones = zones or HostedZoneRepository()

    @staticmethod
    def serialize(zone: HostedZone) -> ZoneOut:
        return ZoneOut.model_validate(zone).model_copy(update={"record_count": len(zone.records)})

    def list(self, db: Session, user: User, search: str, page: int, page_size: int) -> tuple[list[ZoneOut], int]:
        zones, total = self.zones.list_page(db, user.id, search.strip().lower(), page, page_size)
        return [self.serialize(zone) for zone in zones], total

    def get(self, db: Session, user: User, zone_id: int) -> HostedZone:
        zone = self.zones.get(db, zone_id, user.id)
        if not zone:
            raise HTTPException(status_code=404, detail={"code": "HOSTED_ZONE_NOT_FOUND", "message": "Hosted zone not found."})
        return zone

    def get_by_identifier(self, db: Session, user: User, identifier: str) -> HostedZone:
        zone = self.zones.get_by_identifier(db, user.id, identifier)
        if not zone:
            raise HTTPException(status_code=404, detail={"code": "HOSTED_ZONE_NOT_FOUND", "message": "Hosted zone not found."})
        return zone

    def create(self, db: Session, user: User, payload: ZoneCreate) -> HostedZone:
        self._validate_type(payload.type)
        name = normalize_zone_name(payload.name)
        if self.zones.get_any_by_name(db, name):
            raise HTTPException(status_code=409, detail={"code": "HOSTED_ZONE_CONFLICT", "message": "Hosted zone already exists."})
        return self.zones.create(db, HostedZone(owner_id=user.id, zone_id=self._new_zone_id(db), name=name, type=payload.type, description=payload.description))

    def update(self, db: Session, user: User, zone_id: str, payload: ZoneUpdate) -> HostedZone:
        return self._apply_update(db, user, zone_id, payload.name, payload.type, payload.description)

    def patch(self, db: Session, user: User, zone_id: str, payload: ZonePatch) -> HostedZone:
        zone = self.get_by_identifier(db, user, zone_id)
        values = payload.model_dump(exclude_unset=True)
        return self._apply_update(db, user, zone_id, values.get("name", zone.name), values.get("type", zone.type), values.get("description", zone.description))

    def _apply_update(self, db: Session, user: User, zone_id: str, name_value: str, type_value: str, description: str) -> HostedZone:
        zone = self.get_by_identifier(db, user, zone_id)
        self._validate_type(type_value)
        name = normalize_zone_name(name_value)
        if self.zones.get_any_by_name(db, name, excluding_id=zone.id):
            raise HTTPException(status_code=409, detail={"code": "HOSTED_ZONE_CONFLICT", "message": "Hosted zone already exists."})
        zone.name = name
        zone.type = type_value
        zone.description = description
        db.commit()
        db.refresh(zone)
        return zone

    def delete(self, db: Session, user: User, zone_id: str) -> None:
        self.zones.delete(db, self.get_by_identifier(db, user, zone_id))

    @staticmethod
    def _validate_type(zone_type: str) -> None:
        if zone_type not in ALLOWED_ZONE_TYPES:
            raise HTTPException(status_code=400, detail={"code": "INVALID_HOSTED_ZONE_TYPE", "message": "Unsupported hosted zone type."})

    def _new_zone_id(self, db: Session) -> str:
        while True:
            zone_id = f"Z{secrets.token_hex(7).upper()[:13]}"
            if not self.zones.zone_id_exists(db, zone_id):
                return zone_id
