from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = "sourcewise-secret-key"
ALGORITHM = "HS256"


def create_access_token(data: dict, expires_minutes: int = 60):

    payload = data.copy()

    payload["exp"] = datetime.utcnow() + timedelta(
        minutes=expires_minutes
    )

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(
    plain_password,
    hashed_password
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )