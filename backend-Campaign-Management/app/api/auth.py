from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.user import UserService
from app.repositories.user import UserRepository
from app.schemas.user import UserLogin
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register_user(user_create: UserCreate, db: Session = Depends(get_db)):
    user_repository = UserRepository(db)
    user_service = UserService(user_repository)
    return user_service.register_user(user_create)


@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user_repository = UserRepository(db)
    user_service = UserService(user_repository)

    return user_service.login_user(user_login.email, user_login.password)