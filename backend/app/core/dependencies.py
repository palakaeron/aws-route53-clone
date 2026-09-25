"""Reusable FastAPI dependencies for protected API resources."""

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..repositories.session_repository import SessionRepository
from .config import SESSION_COOKIE_NAME


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    if not session_token:
        raise HTTPException(status_code=401, detail={"code": "AUTHENTICATION_REQUIRED", "message": "Authentication is required."})

    session = SessionRepository().get_active_with_user(db, session_token)
    if not session:
        raise HTTPException(status_code=401, detail={"code": "INVALID_SESSION", "message": "Your session has expired or is invalid."})
    return session.user
