from fastapi import FastAPI
from app.api import auth, users

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "API is running 🚀"}

app.include_router(auth.router)
app.include_router(users.router)