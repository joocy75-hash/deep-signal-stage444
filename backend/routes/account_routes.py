from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.advanced_binance_service import AdvancedBinanceService
from auth import get_current_user
from models.user import ExchangeKey
from typing import List

router = APIRouter(prefix="/api/account", tags=["account"])

@router.get("/balance")
async def get_account_balance(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """계좌 잔액 상세 정보"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance",
        ExchangeKey.is_active == True
    ).first()
    
    if not exchange_key:
        return {
            "status": "error", 
            "message": "바이낸스 연결이 필요합니다",
            "balances": None,
            "asset_balances": []
        }
    
    try:
        binance = AdvancedBinanceService(
            exchange_key.api_key,
            exchange_key.secret_key,
            testnet=True
        )
        
        result = binance.get_account_balance()
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/positions")
async def get_account_positions(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """계좌 포지션 상세 정보"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance",
        ExchangeKey.is_active == True
    ).first()
    
    if not exchange_key:
        return {
            "status": "error",
            "message": "바이낸스 연결이 필요합니다",
            "positions": [],
            "total_positions": 0
        }
    
    try:
        binance = AdvancedBinanceService(
            exchange_key.api_key,
            exchange_key.secret_key,
            testnet=True
        )
        
        result = binance.get_positions()
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/performance")
async def get_account_performance(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """계좌 성과 지표"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance",
        ExchangeKey.is_active == True
    ).first()
    
    if not exchange_key:
        return {
            "status": "error",
            "message": "바이낸스 연결이 필요합니다",
            "performance": None
        }
    
    try:
        binance = AdvancedBinanceService(
            exchange_key.api_key,
            exchange_key.secret_key,
            testnet=True
        )
        
        result = binance.get_account_performance()
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/prices")
async def get_real_time_prices(
    symbols: str = "BTCUSDT,ETHUSDT,ADAUSDT",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """실시간 가격 조회"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance",
        ExchangeKey.is_active == True
    ).first()
    
    symbol_list = [s.strip() for s in symbols.split(",")]
    
    if not exchange_key:
        # API 키 없이도 기본 가격 정보 제공 (모의 데이터)
        mock_prices = {}
        for symbol in symbol_list:
            base_price = 35000 if "BTC" in symbol else 2000 if "ETH" in symbol else 1.5
            mock_prices[symbol] = {
                'symbol': symbol,
                'price': base_price + (base_price * 0.01 * (0.5 - (hash(symbol) % 100) / 100)),
                'timestamp': '모의 데이터'
            }
        return {"status": "success", "prices": mock_prices}
    
    try:
        binance = AdvancedBinanceService(
            exchange_key.api_key,
            exchange_key.secret_key,
            testnet=True
        )
        
        result = binance.get_real_time_prices(symbol_list)
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}