"""Hosted-zone persistence queries."""

from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models import HostedZone


class HostedZoneRepository:
    def list_page(self, db: Session, owner_id: int, search: str, page: int, page_size: int) -> tuple[list[HostedZone], int]:
        query = db.query(HostedZone).filter(HostedZone.owner_id == owner_id)
        if search:
            query = query.filter(HostedZone.name.ilike(f"%{search}%"))
        total = query.count()
        zones = query.order_by(HostedZone.created_at.desc(), HostedZone.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return zones, total

    def get(self, db: Session, zone_id: int, owner_id: int) -> HostedZone | None:
        return db.query(HostedZone).filter(HostedZone.id == zone_id, HostedZone.owner_id == owner_id).first()

    def get_by_identifier(self, db: Session, owner_id: int, identifier: str) -> HostedZone | None:
        filters = [HostedZone.zone_id == identifier]
        if identifier.isdigit():
            filters.append(HostedZone.id == int(identifier))
        return db.query(HostedZone).filter(HostedZone.owner_id == owner_id, or_(*filters)).first()

    def get_by_name(self, db: Session, owner_id: int, name: str, excluding_id: int | None = None) -> HostedZone | None:
        query = db.query(HostedZone).filter(HostedZone.owner_id == owner_id, HostedZone.name == name)
        if excluding_id is not None:
            query = query.filter(HostedZone.id != excluding_id)
        return query.first()

    def get_any_by_name(self, db: Session, name: str, excluding_id: int | None = None) -> HostedZone | None:
        query = db.query(HostedZone).filter(HostedZone.name == name)
        if excluding_id is not None:
            query = query.filter(HostedZone.id != excluding_id)
        return query.first()

    def create(self, db: Session, zone: HostedZone) -> HostedZone:
        db.add(zone)
        db.commit()
        db.refresh(zone)
        return zone

    def delete(self, db: Session, zone: HostedZone) -> None:
        db.delete(zone)
        db.commit()

    def zone_id_exists(self, db: Session, zone_id: str) -> bool:
        return db.query(HostedZone.id).filter(HostedZone.zone_id == zone_id).first() is not None
