"""Generic repository for the four mock CRUD features."""

from sqlalchemy.orm import Session


class MockRepository:
    def __init__(self, model_class):
        self.model_class = model_class

    def list_page(self, db: Session, owner_id: int, search: str, page: int, page_size: int):
        query = db.query(self.model_class).filter(self.model_class.owner_id == owner_id)
        if search:
            query = query.filter(self.model_class.name.ilike(f"%{search}%"))
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

    def delete(self, db: Session, item) -> None:
        db.delete(item)
        db.commit()
