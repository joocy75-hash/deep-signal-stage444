from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
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