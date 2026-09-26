"""Session-based authentication endpoints."""

from fastapi import APIRouter, Cookie, Depends, Response, status
from sqlalchemy.orm import Session

from ..core.config import API_PREFIX, SESSION_COOKIE_NAME, SESSION_COOKIE_SECURE, SESSION_TTL_HOURS
from ..core.dependencies import get_current_user
from ..core.responses import data_response
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, UserOut
from ..services.auth_service import AuthService

router = APIRouter(prefix=f"{API_PREFIX}/auth", tags=["Authentication"])
service = AuthService()


@router.post("/login", status_code=200)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Validate credentials and establish an opaque HTTP-only session cookie."""
    user, session = service.login(db, payload.email, payload.password)
    response.set_cookie(key=SESSION_COOKIE_NAME, value=session.token, httponly=True, secure=True, samesite="none", max_age=SESSION_TTL_HOURS * 60 * 60, path="/")
    return data_response(UserOut.model_validate(user).model_dump(mode="json"))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME), db: Session = Depends(get_db)) -> Response:
    service.logout(db, session_token)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/", secure=True, samesite="none")
    return response


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return data_response(UserOut.model_validate(current_user).model_dump(mode="json"))
