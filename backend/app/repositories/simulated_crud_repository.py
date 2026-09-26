"""Generic CRUD repository for user-scoped simulated features."""

from sqlalchemy import or_
from sqlalchemy.orm import Session


class SimulatedCrudRepository:
    """Generic repository for simple user-scoped CRUD tables."""

    def __init__(self, model_class):
        self.model_class = model_class

    def list_page(
        self,
        db: Session,
        owner_id: int,
        search: str = "",
        page: int = 1,
        page_size: int = 25,
        filters: dict | None = None,
    ) -> tuple[list, int]:
        query = db.query(self.model_class).filter(self.model_class.owner_id == owner_id)
        if search:
            pattern = f"%{search}%"
            searchable_cols = [
                getattr(self.model_class, "name", None),
                getattr(self.model_class, "description", None),
            ]
            search_filters = [col.ilike(pattern) for col in searchable_cols if col is not None]
            if search_filters:
                query = query.filter(or_(*search_filters))
        if filters:
            for field, value in filters.items():
                if value and hasattr(self.model_class, field):
                    query = query.filter(getattr(self.model_class, field) == value)
        total = query.count()
        items = (
            query.order_by(self.model_class.created_at.desc(), self.model_class.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get(self, db: Session, item_id: int, owner_id: int):
        return (
            db.query(self.model_class)
            .filter(self.model_class.id == item_id, self.model_class.owner_id == owner_id)
            .first()
        )

    def create(self, db: Session, item):
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update(self, db: Session, item):
        db.commit()
        db.refresh(item)
        return item

    def delete(self, db: Session, item):
        db.delete(item)
        db.commit()
