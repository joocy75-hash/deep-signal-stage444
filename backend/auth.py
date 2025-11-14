from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import sqlite3
import hashlib

router = APIRouter()
security = HTTPBearer()

# JWT 설정
SECRET_KEY = "deep-signal-secret-key"
ALGORITHM = "HS256"

class User(BaseModel):
    email: str
    password: str
    name: str
    tier: str = "basic"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(login_data: LoginRequest):
    # 로그인 로직 구현
    pass

@router.post("/register") 
async def register(user_data: User):
    # 회원가입 로직 구현
    pass

def get_current_user(credentials: HTTPBearer = Depends(security)):
    # 현재 사용자 조회 로직
    pass