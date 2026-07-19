from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

SECRET_KEY = "sourcewise-secret-key"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    
def require_admin(user=Depends(get_current_user)):

    if user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user