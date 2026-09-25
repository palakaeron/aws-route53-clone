"""Server-side opaque session persistence."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session, joinedload

from ..models import UserSession


class SessionRepository:
    def create(self, db: Session, *, user_id: int, token: str, ttl_hours: int) -> UserSession:
        session = UserSession(
            user_id=user_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=ttl_hours),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_active_with_user(self, db: Session, token: str) -> UserSession | None:
        session = (
            db.query(UserSession)
            .options(joinedload(UserSession.user))
            .filter(UserSession.token == token, UserSession.expires_at > datetime.utcnow())
            .first()
        )
        if not session:
            db.query(UserSession).filter(UserSession.token == token, UserSession.expires_at <= datetime.utcnow()).delete()
            db.commit()
        return session

    def delete_by_token(self, db: Session, token: str) -> None:
        db.query(UserSession).filter(UserSession.token == token).delete()
        db.commit()
