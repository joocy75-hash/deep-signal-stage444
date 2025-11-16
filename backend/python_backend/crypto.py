from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

# 절대 임포트 사용
from database.database import get_db
from auth_service import get_current_user
from schemas.user import ExchangeKeyCreate, ExchangeKeyResponse, User
from services.binance_service import BinanceService, mask_api_key

...