"""Dependencias de FastAPI."""
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings

security = HTTPBearer(auto_error=False)


async def get_db(request: Request):
    """Obtiene la conexión a la BD."""
    return request.app.state.db


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Valida JWT (admin endpoints)."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authentication")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
