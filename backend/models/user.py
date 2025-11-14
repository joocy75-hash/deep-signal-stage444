from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ExchangeKey(Base):
    __tablename__ = "exchange_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    exchange_name = Column(String(50), nullable=False)  # binance, upbit 등
    api_key = Column(String(255), nullable=False)
    secret_key = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_testnet = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())