from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import JSONResponse
import jwt
import os
from pydantic import BaseModel, Field, EmailStr

security = HTTPBearer()

class User(BaseModel):
    user_id: int = Field("", description="User's id")
    email: EmailStr = Field("", description="User's email")
    role: str = Field("", description="User's role")

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
):

    try:
        token = credentials.credentials
        if not token:
            raise HTTPException(status_code=401, detail="Authentication failed - no token")
        
        # Use the same JWT_SECRET as web app
        jwt_secret = os.getenv('JWT_SECRET', 'fpt-university-chatbot-secret-key-2024')
        
        # Verify token with secret (same as web app)
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        user_id = payload.get("id")
        email = payload.get("email")
        role = payload.get("role")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token - missing user ID")
        
        return User(user_id=user_id, email=email, role=role)
    
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Authentication failed - invalid token")