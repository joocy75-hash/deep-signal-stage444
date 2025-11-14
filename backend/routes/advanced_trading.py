from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.advanced_binance_service import AdvancedBinanceService
from services.advanced_ai_trading import AdvancedAITrading, TradingBot
from auth import get_current_user
from models.user import ExchangeKey
import os

router = APIRouter(prefix="/api/advanced", tags=["advanced-trading"])

# 전역 트레이딩 봇 인스턴스
trading_bot = TradingBot()

@router.post("/binance/real-connect")
async def connect_real_binance(
    api_key: str,
    secret_key: str,
    testnet: bool = True,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """실제 바이낸스 연결"""
    try:
        # API 키 저장
        exchange_key = ExchangeKey(
            user_id=current_user.id,
            exchange_name="binance",
            api_key=api_key,
            secret_key=secret_key
        )
        db.add(exchange_key)
        db.commit()
        
        # 연결 테스트
        binance = AdvancedBinanceService(api_key, secret_key, testnet)
        account_info = binance.get_account_balance()
        
        return {
            "status": "success",
            "message": "바이낸스 실전 연결 성공",
            "testnet": testnet,
            "account": account_info
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"연결 실패: {str(e)}")

@router.get("/chart/{symbol}")
async def get_real_chart(
    symbol: str,
    interval: str = "1h",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """실제 차트 데이터"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance"
    ).first()
    
    if not exchange_key:
        return {"status": "error", "message": "바이낸스 연결이 필요합니다"}
    
    binance = AdvancedBinanceService(
        exchange_key.api_key,
        exchange_key.secret_key,
        testnet=True
    )
    
    return binance.get_real_time_chart_data(symbol, interval)

@router.get("/account/balance")
async def get_real_balance(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """실제 계좌 잔액"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance"
    ).first()
    
    if not exchange_key:
        return {"status": "error", "message": "바이낸스 연결이 필요합니다"}
    
    binance = AdvancedBinanceService(
        exchange_key.api_key,
        exchange_key.secret_key,
        testnet=True
    )
    
    return binance.get_account_balance()

@router.get("/positions")
async def get_real_positions(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """실제 포지션 조회"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance"
    ).first()
    
    if not exchange_key:
        return {"status": "error", "message": "바이낸스 연결이 필요합니다"}
    
    binance = AdvancedBinanceService(
        exchange_key.api_key,
        exchange_key.secret_key,
        testnet=True
    )
    
    return binance.get_positions()

@router.post("/ai/analyze-advanced")
async def advanced_ai_analysis(
    symbol: str = "BTCUSDT",
    strategy: str = "trend_following",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """고급 AI 분석"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance"
    ).first()
    
    if not exchange_key:
        return {"status": "error", "message": "바이낸스 연결이 필요합니다"}
    
    binance = AdvancedBinanceService(
        exchange_key.api_key,
        exchange_key.secret_key,
        testnet=True
    )
    
    # 차트 데이터 가져오기
    chart_data = binance.get_real_time_chart_data(symbol, "1h", 100)
    
    if chart_data["status"] != "success":
        return chart_data
    
    # AI 분석 실행
    ai_engine = AdvancedAITrading()
    analysis = ai_engine.analyze_with_strategy(chart_data["data"], strategy)
    
    return {
        "status": "success",
        "symbol": symbol,
        "strategy": strategy,
        "analysis": analysis
    }

@router.post("/trading/start")
async def start_auto_trading(
    symbol: str = "BTCUSDT",
    quantity: float = 0.001,
    strategy: str = "trend_following",
    current_user = Depends(get_current_user)
):
    """자동매매 시작"""
    trading_bot.set_strategy(strategy)
    result = trading_bot.start_auto_trading(symbol, quantity)
    
    return {
        "status": "success",
        "message": result["message"],
        "symbol": symbol,
        "strategy": strategy,
        "quantity": quantity,
        "is_running": True
    }

@router.post("/trading/stop")
async def stop_auto_trading(current_user = Depends(get_current_user)):
    """자동매매 중지"""
    result = trading_bot.stop_auto_trading()
    
    return {
        "status": "success",
        "message": result["message"],
        "is_running": False
    }

@router.get("/trading/status")
async def get_trading_status(current_user = Depends(get_current_user)):
    """트레이딩 상태 조회"""
    return {
        "status": "success",
        "is_running": trading_bot.is_running,
        "current_strategy": trading_bot.current_strategy
    }

@router.post("/execute/real-trade")
async def execute_real_trade(
    symbol: str = "BTCUSDT",
    side: str = "BUY",
    quantity: float = 0.001,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """실제 거래 실행"""
    exchange_key = db.query(ExchangeKey).filter(
        ExchangeKey.user_id == current_user.id,
        ExchangeKey.exchange_name == "binance"
    ).first()
    
    if not exchange_key:
        return {"status": "error", "message": "바이낸스 연결이 필요합니다"}
    
    binance = AdvancedBinanceService(
        exchange_key.api_key,
        exchange_key.secret_key,
        testnet=True
    )
    
    result = binance.create_order(symbol, side, quantity)
    
    return {
        "status": result["status"],
        "symbol": symbol,
        "side": side,
        "quantity": quantity,
        "order": result.get("order"),
        "message": result.get("message", "거래 실행 완료")
    }