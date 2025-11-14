from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.real_binance_service import RealBinanceService
from services.auto_trading_bot import AutoTradingBot
from auth import get_current_user
from models.user import ExchangeKey

router = APIRouter(prefix="/api/auto", tags=["auto-trading"])

# 전역 트레이딩 봇 인스턴스
trading_bot = AutoTradingBot()

@router.post("/connect")
async def connect_binance(
    api_key: str,
    secret_key: str, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """바이낸스 실제 연결"""
    try:
        # API 키 저장
        exchange_key = ExchangeKey(
            user_id=current_user.id,
            exchange_name="binance",
            api_key=api_key,
            secret_key=secret_key,
            is_active=True
        )
        db.add(exchange_key)
        db.commit()
        
        # 연결 테스트
        binance = RealBinanceService(api_key, secret_key, testnet=True)
        account_info = binance.get_real_account_info()
        
        return {
            "status": "success",
            "message": "바이낸스 연결 성공",
            "account": account_info
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"연결 실패: {str(e)}")

@router.post("/start")
async def start_auto_trading(
    symbol: str = "BTCUSDT",
    quantity: float = 0.001,
    strategy: str = "trend_following",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """자동매매 시작"""
    # 사용자의 바이낸스 API 키 조회
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance",
        ExchangeKey.is_active == True
    ).first()
    
    if not exchange_key:
        return {"status": "error", "message": "바이낸스 연결이 필요합니다"}
    
    # 바이낸스 서비스 생성
    binance_service = RealBinanceService(
        exchange_key.api_key,
        exchange_key.secret_key,
        testnet=True
    )
    
    # 전략 설정
    trading_bot.set_strategy(strategy)
    
    # 자동매매 시작
    result = trading_bot.start_trading(binance_service, symbol, quantity)
    
    return {
        "status": result["status"],
        "message": result["message"],
        "symbol": symbol,
        "quantity": quantity,
        "strategy": strategy
    }

@router.post("/stop")
async def stop_auto_trading(current_user = Depends(get_current_user)):
    """자동매매 중지"""
    result = trading_bot.stop_trading()
    return result

@router.get("/status")
async def get_trading_status(current_user = Depends(get_current_user)):
    """트레이딩 상태 조회"""
    status = trading_bot.get_status()
    return {
        "status": "success",
        "bot_status": status
    }

@router.post("/strategy")
async def change_strategy(
    strategy: str,
    current_user = Depends(get_current_user)
):
    """트레이딩 전략 변경"""
    result = trading_bot.set_strategy(strategy)
    return result

@router.get("/strategies")
async def get_available_strategies():
    """사용 가능한 전략 목록"""
    strategies = {
        "trend_following": "트렌드 추종 - 이동평균 기반",
        "mean_reversion": "평균 회귀 - RSI 기반", 
        "breakout": "브레이크아웃 - 지지/저항선 돌파",
        "rsi_momentum": "RSI 모멘텀 - 모멘텀 기반"
    }
    return {"status": "success", "strategies": strategies}