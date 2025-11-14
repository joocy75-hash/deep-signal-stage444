from pydantic import BaseModel
from typing import Optional

# 임시로 EmailStr 대신 str 사용
class UserCreate(BaseModel):
    email: str  # EmailStr 대신 str 사용
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str  # EmailStr 대신 str 사용
    password: str

class UserResponse(BaseModel):
    id: int
    email: str  # EmailStr 대신 str 사용
    full_name: str
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ExchangeKeyCreate(BaseModel):
    exchange_name: str
    api_key: str
    secret_key: str
    is_testnet: bool = True

class ExchangeKeyResponse(BaseModel):
    id: int
    exchange_name: str
    is_active: bool
    is_testnet: bool
