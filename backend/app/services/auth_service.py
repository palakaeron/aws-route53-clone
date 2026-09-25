"""Authentication business rules backed by opaque SQLite sessions."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..repositories.user_repository import UserRepository
from ..repositories.session_repository import SessionRepository
from ..core.config import SESSION_TTL_HOURS
from ..core.security import generate_session_token, verify_password


class AuthService:
    def __init__(self, users: UserRepository | None = None, sessions: SessionRepository | None = None) -> None:
        self.users = users or UserRepository()
        self.sessions = sessions or SessionRepository()

    def login(self, db: Session, email: str, password: str):
        user = self.users.get_by_email(db, email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."})
        return user, self.sessions.create(db, user_id=user.id, token=generate_session_token(), ttl_hours=SESSION_TTL_HOURS)

    def logout(self, db: Session, token: str | None) -> None:
        if token:
            self.sessions.delete_by_token(db, token)
