from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserResponse
from app.core.security import pwd_context
from app.core.security import create_access_token, verify_password

class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def register_user(self, user_create: UserCreate) -> UserResponse:
        existing_user = self.user_repository.get_user_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        hashed_password = pwd_context.hash(user_create.password)
        user = User(name=user_create.name, email=user_create.email, hashed_password=hashed_password)
        created_user = self.user_repository.create_user(user)
        return UserResponse.model_validate(created_user)

    def login_user(self, email: str, password: str):
        user = self.user_repository.get_user_by_email(email)

        if not user:
            raise HTTPException(status_code=400, detail="Invalid credentials")

        if not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        token = create_access_token({"sub": user.email})

        return {"access_token": token, "token_type": "bearer"}