"""User persistence queries."""

from sqlalchemy.orm import Session

from ..models import User


class UserRepository:
    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    def get(self, db: Session, user_id: int) -> User | None:
        return db.get(User, user_id)
