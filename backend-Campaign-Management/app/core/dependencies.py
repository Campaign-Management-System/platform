from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user import UserRepository

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    logger = logging.getLogger("app.auth")
    token = credentials.credentials.strip() if credentials.credentials else ""
    # Swagger "Authorize" with HTTP Bearer expects the raw JWT only.
    # If someone pastes "bearer <token>" into the field, FastAPI will send "Bearer bearer <token>".
    # Normalize that common mistake to avoid confusing 401s.
    if token.lower().startswith("bearer "):
        token = token.split(" ", 1)[1].strip()
    token_preview = f"{token[:12]}...{token[-8:]}" if token else "<empty>"
    logger.info("Auth header received. scheme=%s token=%s", credentials.scheme, token_preview)

    payload = decode_access_token(token)
    email: Optional[str] = payload.get("sub")
    logger.info("JWT decoded. sub=%r keys=%s", email, sorted(payload.keys()))

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = UserRepository(db).get_user_by_email(email)
    logger.info("User lookup by email. email=%r found=%s", email, bool(user))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Optional extension point. If your `User` model later adds flags like `is_active`,
    enforce them here.
    """
    return current_user

