import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.user import Base, User
from app.schemas.user import UserCreate

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

def override_get_db():
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_register_user():
    user_data = {"email": "test@example.com", "password": "password123"}
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == user_data["email"]
    assert "id" in response.json()

    # Test duplicate email
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST