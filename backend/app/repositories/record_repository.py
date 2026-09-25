"""DNS-record persistence queries.

All filtering, pagination, and ordering happens in SQL — no full in-memory loads.
"""

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..models import DNSRecord

# Hard cap on page size to prevent unbounded queries.
MAX_PAGE_SIZE = 300


class RecordRepository:
    def list_page(
        self,
        db: Session,
        zone_pk: int,
        *,
        search: str = "",
        record_type: str = "",
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[DNSRecord], int]:
        """Return one page of records for *zone_pk*, counted at the DB level."""
        page_size = min(page_size, MAX_PAGE_SIZE)
        query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_pk)

        if record_type:
            query = query.filter(DNSRecord.type == record_type.upper())

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    DNSRecord.name.ilike(pattern),
                    DNSRecord.type.ilike(pattern),
                    DNSRecord.value.ilike(pattern),
                )
            )

        total: int = query.count()
        records = (
            query.order_by(DNSRecord.name, DNSRecord.type)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return records, total

    def get(self, db: Session, record_id: int) -> DNSRecord | None:
        return db.get(DNSRecord, record_id)

    def get_in_zone(self, db: Session, zone_pk: int, record_id: int) -> DNSRecord | None:
        return db.query(DNSRecord).filter(
            DNSRecord.id == record_id,
            DNSRecord.hosted_zone_id == zone_pk,
        ).first()

    def get_duplicate(
        self,
        db: Session,
        zone_pk: int,
        name: str,
        record_type: str,
        excluding_id: int | None = None,
    ) -> DNSRecord | None:
        """Return an existing record with same (zone, name, type) or None."""
        query = db.query(DNSRecord).filter(
            DNSRecord.hosted_zone_id == zone_pk,
            DNSRecord.name == name,
            DNSRecord.type == record_type,
        )
        if excluding_id is not None:
            query = query.filter(DNSRecord.id != excluding_id)
        return query.first()

    def check_conflict(
        self,
        db: Session,
        zone_pk: int,
        name: str,
        record_type: str,
        excluding_id: int | None = None,
    ) -> bool:
        """Check for duplicate or CNAME conflict in zone."""
        if self.get_duplicate(db, zone_pk, name, record_type, excluding_id=excluding_id):
            return True
        if record_type == "CNAME":
            query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_pk, DNSRecord.name == name)
            if excluding_id is not None:
                query = query.filter(DNSRecord.id != excluding_id)
            if query.first():
                return True
        else:
            query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_pk, DNSRecord.name == name, DNSRecord.type == "CNAME")
            if excluding_id is not None:
                query = query.filter(DNSRecord.id != excluding_id)
            if query.first():
                return True
        return False

    def create(self, db: Session, record: DNSRecord) -> DNSRecord:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def delete(self, db: Session, record: DNSRecord) -> None:
        db.delete(record)
        db.commit()
