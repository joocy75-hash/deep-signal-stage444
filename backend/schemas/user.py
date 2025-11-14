from pydantic import BaseModel  # EmailStr 제거
from typing import Optional
from datetime import datetime

# 사용자 생성 요청
class UserCreate(BaseModel):
    email: str  # EmailStr 대신 str 사용
    password: str
    full_name: Optional[str] = None

# 사용자 로그인 요청
class UserLogin(BaseModel):
    email: str  # EmailStr 대신 str 사용
    password: str

# 사용자 응답
class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# 토큰 응답
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# 거래소 키 생성 요청
class ExchangeKeyCreate(BaseModel):
    exchange_name: str
    api_key: str
    secret_key: str

# AI 전략 생성 요청
class AIStrategyCreate(BaseModel):
    strategy_name: str
    ai_provider: str
    prompt_text: str