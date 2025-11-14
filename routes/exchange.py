from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from models.user import ExchangeKey
from services.binance_service import BinanceService, MockBinanceService
from auth import get_current_user

router = APIRouter(prefix="/api/exchange", tags=["exchange"])

@router.post("/binance/connect")
async def connect_binance(
    api_key: str,
    secret_key: str,
    testnet: bool = True,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """바이낸스 API 키 연결"""
    try:
        # 모의 서비스로 테스트
        mock_service = MockBinanceService()
        account_info = mock_service.get_account_info()
        
        return {
            "status": "success",
            "message": "바이낸스 연결 성공 (모의 모드)",
            "testnet": True,
            "account": account_info
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"바이낸스 연결 실패: {str(e)}"
        }

@router.get("/binance/account")
async def get_binance_account(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """바이낸스 계정 정보 조회"""
    # 모의 데이터 반환
    mock_service = MockBinanceService()
    return mock_service.get_account_info()

@router.get("/binance/price/{symbol}")
async def get_binance_price(symbol: str = "BTCUSDT"):
    """바이낸스 가격 조회 (인증 불필요)"""
    try:
        # 모의 서비스로 테스트
        mock_service = MockBinanceService()
        return mock_service.get_ticker_price(symbol)
    except Exception as e:
        return {"status": "error", "message": str(e)}
