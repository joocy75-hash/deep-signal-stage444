from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.ai_trading import SimpleTradingStrategy
from auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai-trading"])

@router.post("/analyze/{symbol}")
async def analyze_with_ai(
    symbol: str = "BTCUSDT",
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI를 이용한 시장 분석"""
    try:
        # 기본 전략 사용
        strategy = SimpleTradingStrategy()
        
        # 모의 가격 데이터
        mock_prices = [35000, 35100, 34900, 35200, 35300, 35150, 35400, 35500, 35600, 35700]
        
        analysis = strategy.simple_moving_average_strategy(mock_prices)
        
        return {
            "status": "success",
            "symbol": symbol,
            "strategy": "SMA_이동평균",
            "analysis": analysis,
            "data_points": len(mock_prices)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/execute-trade")
async def execute_ai_trade(
    symbol: str = "BTCUSDT",
    quantity: float = 0.001,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """AI 분석 기반 거래 실행"""
    try:
        # 먼저 시장 분석
        analysis_result = await analyze_with_ai(symbol, current_user, db)
        
        if analysis_result["status"] != "success":
            return analysis_result
        
        analysis = analysis_result["analysis"]
        
        return {
            "status": "success",
            "action": analysis["action"],
            "symbol": symbol,
            "quantity": quantity,
            "analysis": analysis,
            "message": "테스트 모드 - 실제 거래는 실행되지 않습니다"
        }
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
