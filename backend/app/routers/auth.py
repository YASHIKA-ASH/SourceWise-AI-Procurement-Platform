from fastapi import APIRouter, HTTPException

from app.schemas.auth import LoginRequest
from app.security import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login")
def login(data: LoginRequest):

    if data.username == "admin" and data.password == "admin123":

        token = create_access_token(
            {
                "username": "admin",
                "role": "admin"
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
    )